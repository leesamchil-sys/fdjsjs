import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { format, addHours, startOfHour, getHours, addDays, parse } from 'date-fns';
import { GameWeather, WeeklyWeather, DetailedWeather } from '../types';
import { cn } from '../lib/utils';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: Date;
  draftDetailedWeather: DetailedWeather;
  draftWeeklyWeather: WeeklyWeather;
  toggleDraftDetailedWeather: (key: string, weather: GameWeather) => void;
  toggleDraftWeeklyWeather: (dayKey: string, weather: GameWeather) => void;
  onApply: () => void;
  getWeatherButtonClass: (isSelected: boolean) => string;
  translateWeather: (weather: string) => string;
  WeatherIcon: React.ComponentType<{ weather: string; className?: string }>;
  getCycleHour: (hour: number) => number;
  getKoreanDayName: (date: Date) => string;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  currentTime,
  draftDetailedWeather,
  draftWeeklyWeather,
  toggleDraftDetailedWeather,
  toggleDraftWeeklyWeather,
  onApply,
  getWeatherButtonClass,
  translateWeather,
  WeatherIcon,
  getCycleHour,
  getKoreanDayName,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[32px] bg-white dark:bg-stone-850 shadow-[0_25px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col border-2 border-stone-200 dark:border-stone-700 ring-1 ring-black/5 dark:ring-white/10"
          >
            <div className="p-6 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <h3 className="text-xl font-bold font-sans text-slate-900 dark:text-stone-200">날씨 정보 입력</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full cursor-pointer text-stone-500 dark:text-stone-400"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-stone-850">
              {/* Detailed Weather (Next 24 Hours) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500">
                    24시간 상세 예보
                  </label>
                  <span className="text-[11px] text-slate-450 dark:text-stone-500 italic">6시간 주기 터치하여 입력</span>
                </div>
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  {[0, 6, 12, 18, 24].map((hOffset) => {
                    const targetTime = startOfHour(addHours(currentTime, hOffset));
                    const cycleH = getCycleHour(getHours(targetTime));
                    const key = format(targetTime, 'yyyy-MM-dd') + `-${cycleH}`;
                    const val = draftDetailedWeather[key] || 'Unknown';
                    
                    return (
                      <div key={key} className="space-y-2">
                         <p className="text-center text-[10px] sm:text-[11px] font-mono font-bold text-neutral-600 dark:text-stone-400 whitespace-nowrap">
                          {cycleH.toString().padStart(2, '0')}~{(cycleH + 6).toString().padStart(2, '0')}시
                        </p>
                        <div className="flex flex-col gap-1">
                          {(['Clear', 'RainSnow', 'Rainbow', 'Meteor'] as GameWeather[]).map(w => {
                            const isSelected = val === w || (w === 'Clear' && val === 'Heatwave');
                            const displayWeatherType = (w === 'Clear' && val === 'Heatwave') ? 'Heatwave' : w;
                            return (
                              <button
                                key={`${key}-${w}`}
                                onClick={() => toggleDraftDetailedWeather(key, w)}
                                className={cn(
                                  "flex items-center justify-center rounded-lg p-1.5 sm:p-2 transition-all cursor-pointer border",
                                  getWeatherButtonClass(isSelected)
                                )}
                                title={translateWeather(displayWeatherType)}
                              >
                                <WeatherIcon weather={displayWeatherType} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Base Weather */}
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-sm font-bold uppercase tracking-wider text-neutral-400 dark:text-stone-500">
                    요일별 상시 날씨 (기본값)
                  </label>
                  <p className="text-[11px] text-neutral-450 dark:text-stone-500">※ 스마트워치의 날씨 정보와 동일하게 선택해주세요 (좌우로 스크롤 가능)</p>
                </div>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-2 scrollbar-none sm:grid sm:grid-cols-7 sm:gap-1 sm:pb-0 sm:overflow-visible">
                  {(() => {
                    const currentGDay = format(currentTime, 'yyyy-MM-dd');
                    const currentGDate = parse(currentGDay, 'yyyy-MM-dd', new Date());
                    const orderedGDays = [];
                    for (let i = 1; i <= 7; i++) {
                      orderedGDays.push(addDays(currentGDate, i));
                    }
                    return orderedGDays.map((gDate) => {
                      const key = format(gDate, 'yyyy-MM-dd');
                      const dayName = getKoreanDayName(gDate);
                      return (
                        <div key={key} className="snap-center shrink-0 w-[84px] sm:w-auto bg-stone-50 dark:bg-stone-900/60 p-2 sm:p-0 rounded-2xl sm:bg-transparent sm:dark:bg-transparent space-y-1 sm:space-y-2 border border-stone-150 dark:border-stone-800 sm:border-none">
                          <p className="text-center text-xs font-bold text-neutral-800 dark:text-stone-300">
                            {dayName}
                          </p>
                          <div className="flex flex-col gap-1.5 mt-1">
                            {(['Clear', 'RainSnow', 'Rainbow', 'Meteor'] as GameWeather[]).map(w => {
                              const val = draftWeeklyWeather[key] || 'Unknown';
                              const isSelected = val === w || (w === 'Clear' && val === 'Heatwave');
                              const displayWeatherType = (w === 'Clear' && val === 'Heatwave') ? 'Heatwave' : w;
                              return (
                                <button
                                  key={`${key}-${w}`}
                                  onClick={() => toggleDraftWeeklyWeather(key, w)}
                                  className={cn(
                                    "flex items-center justify-center rounded-xl p-2 sm:p-2 transition-all cursor-pointer border min-h-[38px]",
                                    getWeatherButtonClass(isSelected)
                                  )}
                                  title={translateWeather(displayWeatherType)}
                                >
                                  <WeatherIcon weather={displayWeatherType} className="h-4 w-4 sm:h-4 sm:w-4" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 dark:border-stone-800 bg-neutral-50 dark:bg-stone-950">
              <button 
                onClick={onApply}
                className="w-full bg-neutral-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl py-3 text-sm font-bold shadow-lg dark:shadow-none cursor-pointer"
              >
                적용하기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
