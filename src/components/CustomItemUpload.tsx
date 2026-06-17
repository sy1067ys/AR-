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
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = () => {
    if (!uploadedImage || !itemName) {
      alert('商品名と画像を入力してください');
      return;
    }

    const newItem: TryOnItem = {
      id: `custom-${Date.now()}`,
      name: itemName,
      type: itemType,
      image: uploadedImage,
      category: getCategoryName(itemType),
    };

    onAddItem(newItem);

    // Reset form
    setUploadedImage(null);
    setItemName('');
    setItemType('glasses');
    setIsOpen(false);
  };

  const getCategoryName = (type: string): string => {
    const categoryMap: Record<string, string> = {
      glasses: '眼鏡',
      necklace: 'ネックレス',
      earrings: 'ピアス',
      hat: '帽子',
    };
    return categoryMap[type] || '眼鏡';
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          カスタム商品を追加
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-gray-800">
              カスタム商品を追加
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  商品画像
                </label>
                <SampleGallery onSelectSample={handleSelectSample} />
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                {uploadedImage ? (
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Uploaded item"
                      className="max-h-48 mx-auto object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedImage(null);
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">クリックして画像を選択</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG対応</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                商品名
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="例: 私のお気に入りサングラス"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Item Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                商品タイプ
              </label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="glasses">眼鏡</option>
                <option value="necklace">ネックレス</option>
                <option value="earrings">ピアス</option>
                <option value="hat">帽子</option>
              </select>
            </div>

            {/* Item Type Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">タイプ別の配置位置</h4>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• <strong>眼鏡:</strong> 目の位置に配置されます</li>
                <li>• <strong>ネックレス:</strong> 首元に配置されます</li>
                <li>• <strong>ピアス:</strong> 両耳に配置されます</li>
                <li>• <strong>帽子:</strong> 頭部に配置されます</li>
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 text-sm">📌 画像の選び方</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 背景が透明なPNG画像が最適です</li>
                <li>• 商品が正面を向いている画像を選んでください</li>
                <li>• 高解像度の画像ほど綺麗に表示されます</li>
                <li>• 実際の商品写真やイラストが使えます</li>
                <li>• 写真フォルダから直接アップロード可能です</li>
                <li>• ECサイトの商品画像も使用できます</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2 text-sm">✨ 使用例</h4>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• 購入前の商品を事前に試着</li>
                <li>• 自分の眼鏡コレクションをデジタル化</li>
                <li>• オンラインショップの商品で試着</li>
                <li>• お気に入りのアクセサリーで組み合わせチェック</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Dialog.Close asChild>
                <button className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors">
                  キャンセル
                </button>
              </Dialog.Close>
              <button
                onClick={handleAddItem}
                disabled={!uploadedImage || !itemName}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
