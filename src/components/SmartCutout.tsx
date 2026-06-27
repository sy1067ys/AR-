import { useState, useRef, useCallback, useEffect } from 'react';
import { Eraser, Undo2, Check, Minus, Plus, Wand2, Paintbrush, Droplets, Sparkles, RefreshCw } from 'lucide-react';

interface SmartCutoutProps {
  imageSrc: string;
  onComplete: (cutoutDataUrl: string) => void;
  onCancel: () => void;
}

type Tool = 'wand' | 'global' | 'eraser' | 'restore';

// Perceptual color distance (weighted Euclidean in RGB, approximation of human perception)
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  // Weighted by human color perception
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
}

// Apply edge feathering to alpha channel
function featherEdges(imageData: ImageData, radius: number) {
  const { data, width, height } = imageData;
  if (radius <= 0) return;

  // Create alpha map
  const alpha = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) alpha[i] = data[i * 4 + 3] / 255;

  // Find edge pixels (transparent neighbors of opaque pixels)
  const result = new Float32Array(alpha);
  const r = Math.ceil(radius);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const a = alpha[idx];

      // Only process pixels near edges
      let isEdge = false;
      if (a > 0) {
        for (let dy = -1; dy <= 1 && !isEdge; dy++) {
          for (let dx = -1; dx <= 1 && !isEdge; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (alpha[ny * width + nx] === 0) isEdge = true;
            }
          }
        }
      }

      if (isEdge) {
        // Count transparent neighbors in radius
        let totalTransparent = 0, total = 0;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > radius) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              total++;
              if (alpha[ny * width + nx] === 0) totalTransparent++;
            }
          }
        }
        // Feather based on ratio of transparent neighbors
        const featherAmount = totalTransparent / Math.max(total, 1);
        result[idx] = a * (1 - featherAmount * 0.7);
      }
    }
  }

  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 3] = Math.round(result[i] * 255);
  }
}

