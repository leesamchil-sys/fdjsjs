import { useState, useEffect, useMemo, useRef } from 'react';
import { doc, onSnapshot, getDoc, updateDoc, setDoc, deleteField, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WeeklyWeather, DetailedWeather, DailyLocations } from '../types';
import versionData from '../version.json';

const APP_VERSION = versionData.version;
const MIN_SUPPORTED_VERSION = '1.0.20';

const isVersionOlder = (v1: string, v2: string) => {
  const cleanV1 = v1.replace(/^v/, '');
  const cleanV2 = v2.replace(/^v/, '');
  const parts1 = cleanV1.split('.').map(Number);
  const parts2 = cleanV2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = isNaN(parts1[i]) ? 0 : parts1[i];
    const p2 = isNaN(parts2[i]) ? 0 : parts2[i];
    if (p1 < p2) return true;
    if (p1 > p2) return false;
  }
  return false;
};

export function useAppSystemStatus(user: any) {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [minSupportedVersion, setMinSupportedVersion] = useState(MIN_SUPPORTED_VERSION);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isMaintenanceCompleted, setIsMaintenanceCompleted] = useState(false);
  const [manualMaintenancePreview, setManualMaintenancePreview] = useState(false);
  const [manualCompletedPreview, setManualCompletedPreview] = useState(false);
  const wasShowingMaintenanceRef = useRef(false);
  const [maintenanceStart, setMaintenanceStart] = useState<string>('');
  const [maintenanceEnd, setMaintenanceEnd] = useState<string>('');
  const [allowedUids, setAllowedUids] = useState<string[]>([]);
  const [bypassCode, setBypassCode] = useState<string>('');
  const [sessionBypass, setSessionBypass] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const stored = sessionStorage.getItem('pigtown_maintenance_bypass');
    if (stored) return stored;
    const params = new URLSearchParams(window.location.search);
    return params.get('bypass') || '';
  });
  const [marqueeNotice, setMarqueeNotice] = useState<string>('');
  const [marqueeRepeat, setMarqueeRepeat] = useState<number>(0);
  const [marqueeHistory, setMarqueeHistory] = useState<string[]>([]);
  const [marqueeCustom, setMarqueeCustom] = useState<string[]>([]);
  const [isBannerExpired, setIsBannerExpired] = useState<boolean>(false);
  const [isForceUpdateActive, setIsForceUpdateActive] = useState(false);
  const [forceUpdateMessage, setForceUpdateMessage] = useState('');
  const [menuStatus, setMenuStatus] = useState<Record<string, { active: boolean; message?: string }>>({});

  const [adminWeeklyWeather, setAdminWeeklyWeather] = useState<WeeklyWeather>({});
  const [adminDetailedWeather, setAdminDetailedWeather] = useState<DetailedWeather>({});
  const [adminDailyLocations, setAdminDailyLocations] = useState<DailyLocations>({});

  const [isPermissionDeniedError, setIsPermissionDeniedError] = useState(false);
  const [isQuotaExceededError, setIsQuotaExceededError] = useState(false);
  const [isManualQuotaExceeded, setIsManualQuotaExceeded] = useState(false);
  const [quotaCountdown, setQuotaCountdown] = useState("");

  // Visitation stats check
  useEffect(() => {
    const checkDateAndIncrement = async () => {
      const dateStr = new Date().toISOString().split('T')[0];
      const lastVisited = localStorage.getItem('lastVisitedDate');
      
      if (lastVisited !== dateStr) {
        try {
          const statsRef = doc(db, 'visitation_stats', dateStr);
          await setDoc(statsRef, { 
            count: increment(1), 
            date: dateStr 
          }, { merge: true });
          localStorage.setItem('lastVisitedDate', dateStr);
        } catch {
          // fail silently
        }
      }
    };
    
    checkDateAndIncrement();
    const interval = setInterval(checkDateAndIncrement, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, []);

  // Listen to remote app_config
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500);

    const configDoc = doc(db, 'settings', 'app_config');
    const unsubscribe = onSnapshot(configDoc, (docSnap) => {
      clearTimeout(timer);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.min_version) setMinSupportedVersion(data.min_version);
        const maintenanceValue = data.is_maintenance;
        setIsMaintenanceMode(maintenanceValue === true || maintenanceValue === "true");
        setMaintenanceStart(data.maintenance_start || '');
        setMaintenanceEnd(data.maintenance_end || '');
        setAllowedUids(Array.isArray(data.allowed_uids) ? data.allowed_uids : []);
        setBypassCode(data.bypass_code || '');
        setMarqueeNotice(data.marquee_notice || '');
        setMarqueeRepeat(Number(data.marquee_repeat) || 0);
        setMarqueeHistory(Array.isArray(data.marquee_history) ? data.marquee_history : []);
        setMarqueeCustom(Array.isArray(data.marquee_custom) ? data.marquee_custom : []);
        setIsForceUpdateActive(data.is_force_update_active === true || data.is_force_update_active === "true");
        setForceUpdateMessage(data.force_update_message || '');
        setMenuStatus(data.menu_status || {});
        setIsManualQuotaExceeded(data.is_manual_quota_exceeded === true || data.is_manual_quota_exceeded === "true");
        setIsInitialLoading(false);
      } else {
        setIsInitialLoading(false);
      }
    }, (error) => {
      console.error("[VersionCheck] Error fetching remote config:", error);
      setIsInitialLoading(false);
      const errStr = String(error).toLowerCase();
      if (error?.code === 'resource-exhausted' || errStr.includes('quota exceeded')) {
        setIsQuotaExceededError(true);
        unsubscribe();
      } else if (error?.code === 'permission-denied' || errStr.includes('permission')) {
        setIsPermissionDeniedError(true);
        unsubscribe();
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch remote weather config
  useEffect(() => {
    const fetchWeatherConfig = async () => {
      try {
        const dailyDocRef = doc(db, 'settings', 'daily_info');
        const dailyDocSnap = await getDoc(dailyDocRef);
        
        if (dailyDocSnap.exists()) {
          const data = dailyDocSnap.data();
          setAdminWeeklyWeather(data.admin_weekly_weather || {});
          setAdminDetailedWeather(data.admin_detailed_weather || {});
          setAdminDailyLocations(data.admin_daily_locations || {});
        } else {
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
        console.error("[WeatherConfigCheck] Error fetching remote weather config:", error);
      }
    };
    fetchWeatherConfig();
  }, []);

  // Manual quota countdown check (auto off at 16:10)
  useEffect(() => {
    if (isManualQuotaExceeded) {
      const checkTimeAndTurnOff = () => {
        const now = new Date();
        if (now.getHours() === 16 && now.getMinutes() >= 10) {
          setIsManualQuotaExceeded(false);
          if (user && allowedUids.includes(user.uid)) {
            const configRef = doc(db, 'settings', 'app_config');
            updateDoc(configRef, { is_manual_quota_exceeded: false }).catch(console.error);
          }
        }
      };
      
      checkTimeAndTurnOff();
      const interval = setInterval(checkTimeAndTurnOff, 1000);
      return () => clearInterval(interval);
    }
  }, [isManualQuotaExceeded, user, allowedUids]);

  // Countdown timer for quota error
  useEffect(() => {
    if (isQuotaExceededError || isManualQuotaExceeded) {
      const updateCountdown = () => {
        const now = new Date();
        const target = new Date();
        target.setHours(16, 10, 0, 0);

        if (now.getHours() >= 17) {
          target.setDate(target.getDate() + 1);
        }

        const diff = target.getTime() - now.getTime();
        if (diff <= 0) {
          setQuotaCountdown("00:00:00");
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setQuotaCountdown(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [isQuotaExceededError, isManualQuotaExceeded]);

  useEffect(() => {
    setIsBannerExpired(false);
  }, [marqueeNotice, marqueeRepeat]);

  // Bypass code URL check
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlBypass = params.get('bypass');
    if (urlBypass) {
      sessionStorage.setItem('pigtown_maintenance_bypass', urlBypass);
      setSessionBypass(urlBypass);
      params.delete('bypass');
      const cleanSearch = params.toString();
      const newUrl = window.location.pathname + (cleanSearch ? '?' + cleanSearch : '') + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const isBypassActive = useMemo(() => {
    return !!(bypassCode && sessionBypass === bypassCode);
  }, [bypassCode, sessionBypass]);

  const displayMenuStatus = useMemo(() => {
    if (isBypassActive) {
      const overridden: Record<string, { active: boolean; message?: string }> = {};
      Object.keys(menuStatus).forEach(key => {
        overridden[key] = { ...menuStatus[key], active: true };
      });
      ['home', 'coupons', 'birds', 'insects', 'fishing', 'cooking', 'gardening', 'crops', 'petfood', 'seasonal_banner'].forEach(key => {
        overridden[key] = { active: true };
      });
      return overridden;
    }
    return menuStatus;
  }, [menuStatus, isBypassActive]);

  const isForceUpdateRequired = useMemo(() => {
    const isOlder = isVersionOlder(APP_VERSION, minSupportedVersion);
    return isForceUpdateActive && isOlder;
  }, [minSupportedVersion, isForceUpdateActive]);

  const isShowMaintenance = useMemo(() => {
    if (manualMaintenancePreview) return true;
    if (manualCompletedPreview) return false;
    if (isMaintenanceCompleted) return false;
    if (!isMaintenanceMode) return false;
    if (user && allowedUids.includes(user.uid)) return false;
    if (bypassCode && sessionBypass === bypassCode) return false;
    return true;
  }, [isMaintenanceMode, user, allowedUids, bypassCode, sessionBypass, isMaintenanceCompleted, manualMaintenancePreview, manualCompletedPreview]);

  useEffect(() => {
    if (manualMaintenancePreview || manualCompletedPreview) return;

    if (isShowMaintenance) {
      wasShowingMaintenanceRef.current = true;
    } else if (wasShowingMaintenanceRef.current && !isMaintenanceMode) {
      setIsMaintenanceCompleted(true);
      wasShowingMaintenanceRef.current = false;
    }
  }, [isShowMaintenance, isMaintenanceMode, manualMaintenancePreview, manualCompletedPreview]);

  const handleUpdateAppConfig = async (updates: { 
    min_version?: string; 
    is_maintenance?: boolean; 
    allowed_uids?: string[];
    bypass_code?: string;
    maintenance_start?: string;
    maintenance_end?: string;
    marquee_notice?: string;
    marquee_repeat?: number;
    marquee_history?: string[];
    marquee_custom?: string[];
    is_force_update_active?: boolean;
    force_update_message?: string;
    is_manual_quota_exceeded?: boolean;
    menu_status?: Record<string, { active: boolean; message?: string }>;
    admin_weekly_weather?: WeeklyWeather;
    admin_detailed_weather?: DetailedWeather;
    admin_daily_locations?: DailyLocations;
  }) => {
    try {
      const configRef = doc(db, 'settings', 'app_config');
      const dailyRef = doc(db, 'settings', 'daily_info');
      
      const appUpdates: any = {};
      const weatherUpdates: any = {};
      
      Object.entries(updates).forEach(([key, val]) => {
        if (key === 'admin_weekly_weather' || key === 'admin_detailed_weather' || key === 'admin_daily_locations') {
          weatherUpdates[key] = val;
        } else {
          appUpdates[key] = val;
        }
      });

      if (appUpdates.is_maintenance === false) {
        appUpdates.maintenance_start = deleteField();
        appUpdates.maintenance_end = deleteField();
      }
      
      if (Object.keys(appUpdates).length > 0) {
        await updateDoc(configRef, appUpdates);
      }
      
      if (Object.keys(weatherUpdates).length > 0) {
        await setDoc(dailyRef, weatherUpdates, { mergeFields: Object.keys(weatherUpdates) });
      }

      if (updates.admin_weekly_weather !== undefined) setAdminWeeklyWeather(updates.admin_weekly_weather);
      if (updates.admin_detailed_weather !== undefined) setAdminDetailedWeather(updates.admin_detailed_weather);
      if (updates.admin_daily_locations !== undefined) setAdminDailyLocations(updates.admin_daily_locations);
    } catch (error) {
      console.error("[Admin] Error updating config:", error);
      throw error;
    }
  };

  return {
    isInitialLoading,
    minSupportedVersion,
    isMaintenanceMode,
    isMaintenanceCompleted,
    setIsMaintenanceCompleted,
    manualMaintenancePreview,
    setManualMaintenancePreview,
    manualCompletedPreview,
    setManualCompletedPreview,
    maintenanceStart,
    maintenanceEnd,
    allowedUids,
    bypassCode,
    sessionBypass,
    marqueeNotice,
    marqueeRepeat,
    marqueeHistory,
    marqueeCustom,
    isBannerExpired,
    setIsBannerExpired,
    isForceUpdateActive,
    forceUpdateMessage,
    menuStatus: displayMenuStatus,
    rawMenuStatus: menuStatus,
    adminWeeklyWeather,
    adminDetailedWeather,
    adminDailyLocations,
    isPermissionDeniedError,
    setIsPermissionDeniedError,
    isQuotaExceededError,
    setIsQuotaExceededError,
    isManualQuotaExceeded,
    setIsManualQuotaExceeded,
    quotaCountdown,
    isForceUpdateRequired,
    isShowMaintenance,
    handleUpdateAppConfig
  };
}
