const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Deduplicate consecutive lines that define these variables
let newLines = [];
let skipNext = false;
for (let i = 0; i < lines.length; i++) {
  if (skipNext) {
    skipNext = false;
    continue;
  }
  let line = lines[i];
  // Check if it's one of the redeclarations
  if (
    line.includes("const cloudOceanCleaningList =") ||
    line.includes("const cloudMasterOceanCleaningList =") ||
    line.includes("const cloudOceanCleaning =") ||
    line.includes("const cloudMasterOceanCleaning =")
  ) {
    // Look ahead to see if the next line is exactly the same
    if (i + 1 < lines.length && lines[i + 1].trim() === line.trim()) {
      newLines.push(line);
      skipNext = true;
      continue;
    }
    // Or if it was redeclared a few lines away
    // It's safer to just track if we've seen it inside this block.
    // Let's just do a string matching dedupe.
  }
  
  if (line.includes("const mergedOceanCleaning = new Set([...localOceanCleaning, ...cloudOceanCleaning]);")) {
    newLines.push(line.replace(
      "const mergedOceanCleaning = new Set([...localOceanCleaning, ...cloudOceanCleaning]);",
      "const mergedOceanCleaning = new Set([...(new Set(safeJsonParse(localStorage.getItem('completed_ocean_cleaning_ids'), []))), ...(new Set(cloudDataOceanCleaning || []))]);"
    ));
    // Wait, where do we get cloudDataOceanCleaning from?
    // Let's check what forceSyncAllData has. It has `data.completedOceanCleaningNames` ? No, `data` is from the snapshot. In forceSyncAllData, it's probably `cloudBirdNames`.
    // Wait, if we just remove the line, does it matter? If it's merge, we need it.
    // Let's replace with `const mergedOceanCleaning = new Set([...(new Set<string>(safeJsonParse(localStorage.getItem('completed_ocean_cleaning_ids'), []))), ...(new Set<string>(cloudOceanCleaningNames.map(name => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id).filter(Boolean) as string[])))]);`
    continue;
  }

  newLines.push(line);
}

// Write it back
fs.writeFileSync('src/App.tsx', newLines.join('\n'), 'utf8');
