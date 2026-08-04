const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I know there are missing variables:
// oceanCleaningNames
// masterOceanCleaningNames

// Let's replace the one in the middle of forceSyncAllData:
// We can just find all instances of `completedOceanCleaningNames: oceanCleaningNames` and replace them with inline localStorage reads.
code = code.replace(/completedOceanCleaningNames: oceanCleaningNames,/g, `completedOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("completed_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),`);
code = code.replace(/masterOceanCleaningNames: masterOceanCleaningNames,/g, `masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),`);

// We should only put it inside `writeLocalDataToFirestore` properly!
const funcIndex = code.indexOf('async function writeLocalDataToFirestore');
if (funcIndex !== -1) {
    const nextFuncIndex = code.indexOf('// Subscribe to Firebase Authentication', funcIndex);
    let section = code.substring(funcIndex, nextFuncIndex);
    section = section.replace(
      /completedOceanCleaningNames: Array\.from\(new Set\(safeJsonParse\(localStorage\.getItem\("completed_ocean_cleaning_ids"\), \[\]\)\)\)\.map\(\(id: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.id === id\)\?\.name \|\| id\)\.sort\(\),/g,
      `completedOceanCleaningNames: oceanCleaningNames,`
    );
    section = section.replace(
      /masterOceanCleaningNames: Array\.from\(new Set\(safeJsonParse\(localStorage\.getItem\("master_ocean_cleaning_ids"\), \[\]\)\)\)\.map\(\(id: string\) => ALL_OCEAN_CLEANING_MAP\.find\(o => o\.id === id\)\?\.name \|\| id\)\.sort\(\),/g,
      `masterOceanCleaningNames: masterOceanCleaningNames,`
    );
    code = code.substring(0, funcIndex) + section + code.substring(nextFuncIndex);
}

// Fix missing cloudOceanCleaning variables in manual sync choice 'merge'
// It says: `const mergedOceanCleaning = new Set([...localOceanCleaning, ...cloudOceanCleaning]);`
// But localOceanCleaning and cloudOceanCleaning might not be defined there.
// If we look at line 3234, localOceanCleaning is NOT defined around 3234?
// Let's replace line 3234 (which has localOceanCleaning) with nothing to see if it fixes errors.
// Wait, we WANT it to merge!
// So let's define localOceanCleaning before mergedOceanCleaning.
// Actually, earlier I said I want to add `localOceanCleaning` and `cloudOceanCleaning` everywhere they belong.

fs.writeFileSync('src/App.tsx', code, 'utf8');
