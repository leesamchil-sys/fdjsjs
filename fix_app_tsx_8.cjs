const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// For choice === 'cloud' (around 3120)
code = code.replace(
    /setCompletedGardeningIds\(cloudGardening\);\n\s*setMasterBirdIds\(cloudMasterBirds\);/g,
    `setCompletedGardeningIds(cloudGardening);\n                      setCompletedOceanCleaningIds(cloudOceanCleaning);\n                      setMasterBirdIds(cloudMasterBirds);`
);
code = code.replace(
    /setMasterGardeningIds\(cloudMasterGardening\);\n\s*setPets\(cloudPets\);/g,
    `setMasterGardeningIds(cloudMasterGardening);\n                      setMasterOceanCleaningIds(cloudMasterOceanCleaning);\n                      setPets(cloudPets);`
);
code = code.replace(
    /localStorage\.setItem\('completed_gardening_ids', JSON\.stringify\(Array\.from\(cloudGardening\)\)\);\n\s*localStorage\.setItem\('master_bird_ids'/g,
    `localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(cloudGardening)));\n                      localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(cloudOceanCleaning)));\n                      localStorage.setItem('master_bird_ids'`
);
code = code.replace(
    /localStorage\.setItem\('master_gardening_ids', JSON\.stringify\(Array\.from\(cloudMasterGardening\)\)\);\n\s*localStorage\.setItem\('item_ratings'/g,
    `localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(cloudMasterGardening)));\n                      localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(cloudMasterOceanCleaning)));\n                      localStorage.setItem('item_ratings'`
);

// For choice === 'local' (around 3170)
code = code.replace(
    /setCompletedGardeningIds\(localGardening\);\n\s*setMasterBirdIds\(localMasterBirds\);/g,
    `setCompletedGardeningIds(localGardening);\n                      setCompletedOceanCleaningIds(localOceanCleaning);\n                      setMasterBirdIds(localMasterBirds);`
);
code = code.replace(
    /setMasterGardeningIds\(localMasterGardening\);\n\s*setRatings\(localRatings\);/g,
    `setMasterGardeningIds(localMasterGardening);\n                      setMasterOceanCleaningIds(localMasterOceanCleaning);\n                      setRatings(localRatings);`
);
code = code.replace(
    /localStorage\.setItem\('completed_gardening_ids', JSON\.stringify\(Array\.from\(localGardening\)\)\);\n\s*localStorage\.setItem\('master_bird_ids'/g,
    `localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(localGardening)));\n                      localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(localOceanCleaning)));\n                      localStorage.setItem('master_bird_ids'`
);
code = code.replace(
    /localStorage\.setItem\('master_gardening_ids', JSON\.stringify\(Array\.from\(localMasterGardening\)\)\);\n\s*localStorage\.setItem\('item_ratings'/g,
    `localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(localMasterGardening)));\n                      localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(localMasterOceanCleaning)));\n                      localStorage.setItem('item_ratings'`
);

// For choice === 'merge' (around 3250)
code = code.replace(
    /setCompletedGardeningIds\(mergedGardening\);\n\s*setMasterBirdIds/g,
    `setCompletedGardeningIds(mergedGardening);\n                      setCompletedOceanCleaningIds(mergedOceanCleaning);\n                      setMasterBirdIds`
);
code = code.replace(
    /setMasterGardeningIds\(new Set\(\[\.\.\.localMasterGardening, \.\.\.cloudMasterGardening\]\)\);\n\s*setPets/g,
    `setMasterGardeningIds(new Set([...localMasterGardening, ...cloudMasterGardening]));\n                      setMasterOceanCleaningIds(new Set([...localMasterOceanCleaning, ...cloudMasterOceanCleaning]));\n                      setPets`
);
code = code.replace(
    /localStorage\.setItem\('completed_gardening_ids', JSON\.stringify\(Array\.from\(mergedGardening\)\)\);\n\s*localStorage\.setItem\('master_bird_ids'/g,
    `localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(mergedGardening)));\n                      localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(mergedOceanCleaning)));\n                      localStorage.setItem('master_bird_ids'`
);
code = code.replace(
    /localStorage\.setItem\('master_gardening_ids', JSON\.stringify\(Array\.from\(new Set\(\[\.\.\.localMasterGardening, \.\.\.cloudMasterGardening\]\)\)\)\);\n\s*localStorage\.setItem\('item_ratings'/g,
    `localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(new Set([...localMasterGardening, ...cloudMasterGardening]))));\n                      localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(new Set([...localMasterOceanCleaning, ...cloudMasterOceanCleaning]))));\n                      localStorage.setItem('item_ratings'`
);

// Also need to check if localMasterOceanCleaning is defined!
code = code.replace(
    /const localMasterGardening = new Set<string>\(safeJsonParse\(savedMasterGardening, \[\]\)\);/g,
    `const localMasterGardening = new Set<string>(safeJsonParse(savedMasterGardening, []));\n        const savedOceanCleaning = localStorage.getItem('completed_ocean_cleaning_ids');\n        const localOceanCleaning = new Set<string>(safeJsonParse(savedOceanCleaning, []));\n        const savedMasterOceanCleaning = localStorage.getItem('master_ocean_cleaning_ids');\n        const localMasterOceanCleaning = new Set<string>(safeJsonParse(savedMasterOceanCleaning, []));`
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
