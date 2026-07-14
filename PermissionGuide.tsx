import { useState } from 'react';
import { Search, Scissors, ExternalLink, X, Share2, Sparkles } from 'lucide-react';

interface AIRecognitionProps {
  imageData: string;
  onClose: () => void;
  onUseCutout: (imageData: string) => void;
}

export function AIRecognition({ imageData, onClose, onUseCutout }: AIRecognitionProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleGoogleLens = async () => {
    // Try Web Share API first (best on mobile)
    if (navigator.share && navigator.canShare) {
      try {
        setIsSharing(true);
        const blob = await (await fetch(imageData)).blob();
        const file = new File([blob], 'ar-capture.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'AR Try-On 商品検索',
            text: 'この商品をGoogleレンズで検索',
            files: [file],
          });
          setIsSharing(false);
          return;
        }
      } catch {
        // User cancelled or not supported
      }
      setIsSharing(false);
    }
    // Fallback: open Google Lens page
    window.open('https://lens.google.com/', '_blank');
  };

  const handleGoogleImageSearch = () => {
    window.open('https://images.google.com/', '_blank');
  };

  const handleGoogleSearch = (query: string) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`, '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `ai-capture-${Date.now()}.png`;
    link.click();
  };

  const suggestions = [
    'サングラス おしゃれ',
    'メガネ トレンド',
    'ネックレス レディース',
    '帽子 夏',
    'ピアス 人気',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div
        className="w-full sm:max-w-sm max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        style={{ background: 'var(--ar-surface)', border: '1px solid var(--ar-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid var(--ar-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--ar-accent-glow)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--ar-accent)' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--ar-text)' }}>AI認識 & 検索</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--ar-text-muted)' }}><X className="w-5 h-5" /></button>
        </div>

        {/* Captured image */}
        <div className="p-3">
          <div className="rounded-xl overflow-hidden mb-3" style={{ border: '1px solid var(--ar-border)' }}>
            <img src={imageData} alt="Captured" className="w-full aspect-video object-cover" />
          </div>

          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={handleGoogleLens}
              disabled={isSharing}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', color: '#fff' }}
            >
              <Search className="w-5 h-5" />
              <span className="text-xs font-medium">Googleレンズ</span>
              <span className="text-[9px] opacity-70">画像で検索</span>
            </button>
            <button
              onClick={() => onUseCutout(imageData)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, var(--ar-accent), var(--ar-accent-2))', color: '#fff' }}
            >
              <Scissors className="w-5 h-5" />
              <span className="text-xs font-medium">切り抜いて試着</span>
              <span className="text-[9px] opacity-70">背景を除去</span>
            </button>
          </div>

          {/* Google Shopping quick search */}
          <div className="mb-3">
            <p className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--ar-text-muted)' }}>
              🛒 Google ショッピングで検索
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map(q => (
                <button
                  key={q}
                  onClick={() => handleGoogleSearch(q)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium transition-all active:scale-95"
                  style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button
              onClick={handleGoogleImageSearch}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
              style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}
            >
              <Search className="w-3.5 h-3.5" />
              Google画像検索
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
              style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}
            >
              <Share2 className="w-3.5 h-3.5" />
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
