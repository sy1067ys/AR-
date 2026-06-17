import { TryOnItem } from '../data/items';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { CustomItemUpload } from './CustomItemUpload';
import { Trash2 } from 'lucide-react';

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
  const customItemsCount = items.filter(item => isCustomItem(item.id)).length;

  return (
    <div className="bg-white sm:rounded-lg sm:shadow-lg p-3 sm:p-4">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-sm sm:text-lg text-gray-800">アイテムを選択</h2>
          {customItemsCount > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              カスタム: {customItemsCount}
            </span>
          )}
        </div>
        <CustomItemUpload onAddItem={onAddCustomItem} />
      </div>

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="flex gap-1 sm:gap-2 mb-3 border-b overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(category => (
            <TabsTrigger
              key={category}
              value={category}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-t-lg text-xs sm:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map(category => (
          <TabsContent key={category} value={category} className="mt-2">
            <div className="grid grid-cols-4 sm:grid-cols-3 gap-2 sm:gap-4">
              {items
                .filter(item => item.category === category)
                .map(item => (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => onSelectItem(selectedItem === item.id ? null : item)}
                      className={`relative aspect-square rounded-lg border-2 transition-all w-full ${
                        selectedItem === item.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain p-1 sm:p-2"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] sm:text-xs p-0.5 sm:p-1 rounded-b-lg truncate">
                        {item.name}
                      </div>
                      {selectedItem === item.id && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </button>
                    {isCustomItem(item.id) && onRemoveCustomItem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`${item.name}を削除しますか？`)) onRemoveCustomItem(item.id);
                        }}
                        className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg z-10"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      {selectedItem && (
        <button
          onClick={() => onSelectItem(null)}
          className="mt-3 w-full px-3 py-2 bg-red-500 text-white rounded-lg text-sm"
        >
          選択を解除
        </button>
      )}
    </div>
  );
}
