import React from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, MapPinned, Megaphone } from "lucide-react";

interface FloatingReportButtonProps {
  isTimerModalOpen: boolean;
  isPermissionDeniedError: boolean;
  isQuotaExceededError: boolean;
  isForceUpdateRequired: boolean;
  isShowMaintenance: boolean;
  user: any;
  hasUnsyncedChanges: boolean;
  isInitialSyncDone: boolean;
  isMapOpen: boolean;
  setIsMapOpen: (open: boolean) => void;
  setHighlightedLocation: (loc: string) => void;
  setHighlightedItemName: (name: string) => void;
  activeCategory: string;
  setIsContactModalOpen: (open: boolean) => void;
  isIngredientModalOpen?: boolean;
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
  isMapOpen,
  setIsMapOpen,
  setHighlightedLocation,
  setHighlightedItemName,
  activeCategory,
  setIsContactModalOpen,
  isIngredientModalOpen,
}) => {
  if ((isTimerModalOpen || isIngredientModalOpen) && !isPermissionDeniedError && !isQuotaExceededError && !isForceUpdateRequired && !isShowMaintenance) {
    return null;
  }

  // Categories where "제보하기" button is shown
  const reportCategories = ['home', 'coupons', 'gardening', 'crops', 'petfood', 'trend_checklist', 'trends', 'cooking'];
  // Categories where ONLY "지도" button is shown
  const mapCategories = ['birds', 'insects', 'fishing', 'ocean_cleaning'];

  const isReportCategory = reportCategories.includes(activeCategory);
  const isMapCategory = mapCategories.includes(activeCategory);

  // State indicator dot component
  const renderServerStatusIndicator = () => {
    if (!user) return null;
    return (
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
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-5 right-5 z-[11000] md:bottom-6 md:right-6 flex flex-col items-end gap-2"
    >
      {/* "제보하기" FAB - shown on Dashboard, Coupons, Gardening, Crops, Pet Food, Trend Checklist */}
      {isReportCategory && !isForceUpdateRequired && !isShowMaintenance && (
        <button
          onClick={() => setIsContactModalOpen(true)}
          title="제보하기"
          className="group relative flex items-center justify-center gap-2 px-4 py-3 md:px-4.5 md:py-3.5 bg-slate-950 text-white rounded-full shadow-2xl border border-stone-800 hover:bg-slate-900 hover:border-stone-700 transition-all active:scale-95 cursor-pointer font-extrabold text-xs md:text-sm"
        >
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-xs -z-10" />
          <Megaphone className="h-4 w-4 md:h-5 md:w-5 text-amber-400 group-hover:text-amber-300 transition-all shrink-0" />
          <span>제보하기</span>
          {renderServerStatusIndicator()}
        </button>
      )}

      {/* Map FAB - shown ONLY on Birds, Insects, Fishing, Cooking, Ocean Cleaning */}
      {isMapCategory && !isMapOpen && !isForceUpdateRequired && !isShowMaintenance && (
        <button
          onClick={() => {
            setHighlightedLocation('');
            setHighlightedItemName('');
            setIsMapOpen(true);
          }}
          title="전체 지도"
          className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-slate-950 text-white rounded-full shadow-2xl border border-stone-800 hover:bg-slate-900 hover:border-stone-700 transition-all active:scale-95 cursor-pointer"
        >
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-xs -z-10" />
          <MapPinned className="h-6 w-6 md:h-8 md:w-8 text-amber-500/80 group-hover:text-amber-400 transition-all" />
          {renderServerStatusIndicator()}
        </button>
      )}
    </motion.div>
  );
};
