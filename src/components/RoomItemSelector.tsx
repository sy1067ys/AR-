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
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-3 border-b border-gray-700">
        <h2 className="font-bold text-sm text-gray-200 mb-2">家具・インテリアを追加</h2>
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
        {/* Custom upload card */}
        <label className="flex flex-col items-center justify-center gap-1 bg-gray-800 hover:bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg p-3 cursor-pointer transition-colors min-h-[90px]">
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400 text-center">画像を<br />アップロード</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
        </label>

        {filtered.map(item => (
          <button
            key={item.id}
            onClick={() => onAddItem(item)}
            className="flex flex-col items-center gap-1 bg-gray-800 hover:bg-indigo-900 border border-gray-700 hover:border-indigo-500 rounded-lg p-2 transition-all group min-h-[90px]"
          >
            <div className="w-full flex-1 flex items-center justify-center">
              <img
                src={item.image}
                alt={item.name}
                className="max-w-full max-h-16 object-contain"
              />
            </div>
            <div className="flex items-center gap-1 w-full justify-between">
              <span className="text-xs text-gray-300 group-hover:text-white truncate leading-tight">
                {item.name}
              </span>
              <Plus className="w-3 h-3 text-indigo-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xs text-gray-500 self-start">{item.category}</span>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 text-sm py-8">
            このカテゴリには<br />アイテムがありません
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-700 text-xs text-gray-500 text-center">
        アイテムをクリックして部屋に追加 · ドラッグで移動
      </div>
    </div>
  );
}
