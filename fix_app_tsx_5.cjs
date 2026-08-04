const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove the duplicated cloudBirds injected at 2634
// It looks like:
// const cloudBirds = new Set<string>(cloudBirdsList);
// const cloudFish = new Set<string>(cloudFishList);
// const cloudInsects = new Set<string>(cloudInsectsList);
// const cloudBirds = new Set<string>(cloudBirdsList);
// const cloudFish = new Set<string>(cloudFishList);
// const cloudInsects = new Set<string>(cloudInsectsList);
// Let's just fix it by replacing the block of 4 new variables back to 1 if there's duplicate.
// Wait, a better way is to just do `git checkout src/App.tsx`... oh wait I don't have git!
// Let's manually restore the state before restore_cloud_vars.cjs using a regex.

code = code.replace(/const cloudBirds = new Set<string>\(cloudBirdsList\);\n\s*const cloudFish = new Set<string>\(cloudFishList\);\n\s*const cloudInsects = new Set<string>\(cloudInsectsList\);\n\s*const cloudFood = new Set<string>\(cloudCookingList\);/g, 'const cloudFood = new Set<string>(cloudCookingList);');

code = code.replace(/const cloudMasterFish = new Set<string>\(cloudMasterFishList\);\n\s*const cloudMasterFood = new Set<string>\(cloudMasterCookingList\);/g, 'const cloudMasterFood = new Set<string>(cloudMasterCookingList);');

code = code.replace(/const cloudDetailedWeather = data\.detailedWeather \|\| \{\};\n\s*const cloudPetsRaw = data\.pets \|\| \[\];/g, 'const cloudPetsRaw = data.pets || [];');
code = code.replace(/const cloudDetailedWeather = data\.detailedWeather \|\| \{\};\n\s*cloudPetsRaw = data\.pets \|\| \[\];/g, 'cloudPetsRaw = data.pets || [];');

// Now we are back to the state where cloudBirds etc. are missing at 1566.
// Let's precisely insert them at 1566:
// We look for:
/*
        const cloudMasterOceanCleaningList = (data.masterOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);
        const cloudFood = new Set<string>(cloudCookingList);
*/
// And insert between them.
const injection1 = `
        const cloudBirds = new Set<string>(cloudBirdsList);
        const cloudInsects = new Set<string>(cloudInsectsList);
        const cloudFish = new Set<string>(cloudFishList);
`;

code = code.replace(
    /const cloudMasterOceanCleaningList = \(data\.masterOceanCleaningNames \|\| \[\]\)\.map\(\(name: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.name === name \|\| o\.id === name\)\?\.id \|\| name\);\n\s*const cloudFood = new Set<string>\(cloudCookingList\);/,
    `const cloudMasterOceanCleaningList = (data.masterOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);` + injection1 + `\n        const cloudFood = new Set<string>(cloudCookingList);`
);

// We look for:
/*
        const cloudMasterGardening = new Set<string>(cloudMasterGardeningList);
        const cloudRatings = data.ratings || {};
*/
// And insert cloudMasterOceanCleaning and cloudDetailedWeather
const injection2 = `
        const cloudMasterOceanCleaning = new Set<string>(cloudMasterOceanCleaningList || []);
`;
const injection3 = `
        const cloudDetailedWeather = data.detailedWeather || {};
`;

code = code.replace(
    /const cloudMasterGardening = new Set<string>\(cloudMasterGardeningList\);\n\s*const cloudRatings = data\.ratings \|\| \{\};/,
    `const cloudMasterGardening = new Set<string>(cloudMasterGardeningList);` + injection2 + `\n        const cloudRatings = data.ratings || {};`
);

code = code.replace(
    /const cloudWeeklyWeather = cleanWeeklyWeather\(data\.weeklyWeather\);\n\s*cloudPetsRaw = data\.pets \|\| \[\];/,
    `const cloudWeeklyWeather = cleanWeeklyWeather(data.weeklyWeather);` + injection3 + `\n\        cloudPetsRaw = data.pets || [];`
);

// At 3225, `cloudDataOceanCleaning` doesn't exist, we want to replace it with `cloudOceanCleaningNames` logic.
// Ah, wait! On line 3230:
// const mergedOceanCleaning = new Set([...(new Set(safeJsonParse(localStorage.getItem('completed_ocean_cleaning_ids'), []))), ...(new Set(cloudDataOceanCleaning || []))]);
// We need to replace `cloudDataOceanCleaning` with `cloudOceanCleaning` and `localOceanCleaning`. 
// But wait! This is in `forceSyncAllData`, and in `forceSyncAllData` (around line 3230), `cloudOceanCleaning` is NOT defined because it's called `cloudOceanCleaningList`!
// Let's check `forceSyncAllData` variables!
// Actually, earlier in `forceSyncAllData` we have `cloudBirds` defined as:
// const cloudBirds = new Set<string>(cloudBirdNames.map(...)
// So `cloudOceanCleaning` should be defined as:
// const cloudOceanCleaning = new Set<string>(cloudOceanCleaningNames.map(name => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id).filter(Boolean) as string[]);
code = code.replace(
    /const mergedOceanCleaning = new Set\(\[\.\.\.\(new Set\(safeJsonParse\(localStorage\.getItem\('completed_ocean_cleaning_ids'\), \[\]\)\)\), \.\.\.\(new Set\(cloudDataOceanCleaning \|\| \[\]\)\)\]\);/g,
    `const cloudOceanCleaning = new Set<string>(cloudOceanCleaningNames.map(name => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id).filter(Boolean) as string[]);
                  const localOceanCleaning = new Set<string>(safeJsonParse(localStorage.getItem('completed_ocean_cleaning_ids'), []));
                  const mergedOceanCleaning = new Set([...localOceanCleaning, ...cloudOceanCleaning]);`
);


fs.writeFileSync('src/App.tsx', code, 'utf8');
