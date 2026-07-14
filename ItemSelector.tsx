import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';
import { RotateCcw, Lock, Unlock } from 'lucide-react';

interface ARCameraProps {
  selectedItem: { type: 'glasses' | 'necklace' | 'earrings' | 'hat' | null; image: string | null; };
  onCapture?: (imageData: string) => void;
  facingMode?: 'user' | 'environment';
}

interface PhysicsState {
  neckSwingAngle: number; neckSwingVel: number;
  earLAngle: number; earLVel: number;
  earRAngle: number; earRVel: number;
  prevCx: number; prevCy: number; prevAngle: number; prevTime: number;
  velX: number; velY: number; angularVel: number;
}

interface Lm {
  cx: number; cy: number; angle: number; faceW: number;
  noseX: number; noseY: number; chinX: number; chinY: number;
  fhX: number; fhY: number; leX: number; leY: number; reX: number; reY: number;
  jawL: number; jawLY: number; jawR: number; jawRY: number;
  perspRatio: number; depth: number; faceH: number;
}

interface ItemOffset { x: number; y: number; scale: number; }

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, mn: number, mx: number) { return Math.max(mn, Math.min(mx, v)); }

export function ARCamera({ selectedItem, onCapture, facingMode = 'user' }: ARCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null); // transparent drag overlay
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const animRef = useRef<number>();
  const facingRef = useRef(facingMode);
  const imgCache = useRef<{ src: string; img: HTMLImageElement } | null>(null);
  const smoothRef = useRef<Lm | null>(null);
  const physicsRef = useRef<PhysicsState>({ neckSwingAngle: 0, neckSwingVel: 0, earLAngle: 0, earLVel: 0, earRAngle: 0, earRVel: 0, prevCx: 0, prevCy: 0, prevAngle: 0, prevTime: 0, velX: 0, velY: 0, angularVel: 0 });

  // ===== Item offset (user-adjustable position) =====
  // Use ref as source of truth for the render loop (no re-render lag while dragging),
  // mirror into state only for UI chrome (scale %, reset button visibility).
  const offsetRef = useRef<ItemOffset>({ x: 0, y: 0, scale: 1 });
  const [offset, setOffsetState] = useState<ItemOffset>({ x: 0, y: 0, scale: 1 });
  const setOffset = useCallback((updater: ItemOffset | ((prev: ItemOffset) => ItemOffset)) => {
    const next = typeof updater === 'function' ? (updater as (p: ItemOffset) => ItemOffset)(offsetRef.current) : updater;
    offsetRef.current = next;      // instant — used by render loop this very frame
    setOffsetState(next);           // async — updates UI chrome only
  }, []);
  const [isDragging, setIsDragging] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // lock position
  const dragStartRef = useRef({ x: 0, y: 0, offX: 0, offY: 0 });
  const pinchStartRef = useRef({ dist: 0, scale: 1 });
  const [showOffsetHint, setShowOffsetHint] = useState(false);

  // Reset offset when item changes
  const prevItemRef = useRef(selectedItem.image);
  useEffect(() => {
    if (selectedItem.image !== prevItemRef.current) {
      setOffset({ x: 0, y: 0, scale: 1 });
      prevItemRef.current = selectedItem.image;
    }
  }, [selectedItem.image, setOffset]);

  const SM = 0.3;
  const GRAVITY = 600; const DAMPING = 0.92; const SWING_SENS = 0.15;

  useEffect(() => {
    if (selectedItem.image) {
      if (imgCache.current?.src !== selectedItem.image) {
        const img = new Image(); img.crossOrigin = 'anonymous'; img.src = selectedItem.image;
        imgCache.current = { src: selectedItem.image, img };
      }
    } else { imgCache.current = null; }
  }, [selectedItem.image]);

  const initCamera = useCallback(async (facing: 'user' | 'environment') => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    setCameraError(null); setHasPermission(null); facingRef.current = facing;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: facing } });
      if (videoRef.current) { videoRef.current.srcObject = stream; setHasPermission(true); }
    } catch (e: any) {
      setHasPermission(false);
      setCameraError(e?.name === 'NotAllowedError' ? 'カメラの許可が必要です。' : e?.name === 'NotFoundError' ? 'カメラが見つかりません。' : `カメラエラー: ${e?.message}`);
    }
  }, []);

  useEffect(() => { if (facingRef.current !== facingMode) initCamera(facingMode); }, [facingMode, initCamera]);

  useEffect(() => {
    (async () => {
      await tf.ready();
      const det = await faceLandmarksDetection.createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, { runtime: 'mediapipe', solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh', refineLandmarks: true } as any);
      setDetector(det); setIsModelLoaded(true);
    })();
    initCamera(facingMode);
    return () => {
      if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ===== OFFSET READING (use ref for render loop) =====
  const lockedRef = useRef(isLocked);
  useEffect(() => { lockedRef.current = isLocked; }, [isLocked]);

  useEffect(() => {
    if (!detector || !isModelLoaded) return;
    const tick = async () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const v = videoRef.current, c = canvasRef.current, ctx = c.getContext('2d')!;
        c.width = v.videoWidth; c.height = v.videoHeight;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(v, 0, 0, c.width, c.height);
        if (facingRef.current === 'user') {
          const faces = await detector.estimateFaces(v, { flipHorizontal: false });
          if (faces.length > 0 && imgCache.current?.img && selectedItem.type) {
            renderItem(ctx, faces[0], selectedItem.type, imgCache.current.img, offsetRef.current);
          } else { smoothRef.current = null; }
        }
      }
      animRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [detector, isModelLoaded, selectedItem]);

  // ===== DRAG & PINCH HANDLERS =====
  const draggingRef = useRef(false);
  // Convert a screen-pixel delta into a canvas-pixel delta.
  // The front camera canvas is mirrored (scaleX(-1)), so a rightward finger
  // move must become a leftward canvas move to feel natural.
  const getCanvasScale = () => {
    const c = canvasRef.current; if (!c) return 1;
    const rect = c.getBoundingClientRect();
    return c.width / rect.width;
  };
  const mirrorX = () => (facingRef.current === 'user' ? -1 : 1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (lockedRef.current || !selectedItem.type) return;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragStartRef.current = { x: t.clientX, y: t.clientY, offX: offsetRef.current.x, offY: offsetRef.current.y };
      draggingRef.current = true;
      setIsDragging(true);
      setShowOffsetHint(true);
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      pinchStartRef.current = { dist: Math.sqrt(dx * dx + dy * dy), scale: offsetRef.current.scale };
      draggingRef.current = false; // pinch, not drag
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (lockedRef.current || !selectedItem.type) return;
    e.preventDefault();
    const scale = getCanvasScale();

    if (e.touches.length === 1 && draggingRef.current) {
      const t = e.touches[0];
      const dx = (t.clientX - dragStartRef.current.x) * scale * mirrorX();
      const dy = (t.clientY - dragStartRef.current.y) * scale;
      setOffset({ ...offsetRef.current, x: dragStartRef.current.offX + dx, y: dragStartRef.current.offY + dy });
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / (pinchStartRef.current.dist || 1);
      setOffset({ ...offsetRef.current, scale: clamp(pinchStartRef.current.scale * ratio, 0.3, 3) });
    }
  };

  const handleTouchEnd = () => {
    draggingRef.current = false;
    setIsDragging(false);
    setTimeout(() => setShowOffsetHint(false), 2000);
  };

  // Mouse drag for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (lockedRef.current || !selectedItem.type) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY, offX: offsetRef.current.x, offY: offsetRef.current.y };
    draggingRef.current = true;
    setIsDragging(true); setShowOffsetHint(true);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current || lockedRef.current) return;
    const scale = getCanvasScale();
    const dx = (e.clientX - dragStartRef.current.x) * scale * mirrorX();
    const dy = (e.clientY - dragStartRef.current.y) * scale;
    setOffset({ ...offsetRef.current, x: dragStartRef.current.offX + dx, y: dragStartRef.current.offY + dy });
  };
  const handleMouseUp = () => { draggingRef.current = false; setIsDragging(false); setTimeout(() => setShowOffsetHint(false), 2000); };

  // Scroll wheel for scale on desktop
  const handleWheel = (e: React.WheelEvent) => {
    if (lockedRef.current || !selectedItem.type) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    setOffset({ ...offsetRef.current, scale: clamp(offsetRef.current.scale * delta, 0.3, 3) });
  };

  const resetOffset = () => setOffset({ x: 0, y: 0, scale: 1 });
  const hasOffset = offset.x !== 0 || offset.y !== 0 || offset.scale !== 1;

  // ==================== RENDER ENGINE ====================
  const renderItem = (ctx: CanvasRenderingContext2D, face: faceLandmarksDetection.Face, type: string, img: HTMLImageElement, off: ItemOffset) => {
    if (!img.complete || img.naturalWidth === 0) return;
    const kp = face.keypoints; const now = performance.now();
    const lEO = kp[33], rEO = kp[263], lEI = kp[133], rEI = kp[362];
    const nose = kp[1], chin = kp[152], fh = kp[10];
    const lEar = kp[234], rEar = kp[454], lCk = kp[93], rCk = kp[323];
    const jawL = kp[172], jawR = kp[397];
    const leX = (lEO.x + lEI.x) / 2, leY = (lEO.y + lEI.y) / 2;
    const reX = (rEO.x + rEI.x) / 2, reY = (rEO.y + rEI.y) / 2;
    const cx = (leX + reX) / 2, cy = (leY + reY) / 2;
    const dx = rEO.x - lEO.x, dy = rEO.y - lEO.y;
    const angle = Math.atan2(dy, dx);
    const faceW = Math.sqrt(dx * dx + dy * dy) * 2.4;
    const faceH = Math.sqrt((fh.x - chin.x) ** 2 + (fh.y - chin.y) ** 2);
    const lD = Math.sqrt((lCk.x - nose.x) ** 2 + (lCk.y - nose.y) ** 2);
    const rD = Math.sqrt((rCk.x - nose.x) ** 2 + (rCk.y - nose.y) ** 2);
    const pR = lD / (rD + 0.01);

    const raw: Lm = { cx, cy, angle, faceW, perspRatio: pR, faceH, noseX: nose.x, noseY: nose.y, chinX: chin.x, chinY: chin.y, fhX: fh.x, fhY: fh.y, leX: lEar.x, leY: lEar.y, reX: rEar.x, reY: rEar.y, jawL: jawL.x, jawLY: jawL.y, jawR: jawR.x, jawRY: jawR.y, depth: faceW };
    let s: Lm;
    if (smoothRef.current) { s = {} as Lm; for (const k of Object.keys(raw) as (keyof Lm)[]) (s as any)[k] = lerp(raw[k], smoothRef.current[k], SM); } else s = raw;
    smoothRef.current = s;

    // Physics
    const ph = physicsRef.current;
    const dt = ph.prevTime > 0 ? clamp((now - ph.prevTime) / 1000, 0.001, 0.05) : 0.016;
    ph.velX = lerp((s.cx - ph.prevCx) / dt, ph.velX, 0.5);
    ph.velY = lerp((s.cy - ph.prevCy) / dt, ph.velY, 0.5);
    ph.angularVel = lerp((s.angle - ph.prevAngle) / dt, ph.angularVel, 0.5);
    ph.prevCx = s.cx; ph.prevCy = s.cy; ph.prevAngle = s.angle; ph.prevTime = now;
    const latAccel = -ph.velX * SWING_SENS;
    ph.neckSwingVel += (latAccel - GRAVITY * Math.sin(ph.neckSwingAngle) * 0.01) * dt;
    ph.neckSwingVel *= DAMPING; ph.neckSwingAngle += ph.neckSwingVel * dt;
    ph.neckSwingAngle = clamp(ph.neckSwingAngle, -0.35, 0.35);
    const eAccel = -ph.velX * SWING_SENS * 1.5;
    const eVAccel = ph.velY * SWING_SENS * 0.5;
    ph.earLVel += (eAccel + eVAccel - GRAVITY * Math.sin(ph.earLAngle) * 0.015) * dt; ph.earLVel *= DAMPING * 0.95; ph.earLAngle += ph.earLVel * dt; ph.earLAngle = clamp(ph.earLAngle, -0.5, 0.5);
    ph.earRVel += (eAccel - eVAccel - GRAVITY * Math.sin(ph.earRAngle) * 0.015) * dt; ph.earRVel *= DAMPING * 0.95; ph.earRAngle += ph.earRVel * dt; ph.earRAngle = clamp(ph.earRAngle, -0.5, 0.5);

    ctx.save();

    // Apply user offset
    const userScale = off.scale;
    const userOffX = off.x;
    const userOffY = off.y;

    if (type === 'glasses') {
      const w = s.faceW * 1.05 * userScale;
      const asp = img.naturalHeight / img.naturalWidth;
      const h = w * Math.max(asp, 0.35);
      ctx.translate(s.cx + userOffX, s.cy + userOffY); ctx.rotate(s.angle);
      const skY = (s.perspRatio - 1) * 0.1;
      const hSc = 1 - Math.abs(s.perspRatio - 1) * 0.08;
      ctx.transform(hSc, skY, 0, 1, 0, 0);
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = s.faceW * 0.05; ctx.shadowOffsetY = s.faceW * 0.035;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = 0.05; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(-w * 0.16, -h * 0.1, w * 0.1, h * 0.15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * 0.16, -h * 0.1, w * 0.1, h * 0.15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (type === 'hat') {
      const hatW = s.faceW * 1.4 * userScale; const asp = img.naturalHeight / img.naturalWidth;
      const hatH = hatW * Math.max(asp, 0.65);
      ctx.translate(s.fhX + userOffX, s.fhY + userOffY); ctx.rotate(s.angle);
      const hSc = 1 - Math.abs(s.perspRatio - 1) * 0.06;
      ctx.transform(hSc, (s.perspRatio - 1) * 0.06, 0, 1, 0, 0);
      ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = s.faceW * 0.1; ctx.shadowOffsetY = s.faceW * 0.05;
      ctx.drawImage(img, -hatW / 2, -hatH * 0.88, hatW, hatH);
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = 0.08; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(0, hatH * 0.05, hatW * 0.4, s.faceW * 0.04, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (type === 'necklace') {
      const nW = s.faceW * 1.15 * userScale; const asp = img.naturalHeight / img.naturalWidth;
      const nH = nW * Math.max(asp, 0.45);
      const ncx = (s.jawL + s.jawR) / 2, ncy = (s.jawLY + s.jawRY) / 2 + s.faceH * 0.12;
      ctx.translate(ncx + userOffX, ncy + userOffY); ctx.rotate(s.angle);
      ctx.rotate(ph.neckSwingAngle);
      const hSc = 1 - Math.abs(s.perspRatio - 1) * 0.1;
      ctx.transform(hSc, (s.perspRatio - 1) * 0.08, 0, 1, 0, 0);
      ctx.scale(1, 1 + Math.abs(ph.neckSwingAngle) * 0.15);
      ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = s.faceW * 0.04; ctx.shadowOffsetY = s.faceW * 0.02;
      ctx.drawImage(img, -nW / 2, -nH * 0.15, nW, nH);
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = 0.04; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(nW * 0.05, nH * 0.2, nW * 0.15, nH * 0.08, ph.neckSwingAngle, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (type === 'earrings') {
      const bs = s.faceW * 0.18 * userScale; const asp = img.naturalHeight / img.naturalWidth;
      const eH = bs * Math.max(asp, 1.3);
      // Left
      ctx.save();
      ctx.translate(s.leX + userOffX, s.leY + userOffY + bs * 0.3); ctx.rotate(s.angle); ctx.rotate(ph.earLAngle);
      const lSc = s.perspRatio < 1 ? 1.15 : 0.85;
      ctx.scale(lSc, lSc * (1 + Math.abs(ph.earLAngle) * 0.2));
      ctx.globalAlpha = s.perspRatio < 0.7 ? 0.5 : 1;
      ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = bs * 0.2; ctx.shadowOffsetY = bs * 0.08;
      ctx.drawImage(img, -bs / 2, 0, bs, eH);
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = 0.06; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(bs * 0.05, eH * 0.3, bs * 0.15, eH * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.restore();
      // Right
      ctx.save();
      ctx.translate(s.reX + userOffX, s.reY + userOffY + bs * 0.3); ctx.rotate(s.angle); ctx.rotate(ph.earRAngle);
      const rSc = s.perspRatio > 1 ? 1.15 : 0.85;
      ctx.scale(rSc, rSc * (1 + Math.abs(ph.earRAngle) * 0.2));
      ctx.globalAlpha = s.perspRatio > 1.3 ? 0.5 : 1;
      ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = bs * 0.2; ctx.shadowOffsetY = bs * 0.08;
      ctx.drawImage(img, -bs / 2, 0, bs, eH);
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = 0.06; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(bs * 0.05, eH * 0.3, bs * 0.15, eH * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.restore();
    }
    ctx.restore();
  };

  const isMirrored = facingRef.current === 'user';

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
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }} />

          {/* Transparent touch/drag overlay */}
          {selectedItem.type && (
            <div
              className="absolute inset-0 z-10"
              style={{ cursor: isLocked ? 'default' : isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
          )}

          {/* Position controls */}
          {selectedItem.type && (
            <div className="absolute bottom-20 left-3 z-20 flex flex-col gap-1.5">
              {/* Lock/Unlock */}
              <button
                onClick={() => setIsLocked(!isLocked)}
                className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all"
                style={{
                  background: isLocked ? 'var(--ar-accent)' : 'var(--ar-glass)',
                  border: '1px solid var(--ar-glass-border)',
                  color: isLocked ? '#fff' : 'var(--ar-text-2)',
                }}
                title={isLocked ? '位置をロック中' : '位置を固定'}
              >
                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              {/* Reset */}
              {hasOffset && (
                <button
                  onClick={resetOffset}
                  className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all"
                  style={{ background: 'var(--ar-glass)', border: '1px solid var(--ar-glass-border)', color: 'var(--ar-accent)' }}
                  title="位置をリセット"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Scale display */}
              {offset.scale !== 1 && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md text-[9px] font-bold"
                  style={{ background: 'var(--ar-glass)', border: '1px solid var(--ar-glass-border)', color: 'var(--ar-text-2)' }}
                >
                  {Math.round(offset.scale * 100)}%
                </div>
              )}
            </div>
          )}

          {/* Drag hint overlay */}
          {selectedItem.type && !isLocked && (showOffsetHint || isDragging) && (
            <div
              className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 pointer-events-none transition-opacity"
              style={{
                background: 'var(--ar-glass)',
                border: '1px solid var(--ar-glass-border)',
                color: 'var(--ar-text-2)',
                backdropFilter: 'blur(8px)',
                opacity: isDragging ? 1 : 0.7,
              }}
            >
              {isDragging ? '📍 移動中...' : '👆 ドラッグで位置調整 · ピンチでサイズ変更'}
            </div>
          )}

          {/* First-time hint */}
          {selectedItem.type && !hasOffset && !showOffsetHint && !isLocked && (
            <div
              className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full text-[10px] pointer-events-none animate-pulse"
              style={{ background: 'var(--ar-glass)', border: '1px solid var(--ar-glass-border)', color: 'var(--ar-text-muted)', backdropFilter: 'blur(8px)' }}
            >
              画面をドラッグして位置を調整できます
            </div>
          )}

          {hasPermission && !isModelLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-30" style={{ background: 'rgba(15,17,23,0.7)' }}>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-2" style={{ borderColor: 'var(--ar-accent)', borderTopColor: 'transparent' }} />
                <p className="text-xs" style={{ color: 'var(--ar-text-muted)' }}>顔認識モデルを読み込み中...</p>
              </div>
            </div>
          )}
          {hasPermission === null && (
            <div className="absolute inset-0 flex items-center justify-center z-30" style={{ background: 'rgba(15,17,23,0.8)' }}>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse" style={{ background: 'var(--ar-accent-glow)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--ar-accent)' }} fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
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
