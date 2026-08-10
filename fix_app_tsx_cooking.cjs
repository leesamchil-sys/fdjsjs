const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const dbCooking = useMemo\(\(\) => COOKING, \[\]\);/,
  `const dbCooking = useMemo(() => {
    const seasonal = SEASONAL_EVENTS
      .filter(e => activeSeasonIds.includes(e.id))
      .flatMap(e => e.cooking || []);
    return [...COOKING, ...seasonal];
  }, [activeSeasonIds]);`
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
