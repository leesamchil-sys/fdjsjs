const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. applyFetchedDataToLocal definition
code = code.replace(
  /setCompletedGardeningIds\(fields.gardening\);/,
  `setCompletedGardeningIds(fields.gardening);\n    setCompletedOceanCleaningIds(fields.oceanCleaning || new Set());`
);
code = code.replace(
  /setMasterGardeningIds\(fields.masterGardening\);/,
  `setMasterGardeningIds(fields.masterGardening);\n    setMasterOceanCleaningIds(fields.masterOceanCleaning || new Set());`
);
code = code.replace(
  /localStorage\.setItem\('completed_gardening_ids', JSON\.stringify\(Array\.from\(fields\.gardening\)\)\);/,
  `localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(fields.gardening)));\n    localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(fields.oceanCleaning || [])));`
);
code = code.replace(
  /localStorage\.setItem\('master_gardening_ids', JSON\.stringify\(Array\.from\(fields\.masterGardening\)\)\);/,
  `localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(fields.masterGardening)));\n    localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(fields.masterOceanCleaning || [])));`
);

// 2. seedLastSyncedDataRef
code = code.replace(
  /completedGardeningNames: data\.completedGardeningNames \|\| \[\],/,
  `completedGardeningNames: data.completedGardeningNames || [],\n      completedOceanCleaningNames: data.completedOceanCleaningNames || [],`
);
code = code.replace(
  /masterGardeningNames: data\.masterGardeningNames \|\| \[\],/,
  `masterGardeningNames: data.masterGardeningNames || [],\n      masterOceanCleaningNames: data.masterOceanCleaningNames || [],`
);

// 3. passive_user_doc parsing
code = code.replace(
  /const cloudMasterGardeningList = \(data\.masterGardeningNames \|\| \[\]\)\.map\(\(name: string\) => ALL_GARDENING_MAP\.find\(g => g\.name === name \|\| g\.id === name\)\?\.id \|\| name\);/,
  `const cloudMasterGardeningList = (data.masterGardeningNames || []).map((name: string) => ALL_GARDENING_MAP.find(g => g.name === name || g.id === name)?.id || name);\n          const cloudOceanCleaningList = (data.completedOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);\n          const cloudMasterOceanCleaningList = (data.masterOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);`
);

code = code.replace(
  /const cloudGardening = new Set<string>\(cloudGardeningList\);/,
  `const cloudGardening = new Set<string>(cloudGardeningList);\n          const cloudOceanCleaning = new Set<string>(cloudOceanCleaningList);`
);
code = code.replace(
  /const cloudMasterGardening = new Set<string>\(cloudMasterGardeningList\);/,
  `const cloudMasterGardening = new Set<string>(cloudMasterGardeningList);\n          const cloudMasterOceanCleaning = new Set<string>(cloudMasterOceanCleaningList);`
);

// 4. passive_user_doc local extraction
code = code.replace(
  /const localGardeningStr = localStorage\.getItem\('completed_gardening_ids'\);/,
  `const localGardeningStr = localStorage.getItem('completed_gardening_ids');\n          const localOceanCleaningStr = localStorage.getItem('completed_ocean_cleaning_ids');`
);
code = code.replace(
  /const localMasterGardeningStr = localStorage\.getItem\('master_gardening_ids'\);/,
  `const localMasterGardeningStr = localStorage.getItem('master_gardening_ids');\n          const localMasterOceanCleaningStr = localStorage.getItem('master_ocean_cleaning_ids');`
);

code = code.replace(
  /const localGardening = new Set<string>\(safeJsonParse\(localGardeningStr, \[\]\)\);/,
  `const localGardening = new Set<string>(safeJsonParse(localGardeningStr, []));\n          const localOceanCleaning = new Set<string>(safeJsonParse(localOceanCleaningStr, []));`
);
code = code.replace(
  /const localMasterGardening = new Set<string>\(safeJsonParse\(localMasterGardeningStr, \[\]\)\);/,
  `const localMasterGardening = new Set<string>(safeJsonParse(localMasterGardeningStr, []));\n          const localMasterOceanCleaning = new Set<string>(safeJsonParse(localMasterOceanCleaningStr, []));`
);

