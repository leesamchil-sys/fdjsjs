/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, SyntheticEvent, ChangeEvent, memo, startTransition, lazy, Suspense } from 'react';
import { useAppTheme } from './hooks/useAppTheme';
import { useUserDataSync } from './hooks/useUserDataSync';
import { useGameState } from './hooks/useGameState';
import { useNavigate, useLocation } from 'react-router-dom';
import { logVersion } from './lib/versionLogger';
import versionData from './version.json';
import { isVersionOlder } from './utils/versionUtils';
import { useSeasonalState } from './hooks/useSeasonalState';
import { useCategoryTotals } from './hooks/useCategoryTotals';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useScrollAndFilterState } from './hooks/useScrollAndFilterState';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import { useEncyclopediaFilterState } from './hooks/useEncyclopediaFilterState';
import { useCollectionModalState } from './hooks/useCollectionModalState';
import { useAppModalsState } from './hooks/useAppModalsState';
import { useLayoutUiState } from './hooks/useLayoutUiState';
import { reconstructSlotsFromFarmingSlotsMap } from './utils/farmingUtils';
const APP_VERSION = versionData.version;
const MIN_SUPPORTED_VERSION = '1.0.20'; // 기본 최소 지원 버전 (v1.0.20시작/6.13)

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
  Calendar,
  Compass,
  Bell,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, getDay, getHours, startOfHour, isAfter, isBefore, parse, addHours } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SEASONAL_EVENTS, isSeasonOngoing } from './data/seasonal';
import { OCEAN_CLEANING_ITEMS } from './data/oceanCleaning';
import { SeasonalSelector } from './components/SeasonalSelector';
import { Bird, Insect, Fish, Cooking, Category, GameWeather, WeeklyWeather, DetailedWeather, DailyLocations, ThemeMode, Pet, SortOrder, PlantedSlot } from './types';
import CropTimer from './components/CropTimer';
import PetFoodFinder from './components/PetFoodFinder';
import GardeningGuide from './components/GardeningGuide';
import { GARDENING_ITEMS } from './data/gardening';
import HomeDashboard from './components/HomeDashboard';
import EncyclopediaSection from './components/EncyclopediaSection';
import { LOCATION_COORDINATES, mapKeyToLocationId, mapLocationIdToKey } from './components/InteractiveMap';
const InteractiveMap = lazy(() => import('./components/InteractiveMap').then(m => ({ default: m.InteractiveMap })));
import { AnnouncementPopup } from './components/AnnouncementPopup';
import { UpdateFeaturesPopup } from './components/UpdateFeaturesPopup';
import GuideModal from './components/GuideModal';
import WelcomeModal from './components/WelcomeModal';
import { ModalManager } from './components/ModalManager';
import SettingsModal from './components/SettingsModal';
import Footer from './components/Footer';
import { useBackDismiss } from './hooks/useBackDismiss';
import { useAppSystemStatus } from './hooks/useAppSystemStatus';
import { useContactReport } from './hooks/useContactReport';
import { useInteractiveMapState } from './hooks/useInteractiveMapState';
import { useAccountManager } from './hooks/useAccountManager';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { useCollectionActions } from './hooks/useCollectionActions';
import { useBackupRestore } from './hooks/useBackupRestore';
// ... other imports
import { LoadingScreen } from './components/LoadingScreen';
import { ItemCard, WeatherIcon, translateWeather, getWeatherButtonClass } from './components/ItemCard';
import { ContactModal } from './components/ContactModal';
import { SupportModal } from './components/SupportModal';
import { SupporterRegisterModal } from './components/SupporterRegisterModal';
import EncyclopediaFilterDropdown from './components/EncyclopediaFilterDropdown';  // Added this
import SortDropdown from './components/SortDropdown';
import { MobileSidebar } from './components/MobileSidebar';
import { ProfileDropdown } from './components/ProfileDropdown';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { SyncErrorModal } from './components/SyncErrorModal';
import { CategoryView } from './components/CategoryView';
import { FloatingReportButton } from './components/FloatingReportButton';
import { DesktopSidebar } from './components/DesktopSidebar';
import { RecInfoModal } from './components/RecInfoModal';
import { DeleteAccountModal } from './components/DeleteAccountModal';
import { RestoreBackupModals } from './components/RestoreBackupModals';
import { MaintenanceOverlayModal } from './components/MaintenanceOverlayModal';
import { UpdateBanner } from './components/UpdateBanner';
import { ToastNotification } from './components/ToastNotification';
import { CropAlertBanner } from './components/CropAlertBanner';
import { WeatherModal } from './components/WeatherModal';
import { LoginWarningModal } from './components/LoginWarningModal';
import { UnmatchedNamesModal } from './components/UnmatchedNamesModal';
import { SyncConflictModal } from './components/SyncConflictModal';
import { HeaderClock } from './components/HeaderClock';
import { 
  ALL_BIRDS_MAP, 
  ALL_INSECTS_MAP, 
  ALL_FISH_MAP, 
  ALL_COOKING_MAP, 
  ALL_GARDENING_MAP, 
  ALL_OCEAN_CLEANING_MAP, 
  ALL_CROPS_MAP,
  cleanWeeklyWeather, 
  MAX_DISPLAY_LEVEL 
} from './data/allMaps';
import { 
  getPetFoodName, 
  getPetFoodId, 
  mapLocalPetsToCloud, 
  mapCloudPetsToLocal 
} from './utils/petUtils';
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
import { getServerTimeKST, getServerTimeMs, subscribeServerTimeSync } from './utils/serverTime';

