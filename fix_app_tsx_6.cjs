const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Missing cloudMasterFish
// I accidentally replaced `const cloudMasterFish = new Set<string>(cloudMasterFishList);` with nothing?
// Let's insert it before cloudMasterFood if missing.
if (!code.includes("const cloudMasterFish = new Set<string>(cloudMasterFishList);")) {
    code = code.replace(/const cloudMasterFood = new Set<string>\(cloudMasterCookingList\);/g, `const cloudMasterFish = new Set<string>(cloudMasterFishList);\n        const cloudMasterFood = new Set<string>(cloudMasterCookingList);`);
}

// 2. Missing cloudDetailedWeather in passive_user_doc (around 2715)
// It was `const cloudDetailedWeather = data.detailedWeather || {};`
// Where did it go?
if (code.match(/const cloudWeeklyWeather = cleanWeeklyWeather\(data\.weeklyWeather\);/g).length > 1) {
    // If it's used multiple times, let's just make sure cloudDetailedWeather exists wherever cloudWeeklyWeather exists.
    code = code.replace(/const cloudWeeklyWeather = cleanWeeklyWeather\(data\.weeklyWeather\);\n\s*cloudPetsRaw = data\.pets/g, `const cloudWeeklyWeather = cleanWeeklyWeather(data.weeklyWeather);\n        const cloudDetailedWeather = data.detailedWeather || {};\n        cloudPetsRaw = data.pets`);
    // What if it's `const cloudPetsRaw = data.pets`?
    code = code.replace(/const cloudWeeklyWeather = cleanWeeklyWeather\(data\.weeklyWeather\);\n\s*const cloudPetsRaw = data\.pets/g, `const cloudWeeklyWeather = cleanWeeklyWeather(data.weeklyWeather);\n          const cloudDetailedWeather = data.detailedWeather || {};\n          const cloudPetsRaw = data.pets`);
}

// 3. Missing cloudOceanCleaning at 3225
// On line 3225, it probably uses `cloudOceanCleaning` which wasn't defined.
// In `forceSyncAllData`, there is:
// const cloudBirds = new Set<string>(cloudBirdNames.map(...)
code = code.replace(/const cloudGardening = new Set<string>\(cloudGardeningNames\.map.*?\n/g, 
  `$&          const cloudOceanCleaning = new Set<string>(cloudOceanCleaningNames.map(name => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id).filter(Boolean) as string[]);\n`
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
