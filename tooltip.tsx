import { TryOnItem } from '../data/items';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { CustomItemUpload } from './CustomItemUpload';
import { Trash2, Check } from 'lucide-react';

interface ItemSelectorProps {
  items: TryOnItem[];
  selectedItem: string | null;
  onSelectItem: (item: TryOnItem | null) => void;
  onAddCustomItem: (item: TryOnItem) => void;
  onRemoveCustomItem?: (itemId: string) => void;
}

export function ItemSelector({ items, selectedItem, onSelectItem, onAddCustomItem, onRemoveCustomItem }: ItemSelectorProps) {
  const categories = Array.from(new Set(items.map(item => item.category)));
  const isCustomItem = (itemId: string) => itemId.startsWith('custom-');

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-3">
        <h2 className="font-bold text-sm sm:text-base mb-2.5" style={{ color: 'var(--ar-text)' }}>
          アイテム
        </h2>
        <CustomItemUpload onAddItem={onAddCustomItem} />
      </div>

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList
          className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-hide"
        >
          {categories.map(category => (
            <TabsTrigger
              key={category}
              value={category}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                // Radix handles data-state=active
              }}
              data-slot="category-tab"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        <style>{`
          [data-slot="category-tab"] {
            background: var(--ar-surface-2);
            color: var(--ar-text-muted);
          }
          [data-slot="category-tab"][data-state="active"] {
            background: var(--ar-accent);
            color: #fff;
            box-shadow: 0 2px 8px var(--ar-accent-glow);
          }
        `}</style>
        {categories.map(category => (
          <TabsContent key={category} value={category} className="mt-1">
            <div className="grid grid-cols-4 sm:grid-cols-3 gap-2">
              {items
                .filter(item => item.category === category)
                .map(item => {
                  const isActive = selectedItem === item.id;
                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => onSelectItem(isActive ? null : item)}
                        className="relative aspect-square rounded-xl w-full overflow-hidden transition-all duration-200"
                        style={{
                          background: 'var(--ar-surface-2)',
                          border: isActive ? '2px solid var(--ar-accent)' : '2px solid var(--ar-border)',
                          boxShadow: isActive ? '0 0 16px var(--ar-accent-glow)' : 'none',
                          transform: isActive ? 'scale(1.02)' : 'scale(1)',
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain p-1.5"
                        />
                        {/* Name label */}
                        <div
                          className="absolute bottom-0 left-0 right-0 py-0.5 px-1 text-center"
                          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
                        >
                          <span className="text-[9px] sm:text-[10px] text-white truncate block font-medium">
                            {item.name}
                          </span>
                        </div>
                        {/* Check indicator */}
                        {isActive && (
                          <div
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--ar-accent)' }}
                          >
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                      {/* Delete button for custom items */}
                      {isCustomItem(item.id) && onRemoveCustomItem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`${item.name}を削除しますか？`)) onRemoveCustomItem(item.id);
                          }}
                          className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center z-10 transition-opacity opacity-0 group-hover:opacity-100"
                          style={{ background: 'var(--destructive)', color: '#fff' }}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {selectedItem && (
        <button
          onClick={() => onSelectItem(null)}
          className="mt-3 w-full py-2 rounded-xl text-xs font-medium transition-all"
          style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-accent-2)', border: '1px solid var(--ar-border)' }}
        >
          選択を解除
        </button>
      )}
    </div>
  );
}