export default function App() {
  const { setThemeMode, setFontSizeLevel } = useAppTheme();
  const isInvalidEnvironment = false;

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [isHardOffline, setIsHardOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });

  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setIsHardOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleCustomOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('app-network-offline', handleCustomOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('app-network-offline', handleCustomOffline);
    };
  }, []);

  const handleCheckConnection = () => {
    setIsCheckingConnection(true);
    setTimeout(() => {
      if (typeof navigator !== 'undefined') {
        const online = navigator.onLine;
        setIsOnline(online);
        if (!online) {
          setIsHardOffline(true);
        } else {
          setIsHardOffline(false);
        }
      }
      setIsCheckingConnection(false);
    }, 600);
  };

  const dbBirds = ALL_BIRDS_MAP;
  const dbInsects = ALL_INSECTS_MAP;
  const dbFish = ALL_FISH_MAP;
  const dbCooking = ALL_COOKING_MAP;
  const dbCrops = ALL_CROPS_MAP;

  const {
    isSyncingBeforeReload,
    setIsSyncingBeforeReload,
    isSeasonalModalOpen,
    setIsSeasonalModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    importPendingData,
    setImportPendingData,
    restoreSuccessMessage,
    setRestoreSuccessMessage,
    restoreErrorMessage,
    setRestoreErrorMessage,
    isTimerModalOpen,
    setIsTimerModalOpen,
    isSupportModalOpen,
    setIsSupportModalOpen,
    isSupporterRegisterModalOpen,
    setIsSupporterRegisterModalOpen,
    updateAvailable,
    setUpdateAvailable,
    updateDismissed,
    setUpdateDismissed,
  } = useAppModalsState();

  const {
    activeSeasonIds,
    setActiveSeasonIds,
    effectiveSeasonIds,
    toggleSeason,
    showSeasonalBanner,
  } = useSeasonalState();

  const {
    defaultTab,
    setDefaultTab,
    location,
    navigate,
    activeCategory,
    setActiveCategory,
    gardeningSubTab,
    setGardeningSubTab,
    handleSetCategory,
  } = useAppNavigation();

  const [currentTime, setCurrentTime] = useState(getServerTimeKST());

  // Refs to share synchronization/dirty/timer states across hooks and avoid circular dependencies
  const sharedIsDirtyRef = useRef(false);
  const sharedIsResettingRef = useRef(false);
  const sharedGlobalSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const forceSyncAllDataRef = useRef<((loggedInUser: any) => Promise<boolean>) | null>(null);
  const resetLocalCollectionStatesRef = useRef<(() => void) | null>(null);

  // useEffects for category/location sync removed (Single Source of Truth: URL)
  const {
    user, setUser, authLoading, isTimedOut, loginWarningType, setLoginWarningType,
    isDeleteAccountModalOpen, setIsDeleteAccountModalOpen, deleteConfirmText, setDeleteConfirmText,
    isDeleterLoading, deleteError, setDeleteError, handleGoogleLogin, handleLogout: rawHandleLogout, handleDeleteAccount
  } = useAccountManager(
    sharedIsDirtyRef,
    sharedIsResettingRef,
    sharedGlobalSyncTimerRef,
    forceSyncAllDataRef,
    resetLocalCollectionStatesRef
  );

  const {
    isInitialLoading, minSupportedVersion, isMaintenanceMode, isMaintenanceCompleted,
    manualMaintenancePreview, setManualMaintenancePreview, manualCompletedPreview, setManualCompletedPreview,
    maintenanceStart, maintenanceEnd, allowedUids, bypassCode, sessionBypass,
    marqueeNotice, marqueeRepeat, marqueeHistory, marqueeCustom, isBannerExpired, setIsBannerExpired,
    isForceUpdateActive, forceUpdateMessage, menuStatus, menuStatus: displayMenuStatus, adminWeeklyWeather, adminDetailedWeather, adminDailyLocations,
    isPermissionDeniedError, setIsPermissionDeniedError, isQuotaExceededError, setIsQuotaExceededError,
    isManualQuotaExceeded, quotaCountdown, handleUpdateAppConfig, isForceUpdateRequired, isShowMaintenance
  } = useAppSystemStatus(user);

  const {
    completedBirdIds, setCompletedBirdIds,
    completedInsectIds, setCompletedInsectIds,
    completedFishIds, setCompletedFishIds,
    completedFoodIds, setCompletedFoodIds,
    completedGardeningIds, setCompletedGardeningIds,
    completedOceanCleaningIds, setCompletedOceanCleaningIds,
    masterBirdIds, setMasterBirdIds,
    masterInsectIds, setMasterInsectIds,
    masterFishIds, setMasterFishIds,
    masterFoodIds, setMasterFoodIds,
    masterGardeningIds, setMasterGardeningIds,
    masterOceanCleaningIds, setMasterOceanCleaningIds,
    flowerColorCollections, setFlowerColorCollections,
    pets, setPets,
    ratings, setRatings,
    weeklyWeather, setWeeklyWeather,
    detailedWeather, setDetailedWeather,
    syncConflict, setSyncConflict,
    isInitialSyncDone, setIsInitialSyncDone,
    isInitialSyncDoneRef,
    runInitialSync,
    writeLocalDataToFirestore,
    applyFetchedDataToLocal,
    seedLastSyncedDataRef,
    isPermissionDeniedError: userSyncPermissionError,
    setIsPermissionDeniedError: setUserSyncPermissionError,
    isQuotaExceededError: userSyncQuotaError,
    setIsQuotaExceededError: setUserSyncQuotaError,
  } = useUserDataSync(user);

  const {
    hasUnsyncedChanges, setHasUnsyncedChanges,
    isDirtyRef, isResetting, lastSyncedDataRef, globalSyncTimerRef,
    markCollectionsModified,
    debouncedSyncAllData, forceSyncAllData,
    getGlobalSyncRemainingTime, onFarmingSyncScheduled
  } = useRealtimeSync(
    user,
    isInitialSyncDone, isInitialSyncDoneRef,
    setCompletedBirdIds, setCompletedInsectIds, setCompletedFishIds, setCompletedFoodIds, setCompletedGardeningIds, setCompletedOceanCleaningIds,
    setMasterBirdIds, setMasterInsectIds, setMasterFishIds, setMasterFoodIds, setMasterGardeningIds, setMasterOceanCleaningIds,
    setFlowerColorCollections, setRatings, setWeeklyWeather, setDetailedWeather, setPets,
    setIsPermissionDeniedError, setIsQuotaExceededError,
    sharedIsDirtyRef,
    sharedIsResettingRef,
    sharedGlobalSyncTimerRef
  );

  const [cropAlertQueue, setCropAlertQueue] = useState<Array<{
    id: string;
    cropName: string;
    stage?: number;
    isPre?: boolean;
    isFiveStar?: boolean;
  }>>([]);

  const handleCropCompletedWhileBackground = (completedSlots: any[]) => {
    if (activeCategory !== 'crops' && completedSlots.length > 0) {
      setCropAlertQueue(prev => {
        const newItems = completedSlots.map((item, idx) => ({
          id: `${Date.now()}-${idx}-${item.slot.cropId || Math.random()}`,
          cropName: item.slot.cropName,
          stage: item.stage,
          isPre: item.isPre,
          isFiveStar: item.slot.isFiveStarMode
        }));
        // Merge or append without duplicates for same crop if desired, or keep queue
        const existingIds = new Set(prev.map(p => `${p.cropName}-${p.stage}-${p.isPre}`));
        const filteredNew = newItems.filter(n => !existingIds.has(`${n.cropName}-${n.stage}-${n.isPre}`));
        return [...prev, ...filteredNew];
      });
    }
  };

  // Update refs to expose sync/reset capabilities to account manager
  forceSyncAllDataRef.current = forceSyncAllData;

  const {
    updateCollectionState, toggleCompletion, toggleMasterCompletion,
    handleToggleFlowerColor, handleRateItem, toggleOceanCleaning, resetLocalCollectionStates
  } = useCollectionActions(
    user,
    completedBirdIds, setCompletedBirdIds,
    completedInsectIds, setCompletedInsectIds,
    completedFishIds, setCompletedFishIds,
    completedFoodIds, setCompletedFoodIds,
    completedGardeningIds, setCompletedGardeningIds,
    completedOceanCleaningIds, setCompletedOceanCleaningIds,
    masterBirdIds, setMasterBirdIds,
    masterInsectIds, setMasterInsectIds,
    masterFishIds, setMasterFishIds,
    masterFoodIds, setMasterFoodIds,
    masterGardeningIds, setMasterGardeningIds,
    masterOceanCleaningIds, setMasterOceanCleaningIds,
    flowerColorCollections, setFlowerColorCollections,
    ratings, setRatings,
    markCollectionsModified,
    debouncedSyncAllData
  );

  resetLocalCollectionStatesRef.current = resetLocalCollectionStates;

  const toggleMaster = toggleMasterCompletion;
  const toggleGardeningCompletion = (id: string) => toggleCompletion({ id, category: 'gardening' });
  const toggleGardeningMaster = (id: string) => toggleMasterCompletion({ id, category: 'gardening' });
  const handleRate = (id: string | null, name: string, rating: number, category?: any) => handleRateItem({ id, name, category }, rating, category);

  const {
    isContactModalOpen, setIsContactModalOpen, toastMessage, setToastMessage, toastType, setToastType,
    toastTimeoutRef, handleReportSubmit
  } = useContactReport();
  const gameState = useGameState();
  const activeCouponsCount = useActiveCouponsCount();

  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isDesktopSidebarExpanded,
    setIsDesktopSidebarExpanded,
    isProfileDropdownOpen,
    setIsProfileDropdownOpen,
    isGuideOpen,
    setIsGuideOpen,
    isWelcomeOpen,
    setIsWelcomeOpen,
    isRecInfoOpen,
    setIsRecInfoOpen,
    isMapOpen,
    setIsMapOpen,
    isIngredientModalOpen,
    setIsIngredientModalOpen,
    isSharedLinkView,
    setIsSharedLinkView,
    initialMapId,
    setInitialMapId,
    initialLocationKey,
    setInitialLocationKey,
    wasOpenedViaUrlRef,
    isInitialLoadRef,
  } = useLayoutUiState();

  useEffect(() => {
    const checkDateAndIncrement = async () => {
      const dateStr = format(getServerTimeKST(), 'yyyy-MM-dd');
      const lastVisited = localStorage.getItem('lastVisitedDate');
      
      if (lastVisited !== dateStr) {
         try {
           const statsRef = doc(db, 'visitation_stats', dateStr);
           console.count("[WRITE] setDoc");
           console.log({
             function: "checkDateAndIncrement",
             reason: "visitRegistration",
             path: statsRef.path,
             time: new Date(getServerTimeMs()).toISOString()
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

  const {
    searchQuery,
    setSearchQuery,
    selectedLevels,
    setSelectedLevels,
    selectedTimeBlocks,
    setSelectedTimeBlocks,
    selectedWeathers,
    setSelectedWeathers,
    selectedCookingTypes,
    setSelectedCookingTypes,
    isWeatherModalOpen,
    setIsWeatherModalOpen,
  } = useEncyclopediaFilterState();

  const completedIds = useMemo(() => (
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
  ) as Set<string>, [activeCategory, completedBirdIds, completedInsectIds, completedFishIds, completedFoodIds, completedOceanCleaningIds, completedGardeningIds]);

  const {
    bulkInput,
    setBulkInput,
    unmatchedNames,
    setUnmatchedNames,
    isCollectionModalOpen,
    setIsCollectionModalOpen,
    tempCompletedIds,
    setTempCompletedIds,
    initialModalCompletedIds,
    setInitialModalCompletedIds,
    showConfirmClose,
    setShowConfirmClose,
    showOverwriteConfirm,
    setShowOverwriteConfirm,
    setsAreEqual,
    handleCloseModal,
    bulkPlaceholder,
  } = useCollectionModalState(completedIds, activeCategory);

  const handleLogout = useCallback(async (shouldClearLocal: boolean = true) => {
    setShowOverwriteConfirm(false);
    setSyncConflict(null);
    await rawHandleLogout(shouldClearLocal);
  }, [rawHandleLogout, setShowOverwriteConfirm, setSyncConflict]);

  useEffect(() => {
    if (!syncConflict) {
      setShowOverwriteConfirm(false);
    }
  }, [syncConflict]);

  useEffect(() => {
    if (!user) {
      setShowOverwriteConfirm(false);
      setSyncConflict(null);
    }
  }, [user]);

  // Support custom URL parameter/path for launching map and synchronizing its state reactively
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const pathname = location.pathname;
    const params = new URLSearchParams(location.search);
    
    let targetMapId: string | null = null;
    let shouldOpenMap = false;

    // Decode URI and clean up path for case-insensitive matching
    let decodedPath = pathname.toLowerCase().trim();
    try {
      decodedPath = decodeURIComponent(pathname).toLowerCase().trim();
    } catch(e) {
      console.warn("Failed to decode URI path");
    }

    // 1. Check if the path is "/map", starts with "/map/", or starts with "/map="
    if (decodedPath === '/map' || decodedPath === '/map/') {
      shouldOpenMap = true;
      targetMapId = 'town';
    } else if (decodedPath.startsWith('/map/')) {
      shouldOpenMap = true;
      // Extract segment after /map/
      const segment = decodedPath.substring(5).trim();
      if (segment === 'town' || segment === 'whalecanyon' || segment === 'whaleCanyon'.toLowerCase() || segment === '고래섬' || segment === '고래낙하협곡') {
        targetMapId = (segment === 'town' || segment === '고래섬') ? 'town' : 'whaleCanyon';
      }
    } else if (decodedPath.startsWith('/map=')) {
      shouldOpenMap = true;
      // Extract segment after /map=
      const segment = decodedPath.substring(5).trim();
      if (segment === 'town' || segment === 'whalecanyon' || segment === 'whaleCanyon'.toLowerCase() || segment === '고래섬' || segment === '고래낙하협곡') {
        targetMapId = (segment === 'town' || segment === '고래섬') ? 'town' : 'whaleCanyon';
      }
    }

    // 2. Check query parameters like ?map=xxx, ?id=xxx or ?mapid=xxx (case-insensitive)
    const queryKeys = Array.from(params.keys());
    for (const key of queryKeys) {
      const val = params.get(key)?.toLowerCase().trim();
      if (val) {
        const k = key.toLowerCase();
        if (k === 'map' || k === 'id' || k === 'mapid') {
          if (val === 'town' || val === 'whalecanyon' || val === 'whaleCanyon'.toLowerCase() || val === '고래섬' || val === '고래낙하협곡') {
            targetMapId = (val === 'town' || val === '고래섬') ? 'town' : 'whaleCanyon';
            shouldOpenMap = true;
          }
        }
      }
    }

    if (shouldOpenMap) {
      const finalMapId = targetMapId || 'town';
      const locParam = params.get('location') || '';
      
      const currentUrl = location.pathname + location.search;
      const lastClosedUrl = sessionStorage.getItem('last_closed_map_url');
      
      let isReload = false;
      if (typeof window !== 'undefined' && window.performance) {
        const navEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navEntries.length > 0 && navEntries[0].type === 'reload') {
          isReload = true;
        } else if (window.performance.navigation && window.performance.navigation.type === 1) {
          isReload = true;
        }
      }
      
      if (isInitialLoadRef.current && lastClosedUrl === currentUrl && isReload) {
        // User closed this exact map URL in this session, and now we are refreshing the page.
        // Prevent reopening the map, and clean up the URL to avoid infinite loops.
        setIsMapOpen(false);
        setInitialMapId('town');
        setInitialLocationKey('');
        isInitialLoadRef.current = false;
        
        // Redirect back to standard category URL
        const newPathname = '/' + activeCategory;
        const newParams = new URLSearchParams(location.search);
        newParams.delete('map');
        newParams.delete('id');
        newParams.delete('mapid');
        newParams.delete('location');
        const cleanSearch = newParams.toString();
        const newUrl = newPathname + (cleanSearch ? '?' + cleanSearch : '') + location.hash;
        console.log('[navigate]');
        console.log('from', location.pathname);
        console.log('activeCategory', activeCategory);
        console.log('to', newUrl);
        console.log(new Error().stack);
        navigate(newUrl, { replace: true });
        return;
      }
      
      isInitialLoadRef.current = false;
      wasOpenedViaUrlRef.current = true;
      setInitialMapId(finalMapId);
      setInitialLocationKey(locParam);
      setIsMapOpen(true);
    } else {
      isInitialLoadRef.current = false;
      setIsMapOpen(false);
      setInitialMapId('town');
      setInitialLocationKey('');
    }
  }, [location, navigate, activeCategory]);

  const [highlightedLocation, setHighlightedLocation] = useState('');
  const [highlightedItemName, setHighlightedItemName] = useState('');
  const [listHighlightedItemName, setListHighlightedItemName] = useState('');

  const handleLocationClick = (locationName: string, itemName: string) => {
    setHighlightedLocation(locationName);
    setHighlightedItemName(itemName);
    setListHighlightedItemName(''); // Clear list highlight when clicking from the card itself

    // Find the coordinate key for this location to resolve its map and ID
    const matched = Object.values(LOCATION_COORDINATES).find(
      loc => loc.name === locationName || loc.displayName === locationName
    );
    const currentPath = location.pathname.startsWith('/map') ? '/home' : location.pathname;
    const searchParams = new URLSearchParams(location.search);

    if (matched) {
      const matchedKey = Object.keys(LOCATION_COORDINATES).find(
        key => LOCATION_COORDINATES[key] === matched
      );
      if (matchedKey) {
        const locationId = mapKeyToLocationId(matchedKey);
        const mapId = matched.mapId || 'town';
        const urlMapId = mapId === 'town' ? '고래섬' : '고래낙하협곡';
        searchParams.set('map', urlMapId);
        searchParams.set('location', locationId);
        navigate(`${currentPath}?${searchParams.toString()}${location.hash}`, { replace: false });
        return;
      }
    }
    
    // Fallback if not matched
    searchParams.set('map', '고래섬');
    navigate(`${currentPath}?${searchParams.toString()}${location.hash}`, { replace: false });
  };

  const {
    isSidebarInteracting,
    setIsSidebarInteracting,
    forceShowIntro,
    setForceShowIntro,
    isFilterExpanded,
    setIsFilterExpanded,
    isScrolled,
    setIsScrolled,
    userFilterExpandedPreference,
    setUserFilterExpandedPreference,
    filterRef,
    searchHeaderRef,
    largeFilterPanelRef,
    isLargeFilterScrolledPast,
    isHeaderHidden,
    setIsHeaderHidden,
    openMobileFilter,
    setOpenMobileFilter,
  } = useScrollAndFilterState({
    isProfileDropdownOpen,
    activeCategory,
  });

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

  const { handleBackupData, handleRestoreData, handleConfirmRestore } = useBackupRestore({
    completedBirdIds, completedInsectIds, completedFishIds, completedFoodIds, completedGardeningIds, completedOceanCleaningIds,
    masterBirdIds, masterInsectIds, masterFishIds, masterFoodIds, masterGardeningIds, masterOceanCleaningIds,
    setCompletedBirdIds, setCompletedInsectIds, setCompletedFishIds, setCompletedFoodIds, setCompletedGardeningIds, setCompletedOceanCleaningIds,
    setMasterBirdIds, setMasterInsectIds, setMasterFishIds, setMasterFoodIds, setMasterGardeningIds, setMasterOceanCleaningIds,
    pets, setPets,
    ratings, setRatings,
    flowerColorCollections, setFlowerColorCollections,
    weeklyWeather, setWeeklyWeather,
    detailedWeather, setDetailedWeather,
    activeSeasonIds, setActiveSeasonIds,
    sortOrders, setSortOrders,
    userFilterExpandedPreference, setUserFilterExpandedPreference,
    setThemeMode, setFontSizeLevel, setDefaultTab, setIsDesktopSidebarExpanded,
    markCollectionsModified, debouncedSyncAllData, user,
    isResetting, globalSyncTimerRef, forceSyncAllData, appVersion: APP_VERSION
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
      else if (activeCategory === 'gardening' || activeCategory === 'crops') allItems = gardeningItems;
      else if (activeCategory === 'ocean_cleaning') allItems = oceanCleaning;

      const normalizeName = (s: string) =>
        s.replace(/\s+/g, '').toLowerCase().replace(/스타푸르트/g, '스타프루트');

      lines.forEach(line => {
        let namePart = line;
        let ratingValue = 0;
        if (line.includes('/')) {
          const parts = line.split('/');
          namePart = parts[0].trim();
          const r = parseInt(parts[1].trim());
          if (!isNaN(r)) ratingValue = Math.min(5, Math.max(0, r));
        }
        const normalizedInput = normalizeName(namePart);
        const item = allItems.find(b => normalizeName(b.name) === normalizedInput);
        if (item) {
          matchedIds.add(item.id);
          const maxStars = item.maxStars ?? 5;
          const clampedRating = Math.min(ratingValue, maxStars);
          if (clampedRating > 0) updatedRatings[item.name] = clampedRating;
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
  useBackDismiss(isSupporterRegisterModalOpen, () => setIsSupporterRegisterModalOpen(false), 'appSupporterRegisterModal');

  const {
    gardeningItems,
    birdTotal,
    insectTotal,
    fishTotal,
    cookingTotal,
    gardeningFlowerItems,
    gardeningCropItems,
    gardeningTotal,
    cropTotal,
    completedFlowerIds,
    completedCropIds,
    oceanCleaning,
    oceanCleaningTotal,
    effectiveCompletedBirdIds,
    effectiveCompletedInsectIds,
    effectiveCompletedFishIds,
    effectiveCompletedFoodIds,
    effectiveCompletedOceanCleaningIds,
    effectiveCompletedGardeningIds,
    currentCategoryTotal,
    currentCategoryCompleted,
  } = useCategoryTotals({
    effectiveSeasonIds,
    activeCategory,
    completedBirdIds,
    completedInsectIds,
    completedFishIds,
    completedFoodIds,
    completedGardeningIds,
    completedOceanCleaningIds,
    MAX_DISPLAY_LEVEL,
    dbBirds,
    dbInsects,
    dbFish,
    dbCooking,
  });

  const {
    windowWidth,
  } = useAppLifecycle({
    user,
    isInitialSyncDone,
    isInitialSyncDoneRef,
    isDirtyRef,
    debouncedSyncAllData,
    forceSyncAllData,
    auth,
    setToastMessage,
  });

  // Subscribe to Firebase Authentication
  useEffect(() => {
    if (user) {
      logVersion(APP_VERSION, user.uid, user.email);
      runInitialSync(user);
    }
  }, [user]);

  // Remove automated scroll logic as it causes erratic layout jumps.



  // PASSIVE ON-SNAPSHOT REAL-TIME SYNC IS HANDLED BY useRealtimeSync HOOK

  // Real-time Cloud Synchronization for Collections with Automatic Bidirectional Merge
  useEffect(() => {
    if (!user) {
      if (globalSyncTimerRef.current) {
        clearTimeout(globalSyncTimerRef.current);
        globalSyncTimerRef.current = null;
      }
      isDirtyRef.current = false;
      setSyncConflict(null);
      setShowOverwriteConfirm(false);

      const wasResolved = prevUserRef.current && localStorage.getItem('sync_resolved_uid') === prevUserRef.current.uid;
      if (prevUserRef.current && wasResolved && !sharedIsResettingRef.current) {
        // CLEAR local storage and React states on logout for logged-in user session
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
        localStorage.removeItem('completed_ocean_cleaning_ids');
        localStorage.removeItem('master_ocean_cleaning_ids');
        localStorage.removeItem('flower_color_collections');
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
        setCompletedOceanCleaningIds(new Set());
        setMasterBirdIds(new Set());
        setMasterInsectIds(new Set());
        setMasterFishIds(new Set());
        setMasterFoodIds(new Set());
        setMasterGardeningIds(new Set());
        setMasterOceanCleaningIds(new Set());
        setPets([]);
        setRatings({});
        setWeeklyWeather({});
        setDetailedWeather({});
        setFlowerColorCollections({});
      } else {
        // Restore offline local values (initial guest load)
        const savedBirds = localStorage.getItem('completed_bird_ids');
        const savedInsects = localStorage.getItem('completed_insect_ids');
        const savedFish = localStorage.getItem('completed_fish_ids');
        const savedFood = localStorage.getItem('completed_food_ids');
        const savedGardening = localStorage.getItem('completed_gardening_ids');
        const savedOceanCleaning = localStorage.getItem('completed_ocean_cleaning_ids');
        const savedFlowerColors = localStorage.getItem('flower_color_collections');

        setCompletedBirdIds(new Set(safeJsonParse(savedBirds, [])));
        setCompletedInsectIds(new Set(safeJsonParse(savedInsects, [])));
        setCompletedFishIds(new Set(safeJsonParse(savedFish, [])));
        setCompletedFoodIds(new Set(safeJsonParse(savedFood, [])));
        setCompletedGardeningIds(new Set(safeJsonParse(savedGardening, [])));
        setCompletedOceanCleaningIds(new Set(safeJsonParse(savedOceanCleaning, [])));
        setFlowerColorCollections(safeJsonParse(savedFlowerColors, {}));

        const savedMasterBirds = localStorage.getItem('master_bird_ids');
        const savedMasterInsects = localStorage.getItem('master_insect_ids');
        const savedMasterFish = localStorage.getItem('master_fish_ids');
        const savedMasterFood = localStorage.getItem('master_food_ids');
        const savedMasterGardening = localStorage.getItem('master_gardening_ids');
        const savedMasterOceanCleaning = localStorage.getItem('master_ocean_cleaning_ids');

        setMasterBirdIds(new Set(safeJsonParse(savedMasterBirds, [])));
        setMasterInsectIds(new Set(safeJsonParse(savedMasterInsects, [])));
        setMasterFishIds(new Set(safeJsonParse(savedMasterFish, [])));
        setMasterFoodIds(new Set(safeJsonParse(savedMasterFood, [])));
        setMasterGardeningIds(new Set(safeJsonParse(savedMasterGardening, [])));
        setMasterOceanCleaningIds(new Set(safeJsonParse(savedMasterOceanCleaning, [])));
        
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
                      localStorage.removeItem('has_unsynced_changes');
                      isDirtyRef.current = false;
                      setIsInitialSyncDone(true);
                      isInitialSyncDoneRef.current = true;
                      isInitialSyncDoneLocal = true;
                      setSyncConflict(null);
                      setShowOverwriteConfirm(false);
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
                      localStorage.removeItem('has_unsynced_changes');
                      isDirtyRef.current = false;
                      setIsInitialSyncDone(true);
                      isInitialSyncDoneRef.current = true;
                      isInitialSyncDoneLocal = true;
                      setSyncConflict(null);
                      setShowOverwriteConfirm(false);
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
              const gardeningNames = Array.from(localGardening).map(id => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id);
              const masterBirdNames = Array.from(localMasterBirds).map(id => dbBirds.find(b => b.id === id)?.name || id);
              const masterInsectNames = Array.from(localMasterInsects).map(id => dbInsects.find(i => i.id === id)?.name || id);
              const masterFishNames = Array.from(localMasterFish).map(id => dbFish.find(f => f.id === id)?.name || id);
              const masterFoodNames = Array.from(localMasterFood).map(id => ALL_COOKING_MAP.find(c => c.id === id)?.name || id);
              const masterGardeningNames = Array.from(localMasterGardening).map(id => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id);

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








  // Check if any modal is active (including CropTimer modal states)
  const isModalActive = useMemo(() => {
    return (
      isSettingsModalOpen ||
      isDeleteAccountModalOpen ||
      isSupportModalOpen ||
      isSupporterRegisterModalOpen ||
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
  const [draftWeeklyWeather, setDraftWeeklyWeather] = useState<WeeklyWeather>({});

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
    const timer = setInterval(() => {
      const now = getServerTimeKST();
      setCurrentTime(prev => {
        if (prev.getMinutes() !== now.getMinutes() || prev.getHours() !== now.getHours() || prev.getDate() !== now.getDate()) {
          return now;
        }
        return prev;
      });
    }, 1000); // Check every 1s so minute changes update instantly

    const unsubscribe = subscribeServerTimeSync(() => {
      setCurrentTime(getServerTimeKST());
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setCurrentTime(getServerTimeKST());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  
  const getDailyLocationDateKey = (date: Date) => {
    const d = new Date(date);
    if (d.getHours() < 6) {
      d.setDate(d.getDate() - 1);
    }
    return format(d, 'yyyy-MM-dd');
  };
  
  const currentDailyLocations = adminDailyLocations[getDailyLocationDateKey(currentTime)] || {};

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
    if (current === 'Heatwave' || current === 'Meteor') {
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
    return birdWeather === ((baseContext === 'Heatwave' || baseContext === 'Meteor') ? 'Clear' : baseContext);
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

      // Rating/Star Filter (respecting maxStars)
      const maxStars = item.maxStars ?? 5;
      const effectiveRating = Math.min(currentRating, maxStars);
      if (starFilter === 'done' && effectiveRating < maxStars) return false;
      if (starFilter === 'todo' && effectiveRating >= maxStars) return false;

      // Master Filter (check in set)
      const isMaster = (activeCategory === 'birds' ? masterBirdIds : activeCategory === 'insects' ? masterInsectIds : activeCategory === 'fishing' ? masterFishIds : masterFoodIds).has(item.id);
      if (masterFilter !== 'all' && item.excludeFromMaster) return false;
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
    if (!id) return activeCategoryFallback;
    const lowerId = id.toLowerCase();
    
    // Birds
    // Examples: '1', '2', 's1_b1', 'b-1'
    if (/^\d+$/.test(id) || lowerId.startsWith('b-') || /^[s_a-z0-9]+_b\d+/.test(lowerId) || (lowerId.startsWith('b') && /^\d+$/.test(lowerId.slice(1)))) {
      return 'birds';
    }
    
    // Insects
    // Examples: 'i1', 'i-1', 's1_i1'
    if (lowerId.startsWith('i-') || /^i\d+$/.test(lowerId) || /^[s_a-z0-9]+_i\d+/.test(lowerId)) {
      return 'insects';
    }
    
    // Fishing
    // Examples: 'f1', 'fish-1', 's1_f1'
    if (lowerId.startsWith('fish-') || /^f\d+$/.test(lowerId) || /^[s_a-z0-9]+_f\d+/.test(lowerId)) {
      return 'fishing';
    }
    
    // Ocean Cleaning
    // Examples: 'oc_1', 'oc-1'
    if (lowerId.startsWith('oc_') || lowerId.startsWith('oc-') || lowerId.startsWith('oc')) {
      return 'ocean_cleaning';
    }
    
    // Cooking
    // Examples: 'c1', 'c-1', 's1_c_1'
    if (lowerId.startsWith('c-') || /^c\d+$/.test(lowerId) || /^[s_a-z0-9]+_cook\d+/.test(lowerId)) {
      return 'cooking';
    }
    
    // Gardening & Crops
    // Examples: 'g-daisy', 's1_g1', 's1_c1'
    if (lowerId.startsWith('g-') || /^[s_a-z0-9]+_g\d+/.test(lowerId) || /^[s_a-z0-9]+_c\d+/.test(lowerId)) {
      return 'gardening';
    }
    
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
        // Compare business hash before deciding to sync/write
        const oldData = {
          completedBirdIds,
          completedInsectIds,
          completedFishIds,
          completedFoodIds,
          completedGardeningIds,
          completedOceanCleaningIds
        };
        const newData = {
          completedBirdIds: migrated.completedBirdIds,
          completedInsectIds: migrated.completedInsectIds,
          completedFishIds: migrated.completedFishIds,
          completedFoodIds: migrated.completedFoodIds,
          completedGardeningIds: migrated.completedGardeningIds,
          completedOceanCleaningIds: migrated.completedOceanCleaningIds
        };
        
        // This is a simplified check, ideally uses business hash
        if (JSON.stringify(Array.from(oldData.completedBirdIds).sort()) === JSON.stringify(Array.from(newData.completedBirdIds).sort()) &&
            JSON.stringify(Array.from(oldData.completedInsectIds).sort()) === JSON.stringify(Array.from(newData.completedInsectIds).sort()) &&
            JSON.stringify(Array.from(oldData.completedFishIds).sort()) === JSON.stringify(Array.from(newData.completedFishIds).sort()) &&
            JSON.stringify(Array.from(oldData.completedFoodIds).sort()) === JSON.stringify(Array.from(newData.completedFoodIds).sort()) &&
            JSON.stringify(Array.from(oldData.completedGardeningIds).sort()) === JSON.stringify(Array.from(newData.completedGardeningIds).sort()) &&
            JSON.stringify(Array.from(oldData.completedOceanCleaningIds).sort()) === JSON.stringify(Array.from(newData.completedOceanCleaningIds).sort())) {
            console.log("[Migration] Data actually unchanged after sanitization, skipping sync.");
            return;
        }

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
  const handleUpdateAndSync = useCallback(async () => {
    if (user && localStorage.getItem('has_unsynced_changes') === 'true') {
      setIsSyncingBeforeReload(true);
      try {
        await forceSyncAllData(user, true);
        window.dispatchEvent(new Event('app-force-sync-before-reload'));
        // Wait briefly for CropTimer etc. to flush
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (err) {
        console.warn("[Sync] Failed to sync before force reload:", err);
      }
    }
    // Prevent beforeunload confirmation popup
    localStorage.removeItem('has_unsynced_changes');
    window.location.reload();
  }, [user]);

  const isBannerVisible = useMemo(() => {
    return !!marqueeNotice?.trim() && !isBannerExpired;
  }, [marqueeNotice, isBannerExpired]);

  const stickyTopMobile = useMemo(() => {
    const bannerHeight = isBannerVisible ? (windowWidth < 640 ? 44 : 48) : 0;
    const headerHeight = 56; // h-14
    return `${bannerHeight + headerHeight}px`;
  }, [isBannerVisible, windowWidth]);

  const stickyTopDesktop = useMemo(() => {
    const bannerHeight = isBannerVisible ? 48 : 0;
    return `${bannerHeight}px`;
  }, [isBannerVisible]);

  if (isInitialLoading || (user && !isInitialSyncDone)) {
    if (!isOnline) {
      return (
        <div className="fixed inset-0 z-[99999] bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center select-none" id="hard-offline-view-fullscreen">
          <div className="max-w-sm w-full flex flex-col items-center animate-fade-in">
            <div className="p-4 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 rounded-full mb-6 relative animate-bounce">
              <WifiOff className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-2.5 tracking-tight animate-fade-in">
              인터넷 연결이 끊겼습니다
            </h3>
            <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed mb-8 break-keep">
              네트워크 연결 상태가 불안정하거나 끊어져 있어 일부 기능을 불러올 수 없습니다. 인터넷 연결 상태를 확인 후 다시 시도해 주세요.
            </p>
            <button
              onClick={handleCheckConnection}
              disabled={isCheckingConnection}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs rounded-xl cursor-pointer hover:bg-stone-800 dark:hover:bg-stone-200 transition-all active:scale-[0.98] disabled:opacity-50 select-none shadow-md"
            >
              <RefreshCcw className={cn("h-4 w-4", isCheckingConnection && "animate-spin")} />
              연결 다시 시도
            </button>
          </div>
        </div>
      );
    }
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-stone-950/90 flex flex-col relative transition-colors duration-300">
      <AnnouncementPopup />
      <UpdateFeaturesPopup canShow={!isWelcomeOpen && !isGuideOpen && !isMapOpen} />
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
        gardeningItemsLength={gardeningTotal + cropTotal}
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
          ['--sticky-top-mobile' as any]: stickyTopMobile,
          ['--sticky-top-desktop' as any]: stickyTopDesktop,
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
          "lg:hidden w-full border-b border-stone-200/50 dark:border-stone-850 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-xl px-4 h-14 flex items-center justify-between shrink-0 shadow-sm transition-all duration-300 z-[100]",
          isBannerVisible ? "sticky top-11 sm:top-12" : "sticky top-0",
          isProfileDropdownOpen && "z-[1000]",
          isHeaderHidden && activeCategory === 'trend_checklist' && "-translate-y-full pointer-events-none"
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
              <img src="/images/new_logo.webp" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-stone-100 font-sans">PIG TOWN</span>
          </div>
          
          <div className="flex-1 flex justify-end">
            <ProfileDropdown isMobile={true} authLoading={authLoading} user={user} isProfileDropdownOpen={isProfileDropdownOpen} setIsProfileDropdownOpen={setIsProfileDropdownOpen} handleLogout={handleLogout} handleGoogleLogin={handleGoogleLogin} />
          </div>
        </header>

        {/* Sleek Layout Sticky Sub-Header (Now scrolls naturally) */}
        <div 
          className={cn(
            "bg-white/85 dark:bg-stone-900/85 backdrop-blur-md shrink-0 w-full font-scale-lock border-b border-stone-200/40 dark:border-stone-850 transition-all duration-300 relative",
            isProfileDropdownOpen ? "z-[500]" : "z-[30]"
          )}
        >
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
                                  : activeCategory === 'trend_checklist'
                                    ? '👕 트렌드상점 체크리스트'
                                    : activeCategory === 'privacy'
                                      ? '🛡️ 개인정보 처리방침'
                                      : activeCategory === 'terms'
                                        ? '📜 서비스 이용약관'
                                        : activeCategory === 'coupons'
                                          ? '🎟️ 두근두근타운 리딤코드'
                                          : activeCategory === 'petfood'
                                            ? '🍖 펫 먹이 찾기'
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
                          : activeCategory === 'trend_checklist'
                            ? '구매한 트렌드 코디 아이템을 체크하고 쉽게 수집율을 확인해 보세요.'
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
                
                
                {/* Daily Locations Widget */}
                {activeCategory === 'home' && (currentDailyLocations.fluorescentRock || currentDailyLocations.oakTree) && (
                  <div className="flex items-center shrink-0 h-10 bg-stone-150/50 hover:bg-stone-150/80 dark:bg-stone-800/40 dark:hover:bg-stone-800/60 transition-all rounded-xl p-1 sm:px-2 border border-stone-200/30 dark:border-stone-800 text-[10px] sm:text-xs text-neutral-850 dark:text-stone-300 mr-1.5 gap-2">
                    {currentDailyLocations.fluorescentRock && (
                      <div className="flex items-center gap-1">
                        <img src="/images/형광석.webp" alt="형광석" className="w-4 h-4 object-contain drop-shadow-sm" />
                        <span className="font-extrabold text-[11px] text-stone-700 dark:text-stone-300 whitespace-nowrap">
                          {currentDailyLocations.fluorescentRock}
                        </span>
                      </div>
                    )}
                    {currentDailyLocations.fluorescentRock && currentDailyLocations.oakTree && (
                      <div className="w-[1px] h-3.5 bg-stone-200/50 dark:bg-stone-700 mx-0.5" />
                    )}
                    {currentDailyLocations.oakTree && (
                      <div className="flex items-center gap-1">
                        <img src="/images/참나무.webp" alt="참나무" className="w-4 h-4 object-contain drop-shadow-sm" />
                        <span className="font-extrabold text-[11px] text-stone-700 dark:text-stone-300 whitespace-nowrap">
                          {currentDailyLocations.oakTree}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Game Clock & Weather Widget (Unified Row) */}
                <div className="flex items-center shrink-0 h-10 bg-stone-150/50 hover:bg-stone-150/80 dark:bg-stone-800/40 dark:hover:bg-stone-800/60 transition-all rounded-xl p-1 sm:pl-2.5 border border-stone-200/30 dark:border-stone-800 text-[10px] sm:text-xs text-neutral-850 dark:text-stone-300">
                  {/* Time (Hidden on tablet/mobile to save space, visible when space is sufficient) */}
                  <HeaderClock currentTime={currentTime} showBorder={isOnline} />

                  
                  {/* Weather Button */}
                  {isOnline && (
                    <button 
                      onClick={() => setIsWeatherModalOpen(true)}
                      className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-white/45 dark:hover:bg-white/10 transition-all text-[11px] font-bold text-stone-700 dark:text-stone-300 cursor-pointer shrink-0"
                    >
                      <WeatherIcon weather={currentGameWeather} className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                      <span className="whitespace-nowrap">{translateWeather(currentGameWeather)}</span>
                      <Settings className="h-3 w-3 text-neutral-400 dark:text-stone-500 hidden sm:block ml-0.5 shrink-0" />
                    </button>
                  )}
                </div>

 
                {/* Collection Status Button */}
                {isOnline && (activeCategory === 'birds' || activeCategory === 'insects' || activeCategory === 'fishing' || activeCategory === 'cooking' || activeCategory === 'gardening' || activeCategory === 'crops' || activeCategory === 'ocean_cleaning') && (
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
                  <ProfileDropdown isMobile={false} authLoading={authLoading} user={user} isProfileDropdownOpen={isProfileDropdownOpen} setIsProfileDropdownOpen={setIsProfileDropdownOpen} handleLogout={handleLogout} handleGoogleLogin={handleGoogleLogin} />
              </div>
            </div>
          </div>
        </div>

        {/* Unified Application views */}
        <div className="px-4 sm:px-5 md:px-6 pt-4 pb-6 relative bg-stone-50 dark:bg-stone-950 transition-colors shadow-[0_-1px_3px_rgba(0,0,0,0.02)] flex-1 flex flex-col" id="encyclo-body-container">
          {!isOnline ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 max-w-sm mx-auto text-center" id="hard-offline-view">
              <div className="p-4 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 rounded-full mb-6 relative animate-bounce">
                <WifiOff className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-2.5 tracking-tight">
                인터넷 연결이 끊겼습니다
              </h3>
              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed mb-8 break-keep">
                네트워크 연결 상태가 불안정하거나 끊어져 있어 일부 기능을 불러올 수 없습니다. 인터넷 연결 상태를 확인 후 다시 시도해 주세요.
              </p>
              <button
                onClick={handleCheckConnection}
                disabled={isCheckingConnection}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs rounded-xl cursor-pointer hover:bg-stone-800 dark:hover:bg-stone-200 transition-all active:scale-[0.98] disabled:opacity-50 select-none shadow-md"
              >
                <RefreshCcw className={cn("h-4 w-4", isCheckingConnection && "animate-spin")} />
                연결 다시 시도
              </button>
            </div>
          ) : (
            <CategoryView 
              activeCategory={activeCategory}
              onLocationClick={handleLocationClick}
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
              flowerColorCollections={flowerColorCollections}
              onToggleFlowerColor={handleToggleFlowerColor}
              birdTotal={birdTotal}
              insectTotal={insectTotal}
              fishTotal={fishTotal}
              cookingTotal={cookingTotal}
              gardeningTotal={gardeningTotal}
              cropTotal={cropTotal}
              pets={pets}
              ratings={ratings}
              highlightedItemName={listHighlightedItemName}
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
              oceanCleaningTotal={oceanCleaningTotal}
              oceanCleaning={oceanCleaning}
              gardeningSubTab={gardeningSubTab}
              setPets={setPets}
              markCollectionsModified={markCollectionsModified}
              debouncedSyncAllData={debouncedSyncAllData}
              getGlobalSyncRemainingTime={getGlobalSyncRemainingTime}
              onFarmingSyncScheduled={onFarmingSyncScheduled}
              onCropCompleted={handleCropCompletedWhileBackground}
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
              onIngredientModalChange={setIsIngredientModalOpen}
              onOpenSeasonalModal={() => {
                if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                setIsSeasonalModalOpen(true);
                toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
              }}
              activeSeasonIds={effectiveSeasonIds}
            />
          )}
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
      <UnmatchedNamesModal
        unmatchedNames={unmatchedNames}
        onClear={clearUnmatched}
      />

      {/* Sync Conflict Resolution Modal */}
      <SyncConflictModal
        syncConflict={syncConflict}
        onCancelConflict={() => {
          setSyncConflict(null);
          setShowOverwriteConfirm(false);
        }}
        onLogout={handleLogout}
        showOverwriteConfirm={showOverwriteConfirm}
        setShowOverwriteConfirm={setShowOverwriteConfirm}
      />

      <ModalManager
        isWelcomeOpen={isWelcomeOpen && !isMapOpen}
        setIsWelcomeOpen={setIsWelcomeOpen}
        isGuideOpen={isGuideOpen}
        setIsGuideOpen={setIsGuideOpen}
        forceShowIntro={forceShowIntro}
      />

      <Suspense fallback={null}>
        <InteractiveMap
          isOpen={isMapOpen}
          onClose={() => {
            setIsMapOpen(false);
            setInitialMapId('town');
            setInitialLocationKey('');
            setHighlightedLocation('');
            setHighlightedItemName('');
            
            // Clean up map URL route & parameters from the address bar using React Router
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('last_closed_map_url', location.pathname + location.search);
              const newPathname = `/${activeCategory}`;
              const params = new URLSearchParams(location.search);
              params.delete('map');
              params.delete('id');
              params.delete('mapid');
              params.delete('location');
              const cleanSearch = params.toString();
              const newUrl = newPathname + (cleanSearch ? '?' + cleanSearch : '') + location.hash;
              navigate(newUrl, { replace: true });
            }

            // Reset the startup flag so that subsequent manual openings behave normally
            wasOpenedViaUrlRef.current = false;
          }}
          initialMapId={initialMapId}
          initialLocationKey={initialLocationKey}
          onPermalinkRestored={() => {
            if (typeof window !== 'undefined') {
              const hasSeenWelcome = localStorage.getItem('has_seen_pigtown_welcome');
              const hasSeenGuide = localStorage.getItem('has_seen_pigtown_guide');
              if (!hasSeenWelcome && !hasSeenGuide) {
                setIsWelcomeOpen(true);
              }
            }
          }}
          highlightedLocationName={highlightedLocation}
          highlightedItemName={highlightedItemName}
          onClearHighlight={() => {
            setHighlightedLocation('');
            setHighlightedItemName('');
          }}
          onToggleCompletion={toggleCompletion}
          onSelectCreature={(name, dbType) => {
            setHighlightedItemName(prev => prev === name ? prev : name);
            setListHighlightedItemName(prev => prev === name ? prev : name);
            const targetCategory = dbType === 'birds' ? 'birds' : dbType === 'insects' ? 'insects' : 'fishing';
            setActiveCategory(prev => prev === targetCategory ? prev : targetCategory);
          }}
          isAdmin={!!(user && allowedUids.includes(user.uid))}
          completedIds={new Set([
            ...completedBirdIds,
            ...completedInsectIds,
            ...completedFishIds,
            ...completedFoodIds,
            ...completedGardeningIds,
            ...completedOceanCleaningIds
          ])}
          ratings={ratings}
          masterBirdIds={masterBirdIds}
          masterInsectIds={masterInsectIds}
          masterFishIds={masterFishIds}
          birds={dbBirds}
          insects={dbInsects}
          fish={dbFish}
        />
      </Suspense>

      {/* Weather Modal */}
      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        currentTime={currentTime}
        draftDetailedWeather={draftDetailedWeather}
        draftWeeklyWeather={draftWeeklyWeather}
        toggleDraftDetailedWeather={toggleDraftDetailedWeather}
        toggleDraftWeeklyWeather={toggleDraftWeeklyWeather}
        onApply={() => {
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
        getWeatherButtonClass={getWeatherButtonClass}
        translateWeather={translateWeather}
        WeatherIcon={WeatherIcon}
        getCycleHour={getCycleHour}
        getKoreanDayName={getKoreanDayName}
      />

      {/* 5. Google Login Warning Modal */}
      <LoginWarningModal
        loginWarningType={loginWarningType}
        onClose={() => setLoginWarningType(null)}
        onOpenNewWindow={() => {
          window.open(window.location.href, '_blank');
          setLoginWarningType(null);
        }}
        onGoogleLogin={handleGoogleLogin}
      />

      {/* Firestore Sync Error Modal */}
      <SyncErrorModal
        isOpen={isPermissionDeniedError || userSyncPermissionError}
        onClose={() => {
          setIsPermissionDeniedError(false);
          setUserSyncPermissionError(false);
        }}
      />
      
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

      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
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
        adminDailyLocations={adminDailyLocations}
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

      <RestoreBackupModals
        importPendingData={importPendingData}
        setImportPendingData={setImportPendingData}
        restoreSuccessMessage={restoreSuccessMessage}
        setRestoreSuccessMessage={setRestoreSuccessMessage}
        restoreErrorMessage={restoreErrorMessage}
        setRestoreErrorMessage={setRestoreErrorMessage}
        onConfirmRestore={() => handleConfirmRestore(importPendingData, setRestoreSuccessMessage, setRestoreErrorMessage, setImportPendingData)}
      />

      {/* Recommended Items Info Modal Popup */}
      <RecInfoModal 
        isOpen={isRecInfoOpen}
        onClose={() => setIsRecInfoOpen(false)}
        onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
      />

      <SupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
        onRegisterClick={() => {
          setIsSupportModalOpen(false);
          setTimeout(() => {
            setIsSupporterRegisterModalOpen(true);
          }, 100);
        }}
      />
      <SupporterRegisterModal
        isOpen={isSupporterRegisterModalOpen}
        onClose={() => setIsSupporterRegisterModalOpen(false)}
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

      <MaintenanceOverlayModal 
        isShowMaintenance={isShowMaintenance}
        isMaintenanceCompleted={isMaintenanceCompleted}
        manualCompletedPreview={manualCompletedPreview}
        isForceUpdateRequired={isForceUpdateRequired}
        isPermissionDeniedError={isPermissionDeniedError}
        isQuotaExceededError={isQuotaExceededError}
        isManualQuotaExceeded={isManualQuotaExceeded}
        isSyncingBeforeReload={isSyncingBeforeReload}
        maintenanceStart={maintenanceStart}
        maintenanceEnd={maintenanceEnd}
        forceUpdateMessage={forceUpdateMessage}
        quotaCountdown={quotaCountdown}
        onUpdateAndSync={handleUpdateAndSync}
      />

      {/* 버전 업데이트 알림 배너 (상단 긴 배너 형식) */}
      <UpdateBanner 
        updateAvailable={updateAvailable}
        updateDismissed={updateDismissed}
        isForceUpdateRequired={isForceUpdateRequired}
        isShowMaintenance={isShowMaintenance}
        onDismiss={() => setUpdateDismissed(true)}
      />

      {/* Floating Dynamic Toast Notification */}
      <ToastNotification 
        toastMessage={toastMessage}
        toastType={toastType}
        onClick={toastMessage && toastMessage.includes('작물 메뉴로 이동') ? () => {
          handleSetCategory('crops');
          setToastMessage(null);
        } : undefined}
      />

      {/* Crop Background Completion Alert Banner */}
      <CropAlertBanner
        alertQueue={cropAlertQueue}
        onNavigate={() => {
          handleSetCategory('crops');
          setCropAlertQueue([]);
        }}
        onDismissItem={(id) => {
          setCropAlertQueue(prev => prev.filter(item => item.id !== id));
        }}
        onCloseAll={() => setCropAlertQueue([])}
      />

      <FloatingReportButton 
        isOnline={isOnline}
        isTimerModalOpen={isTimerModalOpen}
        isPermissionDeniedError={isPermissionDeniedError}
        isQuotaExceededError={isQuotaExceededError}
        isForceUpdateRequired={isForceUpdateRequired}
        isShowMaintenance={isShowMaintenance}
        user={user}
        hasUnsyncedChanges={hasUnsyncedChanges}
        isInitialSyncDone={isInitialSyncDone}
        isMapOpen={isMapOpen}
        setIsMapOpen={(open) => {
          if (open) {
            const mapName = activeCategory === 'ocean_cleaning' ? '고래낙하협곡' : '고래섬';
            const currentPath = location.pathname.startsWith('/map') ? `/${activeCategory}` : location.pathname;
            const searchParams = new URLSearchParams(location.search);
            searchParams.set('map', mapName);
            navigate(`${currentPath}?${searchParams.toString()}${location.hash}`, { replace: false });
          } else {
            const newPathname = '/' + activeCategory;
            const params = new URLSearchParams(window.location.search);
            params.delete('map');
            params.delete('id');
            params.delete('mapid');
            params.delete('location');
            const cleanSearch = params.toString();
            const newUrl = newPathname + (cleanSearch ? '?' + cleanSearch : '') + window.location.hash;
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('last_closed_map_url', window.location.pathname + window.location.search);
            }
            navigate(newUrl, { replace: true });
          }
        }}
        setHighlightedLocation={setHighlightedLocation}
        setHighlightedItemName={setHighlightedItemName}
        activeCategory={activeCategory}
        setIsContactModalOpen={setIsContactModalOpen}
        isIngredientModalOpen={isIngredientModalOpen}
      />


      <DeleteAccountModal 
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        deleteConfirmText={deleteConfirmText}
        setDeleteConfirmText={setDeleteConfirmText}
        isDeleterLoading={isDeleterLoading}
        deleteError={deleteError}
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}



