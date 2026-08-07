import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface UnmatchedNamesModalProps {
  unmatchedNames: string[];
  onClear: () => void;
}

export const UnmatchedNamesModal: React.FC<UnmatchedNamesModalProps> = ({
  unmatchedNames,
  onClear,
}) => {
  return (
    <AnimatePresence>
      {unmatchedNames.length > 0 && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClear}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-[32px] shadow-2xl border border-stone-100 dark:border-stone-800 overflow-hidden"
          >
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-stone-200 tracking-tight">도감 항목 인식 실패</h3>
                <p className="text-[13px] text-stone-500 dark:text-stone-400 font-bold leading-relaxed px-2">
                  입력하신 리스트 중 <span className="text-amber-600 dark:text-amber-400">{unmatchedNames.length}개</span>의 항목을 도감에서 찾을 수 없습니다.
                </p>
              </div>

              <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-4 border border-stone-100/50 dark:border-stone-850">
                <div className="max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-250 dark:scrollbar-thumb-stone-800">
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {unmatchedNames.map((name, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 text-[10px] font-bold rounded-lg shadow-sm">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] text-stone-400 dark:text-stone-500 font-bold text-center leading-relaxed">
                  도감 데이터에 없는 명칭이거나 입력 형식이 다를 수 있습니다.<br/>
                  <span className="text-amber-600/80 dark:text-amber-400/80">띄어쓰기나 맞춤법</span>이 정확한지 다시 한번 확인해 주세요.
                </p>
                
                <button 
                  onClick={onClear}
                  className="w-full py-4 bg-slate-900 dark:bg-stone-100 hover:bg-slate-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-sm font-black rounded-2xl shadow-lg dark:shadow-none transition-all active:scale-95 cursor-pointer"
                >
                  확인
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
