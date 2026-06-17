import { useState, useRef, useEffect } from 'react';
import { ARCamera } from '../components/ARCamera';
import { ImageUploadMode } from '../components/ImageUploadMode';
import { ItemSelector } from '../components/ItemSelector';
import { PermissionGuide } from '../components/PermissionGuide';
import { RoomARMode } from '../components/RoomARMode';
import { RoomItemSelector } from '../components/RoomItemSelector';
import { tryOnItems, TryOnItem, FurnitureItem } from '../data/items';
import { Camera, Download, RotateCcw, Upload, Video, Sofa, X, ChevronUp, ShoppingBag } from 'lucide-react';

const CUSTOM_ITEMS_STORAGE_KEY = 'ar-tryOn-custom-items';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [mode, setMode] = useState<'camera' | 'upload' | 'room'>('camera');
  const [customItems, setCustomItems] = useState<TryOnItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'glasses' | 'necklace' | 'earrings' | 'hat' | null;
    image: string | null;
    id: string | null;
  }>({ type: null, image: null, id: null });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const cameraRef = useRef<{ capture: () => void }>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_ITEMS_STORAGE_KEY);
      if (stored) setCustomItems(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_ITEMS_STORAGE_KEY, JSON.stringify(customItems));
    } catch {}
  }, [customItems]);

  const allItems = [...tryOnItems, ...customItems];

  const handleSelectItem = (item: TryOnItem | null) => {
    if (item) {
      setSelectedItem({ type: item.type, image: item.image, id: item.id });
    } else {
      setSelectedItem({ type: null, image: null, id: null });
    }
  };

  const handleAddCustomItem = (item: TryOnItem) => {
    setCustomItems(prev => [...prev, item]);
  };

  const handleRemoveCustomItem = (itemId: string) => {
    setCustomItems(prev => prev.filter(item => item.id !== itemId));
    if (selectedItem.id === itemId) {
      setSelectedItem({ type: null, image: null, id: null });
    }
  };

  const handleCapture = (imageData: string) => setCapturedImage(imageData);

  const handleDownload = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `ar-tryOn-${Date.now()}.png`;
      link.click();
    }
  };

  const handleReset = () => setCapturedImage(null);

  const doCapture = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) handleCapture(canvas.toDataURL('image/png'));
  };

  return (
    <div className="size-full bg-gradient-to-br from-purple-100 to-blue-100 flex flex-col overflow-hidden">
      {/* ===== HEADER ===== */}
      <header className="bg-white shadow-md px-3 py-2 sm:px-6 sm:py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            <h1 className="font-bold text-base sm:text-2xl text-gray-800 truncate">AR試着</h1>
          </div>
          {hasStarted && (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => { setMode('camera'); setShowRoomSelector(false); }}
                className={`p-2 sm:px-3 sm:py-2 rounded-lg flex items-center gap-1 transition-colors text-xs sm:text-sm ${
                  mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">カメラ</span>
              </button>
              <button
                onClick={() => { setMode('upload'); setShowRoomSelector(false); }}
                className={`p-2 sm:px-3 sm:py-2 rounded-lg flex items-center gap-1 transition-colors text-xs sm:text-sm ${
                  mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">写真</span>
              </button>
              <button
                onClick={() => { setMode('room'); setShowSelector(false); }}
                className={`p-2 sm:px-3 sm:py-2 rounded-lg flex items-center gap-1 transition-colors text-xs sm:text-sm ${
                  mode === 'room' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Sofa className="w-4 h-4" />
                <span className="hidden sm:inline">部屋</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-4 p-2 sm:p-4 overflow-hidden relative">
        {!hasStarted ? (
          <div className="flex-1 overflow-y-auto">
            <PermissionGuide
              onRequestPermission={() => { setMode('camera'); setHasStarted(true); }}
              onUseUploadMode={() => { setMode('upload'); setHasStarted(true); }}
              onUseRoomMode={() => { setMode('room'); setHasStarted(true); }}
            />
          </div>
        ) : mode === 'room' ? (
          <>
            <div className="flex-1 rounded-lg overflow-hidden shadow-2xl bg-gray-900">
              <RoomARMode onSave={(data) => setCapturedImage(data)} />
            </div>
            {/* Mobile: bottom sheet toggle for room items */}
            <button
              onClick={() => setShowRoomSelector(!showRoomSelector)}
              className="sm:hidden fixed bottom-4 right-4 z-30 p-3 bg-indigo-600 text-white rounded-full shadow-lg"
            >
              {showRoomSelector ? <X className="w-5 h-5" /> : <Sofa className="w-5 h-5" />}
            </button>
            {/* Mobile: bottom sheet */}
            <div className={`
              sm:w-72 sm:relative sm:block
              fixed inset-x-0 bottom-0 z-20 sm:z-auto
              transition-transform duration-300 ease-out
              ${showRoomSelector ? 'translate-y-0' : 'translate-y-full sm:translate-y-0'}
              max-h-[60vh] sm:max-h-none
              overflow-hidden rounded-t-2xl sm:rounded-lg shadow-xl
            `}>
              <RoomItemSelector
                onAddItem={(item: FurnitureItem) =>
                  window.dispatchEvent(new CustomEvent('room-add-item', { detail: item }))
                }
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 bg-black rounded-lg overflow-hidden shadow-2xl relative">
              {!capturedImage ? (
                <>
                  {mode === 'camera' ? (
                    <ARCamera selectedItem={selectedItem} onCapture={handleCapture} />
                  ) : (
                    <ImageUploadMode selectedItem={selectedItem} />
                  )}
                  {/* Bottom controls */}
                  <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 sm:gap-4 px-3">
                    <button
                      onClick={() => setShowSelector(!showSelector)}
                      className="p-3 bg-white/90 text-gray-800 rounded-full shadow-lg flex items-center gap-1 text-sm"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span className="hidden sm:inline">{showSelector ? '非表示' : '表示'}</span>
                    </button>
                    <button
                      onClick={doCapture}
                      className={`px-5 py-3 sm:px-6 rounded-full shadow-lg font-medium flex items-center gap-2 text-sm ${
                        mode === 'camera'
                          ? 'bg-blue-600 text-white'
                          : 'bg-green-600 text-white'
                      }`}
                    >
                      {mode === 'camera' ? (
                        <><Camera className="w-4 h-4" />撮影</>
                      ) : (
                        <><Download className="w-4 h-4" />保存</>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black p-3">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="max-w-full max-h-[calc(100%-80px)] object-contain rounded-lg"
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-full shadow-lg font-medium flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      保存
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-600 text-white rounded-full shadow-lg font-medium flex items-center gap-2 text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      戻る
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Item Selector: bottom sheet on mobile, sidebar on desktop */}
            {showSelector && !capturedImage && (
              <>
                {/* Mobile backdrop */}
                <div
                  className="sm:hidden fixed inset-0 bg-black/40 z-20"
                  onClick={() => setShowSelector(false)}
                />
                <div className="
                  fixed inset-x-0 bottom-0 z-30
                  sm:relative sm:z-auto sm:inset-auto
                  sm:w-80
                  max-h-[65vh] sm:max-h-none
                  overflow-y-auto
                  rounded-t-2xl sm:rounded-lg
                  bg-white shadow-xl
                ">
                  {/* Mobile drag handle */}
                  <div className="sm:hidden flex justify-center pt-2 pb-1 sticky top-0 bg-white z-10">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                  </div>
                  <ItemSelector
                    items={allItems}
                    selectedItem={selectedItem.id}
                    onSelectItem={(item) => {
                      handleSelectItem(item);
                      // Close selector on mobile after selection
                      if (window.innerWidth < 640 && item) setShowSelector(false);
                    }}
                    onAddCustomItem={handleAddCustomItem}
                    onRemoveCustomItem={handleRemoveCustomItem}
                  />
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-white shadow-inner px-3 py-2 text-center text-xs sm:text-sm text-gray-600 flex-shrink-0">
        <p className="truncate">
          {mode === 'room'
            ? '部屋の写真に家具を配置してシミュレーション'
            : 'リアルタイムでアイテムを試着'
          }
        </p>
      </footer>
    </div>
  );
}
