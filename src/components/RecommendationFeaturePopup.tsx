import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Check, Star, Award, Settings, HelpCircle } from 'lucide-react';

interface RecommendationFeaturePopupProps {
  activeCategory: string;
}

export const RecommendationFeaturePopup: React.FC<RecommendationFeaturePopupProps> = ({ activeCategory }) => {
  // 팝업 버전 정보를 관리하여 새로운 가이드나 팝업으로 변경 시 버전을 올리면 다시 뜨도록 합니다.
  const POPUP_VERSION = '20260625_rec_filter';
  const STORAGE_KEY = `has_seen_rec_popup_${POPUP_VERSION}`;

  const [isOpen, setIsOpen] = useState(false);

  // 로컬스토리지 값을 확인하고, 지정된 노출 기간(6월 25일 23시 ~ 6월 29일 23시 59분 59초)인지 체크하여 노출합니다.
  useEffect(() => {
    const now = new Date();
    const startTime = new Date('2026-06-25T23:00:00');
    const endTime = new Date('2026-06-29T23:59:59');

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

  const isAllowedCategory = ['home', 'birds', 'insects', 'fishing'].includes(activeCategory);

  return (
    <AnimatePresence>
      {isOpen && isAllowedCategory && (
        <div data-nosnippet className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-stone-900 isolate bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-stone-200/80 dark:border-stone-800/80"
          >
            <div className="relative p-6 sm:p-7">
              {/* Decorative Background Glow */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 dark:bg-amber-400/5 blur-2xl rounded-full pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-400/5 blur-2xl rounded-full pointer-events-none" />

              {/* Header Icon & Title */}
              <div className="flex items-center gap-3.5 mb-5">
                <div className="flex-shrink-0 p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shadow-inner">
                  <Sparkles className="h-5.5 w-5.5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10 px-2 py-0.5 rounded-full uppercase">NEW FEATURE</span>
                  </div>
                  <h3 className="text-lg font-black text-stone-900 dark:text-stone-50 leading-tight mt-1">
                    새로워진 '추천 설정' 안내
                  </h3>
                </div>
              </div>

              {/* Content Description */}
              <div className="space-y-4.5">
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                  도감 수집 상태와 실시간 날씨/시간을 반영하는 <strong className="text-stone-900 dark:text-amber-400 font-extrabold">지금 등장하는 도감 영역에 필터</strong>가 추가되었습니다! 지금 바로 더욱 편리하게 도감을 완성해보세요.
                </p>

                {/* Main Features Grid */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest px-1">
                    맞춤 설정 기능
                  </h4>

                  {/* Feature 1 */}
                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-850/40 rounded-2xl border border-stone-200/50 dark:border-stone-800/40 shadow-sm transition-all hover:border-amber-500/20 dark:hover:border-amber-400/20">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-[12px] font-bold text-stone-800 dark:text-stone-200 leading-tight">완료된 도감 제외</h5>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal mt-0.5">이미 잡아서 완료 체크를 마친 도감은 목록에서 깔끔히 숨겨줍니다.</p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-850/40 rounded-2xl border border-stone-200/50 dark:border-stone-800/40 shadow-sm transition-all hover:border-amber-500/20 dark:hover:border-amber-400/20">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                      <Star className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-[12px] font-bold text-stone-800 dark:text-stone-200 leading-tight">5성 미완료 도감 포함</h5>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal mt-0.5">도감 등록은 마쳤지만, 성급이 5성 미만 상태라면 추천 목록에 띄워 알려줍니다.</p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-850/40 rounded-2xl border border-stone-200/50 dark:border-stone-800/40 shadow-sm transition-all hover:border-amber-500/20 dark:hover:border-amber-400/20">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Award className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-[12px] font-bold text-stone-800 dark:text-stone-200 leading-tight">명인 미완료 도감 포함</h5>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal mt-0.5">도감을 완료했더라도 명인 미달성 상태라면 추천 목록에 띄워 알려줍니다.</p>
                    </div>
                  </div>
                </div>

                {/* Where is it? tip */}
                <div className="flex items-center gap-2 p-3 bg-stone-100 dark:bg-stone-850 rounded-2xl border border-stone-200/30 dark:border-stone-800/30">
                  <Settings className="h-4 w-4 text-stone-500 dark:text-stone-400 animate-spin-slow shrink-0" />
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed font-semibold">
                    각 도감 상단의 <strong className="text-stone-850 dark:text-amber-400 font-extrabold">'추천 설정' 톱니바퀴 버튼</strong>에서 마음대로 커스텀해보세요!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6">
                <button
                  id="rec-popup-close-btn"
                  onClick={handleClosePermanently}
                  className="w-full py-3 px-4 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-black text-[11px] sm:text-xs transition-all cursor-pointer shadow-lg active:scale-[0.98] text-center"
                >
                  확인
                </button>
              </div>

              {/* Close Icon */}
              <button 
                onClick={handleClosePermanently}
                className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors bg-stone-100 dark:bg-stone-850 rounded-full cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
