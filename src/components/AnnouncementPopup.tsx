import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudSun, X, Zap, Info } from 'lucide-react';

export const AnnouncementPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Check date (valid until June 10, 2026 - set to past so it does not show up)
    const now = new Date();
    const expiryDate = new Date('2023-06-10T00:00:00Z'); 
    
    if (now > expiryDate) return;

    // 2. Check localStorage (using a new key for this specific announcement)
    const hasSeen = localStorage.getItem('announcement_weather_logic_20260614');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('announcement_weather_logic_20260614', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div data-nosnippet className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-stone-900 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-stone-200 dark:border-stone-800"
          >
            <div className="relative p-5 sm:p-6">
              {/* Header Icon & Title */}
              <div className="flex items-center gap-3 mb-4.5">
                <div className="flex-shrink-0 p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <CloudSun className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-50 leading-tight">
                    날씨 정보 개선 안내
                  </h3>
                  <div className="h-0.5 w-8 bg-sky-500 rounded-full mt-1" />
                </div>
              </div>

              {/* Content Sections */}
              <div className="space-y-4">
                {/* Reset Warning */}
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 rounded-xl">
                  <div className="flex gap-2">
                    <Zap className="h-4.5 w-4.5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-[12px] text-stone-700 dark:text-stone-300 leading-relaxed"> 
                      날씨 기능 개선으로 인해 <strong className="text-amber-600 dark:text-amber-400 font-extrabold">기존에 등록하신 날씨 정보가 초기화</strong>되었습니다. 
                      <p className="mt-1.5 text-stone-500 dark:text-stone-400">
                        번거로우시겠지만<strong className="text-stone-700 dark:text-stone-200 underline decoration-stone-400 underline-offset-2">날씨 정보를 다시</strong>입력해주세요.
                      </p>
                      <span className="block mt-2.5 pt-2 border-t border-amber-200/50 dark:border-stone-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        💡 도감 수집 기록은 안전하게 유지됩니다.
                      </span>
                    </div>
                  </div>
                </div>

                {/* AS-IS TO-BE Comparison */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest px-1">
                    주요 변경 사항
                  </h4>
                  <div className="flex flex-col p-3 rounded-xl bg-stone-50/80 dark:bg-stone-850/30 border border-stone-100 dark:border-stone-800 gap-1.5">
                    <div className="flex items-start gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                      <span className="text-[9px] font-bold text-stone-500 bg-stone-100 dark:bg-stone-800 rounded px-1 shrink-0">기존</span> 
                      <span className="leading-tight">지난 요일의 날씨가 다음주 동일 요일에 반복 적용되는 현상</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
                      <span className="text-[9px] font-bold text-sky-500 bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900 rounded px-1 shrink-0">개선</span> 
                      <span className="leading-tight">실제 날짜 기반으로 동작하도록 로직 변경</span>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="p-3.5 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl border border-sky-100/40 dark:border-sky-950">
                  <div className="flex gap-2 items-center mb-1 text-sky-600 dark:text-sky-400">
                    <Info className="h-3.5 w-3.5" />
                    <p className="text-[11px] font-bold">주간날씨와 상세날씨 차이</p>
                  </div>
                  <ul className="text-[11px] space-y-1 text-stone-600 dark:text-stone-400 pl-1 leading-relaxed">
                    <li>• <strong className="text-stone-800 dark:text-stone-200">주간날씨</strong> : 해당 요일이 <span className="text-sky-500 font-bold">대표하는 날씨</span>로 표시됩니다.</li>
                    <li>• <strong className="text-stone-800 dark:text-stone-200">상세날씨</strong> : 오늘 기준 24시간의 상세 날씨가 표시됩니다.</li>
                  </ul>
                </div>
              </div>

              {/* Footer Button */}
              <div className="mt-5">
                <button
                  id="announcement-confirm-btn"
                  onClick={handleClose}
                  className="w-full py-3 px-4 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-black text-xs sm:text-sm transition-all hover:bg-stone-800 dark:hover:bg-white active:scale-[0.98]"
                >
                  확인했습니다
                </button>
              </div>

              {/* Close Button Cross */}
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors bg-stone-50 dark:bg-stone-850/50 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
