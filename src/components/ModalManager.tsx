import React from 'react';
import { AnimatePresence } from 'motion/react';
import WelcomeModal from './WelcomeModal';
import GuideModal from './GuideModal';

interface ModalManagerProps {
  isWelcomeOpen: boolean;
  setIsWelcomeOpen: (open: boolean) => void;
  isGuideOpen: boolean;
  setIsGuideOpen: (open: boolean) => void;
  forceShowIntro: boolean;
}

export const ModalManager: React.FC<ModalManagerProps> = ({
  isWelcomeOpen,
  setIsWelcomeOpen,
  isGuideOpen,
  setIsGuideOpen,
  forceShowIntro,
}) => {
  return (
    <>
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onViewGuide={() => {
          setIsWelcomeOpen(false);
          setTimeout(() => setIsGuideOpen(true), 300);
        }}
      />
      <GuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
        forceShowIntro={forceShowIntro} 
      />
    </>
  );
};
