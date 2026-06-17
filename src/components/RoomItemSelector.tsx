import { useState } from 'react';
import { Upload, Plus } from 'lucide-react';
import { FurnitureItem, furnitureItems } from '../data/items';

const CATEGORIES = ['すべて', 'ソファ', 'チェア', 'テーブル', '照明', '植物', '収納', '家電', 'ベッド', 'ラグ'];

interface Props {
  onAddItem: (item: FurnitureItem) => void;
}

export function RoomItemSelector({ onAddItem }: Props) {
  const [category, setCategory] = useState('すべて');
  const [customItems, setCustomItems] = useState<FurnitureItem[]>([]);

  const allItems = [...furnitureItems, ...customItems];
  const filtered = category === 'すべて' ? allItems : allItems.filter(i => i.category === category);

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const aspect = img.naturalWidth / img.naturalHeight;
        const defaultWidth = Math.min(200, img.naturalWidth);
        const defaultHeight = Math.round(defaultWidth / aspect);
        const item: FurnitureItem = {
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          category: 'カスタム',
          image: ev.target?.result as string,
          defaultWidth,
          defaultHeight,
        };
        setCustomItems(prev => [...prev, item]);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full max-h-[60vh] sm:max-h-full bg-gray-900 text-white">
      <div className="p-2 sm:p-3 border-b border-gray-700">
        <h2 className="font-bold text-xs sm:text-sm text-gray-200 mb-1.5">家具・インテリアを追加</h2>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-3 grid grid-cols-3 sm:grid-cols-2 gap-1.5 sm:gap-2 content-start">
        <label className="flex flex-col items-center justify-center gap-1 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-2 cursor-pointer min-h-[70px] sm:min-h-[90px]">
          <Upload className="w-4 h-4 text-gray-400" />
          <span className="text-[10px] sm:text-xs text-gray-400 text-center">アップロード</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
        </label>

        {filtered.map(item => (
          <button
            key={item.id}
            onClick={() => onAddItem(item)}
            className="flex flex-col items-center gap-0.5 bg-gray-800 border border-gray-700 rounded-lg p-1.5 sm:p-2 transition-all group min-h-[70px] sm:min-h-[90px]"
          >
            <div className="w-full flex-1 flex items-center justify-center">
              <img src={item.image} alt={item.name} className="max-w-full max-h-10 sm:max-h-16 object-contain" />
            </div>
            <span className="text-[10px] sm:text-xs text-gray-300 truncate w-full text-center leading-tight">
              {item.name}
            </span>
          </button>
        ))}
      </div>

      <div className="p-2 border-t border-gray-700 text-[10px] sm:text-xs text-gray-500 text-center">
        タップで追加 · ドラッグで移動
      </div>
    </div>
  );
}
