import React from 'react';
import { motion } from 'motion/react';
import { Bug, RefreshCcw } from 'lucide-react';

interface FloatingReportButtonProps {
  isTimerModalOpen: boolean;
  isPermissionDeniedError: boolean;
  isQuotaExceededError: boolean;
  isForceUpdateRequired: boolean;
  isShowMaintenance: boolean;
  user: any;
  hasUnsyncedChanges: boolean;
  isInitialSyncDone: boolean;
  setIsContactModalOpen: (open: boolean) => void;
}

export const FloatingReportButton: React.FC<FloatingReportButtonProps> = ({
  isTimerModalOpen,
  isPermissionDeniedError,
  isQuotaExceededError,
  isForceUpdateRequired,
  isShowMaintenance,
  user,
  hasUnsyncedChanges,
  isInitialSyncDone,
  setIsContactModalOpen,
}) => {
  if (isTimerModalOpen && !isPermissionDeniedError && !isQuotaExceededError && !isForceUpdateRequired && !isShowMaintenance) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-5 right-5 z-[11000] md:bottom-6 md:right-6"
    >
      <button
        onClick={() => setIsContactModalOpen(true)}
        className="group relative flex items-center gap-2 px-3.5 py-3 md:px-4 md:py-2.5 bg-slate-950 text-white rounded-full font-sans font-bold text-xs shadow-2xl border border-stone-800 hover:bg-slate-900 hover:border-stone-700 transition-all active:scale-95 cursor-pointer"
      >
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-xs -z-10" />
        
        <Bug className="h-4 w-4 text-amber-400 group-hover:animate-bounce transition-transform" />
        <span className="hidden md:inline text-stone-200 group-hover:text-white">제보하기</span>
        <span className="md:hidden text-[11px] text-stone-200">제보하기</span>
        
        {user && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            {isPermissionDeniedError || isQuotaExceededError ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" title="서버 연결 오류"></span>
              </>
            ) : hasUnsyncedChanges && isInitialSyncDone ? (
              <div className="relative h-2.5 w-2.5 flex items-center justify-center">
                <span className="absolute inset-0 bg-orange-400/40 rounded-full animate-pulse" />
                <RefreshCcw className="h-[9px] w-[9px] text-orange-500 animate-spin" strokeWidth={2.8} />
              </div>
            ) : isInitialSyncDone ? (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" title="동기화 완료"></span>
            ) : null}
          </span>
        )}
      </button>
    </motion.div>
  );
};
