import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';

interface ARCameraProps {
  selectedItem: {
    type: 'glasses' | 'necklace' | 'earrings' | 'hat' | null;
    image: string | null;
  };
  onCapture?: (imageData: string) => void;
  facingMode?: 'user' | 'environment';
}

// Smoothing for jitter reduction
interface SmoothState {
  cx: number; cy: number; angle: number; faceW: number;
  noseX: number; noseY: number; chinX: number; chinY: number;
  leX: number; leY: number; reX: number; reY: number;
  fhX: number; fhY: number;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function ARCamera({ selectedItem, onCapture, facingMode = 'user' }: ARCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const animationFrameRef = useRef<number>();
  const currentFacingRef = useRef(facingMode);
  // Preloaded image cache
  const imgCacheRef = useRef<{ src: string; img: HTMLImageElement } | null>(null);
  // Smooth state for jitter reduction
  const smoothRef = useRef<SmoothState | null>(null);

  const SMOOTH = 0.35; // smoothing factor (0=no smooth, 1=frozen)

  // Preload item image
  useEffect(() => {
    if (selectedItem.image) {
      if (imgCacheRef.current?.src !== selectedItem.image) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = selectedItem.image;
        imgCacheRef.current = { src: selectedItem.image, img };
      }
    } else {
      imgCacheRef.current = null;
    }
  }, [selectedItem.image]);

