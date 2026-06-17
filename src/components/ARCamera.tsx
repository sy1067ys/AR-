import { useEffect, useRef, useState } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';

interface ARCameraProps {
  selectedItem: {
    type: 'glasses' | 'necklace' | 'earrings' | 'hat' | null;
    image: string | null;
  };
  onCapture?: (imageData: string) => void;
}

export function ARCamera({ selectedItem, onCapture }: ARCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const animationFrameRef = useRef<number>();

  const initCamera = async () => {
    setCameraError(null);
    setHasPermission(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('カメラのアクセス許可が拒否されました。ブラウザの設定でカメラを許可してください。');
        } else if (error.name === 'NotFoundError') {
          setCameraError('カメラが見つかりませんでした。デバイスにカメラが接続されているか確認してください。');
        } else if (error.name === 'NotReadableError') {
          setCameraError('カメラが他のアプリケーションで使用中です。他のアプリを閉じて再試行してください。');
        } else {
          setCameraError(`カメラエラー: ${error.message}`);
        }
      }
    }
  };

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
      setIsModelLoaded(true);
    };

    initCamera();
    loadModel();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!detector || !isModelLoaded) return;

    const detectFace = async () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const faces = await detector.estimateFaces(video, { flipHorizontal: false });

        if (faces.length > 0 && selectedItem.image && selectedItem.type) {
          const face = faces[0];
          drawItem(ctx, face, selectedItem.type, selectedItem.image);
        }
      }
      animationFrameRef.current = requestAnimationFrame(detectFace);
    };

    detectFace();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detector, isModelLoaded, selectedItem]);

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
      const nose = keypoints[1];

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

  const handleCapture = () => {
    if (canvasRef.current && onCapture) {
      const imageData = canvasRef.current.toDataURL('image/png');
      onCapture(imageData);
    }
  };

  return (
    <div className="relative w-full h-full">
      {cameraError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900 to-red-700 text-white p-8">
          <div className="text-center max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <svg
              className="w-20 h-20 mx-auto mb-6 text-yellow-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <h3 className="text-2xl font-bold mb-4">カメラアクセスエラー</h3>
            <p className="text-lg mb-6 leading-relaxed">{cameraError}</p>
            <div className="space-y-3 text-sm text-left bg-black/20 rounded-lg p-4 mb-6">
              <p className="font-semibold">解決方法:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>ブラウザのアドレスバー左側のカメラアイコンをクリック</li>
                <li>「カメラを許可」を選択</li>
                <li>ページをリロードするか、下のボタンをクリック</li>
              </ul>
            </div>
            <button
              onClick={initCamera}
              className="px-8 py-3 bg-white text-red-700 rounded-full font-bold hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
            >
              再試行
            </button>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            className="relative w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          />
          {hasPermission && !isModelLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg">顔認識モデルを読み込み中...</p>
              </div>
            </div>
          )}
          {hasPermission === null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
              <div className="text-center">
                <div className="animate-pulse mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <p className="text-lg">カメラへのアクセスを要求中...</p>
                <p className="text-sm mt-2 text-gray-300">ブラウザの許可ダイアログで「許可」を選択してください</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
