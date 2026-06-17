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
    setUploadedImage(image);
    setItemName(name);
    setItemType(type);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = () => {
    if (!uploadedImage || !itemName) {
      alert('商品名と画像を入力してください');
      return;
    }
    const categoryMap: Record<string, string> = { glasses: '眼鏡', necklace: 'ネックレス', earrings: 'ピアス', hat: '帽子' };
    onAddItem({
      id: `custom-${Date.now()}`,
      name: itemName,
      type: itemType,
      image: uploadedImage,
      category: categoryMap[itemType] || '眼鏡',
    });
    setUploadedImage(null);
    setItemName('');
    setItemType('glasses');
    setIsOpen(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg">
          <Plus className="w-4 h-4" />
          カスタム商品を追加
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed inset-x-3 top-[5%] sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:inset-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 sm:w-full sm:max-w-md z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg sm:text-2xl font-bold text-gray-800">カスタム商品を追加</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400"><X className="w-5 h-5" /></button>
            </Dialog.Close>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">商品画像</label>
                <SampleGallery onSelectSample={handleSelectSample} />
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center cursor-pointer"
              >
                {uploadedImage ? (
                  <div className="relative">
                    <img src={uploadedImage} alt="Uploaded" className="max-h-32 mx-auto object-contain" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-600">タップして画像を選択</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">商品名</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="例: サングラス"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">タイプ</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
              >
                <option value="glasses">眼鏡</option>
                <option value="necklace">ネックレス</option>
                <option value="earrings">ピアス</option>
                <option value="hat">帽子</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <Dialog.Close asChild>
                <button className="flex-1 px-3 py-2.5 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium">キャンセル</button>
              </Dialog.Close>
              <button
                onClick={handleAddItem}
                disabled={!uploadedImage || !itemName}
                className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:bg-gray-300"
              >
                追加
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
