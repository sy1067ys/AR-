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
    const newItem: PlacedItem = {
      instanceId: `${item.id}-${Date.now()}`,
      furnitureItem: item,
      x: rect.width / 2 - item.defaultWidth / 2,
      y: rect.height / 2 - item.defaultHeight / 2,
      width: item.defaultWidth,
      height: item.defaultHeight,
      rotation: 0,
      zIndex: newZ,
      flipH: false,
    };
    setPlacedItems(prev => [...prev, newItem]);
    setSelectedId(newItem.instanceId);
  }, [maxZ]);

  // Expose addItem via a custom event so parent can call it
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<FurnitureItem>;
      addItem(ce.detail);
    };
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

  const sendBackward = () => {
    if (!selectedId) return;
    setPlacedItems(prev => prev.map(i => i.instanceId === selectedId ? { ...i, zIndex: Math.max(0, i.zIndex - 1) } : i));
  };

  const flipSelected = () => {
    if (!selectedId) return;
    setPlacedItems(prev => prev.map(i => i.instanceId === selectedId ? { ...i, flipH: !i.flipH } : i));
  };

  const scaleSelected = (factor: number) => {
    if (!selectedId) return;
    setPlacedItems(prev => prev.map(i =>
      i.instanceId === selectedId
        ? { ...i, width: Math.max(40, i.width * factor), height: Math.max(40, i.height * factor) }
        : i
    ));
  };

  const rotateSelected = (delta: number) => {
    if (!selectedId) return;
    setPlacedItems(prev => prev.map(i =>
      i.instanceId === selectedId ? { ...i, rotation: (i.rotation + delta + 360) % 360 } : i
    ));
  };

  const handleMouseDown = (e: React.MouseEvent, instanceId: string, handle?: string) => {
    e.stopPropagation();
    e.preventDefault();

    const newZ = maxZ + 1;
    setMaxZ(newZ);
    setPlacedItems(prev => prev.map(i => i.instanceId === instanceId ? { ...i, zIndex: newZ } : i));
    setSelectedId(instanceId);

    const item = placedItems.find(i => i.instanceId === instanceId);
    if (!item) return;

    if (handle === 'rotate') {
      const container = containerRef.current!;
      const rect = container.getBoundingClientRect();
      const cx = item.x + item.width / 2 - rect.left;
      const cy = item.y + item.height / 2 - rect.top;
      const startAngle = Math.atan2(e.clientY - rect.top - cy, e.clientX - rect.left - cx) * (180 / Math.PI);
      setDragState({ kind: 'rotate', instanceId, centerX: cx, centerY: cy, startAngle, origRotation: item.rotation });
    } else if (handle) {
      setDragState({ kind: 'resize', instanceId, handle, startX: e.clientX, startY: e.clientY, origW: item.width, origH: item.height, origX: item.x, origY: item.y });
    } else {
      setDragState({ kind: 'move', instanceId, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragState.kind === 'none') return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    if (dragState.kind === 'move') {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      setPlacedItems(prev => prev.map(i =>
        i.instanceId === dragState.instanceId
          ? { ...i, x: Math.max(0, Math.min(rect.width - i.width, dragState.origX + dx)), y: Math.max(0, Math.min(rect.height - i.height, dragState.origY + dy)) }
          : i
      ));
    } else if (dragState.kind === 'resize') {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const newW = Math.max(40, dragState.origW + dx);
      const newH = Math.max(40, dragState.origH + dy);
      setPlacedItems(prev => prev.map(i =>
        i.instanceId === dragState.instanceId ? { ...i, width: newW, height: newH } : i
      ));
    } else if (dragState.kind === 'rotate') {
      const cx = dragState.centerX;
      const cy = dragState.centerY;
      const angle = Math.atan2(e.clientY - rect.top - cy, e.clientX - rect.left - cx) * (180 / Math.PI);
      const delta = angle - dragState.startAngle;
      setPlacedItems(prev => prev.map(i =>
        i.instanceId === dragState.instanceId ? { ...i, rotation: (dragState.origRotation + delta + 360) % 360 } : i
      ));
    }
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    setDragState({ kind: 'none' });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleSave = async () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d')!;

    // Draw background
    if (roomPhoto) {
      await new Promise<void>(resolve => {
        const bg = new Image();
        bg.crossOrigin = 'anonymous';
        bg.onload = () => { ctx.drawImage(bg, 0, 0, canvas.width, canvas.height); resolve(); };
        bg.onerror = () => resolve();
        bg.src = roomPhoto;
      });
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw placed items sorted by zIndex
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

    // Also trigger direct download
    const link = document.createElement('a');
    link.href = data;
    link.download = `room-coordinate-${Date.now()}.png`;
    link.click();
  };

  const selectedItem = placedItems.find(i => i.instanceId === selectedId);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-900 border-b border-gray-700 flex-wrap">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
          部屋の写真を読み込む
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleRoomPhotoUpload} />

        {selectedItem && (
          <>
            <div className="h-6 w-px bg-gray-600" />
            <div className="flex items-center gap-1">
              <button onClick={() => scaleSelected(1.1)} className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded" title="拡大">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => scaleSelected(0.9)} className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded" title="縮小">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={() => rotateSelected(-15)} className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded" title="左回転">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => rotateSelected(15)} className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded rotate-180" title="右回転" style={{ transform: 'scaleX(-1)' }}>
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={flipSelected} className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold" title="左右反転">
                ⇄
              </button>
              <button onClick={bringForward} className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded" title="前面へ">
                <Layers className="w-4 h-4" />
              </button>
              <button onClick={removeSelected} className="p-1.5 bg-red-700 hover:bg-red-600 text-white rounded" title="削除">
                <Trash2 className="w-4 h-4" />
              </button>
              <span className="text-gray-300 text-xs ml-1">
                {selectedItem.furnitureItem.name}
              </span>
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {placedItems.length > 0 && (
            <button
              onClick={() => { setPlacedItems([]); setSelectedId(null); }}
              className="flex items-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              全リセット
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{ background: roomPhoto ? 'transparent' : '#1a1a2e', cursor: dragState.kind === 'move' ? 'grabbing' : 'default' }}
        onClick={(e) => {
          if ((e.target as HTMLElement) === containerRef.current) setSelectedId(null);
        }}
      >
        {roomPhoto ? (
          <img
            src={roomPhoto}
            alt="Room"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-400">
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
              <ImageIcon className="w-12 h-12" />
            </div>
            <p className="text-lg font-medium">部屋の写真を読み込んでください</p>
            <p className="text-sm opacity-60">「部屋の写真を読み込む」ボタンから画像を選択、<br />右パネルから家具を追加できます</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors"
            >
              写真を選ぶ
            </button>
          </div>
        )}

        {/* Placed items */}
        {placedItems
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(item => {
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
                onMouseDown={(e) => handleMouseDown(e, item.instanceId)}
              >
                <img
                  src={item.furnitureItem.image}
                  alt={item.furnitureItem.name}
                  className="w-full h-full"
                  style={{ objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
                  draggable={false}
                />

                {/* Selection handles */}
                {isSelected && (
                  <>
                    {/* Label */}
                    <div
                      className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap pointer-events-none"
                      style={{ transform: `translateX(-50%) scaleX(${item.flipH ? -1 : 1})` }}
                    >
                      {item.furnitureItem.name}
                    </div>
                    {/* Resize SE */}
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 bg-white border-2 border-blue-500 rounded-sm cursor-se-resize"
                      style={{ transform: 'translate(50%, 50%)' }}
                      onMouseDown={(e) => handleMouseDown(e, item.instanceId, 'se')}
                    />
                    {/* Rotate handle */}
                    <div
                      className="absolute -top-8 left-1/2 w-5 h-5 bg-green-500 border-2 border-white rounded-full cursor-crosshair"
                      style={{ transform: 'translateX(-50%)' }}
                      onMouseDown={(e) => handleMouseDown(e, item.instanceId, 'rotate')}
                      title="ドラッグで回転"
                    />
                    <div className="absolute -top-4 left-1/2 w-0.5 h-4 bg-green-400 pointer-events-none" style={{ transform: 'translateX(-50%)' }} />
                    {/* Move icon hint */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                      <Move className="w-8 h-8 text-white" />
                    </div>
                  </>
                )}
              </div>
            );
          })}

        {/* Item count badge */}
        {placedItems.length > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
            {placedItems.length}点配置中
          </div>
        )}
      </div>
    </div>
  );
}
