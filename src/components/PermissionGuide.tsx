import { Camera, Upload, Sofa, Search, Sparkles } from 'lucide-react';

interface PermissionGuideProps {
  onRequestPermission: () => void;
  onUseUploadMode?: () => void;
  onUseRoomMode?: () => void;
  onUseAISearch?: () => void;
}

export function PermissionGuide({ onRequestPermission, onUseUploadMode, onUseRoomMode, onUseAISearch }: PermissionGuideProps) {
  return (
    <div className="flex items-start sm:items-center justify-center h-full p-4 overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Hero */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl mx-auto mb-5 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--ar-accent), var(--ar-accent-2))',
              boxShadow: '0 8px 32px var(--ar-accent-glow)',
            }}
          >
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--ar-text)' }}>
            AR Try-On
          </h2>
          <p className="text-sm" style={{ color: 'var(--ar-text-muted)' }}>
            バーチャル試着で自由にコーディネート
          </p>
        </div>

        {/* Privacy */}
        <div
          className="flex items-center gap-2.5 p-3 rounded-xl mb-6"
          style={{ background: 'var(--ar-surface)', border: '1px solid var(--ar-border)' }}
        >
          <span className="text-base">🔒</span>
          <p className="text-xs" style={{ color: 'var(--ar-text-muted)' }}>
            映像はデバイス上でのみ処理。サーバーへの送信はありません。
          </p>
        </div>

        {/* Main action buttons - 2x2 grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            onClick={onRequestPermission}
            className="flex flex-col items-center gap-2 py-5 rounded-2xl font-medium text-sm transition-all active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, var(--ar-accent), var(--ar-accent-2))',
              color: '#fff',
              boxShadow: '0 4px 20px var(--ar-accent-glow)',
            }}
          >
            <Camera className="w-7 h-7" />
            <span className="text-xs font-bold">カメラで試着</span>
          </button>

          {onUseUploadMode && (
            <button
              onClick={onUseUploadMode}
              className="flex flex-col items-center gap-2 py-5 rounded-2xl font-medium text-sm transition-all active:scale-[0.97]"
              style={{ background: 'var(--ar-surface)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}
            >
              <Upload className="w-7 h-7" style={{ color: 'var(--ar-accent)' }} />
              <span className="text-xs font-bold">写真から試着</span>
            </button>
          )}

          {onUseRoomMode && (
            <button
              onClick={onUseRoomMode}
              className="flex flex-col items-center gap-2 py-5 rounded-2xl font-medium text-sm transition-all active:scale-[0.97]"
              style={{ background: 'var(--ar-surface)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}
            >
              <Sofa className="w-7 h-7" style={{ color: 'var(--ar-success)' }} />
              <span className="text-xs font-bold">部屋コーデ</span>
            </button>
          )}

          {onUseAISearch && (
            <button
              onClick={onUseAISearch}
              className="flex flex-col items-center gap-2 py-5 rounded-2xl font-medium text-sm transition-all active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, rgba(66,133,244,0.15), rgba(52,168,83,0.15))',
                color: 'var(--ar-text-2)',
                border: '1px solid rgba(66,133,244,0.2)',
              }}
            >
              <Search className="w-7 h-7" style={{ color: '#4285F4' }} />
              <span className="text-xs font-bold">AI認識 & 検索</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
