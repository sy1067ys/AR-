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
        { runtime: 'mediapipe', solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh', refineLandmarks: true } as any
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
        if (faces.length > 0 && selectedItem.image && selectedItem.type) drawItem(ctx, faces[0], selectedItem.type, selectedItem.image);
      } catch {}
      setIsProcessing(false);
    };
  };

  const drawItem = (ctx: CanvasRenderingContext2D, face: faceLandmarksDetection.Face, type: string, imageUrl: string) => {
    const kp = face.keypoints, img = new Image(); img.src = imageUrl;
    if (type === 'glasses') {
      const l = kp[33], r = kp[263], d = Math.sqrt((r.x-l.x)**2+(r.y-l.y)**2), w = d*2.5, h = w*0.4;
      ctx.drawImage(img, (l.x+r.x)/2-w/2, (l.y+r.y)/2-h/2, w, h);
    } else if (type === 'necklace') { ctx.drawImage(img, kp[152].x-100, kp[152].y+50, 200, 100); }
    else if (type === 'earrings') { ctx.drawImage(img, kp[234].x-20, kp[234].y, 40, 40); ctx.drawImage(img, kp[454].x-20, kp[454].y, 40, 40); }
    else if (type === 'hat') { const fw = Math.abs(kp[263].x-kp[33].x)*2.5, hw = fw*1.3, hh = hw*0.8; ctx.drawImage(img, kp[10].x-hw/2, kp[10].y-hh, hw, hh); }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ background: 'var(--ar-bg)' }}>
      {!uploadedImage ? (
        <div className="text-center p-6">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--ar-accent-glow)' }}
          >
            <Upload className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: 'var(--ar-accent)' }} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--ar-text)' }}>写真をアップロード</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--ar-text-muted)' }}>顔が写っている写真を選択</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 rounded-2xl font-bold text-sm text-white active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, var(--ar-accent), var(--ar-accent-2))', boxShadow: '0 4px 20px var(--ar-accent-glow)' }}
          >
            写真を選択
          </button>
        </div>
      ) : (
        <>
          <div className="w-full h-full flex items-center justify-center p-2">
            <img ref={imageRef} src={uploadedImage} alt="" className="hidden" />
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain rounded-xl" />
          </div>
          <div className="absolute top-3 right-3">
            <button
              onClick={() => setUploadedImage(null)}
              className="px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md active:scale-95 transition-all"
              style={{ background: 'var(--ar-glass)', color: 'var(--ar-text-2)', border: '1px solid var(--ar-glass-border)' }}
            >
              別の写真
            </button>
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
