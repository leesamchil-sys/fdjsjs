const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I will just redefine the missing ones right before `cloudFood` or `cloudPetsRaw`
code = code.replace(/const cloudFood = new Set<string>\(cloudCookingList\);/g, `const cloudBirds = new Set<string>(cloudBirdsList);\n        const cloudFish = new Set<string>(cloudFishList);\n        const cloudInsects = new Set<string>(cloudInsectsList);\n        const cloudFood = new Set<string>(cloudCookingList);`);

code = code.replace(/const cloudMasterFood = new Set<string>\(cloudMasterCookingList\);/g, `const cloudMasterFish = new Set<string>(cloudMasterFishList);\n        const cloudMasterFood = new Set<string>(cloudMasterCookingList);`);

code = code.replace(/const cloudPetsRaw = data\.pets \|\| \[\];/g, `const cloudDetailedWeather = data.detailedWeather || {};\n        const cloudPetsRaw = data.pets || [];`);

// Fix cloudDetailedWeather if it's missing entirely (it was used in hasCloudProgress)
if (!code.includes("const cloudDetailedWeather = data.detailedWeather || {};")) {
    code = code.replace(/cloudPetsRaw = data\.pets \|\| \[\];/g, `const cloudDetailedWeather = data.detailedWeather || {};\n        cloudPetsRaw = data.pets || [];`);
}

// Fix cloudDataOceanCleaning missing
code = code.replace(/cloudDataOceanCleaning/g, `cloudOceanCleaning`);

// Fix masterOceanCleaningNames missing in writeLocalDataToFirestore (around 2455)
// Let's replace the inline masterOceanCleaningNames with the inline definition
code = code.replace(/masterOceanCleaningNames: masterOceanCleaningNames,/g, `masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),`);

fs.writeFileSync('src/App.tsx', code, 'utf8');
