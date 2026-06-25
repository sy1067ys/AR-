import { useState, useRef } from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { TryOnItem } from '../data/items';
import { SampleGallery } from './SampleGallery';
import * as Dialog from '@radix-ui/react-dialog';

interface CustomItemUploadProps {
  onAddItem: (item: TryOnItem) => void;
}

export function CustomItemUpload({ onAddItem }: CustomItemUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<'glasses' | 'necklace' | 'earrings' | 'hat'>('glasses');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectSample = (image: string, name: string, type: 'glasses' | 'necklace' | 'earrings' | 'hat') => {
    setUploadedImage(image); setItemName(name); setItemType(type);
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const r = new FileReader(); r.onload = (ev) => setUploadedImage(ev.target?.result as string); r.readAsDataURL(file); }
  };
  const handleAddItem = () => {
    if (!uploadedImage || !itemName) return;
    const map: Record<string, string> = { glasses: '眼鏡', necklace: 'ネックレス', earrings: 'ピアス', hat: '帽子' };
    onAddItem({ id: `custom-${Date.now()}`, name: itemName, type: itemType, image: uploadedImage, category: map[itemType] || '眼鏡' });
    setUploadedImage(null); setItemName(''); setItemType('glasses'); setIsOpen(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
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
          カスタム商品を追加
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
        <Dialog.Content
          className="fixed inset-x-3 top-[8%] sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:inset-auto rounded-2xl p-4 sm:p-5 sm:w-full sm:max-w-sm z-50 max-h-[85vh] overflow-y-auto"
          style={{ background: 'var(--ar-surface)', border: '1px solid var(--ar-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-bold" style={{ color: 'var(--ar-text)' }}>カスタム商品</Dialog.Title>
            <Dialog.Close asChild>
              <button style={{ color: 'var(--ar-text-muted)' }}><X className="w-5 h-5" /></button>
            </Dialog.Close>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium" style={{ color: 'var(--ar-text-2)' }}>画像</label>
                <SampleGallery onSelectSample={handleSelectSample} />
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl p-4 text-center cursor-pointer transition-all"
                style={{ border: '2px dashed var(--ar-surface-3)', background: 'var(--ar-surface-2)' }}
              >
                {uploadedImage ? (
                  <div className="relative">
                    <img src={uploadedImage} alt="" className="max-h-28 mx-auto object-contain" />
                    <button onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                      className="absolute top-0 right-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--destructive)' }}>
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 mx-auto mb-1" style={{ color: 'var(--ar-text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--ar-text-muted)' }}>タップして選択</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--ar-text-2)' }}>商品名</label>
              <input
                type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="例: サングラス"
                className="w-full px-3 py-2 rounded-xl text-sm mt-1 outline-none"
                style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text)', border: '1px solid var(--ar-border)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--ar-text-2)' }}>タイプ</label>
              <select
                value={itemType} onChange={(e) => setItemType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-sm mt-1 outline-none"
                style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text)', border: '1px solid var(--ar-border)' }}
              >
                <option value="glasses">眼鏡</option>
                <option value="necklace">ネックレス</option>
                <option value="earrings">ピアス</option>
                <option value="hat">帽子</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Dialog.Close asChild>
                <button className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}>
                  キャンセル
                </button>
              </Dialog.Close>
              <button onClick={handleAddItem} disabled={!uploadedImage || !itemName}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
                style={{ background: 'var(--ar-accent)' }}>
                追加
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
