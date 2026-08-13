const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Insert cloudMasterFish around 1570
if (!code.includes("const cloudMasterFish = new Set<string>(cloudMasterFishList);")) {
    code = code.replace(
        /const cloudMasterInsects = new Set<string>\(cloudMasterInsectsList\);\n\s*const cloudMasterFood = new Set<string>\(cloudMasterCookingList\);/g, 
        `const cloudMasterInsects = new Set<string>(cloudMasterInsectsList);\n        const cloudMasterFish = new Set<string>(cloudMasterFishList);\n        const cloudMasterFood = new Set<string>(cloudMasterCookingList);`
    );
}

// 2. Insert cloudOceanCleaningNames and cloudMasterOceanCleaningNames around 3010
code = code.replace(
    /const cloudGardeningNames = \(data\.completedGardeningNames \|\| \[\]\) as string\[\];\n\s*const cloudMasterBirdNames = \(data\.masterBirdNames \|\| \[\]\) as string\[\];/g,
    `const cloudGardeningNames = (data.completedGardeningNames || []) as string[];\n          const cloudOceanCleaningNames = (data.completedOceanCleaningNames || []) as string[];\n          const cloudMasterBirdNames = (data.masterBirdNames || []) as string[];`
);

code = code.replace(
    /const cloudMasterGardeningNames = \(data\.masterGardeningNames \|\| \[\]\) as string\[\];\n\s*const cloudRatings = \(data\.ratings \|\| \{\}\) as Record<string, number>;/g,
    `const cloudMasterGardeningNames = (data.masterGardeningNames || []) as string[];\n          const cloudMasterOceanCleaningNames = (data.masterOceanCleaningNames || []) as string[];\n          const cloudRatings = (data.ratings || {}) as Record<string, number>;`
);

// 3. Define cloudMasterOceanCleaning around 3050 (near cloudMasterGardening)
if (!code.includes("const cloudMasterOceanCleaning = new Set<string>(cloudMasterOceanCleaningNames.map(name => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id).filter(Boolean) as string[]);")) {
    code = code.replace(
        /const cloudMasterGardening = new Set<string>\(cloudMasterGardeningNames\.map\(name => ALL_GARDENING_MAP\.find\(g => g\.name === name \|\| g\.id === name\)\?\.id\)\.filter\(Boolean\) as string\[\]\);/g,
        `const cloudMasterGardening = new Set<string>(cloudMasterGardeningNames.map(name => ALL_GARDENING_MAP.find(g => g.name === name || g.id === name)?.id).filter(Boolean) as string[]);\n          const cloudMasterOceanCleaning = new Set<string>(cloudMasterOceanCleaningNames.map(name => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id).filter(Boolean) as string[]);`
    );
}

// Also check for any TS errors with missing 'cloudOceanCleaning' around 3225:
// Actually, earlier I had an error at 3230 for 'cloudOceanCleaning', which I fixed but then it complained about `cloudOceanCleaningNames` not existing. So this should fix it.

fs.writeFileSync('src/App.tsx', code, 'utf8');
