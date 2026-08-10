import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudOff } from 'lucide-react';

interface SyncErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncErrorModal: React.FC<SyncErrorModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="pointer-events-auto relative w-full max-w-sm rounded-[32px] bg-white dark:bg-stone-900 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)] border border-neutral-200/80 dark:border-stone-800 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-955/20 text-amber-500 dark:text-amber-400">
              <CloudOff className="h-8 w-8" />
            </div>
            <h4 className="mb-2 text-xl font-bold text-neutral-900 dark:text-stone-200">
              서버 동기화에 실패했습니다.
            </h4>
            <p className="mb-8 text-sm text-neutral-500 dark:text-stone-400 leading-relaxed break-keep">
              문제가 계속 발생하면 제보하기를 통해 알려주세요.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="w-full rounded-xl bg-slate-900 dark:bg-stone-100 hover:bg-slate-800 dark:hover:bg-stone-200 py-3.5 text-sm font-bold text-white dark:text-stone-900 transition-transform active:scale-95 cursor-pointer shadow-lg dark:shadow-none"
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
