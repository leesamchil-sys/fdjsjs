const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const toDelete = [1582, 1575, 1567, 1566];
toDelete.sort((a,b) => b-a).forEach(lineNum => {
    // line numbers are 1-indexed, array is 0-indexed
    lines.splice(lineNum - 1, 1);
});

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
