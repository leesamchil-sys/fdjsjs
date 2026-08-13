import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coffee, Heart, ExternalLink, QrCode, Clipboard, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Simple mobile detection at mounting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword));
      setIsMobile(isMobileDevice);
    }
  }, [isOpen]);

  // KakaoPay Link (users can replace with their actual custom link)
  // Standard KakaoPay link placeholder
  const kakaopayLink = "https://qr.kakao.com/talk/2S5x_kGny0bYQ.rS1Gz2I_or11Y"; 

  const handleCopyLink = () => {
    navigator.clipboard.writeText(kakaopayLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/45 backdrop-blur-xs"
          />

          {/* Modal Content - Auto-resizing, responsive max-height */}
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white rounded-2xl w-full max-w-[340px] overflow-hidden shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-[#FEE500] px-5 py-4 pb-5 flex flex-col items-center text-center relative shrink-0">
              <button 
                onClick={onClose}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-xl bg-black/5 hover:bg-black/10 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5 text-[#3C1E1E]" />
              </button>
              
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-xs mb-2">
                <Coffee className="h-5 w-5 text-[#3C1E1E]" />
              </div>
              
              <h3 className="text-[14px] font-extrabold text-[#3C1E1E] tracking-tight">
                개발자에게 커피 한 잔 선물하기 ☕️
              </h3>
            </div>

            {/* Scrollable Container (Compact sizing) */}
            <div className="overflow-y-auto p-5 space-y-4 text-center">
              
              {/* QR Code Segment - Hidden on Mobile */}
              {!isMobile ? (
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 flex flex-col items-center space-y-2.5">
                  <div className="aspect-square w-full max-w-[130px] bg-white rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center relative overflow-hidden p-1">
                    <img 
                      src="/images/support/kakaopay_qr.png" 
                      alt="카카오페이 QR" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-neutral-100');
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 p-2 text-center pointer-events-none">
                      <QrCode className="h-8 w-8 text-neutral-300 mb-1" />
                      <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">KakaoPay QR</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400 tracking-wider">스마트폰 카메라로 QR 코드를 스캔해 주세요</span>
                </div>
              ) : (
                /* Mobile Link Action Segment */
                <div className="space-y-3 font-sans">
                  <a 
                    href={kakaopayLink}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-black rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs text-xs cursor-pointer block text-center"
                  >
                    카카오페이 송금 바로가기
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex-1 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 border border-neutral-200 text-[10px] font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          링크 복사 완료
                        </>
                      ) : (
                        <>
                          <Clipboard className="h-3 w-3" />
                          송금 링크 주소 복사
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-neutral-400 leading-normal font-medium text-left bg-neutral-50 p-2.5 rounded-lg border border-neutral-150">
                    🔒 <strong className="text-neutral-600">안심하고 터치하셔도 됩니다:</strong> 해당 연결 주소는 타사 외부 피싱 사이트가 아닌 카카오페이(<span className="font-semibold text-amber-700">kakaopay</span>) 공식 안전 송금 링크입니다.
                  </p>
                </div>
              )}

              {/* Message Block */}
              <div className="space-y-2 pt-1 font-sans">
                <p className="text-[11.5px] font-semibold text-neutral-500 leading-relaxed">
                  피그타운이 도감 정리에 도움이 되었나요? <br />
                  보내주시는 따뜻한 후원은 지속적인 서버 유지와 <br />
                  서비스 업그레이드에 아주 큰 보탬이 됩니다.
                </p>
                <div className="flex items-center justify-center gap-1 text-[9px] font-black text-neutral-600 bg-neutral-100 py-1 px-2.5 rounded-md w-fit mx-auto">
                  <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                  늘 아껴주시고 이용해주셔서 감사드립니다.
                </div>
              </div>

              {/* Action Elements */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition-all active:scale-95 text-xs shadow-2xs cursor-pointer"
                >
                  확인
                </button>
                <p className="text-[9px] text-neutral-400 font-medium">
                  본 후원은 자발적인 마음으로 참여하는 방식입니다.
                </p>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
