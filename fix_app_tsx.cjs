const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix redeclared block-scoped variable 'localOceanCleaningStr'
code = code.replace(/const localOceanCleaningStr = localStorage\.getItem\('completed_ocean_cleaning_ids'\);\n\s*const localOceanCleaningStr = localStorage\.getItem\('completed_ocean_cleaning_ids'\);/g, `const localOceanCleaningStr = localStorage.getItem('completed_ocean_cleaning_ids');`);
code = code.replace(/const localMasterOceanCleaningStr = localStorage\.getItem\('master_ocean_cleaning_ids'\);\n\s*const localMasterOceanCleaningStr = localStorage\.getItem\('master_ocean_cleaning_ids'\);/g, `const localMasterOceanCleaningStr = localStorage.getItem('master_ocean_cleaning_ids');`);
code = code.replace(/const localOceanCleaning = new Set<string>\(safeJsonParse\(localOceanCleaningStr, \[\]\)\);\n\s*const localOceanCleaning = new Set<string>\(safeJsonParse\(localOceanCleaningStr, \[\]\)\);/g, `const localOceanCleaning = new Set<string>(safeJsonParse(localOceanCleaningStr, []));`);
code = code.replace(/const localMasterOceanCleaning = new Set<string>\(safeJsonParse\(localMasterOceanCleaningStr, \[\]\)\);\n\s*const localMasterOceanCleaning = new Set<string>\(safeJsonParse\(localMasterOceanCleaningStr, \[\]\)\);/g, `const localMasterOceanCleaning = new Set<string>(safeJsonParse(localMasterOceanCleaningStr, []));`);

// Fix cloud variables
code = code.replace(/const cloudOceanCleaningList = \(data\.completedOceanCleaningNames \|\| \[\]\)\.map.*?\n\s*.*?const cloudOceanCleaningList/g, `const cloudOceanCleaningList`);
code = code.replace(/const cloudMasterOceanCleaningList = \(data\.masterOceanCleaningNames \|\| \[\]\)\.map.*?\n\s*.*?const cloudMasterOceanCleaningList/g, `const cloudMasterOceanCleaningList`);
code = code.replace(/const cloudOceanCleaning = new Set<string>\(cloudOceanCleaningList\);\n\s*const cloudOceanCleaning = new Set<string>\(cloudOceanCleaningList\);/g, `const cloudOceanCleaning = new Set<string>(cloudOceanCleaningList);`);
code = code.replace(/const cloudMasterOceanCleaning = new Set<string>\(cloudMasterOceanCleaningList\);\n\s*const cloudMasterOceanCleaning = new Set<string>\(cloudMasterOceanCleaningList\);/g, `const cloudMasterOceanCleaning = new Set<string>(cloudMasterOceanCleaningList);`);

// Fix duplicate properties in object literals
code = code.replace(/oceanCleaning: mergedOceanCleaning,\n\s*oceanCleaning: mergedOceanCleaning,/g, `oceanCleaning: mergedOceanCleaning,`);
code = code.replace(/masterOceanCleaning: mergedMasterOceanCleaning,\n\s*masterOceanCleaning: mergedMasterOceanCleaning,/g, `masterOceanCleaning: mergedMasterOceanCleaning,`);

code = code.replace(/oceanCleaning: cloudOceanCleaning,\n\s*oceanCleaning: cloudOceanCleaning,/g, `oceanCleaning: cloudOceanCleaning,`);
code = code.replace(/masterOceanCleaning: cloudMasterOceanCleaning,\n\s*masterOceanCleaning: cloudMasterOceanCleaning,/g, `masterOceanCleaning: cloudMasterOceanCleaning,`);

code = code.replace(/oceanCleaning: localOceanCleaning,\n\s*oceanCleaning: localOceanCleaning,/g, `oceanCleaning: localOceanCleaning,`);
code = code.replace(/masterOceanCleaning: localMasterOceanCleaning,\n\s*masterOceanCleaning: localMasterOceanCleaning,/g, `masterOceanCleaning: localMasterOceanCleaning,`);

