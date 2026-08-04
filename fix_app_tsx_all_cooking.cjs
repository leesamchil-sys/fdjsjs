const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add ALL_COOKING_MAP
code = code.replace(
  /const ALL_FISH_MAP = \[\.\.\.FISHING, \.\.\.SEASONAL_EVENTS\.flatMap\(e => e\.fishing \|\| \[\]\)\];/,
  "const ALL_FISH_MAP = [...FISHING, ...SEASONAL_EVENTS.flatMap(e => e.fishing || [])];\nconst ALL_COOKING_MAP = [...COOKING, ...SEASONAL_EVENTS.flatMap(e => e.cooking || [])];"
);

// 2. Replace dbCooking.find with ALL_COOKING_MAP.find EXCEPT where dbCooking is used for rendering!
// Be careful not to replace `dbCooking.filter`
code = code.replace(/dbCooking\.find/g, 'ALL_COOKING_MAP.find');

fs.writeFileSync('src/App.tsx', code, 'utf8');
