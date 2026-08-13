import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Anchor } from 'lucide-react';
import { SEASONAL_EVENTS } from '../data/seasonal';
import { cn } from '../lib/utils';

interface SeasonalSelectorProps {
  activeSeasonIds: string[];
  onToggleSeason: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

// 각 시즌 메타데이터 정의 (썸네일 이미지, 서브타이틀, 테마 색상 클래스)
const SEASON_METAS: Record<string, {
  image: string;
  subtitle: string;
  colorClass: string;
  gradClass: string;
  activeIconBg: string;
}> = {
  event_1: {
    image: '/images/seasons/event_1.png',
    subtitle: '신비로운 심해의 생물들을 만나보세요.',
    colorClass: 'border-blue-300 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/15',
    gradClass: 'from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/5',
    activeIconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-xs'
  }
};

const SeasonThumbnail: React.FC<{ src: string; alt: string; isActive: boolean }> = ({ src, alt, isActive }) => {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-stone-500 text-xl select-none">
        <span>🐋</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      referrerPolicy="no-referrer"
    />
  );
};

export const SeasonalSelector: React.FC<SeasonalSelectorProps> = ({
  activeSeasonIds,
  onToggleSeason,
  isOpen,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-[32px] shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col max-h-[85vh]"
          >
            {/* Top Accent Gradient Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-pink-400 via-amber-400 to-sky-400 shrink-0" />

            {/* Header - Fixed */}
            <div className="p-6 pb-4 shrink-0 border-b border-stone-100 dark:border-stone-800/60">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Anchor className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-stone-900 dark:text-stone-100 tracking-tight">
                      시즌 이벤트 도감 설정
                    </h2>
                    <p className="text-[10.5px] font-bold text-stone-400 dark:text-stone-500 mt-0.5 leading-relaxed">
                      시즌 이벤트 도감을 활성화할 수 있습니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-400 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Seasonal Toggle Items List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5 min-h-0 custom-scrollbar">
              {SEASONAL_EVENTS.map((event) => {
                const isActive = activeSeasonIds.includes(event.id);
                const meta = SEASON_METAS[event.id] || {
                  image: `/images/seasons/${event.id}.png`,
                  subtitle: '심해에서의 만남',
                  colorClass: 'border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/15',
                  gradClass: 'from-amber-500/5 to-yellow-500/5 dark:from-amber-500/10 dark:to-yellow-500/5',
                  activeIconBg: 'bg-amber-500 text-white shadow-xs'
                };

                return (
                  <div
                    key={event.id}
                    onClick={() => onToggleSeason(event.id)}
                    className={cn(
                      "w-full flex flex-col p-4 rounded-3xl border-2 transition-all relative overflow-hidden cursor-pointer select-none group",
                      isActive
                        ? `${meta.colorClass} shadow-md shadow-amber-500/5`
                        : "bg-white dark:bg-stone-900 border-stone-150 dark:border-stone-800 hover:border-stone-250 dark:hover:border-stone-700 hover:bg-stone-50/30"
                    )}
                  >
                    {/* Interactive Layer Gradient */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br transition-opacity opacity-40 group-hover:opacity-60 pointer-events-none",
                      meta.gradClass
                    )} />

                    <div className="flex items-center justify-between relative z-10 w-full">
                      <div className="flex items-center gap-3.5">
                        {/* Season Thumbnail Box */}
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-stone-200/60 dark:border-stone-800/80 shrink-0 shadow-2xs relative bg-stone-50 dark:bg-stone-950">
                          <SeasonThumbnail
                            src={meta.image}
                            alt={event.name}
                            isActive={isActive}
                          />
                        </div>

                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <h3 className={cn(
                              "font-black text-sm tracking-tight",
                              isActive ? "text-stone-900 dark:text-white" : "text-stone-800 dark:text-stone-200"
                            )}>
                              {event.name}
                            </h3>
                            {isActive && (
                              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 mt-0.5">
                            {meta.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* IOS style switch */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSeason(event.id);
                          }}
                          className={cn(
                            "w-11 h-6 rounded-full relative transition-all cursor-pointer",
                            isActive 
                              ? "bg-amber-500 shadow-sm shadow-amber-500/20" 
                              : "bg-stone-200 dark:bg-stone-850"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-xs",
                            isActive ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer - Fixed */}
            <div className="p-6 pt-4 shrink-0 border-t border-stone-100 dark:border-stone-800/60">
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-stone-150 dark:hover:bg-stone-205 text-white dark:text-slate-900 rounded-2xl font-black text-xs shadow-lg active:scale-[0.98] transition-all cursor-pointer"
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
