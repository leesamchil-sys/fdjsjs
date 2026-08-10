const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix hasCloudProgress in handleManualSync
code = code.replace(
  /const hasCloudProgress = cloudBirds\.size > 0 \|\| cloudInsects\.size > 0 \|\| cloudFish\.size > 0 \|\| cloudFood\.size > 0 \|\| cloudGardening\.size > 0 \|\| cloudPets\.length > 0 \|\| Object\.keys\(cloudRatings\)\.length > 0;/,
  "const hasCloudProgress = cloudBirds.size > 0 || cloudInsects.size > 0 || cloudFish.size > 0 || cloudFood.size > 0 || cloudGardening.size > 0 || cloudOceanCleaning.size > 0 || cloudPets.length > 0 || Object.keys(cloudRatings).length > 0;"
);

// Fix isDifferent in handleManualSync
code = code.replace(
  /Array\.from\(localGardening\)\.some\(id => !cloudGardening\.has\(id\)\) \|\|/,
  "Array.from(localGardening).some(id => !cloudGardening.has(id)) ||\n              localOceanCleaning.size !== cloudOceanCleaning.size ||\n              Array.from(localOceanCleaning).some(id => !cloudOceanCleaning.has(id)) ||\n              localMasterOceanCleaning.size !== cloudMasterOceanCleaning.size ||\n              Array.from(localMasterOceanCleaning).some(id => !cloudMasterOceanCleaning.has(id)) ||"
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
