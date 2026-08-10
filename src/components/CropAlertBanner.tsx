import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, ArrowRight, X } from 'lucide-react';

interface CropAlertItem {
  id: string;
  cropName: string;
  stage?: number;
  isPre?: boolean;
  isFiveStar?: boolean;
}

interface CropAlertBannerProps {
  alertQueue: CropAlertItem[];
  onNavigate: () => void;
  onDismissItem: (id: string) => void;
  onCloseAll: () => void;
}

export const CropAlertBanner: React.FC<CropAlertBannerProps> = ({
  alertQueue,
  onNavigate,
  onDismissItem,
  onCloseAll,
}) => {
  const currentAlert = alertQueue[0];
  const remainingCount = alertQueue.length - 1;

  return (
    <AnimatePresence>
      {currentAlert && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: -20, scale: 0.95, x: "-50%" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-4 left-1/2 z-[250] w-[94vw] max-w-md bg-stone-900/95 text-white rounded-2xl p-3.5 shadow-[0_15px_30px_rgba(0,0,0,0.3)] border border-emerald-500/30 backdrop-blur-xl flex items-center justify-between gap-3 select-none"
        >
          {/* Left section: Icon + Message */}
          <div 
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
            onClick={onNavigate}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Sprout className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {currentAlert.isFiveStar ? (currentAlert.stage ? `잡초 ${currentAlert.stage}/4 단계` : '5성 육성') : '수확 알림'}
                </span>
                {currentAlert.isPre && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    사전
                  </span>
                )}
                {remainingCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-stone-300">
                    외 {remainingCount}건
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-bold text-stone-100 truncate mt-0.5">
                <span className="text-emerald-300">{currentAlert.cropName}</span>{' '}
                {currentAlert.isFiveStar && currentAlert.stage ? '잡초 정리할 시간이에요!' : '수확할 시간이 되었어요!'}
              </p>
            </div>
          </div>

          {/* Right section: Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onNavigate}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>바로가기</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <button
              onClick={() => {
                if (alertQueue.length > 1) {
                  onDismissItem(currentAlert.id);
                } else {
                  onCloseAll();
                }
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