export function SmartCutout({ imageSrc, onComplete, onCancel }: SmartCutoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const backupRef = useRef<ImageData | null>(null); // original untouched backup
  const [tolerance, setTolerance] = useState(30);
  const [feather, setFeather] = useState(2);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [tool, setTool] = useState<Tool>('wand');
  const [brushSize, setBrushSize] = useState(15);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [removedPx, setRemovedPx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = containerRef.current;
      const maxW = container ? container.clientWidth - 16 : 360;
      const maxH = container ? container.clientHeight - 16 : 400;
      const scale = Math.min(1, maxW / img.width, maxH / img.height);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
      backupRef.current = new ImageData(new Uint8ClampedArray(initial.data), initial.width, initial.height);
      setHistory([initial]);
      setLoaded(true);
      updatePreview();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const updatePreview = useCallback(() => {
    const canvas = canvasRef.current, preview = previewRef.current;
    if (!canvas || !preview) return;
    preview.width = canvas.width; preview.height = canvas.height;
    const pCtx = preview.getContext('2d')!;
    const sz = 8;
    for (let y = 0; y < preview.height; y += sz) {
      for (let x = 0; x < preview.width; x += sz) {
        pCtx.fillStyle = ((x / sz + y / sz) % 2 === 0) ? '#2a2d3a' : '#363a4a';
        pCtx.fillRect(x, y, sz, sz);
      }
    }
    pCtx.drawImage(canvas, 0, 0);
  }, []);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, []);

  // Flood fill (connected region) with perceptual color distance
  const floodFill = useCallback((startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data, w = canvas.width, h = canvas.height;
    saveState();

    const idx = (startY * w + startX) * 4;
    if (d[idx + 3] === 0) return;
    const tR = d[idx], tG = d[idx + 1], tB = d[idx + 2];
    const tol = tolerance;
    const visited = new Uint8Array(w * h);
    const stack = [startX, startY];
    let count = 0;

    while (stack.length > 0) {
      const cy = stack.pop()!, cx = stack.pop()!;
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
      const pos = cy * w + cx;
      if (visited[pos]) continue;
      visited[pos] = 1;
      const i = pos * 4;
      if (d[i + 3] === 0) continue;

      const dist = colorDistance(d[i], d[i + 1], d[i + 2], tR, tG, tB);
      if (dist <= tol) {
        // Soft edge: fade alpha based on distance near tolerance boundary
        const fade = dist > tol * 0.7 ? 1 - ((dist - tol * 0.7) / (tol * 0.3)) : 1;
        d[i + 3] = Math.round(d[i + 3] * (1 - fade));
        count++;
        stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
        // Diagonal for smoother edges
        stack.push(cx + 1, cy + 1, cx - 1, cy - 1, cx + 1, cy - 1, cx - 1, cy + 1);
      }
    }

    if (count > 0) {
      if (feather > 0) featherEdges(imgData, feather);
      ctx.putImageData(imgData, 0, 0);
      setRemovedPx(prev => prev + count);
      updatePreview();
    }
  }, [tolerance, feather, saveState, updatePreview]);

  // Global color removal: remove ALL pixels of similar color across entire image
  const globalColorRemove = useCallback((startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data, total = canvas.width * canvas.height;
    saveState();

    const idx = (startY * canvas.width + startX) * 4;
    if (d[idx + 3] === 0) return;
    const tR = d[idx], tG = d[idx + 1], tB = d[idx + 2];
    const tol = tolerance;
    let count = 0;

    for (let i = 0; i < total; i++) {
      const p = i * 4;
      if (d[p + 3] === 0) continue;
      const dist = colorDistance(d[p], d[p + 1], d[p + 2], tR, tG, tB);
      if (dist <= tol) {
        const fade = dist > tol * 0.6 ? 1 - ((dist - tol * 0.6) / (tol * 0.4)) : 1;
        d[p + 3] = Math.round(d[p + 3] * (1 - fade));
        count++;
      }
    }

    if (count > 0) {
      if (feather > 0) featherEdges(imgData, feather);
      ctx.putImageData(imgData, 0, 0);
      setRemovedPx(prev => prev + count);
      updatePreview();
    }
  }, [tolerance, feather, saveState, updatePreview]);

  // Smart auto background removal
  const autoRemove = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data, w = canvas.width, h = canvas.height;
    saveState();

    // Sample colors from edges (top/bottom rows, left/right columns)
    const edgeSamples: [number, number, number][] = [];
    const samplePoints: [number, number][] = [];

    // Sample every 4px along all 4 edges
    for (let x = 0; x < w; x += 4) { samplePoints.push([x, 0], [x, h - 1]); }
    for (let y = 0; y < h; y += 4) { samplePoints.push([0, y], [w - 1, y]); }
    // Also sample corners deeply (8px inward)
    const inset = 8;
    for (let dy = 0; dy < inset; dy += 2) {
      for (let dx = 0; dx < inset; dx += 2) {
        samplePoints.push([dx, dy], [w - 1 - dx, dy], [dx, h - 1 - dy], [w - 1 - dx, h - 1 - dy]);
      }
    }

    for (const [sx, sy] of samplePoints) {
      const i = (sy * w + sx) * 4;
      if (d[i + 3] > 0) edgeSamples.push([d[i], d[i + 1], d[i + 2]]);
    }

    if (edgeSamples.length === 0) return;

    // Find dominant background color via simple clustering
    // Sort by brightness and take the mode cluster
    const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
    for (const [r, g, b] of edgeSamples) {
      // Quantize to reduce variance
      const qr = Math.round(r / 8) * 8, qg = Math.round(g / 8) * 8, qb = Math.round(b / 8) * 8;
      const key = `${qr},${qg},${qb}`;
      const existing = colorMap.get(key);
      if (existing) {
        existing.r = (existing.r * existing.count + r) / (existing.count + 1);
        existing.g = (existing.g * existing.count + g) / (existing.count + 1);
        existing.b = (existing.b * existing.count + b) / (existing.count + 1);
        existing.count++;
      } else {
        colorMap.set(key, { r, g, b, count: 1 });
      }
    }

    // Get top clusters
    const clusters = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
    const bgColors = clusters.slice(0, 3); // Up to 3 dominant bg colors

    // Create distance map: for each pixel, min distance to any bg color
    const total = w * h;
    // Also compute center weight: pixels closer to center are more likely foreground
    const centerX = w / 2, centerY = h / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    const autoTol = tolerance * 1.2; // slightly more aggressive for auto
    let count = 0;

    for (let i = 0; i < total; i++) {
      const p = i * 4;
      if (d[p + 3] === 0) continue;

      const px = i % w, py = Math.floor(i / w);
      const r = d[p], g = d[p + 1], b = d[p + 2];

      // Min distance to any background color
      let minDist = Infinity;
      for (const bg of bgColors) {
        const dist = colorDistance(r, g, b, bg.r, bg.g, bg.b);
        if (dist < minDist) minDist = dist;
      }

      // Center weight: pixels far from center are more likely background
      const centerDist = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2) / maxDist;
      const edgeBoost = centerDist * autoTol * 0.3; // boost tolerance at edges

      const effectiveTol = autoTol + edgeBoost;

      if (minDist <= effectiveTol) {
        const fade = minDist > effectiveTol * 0.5
          ? 1 - ((minDist - effectiveTol * 0.5) / (effectiveTol * 0.5))
          : 1;
        d[p + 3] = Math.round(d[p + 3] * (1 - fade));
        count++;
      }
    }

    if (count > 0) {
      // Apply stronger feathering for auto mode
      featherEdges(imgData, Math.max(feather, 3));
      ctx.putImageData(imgData, 0, 0);
      setRemovedPx(prev => prev + count);
      updatePreview();
    }
  }, [tolerance, feather, saveState, updatePreview]);

  // Eraser / Restore brush
  const brushAt = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    if (tool === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (tool === 'restore' && backupRef.current) {
      // Restore original pixels in brush area
      const backup = backupRef.current;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data, bd = backup.data, w = canvas.width, h = canvas.height;
      const r = Math.ceil(brushSize / 2);
      const r2 = r * r;

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r2) continue;
          const px = Math.round(x + dx), py = Math.round(y + dy);
          if (px < 0 || px >= w || py < 0 || py >= h) continue;
          const i = (py * w + px) * 4;
          d[i] = bd[i]; d[i + 1] = bd[i + 1]; d[i + 2] = bd[i + 2]; d[i + 3] = bd[i + 3];
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
    updatePreview();
  }, [tool, brushSize, updatePreview]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = previewRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = 'touches' in e ? (e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX) : e.clientX;
    const cy = 'touches' in e ? (e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY) : e.clientY;
    return {
      x: Math.round((cx - rect.left) * (canvas.width / rect.width)),
      y: Math.round((cy - rect.top) * (canvas.height / rect.height)),
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasPos(e);
    if (tool === 'wand') floodFill(x, y);
    else if (tool === 'global') globalColorRemove(x, y);
    else {
      saveState();
      setIsDrawing(true);
      brushAt(x, y);
    }
  };
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCanvasPos(e);
    brushAt(x, y);
  };
  const handlePointerUp = () => setIsDrawing(false);

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const newH = [...history]; newH.pop();
    ctx.putImageData(newH[newH.length - 1], 0, 0);
    setHistory(newH);
    updatePreview();
  };

  const handleComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Final feather pass
    if (feather > 0) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      featherEdges(imgData, feather);
      ctx.putImageData(imgData, 0, 0);
    }

    // Auto crop
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (data[(y * canvas.width + x) * 4 + 3] > 10) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxX <= minX || maxY <= minY) { onComplete(canvas.toDataURL('image/png')); return; }

    const pad = 6;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(canvas.width - 1, maxX + pad); maxY = Math.min(canvas.height - 1, maxY + pad);
    const cw = maxX - minX + 1, ch = maxY - minY + 1;
    const crop = document.createElement('canvas');
    crop.width = cw; crop.height = ch;
    crop.getContext('2d')!.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
    onComplete(crop.toDataURL('image/png'));
  };

  const tools: { key: Tool; icon: any; label: string; desc: string }[] = [
    { key: 'wand', icon: Wand2, label: '範囲除去', desc: '連続する同色を除去' },
    { key: 'global', icon: Droplets, label: '色除去', desc: '同色を全体から除去' },
    { key: 'eraser', icon: Eraser, label: '消しゴム', desc: 'ブラシで直接消去' },
    { key: 'restore', icon: Paintbrush, label: '復元', desc: '消した部分を復元' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex-shrink-0 p-2 space-y-2" style={{ background: 'var(--ar-surface)', borderBottom: '1px solid var(--ar-border)' }}>
        {/* Tool buttons */}
        <div className="flex gap-1">
          {tools.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTool(key)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all"
              style={{
                background: tool === key ? 'var(--ar-accent)' : 'var(--ar-surface-2)',
                color: tool === key ? '#fff' : 'var(--ar-text-muted)',
                boxShadow: tool === key ? '0 2px 8px var(--ar-accent-glow)' : 'none',
              }}>
              <Icon className="w-3 h-3" />{label}
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          {(tool === 'wand' || tool === 'global') && (
            <div className="flex items-center gap-1">
              <span className="text-[9px]" style={{ color: 'var(--ar-text-muted)' }}>精度</span>
              <input type="range" min="5" max="100" value={tolerance} onChange={(e) => setTolerance(+e.target.value)} className="w-14 h-1 accent-purple-500" />
              <span className="text-[9px] w-5 text-right" style={{ color: 'var(--ar-text-2)' }}>{tolerance}</span>
            </div>
          )}

          {(tool === 'eraser' || tool === 'restore') && (
            <div className="flex items-center gap-1">
              <button onClick={() => setBrushSize(Math.max(3, brushSize - 4))} className="p-0.5 rounded" style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-muted)' }}><Minus className="w-3 h-3" /></button>
              <span className="text-[9px] w-5 text-center" style={{ color: 'var(--ar-text-2)' }}>{brushSize}</span>
              <button onClick={() => setBrushSize(Math.min(80, brushSize + 4))} className="p-0.5 rounded" style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-muted)' }}><Plus className="w-3 h-3" /></button>
            </div>
          )}

          <div className="flex items-center gap-1">
            <span className="text-[9px]" style={{ color: 'var(--ar-text-muted)' }}>羽化</span>
            <input type="range" min="0" max="8" value={feather} onChange={(e) => setFeather(+e.target.value)} className="w-12 h-1 accent-purple-500" />
            <span className="text-[9px] w-3" style={{ color: 'var(--ar-text-2)' }}>{feather}</span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button onClick={autoRemove} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium" style={{ background: 'linear-gradient(135deg, var(--ar-accent-glow), var(--ar-accent-2-glow))', color: 'var(--ar-accent)' }}>
              <Sparkles className="w-3 h-3" />自動検出
            </button>
            <button onClick={undo} disabled={history.length <= 1} className="p-1 rounded disabled:opacity-30" style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)' }}>
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tool description */}
        <p className="text-[9px]" style={{ color: 'var(--ar-text-muted)' }}>
          {tools.find(t => t.key === tool)?.desc}
          {tool === 'global' && ' — 画像全体から指定した色を一括除去'}
          {tool === 'restore' && ' — 消しすぎた部分を元に戻す'}
        </p>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center p-2" style={{ background: 'var(--ar-bg)' }}>
        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={previewRef}
          className="max-w-full max-h-full object-contain rounded-xl touch-none"
          style={{ cursor: (tool === 'wand' || tool === 'global') ? 'crosshair' : 'none', border: '1px solid var(--ar-border)' }}
          onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
        />

        {loaded && removedPx === 0 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[10px] flex items-center gap-1.5" style={{ background: 'var(--ar-glass)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-glass-border)', backdropFilter: 'blur(8px)' }}>
            <Sparkles className="w-3 h-3" style={{ color: 'var(--ar-accent)' }} />
            「自動検出」で背景を除去、またはタップで指定
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center gap-2 p-3 flex-shrink-0" style={{ background: 'var(--ar-surface)', borderTop: '1px solid var(--ar-border)' }}>
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}>キャンセル</button>
        <button onClick={handleComplete} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5" style={{ background: 'var(--ar-accent)', boxShadow: '0 2px 12px var(--ar-accent-glow)' }}>
          <Check className="w-4 h-4" />切り抜き完了
        </button>
      </div>
    </div>
  );
}
