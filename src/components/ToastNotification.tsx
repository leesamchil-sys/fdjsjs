import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastNotificationProps {
  toastMessage: string | null;
  toastType: 'info' | 'error' | 'loading' | 'success';
  onClick?: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toastMessage,
  toastType,
  onClick,
}) => {
  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 20, scale: 0.95, x: "-50%" }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={onClick}
          className={`fixed bottom-24 left-1/2 z-[200] flex items-center gap-2.5 px-5 py-3.5 bg-neutral-900 border border-neutral-800 text-white rounded-full text-xs font-bold shadow-2xl backdrop-blur-md max-w-[90vw] md:max-w-md text-left justify-start ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all ring-2 ring-emerald-500/50' : ''}`}
        >
          {toastType === 'error' ? (
            <span className="text-base shrink-0 leading-none">⚠️</span>
          ) : toastType === 'loading' ? (
            <span className="h-3 w-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          <span className="leading-tight whitespace-pre-line">{toastMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
