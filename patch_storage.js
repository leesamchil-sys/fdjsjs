const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// In writeLocalDataToFirestore
code = code.replace(
  /completedOceanCleaningNames: Array\.from\(new Set\(safeJsonParse\(localStorage\.getItem\("completed_ocean_cleaning_ids"\), \[\]\)\)\)\.map\(\(id: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.id === id\)\?\.name \|\| id\)\.sort\(\),/g,
  `completedOceanCleaningNames: oceanCleaningNames,`
);
code = code.replace(
  /masterOceanCleaningNames: Array\.from\(new Set\(safeJsonParse\(localStorage\.getItem\("master_ocean_cleaning_ids"\), \[\]\)\)\)\.map\(\(id: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.id === id\)\?\.name \|\| id\)\.sort\(\),/g,
  `masterOceanCleaningNames: masterOceanCleaningNames,`
);

// Oh wait, are they all inside writeLocalDataToFirestore? No, others are in forceSyncAllData probably.
// Let's check where they are using oceanCleaningNames variable. 
// If they are in other functions, do they have oceanCleaningNames variable defined?