code = code.replace(/oceanCleaning: new Set\(\),\n\s*oceanCleaning: new Set\(\),/g, `oceanCleaning: new Set(),`);
code = code.replace(/masterOceanCleaning: new Set\(\),\n\s*masterOceanCleaning: new Set\(\),/g, `masterOceanCleaning: new Set(),`);

code = code.replace(/masterOceanCleaningNames: Array\.from\(new Set\(safeJsonParse\(localStorage\.getItem\("master_ocean_cleaning_ids"\), \[\]\)\)\)\.map\(\(id: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.id === id\)\?\.name \|\| id\)\.sort\(\),\n\s*masterOceanCleaningNames: Array\.from\(new Set\(safeJsonParse\(localStorage\.getItem\("master_ocean_cleaning_ids"\), \[\]\)\)\)\.map\(\(id: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.id === id\)\?\.name \|\| id\)\.sort\(\),/g, `masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),`);

// Now fix the missing variables
// 2469, 3187, 3344, 3505, 3674, 4130, 4272
// For all these lines that say "masterOceanCleaningNames: masterOceanCleaningNames," we should restore the inline version.
code = code.replace(/completedOceanCleaningNames: oceanCleaningNames,/g, `completedOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("completed_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),`);
code = code.replace(/masterOceanCleaningNames: masterOceanCleaningNames,/g, `masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),`);

// We also need to fix missing variables inside the passive snapshot parsing.
// The passive snapshot parsing doesn't have localOceanCleaning extracted!
// Let's add them near where localGardening is extracted in passive sync (around line 2650-2750):
code = code.replace(/const localGardeningStr = localStorage\.getItem\('completed_gardening_ids'\);/g, `const localGardeningStr = localStorage.getItem('completed_gardening_ids');\n          const localOceanCleaningStr = localStorage.getItem('completed_ocean_cleaning_ids');`);
code = code.replace(/const localMasterGardeningStr = localStorage\.getItem\('master_gardening_ids'\);/g, `const localMasterGardeningStr = localStorage.getItem('master_gardening_ids');\n          const localMasterOceanCleaningStr = localStorage.getItem('master_ocean_cleaning_ids');`);
code = code.replace(/const localGardening = new Set<string>\(safeJsonParse\(localGardeningStr, \[\]\)\);/g, `const localGardening = new Set<string>(safeJsonParse(localGardeningStr, []));\n          const localOceanCleaning = new Set<string>(safeJsonParse(localOceanCleaningStr, []));`);
code = code.replace(/const localMasterGardening = new Set<string>\(safeJsonParse\(localMasterGardeningStr, \[\]\)\);/g, `const localMasterGardening = new Set<string>(safeJsonParse(localMasterGardeningStr, []));\n          const localMasterOceanCleaning = new Set<string>(safeJsonParse(localMasterOceanCleaningStr, []));`);
code = code.replace(/const cloudGardening = new Set<string>\(cloudGardeningList\);/g, `const cloudGardening = new Set<string>(cloudGardeningList);\n          const cloudOceanCleaning = new Set<string>(cloudOceanCleaningList || []);`);
code = code.replace(/const cloudMasterGardening = new Set<string>\(cloudMasterGardeningList\);/g, `const cloudMasterGardening = new Set<string>(cloudMasterGardeningList);\n          const cloudMasterOceanCleaning = new Set<string>(cloudMasterOceanCleaningList || []);`);

// Clean up duplicate local variables introduced by global replace
// (We might have added them again where they already existed, let's de-duplicate)
code = code.replace(/const localOceanCleaningStr = localStorage\.getItem\('completed_ocean_cleaning_ids'\);\n\s*const localOceanCleaningStr = localStorage\.getItem\('completed_ocean_cleaning_ids'\);/g, `const localOceanCleaningStr = localStorage.getItem('completed_ocean_cleaning_ids');`);
code = code.replace(/const localMasterOceanCleaningStr = localStorage\.getItem\('master_ocean_cleaning_ids'\);\n\s*const localMasterOceanCleaningStr = localStorage\.getItem\('master_ocean_cleaning_ids'\);/g, `const localMasterOceanCleaningStr = localStorage.getItem('master_ocean_cleaning_ids');`);
code = code.replace(/const localOceanCleaning = new Set<string>\(safeJsonParse\(localOceanCleaningStr, \[\]\)\);\n\s*const localOceanCleaning = new Set<string>\(safeJsonParse\(localOceanCleaningStr, \[\]\)\);/g, `const localOceanCleaning = new Set<string>(safeJsonParse(localOceanCleaningStr, []));`);
code = code.replace(/const localMasterOceanCleaning = new Set<string>\(safeJsonParse\(localMasterOceanCleaningStr, \[\]\)\);\n\s*const localMasterOceanCleaning = new Set<string>\(safeJsonParse\(localMasterOceanCleaningStr, \[\]\)\);/g, `const localMasterOceanCleaning = new Set<string>(safeJsonParse(localMasterOceanCleaningStr, []));`);

