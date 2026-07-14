import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Crop, X, RotateCcw, Hand, Square } from 'lucide-react';

interface ImageItemPickerProps {
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
  initialImage?: string | null;
}

interface Sel { x: number; y: number; w: number; h: number; }

export function ImageItemPicker({ onCropComplete, onCancel, initialImage }: ImageItemPickerProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage ?? null);
  const [selection, setSelection] = useState<Sel | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [dims, setDims] = useState({ w: 0, h: 0, scale: 1, offX: 0, offY: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgObjRef = useRef<HTMLImageElement | null>(null);

  const loadImg = useCallback((src: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgObjRef.current = img;
      const c = canvasRef.current, ct = containerRef.current;
      if (!c || !ct) return;
      const cw = ct.clientWidth, ch = ct.clientHeight;
      c.width = cw; c.height = ch;
      const sc = Math.min(cw / img.width, ch / img.height) * 0.95;
      const dw = img.width * sc, dh = img.height * sc;
      const ox = (cw - dw) / 2, oy = (ch - dh) / 2;
      setDims({ w: dw, h: dh, scale: sc, offX: ox, offY: oy });
      setSelection(null);
    };
    img.src = src;
  }, []);

  useEffect(() => { if (imageSrc) loadImg(imageSrc); }, [imageSrc, loadImg]);

  // Draw
  useEffect(() => {
    const c = canvasRef.current, img = imgObjRef.current;
    if (!c || !img) return;
    const ctx = c.getContext('2d')!;
    const { w, h, offX: ox, offY: oy, scale } = dims;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#0F1117'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, ox, oy, w, h);

    if (selection && selection.w > 5 && selection.h > 5) {
      const s = selection;
      // Dim outside
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(ox, oy, w, s.y);
      ctx.fillRect(ox, oy + s.y + s.h, w, h - s.y - s.h);
      ctx.fillRect(ox, oy + s.y, s.x, s.h);
      ctx.fillRect(ox + s.x + s.w, oy + s.y, w - s.x - s.w, s.h);
      // Border
      ctx.strokeStyle = '#7C6AFF'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
      ctx.strokeRect(ox + s.x, oy + s.y, s.w, s.h);
      ctx.setLineDash([]);
      // Corners
      ctx.fillStyle = '#7C6AFF';
      for (const [cx, cy] of [[s.x, s.y], [s.x + s.w, s.y], [s.x, s.y + s.h], [s.x + s.w, s.y + s.h]]) {
        ctx.beginPath(); ctx.arc(ox + cx, oy + cy, 5, 0, Math.PI * 2); ctx.fill();
      }
      // Size label
      const ow = Math.round(s.w / scale), oh = Math.round(s.h / scale);
      const lbl = `${ow}×${oh}`;
      ctx.font = '600 11px system-ui'; const tm = ctx.measureText(lbl);
      const lx = ox + s.x + s.w / 2, ly = oy + s.y - 14;
      ctx.fillStyle = 'rgba(124,106,255,0.9)';
      const rx = lx - tm.width / 2 - 6, ry = ly - 8, rw = tm.width + 12, rh = 18, rr = 6;
      ctx.beginPath(); ctx.moveTo(rx + rr, ry); ctx.lineTo(rx + rw - rr, ry); ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr); ctx.lineTo(rx + rw, ry + rh - rr); ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh); ctx.lineTo(rx + rr, ry + rh); ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr); ctx.lineTo(rx, ry + rr); ctx.quadraticCurveTo(rx, ry, rx + rr, ry); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(lbl, lx - tm.width / 2, ly + 5);
    }
  }, [selection, dims]);

  const toLocal = (cx: number, cy: number) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(dims.w, cx - r.left - dims.offX)),
      y: Math.max(0, Math.min(dims.h, cy - r.top - dims.offY)),
    };
  };
  const ptr = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) { const t = e.touches[0] || e.changedTouches[0]; return { cx: t.clientX, cy: t.clientY }; }
    return { cx: e.clientX, cy: e.clientY };
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); const { cx, cy } = ptr(e); const p = toLocal(cx, cy);
    setStartPos(p); setIsDragging(true); setSelection({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return; e.preventDefault();
    const { cx, cy } = ptr(e); const p = toLocal(cx, cy);
    setSelection({ x: Math.min(startPos.x, p.x), y: Math.min(startPos.y, p.y), w: Math.abs(p.x - startPos.x), h: Math.abs(p.y - startPos.y) });
  };
  const onUp = () => {
    setIsDragging(false);
    if (selection && (selection.w < 10 || selection.h < 10)) setSelection(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = (ev) => setImageSrc(ev.target?.result as string); r.readAsDataURL(f);
    e.target.value = '';
  };

  const doCrop = () => {
    if (!selection || !imgObjRef.current || selection.w < 10 || selection.h < 10) return;
    const { scale } = dims;
    const sx = selection.x / scale, sy = selection.y / scale, sw = selection.w / scale, sh = selection.h / scale;
    const cv = document.createElement('canvas');
    cv.width = Math.round(sw); cv.height = Math.round(sh);
    cv.getContext('2d')!.drawImage(imgObjRef.current, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
    onCropComplete(cv.toDataURL('image/png'));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2.5 flex-shrink-0" style={{ background: 'var(--ar-surface)', borderBottom: '1px solid var(--ar-border)' }}>
        <div className="flex items-center gap-2">
          <Crop className="w-4 h-4" style={{ color: 'var(--ar-accent)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--ar-text)' }}>アイテムを選択</span>
        </div>
        <button onClick={onCancel} style={{ color: 'var(--ar-text-muted)' }}><X className="w-5 h-5" /></button>
      </div>

      {!imageSrc ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4" style={{ background: 'var(--ar-bg)' }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'var(--ar-accent-glow)' }}>
            <Upload className="w-10 h-10" style={{ color: 'var(--ar-accent)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ar-text)' }}>アクセサリーが写っている画像を選択</p>
          <p className="text-xs text-center" style={{ color: 'var(--ar-text-muted)' }}>雑誌の写真、ECサイトのスクリーンショット、<br />カタログなど何でもOK</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button onClick={() => fileRef.current?.click()} className="px-6 py-3 rounded-2xl font-medium text-sm text-white active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, var(--ar-accent), var(--ar-accent-2))', boxShadow: '0 4px 16px var(--ar-accent-glow)' }}>
            画像をアップロード
          </button>
        </div>
      ) : (
        <>
          <div className="px-3 py-1.5 flex items-center justify-between flex-shrink-0" style={{ background: 'var(--ar-surface-2)', borderBottom: '1px solid var(--ar-border)' }}>
            <div className="flex items-center gap-1.5">
              <Square className="w-3 h-3" style={{ color: 'var(--ar-accent)' }} />
              <span className="text-[10px]" style={{ color: 'var(--ar-text-2)' }}>装着したいアイテムを指で囲んでください</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setSelection(null)} className="p-1 rounded" style={{ background: 'var(--ar-surface)', color: 'var(--ar-text-muted)' }}><RotateCcw className="w-3 h-3" /></button>
              <button onClick={() => { setImageSrc(null); setSelection(null); }} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--ar-surface)', color: 'var(--ar-text-muted)' }}>別の画像</button>
            </div>
          </div>
          <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ background: 'var(--ar-bg)' }}>
            <canvas ref={canvasRef} className="w-full h-full touch-none" style={{ cursor: 'crosshair' }}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
              onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} />
            {!selection && <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-4 py-2 rounded-xl text-xs flex items-center gap-2" style={{ background: 'var(--ar-glass)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-glass-border)', backdropFilter: 'blur(8px)' }}>
                <Hand className="w-4 h-4" style={{ color: 'var(--ar-accent)' }} />ドラッグで囲む
              </div>
            </div>}
          </div>
          <div className="flex items-center gap-2 p-3 flex-shrink-0" style={{ background: 'var(--ar-surface)', borderTop: '1px solid var(--ar-border)' }}>
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}>キャンセル</button>
            <button onClick={doCrop} disabled={!selection || selection.w < 10 || selection.h < 10}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-30 active:scale-95 transition-all"
              style={{ background: 'var(--ar-accent)', boxShadow: '0 2px 12px var(--ar-accent-glow)' }}>
              <Crop className="w-4 h-4" />切り抜きへ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
