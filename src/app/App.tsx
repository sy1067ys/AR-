import { useState, useEffect, useRef } from 'react';
import { ARCamera } from '../components/ARCamera';
import { ImageUploadMode } from '../components/ImageUploadMode';
import { ItemSelector } from '../components/ItemSelector';
import { PermissionGuide } from '../components/PermissionGuide';
import { RoomARMode } from '../components/RoomARMode';
import { RoomItemSelector } from '../components/RoomItemSelector';
import { AIRecognition } from '../components/AIRecognition';
import { SmartCutout } from '../components/SmartCutout';
import { tryOnItems, TryOnItem, FurnitureItem } from '../data/items';
import {
  Camera, Download, RotateCcw, Upload, Video, Sofa, X,
  ShoppingBag, Sparkles, SwitchCamera, Scan, Home, ImagePlus,
} from 'lucide-react';

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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [aiCaptureImage, setAiCaptureImage] = useState<string | null>(null);
  const [directCutoutImage, setDirectCutoutImage] = useState<string | null>(null);
  // Quick import type selector
  const [quickImportImage, setQuickImportImage] = useState<string | null>(null);
  const [quickImportStep, setQuickImportStep] = useState<'cutout' | 'type' | null>(null);
  const [quickImportCutout, setQuickImportCutout] = useState<string | null>(null);
  const [quickImportType, setQuickImportType] = useState<'glasses' | 'necklace' | 'earrings' | 'hat'>('glasses');
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { const s = localStorage.getItem(CUSTOM_ITEMS_STORAGE_KEY); if (s) setCustomItems(JSON.parse(s)); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem(CUSTOM_ITEMS_STORAGE_KEY, JSON.stringify(customItems)); } catch {} }, [customItems]);

  const allItems = [...tryOnItems, ...customItems];

  const handleSelectItem = (item: TryOnItem | null) => {
    if (item) setSelectedItem({ type: item.type, image: item.image, id: item.id });
    else setSelectedItem({ type: null, image: null, id: null });
  };
  const handleAddCustomItem = (item: TryOnItem) => setCustomItems(prev => [...prev, item]);
  const handleRemoveCustomItem = (itemId: string) => {
    setCustomItems(prev => prev.filter(i => i.id !== itemId));
    if (selectedItem.id === itemId) setSelectedItem({ type: null, image: null, id: null });
  };
  const handleCapture = (d: string) => setCapturedImage(d);
  const handleDownload = () => { if (!capturedImage) return; const a = document.createElement('a'); a.href = capturedImage; a.download = `ar-tryOn-${Date.now()}.png`; a.click(); };
  const handleReset = () => setCapturedImage(null);
  const doCapture = () => { const c = document.querySelector('canvas'); if (c) handleCapture(c.toDataURL('image/png')); };
  const doAICapture = () => { const c = document.querySelector('canvas'); if (c) setAiCaptureImage(c.toDataURL('image/png')); };
  const handleAICutout = (img: string) => { setAiCaptureImage(null); setDirectCutoutImage(img); };
  const handleDirectCutoutComplete = (url: string) => {
    const item: TryOnItem = { id: `custom-${Date.now()}`, name: 'AI認識アイテム', type: 'glasses', image: url, category: '眼鏡' };
    handleAddCustomItem(item); setDirectCutoutImage(null); handleSelectItem(item);
  };
  const toggleCamera = () => setFacingMode(p => p === 'user' ? 'environment' : 'user');
  const goHome = () => { setHasStarted(false); setCapturedImage(null); setShowSelector(false); setShowRoomSelector(false); };
  const startAISearch = () => { setMode('camera'); setFacingMode('environment'); setHasStarted(true); setTimeout(() => doAICapture(), 1500); };

  // Quick import: gallery → cutout → type select → use
  const handleGalleryImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      setQuickImportImage(ev.target?.result as string);
      setQuickImportStep('cutout');
    };
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const handleQuickCutoutDone = (cutoutUrl: string) => {
    setQuickImportCutout(cutoutUrl);
    setQuickImportStep('type');
  };

  const handleQuickImportFinish = () => {
    if (!quickImportCutout) return;
    const map: Record<string, string> = { glasses: '眼鏡', necklace: 'ネックレス', earrings: 'ピアス', hat: '帽子' };
    const item: TryOnItem = {
      id: `custom-${Date.now()}`,
      name: '取り込みアイテム',
      type: quickImportType,
      image: quickImportCutout,
      category: map[quickImportType],
    };
    handleAddCustomItem(item);
    handleSelectItem(item);
    // Reset
    setQuickImportImage(null); setQuickImportStep(null); setQuickImportCutout(null);
  };

  const cancelQuickImport = () => {
    setQuickImportImage(null); setQuickImportStep(null); setQuickImportCutout(null);
  };

  const modeButtons = [
    { key: 'camera' as const, icon: Video, label: 'カメラ' },
    { key: 'upload' as const, icon: Upload, label: '写真' },
    { key: 'room' as const, icon: Sofa, label: '部屋' },
  ];

  return (
    <div className="size-full flex flex-col overflow-hidden" style={{ background: 'var(--ar-bg)' }}>
      {/* Hidden gallery input */}
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryImport} />

      {/* HEADER */}
      <header className="flex-shrink-0 px-3 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-2" style={{ background: 'var(--ar-surface)', borderBottom: '1px solid var(--ar-border)' }}>
        <div className="flex items-center gap-2">
          {hasStarted ? (
            <button onClick={goHome} className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all" style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}>
              <Home className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--ar-accent-glow)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--ar-accent)' }} />
            </div>
          )}
          <span className="font-bold text-sm sm:text-lg tracking-tight" style={{ color: 'var(--ar-text)' }}>AR Try-On</span>
        </div>

        {hasStarted && (
          <div className="flex items-center p-0.5 rounded-xl gap-0.5" style={{ background: 'var(--ar-surface-2)' }}>
            {modeButtons.map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => { setMode(key); setCapturedImage(null); if (key === 'room') setShowSelector(false); else setShowRoomSelector(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200"
                style={{ background: mode === key ? 'var(--ar-accent)' : 'transparent', color: mode === key ? '#fff' : 'var(--ar-text-muted)', boxShadow: mode === key ? '0 2px 12px var(--ar-accent-glow)' : 'none' }}>
                <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        )}

        {hasStarted && mode === 'camera' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] hidden sm:inline" style={{ color: 'var(--ar-text-muted)' }}>{facingMode === 'user' ? 'イン' : 'アウト'}</span>
            <div className="w-2 h-2 rounded-full" style={{ background: facingMode === 'user' ? 'var(--ar-success)' : 'var(--ar-warning)' }} />
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3 p-2 sm:p-3 overflow-hidden relative">
        {!hasStarted ? (
          <div className="flex-1 overflow-y-auto">
            <PermissionGuide
              onRequestPermission={() => { setMode('camera'); setFacingMode('user'); setHasStarted(true); }}
              onUseUploadMode={() => { setMode('upload'); setHasStarted(true); }}
              onUseRoomMode={() => { setMode('room'); setHasStarted(true); }}
              onUseAISearch={startAISearch}
            />
          </div>
        ) : mode === 'room' ? (
          <>
            <div className="flex-1 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--ar-border)' }}>
              <RoomARMode onSave={(d) => setCapturedImage(d)} />
            </div>
            <button onClick={() => setShowRoomSelector(!showRoomSelector)} className="sm:hidden fixed bottom-5 right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform" style={{ background: 'var(--ar-accent)', boxShadow: '0 4px 20px var(--ar-accent-glow)' }}>
              {showRoomSelector ? <X className="w-5 h-5 text-white" /> : <Sofa className="w-5 h-5 text-white" />}
            </button>
            <div className={`sm:w-72 sm:relative sm:block fixed inset-x-0 bottom-0 z-20 sm:z-auto transition-transform duration-300 ${showRoomSelector ? 'translate-y-0' : 'translate-y-full sm:translate-y-0'} max-h-[60vh] sm:max-h-none overflow-hidden rounded-t-2xl sm:rounded-2xl`} style={{ border: '1px solid var(--ar-border)' }}>
              <RoomItemSelector onAddItem={(item: FurnitureItem) => window.dispatchEvent(new CustomEvent('room-add-item', { detail: item }))} />
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 bg-black rounded-2xl overflow-hidden relative" style={{ border: '1px solid var(--ar-border)' }}>
              {!capturedImage ? (
                <>
                  {mode === 'camera' ? <ARCamera selectedItem={selectedItem} onCapture={handleCapture} facingMode={facingMode} /> : <ImageUploadMode selectedItem={selectedItem} />}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                  {/* Top-left: camera label */}
                  {mode === 'camera' && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 backdrop-blur-md" style={{ background: 'var(--ar-glass)', border: '1px solid var(--ar-glass-border)', color: 'var(--ar-text-2)' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: facingMode === 'user' ? 'var(--ar-success)' : 'var(--ar-warning)' }} />
                      {facingMode === 'user' ? 'インカメラ' : 'アウトカメラ'}
                    </div>
                  )}

                  {/* Top-right controls */}
                  {mode === 'camera' && (
                    <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                      <button onClick={toggleCamera} className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all" style={{ background: 'var(--ar-glass)', border: '1px solid var(--ar-glass-border)', color: 'var(--ar-text)' }}>
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                      <button onClick={doAICapture} className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all" style={{ background: 'linear-gradient(135deg, rgba(66,133,244,0.3), rgba(52,168,83,0.3))', border: '1px solid rgba(66,133,244,0.3)', color: '#fff' }}>
                        <Scan className="w-4 h-4" />
                      </button>
                      {/* Quick gallery import button */}
                      <button onClick={() => galleryInputRef.current?.click()} className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all" style={{ background: 'linear-gradient(135deg, var(--ar-accent-glow), var(--ar-accent-2-glow))', border: '1px solid var(--ar-glass-border)', color: 'var(--ar-accent)' }} title="画像を取り込んで装着">
                        <ImagePlus className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Bottom controls */}
                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4 z-10">
                    <button onClick={() => setShowSelector(!showSelector)} className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all" style={{ background: showSelector ? 'var(--ar-accent)' : 'var(--ar-glass)', border: '1px solid var(--ar-glass-border)', color: showSelector ? '#fff' : 'var(--ar-text-2)' }}>
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                    <button onClick={doCapture} className="w-16 h-16 rounded-full flex items-center justify-center active:scale-90 transition-all" style={{ background: mode === 'camera' ? 'linear-gradient(135deg, var(--ar-accent), var(--ar-accent-2))' : 'linear-gradient(135deg, var(--ar-success), #45B7D1)', boxShadow: '0 4px 24px var(--ar-accent-glow), inset 0 1px 0 rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.2)' }}>
                      {mode === 'camera' ? <Camera className="w-6 h-6 text-white" /> : <Download className="w-6 h-6 text-white" />}
                    </button>
                    {mode === 'camera' ? (
                      <button onClick={() => galleryInputRef.current?.click()} className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all" style={{ background: 'var(--ar-glass)', border: '1px solid var(--ar-glass-border)', color: 'var(--ar-accent)' }} title="画像を取り込む">
                        <ImagePlus className="w-4 h-4" />
                      </button>
                    ) : <div className="w-11 h-11" />}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4" style={{ background: 'var(--ar-bg)' }}>
                  <img src={capturedImage} alt="Captured" className="max-w-full max-h-[calc(100%-90px)] object-contain rounded-xl" style={{ border: '1px solid var(--ar-border)' }} />
                  <div className="flex gap-3 mt-5">
                    <button onClick={handleDownload} className="px-5 py-2.5 rounded-full font-medium flex items-center gap-2 text-sm text-white active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, var(--ar-success), #45B7D1)' }}><Download className="w-4 h-4" />保存</button>
                    <button onClick={handleReset} className="px-5 py-2.5 rounded-full font-medium flex items-center gap-2 text-sm active:scale-95 transition-all" style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}><RotateCcw className="w-4 h-4" />戻る</button>
                  </div>
                </div>
              )}
            </div>

            {showSelector && !capturedImage && (
              <>
                <div className="sm:hidden fixed inset-0 z-20" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowSelector(false)} />
                <div className="fixed inset-x-0 bottom-0 z-30 sm:relative sm:z-auto sm:inset-auto sm:w-80 max-h-[70vh] sm:max-h-none overflow-y-auto rounded-t-2xl sm:rounded-2xl" style={{ background: 'var(--ar-surface)', border: '1px solid var(--ar-border)' }}>
                  <div className="sm:hidden flex justify-center pt-2.5 pb-1 sticky top-0 z-10" style={{ background: 'var(--ar-surface)' }}><div className="w-10 h-1 rounded-full" style={{ background: 'var(--ar-surface-3)' }} /></div>
                  <ItemSelector items={allItems} selectedItem={selectedItem.id}
                    onSelectItem={(item) => { handleSelectItem(item); if (window.innerWidth < 640 && item) setShowSelector(false); }}
                    onAddCustomItem={handleAddCustomItem} onRemoveCustomItem={handleRemoveCustomItem} />
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* AI Recognition Modal */}
      {aiCaptureImage && <AIRecognition imageData={aiCaptureImage} onClose={() => setAiCaptureImage(null)} onUseCutout={handleAICutout} />}

      {/* Direct cutout from AI */}
      {directCutoutImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full h-full sm:max-w-lg sm:max-h-[85vh] sm:rounded-2xl overflow-hidden" style={{ background: 'var(--ar-surface)' }}>
            <SmartCutout imageSrc={directCutoutImage} onComplete={handleDirectCutoutComplete} onCancel={() => setDirectCutoutImage(null)} />
          </div>
        </div>
      )}

      {/* Quick Import: Cutout step */}
      {quickImportStep === 'cutout' && quickImportImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full h-full sm:max-w-lg sm:max-h-[85vh] sm:rounded-2xl overflow-hidden" style={{ background: 'var(--ar-surface)' }}>
            <SmartCutout imageSrc={quickImportImage} onComplete={handleQuickCutoutDone} onCancel={cancelQuickImport} />
          </div>
        </div>
      )}

      {/* Quick Import: Type select step */}
      {quickImportStep === 'type' && quickImportCutout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-5" style={{ background: 'var(--ar-surface)', border: '1px solid var(--ar-border)' }}>
            {/* Preview */}
            <div className="flex justify-center mb-4">
              <div className="rounded-xl p-3 inline-flex" style={{ background: 'repeating-conic-gradient(var(--ar-surface-2) 0% 25%, var(--ar-surface-3) 0% 50%) 50% / 16px 16px', border: '1px solid var(--ar-border)' }}>
                <img src={quickImportCutout} alt="" className="max-h-24 object-contain" />
              </div>
            </div>

            <h3 className="text-sm font-bold text-center mb-3" style={{ color: 'var(--ar-text)' }}>装着タイプを選択</h3>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {([
                { key: 'glasses', label: '眼鏡', emoji: '👓' },
                { key: 'necklace', label: 'ネックレス', emoji: '📿' },
                { key: 'earrings', label: 'ピアス', emoji: '💎' },
                { key: 'hat', label: '帽子', emoji: '🎩' },
              ] as const).map(({ key, label, emoji }) => (
                <button key={key} onClick={() => setQuickImportType(key)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs transition-all active:scale-95"
                  style={{
                    background: quickImportType === key ? 'var(--ar-accent)' : 'var(--ar-surface-2)',
                    color: quickImportType === key ? '#fff' : 'var(--ar-text-muted)',
                    border: quickImportType === key ? '1px solid var(--ar-accent)' : '1px solid var(--ar-border)',
                    boxShadow: quickImportType === key ? '0 2px 8px var(--ar-accent-glow)' : 'none',
                  }}>
                  <span className="text-lg">{emoji}</span>
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={cancelQuickImport} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}>キャンセル</button>
              <button onClick={handleQuickImportFinish} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white active:scale-95 transition-all" style={{ background: 'var(--ar-accent)', boxShadow: '0 2px 12px var(--ar-accent-glow)' }}>装着する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
