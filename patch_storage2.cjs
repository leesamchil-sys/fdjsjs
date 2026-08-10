const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// In writeLocalDataToFirestore
code = code.replace(
  /completedGardeningNames: gardeningNames,\n\s*completedOceanCleaningNames: Array\.from\(new Set\(safeJsonParse\(localStorage\.getItem\("completed_ocean_cleaning_ids"\), \[\]\)\)\)\.map\(\(id: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.id === id\)\?\.name \|\| id\)\.sort\(\),/g,
  `completedGardeningNames: gardeningNames,\n      completedOceanCleaningNames: oceanCleaningNames,`
);

code = code.replace(
  /masterGardeningNames,/g,
  `masterGardeningNames,\n      masterOceanCleaningNames: masterOceanCleaningNames,`
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
