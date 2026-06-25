import { Camera, Upload, Sofa, Scan, Palette, ImageIcon } from 'lucide-react';

interface PermissionGuideProps {
  onRequestPermission: () => void;
  onUseUploadMode?: () => void;
  onUseRoomMode?: () => void;
}

export function PermissionGuide({ onRequestPermission, onUseUploadMode, onUseRoomMode }: PermissionGuideProps) {
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
            <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--ar-text)' }}>
            AR Try-On
          </h2>
          <p className="text-sm" style={{ color: 'var(--ar-text-muted)' }}>
            バーチャルで試着、あなたの部屋をコーディネート
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-8">
          {[
            { icon: Scan, title: '顔認識', desc: 'AI検出', color: 'var(--ar-accent)' },
            { icon: Palette, title: 'スタイル', desc: '自由に試着', color: 'var(--ar-accent-2)' },
            { icon: ImageIcon, title: '部屋コーデ', desc: '家具配置', color: 'var(--ar-success)' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl text-center"
              style={{ background: 'var(--ar-surface)', border: '1px solid var(--ar-border)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--ar-text)' }}>{title}</p>
                <p className="text-[10px]" style={{ color: 'var(--ar-text-muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
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

        {/* Action buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onRequestPermission}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, var(--ar-accent), var(--ar-accent-2))',
              boxShadow: '0 4px 20px var(--ar-accent-glow)',
            }}
          >
            <Camera className="w-5 h-5" />
            カメラで始める
          </button>

          <div className="flex gap-2.5">
            {onUseUploadMode && (
              <button
                onClick={onUseUploadMode}
                className="flex-1 py-3 rounded-2xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
                style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}
              >
                <Upload className="w-4 h-4" />
                写真から試着
              </button>
            )}
            {onUseRoomMode && (
              <button
                onClick={onUseRoomMode}
                className="flex-1 py-3 rounded-2xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
                style={{ background: 'var(--ar-surface-2)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-border)' }}
              >
                <Sofa className="w-4 h-4" />
                部屋コーデ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
