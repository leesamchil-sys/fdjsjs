const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// A helper to delete a line containing a string
const deleteLinesWith = (str) => {
    let before = lines.length;
    lines = lines.filter(l => !l.includes(str));
    console.log(`Deleted ${before - lines.length} lines containing: ${str}`);
};

// 1. Redeclared block-scoped variables around 1514, 1521, 1535, 1542
// I will just use a set to deduplicate consecutive identical lines (which my previous replace caused).
let newLines = [];
for(let i = 0; i < lines.length; i++) {
    if (i > 0 && lines[i].trim() === lines[i-1].trim() && lines[i].trim().length > 10) {
        // Skip duplicate line
        continue;
    }
    newLines.push(lines[i]);
}
lines = newLines;

// 2. Multiple properties with the same name around 1746, 1752, 3182, 4125, 4267
// Let's filter out the `oceanCleaning: mergedOceanCleaning` and `oceanCleaning: cloudOceanCleaning`
// if they appear consecutively or we can just run a dedupe within the object.
// A simpler way: Find `oceanCleaning:` and `masterOceanCleaning:` and remove duplicates in a block.
newLines = [];
let seenInBlock = new Set();
for(let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('{') || line.includes('}')) {
        seenInBlock.clear();
    }
    let match = line.match(/^\s*(oceanCleaning|masterOceanCleaning|completedOceanCleaningNames|masterOceanCleaningNames)\s*:/);
    if (match) {
        if (seenInBlock.has(match[1])) {
            continue; // skip duplicate property
        }
        seenInBlock.add(match[1]);
    }
    newLines.push(line);
}
lines = newLines;

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
