import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="relative w-full max-w-sm rounded-[32px] bg-white dark:bg-stone-900 p-8 shadow-2xl border border-neutral-100 dark:border-stone-800 text-center z-10"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-955/20 text-red-500 dark:text-red-400">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h4 className="mb-2 text-xl font-bold text-neutral-900 dark:text-stone-200">정말 초기화할까요?</h4>
            <p className="mb-8 text-sm text-neutral-500 dark:text-stone-400 leading-relaxed">
              현재 카테고리의 모든 수집 기록이 삭제됩니다.<br/>이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 rounded-xl bg-neutral-100 dark:bg-stone-850 py-3 text-sm font-bold text-neutral-600 dark:text-stone-350 transition-colors hover:bg-neutral-200 dark:hover:bg-stone-800 cursor-pointer"
              >
                취소
              </button>
              <button 
                onClick={onConfirm}
                className="flex-1 rounded-xl bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 dark:shadow-none transition-transform active:scale-95 cursor-pointer"
              >
                전체 해제
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
