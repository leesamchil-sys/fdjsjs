const fs = require('fs');
let code = fs.readFileSync('src/data/seasonal.ts', 'utf8');

// Replace any cases like '스타프루트 2' with '스타프루트 x2' in seasonal cooking array
code = code.replace(/ingredients:\s*\[(.*?)\]/g, (match, contents) => {
    const newContents = contents.split(',').map(item => {
        // e.g., '스타프루트 2' -> '스타프루트 x2'
        // remove quotes
        let str = item.trim().replace(/^'/, '').replace(/'$/, '');
        // if ends with space + number, replace with space + x + number
        str = str.replace(/ (\d+)$/, ' x$1');
        return `'${str}'`;
    }).join(', ');
    return `ingredients: [${newContents}]`;
});

fs.writeFileSync('src/data/seasonal.ts', code, 'utf8');
