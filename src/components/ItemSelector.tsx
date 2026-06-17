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
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg text-gray-800">アイテムを選択</h2>
          {customItemsCount > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              カスタム: {customItemsCount}
            </span>
          )}
        </div>
        <CustomItemUpload onAddItem={onAddCustomItem} />
      </div>

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="flex gap-2 mb-4 border-b overflow-x-auto">
          {categories.map(category => (
            <TabsTrigger
              key={category}
              value={category}
              className="px-4 py-2 rounded-t-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map(category => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              {items
                .filter(item => item.category === category)
                .map(item => (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => onSelectItem(selectedItem === item.id ? null : item)}
                      className={`relative aspect-square rounded-lg border-2 transition-all hover:scale-105 w-full ${
                        selectedItem === item.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg truncate">
                        {item.name}
                      </div>
                      {selectedItem === item.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </button>
                    {isCustomItem(item.id) && onRemoveCustomItem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`${item.name}を削除しますか？`)) {
                            onRemoveCustomItem(item.id);
                          }
                        }}
                        className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg z-10"
                        title="削除"
                      >
                        <Trash2 className="w-3 h-3" />
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
          className="mt-4 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          選択を解除
        </button>
      )}
    </div>
  );
}
