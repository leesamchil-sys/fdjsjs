/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, useCallback, SyntheticEvent, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logVersion } from './lib/versionLogger';
import versionData from './version.json';
const APP_VERSION = versionData.version;
const MIN_SUPPORTED_VERSION = '1.0.20'; // 기본 최소 지원 버전 (v1.0.20시작/6.13)

// 버전 비교 함수 (v1 < v2 이면 true 리턴)
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

function reconstructSlotsFromFarmingSlotsMap(farmingSlots: any): any[] {
  const result = Array.from({ length: 8 }, (_, i) => ({
    id: `slot_${i + 1}`,
    cropId: null,
    cropName: null,
    cropEmoji: null,
    originalStartTime: null,
    originalDuration: null,
    userOffset: 0,
    isNotified: false,
    isFiveStarMode: false,
    instanceId: null,
    updatedAt: 0
  }));

  if (!farmingSlots || typeof farmingSlots !== 'object') {
    return result;
  }

  const slotsById: Record<string, any> = {};
  Object.values(farmingSlots).forEach((slot: any) => {
    if (!slot || !slot.id) return;
    const existing = slotsById[slot.id];
    if (!existing || (slot.updatedAt || 0) > (existing.updatedAt || 0)) {
      slotsById[slot.id] = slot;
    }
  });

  Object.values(slotsById).forEach((slot: any) => {
    const idx = parseInt(slot.id.replace('slot_', '')) - 1;
    if (idx >= 0 && idx < 8) {
      result[idx] = {
        ...result[idx],
        ...slot,
        originalStartTime: slot.originalStartTime || slot.startTime || null,
        originalDuration: slot.originalDuration || slot.duration || null,
      };
    }
  });

  return result;
}

import { 
  Bird as BirdIcon,
  Search,
  MapPin, 
  Clock, 
  Cloud, 
  Sun, 
  CloudRain, 
  Sparkle, 
  Rainbow as RainbowIcon,
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Settings,
  Filter,
  RefreshCcw,
  Star,
  Info,
  Stars,
  CheckCircle2,
  CheckSquare,
  BookOpen,
  X,
  AlertCircle,
  MessageSquare,
  Database,
  Bug,
  Fish as FishIcon,
  Waves,
  Sprout,
  LogOut,
  LogIn,
  Menu,
  Check,
  Trash2,
  Pencil,
  AlertTriangle,
  Medal,
  Soup,
  Heart,
  Home,
  Pin,
  PanelLeftClose,
  PanelLeftOpen,
  Flower,
  Megaphone,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, getDay, getHours, startOfHour, isAfter, isBefore, parse, addHours } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SEASONAL_EVENTS } from './data/seasonal';
import { SeasonalSelector } from './components/SeasonalSelector';
import { Bird, Insect, Fish, Cooking, Category, GameWeather, WeeklyWeather, DetailedWeather, ThemeMode, Pet, SortOrder, PlantedSlot } from './types';
import CropTimer from './components/CropTimer';
import PetFoodFinder from './components/PetFoodFinder';
import GardeningGuide from './components/GardeningGuide';
import { GARDENING_ITEMS } from './data/gardening';
import HomeDashboard from './components/HomeDashboard';
import EncyclopediaSection from './components/EncyclopediaSection';
import { AnnouncementPopup } from './components/AnnouncementPopup';
import { UpdateFeaturesPopup } from './components/UpdateFeaturesPopup';
import GuideModal from './components/GuideModal';
import WelcomeModal from './components/WelcomeModal';
import { ModalManager } from './components/ModalManager';
import SettingsModal from './components/SettingsModal';
import Footer from './components/Footer';
import { useAppTheme } from './hooks/useAppTheme';
import { useBackDismiss } from './hooks/useBackDismiss';
// ... other imports
import { LoadingScreen } from './components/LoadingScreen';
import { ItemCard, WeatherIcon, translateWeather, getWeatherButtonClass } from './components/ItemCard';
import { ContactModal } from './components/ContactModal';
import { SupportModal } from './components/SupportModal';
import EncyclopediaFilterDropdown from './components/EncyclopediaFilterDropdown';  // Added this
import SortDropdown from './components/SortDropdown';
import { MobileSidebar } from './components/MobileSidebar';
import { ProfileDropdown } from './components/ProfileDropdown';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { CategoryView } from './components/CategoryView';
import { FloatingReportButton } from './components/FloatingReportButton';
import { DesktopSidebar } from './components/DesktopSidebar';
import { useActiveCouponsCount } from './hooks/useActiveCouponsCount';
import { cn, safeJsonParse } from './lib/utils';
import { auth, db, googleProvider } from './lib/firebase';
import { BIRDS } from './data/birds';
import { INSECTS } from './data/insects';
import { FISHING } from './data/fishing';
import { COOKING } from './data/cooking';
import { CROP_PRESETS as CROPS } from './data/crops';
import { onAuthStateChanged, signInWithPopup, signOut, deleteUser, reauthenticateWithPopup } from 'firebase/auth';
import { doc, updateDoc, setDoc, deleteDoc, deleteField, serverTimestamp, writeBatch, collection, getDocs, getDoc, onSnapshot, increment, runTransaction } from 'firebase/firestore';
import { 
  getExistingImagePath,
  getCycleHour,
  getDetailedKey,
  addDays,
  differenceInDays,
  getGameDayString,
  getKoreanDayName,
  formatWeatherValue,
  formatTimeValue
} from './lib/appHelpers';


const cleanWeeklyWeather = (weekly: any): WeeklyWeather => {
  if (!weekly || typeof weekly !== 'object') return {};
  const cleaned: WeeklyWeather = {};
  Object.keys(weekly).forEach(key => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      cleaned[key] = weekly[key] as GameWeather;
    }
  });
  return cleaned;
};

const MAX_DISPLAY_LEVEL = 14;

const ALL_BIRDS_MAP = [...BIRDS, ...SEASONAL_EVENTS.flatMap(e => e.birds || [])];
const ALL_INSECTS_MAP = [...INSECTS, ...SEASONAL_EVENTS.flatMap(e => e.insects || [])];
const ALL_FISH_MAP = [...FISHING, ...SEASONAL_EVENTS.flatMap(e => e.fishing || [])];
const ALL_COOKING_MAP = [...COOKING, ...SEASONAL_EVENTS.flatMap(e => e.cooking || [])];
const ALL_GARDENING_MAP = [
  ...GARDENING_ITEMS,
  ...SEASONAL_EVENTS.flatMap(e => e.gardening || []),
  ...SEASONAL_EVENTS.flatMap(e => (e.crops || []).map(crop => {
    const seconds = crop.defaultTime;
    let durationStr = '';
    if (seconds < 3600) {
      durationStr = `${Math.round(seconds / 60)}분`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.round((seconds % 3600) / 60);
      durationStr = mins === 0 ? `${hours}시간` : `${hours}시간 ${mins}분`;
    }
    return {
      id: crop.id,
      seasonId: crop.seasonId,
      name: crop.name,
      emoji: crop.emoji,
      category: 'crop' as const,
      level: 1,
      duration: durationStr,
      price: crop.price
    };
  }))
];

const ALL_OCEAN_CLEANING_MAP = SEASONAL_EVENTS.flatMap(e => e.oceanCleaning || []);

