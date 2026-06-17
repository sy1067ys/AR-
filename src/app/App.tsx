import { useState, useRef, useEffect } from 'react';
import { ARCamera } from '../components/ARCamera';
import { ImageUploadMode } from '../components/ImageUploadMode';
import { ItemSelector } from '../components/ItemSelector';
import { PermissionGuide } from '../components/PermissionGuide';
import { RoomARMode } from '../components/RoomARMode';
import { RoomItemSelector } from '../components/RoomItemSelector';
import { tryOnItems, TryOnItem, FurnitureItem } from '../data/items';
import { Camera, Download, RotateCcw, Upload, Video, Sofa } from 'lucide-react';

const CUSTOM_ITEMS_STORAGE_KEY = 'ar-tryOn-custom-items';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [mode, setMode] = useState<'camera' | 'upload' | 'room'>('camera');
  const [customItems, setCustomItems] = useState<TryOnItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'glasses' | 'necklace' | 'earrings' | 'hat' | null;
    image: string | null;
    id: string | null;
  }>({
    type: null,
    image: null,
    id: null,
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(true);
  const cameraRef = useRef<{ capture: () => void }>(null);

  // Load custom items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_ITEMS_STORAGE_KEY);
      if (stored) {
        setCustomItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load custom items:', error);
    }
  }, []);

  // Save custom items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_ITEMS_STORAGE_KEY, JSON.stringify(customItems));
    } catch (error) {
      console.error('Failed to save custom items:', error);
    }
  }, [customItems]);

  // Combine default items with custom items
  const allItems = [...tryOnItems, ...customItems];

  const handleSelectItem = (item: TryOnItem | null) => {
    if (item) {
      setSelectedItem({
        type: item.type,
        image: item.image,
        id: item.id,
      });
    } else {
      setSelectedItem({
        type: null,
        image: null,
        id: null,
      });
    }
  };

  const handleAddCustomItem = (item: TryOnItem) => {
    setCustomItems(prev => [...prev, item]);
  };

  const handleRemoveCustomItem = (itemId: string) => {
    setCustomItems(prev => prev.filter(item => item.id !== itemId));
    // If the removed item was selected, clear selection
    if (selectedItem.id === itemId) {
      setSelectedItem({
        type: null,
        image: null,
        id: null,
      });
    }
  };

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const handleDownload = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `ar-tryOn-${Date.now()}.png`;
      link.click();
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
  };

  return (
    <div className="size-full bg-gradient-to-br from-purple-100 to-blue-100 flex flex-col">
      <header className="bg-white shadow-md px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-blue-600" />
            <h1 className="font-bold text-2xl text-gray-800">AR試着アプリ</h1>
          </div>
          {hasStarted && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('camera')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  mode === 'camera'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Video className="w-4 h-4" />
                カメラモード
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  mode === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                画像アップロード
              </button>
              <button
                onClick={() => setMode('room')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  mode === 'room'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Sofa className="w-4 h-4" />
                部屋コーデ
              </button>
            </div>
          )}
          <div className="text-sm text-gray-600 text-right">
            <p>眼鏡・アクセサリー・帽子を自由に試着</p>
            <p className="text-xs text-indigo-600 font-medium">✨ 部屋コーデ機能で家具・インテリア配置も可能</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex gap-4 p-4 overflow-hidden">
        {!hasStarted ? (
          <div className="flex-1">
            <PermissionGuide
              onRequestPermission={() => {
                setMode('camera');
                setHasStarted(true);
              }}
              onUseUploadMode={() => {
                setMode('upload');
                setHasStarted(true);
              }}
              onUseRoomMode={() => {
                setMode('room');
                setHasStarted(true);
              }}
            />
          </div>
        ) : mode === 'room' ? (
          /* Room coordination mode */
          <>
            <div className="flex-1 rounded-lg overflow-hidden shadow-2xl bg-gray-900">
              <RoomARMode onSave={(data) => setCapturedImage(data)} />
            </div>
            <div className="w-72 overflow-hidden rounded-lg shadow-xl">
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
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <button
                      onClick={() => setShowSelector(!showSelector)}
                      className="px-6 py-3 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all hover:scale-105 font-medium"
                    >
                      {showSelector ? 'アイテムを非表示' : 'アイテムを表示'}
                    </button>
                    {mode === 'camera' && (
                      <button
                        onClick={() => {
                          const canvas = document.querySelector('canvas');
                          if (canvas) {
                            handleCapture(canvas.toDataURL('image/png'));
                          }
                        }}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105 font-medium flex items-center gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        撮影
                      </button>
                    )}
                    {mode === 'upload' && (
                      <button
                        onClick={() => {
                          const canvas = document.querySelector('canvas');
                          if (canvas) {
                            handleCapture(canvas.toDataURL('image/png'));
                          }
                        }}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all hover:scale-105 font-medium flex items-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        保存
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="max-w-full max-h-[calc(100%-100px)] object-contain rounded-lg"
                  />
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleDownload}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all hover:scale-105 font-medium flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      ダウンロード
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg transition-all hover:scale-105 font-medium flex items-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      戻る
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showSelector && !capturedImage && (
              <div className="w-80 overflow-y-auto">
                <ItemSelector
                  items={allItems}
                  selectedItem={selectedItem.id}
                  onSelectItem={handleSelectItem}
                  onAddCustomItem={handleAddCustomItem}
                  onRemoveCustomItem={handleRemoveCustomItem}
                />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white shadow-md px-6 py-3 text-center text-sm text-gray-600">
        <div className="flex items-center justify-between">
          {mode === 'room'
            ? <p>部屋の写真に家具・インテリアを自由に配置してコーディネートをシミュレーション</p>
            : <p>カメラを使ってリアルタイムでアイテムを試着できます</p>
          }
          {customItems.length > 0 && mode !== 'room' && (
            <p className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              カスタム商品: {customItems.length}個保存中
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}