import { useState, useRef, useCallback, useEffect } from 'react';
import { Eraser, Undo2, Check, Minus, Plus, Wand2, Move } from 'lucide-react';

interface SmartCutoutProps {
  imageSrc: string;
  onComplete: (cutoutDataUrl: string) => void;
  onCancel: () => void;
}

/**
 * SmartCutout: tap-to-remove-background editor
 * - User taps on a color region → flood-fill removes that color
 * - Tolerance slider controls how aggressively similar colors are removed
 * - Undo stack for mistakes
 * - Preview on checkered transparency grid
 */
export function SmartCutout({ imageSrc, onComplete, onCancel }: SmartCutoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [tolerance, setTolerance] = useState(32);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [mode, setMode] = useState<'wand' | 'eraser'>('wand');
  const [eraserSize, setEraserSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [removedCount, setRemovedCount] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image onto canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Scale to fit container while maintaining aspect ratio
      const container = containerRef.current;
      const maxW = container ? container.clientWidth - 16 : 360;
      const maxH = container ? container.clientHeight - 16 : 400;
      const scale = Math.min(1, maxW / img.width, maxH / img.height);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Save initial state
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
      setLoaded(true);
      updatePreview();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const updatePreview = useCallback(() => {
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    if (!canvas || !preview) return;
    preview.width = canvas.width;
    preview.height = canvas.height;
    const pCtx = preview.getContext('2d')!;
    // Draw checkerboard
    const size = 8;
    for (let y = 0; y < preview.height; y += size) {
      for (let x = 0; x < preview.width; x += size) {
        pCtx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#2a2d3a' : '#363a4a';
        pCtx.fillRect(x, y, size, size);
      }
    }
    pCtx.drawImage(canvas, 0, 0);
  }, []);

  // Flood fill to remove background
  const floodFillRemove = useCallback((startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width, h = canvas.height;

    // Save current state for undo
    const prevData = ctx.getImageData(0, 0, w, h);

    const idx = (startY * w + startX) * 4;
    // If already transparent, skip
    if (data[idx + 3] === 0) return;

    const targetR = data[idx], targetG = data[idx + 1], targetB = data[idx + 2];
    const tol = tolerance;

    const visited = new Uint8Array(w * h);
    const stack: number[] = [startX, startY];
    let count = 0;

    while (stack.length > 0) {
      const cy = stack.pop()!;
      const cx = stack.pop()!;
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
      const pos = cy * w + cx;
      if (visited[pos]) continue;
      visited[pos] = 1;

      const i = pos * 4;
      if (data[i + 3] === 0) continue; // already transparent

      const dr = data[i] - targetR;
      const dg = data[i + 1] - targetG;
      const db = data[i + 2] - targetB;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist <= tol) {
        data[i + 3] = 0; // Set alpha to 0
        count++;
        stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
      }
    }

    if (count > 0) {
      ctx.putImageData(imageData, 0, 0);
      setHistory(prev => [...prev, prevData]);
      setRemovedCount(prev => prev + count);
      updatePreview();
    }
  }, [tolerance, updatePreview]);

  // Eraser brush
  const eraseAt = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    updatePreview();
  }, [eraserSize, updatePreview]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasPos(e);
    if (mode === 'wand') {
      floodFillRemove(x, y);
    } else {
      // Save state for undo before erasing
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d')!;
        setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
      }
      setIsDrawing(true);
      eraseAt(x, y);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== 'eraser') return;
    e.preventDefault();
    const { x, y } = getCanvasPos(e);
    eraseAt(x, y);
  };

  const handlePointerUp = () => setIsDrawing(false);

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const newHistory = [...history];
    newHistory.pop();
    const prev = newHistory[newHistory.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory(newHistory);
    updatePreview();
  };

  const handleComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Auto-crop to content bounds
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data: px } = data;
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (px[(y * canvas.width + x) * 4 + 3] > 0) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX <= minX || maxY <= minY) {
      // Nothing visible
      onComplete(canvas.toDataURL('image/png'));
      return;
    }

    // Add small padding
    const pad = 4;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(canvas.width - 1, maxX + pad); maxY = Math.min(canvas.height - 1, maxY + pad);

    const cropW = maxX - minX + 1, cropH = maxY - minY + 1;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW; cropCanvas.height = cropH;
    const cCtx = cropCanvas.getContext('2d')!;
    cCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    onComplete(cropCanvas.toDataURL('image/png'));
  };

  // Auto-remove on first load: try removing corners
  const autoRemoveBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width, h = canvas.height;
    // Try flood fill from 4 corners and edge midpoints
    const points = [
      [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
      [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1],
      [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)],
    ];
    for (const [x, y] of points) {
      floodFillRemove(x, y);
    }
  }, [floodFillRemove]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center gap-1 p-2 flex-shrink-0 flex-wrap"
        style={{ background: 'var(--ar-surface)', borderBottom: '1px solid var(--ar-border)' }}
      >
        {/* Mode toggle */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--ar-border)' }}>
          <button
            onClick={() => setMode('wand')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all"
            style={{
              background: mode === 'wand' ? 'var(--ar-accent)' : 'var(--ar-surface-2)',
              color: mode === 'wand' ? '#fff' : 'var(--ar-text-muted)',
            }}
          >
            <Wand2 className="w-3.5 h-3.5" />
            自動除去
          </button>
          <button
            onClick={() => setMode('eraser')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all"
            style={{
              background: mode === 'eraser' ? 'var(--ar-accent)' : 'var(--ar-surface-2)',
              color: mode === 'eraser' ? '#fff' : 'var(--ar-text-muted)',
            }}
          >
            <Eraser className="w-3.5 h-3.5" />
            消しゴム
          </button>
        </div>

        {mode === 'wand' ? (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-[10px]" style={{ color: 'var(--ar-text-muted)' }}>精度</span>
            <input
              type="range" min="8" max="80" value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-16 sm:w-20 h-1 accent-purple-500"
            />
            <span className="text-[10px] w-5 text-right" style={{ color: 'var(--ar-text-2)' }}>{tolerance}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 ml-1">
            <button onClick={() => setEraserSize(Math.max(5, eraserSize - 5))} className="p-1 rounded" style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-muted)' }}>
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[10px] w-5 text-center" style={{ color: 'var(--ar-text-2)' }}>{eraserSize}</span>
            <button onClick={() => setEraserSize(Math.min(60, eraserSize + 5))} className="p-1 rounded" style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-muted)' }}>
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {loaded && (
            <button
              onClick={autoRemoveBackground}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium"
              style={{ background: 'var(--ar-accent-glow)', color: 'var(--ar-accent)' }}
            >
              <Wand2 className="w-3 h-3" />
              一括除去
            </button>
          )}
          <button
            onClick={undo}
            disabled={history.length <= 1}
            className="p-1.5 rounded disabled:opacity-30"
            style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)' }}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center p-2"
        style={{ background: 'var(--ar-bg)' }}
      >
        {/* Hidden working canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Visible preview with checkerboard */}
        <canvas
          ref={previewRef}
          className="max-w-full max-h-full object-contain rounded-xl touch-none"
          style={{ cursor: mode === 'wand' ? 'crosshair' : 'none', border: '1px solid var(--ar-border)' }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {/* Hint */}
        {loaded && removedCount === 0 && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5"
            style={{ background: 'var(--ar-glass)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-glass-border)', backdropFilter: 'blur(8px)' }}
          >
            <Wand2 className="w-3 h-3" style={{ color: 'var(--ar-accent)' }} />
            背景をタップして除去、または「一括除去」を押す
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className="flex items-center gap-2 p-3 flex-shrink-0"
        style={{ background: 'var(--ar-surface)', borderTop: '1px solid var(--ar-border)' }}
      >
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}
        >
          キャンセル
        </button>
        <button
          onClick={handleComplete}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5"
          style={{ background: 'var(--ar-accent)', boxShadow: '0 2px 12px var(--ar-accent-glow)' }}
        >
          <Check className="w-4 h-4" />
          切り抜き完了
        </button>
      </div>
    </div>
  );
}