export default function App() {
  const isInvalidEnvironment = false;

  useEffect(() => {
    // Domain check removed to prevent accidental white screens
  }, [isInvalidEnvironment]);

  const [activeSeasonIds, setActiveSeasonIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('active_season_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });



  // Helper to map pet food IDs to Names for Firebase
  const getPetFoodName = (id: string) => {
    const custom = [
      { id: 'raw-apple', name: '사과' },
      { id: 'raw-neutari', name: '느타리 버섯' },
      { id: 'raw-yangsongi', name: '양송이 버섯' },
      { id: 'raw-pyogo', name: '표고 버섯' },
      { id: 'custom-dog-food', name: '강아지 전용 사료' },
      { id: 'custom-cat-food', name: '고양이 전용 사료' },
      { id: 'custom-common-food', name: '동물 공용 음식' }
    ];
    const foundCustom = custom.find(c => c.id === id);
    if (foundCustom) return foundCustom.name;
    const foundCook = ALL_COOKING_MAP.find(c => c.id === id);
    if (foundCook) return foundCook.name;
    const foundFish = dbFish.find(f => f.id === id);
    if (foundFish) return foundFish.name;
    return id;
  };

  const getPetFoodId = (name: string) => {
    const custom = [
      { id: 'raw-apple', name: '사과' },
      { id: 'raw-neutari', name: '느타리 버섯' },
      { id: 'raw-yangsongi', name: '양송이 버섯' },
      { id: 'raw-pyogo', name: '표고 버섯' },
      { id: 'custom-dog-food', name: '강아지 전용 사료' },
      { id: 'custom-cat-food', name: '고양이 전용 사료' },
      { id: 'custom-common-food', name: '동물 공용 음식' }
    ];
    const foundCustom = custom.find(c => c.name === name);
    if (foundCustom) return foundCustom.id;
    const foundCook = ALL_COOKING_MAP.find(c => c.name === name);
    if (foundCook) return foundCook.id;
    const foundFish = dbFish.find(f => f.name === name);
    if (foundFish) return foundFish.id;
    return name;
  };

  const mapLocalPetsToCloud = (localPetsList: any[]) => {
    return (localPetsList || []).map((p: any) => {
      const cloudPrefs: any = {};
      Object.entries(p.preferences || {}).forEach(([foodId, pref]) => {
        cloudPrefs[getPetFoodName(foodId)] = pref;
      });
      const cloudTried: any = {};
      Object.entries(p.tried || {}).forEach(([foodId, triedVal]) => {
        cloudTried[getPetFoodName(foodId)] = triedVal;
      });
      return { ...p, preferences: cloudPrefs, tried: cloudTried };
    }).sort((a: any, b: any) => (a.id || '').localeCompare(b.id || ''));
  };

  const mapCloudPetsToLocal = (cloudPetsList: any[]) => {
    return (cloudPetsList || []).map((p: any) => {
      const localPrefs: any = {};
      Object.entries(p.preferences || {}).forEach(([prefName, val]) => {
        localPrefs[getPetFoodId(prefName)] = val;
      });
      const localTried: any = {};
      Object.entries(p.tried || {}).forEach(([prefName, val]) => {
        localTried[getPetFoodId(prefName)] = val;
      });
      return { ...p, preferences: localPrefs, tried: localTried };
    });
  };

  useEffect(() => {
    // Disable Ctrl+S / Cmd+S shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // 1. Initialize from localStorage cache for recently updated temporary items if any
    // Firestore listeners are disabled to save on read costs.
    // Data is now primarily loaded from /src/data/*.ts
    return () => {};
  }, []);

  const { themeMode, setThemeMode, isDarkMode, fontSizeLevel, setFontSizeLevel } = useAppTheme();
  
  const [defaultTab, setDefaultTab] = useState<Category | 'last_used'>(() => {
    return (localStorage.getItem('pig_town_default_tab') as Category | 'last_used') || 'last_used';
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [importPendingData, setImportPendingData] = useState<any>(null);
  const [restoreSuccessMessage, setRestoreSuccessMessage] = useState<string | null>(null);
  const [restoreErrorMessage, setRestoreErrorMessage] = useState<string | null>(null);



  useEffect(() => {
    localStorage.setItem('pig_town_default_tab', defaultTab);
  }, [defaultTab]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>(() => {
    const path = location.pathname.split('/')[1] as Category;
    const validCategories: Category[] = ['home', 'birds', 'insects', 'fishing', 'cooking', 'crops', 'petfood', 'gardening', 'privacy', 'terms', 'coupons'];
    if (path && validCategories.includes(path)) return path;

    const savedDefault = localStorage.getItem('pig_town_default_tab') as Category | 'last_used';
    const effectiveDefault = savedDefault || 'last_used';

    if (effectiveDefault === 'last_used') {
      const savedActive = localStorage.getItem('active_category') as Category;
      if (savedActive && validCategories.includes(savedActive)) return savedActive;
      return 'home';
    } else {
      if (validCategories.includes(effectiveDefault as Category)) {
        return effectiveDefault as Category;
      }
      return 'home';
    }
  });
  const [gardeningSubTab, setGardeningSubTab] = useState<'flower' | 'crop'>('flower');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  const handleSetCategory = (cat: Category, sub?: string) => {
    setActiveCategory(cat);
    if (cat === 'gardening' && sub) {
      setGardeningSubTab(sub as 'flower' | 'crop');
    }
  };

  useEffect(() => {
    // Sync URL with state
    if (location.pathname !== `/${activeCategory}`) {
      navigate(`/${activeCategory}`);
    }
    localStorage.setItem('active_category', activeCategory);
    if (resetFilters) resetFilters(); // Assuming resetFilters is a function accessible here
    window.scrollTo(0, 0);
  }, [activeCategory]);

  useEffect(() => {
    // Sync state with URL
    const path = location.pathname.split('/')[1] as Category;
    const validCategories: Category[] = ['home', 'birds', 'insects', 'fishing', 'cooking', 'crops', 'petfood', 'gardening', 'privacy', 'terms', 'coupons'];
    if (path && validCategories.includes(path) && path !== activeCategory) {
      setActiveCategory(path);
    }
  }, [location.pathname]);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const activeCouponsCount = useActiveCouponsCount();
  const [loginWarningType, setLoginWarningType] = useState<'iframe' | 'webview' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pig_town_sidebar_expanded');
      return saved ? saved === 'true' : true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem('pig_town_sidebar_expanded', String(isDesktopSidebarExpanded));
  }, [isDesktopSidebarExpanded]);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isProfileDropdownOpen) return;

    const handleGlobalClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleGlobalClick);
      document.addEventListener('touchstart', handleGlobalClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [isProfileDropdownOpen]);

  useEffect(() => {
    const checkDateAndIncrement = async () => {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const lastVisited = localStorage.getItem('lastVisitedDate');
      
      if (lastVisited !== dateStr) {
         try {
           const statsRef = doc(db, 'visitation_stats', dateStr);
           console.count("[WRITE] setDoc");
           console.log({
             function: "checkDateAndIncrement",
             reason: "visitRegistration",
             path: statsRef.path,
             time: new Date().toISOString()
           });
           await setDoc(statsRef, { 
             count: increment(1), 
             date: dateStr 
           }, { merge: true });
           localStorage.setItem('lastVisitedDate', dateStr);
         } catch (error: any) {

         }
      }
    };
    
    checkDateAndIncrement();
    const interval = setInterval(checkDateAndIncrement, 1000 * 60 * 5); // 5분마다 체크
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(true);
  const [updateDismissed, setUpdateDismissed] = useState(true);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [minSupportedVersion, setMinSupportedVersion] = useState(MIN_SUPPORTED_VERSION);
  const [adminWeeklyWeather, setAdminWeeklyWeather] = useState<WeeklyWeather>({});
  const [adminDetailedWeather, setAdminDetailedWeather] = useState<DetailedWeather>({});
  
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(() => {
    return localStorage.getItem('has_unsynced_changes') === 'true';
  });

  useEffect(() => {
    const handleSyncStatus = () => {
      setHasUnsyncedChanges(localStorage.getItem('has_unsynced_changes') === 'true');
    };
    window.addEventListener('storage', handleSyncStatus);
    window.addEventListener('sync-status-changed', handleSyncStatus);
    return () => {
      window.removeEventListener('storage', handleSyncStatus);
      window.removeEventListener('sync-status-changed', handleSyncStatus);
    };
  }, []);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
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

  const showSeasonalBanner = useMemo(() => {
    const isWhitelisted = user && allowedUids.includes(user.uid);
    if (isWhitelisted) return true;
    return displayMenuStatus.seasonal_banner?.active !== false;
  }, [displayMenuStatus, user, allowedUids]);

  const effectiveSeasonIds = useMemo(() => {
    return showSeasonalBanner ? activeSeasonIds : [];
  }, [activeSeasonIds, showSeasonalBanner]);

  const [isSeasonalModalOpen, setIsSeasonalModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('active_season_ids', JSON.stringify(activeSeasonIds));
  }, [activeSeasonIds]);

  const toggleSeason = useCallback((id: string) => {
    setActiveSeasonIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const dbBirds = useMemo(() => {
    const seasonal = SEASONAL_EVENTS
      .filter(e => effectiveSeasonIds.includes(e.id))
      .flatMap(e => e.birds || []);
    return [...BIRDS, ...seasonal];
  }, [effectiveSeasonIds]);

  const dbInsects = useMemo(() => {
    const seasonal = SEASONAL_EVENTS
      .filter(e => effectiveSeasonIds.includes(e.id))
      .flatMap(e => e.insects || []);
    return [...INSECTS, ...seasonal];
  }, [effectiveSeasonIds]);

  const dbFish = useMemo(() => {
    const seasonal = SEASONAL_EVENTS
      .filter(e => effectiveSeasonIds.includes(e.id))
      .flatMap(e => e.fishing || []);
    return [...FISHING, ...seasonal];
  }, [effectiveSeasonIds]);

  const dbCooking = useMemo(() => {
    const seasonal = SEASONAL_EVENTS
      .filter(e => effectiveSeasonIds.includes(e.id))
      .flatMap(e => e.cooking || []);
    return [...COOKING, ...seasonal];
  }, [effectiveSeasonIds]);
  
  const dbCrops = useMemo(() => {
    const seasonal = SEASONAL_EVENTS
      .filter(e => effectiveSeasonIds.includes(e.id))
      .flatMap(e => e.crops || []);
    return [...CROPS, ...seasonal];
  }, [effectiveSeasonIds]);

  const dbGardening = useMemo(() => {
    const seasonal = SEASONAL_EVENTS
      .filter(e => effectiveSeasonIds.includes(e.id))
      .flatMap(e => e.gardening || []);
    return [...GARDENING_ITEMS, ...seasonal];
  }, [effectiveSeasonIds]);
  const [windowWidth, setWindowWidth] = useState<number>(() => typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isPermissionDeniedError, setIsPermissionDeniedError] = useState(false);
  const [isQuotaExceededError, setIsQuotaExceededError] = useState(false);
  const [isManualQuotaExceeded, setIsManualQuotaExceeded] = useState(false);
  const [quotaCountdown, setQuotaCountdown] = useState("");
  const [isSyncingBeforeReload, setIsSyncingBeforeReload] = useState(false);

  // 유저 로그인 시 버전 정보 업데이트 (버전이 다를 때만)
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        let shouldUpdate = true;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.lastAppVersion === APP_VERSION) {
            shouldUpdate = false;
          }
        }
        
        if (shouldUpdate) {
          console.count("[WRITE] setDoc");
          console.log({
            function: "userVersionSyncOnLogin",
            reason: "appVersionUpgradeOrInitialization",
            path: userDocRef.path,
            time: new Date().toISOString()
          });
          setDoc(userDocRef, {
            lastAppVersion: APP_VERSION,
            updatedAt: serverTimestamp()
          }, { merge: true }).catch(err => {
            console.warn("[AuthSync] Initial version sync failed:", err);
          });
        }
      }).catch(err => {
        console.warn("[AuthSync] Version check failed:", err);
      });
    }
  }, [user]);

  // 파이어베이스에서 최소 지원 버전 및 운영 정보 실시간 감시
  useEffect(() => {
    const configDoc = doc(db, 'settings', 'app_config');
    const unsubscribe = onSnapshot(configDoc, (docSnap) => {
      console.log(`[SNAPSHOT] app_config - path: ${configDoc.path}, exists: ${docSnap.exists()}`);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (import.meta.env.DEV) {
          console.log("[VersionCheck] Remote config fetched:", data); // 개발 모드에서만 로그 출력
        }
        if (data.min_version) {
          setMinSupportedVersion(data.min_version);
        }
        // Handle both boolean and string "true" for resilience, and default to false
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
        if (import.meta.env.DEV) {
          console.log("[VersionCheck] Document 'settings/app_config' does not exist.");
        }
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

  // 파이어베이스에서 운영날씨 설정 실시간 감시 (분리 보관)
  useEffect(() => {
    const weatherDoc = doc(db, 'settings', 'weather_config');
    const unsubscribe = onSnapshot(weatherDoc, (docSnap) => {
      console.log(`[SNAPSHOT] weather_config - path: ${weatherDoc.path}, exists: ${docSnap.exists()}`);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAdminWeeklyWeather(data.admin_weekly_weather || {});
        setAdminDetailedWeather(data.admin_detailed_weather || {});
      } else {
        if (import.meta.env.DEV) {
          console.log("[WeatherConfigCheck] Document 'settings/weather_config' does not exist.");
        }
      }
    }, (error) => {
      console.error("[WeatherConfigCheck] Error fetching remote weather config:", error);
    });
    return () => unsubscribe();
  }, []);

  // 수동 할당량 초과 안내 16시 10분 자동 해제
  useEffect(() => {
    if (isManualQuotaExceeded) {
      const checkTimeAndTurnOff = () => {
        const now = new Date();
        // 16시 10분 ~ 16시 59분 사이에만 자동 해제 (이후 시간에 관리자가 내일 자 용도로 다시 켤 수 있도록)
        if (now.getHours() === 16 && now.getMinutes() >= 10) {
          setIsManualQuotaExceeded(false);
          // 관리자인 경우 Firebase 상태도 업데이트하여 영구적으로 끄기
          if (user && allowedUids.includes(user.uid)) {
            const configRef = doc(db, 'settings', 'app_config');
            updateDoc(configRef, { is_manual_quota_exceeded: false }).catch(console.error);
          }
        }
      };
      
      checkTimeAndTurnOff();
      const interval = setInterval(checkTimeAndTurnOff, 1000); // 1초마다 체크하여 정각에 즉시 사라지게 함
      return () => clearInterval(interval);
    }
  }, [isManualQuotaExceeded, user, allowedUids]);

  // 할당량 초과 안내 시 16시 10분까지 카운트다운
  useEffect(() => {
    if (isQuotaExceededError || isManualQuotaExceeded) {
      const updateCountdown = () => {
        const now = new Date();
        const target = new Date();
        target.setHours(16, 10, 0, 0);

        // 17시 이후에 접속하면 내일 16시 10분을 타겟으로 설정
        // 16시 10분 ~ 16시 59분 사이에는 00:00:00으로 유지되어 자동 해제되도록 함
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

  // 공지 내용이 바뀌거나 반복 횟수가 바뀔 때 만료 상태 초기화
  useEffect(() => {
    setIsBannerExpired(false);
  }, [marqueeNotice, marqueeRepeat]);

  // URL 쿼리 파라미터에서 점검 우회 코드(?bypass=xxx) 감지 후 저장 및 URL 정리
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlBypass = params.get('bypass');
    if (urlBypass) {
      sessionStorage.setItem('pigtown_maintenance_bypass', urlBypass);
      setSessionBypass(urlBypass);
      
      // 사용자 브라우저 주소창에서 무관한 bypass 파라미터만 스마트하게 자르기
      params.delete('bypass');
      const cleanSearch = params.toString();
      const newUrl = window.location.pathname + (cleanSearch ? '?' + cleanSearch : '') + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const isForceUpdateRequired = useMemo(() => {
    const isOlder = isVersionOlder(APP_VERSION, minSupportedVersion);
    if (import.meta.env.DEV) {
      console.log(`[VersionCheck] Current: ${APP_VERSION}, MinRequired: ${minSupportedVersion}, IsOlder: ${isOlder}`);
    }
    return isOlder;
  }, [minSupportedVersion, APP_VERSION]);

  // 점검 모드이지만 허용된 사용자인지 확인 (UID 일치 또는 비로그인용 bypass_code 코드 일치)
  const isShowMaintenance = useMemo(() => {
    // 0. 수동 프리뷰 모드 (가장 우선순위 높음)
    if (manualMaintenancePreview) return true;
    if (manualCompletedPreview) return false;

    // 이미 완료 팝업이 활성화된 경우 점검 화면 차단 해제
    if (isMaintenanceCompleted) return false;

    if (!isMaintenanceMode) return false;
    
    // 1. 관리자/개발자 UID가 목록에 있는 유저
    if (user && allowedUids.includes(user.uid)) return false;
    
    // 2. 비로그인/로그인 관계없이 세션 스토리지 우회 키 코드가 원격지 bypass_code와 일치하는 경우
    if (bypassCode && sessionBypass === bypassCode) return false;
    
    return true;
  }, [isMaintenanceMode, user, allowedUids, bypassCode, sessionBypass, isMaintenanceCompleted, manualMaintenancePreview]);

  // 이전 isShowMaintenance 정보 기억 및 OFF 감지
  useEffect(() => {
    // 수동 미리보기 중에는 자동 점검 종료 감지 로직을 수행하지 않음
    if (manualMaintenancePreview || manualCompletedPreview) return;

    if (isShowMaintenance) {
      wasShowingMaintenanceRef.current = true;
    } else if (wasShowingMaintenanceRef.current && !isMaintenanceMode) {
      // 이전에 차단(점검 화면) 상태였는데, 현재 DB 상 점검 모드 자체가 완전히 OFF된 경우 완료 감지!
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
  }) => {
    try {
      const configRef = doc(db, 'settings', 'app_config');
      const weatherRef = doc(db, 'settings', 'weather_config');
      
      const appUpdates: any = {};
      const weatherUpdates: any = {};
      
      // Separate properties
      Object.entries(updates).forEach(([key, val]) => {
        if (key === 'admin_weekly_weather' || key === 'admin_detailed_weather') {
          weatherUpdates[key] = val;
        } else {
          appUpdates[key] = val;
        }
      });
      
      if (appUpdates.is_maintenance === false) {
        appUpdates.maintenance_start = deleteField();
        appUpdates.maintenance_end = deleteField();
      }
      
      // Write to Firestore
      if (Object.keys(appUpdates).length > 0) {
        console.count("[WRITE] updateDoc");
        console.log({
          function: "updateConfig",
          reason: "adminAppConfigUpdate",
          path: configRef.path,
          time: new Date().toISOString()
        });
        await updateDoc(configRef, appUpdates);
      }
      if (Object.keys(weatherUpdates).length > 0) {
        console.count("[WRITE] setDoc");
        console.log({
          function: "updateConfig",
          reason: "adminWeatherConfigUpdate",
          path: weatherRef.path,
          time: new Date().toISOString()
        });
        await setDoc(weatherRef, weatherUpdates, { merge: true });
      }
      
      if (import.meta.env.DEV) {
        console.log("[Admin] App config and Weather config updated successfully:", { appUpdates, weatherUpdates });
      }
    } catch (error) {
      console.error("[Admin] Error updating config:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (!authLoading) {
      setIsTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      if (authLoading) {
        setIsTimedOut(true);
      }
    }, 25000); // 10초에서 25초로 연장하여 저사양 기기 및 느린 네트워크를 지원합니다.
    return () => clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    // 버전 체크
    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json?cache=' + Date.now());
        if (!response.ok) throw new Error('Failed to fetch version.json: ' + response.statusText);
        const data = await response.json();
        
        if (data.version !== APP_VERSION) {
            setUpdateAvailable(true);
            setUpdateDismissed(false);
        } else {
            setUpdateAvailable(false);
        }
      } catch (err) {
        // Fail silently
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, 6 * 60 * 1000); // 6분마다 체크
    return () => clearInterval(interval);
  }, []);

  const handleReportSubmit = (reportType: 'bug' | 'info' | 'suggest', messageContent: string, file: File | null, memberStatus: 'member' | 'non-member' | null) => {
    setIsContactModalOpen(false);
    
    // Show gratitude toast immediately for 3 seconds
    setToastMessage('제보해주셔서 감사합니다.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);

    const typeLabel = 
      reportType === 'bug' ? '🐛 기능 오류/버그' : 
      reportType === 'info' ? '📖 도감 정보 오류' : 
      '💡 개선 아이디어/기타';
    
    const memberLabel = memberStatus === 'member' ? '로그인 유저(회원)' : memberStatus === 'non-member' ? '비회원' : '미선택';

    const formattedMessage = `📢 [신규 제보 등록]\n\n• 분류: ${typeLabel}\n• 앱 버전: ${APP_VERSION}\n• 회원상태: ${memberLabel}\n• 내용:\n${messageContent}`;

    // Helper to read file as base64
    const sendWithFile = async (message: string, file: File) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, photo: base64 }),
          }).then(() => resolve()).catch(() => resolve());
        };
        reader.onerror = () => {
          // If reading fails, just send text
          fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
          }).then(() => resolve()).catch(() => resolve());
        };
        reader.readAsDataURL(file);
      });
    };

    // Background push (fire and forget)
    if (file) {
      sendWithFile(formattedMessage, file);
    } else {
      // Send as JSON if no file - much easier for Netlify functions to parse
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: formattedMessage }),
      }).catch(err => {});
    }
  };
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleterLoading, setIsDeleterLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedTimeBlocks, setSelectedTimeBlocks] = useState<string[]>([]);
  const [selectedWeathers, setSelectedWeathers] = useState<string[]>([]);
  const [selectedCookingTypes, setSelectedCookingTypes] = useState<string[]>([]);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  // States for Collection Management
  const [completedBirdIds, setCompletedBirdIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('completed_bird_ids');
    return new Set(safeJsonParse(saved, []));
  });
  const [completedInsectIds, setCompletedInsectIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('completed_insect_ids');
    return new Set(safeJsonParse(saved, []));
  });
  const [completedFishIds, setCompletedFishIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('completed_fish_ids');
    return new Set(safeJsonParse(saved, []));
  });
  const [completedFoodIds, setCompletedFoodIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('completed_food_ids');
    return new Set(safeJsonParse(saved, []));
  });
  const [completedGardeningIds, setCompletedGardeningIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('completed_gardening_ids');
    return new Set(safeJsonParse(saved, []));
  });
  const [masterBirdIds, setMasterBirdIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('master_bird_ids');
    return new Set(safeJsonParse(saved, []));
  });
  const [masterInsectIds, setMasterInsectIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('master_insect_ids');
    return new Set(safeJsonParse(saved, []));
  });
  const [masterFishIds, setMasterFishIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('master_fish_ids');
    return new Set(safeJsonParse(saved, []));
  });
  const [masterFoodIds, setMasterFoodIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('master_food_ids');
    return new Set(safeJsonParse(saved, []));
  });
  const [masterGardeningIds, setMasterGardeningIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('master_gardening_ids');
    return new Set(safeJsonParse(saved, []));
  });
  const [completedOceanCleaningIds, setCompletedOceanCleaningIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('completed_ocean_cleaning_ids');
    return new Set(safeJsonParse(saved, []));
  });
  const [masterOceanCleaningIds, setMasterOceanCleaningIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('master_ocean_cleaning_ids');
    return new Set(safeJsonParse(saved, []));
  });

  const completedIds = (
    activeCategory === 'birds' 
      ? completedBirdIds 
      : activeCategory === 'insects' 
        ? completedInsectIds 
        : activeCategory === 'fishing' 
          ? completedFishIds 
          : activeCategory === 'cooking'
            ? completedFoodIds
            : activeCategory === 'ocean_cleaning'
              ? completedOceanCleaningIds
              : (activeCategory === 'crops' || activeCategory === 'gardening')
                ? completedGardeningIds
                : new Set<string>()
  ) as Set<string>;

  const bulkPlaceholder = useMemo(() => {
    switch (activeCategory) {
      case 'birds':
        return "굴뚝새/3\n꼬까울새/4\n노랑배박새/5";
      case 'insects':
        return "멧노랑나비/3\n배추흰나비/4\n별노린재/5";
      case 'fishing':
        return "가다랑어/3\n갈치/4\n극지연어/5";
      case 'cooking':
        return "믹스드 잼/3\n블루베리 잼/4\n라즈베리 잼/5";
      case 'crops':
        return "토마토/3\n벼/4\n트러플/5";
      case 'gardening':
        return "데이지/3\n팬지/4\n감자/5\n\n* 원예/작물 통합 입력 가능";
      case 'ocean_cleaning':
        return "손상된 조개껍데기/3\n고토이 심해고둥/4\n루시나조개/5";
      default:
        return "아이템명/별점\n아이템명/별점\n아이템명/별점";
    }
  }, [activeCategory]);

  const [bulkInput, setBulkInput] = useState('');
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [tempCompletedIds, setTempCompletedIds] = useState<Set<string>>(new Set());
  const [initialModalCompletedIds, setInitialModalCompletedIds] = useState<Set<string>>(new Set());
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const setsAreEqual = (a: Set<string>, b: Set<string>) => {
    if (a.size !== b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return true;
  };

  function handleCloseModal() {
    const hasUnsavedChanges = 
      bulkInput.trim().length > 0 || 
      !setsAreEqual(tempCompletedIds, initialModalCompletedIds);

    if (hasUnsavedChanges) {
      setShowConfirmClose(true);
    } else {
      setIsCollectionModalOpen(false);
      setBulkInput('');
    }
  }

  // Initialize temp collection state when modal opens
  useEffect(() => {
    if (isCollectionModalOpen) {
      const initialSet = new Set(completedIds);
      setTempCompletedIds(initialSet);
      setInitialModalCompletedIds(new Set(completedIds));
    }
  }, [isCollectionModalOpen, activeCategory]); // Re-sync if category changes while open (unlikely but safe)
  const [syncConflict, setSyncConflict] = useState<{
    cloudUpdatedAt?: string;
    localUpdatedAt?: string;
    cloudBirdsCount?: number;
    localBirdsCount?: number;
    cloudInsectsCount?: number;
    localInsectsCount?: number;
    cloudFishCount?: number;
    localFishCount?: number;
    cloudFoodCount?: number;
    localFoodCount?: number;
    cloudPetsCount?: number;
    localPetsCount?: number;
    cloudActiveSlotsCount?: number;
    localActiveSlotsCount?: number;
    localCount: number;
    cloudCount: number;
    resolve: (choice: 'cloud' | 'merge' | 'local') => Promise<void>;
    diffFields?: string[];
  } | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isRecInfoOpen, setIsRecInfoOpen] = useState(false);
  const [isSidebarInteracting, setIsSidebarInteracting] = useState(false);
  const [forceShowIntro, setForceShowIntro] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userFilterExpandedPreference, setUserFilterExpandedPreference] = useState(true);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchHeaderRef = useRef<HTMLDivElement>(null);
  const largeFilterPanelRef = useRef<HTMLDivElement>(null);
  const [isLargeFilterScrolledPast, setIsLargeFilterScrolledPast] = useState(false);

  const lastSyncedDataRef = useRef<string>('');
  const globalSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localWriteLockRef = useRef<number>(0);
  const isInitialSyncDoneRef = useRef<boolean>(false);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const isDirtyRef = useRef<boolean>(false);

  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  
  // Monitor scroll for hiding the header with hysteresis to prevent flickering
  useEffect(() => {
    const handleScroll = () => {
      // If profile dropdown is open, don't hide any headers to avoid layout shifting or hiding the menu
      if (isProfileDropdownOpen) {
        setIsHeaderHidden(false);
        return;
      }

      const currentScrollY = window.scrollY;
      
      // Hysteresis calculation to prevent flickering at boundaries
      // On mobile, we might want different thresholds
      const hideThreshold = 150;
      const showThreshold = 60;

      if (currentScrollY > hideThreshold) {
        setIsHeaderHidden(true);
      } else if (currentScrollY < showThreshold) {
        setIsHeaderHidden(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isProfileDropdownOpen]);
  
  // Monitor sticky state using the filter container's viewport position
  useEffect(() => {
    const handleScroll = () => {
      if (!filterRef.current) return;
      
      const rect = filterRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768; // MD breakpoint is 768px
      const stickyThreshold = isMobile ? 56 : 0;
      
      // Determine if sticky header is stuck
      // Add a tiny 2px buffer for subpixel accuracy on high-DPI displays
      const isStuck = rect.top <= stickyThreshold + 2;
      
      setIsScrolled(isStuck);

      // Check if the large filter panel has scrolled past the header
      if (searchHeaderRef.current && largeFilterPanelRef.current) {
        const searchRect = searchHeaderRef.current.getBoundingClientRect();
        const largeRect = largeFilterPanelRef.current.getBoundingClientRect();
        
        // If the bottom of the large filter panel is above or near the bottom of the sticky header,
        // it means the user has scrolled past it!
        // We use a safe buffer of 10px to start showing the compact bar
        const hasScrolledPast = largeRect.bottom <= (searchRect.bottom + 10);
        setIsLargeFilterScrolledPast(hasScrolledPast);
      } else {
        setIsLargeFilterScrolledPast(isStuck);
      }
    };

    // Run once on load to set initial state correctly
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Sync expanded state with user preference
  useEffect(() => {
    setIsFilterExpanded(userFilterExpandedPreference);
  }, [userFilterExpandedPreference]);

  // Auto-launch welcome modal for first-time visitors on load
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('has_seen_pigtown_welcome');
    const hasSeenGuide = localStorage.getItem('has_seen_pigtown_guide');
    if (!hasSeenWelcome && !hasSeenGuide) {
      setIsWelcomeOpen(true);
    }
  }, []);

  const [openMobileFilter, setOpenMobileFilter] = useState<'weather' | 'level' | 'time' | 'collection' | 'star' | 'master' | 'cooking_type' | 'cooking_level' | null>(null);

  // Close mobile filter menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If a menu is open, and user clicks outside (not on the filter container), close it
      if (openMobileFilter && filterRef.current && !filterRef.current.contains(event.target as Node)) {
          setOpenMobileFilter(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMobileFilter]);

  const prevUserRef = useRef<any>(null);

  // Toggle helpers to handle co-selection of "Always" weather and "always" time
  const handleWeatherFilterClick = (w: string) => {
    setSelectedWeathers(prev => {
      if (prev.includes(w)) {
        return prev.filter(sw => sw !== w);
      } else {
        return [...prev, w];
      }
    });
  };

  const handleTimeFilterClick = (val: string) => {
    setSelectedTimeBlocks(prev => {
      if (prev.includes(val)) {
        return prev.filter(b => b !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  // States for Collection Management
  
  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('pigtown_pets');
    return safeJsonParse(saved, []);
  });
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('item_ratings');
    const parsed: Record<string, number> = safeJsonParse(saved, {});

    // Securely migrate any local-only gardening ratings on mount
    try {
      const savedGardening = localStorage.getItem('pigtown_gardening_ratings');
      if (savedGardening) {
        const gardeningRatings = safeJsonParse(savedGardening, {} as any);
        let migratedAny = false;
        Object.entries(gardeningRatings).forEach(([id, r]) => {
        const item = ALL_GARDENING_MAP.find((g: any) => g.id === id);
          if (item && r && typeof r === 'number') {
            if (parsed[item.name] === undefined) {
              parsed[item.name] = r;
              migratedAny = true;
            }
          }
        });
        if (migratedAny) {
          localStorage.setItem('item_ratings', JSON.stringify(parsed));
          localStorage.removeItem('pigtown_gardening_ratings');
        }
      }
    } catch (e) {
      console.error("Failed to migrate gardening ratings:", e);
    }
    
    return parsed;
  });

  // Crops screen subtab menu state
  const [cropsSubTab, setCropsSubTab] = useState<'timer' | 'guide'>('timer');

  // Updated status filter state to granular filters
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'collected' | 'uncollected'>('all');
  const [starFilter, setStarFilter] = useState<'all' | 'done' | 'todo'>('all');
  const [masterFilter, setMasterFilter] = useState<'all' | 'done' | 'todo'>('all');
  const [sortOrders, setSortOrders] = useState<Record<Category, SortOrder>>({
    birds: 'level',
    insects: 'level',
    fishing: 'level',
    cooking: 'level',
    home: 'level',
    crops: 'level',
    petfood: 'level',
    gardening: 'level'
  });

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 뒤로가기 키(Back Key) 모바일 닫기 연동 훅
  useBackDismiss(showClearConfirm, () => setShowClearConfirm(false), 'appClearConfirm');
  useBackDismiss(isWeatherModalOpen, () => setIsWeatherModalOpen(false), 'appWeatherModal');
  const handleSaveModal = () => {
    // 1. Parse bulk input if any
    const lines = bulkInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
    
    const matchedIds = new Set<string>();
    const updatedRatings = { ...ratings };
    const unmatched: string[] = [];

    if (lines.length > 0) {
      let allItems: any[] = [];
      if (activeCategory === 'birds') allItems = dbBirds;
      else if (activeCategory === 'insects') allItems = dbInsects;
      else if (activeCategory === 'fishing') allItems = dbFish;
      else if (activeCategory === 'cooking') allItems = dbCooking;
      else if (activeCategory === 'gardening' || activeCategory === 'crops') allItems = dbGardening;
      else if (activeCategory === 'ocean_cleaning') allItems = oceanCleaning;

      lines.forEach(line => {
        let namePart = line;
        let ratingValue = 0;
        if (line.includes('/')) {
          const parts = line.split('/');
          namePart = parts[0].trim();
          const r = parseInt(parts[1].trim());
          if (!isNaN(r)) ratingValue = Math.min(5, Math.max(0, r));
        }
        const normalizedInput = namePart.replace(/\s+/g, '').toLowerCase();
        const item = allItems.find(b => b.name.replace(/\s+/g, '').toLowerCase() === normalizedInput);
        if (item) {
          matchedIds.add(item.id);
          if (ratingValue > 0) updatedRatings[item.name] = ratingValue;
        } else {
          unmatched.push(line);
        }
      });
    }

    // 2. Final set: temp state + bulk matched items
    const finalSet = new Set<string>(tempCompletedIds);
    matchedIds.forEach(id => finalSet.add(id));
    
    // 3. Update actual state
    updateCollectionState(activeCategory, finalSet);
    
    // Update ratings if changed
    if (Object.keys(updatedRatings).length > Object.keys(ratings).length || 
        JSON.stringify(updatedRatings) !== JSON.stringify(ratings)) {
      setRatings(updatedRatings);
      localStorage.setItem('item_ratings', JSON.stringify(updatedRatings));
    }

    if (unmatched.length > 0) {
      setUnmatchedNames(unmatched);
    }

    setBulkInput('');
    setIsCollectionModalOpen(false);
    
    setToastMessage('저장되었습니다.');
    setTimeout(() => setToastMessage(null), 3000);

    if (user) {
      debouncedSyncAllData();
    }
  };

  const toggleTempCompletion = (id: string) => {
    setTempCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  useBackDismiss(isCollectionModalOpen, handleCloseModal, 'appCollectionModal');
  useBackDismiss(isGuideOpen, () => setIsGuideOpen(false), 'appGuide');
  useBackDismiss(isWelcomeOpen, () => setIsWelcomeOpen(false), 'appWelcome');
  useBackDismiss(isRecInfoOpen, () => setIsRecInfoOpen(false), 'appRecInfo');
  useBackDismiss(isContactModalOpen, () => setIsContactModalOpen(false), 'appContactModal');

  const gardeningItems = useMemo(() => {
    const seasonal = SEASONAL_EVENTS
      .filter(e => effectiveSeasonIds.includes(e.id))
      .flatMap(e => e.gardening || []);
    return [...GARDENING_ITEMS, ...seasonal];
  }, [effectiveSeasonIds]);

  // Dynamic totals for the active categories
  const birdTotal = useMemo(() => dbBirds.filter(b => b.level <= MAX_DISPLAY_LEVEL).length, [dbBirds, MAX_DISPLAY_LEVEL]);
  const insectTotal = useMemo(() => dbInsects.filter(i => i.level <= MAX_DISPLAY_LEVEL).length, [dbInsects, MAX_DISPLAY_LEVEL]);
  const fishTotal = useMemo(() => dbFish.filter(f => f.level <= MAX_DISPLAY_LEVEL).length, [dbFish, MAX_DISPLAY_LEVEL]);
  const cookingTotal = useMemo(() => dbCooking.filter(c => c.level <= MAX_DISPLAY_LEVEL).length, [dbCooking, MAX_DISPLAY_LEVEL]);
  
  const gardeningFlowerItems = useMemo(() => gardeningItems.filter(i => i.category === 'flower'), [gardeningItems]);
  const gardeningCropItems = useMemo(() => gardeningItems.filter(i => i.category === 'crop'), [gardeningItems]);
  
  const gardeningTotal = useMemo(() => gardeningFlowerItems.filter(i => i.level <= MAX_DISPLAY_LEVEL).length, [gardeningFlowerItems, MAX_DISPLAY_LEVEL]);
  const cropTotal = useMemo(() => gardeningCropItems.filter(i => i.level <= MAX_DISPLAY_LEVEL).length, [gardeningCropItems, MAX_DISPLAY_LEVEL]);
  
  const completedFlowerIds = useMemo(() => new Set([...completedGardeningIds].filter(id => gardeningFlowerItems.find(i => i.id === id))), [completedGardeningIds, gardeningFlowerItems]);
  const completedCropIds = useMemo(() => new Set([...completedGardeningIds].filter(id => gardeningCropItems.find(i => i.id === id))), [completedGardeningIds, gardeningCropItems]);

  const oceanCleaning = useMemo(() => {
    return SEASONAL_EVENTS
      .filter(e => effectiveSeasonIds.includes(e.id))
      .flatMap(e => e.oceanCleaning || []);
  }, [effectiveSeasonIds]);

  const oceanCleaningTotal = useMemo(() => {
    return oceanCleaning.filter(i => i.level <= MAX_DISPLAY_LEVEL).length;
  }, [oceanCleaning, MAX_DISPLAY_LEVEL]);

  const effectiveCompletedBirdIds = useMemo(() => new Set([...completedBirdIds].filter(id => dbBirds.find(b => b.id === id))), [completedBirdIds, dbBirds]);
  const effectiveCompletedInsectIds = useMemo(() => new Set([...completedInsectIds].filter(id => dbInsects.find(i => i.id === id))), [completedInsectIds, dbInsects]);
  const effectiveCompletedFishIds = useMemo(() => new Set([...completedFishIds].filter(id => dbFish.find(f => f.id === id))), [completedFishIds, dbFish]);
  const effectiveCompletedFoodIds = useMemo(() => new Set([...completedFoodIds].filter(id => dbCooking.find(c => c.id === id))), [completedFoodIds, dbCooking]);
  const effectiveCompletedOceanCleaningIds = useMemo(() => new Set([...completedOceanCleaningIds].filter(id => oceanCleaning.find(o => o.id === id))), [completedOceanCleaningIds, oceanCleaning]);
  const effectiveCompletedGardeningIds = useMemo(() => new Set([...completedGardeningIds].filter(id => gardeningItems.find(g => g.id === id))), [completedGardeningIds, gardeningItems]);

  const currentCategoryTotal = useMemo(() => {
    return activeCategory === 'birds' 
      ? birdTotal 
      : activeCategory === 'insects' 
        ? insectTotal 
        : activeCategory === 'fishing' 
          ? fishTotal 
          : activeCategory === 'cooking'
            ? cookingTotal
            : activeCategory === 'ocean_cleaning'
              ? oceanCleaningTotal
              : (activeCategory === 'gardening' || activeCategory === 'crops')
                ? gardeningTotal + cropTotal
                : 0;
  }, [activeCategory, birdTotal, insectTotal, fishTotal, cookingTotal, gardeningTotal, cropTotal, oceanCleaningTotal]);

  const currentCategoryCompleted = useMemo(() => {
    return activeCategory === 'birds' 
      ? effectiveCompletedBirdIds.size 
      : activeCategory === 'insects' 
        ? effectiveCompletedInsectIds.size 
        : activeCategory === 'fishing' 
          ? effectiveCompletedFishIds.size 
          : activeCategory === 'cooking'
            ? effectiveCompletedFoodIds.size
            : activeCategory === 'ocean_cleaning'
              ? effectiveCompletedOceanCleaningIds.size
              : (activeCategory === 'gardening' || activeCategory === 'crops')
                ? effectiveCompletedGardeningIds.size
                : 0;
  }, [activeCategory, effectiveCompletedBirdIds, effectiveCompletedInsectIds, effectiveCompletedFishIds, effectiveCompletedFoodIds, effectiveCompletedGardeningIds, effectiveCompletedOceanCleaningIds]);

  // --- MODULAR SEPARATED INITIAL SYNC & MERGE ARCHITECTURE ---
  async function runInitialSync(loggedInUser: any) {
    if (!loggedInUser) return;
    let cloudPetsRaw: any[] = [];
    try {
      console.log("[Sync] Starting runInitialSync for user (Source of Truth check):", loggedInUser.uid);
      const loginUid = loggedInUser.uid;
      const userDocRef = doc(db, 'users', loggedInUser.uid);
      const docSnap = await getDoc(userDocRef);
      console.log("[Sync] docSnap exists:", docSnap.exists());

      if (auth.currentUser?.uid !== loginUid) {
        console.warn("[Sync] runInitialSync: loginUid changed after database read. Exiting.");
        return;
      }

      // Restore/collect LocalState (cache-only mode, but guest phase counts as offline local edits)
      const localBirdsStr = localStorage.getItem('completed_bird_ids');
      const localInsectsStr = localStorage.getItem('completed_insect_ids');
      const localFishStr = localStorage.getItem('completed_fish_ids');
      const localFoodStr = localStorage.getItem('completed_food_ids');
      const localGardeningStr = localStorage.getItem('completed_gardening_ids');
          const localOceanCleaningStr = localStorage.getItem('completed_ocean_cleaning_ids');
      const localMasterBirdsStr = localStorage.getItem('master_bird_ids');
      const localMasterInsectsStr = localStorage.getItem('master_insect_ids');
      const localMasterFishStr = localStorage.getItem('master_fish_ids');
      const localMasterFoodStr = localStorage.getItem('master_food_ids');
      const localMasterGardeningStr = localStorage.getItem('master_gardening_ids');
          const localMasterOceanCleaningStr = localStorage.getItem('master_ocean_cleaning_ids');
      const localPetsStr = localStorage.getItem('pigtown_pets');
      const localRatingsStr = localStorage.getItem('item_ratings');
      const localWeeklyStr = localStorage.getItem('weekly_weather');
      const localDetailedStr = localStorage.getItem('detailed_weather');
      const rawLocalSlots = localStorage.getItem('farming_slots');
      console.log("[Sync] Raw local slots:", rawLocalSlots);

      const localBirds = new Set<string>(safeJsonParse(localBirdsStr, []));
      const localInsects = new Set<string>(safeJsonParse(localInsectsStr, []));
      const localFish = new Set<string>(safeJsonParse(localFishStr, []));
      const localFood = new Set<string>(safeJsonParse(localFoodStr, []));
      const localGardening = new Set<string>(safeJsonParse(localGardeningStr, []));
          const localOceanCleaning = new Set<string>(safeJsonParse(localOceanCleaningStr, []));
      const localMasterBirds = new Set<string>(safeJsonParse(localMasterBirdsStr, []));
      const localMasterInsects = new Set<string>(safeJsonParse(localMasterInsectsStr, []));
      const localMasterFish = new Set<string>(safeJsonParse(localMasterFishStr, []));
      const localMasterFood = new Set<string>(safeJsonParse(localMasterFoodStr, []));
      const localMasterGardening = new Set<string>(safeJsonParse(localMasterGardeningStr, []));
          const localMasterOceanCleaning = new Set<string>(safeJsonParse(localMasterOceanCleaningStr, []));
      const localPets = safeJsonParse(localPetsStr, []);
      const localRatings = safeJsonParse(localRatingsStr, {});
      const localWeekly = safeJsonParse(localWeeklyStr, {});
      const localDetailed = safeJsonParse(localDetailedStr, {});
      const localSlotsList = safeJsonParse(rawLocalSlots, []);
      console.log("[Sync] Parsed local slots:", localSlotsList);

      const hasLocalProgress = localBirds.size > 0 || localInsects.size > 0 || localFish.size > 0 || localFood.size > 0 ||
        localGardening.size > 0 || localOceanCleaning.size > 0 || Object.keys(localWeekly).length > 0 || Object.keys(localDetailed).length > 0 || localPets.length > 0 ||
        localSlotsList.some((s: any) => s && s.cropId !== null);
      console.log("[Sync] Has local progress:", hasLocalProgress);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const cloudBirdsList = (data.completedBirdNames || []).map((name: string) => ALL_BIRDS_MAP.find(b => b.name === name || b.id === name)?.id || name);
        const cloudInsectsList = (data.completedInsectNames || []).map((name: string) => ALL_INSECTS_MAP.find(i => i.name === name || i.id === name)?.id || name);
        const cloudFishList = (data.completedFishNames || []).map((name: string) => ALL_FISH_MAP.find(f => f.name === name || f.id === name)?.id || name);
        const cloudCookingList = (data.completedFoodNames || []).map((name: string) => ALL_COOKING_MAP.find(c => c.name === name || c.id === name)?.id || name);
        const cloudGardeningList = (data.completedGardeningNames || []).map((name: string) => ALL_GARDENING_MAP.find(g => g.name === name || g.id === name)?.id || name);
          const cloudOceanCleaningList = (data.completedOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);
        
        const cloudMasterBirdsList = (data.masterBirdNames || []).map((name: string) => ALL_BIRDS_MAP.find(b => b.name === name || b.id === name)?.id || name);
        const cloudMasterInsectsList = (data.masterInsectNames || []).map((name: string) => ALL_INSECTS_MAP.find(i => i.name === name || i.id === name)?.id || name);
        const cloudMasterFishList = (data.masterFishNames || []).map((name: string) => ALL_FISH_MAP.find(f => f.name === name || f.id === name)?.id || name);
        const cloudMasterCookingList = (data.masterFoodNames || []).map((name: string) => ALL_COOKING_MAP.find(c => c.name === name || c.id === name)?.id || name);
        const cloudMasterGardeningList = (data.masterGardeningNames || []).map((name: string) => ALL_GARDENING_MAP.find(g => g.name === name || g.id === name)?.id || name);
          const cloudMasterOceanCleaningList = (data.masterOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);
        const cloudBirds = new Set<string>(cloudBirdsList);
        const cloudInsects = new Set<string>(cloudInsectsList);
        const cloudFish = new Set<string>(cloudFishList);

        const cloudFood = new Set<string>(cloudCookingList);
        const cloudGardening = new Set<string>(cloudGardeningList);
          const cloudOceanCleaning = new Set<string>(cloudOceanCleaningList || []);
        const cloudMasterBirds = new Set<string>(cloudMasterBirdsList);
        const cloudMasterInsects = new Set<string>(cloudMasterInsectsList);
        const cloudMasterFish = new Set<string>(cloudMasterFishList);
        const cloudMasterFood = new Set<string>(cloudMasterCookingList);
        const cloudMasterGardening = new Set<string>(cloudMasterGardeningList);
        const cloudMasterOceanCleaning = new Set<string>(cloudMasterOceanCleaningList || []);

        const cloudRatings = data.ratings || {};
        const cloudWeeklyWeather = cleanWeeklyWeather(data.weeklyWeather);
        const cloudDetailedWeather = data.detailedWeather || {};

        cloudPetsRaw = data.pets || [];
        const cloudPets = mapCloudPetsToLocal(cloudPetsRaw);
        const cloudSlotsList: any[] = data.farmingSlots 
          ? reconstructSlotsFromFarmingSlotsMap(data.farmingSlots)
          : (Array.isArray(data.slots) 
              ? data.slots 
              : Object.keys(data.slots || {}).sort().map(k => ({ ...data.slots[k], id: k })));

        const hasCloudProgress = cloudBirds.size > 0 || cloudInsects.size > 0 || cloudFish.size > 0 || cloudFood.size > 0 ||
          cloudGardening.size > 0 || cloudOceanCleaning.size > 0 || Object.keys(cloudWeeklyWeather).length > 0 || Object.keys(cloudDetailedWeather).length > 0 || cloudPets.length > 0 ||
          cloudSlotsList.some((s: any) => s && s.cropId !== null);

        // Deep value equality comparison that normalizes null, undefined, empty array, and empty objects as equal.
        const areValuesEqual = (a: any, b: any): boolean => {
          const isEmpty = (x: any) => {
            if (x === null || x === undefined || x === "") return true;
            if (Array.isArray(x) && x.length === 0) return true;
            if (typeof x === 'object' && Object.keys(x).length === 0) return true;
            return false;
          };

          if (isEmpty(a) && isEmpty(b)) return true;
          if (isEmpty(a) !== isEmpty(b)) return false;

          if (typeof a !== typeof b) return false;

          if (typeof a !== 'object' || a === null) {
            return a === b;
          }

          if (Array.isArray(a)) {
            if (!Array.isArray(b)) return false;
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
              if (!areValuesEqual(a[i], b[i])) return false;
            }
            return true;
          }

          if (Array.isArray(b)) return false;
          const _keysA = Object.keys(a).filter(k => a[k] !== undefined && a[k] !== null);
          const _keysB = Object.keys(b).filter(k => b[k] !== undefined && b[k] !== null);
          
          const nonEvA = _keysA.filter(k => !isEmpty(a[k]));
          const nonEvB = _keysB.filter(k => !isEmpty(b[k]));

          if (nonEvA.length !== nonEvB.length) return false;

          for (const key of nonEvA) {
            if (!(key in b)) return false;
            if (!areValuesEqual(a[key], b[key])) return false;
          }
          return true;
        };

        // Sort pet arrays by id/name before deep comparing to ignore creation order
        const arePetsEqual = (a: any[], b: any[]): boolean => {
          const sortedA = [...(a || [])].sort((p1, p2) => String(p1.id || p1.name || '').localeCompare(String(p2.id || p2.name || '')));
          const sortedB = [...(b || [])].sort((p1, p2) => String(p1.id || p1.name || '').localeCompare(String(p2.id || p2.name || '')));
          return areValuesEqual(sortedA, sortedB);
        };

        // Compare only active farming slots (cropId !== null) to ignore empty/null/undefined format differences
        const areSlotsEqual = (a: any[], b: any[]): boolean => {
          const listA = (a || []).map(s => s || {});
          const listB = (b || []).map(s => s || {});
          
          if (listA.length !== listB.length) return false;
          
          for (let i = 0; i < listA.length; i++) {
            const sa = listA[i];
            const sb = listB[i];
            
            // Check critical crop identifiers
            if (sa.id !== sb.id) return false;
            if (sa.cropId !== sb.cropId) return false;
            if (sa.cropName !== sb.cropName) return false;
            if (sa.cropEmoji !== sb.cropEmoji) return false;
            
            // Normalize dates to millisecond numbers for robust comparison
            const getMs = (t: any) => {
              if (!t) return 0;
              if (typeof t === 'object' && typeof t.toMillis === 'function') return t.toMillis();
              if (typeof t === 'object' && typeof t.seconds === 'number') return t.seconds * 1000;
              return Number(t) || 0;
            };
            
            const saStart = getMs(sa.originalStartTime) || getMs(sa.startTime);
            const sbStart = getMs(sb.originalStartTime) || getMs(sb.startTime);
            if (saStart !== sbStart) return false;

            const saDuration = Number(sa.originalDuration) || Number(sa.duration) || 0;
            const sbDuration = Number(sb.originalDuration) || Number(sb.duration) || 0;
            if (saDuration !== sbDuration) return false;

            if ((sa.userOffset || 0) !== (sb.userOffset || 0)) return false;
            if (!!sa.isFiveStarMode !== !!sb.isFiveStarMode) return false;
            if (!!sa.isNotified !== !!sb.isNotified) return false;
          }
          return true;
        };

        const diffFields: string[] = [];
        const isBirdsDiff = cloudBirds.size !== localBirds.size || [...cloudBirds].some(x => !localBirds.has(x)) ||
                            cloudMasterBirds.size !== localMasterBirds.size || [...cloudMasterBirds].some(x => !localMasterBirds.has(x));
        const isInsectsDiff = cloudInsects.size !== localInsects.size || [...cloudInsects].some(x => !localInsects.has(x)) ||
                              cloudMasterInsects.size !== localMasterInsects.size || [...cloudMasterInsects].some(x => !localMasterInsects.has(x));
        const isFishDiff = cloudFish.size !== localFish.size || [...cloudFish].some(x => !localFish.has(x)) ||
                           cloudMasterFish.size !== localMasterFish.size || [...cloudMasterFish].some(x => !localMasterFish.has(x));
        const isFoodDiff = cloudFood.size !== localFood.size || [...cloudFood].some(x => !localFood.has(x)) ||
                           cloudMasterFood.size !== localMasterFood.size || [...cloudMasterFood].some(x => !localMasterFood.has(x));
        const isGardeningDiff = cloudGardening.size !== localGardening.size || [...cloudGardening].some(x => !localGardening.has(x)) ||
                                cloudMasterGardening.size !== localMasterGardening.size || [...cloudMasterGardening].some(x => !localMasterGardening.has(x));
        const isOceanCleaningDiff = cloudOceanCleaning.size !== localOceanCleaning.size || [...cloudOceanCleaning].some(x => !localOceanCleaning.has(x)) ||
                                    cloudMasterOceanCleaning.size !== localMasterOceanCleaning.size || [...cloudMasterOceanCleaning].some(x => !localMasterOceanCleaning.has(x));

        if (isBirdsDiff || isInsectsDiff || isFishDiff || isFoodDiff || isGardeningDiff || isOceanCleaningDiff) {
          diffFields.push("도감 진행도");
        }
        if (!areValuesEqual(cloudRatings, localRatings)) {
          diffFields.push("평가 정보");
        }
        if (!arePetsEqual(cloudPets, localPets)) {
          diffFields.push("반려동물(펫) 설정");
        }
        if (!areSlotsEqual(cloudSlotsList, localSlotsList)) {
          diffFields.push("농장 및 작물 상태");
        }
        if (!areValuesEqual(cloudWeeklyWeather, localWeekly) || !areValuesEqual(cloudDetailedWeather, localDetailed)) {
          diffFields.push("날씨 상태 설정");
        }

        // Difference check (true if structural sync divergence exists)
        const hasDifferences = () => {
          return diffFields.length > 0;
        };

        if (hasLocalProgress && hasDifferences()) {
          const isSameUserSession = localStorage.getItem('sync_resolved_uid') === loggedInUser.uid;
          if (isSameUserSession) {
            console.log("[Sync] Same user session detected (sync_resolved_uid === currentUser.uid). Bypassing conflict popup.");
            const choice = localStorage.getItem('has_unsynced_changes') === 'true' ? 'merge' : 'cloud';
            isResetting.current = true;
            try {
              if (choice === 'cloud') {
                console.log("[Sync] Silent adoption: same user session, adopting cloud data...");
                applyFetchedDataToLocal({
                  birds: cloudBirds,
                  insects: cloudInsects,
                  fish: cloudFish,
                  food: cloudFood,
                  gardening: cloudGardening,
                    oceanCleaning: cloudOceanCleaning,
                  masterBirds: cloudMasterBirds,
                  masterInsects: cloudMasterInsects,
                  masterFish: cloudMasterFish,
                  masterFood: cloudMasterFood,
                  masterGardening: cloudMasterGardening,
                    masterOceanCleaning: cloudMasterOceanCleaning,
                  pets: cloudPets,
                  ratings: cloudRatings,
                  weeklyWeather: cloudWeeklyWeather,
                  detailedWeather: cloudDetailedWeather,
                  slots: cloudSlotsList
                }, loggedInUser.uid);

                seedLastSyncedDataRef(data, cloudRatings, cloudWeeklyWeather, cloudDetailedWeather, cloudPetsRaw);

              } else if (choice === 'merge') {
                console.log("[Sync] Silent merge: same user session, merging local unsynced edits with cloud...");
                const mergedBirds = new Set([...localBirds, ...cloudBirds]);
                const mergedInsects = new Set([...localInsects, ...cloudInsects]);
                const mergedFish = new Set([...localFish, ...cloudFish]);
                const mergedFood = new Set([...localFood, ...cloudFood]);
                const mergedGardening = new Set([...localGardening, ...cloudGardening]);
                  const mergedOceanCleaning = new Set([...(new Set(safeJsonParse(localStorage.getItem('completed_ocean_cleaning_ids'), []))), ...(new Set(cloudOceanCleaning || []))]);
                
                const mergedMasterBirds = new Set([...localMasterBirds, ...cloudMasterBirds]);
                const mergedMasterInsects = new Set([...localMasterInsects, ...cloudMasterInsects]);
                const mergedMasterFish = new Set([...localMasterFish, ...cloudMasterFish]);
                const mergedMasterFood = new Set([...localMasterFood, ...cloudMasterFood]);
                const mergedMasterGardening = new Set([...localMasterGardening, ...cloudMasterGardening]);
                  const mergedMasterOceanCleaning = new Set([...localMasterOceanCleaning, ...cloudMasterOceanCleaning]);

                const mergedRatings = { ...cloudRatings, ...localRatings };
                const mergedWeeklyWeather = { ...cloudWeeklyWeather, ...localWeekly };
                const mergedDetailedWeather = { ...cloudDetailedWeather, ...localDetailed };

                const mergedPetsMap = new Map<string, any>();
                cloudPets.forEach((p: any) => mergedPetsMap.set(p.id, p));
                localPets.forEach((p: any) => {
                  const existingPet = mergedPetsMap.get(p.id);
                  if (existingPet) {
                    mergedPetsMap.set(p.id, {
                      ...existingPet,
                      name: p.name,
                      type: p.type,
                      preferences: { ...existingPet.preferences, ...p.preferences },
                      tried: { ...(existingPet.tried || {}), ...(p.tried || {}) }
                    });
                  } else {
                    mergedPetsMap.set(p.id, p);
                  }
                });
                const mergedPets = Array.from(mergedPetsMap.values());

                const finalFarmingSlots = Array.from({ length: 8 }, (_, i) => ({
                  id: `slot_${i + 1}`,
                  cropId: null,
                  cropName: null,
                  cropEmoji: null,
                  startTime: null,
                  duration: null,
                  targetTime: null,
                  isNotified: false
                }));

                cloudSlotsList.forEach((s: any) => {
                  if (!s || !s.cropId) return;
                  const m = s.id?.match(/\d+/);
                  const idx = m ? parseInt(m[0]) - 1 : -1;
                  if (idx >= 0 && idx < 8) finalFarmingSlots[idx] = { ...s };
                });

                localSlotsList.forEach((s: any) => {
                  if (!s || !s.cropId) return;
                  const isDup = finalFarmingSlots.some(fs => fs.cropId === s.cropId && fs.startTime === s.startTime);
                  if (isDup) return;

                  const m = s.id?.match(/\d+/);
                  const idx = m ? parseInt(m[0]) - 1 : -1;
                  if (idx >= 0 && idx < 8 && finalFarmingSlots[idx].cropId === null) {
                    finalFarmingSlots[idx] = { ...s };
                  } else {
                    const emptyIdx = finalFarmingSlots.findIndex(fs => fs.cropId === null);
                    if (emptyIdx !== -1) {
                      finalFarmingSlots[emptyIdx] = { ...s, id: `slot_${emptyIdx + 1}` };
                    }
                  }
                });

                const mergedData = {
                  birds: mergedBirds,
                  insects: mergedInsects,
                  fish: mergedFish,
                  food: mergedFood,
                  gardening: mergedGardening,
                  oceanCleaning: mergedOceanCleaning,
                  masterBirds: mergedMasterBirds,
                  masterInsects: mergedMasterInsects,
                  masterFish: mergedMasterFish,
                  masterFood: mergedMasterFood,
                  masterGardening: mergedMasterGardening,
                  masterOceanCleaning: mergedMasterOceanCleaning,
                  pets: mergedPets,
                  ratings: mergedRatings,
                  weeklyWeather: mergedWeeklyWeather,
                  detailedWeather: mergedDetailedWeather,
                  slots: finalFarmingSlots
                };

                await writeLocalDataToFirestore(loggedInUser, mergedData);
                applyFetchedDataToLocal(mergedData, loggedInUser.uid);
              }

              localStorage.removeItem('has_unsynced_changes');
              isDirtyRef.current = false;
              setIsInitialSyncDone(true);
              isInitialSyncDoneRef.current = true;
            } catch (e) {
              console.error("[Sync] Silent conflict resolution error:", e);
            } finally {
              isResetting.current = false;
            }
            return;
          }

          console.log("[Sync] Conflict detected: Local progress and cloud source of truth differ. Triggering modal choice.");
          setSyncConflict({
            cloudUpdatedAt: data.updatedAt ? data.updatedAt.toDate().toLocaleString() : "시간 불명",
            localUpdatedAt: new Date().toLocaleString(),
            cloudBirdsCount: cloudBirds.size,
            localBirdsCount: localBirds.size,
            cloudInsectsCount: cloudInsects.size,
            localInsectsCount: localInsects.size,
            cloudFishCount: cloudFish.size,
            localFishCount: localFish.size,
            cloudFoodCount: cloudFood.size,
            localFoodCount: localFood.size,
            cloudPetsCount: cloudPets.length,
            localPetsCount: localPets.length,
            cloudActiveSlotsCount: cloudSlotsList.filter((s: any) => s && s.cropId !== null).length,
            localActiveSlotsCount: localSlotsList.filter((s: any) => s && s.cropId !== null).length,
            localCount: localBirds.size + localInsects.size + localFish.size + localFood.size + localGardening.size,
            cloudCount: cloudBirds.size + cloudInsects.size + cloudFish.size + cloudFood.size + cloudGardening.size,
            diffFields: diffFields,
            resolve: async (choice: 'cloud' | 'local' | 'merge') => {
              isResetting.current = true;
              try {
                if (choice === 'cloud') {
                  applyFetchedDataToLocal({
                    birds: cloudBirds,
                    insects: cloudInsects,
                    fish: cloudFish,
                    food: cloudFood,
                    gardening: cloudGardening,
                    oceanCleaning: cloudOceanCleaning,
                    masterBirds: cloudMasterBirds,
                    masterInsects: cloudMasterInsects,
                    masterFish: cloudMasterFish,
                    masterFood: cloudMasterFood,
                    masterGardening: cloudMasterGardening,
                    masterOceanCleaning: cloudMasterOceanCleaning,
                    pets: cloudPets,
                    ratings: cloudRatings,
                    weeklyWeather: cloudWeeklyWeather,
                    detailedWeather: cloudDetailedWeather,
                    slots: cloudSlotsList
                  }, loggedInUser.uid);

                  seedLastSyncedDataRef(data, cloudRatings, cloudWeeklyWeather, cloudDetailedWeather, cloudPetsRaw);

                } else if (choice === 'local') {
                  await writeLocalDataToFirestore(loggedInUser, {
                    birds: localBirds,
                    insects: localInsects,
                    fish: localFish,
                    food: localFood,
                    gardening: localGardening,
                    oceanCleaning: localOceanCleaning,
                    masterBirds: localMasterBirds,
                    masterInsects: localMasterInsects,
                    masterFish: localMasterFish,
                    masterFood: localMasterFood,
                    masterGardening: localMasterGardening,
                    masterOceanCleaning: localMasterOceanCleaning,
                    pets: localPets,
                    ratings: localRatings,
                    weeklyWeather: localWeekly,
                    detailedWeather: localDetailed,
                    slots: localSlotsList
                  });

                  applyFetchedDataToLocal({
                    birds: localBirds,
                    insects: localInsects,
                    fish: localFish,
                    food: localFood,
                    gardening: localGardening,
                    oceanCleaning: localOceanCleaning,
                    masterBirds: localMasterBirds,
                    masterInsects: localMasterInsects,
                    masterFish: localMasterFish,
                    masterFood: localMasterFood,
                    masterGardening: localMasterGardening,
                    masterOceanCleaning: localMasterOceanCleaning,
                    pets: localPets,
                    ratings: localRatings,
                    weeklyWeather: localWeekly,
                    detailedWeather: localDetailed,
                    slots: localSlotsList
                  }, loggedInUser.uid);

                } else if (choice === 'merge') {
                  const mergedBirds = new Set([...localBirds, ...cloudBirds]);
                  const mergedInsects = new Set([...localInsects, ...cloudInsects]);
                  const mergedFish = new Set([...localFish, ...cloudFish]);
                  const mergedFood = new Set([...localFood, ...cloudFood]);
                  const mergedGardening = new Set([...localGardening, ...cloudGardening]);
                  const mergedOceanCleaning = new Set([...(new Set(safeJsonParse(localStorage.getItem('completed_ocean_cleaning_ids'), []))), ...(new Set(cloudOceanCleaning || []))]);
                  
                  const mergedMasterBirds = new Set([...localMasterBirds, ...cloudMasterBirds]);
                  const mergedMasterInsects = new Set([...localMasterInsects, ...cloudMasterInsects]);
                  const mergedMasterFish = new Set([...localMasterFish, ...cloudMasterFish]);
                  const mergedMasterFood = new Set([...localMasterFood, ...cloudMasterFood]);
                  const mergedMasterGardening = new Set([...localMasterGardening, ...cloudMasterGardening]);
                  const mergedMasterOceanCleaning = new Set([...localMasterOceanCleaning, ...cloudMasterOceanCleaning]);

                  const mergedRatings = { ...cloudRatings, ...localRatings };
                  const mergedWeeklyWeather = { ...cloudWeeklyWeather, ...localWeekly };
                  const mergedDetailedWeather = { ...cloudDetailedWeather, ...localDetailed };

                  const mergedPetsMap = new Map<string, any>();
                  cloudPets.forEach((p: any) => mergedPetsMap.set(p.id, p));
                  localPets.forEach((p: any) => {
                    const existingPet = mergedPetsMap.get(p.id);
                    if (existingPet) {
                      mergedPetsMap.set(p.id, {
                        ...existingPet,
                        name: p.name,
                        type: p.type,
                        preferences: { ...existingPet.preferences, ...p.preferences },
                        tried: { ...(existingPet.tried || {}), ...(p.tried || {}) }
                      });
                    } else {
                      mergedPetsMap.set(p.id, p);
                    }
                  });
                  const mergedPets = Array.from(mergedPetsMap.values());

                  const finalFarmingSlots = Array.from({ length: 8 }, (_, i) => ({
                    id: `slot_${i + 1}`,
                    cropId: null,
                    cropName: null,
                    cropEmoji: null,
                    startTime: null,
                    duration: null,
                    targetTime: null,
                    isNotified: false
                  }));

                  cloudSlotsList.forEach((s: any) => {
                    if (!s || !s.cropId) return;
                    const m = s.id?.match(/\d+/);
                    const idx = m ? parseInt(m[0]) - 1 : -1;
                    if (idx >= 0 && idx < 8) finalFarmingSlots[idx] = { ...s };
                  });

                  localSlotsList.forEach((s: any) => {
                    if (!s || !s.cropId) return;
                    const isDup = finalFarmingSlots.some(fs => fs.cropId === s.cropId && fs.startTime === s.startTime);
                    if (isDup) return;

                    const m = s.id?.match(/\d+/);
                    const idx = m ? parseInt(m[0]) - 1 : -1;
                    if (idx >= 0 && idx < 8 && finalFarmingSlots[idx].cropId === null) {
                      finalFarmingSlots[idx] = { ...s };
                    } else {
                      const emptyIdx = finalFarmingSlots.findIndex(fs => fs.cropId === null);
                      if (emptyIdx !== -1) {
                        finalFarmingSlots[emptyIdx] = { ...s, id: `slot_${emptyIdx + 1}` };
                      }
                    }
                  });

                  const mergedData = {
                    birds: mergedBirds,
                    insects: mergedInsects,
                    fish: mergedFish,
                    food: mergedFood,
                    gardening: mergedGardening,
                  oceanCleaning: mergedOceanCleaning,
                    masterBirds: mergedMasterBirds,
                    masterInsects: mergedMasterInsects,
                    masterFish: mergedMasterFish,
                    masterFood: mergedMasterFood,
                    masterGardening: mergedMasterGardening,
                  masterOceanCleaning: mergedMasterOceanCleaning,
                    pets: mergedPets,
                    ratings: mergedRatings,
                    weeklyWeather: mergedWeeklyWeather,
                    detailedWeather: mergedDetailedWeather,
                    slots: finalFarmingSlots
                  };

                  await writeLocalDataToFirestore(loggedInUser, mergedData);

                  applyFetchedDataToLocal(mergedData, loggedInUser.uid);
                }

                localStorage.removeItem('has_unsynced_changes');
                isDirtyRef.current = false;
                setIsInitialSyncDone(true);
                isInitialSyncDoneRef.current = true;
                setSyncConflict(null);
                setShowOverwriteConfirm(false);
              } catch (e) {
                console.error("[Sync] Error in conflict modal resolution choice:", e);
              } finally {
                isResetting.current = false;
              }
            },
            onResolve: async (choice: 'cloud' | 'local' | 'merge') => {
              isResetting.current = true;
              try {
                if (choice === 'cloud') {
                  applyFetchedDataToLocal({
                    birds: cloudBirds,
                    insects: cloudInsects,
                    fish: cloudFish,
                    food: cloudFood,
                    gardening: cloudGardening,
                    oceanCleaning: cloudOceanCleaning,
                    masterBirds: cloudMasterBirds,
                    masterInsects: cloudMasterInsects,
                    masterFish: cloudMasterFish,
                    masterFood: cloudMasterFood,
                    masterGardening: cloudMasterGardening,
                    masterOceanCleaning: cloudMasterOceanCleaning,
                    pets: cloudPets,
                    ratings: cloudRatings,
                    weeklyWeather: cloudWeeklyWeather,
                    detailedWeather: cloudDetailedWeather,
                    slots: cloudSlotsList
                  }, loggedInUser.uid);

                  seedLastSyncedDataRef(data, cloudRatings, cloudWeeklyWeather, cloudDetailedWeather, cloudPetsRaw);

                } else if (choice === 'local') {
                  await writeLocalDataToFirestore(loggedInUser, {
                    birds: localBirds,
                    insects: localInsects,
                    fish: localFish,
                    food: localFood,
                    gardening: localGardening,
                    oceanCleaning: localOceanCleaning,
                    masterBirds: localMasterBirds,
                    masterInsects: localMasterInsects,
                    masterFish: localMasterFish,
                    masterFood: localMasterFood,
                    masterGardening: localMasterGardening,
                    masterOceanCleaning: localMasterOceanCleaning,
                    pets: localPets,
                    ratings: localRatings,
                    weeklyWeather: localWeekly,
                    detailedWeather: localDetailed,
                    slots: localSlotsList
                  });

                  applyFetchedDataToLocal({
                    birds: localBirds,
                    insects: localInsects,
                    fish: localFish,
                    food: localFood,
                    gardening: localGardening,
                    oceanCleaning: localOceanCleaning,
                    masterBirds: localMasterBirds,
                    masterInsects: localMasterInsects,
                    masterFish: localMasterFish,
                    masterFood: localMasterFood,
                    masterGardening: localMasterGardening,
                    masterOceanCleaning: localMasterOceanCleaning,
                    pets: localPets,
                    ratings: localRatings,
                    weeklyWeather: localWeekly,
                    detailedWeather: localDetailed,
                    slots: localSlotsList
                  }, loggedInUser.uid);

                } else if (choice === 'merge') {
                  const mergedBirds = new Set([...localBirds, ...cloudBirds]);
                  const mergedInsects = new Set([...localInsects, ...cloudInsects]);
                  const mergedFish = new Set([...localFish, ...cloudFish]);
                  const mergedFood = new Set([...localFood, ...cloudFood]);
                  const mergedGardening = new Set([...localGardening, ...cloudGardening]);
                  const mergedOceanCleaning = new Set([...(new Set(safeJsonParse(localStorage.getItem('completed_ocean_cleaning_ids'), []))), ...(new Set(cloudOceanCleaning || []))]);
                  
                  const mergedMasterBirds = new Set([...localMasterBirds, ...cloudMasterBirds]);
                  const mergedMasterInsects = new Set([...localMasterInsects, ...cloudMasterInsects]);
                  const mergedMasterFish = new Set([...localMasterFish, ...cloudMasterFish]);
                  const mergedMasterFood = new Set([...localMasterFood, ...cloudMasterFood]);
                  const mergedMasterGardening = new Set([...localMasterGardening, ...cloudMasterGardening]);
                  const mergedMasterOceanCleaning = new Set([...localMasterOceanCleaning, ...cloudMasterOceanCleaning]);

                  const mergedRatings = { ...cloudRatings, ...localRatings };
                  const mergedWeeklyWeather = { ...cloudWeeklyWeather, ...localWeekly };
                  const mergedDetailedWeather = { ...cloudDetailedWeather, ...localDetailed };

                  const mergedPetsMap = new Map<string, any>();
                  cloudPets.forEach((p: any) => mergedPetsMap.set(p.id, p));
                  localPets.forEach((p: any) => {
                    const existingPet = mergedPetsMap.get(p.id);
                    if (existingPet) {
                      mergedPetsMap.set(p.id, {
                        ...existingPet,
                        name: p.name,
                        type: p.type,
                        preferences: { ...existingPet.preferences, ...p.preferences },
                        tried: { ...(existingPet.tried || {}), ...(p.tried || {}) }
                      });
                    } else {
                      mergedPetsMap.set(p.id, p);
                    }
                  });
                  const mergedPets = Array.from(mergedPetsMap.values());

                  const finalFarmingSlots = Array.from({ length: 8 }, (_, i) => ({
                    id: `slot_${i + 1}`,
                    cropId: null,
                    cropName: null,
                    cropEmoji: null,
                    startTime: null,
                    duration: null,
                    targetTime: null,
                    isNotified: false
                  }));

                  cloudSlotsList.forEach((s: any) => {
                    if (!s || !s.cropId) return;
                    const m = s.id?.match(/\d+/);
                    const idx = m ? parseInt(m[0]) - 1 : -1;
                    if (idx >= 0 && idx < 8) finalFarmingSlots[idx] = { ...s };
                  });

                  localSlotsList.forEach((s: any) => {
                    if (!s || !s.cropId) return;
                    const isDup = finalFarmingSlots.some(fs => fs.cropId === s.cropId && fs.startTime === s.startTime);
                    if (isDup) return;

                    const m = s.id?.match(/\d+/);
                    const idx = m ? parseInt(m[0]) - 1 : -1;
                    if (idx >= 0 && idx < 8 && finalFarmingSlots[idx].cropId === null) {
                      finalFarmingSlots[idx] = { ...s };
                    } else {
                      const emptyIdx = finalFarmingSlots.findIndex(fs => fs.cropId === null);
                      if (emptyIdx !== -1) {
                        finalFarmingSlots[emptyIdx] = { ...s, id: `slot_${emptyIdx + 1}` };
                      }
                    }
                  });

                  const mergedData = {
                    birds: mergedBirds,
                    insects: mergedInsects,
                    fish: mergedFish,
                    food: mergedFood,
                    gardening: mergedGardening,
                  oceanCleaning: mergedOceanCleaning,
                    masterBirds: mergedMasterBirds,
                    masterInsects: mergedMasterInsects,
                    masterFish: mergedMasterFish,
                    masterFood: mergedMasterFood,
                    masterGardening: mergedMasterGardening,
                  masterOceanCleaning: mergedMasterOceanCleaning,
                    pets: mergedPets,
                    ratings: mergedRatings,
                    weeklyWeather: mergedWeeklyWeather,
                    detailedWeather: mergedDetailedWeather,
                    slots: finalFarmingSlots
                  };

                  await writeLocalDataToFirestore(loggedInUser, mergedData);

                  applyFetchedDataToLocal(mergedData, loggedInUser.uid);
                }

                localStorage.removeItem('has_unsynced_changes');
                isDirtyRef.current = false;
                setIsInitialSyncDone(true);
                isInitialSyncDoneRef.current = true;
                setSyncConflict(null);
                setShowOverwriteConfirm(false);
              } catch (e) {
                console.error("[Sync] Error in conflict modal resolution choice:", e);
              } finally {
                isResetting.current = false;
              }
            }
          });
          return;
        }

        if (hasCloudProgress && (!hasLocalProgress || !hasDifferences())) {
          console.log("[Sync] Clean adoption of Firestore cloud database progress. Local has no conflicting progress.");
          applyFetchedDataToLocal({
            birds: cloudBirds,
            insects: cloudInsects,
            fish: cloudFish,
            food: cloudFood,
            gardening: cloudGardening,
                    oceanCleaning: cloudOceanCleaning,
            masterBirds: cloudMasterBirds,
            masterInsects: cloudMasterInsects,
            masterFish: cloudMasterFish,
            masterFood: cloudMasterFood,
            masterGardening: cloudMasterGardening,
                    masterOceanCleaning: cloudMasterOceanCleaning,
            pets: cloudPets,
            ratings: cloudRatings,
            weeklyWeather: cloudWeeklyWeather,
            detailedWeather: cloudDetailedWeather,
            slots: cloudSlotsList
          }, loggedInUser.uid);

          seedLastSyncedDataRef(data, cloudRatings, cloudWeeklyWeather, cloudDetailedWeather, cloudPetsRaw);

        } else if (hasLocalProgress && !hasCloudProgress) {
          console.log("[Sync] Cloud server is empty but guest holds progress. Auto upload to Firestore.");
          const initData = {
            birds: localBirds,
            insects: localInsects,
            fish: localFish,
            food: localFood,
            gardening: localGardening,
                    oceanCleaning: localOceanCleaning,
            masterBirds: localMasterBirds,
            masterInsects: localMasterInsects,
            masterFish: localMasterFish,
            masterFood: localMasterFood,
            masterGardening: localMasterGardening,
                    masterOceanCleaning: localMasterOceanCleaning,
            pets: localPets,
            ratings: localRatings,
            weeklyWeather: localWeekly,
            detailedWeather: localDetailed,
            slots: localSlotsList
          };

          await writeLocalDataToFirestore(loggedInUser, initData);

          applyFetchedDataToLocal(initData, loggedInUser.uid);
        } else {
          console.log("[Sync] No progress detected on either cloud or local. Sync completed default values.");
          applyFetchedDataToLocal({
            birds: new Set(),
            insects: new Set(),
            fish: new Set(),
            food: new Set(),
            gardening: new Set(),
            oceanCleaning: new Set(),
            masterBirds: new Set(),
            masterInsects: new Set(),
            masterFish: new Set(),
            masterFood: new Set(),
            masterGardening: new Set(),
            masterOceanCleaning: new Set(),
            pets: [],
            ratings: {},
            weeklyWeather: {},
            detailedWeather: {},
            slots: []
          }, loggedInUser.uid);

          seedLastSyncedDataRef({}, {}, {}, {}, []);
        }
      } else {
        console.log("[Sync] Cloud documents do not exist. Directly initial upload of guest local state.");
        const initData = {
          birds: localBirds,
          insects: localInsects,
          fish: localFish,
          food: localFood,
          gardening: localGardening,
                    oceanCleaning: localOceanCleaning,
          masterBirds: localMasterBirds,
          masterInsects: localMasterInsects,
          masterFish: localMasterFish,
          masterFood: localMasterFood,
          masterGardening: localMasterGardening,
                    masterOceanCleaning: localMasterOceanCleaning,
          pets: localPets,
          ratings: localRatings,
          weeklyWeather: localWeekly,
          detailedWeather: localDetailed,
          slots: localSlotsList
        };

        if (hasLocalProgress) {
          await writeLocalDataToFirestore(loggedInUser, initData);
        }
        applyFetchedDataToLocal(initData, loggedInUser.uid);
      }

      localStorage.removeItem('has_unsynced_changes');
      isDirtyRef.current = false;
      setIsInitialSyncDone(true);
      isInitialSyncDoneRef.current = true;
    } catch (err: any) {
      console.error("[Sync] runInitialSync main fetch execution error:", err);
      const errStr = String(err).toLowerCase();
      if (err?.code === 'permission-denied' || errStr.includes('permission')) {
        setIsPermissionDeniedError(true);
      } else if (err?.code === 'resource-exhausted' || errStr.includes('quota exceeded')) {
        setIsQuotaExceededError(true);
      }
    }
  }

  function seedLastSyncedDataRef(data: any, ratings: any, weekly: any, detailed: any, pets: any) {
    lastSyncedDataRef.current = JSON.stringify({
      completedBirdNames: data.completedBirdNames || [],
      completedInsectNames: data.completedInsectNames || [],
      completedFishNames: data.completedFishNames || [],
      completedFoodNames: data.completedFoodNames || [],
      completedGardeningNames: data.completedGardeningNames || [],
      completedOceanCleaningNames: data.completedOceanCleaningNames || [],
      ratings: ratings,
      weeklyWeather: weekly,
      detailedWeather: detailed,
      masterBirdNames: data.masterBirdNames || [],
      masterInsectNames: data.masterInsectNames || [],
      masterFishNames: data.masterFishNames || [],
      masterFoodNames: data.masterFoodNames || [],
      masterGardeningNames: data.masterGardeningNames || [],
      masterOceanCleaningNames: data.masterOceanCleaningNames || [],
      pets: pets
    });
  }

  function applyFetchedDataToLocal(fields: any, loginUid: string) {
    if (auth.currentUser?.uid !== loginUid) {
      console.warn("[Sync] applyFetchedDataToLocal: Login identity changed. Bypassing state/localStorage update.");
      return;
    }
    setCompletedBirdIds(fields.birds);
    setCompletedInsectIds(fields.insects);
    setCompletedFishIds(fields.fish);
    setCompletedFoodIds(fields.food);
    setCompletedGardeningIds(fields.gardening);
    setCompletedOceanCleaningIds(fields.oceanCleaning || new Set());
    setMasterBirdIds(fields.masterBirds);
    setMasterInsectIds(fields.masterInsects);
    setMasterFishIds(fields.masterFish);
    setMasterFoodIds(fields.masterFood);
    setMasterGardeningIds(fields.masterGardening);
    setMasterOceanCleaningIds(fields.masterOceanCleaning || new Set());
    setPets(fields.pets);
    setRatings(fields.ratings);
    setWeeklyWeather(fields.weeklyWeather);
    setDetailedWeather(fields.detailedWeather);

    localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(fields.birds)));
    localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(fields.insects)));
    localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(fields.fish)));
    localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(fields.food)));
    localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(fields.gardening)));
    localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(fields.oceanCleaning || [])));
    localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(fields.masterBirds)));
    localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(fields.masterInsects)));
    localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(fields.masterFish)));
    localStorage.setItem('master_food_ids', JSON.stringify(Array.from(fields.masterFood)));
    localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(fields.masterGardening)));
    localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(fields.masterOceanCleaning || [])));
    localStorage.setItem('pigtown_pets', JSON.stringify(fields.pets));
    localStorage.setItem('item_ratings', JSON.stringify(fields.ratings));
    localStorage.setItem('weekly_weather', JSON.stringify(fields.weeklyWeather));
    localStorage.setItem('detailed_weather', JSON.stringify(fields.detailedWeather));

    if (fields.slots && fields.slots.length > 0) {
      localStorage.setItem('farming_slots', JSON.stringify(fields.slots));
      window.dispatchEvent(new Event('storage'));
    }

    localStorage.setItem('local_collections_updated_at', Date.now().toString());
    localStorage.setItem('sync_resolved_uid', loginUid);
  }

  async function writeLocalDataToFirestore(loggedInUser: any, fields: any) {
    const userDocRef = doc(db, 'users', loggedInUser.uid);
    const birdNames = Array.from(fields.birds).map(id => dbBirds.find(b => b.id === id)?.name || id).sort();
    const insectNames = Array.from(fields.insects).map(id => dbInsects.find(i => i.id === id)?.name || id).sort();
    const fishNames = Array.from(fields.fish).map(id => dbFish.find(f => f.id === id)?.name || id).sort();
    const foodNames = Array.from(fields.food).map(id => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
    const gardeningNames = Array.from(fields.gardening).map(id => GARDENING_ITEMS.find(g => g.id === id)?.name || id).sort();
    const oceanCleaningNames = Array.from(fields.oceanCleaning || []).map(id => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort();
    const masterBirdNames = Array.from(fields.masterBirds).map(id => dbBirds.find(b => b.id === id)?.name || id).sort();
    const masterInsectNames = Array.from(fields.masterInsects).map(id => dbInsects.find(i => i.id === id)?.name || id).sort();
    const masterFishNames = Array.from(fields.masterFish).map(id => dbFish.find(f => f.id === id)?.name || id).sort();
    const masterFoodNames = Array.from(fields.masterFood).map(id => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
    const masterGardeningNames = Array.from(fields.masterGardening).map(id => GARDENING_ITEMS.find(g => g.id === id)?.name || id).sort();

    const cloudPetsForWrite = mapLocalPetsToCloud(fields.pets);

    console.count("[WRITE] setDoc");
    console.log({
      function: "writeLocalDataToFirestore",
      reason: "loginInitialSync",
      path: userDocRef.path,
      time: new Date().toISOString()
    });
    await setDoc(userDocRef, {
      uid: loggedInUser.uid,
      email: loggedInUser.email || null,
      completedBirdNames: birdNames,
      completedInsectNames: insectNames,
      completedFishNames: fishNames,
      completedFoodNames: foodNames,
      completedGardeningNames: gardeningNames,
      completedOceanCleaningNames: oceanCleaningNames,
      masterBirdNames,
      masterInsectNames,
      masterFishNames,
      masterFoodNames,
      masterGardeningNames,
      masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
      ratings: fields.ratings,
      weeklyWeather: fields.weeklyWeather,
      detailedWeather: fields.detailedWeather,
      pets: cloudPetsForWrite,
      slots: deleteField(),
      farmingSlots: (() => {
        const farmingSlotsMap: any = {};
        const slotsList = Array.isArray(fields.slots) ? fields.slots : [];
        slotsList.forEach((s: any) => {
          if (s && s.cropId !== null) {
            if (!s.instanceId) {
              s.instanceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            }
            if (!s.updatedAt) {
              s.updatedAt = Date.now();
            }
            farmingSlotsMap[s.instanceId] = s;
          }
        });
        return farmingSlotsMap;
      })(),
      lastAppVersion: APP_VERSION,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  // Subscribe to Firebase Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      const currentUid = currentUser?.uid || '';
      const previousUid = prevUserRef.current?.uid || '';
      if (currentUid !== previousUid) {
        // Reset synchronization state ONLY if the user identity has actually changed (e.g. login/logout)
        isInitialSyncDoneRef.current = false;
        setIsInitialSyncDone(false);
      }
      
      // 로그인 상태 확인 후 버전 로그 기록 (중복 방지는 logVersion 내부에서 처리됨)
      logVersion(APP_VERSION, currentUser?.uid, currentUser?.email);

      if (currentUser) {
        // First login sync alert
        // Removed sync alert logic

        // One-time secure sync of email on login to avoid listener loops back and forth
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (currentUser.email && (!snap.exists() || snap.data()?.email !== currentUser.email)) {
             console.count("[WRITE] setDoc");
             console.log({
               function: "onAuthStateChanged",
               reason: "loginEmailSync",
               path: userDocRef.path,
               time: new Date().toISOString()
             });
             await setDoc(userDocRef, { email: currentUser.email, lastAppVersion: APP_VERSION, updatedAt: serverTimestamp() }, { merge: true });
          }
        } catch (err) {}

        // Launch separated runInitialSync!
        runInitialSync(currentUser);
      }
    });

    // Add beforeunload listener to force sync if possible
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If we have unsynced changes, try to warn the user (only for logged-in users who have active cloud sync)
      if (auth.currentUser && localStorage.getItem('has_unsynced_changes') === 'true') {
        const msg = '진행 중인 데이터 동기화가 아직 완료되지 않았습니다. 지금 종료하면 변경 사항이 사라지거나 다음에 접속할 때 처리됩니다. 정말 종료하시겠습니까?';
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload, { capture: true });

    const handleOnline = () => {
      console.log("[Sync] Network returned. Checking for unsynced changes...");
      if (user && isInitialSyncDone && localStorage.getItem('has_unsynced_changes') === 'true') {
        isDirtyRef.current = true;
        debouncedSyncAllData();
      }
    };
    window.addEventListener('online', handleOnline);

    const handleVisibilityChange = async () => {
      if (document.hidden === true) {
        console.log("[Sync] Tab hidden / entered background. Checking for unsynced changes...");
        const hasUnsynced = localStorage.getItem('has_unsynced_changes') === 'true';
        // Use Ref instead of state to ensure freshest values in listener
        if (auth.currentUser && isInitialSyncDoneRef.current && (hasUnsynced || isDirtyRef.current)) {
          try {
            console.log("[Sync] Unsynced changes detected. Attempting background forceSyncAllData...");
            // Force immediate execution with skipVerify for maximum speed during exit
            await forceSyncAllData(auth.currentUser, true);
            console.log("[Sync] Background forceSyncAllData successful.");
          } catch (err) {
            console.warn("[Sync] Background forceSyncAllData failed on visibilitychange:", err);
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Safety check for stuck unsynced changes on mount and periodically
    const syncCheckInterval = setInterval(() => {
      if (user && isInitialSyncDone && localStorage.getItem('has_unsynced_changes') === 'true') {
        console.log("[Sync] Safety check: triggering sync for leftover changes.");
        isDirtyRef.current = true;
        debouncedSyncAllData(1500); 
      }
    }, 15000); // 15s check

    return () => {
      unsubscribe();
      clearInterval(syncCheckInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Remove automated scroll logic as it causes erratic layout jumps.

  const isResetting = useRef(false);

  // NEW SYSTEM PASSIVE ON-SNAPSHOT REAL-TIME SYNC
  useEffect(() => {
    if (!user || !isInitialSyncDone) {
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const activeUnsubscribe = onSnapshot(userDocRef, (snapshot) => {
      let cloudPetsRaw: any[] = [];
      console.log(`[SNAPSHOT] passive_user_doc - path: ${userDocRef.path}, exists: ${snapshot.exists()}, hasPendingWrites: ${snapshot.metadata.hasPendingWrites}`);
      if (auth.currentUser?.uid !== user.uid) {
        console.warn("[Sync] Passive onSnapshot: active current identity is different from listener context. Ignoring.");
        return;
      }
      console.log("[Sync] Passive onSnapshot triggered for user:", user.uid);
      try {
        if (isResetting.current) return;
        if (snapshot.metadata.hasPendingWrites) {
          console.log("[Sync] Snapshot has pending writes, skipping passive update to prevent loops.");
          return;
        }

        if (snapshot.exists()) {
          const data = snapshot.data();
          const cloudUpdatedAt = data.updatedAt ? data.updatedAt.toDate().getTime() : 0;
          const localUpdatedAt = parseInt(localStorage.getItem('local_collections_updated_at') || '0', 10);

          // If the cloud update is older than local edit timestamp, ignore it to prevent overwriting newer edits
          if (cloudUpdatedAt < localUpdatedAt - 1500) {
            console.log("[Sync] Passive update received older than local edit, preserving local edit.");
            return;
          }

          // Convert cloud names back to IDs
          const cloudBirdsList = (data.completedBirdNames || []).map((name: string) => ALL_BIRDS_MAP.find(b => b.name === name || b.id === name)?.id || name);
          const cloudInsectsList = (data.completedInsectNames || []).map((name: string) => ALL_INSECTS_MAP.find(i => i.name === name || i.id === name)?.id || name);
          const cloudFishList = (data.completedFishNames || []).map((name: string) => ALL_FISH_MAP.find(f => f.name === name || f.id === name)?.id || name);
          const cloudCookingList = (data.completedFoodNames || []).map((name: string) => ALL_COOKING_MAP.find(c => c.name === name || c.id === name)?.id || name);
          const cloudGardeningList = (data.completedGardeningNames || []).map((name: string) => ALL_GARDENING_MAP.find(g => g.name === name || g.id === name)?.id || name);
          const cloudOceanCleaningList = (data.completedOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);
          
          const cloudMasterBirdsList = (data.masterBirdNames || []).map((name: string) => ALL_BIRDS_MAP.find(b => b.name === name || b.id === name)?.id || name);
          const cloudMasterInsectsList = (data.masterInsectNames || []).map((name: string) => ALL_INSECTS_MAP.find(i => i.name === name || i.id === name)?.id || name);
          const cloudMasterFishList = (data.masterFishNames || []).map((name: string) => ALL_FISH_MAP.find(f => f.name === name || f.id === name)?.id || name);
          const cloudMasterCookingList = (data.masterFoodNames || []).map((name: string) => ALL_COOKING_MAP.find(c => c.name === name || c.id === name)?.id || name);
          const cloudMasterGardeningList = (data.masterGardeningNames || []).map((name: string) => ALL_GARDENING_MAP.find(g => g.name === name || g.id === name)?.id || name);
          const cloudMasterOceanCleaningList = (data.masterOceanCleaningNames || []).map((name: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id || name);

          const cloudBirds = new Set<string>(cloudBirdsList);
          const cloudInsects = new Set<string>(cloudInsectsList);
          const cloudFish = new Set<string>(cloudFishList);
          const cloudFood = new Set<string>(cloudCookingList);
          const cloudGardening = new Set<string>(cloudGardeningList);
          const cloudOceanCleaning = new Set<string>(cloudOceanCleaningList || []);
          
          const cloudMasterBirds = new Set<string>(cloudMasterBirdsList);
          const cloudMasterInsects = new Set<string>(cloudMasterInsectsList);
          const cloudMasterFish = new Set<string>(cloudMasterFishList);
          const cloudMasterFood = new Set<string>(cloudMasterCookingList);
          const cloudMasterGardening = new Set<string>(cloudMasterGardeningList);
          const cloudMasterOceanCleaning = new Set<string>(cloudMasterOceanCleaningList || []);

          const cloudRatings = data.ratings || {};
          const cloudWeeklyWeather = cleanWeeklyWeather(data.weeklyWeather);
        const cloudDetailedWeather = data.detailedWeather || {};
        cloudPetsRaw = data.pets || [];
          const cloudPets = mapCloudPetsToLocal(cloudPetsRaw);

          // Check if data actually changed
          const localBirdsStr = localStorage.getItem('completed_bird_ids');
          const localInsectsStr = localStorage.getItem('completed_insect_ids');
          const localFishStr = localStorage.getItem('completed_fish_ids');
          const localFoodStr = localStorage.getItem('completed_food_ids');
          const localGardeningStr = localStorage.getItem('completed_gardening_ids');
          const localOceanCleaningStr = localStorage.getItem('completed_ocean_cleaning_ids');
          const localMasterBirdsStr = localStorage.getItem('master_bird_ids');
          const localMasterInsectsStr = localStorage.getItem('master_insect_ids');
          const localMasterFishStr = localStorage.getItem('master_fish_ids');
          const localMasterFoodStr = localStorage.getItem('master_food_ids');
          const localMasterGardeningStr = localStorage.getItem('master_gardening_ids');
          const localMasterOceanCleaningStr = localStorage.getItem('master_ocean_cleaning_ids');
          const localPetsStr = localStorage.getItem('pigtown_pets');
          const localRatingsStr = localStorage.getItem('item_ratings');
          const localWeeklyStr = localStorage.getItem('weekly_weather');
          const localDetailedStr = localStorage.getItem('detailed_weather');

          const localBirds = new Set<string>(safeJsonParse(localBirdsStr, []));
          const localInsects = new Set<string>(safeJsonParse(localInsectsStr, []));
          const localFish = new Set<string>(safeJsonParse(localFishStr, []));
          const localFood = new Set<string>(safeJsonParse(localFoodStr, []));
          const localGardening = new Set<string>(safeJsonParse(localGardeningStr, []));
          const localOceanCleaning = new Set<string>(safeJsonParse(localOceanCleaningStr, []));
          const localMasterBirds = new Set<string>(safeJsonParse(localMasterBirdsStr, []));
          const localMasterInsects = new Set<string>(safeJsonParse(localMasterInsectsStr, []));
          const localMasterFish = new Set<string>(safeJsonParse(localMasterFishStr, []));
          const localMasterFood = new Set<string>(safeJsonParse(localMasterFoodStr, []));
          const localMasterGardening = new Set<string>(safeJsonParse(localMasterGardeningStr, []));
          const localMasterOceanCleaning = new Set<string>(safeJsonParse(localMasterOceanCleaningStr, []));
          const localPets = safeJsonParse(localPetsStr, []);
          const localRatings = safeJsonParse(localRatingsStr, {});
          const localWeekly = safeJsonParse(localWeeklyStr, {});
          const localDetailed = safeJsonParse(localDetailedStr, {});

          const isSetDiff = (s1: Set<string>, s2: Set<string>) => {
            if (s1.size !== s2.size) return true;
            for (const elem of s1) {
              if (!s2.has(elem)) return true;
            }
            return false;
          };

          let dataActuallyChanged = false;
          if (isSetDiff(cloudBirds, localBirds)) dataActuallyChanged = true;
          if (isSetDiff(cloudInsects, localInsects)) dataActuallyChanged = true;
          if (isSetDiff(cloudFish, localFish)) dataActuallyChanged = true;
          if (isSetDiff(cloudFood, localFood)) dataActuallyChanged = true;
          if (isSetDiff(cloudGardening, localGardening)) dataActuallyChanged = true;
          if (isSetDiff(cloudOceanCleaning, localOceanCleaning)) dataActuallyChanged = true;
          
          if (isSetDiff(cloudMasterBirds, localMasterBirds)) dataActuallyChanged = true;
          if (isSetDiff(cloudMasterInsects, localMasterInsects)) dataActuallyChanged = true;
          if (isSetDiff(cloudMasterFish, localMasterFish)) dataActuallyChanged = true;
          if (isSetDiff(cloudMasterFood, localMasterFood)) dataActuallyChanged = true;
          if (isSetDiff(cloudMasterGardening, localMasterGardening)) dataActuallyChanged = true;
          if (isSetDiff(cloudMasterOceanCleaning, localMasterOceanCleaning)) dataActuallyChanged = true;

          if (JSON.stringify(cloudRatings) !== JSON.stringify(localRatings)) dataActuallyChanged = true;
          if (JSON.stringify(cloudWeeklyWeather) !== JSON.stringify(localWeekly)) dataActuallyChanged = true;
          if (JSON.stringify(cloudDetailedWeather) !== JSON.stringify(localDetailed)) dataActuallyChanged = true;
          if (JSON.stringify(cloudPets) !== JSON.stringify(localPets)) dataActuallyChanged = true;

          if (dataActuallyChanged) {
            console.log("[Sync] Adopting passive update from cloud...");
            setCompletedBirdIds(cloudBirds);
            setCompletedInsectIds(cloudInsects);
            setCompletedFishIds(cloudFish);
            setCompletedFoodIds(cloudFood);
            setCompletedGardeningIds(cloudGardening);
            setCompletedOceanCleaningIds(cloudOceanCleaning);
            setMasterBirdIds(cloudMasterBirds);
            setMasterInsectIds(cloudMasterInsects);
            setMasterFishIds(cloudMasterFish);
            setMasterFoodIds(cloudMasterFood);
            setMasterGardeningIds(cloudMasterGardening);
            setMasterOceanCleaningIds(cloudMasterOceanCleaning);
            setPets(cloudPets);
            setRatings(cloudRatings);
            setWeeklyWeather(cloudWeeklyWeather);
            setDetailedWeather(cloudDetailedWeather);

            localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(cloudBirds)));
            localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(cloudInsects)));
            localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(cloudFish)));
            localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(cloudFood)));
            localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(cloudGardening)));
            localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(cloudOceanCleaning)));
            localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(cloudMasterBirds)));
            localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(cloudMasterInsects)));
            localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(cloudMasterFish)));
            localStorage.setItem('master_food_ids', JSON.stringify(Array.from(cloudMasterFood)));
            localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(cloudMasterGardening)));
            localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(cloudMasterOceanCleaning)));
            localStorage.setItem('pigtown_pets', JSON.stringify(cloudPets));
            localStorage.setItem('item_ratings', JSON.stringify(cloudRatings));
            localStorage.setItem('weekly_weather', JSON.stringify(cloudWeeklyWeather));
            localStorage.setItem('detailed_weather', JSON.stringify(cloudDetailedWeather));
            localStorage.setItem('local_collections_updated_at', cloudUpdatedAt.toString());
          }

          seedLastSyncedDataRef(data, cloudRatings, cloudWeeklyWeather, cloudDetailedWeather, cloudPetsRaw);
        }
      } catch (err: any) {
        console.error("실시간 동기화 스냅샷 처리 중 오류 발생:", err);
      }
    }, (error) => {
      console.error("Firestore 실시간 동기화 오류 리스너 수신:", error);
    });

    return () => { activeUnsubscribe(); };
  }, [user, isInitialSyncDone, dbBirds, dbInsects, dbFish]);

  // Real-time Cloud Synchronization for Collections with Automatic Bidirectional Merge
  useEffect(() => {
    if (!user) {
      if (globalSyncTimerRef.current) {
        clearTimeout(globalSyncTimerRef.current);
        globalSyncTimerRef.current = null;
      }
      isDirtyRef.current = false;

      const wasResolved = prevUserRef.current && localStorage.getItem('sync_resolved_uid') === prevUserRef.current.uid;
      if (prevUserRef.current && wasResolved) {
        // CLEAR local storage on logout ONLY if the session was successfully synced (resolved)
        // This prevents wiping guest progress if a user cancels login at the conflict popup.
        localStorage.removeItem('completed_bird_ids');
        localStorage.removeItem('completed_insect_ids');
        localStorage.removeItem('completed_fish_ids');
        localStorage.removeItem('completed_food_ids');
        localStorage.removeItem('master_bird_ids');
        localStorage.removeItem('master_insect_ids');
        localStorage.removeItem('master_fish_ids');
        localStorage.removeItem('master_food_ids');
        localStorage.removeItem('pigtown_pets');
        localStorage.removeItem('item_ratings');
        localStorage.removeItem('pigtown_gardening_ratings');
        localStorage.removeItem('completed_gardening_ids');
        localStorage.removeItem('master_gardening_ids');
        localStorage.removeItem('weekly_weather');
        localStorage.removeItem('detailed_weather');
        localStorage.removeItem('farming_slots');
        localStorage.removeItem('tg_bot_token');
        localStorage.removeItem('tg_chat_id');
        localStorage.removeItem('tg_gas_url');
        localStorage.removeItem('sync_resolved_uid');
        localStorage.removeItem('local_collections_updated_at');
        localStorage.removeItem('has_unsynced_changes');
        localStorage.removeItem('local_farming_updated_at');
        localStorage.removeItem('farming_write_lock_at');
        setCompletedBirdIds(new Set());
        setCompletedInsectIds(new Set());
        setCompletedFishIds(new Set());
        setCompletedFoodIds(new Set());
        setCompletedGardeningIds(new Set());
        setMasterBirdIds(new Set());
        setMasterInsectIds(new Set());
        setMasterFishIds(new Set());
        setMasterFoodIds(new Set());
        setMasterGardeningIds(new Set());
        setPets([]);
        setRatings({});
        setWeeklyWeather({});
        setDetailedWeather({});
      } else {
        // Restore offline local values (initial guest load)
        const savedBirds = localStorage.getItem('completed_bird_ids');
        const savedInsects = localStorage.getItem('completed_insect_ids');
        const savedFish = localStorage.getItem('completed_fish_ids');
        const savedFood = localStorage.getItem('completed_food_ids');
        const savedGardening = localStorage.getItem('completed_gardening_ids');
        setCompletedBirdIds(new Set(safeJsonParse(savedBirds, [])));
        setCompletedInsectIds(new Set(safeJsonParse(savedInsects, [])));
        setCompletedFishIds(new Set(safeJsonParse(savedFish, [])));
        setCompletedFoodIds(new Set(safeJsonParse(savedFood, [])));
        setCompletedGardeningIds(new Set(safeJsonParse(savedGardening, [])));

        const savedMasterBirds = localStorage.getItem('master_bird_ids');
        const savedMasterInsects = localStorage.getItem('master_insect_ids');
        const savedMasterFish = localStorage.getItem('master_fish_ids');
        const savedMasterFood = localStorage.getItem('master_food_ids');
        const savedMasterGardening = localStorage.getItem('master_gardening_ids');
        setMasterBirdIds(new Set(safeJsonParse(savedMasterBirds, [])));
        setMasterInsectIds(new Set(safeJsonParse(savedMasterInsects, [])));
        setMasterFishIds(new Set(safeJsonParse(savedMasterFish, [])));
        setMasterFoodIds(new Set(safeJsonParse(savedMasterFood, [])));
        setMasterGardeningIds(new Set(safeJsonParse(savedMasterGardening, [])));
        
        const savedRatings = localStorage.getItem('item_ratings');
        setRatings(safeJsonParse(savedRatings, {}));
        const savedWeekly = localStorage.getItem('weekly_weather');
        setWeeklyWeather(safeJsonParse(savedWeekly, {}));
        const savedDetailed = localStorage.getItem('detailed_weather');
        setDetailedWeather(safeJsonParse(savedDetailed, {}));
        const savedPets = localStorage.getItem('pigtown_pets');
        setPets(safeJsonParse(savedPets, []));
      }
      prevUserRef.current = null;
      return;
    }

    prevUserRef.current = user;
    const userDocRef = doc(db, 'users', user.uid);
    let isInitialSyncDoneLocal = localStorage.getItem('sync_resolved_uid') === user.uid;
    isInitialSyncDoneRef.current = isInitialSyncDoneLocal;
    setIsInitialSyncDone(isInitialSyncDoneLocal);
    let isFirstSnapshot = true;

    let activeUnsubscribe: any = null;
    // DEPRECATED LEGACY REAL-TIME SYNC - Completely bypassed to prevent conflict anomalies.
    if (false as boolean) {
      // @ts-ignore
      activeUnsubscribe = onSnapshot(userDocRef, async (snapshot) => {
      console.log("[Sync] onSnapshot triggered for user:", user.uid, "exists:", snapshot.exists());
      try {
        if (isResetting.current) {
          console.log("[Sync] isResetting is true, bypassing snapshot");
          return;
        }

        // Bypassing snapshot update if there are pending Firestore SDK writes, 
        // ONLY if the initial login synchronization has already executed and completed.
        // Doing this ensures the initial login sync of existing users doesn't get blocked
        // by version/email update operations triggered concurrently during the login process.
        if (snapshot.metadata.hasPendingWrites && isInitialSyncDoneRef.current) {
          return;
        }

        // Get snapshot user data and check existence
        const data = snapshot.data();
        const docExists = snapshot.exists();
        console.log("[Sync] docExists:", docExists, "isInitialSyncDone:", isInitialSyncDoneRef.current, "isFirstSnapshot:", isFirstSnapshot);
        const cloudUpdatedAt = (docExists && data && data.updatedAt) ? data.updatedAt.toDate().getTime() : 0;
        
        if (docExists && data) {
          // Conflict Resolution: Check timestamps
          const localLastWriteAt = parseInt(localStorage.getItem('local_last_write_at') || '0', 10);

          // Ignore cloud update ONLY if we have already completed the initial sync and the cloud data is stale.
          // This keeps concurrent sessions safe without blocking the initial data load on login.
          if (!isFirstSnapshot && isInitialSyncDoneRef.current && cloudUpdatedAt < localLastWriteAt - 2000) {
            return;
          }

          // Detect if there are unsynced local changes (due to refresh interrupting a planned sync)
          // CRITICAL: We only bypass initial sync if this is an interrupted session of the SAME logged-in user.
          // If sync_resolved_uid !== user.uid, the unsynced changes are guest/anonymous progress, and we MUST
          // run the initial sync comparison so we can trigger conflict modals or handle automatic merge!
          const isSameUserSession = localStorage.getItem('sync_resolved_uid') === user.uid;
          if (localStorage.getItem('has_unsynced_changes') === 'true' && isSameUserSession) {
            setIsSyncingBeforeReload(true); // Start showing the syncing UI
            // Resurrection Prevention: If cloud is significantly newer than the local interrupted session,
            // we should NOT blindly push. We check if cloud was updated AFTER our local lock time.
            const localUpdatedAt = parseInt(localStorage.getItem('local_collections_updated_at') || '0', 10);

            // If cloud is newer by more than 2 seconds than our last local update,
            // we treat it as an external conflict. We do NOT return here, letting it fall through
            // to the normal comparison and conflict resolution logic below.
            if (cloudUpdatedAt > localUpdatedAt + 2000) {
              console.warn("[Sync] Resurrection Risk: External cloud changes detected during interrupted session. Re-triggering conflict check.");
              setIsSyncingBeforeReload(false); // Stop showing syncing UI
              // Force initial sync to false so the fall-through logic triggers the conflict modal
              isInitialSyncDoneRef.current = false;
              setIsInitialSyncDone(false);
            } else {
              isFirstSnapshot = false;
              // We mark initial sync as done because this is the same user session that has already resolved conflict.
              setIsInitialSyncDone(true);
              isInitialSyncDoneRef.current = true;

              // Seed the lastSyncedDataRef with the cloud snapshot data so that we have a baseline
              lastSyncedDataRef.current = JSON.stringify({
                completedBirdNames: data.completedBirdNames || [],
                completedInsectNames: data.completedInsectNames || [],
                completedFishNames: data.completedFishNames || [],
                completedFoodNames: data.completedFoodNames || [],
                completedGardeningNames: data.completedGardeningNames || [],
                ratings: data.ratings || {},
                weeklyWeather: cleanWeeklyWeather(data.weeklyWeather || {}),
                detailedWeather: data.detailedWeather || {},
                masterBirdNames: data.masterBirdNames || [],
                masterInsectNames: data.masterInsectNames || [],
                masterFishNames: data.masterFishNames || [],
                masterFoodNames: data.masterFoodNames || [],
                masterGardeningNames: data.masterGardeningNames || [],
                pets: data.pets || []
              });

              // Trigger the interrupted sync manually since the previous debounce was cleared by refresh
              if (user && !isDirtyRef.current) {
                 isDirtyRef.current = true;
                 // Use shorter delay for recovery sync (800ms vs 3000ms)
                debouncedSyncAllData(800);
              }
              setIsSyncingBeforeReload(false); // Stop showing syncing UI
              return; // Exit onSnapshot early because we completed the recovery!
            }
          }
        }

        const savedBirds = localStorage.getItem('completed_bird_ids');
        const savedInsects = localStorage.getItem('completed_insect_ids');
        const savedFish = localStorage.getItem('completed_fish_ids');
        const savedFood = localStorage.getItem('completed_food_ids');
        const savedGardening = localStorage.getItem('completed_gardening_ids');
        const savedMasterBirds = localStorage.getItem('master_bird_ids');
        const savedMasterInsects = localStorage.getItem('master_insect_ids');
        const savedMasterFish = localStorage.getItem('master_fish_ids');
        const savedMasterFood = localStorage.getItem('master_food_ids');
        const savedMasterGardening = localStorage.getItem('master_gardening_ids');
        const savedPets = localStorage.getItem('pigtown_pets');
        const savedRatings = localStorage.getItem('item_ratings');
        const savedWeekly = localStorage.getItem('weekly_weather');
        const savedDetailed = localStorage.getItem('detailed_weather');

        const localBirds = new Set<string>(safeJsonParse(savedBirds, []));
        const localInsects = new Set<string>(safeJsonParse(savedInsects, []));
        const localFish = new Set<string>(safeJsonParse(savedFish, []));
        const localFood = new Set<string>(safeJsonParse(savedFood, []));
        const localGardening = new Set<string>(safeJsonParse(savedGardening, []));
        const localMasterBirds = new Set<string>(safeJsonParse(savedMasterBirds, []));
        const localMasterInsects = new Set<string>(safeJsonParse(savedMasterInsects, []));
        const localMasterFish = new Set<string>(safeJsonParse(savedMasterFish, []));
        const localMasterFood = new Set<string>(safeJsonParse(savedMasterFood, []));
        const localMasterGardening = new Set<string>(safeJsonParse(savedMasterGardening, []));
        const savedOceanCleaning = localStorage.getItem('completed_ocean_cleaning_ids');
        const localOceanCleaning = new Set<string>(safeJsonParse(savedOceanCleaning, []));
        const savedMasterOceanCleaning = localStorage.getItem('master_ocean_cleaning_ids');
        const localMasterOceanCleaning = new Set<string>(safeJsonParse(savedMasterOceanCleaning, []));
        const localPets = safeJsonParse(savedPets, []);
        const localRatings = safeJsonParse(savedRatings, {});
        const localWeekly = cleanWeeklyWeather(safeJsonParse(savedWeekly, {}));
        const localDetailed = safeJsonParse(savedDetailed, {});

        const areSetsIdentical = (a: Set<string>, b: Set<string>) => {
          if (a.size !== b.size) return false;
          for (const item of a) {
            if (!b.has(item)) return false;
          }
          return true;
        };

        const areRatingsIdentical = (a: Record<string, number>, b: Record<string, number>) => {
          const keysA = Object.keys(a);
          const keysB = Object.keys(b);
          if (keysA.length !== keysB.length) return false;
          return keysA.every(key => a[key] === b[key]);
        };

        const areWeathersIdentical = (a: Record<string, any>, b: Record<string, any>) => JSON.stringify(a) === JSON.stringify(b);
        const arePetsIdentical = (a: any[], b: any[]) => JSON.stringify(a) === JSON.stringify(b);

        if (snapshot.exists()) {
          // Prepare cloud data sets early
          const cloudBirdNames = (data.completedBirdNames || []) as string[];
          const cloudInsectNames = (data.completedInsectNames || []) as string[];
          const cloudFishNames = (data.completedFishNames || []) as string[];
          const cloudFoodNames = (data.completedFoodNames || []) as string[];
          const cloudGardeningNames = (data.completedGardeningNames || []) as string[];
          const cloudOceanCleaningNames = (data.completedOceanCleaningNames || []) as string[];
          const cloudMasterBirdNames = (data.masterBirdNames || []) as string[];
          const cloudMasterInsectNames = (data.masterInsectNames || []) as string[];
          const cloudMasterFishNames = (data.masterFishNames || []) as string[];
          const cloudMasterFoodNames = (data.masterFoodNames || []) as string[];
          const cloudMasterGardeningNames = (data.masterGardeningNames || []) as string[];
          const cloudMasterOceanCleaningNames = (data.masterOceanCleaningNames || []) as string[];
          const cloudRatings = (data.ratings || {}) as Record<string, number>;
          const rawWeekly = data.weeklyWeather || {};
          const cloudWeeklyWeather = cleanWeeklyWeather(rawWeekly);

          // Clean legacy numeric keys from Firestore automatically
          const legacyKeys = Object.keys(rawWeekly).filter(key => !/^\d{4}-\d{2}-\d{2}$/.test(key));
          if (legacyKeys.length > 0) {
            const cleanWeeklyUpdate: Record<string, any> = {};
            legacyKeys.forEach(k => {
              cleanWeeklyUpdate[`weeklyWeather.${k}`] = deleteField();
            });
            cleanWeeklyUpdate['lastAppVersion'] = APP_VERSION;
            cleanWeeklyUpdate['updatedAt'] = serverTimestamp();
            console.count("[WRITE] updateDoc");
            console.log({
              function: "onSnapshotUserCleanup",
              reason: "cleanLegacyWeatherKeys",
              path: userDocRef.path,
              time: new Date().toISOString()
            });
            updateDoc(userDocRef, cleanWeeklyUpdate).catch(err => {
              console.error("Failed to clean legacy weather keys from database:", err);
            });
          }
          const cloudDetailedWeather = data.detailedWeather || {};
          const cloudPetsRaw = data.pets || [];
          const cloudPets = mapCloudPetsToLocal(cloudPetsRaw);

          const cloudBirds = new Set<string>(cloudBirdNames.map(name => ALL_BIRDS_MAP.find(b => b.name === name || b.id === name)?.id).filter(Boolean) as string[]);
          const cloudInsects = new Set<string>(cloudInsectNames.map(name => ALL_INSECTS_MAP.find(i => i.name === name || i.id === name)?.id).filter(Boolean) as string[]);
          const cloudFish = new Set<string>(cloudFishNames.map(name => ALL_FISH_MAP.find(f => f.name === name || f.id === name)?.id).filter(Boolean) as string[]);
          const cloudFood = new Set<string>(cloudFoodNames.map(name => ALL_COOKING_MAP.find(c => c.name === name || c.id === name)?.id).filter(Boolean) as string[]);
          const cloudGardening = new Set<string>(cloudGardeningNames.map(name => ALL_GARDENING_MAP.find(g => g.name === name || g.id === name)?.id).filter(Boolean) as string[]);
          const cloudOceanCleaning = new Set<string>(cloudOceanCleaningNames.map(name => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id).filter(Boolean) as string[]);
          const cloudMasterBirds = new Set<string>(cloudMasterBirdNames.map(name => ALL_BIRDS_MAP.find(b => b.name === name || b.id === name)?.id).filter(Boolean) as string[]);
          const cloudMasterInsects = new Set<string>(cloudMasterInsectNames.map(name => ALL_INSECTS_MAP.find(i => i.name === name || i.id === name)?.id).filter(Boolean) as string[]);
          const cloudMasterFish = new Set<string>(cloudMasterFishNames.map(name => ALL_FISH_MAP.find(f => f.name === name || f.id === name)?.id).filter(Boolean) as string[]);
          const cloudMasterFood = new Set<string>(cloudMasterFoodNames.map(name => ALL_COOKING_MAP.find(c => c.name === name || c.id === name)?.id).filter(Boolean) as string[]);
          const cloudMasterGardening = new Set<string>(cloudMasterGardeningNames.map(name => ALL_GARDENING_MAP.find(g => g.name === name || g.id === name)?.id).filter(Boolean) as string[]);
          const cloudMasterOceanCleaning = new Set<string>(cloudMasterOceanCleaningNames.map(name => ALL_OCEAN_CLEANING_MAP.find(o => o.name === name || o.id === name)?.id).filter(Boolean) as string[]);

          // Check if data is actually different from current local state
          const isDataTrulyDifferent = 
            !areSetsIdentical(cloudBirds, localBirds) ||
            !areSetsIdentical(cloudInsects, localInsects) ||
            !areSetsIdentical(cloudFish, localFish) ||
            !areSetsIdentical(cloudFood, localFood) ||
            !areSetsIdentical(cloudGardening, localGardening) ||
            !areSetsIdentical(cloudMasterBirds, localMasterBirds) ||
            !areSetsIdentical(cloudMasterInsects, localMasterInsects) ||
            !areSetsIdentical(cloudMasterFish, localMasterFish) ||
            !areSetsIdentical(cloudMasterFood, localMasterFood) ||
            !areSetsIdentical(cloudMasterGardening, localMasterGardening) ||
            !areRatingsIdentical(cloudRatings, localRatings) ||
            !arePetsIdentical(cloudPets, localPets) ||
            !areWeathersIdentical(cloudWeeklyWeather, localWeekly) ||
            !areWeathersIdentical(cloudDetailedWeather, localDetailed);

          if (!isDataTrulyDifferent && isInitialSyncDoneRef.current) return;

          // --- INITIAL SYNC LOGIC ---

          if (!isInitialSyncDoneRef.current) {
            const hasLocalProgress = localBirds.size > 0 || localInsects.size > 0 || localFish.size > 0 || localFood.size > 0 || localGardening.size > 0 || Object.keys(localRatings).length > 0 || localPets.length > 0;
            const hasCloudProgress = cloudBirds.size > 0 || cloudInsects.size > 0 || cloudFish.size > 0 || cloudFood.size > 0 || cloudGardening.size > 0 || cloudOceanCleaning.size > 0 || cloudPets.length > 0 || Object.keys(cloudRatings).length > 0;

            const isDifferent = 
              localBirds.size !== cloudBirds.size ||
              Array.from(localBirds).some(id => !cloudBirds.has(id)) ||
              localInsects.size !== cloudInsects.size ||
              Array.from(localInsects).some(id => !cloudInsects.has(id)) ||
              localFish.size !== cloudFish.size ||
              Array.from(localFish).some(id => !cloudFish.has(id)) ||
              localFood.size !== cloudFood.size ||
              Array.from(localFood).some(id => !cloudFood.has(id)) ||
              localGardening.size !== cloudGardening.size ||
              Array.from(localGardening).some(id => !cloudGardening.has(id)) ||
              localOceanCleaning.size !== cloudOceanCleaning.size ||
              Array.from(localOceanCleaning).some(id => !cloudOceanCleaning.has(id)) ||
              localMasterOceanCleaning.size !== cloudMasterOceanCleaning.size ||
              Array.from(localMasterOceanCleaning).some(id => !cloudMasterOceanCleaning.has(id)) ||
              !arePetsIdentical(localPets, cloudPets) ||
              !areRatingsIdentical(localRatings, cloudRatings);

            if (hasLocalProgress && hasCloudProgress && isDifferent) {
              const rawLocalSlots = localStorage.getItem('farming_slots');
              const localSlotsList = safeJsonParse(rawLocalSlots, []);
              const cloudSlotsRaw = data.slots || [];
              const cloudSlotsList = Array.isArray(cloudSlotsRaw) 
                ? cloudSlotsRaw 
                : Object.keys(cloudSlotsRaw).sort().map(k => ({ ...cloudSlotsRaw[k], id: k }));
              const localActiveSlotsCount = localSlotsList.filter((s: any) => s && s.cropId !== null).length;
              const cloudActiveSlotsCount = cloudSlotsList.filter((s: any) => s && s.cropId !== null).length;

              setSyncConflict({
                localCount: localBirds.size + localInsects.size + localFish.size + localFood.size + localGardening.size,
                cloudCount: cloudBirds.size + cloudInsects.size + cloudFish.size + cloudFood.size + cloudGardening.size,
                localPetsCount: localPets.length,
                cloudPetsCount: cloudPets.length,
                localActiveSlotsCount,
                cloudActiveSlotsCount,
                resolve: async (choice: 'cloud' | 'merge' | 'local') => {
                  try {
                    isResetting.current = true;
                    setIsSyncingBeforeReload(false); // Hide syncing UI on conflict resolution
                    if (choice === 'cloud') {
                      setCompletedBirdIds(cloudBirds);
                      setCompletedInsectIds(cloudInsects);
                      setCompletedFishIds(cloudFish);
                      setCompletedFoodIds(cloudFood);
                      setCompletedGardeningIds(cloudGardening);
                      setCompletedOceanCleaningIds(cloudOceanCleaning);
                      setMasterBirdIds(cloudMasterBirds);
                      setMasterInsectIds(cloudMasterInsects);
                      setMasterFishIds(cloudMasterFish);
                      setMasterFoodIds(cloudMasterFood);
                      setMasterGardeningIds(cloudMasterGardening);
                      setMasterOceanCleaningIds(cloudMasterOceanCleaning);
                      setPets(cloudPets);
                      setRatings(cloudRatings);
                      setWeeklyWeather(cloudWeeklyWeather);
                      setDetailedWeather(cloudDetailedWeather);

                      localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(cloudBirds)));
                      localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(cloudInsects)));
                      localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(cloudFish)));
                      localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(cloudFood)));
                      localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(cloudGardening)));
                      localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(cloudOceanCleaning)));
                      localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(cloudMasterBirds)));
                      localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(cloudMasterInsects)));
                      localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(cloudMasterFish)));
                      localStorage.setItem('master_food_ids', JSON.stringify(Array.from(cloudMasterFood)));
                      localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(cloudMasterGardening)));
                      localStorage.setItem('pigtown_pets', JSON.stringify(cloudPets));
                      localStorage.setItem('item_ratings', JSON.stringify(cloudRatings));
                      localStorage.setItem('weekly_weather', JSON.stringify(cloudWeeklyWeather));
                      localStorage.setItem('detailed_weather', JSON.stringify(cloudDetailedWeather));
                      localStorage.setItem('local_collections_updated_at', cloudUpdatedAt.toString());
                      localStorage.setItem('sync_resolved_uid', user.uid);
                    } else if (choice === 'local') {
                      const birdNames = Array.from(localBirds).map(id => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id);
                      const insectNames = Array.from(localInsects).map(id => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id);
                      const fishNames = Array.from(localFish).map(id => ALL_FISH_MAP.find(f => f.id === id)?.name || id);
                      const foodNames = Array.from(localFood).map(id => ALL_COOKING_MAP.find(c => c.id === id)?.name || id);
                      const gardeningNames = Array.from(localGardening).map(id => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id);
                      const masterBirdNames = Array.from(localMasterBirds).map(id => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id);
                      const masterInsectNames = Array.from(localMasterInsects).map(id => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id);
                      const masterFishNames = Array.from(localMasterFish).map(id => ALL_FISH_MAP.find(f => f.id === id)?.name || id);
                      const masterFoodNames = Array.from(localMasterFood).map(id => ALL_COOKING_MAP.find(c => c.id === id)?.name || id);
                      const masterGardeningNames = Array.from(localMasterGardening).map(id => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id);

                      const cloudPetsForWrite = mapLocalPetsToCloud(localPets);

                      console.count("[WRITE] setDoc");
                      console.log({
                        function: "runInitialSync_conflict_resolution",
                        reason: "local_wins",
                        path: userDocRef.path,
                        time: new Date().toISOString()
                      });
                      await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email || null,
                        completedBirdNames: birdNames,
                        completedInsectNames: insectNames,
                        completedFishNames: fishNames,
                        completedFoodNames: foodNames,
                        completedGardeningNames: gardeningNames,
      completedOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("completed_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
                        masterBirdNames: masterBirdNames,
                        masterInsectNames: masterInsectNames,
                        masterFishNames: masterFishNames,
                        masterFoodNames: masterFoodNames,
                        masterGardeningNames: masterGardeningNames,
      masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
                        ratings: localRatings,
                        weeklyWeather: localWeekly,
                        detailedWeather: localDetailed,
                        pets: cloudPetsForWrite,
                        lastAppVersion: APP_VERSION,
                        updatedAt: serverTimestamp()
                      }, { merge: true });

                      setCompletedBirdIds(localBirds);
                      setCompletedInsectIds(localInsects);
                      setCompletedFishIds(localFish);
                      setCompletedFoodIds(localFood);
                      setCompletedGardeningIds(localGardening);
                      setCompletedOceanCleaningIds(localOceanCleaning);
                      setMasterBirdIds(localMasterBirds);
                      setMasterInsectIds(localMasterInsects);
                      setMasterFishIds(localMasterFish);
                      setMasterFoodIds(localMasterFood);
                      setMasterGardeningIds(localMasterGardening);
                      setMasterOceanCleaningIds(localMasterOceanCleaning);
                      setRatings(localRatings);
                      setWeeklyWeather(localWeekly);
                      setDetailedWeather(localDetailed);

                      localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(localBirds)));
                      localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(localInsects)));
                      localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(localFish)));
                      localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(localFood)));
                      localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(localGardening)));
                      localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(localOceanCleaning)));
                      localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(localMasterBirds)));
                      localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(localMasterInsects)));
                      localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(localMasterFish)));
                      localStorage.setItem('master_food_ids', JSON.stringify(Array.from(localMasterFood)));
                      localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(localMasterGardening)));
                      localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(localMasterOceanCleaning)));
                      localStorage.setItem('item_ratings', JSON.stringify(localRatings));
                      localStorage.setItem('weekly_weather', JSON.stringify(localWeekly));
                      localStorage.setItem('detailed_weather', JSON.stringify(localDetailed));
                      localStorage.setItem('local_collections_updated_at', Date.now().toString());
                      localStorage.setItem('sync_resolved_uid', user.uid);
                    } else if (choice === 'merge') {
                      const mergedBirds = new Set([...localBirds, ...cloudBirds]);
                      const mergedInsects = new Set([...localInsects, ...cloudInsects]);
                      const mergedFish = new Set([...localFish, ...cloudFish]);
                      const mergedFood = new Set([...localFood, ...cloudFood]);
                      const mergedGardening = new Set([...localGardening, ...cloudGardening]);
                  const mergedOceanCleaning = new Set([...(new Set(safeJsonParse(localStorage.getItem('completed_ocean_cleaning_ids'), []))), ...(new Set(cloudOceanCleaning || []))]);
                      const mergedRatings = { ...cloudRatings, ...localRatings };
                      const mergedWeeklyWeather = { ...cloudWeeklyWeather, ...localWeekly };
                      const mergedDetailedWeather = { ...cloudDetailedWeather, ...localDetailed };

                      const birdNames = Array.from(mergedBirds).map(id => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id);
                      const insectNames = Array.from(mergedInsects).map(id => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id);
                      const fishNames = Array.from(mergedFish).map(id => ALL_FISH_MAP.find(f => f.id === id)?.name || id);
                      const foodNames = Array.from(mergedFood).map(id => ALL_COOKING_MAP.find(c => c.id === id)?.name || id);
                      const gardeningNames = Array.from(mergedGardening).map(id => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id);
                      
                      const masterBirdNames = Array.from(new Set([...localMasterBirds, ...cloudMasterBirds])).map(id => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id);
                      const masterInsectNames = Array.from(new Set([...localMasterInsects, ...cloudMasterInsects])).map(id => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id);
                      const masterFishNames = Array.from(new Set([...localMasterFish, ...cloudMasterFish])).map(id => ALL_FISH_MAP.find(f => f.id === id)?.name || id);
                      const masterFoodNames = Array.from(new Set([...localMasterFood, ...cloudMasterFood])).map(id => ALL_COOKING_MAP.find(c => c.id === id)?.name || id);
                      const masterGardeningNames = Array.from(new Set([...localMasterGardening, ...cloudMasterGardening])).map(id => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id);

                      // Merge pets list by matching IDs
                      const mergedPetsMap = new Map<string, any>();
                      cloudPets.forEach((p: any) => mergedPetsMap.set(p.id, p));
                      localPets.forEach((p: any) => {
                        const existingPet = mergedPetsMap.get(p.id);
                        if (existingPet) {
                          mergedPetsMap.set(p.id, {
                            ...existingPet,
                            name: p.name,
                            type: p.type,
                            preferences: {
                              ...existingPet.preferences,
                              ...p.preferences
                            },
                            tried: {
                              ...(existingPet.tried || {}),
                              ...(p.tried || {})
                            }
                          });
                        } else {
                          mergedPetsMap.set(p.id, p);
                        }
                      });
                      const mergedPets = Array.from(mergedPetsMap.values());

                      const cloudPetsForWrite = mapLocalPetsToCloud(mergedPets);

                      // --- START FARMING SLOTS MERGE ---
                      const rawLocalSlots = localStorage.getItem('farming_slots');
                      const localSlots: any[] = safeJsonParse(rawLocalSlots, []);
                      const cloudSlots: any[] = data.farmingSlots 
                        ? reconstructSlotsFromFarmingSlotsMap(data.farmingSlots)
                        : (Array.isArray(data.slots) 
                            ? data.slots 
                            : Object.keys(data.slots || {}).sort().map(k => ({ ...data.slots[k], id: k })));

                      const finalFarmingSlots = Array.from({ length: 8 }, (_, i) => ({
                        id: `slot_${i + 1}`,
                        cropId: null,
                        cropName: null,
                        cropEmoji: null,
                        startTime: null,
                        duration: null,
                        targetTime: null,
                        isNotified: false
                      }));

                      // 1. Place cloud crops first
                      cloudSlots.forEach((s: any) => {
                        if (!s || !s.cropId) return;
                        const m = s.id?.match(/\d+/);
                        const idx = m ? parseInt(m[0]) - 1 : -1;
                        if (idx >= 0 && idx < 8) finalFarmingSlots[idx] = { ...s };
                      });

                      // 2. Place local crops (avoiding duplicates and finding empty spots)
                      localSlots.forEach((s: any) => {
                        if (!s || !s.cropId) return;
                        const isDup = finalFarmingSlots.some(fs => fs.cropId === s.cropId && fs.startTime === s.startTime);
                        if (isDup) return;

                        const m = s.id?.match(/\d+/);
                        const idx = m ? parseInt(m[0]) - 1 : -1;
                        if (idx >= 0 && idx < 8 && finalFarmingSlots[idx].cropId === null) {
                          finalFarmingSlots[idx] = { ...s };
                        } else {
                          const emptyIdx = finalFarmingSlots.findIndex(fs => fs.cropId === null);
                          if (emptyIdx !== -1) {
                            finalFarmingSlots[emptyIdx] = { ...s, id: `slot_${emptyIdx + 1}` };
                          }
                        }
                      });
                      // --- END FARMING SLOTS MERGE ---

                      console.count("[WRITE] setDoc");
                      console.log({
                        function: "runInitialSync_conflict_resolution",
                        reason: "merge_data",
                        path: userDocRef.path,
                        time: new Date().toISOString()
                      });
                      await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email || null,
                        completedBirdNames: birdNames,
                        completedInsectNames: insectNames,
                        completedFishNames: fishNames,
                        completedFoodNames: foodNames,
                        completedGardeningNames: gardeningNames,
      completedOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("completed_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
                        masterBirdNames,
                        masterInsectNames,
                        masterFishNames,
                        masterFoodNames,
                        masterGardeningNames,
      masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
                        ratings: mergedRatings,
                        weeklyWeather: mergedWeeklyWeather,
                        detailedWeather: mergedDetailedWeather,
                        pets: cloudPetsForWrite,
                        slots: deleteField(),
                        farmingSlots: (() => {
                          const farmingSlotsMap: any = {};
                          finalFarmingSlots.forEach((s: any) => {
                            if (s && s.cropId !== null) {
                              if (!s.instanceId) {
                                s.instanceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                              }
                              if (!s.updatedAt) {
                                s.updatedAt = Date.now();
                              }
                              farmingSlotsMap[s.instanceId] = s;
                            }
                          });
                          return farmingSlotsMap;
                        })(),
                        lastAppVersion: APP_VERSION,
                        updatedAt: serverTimestamp()
                      }, { merge: true });

                      setCompletedBirdIds(mergedBirds);
                      setCompletedInsectIds(mergedInsects);
                      setCompletedFishIds(mergedFish);
                      setCompletedFoodIds(mergedFood);
                      setCompletedGardeningIds(mergedGardening);
                      setCompletedOceanCleaningIds(mergedOceanCleaning);
                      setMasterBirdIds(new Set([...localMasterBirds, ...cloudMasterBirds]));
                      setMasterInsectIds(new Set([...localMasterInsects, ...cloudMasterInsects]));
                      setMasterFishIds(new Set([...localMasterFish, ...cloudMasterFish]));
                      setMasterFoodIds(new Set([...localMasterFood, ...cloudMasterFood]));
                      setMasterGardeningIds(new Set([...localMasterGardening, ...cloudMasterGardening]));
                      setMasterOceanCleaningIds(new Set([...localMasterOceanCleaning, ...cloudMasterOceanCleaning]));
                      setPets(mergedPets);
                      setRatings(mergedRatings);
                      setWeeklyWeather(mergedWeeklyWeather);
                      setDetailedWeather(mergedDetailedWeather);

                      localStorage.setItem('farming_slots', JSON.stringify(finalFarmingSlots)); // <--- Update local storage

                      localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(mergedBirds)));
                      localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(mergedInsects)));
                      localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(mergedFish)));
                      localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(mergedFood)));
                      localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(mergedGardening)));
                      localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(mergedOceanCleaning)));
                      localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(new Set([...localMasterBirds, ...cloudMasterBirds]))));
                      localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(new Set([...localMasterInsects, ...cloudMasterInsects]))));
                      localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(new Set([...localMasterFish, ...cloudMasterFish]))));
                      localStorage.setItem('master_food_ids', JSON.stringify(Array.from(new Set([...localMasterFood, ...cloudMasterFood]))));
                      localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(new Set([...localMasterGardening, ...cloudMasterGardening]))));
                      localStorage.setItem('pigtown_pets', JSON.stringify(mergedPets));
                      localStorage.setItem('item_ratings', JSON.stringify(mergedRatings));
                      localStorage.setItem('weekly_weather', JSON.stringify(mergedWeeklyWeather));
                      localStorage.setItem('detailed_weather', JSON.stringify(mergedDetailedWeather));
                      localStorage.setItem('local_collections_updated_at', Date.now().toString());
                      localStorage.setItem('sync_resolved_uid', user.uid);
                    }
                    localStorage.removeItem('has_unsynced_changes');
                    isDirtyRef.current = false;
                    setIsInitialSyncDone(true);
                    isInitialSyncDoneRef.current = true;
                    isInitialSyncDoneLocal = true;
                    setSyncConflict(null);
                    setShowOverwriteConfirm(false);
                  } catch (e) {
                    console.error("Failed to resolve sync conflict:", e);
                  } finally {
                    isResetting.current = false;
                  }
                }
              });
              return;
            }

            if (hasCloudProgress && !hasLocalProgress) {
              setCompletedBirdIds(cloudBirds);
              setCompletedInsectIds(cloudInsects);
              setCompletedFishIds(cloudFish);
              setCompletedFoodIds(cloudFood);
              setCompletedGardeningIds(cloudGardening);
                      setCompletedOceanCleaningIds(cloudOceanCleaning);
                      setMasterBirdIds(cloudMasterBirds);
              setMasterInsectIds(cloudMasterInsects);
              setMasterFishIds(cloudMasterFish);
              setMasterFoodIds(cloudMasterFood);
              setMasterGardeningIds(cloudMasterGardening);
                      setMasterOceanCleaningIds(cloudMasterOceanCleaning);
                      setPets(cloudPets);
              setRatings(cloudRatings);
              setWeeklyWeather(cloudWeeklyWeather);
              setDetailedWeather(cloudDetailedWeather);

              localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(cloudBirds)));
              localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(cloudInsects)));
              localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(cloudFish)));
              localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(cloudFood)));
              localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(cloudGardening)));
                      localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(cloudOceanCleaning)));
                      localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(cloudMasterBirds)));
              localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(cloudMasterInsects)));
              localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(cloudMasterFish)));
              localStorage.setItem('master_food_ids', JSON.stringify(Array.from(cloudMasterFood)));
              localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(cloudMasterGardening)));
              localStorage.setItem('pigtown_pets', JSON.stringify(cloudPets));
              localStorage.setItem('item_ratings', JSON.stringify(cloudRatings));
              localStorage.setItem('weekly_weather', JSON.stringify(cloudWeeklyWeather));
              localStorage.setItem('detailed_weather', JSON.stringify(cloudDetailedWeather));
              localStorage.setItem('local_collections_updated_at', cloudUpdatedAt.toString());
              localStorage.setItem('sync_resolved_uid', user.uid);
              
              // Seed initial lastSyncedDataRef
              lastSyncedDataRef.current = JSON.stringify({
                completedBirdNames: data.completedBirdNames || [],
                completedInsectNames: data.completedInsectNames || [],
                completedFishNames: data.completedFishNames || [],
                completedFoodNames: data.completedFoodNames || [],
                completedGardeningNames: data.completedGardeningNames || [],
                ratings: cloudRatings,
                weeklyWeather: cloudWeeklyWeather,
                detailedWeather: cloudDetailedWeather,
                masterBirdNames: data.masterBirdNames || [],
                masterInsectNames: data.masterInsectNames || [],
                masterFishNames: data.masterFishNames || [],
                masterFoodNames: data.masterFoodNames || [],
                masterGardeningNames: data.masterGardeningNames || [],
                pets: cloudPetsRaw
              });
            } else if (hasLocalProgress && !hasCloudProgress) {
              const birdNames = Array.from(localBirds).map(id => dbBirds.find(b => b.id === id)?.name || id);
              const insectNames = Array.from(localInsects).map(id => dbInsects.find(i => i.id === id)?.name || id);
              const fishNames = Array.from(localFish).map(id => dbFish.find(f => f.id === id)?.name || id);
              const foodNames = Array.from(localFood).map(id => ALL_COOKING_MAP.find(c => c.id === id)?.name || id);
              const gardeningNames = Array.from(localGardening).map(id => GARDENING_ITEMS.find(g => g.id === id)?.name || id);
              const masterBirdNames = Array.from(localMasterBirds).map(id => dbBirds.find(b => b.id === id)?.name || id);
              const masterInsectNames = Array.from(localMasterInsects).map(id => dbInsects.find(i => i.id === id)?.name || id);
              const masterFishNames = Array.from(localMasterFish).map(id => dbFish.find(f => f.id === id)?.name || id);
              const masterFoodNames = Array.from(localMasterFood).map(id => ALL_COOKING_MAP.find(c => c.id === id)?.name || id);
              const masterGardeningNames = Array.from(localMasterGardening).map(id => GARDENING_ITEMS.find(g => g.id === id)?.name || id);

              const cloudPetsForWrite = mapLocalPetsToCloud(localPets);

              console.count("[WRITE] setDoc");
              console.log({
                function: "runInitialSync_conflict_resolution",
                reason: "cloud_wins_fallback_write",
                path: userDocRef.path,
                time: new Date().toISOString()
              });
              await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email || null,
                completedBirdNames: birdNames,
                completedInsectNames: insectNames,
                completedFishNames: fishNames,
                completedFoodNames: foodNames,
                completedGardeningNames: gardeningNames,
      completedOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("completed_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
                masterBirdNames,
                masterInsectNames,
                masterFishNames,
                masterFoodNames,
                masterGardeningNames,
      masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
                ratings: localRatings,
                weeklyWeather: localWeekly,
                detailedWeather: localDetailed,
                pets: cloudPetsForWrite,
                lastAppVersion: APP_VERSION,
                updatedAt: serverTimestamp()
              }, { merge: true });

              setCompletedBirdIds(localBirds);
              setCompletedInsectIds(localInsects);
              setCompletedFishIds(localFish);
              setCompletedFoodIds(localFood);
              setCompletedGardeningIds(localGardening);
                      setCompletedOceanCleaningIds(localOceanCleaning);
                      setMasterBirdIds(localMasterBirds);
              setMasterInsectIds(localMasterInsects);
              setMasterFishIds(localMasterFish);
              setMasterFoodIds(localMasterFood);
              setMasterGardeningIds(localMasterGardening);
              setPets(localPets);
              setRatings(localRatings);
              setWeeklyWeather(localWeekly);
              setDetailedWeather(localDetailed);
              localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(localGardening)));
              localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(localMasterGardening)));
              localStorage.setItem('pigtown_pets', JSON.stringify(localPets));
              localStorage.setItem('sync_resolved_uid', user.uid);
            } else {
              setCompletedBirdIds(cloudBirds);
              setCompletedInsectIds(cloudInsects);
              setCompletedFishIds(cloudFish);
              setCompletedFoodIds(cloudFood);
              setCompletedGardeningIds(cloudGardening);
                      setCompletedOceanCleaningIds(cloudOceanCleaning);
                      setMasterBirdIds(cloudMasterBirds);
              setMasterInsectIds(cloudMasterInsects);
              setMasterFishIds(cloudMasterFish);
              setMasterFoodIds(cloudMasterFood);
              setMasterGardeningIds(cloudMasterGardening);
                      setMasterOceanCleaningIds(cloudMasterOceanCleaning);
                      setPets(cloudPets);
              setRatings(cloudRatings);
              setWeeklyWeather(cloudWeeklyWeather);
              setDetailedWeather(cloudDetailedWeather);

              localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(cloudBirds)));
              localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(cloudInsects)));
              localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(cloudFish)));
              localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(cloudFood)));
              localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(cloudGardening)));
                      localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(cloudOceanCleaning)));
                      localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(cloudMasterBirds)));
              localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(cloudMasterInsects)));
              localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(cloudMasterFish)));
              localStorage.setItem('master_food_ids', JSON.stringify(Array.from(cloudMasterFood)));
              localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(cloudMasterGardening)));
              localStorage.setItem('pigtown_pets', JSON.stringify(cloudPets));
              localStorage.setItem('item_ratings', JSON.stringify(cloudRatings));
              localStorage.setItem('weekly_weather', JSON.stringify(cloudWeeklyWeather));
              localStorage.setItem('detailed_weather', JSON.stringify(cloudDetailedWeather));
              localStorage.setItem('sync_resolved_uid', user.uid);
              
              // Seed initial lastSyncedDataRef
              lastSyncedDataRef.current = JSON.stringify({
                completedBirdNames: data.completedBirdNames || [],
                completedInsectNames: data.completedInsectNames || [],
                completedFishNames: data.completedFishNames || [],
                completedFoodNames: data.completedFoodNames || [],
                completedGardeningNames: data.completedGardeningNames || [],
                ratings: cloudRatings,
                weeklyWeather: cloudWeeklyWeather,
                detailedWeather: cloudDetailedWeather,
                masterBirdNames: data.masterBirdNames || [],
                masterInsectNames: data.masterInsectNames || [],
                masterFishNames: data.masterFishNames || [],
                masterFoodNames: data.masterFoodNames || [],
                masterGardeningNames: data.masterGardeningNames || [],
                pets: cloudPetsRaw
              });
            }

            localStorage.removeItem('has_unsynced_changes');
            isDirtyRef.current = false;
            setIsInitialSyncDone(true);
            isInitialSyncDoneRef.current = true;
            isInitialSyncDoneLocal = true;
          } else {
            setCompletedBirdIds(cloudBirds);
            setCompletedInsectIds(cloudInsects);
            setCompletedFishIds(cloudFish);
            setCompletedFoodIds(cloudFood);
            setCompletedGardeningIds(cloudGardening);
                      setCompletedOceanCleaningIds(cloudOceanCleaning);
                      setMasterBirdIds(cloudMasterBirds);
            setMasterInsectIds(cloudMasterInsects);
            setMasterFishIds(cloudMasterFish);
            setMasterFoodIds(cloudMasterFood);
            setMasterGardeningIds(cloudMasterGardening);
                      setMasterOceanCleaningIds(cloudMasterOceanCleaning);
                      setPets(cloudPets);
            setRatings(cloudRatings);
            setWeeklyWeather(cloudWeeklyWeather);
            setDetailedWeather(cloudDetailedWeather);

            localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(cloudBirds)));
            localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(cloudInsects)));
            localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(cloudFish)));
            localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(cloudFood)));
            localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(cloudGardening)));
                      localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(cloudOceanCleaning)));
                      localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(cloudMasterBirds)));
            localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(cloudMasterInsects)));
            localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(cloudMasterFish)));
            localStorage.setItem('master_food_ids', JSON.stringify(Array.from(cloudMasterFood)));
            localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(cloudMasterGardening)));
            localStorage.setItem('pigtown_pets', JSON.stringify(cloudPets));
            localStorage.setItem('item_ratings', JSON.stringify(cloudRatings));
            localStorage.setItem('weekly_weather', JSON.stringify(cloudWeeklyWeather));
            localStorage.setItem('detailed_weather', JSON.stringify(cloudDetailedWeather));

            // Seed initial lastSyncedDataRef for subsequent updates
            lastSyncedDataRef.current = JSON.stringify({
              completedBirdNames: data.completedBirdNames || [],
              completedInsectNames: data.completedInsectNames || [],
              completedFishNames: data.completedFishNames || [],
              completedFoodNames: data.completedFoodNames || [],
              completedGardeningNames: data.completedGardeningNames || [],
              ratings: cloudRatings,
              weeklyWeather: cloudWeeklyWeather,
              detailedWeather: cloudDetailedWeather,
              masterBirdNames: data.masterBirdNames || [],
              masterInsectNames: data.masterInsectNames || [],
              masterFishNames: data.masterFishNames || [],
              masterFoodNames: data.masterFoodNames || [],
              masterGardeningNames: data.masterGardeningNames || [],
              pets: cloudPetsRaw
            });
          }
        } else {
          if (!isInitialSyncDoneRef.current) {
            const birdNames = Array.from(localBirds).map(id => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id);
            const insectNames = Array.from(localInsects).map(id => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id);
            const fishNames = Array.from(localFish).map(id => ALL_FISH_MAP.find(f => f.id === id)?.name || id);
            const foodNames = Array.from(localFood).map(id => ALL_COOKING_MAP.find(c => c.id === id)?.name || id);
            const gardeningNames = Array.from(localGardening).map(id => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id);
            const masterBirdNames = Array.from(localMasterBirds).map(id => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id);
            const masterInsectNames = Array.from(localMasterInsects).map(id => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id);
            const masterFishNames = Array.from(localMasterFish).map(id => ALL_FISH_MAP.find(f => f.id === id)?.name || id);
            const masterFoodNames = Array.from(localMasterFood).map(id => ALL_COOKING_MAP.find(c => c.id === id)?.name || id);
            const masterGardeningNames = Array.from(localMasterGardening).map(id => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id);

            const cloudPetsForWrite = mapLocalPetsToCloud(localPets);

            if (birdNames.length > 0 || insectNames.length > 0 || fishNames.length > 0 || foodNames.length > 0 || gardeningNames.length > 0 || Object.keys(localWeekly).length > 0 || Object.keys(localDetailed).length > 0 || localPets.length > 0) {
              console.count("[WRITE] setDoc");
              console.log({
                function: "runInitialSync",
                reason: "initialCloudWriteFromLocal",
                path: userDocRef.path,
                time: new Date().toISOString()
              });
              await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email || null,
                completedBirdNames: birdNames,
                completedInsectNames: insectNames,
                completedFishNames: fishNames,
                completedFoodNames: foodNames,
                completedGardeningNames: gardeningNames,
      completedOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("completed_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
                masterBirdNames,
                masterInsectNames,
                masterFishNames,
                masterFoodNames,
                masterGardeningNames,
      masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
                ratings: localRatings,
                weeklyWeather: localWeekly,
                detailedWeather: localDetailed,
                pets: cloudPetsForWrite,
                lastAppVersion: APP_VERSION,
                updatedAt: serverTimestamp()
              }, { merge: true });
            }

            setCompletedBirdIds(localBirds);
            setCompletedInsectIds(localInsects);
            setCompletedFishIds(localFish);
            setCompletedFoodIds(localFood);
            setCompletedGardeningIds(localGardening);
                      setCompletedOceanCleaningIds(localOceanCleaning);
                      setMasterBirdIds(localMasterBirds);
            setMasterInsectIds(localMasterInsects);
            setMasterFishIds(localMasterFish);
            setMasterFoodIds(localMasterFood);
            setMasterGardeningIds(localMasterGardening);
            setPets(localPets);
            setRatings(localRatings);
            setWeeklyWeather(localWeekly);
            setDetailedWeather(localDetailed);

            localStorage.setItem('pigtown_pets', JSON.stringify(localPets));
            localStorage.setItem('sync_resolved_uid', user.uid);
            localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(localGardening)));
            localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(localMasterGardening)));
            localStorage.removeItem('has_unsynced_changes');
            isDirtyRef.current = false;
            setIsInitialSyncDone(true);
            isInitialSyncDoneRef.current = true;
            isInitialSyncDoneLocal = true;
          }
        }
        isFirstSnapshot = false;
      } catch (err: any) {
        console.error("실시간 동기화 스냅샷 처리 중 오류 발생:", err);
        const errStr = String(err).toLowerCase();
        if (err?.code === 'permission-denied' || errStr.includes('permission')) {
          setIsPermissionDeniedError(true);
          if (activeUnsubscribe) activeUnsubscribe();
        } else if (err?.code === 'resource-exhausted' || errStr.includes('quota exceeded')) {
          setIsQuotaExceededError(true);
          if (activeUnsubscribe) activeUnsubscribe();
        }
      }
    }, (error) => {
      console.error("Firestore 실시간 동기화 오류 리스너 수신:", error);
      const errStr = String(error).toLowerCase();
      if (error?.code === 'permission-denied' || errStr.includes('permission')) {
        setIsPermissionDeniedError(true);
        if (activeUnsubscribe) activeUnsubscribe();
      } else if (error?.code === 'resource-exhausted' || errStr.includes('quota exceeded')) {
        setIsQuotaExceededError(true);
        if (activeUnsubscribe) activeUnsubscribe();
      }
    });
    }

    return () => { if (activeUnsubscribe) activeUnsubscribe(); };
  }, [user, dbBirds, dbInsects, dbFish]);

  const checkIsInAppBrowser = () => {
    const ua = (navigator.userAgent || '').toLowerCase();
    return /kakaotalk|instagram|fbav|line|naver|twitter|telegram|webview|micromessenger/i.test(ua) || 
           ( /iphone|ipad|ipod/i.test(ua) && /wv/i.test(ua) ) ||
           ( /android/i.test(ua) && /version\/[0-9.]+/i.test(ua) && !/chrome/i.test(ua) );
  };

  const getInAppAppName = () => {
    const ua = (navigator.userAgent || '').toLowerCase();
    if (ua.includes('kakaotalk')) return '카카오톡';
    if (ua.includes('naver')) return '네이버 앱';
    if (ua.includes('instagram')) return '인스타그램';
    if (ua.includes('fb') || ua.includes('facebook')) return '페이스북';
    if (ua.includes('line')) return '라인';
    return '현재 접속하신 앱';
  };

  const handleOpenExternalBrowser = () => {
    const targetUrl = 'http://pigtown.netlify.app';
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);

    if (ua.includes('kakaotalk')) {
      if (isIOS) {
        window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;
      } else {
        window.location.href = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=http;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end`;
      }
    } else if (ua.includes('naver')) {
      if (isAndroid) {
        window.location.href = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=http;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end`;
      } else {
        window.open(targetUrl, '_blank');
      }
    } else {
      if (isAndroid) {
        window.location.href = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=http;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end`;
      } else {
        window.open(targetUrl, '_blank');
      }
    }
  };

  const handleGoogleLogin = async (bypassCheck: boolean = false) => {
    const isIFrame = window.self !== window.top;
    const isWebView = checkIsInAppBrowser();

    if (bypassCheck !== true) {
      if (isWebView) {
        setLoginWarningType('webview');
        return;
      }
      if (isIFrame) {
        setLoginWarningType('iframe');
        return;
      }
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      // Log the full error for debugging
      
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      // If it's just user closing the popup or cancelling, don't show an intrusive alert
      if (
        errorCode === 'auth/popup-closed-by-user' || 
        errorCode === 'auth/cancelled-popup-request' ||
        errorMessage.includes('popup-closed-by-user') ||
        errorMessage.includes('cancelled-popup-request')
      ) {
        return;
      }

      // If we are in an iframe and hadn't shown the warning yet, show it.
      if (isIFrame && !bypassCheck) {
        setLoginWarningType('iframe');
      } else {
        alert(`로그인 중 오류가 발생했습니다.\n\n사유: ${errorMessage || errorCode || '알 수 없는 오류'}\n\n만약 미리보기(iFrame) 중이라면 상단의 [새 창에서 열기] 버튼을 눌러 접속해 보세요!`);
      }
    }
  };

  const handleLogout = async (shouldClearLocal: boolean = true) => {
    try {
      if (globalSyncTimerRef.current) {
        clearTimeout(globalSyncTimerRef.current);
        globalSyncTimerRef.current = null;
      }

      // Check if we need to sync before logout
      // Only sync if we are doing a FULL logout of a settled session
      const hasUnsynced = localStorage.getItem('has_unsynced_changes') === 'true';
      if (shouldClearLocal && user && (hasUnsynced || isDirtyRef.current)) {
        await forceSyncAllData(user);
      }

      if (shouldClearLocal) {
        // Clear sensitive local storage data to prevent leakage to other users on the same machine
        const keysToClear = [
          'completed_bird_ids',
          'completed_insect_ids',
          'completed_fish_ids',
          'completed_food_ids',
          'completed_gardening_ids',
          'master_bird_ids',
          'master_insect_ids',
          'master_fish_ids',
          'master_food_ids',
          'master_gardening_ids',
          'pigtown_pets',
          'item_ratings',
          'weekly_weather',
          'detailed_weather',
          'farming_slots',
          'user_notification_presets',
          'sync_resolved_uid',
          'has_unsynced_changes',
          'local_collections_updated_at',
          'local_farming_updated_at',
          'farming_write_lock_at'
        ];
        keysToClear.forEach(key => localStorage.removeItem(key));
      }

      isDirtyRef.current = false;
      await signOut(auth);
    } catch (err) {
      console.error("[Sync] Logout aborted due to sync failure:", err);
      alert("데이터를 서버에 동기화하는 중 오류가 발생했습니다. 네트워크 상태를 확인하시거나 잠시 후 다시 시도해 주세요.\n\n오류: " + (err instanceof Error ? err.message : err));
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      alert("로그인된 사용자만 회원탈퇴할 수 있습니다.");
      return;
    }

    if (deleteConfirmText !== '탈퇴하기') {
      setDeleteError("입력 문구가 '탈퇴하기'와 정확히 일치하지 않습니다.");
      return;
    }

    setIsDeleterLoading(true);
    setDeleteError(null);
    isResetting.current = true; // Block snapshots & state updates during deletion

    let userDocRef: any = null;
    let backupData: any = null;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("탈퇴를 진행할 인증 세션 정보가 없습니다. 다시 로그인해 주세요.");
      }

      const uid = currentUser.uid;
      userDocRef = doc(db, 'users', uid);

      // Back up existing data to recover if deletion fails
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          backupData = docSnap.data();
        }
      } catch (backupErr) {
      }

      // 1. Delete associated data in Firestore
      console.count("[WRITE] deleteDoc");
      console.log({
        function: "deleteAccount",
        reason: "deleteUserDoc",
        path: userDocRef.path,
        time: new Date().toISOString()
      });
      await deleteDoc(userDocRef);

      try {
        // 2. Delete actual authentication record from Firebase Auth
        await deleteUser(currentUser);
      } catch (authErr: any) {
        // If it fails due to requires-recent-login, try re-authentication with popup inline!
        if (authErr?.code === 'auth/requires-recent-login' || String(authErr).includes('recent-login') || String(authErr).includes('requires-recent-login')) {
          try {
            setDeleteError("🔒 보안 검증: 가입된 구글 계정을 영구 삭제하려면 추가 인증이 필요한 상태입니다.\n안전한 탈퇴 진행을 위해 표시되는 구글 인증 창에서 로그인 진행 부탁드립니다.");
            
            // Reauthenticate inline using googleProvider
            await reauthenticateWithPopup(currentUser, googleProvider);
            
            // Re-attempt Firestore deletion (just in case they made changes during popup wait)
            console.count("[WRITE] deleteDoc");
            console.log({
              function: "deleteAccount_reauth",
              reason: "deleteUserDoc_retry",
              path: userDocRef.path,
              time: new Date().toISOString()
            });
            await deleteDoc(userDocRef);
            // Re-attempt Firebase Auth deletion
            await deleteUser(currentUser);
          } catch (reauthErr: any) {
            // Reauthentication failed (e.g., user closed popup). Restore the database document!
            if (backupData) {
              console.count("[WRITE] setDoc");
              console.log({
                function: "deleteAccount_fallback_restore",
                reason: "restoreUserDocOnFail",
                path: userDocRef.path,
                time: new Date().toISOString()
              });
              await setDoc(userDocRef, backupData);
            }
            throw reauthErr;
          }
        } else {
          // Some other Auth deletion error. Restore the database document!
          if (backupData) {
            console.count("[WRITE] setDoc");
            console.log({
              function: "deleteAccount_fail_restore",
              reason: "restoreUserDocOnFail",
              path: userDocRef.path,
              time: new Date().toISOString()
            });
            await setDoc(userDocRef, backupData);
          }
          throw authErr;
        }
      }

      // 3. Clear all cached and configured offline data from localStorage
      localStorage.clear();

      // 4. Initialize application client state
      setCompletedBirdIds(new Set());
      setCompletedInsectIds(new Set());
      setCompletedFishIds(new Set());
      setCompletedFoodIds(new Set());
      setCompletedGardeningIds(new Set());
      setMasterBirdIds(new Set());
      setMasterInsectIds(new Set());
      setMasterFishIds(new Set());
      setMasterFoodIds(new Set());
      setMasterGardeningIds(new Set());
      setRatings({});
      setWeeklyWeather({});
      setDetailedWeather({});
      setUser(null);

      // 5. De-escalate and refresh page to start app pristine
      alert("회원 탈퇴 및 데이터 삭제가 안전하게 정상 처리되었습니다. 이용해 주셔서 감사합니다.");
      window.location.reload();
    } catch (err: any) {
      isResetting.current = false; // Restore snapshot sync capability
      
      if (err?.code === 'auth/popup-closed-by-user' || String(err).includes('cancelled') || String(err).includes('closed')) {
        setDeleteError("⚠️ 인증 팝업이 닫혔거나 취소되었습니다. 계정 삭제를 완료하려면 올바르게 인증을 마쳐야 합니다.");
      } else if (err?.code === 'auth/requires-recent-login' || String(err).includes('recent-login')) {
        setDeleteError("🔒 보안 수칙에 따라 가입된 계정을 삭제하려면 구글 재인증이 안전하게 완료되어야 합니다.");
      } else {
        setDeleteError(`탈퇴 처리 중 오류가 발생했습니다: ${err?.message || err}`);
      }
    } finally {
      setIsDeleterLoading(false);
    }
  };

  // Centralized state mutator to handle snappy local response + Firestore upload
  function markCollectionsModified() {
    if (user && !isInitialSyncDoneRef.current) {
      console.log("[Sync] Bypassing markCollectionsModified because initial sync is not complete yet.");
      return;
    }
    const now = Date.now();
    isDirtyRef.current = true;
    localStorage.setItem('has_unsynced_changes', 'true');
    setHasUnsyncedChanges(true);
    window.dispatchEvent(new Event('sync-status-changed'));
    localStorage.setItem('local_collections_updated_at', now.toString());
    localStorage.setItem('collections_write_lock_at', now.toString());
    localWriteLockRef.current = now;
  }

  function getWriteReason(prevData: any, currentData: any): string[] {
    const reasons: string[] = [];
    if (!prevData) {
      reasons.push("loginInitialSync");
      return reasons;
    }
    if (JSON.stringify(prevData.completedBirdNames) !== JSON.stringify(currentData.completedBirdNames)) reasons.push("birdDataChanged");
    if (JSON.stringify(prevData.completedInsectNames) !== JSON.stringify(currentData.completedInsectNames)) reasons.push("insectDataChanged");
    if (JSON.stringify(prevData.completedFishNames) !== JSON.stringify(currentData.completedFishNames)) reasons.push("fishDataChanged");
    if (JSON.stringify(prevData.completedFoodNames) !== JSON.stringify(currentData.completedFoodNames)) reasons.push("foodDataChanged");
    if (JSON.stringify(prevData.completedGardeningNames) !== JSON.stringify(currentData.completedGardeningNames)) reasons.push("gardeningDataChanged");
    if (JSON.stringify(prevData.ratings) !== JSON.stringify(currentData.ratings)) reasons.push("ratingChanged");
    if (JSON.stringify(prevData.weeklyWeather) !== JSON.stringify(currentData.weeklyWeather)) reasons.push("weatherChanged");
    if (JSON.stringify(prevData.detailedWeather) !== JSON.stringify(currentData.detailedWeather)) reasons.push("weatherChanged");
    if (JSON.stringify(prevData.masterBirdNames) !== JSON.stringify(currentData.masterBirdNames)) reasons.push("masterBirdDataChanged");
    if (JSON.stringify(prevData.masterInsectNames) !== JSON.stringify(currentData.masterInsectNames)) reasons.push("masterInsectDataChanged");
    if (JSON.stringify(prevData.masterFishNames) !== JSON.stringify(currentData.masterFishNames)) reasons.push("masterFishDataChanged");
    if (JSON.stringify(prevData.masterFoodNames) !== JSON.stringify(currentData.masterFoodNames)) reasons.push("masterFoodDataChanged");
    if (JSON.stringify(prevData.masterGardeningNames) !== JSON.stringify(currentData.masterGardeningNames)) reasons.push("masterGardeningDataChanged");
    if (JSON.stringify(prevData.pets) !== JSON.stringify(currentData.pets)) reasons.push("petsChanged");
    if (JSON.stringify(prevData.slots) !== JSON.stringify(currentData.slots)) reasons.push("slotsChanged");
    if (reasons.length === 0) reasons.push("manualSync");
    return reasons;
  }

  async function forceSyncAllData(currentUser: any, skipVerify: boolean = false): Promise<boolean> {
    if (!currentUser) return true;

    // CRITICAL: If initial sync/conflict resolution is not complete, 
    // we MUST NOT write to Firestore as it would overwrite the server's source of truth
    // with potentially outdated or un-merged local data.
    if (!isInitialSyncDoneRef.current) {
      console.warn("[Sync] forceSyncAllData blocked: Initial sync/conflict resolution not yet complete.");
      return false;
    }

    const hasUnsynced = localStorage.getItem('has_unsynced_changes') === 'true';
    if (!hasUnsynced && !isDirtyRef.current) {
      console.log("[Sync] forceSyncAllData: No unsynced changes. Skipping write.");
      return true;
    }

    try {
      const localBirdsStr = localStorage.getItem('completed_bird_ids');
      const localInsectsStr = localStorage.getItem('completed_insect_ids');
      const localFishStr = localStorage.getItem('completed_fish_ids');
      const localFoodStr = localStorage.getItem('completed_food_ids');
      const localGardeningStr = localStorage.getItem('completed_gardening_ids');
          const localOceanCleaningStr = localStorage.getItem('completed_ocean_cleaning_ids');
      const localRatingsStr = localStorage.getItem('item_ratings');
      const localWeeklyStr = localStorage.getItem('weekly_weather');
      const localDetailedStr = localStorage.getItem('detailed_weather');
      const localMasterBirdsStr = localStorage.getItem('master_bird_ids');
      const localMasterInsectsStr = localStorage.getItem('master_insect_ids');
      const localMasterFishStr = localStorage.getItem('master_fish_ids');
      const localMasterFoodStr = localStorage.getItem('master_food_ids');
      const localMasterGardeningStr = localStorage.getItem('master_gardening_ids');
          const localMasterOceanCleaningStr = localStorage.getItem('master_ocean_cleaning_ids');
      const localPetsStr = localStorage.getItem('pigtown_pets');
      const rawLocalSlots = localStorage.getItem('farming_slots');

      const localBirds = safeJsonParse(localBirdsStr, []).sort();
      const localInsects = safeJsonParse(localInsectsStr, []).sort();
      const localFish = safeJsonParse(localFishStr, []).sort();
      const localFood = safeJsonParse(localFoodStr, []).sort();
      const localGardening = safeJsonParse(localGardeningStr, []).sort();
      const localRatings = safeJsonParse(localRatingsStr, {});
      const localWeekly = safeJsonParse(localWeeklyStr, {});
      const localDetailed = safeJsonParse(localDetailedStr, {});
      const localMasterBirds = safeJsonParse(localMasterBirdsStr, []).sort();
      const localMasterInsects = safeJsonParse(localMasterInsectsStr, []).sort();
      const localMasterFish = safeJsonParse(localMasterFishStr, []).sort();
      const localMasterFood = safeJsonParse(localMasterFoodStr, []).sort();
      const localMasterGardening = safeJsonParse(localMasterGardeningStr, []).sort();
      const localPets = safeJsonParse(localPetsStr, []);
      const slotsList = safeJsonParse(rawLocalSlots, []);

      const birdNames = localBirds.map((id: string) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
      const insectNames = localInsects.map((id: string) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
      const fishNames = localFish.map((id: string) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
      const foodNames = localFood.map((id: string) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
      const gardeningNames = localGardening.map((id: string) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();
      const masterBirdNames = localMasterBirds.map((id: string) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
      const masterInsectNames = localMasterInsects.map((id: string) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
      const masterFishNames = localMasterFish.map((id: string) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
      const masterFoodNames = localMasterFood.map((id: string) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
      const masterGardeningNames = localMasterGardening.map((id: string) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();
      
      const cloudPets = mapLocalPetsToCloud(localPets);
      
      const currentData = {
        completedBirdNames: birdNames,
        completedInsectNames: insectNames,
        completedFishNames: fishNames,
        completedFoodNames: foodNames,
        completedGardeningNames: gardeningNames,
      completedOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("completed_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
        ratings: localRatings,
        weeklyWeather: localWeekly,
        detailedWeather: localDetailed,
        masterBirdNames: masterBirdNames,
        masterInsectNames: masterInsectNames,
        masterFishNames: masterFishNames,
        masterFoodNames: masterFoodNames,
        masterGardeningNames: masterGardeningNames,
      masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
        pets: cloudPets,
        slots: slotsList
      };

      const dataJson = JSON.stringify(currentData);
      const userDocRef = doc(db, 'users', currentUser.uid);
      localStorage.setItem('local_last_write_at', Date.now().toString());

      const prevDataStr = lastSyncedDataRef.current;
      const prevData = safeJsonParse(prevDataStr, null);
      const prevRatings = prevData?.ratings || {};
      
      const ratingsForWrite: Record<string, any> = { ...localRatings };
      Object.keys(prevRatings).forEach(name => {
        if (localRatings[name] === undefined || localRatings[name] === 0) {
          ratingsForWrite[name] = deleteField();
        }
      });

      const prevWeekly = prevData?.weeklyWeather || {};
      const weeklyForWrite: Record<string, any> = { ...localWeekly };
      Object.keys(prevWeekly).forEach(dayKey => {
        if (localWeekly[dayKey] === undefined) {
          weeklyForWrite[dayKey] = deleteField();
        }
      });

      const prevDetailed = prevData?.detailedWeather || {};
      const detailedForWrite: Record<string, any> = { ...localDetailed };
      Object.keys(prevDetailed).forEach(key => {
        if (localDetailed[key] === undefined) {
          detailedForWrite[key] = deleteField();
        }
      });

      console.log("[Sync] forceSyncAllData executing immediate Firestore write...");
      console.count("[WRITE] setDoc");
      console.log({
        function: "forceSyncAllData",
        reason: getWriteReason(prevData, currentData).join(", "),
        path: userDocRef.path,
        time: new Date().toISOString()
      });
      await setDoc(userDocRef, {
        ...currentData,
        slots: deleteField(),
        ratings: ratingsForWrite,
        weeklyWeather: weeklyForWrite,
        detailedWeather: detailedForWrite,
        lastAppVersion: APP_VERSION,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Verification is skipped in high-urgency situations (like tab closing) to ensure completion
      if (!skipVerify) {
        const verifySnap = await getDoc(userDocRef);
        if (!verifySnap.exists()) {
          throw new Error("Firestore save verification failed: document not found.");
        }
      }

      lastSyncedDataRef.current = dataJson;
      localStorage.removeItem('has_unsynced_changes');
      isDirtyRef.current = false;
      setHasUnsyncedChanges(false);
      window.dispatchEvent(new Event('sync-status-changed'));
      console.log("[Sync] forceSyncAllData completed successfully.");
      return true;
    } catch (err) {
      console.error("[Sync] forceSyncAllData failed:", err);
      throw err;
    }
  }

  function debouncedSyncAllData(delay: number = 2000) {
    if (!user) return;
    if (globalSyncTimerRef.current) clearTimeout(globalSyncTimerRef.current);
    
    globalSyncTimerRef.current = setTimeout(async () => {
      // Collect current snapshot of state from localStorage to bypass any React stale closures
      const localBirdsStr = localStorage.getItem('completed_bird_ids');
      const localInsectsStr = localStorage.getItem('completed_insect_ids');
      const localFishStr = localStorage.getItem('completed_fish_ids');
      const localFoodStr = localStorage.getItem('completed_food_ids');
      const localGardeningStr = localStorage.getItem('completed_gardening_ids');
          const localOceanCleaningStr = localStorage.getItem('completed_ocean_cleaning_ids');
      const localRatingsStr = localStorage.getItem('item_ratings');
      const localWeeklyStr = localStorage.getItem('weekly_weather');
      const localDetailedStr = localStorage.getItem('detailed_weather');
      const localMasterBirdsStr = localStorage.getItem('master_bird_ids');
      const localMasterInsectsStr = localStorage.getItem('master_insect_ids');
      const localMasterFishStr = localStorage.getItem('master_fish_ids');
      const localMasterFoodStr = localStorage.getItem('master_food_ids');
      const localMasterGardeningStr = localStorage.getItem('master_gardening_ids');
          const localMasterOceanCleaningStr = localStorage.getItem('master_ocean_cleaning_ids');
      const localPetsStr = localStorage.getItem('pigtown_pets');
      const rawLocalSlots = localStorage.getItem('farming_slots');

      const localBirds = safeJsonParse(localBirdsStr, []).sort();
      const localInsects = safeJsonParse(localInsectsStr, []).sort();
      const localFish = safeJsonParse(localFishStr, []).sort();
      const localFood = safeJsonParse(localFoodStr, []).sort();
      const localGardening = safeJsonParse(localGardeningStr, []).sort();
      const localRatings = safeJsonParse(localRatingsStr, {});
      const localWeekly = safeJsonParse(localWeeklyStr, {});
      const localDetailed = safeJsonParse(localDetailedStr, {});
      const localMasterBirds = safeJsonParse(localMasterBirdsStr, []).sort();
      const localMasterInsects = safeJsonParse(localMasterInsectsStr, []).sort();
      const localMasterFish = safeJsonParse(localMasterFishStr, []).sort();
      const localMasterFood = safeJsonParse(localMasterFoodStr, []).sort();
      const localMasterGardening = safeJsonParse(localMasterGardeningStr, []).sort();
      const localPets = safeJsonParse(localPetsStr, []);
      const slotsList = safeJsonParse(rawLocalSlots, []);

      const birdNames = localBirds.map((id: string) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
      const insectNames = localInsects.map((id: string) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
      const fishNames = localFish.map((id: string) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
      const foodNames = localFood.map((id: string) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
      const gardeningNames = localGardening.map((id: string) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();
      const masterBirdNames = localMasterBirds.map((id: string) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
      const masterInsectNames = localMasterInsects.map((id: string) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
      const masterFishNames = localMasterFish.map((id: string) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
      const masterFoodNames = localMasterFood.map((id: string) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
      const masterGardeningNames = localMasterGardening.map((id: string) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();
      
      const cloudPets = mapLocalPetsToCloud(localPets);
      
      const currentData = {
        completedBirdNames: birdNames,
        completedInsectNames: insectNames,
        completedFishNames: fishNames,
        completedFoodNames: foodNames,
        completedGardeningNames: gardeningNames,
      completedOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("completed_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
        ratings: localRatings,
        weeklyWeather: localWeekly,
        detailedWeather: localDetailed,
        masterBirdNames: masterBirdNames,
        masterInsectNames: masterInsectNames,
        masterFishNames: masterFishNames,
        masterFoodNames: masterFoodNames,
        masterGardeningNames: masterGardeningNames,
      masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
        pets: cloudPets,
        slots: slotsList
      };
      
      const dataJson = JSON.stringify(currentData);
      
      // If initial snapshot sync is not done yet, postpone.
      if (!isInitialSyncDoneRef.current) {
        console.log("Initial snapshot sync not complete yet. Postponing automatic push to cloud.");
        return;
      }

      // If data hasn't changed OR it's not marked as locally dirty, skip Cloud write.
      if (dataJson === lastSyncedDataRef.current || !isDirtyRef.current) {
        localStorage.removeItem('has_unsynced_changes');
        isDirtyRef.current = false;
        setHasUnsyncedChanges(false);
        window.dispatchEvent(new Event('sync-status-changed'));
        return;
      }

      // Capture that we are starting a sync for this data snapshot
      isDirtyRef.current = false;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        localStorage.setItem('local_last_write_at', Date.now().toString());

        // Process deletions for Firestore setDoc with { merge: true }
        const prevDataStr = lastSyncedDataRef.current;
        const prevData = safeJsonParse(prevDataStr, null);
        const prevRatings = prevData?.ratings || {};
        
        const ratingsForWrite: Record<string, any> = { ...localRatings };
        // Set deleted or 0 ratings to deleteField() so they are actually deleted from the firestore document map
        Object.keys(prevRatings).forEach(name => {
          if (localRatings[name] === undefined || localRatings[name] === 0) {
            ratingsForWrite[name] = deleteField();
          }
        });

        const prevWeekly = prevData?.weeklyWeather || {};
        const weeklyForWrite: Record<string, any> = { ...localWeekly };
        Object.keys(prevWeekly).forEach(dayKey => {
          if (localWeekly[dayKey] === undefined) {
            weeklyForWrite[dayKey] = deleteField();
          }
        });

        const prevDetailed = prevData?.detailedWeather || {};
        const detailedForWrite: Record<string, any> = { ...localDetailed };
        Object.keys(prevDetailed).forEach(key => {
          if (localDetailed[key] === undefined) {
            detailedForWrite[key] = deleteField();
          }
        });

        console.count("[WRITE] setDoc");
        console.log({
          function: "debouncedSyncAllData",
          reason: getWriteReason(prevData, currentData).join(", "),
          path: userDocRef.path,
          time: new Date().toISOString()
        });
        await setDoc(userDocRef, {
          ...currentData,
          slots: deleteField(),
          ratings: ratingsForWrite,
          weeklyWeather: weeklyForWrite,
          detailedWeather: detailedForWrite,
          lastAppVersion: APP_VERSION, // 버전 정보 포함 (룰 검증용)
          updatedAt: serverTimestamp()
        }, { merge: true });
        lastSyncedDataRef.current = dataJson;
        localStorage.removeItem('has_unsynced_changes');
        setHasUnsyncedChanges(false);
        window.dispatchEvent(new Event('sync-status-changed'));
      } catch (err: any) {
        console.error("Firestore 클라우드 동기화 저장 실패:", err);
        
        const errStr = String(err).toLowerCase();
        if (err?.code === 'permission-denied' || errStr.includes('permission')) {
          setIsPermissionDeniedError(true);
        } else if (err?.code === 'resource-exhausted' || errStr.includes('quota exceeded') || errStr.includes('resource-exhausted')) {
          setIsQuotaExceededError(true);
        }
        
        isDirtyRef.current = true;
        localStorage.setItem('has_unsynced_changes', 'true');
        setHasUnsyncedChanges(true);
        window.dispatchEvent(new Event('sync-status-changed'));
      }
    }, 3000); // 3 second debounce
  }

  const updateCollectionState = async (categoryName: Category, newIds: Set<string>) => {
    // 1. local state updates
    if (categoryName === 'birds') {
      setCompletedBirdIds(newIds);
      localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(newIds)));
    } else if (categoryName === 'insects') {
      setCompletedInsectIds(newIds);
      localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(newIds)));
    } else if (categoryName === 'fishing') {
      setCompletedFishIds(newIds);
      localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(newIds)));
    } else if (categoryName === 'cooking') {
      setCompletedFoodIds(newIds);
      localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(newIds)));
    } else if (categoryName === 'crops' || categoryName === 'gardening') {
      setCompletedGardeningIds(newIds);
      localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(newIds)));
    } else if (categoryName === 'ocean_cleaning') {
      setCompletedOceanCleaningIds(newIds);
      localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(newIds)));
    }

    // Capture local modification time
    markCollectionsModified();

    // 2. cloud state sync via debounced global worker
    if (user) {
      debouncedSyncAllData();
    }
  };

  useEffect(() => {
    localStorage.setItem('active_season_ids', JSON.stringify(activeSeasonIds));
  }, [activeSeasonIds]);


  // Check if any modal is active (including CropTimer modal states)
  const isModalActive = useMemo(() => {
    return (
      isSettingsModalOpen ||
      isDeleteAccountModalOpen ||
      isSupportModalOpen ||
      isContactModalOpen ||
      isWeatherModalOpen ||
      isCollectionModalOpen ||
      showOverwriteConfirm ||
      isGuideOpen ||
      isWelcomeOpen ||
      isRecInfoOpen ||
      showClearConfirm ||
      isTimerModalOpen ||
      isSeasonalModalOpen ||
      !!syncConflict ||
      !!loginWarningType ||
      unmatchedNames.length > 0
    );
  }, [
    isSettingsModalOpen,
    isDeleteAccountModalOpen,
    isSupportModalOpen,
    isContactModalOpen,
    isWeatherModalOpen,
    isCollectionModalOpen,
    showOverwriteConfirm,
    isGuideOpen,
    isWelcomeOpen,
    isRecInfoOpen,
    showClearConfirm,
    isTimerModalOpen,
    isSeasonalModalOpen,
    syncConflict,
    loginWarningType,
    unmatchedNames
  ]);

  // Lock body scroll when any modal or popup is open
  useEffect(() => {
    const isBlockingOverlayActive = 
      isShowMaintenance || 
      isMaintenanceCompleted || 
      manualCompletedPreview || 
      isForceUpdateRequired || 
      isPermissionDeniedError || 
      isQuotaExceededError || 
      isManualQuotaExceeded || 
      isSyncingBeforeReload;

    const shouldLock = isModalActive || isSidebarInteracting || isBlockingOverlayActive;

    if (shouldLock) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [
    isModalActive, 
    isSidebarInteracting,
    isShowMaintenance,
    isMaintenanceCompleted,
    manualCompletedPreview,
    isForceUpdateRequired,
    isPermissionDeniedError,
    isQuotaExceededError,
    isManualQuotaExceeded,
    isSyncingBeforeReload
  ]);

  // Weather State
  const [weeklyWeather, setWeeklyWeather] = useState<WeeklyWeather>(() => {
    const saved = localStorage.getItem('weekly_weather');
    const parsed = safeJsonParse(saved, {});
    const cleaned = cleanWeeklyWeather(parsed);
    return cleaned;
  });
  const [draftWeeklyWeather, setDraftWeeklyWeather] = useState<WeeklyWeather>({});

  const [detailedWeather, setDetailedWeather] = useState<DetailedWeather>(() => {
    const saved = localStorage.getItem('detailed_weather');
    const parsed: DetailedWeather = safeJsonParse(saved, {});
    // Clean up expired entries
    const cleaned: DetailedWeather = {};
    const now = new Date();
    Object.keys(parsed).forEach(key => {
      const [y, m, d, h] = key.split('-').map(Number);
      const entryDate = new Date(y, m - 1, d, h);
      // Keep if it's currently relevant or in future
      if (isAfter(addHours(entryDate, 6), now)) {
        cleaned[key] = parsed[key];
      }
    });
    return cleaned;
  });

  const [draftDetailedWeather, setDraftDetailedWeather] = useState<DetailedWeather>({});

  useEffect(() => {
    if (isWeatherModalOpen) {
      setDraftWeeklyWeather(weeklyWeather);
      setDraftDetailedWeather(detailedWeather);
    }
  }, [isWeatherModalOpen, weeklyWeather, detailedWeather]);

  // Dynamic temporal cleanups for weather (re-evaluates of time-elapsed weather data on tick)
  useEffect(() => {
    // 1. Reactive Detailed Weather cleanup
    let detailedChanged = false;
    const now = currentTime;
    const detailedKeys = Object.keys(detailedWeather);
    const cleanedDetailed: DetailedWeather = {};
    
    detailedKeys.forEach(key => {
      const [y, m, d, h] = key.split('-').map(Number);
      const entryDate = new Date(y, m - 1, d, h);
      const expiryTime = addHours(entryDate, 6);
      if (isAfter(expiryTime, now)) {
        cleanedDetailed[key] = detailedWeather[key];
      } else {
        detailedChanged = true;
      }
    });

    if (detailedChanged) {
      setDetailedWeather(cleanedDetailed);
      localStorage.setItem('detailed_weather', JSON.stringify(cleanedDetailed));
    }

    // 2. Reactive Weekly Weather cleanup
    const currentGameDay = format(currentTime, 'yyyy-MM-dd');
    const currentGDate = parse(currentGameDay, 'yyyy-MM-dd', new Date());
    const weeklyKeys = Object.keys(weeklyWeather);
    const cleanedWeekly: WeeklyWeather = {};
    let weeklyChanged = false;

    weeklyKeys.forEach(key => {
      // Validate that the key matches the 'yyyy-MM-dd' format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        weeklyChanged = true;
        return; // Discard legacy numeric keys
      }

      try {
        const keyDate = parse(key, 'yyyy-MM-dd', new Date());
        if (isNaN(keyDate.getTime())) {
          weeklyChanged = true;
          return;
        }
        if (!isBefore(keyDate, currentGDate)) {
          cleanedWeekly[key] = weeklyWeather[key];
        } else {
          weeklyChanged = true;
        }
      } catch (e) {
        // Remove invalid keys
        weeklyChanged = true;
      }
    });

    if (weeklyChanged) {
      setWeeklyWeather(cleanedWeekly);
      localStorage.setItem('weekly_weather', JSON.stringify(cleanedWeekly));
    }

    if (detailedChanged || weeklyChanged) {
      markCollectionsModified();
      if (user) {
        debouncedSyncAllData();
      }
    }
  }, [currentTime, detailedWeather, weeklyWeather, user]);

  // Base Data Filtered by Max Level
  const visibleData = useMemo(() => {
    if (activeCategory === 'birds') {
      return dbBirds.filter(bird => bird.level <= MAX_DISPLAY_LEVEL);
    }
    if (activeCategory === 'insects') {
      return dbInsects.filter(insect => insect.level <= MAX_DISPLAY_LEVEL);
    }
    if (activeCategory === 'fishing') {
      return dbFish.filter(fish => fish.level <= MAX_DISPLAY_LEVEL);
    }
    if (activeCategory === 'cooking') {
      return dbCooking.filter(c => c.level <= MAX_DISPLAY_LEVEL);
    }
    if (activeCategory === 'crops' || activeCategory === 'gardening') {
      return gardeningItems.filter(c => c.level <= MAX_DISPLAY_LEVEL);
    }
    if (activeCategory === 'ocean_cleaning') {
      return oceanCleaning.filter(i => i.level <= MAX_DISPLAY_LEVEL);
    }
    return [];
  }, [activeCategory, dbBirds, dbInsects, dbFish, dbCooking, dbCrops, gardeningItems, oceanCleaning, MAX_DISPLAY_LEVEL]);

  const sortedCollectionItems = useMemo(() => {
    return [...visibleData].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [visibleData]);

  const visibleBirds = activeCategory === 'birds' ? (visibleData as Bird[]) : [];
  const visibleInsects = activeCategory === 'insects' ? (visibleData as Insect[]) : [];
  const visibleFish = activeCategory === 'fishing' ? (visibleData as Fish[]) : [];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('weekly_weather', JSON.stringify(weeklyWeather));
  }, [weeklyWeather]);

  useEffect(() => {
    localStorage.setItem('detailed_weather', JSON.stringify(detailedWeather));
  }, [detailedWeather]);

  useEffect(() => {
    localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(completedBirdIds)));
  }, [completedBirdIds]);

  useEffect(() => {
    localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(completedInsectIds)));
  }, [completedInsectIds]);

  useEffect(() => {
    localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(completedFishIds)));
  }, [completedFishIds]);

  useEffect(() => {
    localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(completedFoodIds)));
  }, [completedFoodIds]);

  useEffect(() => {
    localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(completedGardeningIds)));
  }, [completedGardeningIds]);

  useEffect(() => {
    localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(masterGardeningIds)));
  }, [masterGardeningIds]);

  useEffect(() => {
    localStorage.setItem('pigtown_pets', JSON.stringify(pets));
  }, [pets]);

  // Reset all filters including search and dynamic filters when changing category (page transition)
  useEffect(() => {
    setCollectionFilter('all');
    setStarFilter('all');
    setMasterFilter('all');
    setSearchQuery('');
    setSelectedLevels([]);
    setSelectedTimeBlocks([]);
    setSelectedWeathers([]);
  }, [activeCategory]);

  // Derived Values
  const currentLevelRange = useMemo(() => 
    Array.from({ length: MAX_DISPLAY_LEVEL }, (_, i) => i + 1), 
  []);

  // Dynamic Time Filter Logic
  const isTimeFilterNeeded = useMemo(() => {
    if (activeCategory === 'cooking' || activeCategory === 'crops' || activeCategory === 'gardening' || activeCategory === 'petfood') return false;
    // Current base items for the selected category + level filter
    const baseItems = visibleData.filter(item => 
      selectedLevels.length === 0 || selectedLevels.includes(item.level)
    );
    
    // Check if any item has time restrictions (not 0-24)
    return baseItems.some(item => 
      item.timeSlots && !item.timeSlots.some(slot => slot.start === 0 && slot.end === 24)
    );
  }, [visibleData, selectedLevels, activeCategory]);
  const alwaysBlock = { label: '시간무관', value: 'always' };
  const amBlocks = [
    { label: '새벽 (00-06)', value: '0-6' },
    { label: '오전 (06-12)', value: '6-12' },
  ];
  const pmBlocks = [
    { label: '오후 (12-18)', value: '12-18' },
    { label: '밤 (18-24)', value: '18-24' },
  ];
  const weatherOptions = ['Always', 'Clear/Rainbow', 'Rain/Snow/Rainbow', 'Rainbow'];

  const currentGameWeather: GameWeather = useMemo(() => {
    const key = getDetailedKey(currentTime);
    
    // 1. Detailed weather prioritization: User-defined > Operator-defined
    const userDetailed = detailedWeather[key];
    const opDetailed = adminDetailedWeather[key];
    
    let effectiveDetailed: GameWeather = 'Unknown';
    if (userDetailed && userDetailed !== 'Unknown') {
      effectiveDetailed = userDetailed;
    } else if (opDetailed && opDetailed !== 'Unknown') {
      effectiveDetailed = opDetailed;
    }
    
    if (effectiveDetailed !== 'Unknown') {
      return effectiveDetailed;
    }
    
    // 2. Weekly weather prioritization: User-defined > Operator-defined
    const todayRealKey = format(currentTime, 'yyyy-MM-dd');
    const userWeekly = weeklyWeather[todayRealKey];
    const opWeekly = adminWeeklyWeather[todayRealKey];
    
    let effectiveWeekly: GameWeather = 'Unknown';
    if (userWeekly && userWeekly !== 'Unknown') {
      effectiveWeekly = userWeekly;
    } else if (opWeekly && opWeekly !== 'Unknown') {
      effectiveWeekly = opWeekly;
    }
    
    return effectiveWeekly;
  }, [currentTime, detailedWeather, adminDetailedWeather, weeklyWeather, adminWeeklyWeather]);

  const matchesWeather = (birdWeather: Bird['weather'], context: string | GameWeather, isStrictFilter = false) => {
    // 1. 사용자 선택 필터링 (isStrictFilter 가 true 인 경우)
    if (isStrictFilter) {
      // 데이터의 weather 값과 필터 값이 정확히 일치하는 경우만 노출 (Strict Matching)
      return birdWeather === context;
    }

    // 2. 현재 게임 날씨 기반 추천 필터링 (context가 GameWeather인 경우)
    let current = context as GameWeather;
    const isKnown = ['Clear', 'RainSnow', 'Meteor', 'Rainbow', 'Heatwave', 'Unknown'].includes(current);
    if (!isKnown) {
      current = 'Unknown';
    }
    if (current === 'Heatwave') {
      current = 'Clear';
    }
    
    // 'Always' 또는 '날씨무관'은 모든 실시간 조건에서 매칭
    if (birdWeather === 'Always') return true;
    if (current === 'Unknown') return false;
    
    // 비/눈/무지개 조건: 현재가 비눈 또는 무지개이면 매칭
    if (birdWeather === 'Rain/Snow/Rainbow') {
      return current === 'RainSnow' || current === 'Rainbow';
    }
    
    // 맑음/무지개 조건: 현재가 맑음 또는 무지개이면 매칭
    if (birdWeather === 'Clear/Rainbow') {
      return current === 'Clear' || current === 'Rainbow';
    }
    
    // 무지개 조건: 현재가 무지개일 때만 매칭
    if (birdWeather === 'Rainbow') {
      return current === 'Rainbow';
    }
    
    // 기타 백업 매칭
    const baseContext = isKnown ? context : 'Unknown';
    return birdWeather === (baseContext === 'Heatwave' ? 'Clear' : baseContext);
  };

  const matchesTime = (slots: Bird['timeSlots'], hour: number) => {
    return slots.some(slot => {
      if (slot.start < slot.end) {
        return hour >= slot.start && hour < slot.end;
      } else {
        // Over midnight (e.g., 22 - 04)
        return hour >= slot.start || hour < slot.end;
      }
    });
  };

  const recommendedItems = useMemo(() => {
    if (activeCategory === 'cooking' || activeCategory === 'crops' || activeCategory === 'gardening' || activeCategory === 'petfood') return [];
    const hour = getHours(currentTime);
    const filtered = (visibleData as any[]).filter(item => {
      if (completedIds.has(item.id)) return false;
      
      if (!item.timeSlots) return false;
      
      // 24시간 && 날씨무관(Always)인 경우 추천 목록에서 제외
      const isPerpetual = item.weather === 'Always' && 
        item.timeSlots.length === 1 && 
        item.timeSlots[0].start === 0 && 
        item.timeSlots[0].end === 24;
      
      if (isPerpetual) return false;

      const timeMatch = matchesTime(item.timeSlots, hour);
      const weatherMatch = matchesWeather(item.weather, currentGameWeather);

      return timeMatch && weatherMatch;
    });

    return [...filtered].sort((a, b) => {
      const currentSortOrder = sortOrders[activeCategory] || 'level';

      if (activeCategory === 'cooking') {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name, 'ko');
      }

      if (currentSortOrder === 'name') {
        return a.name.localeCompare(b.name, 'ko');
      } else if (currentSortOrder === 'location') {
        const locA = (a.locations && a.locations[0]) || '';
        const locB = (b.locations && b.locations[0]) || '';
        return locA.localeCompare(locB, 'ko');
      } else { // 'level'
        return a.level - b.level;
      }
    });
  }, [currentTime, completedIds, visibleData, currentGameWeather, activeCategory, sortOrders]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLevels([]);
    setSelectedTimeBlocks([]);
    setSelectedWeathers([]);
    setSelectedCookingTypes([]);
    setCollectionFilter('all');
    setStarFilter('all');
    setMasterFilter('all');
    setSortOrders({
      birds: 'level',
      insects: 'level',
      fishing: 'level',
      cooking: 'level',
      home: 'level',
      crops: 'level',
      petfood: 'level',
      gardening: 'level'
    });
  };

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return visibleData;
    return (visibleData as (Bird | Insect)[]).filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [visibleData, searchQuery]);

  // Filtered lists based on search, collection status, and ratings
  const filteredItems = useMemo(() => {
    if (activeCategory === 'crops' || activeCategory === 'gardening' || activeCategory === 'petfood') return [];

    const items = filteredBySearch.filter(item => {
      const isCollected = completedIds.has(item.id);
      const currentRating = ratings[item.name] || 0;

      // Status Filter logic
      if (collectionFilter === 'uncollected' && isCollected) return false;
      if (collectionFilter === 'collected' && !isCollected) return false;

      // Rating/Star Filter (simplified check for rating 5)
      if (starFilter === 'done' && currentRating < 5) return false;
      if (starFilter === 'todo' && currentRating >= 5) return false;

      // Master Filter (check in set)
      const isMaster = (activeCategory === 'birds' ? masterBirdIds : activeCategory === 'insects' ? masterInsectIds : activeCategory === 'fishing' ? masterFishIds : masterFoodIds).has(item.id);
      if (masterFilter === 'done' && !isMaster) return false;
      if (masterFilter === 'todo' && isMaster) return false;

      // Custom Cooking Filters
      if (activeCategory === 'cooking') {
        const levelMatch = selectedLevels.length === 0 || selectedLevels.includes(item.level);

        let typeMatch = true;
        if (selectedCookingTypes.length > 0) {
          typeMatch = selectedCookingTypes.includes(item.cookingType);
        }

        return levelMatch && typeMatch;
      }

      // Level Filter
      const levelMatch = selectedLevels.length === 0 || selectedLevels.includes(item.level);
      if (!levelMatch) return false;
      
      const isAlwaysItem = item.timeSlots?.some(slot => slot.start === 0 && slot.end === 24) || false;
      
      const timeMatch = selectedTimeBlocks.length === 0 || selectedTimeBlocks.some(block => {
        if (block === 'always') return isAlwaysItem;
        
        // 특정 시간대를 선택했을 때는 상시 출현 항목은 제외하고, 
        // 해당 시간대에만 특화되어 나타나는 항목들만 필터링합니다.
        if (isAlwaysItem) return false;

        const [start, end] = block.split('-').map(Number);
        return item.timeSlots?.some(slot => {
          if (slot.start < slot.end) {
            return Math.max(slot.start, start) < Math.min(slot.end, end);
          } else {
            const part1 = Math.max(slot.start, start) < Math.min(24, end);
            const part2 = Math.max(0, start) < Math.min(slot.end, end);
            return part1 || part2;
          }
        }) || false;
      });

      // Weather filter for all categories
      let weatherMatch = true;
      if (selectedWeathers.length > 0) {
        weatherMatch = selectedWeathers.some(w => matchesWeather(item.weather, w, true));
      }

      return levelMatch && timeMatch && weatherMatch;
    });

    // Sort logic
    return [...items].sort((a, b) => {
      const currentSortOrder = sortOrders[activeCategory] || 'level';

      if (currentSortOrder === 'name') {
        return a.name.localeCompare(b.name, 'ko');
      } else if (currentSortOrder === 'location') {
        const locA = (a.locations && a.locations[0]) || '';
        const locB = (b.locations && b.locations[0]) || '';
        return locA.localeCompare(locB, 'ko');
      } else { // 'level'
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name, 'ko');
      }
    });
  }, [filteredBySearch, collectionFilter, starFilter, masterFilter, completedIds, selectedLevels, selectedTimeBlocks, selectedWeathers, selectedCookingTypes, activeCategory, sortOrders]);

  // Actions
  const getCategoryFromId = (id: string, activeCategoryFallback: string): string => {
    if (id.startsWith('b-') || /^[sS]\d+_b/.test(id)) return 'birds';
    if (id.startsWith('i-') || /^[sS]\d+_i/.test(id)) return 'insects';
    if (id.startsWith('fish-') || /^[sS]\d+_f/.test(id)) return 'fishing';
    if (id.startsWith('oc_') || id.startsWith('oc-')) return 'ocean_cleaning';
    if (id.startsWith('c-') || /^[sS]\d+_c_/.test(id)) return 'cooking';
    if (id.startsWith('g-') || /^[sS]\d+_g/.test(id) || /^[sS]\d+_c\d+/.test(id)) return 'gardening';
    return activeCategoryFallback === 'crops' ? 'gardening' : activeCategoryFallback;
  };

  const sanitizeAndMigrateSets = (sets: {
    completedBirdIds: Set<string>;
    completedInsectIds: Set<string>;
    completedFishIds: Set<string>;
    completedFoodIds: Set<string>;
    completedGardeningIds: Set<string>;
    completedOceanCleaningIds: Set<string>;
  }) => {
    const birds = new Set(sets.completedBirdIds);
    const insects = new Set(sets.completedInsectIds);
    const fish = new Set(sets.completedFishIds);
    const food = new Set(sets.completedFoodIds);
    const gardening = new Set(sets.completedGardeningIds);
    const oceanCleaning = new Set(sets.completedOceanCleaningIds);

    let migratedAny = false;

    // Inspect completed food/cooking set for misplaced IDs
    for (const id of food) {
      const correctCat = getCategoryFromId(id, 'cooking');
      if (correctCat !== 'cooking') {
        migratedAny = true;
        food.delete(id);
        if (correctCat === 'birds') birds.add(id);
        else if (correctCat === 'insects') insects.add(id);
        else if (correctCat === 'fishing') fish.add(id);
        else if (correctCat === 'ocean_cleaning') oceanCleaning.add(id);
        else if (correctCat === 'gardening') gardening.add(id);
      }
    }

    // Inspect other sets to ensure absolute correctness
    const allSets = [
      { set: birds, cat: 'birds' },
      { set: insects, cat: 'insects' },
      { set: fish, cat: 'fishing' },
      { set: gardening, cat: 'gardening' },
      { set: oceanCleaning, cat: 'ocean_cleaning' }
    ];

    for (const item of allSets) {
      for (const id of item.set) {
        const correctCat = getCategoryFromId(id, item.cat);
        if (correctCat !== item.cat) {
          migratedAny = true;
          item.set.delete(id);
          if (correctCat === 'birds') birds.add(id);
          else if (correctCat === 'insects') insects.add(id);
          else if (correctCat === 'fishing') fish.add(id);
          else if (correctCat === 'cooking') food.add(id);
          else if (correctCat === 'ocean_cleaning') oceanCleaning.add(id);
          else if (correctCat === 'gardening') gardening.add(id);
        }
      }
    }

    return {
      migratedAny,
      completedBirdIds: birds,
      completedInsectIds: insects,
      completedFishIds: fish,
      completedFoodIds: food,
      completedGardeningIds: gardening,
      completedOceanCleaningIds: oceanCleaning
    };
  };

  // Self-healing data migration observer
  useEffect(() => {
    let needsMigration = false;
    for (const id of completedFoodIds) {
      const correctCat = getCategoryFromId(id, 'cooking');
      if (correctCat !== 'cooking') {
        needsMigration = true;
        break;
      }
    }

    if (!needsMigration) {
      const checkOtherSets = [
        { set: completedBirdIds, cat: 'birds' },
        { set: completedInsectIds, cat: 'insects' },
        { set: completedFishIds, cat: 'fishing' },
        { set: completedGardeningIds, cat: 'gardening' },
        { set: completedOceanCleaningIds, cat: 'ocean_cleaning' }
      ];
      for (const item of checkOtherSets) {
        for (const id of item.set) {
          if (getCategoryFromId(id, item.cat) !== item.cat) {
            needsMigration = true;
            break;
          }
        }
        if (needsMigration) break;
      }
    }

    if (needsMigration) {
      console.log("[Migration] Misplaced seasonal item IDs detected. Executing self-healing data migration...");
      const migrated = sanitizeAndMigrateSets({
        completedBirdIds,
        completedInsectIds,
        completedFishIds,
        completedFoodIds,
        completedGardeningIds,
        completedOceanCleaningIds
      });

      if (migrated.migratedAny) {
        setCompletedBirdIds(migrated.completedBirdIds);
        setCompletedInsectIds(migrated.completedInsectIds);
        setCompletedFishIds(migrated.completedFishIds);
        setCompletedFoodIds(migrated.completedFoodIds);
        setCompletedGardeningIds(migrated.completedGardeningIds);
        setCompletedOceanCleaningIds(migrated.completedOceanCleaningIds);

        localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(migrated.completedBirdIds)));
        localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(migrated.completedInsectIds)));
        localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(migrated.completedFishIds)));
        localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(migrated.completedFoodIds)));
        localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(migrated.completedGardeningIds)));
        localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(migrated.completedOceanCleaningIds)));

        markCollectionsModified();
        if (user) {
          debouncedSyncAllData();
        }
        console.log("[Migration] Data migration successfully completed and queued for cloud sync.");
      }
    }
  }, [completedBirdIds, completedInsectIds, completedFishIds, completedFoodIds, completedGardeningIds, completedOceanCleaningIds, user]);

  const toggleCompletion = (id: string) => {
    // Determine target category based on ID prefix to avoid race conditions with tab switching
    const targetCategory = getCategoryFromId(id, activeCategory);

    const setter = targetCategory === 'birds' ? setCompletedBirdIds : 
                    targetCategory === 'insects' ? setCompletedInsectIds : 
                    targetCategory === 'fishing' ? setCompletedFishIds : 
                    targetCategory === 'ocean_cleaning' ? setCompletedOceanCleaningIds :
                    targetCategory === 'gardening' ? setCompletedGardeningIds :
                    setCompletedFoodIds;
    
    const localStorageKey = targetCategory === 'birds' ? 'completed_bird_ids' : 
                              targetCategory === 'insects' ? 'completed_insect_ids' : 
                              targetCategory === 'fishing' ? 'completed_fish_ids' : 
                              targetCategory === 'ocean_cleaning' ? 'completed_ocean_cleaning_ids' :
                              targetCategory === 'gardening' ? 'completed_gardening_ids' :
                              'completed_food_ids';

    const currentSet = targetCategory === 'birds' ? completedBirdIds : 
                       targetCategory === 'insects' ? completedInsectIds : 
                       targetCategory === 'fishing' ? completedFishIds : 
                       targetCategory === 'ocean_cleaning' ? completedOceanCleaningIds :
                       targetCategory === 'gardening' ? completedGardeningIds :
                       completedFoodIds;
    
    const isNowCompleted = !currentSet.has(id);

    setter(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      
      // Update localStorage inside functional update to ensure sync
      localStorage.setItem(localStorageKey, JSON.stringify(Array.from(next)));
      
      return next;
    });

    // Trigger sync flags immediately after state update request
    markCollectionsModified();
    if (user) {
      debouncedSyncAllData();
    }

    // If it was unchecked, remove master status and rating too
    if (!isNowCompleted) {
      const masterIds = targetCategory === 'birds' ? masterBirdIds : 
                        targetCategory === 'insects' ? masterInsectIds : 
                        targetCategory === 'fishing' ? masterFishIds : 
                        targetCategory === 'ocean_cleaning' ? masterOceanCleaningIds :
                        targetCategory === 'gardening' ? masterGardeningIds :
                        masterFoodIds;
      if (masterIds.has(id)) {
        toggleMaster(id);
      }

      const item = ALL_BIRDS_MAP.find(b => b.id === id) || 
                   ALL_INSECTS_MAP.find(i => i.id === id) || 
                   ALL_FISH_MAP.find(f => f.id === id) || 
                   ALL_COOKING_MAP.find(c => c.id === id) ||
                   ALL_OCEAN_CLEANING_MAP.find(o => o.id === id) ||
                   ALL_GARDENING_MAP.find(g => g.id === id);
      if (item) {
        setRatings(prev => {
          if (!prev[item.name]) return prev;
          const nextRatings = { ...prev };
          delete nextRatings[item.name];
          localStorage.setItem('item_ratings', JSON.stringify(nextRatings));
          return nextRatings;
        });
      }
    }
  };

  const toggleMaster = (id: string) => {
    const targetCategory = getCategoryFromId(id, activeCategory);

    // Correct master setters
    if (targetCategory === 'birds') {
      setMasterBirdIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(next)));
        return next;
      });
    } else if (targetCategory === 'insects') {
      setMasterInsectIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(next)));
        return next;
      });
    } else if (targetCategory === 'fishing') {
      setMasterFishIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(next)));
        return next;
      });
    } else if (targetCategory === 'cooking') {
      setMasterFoodIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        localStorage.setItem('master_food_ids', JSON.stringify(Array.from(next)));
        return next;
      });
    } else if (targetCategory === 'ocean_cleaning') {
      setMasterOceanCleaningIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(next)));
        return next;
      });
    } else if (targetCategory === 'gardening') {
      setMasterGardeningIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(next)));
        return next;
      });
    }
    
    markCollectionsModified();
    
    if (user) {
      debouncedSyncAllData();
    }
  };

  const toggleGardeningCompletion = (id: string) => {
    const next = new Set(completedGardeningIds);
    const isNowCompleted = !next.has(id);
    if (next.has(id)) {
      next.delete(id);
      if (masterGardeningIds.has(id)) {
        const nextMaster = new Set(masterGardeningIds);
        nextMaster.delete(id);
        setMasterGardeningIds(nextMaster);
        localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(nextMaster)));
      }
    } else {
      next.add(id);
    }
    setCompletedGardeningIds(next);
    localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(next)));
    
    // Also remove the rating if unchecked!
    if (!isNowCompleted) {
      const gItem = ALL_GARDENING_MAP.find(g => g.id === id);
      if (gItem && ratings[gItem.name]) {
        const nextRatings = { ...ratings };
        delete nextRatings[gItem.name];
        setRatings(nextRatings);
        localStorage.setItem('item_ratings', JSON.stringify(nextRatings));
      }
    }

    markCollectionsModified();
    
    if (user) {
      debouncedSyncAllData();
    }
  };

  const toggleGardeningMaster = (id: string) => {
    const next = new Set(masterGardeningIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setMasterGardeningIds(next);
    localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(next)));
    
    markCollectionsModified();
    
    if (user) {
      debouncedSyncAllData();
    }
  };

  const handleRate = async (id: string | null, name: string, rating: number) => {
    // 1. Local update for ratings using functional update to avoid stale state
    setRatings(prev => {
      const nextRatings = { ...prev };
      if (rating === 0) {
        delete nextRatings[name];
      } else {
        nextRatings[name] = rating;
      }
      localStorage.setItem('item_ratings', JSON.stringify(nextRatings));
      return nextRatings;
    });
    
    markCollectionsModified();

    // 2. Cloud update
    if (user) {
      debouncedSyncAllData();
    }

    // Automatically select/check completion if rating > 0
    if (id) {
      const targetCategory = getCategoryFromId(id, activeCategory);
      if (targetCategory === 'gardening') {
        // Gardening card rating hook (including seasonal gardening & crops)
        if (rating > 0) {
          setCompletedGardeningIds(prev => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(next)));
            return next;
          });
        } else if (rating === 0) {
          setCompletedGardeningIds(prev => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(next)));
            
            // Also handle master gardening removal
            setMasterGardeningIds(mPrev => {
              if (!mPrev.has(id)) return mPrev;
              const mNext = new Set(mPrev);
              mNext.delete(id);
              localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(mNext)));
              return mNext;
            });
            
            return next;
          });
        }
        markCollectionsModified();
        if (user) debouncedSyncAllData();
      } else {
        // Normal list categories (birds, insects, fishing, cooking, ocean_cleaning)
        const setter = targetCategory === 'birds' ? setCompletedBirdIds : 
                        targetCategory === 'insects' ? setCompletedInsectIds : 
                        targetCategory === 'fishing' ? setCompletedFishIds : 
                        targetCategory === 'ocean_cleaning' ? setCompletedOceanCleaningIds :
                        setCompletedFoodIds;
        
        const localStorageKey = targetCategory === 'birds' ? 'completed_bird_ids' : 
                                 targetCategory === 'insects' ? 'completed_insect_ids' : 
                                 targetCategory === 'fishing' ? 'completed_fish_ids' : 
                                 targetCategory === 'ocean_cleaning' ? 'completed_ocean_cleaning_ids' :
                                 'completed_food_ids';

        if (rating > 0) {
          setter(prev => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            localStorage.setItem(localStorageKey, JSON.stringify(Array.from(next)));
            return next;
          });
        } else if (rating === 0) {
          setter(prev => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            localStorage.setItem(localStorageKey, JSON.stringify(Array.from(next)));
            return next;
          });
        }
        
        markCollectionsModified();
        if (user) debouncedSyncAllData();
      }
    }
  };

  const clearUnmatched = () => setUnmatchedNames([]);

  const clearAllCompletion = () => {
    // Collect all item names in the active category to clear their ratings
    const itemNames = new Set<string>(visibleData.map((item: any) => item.name));
    
    // Clear ratings for these items if they exist
    const nextRatings = { ...ratings };
    let ratingChanged = false;
    itemNames.forEach(name => {
      if (nextRatings[name]) {
        delete nextRatings[name];
        ratingChanged = true;
      }
    });

    if (ratingChanged) {
      setRatings(nextRatings);
      localStorage.setItem('item_ratings', JSON.stringify(nextRatings));
      markCollectionsModified();
    }

    updateCollectionState(activeCategory, new Set());
    setShowClearConfirm(false);
    setToastMessage('업데이트 되었습니다.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Weather Modal Components
  const toggleDetailedWeather = async (key: string, weather: GameWeather) => {
    let nextWeather: GameWeather = 'Unknown';
    if (weather === 'Clear') {
      if (detailedWeather[key] === 'Clear') {
        nextWeather = 'Heatwave';
      } else if (detailedWeather[key] === 'Heatwave') {
        nextWeather = 'Unknown';
      } else {
        nextWeather = 'Clear';
      }
    } else {
      nextWeather = detailedWeather[key] === weather ? 'Unknown' : weather;
    }

    const nextDetailed = {
      ...detailedWeather,
      [key]: nextWeather
    };
    setDetailedWeather(nextDetailed);
    localStorage.setItem('detailed_weather', JSON.stringify(nextDetailed));
    markCollectionsModified();

    if (user) {
      debouncedSyncAllData();
    }
  };

  const toggleWeeklyWeather = async (key: string, weather: GameWeather) => {
    let nextWeather: GameWeather = 'Unknown';
    if (weather === 'Clear') {
      if (weeklyWeather[key] === 'Clear') {
        nextWeather = 'Heatwave';
      } else if (weeklyWeather[key] === 'Heatwave') {
        nextWeather = 'Unknown';
      } else {
        nextWeather = 'Clear';
      }
    } else {
      nextWeather = weeklyWeather[key] === weather ? 'Unknown' : weather;
    }

    const nextWeekly = {
      ...weeklyWeather,
      [key]: nextWeather
    };
    setWeeklyWeather(nextWeekly);
    localStorage.setItem('weekly_weather', JSON.stringify(nextWeekly));
    markCollectionsModified();

    if (user) {
      debouncedSyncAllData();
    }
  };

  const toggleDraftDetailedWeather = (key: string, weather: GameWeather) => {
    let nextWeather: GameWeather = 'Unknown';
    if (weather === 'Clear') {
      if (draftDetailedWeather[key] === 'Clear') {
        nextWeather = 'Heatwave';
      } else if (draftDetailedWeather[key] === 'Heatwave') {
        nextWeather = 'Unknown';
      } else {
        nextWeather = 'Clear';
      }
    } else {
      nextWeather = draftDetailedWeather[key] === weather ? 'Unknown' : weather;
    }

    const newState = {
      ...draftDetailedWeather,
      [key]: nextWeather
    };
    setDraftDetailedWeather(newState);
  };

  const toggleDraftWeeklyWeather = (key: string, weather: GameWeather) => {
    let nextWeather: GameWeather = 'Unknown';
    if (weather === 'Clear') {
      if (draftWeeklyWeather[key] === 'Clear') {
        nextWeather = 'Heatwave';
      } else if (draftWeeklyWeather[key] === 'Heatwave') {
        nextWeather = 'Unknown';
      } else {
        nextWeather = 'Clear';
      }
    } else {
      nextWeather = draftWeeklyWeather[key] === weather ? 'Unknown' : weather;
    }

    const newState = {
      ...draftWeeklyWeather,
      [key]: nextWeather
    };
    setDraftWeeklyWeather(newState);
  };

  if (isInvalidEnvironment) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center select-none" id="error-screen">
        <div className="h-16 w-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-xl font-black text-white mb-2 tracking-tight">허용되지 않은 접근입니다</h1>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
          본 서비스는 지정된 공식 도메인에서만 이용 가능합니다.<br/>
          비정상적인 접근이 감지되어 시스템 보호를 위해 실행이 중단되었습니다.
        </p>
        <div className="mt-8 pt-8 border-t border-slate-900 w-full max-w-xs">
          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Security System Active</p>
        </div>
      </div>
    );
  }

  const shouldShowCompact = isScrolled && (!isFilterExpanded || isLargeFilterScrolledPast);


  // 새로고침 처리
  const handleUpdateAndSync = useCallback(() => {
    window.location.reload();
  }, []);

  const isBannerVisible = useMemo(() => {
    return !!marqueeNotice?.trim() && !isBannerExpired;
  }, [marqueeNotice, isBannerExpired]);

  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 z-[100000] bg-white dark:bg-stone-950 flex flex-col items-center justify-center transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          {/* Simple Clean Spinner */}
          <div className="relative w-12 h-12 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-full h-full rounded-full border-[3px] border-stone-100 dark:border-stone-900 border-t-stone-800 dark:border-t-stone-200"
            />
          </div>
          
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-stone-800 dark:text-stone-200 font-black text-sm tracking-widest uppercase">
              Loading
            </span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="h-1 w-1 rounded-full bg-stone-400 dark:bg-stone-600"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-stone-950/90 flex flex-col relative transition-colors duration-300">
      <AnnouncementPopup />
      <UpdateFeaturesPopup />
      {/* 2. Desktop Left Sidebar */}
      <DesktopSidebar 
            isSidebarInteracting={isSidebarInteracting}
            setIsSidebarInteracting={setIsSidebarInteracting}
            isDesktopSidebarExpanded={isDesktopSidebarExpanded}
            setIsDesktopSidebarExpanded={setIsDesktopSidebarExpanded}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            menuStatus={displayMenuStatus}
            allowedUids={allowedUids}
            birdTotal={birdTotal}
            completedBirdIds={effectiveCompletedBirdIds}
            insectTotal={insectTotal}
            completedInsectIds={effectiveCompletedInsectIds}
            fishTotal={fishTotal}
            completedFishIds={effectiveCompletedFishIds}
            cookingTotal={cookingTotal}
            completedFoodIds={effectiveCompletedFoodIds}
            completedGardeningIds={effectiveCompletedGardeningIds}
            gardeningItemsLength={gardeningTotal + cropTotal}
            user={user}
            setIsSettingsModalOpen={setIsSettingsModalOpen}
            setIsDeleteAccountModalOpen={setIsDeleteAccountModalOpen}
            setIsSupportModalOpen={setIsSupportModalOpen}
            setIsContactModalOpen={setIsContactModalOpen}
            setDeleteConfirmText={setDeleteConfirmText}
            setDeleteError={setDeleteError}
            activeCouponsCount={activeCouponsCount}
            isModalActive={isModalActive}
            activeEventId={effectiveSeasonIds.includes('event_1') ? 'event_1' : ''}
            oceanCleaningTotal={oceanCleaningTotal}
            completedOceanCleaningIds={effectiveCompletedOceanCleaningIds}
          />

      <MobileSidebar 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        menuStatus={displayMenuStatus}
        allowedUids={allowedUids}
        birdTotal={birdTotal}
        insectTotal={insectTotal}
        fishTotal={fishTotal}
        cookingTotal={cookingTotal}
        completedBirdIds={effectiveCompletedBirdIds}
        completedInsectIds={effectiveCompletedInsectIds}
        completedFishIds={effectiveCompletedFishIds}
        completedFoodIds={effectiveCompletedFoodIds}
        completedGardeningIds={effectiveCompletedGardeningIds}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        setIsDeleteAccountModalOpen={setIsDeleteAccountModalOpen}
        setDeleteConfirmText={setDeleteConfirmText}
        setDeleteError={setDeleteError}
        setIsSupportModalOpen={setIsSupportModalOpen}
        setIsContactModalOpen={setIsContactModalOpen}
        user={user}
        GARDENING_ITEMS={gardeningItems}
        activeCouponsCount={activeCouponsCount}
        activeEventId={effectiveSeasonIds.includes('event_1') ? 'event_1' : ''}
        oceanCleaningTotal={oceanCleaningTotal}
        completedOceanCleaningIds={effectiveCompletedOceanCleaningIds}
      />

      {/* 4. Main Panel Container */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          "lg:ml-[76px]",
          isDesktopSidebarExpanded && "lg:ml-64"
        )}
        style={{
          ['--sticky-top-mobile' as any]: 
            isBannerVisible ? '100px' : '56px',
          ['--sticky-top-desktop' as any]: 
            isBannerVisible ? '48px' : '0px',
        }}
      >
        {/* Real-time Rolling Notice Banner (Excludes Sidebar area on PC) */}
        {isBannerVisible && (
          <div 
            key={`${marqueeNotice}_${marqueeRepeat}`}
            className="w-full bg-amber-500 dark:bg-amber-600 text-amber-950 font-black h-11 sm:h-12 overflow-hidden relative border-b border-amber-600 dark:border-amber-700/50 shadow-md select-none flex items-center shrink-0 z-50 sticky top-0"
          >
            <div 
              className="absolute whitespace-nowrap flex items-center gap-2 pl-4 sm:pl-6 left-[100%]"
              style={{
                willChange: 'transform',
                animationName: 'custom-marquee',
                animationDuration: `${Math.max(8, Math.min(60, Math.round((windowWidth + (marqueeNotice.length * 15)) / 90)))}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: marqueeRepeat > 0 ? marqueeRepeat : 'infinite',
                animationFillMode: 'forwards'
              }}
              onAnimationEnd={() => {
                if (marqueeRepeat > 0) {
                  setIsBannerExpired(true);
                }
              }}
            >
              <Megaphone className="h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 text-amber-950 animate-bounce" />
              <span className="text-[13px] sm:text-sm md:text-base font-black tracking-wide pr-12">
                {marqueeNotice.trim()}
              </span>
            </div>
          </div>
        )}

        {/* 2. Mobile Bottom-Navigation Header (Hidden on Desktop, Positioned right under the Banner if visible) */}
        <header className={cn(
          "lg:hidden w-full border-b border-stone-200/50 dark:border-stone-850 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-xl px-4 h-14 flex items-center justify-between shrink-0 shadow-sm transition-colors z-[100]",
          isBannerVisible ? "sticky top-11 sm:top-12" : "sticky top-0",
          isProfileDropdownOpen && "z-[1000]"
        )}>
          <div className="flex-1 flex justify-start">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-neutral-600 dark:text-stone-400 active:scale-95 hover:bg-neutral-50 dark:hover:bg-stone-800 transition-all shrink-0 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          
          <div 
            className="flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0" 
            onClick={() => setActiveCategory('home')}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-stone-850 overflow-hidden border border-neutral-100 dark:border-stone-800/80">
              <img src="/images/new_logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-stone-100 font-sans">PIG TOWN</span>
          </div>
          
          <div className="flex-1 flex justify-end">
            <ProfileDropdown isMobile={true} authLoading={authLoading} user={user} isProfileDropdownOpen={isProfileDropdownOpen} setIsProfileDropdownOpen={setIsProfileDropdownOpen} handleLogout={handleLogout} handleGoogleLogin={handleGoogleLogin} />
          </div>
        </header>

        {/* Sleek Layout Sticky Sub-Header */}
        <div 
          className={cn(
          "bg-white/80 dark:bg-stone-900/80 backdrop-blur-md shrink-0 w-full font-scale-lock border-b border-stone-200/40 dark:border-stone-850 transition-all duration-300",
          cn(
            "sticky",
            isBannerVisible ? "top-[100px] sm:top-[104px] lg:top-12" : "top-14 lg:top-0",
            isProfileDropdownOpen ? "z-[500]" : "z-[40]"
          )
        )}>
          <div className="py-2.5 md:py-3">
            <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-5 md:px-6 flex flex-row items-center justify-between gap-2 sm:gap-3.5">
              <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-[15px] sm:text-base md:text-lg font-black text-neutral-900 dark:text-stone-200 tracking-tight shrink-0 whitespace-nowrap">
                    {activeCategory === 'home'
                      ? '🏡 대시보드'
                      : activeCategory === 'birds' 
                        ? '🐦 새 도감 ' 
                        : activeCategory === 'insects' 
                          ? '🐛 곤충 도감' 
                          : activeCategory === 'fishing' 
                            ? '🎣 낚시 도감' 
                            : activeCategory === 'cooking'
                              ? '🍳 요리 도감'
                              : activeCategory === 'gardening'
                                ? '🌸 원예/작물 도감'
                                : activeCategory === 'crops'
                                  ? '🌾 작물&맞춤형 알림'
                                  : activeCategory === 'privacy'
                                    ? '🛡️ 개인정보 처리방침'
                                    : activeCategory === 'terms'
                                      ? '📜 서비스 이용약관'
                                      : activeCategory === 'coupons'
                                        ? '🎟️ 두근두근타운 리딤코드'
                                        : '🌊 바다청소 도감'}
                  </h1>
                </div>
                <p className="hidden sm:block text-[11px] text-neutral-400 dark:text-stone-550 font-bold mt-0.5 truncate">
                  {activeCategory === 'home'
                    ? '내가 수집한 도감과 작물 현황을 관리해보세요.'
                    : activeCategory === 'crops' 
                      ? '작물의 성장 완료 예정 시간과 맞춤형 알림 정보를 실시간으로 확인해 보세요.' 
                      : activeCategory === 'cooking'
                        ? '게임 내 요리 재료와 도감 수집 정보를 확인해 보세요.'
                        : activeCategory === 'gardening'
                          ? '꽃과 수확 작물을 도감에 등록하고 별점을 기록해 보세요.'
                          : activeCategory === 'privacy'
                            ? '본 서비스의 개인정보 처리방침을 안내합니다.'
                            : activeCategory === 'terms'
                              ? '본 서비스의 이용약관을 안내합니다.'
                              : activeCategory === 'petfood'
                                ? '마이펫의 먹이 기록을 간편하게 관리해 보세요.'
                                : activeCategory === 'coupons'
                                  ? '두근두근타운 리딤코드를 확인하고 혜택을 받아보세요!'
                                  : '현재 출현 조건을 확인하고 개인 컬렉션을 관리해 보세요.'}
                </p>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 justify-end">
                
                {/* Game Clock & Weather Widget (Unified Row) */}
                <div className="flex items-center shrink-0 h-10 bg-stone-150/50 hover:bg-stone-150/80 dark:bg-stone-800/40 dark:hover:bg-stone-800/60 transition-all rounded-xl p-1 sm:pl-2.5 border border-stone-200/30 dark:border-stone-800 text-[10px] sm:text-xs text-neutral-850 dark:text-stone-300">
                  {/* Time (Hidden on tablet/mobile to save space, visible when space is sufficient) */}
                  <div className="hidden lg:flex items-center gap-1.5 pr-2 border-r border-stone-200/50 dark:border-stone-800 mr-1.5">
                    <Clock className="h-3.5 w-3.5 text-neutral-400 dark:text-stone-500 animate-pulse shrink-0" />
                    <span className="font-extrabold font-mono tracking-tight text-[11px] text-stone-700 dark:text-stone-300 whitespace-nowrap">
                      {getKoreanDayName(currentTime)}요일 {format(currentTime, 'HH:mm')}
                    </span>
                  </div>
                  
                  {/* Weather Button */}
                  <button 
                    onClick={() => setIsWeatherModalOpen(true)}
                    className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-white/45 dark:hover:bg-white/10 transition-all text-[11px] font-bold text-stone-700 dark:text-stone-300 cursor-pointer shrink-0"
                  >
                    <WeatherIcon weather={currentGameWeather} className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                    <span className="whitespace-nowrap">{translateWeather(currentGameWeather)}</span>
                    <Settings className="h-3 w-3 text-neutral-400 dark:text-stone-500 hidden sm:block ml-0.5 shrink-0" />
                  </button>
                </div>
  
                {/* Collection Status Button */}
                {(activeCategory === 'birds' || activeCategory === 'insects' || activeCategory === 'fishing' || activeCategory === 'cooking' || activeCategory === 'gardening' || activeCategory === 'crops' || activeCategory === 'ocean_cleaning') && (
                  <button 
                    onClick={() => {
                      setBulkInput('');
                      setIsCollectionModalOpen(true);
                    }}
                    className={cn(
                      "flex h-10 py-1 px-3 sm:px-4 items-center gap-2 border rounded-xl transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer group",
                      activeCategory === 'birds' 
                        ? "bg-amber-50/60 dark:bg-amber-500/10 hover:bg-amber-100/80 dark:hover:bg-amber-500/15 border-amber-200/40 dark:border-amber-500/20 text-amber-800 dark:text-amber-300" 
                        : activeCategory === 'insects'
                          ? "bg-emerald-50/60 dark:bg-emerald-500/10 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/15 border-emerald-200/40 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                          : activeCategory === 'ocean_cleaning'
                            ? "bg-cyan-50/60 dark:bg-cyan-500/10 hover:bg-cyan-100/80 dark:hover:bg-cyan-500/15 border-cyan-200/40 dark:border-cyan-500/20 text-cyan-800 dark:text-cyan-300"
                            : "bg-blue-50/60 dark:bg-blue-500/10 hover:bg-blue-100/80 dark:hover:bg-blue-500/15 border-blue-200/40 dark:border-blue-500/20 text-blue-800 dark:text-blue-300"
                    )}
                  >
                    <BookOpen className={cn(
                      "h-3.5 w-3.5 transition-transform group-hover:scale-110 shrink-0",
                      activeCategory === 'birds' ? "text-amber-500 dark:text-amber-400" : activeCategory === 'insects' ? "text-emerald-500 dark:text-emerald-400" : activeCategory === 'ocean_cleaning' ? "text-cyan-500 dark:text-cyan-400" : "text-blue-500 dark:text-blue-400"
                    )} />
                    <div className="flex flex-col text-left leading-tight shrink-0">
                      <span className={cn(
                        "text-[9px] sm:text-[10px] font-extrabold tracking-tight",
                        activeCategory === 'birds' ? "text-amber-600/70 dark:text-amber-400/85" : activeCategory === 'insects' ? "text-emerald-600/70 dark:text-emerald-400/85" : activeCategory === 'ocean_cleaning' ? "text-cyan-600/70 dark:text-cyan-400/85" : "text-blue-600/70 dark:text-blue-400/85"
                      )}>도감등록</span>
                      <span className="text-[11px] sm:text-[12px] font-black whitespace-nowrap">{currentCategoryCompleted}/{currentCategoryTotal}</span>
                    </div>
                  </button>
                )}
  
                {/* Login / Profile Segment (Dropdown for Desktop & Mobile) */}
                <ProfileDropdown isMobile={false} authLoading={authLoading} user={user} isProfileDropdownOpen={isProfileDropdownOpen} setIsProfileDropdownOpen={setIsProfileDropdownOpen} handleLogout={handleLogout} handleGoogleLogin={handleGoogleLogin} />
              </div>
            </div>
          </div>
        </div>

        {/* Unified Application views */}
        <div className="px-4 sm:px-5 md:px-6 pt-4 pb-6 relative bg-stone-50 dark:bg-stone-950 transition-colors shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
          <CategoryView 
            activeCategory={activeCategory}
            user={user}
            showSeasonalBanner={showSeasonalBanner}
            isInitialSyncDone={isInitialSyncDone}
            allowedUids={allowedUids}
            menuStatus={displayMenuStatus}
            completedBirdIds={effectiveCompletedBirdIds}
            completedInsectIds={effectiveCompletedInsectIds}
            completedFishIds={effectiveCompletedFishIds}
            completedFoodIds={effectiveCompletedFoodIds}
            masterBirdIds={masterBirdIds}
            masterInsectIds={masterInsectIds}
            masterFishIds={masterFishIds}
            masterFoodIds={masterFoodIds}
            completedFlowerIds={completedFlowerIds}
            completedCropIds={completedCropIds}
            completedGardeningIds={effectiveCompletedGardeningIds}
            masterGardeningIds={masterGardeningIds}
            birdTotal={birdTotal}
            insectTotal={insectTotal}
            fishTotal={fishTotal}
            cookingTotal={cookingTotal}
            gardeningTotal={gardeningTotal}
            cropTotal={cropTotal}
            pets={pets}
            ratings={ratings}
            handleSetCategory={handleSetCategory}
            handleGoogleLogin={handleGoogleLogin}
            handleLogout={handleLogout}
            setIsContactModalOpen={setIsContactModalOpen}
            setIsTimerModalOpen={setIsTimerModalOpen}
            setIsPermissionDeniedError={setIsPermissionDeniedError}
            setIsQuotaExceededError={setIsQuotaExceededError}
            toggleGardeningCompletion={toggleGardeningCompletion}
            toggleGardeningMaster={toggleGardeningMaster}
            handleRate={handleRate}
            MAX_DISPLAY_LEVEL={MAX_DISPLAY_LEVEL}
            birds={dbBirds}
            insects={dbInsects}
            fish={dbFish}
            cooking={dbCooking}
            gardeningItems={gardeningItems}
            cropPresets={dbCrops}
            completedOceanCleaningIds={effectiveCompletedOceanCleaningIds}
            masterOceanCleaningIds={masterOceanCleaningIds}
            oceanCleaning={oceanCleaning}
            gardeningSubTab={gardeningSubTab}
            setPets={setPets}
            markCollectionsModified={markCollectionsModified}
            debouncedSyncAllData={debouncedSyncAllData}
            currentTime={currentTime}
            currentGameWeather={currentGameWeather}
            toggleCompletion={toggleCompletion}
            toggleMaster={toggleMaster}
            setIsCollectionModalOpen={setIsCollectionModalOpen}
            currentCategoryCompleted={currentCategoryCompleted}
            currentCategoryTotal={currentCategoryTotal}
            setBulkInput={setBulkInput}
            bulkInput={bulkInput}
            setIsRecInfoOpen={setIsRecInfoOpen}
            isRecInfoOpen={isRecInfoOpen}
            setIsWeatherModalOpen={setIsWeatherModalOpen}
            activeCouponsCount={activeCouponsCount}
                         onOpenSeasonalModal={() => {
                               if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                               setIsSeasonalModalOpen(true);
                               toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
                             }}
            activeSeasonIds={effectiveSeasonIds}
          />
        </div>
      </div>

          <ClearConfirmModal 
            isOpen={showClearConfirm} 
            onClose={() => setShowClearConfirm(false)} 
            onConfirm={clearAllCompletion} 
          />

          {/* Collection Modal */}
          <AnimatePresence>
        {isCollectionModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            {/* Confirmation Modal */}
            <AnimatePresence>
              {showConfirmClose && (
                <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black/50" onClick={() => setShowConfirmClose(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative bg-white dark:bg-stone-800 p-6 rounded-2xl shadow-xl max-w-sm w-full"
                  >
                    <h4 className="text-lg font-black text-slate-900 dark:text-stone-100 mb-2">정말 닫을까요?</h4>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">입력 중인 내용이 사라집니다.</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowConfirmClose(false)}
                        className="flex-1 py-2.5 rounded-xl font-bold bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                      >
                        계속 작성
                      </button>
                      <button 
                        onClick={() => {
                          setShowConfirmClose(false);
                          setIsCollectionModalOpen(false);
                          setBulkInput('');
                        }}
                        className="flex-1 py-2.5 rounded-xl font-bold bg-rose-500 text-white"
                      >
                        닫기
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[32px] bg-stone-50 dark:bg-stone-850 shadow-[0_25px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col border-2 border-stone-200 dark:border-stone-700 ring-1 ring-black/5 dark:ring-white/10"
            >
              <div className="p-6 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 dark:text-stone-100 tracking-tight">도감 등록</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-stone-300">{tempCompletedIds.size}종 수집됨</span>
                    <span className="text-[11px] text-stone-400 dark:text-stone-550 font-bold">전체 {currentCategoryTotal}종</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-6 w-6 text-stone-500 dark:text-stone-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-stone-850">
                {/* Bulk Import */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-neutral-400 dark:text-stone-500 uppercase tracking-wider">
                      이름으로 일괄 등록
                    </label>
                    <p className="text-[11px] font-bold text-indigo-500/90 dark:text-indigo-400 tracking-tight leading-relaxed">
                      명칭/성급(예: 굴뚝새/3) 입력 시 별점까지 자동 동기화됩니다.
                    </p>
                  </div>
                    <div className="relative overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 h-32">
                      <textarea 
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        placeholder={bulkPlaceholder}
                        className="w-full h-32 bg-white dark:bg-stone-950 p-4 font-mono text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white focus:outline-none resize-none text-neutral-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-700"
                      />
                    </div>
                </div>

                {/* Manual List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-neutral-400 dark:text-stone-500 uppercase tracking-wider block">
                      전체 도감 리스트
                    </label>
                    {tempCompletedIds.size > 0 && (
                      <button 
                        onClick={() => setTempCompletedIds(new Set())}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-black uppercase bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                      >
                        <RefreshCcw className="h-3 w-3" />
                        전체 해제
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sortedCollectionItems.map(item => (
                      <button
                        key={`manual-${item.id}`}
                        onClick={() => toggleTempCompletion(item.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all text-left cursor-pointer",
                          tempCompletedIds.has(item.id)
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-500/40 dark:text-emerald-400"
                            : "bg-neutral-50/70 text-stone-500 border-neutral-200/80 hover:bg-neutral-100 hover:border-neutral-300 dark:bg-stone-800/50 dark:text-stone-400 dark:border-stone-700/60 dark:hover:bg-stone-700/60"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                          tempCompletedIds.has(item.id) 
                            ? "border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400" 
                            : "border-neutral-300 dark:border-stone-600 bg-transparent"
                        )}>
                          {tempCompletedIds.has(item.id) && <CheckCircle2 className="h-3 w-3 text-white dark:text-stone-950" />}
                        </div>
                        <span className="truncate">{item.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Section removed: dead code firebaseLoadError */}
                </div>
              </div>

              <div className="p-6 border-t border-neutral-100 dark:border-stone-800 bg-neutral-50 dark:bg-stone-950">
                <button 
                  onClick={handleSaveModal}
                  className="w-full bg-slate-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl py-4 text-base font-black shadow-lg dark:shadow-none cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  저장
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Welcome Popup for First-Time Users */}
      {/* Global Unmatched Entries Notification Modal */}
      <AnimatePresence>
        {unmatchedNames.length > 0 && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={clearUnmatched}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-[32px] shadow-2xl border border-stone-100 dark:border-stone-800 overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-stone-200 tracking-tight">도감 항목 인식 실패</h3>
                  <p className="text-[13px] text-stone-500 dark:text-stone-400 font-bold leading-relaxed px-2">
                    입력하신 리스트 중 <span className="text-amber-600 dark:text-amber-400">{unmatchedNames.length}개</span>의 항목을 도감에서 찾을 수 없습니다.
                  </p>
                </div>

                <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-4 border border-stone-100/50 dark:border-stone-850">
                  <div className="max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-250 dark:scrollbar-thumb-stone-800">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {unmatchedNames.map((name, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 text-[10px] font-bold rounded-lg shadow-sm">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 font-bold text-center leading-relaxed">
                    도감 데이터에 없는 명칭이거나 입력 형식이 다를 수 있습니다.<br/>
                    <span className="text-amber-600/80 dark:text-amber-400/80">띄어쓰기나 맞춤법</span>이 정확한지 다시 한번 확인해 주세요.
                  </p>
                  
                  <button 
                    onClick={clearUnmatched}
                    className="w-full py-4 bg-slate-900 dark:bg-stone-100 hover:bg-slate-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-sm font-black rounded-2xl shadow-lg dark:shadow-none transition-all active:scale-95 cursor-pointer"
                  >
                    확인
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sync Conflict Resolution Modal */}
      <AnimatePresence>
        {syncConflict && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-stone-100 overflow-hidden z-10"
            >
              <div className="p-6 md:p-8 space-y-6">
                {!showOverwriteConfirm ? (
                  <>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl">
                        <RefreshCcw className="h-8 w-8 animate-spin" style={{ animationDuration: '3s' }} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">도감 데이터 동기화 선택</h3>
                      <p className="text-[14px] text-stone-500 leading-relaxed px-1">
                        {!localStorage.getItem('sync_resolved_uid') 
                          ? "로그인 전에 입력된 도감 이력이 발견되었습니다. 기존 계정 데이터와 어떻게 동기화할지 선택해 주세요."
                          : "이전 세션 또는 다른 계정의 로컬 데이터 이력이 발견되었습니다. 기존 계정 데이터와 어떻게 동기화할지 선택해 주세요."
                        }
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Option 1: Merge (Recommended) */}
                      <button
                        onClick={() => syncConflict.resolve('merge')}
                        className="w-full p-4 text-left border-2 border-indigo-500 hover:bg-indigo-50/50 rounded-2xl transition-all group flex items-start gap-3.5"
                      >
                        <div className="mt-0.5 p-1 px-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-black">합치기</div>
                        <div className="flex-1">
                          <div className="text-[14px] font-black text-slate-800 flex items-center gap-1.5">
                            두 데이터 병합하기 <span className="text-xs text-indigo-500 font-bold">(추천)</span>
                          </div>
                          <div className="text-xs text-stone-500 font-medium mt-1">
                            기존 계정 데이터와 {!localStorage.getItem('sync_resolved_uid') ? '로그인 전' : '현재 기기의'} 체크 항목, 등록된 반려동물(펫) 목록, 활성화된 작물 알림 정보를 지움 없이 안전하게 병합합니다.
                          </div>
                        </div>
                      </button>

                      {/* Option 2: Cloud only */}
                      <button
                        onClick={() => syncConflict.resolve('cloud')}
                        className="w-full p-4 text-left border border-stone-200 hover:border-stone-400 hover:bg-stone-50 rounded-2xl transition-all flex items-start gap-3.5"
                      >
                        <div className="mt-0.5 p-1 px-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-black">불러오기</div>
                        <div className="flex-1">
                          <div className="text-[14px] font-black text-slate-800">
                            기존 계정 데이터 유지
                          </div>
                          <div className="text-[11px] text-stone-500 font-bold mt-0.5 flex flex-wrap gap-x-2">
                            <span>• 도감 {syncConflict.cloudCount || 0}개 완료</span>
                            {(syncConflict.cloudPetsCount || 0) > 0 && <span>• 펫 {syncConflict.cloudPetsCount}마리</span>}
                            {(syncConflict.cloudActiveSlotsCount || 0) > 0 && <span>• 작물 알림 {syncConflict.cloudActiveSlotsCount}개</span>}
                          </div>
                          <div className="text-xs text-stone-500 font-medium mt-1.5">
                            서버에 보존 중이던 기존 이력 및 설정 데이터를 복원합니다. {!localStorage.getItem('sync_resolved_uid') ? '최근 로그인 없이 추가한 변경 정보' : '현재 기기에 저장되어 있던 로컬 데이터'}(도감 완료 {syncConflict.localCount || 0}개{(syncConflict.localPetsCount || 0) > 0 ? `, 펫 ${syncConflict.localPetsCount}마리` : ''}{(syncConflict.localActiveSlotsCount || 0) > 0 ? `, 알림 ${syncConflict.localActiveSlotsCount}개` : ''})는 사라집니다.
                          </div>
                        </div>
                      </button>

                      {/* Option 3: Guest only/Cloud overwrite */}
                      <button
                        onClick={() => setShowOverwriteConfirm(true)}
                        className="w-full p-4 text-left border border-rose-200 hover:border-rose-400 hover:bg-rose-50/30 rounded-2xl transition-all flex items-start gap-3.5 group"
                      >
                        <div className="mt-0.5 p-1 px-1.5 bg-rose-50 text-rose-500 rounded-lg text-xs font-black">덮어쓰기</div>
                        <div className="flex-1">
                          <div className="text-[14px] font-black text-slate-800 group-hover:text-rose-600 transition-colors">
                            {!localStorage.getItem('sync_resolved_uid') ? '로그인 전 데이터로 덮어쓰기' : '현재 기기 데이터로 덮어쓰기'}
                          </div>
                          <div className="text-[11px] text-rose-600 font-bold mt-0.5 flex flex-wrap gap-x-2">
                            <span>• 도감 {syncConflict.localCount || 0}개 완료</span>
                            {(syncConflict.localPetsCount || 0) > 0 && <span>• 펫 {syncConflict.localPetsCount}마리</span>}
                            {(syncConflict.localActiveSlotsCount || 0) > 0 && <span>• 작물 알림 {syncConflict.localActiveSlotsCount}개</span>}
                          </div>
                          <div className="text-xs text-stone-500 font-medium mt-1.5">
                            서버에 저장된 정보를 모두 지우고, {!localStorage.getItem('sync_resolved_uid') ? '로그인하지 않은 상태에서 저장한 현재 내용' : '현재 기기에 남아있는 로컬 데이터'}로 교체합니다.
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSyncConflict(null);
                          handleLogout(false);
                        }}
                        className="w-full py-3.5 border border-stone-200 hover:bg-stone-50 text-stone-400 hover:text-stone-600 text-[11px] font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        로그아웃 (다음에 다시 선택하기)
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl">
                        <AlertTriangle className="h-8 w-8 animate-bounce" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">정말 덮어쓰시겠습니까?</h3>
                      <p className="text-[14px] text-stone-500 leading-relaxed px-1">
                        서버에 저장되어 있는 기존 계정 정보가 로컬 기기의 데이터로 전면 덮어씌워집니다.
                      </p>
                      
                      <div className="w-full text-left bg-stone-50 rounded-xl p-3.5 border border-stone-200/60 text-xs text-stone-600 space-y-1.5">
                        <div className="font-bold text-slate-700 flex items-center justify-between">
                          <span>🗑️ 영구 삭제될 데이터 (서버 저장분)</span>
                        </div>
                        <div className="pl-3 text-stone-500 font-medium">
                          • 도감 완료: {syncConflict.cloudCount || 0}개
                          {(syncConflict.cloudPetsCount || 0) > 0 && ` / 펫: ${syncConflict.cloudPetsCount}마리`}
                          {(syncConflict.cloudActiveSlotsCount || 0) > 0 && ` / 알림: ${syncConflict.cloudActiveSlotsCount}개`}
                        </div>
                        
                        <div className="font-bold text-rose-600 mt-2.5 flex items-center justify-between">
                          <span>💾 업로드될 데이터 (로컬 보관분)</span>
                        </div>
                        <div className="pl-3 text-stone-500 font-medium">
                          • 도감 완료: {syncConflict.localCount || 0}개
                          {(syncConflict.localPetsCount || 0) > 0 && ` / 펫: ${syncConflict.localPetsCount}마리`}
                          {(syncConflict.localActiveSlotsCount || 0) > 0 && ` / 알림: ${syncConflict.localActiveSlotsCount}개`}
                        </div>
                      </div>

                      <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                        ⚠️ 이 작업은 되돌릴 수 없습니다. 신중히 결정해 주세요!
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => syncConflict.resolve('local')}
                        className="w-full py-3.5 bg-rose-500 hover:bg-rose-650 active:scale-98 text-white font-black rounded-2xl transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        기존 내용 지우고 덮어쓰기
                      </button>
                      <button
                        onClick={() => setShowOverwriteConfirm(false)}
                        className="w-full py-3.5 bg-stone-100 hover:bg-stone-200 active:scale-98 text-stone-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        취소하고 동기화 방식 다시 선택
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ModalManager
        isWelcomeOpen={isWelcomeOpen}
        setIsWelcomeOpen={setIsWelcomeOpen}
        isGuideOpen={isGuideOpen}
        setIsGuideOpen={setIsGuideOpen}
        forceShowIntro={forceShowIntro}
      />

      {/* Weather Modal */}
      <AnimatePresence>
        {isWeatherModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[32px] bg-white dark:bg-stone-850 shadow-[0_25px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col border-2 border-stone-200 dark:border-stone-700 ring-1 ring-black/5 dark:ring-white/10"
            >
              <div className="p-6 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
                <h3 className="text-xl font-bold font-sans text-slate-900 dark:text-stone-200">날씨 정보 입력</h3>
                <button 
                  onClick={() => setIsWeatherModalOpen(false)}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full cursor-pointer text-stone-500 dark:text-stone-400"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-stone-850">
                {/* Detailed Weather (Next 24 Hours) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500">
                      24시간 상세 예보
                    </label>
                    <span className="text-[11px] text-slate-450 dark:text-stone-500 italic">6시간 주기 터치하여 입력</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 sm:gap-2">
                    {[0, 6, 12, 18, 24].map((hOffset) => {
                      const targetTime = startOfHour(addHours(currentTime, hOffset));
                      const cycleH = getCycleHour(getHours(targetTime));
                      const key = format(targetTime, 'yyyy-MM-dd') + `-${cycleH}`;
                      const val = draftDetailedWeather[key] || 'Unknown';
                      
                      return (
                        <div key={key} className="space-y-2">
                           <p className="text-center text-[10px] sm:text-[11px] font-mono font-bold text-neutral-600 dark:text-stone-400 whitespace-nowrap">
                            {cycleH.toString().padStart(2, '0')}~{(cycleH + 6).toString().padStart(2, '0')}시
                          </p>
                          <div className="flex flex-col gap-1">
                            {(['Clear', 'RainSnow', 'Rainbow', 'Meteor'] as GameWeather[]).map(w => {
                              const isSelected = val === w || (w === 'Clear' && val === 'Heatwave');
                              const displayWeatherType = (w === 'Clear' && val === 'Heatwave') ? 'Heatwave' : w;
                              return (
                                <button
                                  key={`${key}-${w}`}
                                  onClick={() => toggleDraftDetailedWeather(key, w)}
                                  className={cn(
                                    "flex items-center justify-center rounded-lg p-1.5 sm:p-2 transition-all cursor-pointer border",
                                    getWeatherButtonClass(isSelected)
                                  )}
                                  title={translateWeather(displayWeatherType)}
                                >
                                  <WeatherIcon weather={displayWeatherType} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Weekly Base Weather */}
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-bold uppercase tracking-wider text-neutral-400 dark:text-stone-500">
                      요일별 상시 날씨 (기본값)
                    </label>
                    <p className="text-[11px] text-neutral-450 dark:text-stone-500">※ 스마트워치의 날씨 정보와 동일하게 선택해주세요</p>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const currentGDay = format(currentTime, 'yyyy-MM-dd');
                      const currentGDate = parse(currentGDay, 'yyyy-MM-dd', new Date());
                      const orderedGDays = [];
                      for (let i = 1; i <= 7; i++) {
                        orderedGDays.push(addDays(currentGDate, i));
                      }
                      return orderedGDays.map((gDate, i) => {
                        const key = format(gDate, 'yyyy-MM-dd');
                        const dayName = getKoreanDayName(gDate);
                        return (
                          <div key={key} className="space-y-1 sm:space-y-2">
                            <p className="text-center text-xs font-bold text-neutral-800 dark:text-stone-300">
                              {dayName}
                            </p>
                            <div className="flex flex-col gap-1 mt-1">
                              {(['Clear', 'RainSnow', 'Rainbow', 'Meteor'] as GameWeather[]).map(w => {
                                const val = draftWeeklyWeather[key] || 'Unknown';
                                const isSelected = val === w || (w === 'Clear' && val === 'Heatwave');
                                const displayWeatherType = (w === 'Clear' && val === 'Heatwave') ? 'Heatwave' : w;
                                return (
                                  <button
                                    key={`${key}-${w}`}
                                    onClick={() => toggleDraftWeeklyWeather(key, w)}
                                    className={cn(
                                      "flex items-center justify-center rounded-lg p-1.5 sm:p-2 transition-all cursor-pointer border",
                                      getWeatherButtonClass(isSelected)
                                    )}
                                    title={translateWeather(displayWeatherType)}
                                  >
                                    <WeatherIcon weather={displayWeatherType} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-neutral-100 dark:border-stone-800 bg-neutral-50 dark:bg-stone-950">
                <button 
                  onClick={() => {
                    setWeeklyWeather(draftWeeklyWeather);
                    localStorage.setItem('weekly_weather', JSON.stringify(draftWeeklyWeather));
                    setDetailedWeather(draftDetailedWeather);
                    localStorage.setItem('detailed_weather', JSON.stringify(draftDetailedWeather));
                    markCollectionsModified();
                    if (user) {
                      debouncedSyncAllData();
                    }
                    setIsWeatherModalOpen(false);
                  }}
                  className="w-full bg-neutral-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl py-3 text-sm font-bold shadow-lg dark:shadow-none cursor-pointer"
                >
                  적용하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Google Login Warning Modal */}
      <AnimatePresence>
        {loginWarningType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLoginWarningType(null)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-stone-200 dark:border-stone-800 animate-zoomIn"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-300 rounded-lg shrink-0">
                    <AlertCircle className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-extrabold text-xs text-stone-950 dark:text-stone-100">
                    {loginWarningType === 'webview' ? '구글 로그인 오류 방지 안내' : '구글 로그인 미리보기 제한 안내'}
                  </h3>
                </div>
                <button 
                  onClick={() => setLoginWarningType(null)}
                  className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3.5 space-y-4 text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                {loginWarningType === 'webview' ? (
                  <>
                    <div className="bg-stone-50 dark:bg-stone-950 rounded-xl p-3 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 font-bold">
                      카카오톡, 네이버 카페 등 인앱 브라우저에서는 구글 로그인이 차단될 수 있습니다.
                    </div>
                    
                    <p>
                      구글은 사용자 계정을 보호하기 위해 웹뷰 환경에서의 계정 인증 시도를 전면 금지하고 있습니다.
                    </p>

                    <div className="space-y-2 bg-stone-50/50 dark:bg-stone-950/50 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
                      <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-[10px] uppercase tracking-wider">🛠️ 해결 방법</h4>
                      <ol className="list-decimal pl-4 space-y-1.5 text-stone-600 dark:text-stone-400">
                        <li>화면 우측 상단이나 하단 메뉴 버튼(<span className="font-bold">`⋮`</span> 혹은 공유 버튼 <span className="font-bold">`⎋`</span>)을 탭합니다.</li>
                        <li><strong className="text-stone-950 dark:text-stone-200">'다른 브라우저로 열기'</strong> 또는 <strong className="text-stone-950 dark:text-stone-200">'Chrome/Safari로 열기'</strong>를 선택해 주세요.</li>
                        <li>또는, 주소를 복사하여 모바일의 기본 브라우저 주소창에 붙여넣어 접속해주세요.</li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <div className="bg-stone-50 dark:bg-stone-950 rounded-xl p-3.5 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 leading-snug">
                    <p className="font-extrabold mb-1">⚠️ 팝업 차단 / 로그인 실패 가능성 안내</p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1.5">
                      미리보기 화면에서는 구글 보안 정책에 의해 <strong>로그인이 차단될 확률이 매우 높습니다</strong>.<br/><br/>
                      아래의 <strong className="text-sky-600 dark:text-sky-400">"새 창(새 탭)으로 열기"</strong> 버튼을 클릭하여 새 브라우저 탭에서 안정적으로 로그인하시는 것을 권장합니다!
                    </p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  {loginWarningType === 'iframe' && (
                    <button
                      onClick={() => {
                        window.open(window.location.href, '_blank');
                        setLoginWarningType(null);
                      }}
                      className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      🚀 새 창(새 탭)으로 열기
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const url = window.location.href;
                        navigator.clipboard.writeText(url);
                        alert("주소가 복사되었습니다! 새 브라우저 주소창에 붙여넣어 접속해 보세요.");
                      }}
                      className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl transition-all active:scale-95 text-[11px] text-center cursor-pointer"
                    >
                      주소 복사
                    </button>
                    <button
                      onClick={() => {
                        setLoginWarningType(null);
                        handleGoogleLogin(true);
                      }}
                      className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 font-bold rounded-xl transition-all active:scale-95 text-[11px] text-center cursor-pointer"
                    >
                      무시하고 시도
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Global Sync Induction Floating Banner */}
      {!authLoading && !user && !isTimerModalOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-full pl-5 pr-2 py-2 shadow-2xl shadow-slate-900/30 flex items-center gap-4 w-max">
            <span className="text-[12px] font-bold tracking-tight">
              수집 기록이 날아갈 수 있어요! ☁️
            </span>
            <button
              onClick={handleGoogleLogin}
              className="px-4 py-2 bg-white hover:bg-neutral-100 text-slate-900 rounded-full text-[12px] font-black transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <span>간편 연동</span>
            </button>
          </div>
        </div>
      )}

      {(() => {
        const handleBackupData = () => {
          const backup = {
            // -- Collection Data --
            completed_bird_ids: Array.from(completedBirdIds),
            completed_insect_ids: Array.from(completedInsectIds),
            completed_fish_ids: Array.from(completedFishIds),
            completed_food_ids: Array.from(completedFoodIds),
            completed_gardening_ids: Array.from(completedGardeningIds),
            completed_ocean_cleaning_ids: Array.from(completedOceanCleaningIds),
            master_bird_ids: Array.from(masterBirdIds),
            master_insect_ids: Array.from(masterInsectIds),
            master_fish_ids: Array.from(masterFishIds),
            master_food_ids: Array.from(masterFoodIds),
            master_gardening_ids: Array.from(masterGardeningIds),
            master_ocean_cleaning_ids: Array.from(masterOceanCleaningIds),
            pigtown_pets: pets,
            item_ratings: ratings,
            weekly_weather: weeklyWeather,
            detailed_weather: detailedWeather,

            // -- Settings & Configs --
            ui_settings: {
              theme: localStorage.getItem('pig_town_theme_mode') || 'system',
              fontSize: parseInt(localStorage.getItem('pig_town_font_size_level') || '3', 10),
              default_tab: localStorage.getItem('pig_town_default_tab') || 'home',
              sidebar_expanded: localStorage.getItem('pig_town_sidebar_expanded') !== 'false',
              sort_orders: sortOrders,
              filter_expanded: userFilterExpandedPreference
            },
            notification_settings: {
              tg_bot_token: localStorage.getItem('tg_bot_token') || '',
              tg_chat_id: localStorage.getItem('tg_chat_id') || '',
              tg_gas_url: localStorage.getItem('tg_gas_url') || '',
              is_tg_configured: localStorage.getItem('is_tg_configured') === 'true',
              is_gas_configured: localStorage.getItem('is_gas_configured') === 'true',
              sound_enabled: localStorage.getItem('farming_sound_enabled') !== 'false', // default true
              presets: (() => {
                const p = localStorage.getItem('user_notification_presets');
                return safeJsonParse(p, []);
              })()
            },
            farming_data: {
              slots: (() => {
                const s = localStorage.getItem('farming_slots');
                return safeJsonParse(s, null);
              })()
            },

            version: '1.1.0',
            app_version: APP_VERSION,
            backup_date: new Date().toISOString()
          };
          return JSON.stringify(backup, null, 2);
        };

        const handleRestoreData = (data: any) => {
          if (!data || typeof data !== 'object') {
            throw new Error('올바르지 않은 백업 파일 데이터 형식입니다.');
          }

          const hasKeys = [
            'completed_bird_ids', 
            'completed_insect_ids', 
            'pigtown_pets', 
            'item_ratings',
            'ui_settings',
            'notification_settings'
          ].some(k => k in data);

          if (!hasKeys) {
            throw new Error('피그타운의 백업 파일 형식이 아닌 것 같습니다.');
          }

          const toSet = (arr: any) => new Set<string>(Array.isArray(arr) ? arr.map(String) : []);

          // 1. Recover Collections & Preferences with robust fallbacks
          const birdIds = data.completed_bird_ids || [];
          const insectIds = data.completed_insect_ids || [];
          const fishIds = data.completed_fish_ids || [];
          const foodIds = data.completed_food_ids || [];
          const gardeningIds = data.completed_gardening_ids || [];
          const oceanCleaningIds = data.completed_ocean_cleaning_ids || [];

          setCompletedBirdIds(toSet(birdIds));
          setCompletedInsectIds(toSet(insectIds));
          setCompletedFishIds(toSet(fishIds));
          setCompletedFoodIds(toSet(foodIds));
          setCompletedGardeningIds(toSet(gardeningIds));
          setCompletedOceanCleaningIds(toSet(oceanCleaningIds));

          const masterBirds = data.master_bird_ids || [];
          const masterInsects = data.master_insect_ids || [];
          const masterFish = data.master_fish_ids || [];
          const masterFood = data.master_food_ids || [];
          const masterGardening = data.master_gardening_ids || [];
          const masterOceanCleaning = data.master_ocean_cleaning_ids || [];

          setMasterBirdIds(toSet(masterBirds));
          setMasterInsectIds(toSet(masterInsects));
          setMasterFishIds(toSet(masterFish));
          setMasterFoodIds(toSet(masterFood));
          setMasterGardeningIds(toSet(masterGardening));
          setMasterOceanCleaningIds(toSet(masterOceanCleaning));

          const restoredPets = Array.isArray(data.pigtown_pets) ? data.pigtown_pets : [];
          setPets(restoredPets);

          const restoredRatings = data.item_ratings && typeof data.item_ratings === 'object' ? data.item_ratings : {};
          setRatings(restoredRatings);

          const restoredWeekly = data.weekly_weather && typeof data.weekly_weather === 'object' ? cleanWeeklyWeather(data.weekly_weather) : {};
          setWeeklyWeather(restoredWeekly);

          const restoredDetailed = data.detailed_weather && typeof data.detailed_weather === 'object' ? data.detailed_weather : {};
          setDetailedWeather(restoredDetailed);

          // 2. LocalStorage Syncing (Essential for offline/local storage and service workers)
          localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(toSet(birdIds))));
          localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(toSet(insectIds))));
          localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(toSet(fishIds))));
          localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(toSet(foodIds))));
          localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(toSet(gardeningIds))));
          localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(toSet(oceanCleaningIds))));

          localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(toSet(masterBirds))));
          localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(toSet(masterInsects))));
          localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(toSet(masterFish))));
          localStorage.setItem('master_food_ids', JSON.stringify(Array.from(toSet(masterFood))));
          localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(toSet(masterGardening))));
          localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(toSet(masterOceanCleaning))));

          localStorage.setItem('pigtown_pets', JSON.stringify(restoredPets));
          localStorage.setItem('item_ratings', JSON.stringify(restoredRatings));
          localStorage.setItem('weekly_weather', JSON.stringify(restoredWeekly));
          localStorage.setItem('detailed_weather', JSON.stringify(restoredDetailed));

          // 3. UI Settings Fallbacks
          const uiTheme = (data.ui_settings && data.ui_settings.theme) || 'system';
          const uiFontSize = (data.ui_settings && typeof data.ui_settings.fontSize === 'number') ? data.ui_settings.fontSize : 3;
          const uiDefaultTab = (data.ui_settings && data.ui_settings.default_tab) || 'home';
          const uiSidebarExpanded = (data.ui_settings && data.ui_settings.sidebar_expanded !== undefined) ? data.ui_settings.sidebar_expanded : true;
          const uiSortOrders = (data.ui_settings && data.ui_settings.sort_orders) || {};
          const uiFilterExpanded = (data.ui_settings && data.ui_settings.filter_expanded !== undefined) ? data.ui_settings.filter_expanded : true;

          setThemeMode(uiTheme);
          setFontSizeLevel(uiFontSize);
          setDefaultTab(uiDefaultTab as Category);
          setIsDesktopSidebarExpanded(uiSidebarExpanded);
          const updatedSortOrders = { ...sortOrders, ...uiSortOrders };
          setSortOrders(updatedSortOrders);
          setUserFilterExpandedPreference(uiFilterExpanded);
          
          localStorage.setItem('pig_town_theme_mode', uiTheme);
          localStorage.setItem('pig_town_font_size_level', uiFontSize.toString());
          localStorage.setItem('pig_town_default_tab', uiDefaultTab);
          localStorage.setItem('pig_town_sidebar_expanded', String(uiSidebarExpanded));
          localStorage.setItem('pig_town_sort_orders', JSON.stringify(updatedSortOrders));

          // 4. Notification Fallbacks
          const ns = data.notification_settings || {};
          const tgToken = ns.tg_bot_token || '';
          const tgChatId = ns.tg_chat_id || '';
          const tgGasUrl = ns.tg_gas_url || '';
          const isTgConf = ns.is_tg_configured !== undefined ? ns.is_tg_configured : (tgToken.trim() !== '' && tgChatId.trim() !== '');
          const isGasConf = ns.is_gas_configured !== undefined ? ns.is_gas_configured : (tgGasUrl.trim() !== '');
          const soundEnabled = ns.sound_enabled !== undefined ? ns.sound_enabled : true;
          const restoredPresets = Array.isArray(ns.presets) ? ns.presets : [];

          localStorage.setItem('tg_bot_token', tgToken);
          localStorage.setItem('tg_chat_id', tgChatId);
          localStorage.setItem('tg_gas_url', tgGasUrl);
          localStorage.setItem('is_tg_configured', JSON.stringify(isTgConf));
          localStorage.setItem('is_gas_configured', JSON.stringify(isGasConf));
          localStorage.setItem('farming_sound_enabled', JSON.stringify(soundEnabled));
          localStorage.setItem('user_notification_presets', JSON.stringify(restoredPresets));

          if (user) {
            localStorage.setItem(`tg_bot_token_user_${user.uid}`, tgToken);
            localStorage.setItem(`tg_chat_id_user_${user.uid}`, tgChatId);
            localStorage.setItem(`tg_gas_url_user_${user.uid}`, tgGasUrl);
            localStorage.setItem(`is_tg_configured_user_${user.uid}`, JSON.stringify(isTgConf));
            localStorage.setItem(`is_gas_configured_user_${user.uid}`, JSON.stringify(isGasConf));
          }

          // 5. Farming slots restoration
          // We always want exactly 8 slots. If the backup contains less, we fill them.
          const incomingSlots = (data.farming_data && Array.isArray(data.farming_data.slots)) ? data.farming_data.slots : [];
          const filledSlots = Array.from({ length: 8 }, (_, i) => {
            const isSlot = incomingSlots[i] || {};
            
            // Resolve originalStartTime with fallback to startTime
            const originalStartTime = isSlot.originalStartTime !== undefined 
              ? isSlot.originalStartTime 
              : (isSlot.startTime !== undefined ? isSlot.startTime : null);
              
            // Resolve originalDuration with fallback to duration
            const originalDuration = isSlot.originalDuration !== undefined
              ? isSlot.originalDuration
              : (isSlot.duration !== undefined ? isSlot.duration : null);

            return {
              id: isSlot.id || `slot_${i + 1}`,
              cropId: isSlot.cropId !== undefined ? isSlot.cropId : null,
              cropName: isSlot.cropName !== undefined ? isSlot.cropName : null,
              cropEmoji: isSlot.cropEmoji !== undefined ? isSlot.cropEmoji : null,
              originalStartTime: originalStartTime,
              originalDuration: originalDuration,
              userOffset: isSlot.userOffset !== undefined ? isSlot.userOffset : 0,
              isNotified: isSlot.isNotified !== undefined ? isSlot.isNotified : false,
              isFiveStarMode: isSlot.isFiveStarMode !== undefined ? isSlot.isFiveStarMode : false,
              fiveStarNotificationState: isSlot.fiveStarNotificationState !== undefined ? isSlot.fiveStarNotificationState : null,
              notifiedStages: isSlot.notifiedStages !== undefined ? isSlot.notifiedStages : [],
              startTime: isSlot.startTime !== undefined ? isSlot.startTime : null,
              duration: isSlot.duration !== undefined ? isSlot.duration : null,
              targetTime: isSlot.targetTime !== undefined ? isSlot.targetTime : null
            };
          });

          localStorage.setItem('farming_slots', JSON.stringify(filledSlots));

          // Notify other components (like CropTimer) to refresh their state from LocalStorage
          window.dispatchEvent(new Event('local-backup-imported'));

          // Raise modified sync notifications for collection data
          markCollectionsModified();

          // Trigger Cloud Synchronizer if user logged in
          if (user) {
            // Fix missing farmingSlots and userPresets update during restore
            const userDocRef = doc(db, 'users', user.uid);
            const farmingSlotsPayload: Record<string, any> = {};
            filledSlots.forEach((slot: any) => {
              if (slot && slot.cropId !== null) {
                if (!slot.instanceId) {
                  slot.instanceId = Math.random().toString(36).substring(2, 15);
                }
                farmingSlotsPayload[slot.instanceId] = {
                  ...slot,
                  updatedAt: serverTimestamp()
                };
              }
            });

            const forceSyncFarmingAndPresets = async () => {
              try {
                console.log("[Backup Sync] Force syncing farming slots and presets...");
                await setDoc(userDocRef, {
                  farmingSlots: farmingSlotsPayload,
                  slots: deleteField(),
                  userPresets: restoredPresets,
                  updatedAt: serverTimestamp()
                }, { merge: true });
                console.log("[Backup Sync] Force sync completed successfully.");
              } catch (err) {
                console.error("[Backup Sync] Force sync failed:", err);
              }
            };
            forceSyncFarmingAndPresets();

            if (globalSyncTimerRef.current) clearTimeout(globalSyncTimerRef.current);
            globalSyncTimerRef.current = setTimeout(() => {
              debouncedSyncAllData();
            }, 300);
          }
        };

        const handleConfirmRestore = async () => {
          if (!importPendingData) return;
          try {
            isResetting.current = true; // Pause snapshot listeners to prevent them from reverting the import
            handleRestoreData(importPendingData);
            
            if (user) {
              await forceSyncAllData(user, true);
            }
            
            setRestoreSuccessMessage('백업 파일의 도감 기록 및 설정 복원을 완료했습니다.');
            setImportPendingData(null);
          } catch (error: any) {
            setRestoreErrorMessage('복원 도중 오류가 발생했습니다: ' + (error?.message || error));
            setImportPendingData(null);
          } finally {
            // Delay resetting the flag so any pending snapshot writes are safely ignored
            setTimeout(() => {
              isResetting.current = false;
            }, 3000);
          }
        };

        return (
          <>
            <SettingsModal 
              isOpen={isSettingsModalOpen}
              onClose={() => setIsSettingsModalOpen(false)}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              fontSizeLevel={fontSizeLevel}
              setFontSizeLevel={setFontSizeLevel}
              defaultTab={defaultTab}
              setDefaultTab={setDefaultTab}
              isLoggedIn={!!user}
              onBackupData={handleBackupData}
              onRestoreData={handleRestoreData}
              onStartImport={(parsedData) => {
                setImportPendingData(parsedData);
                setIsSettingsModalOpen(false); // Close settings modal
              }}
              onImportError={(errMsg) => {
                setRestoreErrorMessage(errMsg);
                setIsSettingsModalOpen(false); // Close settings modal
              }}
              isAdmin={user ? allowedUids.includes(user.uid) : false}
              minSupportedVersion={minSupportedVersion}
              isMaintenanceMode={isMaintenanceMode}
              maintenanceStart={maintenanceStart}
              maintenanceEnd={maintenanceEnd}
              allowedUids={allowedUids}
              bypassCode={bypassCode}
              marqueeNotice={marqueeNotice}
              marqueeRepeat={marqueeRepeat}
              marqueeHistory={marqueeHistory}
              marqueeCustom={marqueeCustom}
              isForceUpdateActive={isForceUpdateActive}
              forceUpdateMessage={forceUpdateMessage}
              isManualQuotaExceeded={isManualQuotaExceeded}
              menuStatus={menuStatus}
              currentTime={currentTime}
              adminWeeklyWeather={adminWeeklyWeather}
              adminDetailedWeather={adminDetailedWeather}
              testUpdateBanner={() => {
                setUpdateAvailable(true);
                setUpdateDismissed(false);
              }}
              testMaintenance={() => {
                setManualMaintenancePreview(true);
                setManualCompletedPreview(false);
                setIsSettingsModalOpen(false);
              }}
              testMaintenanceCompleted={() => {
                setManualCompletedPreview(true);
                setManualMaintenancePreview(false);
                setIsSettingsModalOpen(false);
              }}
              onUpdateConfig={handleUpdateAppConfig}
            />

            {/* Custom Confirm Restore Sub-modal outside settings modal */}
            {importPendingData && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <div onClick={() => setImportPendingData(null)} className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md" />
                <div id="confirm-restore-overlay" className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                    <Database className="h-9 w-9" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-stone-50">도감 기록을 불러올까요?</h3>
                  <div className="text-xs text-stone-550 dark:text-stone-400 leading-relaxed max-w-[280px]">
                    선택한 백업 파일의 기록으로 기존 정보가 <strong className="text-rose-500">전부 덮어쓰기</strong>됩니다.<br />기존 정보는 복구할 수 없으니 주의하세요.
                  </div>
                  <div className="flex flex-col w-full gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmRestore}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      불러오기                    </button>
                    <button
                      type="button"
                      onClick={() => setImportPendingData(null)}
                      className="w-full py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-extrabold rounded-2xl text-xs transition-all active:scale-95 cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Success Sub-modal outside settings modal */}
            {restoreSuccessMessage && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <div onClick={() => setRestoreSuccessMessage(null)} className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md" />
                <div id="success-restore-overlay" className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                    <Check className="h-9 w-9" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-stone-50">불러오기 완료</h3>
                  <div className="text-xs text-stone-550 dark:text-stone-400 leading-relaxed max-w-[280px]">
                    {restoreSuccessMessage}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRestoreSuccessMessage(null)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

            {/* Custom Error Sub-modal outside settings modal */}
            {restoreErrorMessage && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <div onClick={() => setRestoreErrorMessage(null)} className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md" />
                <div id="error-restore-overlay" className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
                    <AlertTriangle className="h-9 w-9" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-stone-50">불러오기 실패</h3>
                  <div className="text-xs text-rose-500 leading-relaxed max-w-[280px] break-all font-bold">
                    {restoreErrorMessage}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRestoreErrorMessage(null)}
                    className="w-full py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-extrabold rounded-2xl text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Recommended Items Info Modal Popup */}
      <AnimatePresence>
        {isRecInfoOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRecInfoOpen(false)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-stone-900 p-6 md:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 shrink-0 font-sans z-[110]"
            >
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-900 dark:bg-stone-100 rounded-xl text-white dark:text-stone-900">
                    <Info className="h-4 w-4" />
                  </div>
                  <h4 className="font-extrabold text-base md:text-lg text-stone-900 dark:text-stone-100">
                    추천 가이드 노출 조건 안내
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecInfoOpen(false)}
                  className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-medium overflow-y-auto flex-1 pr-1">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/30">
                  <p className="break-keep text-stone-700 dark:text-stone-200">
                    이 영역은 게임 내 <strong className="text-slate-900 dark:text-amber-400 font-black">시간과 날씨</strong>를 기반으로, <strong className="text-slate-900 dark:text-stone-100 font-extrabold">지금 바로 도감 등록이 가능한 종류</strong>만 골라내어 추천해 드리는 영역입니다.
                  </p>
                  <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 break-keep">
                    ※ 24시간 상시 출현하거나 날씨에 관계없이 항상('날씨무관') 잡을 수 있는 도감은 리스트의 가독성을 위해 추천 목록에서 제외되며, 실시간 상황에 맞는 도감 위주로 표시됩니다.
                  </p>
                </div>

                {/* Weather Input Guide and Link */}
                <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-2.5">
                  <h5 className="font-extrabold text-stone-900 dark:text-amber-400 text-xs flex items-center gap-1.5">
                    🌦️ 게임 내 날씨 정보 입력 방법
                  </h5>
                  <p className="text-xs break-keep text-stone-700 dark:text-stone-300 leading-relaxed">
                    화면 <strong className="text-stone-900 dark:text-stone-100 font-bold">우측 상단</strong>에 위치한 <strong className="text-stone-900 dark:text-stone-100 font-bold underline decoration-amber-400 dark:decoration-amber-500/50 decoration-2">[요일 시각 / 날씨 위젯]</strong> 버튼(톱니바퀴 아이콘 ⚙️)을 클릭하시면 시각 및 요일별 상세 날씨를 지정할 수 있는 <strong className="text-amber-900 dark:text-amber-200 font-bold bg-amber-100/40 dark:bg-amber-900/30 px-1 rounded-sm">날씨 정보 입력 팝업</strong>이 나타납니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecInfoOpen(false);
                      setIsWeatherModalOpen(true);
                    }}
                    className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-900 dark:bg-stone-100 hover:bg-neutral-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 font-extrabold text-xs rounded-xl shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                  >
                    날씨 정보 입력/변경 팝업 열기 <span className="text-[10px]">➔</span>
                  </button>
                </div>

                <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-4 border border-stone-100 dark:border-stone-800 space-y-3.5">
                  <h5 className="font-bold text-stone-800 dark:text-stone-200 text-xs flex items-center gap-1.5 border-b border-stone-200/60 dark:border-stone-800 pb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-stone-100"></span>
                    등장 조건
                  </h5>

                  <div className="flex gap-2.5 items-start">
                    <span className="bg-slate-950 dark:bg-stone-800 text-white dark:text-stone-100 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0">시간 조건</span>
                    <p className="text-xs break-keep text-stone-600 dark:text-stone-400">
                      대상의 등장 시간대(예: 08:00~16:00 등) 범위 내에 <strong className="text-stone-900 dark:text-stone-100 font-bold underline decoration-amber-400 dark:decoration-amber-500/50 decoration-2">현재의 시간</strong>이 포함되어 있어야 합니다.
                    </p>
                  </div>


                  <div className="flex gap-2.5 items-start">
                    <span className="bg-slate-950 dark:bg-stone-800 text-white dark:text-stone-100 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0">날씨 조건</span>
                    <div className="text-xs break-keep text-stone-600 dark:text-stone-300 space-y-1 bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 w-full">
                      <p>실제 <strong className="text-stone-900 dark:text-stone-100 font-bold">게임 날씨</strong>가 대상의 등장 조건과 일치되어야 합니다:</p>
                      <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                        <li><span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold px-1 rounded-sm">비/눈/무지개</span>: 게임 날씨가 <strong className="text-blue-600 dark:text-blue-400 font-semibold">비눈</strong> 또는 <strong className="text-violet-600 dark:text-violet-400 font-semibold">무지개</strong>일 때 매칭됩니다.</li>
                        <li><span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 font-bold px-1 rounded-sm">맑음/무지개</span>: 게임 날씨가 <strong className="text-amber-600 dark:text-amber-400 font-semibold">맑음</strong> 또는 <strong className="text-violet-600 dark:text-violet-400 font-semibold">무지개</strong>일 때 매칭됩니다.</li>
                        <li><span className="bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-bold px-1 rounded-sm">무지개</span>: 게임 날씨가 오직 <strong className="text-violet-600 dark:text-violet-400 font-extrabold">무지개</strong>일 때만 매칭됩니다.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl p-4 text-xs space-y-2 text-amber-900 dark:text-amber-400 font-medium">
                  <h5 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    💡 필터링 제외 조건 (추천 목록에 표시되지 않는 대상)
                  </h5>
                  <ul className="list-disc pl-4 space-y-1 break-keep text-amber-800 dark:text-amber-400 text-[11px] font-semibold">
                    <li>이미 도감에 등록 완료 구분을 체크하여 <strong className="font-bold text-amber-950 dark:text-amber-100 bg-amber-200/50 dark:bg-amber-900/40 px-1 rounded-sm">수집 완료로 체크한 도감</strong>은 목록에서 제외됩니다.</li>
                    <li><strong className="font-bold text-amber-950 dark:text-amber-100 bg-amber-200/50 dark:bg-amber-900/40 px-1 rounded-sm">언제든지 만날 수 있는 도감</strong> (24시간 등장 및 '날씨무관' 날씨 조건)은 상시 조회가 가능하므로 추천 가이드 목록에서 제외됩니다.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-end shrink-0 border-t border-neutral-100 dark:border-stone-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRecInfoOpen(false)}
                  className="px-5 py-2.5 text-xs font-extrabold text-white bg-slate-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-slate-800 dark:hover:bg-stone-200 rounded-xl transition-all shadow-md font-sans cursor-pointer active:scale-95"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
        onSubmit={handleReportSubmit}
      />
      
      {/* 관리자 전용 점검 모드 안내 바 */}
      {isMaintenanceMode && !isShowMaintenance && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-blue-500 text-white text-[10px] md:text-xs py-1.5 px-4 flex items-center justify-center gap-2 font-bold shadow-md animate-in slide-in-from-top duration-300">
          <Settings className="h-3.5 w-3.5 animate-spin-slow" />
          <span>서버 점검 모드 활성 상태 — 작업 완료 후 반드시 점검 모드를 해제해 주세요.</span>
        </div>
      )}

      {/* Seasonal Selector Modal */}
      <SeasonalSelector 
        isOpen={isSeasonalModalOpen}
        onClose={() => setIsSeasonalModalOpen(false)}
        activeSeasonIds={activeSeasonIds}
        onToggleSeason={toggleSeason}
      />

      {(isShowMaintenance || isMaintenanceCompleted || manualCompletedPreview || isForceUpdateRequired || isPermissionDeniedError || (isQuotaExceededError || isManualQuotaExceeded) || isSyncingBeforeReload) && (
        <div className={`fixed inset-0 z-[10000] ${(isQuotaExceededError || isManualQuotaExceeded) ? 'bg-stone-900/40 dark:bg-stone-950/60' : 'bg-stone-900/80 dark:bg-stone-950/90'} backdrop-blur-md flex items-center justify-center p-6 text-center`}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-3xl shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {(isQuotaExceededError || isManualQuotaExceeded) ? (
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <img src="/images/new_logo.png" alt="logo" className="w-full h-full object-contain animate-bounce" />
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                (isMaintenanceCompleted || manualCompletedPreview)
                  ? 'bg-emerald-500/10' 
                  : isShowMaintenance 
                    ? 'bg-blue-500/10' 
                    : 'bg-amber-500/10'
              }`}>
                {(isMaintenanceCompleted || manualCompletedPreview) ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 animate-bounce" />
                ) : isShowMaintenance ? (
                  <Settings className="h-8 w-8 text-blue-500 animate-spin-slow" />
                ) : (
                  <RefreshCcw className={`h-8 w-8 text-amber-500 ${isSyncingBeforeReload ? 'animate-spin' : 'animate-spin-slow'}`} />
                )}
              </div>
            )}
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-stone-100 mb-3">
              {(isMaintenanceCompleted || manualCompletedPreview) ? '서버 점검이 완료되었습니다!' :
               isShowMaintenance ? '서버 점검 중입니다' :
               isForceUpdateRequired 
                 ? '업데이트가 필요합니다' 
                 : (isQuotaExceededError || isManualQuotaExceeded) 
                   ? '서버 할당량 초과' 
                   : '데이터 동기화 오류'}
            </h2>
            
            <div className="text-slate-600 dark:text-stone-400 text-sm leading-relaxed mb-8">
              {(isMaintenanceCompleted || manualCompletedPreview) ? (
                <>
                  아래 버튼을 눌러 앱을 다시 시작해 주세요.
                </>
              ) : isShowMaintenance ? (
                <>
                  더 안정적인 서비스를 위해 서버 점검 중입니다.<br />
                  {maintenanceStart && maintenanceEnd && (
                    <div className="my-3.5 p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 text-[11px] font-black border border-blue-200 dark:border-blue-500/20 leading-tight">
                      점검 예정 시간<br/>
                      <span className="text-blue-500 dark:text-blue-300 text-[13px] mt-1 inline-block font-mono">{maintenanceStart} ~ {maintenanceEnd}</span>
                    </div>
                  )}
                </>
              ) : isForceUpdateRequired ? (
                <>
                  {isForceUpdateActive && forceUpdateMessage.trim() ? (
                    <span className="whitespace-pre-wrap">{forceUpdateMessage.trim()}</span>
                  ) : (
                    <>안정적인 서비스 이용을 위해<br />최신 버전 업데이트가 필요합니다.</>
                  )}
                </>
              ) : (isQuotaExceededError || isManualQuotaExceeded) ? (
                <>금일 접속자가 많아 서버 허용량을 초과했습니다.<br />16시 10분 이후에 접속 부탁드립니다.</>
              ) : isSyncingBeforeReload ? (
                <>데이터를 동기화하고 있습니다.<br />잠시만 기다려 주세요.</>
              ) : (
                <>데이터 동기화에 실패했습니다.<br />문제가 계속되면 수동으로 새로고침해 주세요.</>
              )}
            </div>

            {(isQuotaExceededError || isManualQuotaExceeded) && quotaCountdown !== "00:00:00" ? (
              <div className="w-full bg-stone-50 dark:bg-stone-900 text-slate-800 dark:text-white font-bold py-4 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-inner dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border border-stone-200 dark:border-stone-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
                <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-widest opacity-90 relative z-10">재시작까지 남은 시간</span>
                <span className="text-xl font-mono tabular-nums tracking-widest relative z-10 drop-shadow-sm dark:drop-shadow-md">{quotaCountdown || "00:00:00"}</span>
              </div>
            ) : (
              <button 
                onClick={handleUpdateAndSync}
                className={`w-full ${
                  (isMaintenanceCompleted || manualCompletedPreview)
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                    : isShowMaintenance 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-amber-500 hover:bg-amber-600 text-stone-950'
                } font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer`}
              >
                {(isMaintenanceCompleted || manualCompletedPreview) ? "지금 시작하기" : 
                 isShowMaintenance ? "새로고침" : 
                 (isPermissionDeniedError || isQuotaExceededError || isManualQuotaExceeded ? "새로고침" : "지금 업데이트")}
              </button>
            )}
          </motion.div>
        </div>
      )}

      {/* 버전 업데이트 알림 배너 (상단 긴 배너 형식) */}
      <AnimatePresence>
        {updateAvailable && !updateDismissed && !isForceUpdateRequired && !isShowMaintenance && (
          <motion.div
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -80 }}
            className="fixed top-0 left-0 right-0 w-full z-[9000] shadow-[0_4px_30px_rgba(249,115,22,0.3)]"
          >
            <div className="bg-gradient-to-r from-stone-950 via-orange-950 to-stone-950 text-stone-100 border-b border-orange-500/40 px-4 py-3 md:py-3.5 flex items-center justify-between gap-4 justify-items-stretch">
              <div 
                className="flex-1 flex items-center justify-center gap-3 cursor-pointer select-none"
                onClick={() => window.location.reload()}
              >
                <div className="bg-orange-500/20 p-1.5 rounded-full backdrop-blur-md hidden sm:block shrink-0 border border-orange-400/20">
                  <RefreshCcw className="h-3.5 w-3.5 text-orange-400 animate-spin-slow" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-sm font-bold tracking-tight leading-relaxed">
                    <span className="text-orange-400 font-extrabold mr-2 animate-pulse">✨ 새로운 버전 발견!</span> 
                    최신 기능을 적용하려면 
                    <span className="text-orange-300 font-black underline underline-offset-4 decoration-2 decoration-orange-400/60 mx-1 cursor-pointer hover:text-orange-100 transition-colors">
                      [여기를 눌러 새로고침]
                    </span>
                    해 주세요.
                  </p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setUpdateDismissed(true);
                }}
                className="bg-stone-950/80 hover:bg-stone-900/80 p-1.5 rounded-xl border border-orange-500/20 transition-all shrink-0 cursor-pointer"
                title="닫기"
              >
                <X className="h-4 w-4 text-orange-400/80 hover:text-orange-300" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Gratitude Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 20, scale: 0.95, x: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 left-1/2 z-[200] flex items-center gap-2.5 px-5 py-3.5 bg-neutral-900 border border-neutral-800 text-white rounded-full text-xs font-bold shadow-2xl backdrop-blur-md whitespace-nowrap"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingReportButton 
        isTimerModalOpen={isTimerModalOpen}
        isPermissionDeniedError={isPermissionDeniedError}
        isQuotaExceededError={isQuotaExceededError}
        isForceUpdateRequired={isForceUpdateRequired}
        isShowMaintenance={isShowMaintenance}
        user={user}
        hasUnsyncedChanges={hasUnsyncedChanges}
        isInitialSyncDone={isInitialSyncDone}
        setIsContactModalOpen={setIsContactModalOpen}
      />


      {/* Account Deletion / Withdrawal Confirmation Modal */}
      <AnimatePresence>
        {isDeleteAccountModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isDeleterLoading) setIsDeleteAccountModalOpen(false);
              }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 shadow-2xl p-6 overflow-hidden z-10 font-sans"
            >
              {/* Close Button */}
              <button
                disabled={isDeleterLoading}
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-300 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Title Section */}
              <div className="flex items-center gap-3 mb-4 select-none">
                <div className="p-2.5 bg-red-100/80 dark:bg-red-500/20 rounded-2xl text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100 tracking-tight leading-tight">회원 탈퇴</h3>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">Account Delete & Goodbye</p>
                </div>
              </div>

              {/* Warning Notice Box */}
              <div className="space-y-3.5 mb-5 text-stone-605">
                <div className="p-4 bg-red-50/50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-xs space-y-2 text-red-950 dark:text-red-400 font-medium leading-relaxed">
                  <p className="font-extrabold flex items-center gap-1 text-red-800 dark:text-red-300">
                    ⚠️ 주의 사항을 반드시 확인해 주세요!
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-red-900/90 dark:text-red-300/80">
                    <li>서버 데이터베이스의 <strong>모든 도감 수집 및 진행 내역, 성급, 날씨 정보</strong>가 <strong>영구적으로 복구 불가능하게 삭제</strong>됩니다.</li>
                    <li>서버에 연동 등록되어 있던 회원 인증 정보가 안전하게 탈퇴 및 영구 파기 처리됩니다.</li>
                    <li>웹 브라우저 임시보관 데이터가 싹 비워지고 완전히 초기 상태로 돌아갑니다.</li>
                    <li>이 작업은 어떠한 방법으로도 실행 취소할 수 없습니다.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block pl-1">
                    동의 확인 문구 입력
                  </label>
                  <p className="text-[10.5px] text-stone-500 dark:text-stone-500 pl-1 leading-snug">
                    안전한 탈퇴를 위해 아래 입력란에 <span className="font-extrabold text-red-700 dark:text-red-400">탈퇴하기</span>를 정확히 입력해 주세요.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    disabled={isDeleterLoading}
                    placeholder="탈퇴하기"
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-100 text-xs font-semibold focus:outline-none focus:border-red-500 dark:focus:border-red-400 focus:bg-white dark:focus:bg-stone-900 placeholder:text-stone-300 dark:placeholder:text-stone-700 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Error Box */}
              {deleteError && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200/50 rounded-2xl flex items-start gap-2 text-red-900">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] font-semibold leading-relaxed whitespace-pre-line">{deleteError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDeleterLoading}
                  onClick={() => setIsDeleteAccountModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/90 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={isDeleterLoading || deleteConfirmText !== '탈퇴하기'}
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-98"
                >
                  {isDeleterLoading ? (
                    <>
                      <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                      <span>탈퇴 진행 중...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>탈퇴하기</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}



