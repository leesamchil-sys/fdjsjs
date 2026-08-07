const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// replace weather_config with daily_info
code = code.replace(/weather_config/g, 'daily_info');

// add state for adminDailyLocations
if (!code.includes('adminDailyLocations')) {
  code = code.replace(
    'const [adminDetailedWeather, setAdminDetailedWeather] = useState<DetailedWeather>({});',
    `const [adminDetailedWeather, setAdminDetailedWeather] = useState<DetailedWeather>({});
  const [adminDailyLocations, setAdminDailyLocations] = useState<DailyLocations>({});`
  );
  
  // in fetch config
  code = code.replace(
    'setAdminDetailedWeather(data.admin_detailed_weather || {});',
    `setAdminDetailedWeather(data.admin_detailed_weather || {});
          setAdminDailyLocations(data.admin_daily_locations || {});`
  );
  
  // in handleUpdateAppConfig parameter
  code = code.replace(
    'admin_detailed_weather?: DetailedWeather;',
    `admin_detailed_weather?: DetailedWeather;
    admin_daily_locations?: DailyLocations;`
  );
  
  // in handleUpdateAppConfig separate properties
  code = code.replace(
    "if (key === 'admin_weekly_weather' || key === 'admin_detailed_weather') {",
    "if (key === 'admin_weekly_weather' || key === 'admin_detailed_weather' || key === 'admin_daily_locations') {"
  );
  
  // in SettingsModal props
  code = code.replace(
    'adminDetailedWeather={adminDetailedWeather}',
    `adminDetailedWeather={adminDetailedWeather}
              adminDailyLocations={adminDailyLocations}`
  );
}

fs.writeFileSync('src/App.tsx', code);
