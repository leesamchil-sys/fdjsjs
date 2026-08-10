import React, { memo } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getKoreanDayName } from '../lib/appHelpers';

interface HeaderClockProps {
  currentTime: Date;
  showBorder?: boolean;
}

export const HeaderClock = memo(({ currentTime, showBorder = true }: HeaderClockProps) => {
  const dayName = getKoreanDayName(currentTime);
  const day = currentTime.getDay();
  const dayColorClass = '';

  return (
    <div className={`flex items-center gap-1 sm:gap-1.5 shrink-0 ${
      showBorder ? "pr-1.5 sm:pr-2 border-r border-stone-200/50 dark:border-stone-800 mr-1 sm:mr-1.5" : ""
    }`}>
      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-neutral-400 dark:text-stone-500 animate-pulse shrink-0" />
      <span className="font-extrabold font-mono tracking-tight text-[10.5px] sm:text-[11px] text-stone-700 dark:text-stone-300 whitespace-nowrap flex items-center gap-1">
        <span className={`hidden sm:inline ${dayColorClass}`}>{dayName}요일</span>
        <span className={`sm:hidden ${dayColorClass}`}>{dayName}</span>
        <span>{format(currentTime, 'HH:mm')}</span>
      </span>
    </div>
  );
});

HeaderClock.displayName = 'HeaderClock';
