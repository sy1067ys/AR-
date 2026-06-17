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
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        refineLandmarks: true,
      };
      const det = await faceLandmarksDetection.createDetector(model, detectorConfig);
      setDetector(det);
    };

    loadModel();
  }, []);

  useEffect(() => {
    if (uploadedImage && detector) {
      processImage();
    }
  }, [uploadedImage, selectedItem, detector]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
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
          const face = faces[0];
          drawItem(ctx, face, selectedItem.type, selectedItem.image);
        }

        setProcessedImage(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setIsProcessing(false);
      }
    };
  };

  const drawItem = (
    ctx: CanvasRenderingContext2D,
    face: faceLandmarksDetection.Face,
    type: string,
    imageUrl: string
  ) => {
    const keypoints = face.keypoints;

    if (type === 'glasses') {
      const leftEye = keypoints[33];
      const rightEye = keypoints[263];

      const eyeDistance = Math.sqrt(
        Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
      );

      const img = new Image();
      img.src = imageUrl;

      const glassesWidth = eyeDistance * 2.5;
      const glassesHeight = glassesWidth * 0.4;

      const centerX = (leftEye.x + rightEye.x) / 2;
      const centerY = (leftEye.y + rightEye.y) / 2;

      ctx.drawImage(
        img,
        centerX - glassesWidth / 2,
        centerY - glassesHeight / 2,
        glassesWidth,
        glassesHeight
      );
    } else if (type === 'necklace') {
      const chin = keypoints[152];
      const necklaceWidth = 200;
      const necklaceHeight = 100;

      const img = new Image();
      img.src = imageUrl;

      ctx.drawImage(
        img,
        chin.x - necklaceWidth / 2,
        chin.y + 50,
        necklaceWidth,
        necklaceHeight
      );
    } else if (type === 'earrings') {
      const leftEar = keypoints[234];
      const rightEar = keypoints[454];

      const img = new Image();
      img.src = imageUrl;

      const earringSize = 40;

      ctx.drawImage(img, leftEar.x - earringSize / 2, leftEar.y, earringSize, earringSize);
      ctx.drawImage(img, rightEar.x - earringSize / 2, rightEar.y, earringSize, earringSize);
    } else if (type === 'hat') {
      const forehead = keypoints[10];
      const leftEye = keypoints[33];
      const rightEye = keypoints[263];

      const faceWidth = Math.abs(rightEye.x - leftEye.x) * 2.5;
      const hatWidth = faceWidth * 1.3;
      const hatHeight = hatWidth * 0.8;

      const img = new Image();
      img.src = imageUrl;

      ctx.drawImage(
        img,
        forehead.x - hatWidth / 2,
        forehead.y - hatHeight,
        hatWidth,
        hatHeight
      );
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      {!uploadedImage ? (
        <div className="text-center p-8">
          <div className="mb-6">
            <Upload className="w-20 h-20 mx-auto text-blue-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">写真をアップロード</h3>
            <p className="text-gray-400">顔が写っている写真を選択してください</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg"
          >
            写真を選択
          </button>
          <p className="text-sm text-gray-500 mt-4">
            ※カメラが利用できない環境では、画像アップロードモードをご利用ください
          </p>
        </div>
      ) : (
        <>
          <div className="w-full h-full flex items-center justify-center p-4">
            <img
              ref={imageRef}
              src={uploadedImage}
              alt="Uploaded"
              className="hidden"
            />
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="absolute top-4 right-4">
            <button
              onClick={() => {
                setUploadedImage(null);
                setProcessedImage(null);
              }}
              className="px-6 py-3 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all hover:scale-105 font-medium"
            >
              別の写真を選択
            </button>
          </div>
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>画像を処理中...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
