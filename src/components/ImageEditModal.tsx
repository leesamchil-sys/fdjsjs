import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, AlertCircle, HelpCircle, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  onSave: (compressedBlob: Blob) => Promise<void>;
}

export default function ImageEditModal({ isOpen, onClose, petName, onSave }: ImageEditModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Cropping Workspace States
  const [zoom, setZoom] = useState<number>(1);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Drag State Tracking (Ref optimized for performance)
  const isDragging = useRef(false);
  const startDragCoords = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const animationFrameRef = useRef<number>();
  
  // Pinch-to-zoom State
  const initialPinchDistance = useRef<number | null>(null);
  const initialPinchZoom = useRef<number>(1);

  const VIEWPORT_SIZE = 220; // 220px display viewport size
  const OUTPUT_SIZE = 200;   // 200px output profile resolution (200x200: Retina 4x crisp sharpness + light ~15KB storage)

  useEffect(() => {
    return () => {
      // Cleanup preview URL if modal is unmounted
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle Wheel Zoom non-passively
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !previewUrl) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 0.05;
      const newZoom = Math.min(3, Math.max(1, zoomRef.current - (e.deltaY > 0 ? zoomFactor : -zoomFactor)));
      handleZoomChange(newZoom, e.clientX, e.clientY);
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', handleWheel);
    };
  }, [previewUrl, naturalSize]); // Rebind when naturalSize changes to get updated scale logic

  // Use a ref for onClose to avoid re-triggering the effect when the function reference changes
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Handle browser back button (popstate)
  useEffect(() => {
    if (isOpen) {
      const modalId = Date.now();
      window.history.pushState({ imageModalOpen: modalId }, '');

      const handlePopState = (e: PopStateEvent) => {
        // Prevent closing if we are returning to the modal's state 
        // (e.g., returning from a mobile native file picker's forward state)
        if (e.state?.imageModalOpen === modalId) {
          return;
        }
        e.preventDefault();
        onCloseRef.current();
      };

      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
        // Only pop the state if it's still our modal's state
        if (window.history.state?.imageModalOpen === modalId) {
          window.history.back();
        }
      };
    }
  }, [isOpen]);

  // Handle state cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setErrorMessage(null);
      setZoom(1);
      setIsProcessing(false);
      zoomRef.current = 1;
      offsetRef.current = { x: 0, y: 0 };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setErrorMessage(null);

    // Enforce 2MB size limit
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      setErrorMessage(`❌ 파일 크기가 너무 큽니다. (현재: ${(file.size / (1024 * 1024)).toFixed(2)}MB / 최대 제한: 2.00MB)`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('❌ 이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setZoom(1);
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    if (imageRef.current) {
      imageRef.current.style.transform = `translate(0px, 0px)`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Calculate Base Aspect Scale to fit image inside cover bounds
  const getBaseScale = () => {
    if (naturalSize.width === 0 || naturalSize.height === 0) return 1;
    return Math.max(VIEWPORT_SIZE / naturalSize.width, VIEWPORT_SIZE / naturalSize.height);
  };

  const baseScale = getBaseScale();
  const initWidth = naturalSize.width * baseScale;
  const initHeight = naturalSize.height * baseScale;

  const currentWidth = initWidth * zoom;
  const currentHeight = initHeight * zoom;

  // Clamp offset to ensure image always covers the viewport
  const clampOffset = (x: number, y: number, currentZ: number) => {
    const activeWidth = initWidth * currentZ;
    const activeHeight = initHeight * currentZ;

    const maxOffsetX = Math.max(0, (activeWidth - VIEWPORT_SIZE) / 2);
    const minOffsetX = -maxOffsetX;

    const maxOffsetY = Math.max(0, (activeHeight - VIEWPORT_SIZE) / 2);
    const minOffsetY = -maxOffsetY;

    return {
      x: Math.min(maxOffsetX, Math.max(minOffsetX, x)),
      y: Math.min(maxOffsetY, Math.max(minOffsetY, y)),
    };
  };

  // Adjust translation on zoom adjustments so image stays centered
  const handleZoomChange = (newZoom: number, clientX?: number, clientY?: number) => {
    let clamped;
    if (clientX !== undefined && clientY !== undefined && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const originX = clientX - centerX;
      const originY = clientY - centerY;
      
      const oldZoom = zoomRef.current;
      const zoomRatio = newZoom / oldZoom;
      
      const newOffsetX = originX - (originX - offsetRef.current.x) * zoomRatio;
      const newOffsetY = originY - (originY - offsetRef.current.y) * zoomRatio;
      
      clamped = clampOffset(newOffsetX, newOffsetY, newZoom);
    } else {
      clamped = clampOffset(offsetRef.current.x, offsetRef.current.y, newZoom);
    }
    
    setZoom(newZoom);
    zoomRef.current = newZoom;
    offsetRef.current = clamped;
    if (imageRef.current) {
      imageRef.current.style.transform = `translate(${clamped.x}px, ${clamped.y}px)`;
    }
  };

  // Drag and Touch Handlers
  const startDragging = (clientX: number, clientY: number) => {
    isDragging.current = true;
    startDragCoords.current = { x: clientX, y: clientY };
    startOffset.current = { ...offsetRef.current };
  };

  const moveDragging = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const deltaX = clientX - startDragCoords.current.x;
    const deltaY = clientY - startDragCoords.current.y;

    const newX = startOffset.current.x + deltaX;
    const newY = startOffset.current.y + deltaY;

    const clamped = clampOffset(newX, newY, zoomRef.current);
    offsetRef.current = clamped;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      if (imageRef.current) {
        imageRef.current.style.transform = `translate(${clamped.x}px, ${clamped.y}px)`;
      }
    });
  };

  const stopDragging = () => {
    isDragging.current = false;
  };

  const handleSave = async () => {
    if (!selectedFile || !previewUrl) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Ensure image is fully loaded and valid before drawing to canvas
      const imgElement = new Image();
      await new Promise<void>((resolve, reject) => {
        imgElement.onload = () => resolve();
        imgElement.onerror = () => reject(new Error('이미지를 불러오는데 실패했거나 손상된 이미지 파일입니다.'));
        imgElement.src = previewUrl;
      });

      if (!imgElement.complete || imgElement.naturalWidth === 0) {
        throw new Error('손상되었거나 올바르지 않은 이미지 파일입니다.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context loading failed.');
      }

      // Mathematical Upscaling Ratio from viewport display to output canvas
      const upscaleRatio = OUTPUT_SIZE / VIEWPORT_SIZE;

      const drawWidth = initWidth * zoom * upscaleRatio;
      const drawHeight = initHeight * zoom * upscaleRatio;

      const drawX = (OUTPUT_SIZE - drawWidth) / 2 + offsetRef.current.x * upscaleRatio;
      const drawY = (OUTPUT_SIZE - drawHeight) / 2 + offsetRef.current.y * upscaleRatio;

      // Draw customized crop area to Canvas
      ctx.drawImage(imgElement, drawX, drawY, drawWidth, drawHeight);

      // Compress to high performance JPEG Blob
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            try {
              await onSave(blob);
              onClose();
            } catch (saveError: any) {
              setErrorMessage(saveError.message || '프로필을 저장하는 과정에서 오류가 발생했습니다.');
              setIsProcessing(false);
            }
          } else {
            setErrorMessage('이미지 변환 처리에 실패했습니다.');
            setIsProcessing(false);
          }
        },
        'image/jpeg',
        0.88
      );
    } catch (err: any) {
      console.error('Error cropping image:', err);
      setErrorMessage(err.message || '이미지를 처리하는 과정에서 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-stone-900/60 dark:bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-150 dark:border-stone-800">
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
              🐾 {petName} 프로필 사진 편집
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 custom-scrollbar flex-1">
          {/* Thumbnails Specs & Guidance */}
          <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-900/30 p-3 rounded-xl">
            <h4 className="text-[11px] font-black text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-1.5">
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              확인해주세요!
            </h4>
            <div className="text-[10.5px] text-stone-600 dark:text-stone-300 font-semibold leading-relaxed space-y-1">
              <p>사진은 현재 사용중인 기기에만 저장되며 서버에 업로드 되지 않습니다.</p>
              <p className="text-amber-700 dark:text-amber-400/90 text-[10px]">⚠️ 브라우저 캐시를 삭제하면 복구할 수 없으니 주의해주세요.</p>
            </div>
          </div>

          {/* Upload Area / Interactive Workspace */}
          {!previewUrl ? (
            <div
              onDragEnter={handleDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragOver}
              onDrop={handleDrop}
              onClick={handleButtonClick}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-amber-500 bg-amber-500/5'
                  : 'border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-850/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
              <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500 dark:text-stone-400 mb-2.5">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-xs font-black text-stone-700 dark:text-stone-200">
                사진을 드래그해서 놓거나 클릭하여 선택
              </p>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 font-bold">
                JPEG, PNG, WEBP 등 지원 (최대 2MB)
              </p>
            </div>
          ) : (
            /* Interactive Cropping Workspace */
            <div className="flex flex-col items-center justify-center p-4 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-950/20">
              
              {/* Image Viewport container with circular preview mask */}
              <div
                ref={viewportRef}
                style={{ width: '100%', height: 260 }}
                onMouseDown={(e) => startDragging(e.clientX, e.clientY)}
                onMouseMove={(e) => moveDragging(e.clientX, e.clientY)}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
                onTouchStart={(e) => {
                  if (e.touches.length === 2) {
                    const dist = Math.hypot(
                      e.touches[0].clientX - e.touches[1].clientX,
                      e.touches[0].clientY - e.touches[1].clientY
                    );
                    initialPinchDistance.current = dist;
                    initialPinchZoom.current = zoomRef.current;
                  } else if (e.touches.length === 1) {
                    startDragging(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 2 && initialPinchDistance.current !== null) {
                    const dist = Math.hypot(
                      e.touches[0].clientX - e.touches[1].clientX,
                      e.touches[0].clientY - e.touches[1].clientY
                    );
                    const ratio = dist / initialPinchDistance.current;
                    const newZoom = Math.min(3, Math.max(1, initialPinchZoom.current * ratio));
                    
                    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                    handleZoomChange(newZoom, centerX, centerY);
                  } else if (e.touches.length === 1) {
                    moveDragging(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
                onTouchEnd={(e) => {
                  if (e.touches.length < 2) {
                    initialPinchDistance.current = null;
                  }
                  if (e.touches.length === 1) {
                    startDragging(e.touches[0].clientX, e.touches[0].clientY);
                  } else if (e.touches.length === 0) {
                    stopDragging();
                  }
                }}
                className="relative overflow-hidden rounded-xl cursor-grab active:cursor-grabbing select-none bg-stone-200 dark:bg-stone-900 flex items-center justify-center touch-none"
              >
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Crop Preview"
                  referrerPolicy="no-referrer"
                  onLoad={(e) => {
                    const target = e.currentTarget;
                    setNaturalSize({
                      width: target.naturalWidth,
                      height: target.naturalHeight,
                    });
                  }}
                  onError={() => {
                    setErrorMessage('❌ 이미지를 불러올 수 없거나 손상된 파일입니다.');
                  }}
                  style={{
                    width: currentWidth || 'auto',
                    height: currentHeight || 'auto',
                    transform: `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px)`,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: currentHeight ? -currentHeight / 2 : 0,
                    marginLeft: currentWidth ? -currentWidth / 2 : 0,
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }}
                  className="pointer-events-none"
                />
                
                {/* Visual grid aid & instructions overlay */}
                <div 
                  className="absolute pointer-events-none rounded-[72px] border-[3px] border-amber-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] dark:shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] flex items-center justify-center"
                  style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
                >
                  <div className="bg-black/40 text-white rounded-full p-1.5 opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <Move className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Slider for Zoom Controls */}
              <div className="w-full mt-5 px-2">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <ZoomOut className="h-4 w-4" />
                  <ZoomIn className="h-4 w-4" />
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-200/50 dark:border-rose-900/30 rounded-xl flex items-start gap-2 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-4 border-t border-stone-150 dark:border-stone-800 flex items-center justify-end gap-2 bg-stone-50 dark:bg-stone-900">
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-3.5 py-1.5 text-xs font-bold text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-850 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          
          {previewUrl && (
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-4 py-1.5 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isProcessing ? '처리 중...' : '적용하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
