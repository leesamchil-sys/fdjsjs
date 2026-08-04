const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const locationLogic = `
  const getDailyLocationDateKey = (date: Date) => {
    const d = new Date(date);
    if (d.getHours() < 6) {
      d.setDate(d.getDate() - 1);
    }
    return format(d, 'yyyy-MM-dd');
  };
  
  const currentDailyLocations = adminDailyLocations[getDailyLocationDateKey(currentTime)] || {};
`;

if (!code.includes('const getDailyLocationDateKey =')) {
  // insert before const currentGameWeather = useMemo(() => {
  code = code.replace(
    'const currentGameWeather = useMemo(() => {',
    locationLogic + '\n  const currentGameWeather = useMemo(() => {'
  );
}

const locationWidget = `
                {/* Daily Locations Widget */}
                {(currentDailyLocations.fluorescentRock || currentDailyLocations.oakTree) && (
                  <div className="flex items-center shrink-0 h-10 bg-stone-150/50 hover:bg-stone-150/80 dark:bg-stone-800/40 dark:hover:bg-stone-800/60 transition-all rounded-xl p-1 sm:px-2 border border-stone-200/30 dark:border-stone-800 text-[10px] sm:text-xs text-neutral-850 dark:text-stone-300 mr-1.5 gap-2">
                    {currentDailyLocations.fluorescentRock && (
                      <div className="flex items-center gap-1">
                        <img src="/images/형광석.png" alt="형광석" className="w-4 h-4 object-contain drop-shadow-sm" />
                        <span className="font-extrabold text-[11px] text-stone-700 dark:text-stone-300 whitespace-nowrap">
                          {currentDailyLocations.fluorescentRock}
                        </span>
                      </div>
                    )}
                    {currentDailyLocations.fluorescentRock && currentDailyLocations.oakTree && (
                      <div className="w-[1px] h-3.5 bg-stone-200/50 dark:bg-stone-700 mx-0.5" />
                    )}
                    {currentDailyLocations.oakTree && (
                      <div className="flex items-center gap-1">
                        <img src="/images/참나무.png" alt="참나무" className="w-4 h-4 object-contain drop-shadow-sm" />
                        <span className="font-extrabold text-[11px] text-stone-700 dark:text-stone-300 whitespace-nowrap">
                          {currentDailyLocations.oakTree}
                        </span>
                      </div>
                    )}
                  </div>
                )}
`;

if (!code.includes('Daily Locations Widget')) {
  code = code.replace(
    '{/* Game Clock & Weather Widget (Unified Row) */}',
    locationWidget + '\n                {/* Game Clock & Weather Widget (Unified Row) */}'
  );
}

fs.writeFileSync('src/App.tsx', code);
