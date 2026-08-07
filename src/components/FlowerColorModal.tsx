import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles, Flower2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { GardeningItem } from '../types';
import { FLOWER_IMAGE_MAPPING, FLOWER_COLOR_VARIANTS } from '../data/gardening';

interface FlowerColorModalProps {
  item: GardeningItem | null;
  isOpen: boolean;
  onClose: () => void;
  flowerColors: Record<string, boolean>;
  onToggleColor: (itemId: string, variantKey: string) => void;
}

export default function FlowerColorModal({
  item,
  isOpen,
  onClose,
  flowerColors,
  onToggleColor
}: FlowerColorModalProps) {
  if (!isOpen || !item) return null;

  const flowerPrefix = FLOWER_IMAGE_MAPPING[item.name];
  const variants = FLOWER_COLOR_VARIANTS[item.name] || ['1', '2', '3', '4', '5', '6'];
  const collectedCount = variants.filter(v => flowerColors[v]).length;
  const totalCount = variants.length;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs select-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl max-w-sm sm:max-w-md w-full overflow-hidden flex flex-col max-h-[75vh] sm:max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 text-lg">
                {item.emoji || '🌸'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                    {item.name} 색상별 수집 도감
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {collectedCount} / {totalCount} 완료
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                  각 색상별 꽃을 수집하고 체크하여 도감을 완성해보세요!
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-stone-200/60 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {variants.map((v) => {
                const isCollected = !!flowerColors[v];
                const imgUrl = flowerPrefix 
                  ? `/images/gardening/${item.name}/${flowerPrefix}_${v}.webp`
                  : '';
                const label = v === 'Thu' ? '특수색 (Thu)' : `색상 ${v}`;

                return (
                  <div
                    key={v}
                    onClick={() => onToggleColor(item.id, v)}
                    className={cn(
                      "group relative flex items-center justify-center rounded-2xl border-2 transition-all cursor-pointer select-none overflow-hidden aspect-square",
                      isCollected
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 shadow-sm"
                        : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
                    )}
                  >
                    {/* Check indicator badge */}
                    <div className={cn(
                      "absolute top-2 right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center transition-all z-10 border-2",
                      isCollected
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-sm scale-100"
                        : "bg-white/80 dark:bg-stone-800/80 border-stone-300 dark:border-stone-600 text-transparent scale-100 group-hover:border-emerald-400 group-hover:bg-emerald-50/50"
                    )}>
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[3]" />
                    </div>

                    {/* Image */}
                    <img
                      src={imgUrl}
                      alt={`${item.name} ${label}`}
                      className={cn(
                        "w-3/4 h-3/4 object-contain transition-transform duration-300 pointer-events-none",
                        isCollected ? "scale-105" : "group-hover:scale-110"
                      )}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-bold hover:opacity-95 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              확인
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
