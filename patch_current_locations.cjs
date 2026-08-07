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
  code = code.replace(
    'const currentGameWeather: GameWeather = useMemo(() => {',
    locationLogic + '\n  const currentGameWeather: GameWeather = useMemo(() => {'
  );
  fs.writeFileSync('src/App.tsx', code);
}
