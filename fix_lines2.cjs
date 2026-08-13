const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix redeclared cloud variables
code = code.replace(/const cloudOceanCleaningList = \(data\.completedOceanCleaningNames \|\| \[\]\)\.map.*?\n\s*.*?const cloudOceanCleaningList/g, `const cloudOceanCleaningList`);
code = code.replace(/const cloudMasterOceanCleaningList = \(data\.masterOceanCleaningNames \|\| \[\]\)\.map.*?\n\s*.*?const cloudMasterOceanCleaningList/g, `const cloudMasterOceanCleaningList`);
code = code.replace(/const cloudOceanCleaning = new Set<string>\(cloudOceanCleaningList \|\| \[\]\);\n\s*const cloudOceanCleaning = new Set<string>\(cloudOceanCleaningList \|\| \[\]\);/g, `const cloudOceanCleaning = new Set<string>(cloudOceanCleaningList || []);`);
code = code.replace(/const cloudMasterOceanCleaning = new Set<string>\(cloudMasterOceanCleaningList \|\| \[\]\);\n\s*const cloudMasterOceanCleaning = new Set<string>\(cloudMasterOceanCleaningList \|\| \[\]\);/g, `const cloudMasterOceanCleaning = new Set<string>(cloudMasterOceanCleaningList || []);`);

// Fix missing cloudOceanCleaning in forceSyncAllData at line 3234
// It's probably `mergedOceanCleaning = new Set([...(Array.from(new Set(safeJsonParse(localStorage.getItem("completed_ocean_cleaning_ids"), [])))), ...(Array.from(new Set(cloudOceanCleaning || [])))]);`
// We will replace `cloudOceanCleaning` with `cloudDataOceanCleaning` or just the `data` array parsing if available, or just delete it if it's a mistake.
// Let's replace the line completely because it's a mess:
code = code.replace(/const mergedOceanCleaning = new Set\(\[\.\.\.\(Array\.from\(new Set\(safeJsonParse\(localStorage\.getItem\("completed_ocean_cleaning_ids"\), \[\]\)\)\)\), \.\.\.\(Array\.from\(new Set\(cloudOceanCleaning \|\| \[\]\)\)\)\]\);/g, 
  `const mergedOceanCleaning = new Set([...localOceanCleaning, ...cloudOceanCleaning]);`
); // Ah wait, if localOceanCleaning isn't defined, this will fail. Let's define them!

fs.writeFileSync('src/App.tsx', code, 'utf8');
