const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// replace weather_config back to daily_info where we changed it earlier
// Specifically in fetchWeatherConfig and handleUpdateAppConfig

// 1. Update fetch logic to check daily_info, fallback to weather_config
const fetchLogic = `
    const fetchWeatherConfig = async () => {
      try {
        const dailyDocRef = doc(db, 'settings', 'daily_info');
        console.log(\`[GET_DOC] daily_info - path: \${dailyDocRef.path}\`);
        const dailyDocSnap = await getDoc(dailyDocRef);
        
        if (dailyDocSnap.exists()) {
          const data = dailyDocSnap.data();
          setAdminWeeklyWeather(data.admin_weekly_weather || {});
          setAdminDetailedWeather(data.admin_detailed_weather || {});
          setAdminDailyLocations(data.admin_daily_locations || {});
        } else {
          // Fallback to weather_config and migrate if admin?
          // Actually, just fallback to read
          console.log("[WeatherConfigCheck] Document 'settings/daily_info' does not exist. Falling back to weather_config");
          const weatherDocRef = doc(db, 'settings', 'weather_config');
          const weatherDocSnap = await getDoc(weatherDocRef);
          if (weatherDocSnap.exists()) {
            const data = weatherDocSnap.data();
            setAdminWeeklyWeather(data.admin_weekly_weather || {});
            setAdminDetailedWeather(data.admin_detailed_weather || {});
            setAdminDailyLocations(data.admin_daily_locations || {});
          }
        }
      } catch (error) {
`;

code = code.replace(
  /const fetchWeatherConfig = async \(\) => \{[\s\S]*?\} catch \(error\) \{/,
  fetchLogic
);


// 2. Update save logic to save to both daily_info and weather_config
const saveLogic = `
      const configRef = doc(db, 'settings', 'app_config');
      const dailyRef = doc(db, 'settings', 'daily_info');
      const weatherRef = doc(db, 'settings', 'weather_config');
      
      const appUpdates: any = {};
      const weatherUpdates: any = {};
      
      // Separate properties
      Object.entries(updates).forEach(([key, val]) => {
        if (key === 'admin_weekly_weather' || key === 'admin_detailed_weather' || key === 'admin_daily_locations') {
          weatherUpdates[key] = val;
        } else {
          appUpdates[key] = val;
        }
      });
`;

code = code.replace(
  /const configRef = doc\(db, 'settings', 'app_config'\);\s*const weatherRef = doc\(db, 'settings', 'weather_config'\);\s*const appUpdates: any = \{\};\s*const weatherUpdates: any = \{\};\s*\/\/ Separate properties\s*Object\.entries\(updates\)\.forEach\(\(\[key, val\]\) => \{\s*if \(key === 'admin_weekly_weather' \|\| key === 'admin_detailed_weather' \|\| key === 'admin_daily_locations'\) \{\s*weatherUpdates\[key\] = val;\s*\} else \{\s*appUpdates\[key\] = val;\s*\}\s*\}\);/,
  saveLogic
);

const saveLogic2 = `
      if (Object.keys(weatherUpdates).length > 0) {
        console.count("[WRITE] setDoc");
        await setDoc(dailyRef, weatherUpdates, { merge: true });
        await setDoc(weatherRef, weatherUpdates, { merge: true }); // Keep old users updated
      }
`;

code = code.replace(
  /if \(Object\.keys\(weatherUpdates\)\.length > 0\) \{[\s\S]*?await setDoc\(weatherRef, weatherUpdates, \{ merge: true \}\);\s*\}/,
  saveLogic2
);

fs.writeFileSync('src/App.tsx', code);
