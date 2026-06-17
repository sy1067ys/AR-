import { Camera, CheckCircle, Upload, Sofa } from 'lucide-react';

interface PermissionGuideProps {
  onRequestPermission: () => void;
  onUseUploadMode?: () => void;
  onUseRoomMode?: () => void;
}

export function PermissionGuide({ onRequestPermission, onUseUploadMode, onUseRoomMode }: PermissionGuideProps) {
  return (
    <div className="flex items-start sm:items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-8 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-5 sm:p-8">
        <div className="text-center mb-5 sm:mb-8">
          <div className="inline-block p-3 sm:p-4 bg-blue-100 rounded-full mb-3">
            <Camera className="w-10 h-10 sm:w-16 sm:h-16 text-blue-600" />
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-800 mb-1">AR試着を始めましょう</h2>
          <p className="text-sm sm:text-base text-gray-600">カメラへのアクセス許可が必要です</p>
        </div>

        <div className="space-y-3 mb-5 sm:mb-8">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">リアルタイム試着</h3>
              <p className="text-xs text-gray-600">眼鏡、アクセサリー、帽子をリアルタイムで試着</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">AIによる顔認識</h3>
              <p className="text-xs text-gray-600">高精度な顔認識で自然な装着感を実現</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">写真撮影・カスタム商品</h3>
              <p className="text-xs text-gray-600">撮影して保存、自分の商品画像もアップロード可能</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-5">
          <p className="text-xs text-yellow-700">
            🔒 カメラ映像はデバイス上でのみ処理され、サーバーに送信されません。
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRequestPermission}
            className="w-full px-6 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm sm:text-lg transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            カメラを許可して開始
          </button>

          {onUseUploadMode && (
            <button
              onClick={onUseUploadMode}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              画像アップロードで開始
            </button>
          )}

          {onUseRoomMode && (
            <button
              onClick={onUseRoomMode}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Sofa className="w-5 h-5" />
              部屋コーデで開始
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
