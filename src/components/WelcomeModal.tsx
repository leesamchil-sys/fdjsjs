import { motion, AnimatePresence } from 'motion/react';
import { Sprout, BookOpen, Sparkles, X, Milestone, Zap } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewGuide: () => void;
}

export default function WelcomeModal({ isOpen, onClose, onViewGuide }: WelcomeModalProps) {
  if (!isOpen) return null;

  const handleStartImmediately = () => {
    localStorage.setItem('has_seen_pigtown_welcome', 'true');
    localStorage.setItem('has_seen_pigtown_guide', 'true'); // Also prevent autoplay of guide modal
    onClose();
  };

  const handleSeeGuide = () => {
    localStorage.setItem('has_seen_pigtown_welcome', 'true');
    onViewGuide();
  };

  return (
    <AnimatePresence>
      <div data-nosnippet className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md cursor-default"
          onClick={handleStartImmediately}
        />

        {/* Modal content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="relative bg-white dark:bg-stone-850 rounded-[32px] max-w-lg w-full flex flex-col overflow-hidden border-2 border-stone-200 dark:border-stone-700 shadow-[0_25px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] ring-1 ring-black/5 dark:ring-white/10 z-10 font-sans text-neutral-800 dark:text-stone-200"
        >
          {/* Decorative Pig/Sprout Theme Top Banner */}
          <div className="bg-gradient-to-r from-pink-50/10 via-amber-50/10 to-emerald-50/10 dark:from-pink-950/20 dark:via-amber-950/20 dark:to-emerald-950/20 px-6 py-8 border-b border-stone-150 dark:border-stone-750 relative overflow-hidden select-none">
            {/* Background absolute decor icons */}
            <div className="absolute bottom-1 left-8 text-emerald-300/20 -rotate-12 scale-150">🌱</div>

            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, rotate: -15 }}
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                transition={{ duration: 1.2, ease: 'easeOut', repeat: Infinity, repeatDelay: 4 }}
                className="h-16 w-16 bg-white dark:bg-stone-800 rounded-3xl flex items-center justify-center border-2 border-pink-200/60 dark:border-pink-850/60 shadow-lg mb-4 text-3xl select-none overflow-hidden"
              >
                <img src="/images/new_logo.png" className="h-full w-full object-contain scale-90" alt="Pig" />
              </motion.div>
              <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
                피그타운에 오신 것을 환영해요!
              </h1>
              <p className="text-[10px] text-pink-500 font-black mt-1 uppercase tracking-widest opacity-60">UNOFFICIAL FAN SERVICE</p>
            </div>
          </div>

          {/* Quick Intro Content */}
          <div className="px-6 py-8 flex-1 flex flex-col items-center justify-center">
            <p className="text-neutral-600 dark:text-stone-300 text-sm leading-relaxed text-center font-medium max-w-xs">
              도감 수집부터 텃밭 작물 관리까지,<br />피그타운과 함께 시작해 보세요!
            </p>
          </div>

          {/* Action Footer Buttons */}
          <div className="px-6 py-5 bg-neutral-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-2 shrink-0">
            <button
              onClick={handleSeeGuide}
              className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-neutral-900 text-white font-black text-[12px] py-3.5 px-4 rounded-xl cursor-pointer shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <BookOpen className="h-4 w-4 text-pink-300 dark:text-pink-600 shrink-0" />
              도움말 보러가기
            </button>
            <button
              onClick={handleStartImmediately}
              className="w-full bg-white hover:bg-neutral-50 dark:bg-stone-800 dark:hover:bg-stone-750 border border-neutral-200 dark:border-stone-700 text-neutral-600 dark:text-stone-300 hover:text-neutral-900 dark:hover:text-stone-100 font-bold text-[12px] py-3 px-4 rounded-xl cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Sprout className="h-4 w-4 text-emerald-555 shrink-0" />
              지금 시작하기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
