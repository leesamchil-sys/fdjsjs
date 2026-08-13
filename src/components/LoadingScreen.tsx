import React from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

interface LoadingScreenProps {
  isError: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isError }) => {
  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 p-6 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        {isError ? (
          <>
            <div className="p-4 bg-rose-100 dark:bg-rose-955/30 rounded-full text-rose-600 dark:text-rose-450">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">로딩이 지연되고 있습니다</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed px-4">
                일시적인 지연 현상이나 인터넷 연결 상태가 불안정할 수 있습니다.<br />
                대기 시간이 너무 길어질 경우 <span className="font-bold text-amber-500 dark:text-amber-450">새로고침 (F5)</span>이나 아래 버튼을 눌러주세요.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-bold text-sm hover:bg-stone-800 dark:hover:bg-stone-200 transition-all cursor-pointer active:scale-95 shadow-md"
            >
              <RefreshCcw className="h-4 w-4" />
              페이지 새로고침
            </button>
          </>
        ) : (
          <>
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="h-12 w-12 border-4 border-stone-200 dark:border-stone-800 border-t-amber-500 rounded-full"
              />
            </div>
            <p className="text-sm font-bold text-stone-500 dark:text-stone-400 animate-pulse">데이터를 불러오는 중...</p>
          </>
        )}
      </motion.div>
    </div>
  );
};
