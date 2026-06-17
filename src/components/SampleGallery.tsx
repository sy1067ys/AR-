import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Image, X } from 'lucide-react';

const sampleImages = [
  {
    id: 'sample-1',
    name: 'サンプル眼鏡1',
    type: 'glasses' as const,
    category: '眼鏡',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB4PSIxMCIgeT0iMjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI0MCIgcng9IjIwIiBzdHJva2U9IiMyMzFmMjAiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0icmdiYSgwLDAsMCwwLjEpIi8+CjxyZWN0IHg9IjEyMCIgeT0iMjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI0MCIgcng9IjIwIiBzdHJva2U9IiMyMzFmMjAiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0icmdiYSgwLDAsMCwwLjEpIi8+CjxsaW5lIHgxPSI4MCIgeTE9IjQwIiB4Mj0iMTIwIiB5Mj0iNDAiIHN0cm9rZT0iIzIzMWYyMCIgc3Ryb2tlLXdpZHRoPSIzIi8+Cjwvc3ZnPg==',
  },
  {
    id: 'sample-2',
    name: 'サンプルサングラス',
    type: 'glasses' as const,
    category: '眼鏡',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB4PSIxMCIgeT0iMjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI0MCIgcng9IjE1IiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0icmdiYSgwLDAsMCwwLjcpIi8+CjxyZWN0IHg9IjEyMCIgeT0iMjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI0MCIgcng9IjE1IiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0icmdiYSgwLDAsMCwwLjcpIi8+CjxsaW5lIHgxPSI4MCIgeTE9IjQwIiB4Mj0iMTIwIiB5Mj0iNDAiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSI0Ii8+Cjwvc3ZnPg==',
  },
];

interface SampleGalleryProps {
  onSelectSample: (image: string, name: string, type: 'glasses' | 'necklace' | 'earrings' | 'hat') => void;
}

export function SampleGallery({ onSelectSample }: SampleGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="text-sm text-blue-600 hover:text-blue-700 underline flex items-center gap-1">
          <Image className="w-4 h-4" />
          サンプル画像を使う
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-gray-800">
              サンプル画像
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {sampleImages.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  onSelectSample(sample.image, sample.name, sample.type);
                  setIsOpen(false);
                }}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-all hover:scale-105"
              >
                <img
                  src={sample.image}
                  alt={sample.name}
                  className="w-full h-32 object-contain mb-2"
                />
                <p className="text-sm font-medium text-gray-800">{sample.name}</p>
                <p className="text-xs text-gray-500">{sample.category}</p>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
