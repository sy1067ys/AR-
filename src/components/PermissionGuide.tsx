import { Camera, CheckCircle, Upload, Sofa } from 'lucide-react';

interface PermissionGuideProps {
  onRequestPermission: () => void;
  onUseUploadMode?: () => void;
  onUseRoomMode?: () => void;
}

export function PermissionGuide({ onRequestPermission, onUseUploadMode, onUseRoomMode }: PermissionGuideProps) {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <Camera className="w-16 h-16 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">AR試着を始めましょう</h2>
          <p className="text-gray-600">カメラへのアクセス許可が必要です</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">リアルタイム試着</h3>
              <p className="text-sm text-gray-600">
                カメラを使って眼鏡、アクセサリー、帽子をリアルタイムで試着できます
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">AIによる顔認識</h3>
              <p className="text-sm text-gray-600">
                高精度な顔認識技術で自然な装着感を実現します
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">写真撮影可能</h3>
              <p className="text-sm text-gray-600">
                気に入ったスタイルを撮影して保存できます
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">カスタム商品対応</h3>
              <p className="text-sm text-gray-600">
                自分の商品画像をアップロードして試着できます
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            プライバシーについて
          </h4>
          <p className="text-sm text-yellow-700">
            カメラの映像はあなたのデバイス上でのみ処理され、サーバーに送信されることはありません。
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRequestPermission}
            className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3"
          >
            <Camera className="w-6 h-6" />
            カメラを許可して開始
          </button>

          {onUseUploadMode && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-gray-500 text-sm">または</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              <button
                onClick={onUseUploadMode}
                className="w-full px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3"
              >
                <Upload className="w-6 h-6" />
                画像アップロードモードで開始
              </button>
            </>
          )}

          {onUseRoomMode && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-gray-500 text-sm">または</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              <button
                onClick={onUseRoomMode}
                className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3"
              >
                <Sofa className="w-6 h-6" />
                部屋コーデモードで開始
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          {onUseUploadMode
            ? '※カメラが利用できない場合は、画像アップロードモードをご利用ください'
            : '※ブラウザの許可ダイアログで「許可」を選択してください'}
        </p>
      </div>
    </div>
  );
}
