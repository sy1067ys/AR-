import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';
import { SwitchCamera } from 'lucide-react';

interface ARCameraProps {
  selectedItem: {
    type: 'glasses' | 'necklace' | 'earrings' | 'hat' | null;
    image: string | null;
  };
  onCapture?: (imageData: string) => void;
  facingMode?: 'user' | 'environment';
}

export function ARCamera({ selectedItem, onCapture, facingMode = 'user' }: ARCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const animationFrameRef = useRef<number>();
  const currentFacingRef = useRef(facingMode);

  const initCamera = useCallback(async (facing: 'user' | 'environment') => {
    // Stop existing streams
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setCameraError(null);
    setHasPermission(null);
    currentFacingRef.current = facing;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: facing },
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
          setCameraError('カメラが見つかりませんでした。');
        } else if (error.name === 'NotReadableError') {
          setCameraError('カメラが他のアプリで使用中です。');
        } else {
          setCameraError(`カメラエラー: ${error.message}`);
        }
      }
    }
  }, []);

  // React to facingMode prop changes
  useEffect(() => {
    if (currentFacingRef.current !== facingMode) {
      initCamera(facingMode);
    }
  }, [facingMode, initCamera]);

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
      setIsModelLoaded(true);
    };

    initCamera(facingMode);
    loadModel();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
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

        // Only detect faces when using front camera
        if (currentFacingRef.current === 'user') {
          const faces = await detector.estimateFaces(video, { flipHorizontal: false });
          if (faces.length > 0 && selectedItem.image && selectedItem.type) {
            drawItem(ctx, faces[0], selectedItem.type, selectedItem.image);
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(detectFace);
    };

    detectFace();
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [detector, isModelLoaded, selectedItem]);

  const drawItem = (
    ctx: CanvasRenderingContext2D,
    face: faceLandmarksDetection.Face,
    type: string,
    imageUrl: string
  ) => {
    const kp = face.keypoints;
    const img = new Image();
    img.src = imageUrl;

    if (type === 'glasses') {
      const l = kp[33], r = kp[263];
      const d = Math.sqrt((r.x - l.x) ** 2 + (r.y - l.y) ** 2);
      const w = d * 2.5, h = w * 0.4;
      const cx = (l.x + r.x) / 2, cy = (l.y + r.y) / 2;
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    } else if (type === 'necklace') {
      const chin = kp[152];
      ctx.drawImage(img, chin.x - 100, chin.y + 50, 200, 100);
    } else if (type === 'earrings') {
      const le = kp[234], re = kp[454];
      ctx.drawImage(img, le.x - 20, le.y, 40, 40);
      ctx.drawImage(img, re.x - 20, re.y, 40, 40);
    } else if (type === 'hat') {
      const fh = kp[10], le = kp[33], re = kp[263];
      const fw = Math.abs(re.x - le.x) * 2.5;
      const hw = fw * 1.3, hh = hw * 0.8;
      ctx.drawImage(img, fh.x - hw / 2, fh.y - hh, hw, hh);
    }
  };

  const isMirrored = currentFacingRef.current === 'user';

  return (
    <div className="relative w-full h-full">
      {cameraError ? (
        <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: 'var(--ar-bg)' }}>
          <div className="text-center max-w-xs">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--ar-accent-2-glow)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--ar-accent-2)' }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: 'var(--ar-text)' }}>カメラエラー</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--ar-text-muted)' }}>{cameraError}</p>
            <button
              onClick={() => initCamera(facingMode)}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--ar-accent)' }}
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
            style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
          />
          <canvas
            ref={canvasRef}
            className="relative w-full h-full"
            style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
          />
          {hasPermission && !isModelLoaded && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(15,17,23,0.7)' }}>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-2" style={{ borderColor: 'var(--ar-accent)', borderTopColor: 'transparent' }} />
                <p className="text-xs" style={{ color: 'var(--ar-text-muted)' }}>顔認識モデルを読み込み中...</p>
              </div>
            </div>
          )}
          {hasPermission === null && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(15,17,23,0.8)' }}>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse" style={{ background: 'var(--ar-accent-glow)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--ar-accent)' }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs" style={{ color: 'var(--ar-text-muted)' }}>カメラへのアクセスを要求中...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
