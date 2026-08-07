import { useState, useEffect } from 'react';
import { 
  X, 
  CloudRain, 
  Sprout, 
  Lock, 
  Unlock,
  CheckSquare,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
  Clock,
  Info,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceShowIntro?: boolean;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const totalSteps = 4;

  useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('has_seen_pigtown_guide', 'true');
    onClose();
  };

  const handleNext = () => {
    if (activeStep < totalSteps - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div data-nosnippet className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Semi-transparent backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md cursor-default"
          onClick={handleClose}
        />

        {/* Sophisticated, Minimalist Panel */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 shadow-2xl z-10 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <motion.div 
                key={activeStep}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="h-10 w-10 bg-stone-50 dark:bg-stone-950 rounded-xl flex items-center justify-center border border-stone-100 dark:border-stone-800"
              >
                {activeStep === 0 && <CloudRain className="h-5 w-5 text-sky-500" />}
                {activeStep === 1 && <CheckSquare className="h-5 w-5 text-teal-600" />}
                {activeStep === 2 && <Check className="h-5 w-5 text-indigo-600" />}
                {activeStep === 3 && <Sprout className="h-5 w-5 text-emerald-600" />}
              </motion.div>
              <div>
                <motion.h2 
                  key={activeStep}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight"
                >
                  {activeStep === 0 && '1. 날씨 필터와 날씨무관 조건 가이드'}
                  {activeStep === 1 && '2. 간편한 도감 컬렉션 및 성급 등록'}
                  {activeStep === 2 && '3. 이름으로 빠른 일괄 등록'}
                  {activeStep === 3 && '4. 작물 알림 타이머 및 오프라인 알림'}
                </motion.h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">도움말 & 가이드</span>
                  <span className="text-[10px] px-2 py-0.5 bg-stone-100 dark:bg-stone-950 text-stone-600 dark:text-stone-300 rounded-md font-mono font-bold leading-none">
                    {activeStep + 1} / {totalSteps}
                  </span>
                </div>
              </div>
            </div>
             <button
              type="button"
              onClick={handleClose}
              className="p-1.5 hover:bg-neutral-50 dark:hover:bg-stone-800 rounded-lg text-neutral-400 dark:text-stone-400 hover:text-neutral-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper Content Wrapper - Clean, readable layout and generous height */}
          <div className="p-6 bg-white dark:bg-stone-900 overflow-y-auto h-[330px] min-h-[330px] max-h-[330px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.12 }}
                className="text-left space-y-4"
              >
                {activeStep === 0 && (
                  <div className="space-y-4">
                    <div className="space-y-3 text-neutral-700 dark:text-stone-300 leading-relaxed text-xs">
                      <p>
                        원하는 날씨 필터를 클릭하면 해당하는 실시간 출현 생물들이 한눈에 정리되어 필터링되어 나타납니다.
                      </p>
                      
                      <div className="p-4 bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/40 rounded-xl space-y-2.5">
                        <div className="flex items-center gap-2 text-sky-950 dark:text-sky-300 font-black text-xs">
                          <Info className="h-4 w-4 shrink-0 text-sky-500 animate-pulse" />
                          <span>💡 특정 도감이 리스트에서 안보이나요?</span>
                        </div>
                        <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                          비, 눈 등 특정 날씨를 개별 지정하시면, 해당 날씨에만 나오는 생물들을 강조하여 보여주기 위해 <strong className="text-sky-950 dark:text-sky-300 font-bold">날씨/시간 상관없이 볼 수 있는 생물들은 목록에서 숨김</strong> 처리됩니다.
                        </p>
                        <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed font-semibold">
                          날씨무관 생물을 같이 편하게 모아 보시려면 <strong className="text-sky-950 dark:text-sky-300 font-bold">"날씨 전체 선택"</strong>(필터 해제)을 유지해 주시거나 <strong className="text-sky-950 dark:text-sky-300 font-bold">'날씨무관' 필터</strong>를 활성화해 보세요!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-3 text-xs text-neutral-700 dark:text-stone-300 leading-relaxed">
                      <p>
                        터치 한 번으로 수집 도감 진행도와 성장 타이머 데이터를 안전하고 실시간으로 관리해 보세요.
                      </p>
                      
                      <div className="space-y-3 pt-1">
                        <div className="flex gap-2.5 items-start">
                          <div className="mt-0.5 h-6 w-6 rounded-md bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 flex items-center justify-center shrink-0">
                            <Check className="h-3.5 w-3.5 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">원클릭 등록 & 데이터 연동</h4>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">생물 카드 우측 상단의 실시간 체크 상자를 가볍게 탭하면, 사이드바 진척도와 통계 데이터가 즉각 반영됩니다.</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 items-start">
                          <div className="mt-0.5 h-6 w-6 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">1★부터 5★까지의 정밀한 등급 기록</h4>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">수집한 등급 별점을 기록하고 현황을 보존할 수 있습니다.</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 items-start">
                          <div className="mt-0.5 h-6 w-6 rounded-md bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center shrink-0">
                            <Lock className="h-3 w-3 text-sky-600" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">안전한 구글 실시간 계정 동기화</h4>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-semibold">연동 로그인을 해두면 캐시 초기화나 기기 분실/변경에도 언제든지 도감 데이터와 텃밭 타이머가 손실 없이 복원됩니다.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-3 text-xs text-neutral-700 dark:text-stone-300 leading-relaxed">
                      <p>
                        수집한 생물 도감이 많나요? 하나씩 등록할 필요 없이 이름과 성급을 한번에 입력해 보세요.
                      </p>
                      
                      <div className="p-4 bg-indigo-50/60 dark:bg-indigo-500/15 border border-indigo-100 dark:border-indigo-500/30 rounded-xl space-y-2.5">
                        <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-300 font-black text-xs">
                          <Check className="h-4 w-4 shrink-0 text-indigo-500" />
                          <span>✨ 일괄 등록 방법</span>
                        </div>
                        <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                          도감 관리 팝업의 일괄 등록 필드에 <strong className="text-indigo-950 dark:text-indigo-300 font-bold">"생물명/성급"</strong> (예: <code className="bg-indigo-100 dark:bg-indigo-950/85 text-indigo-800 dark:text-indigo-300 px-1 rounded">굴뚝새/3</code>) 형태로 줄바꿈하여 여러 건을 입력 후 등록하면 즉시 도감에 반영됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-3.5 text-xs text-neutral-700 dark:text-stone-300 leading-relaxed">
                      <p>
                        텃밭에서 심어둔 소중한 작물들의 성장 시간을 간편하게 실시간 모니터링합니다.
                      </p>

                      <div className="space-y-2.5">
                        <div className="flex gap-2.5 items-start">
                          <div className="mt-0.5 h-6 w-6 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Clock className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">시간 수정 편집 및 원클릭 즉시 완료</h4>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">언제든 작물의 성장 시간을 확인하거나 업데이트할 수 있습니다.</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5 items-start p-3 bg-amber-50/40 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl">
                          <Bell className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                          <div>
                            <h4 className="text-[11.5px] font-black text-amber-900 dark:text-amber-400">
                              🔔 오프라인 알림 수신 방법
                            </h4>
                            <p className="text-[11px] text-amber-800/90 dark:text-amber-300 leading-relaxed mt-0.5">
                              브라우저를 닫거나 휴대폰 화면을 완전히 꺼두었을 때에도 알림을 받고 싶나요? 모바일 최적화를 위해 상단 <strong className="text-amber-950 dark:text-amber-300 font-black">"환경설정 &gt; 텔레그램 연동"</strong>을 눌러 본인만의 봇을 세팅해 보세요!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Steps Progress Footer Dots & Navigation Controllers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4.5 bg-neutral-50 dark:bg-stone-950 border-t border-neutral-100 dark:border-stone-800 shrink-0 select-none">
            {/* Left side: Don't show again checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-500 dark:text-stone-400 hover:text-neutral-800 dark:hover:text-stone-200 transition-colors">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDontShowAgain(checked);
                  if (checked) {
                    localStorage.setItem('has_seen_pigtown_guide', 'true');
                  }
                }}
                className="rounded-sm border-neutral-300 dark:border-stone-800 text-neutral-900 dark:text-stone-100 focus:ring-neutral-800 h-4.5 w-4.5 cursor-pointer accent-neutral-800 dark:accent-stone-100"
              />
              <span className="font-semibold">다시 표시 안함</span>
            </label>

            {/* Right side: Step progress and Nav buttons */}
            <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto">
              {/* Step Indicators */}
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activeStep === idx ? 'w-6 bg-neutral-900 dark:bg-stone-100' : 'w-2 bg-neutral-200 dark:bg-stone-800 hover:bg-neutral-300 dark:hover:bg-stone-750'
                    }`}
                    aria-label={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Stepper Controllers */}
              <div className="flex items-center gap-2 shrink-0">
                {activeStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="py-1.5 px-3 bg-white dark:bg-stone-900 border border-neutral-200 dark:border-stone-800 text-neutral-600 dark:text-stone-300 hover:bg-neutral-50 dark:hover:bg-stone-850 text-[11px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 hover:border-neutral-300 dark:hover:border-stone-700"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    이전
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="py-1.5 px-4 bg-neutral-900 dark:bg-stone-100 hover:bg-neutral-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-[11px] font-black rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  {activeStep === totalSteps - 1 ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      완료
                    </>
                  ) : (
                    <>
                      다음
                      <ChevronRight className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