  const initCamera = useCallback(async (facing: 'user' | 'environment') => {
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
      if (videoRef.current) { videoRef.current.srcObject = stream; setHasPermission(true); }
    } catch (error) {
      setHasPermission(false);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') setCameraError('カメラのアクセス許可が拒否されました。');
        else if (error.name === 'NotFoundError') setCameraError('カメラが見つかりません。');
        else setCameraError(`カメラエラー: ${error.message}`);
      }
    }
  }, []);

  useEffect(() => { if (currentFacingRef.current !== facingMode) initCamera(facingMode); }, [facingMode, initCamera]);

  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const det = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        { runtime: 'mediapipe', solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh', refineLandmarks: true } as any,
      );
      setDetector(det); setIsModelLoaded(true);
    };
    initCamera(facingMode); loadModel();
    return () => {
      if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!detector || !isModelLoaded) return;
    const detectFace = async () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const video = videoRef.current, canvas = canvasRef.current, ctx = canvas.getContext('2d')!;
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (currentFacingRef.current === 'user') {
          const faces = await detector.estimateFaces(video, { flipHorizontal: false });
          if (faces.length > 0 && imgCacheRef.current && selectedItem.type) {
            drawItemRealistic(ctx, faces[0], selectedItem.type, imgCacheRef.current.img);
          } else {
            smoothRef.current = null;
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(detectFace);
    };
    detectFace();
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [detector, isModelLoaded, selectedItem]);

  const drawItemRealistic = (
    ctx: CanvasRenderingContext2D,
    face: faceLandmarksDetection.Face,
    type: string,
    img: HTMLImageElement,
  ) => {
    if (!img.complete || img.naturalWidth === 0) return;
    const kp = face.keypoints;

    // Key landmarks
    const leftEyeO = kp[33], rightEyeO = kp[263];
    const leftEyeI = kp[133], rightEyeI = kp[362];
    const nose = kp[1], chin = kp[152], forehead = kp[10];
    const leftEar = kp[234], rightEar = kp[454];
    const leftCheek = kp[93], rightCheek = kp[323];

    const leX = (leftEyeO.x + leftEyeI.x) / 2, leY = (leftEyeO.y + leftEyeI.y) / 2;
    const reX = (rightEyeO.x + rightEyeI.x) / 2, reY = (rightEyeO.y + rightEyeI.y) / 2;
    const cx = (leX + reX) / 2, cy = (leY + reY) / 2;
    const dx = rightEyeO.x - leftEyeO.x, dy = rightEyeO.y - leftEyeO.y;
    const angle = Math.atan2(dy, dx);
    const faceW = Math.sqrt(dx * dx + dy * dy) * 2.4;

    // Smooth values to reduce jitter
    const raw: SmoothState = {
      cx, cy, angle, faceW,
      noseX: nose.x, noseY: nose.y,
      chinX: chin.x, chinY: chin.y,
      leX: leftEar.x, leY: leftEar.y,
      reX: rightEar.x, reY: rightEar.y,
      fhX: forehead.x, fhY: forehead.y,
    };

    let s: SmoothState;
    if (smoothRef.current) {
      s = {} as SmoothState;
      for (const k of Object.keys(raw) as (keyof SmoothState)[]) {
        (s as any)[k] = lerp(raw[k], smoothRef.current[k], SMOOTH);
      }
    } else {
      s = raw;
    }
    smoothRef.current = s;

    // 3D perspective hint: face width ratio (left vs right cheek to nose)
    const leftDist = Math.sqrt((leftCheek.x - nose.x) ** 2 + (leftCheek.y - nose.y) ** 2);
    const rightDist = Math.sqrt((rightCheek.x - nose.x) ** 2 + (rightCheek.y - nose.y) ** 2);
    const perspectiveRatio = leftDist / (rightDist + 0.01); // >1 = face turned right

    ctx.save();

    if (type === 'glasses') {
      const w = s.faceW * 1.05;
      const aspect = img.naturalHeight / img.naturalWidth;
      const h = w * Math.max(aspect, 0.35);

      ctx.translate(s.cx, s.cy);
      ctx.rotate(s.angle);

      // Subtle perspective skew
      const skew = (perspectiveRatio - 1) * 0.08;
      ctx.transform(1, skew, 0, 1, 0, 0);

      // Drop shadow
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = s.faceW * 0.06;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = s.faceW * 0.03;

      ctx.drawImage(img, -w / 2, -h / 2, w, h);

      // Subtle lens reflection for realism
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-w * 0.15, -h * 0.08, w * 0.12, h * 0.18, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w * 0.18, -h * 0.08, w * 0.12, h * 0.18, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

    } else if (type === 'hat') {
      const hatW = s.faceW * 1.35;
      const aspect = img.naturalHeight / img.naturalWidth;
      const hatH = hatW * Math.max(aspect, 0.7);

      ctx.translate(s.fhX, s.fhY);
      ctx.rotate(s.angle);

      const skew = (perspectiveRatio - 1) * 0.06;
      ctx.transform(1, skew, 0, 1, 0, 0);

      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = s.faceW * 0.08;
      ctx.shadowOffsetY = s.faceW * 0.04;

      ctx.drawImage(img, -hatW / 2, -hatH * 0.9, hatW, hatH);

    } else if (type === 'necklace') {
      const neckW = s.faceW * 1.1;
      const aspect = img.naturalHeight / img.naturalWidth;
      const neckH = neckW * Math.max(aspect, 0.45);

      ctx.translate(s.chinX, s.chinY + s.faceW * 0.25);
      ctx.rotate(s.angle);

      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = s.faceW * 0.04;
      ctx.shadowOffsetY = s.faceW * 0.02;

      ctx.drawImage(img, -neckW / 2, 0, neckW, neckH);

    } else if (type === 'earrings') {
      const earSize = s.faceW * 0.2;
      const aspect = img.naturalHeight / img.naturalWidth;
      const earH = earSize * Math.max(aspect, 1.2);

      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = earSize * 0.3;
      ctx.shadowOffsetY = earSize * 0.1;

      // Left earring
      ctx.save();
      ctx.translate(s.leX, s.leY + earSize * 0.4);
      ctx.rotate(s.angle);
      // Scale based on perspective (ear closer to camera = bigger)
      const leftScale = perspectiveRatio < 1 ? 1.1 : 0.9;
      ctx.scale(leftScale, leftScale);
      ctx.drawImage(img, -earSize / 2, 0, earSize, earH);
      ctx.restore();

      // Right earring
      ctx.save();
      ctx.translate(s.reX, s.reY + earSize * 0.4);
      ctx.rotate(s.angle);
      const rightScale = perspectiveRatio > 1 ? 1.1 : 0.9;
      ctx.scale(rightScale, rightScale);
      ctx.drawImage(img, -earSize / 2, 0, earSize, earH);
      ctx.restore();
    }

    ctx.restore();
  };

  const isMirrored = currentFacingRef.current === 'user';

  return (
    <div className="relative w-full h-full">
      {cameraError ? (
        <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: 'var(--ar-bg)' }}>
          <div className="text-center max-w-xs">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--ar-accent-2-glow)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--ar-accent-2)' }} fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: 'var(--ar-text)' }}>カメラエラー</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--ar-text-muted)' }}>{cameraError}</p>
            <button onClick={() => initCamera(facingMode)} className="px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--ar-accent)' }}>再試行</button>
          </div>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }} />
          <canvas ref={canvasRef} className="relative w-full h-full" style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }} />
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
                  <svg className="w-6 h-6" style={{ color: 'var(--ar-accent)' }} fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-xs" style={{ color: 'var(--ar-text-muted)' }}>カメラアクセスを要求中...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
