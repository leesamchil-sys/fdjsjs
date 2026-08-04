const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

// add imports
if (!code.includes('DailyLocations')) {
  code = code.replace(
    'DetailedWeather, ThemeMode',
    'DetailedWeather, DailyLocations, ThemeMode'
  );
}

// add daily_locations tab
code = code.replace(
  "'weather' | 'data_export'>('system')",
  "'weather' | 'daily_locations' | 'data_export'>('system')"
);

// add to props interface
code = code.replace(
  'admin_detailed_weather?: DetailedWeather;',
  `admin_detailed_weather?: DetailedWeather;
    admin_daily_locations?: DailyLocations;`
);

code = code.replace(
  'adminDetailedWeather?: DetailedWeather;',
  `adminDetailedWeather?: DetailedWeather;
  adminDailyLocations?: DailyLocations;`
);

// add to props
code = code.replace(
  'adminDetailedWeather = {}',
  `adminDetailedWeather = {},
  adminDailyLocations = {}`
);

// add local state
if (!code.includes('localAdminDailyLocations')) {
  code = code.replace(
    'const [localAdminDetailed, setLocalAdminDetailed] = useState<DetailedWeather>(adminDetailedWeather);',
    `const [localAdminDetailed, setLocalAdminDetailed] = useState<DetailedWeather>(adminDetailedWeather);
  const [localAdminDailyLocations, setLocalAdminDailyLocations] = useState<DailyLocations>(adminDailyLocations);`
  );
}

// add to useEffect deps
code = code.replace(
  'adminDetailedWeather, currentTime]);',
  'adminDetailedWeather, adminDailyLocations, currentTime]);'
);

// add to useEffect body
code = code.replace(
  'setLocalAdminDetailed(adminDetailedWeather || {});',
  `setLocalAdminDetailed(adminDetailedWeather || {});
      setLocalAdminDailyLocations(adminDailyLocations || {});`
);

// add to save logic
code = code.replace(
  'admin_detailed_weather: localAdminDetailed',
  `admin_detailed_weather: localAdminDetailed,
        admin_daily_locations: localAdminDailyLocations`
);

// add to isDirty logic
code = code.replace(
  'JSON.stringify(localAdminDetailed) === JSON.stringify(adminDetailedWeather)',
  `JSON.stringify(localAdminDetailed) === JSON.stringify(adminDetailedWeather) &&
                    JSON.stringify(localAdminDailyLocations) === JSON.stringify(adminDailyLocations)`
);

// add tab UI
code = code.replace(
  "{ id: 'weather', label: '운영 날씨 설정', icon: CloudSun },",
  `{ id: 'weather', label: '운영 날씨 설정', icon: CloudSun },
                          { id: 'daily_locations', label: '일일 정보 설정', icon: MapPin },`
);

fs.writeFileSync('src/components/SettingsModal.tsx', code);