// 5. passive_user_doc isSetDiff
code = code.replace(
  /if \(isSetDiff\(cloudGardening, localGardening\)\) dataActuallyChanged = true;/,
  `if (isSetDiff(cloudGardening, localGardening)) dataActuallyChanged = true;\n          if (isSetDiff(cloudOceanCleaning, localOceanCleaning)) dataActuallyChanged = true;`
);
code = code.replace(
  /if \(isSetDiff\(cloudMasterGardening, localMasterGardening\)\) dataActuallyChanged = true;/,
  `if (isSetDiff(cloudMasterGardening, localMasterGardening)) dataActuallyChanged = true;\n          if (isSetDiff(cloudMasterOceanCleaning, localMasterOceanCleaning)) dataActuallyChanged = true;`
);

// 6. passive_user_doc set state & storage
code = code.replace(
  /setCompletedGardeningIds\(cloudGardening\);/,
  `setCompletedGardeningIds(cloudGardening);\n            setCompletedOceanCleaningIds(cloudOceanCleaning);`
);
code = code.replace(
  /setMasterGardeningIds\(cloudMasterGardening\);/,
  `setMasterGardeningIds(cloudMasterGardening);\n            setMasterOceanCleaningIds(cloudMasterOceanCleaning);`
);
code = code.replace(
  /localStorage\.setItem\('completed_gardening_ids', JSON\.stringify\(Array\.from\(cloudGardening\)\)\);/,
  `localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(cloudGardening)));\n            localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(cloudOceanCleaning)));`
);
code = code.replace(
  /localStorage\.setItem\('master_gardening_ids', JSON\.stringify\(Array\.from\(cloudMasterGardening\)\)\);/,
  `localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(cloudMasterGardening)));\n            localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(cloudMasterOceanCleaning)));`
);

// 7. runInitialSync 'merge' resolution (twice, once for silent, once for choice)
code = code.replaceAll(
  /const mergedGardening = new Set\(\[\.\.\.localGardening, \.\.\.cloudGardening\]\);/g,
  `const mergedGardening = new Set([...localGardening, ...cloudGardening]);\n                  const mergedOceanCleaning = new Set([...localOceanCleaning, ...cloudOceanCleaning]);`
);
code = code.replaceAll(
  /const mergedMasterGardening = new Set\(\[\.\.\.localMasterGardening, \.\.\.cloudMasterGardening\]\);/g,
  `const mergedMasterGardening = new Set([...localMasterGardening, ...cloudMasterGardening]);\n                  const mergedMasterOceanCleaning = new Set([...localMasterOceanCleaning, ...cloudMasterOceanCleaning]);`
);
// replace mergedData instantiation
code = code.replaceAll(
  /gardening: mergedGardening,/g,
  `gardening: mergedGardening,\n                  oceanCleaning: mergedOceanCleaning,`
);
code = code.replaceAll(
  /masterGardening: mergedMasterGardening,/g,
  `masterGardening: mergedMasterGardening,\n                  masterOceanCleaning: mergedMasterOceanCleaning,`
);

// 8. applyFetchedDataToLocal / writeLocalDataToFirestore instantiations missing oceanCleaning
code = code.replaceAll(
  /gardening: cloudGardening,/g,
  `gardening: cloudGardening,\n                    oceanCleaning: cloudOceanCleaning,`
);
code = code.replaceAll(
  /masterGardening: cloudMasterGardening,/g,
  `masterGardening: cloudMasterGardening,\n                    masterOceanCleaning: cloudMasterOceanCleaning,`
);

code = code.replaceAll(
  /gardening: localGardening,/g,
  `gardening: localGardening,\n                    oceanCleaning: localOceanCleaning,`
);
code = code.replaceAll(
  /masterGardening: localMasterGardening,/g,
  `masterGardening: localMasterGardening,\n                    masterOceanCleaning: localMasterOceanCleaning,`
);

// 9. default empty instantiations
code = code.replaceAll(
  /gardening: new Set\(\),/g,
  `gardening: new Set(),\n            oceanCleaning: new Set(),`
);
code = code.replaceAll(
  /masterGardening: new Set\(\),/g,
  `masterGardening: new Set(),\n            masterOceanCleaning: new Set(),`
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
