import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SupporterRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 🎈 우아하고 부드러운 폭발/하트 효과
interface HeartParticle {
  id: number;
  x: number; // -60 ~ 60 px
  y: number; // -60 ~ 60 px
  size: number; // 14 ~ 26 px
  duration: number;
  delay: number;
  colorClass: string;
}

export const SupporterRegisterModal: React.FC<SupporterRegisterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [nickname, setNickname] = useState('');
  const [supporterInfo, setSupporterInfo] = useState('');
  const [cheerMessage, setCheerMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [particles, setParticles] = useState<HeartParticle[]>([]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setIsSubmitted(false);
      setIsSubmitting(false);
      setNickname('');
      setSupporterInfo('');
      setCheerMessage('');
      setParticles([]);
    }
  }, [isOpen]);

  const triggerHeartCelebration = () => {
    const colors = [
      'text-rose-500 fill-rose-400',
      'text-pink-500 fill-pink-300',
      'text-rose-400 fill-rose-200',
      'text-amber-400 fill-amber-300',
      'text-red-500 fill-rose-500',
    ];

    const newParticles: HeartParticle[] = Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const distance = 60 + Math.random() * 90;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 18 + Math.floor(Math.random() * 16),
        duration: 1.2 + Math.random() * 0.6,
        delay: Math.random() * 0.2,
        colorClass: colors[Math.floor(Math.random() * colors.length)],
      };
    });

    setParticles(newParticles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert('후원자 명단에 표시될 닉네임을 입력해 주세요!');
      return;
    }
    if (!supporterInfo.trim()) {
      alert('후원일시를 입력해 주세요!');
      return;
    }

    setIsSubmitting(true);

    const formattedMessage = `💖 [피그타운 후원자 명단 등록 요청]\n\n• 닉네임: ${nickname.trim()}\n• 입금자/후원일시: ${supporterInfo.trim() || '미입력'}\n• 응원 한마디: ${cheerMessage.trim() || '없음'}\n• 요청 시각: ${new Date().toLocaleString('ko-KR')}`;

    const formData = new FormData();
    formData.append('message', formattedMessage);

    try {
      await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      // Ignore background network errors
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
      triggerHeartCelebration();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white rounded-2xl w-[92vw] sm:w-full max-w-[380px] overflow-hidden shadow-2xl border border-rose-100 flex flex-col select-none"
          >
            {/* Header: Rose-Gold Gradient */}
            <div className="bg-gradient-to-r from-rose-200 via-pink-200 to-amber-200 px-5 py-4 flex items-center justify-between border-b border-rose-200/80">
              <div className="flex items-center gap-2 text-rose-950">
                <div className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center border border-rose-200 shadow-2xs">
                  <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-rose-950">
                    후원자 닉네임 등록
                  </h3>
                  <p className="text-[10px] text-rose-900/80 font-bold">
                    피그타운 후원자 명단 등록 신청
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-rose-900/10 hover:bg-rose-900/20 text-rose-950 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 text-center space-y-3"
                >
                  <div className="relative h-16 w-16 mx-auto flex items-center justify-center">
                    {/* 하트 폭발 효과 */}
                    {particles.length > 0 && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                        {particles.map((p) => (
                          <motion.div
                            key={p.id}
                            initial={{
                              opacity: 1,
                              x: 0,
                              y: 0,
                              scale: 0.3,
                            }}
                            animate={{
                              opacity: [1, 1, 0],
                              x: p.x,
                              y: p.y,
                              scale: [0.3, 1.1, 0.8],
                            }}
                            transition={{
                              duration: p.duration,
                              delay: p.delay,
                              ease: 'easeOut',
                            }}
                            style={{
                              position: 'absolute',
                              width: `${p.size}px`,
                              height: `${p.size}px`,
                            }}
                            className="flex items-center justify-center"
                          >
                            <Heart className={cn('w-full h-full', p.colorClass)} />
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <div className="h-14 w-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shadow-inner relative z-0">
                      <CheckCircle2 className="h-8 w-8 text-rose-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base font-black text-rose-950 flex items-center justify-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-rose-500 fill-rose-300" />
                      등록 신청 완료!
                      <Sparkles className="h-4 w-4 text-rose-500 fill-rose-300" />
                    </h4>
                    <p className="text-xs text-stone-600 font-bold leading-relaxed max-w-[280px] mx-auto">
                      피그타운에 따뜻한 마음을 나누어 주셔서 진심으로 감사합니다! 💕
                    </p>
                    <p className="text-[11px] text-rose-800 font-semibold bg-rose-50 rounded-xl p-2.5 border border-rose-100 mt-2">
                      후원 내역 확인 후<br />
                      후원자 명단에 신속히 반영해 드릴게요!
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-xs shadow-md hover:from-rose-600 hover:to-pink-600 active:scale-98 transition-all cursor-pointer"
                  >
                    확인
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="bg-rose-50/80 border border-rose-100 rounded-xl p-2.5 text-center">
                    <p className="text-[11px] text-rose-950 font-bold leading-relaxed">
                      💡 미신청 시 입금자명(예: 홍*동)으로 명단에 표기됩니다.
                    </p>
                  </div>

                  {/* 닉네임 필드 */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-black text-stone-800 block">
                      명단에 올릴 닉네임 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="예: 피그타운"
                      maxLength={20}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 text-xs text-stone-800 placeholder-stone-400 outline-none transition-all"
                    />
                  </div>

                  {/* 입금자명 / 후원 일시 */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-black text-stone-800 block">
                      입금자명/후원일시 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={supporterInfo}
                      onChange={(e) => setSupporterInfo(e.target.value)}
                      placeholder="예: 홍*동 / 7월 27일 13시 (본인 확인용)"
                      maxLength={40}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 text-xs text-stone-800 placeholder-stone-400 outline-none transition-all"
                    />
                  </div>

                  {/* 응원 한마디 */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-black text-stone-800 block">
                      참고사항
                    </label>
                    <textarea
                      value={cheerMessage}
                      onChange={(e) => setCheerMessage(e.target.value)}
                      placeholder="내용을 입력해주세요."
                      rows={2}
                      maxLength={150}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 text-xs text-stone-800 placeholder-stone-400 outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-black text-xs shadow-md hover:from-rose-600 hover:to-pink-600 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? '전송 중...' : '후원자 정보 등록 신청'}</span>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
