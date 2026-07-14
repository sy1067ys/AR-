import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Image, X } from 'lucide-react';

const sampleImages = [
  {
    id: 'sample-1', name: 'サンプル眼鏡1', type: 'glasses' as const, category: '眼鏡',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB4PSIxMCIgeT0iMjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI0MCIgcng9IjIwIiBzdHJva2U9IiMyMzFmMjAiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0icmdiYSgwLDAsMCwwLjEpIi8+CjxyZWN0IHg9IjEyMCIgeT0iMjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI0MCIgcng9IjIwIiBzdHJva2U9IiMyMzFmMjAiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0icmdiYSgwLDAsMCwwLjEpIi8+CjxsaW5lIHgxPSI4MCIgeTE9IjQwIiB4Mj0iMTIwIiB5Mj0iNDAiIHN0cm9rZT0iIzIzMWYyMCIgc3Ryb2tlLXdpZHRoPSIzIi8+Cjwvc3ZnPg==',
  },
  {
    id: 'sample-2', name: 'サンプルサングラス', type: 'glasses' as const, category: '眼鏡',
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
        <button className="text-[10px] sm:text-xs flex items-center gap-0.5" style={{ color: 'var(--ar-accent)' }}>
          <Image className="w-3 h-3" />
          サンプル
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-4 w-[calc(100%-2rem)] max-w-sm z-50"
          style={{ background: 'var(--ar-surface)', border: '1px solid var(--ar-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-sm font-bold" style={{ color: 'var(--ar-text)' }}>サンプル画像</Dialog.Title>
            <Dialog.Close asChild><button style={{ color: 'var(--ar-text-muted)' }}><X className="w-4 h-4" /></button></Dialog.Close>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sampleImages.map(s => (
              <button
                key={s.id}
                onClick={() => { onSelectSample(s.image, s.name, s.type); setIsOpen(false); }}
                className="rounded-xl p-3 transition-all active:scale-95"
                style={{ background: 'var(--ar-surface-2)', border: '1px solid var(--ar-border)' }}
              >
                <img src={s.image} alt={s.name} className="w-full h-20 object-contain mb-1" />
                <p className="text-xs font-medium" style={{ color: 'var(--ar-text)' }}>{s.name}</p>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
