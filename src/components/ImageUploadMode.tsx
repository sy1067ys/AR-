import { useRef, useState, useEffect } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';
import { Upload } from 'lucide-react';

interface ImageUploadModeProps {
  selectedItem: {
    type: 'glasses' | 'necklace' | 'earrings' | 'hat' | null;
    image: string | null;
  };
}

export function ImageUploadMode({ selectedItem }: ImageUploadModeProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const det = await faceLandmarksDetection.createDetector(model, {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        refineLandmarks: true,
      } as any);
      setDetector(det);
    };
    loadModel();
  }, []);

  useEffect(() => {
    if (uploadedImage && detector) processImage();
  }, [uploadedImage, selectedItem, detector]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!uploadedImage || !detector || !canvasRef.current || !imageRef.current) return;
    setIsProcessing(true);
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      try {
        const faces = await detector.estimateFaces(img, { flipHorizontal: false });
        if (faces.length > 0 && selectedItem.image && selectedItem.type) {
          drawItem(ctx, faces[0], selectedItem.type, selectedItem.image);
        }
      } catch {}
      setIsProcessing(false);
    };
  };

  const drawItem = (ctx: CanvasRenderingContext2D, face: faceLandmarksDetection.Face, type: string, imageUrl: string) => {
    const kp = face.keypoints;
    const img = new Image();
    img.src = imageUrl;

    if (type === 'glasses') {
      const leftEye = kp[33], rightEye = kp[263];
      const d = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2));
      const w = d * 2.5, h = w * 0.4;
      const cx = (leftEye.x + rightEye.x) / 2, cy = (leftEye.y + rightEye.y) / 2;
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    } else if (type === 'necklace') {
      const chin = kp[152];
      ctx.drawImage(img, chin.x - 100, chin.y + 50, 200, 100);
    } else if (type === 'earrings') {
      const l = kp[234], r = kp[454];
      ctx.drawImage(img, l.x - 20, l.y, 40, 40);
      ctx.drawImage(img, r.x - 20, r.y, 40, 40);
    } else if (type === 'hat') {
      const fh = kp[10], le = kp[33], re = kp[263];
      const fw = Math.abs(re.x - le.x) * 2.5;
      const hw = fw * 1.3, hh = hw * 0.8;
      ctx.drawImage(img, fh.x - hw / 2, fh.y - hh, hw, hh);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      {!uploadedImage ? (
        <div className="text-center p-6">
          <Upload className="w-12 h-12 sm:w-20 sm:h-20 mx-auto text-blue-400 mb-3" />
          <h3 className="text-lg sm:text-2xl font-bold text-white mb-1">写真をアップロード</h3>
          <p className="text-xs sm:text-sm text-gray-400 mb-4">顔が写っている写真を選択</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold text-sm sm:text-lg shadow-lg"
          >
            写真を選択
          </button>
        </div>
      ) : (
        <>
          <div className="w-full h-full flex items-center justify-center p-2">
            <img ref={imageRef} src={uploadedImage} alt="Uploaded" className="hidden" />
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setUploadedImage(null)}
              className="px-3 py-1.5 sm:px-6 sm:py-3 bg-white/90 text-gray-800 rounded-full shadow-lg text-xs sm:text-sm font-medium"
            >
              別の写真
            </button>
          </div>
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">処理中...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
