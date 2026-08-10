import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coffee, Heart, ExternalLink, QrCode, Sparkles, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick?: () => void;
}

// ☕ 후원자 목록 (신규 후원자가 생기면 이 배열에 닉네임을 추가해주세요)
export const SUPPORTERS: string[] = [
  '이*연 님', '댕 님',
];

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, onRegisterClick }) => {
  const [activeTab, setActiveTab] = useState<'support' | 'supporters'>('support');

  // KakaoPay Link
  const kakaopayLink = "https://qr.kakaopay.com/Ej8Kd9lZv"; 

  const onCloseRef = React.useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('support'); // Reset to first tab on open
      window.history.pushState({ modal: 'support' }, '');
      const handlePopState = () => {
        onCloseRef.current();
      };
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    if (window.history.state?.modal === 'support') {
      window.history.back();
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-neutral-950/45 backdrop-blur-xs"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white rounded-2xl w-[92vw] sm:w-full max-w-[360px] h-[560px] max-h-[85vh] overflow-hidden shadow-2xl border border-neutral-100 flex flex-col select-none"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          >
            {/* Header */}
            <div className={cn(
              "px-5 py-3.5 flex flex-col items-center text-center relative shrink-0 transition-all duration-300",
              activeTab === 'support' 
                ? "bg-[#FEE500]" 
                : "bg-gradient-to-r from-rose-200 via-pink-200 to-amber-200 text-rose-950 border-b border-rose-200/80"
            )}>
              <button 
                onClick={handleClose}
                className={cn(
                  "absolute top-3.5 right-3.5 p-1.5 rounded-xl transition-colors cursor-pointer",
                  activeTab === 'support' ? "bg-black/5 hover:bg-black/10 text-[#3C1E1E]" : "bg-rose-900/10 hover:bg-rose-900/20 text-rose-950"
                )}
              >
                <X className="h-4.5 w-4.5" />
              </button>
              
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-9 w-9 bg-white/90 rounded-xl flex items-center justify-center shadow-2xs mb-0.5 transition-all border border-rose-200/60">
                  {activeTab === 'support' ? (
                    <Coffee className="h-4.5 w-4.5 text-[#3C1E1E]" />
                  ) : (
                    <Heart className="h-4.5 w-4.5 text-rose-500 fill-rose-500" />
                  )}
                </div>
              </div>
              
              <h3 className={cn(
                "text-[14px] font-extrabold tracking-tight transition-colors duration-300",
                activeTab === 'support' ? "text-[#3C1E1E]" : "text-rose-950"
              )}>
                돼지에게 커피 한 잔 선물하기
              </h3>

              {/* Tab Selector */}
              <div className={cn(
                "flex items-center gap-1 p-1 rounded-xl mt-3 w-full max-w-[260px] transition-colors",
                activeTab === 'support' ? "bg-black/15" : "bg-rose-950/15"
              )}>
                <button
                  onClick={() => setActiveTab('support')}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    activeTab === 'support' 
                      ? "bg-white text-[#3C1E1E] shadow-xs" 
                      : activeTab === 'supporters'
                        ? "text-rose-950/80 hover:text-rose-950"
                        : "text-white/80 hover:text-white"
                  )}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>후원하기</span>
                </button>
                <button
                  onClick={() => setActiveTab('supporters')}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 relative",
                    activeTab === 'supporters' 
                      ? "bg-white text-rose-950 shadow-xs" 
                      : "text-[#3C1E1E]/80 hover:text-[#3C1E1E]"
                  )}
                >
                  <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                  <span>후원자 명단</span>
                </button>
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="overflow-y-auto p-5 text-center flex-1 flex flex-col justify-between">
              {activeTab === 'support' ? (
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  {/* QR Code Segment */}
                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 flex flex-col items-center space-y-2">
                    <div className="aspect-square w-full max-w-[145px] bg-white rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center relative overflow-hidden p-1">
                      <img 
                        src="/images/pigtown_qr.webp" 
                        alt="송금 QR" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('bg-neutral-100');
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 p-2 text-center pointer-events-none -z-10">
                        <QrCode className="h-8 w-8 text-neutral-300 mb-1" />
                        <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">QR Code</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 tracking-wider">
                      QR코드를 스캔하시면 카카오톡 송금하기로 이동됩니다
                    </span>
                  </div>

                  {/* Link Action Segment */}
                  <div className="space-y-2 font-sans lg:hidden">
                    <a 
                      href={kakaopayLink}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-black rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs text-xs cursor-pointer block text-center"
                    >
                      카카오톡으로 후원하기
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {/* Message Block */}
                  <div className="space-y-1.5 font-sans">
                    <p className="text-[11px] font-semibold text-neutral-500 leading-relaxed">
                      피그타운이 도감 정리에 도움이 되셨나요? <br />
                      보내주시는 따뜻한 후원은 지속적인 서버 유지와 <br />
                      서비스 개선, 그리고 돼지의 간식에도 큰 보탬이 됩니다.
                    </p>
                    <div className="flex items-center justify-center gap-1 text-[9.5px] font-black text-neutral-600 bg-neutral-100 py-1 px-2.5 rounded-md w-fit mx-auto">
                      <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                      항상 이용해주셔서 감사합니다.
                    </div>
                  </div>

                  {/* Disclaimer Text */}
                  <div>
                    <div className="text-[9.5px] text-neutral-400 font-medium leading-relaxed">
                      <p>본 후원은 대가성 없는 자발적인 후원입니다.</p>
                      <p>후원 후에는 환불이 어려우니 신중한 참여 부탁드립니다.</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Supporters List Tab */
                <div className="space-y-3 flex-1 flex flex-col justify-between py-0.5">
                  <div className="space-y-3">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-amber-500/10 border border-rose-200/80 rounded-xl p-2.5 text-center">
                      <p className="text-[11.5px] text-rose-950 font-bold leading-relaxed flex items-center justify-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-rose-500 fill-rose-300 shrink-0" />
                        피그타운에 따뜻한 마음을 보내주신 분들입니다.
                      </p>
                    </div>

                    {/* Supporters List */}
                    {SUPPORTERS.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {SUPPORTERS.map((nickname, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: idx * 0.05, duration: 0.2 }}
                            className="group relative px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-100/90 via-rose-100/80 to-amber-100/80 border border-rose-200/90 hover:border-rose-300 transition-all flex items-center gap-3 shadow-2xs hover:shadow-xs"
                          >
                            <div className="h-7.5 w-7.5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-400 text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-2xs border border-white/80">
                              <Heart className="h-3.5 w-3.5 fill-white text-white" />
                            </div>
                            <span className="text-xs font-black text-rose-950 tracking-tight text-left">
                              {nickname}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center space-y-2 text-neutral-400">
                        <Users className="h-8 w-8 mx-auto opacity-40" />
                        <p className="text-xs font-semibold">아직 등록된 후원자가 없습니다.</p>
                        <button
                          onClick={() => setActiveTab('support')}
                          className="text-xs font-bold text-rose-600 underline cursor-pointer"
                        >
                          첫 번째 후원자가 되어보세요!
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-100 text-center">
                    <p className="text-[11px] text-stone-500 font-semibold">
                      후원자님은{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onRegisterClick) {
                            onRegisterClick();
                          }
                        }}
                        className="text-rose-600 font-black underline cursor-pointer hover:text-rose-700 active:scale-95 transition-all relative z-10 px-0.5 py-0.5"
                      >
                        [닉네임 등록]
                      </button>
                      을 신청해 주세요.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
