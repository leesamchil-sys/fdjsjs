import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, AlertTriangle, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  isError?: boolean;
}

const TIPS = [
  "다양한 곤충, 물고기, 요리 도감의 수집률을 한곳에서 편리하게 관리해 보세요.",
  "작물 타이머를 설정하면 수확 시간에 맞춰 알림을 보내드려요.",
  "우측 상단에서 날씨를 설정하고 지금 수집 가능한 도감을 바로 확인해 보세요.",
  "구글 로그인을 이용하면 여러 기기에서 내 도감 기록을 안전하게 연동할 수 있어요.",
  "교배꽃 가이드에서 원하는 색상의 꽃을 얻기 위한 조합표를 쉽게 찾아보세요.",
  "펫별 선호 음식 정보를 관리 할 수 있어요.",
  "추천 가이드 탭에서 현재 시간에 가장 잡기 좋은 물고기와 곤충을 추천받아 보세요."
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isError }) => {
  const [progress, setProgress] = useState(15);
  const [tipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));

  useEffect(() => {
    if (isError) return;

    // Progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        const increment = Math.max(1, Math.floor((95 - prev) / 5));
        return Math.min(95, prev + increment);
      });
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [isError]);

  return (
    <div className="fixed inset-0 z-[100000] bg-white dark:bg-stone-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center max-w-sm w-full text-center"
      >
        {isError ? (
          <>
            <div className="p-4 bg-rose-100 dark:bg-rose-950/30 rounded-full text-rose-600 dark:text-rose-400 mb-6">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">로딩이 지연되고 있습니다</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed px-4">
                일시적인 지연 현상이나 인터넷 연결 상태가 불안정할 수 있습니다.<br />
                대기 시간이 너무 길어질 경우 <span className="font-bold text-stone-800 dark:text-stone-200">새로고침 (F5)</span>이나 아래 버튼을 눌러주세요.
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
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[3px] border-stone-100 dark:border-stone-900" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-stone-800 dark:border-t-stone-200"
              />
              <div className="flex flex-col items-center">
                <span className="text-stone-900 dark:text-stone-100 font-black text-lg tracking-tighter">
                  {progress}%
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2.5 w-full mb-8">
              <span className="text-stone-800 dark:text-stone-200 font-black text-sm tracking-tight">
                {progress < 75 ? '도감 데이터를 가져오는 중입니다' : '화면 구성 중입니다'}
              </span>
              <div className="w-full bg-stone-100 dark:bg-stone-900 h-2 rounded-full overflow-hidden p-0.5 border border-stone-200/50 dark:border-stone-800">
                <motion.div 
                  className="bg-stone-900 dark:bg-stone-100 h-full rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                />
              </div>
            </div>

            <div className="w-full bg-stone-50 dark:bg-stone-900/50 border border-stone-200/70 dark:border-stone-800 rounded-2xl p-4 shadow-sm min-h-[80px] flex flex-col justify-center items-center">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
                <Sparkles className="h-3.5 w-3.5 animate-spin-slow" />
                <span>사이트 이용 팁</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.25 }}
                  className="text-xs text-stone-600 dark:text-stone-400 font-medium leading-relaxed break-keep"
                >
                  {TIPS[tipIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

