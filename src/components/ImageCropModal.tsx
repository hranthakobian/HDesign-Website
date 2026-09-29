'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MediaFile } from '@/lib/mediaTypes';

interface ImageCropModalProps {
  isOpen: boolean;
  file: MediaFile | null;
  token: string | null;
  onClose: () => void;
  onSaveSuccess: (updatedFile: MediaFile, isCopy: boolean) => void;
}

type AspectRatioPreset = 'free' | 'original' | '1:1' | '16:9' | '4:3' | '3:2' | '9:16' | '2:3';

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  file,
  token,
  onClose,
  onSaveSuccess
}) => {
  const [mounted, setMounted] = useState(false);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);

  // Zoom & Pan State for infinite/expanded canvas workspace
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; initPan: { x: number; y: number } } | null>(null);

  // Crop box coordinates in natural image pixels [0..naturalWidth, 0..naturalHeight]
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });

  // Canvas Expansion margins in pixels (outward padding)
  const [marginLock, setMarginLock] = useState<boolean>(true);
  const [marginTop, setMarginTop] = useState<number>(0);
  const [marginRight, setMarginRight] = useState<number>(0);
  const [marginBottom, setMarginBottom] = useState<number>(0);
  const [marginLeft, setMarginLeft] = useState<number>(0);
  const [canvasBgType, setCanvasBgType] = useState<'transparent' | 'white' | 'black' | 'custom'>('transparent');
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');

  // Aspect ratio preset
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('free');

  // Active Dragging State for interactive crop box
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    initialBox: typeof cropBox;
    initialMargins: { top: number; right: number; bottom: number; left: number };
  } | null>(null);

  // Preview Canvas Ref & Workspace Container Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  // Loading / Saving states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMode, setSaveMode] = useState<'overwrite' | 'copy'>('overwrite');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut: Escape to close, Space to pan
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsPanMode(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, isSaving, onClose]);

  // Fit image to current viewport workspace
  const fitToScreen = useCallback((w: number, h: number) => {
    if (!workspaceRef.current || !w || !h) return;
    const workRect = workspaceRef.current.getBoundingClientRect();
    const pad = 90;
    const availW = Math.max(200, workRect.width - pad);
    const availH = Math.max(200, workRect.height - pad);
    const scale = Math.min(availW / w, availH / h, 1.0);
    setZoom(Math.max(0.15, Math.min(3.0, Math.round(scale * 100) / 100)));
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Load image on file change
  useEffect(() => {
    if (!isOpen || !file || file.type !== 'image') {
      setImgElement(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setCropBox({
        x: 0,
        y: 0,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      setMarginTop(0);
      setMarginRight(0);
      setMarginBottom(0);
      setMarginLeft(0);
      setAspectRatio('free');
      setTimeout(() => {
        fitToScreen(img.naturalWidth, img.naturalHeight);
      }, 50);
    };
    img.src = file.url;
  }, [isOpen, file, fitToScreen]);

  // Handle all margins unified when locked
  const handleMarginChange = (val: number, side?: 'top' | 'right' | 'bottom' | 'left') => {
    const num = Math.max(0, val);
    if (marginLock || !side) {
      setMarginTop(num);
      setMarginRight(num);
      setMarginBottom(num);
      setMarginLeft(num);
    } else {
      if (side === 'top') setMarginTop(num);
      if (side === 'right') setMarginRight(num);
      if (side === 'bottom') setMarginBottom(num);
      if (side === 'left') setMarginLeft(num);
    }
  };

  // Zoom helpers
  const handleZoomChange = (delta: number) => {
    setZoom(prev => Math.max(0.15, Math.min(4.0, Math.round((prev + delta) * 100) / 100)));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse wheel zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom(prev => Math.max(0.15, Math.min(4.0, Math.round((prev + zoomFactor) * 100) / 100)));
  };

  // Workspace Pan dragging
  const handleWorkspaceMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isPanMode || e.target === workspaceRef.current || (e.target as HTMLElement).getAttribute('data-workspace-bg') === 'true') {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initPan: { ...panOffset }
      };
    }
  };

  useEffect(() => {
    if (!isPanning) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!panStartRef.current) return;
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      setPanOffset({
        x: panStartRef.current.initPan.x + dx,
        y: panStartRef.current.initPan.y + dy
      });
    };
    const handleMouseUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  // Set aspect ratio and adjust crop box
  const applyAspectRatio = useCallback((ratio: AspectRatioPreset) => {
    setAspectRatio(ratio);
    if (!naturalWidth || !naturalHeight) return;

    if (ratio === 'free') return;

    let targetRatio = 1;
    if (ratio === 'original') targetRatio = naturalWidth / naturalHeight;
    else if (ratio === '1:1') targetRatio = 1;
    else if (ratio === '16:9') targetRatio = 16 / 9;
    else if (ratio === '4:3') targetRatio = 4 / 3;
    else if (ratio === '3:2') targetRatio = 3 / 2;
    else if (ratio === '9:16') targetRatio = 9 / 16;
    else if (ratio === '2:3') targetRatio = 2 / 3;

    let newWidth = naturalWidth;
    let newHeight = newWidth / targetRatio;

    if (newHeight > naturalHeight) {
      newHeight = naturalHeight;
      newWidth = newHeight * targetRatio;
    }

    const newX = Math.round((naturalWidth - newWidth) / 2);
    const newY = Math.round((naturalHeight - newHeight) / 2);

    setCropBox({
      x: Math.max(0, newX),
      y: Math.max(0, newY),
      width: Math.min(naturalWidth, Math.round(newWidth)),
      height: Math.min(naturalHeight, Math.round(newHeight))
    });
  }, [naturalWidth, naturalHeight]);

  // Render output onto hidden canvas
  const drawPreview = useCallback(() => {
    if (!imgElement || !canvasRef.current || !naturalWidth || !naturalHeight) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions
    const cropW = Math.max(1, Math.round(cropBox.width));
    const cropH = Math.max(1, Math.round(cropBox.height));
    const outW = cropW + marginLeft + marginRight;
    const outH = cropH + marginTop + marginBottom;

    canvas.width = outW;
    canvas.height = outH;

    ctx.clearRect(0, 0, outW, outH);

    // Draw background for expanded canvas if not transparent
    if (canvasBgType !== 'transparent') {
      let bg = '#ffffff';
      if (canvasBgType === 'black') bg = '#000000';
      else if (canvasBgType === 'custom') bg = customBgColor;

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, outW, outH);
    }

    // Draw cropped portion of image onto canvas with margins
    ctx.drawImage(
      imgElement,
      cropBox.x,
      cropBox.y,
      cropBox.width,
      cropBox.height,
      marginLeft,
      marginTop,
      cropW,
      cropH
    );
  }, [imgElement, cropBox, marginLeft, marginRight, marginTop, marginBottom, canvasBgType, customBgColor, naturalWidth, naturalHeight]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Reset to full image and clear margins
  const handleReset = () => {
    if (!naturalWidth || !naturalHeight) return;
    setCropBox({
      x: 0,
      y: 0,
      width: naturalWidth,
      height: naturalHeight
    });
    setMarginTop(0);
    setMarginRight(0);
    setMarginBottom(0);
    setMarginLeft(0);
    setAspectRatio('free');
    fitToScreen(naturalWidth, naturalHeight);
  };

  // Mouse Drag handlers for interactive visual Crop & Direct Canvas Expansion Handles
  const handleMouseDownOnHandle = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveHandle(handle);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialBox: { ...cropBox },
      initialMargins: { top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft }
    };
  };

  useEffect(() => {
    if (!activeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !naturalWidth || !naturalHeight) return;

      const scale = zoom;
      const deltaX = (e.clientX - dragStartRef.current.clientX) / scale;
      const deltaY = (e.clientY - dragStartRef.current.clientY) / scale;
      const initBox = dragStartRef.current.initialBox;
      const initMargins = dragStartRef.current.initialMargins;

      if (activeHandle === 'move') {
        const nextX = Math.min(Math.max(0, initBox.x + deltaX), naturalWidth - initBox.width);
        const nextY = Math.min(Math.max(0, initBox.y + deltaY), naturalHeight - initBox.height);
        setCropBox(prev => ({
          ...prev,
          x: Math.round(nextX),
          y: Math.round(nextY)
        }));
      } else {
        let nextX = initBox.x;
        let nextY = initBox.y;
        let nextW = initBox.width;
        let nextH = initBox.height;

        let nextTop = initMargins.top;
        let nextRight = initMargins.right;
        let nextBottom = initMargins.bottom;
        let nextLeft = initMargins.left;

        // Right Handle (Inward crops width, Outward expands right margin directly)
        if (activeHandle.includes('right')) {
          const rawRight = initBox.x + initBox.width + deltaX;
          if (rawRight > naturalWidth) {
            nextX = Math.min(nextX, 0);
            nextW = naturalWidth - nextX;
            nextRight = Math.max(0, Math.round(rawRight - naturalWidth));
          } else {
            nextW = Math.max(20, rawRight - nextX);
            nextRight = 0;
          }
        }

        // Bottom Handle (Inward crops height, Outward expands bottom margin directly)
        if (activeHandle.includes('bottom')) {
          const rawBottom = initBox.y + initBox.height + deltaY;
          if (rawBottom > naturalHeight) {
            nextY = Math.min(nextY, 0);
            nextH = naturalHeight - nextY;
            nextBottom = Math.max(0, Math.round(rawBottom - naturalHeight));
          } else {
            nextH = Math.max(20, rawBottom - nextY);
            nextBottom = 0;
          }
        }

        // Left Handle (Inward crops X, Outward expands left margin directly)
        if (activeHandle.includes('left')) {
          const rawLeft = initBox.x + deltaX;
          if (rawLeft < 0) {
            nextX = 0;
            nextW = initBox.x + initBox.width;
            nextLeft = Math.max(0, Math.round(-rawLeft));
          } else {
            const maxDelta = initBox.width - 20;
            const clampedDelta = Math.min(maxDelta, deltaX);
            nextX = initBox.x + clampedDelta;
            nextW = initBox.width - clampedDelta;
            nextLeft = 0;
          }
        }

        // Top Handle (Inward crops Y, Outward expands top margin directly)
        if (activeHandle.includes('top')) {
          const rawTop = initBox.y + deltaY;
          if (rawTop < 0) {
            nextY = 0;
            nextH = initBox.y + initBox.height;
            nextTop = Math.max(0, Math.round(-rawTop));
          } else {
            const maxDelta = initBox.height - 20;
            const clampedDelta = Math.min(maxDelta, deltaY);
            nextY = initBox.y + clampedDelta;
            nextH = initBox.height - clampedDelta;
            nextTop = 0;
          }
        }

        setCropBox({
          x: Math.round(nextX),
          y: Math.round(nextY),
          width: Math.round(nextW),
          height: Math.round(nextH)
        });

        if (marginLock && (nextTop > 0 || nextRight > 0 || nextBottom > 0 || nextLeft > 0)) {
          const maxMarg = Math.max(nextTop, nextRight, nextBottom, nextLeft);
          setMarginTop(maxMarg);
          setMarginRight(maxMarg);
          setMarginBottom(maxMarg);
          setMarginLeft(maxMarg);
        } else {
          setMarginTop(nextTop);
          setMarginRight(nextRight);
          setMarginBottom(nextBottom);
          setMarginLeft(nextLeft);
        }
      }
    };

    const handleMouseUp = () => {
      setActiveHandle(null);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeHandle, naturalWidth, naturalHeight, marginLock, zoom]);

  // Save / Overwrite or Save as Copy
  const handleSave = async (isCopy: boolean) => {
    if (!canvasRef.current || !file || isSaving) return;
    setIsSaving(true);
    setSaveMode(isCopy ? 'copy' : 'overwrite');

    try {
      const canvas = canvasRef.current;
      const isPng = file.extension.toLowerCase() === 'png' || canvasBgType === 'transparent';
      const mimeType = isPng ? 'image/png' : 'image/jpeg';
      const extension = isPng ? 'png' : (file.extension.toLowerCase() === 'png' ? 'png' : 'jpg');

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Չհաջողվեց գեներացնել պատկերը');
          setIsSaving(false);
          return;
        }

        const newFileName = isCopy
          ? `${file.name.replace(/\.[^/.]+$/, '')}_cropped_${Date.now().toString().slice(-4)}.${extension}`
          : (file.name.endsWith(`.${extension}`) ? file.name : `${file.name.replace(/\.[^/.]+$/, '')}.${extension}`);

        const formData = new FormData();
        const fileObj = new File([blob], newFileName, { type: mimeType });
        formData.append('file', fileObj);
        formData.append('folderId', file.folderId || '');
        if (!isCopy) {
          formData.append('replaceFileId', file.id);
        }

        const res = await fetch('/api/admin/media', {
          method: 'POST',
          headers: {
            Authorization: token || ''
          },
          body: formData
        });

        const data = await res.json();
        if (data.success && data.file) {
          onSaveSuccess(data.file, isCopy);
          onClose();
        } else {
          alert(data.error || 'Չհաջողվեց պահել պատկերը');
        }
        setIsSaving(false);
      }, mimeType, 0.95);
    } catch (err: any) {
      alert(err.message || 'Սխալ պահելիս');
      setIsSaving(false);
    }
  };

  if (!isOpen || !file || !mounted) return null;

  const outWidth = Math.round(cropBox.width + marginLeft + marginRight);
  const outHeight = Math.round(cropBox.height + marginTop + marginBottom);

  // Outer interactive frame bounds (combining crop and outward expansion)
  const visualFrameLeft = cropBox.x - marginLeft;
  const visualFrameTop = cropBox.y - marginTop;
  const visualFrameWidth = cropBox.width + marginLeft + marginRight;
  const visualFrameHeight = cropBox.height + marginTop + marginBottom;

  // Inverse scale to keep handles, borders, and controls at a constant visual screen size during zoom
  const invZoom = 1 / Math.max(0.01, zoom);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999999,
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'modalBackdropFadeIn 0.25s ease forwards'
      }}
      onClick={onClose}
    >
      <style>{`
        /* HD Slider Custom Styling */
        .hd-crop-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.16);
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .hd-crop-slider:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .hd-crop-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          border: 2.5px solid #ffffff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
          cursor: grab;
          transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }
        .hd-crop-slider::-webkit-slider-thumb:hover {
          transform: scale(1.18);
          background: #2563EB;
          box-shadow: 0 0 14px rgba(59, 130, 246, 0.7);
        }
        .hd-crop-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          border: 2.5px solid #ffffff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
          cursor: grab;
        }

        /* HD Button Custom Styling */
        .hd-crop-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-weight: 700;
          font-size: 0.82rem;
          border-radius: 10px;
          padding: 8px 14px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
          color: #ffffff !important;
          text-decoration: none;
          line-height: 1.2;
        }
        .hd-crop-btn * {
          color: inherit;
        }
        .hd-crop-btn:hover {
          transform: translateY(-1px);
        }
        .hd-crop-btn:active {
          transform: translateY(0);
        }
        .hd-crop-btn-primary {
          background: #2563EB !important;
          color: #ffffff !important;
          border: 1px solid #60A5FA !important;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
        }
        .hd-crop-btn-primary:hover {
          background: #1D4ED8 !important;
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6);
        }
        .hd-crop-btn-secondary {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }
        .hd-crop-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.18) !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
        }
      `}</style>

      <div
        style={{
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '1440px',
          height: '92vh',
          maxHeight: '94vh',
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          overflow: 'hidden',
          boxShadow: '0 25px 70px rgba(0,0,0,0.85)',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left Side: Interactive Visual Editor Workspace */}
        <div
          ref={workspaceRef}
          data-workspace-bg="true"
          onMouseDown={handleWorkspaceMouseDown}
          onWheel={handleWheel}
          style={{
            background: '#07090e',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: isPanMode ? (isPanning ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none'
          }}
        >
          {/* Top Bar: Dimensions Info & Reset */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '20px',
              right: '20px',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                pointerEvents: 'auto',
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '8px 16px',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.5)'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#60A5FA' }}>
                <span className="hd-icon icon-Cut" style={{ fontSize: '0.95rem' }} />
                <span style={{ color: '#ffffff' }}>Եզրատում․ <strong>{Math.round(cropBox.width)} × {Math.round(cropBox.height)}px</strong></span>
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>➔</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34D399' }}>
                <span className="hd-icon icon-Expand" style={{ fontSize: '0.9rem' }} />
                <span style={{ color: '#ffffff' }}>Կտավ․ <strong>{outWidth} × {outHeight}px</strong></span>
              </span>
            </div>

            <button
              type="button"
              className="hd-crop-btn hd-crop-btn-secondary"
              onClick={handleReset}
              style={{
                pointerEvents: 'auto',
                padding: '7px 14px',
                fontSize: '0.8rem'
              }}
              title="Զրոյացնել բոլոր փոփոխությունները"
            >
              <span className="hd-icon icon-Undo-Arrow" style={{ fontSize: '0.85rem' }} />
              <span>Զրոյացնել</span>
            </button>
          </div>

          {/* Bottom Floating Zoom & Pan Controls Toolbar */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '5px 12px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 28px rgba(0,0,0,0.65)'
            }}
          >
            {/* Pan Hand Toggle */}
            <button
              type="button"
              onClick={() => setIsPanMode(!isPanMode)}
              className="hd-crop-btn"
              style={{
                background: isPanMode ? '#2563EB' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${isPanMode ? '#60A5FA' : 'rgba(255,255,255,0.18)'}`,
                padding: '6px 12px',
                fontSize: '0.8rem'
              }}
              title="Տեղաշարժի կերպ (Pan / Բացատանիշ)"
            >
              <span className="hd-icon icon-Cursor" style={{ fontSize: '0.88rem' }} />
              <span>Pan</span>
            </button>

            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.22)', margin: '0 2px' }} />

            {/* Zoom Controls */}
            <button
              type="button"
              onClick={() => handleZoomChange(-0.1)}
              className="hd-crop-btn hd-crop-btn-secondary"
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                fontSize: '1.1rem',
                fontWeight: 800
              }}
              title="Փոքրացնել (Zoom Out)"
            >
              −
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '4px 8px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                minWidth: '52px',
                textAlign: 'center'
              }}
              title="100% Իրական մասշտաբ"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              type="button"
              onClick={() => handleZoomChange(0.1)}
              className="hd-crop-btn hd-crop-btn-secondary"
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                fontSize: '0.9rem',
                fontWeight: 800
              }}
              title="Մեծացնել (Zoom In)"
            >
              <span className="hd-icon icon-Plus" style={{ fontSize: '0.85rem' }} />
            </button>

            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.22)', margin: '0 2px' }} />

            <button
              type="button"
              onClick={() => fitToScreen(naturalWidth, naturalHeight)}
              className="hd-crop-btn"
              style={{
                background: 'rgba(59, 130, 246, 0.25)',
                color: '#93C5FD',
                border: '1px solid rgba(96, 165, 250, 0.45)',
                padding: '5px 12px',
                fontSize: '0.78rem'
              }}
              title="Հարմարեցնել էկրանին (Fit to screen)"
            >
              <span className="hd-icon icon-Full-Screen" style={{ fontSize: '0.85rem' }} />
              <span>Հարմարեցնել</span>
            </button>
          </div>

          {/* Zoomed & Panned Canvas Stage */}
          {imgElement && naturalWidth > 0 && (
            <div
              style={{
                position: 'relative',
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isPanning || activeHandle ? 'none' : 'transform 0.1s ease',
                display: 'inline-block'
              }}
            >
              {/* Outer Base Canvas Container */}
              <div
                style={{
                  position: 'relative',
                  width: `${naturalWidth}px`,
                  height: `${naturalHeight}px`,
                  boxShadow: '0 14px 50px rgba(0,0,0,0.8)',
                  background: canvasBgType === 'transparent'
                    ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 20px 20px'
                    : (canvasBgType === 'black' ? '#000000' : (canvasBgType === 'white' ? '#ffffff' : customBgColor)),
                  border: `${Math.max(1, 1 * invZoom)}px solid rgba(255,255,255,0.2)`
                }}
              >
                {/* Outward canvas margin extension indicator */}
                {(marginTop > 0 || marginRight > 0 || marginBottom > 0 || marginLeft > 0) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: `-${marginTop}px`,
                      right: `-${marginRight}px`,
                      bottom: `-${marginBottom}px`,
                      left: `-${marginLeft}px`,
                      zIndex: 1,
                      background: canvasBgType === 'transparent'
                        ? 'repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 20px 20px'
                        : (canvasBgType === 'black' ? '#000000' : (canvasBgType === 'white' ? '#ffffff' : customBgColor)),
                      border: `${Math.max(1.5, 2.5 * invZoom)}px dashed #3B82F6`,
                      pointerEvents: 'none'
                    }}
                  />
                )}

                {/* Base Image at 1:1 true scale (never shrinks when margins expand!) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={file.name}
                  draggable={false}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${naturalWidth}px`,
                    height: `${naturalHeight}px`,
                    display: 'block',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                />

                {/* Interactive Crop & Canvas Outward Expand Frame */}
                <div
                  style={{
                    position: 'absolute',
                    top: `${visualFrameTop}px`,
                    left: `${visualFrameLeft}px`,
                    width: `${visualFrameWidth}px`,
                    height: `${visualFrameHeight}px`,
                    boxShadow: '0 0 0 99999px rgba(0, 0, 0, 0.65)',
                    border: `${Math.max(1.5, 2.5 * invZoom)}px solid #3B82F6`,
                    cursor: isPanMode ? 'grab' : 'move',
                    boxSizing: 'border-box',
                    zIndex: 10
                  }}
                  onMouseDown={e => {
                    if (!isPanMode) handleMouseDownOnHandle('move', e);
                  }}
                >
                  {/* 3x3 Grid Lines with inverse zoom scaling */}
                  <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, borderTop: `${Math.max(1, 1 * invZoom)}px dashed rgba(255,255,255,0.45)`, pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, borderTop: `${Math.max(1, 1 * invZoom)}px dashed rgba(255,255,255,0.45)`, pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, borderLeft: `${Math.max(1, 1 * invZoom)}px dashed rgba(255,255,255,0.45)`, pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, borderLeft: `${Math.max(1, 1 * invZoom)}px dashed rgba(255,255,255,0.45)`, pointerEvents: 'none' }} />

                  {/* 4 Corner Resize & Expansion Handles (Inversely scaled for constant screen pixel size) */}
                  <div
                    onMouseDown={e => handleMouseDownOnHandle('top-left', e)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '20px',
                      height: '20px',
                      transform: `translate(-50%, -50%) scale(${invZoom})`,
                      transformOrigin: 'center center',
                      background: '#3B82F6',
                      border: '3px solid #ffffff',
                      borderRadius: '4px',
                      cursor: 'nwse-resize',
                      zIndex: 14,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.7)'
                    }}
                    title="Եզրատել / Մեծացնել կտավը"
                  />
                  <div
                    onMouseDown={e => handleMouseDownOnHandle('top-right', e)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '20px',
                      height: '20px',
                      transform: `translate(50%, -50%) scale(${invZoom})`,
                      transformOrigin: 'center center',
                      background: '#3B82F6',
                      border: '3px solid #ffffff',
                      borderRadius: '4px',
                      cursor: 'nesw-resize',
                      zIndex: 14,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.7)'
                    }}
                    title="Եզրատել / Մեծացնել կտավը"
                  />
                  <div
                    onMouseDown={e => handleMouseDownOnHandle('bottom-left', e)}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '20px',
                      height: '20px',
                      transform: `translate(-50%, 50%) scale(${invZoom})`,
                      transformOrigin: 'center center',
                      background: '#3B82F6',
                      border: '3px solid #ffffff',
                      borderRadius: '4px',
                      cursor: 'nesw-resize',
                      zIndex: 14,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.7)'
                    }}
                    title="Եզրատել / Մեծացնել կտավը"
                  />
                  <div
                    onMouseDown={e => handleMouseDownOnHandle('bottom-right', e)}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '20px',
                      height: '20px',
                      transform: `translate(50%, 50%) scale(${invZoom})`,
                      transformOrigin: 'center center',
                      background: '#3B82F6',
                      border: '3px solid #ffffff',
                      borderRadius: '4px',
                      cursor: 'nwse-resize',
                      zIndex: 14,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.7)'
                    }}
                    title="Եզրատել / Մեծացնել կտավը"
                  />

                  {/* 4 Edge Resize & Expansion Handles (Inversely scaled for constant screen pixel size) */}
                  <div
                    onMouseDown={e => handleMouseDownOnHandle('top', e)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      width: '34px',
                      height: '12px',
                      transform: `translate(-50%, -50%) scale(${invZoom})`,
                      transformOrigin: 'center center',
                      background: '#3B82F6',
                      border: '2.5px solid #ffffff',
                      borderRadius: '4px',
                      cursor: 'ns-resize',
                      zIndex: 13,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.6)'
                    }}
                    title="Վերևի եզրատում / Կտավի մեծացում"
                  />
                  <div
                    onMouseDown={e => handleMouseDownOnHandle('bottom', e)}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      width: '34px',
                      height: '12px',
                      transform: `translate(-50%, 50%) scale(${invZoom})`,
                      transformOrigin: 'center center',
                      background: '#3B82F6',
                      border: '2.5px solid #ffffff',
                      borderRadius: '4px',
                      cursor: 'ns-resize',
                      zIndex: 13,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.6)'
                    }}
                    title="Ներքևի եզրատում / Կտավի մեծացում"
                  />
                  <div
                    onMouseDown={e => handleMouseDownOnHandle('left', e)}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      width: '12px',
                      height: '34px',
                      transform: `translate(-50%, -50%) scale(${invZoom})`,
                      transformOrigin: 'center center',
                      background: '#3B82F6',
                      border: '2.5px solid #ffffff',
                      borderRadius: '4px',
                      cursor: 'ew-resize',
                      zIndex: 13,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.6)'
                    }}
                    title="Ձախ եզրատում / Կտավի մեծացում"
                  />
                  <div
                    onMouseDown={e => handleMouseDownOnHandle('right', e)}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      width: '12px',
                      height: '34px',
                      transform: `translate(50%, -50%) scale(${invZoom})`,
                      transformOrigin: 'center center',
                      background: '#3B82F6',
                      border: '2.5px solid #ffffff',
                      borderRadius: '4px',
                      cursor: 'ew-resize',
                      zIndex: 13,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.6)'
                    }}
                    title="Աջ եզրատում / Կտավի մեծացում"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hidden Working Canvas */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Right Side: Tools, Expansion, Presets & Actions */}
        <div
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderLeft: '1px solid rgba(255, 255, 255, 0.14)',
            background: '#0f172a',
            color: '#ffffff',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="hd-icon icon-Cut" style={{ color: '#60A5FA' }} />
                  <span>Եզրատում և Կտավ</span>
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px', wordBreak: 'break-all' }}>
                  {file.name}
                </div>
              </div>
              <button
                type="button"
                className="hd-crop-btn hd-crop-btn-secondary"
                onClick={onClose}
                title="Փակել (Esc)"
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px'
                }}
              >
                <span className="hd-icon icon-Close" />
              </button>
            </div>

            {/* Section 1: Aspect Ratio Presets */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '10px', color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="hd-icon icon-Expand" style={{ fontSize: '0.88rem', color: '#60A5FA' }} />
                <span>Համամասնություն (Aspect Ratio)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[
                  { id: 'free', label: 'Ազատ' },
                  { id: 'original', label: 'Բնօրինակ' },
                  { id: '1:1', label: '1:1' },
                  { id: '16:9', label: '16:9' },
                  { id: '4:3', label: '4:3' },
                  { id: '3:2', label: '3:2' },
                  { id: '9:16', label: '9:16' },
                  { id: '2:3', label: '2:3' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`hd-crop-btn ${aspectRatio === p.id ? 'hd-crop-btn-primary' : 'hd-crop-btn-secondary'}`}
                    onClick={() => applyAspectRatio(p.id as AspectRatioPreset)}
                    style={{
                      padding: '7px 4px',
                      fontSize: '0.76rem'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Canvas Margins / Outward Expansion (Տարածք ավելացնել դեպի դուրս) */}
            <div style={{ background: '#07090e', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="hd-icon icon-Expand" style={{ fontSize: '0.88rem', color: '#3B82F6' }} />
                  <span>Կտավի մեծացում (Լուսանցք)</span>
                </div>
                <button
                  type="button"
                  className="hd-crop-btn hd-crop-btn-secondary"
                  onClick={() => setMarginLock(!marginLock)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    color: marginLock ? '#60A5FA' : '#94A3B8'
                  }}
                  title={marginLock ? 'Բոլոր կողմերը կապված են' : 'Կողմերը կարգավորվում են առանձին'}
                >
                  <span className={`hd-icon ${marginLock ? 'icon-Locked' : 'icon-Unlocked'}`} style={{ fontSize: '0.8rem' }} />
                  <span>{marginLock ? 'Հավասար' : 'Առանձին'}</span>
                </button>
              </div>

              {marginLock ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94A3B8', marginBottom: '8px' }}>
                    <span>Բոլոր կողմերից․</span>
                    <span style={{ fontWeight: 800, color: '#60A5FA', fontSize: '0.88rem' }}>+{marginTop} px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={10}
                    value={marginTop}
                    onChange={e => handleMarginChange(parseInt(e.target.value) || 0)}
                    className="hd-crop-slider"
                  />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '3px' }}>Վերև (Top)</label>
                    <input
                      type="number"
                      min={0}
                      value={marginTop}
                      onChange={e => handleMarginChange(parseInt(e.target.value) || 0, 'top')}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 10px', color: '#ffffff', fontSize: '0.84rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '3px' }}>Աջ (Right)</label>
                    <input
                      type="number"
                      min={0}
                      value={marginRight}
                      onChange={e => handleMarginChange(parseInt(e.target.value) || 0, 'right')}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 10px', color: '#ffffff', fontSize: '0.84rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '3px' }}>Ներքև (Bottom)</label>
                    <input
                      type="number"
                      min={0}
                      value={marginBottom}
                      onChange={e => handleMarginChange(parseInt(e.target.value) || 0, 'bottom')}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 10px', color: '#ffffff', fontSize: '0.84rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '3px' }}>Ձախ (Left)</label>
                    <input
                      type="number"
                      min={0}
                      value={marginLeft}
                      onChange={e => handleMarginChange(parseInt(e.target.value) || 0, 'left')}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 10px', color: '#ffffff', fontSize: '0.84rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              {/* Canvas Background Color for expanded area */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginBottom: '8px', fontWeight: 600 }}>
                  Կտավի Ֆոնային Գույն․
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {[
                    { id: 'transparent', label: 'Թափանցիկ' },
                    { id: 'white', label: 'Սպիտակ' },
                    { id: 'black', label: 'Սև' }
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      className={`hd-crop-btn ${canvasBgType === b.id ? 'hd-crop-btn-primary' : 'hd-crop-btn-secondary'}`}
                      onClick={() => setCanvasBgType(b.id as any)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.76rem'
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={e => {
                      setCustomBgColor(e.target.value);
                      setCanvasBgType('custom');
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      border: canvasBgType === 'custom' ? '2.5px solid #3B82F6' : '1px solid rgba(255,255,255,0.25)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: 'transparent'
                    }}
                    title="Ընտրել կամայական գույն"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions: Save Overwrite / Save As Copy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              disabled={isSaving}
              className="hd-crop-btn hd-crop-btn-primary"
              onClick={() => handleSave(false)}
              style={{
                padding: '13px 18px',
                fontSize: '0.9rem',
                borderRadius: '12px'
              }}
            >
              <span className="hd-icon icon-Check" style={{ fontSize: '1.05rem' }} />
              <span>{isSaving && saveMode === 'overwrite' ? 'Պահվում է...' : 'Պահել (Վերագրել)'}</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              className="hd-crop-btn hd-crop-btn-secondary"
              onClick={() => handleSave(true)}
              style={{
                padding: '11px 18px',
                fontSize: '0.86rem',
                borderRadius: '12px'
              }}
            >
              <span className="hd-icon icon-Plus" style={{ fontSize: '0.95rem' }} />
              <span>{isSaving && saveMode === 'copy' ? 'Ստեղծվում է...' : 'Պահել որպես նոր նիշք'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
