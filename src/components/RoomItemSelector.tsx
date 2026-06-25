import { useState } from 'react';
import { Upload, Plus } from 'lucide-react';
import { FurnitureItem, furnitureItems } from '../data/items';

const CATEGORIES = ['すべて', 'ソファ', 'チェア', 'テーブル', '照明', '植物', '収納', '家電', 'ベッド', 'ラグ'];

interface Props { onAddItem: (item: FurnitureItem) => void; }

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
        const w = Math.min(200, img.naturalWidth);
        setCustomItems(prev => [...prev, {
          id: `custom-${Date.now()}`, name: file.name.replace(/\.[^.]+$/, ''),
          category: 'カスタム', image: ev.target?.result as string, defaultWidth: w, defaultHeight: Math.round(w / aspect),
        }]);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full max-h-[60vh] sm:max-h-full" style={{ background: 'var(--ar-surface)' }}>
      <div className="p-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--ar-border)' }}>
        <h2 className="font-bold text-xs mb-1.5" style={{ color: 'var(--ar-text)' }}>家具・インテリア</h2>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium transition-all"
              style={{
                background: category === cat ? 'var(--ar-accent)' : 'var(--ar-surface-2)',
                color: category === cat ? '#fff' : 'var(--ar-text-muted)',
                boxShadow: category === cat ? '0 2px 8px var(--ar-accent-glow)' : 'none',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-3 sm:grid-cols-2 gap-1.5 content-start">
        <label
          className="flex flex-col items-center justify-center gap-1 rounded-xl p-2 cursor-pointer min-h-[70px] transition-all"
          style={{ background: 'var(--ar-surface-2)', border: '2px dashed var(--ar-surface-3)' }}
        >
          <Upload className="w-4 h-4" style={{ color: 'var(--ar-text-muted)' }} />
          <span className="text-[10px]" style={{ color: 'var(--ar-text-muted)' }}>アップロード</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
        </label>

        {filtered.map(item => (
          <button
            key={item.id}
            onClick={() => onAddItem(item)}
            className="flex flex-col items-center gap-0.5 rounded-xl p-1.5 transition-all group min-h-[70px]"
            style={{ background: 'var(--ar-surface-2)', border: '1px solid var(--ar-border)' }}
          >
            <div className="w-full flex-1 flex items-center justify-center">
              <img src={item.image} alt={item.name} className="max-w-full max-h-10 sm:max-h-14 object-contain" />
            </div>
            <span className="text-[10px] truncate w-full text-center" style={{ color: 'var(--ar-text-2)' }}>
              {item.name}
            </span>
          </button>
        ))}
      </div>

      <div className="p-2 text-center flex-shrink-0" style={{ borderTop: '1px solid var(--ar-border)' }}>
        <p className="text-[10px]" style={{ color: 'var(--ar-text-muted)' }}>タップで追加 · ドラッグで移動</p>
      </div>
    </div>
  );
}
