import React, { memo } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getKoreanDayName } from '../lib/appHelpers';

interface HeaderClockProps {
  currentTime: Date;
}

export const HeaderClock = memo(({ currentTime }: HeaderClockProps) => {
  return (
    <div className="hidden lg:flex items-center gap-1.5 pr-2 border-r border-stone-200/50 dark:border-stone-800 mr-1.5">
      <Clock className="h-3.5 w-3.5 text-neutral-400 dark:text-stone-500 animate-pulse shrink-0" />
      <span className="font-extrabold font-mono tracking-tight text-[11px] text-stone-700 dark:text-stone-300 whitespace-nowrap">
        {getKoreanDayName(currentTime)}요일 {format(currentTime, 'HH:mm')}
      </span>
    </div>
  );
});

HeaderClock.displayName = 'HeaderClock';
