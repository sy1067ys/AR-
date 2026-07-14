import { useRef, useState, useEffect } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';
import { Upload } from 'lucide-react';

interface ImageUploadModeProps {
  selectedItem: { type: 'glasses' | 'necklace' | 'earrings' | 'hat' | null; image: string | null; };
}

export function ImageUploadMode({ selectedItem }: ImageUploadModeProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      await tf.ready();
      const det = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        { runtime: 'mediapipe', solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh', refineLandmarks: true } as any,
      );
      setDetector(det);
    })();
  }, []);

  useEffect(() => { if (uploadedImage && detector) processImage(); }, [uploadedImage, selectedItem, detector]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const r = new FileReader(); r.onload = (ev) => setUploadedImage(ev.target?.result as string); r.readAsDataURL(file); }
  };

  const processImage = async () => {
    if (!uploadedImage || !detector || !canvasRef.current || !imageRef.current) return;
    setIsProcessing(true);
    const img = imageRef.current, canvas = canvasRef.current, ctx = canvas.getContext('2d');
    if (!ctx) return;
    img.onload = async () => {
      canvas.width = img.width; canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      try {
        const faces = await detector.estimateFaces(img, { flipHorizontal: false });
        if (faces.length > 0 && selectedItem.image && selectedItem.type) {
          const itemImg = new Image();
          itemImg.crossOrigin = 'anonymous';
          itemImg.src = selectedItem.image;
          await new Promise<void>(r => { itemImg.onload = () => r(); itemImg.onerror = () => r(); });
          if (itemImg.complete && itemImg.naturalWidth > 0) {
            drawItemRealistic(ctx, faces[0], selectedItem.type, itemImg);
          }
        }
      } catch {}
      setIsProcessing(false);
    };
  };

  const drawItemRealistic = (
    ctx: CanvasRenderingContext2D,
    face: faceLandmarksDetection.Face,
    type: string,
    img: HTMLImageElement,
  ) => {
    const kp = face.keypoints;
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

    const leftDist = Math.sqrt((leftCheek.x - nose.x) ** 2 + (leftCheek.y - nose.y) ** 2);
    const rightDist = Math.sqrt((rightCheek.x - nose.x) ** 2 + (rightCheek.y - nose.y) ** 2);
    const perspectiveRatio = leftDist / (rightDist + 0.01);

    ctx.save();
    if (type === 'glasses') {
      const w = faceW * 1.05, aspect = img.naturalHeight / img.naturalWidth, h = w * Math.max(aspect, 0.35);
      ctx.translate(cx, cy); ctx.rotate(angle);
      ctx.transform(1, (perspectiveRatio - 1) * 0.08, 0, 1, 0, 0);
      ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = faceW * 0.06; ctx.shadowOffsetY = faceW * 0.03;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = 0.06; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(-w * 0.15, -h * 0.08, w * 0.12, h * 0.18, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * 0.18, -h * 0.08, w * 0.12, h * 0.18, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (type === 'hat') {
      const hatW = faceW * 1.35, aspect = img.naturalHeight / img.naturalWidth, hatH = hatW * Math.max(aspect, 0.7);
      ctx.translate(forehead.x, forehead.y); ctx.rotate(angle);
      ctx.transform(1, (perspectiveRatio - 1) * 0.06, 0, 1, 0, 0);
      ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = faceW * 0.08; ctx.shadowOffsetY = faceW * 0.04;
      ctx.drawImage(img, -hatW / 2, -hatH * 0.9, hatW, hatH);
    } else if (type === 'necklace') {
      const neckW = faceW * 1.1, aspect = img.naturalHeight / img.naturalWidth, neckH = neckW * Math.max(aspect, 0.45);
      ctx.translate(chin.x, chin.y + faceW * 0.25); ctx.rotate(angle);
      ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = faceW * 0.04; ctx.shadowOffsetY = faceW * 0.02;
      ctx.drawImage(img, -neckW / 2, 0, neckW, neckH);
    } else if (type === 'earrings') {
      const earSize = faceW * 0.2, aspect = img.naturalHeight / img.naturalWidth, earH = earSize * Math.max(aspect, 1.2);
      ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = earSize * 0.3; ctx.shadowOffsetY = earSize * 0.1;
      ctx.save(); ctx.translate(leftEar.x, leftEar.y + earSize * 0.4); ctx.rotate(angle);
      ctx.scale(perspectiveRatio < 1 ? 1.1 : 0.9, perspectiveRatio < 1 ? 1.1 : 0.9);
      ctx.drawImage(img, -earSize / 2, 0, earSize, earH); ctx.restore();
      ctx.save(); ctx.translate(rightEar.x, rightEar.y + earSize * 0.4); ctx.rotate(angle);
      ctx.scale(perspectiveRatio > 1 ? 1.1 : 0.9, perspectiveRatio > 1 ? 1.1 : 0.9);
      ctx.drawImage(img, -earSize / 2, 0, earSize, earH); ctx.restore();
    }
    ctx.restore();
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ background: 'var(--ar-bg)' }}>
      {!uploadedImage ? (
        <div className="text-center p-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--ar-accent-glow)' }}>
            <Upload className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: 'var(--ar-accent)' }} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--ar-text)' }}>写真をアップロード</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--ar-text-muted)' }}>顔が写っている写真を選択</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 rounded-2xl font-bold text-sm text-white active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, var(--ar-accent), var(--ar-accent-2))', boxShadow: '0 4px 20px var(--ar-accent-glow)' }}>写真を選択</button>
        </div>
      ) : (
        <>
          <div className="w-full h-full flex items-center justify-center p-2">
            <img ref={imageRef} src={uploadedImage} alt="" className="hidden" />
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain rounded-xl" />
          </div>
          <div className="absolute top-3 right-3">
            <button onClick={() => setUploadedImage(null)} className="px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md active:scale-95 transition-all" style={{ background: 'var(--ar-glass)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-glass-border)' }}>別の写真</button>
          </div>
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(15,17,23,0.7)' }}>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-2" style={{ borderColor: 'var(--ar-accent)', borderTopColor: 'transparent' }} />
                <p className="text-xs" style={{ color: 'var(--ar-text-muted)' }}>処理中...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
