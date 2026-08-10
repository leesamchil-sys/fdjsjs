import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X } from 'lucide-react';

interface RecInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWeatherModal: () => void;
}

export const RecInfoModal: React.FC<RecInfoModalProps> = ({
  isOpen,
  onClose,
  onOpenWeatherModal,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-stone-900 p-6 md:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 shrink-0 font-sans z-[110]"
          >
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-900 dark:bg-stone-100 rounded-xl text-white dark:text-stone-900">
                  <Info className="h-4 w-4" />
                </div>
                <h4 className="font-extrabold text-base md:text-lg text-stone-900 dark:text-stone-100">
                  추천 가이드 노출 조건 안내
                </h4>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-medium overflow-y-auto flex-1 pr-1">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/30">
                <p className="break-keep text-stone-700 dark:text-stone-200">
                  이 영역은 게임 내 <strong className="text-slate-900 dark:text-amber-400 font-black">시간과 날씨</strong>를 기반으로, <strong className="text-slate-900 dark:text-stone-100 font-extrabold">지금 바로 도감 등록이 가능한 종류</strong>만 골라내어 추천해 드리는 영역입니다.
                </p>
                <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 break-keep">
                  ※ 24시간 상시 출현하거나 날씨에 관계없이 항상('날씨무관') 잡을 수 있는 도감은 리스트의 가독성을 위해 추천 목록에서 제외되며, 실시간 상황에 맞는 도감 위주로 표시됩니다.
                </p>
              </div>

              {/* Weather Input Guide and Link */}
              <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-2.5">
                <h5 className="font-extrabold text-stone-900 dark:text-amber-400 text-xs flex items-center gap-1.5">
                  🌦️ 게임 내 날씨 정보 입력 방법
                </h5>
                <p className="text-xs break-keep text-stone-700 dark:text-stone-300 leading-relaxed">
                  화면 <strong className="text-stone-900 dark:text-stone-100 font-bold">우측 상단</strong>에 위치한 <strong className="text-stone-900 dark:text-stone-100 font-bold underline decoration-amber-400 dark:decoration-amber-500/50 decoration-2">[요일 시각 / 날씨 위젯]</strong> 버튼(톱니바퀴 아이콘 ⚙️)을 클릭하시면 시각 및 요일별 상세 날씨를 지정할 수 있는 <strong className="text-amber-900 dark:text-amber-200 font-bold bg-amber-100/40 dark:bg-amber-900/30 px-1 rounded-sm">날씨 정보 입력 팝업</strong>이 나타납니다.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWeatherModal();
                  }}
                  className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-900 dark:bg-stone-100 hover:bg-neutral-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 font-extrabold text-xs rounded-xl shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                >
                  날씨 정보 입력/변경 팝업 열기 <span className="text-[10px]">➔</span>
                </button>
              </div>

              <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-4 border border-stone-100 dark:border-stone-800 space-y-3.5">
                <h5 className="font-bold text-stone-800 dark:text-stone-200 text-xs flex items-center gap-1.5 border-b border-stone-200/60 dark:border-stone-800 pb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-stone-100"></span>
                  등장 조건
                </h5>

                <div className="flex gap-2.5 items-start">
                  <span className="bg-slate-950 dark:bg-stone-800 text-white dark:text-stone-100 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0">시간 조건</span>
                  <p className="text-xs break-keep text-stone-600 dark:text-stone-400">
                    대상의 등장 시간대(예: 08:00~16:00 등) 범위 내에 <strong className="text-stone-900 dark:text-stone-100 font-bold underline decoration-amber-400 dark:decoration-amber-500/50 decoration-2">현재의 시간</strong>이 포함되어 있어야 합니다.
                  </p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="bg-slate-950 dark:bg-stone-800 text-white dark:text-stone-100 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0">날씨 조건</span>
                  <div className="text-xs break-keep text-stone-600 dark:text-stone-300 space-y-1 bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 w-full">
                    <p>실제 <strong className="text-stone-900 dark:text-stone-100 font-bold">게임 날씨</strong>가 대상의 등장 조건과 일치되어야 합니다:</p>
                    <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                      <li><span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold px-1 rounded-sm">비/눈/무지개</span>: 게임 날씨가 <strong className="text-blue-600 dark:text-blue-400 font-semibold">비눈</strong> 또는 <strong className="text-violet-600 dark:text-violet-400 font-semibold">무지개</strong>일 때 매칭됩니다.</li>
                      <li><span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 font-bold px-1 rounded-sm">맑음/무지개</span>: 게임 날씨가 <strong className="text-amber-600 dark:text-amber-400 font-semibold">맑음</strong> 또는 <strong className="text-violet-600 dark:text-violet-400 font-semibold">무지개</strong>일 때 매칭됩니다.</li>
                      <li><span className="bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-bold px-1 rounded-sm">무지개</span>: 게임 날씨가 오직 <strong className="text-violet-600 dark:text-violet-400 font-extrabold">무지개</strong>일 때만 매칭됩니다.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl p-4 text-xs space-y-2 text-amber-900 dark:text-amber-400 font-medium">
                <h5 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  💡 필터링 제외 조건 (추천 목록에 표시되지 않는 대상)
                </h5>
                <ul className="list-disc pl-4 space-y-1 break-keep text-amber-800 dark:text-amber-400 text-[11px] font-semibold">
                  <li>이미 도감에 등록 완료 구분을 체크하여 <strong className="font-bold text-amber-950 dark:text-amber-100 bg-amber-200/50 dark:bg-amber-900/40 px-1 rounded-sm">수집 완료로 체크한 도감</strong>은 목록에서 제외됩니다.</li>
                  <li><strong className="font-bold text-amber-950 dark:text-amber-100 bg-amber-200/50 dark:bg-amber-900/40 px-1 rounded-sm">언제든지 만날 수 있는 도감</strong> (24시간 등장 및 '날씨무관' 날씨 조건)은 상시 조회가 가능하므로 추천 가이드 목록에서 제외됩니다.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end shrink-0 border-t border-neutral-100 dark:border-stone-800 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-extrabold text-white bg-slate-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-slate-800 dark:hover:bg-stone-200 rounded-xl transition-all shadow-md font-sans cursor-pointer active:scale-95"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
