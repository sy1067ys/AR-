import { useState, useRef } from 'react';
import { Upload, X, Plus, Scissors, Image } from 'lucide-react';
import { TryOnItem } from '../data/items';
import { SampleGallery } from './SampleGallery';
import { SmartCutout } from './SmartCutout';
import * as Dialog from '@radix-ui/react-dialog';

interface CustomItemUploadProps {
  onAddItem: (item: TryOnItem) => void;
}

type Step = 'upload' | 'cutout' | 'details';

export function CustomItemUpload({ onAddItem }: CustomItemUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [cutoutImage, setCutoutImage] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<'glasses' | 'necklace' | 'earrings' | 'hat'>('glasses');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setRawImage(null);
    setCutoutImage(null);
    setItemName('');
    setItemType('glasses');
  };

  const handleSelectSample = (image: string, name: string, type: 'glasses' | 'necklace' | 'earrings' | 'hat') => {
    setCutoutImage(image);
    setItemName(name);
    setItemType(type);
    setStep('details');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const src = ev.target?.result as string;
      setRawImage(src);
      setStep('cutout');
      // Auto-set name from filename
      const name = file.name.replace(/\.[^.]+$/, '');
      if (!itemName) setItemName(name);
    };
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCutoutComplete = (dataUrl: string) => {
    setCutoutImage(dataUrl);
    setStep('details');
  };

  const handleSkipCutout = () => {
    setCutoutImage(rawImage);
    setStep('details');
  };

  const handleAddItem = () => {
    if (!cutoutImage || !itemName) return;
    const map: Record<string, string> = { glasses: '眼鏡', necklace: 'ネックレス', earrings: 'ピアス', hat: '帽子' };
    onAddItem({ id: `custom-${Date.now()}`, name: itemName, type: itemType, image: cutoutImage, category: map[itemType] || '眼鏡' });
    reset();
    setIsOpen(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset(); }}>
      <Dialog.Trigger asChild>
        <button
          className="w-full py-2 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, var(--ar-accent), var(--ar-accent-2))',
            color: '#fff',
            boxShadow: '0 2px 12px var(--ar-accent-glow)',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          写真から切り抜いて追加
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
        <Dialog.Content
          className="fixed inset-2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:max-h-[90vh] rounded-2xl z-50 flex flex-col overflow-hidden"
          style={{ background: 'var(--ar-surface)', border: '1px solid var(--ar-border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--ar-border)' }}>
            <div className="flex items-center gap-2">
              <Dialog.Title className="text-sm font-bold" style={{ color: 'var(--ar-text)' }}>
                {step === 'upload' && '画像を選択'}
                {step === 'cutout' && 'スマート切り抜き'}
                {step === 'details' && '商品情報'}
              </Dialog.Title>
              {/* Step indicator */}
              <div className="flex items-center gap-1">
                {['upload', 'cutout', 'details'].map((s, i) => (
                  <div
                    key={s}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{
                      background: s === step ? 'var(--ar-accent)' : 'var(--ar-surface-3)',
                      transform: s === step ? 'scale(1.3)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
            <Dialog.Close asChild>
              <button style={{ color: 'var(--ar-text-muted)' }}><X className="w-5 h-5" /></button>
            </Dialog.Close>
          </div>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--ar-accent-glow)' }}
              >
                <Scissors className="w-10 h-10" style={{ color: 'var(--ar-accent)' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ar-text)' }}>
                  写真から切り抜き
                </p>
                <p className="text-xs" style={{ color: 'var(--ar-text-muted)' }}>
                  商品の写真をアップロードすると<br />背景を自動で除去して試着に使えます
                </p>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xs py-3 rounded-2xl font-medium text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, var(--ar-accent), var(--ar-accent-2))', boxShadow: '0 4px 16px var(--ar-accent-glow)' }}
              >
                <Upload className="w-4 h-4" />
                写真をアップロード
              </button>

              <div className="flex items-center gap-3 w-full max-w-xs">
                <div className="flex-1 h-px" style={{ background: 'var(--ar-border)' }} />
                <span className="text-[10px]" style={{ color: 'var(--ar-text-muted)' }}>または</span>
                <div className="flex-1 h-px" style={{ background: 'var(--ar-border)' }} />
              </div>

              <SampleGallery onSelectSample={handleSelectSample} />
            </div>
          )}

          {/* Step 2: Cutout editor */}
          {step === 'cutout' && rawImage && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <SmartCutout
                imageSrc={rawImage}
                onComplete={handleCutoutComplete}
                onCancel={() => setStep('upload')}
              />
              {/* Skip cutout option */}
              <div className="p-2 text-center flex-shrink-0" style={{ borderTop: '1px solid var(--ar-border)' }}>
                <button
                  onClick={handleSkipCutout}
                  className="text-xs"
                  style={{ color: 'var(--ar-text-muted)' }}
                >
                  切り抜きをスキップしてそのまま使う →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 'details' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Preview */}
              {cutoutImage && (
                <div className="flex justify-center">
                  <div
                    className="relative rounded-xl p-3 inline-flex"
                    style={{
                      background: 'repeating-conic-gradient(var(--ar-surface-2) 0% 25%, var(--ar-surface-3) 0% 50%) 50% / 16px 16px',
                      border: '1px solid var(--ar-border)',
                    }}
                  >
                    <img src={cutoutImage} alt="Preview" className="max-h-32 object-contain" />
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--ar-text-2)' }}>商品名</label>
                <input
                  type="text" value={itemName} onChange={(e) => setItemName(e.target.value)}
                  placeholder="例: お気に入りのサングラス"
                  className="w-full px-3 py-2.5 rounded-xl text-sm mt-1 outline-none"
                  style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text)', border: '1px solid var(--ar-border)' }}
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--ar-text-2)' }}>装着タイプ</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {([
                    { key: 'glasses', label: '眼鏡', emoji: '👓' },
                    { key: 'necklace', label: 'ネックレス', emoji: '📿' },
                    { key: 'earrings', label: 'ピアス', emoji: '💎' },
                    { key: 'hat', label: '帽子', emoji: '🎩' },
                  ] as const).map(({ key, label, emoji }) => (
                    <button
                      key={key}
                      onClick={() => setItemType(key)}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs transition-all"
                      style={{
                        background: itemType === key ? 'var(--ar-accent)' : 'var(--ar-surface-2)',
                        color: itemType === key ? '#fff' : 'var(--ar-text-muted)',
                        border: itemType === key ? '1px solid var(--ar-accent)' : '1px solid var(--ar-border)',
                        boxShadow: itemType === key ? '0 2px 8px var(--ar-accent-glow)' : 'none',
                      }}
                    >
                      <span className="text-base">{emoji}</span>
                      <span className="text-[10px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tip */}
              <div
                className="flex items-start gap-2 p-2.5 rounded-xl"
                style={{ background: 'var(--ar-surface-2)', border: '1px solid var(--ar-border)' }}
              >
                <span className="text-sm">💡</span>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--ar-text-muted)' }}>
                  装着タイプで配置位置が変わります。眼鏡は目の位置、帽子は頭部、ネックレスは首元に自動配置されます。
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setStep('upload'); setCutoutImage(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}
                >
                  やり直す
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!cutoutImage || !itemName}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all active:scale-95"
                  style={{ background: 'var(--ar-accent)', boxShadow: '0 2px 12px var(--ar-accent-glow)' }}
                >
                  追加する
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
