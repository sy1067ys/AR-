import { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2, RotateCcw, ZoomIn, ZoomOut, Layers, Download, ImageIcon, Move } from 'lucide-react';
import { FurnitureItem } from '../data/items';

export interface PlacedItem {
  instanceId: string;
  furnitureItem: FurnitureItem;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  flipH: boolean;
}

interface Props {
  onSave?: (imageData: string) => void;
}

type DragState =
  | { kind: 'none' }
  | { kind: 'move'; instanceId: string; startX: number; startY: number; origX: number; origY: number }
  | { kind: 'resize'; instanceId: string; handle: string; startX: number; startY: number; origW: number; origH: number; origX: number; origY: number }
  | { kind: 'rotate'; instanceId: string; centerX: number; centerY: number; startAngle: number; origRotation: number };

export function RoomARMode({ onSave }: Props) {
  const [roomPhoto, setRoomPhoto] = useState<string | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({ kind: 'none' });
  const [maxZ, setMaxZ] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRoomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRoomPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addItem = useCallback((item: FurnitureItem) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const newZ = maxZ + 1;
    setMaxZ(newZ);
    // Scale default size for mobile
    const scale = rect.width < 500 ? 0.6 : 1;
    const newItem: PlacedItem = {
      instanceId: `${item.id}-${Date.now()}`,
      furnitureItem: item,
      x: rect.width / 2 - (item.defaultWidth * scale) / 2,
      y: rect.height / 2 - (item.defaultHeight * scale) / 2,
      width: item.defaultWidth * scale,
      height: item.defaultHeight * scale,
      rotation: 0,
      zIndex: newZ,
      flipH: false,
    };
    setPlacedItems(prev => [...prev, newItem]);
    setSelectedId(newItem.instanceId);
  }, [maxZ]);

  useEffect(() => {
    const handler = (e: Event) => addItem((e as CustomEvent<FurnitureItem>).detail);
    window.addEventListener('room-add-item', handler);
    return () => window.removeEventListener('room-add-item', handler);
  }, [addItem]);

  const removeSelected = () => {
    if (!selectedId) return;
    setPlacedItems(prev => prev.filter(i => i.instanceId !== selectedId));
    setSelectedId(null);
  };

  const bringForward = () => {
    if (!selectedId) return;
    const newZ = maxZ + 1;
    setMaxZ(newZ);
    setPlacedItems(prev => prev.map(i => i.instanceId === selectedId ? { ...i, zIndex: newZ } : i));
  };

  const scaleSelected = (factor: number) => {
    if (!selectedId) return;
    setPlacedItems(prev => prev.map(i =>
      i.instanceId === selectedId
        ? { ...i, width: Math.max(30, i.width * factor), height: Math.max(30, i.height * factor) }
        : i
    ));
  };

  const rotateSelected = (delta: number) => {
    if (!selectedId) return;
    setPlacedItems(prev => prev.map(i =>
      i.instanceId === selectedId ? { ...i, rotation: (i.rotation + delta + 360) % 360 } : i
    ));
  };

  const flipSelected = () => {
    if (!selectedId) return;
    setPlacedItems(prev => prev.map(i =>
      i.instanceId === selectedId ? { ...i, flipH: !i.flipH } : i
    ));
  };

  // Unified pointer handling (mouse + touch)
  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, instanceId: string, handle?: string) => {
    e.stopPropagation();
    if ('preventDefault' in e && !('touches' in e)) e.preventDefault();

    const pos = getPointerPos(e);
    const newZ = maxZ + 1;
    setMaxZ(newZ);
    setPlacedItems(prev => prev.map(i => i.instanceId === instanceId ? { ...i, zIndex: newZ } : i));
    setSelectedId(instanceId);

    const item = placedItems.find(i => i.instanceId === instanceId);
    if (!item) return;

    if (handle === 'rotate') {
      const container = containerRef.current!;
      const rect = container.getBoundingClientRect();
      const cx = item.x + item.width / 2;
      const cy = item.y + item.height / 2;
      const startAngle = Math.atan2(pos.y - rect.top - cy, pos.x - rect.left - cx) * (180 / Math.PI);
      setDragState({ kind: 'rotate', instanceId, centerX: cx, centerY: cy, startAngle, origRotation: item.rotation });
    } else if (handle) {
      setDragState({ kind: 'resize', instanceId, handle, startX: pos.x, startY: pos.y, origW: item.width, origH: item.height, origX: item.x, origY: item.y });
    } else {
      setDragState({ kind: 'move', instanceId, startX: pos.x, startY: pos.y, origX: item.x, origY: item.y });
    }
  };

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (dragState.kind === 'none') return;
    if ('touches' in e) e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pos = 'touches' in e
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };

    if (dragState.kind === 'move') {
      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;
      setPlacedItems(prev => prev.map(i =>
        i.instanceId === dragState.instanceId
          ? { ...i, x: Math.max(0, Math.min(rect.width - i.width, dragState.origX + dx)), y: Math.max(0, Math.min(rect.height - i.height, dragState.origY + dy)) }
          : i
      ));
    } else if (dragState.kind === 'resize') {
      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;
      setPlacedItems(prev => prev.map(i =>
        i.instanceId === dragState.instanceId ? { ...i, width: Math.max(30, dragState.origW + dx), height: Math.max(30, dragState.origH + dy) } : i
      ));
    } else if (dragState.kind === 'rotate') {
      const angle = Math.atan2(pos.y - rect.top - dragState.centerY, pos.x - rect.left - dragState.centerX) * (180 / Math.PI);
      const delta = angle - dragState.startAngle;
      setPlacedItems(prev => prev.map(i =>
        i.instanceId === dragState.instanceId ? { ...i, rotation: (dragState.origRotation + delta + 360) % 360 } : i
      ));
    }
  }, [dragState]);

  const handlePointerUp = useCallback(() => setDragState({ kind: 'none' }), []);

  useEffect(() => {
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleSave = async () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);

    if (roomPhoto) {
      await new Promise<void>(resolve => {
        const bg = new Image();
        bg.crossOrigin = 'anonymous';
        bg.onload = () => { ctx.drawImage(bg, 0, 0, rect.width, rect.height); resolve(); };
        bg.onerror = () => resolve();
        bg.src = roomPhoto;
      });
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    const sorted = [...placedItems].sort((a, b) => a.zIndex - b.zIndex);
    for (const item of sorted) {
      await new Promise<void>(resolve => {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
          ctx.rotate((item.rotation * Math.PI) / 180);
          if (item.flipH) ctx.scale(-1, 1);
          ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = item.furnitureItem.image;
      });
    }

    const data = canvas.toDataURL('image/png');
    onSave?.(data);
    const link = document.createElement('a');
    link.href = data;
    link.download = `room-coordinate-${Date.now()}.png`;
    link.click();
  };

  const selectedItem = placedItems.find(i => i.instanceId === selectedId);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-gray-900 border-b border-gray-700 flex-wrap text-xs sm:text-sm">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-1.5 bg-indigo-600 text-white rounded-lg font-medium"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">部屋の写真を</span>読み込む
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleRoomPhotoUpload} />

        {selectedItem && (
          <>
            <div className="h-5 w-px bg-gray-600 hidden sm:block" />
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button onClick={() => scaleSelected(1.15)} className="p-1.5 bg-gray-700 text-white rounded" title="拡大">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => scaleSelected(0.85)} className="p-1.5 bg-gray-700 text-white rounded" title="縮小">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => rotateSelected(-15)} className="p-1.5 bg-gray-700 text-white rounded" title="左回転">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button onClick={flipSelected} className="p-1.5 bg-gray-700 text-white rounded font-bold" title="左右反転">
                ⇄
              </button>
              <button onClick={bringForward} className="p-1.5 bg-gray-700 text-white rounded" title="前面へ">
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button onClick={removeSelected} className="p-1.5 bg-red-700 text-white rounded" title="削除">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          {placedItems.length > 0 && (
            <button
              onClick={() => { setPlacedItems([]); setSelectedId(null); }}
              className="flex items-center gap-1 px-2 py-1.5 bg-gray-700 text-gray-200 rounded text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              リセット
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-lg font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            保存
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none touch-none"
        style={{ background: roomPhoto ? 'transparent' : '#1a1a2e', cursor: dragState.kind === 'move' ? 'grabbing' : 'default' }}
        onClick={(e) => {
          if ((e.target as HTMLElement) === containerRef.current) setSelectedId(null);
        }}
      >
        {roomPhoto ? (
          <img src={roomPhoto} alt="Room" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 p-4">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gray-800 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12" />
            </div>
            <p className="text-sm sm:text-lg font-medium text-center">部屋の写真を読み込んでください</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium"
            >
              写真を選ぶ
            </button>
          </div>
        )}

        {placedItems.slice().sort((a, b) => a.zIndex - b.zIndex).map(item => {
          const isSelected = item.instanceId === selectedId;
          return (
            <div
              key={item.instanceId}
              style={{
                position: 'absolute',
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
                transform: `rotate(${item.rotation}deg) scaleX(${item.flipH ? -1 : 1})`,
                transformOrigin: 'center center',
                zIndex: item.zIndex,
                cursor: dragState.kind === 'move' ? 'grabbing' : 'grab',
                outline: isSelected ? '2px solid #60a5fa' : 'none',
                outlineOffset: '2px',
              }}
              onMouseDown={(e) => handlePointerDown(e, item.instanceId)}
              onTouchStart={(e) => handlePointerDown(e, item.instanceId)}
            >
              <img
                src={item.furnitureItem.image}
                alt={item.furnitureItem.name}
                className="w-full h-full"
                style={{ objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
                draggable={false}
              />
              {isSelected && (
                <>
                  <div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none"
                    style={{ transform: `translateX(-50%) scaleX(${item.flipH ? -1 : 1})` }}
                  >
                    {item.furnitureItem.name}
                  </div>
                  <div
                    className="absolute bottom-0 right-0 w-5 h-5 bg-white border-2 border-blue-500 rounded-sm cursor-se-resize"
                    style={{ transform: 'translate(50%, 50%)' }}
                    onMouseDown={(e) => handlePointerDown(e, item.instanceId, 'se')}
                    onTouchStart={(e) => handlePointerDown(e, item.instanceId, 'se')}
                  />
                </>
              )}
            </div>
          );
        })}

        {placedItems.length > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full pointer-events-none">
            {placedItems.length}点配置中
          </div>
        )}
      </div>
    </div>
  );
}
