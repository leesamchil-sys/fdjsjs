import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Check, 
  Dog, 
  Cat, 
  ArrowUpToLine, 
  ArrowDownToLine,
  ArrowUpDown
} from 'lucide-react';
import { Pet } from '../types';
import { cn } from '../lib/utils';
import { useBackDismiss } from '../hooks/useBackDismiss';

interface PetReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pets: Pet[];
  onSave: (newPets: Pet[]) => void;
  petImageUrls?: Record<string, string>;
}

export default function PetReorderModal({
  isOpen,
  onClose,
  pets,
  onSave,
  petImageUrls = {},
}: PetReorderModalProps) {
  useBackDismiss(isOpen, onClose, 'petReorderModal');

  // Internal ordered list initialized from props when modal opens
  const [orderedPets, setOrderedPets] = useState<Pet[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'hotel'>('all');

  // Drag and Drop States
  const [draggedPetId, setDraggedPetId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [targetPetId, setTargetPetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('before');

  const listContainerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number>(0);

  // Sync internal list when modal opens or pets prop changes
  useEffect(() => {
    if (isOpen) {
      setOrderedPets([...pets]);
      setDraggedPetId(null);
      setTargetPetId(null);

      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const backdropEl = backdropRef.current;

      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          touchStartYRef.current = e.touches[0].clientY;
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        const listEl = listContainerRef.current;
        if (!listEl) {
          if (e.cancelable) e.preventDefault();
          return;
        }

        const isInsideList = listEl.contains(e.target as Node);
        if (!isInsideList) {
          if (e.cancelable) e.preventDefault();
          return;
        }

        const currentY = e.touches[0]?.clientY || 0;
        const deltaY = touchStartYRef.current - currentY; // positive = scrolling down (finger up), negative = scrolling up (finger down)
        const scrollTop = listEl.scrollTop;
        const scrollHeight = listEl.scrollHeight;
        const clientHeight = listEl.clientHeight;

        // If list doesn't overflow (no scrollable content)
        if (scrollHeight <= clientHeight) {
          if (e.cancelable) e.preventDefault();
          return;
        }

        // If at top and pulling down (scrolling up)
        if (scrollTop <= 0 && deltaY < 0) {
          if (e.cancelable) e.preventDefault();
          return;
        }

        // If at bottom and pulling up (scrolling down)
        if (scrollTop + clientHeight >= scrollHeight - 1 && deltaY > 0) {
          if (e.cancelable) e.preventDefault();
          return;
        }
      };

      if (backdropEl) {
        backdropEl.addEventListener('touchstart', handleTouchStart, { passive: true });
        backdropEl.addEventListener('touchmove', handleTouchMove, { passive: false });
      }

      return () => {
        if (backdropEl) {
          backdropEl.removeEventListener('touchstart', handleTouchStart);
          backdropEl.removeEventListener('touchmove', handleTouchMove);
        }
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen, pets]);

  // Reordering array helper
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= orderedPets.length || fromIndex === toIndex) return;
    setOrderedPets(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const moveById = (id: string, delta: number) => {
    const currentIndex = orderedPets.findIndex(p => p.id === id);
    if (currentIndex === -1) return;
    const targetIndex = currentIndex + delta;
    if (targetIndex >= 0 && targetIndex < orderedPets.length) {
      moveItem(currentIndex, targetIndex);
    }
  };

  const moveToExtreme = (id: string, position: 'top' | 'bottom') => {
    const currentIndex = orderedPets.findIndex(p => p.id === id);
    if (currentIndex === -1) return;
    const targetIndex = position === 'top' ? 0 : orderedPets.length - 1;
    moveItem(currentIndex, targetIndex);
  };

  // Start drag handler
  const handleDragStart = (e: React.PointerEvent, petId: string) => {
    if (e.button !== 0) return; // Primary pointer only
    e.preventDefault();
    e.stopPropagation();

    setDraggedPetId(petId);
    setDragPos({ x: e.clientX, y: e.clientY });
    setTargetPetId(petId);
    setDropPosition('before');
  };

  // Global window pointer move & up listeners during active drag
  useEffect(() => {
    if (!draggedPetId) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });

      if (!listContainerRef.current) return;

      // Find item card under cursor
      const container = listContainerRef.current;
      const cardElements: HTMLElement[] = Array.from(container.querySelectorAll('[data-pet-id]'));

      let foundTargetId: string | null = null;
      let foundPos: 'before' | 'after' = 'before';

      for (const card of cardElements) {
        const rect = card.getBoundingClientRect();
        // Check if cursor Y is within item bounds (or slightly padded)
        if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
          foundTargetId = card.getAttribute('data-pet-id');
          const midY = rect.top + rect.height / 2;
          foundPos = e.clientY < midY ? 'before' : 'after';
          break;
        }
      }

      // Fallback: if cursor is above first item or below last item in container
      if (!foundTargetId && cardElements.length > 0) {
        const firstRect = cardElements[0].getBoundingClientRect();
        const lastRect = cardElements[cardElements.length - 1].getBoundingClientRect();

        if (e.clientY < firstRect.top) {
          foundTargetId = cardElements[0].getAttribute('data-pet-id');
          foundPos = 'before';
        } else if (e.clientY > lastRect.bottom) {
          foundTargetId = cardElements[cardElements.length - 1].getAttribute('data-pet-id');
          foundPos = 'after';
        }
      }

      if (foundTargetId) {
        setTargetPetId(foundTargetId);
        setDropPosition(foundPos);
      }
    };

    const handleWindowPointerUp = () => {
      if (draggedPetId && targetPetId && draggedPetId !== targetPetId) {
        setOrderedPets(prev => {
          const fromIdx = prev.findIndex(p => p.id === draggedPetId);
          let toIdx = prev.findIndex(p => p.id === targetPetId);

          if (fromIdx !== -1 && toIdx !== -1) {
            if (dropPosition === 'after') {
              toIdx = toIdx > fromIdx ? toIdx : toIdx + 1;
            } else {
              toIdx = toIdx < fromIdx ? toIdx : toIdx;
            }
            const finalIdx = Math.max(0, Math.min(prev.length - 1, toIdx));
            
            const next = [...prev];
            const [moved] = next.splice(fromIdx, 1);
            next.splice(finalIdx, 0, moved);
            return next;
          }
          return prev;
        });
      }

      setDraggedPetId(null);
      setTargetPetId(null);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [draggedPetId, targetPetId, dropPosition]);

  if (!isOpen) return null;

  const activeCount = orderedPets.filter(p => !p.isHotel).length;
  const hotelCount = orderedPets.filter(p => p.isHotel).length;

  const displayPets = orderedPets.filter(p => {
    if (filterTab === 'active') return !p.isHotel;
    if (filterTab === 'hotel') return p.isHotel;
    return true;
  });

  const draggedPetObj = orderedPets.find(p => p.id === draggedPetId);

  const handleReset = () => {
    setOrderedPets([...pets]);
    setDraggedPetId(null);
    setTargetPetId(null);
  };

  const handleSave = () => {
    onSave(orderedPets);
    onClose();
  };

  return (
    <div 
      ref={backdropRef}
      className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in select-none overscroll-none touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xl flex flex-col h-[500px] max-h-[80vh] overflow-hidden overscroll-none touch-auto"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-200/70 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-900/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <ArrowUpDown className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-850 dark:text-stone-100">
                반려동물 순서 변경
              </h3>
              <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500">
                아이콘을 잡고 드래그하거나 화살표로 이동하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-1 border-b border-stone-100 dark:border-stone-800/60 bg-stone-50/30 dark:bg-stone-950/20">
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/60 p-0.5 rounded-xl text-xs font-bold w-full">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={cn(
                "flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px]",
                filterTab === 'all'
                  ? "bg-white dark:bg-stone-700 text-stone-850 dark:text-stone-100 shadow-3xs font-extrabold"
                  : "text-stone-500 hover:text-stone-700 dark:text-stone-400"
              )}
            >
              전체 ({orderedPets.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('active')}
              className={cn(
                "flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px]",
                filterTab === 'active'
                  ? "bg-white dark:bg-stone-700 text-stone-850 dark:text-stone-100 shadow-3xs font-extrabold"
                  : "text-stone-500 hover:text-stone-700 dark:text-stone-400"
              )}
            >
              🐾 마이펫 ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('hotel')}
              className={cn(
                "flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px]",
                filterTab === 'hotel'
                  ? "bg-white dark:bg-stone-700 text-stone-850 dark:text-stone-100 shadow-3xs font-extrabold"
                  : "text-stone-500 hover:text-stone-700 dark:text-stone-400"
              )}
            >
              🏡 펫 호텔 ({hotelCount})
            </button>
          </div>
        </div>

        {/* List Content */}
        <div 
          ref={listContainerRef}
          className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar touch-pan-y overscroll-contain"
        >
          {displayPets.length === 0 ? (
            <div className="py-10 text-center text-xs text-stone-400 font-bold">
              등록된 반려동물이 없습니다.
            </div>
          ) : (
            displayPets.map((pet) => {
              const globalIndex = orderedPets.findIndex(p => p.id === pet.id);
              const isFirst = globalIndex === 0;
              const isLast = globalIndex === orderedPets.length - 1;
              const isDragged = draggedPetId === pet.id;
              const isTarget = targetPetId === pet.id;

              const countLikes = Object.values(pet.preferences || {}).filter(v => v === 'like').length;

              return (
                <React.Fragment key={pet.id}>
                  {/* Insertion Guideline Indicator Before Item */}
                  {isTarget && dropPosition === 'before' && !isDragged && (
                    <div className="flex items-center gap-2 my-1.5 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <div className="flex-1 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-full shadow-sm" />
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 shrink-0 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                        이 위치로 이동
                      </span>
                    </div>
                  )}

                  <div
                    data-pet-id={pet.id}
                    className={cn(
                      "group relative flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all select-none touch-pan-y",
                      isDragged
                        ? "opacity-25 border-dashed border-amber-400 bg-amber-50/30 dark:bg-amber-950/10"
                        : "border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700"
                    )}
                  >
                    {/* Left Handle & Pet Info */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Drag Handle button */}
                      <button
                        type="button"
                        onPointerDown={(e) => handleDragStart(e, pet.id)}
                        className="p-1.5 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none"
                        title="드래그하여 순서 이동"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>

                      {/* Pet Avatar Icon / Image */}
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-2xs overflow-hidden",
                        !petImageUrls[pet.id] && (pet.type === 'dog' ? "bg-amber-500 dark:bg-amber-600" : "bg-sky-500 dark:bg-sky-600")
                      )}>
                        {petImageUrls[pet.id] ? (
                          <img
                            src={petImageUrls[pet.id]}
                            alt={pet.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover rounded-lg"
                          />
                        ) : (
                          pet.type === 'dog' ? <Dog className="h-4 w-4" /> : <Cat className="h-4 w-4" />
                        )}
                      </div>

                      {/* Name & Badges */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-stone-850 dark:text-stone-100 truncate max-w-[120px]">
                            {pet.name}
                          </span>
                          {pet.isHotel && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-extrabold shrink-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                              🏡 호텔
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-semibold text-stone-400 dark:text-stone-500 mt-0.5">
                          <span>선호: <strong className="text-amber-600 dark:text-amber-400 font-bold">{countLikes}개</strong></span>
                          <span>•</span>
                          <span>{pet.type === 'dog' ? '강아지' : '고양이'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Control Buttons (Up/Down & Top/Bottom) */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveToExtreme(pet.id, 'top')}
                        className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 disabled:hover:text-stone-400 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:cursor-default"
                        title="맨 위로 이동"
                      >
                        <ArrowUpToLine className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveById(pet.id, -1)}
                        className="p-1 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-20 disabled:hover:text-stone-400 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:cursor-default"
                        title="위로 이동"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveById(pet.id, 1)}
                        className="p-1 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-20 disabled:hover:text-stone-400 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:cursor-default"
                        title="아래로 이동"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveToExtreme(pet.id, 'bottom')}
                        className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 disabled:hover:text-stone-400 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:cursor-default"
                        title="맨 아래로 이동"
                      >
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Insertion Guideline Indicator After Item */}
                  {isTarget && dropPosition === 'after' && !isDragged && (
                    <div className="flex items-center gap-2 my-1.5 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <div className="flex-1 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-full shadow-sm" />
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 shrink-0 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                        이 위치로 이동
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200/70 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-900/80 gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            초기화
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-extrabold text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-xl transition-all cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Check className="h-3.5 w-3.5" />
              저장하기
            </button>
          </div>
        </div>
      </div>

      {/* Floating Drag Preview Card following mouse/finger */}
      {draggedPetObj && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-xl border border-amber-500 bg-white/95 dark:bg-stone-900/95 p-2.5 flex items-center justify-between gap-3 w-[290px] opacity-90 shadow-2xl scale-105 backdrop-blur-xs ring-2 ring-amber-500/30 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <GripVertical className="h-4 w-4 text-amber-600 shrink-0" />
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-2xs overflow-hidden",
              !petImageUrls[draggedPetObj.id] && (draggedPetObj.type === 'dog' ? "bg-amber-500" : "bg-sky-500")
            )}>
              {petImageUrls[draggedPetObj.id] ? (
                <img
                  src={petImageUrls[draggedPetObj.id]}
                  alt={draggedPetObj.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                draggedPetObj.type === 'dog' ? <Dog className="h-4 w-4" /> : <Cat className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-stone-900 dark:text-stone-100 truncate">
                  {draggedPetObj.name}
                </span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold shrink-0",
                  draggedPetObj.isHotel ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-800"
                )}>
                  {draggedPetObj.isHotel ? '🏡 호텔' : '🐾 마이펫'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
