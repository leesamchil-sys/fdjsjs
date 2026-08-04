import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Settings, X, Bell, Navigation, Heart, Smartphone, Monitor, Volume2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  canShow?: boolean;
}

export const UpdateFeaturesPopup: React.FC<Props> = ({ canShow = true }) => {
  const POPUP_VERSION = '20260718_interactive_map';
  const STORAGE_KEY = `has_seen_update_popup_${POPUP_VERSION}`;
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // 로컬스토리지 값을 확인하고, 지정된 노출 기간인지 체크하여 노출합니다.
  useEffect(() => {
    if (!canShow) {
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      const now = new Date();
      const startTime = new Date('2026-07-18T00:00:00');
      const endTime = new Date('2026-07-25T23:59:59');
      
      const isInTimeRange = now >= startTime && now <= endTime;
      const hasSeen = localStorage.getItem(STORAGE_KEY);
      
      if (isInTimeRange && !hasSeen) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 2000); // Increased delay to 2000ms to give other modals time to finish animations

    return () => clearTimeout(timer);
  }, [STORAGE_KEY, canShow]);

  const handleClosePermanently = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const nextPage = () => {
    if (currentPage < 1) setCurrentPage(p => p + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div data-nosnippet className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/20 dark:bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-lg overflow-hidden rounded-[32px] bg-stone-50 dark:bg-stone-900 isolate bg-gradient-to-b from-stone-100/50 to-stone-50 dark:from-stone-900 dark:to-stone-950 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] border border-stone-200/80 dark:border-stone-800/80 flex flex-col max-h-[82vh] sm:max-h-[90vh] relative"
          >
            <div className="p-5 sm:p-7 pb-4 flex items-center justify-between shrink-0 border-b border-stone-200/50 dark:border-stone-800/60">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex-shrink-0 p-3 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-inner",
                  currentPage === 0 
                    ? "bg-sky-100/80 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/50"
                    : "bg-amber-100/80 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50"
                )}>
                  {currentPage === 0 ? <Navigation className="h-6 w-6" /> : <span className="h-6 w-6 flex items-center justify-center text-xl">🐳</span>}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[10px] font-black tracking-wider px-2.5 py-0.5 rounded-full uppercase",
                      currentPage === 0
                        ? "text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-400/10 border border-sky-500/10 dark:border-sky-400/10"
                        : "text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/10 dark:border-amber-400/10"
                    )}>
                      {currentPage === 0 ? "NEW FEATURE" : "TIP"}
                    </span>
                  </div>
                  <h3 className="text-[20px] sm:text-[22px] font-black text-stone-900 dark:text-stone-50 leading-tight tracking-tight">
                    {currentPage === 0 ? "인터렉티브 맵 출시" : "고래낙하 협곡 이용 팁"}
                  </h3>
                </div>
              </div>
              <button 
                onClick={handleClosePermanently}
                className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-all bg-stone-200/50 hover:bg-stone-200 dark:bg-stone-800/80 backdrop-blur-md rounded-full cursor-pointer z-10 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden isolate">
              {/* Decorative Background Glows - Inside the scrollable area for simpler layout */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-500/5 to-transparent dark:from-amber-400/5 pointer-events-none -z-10" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-400/5 blur-3xl rounded-full pointer-events-none -z-10" />
              
              <div className="p-5 sm:p-7">
                <AnimatePresence mode="wait">
                  {currentPage === 0 && (
                    <motion.div
                      key="page0"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <div className="px-1">
                        <p className="text-[13.5px] sm:text-[15px] text-stone-600 dark:text-stone-300 leading-relaxed font-medium mb-4 sm:mb-6">
                          인터렉티브 맵이 출시되었습니다!
                          도감 페이지 오른쪽 하단에 있는 지도 버튼을 눌러 확인해보세요!
                        </p>

                        <div className="space-y-2.5 sm:space-y-3.5">
                          <div className="flex items-start gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-white/60 dark:bg-stone-850/40 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-stone-800/60 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.03)] dark:shadow-sm">
                            <div className="flex-1">
                              <h5 className="text-[13.5px] font-bold text-stone-800 dark:text-stone-200">고래섬</h5>
                              <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1.5 font-medium">
                                장소별로 출현하는 모든 도감 정보를 상세히 정리해두었습니다.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-white/60 dark:bg-stone-850/40 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-stone-800/60 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.03)] dark:shadow-sm">
                            <div className="flex-1">
                              <h5 className="text-[13.5px] font-bold text-stone-800 dark:text-stone-200">고래낙하 협곡</h5>
                              <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1.5 font-medium">
                                채집 가능한 정보와 편의시설 위치를 한눈에 확인해보세요!
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentPage === 1 && (
                    <motion.div
                      key="page1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <div className="px-1">
                        <p className="text-[13.5px] sm:text-[15px] text-stone-600 dark:text-stone-300 leading-relaxed font-medium mb-4 sm:mb-6">
                          고래낙하 협곡 탐험을 더 편리하게 즐겨보세요.
                        </p>

                        <div className="space-y-2.5 sm:space-y-3.5">
                          <div className="flex items-start gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-white/60 dark:bg-stone-850/40 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-stone-800/60 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.03)] dark:shadow-sm">
                            <div className="flex-1">
                              <h5 className="text-[13.5px] font-bold text-stone-800 dark:text-stone-200">탐험 정보 가리기</h5>
                              <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1.5 font-medium">
                                원하는 채집물이나 정보만 골라서 지도를 깔끔하게 확인해보세요.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-white/60 dark:bg-stone-850/40 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-stone-800/60 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.03)] dark:shadow-sm">
                            <div className="flex-1">
                              <h5 className="text-[13.5px] font-bold text-stone-800 dark:text-stone-200">나만의 커스텀 동선</h5>
                              <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1.5 font-medium">
                                효율적인 탐험을 위해 자주 다니는 경로를 직접 설정할 수 있습니다.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 sm:p-6 border-t border-stone-200/50 dark:border-stone-800/60 bg-stone-100/50 dark:bg-stone-900/50 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {[0, 1].map((idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      currentPage === idx ? "w-6 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "w-1.5 bg-stone-300 dark:bg-stone-700"
                    )}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2.5">
                {currentPage > 0 && (
                  <button
                    onClick={prevPage}
                    className="px-5 py-2.5 rounded-xl bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-[13px] transition-all hover:bg-stone-50 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 cursor-pointer active:scale-95 shadow-sm"
                  >
                    이전
                  </button>
                )}
                
                {currentPage < 1 ? (
                  <button
                    onClick={nextPage}
                    className="px-7 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-bold text-[13px] transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-lg shadow-stone-900/10 dark:shadow-none border border-stone-900 dark:border-stone-100"
                  >
                    다음
                  </button>
                ) : (
                  <button
                    onClick={handleClosePermanently}
                    className="px-7 py-2.5 rounded-xl bg-amber-500 dark:bg-amber-500 hover:bg-amber-600 dark:hover:bg-amber-400 text-white font-bold text-[13px] transition-all active:scale-95 cursor-pointer shadow-lg shadow-amber-500/30 border border-amber-600/20 dark:border-amber-400/20"
                  >
                    닫기
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
