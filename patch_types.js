const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
if (!code.includes('export interface DailyLocations')) {
  code = code.replace(
    'export interface DetailedWeather {',
    `export interface DailyLocations {
  [date: string]: {
    fluorescentRock?: string;
    oakTree?: string;
  };
}

export interface DetailedWeather {`
  );
  fs.writeFileSync('src/types.ts', code);
}
