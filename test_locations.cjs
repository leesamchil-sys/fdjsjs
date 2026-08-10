const fs = require('fs');

function extractWithCategories(file) {
  const code = fs.readFileSync(file, 'utf8');
  let items = [];
  
  // A simplistic parser for items in the arrays
  // We can match name, category, and locations
  const regex = /name:\s*['"](.*?)['"][\s\S]*?category:\s*['"](.*?)['"][\s\S]*?locations:\s*\[([\s\S]*?)\]/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const name = match[1];
    const category = match[2];
    const locs = match[3].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
    items.push({ name, category, locations: locs });
  }
  return items;
}

const all = [
  ...extractWithCategories('src/data/birds.ts'),
  ...extractWithCategories('src/data/insects.ts'),
  ...extractWithCategories('src/data/fishing.ts')
];

const locMap = {};
all.forEach(item => {
  item.locations.forEach(loc => {
    if (!locMap[loc]) {
      locMap[loc] = new Set();
    }
    locMap[loc].add(item.category);
  });
});

console.log("LOCATIONS FOUND IN DB WITH CATEGORIES:");
for (const [loc, cats] of Object.entries(locMap).sort()) {
  console.log(`- '${loc}': categories = [${Array.from(cats).join(', ')}]`);
}

