import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Settings, X, Bell, Navigation, Heart, Smartphone, Monitor, Volume2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  activeCategory: string;
}

export const UpdateFeaturesPopup: React.FC = () => {
  const POPUP_VERSION = '20260704_update_v3';
  const STORAGE_KEY = `has_seen_update_popup_${POPUP_VERSION}`;
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // 로컬스토리지 값을 확인하고, 지정된 노출 기간인지 체크하여 노출합니다.
  useEffect(() => {
    const now = new Date();
    const startTime = new Date('2026-07-04T00:00:00');
    const endTime = new Date('2026-07-14T23:59:59');
    
    const isInTimeRange = now >= startTime && now <= endTime;
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    
    if (isInTimeRange && !hasSeen) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [STORAGE_KEY]);

  const handleClosePermanently = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const nextPage = () => {
    if (currentPage < 2) setCurrentPage(p => p + 1);
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
            className="w-full max-w-lg overflow-hidden rounded-[32px] bg-white dark:bg-stone-900 isolate bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] border border-stone-200/80 dark:border-stone-800/80 flex flex-col max-h-[82vh] sm:max-h-[90vh]"
          >
            <div className="relative p-5 sm:p-7 flex-1 overflow-y-auto overflow-x-hidden min-h-0">
              {/* Decorative Background Glow */}
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/10 dark:bg-amber-400/5 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-400/5 blur-3xl rounded-full pointer-events-none" />

              <AnimatePresence mode="wait">
                {currentPage === 0 && (
                  <motion.div
                    key="page0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-4 border-b border-stone-200/60 dark:border-stone-800/60 pb-4 mb-4 sm:pb-5 sm:mb-5">
                      <div className="flex-shrink-0 p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-inner">
                        <Bell className="h-6 w-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 px-2.5 py-0.5 rounded-full uppercase">NEW UPDATE</span>
                          <span className="text-[10px] font-black tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10 px-2.5 py-0.5 rounded-full uppercase shadow-sm">BETA</span>
                        </div>
                        <h3 className="text-[20px] sm:text-[22px] font-black text-stone-900 dark:text-stone-50 leading-tight tracking-tight">
                          5성 작물 도전알림 추가
                        </h3>
                      </div>
                    </div>
                    
                    <div className="px-1">
                      <p className="text-[13.5px] sm:text-[15px] text-stone-600 dark:text-stone-300 leading-relaxed font-medium mb-4 sm:mb-5">
                        이제 <strong>작물&맞춤형 알림</strong> 메뉴에서 <strong className="text-amber-500">5성 도전 모드</strong>를 켜면, 잡초를 뽑아야 하는 시점에 알림을 받을 수 있습니다!
                      </p>

                      <div className="space-y-2.5 sm:space-y-3">
                        <div className="flex items-start gap-3 sm:gap-3.5 p-3 sm:p-3.5 bg-white dark:bg-stone-850/40 rounded-2xl border border-stone-200/60 dark:border-stone-800/60 shadow-sm">
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                            <Volume2 className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-[13px] font-bold text-stone-800 dark:text-stone-200">알림 효과음 설정</h5>
                            <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1">
                              <strong>알림음 종류 및 연속 알림 등</strong> 상세한 알림 설정이 가능합니다. 우측 상단 알림 설정 메뉴를 확인하세요.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 sm:gap-3.5 p-3 sm:p-3.5 bg-white dark:bg-stone-850/40 rounded-2xl border border-stone-200/60 dark:border-stone-800/60 shadow-sm">
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            <Monitor className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-[13px] font-bold text-stone-800 dark:text-stone-200">브라우저 알림</h5>
                            <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1">
                              브라우저가 켜져 있을 때만 알림이 전송됩니다. 탭을 백그라운드에 유지하고, 브라우저 알림 설정에서 알림 권한을 허용해 주세요.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 sm:gap-3.5 p-3 sm:p-3.5 bg-white dark:bg-stone-850/40 rounded-2xl border border-stone-200/60 dark:border-stone-800/60 shadow-sm">
                          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                            <Smartphone className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-[13px] font-bold text-stone-800 dark:text-stone-200">텔레그램 알림</h5>
                            <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1">
                              브라우저를 꺼도 모바일로 알림을 받을 수 있습니다! <strong>작물&맞춤형 알림</strong> 메뉴에서 텔레그램 연동을 설정하세요.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 sm:p-4 bg-stone-100 dark:bg-stone-850 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 mt-4 sm:mt-5">
                        <Settings className="h-4.5 w-4.5 text-stone-500 dark:text-stone-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[12.5px] font-bold text-stone-700 dark:text-stone-300">설정 방법</p>
                          <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1">
                            <strong className="text-stone-800 dark:text-stone-200">작물&맞춤형 알림</strong> 메뉴에서 각 작물 카드의 <strong>알림/작물 추가</strong> 버튼을 눌러주세요.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 sm:p-3.5 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/50 dark:border-rose-900/50 mt-3 sm:mt-4">
                        <div className="flex-1">
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 leading-relaxed">
                            <strong className="font-bold text-rose-700 dark:text-rose-300">⚠️ 베타 서비스 안내:</strong> 본 기능은 베타 버전으로 제공됩니다.
                          </p>
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
                    <div className="flex items-center gap-4 border-b border-stone-200/60 dark:border-stone-800/60 pb-4 mb-4 sm:pb-5 sm:mb-5">
                      <div className="flex-shrink-0 p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shadow-inner">
                        <Navigation className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10 px-2.5 py-0.5 rounded-full uppercase">NEW SETTINGS</span>
                        </div>
                        <h3 className="text-[20px] sm:text-[22px] font-black text-stone-900 dark:text-stone-50 leading-tight tracking-tight">
                          새 도감 추천 조건 세분화
                        </h3>
                      </div>
                    </div>

                    <div className="px-1">
                      <p className="text-[13.5px] sm:text-[15px] text-stone-600 dark:text-stone-300 leading-relaxed font-medium mb-4 sm:mb-5">
                        새 도감에서 <strong className="text-stone-900 dark:text-stone-100">'지금 잡을 수 있는 새'</strong> 추천 기준이 더욱 상세해졌습니다. 필터 설정을 통해 변경해보세요.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:grid-cols-2 gap-3">
                        <div className="flex items-start gap-3 p-3 sm:p-3.5 bg-white dark:bg-stone-850/40 rounded-2xl border border-stone-200/50 dark:border-stone-800/40 shadow-sm">
                          <div className="flex-1">
                            <h5 className="text-[13px] font-bold text-stone-800 dark:text-stone-200">출현 날씨</h5>
                            <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1">새의 기본 출현 날씨 조건만 확인하여 추천합니다.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 sm:p-3.5 bg-white dark:bg-stone-850/40 rounded-2xl border border-stone-200/50 dark:border-stone-800/40 shadow-sm">
                          <div className="flex-1">
                            <h5 className="text-[13px] font-bold text-stone-800 dark:text-stone-200">현재 날씨</h5>
                            <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1">현재 적용 중인 게임 내 일반 날씨 기준으로 추천합니다.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 sm:p-3.5 bg-white dark:bg-stone-850/40 rounded-2xl border border-stone-200/50 dark:border-stone-800/40 shadow-sm">
                          <div className="flex-1">
                            <h5 className="text-[13px] font-bold text-stone-800 dark:text-stone-200">5성 조건</h5>
                            <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1">새의 5성 달성에 필요한 특정 날씨 조건을 최우선으로 고려합니다.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 sm:p-3.5 bg-white dark:bg-stone-850/40 rounded-2xl border border-stone-200/50 dark:border-stone-800/40 shadow-sm">
                          <div className="flex-1">
                            <h5 className="text-[13px] font-bold text-stone-800 dark:text-stone-200">전체 조건</h5>
                            <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1">모든 조건을 통합하여 가장 폭넓은 기준으로 추천합니다.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3.5 sm:p-4 bg-stone-100 dark:bg-stone-850 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 mt-4 sm:mt-5">
                        <Settings className="h-4.5 w-4.5 text-stone-500 dark:text-stone-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[12.5px] font-bold text-stone-700 dark:text-stone-300">설정 방법</p>
                          <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1">
                            지금 잡을수 있는 도감 우측에 있는 추천 설정에서 변경할 수 있습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentPage === 2 && (
                  <motion.div
                    key="page2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-4 border-b border-stone-200/60 dark:border-stone-800/60 pb-4 mb-4 sm:pb-5 sm:mb-5">
                      <div className="flex-shrink-0 p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shadow-inner">
                        <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-400/10 px-2.5 py-0.5 rounded-full uppercase">NEW FEATURE</span>
                        </div>
                        <h3 className="text-[20px] sm:text-[22px] font-black text-stone-900 dark:text-stone-50 leading-tight tracking-tight">
                          카드 즐겨찾기 기능 추가
                        </h3>
                      </div>
                    </div>

                    <div className="px-1">
                      <p className="text-[13.5px] sm:text-[15px] text-stone-600 dark:text-stone-300 leading-relaxed font-medium mb-4 sm:mb-5">
                        도감 카드 우측 상단에 <strong>하트(♡) 버튼</strong>이 새롭게 추가되었습니다! 자주 확인해야 하는 도감들을 즐겨찾기로 등록해보세요.
                      </p>
                      
                      <div className="space-y-2.5 sm:space-y-3">
                        <div className="flex items-start gap-3 sm:gap-3.5 p-3.5 sm:p-4 bg-white dark:bg-stone-850/40 rounded-2xl border border-stone-200/60 dark:border-stone-800/60 shadow-sm">
                          <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 shrink-0">
                            <Star className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-[13px] sm:text-[14px] font-bold text-stone-800 dark:text-stone-200">나만의 커스텀 목록</h5>
                            <p className="text-[11.5px] sm:text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1 sm:mt-1.5">
                              즐겨찾기한 도감은 상단의 <strong className="text-rose-500 font-bold">즐겨찾기 탭</strong>에서 모아볼 수 있습니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            <div className="p-3.5 sm:p-5 border-t border-stone-200/60 dark:border-stone-800/60 bg-stone-50 dark:bg-stone-900/50 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      currentPage === idx ? "w-4 bg-amber-500" : "w-1.5 bg-stone-300 dark:bg-stone-700"
                    )}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                {currentPage > 0 && (
                  <button
                    onClick={prevPage}
                    className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs transition-colors hover:bg-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                  >
                    이전
                  </button>
                )}
                
                {currentPage < 2 ? (
                  <button
                    onClick={nextPage}
                    className="px-6 py-2 rounded-xl bg-slate-900 dark:bg-stone-100 text-white dark:text-stone-900 font-black text-xs transition-transform active:scale-[0.98] cursor-pointer shadow-lg shadow-neutral-300/30 dark:shadow-none"
                  >
                    다음
                  </button>
                ) : (
                  <button
                    onClick={handleClosePermanently}
                    className="px-6 py-2 rounded-xl bg-amber-500 dark:bg-amber-500 hover:bg-amber-600 dark:hover:bg-amber-400 text-white font-black text-xs transition-transform active:scale-[0.98] cursor-pointer shadow-lg shadow-amber-500/30"
                  >
                    닫기
                  </button>
                )}
              </div>
            </div>

            {/* Close Icon (Top Right) */}
            <button 
              onClick={handleClosePermanently}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors bg-stone-100/80 dark:bg-stone-800/80 backdrop-blur-md rounded-full cursor-pointer z-10"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
