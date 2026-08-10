import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, X } from 'lucide-react';

interface UpdateBannerProps {
  updateAvailable: boolean;
  updateDismissed: boolean;
  isForceUpdateRequired: boolean;
  isShowMaintenance: boolean;
  onDismiss: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({
  updateAvailable,
  updateDismissed,
  isForceUpdateRequired,
  isShowMaintenance,
  onDismiss,
}) => {
  const shouldShow = updateAvailable && !updateDismissed && !isForceUpdateRequired && !isShowMaintenance;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          className="fixed top-0 left-0 right-0 w-full z-[9000] shadow-[0_4px_30px_rgba(249,115,22,0.3)]"
        >
          <div className="bg-gradient-to-r from-stone-950 via-orange-950 to-stone-950 text-stone-100 border-b border-orange-500/40 px-4 py-3 md:py-3.5 flex items-center justify-between gap-4 justify-items-stretch">
            <div 
              className="flex-1 flex items-center justify-center gap-3 cursor-pointer select-none"
              onClick={() => window.location.reload()}
            >
              <div className="bg-orange-500/20 p-1.5 rounded-full backdrop-blur-md hidden sm:block shrink-0 border border-orange-400/20">
                <RefreshCcw className="h-3.5 w-3.5 text-orange-400 animate-spin-slow" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs md:text-sm font-bold tracking-tight leading-relaxed">
                  <span className="text-orange-400 font-extrabold mr-2 animate-pulse">✨ 새로운 버전 발견!</span> 
                  최신 기능을 적용하려면 
                  <span className="text-orange-300 font-black underline underline-offset-4 decoration-2 decoration-orange-400/60 mx-1 cursor-pointer hover:text-orange-100 transition-colors">
                    [여기를 눌러 새로고침]
                  </span>
                  해 주세요.
                </p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="bg-stone-950/80 hover:bg-stone-900/80 p-1.5 rounded-xl border border-orange-500/20 transition-all shrink-0 cursor-pointer"
              title="닫기"
            >
              <X className="h-4 w-4 text-orange-400/80 hover:text-orange-300" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
