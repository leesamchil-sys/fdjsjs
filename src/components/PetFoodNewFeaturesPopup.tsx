import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, ArrowUpDown, Siren, X, ChevronLeft, ChevronRight, Check, AlertTriangle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  canShow?: boolean;
  onClose?: () => void;
}

const STORAGE_KEY = 'has_seen_petfood_new_features_v2026_08';

export const PetFoodNewFeaturesPopup: React.FC<Props> = memo(({ canShow = true, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (!canShow) {
      setIsOpen(false);
      return;
    }

    // Check if user has already seen this version
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      // Small delay for smooth entry after mounting
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [canShow]);

  const handleClosePermanently = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, 2));
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 0));
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          data-nosnippet 
          className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-stone-900/50 dark:bg-black/70 backdrop-blur-sm select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="w-full max-w-[480px] sm:max-w-lg overflow-hidden rounded-[28px] sm:rounded-[32px] bg-white dark:bg-stone-900 shadow-2xl border border-stone-200/80 dark:border-stone-800 flex flex-col max-h-[88vh] sm:max-h-[90vh] relative font-sans text-stone-800 dark:text-stone-100"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 pb-3.5 flex items-center justify-between shrink-0 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2.5 rounded-2xl flex items-center justify-center shrink-0 shadow-3xs transition-colors duration-300",
                  currentPage === 0 && "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60",
                  currentPage === 1 && "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60",
                  currentPage === 2 && "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60"
                )}>
                  {currentPage === 0 && <Camera className="w-5 h-5 sm:w-6 sm:h-6" />}
                  {currentPage === 1 && <ArrowUpDown className="w-5 h-5 sm:w-6 sm:h-6" />}
                  {currentPage === 2 && <Siren className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      "text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full uppercase border",
                      currentPage === 0 && "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
                      currentPage === 1 && "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
                      currentPage === 2 && "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20"
                    )}>
                      NEW UPDATE ({currentPage + 1}/3)
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-50 leading-snug">
                    {currentPage === 0 && "📸 펫 프로필 썸네일 등록"}
                    {currentPage === 1 && "↕️ 마이펫 순서 변경 지원"}
                    {currentPage === 2 && "🚨 안먹는 먹이 제보하기"}
                  </h3>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleClosePermanently}
                className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-full cursor-pointer transition-all active:scale-95 shrink-0"
                aria-label="팝업 닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4">
              <AnimatePresence mode="wait">
                {/* Slide 1: 썸네일 기능 */}
                {currentPage === 0 && (
                  <motion.div
                    key="page0"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-bold leading-relaxed">
                      펫 사진을 프로필 썸네일로 직접 등록하고 관리할 수 있습니다.
                    </p>

                    {/* UI Mockup Card for Thumbnail Upload */}
                    <div className="p-3.5 sm:p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 space-y-3">
                      <div className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> 사용 방법
                      </div>

                      {/* Mockup visual */}
                      <div className="bg-white dark:bg-stone-850 rounded-xl p-3 border border-stone-200/60 dark:border-stone-750 flex items-center gap-3 shadow-2xs">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 flex items-center justify-center text-xl shadow-xs border border-amber-300/60 dark:border-amber-700/60">
                            🐱
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 p-1 bg-amber-500 text-white rounded-full shadow-xs ring-2 ring-white dark:ring-stone-850">
                            <Camera className="w-2.5 h-2.5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-stone-850 dark:text-stone-100">돼지 (강아지)</span>
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                              📸 사진 변경
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            카메라 아이콘을 눌러 이미지를 등록해보세요!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Warning Box */}
                    <div className="p-3 sm:p-3.5 bg-rose-50/80 dark:bg-rose-950/30 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="text-[11.5px] sm:text-xs text-rose-700 dark:text-rose-300 font-bold leading-relaxed">
                        등록한 썸네일은 서버로 전송되지 않고 <span className="underline decoration-rose-400 font-black">사용자 브라우저 기기에만 저장</span>됩니다. 기기를 바꾸거나 인터넷 방문 기록/캐시를 지우면 사진이 초기화될 수 있으니 참고해 주세요.
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Slide 2: 펫 순서 변경 */}
                {currentPage === 1 && (
                  <motion.div
                    key="page1"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-bold leading-relaxed">
                      마이펫의 순서를 원하는 대로 변경할 수 있습니다.
                    </p>

                    {/* UI Mockup Card for Reordering */}
                    <div className="p-3.5 sm:p-4 bg-sky-50/50 dark:bg-sky-950/20 rounded-2xl border border-sky-200/60 dark:border-sky-800/40 space-y-3">
                      <div className="text-[11px] font-black text-sky-700 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> 사용 방법
                      </div>

                      <div className="bg-white dark:bg-stone-850 rounded-xl p-3 border border-stone-200/60 dark:border-stone-750 space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                          <span className="text-xs font-black text-stone-700 dark:text-stone-300">펫 탭 상단 메뉴</span>
                          <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-amber-500 border border-stone-200/80 dark:border-stone-700 flex items-center gap-1 text-[11px] font-bold">
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span>순서 변경</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200/50 dark:border-sky-800/50 text-xs font-bold text-sky-800 dark:text-sky-200">
                            <span>1. 🐾 돼지 (강아지)</span>
                            <span className="text-[10px] bg-sky-200/60 dark:bg-sky-800/60 px-1.5 py-0.5 rounded font-black">▲ / ▼ 이동</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50 text-xs text-stone-600 dark:text-stone-400">
                            <span>2. 🐱 안돼지 (고양이)</span>
                            <span className="text-[10px] text-stone-400">▲ / ▼</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-100/70 dark:bg-stone-800/50 rounded-2xl border border-stone-200/50 dark:border-stone-700/50 text-[11.5px] sm:text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-bold">
                      💡 자주 확인하는 펫을 맨 앞으로 올려놓으면 먹이 찾기가 훨씬 편해집니다!
                    </div>
                  </motion.div>
                )}

                {/* Slide 3: 안먹는 먹이 제보 */}
                {currentPage === 2 && (
                  <motion.div
                    key="page2"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Admin Message Banner */}
                    <div className="p-3.5 sm:p-4 bg-rose-500/10 dark:bg-rose-950/40 rounded-2xl border border-rose-300/40 dark:border-rose-800/50 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-rose-600 dark:text-rose-400">
                        <Siren className="w-4 h-4" />
                        <span>안먹는 음식은 제보해주세요!</span>
                      </div>
                      <p className="text-[11.5px] sm:text-xs text-stone-700 dark:text-stone-200 leading-relaxed font-bold">
                        도감에는 표기되어 있지만 <strong className="text-rose-600 dark:text-rose-400 underline decoration-rose-300">안 먹는 음식이 있다면 사이렌(🚨) 버튼으로 제보</strong>해 주세요.
                      </p>
                    </div>

                    {/* UI Mockup Card for Siren Reporting */}
                    <div className="p-3.5 sm:p-4 bg-rose-50/40 dark:bg-stone-850/60 rounded-2xl border border-stone-200/70 dark:border-stone-800 space-y-3">
                      <div className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> 먹이 카드 제보 위치</span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold">우측 상단 🚨 버튼</span>
                      </div>

                      {/* Faithful mini mock of real food card */}
                      <div className="max-w-[210px] mx-auto relative bg-white dark:bg-stone-900 rounded-2xl p-3.5 border border-stone-200 dark:border-stone-800 shadow-md flex flex-col justify-between select-none">
                        {/* Level Badge on Top-Left */}
                        <span className="absolute top-2 left-2.5 z-10 inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-black border bg-sky-50 dark:bg-sky-950/45 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/50 shadow-3xs">
                          Lv.1
                        </span>

                        {/* Siren Report Button on Top-Right with Callout */}
                        <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1">
                          <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-md text-[9px] font-black animate-pulse shadow-xs">
                            제보!
                          </span>
                          <div className="p-1 text-rose-500 bg-rose-100 dark:bg-rose-950/80 rounded-lg ring-2 ring-rose-400 dark:ring-rose-500 shadow-sm animate-bounce">
                            <Siren className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Center Image */}
                        <div className="h-12 w-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xl mx-auto mt-4 mb-2 border border-stone-200/60 dark:border-stone-700/60">
                          🍖
                        </div>

                        {/* Title & Info */}
                        <div className="text-center space-y-0.5">
                          <h4 className="text-xs font-black text-stone-850 dark:text-stone-100">삼겹살</h4>
                          <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold">🍲 돼지고기 3, 소주 1</p>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1">
                          <div className="w-full py-1 rounded-lg text-[10px] font-black bg-sky-500 text-white text-center">
                            ✅ 먹여봄
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex-1 py-1 rounded-lg text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-center">
                              ❤️ 좋아요
                            </div>
                            <div className="flex-1 py-1 rounded-lg text-[9px] font-black bg-stone-100 dark:bg-stone-800 text-stone-500 text-center">
                              💔 싫어요
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11.5px] sm:text-xs text-stone-500 dark:text-stone-400 text-center font-bold">
                      제보해 주시면 확인 후 최대한 빠르게 반영하겠습니다. 🙏
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pagination & Footer Controls */}
            <div className="p-4 sm:p-5 pt-3 border-t border-stone-100 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-900/80 flex items-center justify-between gap-3 shrink-0">
              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPage(idx)}
                    className={cn(
                      "h-2 rounded-full transition-all cursor-pointer",
                      currentPage === idx
                        ? "w-6 bg-amber-500 dark:bg-amber-400"
                        : "w-2 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400"
                    )}
                    aria-label={`${idx + 1}번째 페이지로 이동`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {currentPage > 0 && (
                  <button
                    type="button"
                    onClick={prevPage}
                    className="px-3 py-2 text-xs font-black text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    이전
                  </button>
                )}

                {currentPage < 2 ? (
                  <button
                    type="button"
                    onClick={nextPage}
                    className="px-4 py-2 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    다음
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClosePermanently}
                    className="px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 animate-pulse"
                  >
                    <Check className="w-4 h-4" />
                    확인
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

PetFoodNewFeaturesPopup.displayName = 'PetFoodNewFeaturesPopup';
export default PetFoodNewFeaturesPopup;