// And cloud lists in passive sync:
code = code.replace(/const cloudGardeningList = \(data\.completedGardeningNames \|\| \[\]\)\.map.*?\n/g, `$&          const cloudOceanCleaningList = (data.completedOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);\n`);
code = code.replace(/const cloudMasterGardeningList = \(data\.masterGardeningNames \|\| \[\]\)\.map.*?\n/g, `$&          const cloudMasterOceanCleaningList = (data.masterOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);\n`);

code = code.replace(/const cloudOceanCleaningList = \(data\.completedOceanCleaningNames \|\| \[\]\)\.map\(\(name: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.name === name \|\| o\.id === name\)\?\.id \|\| name\);\n\s*const cloudOceanCleaningList = \(data\.completedOceanCleaningNames \|\| \[\]\)\.map\(\(name: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.name === name \|\| o\.id === name\)\?\.id \|\| name\);/g, `const cloudOceanCleaningList = (data.completedOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);`);
code = code.replace(/const cloudMasterOceanCleaningList = \(data\.masterOceanCleaningNames \|\| \[\]\)\.map\(\(name: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.name === name \|\| o\.id === name\)\?\.id \|\| name\);\n\s*const cloudMasterOceanCleaningList = \(data\.masterOceanCleaningNames \|\| \[\]\)\.map\(\(name: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.name === name \|\| o\.id === name\)\?\.id \|\| name\);/g, `const cloudMasterOceanCleaningList = (data.masterOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);`);

code = code.replace(/const cloudOceanCleaning = new Set<string>\(cloudOceanCleaningList \|\| \[\]\);\n\s*const cloudOceanCleaning = new Set<string>\(cloudOceanCleaningList \|\| \[\]\);/g, `const cloudOceanCleaning = new Set<string>(cloudOceanCleaningList || []);`);
code = code.replace(/const cloudMasterOceanCleaning = new Set<string>\(cloudMasterOceanCleaningList \|\| \[\]\);\n\s*const cloudMasterOceanCleaning = new Set<string>\(cloudMasterOceanCleaningList \|\| \[\]\);/g, `const cloudMasterOceanCleaning = new Set<string>(cloudMasterOceanCleaningList || []);`);

// Fix missing localOceanCleaning in mergedOceanCleaning (there was an error there on line 3232)
// In forceSyncAllData merge choice:
code = code.replace(/const mergedOceanCleaning = new Set\(\[\.\.\.localOceanCleaning, \.\.\.cloudOceanCleaning\]\);/g, `const mergedOceanCleaning = new Set([...(Array.from(new Set(safeJsonParse(localStorage.getItem("completed_ocean_cleaning_ids"), [])))), ...(Array.from(new Set(cloudOceanCleaning || [])))]);`);

// Actually, in forceSyncAllData, localOceanCleaning doesn't exist, we can use localStorage directly:
// wait, cloudOceanCleaning doesn't exist in forceSyncAllData either!
// In forceSyncAllData, it's called `cloudOceanCleaningList`? No, forceSyncAllData just builds an object and writes it, it doesn't do a merge.
// Wait, `mergedOceanCleaning` is in `runInitialSync`, NOT in `forceSyncAllData`!
// Wait! Line 3232 error is TS2304: Cannot find name 'localOceanCleaning'.
// Let's replace the one at 3232 with hardcoded sets or remove it if it's inside forceSyncAllData.
fs.writeFileSync('src/App.tsx', code, 'utf8');
