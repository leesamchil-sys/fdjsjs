import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Sun, 
  Moon, 
  Type, 
  Bookmark, 
  Cloud, 
  Monitor, 
  AlertTriangle, 
  Shield, 
  Check, 
  Save, 
  Database, 
  Download, 
  Upload, 
  Sparkles, 
  MessageSquare,
  Search,
  Trash2,
  User,
  Clock,
  Info,
  History,
  Cpu,
  LayoutGrid,
  ShieldCheck,
  Megaphone,
  Key,
  CloudSun, MapPin, 
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, parse } from 'date-fns';
import { safeJsonParse } from '../lib/utils';
import { Category, ThemeMode, WeeklyWeather, DetailedWeather, GameWeather, DailyLocations } from '../types';
import { getKoreanDayName } from '../lib/appHelpers';
import { WeatherIcon, translateWeather } from './ItemCard';
import { useAppTheme } from '../hooks/useAppTheme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode?: ThemeMode;
  setThemeMode?: (val: ThemeMode) => void;
  fontSizeLevel?: number;
  setFontSizeLevel?: (val: number | ((prev: number) => number)) => void;
  defaultTab: Category | 'last_used';
  setDefaultTab: (val: Category | 'last_used') => void;
  isLoggedIn: boolean;
  onBackupData?: () => string | Promise<string>;
  onRestoreData?: (data: any) => void | Promise<void>;
  onStartImport?: (data: any) => void;
  onImportError?: (message: string) => void;
  // Admin props
  isAdmin?: boolean;
  minSupportedVersion?: string;
  isMaintenanceMode?: boolean;
  maintenanceStart?: string;
  maintenanceEnd?: string;
  allowedUids?: string[];
  bypassCode?: string;
  marqueeNotice?: string;
  marqueeRepeat?: number;
  marqueeHistory?: string[];
  marqueeCustom?: string[];
  isForceUpdateActive?: boolean;
  forceUpdateMessage?: string;
  isManualQuotaExceeded?: boolean;
  testUpdateBanner?: () => void;
  testMaintenance?: () => void;
  testMaintenanceCompleted?: () => void;
  onUpdateConfig?: (updates: { 
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
  }) => Promise<void>;
  menuStatus?: Record<string, { active: boolean; message?: string }>;
  currentTime?: Date;
  adminWeeklyWeather?: WeeklyWeather;
  adminDetailedWeather?: DetailedWeather;
  adminDailyLocations?: DailyLocations;
}

export default function SettingsModal({
  isOpen,
  onClose,
  themeMode: propThemeMode,
  setThemeMode: propSetThemeMode,
  fontSizeLevel: propFontSizeLevel,
  setFontSizeLevel: propSetFontSizeLevel,
  defaultTab,
  setDefaultTab,
  isLoggedIn,
  onBackupData,
  onRestoreData,
  onStartImport,
  onImportError,
  isAdmin = false,
  minSupportedVersion = '1.0.0',
  isMaintenanceMode = false,
  maintenanceStart = '',
  maintenanceEnd = '',
  allowedUids = [],
  bypassCode = '',
  marqueeNotice = '',
  marqueeRepeat = 0,
  marqueeHistory = [],
  marqueeCustom = [],
  isForceUpdateActive = false,
  forceUpdateMessage = '',
  isManualQuotaExceeded = false,
  testUpdateBanner,
  testMaintenance,
  testMaintenanceCompleted,
  onUpdateConfig,
  menuStatus = {},
  currentTime,
  adminWeeklyWeather = {},
  adminDetailedWeather = {},
  adminDailyLocations = {}
 }: SettingsModalProps) {
  const {
    themeMode: hookThemeMode,
    setThemeMode: hookSetThemeMode,
    fontSizeLevel: hookFontSizeLevel,
    setFontSizeLevel: hookSetFontSizeLevel
  } = useAppTheme();

  const themeMode = propThemeMode ?? hookThemeMode;
  const setThemeMode = propSetThemeMode ?? hookSetThemeMode;
  const fontSizeLevel = propFontSizeLevel ?? hookFontSizeLevel;
  const setFontSizeLevel = propSetFontSizeLevel ?? hookSetFontSizeLevel;

  const [activeSettingTab, setActiveSettingTab] = useState<'general' | 'data' | 'admin'>('general');
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'system' | 'availability' | 'notice' | 'access' | 'weather' | 'daily_locations' | 'data_export'>('system');
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isImportingAll, setIsImportingAll] = useState(false);
  const [importAllProgress, setImportAllProgress] = useState<string>('');
  const [importAllPendingData, setImportAllPendingData] = useState<any[] | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const adminFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importPendingData, setImportPendingData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adminMinVersion, setAdminMinVersion] = useState(minSupportedVersion);
  const [adminMaintenance, setAdminMaintenance] = useState(isMaintenanceMode);
  const [adminManualQuota, setAdminManualQuota] = useState(isManualQuotaExceeded);
  const [adminMaintenanceStart, setAdminMaintenanceStart] = useState(maintenanceStart);
  const [adminMaintenanceEnd, setAdminMaintenanceEnd] = useState(maintenanceEnd);
  const [adminAllowedUids, setAdminAllowedUids] = useState(allowedUids.join(', '));
  const [adminBypassCode, setAdminBypassCode] = useState(bypassCode);
  const [adminMarqueeEnabled, setAdminMarqueeEnabled] = useState(!!marqueeNotice);
  const [adminMarqueeNotice, setAdminMarqueeNotice] = useState(marqueeNotice);
  const [adminMarqueeRepeat, setAdminMarqueeRepeat] = useState(marqueeRepeat);
  const [adminMarqueeHistory, setAdminMarqueeHistory] = useState<string[]>(marqueeHistory);
  const [adminMarqueeCustom, setAdminMarqueeCustom] = useState<string[]>(marqueeCustom);
  const [adminForceUpdateActive, setAdminForceUpdateActive] = useState(isForceUpdateActive);
  const [adminForceUpdateMessage, setAdminForceUpdateMessage] = useState(forceUpdateMessage);
  const [adminMenuStatus, setAdminMenuStatus] = useState<Record<string, { active: boolean; message?: string }>>(menuStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [localAdminWeekly, setLocalAdminWeekly] = useState<WeeklyWeather>(adminWeeklyWeather);
  const [localAdminDetailed, setLocalAdminDetailed] = useState<DetailedWeather>(adminDetailedWeather);
  const [localAdminDailyLocations, setLocalAdminDailyLocations] = useState<DailyLocations>(adminDailyLocations);
  const [weatherBaseDate, setWeatherBaseDate] = useState<Date>(() => currentTime || new Date());
  const [dailyLocationBaseDate, setDailyLocationBaseDate] = useState<Date>(() => currentTime || new Date());

  const MENU_LABELS: Record<string, string> = {
    home: '🏡 대시보드',
    coupons: '🎫 두두타 리딤코드',
    birds: '🐦 새 도감',
    insects: '🐛 곤충 도감',
    fishing: '🎣 낚시 도감',
    cooking: '🍳 요리 도감',
    gardening: '🌸 원예/작물 도감',
    crops: '🌾 작물&맞춤형 알림',
    petfood: '🐾 펫 먹이 찾기',
    trend_checklist: '👕 트렌드상점 체크리스트',
    seasonal_banner: '📅 시즌 이벤트 도감 배너'
  };
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPhraseManagerOpen, setIsPhraseManagerOpen] = useState(false);
  const [phraseManagerTab, setPhraseManagerTab] = useState<'history' | 'custom'>('history');
  const [editingCustomIdx, setEditingCustomIdx] = useState<number | null>(null);
  const [customPhraseInput, setCustomPhraseInput] = useState('');
  const [selectedWeatherDayKey, setSelectedWeatherDayKey] = useState<string>('');

  const prevIsOpen = React.useRef(false);

  // 서버 설정값이 바뀌거나 모달이 열릴 때 상태 동기화
  React.useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setActiveSettingTab('general');
      setAdminMinVersion(minSupportedVersion);
      setAdminMaintenance(isMaintenanceMode);
      setAdminManualQuota(isManualQuotaExceeded);
      setAdminMaintenanceStart(maintenanceStart);
      setAdminMaintenanceEnd(maintenanceEnd);
      setAdminAllowedUids(allowedUids.join(', '));
      setAdminBypassCode(bypassCode);
      setAdminMarqueeEnabled(!!marqueeNotice);
      setAdminMarqueeNotice(marqueeNotice);
      setAdminMarqueeRepeat(marqueeRepeat);
      setAdminMarqueeHistory(marqueeHistory);
      setAdminMarqueeCustom(marqueeCustom);
      setAdminForceUpdateActive(isForceUpdateActive);
      setAdminForceUpdateMessage(forceUpdateMessage);
      setLocalAdminWeekly(adminWeeklyWeather || {});
      setLocalAdminDetailed(adminDetailedWeather || {});
      setLocalAdminDailyLocations(adminDailyLocations || {});
      setWeatherBaseDate(currentTime || new Date());
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, minSupportedVersion, isMaintenanceMode, isManualQuotaExceeded, maintenanceStart, maintenanceEnd, allowedUids, bypassCode, marqueeNotice, marqueeRepeat, marqueeHistory, marqueeCustom, isForceUpdateActive, forceUpdateMessage, adminWeeklyWeather, adminDetailedWeather, adminDailyLocations, currentTime]);

  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 브라우저 뒤로가기(하드웨어 뒤로가기) 버튼으로 설정창을 닫을 수 있도록 히스토리 제어
  React.useEffect(() => {
    if (!isOpen) return;

    const stateName = 'pigtown-settings-modal';
    window.history.pushState({ modal: stateName }, '');

    const handlePopState = (event: PopStateEvent) => {
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if ((window.history.state as any)?.modal === stateName) {
        window.history.back();
      }
    };
  }, [isOpen]);

  const sanitizeDailyLocations = React.useCallback((locs: DailyLocations = {}): DailyLocations => {
    const result: DailyLocations = {};
    Object.keys(locs).sort().forEach(dateKey => {
      const item = locs[dateKey];
      if (!item) return;
      const f = item.fluorescentRock?.trim();
      const o = item.oakTree?.trim();
      if (f || o) {
        result[dateKey] = {
          ...(f ? { fluorescentRock: f } : {}),
          ...(o ? { oakTree: o } : {})
        };
      }
    });
    return result;
  }, []);

  const hasChanges = React.useMemo(() => {
    if (adminMinVersion !== minSupportedVersion) return true;
    if (adminMaintenance !== isMaintenanceMode) return true;
    if (adminManualQuota !== isManualQuotaExceeded) return true;
    if (adminMaintenanceStart !== maintenanceStart) return true;
    if (adminMaintenanceEnd !== maintenanceEnd) return true;
    if (adminAllowedUids !== allowedUids.join(', ')) return true;
    if (adminBypassCode !== bypassCode) return true;
    if (adminMarqueeEnabled !== !!marqueeNotice) return true;
    if (adminMarqueeNotice !== marqueeNotice) return true;
    if (adminMarqueeRepeat !== marqueeRepeat) return true;
    if (JSON.stringify(adminMarqueeHistory) !== JSON.stringify(marqueeHistory)) return true;
    if (JSON.stringify(adminMarqueeCustom) !== JSON.stringify(marqueeCustom)) return true;
    if (adminForceUpdateActive !== isForceUpdateActive) return true;
    if (adminForceUpdateMessage !== forceUpdateMessage) return true;
    if (JSON.stringify(adminMenuStatus) !== JSON.stringify(menuStatus)) return true;
    if (JSON.stringify(localAdminWeekly) !== JSON.stringify(adminWeeklyWeather || {})) return true;
    if (JSON.stringify(localAdminDetailed) !== JSON.stringify(adminDetailedWeather || {})) return true;

    const currentSanitizedLocs = sanitizeDailyLocations(localAdminDailyLocations);
    const propSanitizedLocs = sanitizeDailyLocations(adminDailyLocations || {});
    if (JSON.stringify(currentSanitizedLocs) !== JSON.stringify(propSanitizedLocs)) return true;

    return false;
  }, [
    adminMinVersion, minSupportedVersion,
    adminMaintenance, isMaintenanceMode,
    adminManualQuota, isManualQuotaExceeded,
    adminMaintenanceStart, maintenanceStart,
    adminMaintenanceEnd, maintenanceEnd,
    adminAllowedUids, allowedUids,
    adminBypassCode, bypassCode,
    adminMarqueeEnabled, marqueeNotice,
    adminMarqueeNotice,
    adminMarqueeRepeat, marqueeRepeat,
    adminMarqueeHistory, marqueeHistory,
    adminMarqueeCustom, marqueeCustom,
    adminForceUpdateActive, isForceUpdateActive,
    adminForceUpdateMessage, forceUpdateMessage,
    adminMenuStatus, menuStatus,
    localAdminWeekly, adminWeeklyWeather,
    localAdminDetailed, adminDetailedWeather,
    localAdminDailyLocations, adminDailyLocations,
    sanitizeDailyLocations
  ]);

  const handleSaveAdminConfig = async () => {
    if (!onUpdateConfig) return;
    if (!isAdmin) {
      alert("권한이 비정상적입니다. 변경 사항을 저장할 수 없습니다.");
      return;
    }

    // 1. Check for incomplete daily location entries (where only one of fluorescentRock or oakTree is entered)
    const incompleteDates: string[] = [];
    Object.entries(localAdminDailyLocations).forEach(([dateKey, loc]) => {
      const locData = loc as { fluorescentRock?: string; oakTree?: string } | null;
      const f = locData?.fluorescentRock?.trim();
      const o = locData?.oakTree?.trim();
      if ((f && !o) || (!f && o)) {
        incompleteDates.push(dateKey);
      }
    });

    if (incompleteDates.length > 0) {
      alert(`형광석과 참나무 위치를 모두 선택하거나, 둘 다 '미지정'으로 선택해 주세요.\n(한 쪽만 선택된 날짜: ${incompleteDates.join(', ')})`);
      return;
    }

    setIsSaving(true);
    try {
      // Update history automatically
      let newHistory = [...adminMarqueeHistory];
      const trimmedNotice = adminMarqueeNotice.trim();
      if (trimmedNotice && adminMarqueeEnabled) {
        newHistory = newHistory.filter(h => h !== trimmedNotice);
        newHistory.unshift(trimmedNotice);
        newHistory = newHistory.slice(0, 15); // Limit to 15 for history
      }

      // Clean up UID list and sanitize daily locations
      const uids = adminAllowedUids.split(',').map(u => u.trim()).filter(u => u.length > 0);
      const sanitizedDailyLocations = sanitizeDailyLocations(localAdminDailyLocations);

      await onUpdateConfig({
        min_version: adminMinVersion,
        is_maintenance: adminMaintenance,
        maintenance_start: adminMaintenanceStart,
        maintenance_end: adminMaintenanceEnd,
        allowed_uids: uids,
        bypass_code: adminBypassCode.trim(),
        marquee_notice: adminMarqueeEnabled ? adminMarqueeNotice : '',
        marquee_repeat: Number(adminMarqueeRepeat) || 0,
        marquee_history: newHistory,
        marquee_custom: adminMarqueeCustom,
        is_force_update_active: adminForceUpdateActive,
        force_update_message: adminForceUpdateMessage.trim(),
        is_manual_quota_exceeded: adminManualQuota,
        menu_status: adminMenuStatus,
        admin_weekly_weather: localAdminWeekly,
        admin_detailed_weather: localAdminDetailed,
        admin_daily_locations: sanitizedDailyLocations
      });
      setAdminMarqueeHistory(newHistory);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save admin config:", err);
      alert("설정 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDecreaseFont = () => {
    setFontSizeLevel(prev => Math.max(1, prev - 1));
  };

  const handleIncreaseFont = () => {
    setFontSizeLevel(prev => Math.min(6, prev + 1));
  };

  const getFontSizeLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: '더 작게 (85%)',
      2: '조금 작게 (92.5%)',
      3: '기본 크기 (100%)',
      4: '조금 크게 (108%)',
      5: '더 크게 (116%)',
      6: '가장 크게 (125%)'
    };
    return labels[level] || '100%';
  };

  const handleExportData = async () => {
    if (!onBackupData) return;
    try {
      const backupStr = await onBackupData();
      const blob = new Blob([backupStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      link.href = url;
      link.download = `pigtown_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage('기록을 파일로 내보내는 도중 오류가 발생했습니다: ' + String(error));
    }
  };

  const handleExportAllUsers = async () => {
    if (!isAdmin) return;
    setIsExportingAll(true);
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const allUsers: any[] = [];
      querySnapshot.forEach((doc) => {
        allUsers.push({ id: doc.id, ...doc.data() });
      });

      const blob = new Blob([JSON.stringify(allUsers, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      link.href = url;
      link.download = `pigtown_all_users_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage('전체 유저 기록 내보내기 중 오류: ' + String(error));
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleImportAllUsersFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = safeJsonParse(text, null);
        if (!parsed || !Array.isArray(parsed)) {
          setErrorMessage('올바른 백업 파일(JSON 배열 형태)이 아닙니다.');
          return;
        }
        setImportAllPendingData(parsed);
      } catch (err) {
        setErrorMessage('파일을 읽는 도중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStartImportAllUsers = async () => {
    if (!importAllPendingData || !isAdmin) return;
    setIsImportingAll(true);
    setImportAllProgress('복원 시작 중...');
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      let successCount = 0;
      for (let i = 0; i < importAllPendingData.length; i++) {
        const user = importAllPendingData[i];
        if (!user || !user.id) continue;
        const { id, ...data } = user;
        const userRef = doc(db, 'users', id);
        await setDoc(userRef, data);
        successCount++;
        setImportAllProgress(`복원 진행 중... (${successCount} / ${importAllPendingData.length} 완료)`);
      }
      setSuccessMessage(`성공적으로 ${successCount}명의 유저 데이터를 복원했습니다.`);
      setImportAllPendingData(null);
    } catch (error) {
      setErrorMessage('유저 데이터 일괄 복원 중 오류: ' + String(error));
    } finally {
      setIsImportingAll(false);
      setImportAllProgress('');
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = safeJsonParse(text, null);
        if (!parsed || !onRestoreData) return;
        
        if (onStartImport) {
          onStartImport(parsed);
        } else {
          setImportPendingData(parsed);
        }
      } catch (error: any) {
        const errMessage = '불러오기 실패: 올바르지 않은 데이터 형식이거나 파일이 손상되었습니다. (' + error?.message + ')';
        if (onImportError) {
          onImportError(errMessage);
        } else {
          setErrorMessage(errMessage);
        }
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!importPendingData || !onRestoreData) return;
    try {
      await onRestoreData(importPendingData);
      setSuccessMessage('🎉 모든 도감 기록 및 설정 복원이 정상적으로 완료되었습니다!');
      setImportPendingData(null);
    } catch (error: any) {
      setErrorMessage('복원 도중 오류가 발생했습니다: ' + (error?.message || error));
      setImportPendingData(null);
    }
  };

  const categoriesList: { id: Category | 'last_used'; label: string }[] = [
    { id: 'last_used', label: '🕒 마지막 사용 탭' },
    { id: 'home', label: '🏡 대시보드' },
    { id: 'coupons', label: '🎫 두두타 리딤코드' },
    { id: 'birds', label: '🐦 새 도감' },
    { id: 'insects', label: '🐛 곤충 도감' },
    { id: 'fishing', label: '🎣 낚시 도감' },
    { id: 'cooking', label: '🍳 요리 도감' },
    { id: 'crops', label: '🌾 작물&맞춤형 알림' },
    { id: 'petfood', label: '💖 펫 먹이 찾기' },
    { id: 'gardening', label: '🌸 원예 및 작물 도감' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full transition-all duration-500 ease-in-out overflow-hidden flex flex-col rounded-[32px] bg-white dark:bg-stone-850 shadow-[0_25px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] border-2 border-stone-200 dark:border-stone-700 ring-1 ring-black/5 dark:ring-white/10 ${
              activeSettingTab === 'admin' 
                ? 'max-w-4xl h-[min(800px,90svh)]' 
                : 'max-w-md h-[min(640px,90svh)]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-6 pb-4 shrink-0">
              <div className="p-2.5 bg-neutral-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-2xl shadow-lg">
                <Settings className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-black text-slate-900 dark:text-stone-50">환경 설정</h2>
                <p className="text-[10px] text-stone-400 font-bold">Preferences & Data</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-neutral-100 dark:hover:bg-stone-800 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-neutral-400" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-stone-150 dark:border-stone-750 px-6 select-none shrink-0 gap-4 mb-2">
              <button
                onClick={() => setActiveSettingTab('general')}
                className={`py-2 px-1 text-xs font-black transition-all border-b-2 relative cursor-pointer ${
                  activeSettingTab === 'general'
                    ? 'border-slate-900 text-slate-900 dark:border-stone-100 dark:text-stone-50'
                    : 'border-transparent text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                }`}
              >
                일반 설정
              </button>
              <button
                onClick={() => setActiveSettingTab('data')}
                className={`py-2 px-1 text-xs font-black transition-all border-b-2 relative cursor-pointer ${
                  activeSettingTab === 'data'
                    ? 'border-slate-900 text-slate-900 dark:border-stone-100 dark:text-stone-50'
                    : 'border-transparent text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                }`}
              >
                데이터 관리
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveSettingTab('admin')}
                  className={`py-2 px-1 text-xs font-black transition-all border-b-2 relative cursor-pointer ${
                    activeSettingTab === 'admin'
                      ? 'border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  관리자 설정
                </button>
              )}
            </div>

            {/* Settings Content */}
            <div className={`flex-1 min-h-0 flex flex-col ${activeSettingTab === 'admin' ? '' : 'p-6 pt-2'}`}>
              <div className={`flex-1 min-h-0 flex flex-col ${activeSettingTab === 'admin' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
                <AnimatePresence mode="wait">
                  {activeSettingTab === 'general' ? (
                    <motion.div 
                      key="general"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6 max-w-md mx-auto w-full"
                    >
                    {/* Theme */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Sun className="h-3.5 w-3.5 text-amber-500" />
                        <h3 className="text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">Theme Mode</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                         {[
                          { id: 'light', label: '라이트', icon: Sun },
                          { id: 'dark', label: '다크', icon: Moon },
                          { id: 'system', label: '자동', icon: Monitor }
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => setThemeMode(mode.id as ThemeMode)}
                            className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all cursor-pointer ${
                              themeMode === mode.id
                                ? 'border-slate-900 bg-slate-900 text-white dark:border-stone-100 dark:bg-stone-50 dark:text-stone-900 font-bold shadow-md'
                                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-500 dark:text-stone-400'
                            }`}
                          >
                            <mode.icon className="h-4 w-4" />
                            <span className="text-[10px] font-black">{mode.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Type className="h-3.5 w-3.5 text-indigo-500" />
                        <h3 className="text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">Font Size</h3>
                      </div>
                      <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-2 flex items-center justify-between border border-stone-100 dark:border-stone-800/50">
                        <button
                          onClick={handleDecreaseFont}
                          disabled={fontSizeLevel <= 1}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 disabled:opacity-20 transition-all active:scale-90 cursor-pointer"
                        >
                          <span className="text-lg font-black">-</span>
                        </button>
                        <div className="text-center">
                          <p className="text-[12px] font-black text-slate-900 dark:text-stone-100">{getFontSizeLabel(fontSizeLevel).split(' (')[0]}</p>
                          <p className="text-[9px] text-stone-400 font-bold">{getFontSizeLabel(fontSizeLevel).match(/\(.*\)/)?.[0] || ''}</p>
                        </div>
                        <button
                          onClick={handleIncreaseFont}
                          disabled={fontSizeLevel >= 6}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 disabled:opacity-20 transition-all active:scale-90 cursor-pointer"
                        >
                          <span className="text-lg font-black">+</span>
                        </button>
                      </div>
                    </div>

                     {/* Starting Tab */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Bookmark className="h-4 w-4 text-emerald-500" />
                        <h3 className="text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">Default Tab</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                        {categoriesList.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setDefaultTab(cat.id)}
                            className={`px-3.5 py-2.5 rounded-2xl border text-left text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer ${
                              defaultTab === cat.id
                                ? 'border-emerald-500 bg-emerald-500/5 text-emerald-605 dark:border-emerald-400 dark:bg-emerald-400/5 dark:text-emerald-400 ring-1 ring-emerald-500/10'
                                : 'border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-500 dark:text-stone-400'
                            }`}
                          >
                            <span className="truncate">{cat.label}</span>
                            {defaultTab === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 ml-1" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : activeSettingTab === 'data' ? (
                  <motion.div 
                    key="data"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4 max-w-md mx-auto w-full"
                  >
                    {/* Cloud Sync Status */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Cloud className="h-4 w-4 text-purple-500" />
                        <h3 className="text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">Cloud Sync</h3>
                      </div>
                      <div className="p-5 bg-stone-50 dark:bg-stone-950 rounded-3xl border border-stone-100 dark:border-stone-800 space-y-4">
                         <div className="flex items-center justify-between">
                           <span className="text-[11px] font-bold text-stone-500">현재의 기기 상태</span>
                           {isLoggedIn ? (
                             <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                               <span className="text-[10px] font-black">실시간 동기화 중</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 px-2.5 py-1 bg-stone-205 dark:bg-stone-800 text-stone-500 rounded-full">
                               <span className="text-[10px] font-black">오프라인 (로컬 저장)</span>
                             </div>
                           )}
                         </div>
                         
                         {!isLoggedIn && (
                           <div className="flex gap-3 p-3.5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800">
                             <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                             <p className="text-[9.5px] text-stone-500 dark:text-stone-400 font-bold leading-relaxed">
                               비로그인 상태에서는 브라우저 쿠키/임시 저장공간 삭제 시 도감 및 작물 재배 알림 기록들이 소실될 수 있습니다. 계정을 연동하시면 나의 도감 기록이 클라우드에 실시간으로 안전하게 저장됩니다!
                             </p>
                           </div>
                         )}
                      </div>
                    </div>

                    {/* 수집 및 설정 보관(백업 및 복원) */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 px-1">
                        <Database className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
                        <h3 className="text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">수동 백업 및 복원</h3>
                      </div>
                      <div className="p-5 bg-stone-50 dark:bg-stone-950 rounded-3xl border border-stone-100 dark:border-stone-800 space-y-4">
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold leading-relaxed mb-1">
                          도감·펫·설정 데이터를 수동으로 저장하거나 복원할 수 있습니다.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {/* 백업하기 */}
                          <button
                            type="button"
                            onClick={handleExportData}
                            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl gap-2.5 transition-all cursor-pointer active:scale-95 group shadow-xs min-h-[100px]"
                          >
                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform duration-300">
                              <Download className="h-4 w-4" />
                            </div>
                            <div className="text-center">
                              <div className="text-[10.5px] font-black text-stone-800 dark:text-stone-100">다운로드</div>
                            </div>
                          </button>

                          {/* 복원하기 */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl gap-2.5 transition-all cursor-pointer active:scale-95 group shadow-xs text-center min-h-[100px]"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-transform duration-300">
                              <Upload className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[10.5px] font-black text-stone-800 dark:text-stone-100">불러오기</div>
                            </div>
                          </button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="admin"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                      {/* Admin Sidebar */}
                      <div className="w-full md:w-48 bg-stone-50/50 dark:bg-stone-900/30 border-b md:border-b-0 md:border-r border-stone-100 dark:border-stone-800 p-2 md:p-3 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto gap-1.5 shrink-0 custom-scrollbar">
                        <div className="hidden md:block px-3 py-2 mb-1">
                          <h3 className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">Administrator</h3>
                        </div>
                        {[
                          { id: 'system', label: '시스템 설정', icon: Cpu },
                          { id: 'availability', label: '메뉴 활성화', icon: LayoutGrid },
                          { id: 'notice', label: '공지 관리', icon: Megaphone },
                          { id: 'access', label: '접근 및 점검', icon: ShieldCheck },
                          { id: 'weather', label: '운영 날씨 설정', icon: CloudSun },
                          { id: 'daily_locations', label: '일일 정보 설정', icon: MapPin },
                          { id: 'data_export', label: '데이터 추출', icon: Database }
                        ].map(subTab => (
                          <button
                            key={subTab.id}
                            type="button"
                            onClick={() => setActiveAdminSubTab(subTab.id as any)}
                            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-[11px] font-black transition-all group shrink-0 whitespace-nowrap cursor-pointer ${
                              activeAdminSubTab === subTab.id 
                                ? 'bg-white dark:bg-stone-800 text-blue-600 dark:text-blue-400 shadow-sm border border-stone-200 dark:border-stone-700' 
                                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/50'
                            }`}
                          >
                            <subTab.icon className={`h-4 w-4 transition-colors ${activeAdminSubTab === subTab.id ? 'text-blue-500' : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300'}`} />
                            {subTab.label}
                          </button>
                        ))}
                      </div>

                      {/* Admin Content Area */}
                      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-stone-950/20">
                        <div className="max-w-2xl mx-auto space-y-8">
                          {activeAdminSubTab === 'data_export' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="space-y-1">
                                <h3 className="text-sm font-black text-slate-900 dark:text-stone-100 uppercase tracking-tight">유저 데이터 관리</h3>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold">서비스에 가입된 모든 유저의 기록(문서)을 다운로드하거나 복원할 수 있습니다.</p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Export Card */}
                                <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center space-y-4">
                                  <Database className="h-10 w-10 text-emerald-500" />
                                  <div className="text-center">
                                    <div className="text-sm font-black text-slate-900 dark:text-white">모든 유저 기록 백업</div>
                                    <div className="text-[11px] text-stone-500 font-bold mt-1">Firestore users 컬렉션의 모든 문서를 읽어옵니다.</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleExportAllUsers}
                                    disabled={isExportingAll}
                                    className="mt-4 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                                  >
                                    {isExportingAll ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        추출 중...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-4 h-4" />
                                        JSON으로 저장
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Import/Restore Card */}
                                <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center space-y-4">
                                  <Upload className="h-10 w-10 text-amber-500" />
                                  <div className="text-center">
                                    <div className="text-sm font-black text-slate-900 dark:text-white">전체 유저 데이터 복원</div>
                                    <div className="text-[11px] text-stone-500 font-bold mt-1">백업한 JSON 파일(배열 형식)을 가져와 Firestore의 'users' 컬렉션에 덮어씁니다.</div>
                                  </div>
                                  <input
                                    type="file"
                                    ref={adminFileInputRef}
                                    onChange={handleImportAllUsersFile}
                                    accept=".json"
                                    className="hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => adminFileInputRef.current?.click()}
                                    disabled={isImportingAll}
                                    className="mt-4 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-2"
                                  >
                                    {isImportingAll ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {importAllProgress || '복원 진행 중...'}
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-4 h-4" />
                                        백업 JSON 파일 선택
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Confirmation Dialog */}
                              {importAllPendingData && (
                                <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900 space-y-3">
                                  <div className="flex gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                                    <div>
                                      <div className="text-xs font-black text-slate-950 dark:text-white">유저 데이터 일괄 복원 대기 중</div>
                                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold mt-1">
                                        업로드된 백업 파일에서 총 <span className="text-amber-600 dark:text-amber-400 font-black">{importAllPendingData.length}개</span>의 유저 기록을 감지했습니다.<br />
                                        이 작업은 해당 유저들의 기존 Firestore 문서를 <strong>완전히 덮어씁니다</strong>.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setImportAllPendingData(null)}
                                      className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                                    >
                                      취소
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleStartImportAllUsers}
                                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg transition-colors shadow-sm shadow-amber-500/10 cursor-pointer"
                                    >
                                      복원 시작 (덮어쓰기)
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {activeAdminSubTab === 'system' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="space-y-1">
                                <h3 className="text-sm font-black text-slate-900 dark:text-stone-100 uppercase tracking-tight">버전 관리</h3>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold">애플리케이션의 최소 지원 버전 및 업데이트를 강제합니다.</p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
                                  <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Cpu className="h-3 w-3" /> 최소 지원 버전
                                  </label>
                                  <input 
                                    type="text"
                                    value={adminMinVersion}
                                    onChange={(e) => setAdminMinVersion(e.target.value)}
                                    placeholder="e.g. 1.0.0"
                                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                  />
                                </div>
                                
                                <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                                      <AlertTriangle className="h-3 w-3 text-amber-500" /> 업데이트 강제 여부
                                    </label>
                                    <button
                                      onClick={() => setAdminForceUpdateActive(!adminForceUpdateActive)}
                                      className={`w-10 h-5 rounded-full relative transition-all ${adminForceUpdateActive ? 'bg-amber-500 shadow-lg shadow-amber-500/20' : 'bg-stone-200 dark:bg-stone-800'}`}
                                    >
                                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${adminForceUpdateActive ? 'right-1' : 'left-1'}`} />
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold leading-tight">활성화 시 최소 버전 미만 사용자는 앱 진입이 차단됩니다.</p>
                                </div>
                              </div>

                              <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
                                <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                                  <MessageSquare className="h-3 w-3" /> 업데이트 안내 문구
                                </label>
                                <textarea 
                                  value={adminForceUpdateMessage}
                                  onChange={(e) => setAdminForceUpdateMessage(e.target.value)}
                                  placeholder="최신 버전 업데이트가 필요합니다."
                                  rows={3}
                                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                />
                              </div>
                            </div>
                          )}

                          {activeAdminSubTab === 'availability' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="space-y-1">
                                <h3 className="text-sm font-black text-slate-900 dark:text-stone-100 uppercase tracking-tight">메뉴 활성화 관리</h3>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold">각 메뉴별 접근 권한 및 점검 안내를 설정합니다.</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(MENU_LABELS).map(([id, label]) => {
                                  const status = adminMenuStatus[id] || { active: true };
                                  return (
                                    <div key={id} className={`p-4 rounded-2xl border transition-all ${
                                      status.active !== false 
                                        ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm' 
                                        : 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 shadow-none'
                                    }`}>
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${status.active !== false ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                                          <span className="text-xs font-black text-slate-900 dark:text-stone-100">{label}</span>
                                        </div>
                                        <button
                                          onClick={() => {
                                            setAdminMenuStatus(prev => ({
                                              ...prev,
                                              [id]: { ...status, active: status.active === false }
                                            }));
                                          }}
                                          className={`w-9 h-5 rounded-full relative transition-all ${status.active !== false ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-800'}`}
                                        >
                                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${status.active !== false ? 'right-1' : 'left-1'}`} />
                                        </button>
                                      </div>
                                      
                                      {status.active === false && (
                                        <div className="space-y-1.5 animate-in zoom-in-95 duration-200">
                                          <label className="text-[9px] font-black text-rose-500/70 ml-0.5 uppercase tracking-tighter">점검 안내 문구</label>
                                          <input 
                                            type="text"
                                            value={status.message || ''}
                                            onChange={(e) => {
                                              setAdminMenuStatus(prev => ({
                                                ...prev,
                                                [id]: { ...status, message: e.target.value }
                                              }));
                                            }}
                                            placeholder="기본 점검 문구 표시"
                                            className="w-full bg-white dark:bg-stone-950 border border-rose-200 dark:border-rose-900/30 rounded-xl px-2.5 py-1.5 text-[10px] text-slate-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-rose-500"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {activeAdminSubTab === 'notice' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="space-y-1">
                                <h3 className="text-sm font-black text-slate-900 dark:text-stone-100 uppercase tracking-tight">공지 관리</h3>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold">상단 마키 공지 및 사용자 문구를 관리합니다.</p>
                              </div>

                              <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider">공지 내용</label>
                                    <button 
                                      onClick={() => setIsPhraseManagerOpen(true)}
                                      className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full text-[10px] font-black text-stone-500 transition-all border border-stone-200 dark:border-stone-800 shadow-sm"
                                    >
                                      <History className="h-3 w-3" /> 문구 관리
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => setAdminMarqueeEnabled(!adminMarqueeEnabled)}
                                      className={`w-12 h-6 rounded-full relative transition-all shadow-sm ${adminMarqueeEnabled ? 'bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-stone-200 dark:bg-stone-800'}`}
                                    >
                                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${adminMarqueeEnabled ? 'right-1' : 'left-1'}`} />
                                    </button>
                                    <input 
                                      type="text"
                                      value={adminMarqueeNotice}
                                      onChange={(e) => setAdminMarqueeNotice(e.target.value)}
                                      disabled={!adminMarqueeEnabled}
                                      placeholder="표시할 공지 내용을 입력하세요."
                                      className={`w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${!adminMarqueeEnabled ? 'opacity-50 grayscale' : ''}`}
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-100 dark:border-stone-800">
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-black text-slate-900 dark:text-stone-100 tracking-tight">공지 반복 횟수</span>
                                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">사용자가 공지를 볼 횟수를 지정합니다.</p>
                                  </div>
                                  <input 
                                    type="number"
                                    value={adminMarqueeRepeat}
                                    onChange={(e) => setAdminMarqueeRepeat(parseInt(e.target.value) || 1)}
                                    min="1"
                                    max="10"
                                    className="w-16 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-center text-xs text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {activeAdminSubTab === 'access' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="space-y-1">
                                <h3 className="text-sm font-black text-slate-900 dark:text-stone-100 uppercase tracking-tight">접근 및 점검 관리</h3>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold">서비스 점검 상태 및 관리자 권한을 설정합니다.</p>
                              </div>

                              <div className="bg-rose-50/50 dark:bg-rose-950/10 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/30 space-y-5">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2.5 h-2.5 rounded-full ${adminMaintenance ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse' : 'bg-stone-300 dark:bg-stone-700'}`} />
                                      <span className="text-sm font-black text-slate-900 dark:text-stone-100">전체 점검 모드</span>
                                    </div>
                                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold ml-4.5">활성화 시 모든 일반 사용자의 접근이 차단됩니다.</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const nextVal = !adminMaintenance;
                                      setAdminMaintenance(nextVal);
                                      if (!nextVal) {
                                        setAdminMaintenanceStart('');
                                        setAdminMaintenanceEnd('');
                                      }
                                    }}
                                    className={`w-12 h-6 rounded-full relative transition-all shadow-sm ${adminMaintenance ? 'bg-rose-500' : 'bg-stone-200 dark:bg-stone-800'}`}
                                  >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${adminMaintenance ? 'right-1' : 'left-1'}`} />
                                  </button>
                                </div>

                                {adminMaintenance && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-black text-rose-500 uppercase tracking-wider ml-1">시작 시간</label>
                                      <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-rose-400" />
                                        <input 
                                          type="text"
                                          value={adminMaintenanceStart}
                                          onChange={(e) => setAdminMaintenanceStart(e.target.value)}
                                          placeholder="06-12 10:00"
                                          className="w-full bg-white dark:bg-stone-900 border border-rose-100 dark:border-rose-900/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-black text-rose-500 uppercase tracking-wider ml-1">종료 시간</label>
                                      <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-rose-400" />
                                        <input 
                                          type="text"
                                          value={adminMaintenanceEnd}
                                          onChange={(e) => setAdminMaintenanceEnd(e.target.value)}
                                          placeholder="06-12 12:00"
                                          className="w-full bg-white dark:bg-stone-900 border border-rose-100 dark:border-rose-900/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {(testMaintenance || testMaintenanceCompleted) && (
                                  <div className="grid grid-cols-2 gap-2 pt-2">
                                    {testMaintenance && (
                                      <button
                                        type="button"
                                        onClick={testMaintenance}
                                        className="flex items-center justify-center gap-2 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black tracking-tight cursor-pointer transition-all active:scale-95 border border-rose-500/20"
                                      >
                                        점검 화면 미리보기
                                      </button>
                                    )}
                                    {testMaintenanceCompleted && (
                                      <button
                                        type="button"
                                        onClick={testMaintenanceCompleted}
                                        className="flex items-center justify-center gap-2 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black tracking-tight cursor-pointer transition-all active:scale-95 border border-rose-500/20"
                                      >
                                        점검 완료 팝업
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="bg-amber-50/50 dark:bg-amber-950/10 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/30 space-y-5">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2.5 h-2.5 rounded-full ${adminManualQuota ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse' : 'bg-stone-300 dark:bg-stone-700'}`} />
                                      <span className="text-sm font-black text-slate-900 dark:text-stone-100">수동 할당량 초과 안내</span>
                                    </div>
                                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold ml-4.5">활성화 시 16시 이후 접속 안내 팝업이 노출되며, 16시 10분에 자동 해제됩니다.</p>
                                  </div>
                                  <button
                                    onClick={() => setAdminManualQuota(!adminManualQuota)}
                                    className={`w-12 h-6 rounded-full relative transition-all shadow-sm ${adminManualQuota ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-800'}`}
                                  >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${adminManualQuota ? 'right-1' : 'left-1'}`} />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
                                  <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> 관리자 UID (쉼표 구분)
                                  </label>
                                  <textarea 
                                    value={adminAllowedUids}
                                    onChange={(e) => setAdminAllowedUids(e.target.value)}
                                    placeholder="Authorized UIDs..."
                                    rows={2}
                                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-[11px] text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                  />
                                </div>

                                <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
                                  <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Key className="h-3.5 w-3.5 text-amber-500" /> 점검 우회 코드
                                  </label>
                                  <input 
                                    type="text"
                                    value={adminBypassCode}
                                    onChange={(e) => setAdminBypassCode(e.target.value)}
                                    placeholder="Maintenance bypass code"
                                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          
                      {activeAdminSubTab === 'daily_locations' && (
                        <div className="space-y-6">
                          <div className="bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-5 border border-stone-200 dark:border-stone-800">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-stone-100">일일 장소 설정</h4>
                                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                                  형광석과 참나무의 출현 장소를 날짜별로 지정할 수 있습니다. 설정된 날짜의 06:00부터 익일 05:59까지 적용됩니다.
                                </p>
                              </div>
                            </div>
                            
                            {/* 날짜 선택 및 탐색 도구 */}
                            <div className="bg-stone-50/50 dark:bg-stone-900/30 p-4 rounded-3xl border border-stone-200/60 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                              <div className="space-y-1.5">
                                <span className="text-[9px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-wider block">기준일 및 주단위 검색 필터</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="date"
                                    value={format(dailyLocationBaseDate, 'yyyy-MM-dd')}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        try {
                                          const parsed = parse(e.target.value, 'yyyy-MM-dd', new Date());
                                          setDailyLocationBaseDate(parsed);
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-white dark:bg-stone-850 text-slate-800 dark:text-stone-100 rounded-xl text-xs font-black border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setDailyLocationBaseDate(currentTime || new Date())}
                                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                                  >
                                    오늘로 이동
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex gap-1.5 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => setDailyLocationBaseDate(prev => addDays(prev, -7))}
                                  className="px-3 py-1.5 bg-white hover:bg-stone-50 dark:bg-stone-850 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300 text-[10px] font-black rounded-xl border border-stone-200 dark:border-stone-700 transition-colors shadow-sm cursor-pointer"
                                >
                                  ◀ 이전 주
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDailyLocationBaseDate(prev => addDays(prev, 7))}
                                  className="px-3 py-1.5 bg-white hover:bg-stone-50 dark:bg-stone-850 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300 text-[10px] font-black rounded-xl border border-stone-200 dark:border-stone-700 transition-colors shadow-sm cursor-pointer"
                                >
                                  다음 주 ▶
                                </button>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                                const targetDate = new Date(dailyLocationBaseDate);
                                targetDate.setDate(targetDate.getDate() + dayOffset);
                                const dateKey = format(targetDate, 'yyyy-MM-dd');
                                const displayDateStr = format(targetDate, 'MM.dd(EEE)');
                                const loc = localAdminDailyLocations[dateKey] || {};
                                const isToday = dateKey === format(currentTime || new Date(), 'yyyy-MM-dd');
                                
                                return (
                                  <div key={dateKey} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-xl shadow-sm ${isToday ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' : 'bg-white dark:bg-stone-950 border-stone-100 dark:border-stone-800'}`}>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-slate-800 dark:text-stone-200">
                                        {displayDateStr}
                                      </span>
                                      {isToday && <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold">오늘</span>}
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                      <div className="flex-1 sm:flex-none">
                                        <label className="block text-[10px] font-bold text-stone-500 mb-1">형광석</label>
                                        <select
                                          value={loc.fluorescentRock || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setLocalAdminDailyLocations(prev => ({
                                              ...prev,
                                              [dateKey]: {
                                                ...prev[dateKey],
                                                fluorescentRock: val || undefined
                                              }
                                            }));
                                          }}
                                          className="w-full sm:w-32 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors"
                                        >
                                          <option value="">미지정</option>
                                          <option value="온천산">온천산</option>
                                          {Array.from({length: 12}).map((_, i) => (
                                            <option key={i+1} value={`${i+1}번홈`}>{i+1}번홈</option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      <div className="flex-1 sm:flex-none">
                                        <label className="block text-[10px] font-bold text-stone-500 mb-1">참나무</label>
                                        <select
                                          value={loc.oakTree || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setLocalAdminDailyLocations(prev => ({
                                              ...prev,
                                              [dateKey]: {
                                                ...prev[dateKey],
                                                oakTree: val || undefined
                                              }
                                            }));
                                          }}
                                          className="w-full sm:w-32 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors"
                                        >
                                          <option value="">미지정</option>
                                          {Array.from({length: 12}).map((_, i) => (
                                            <option key={i+1} value={`${i+1}번홈`}>{i+1}번홈</option>
                                          ))}
                                          <option value="참나무숲">참나무숲</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

{activeAdminSubTab === 'weather' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div className="space-y-1">
                                  <h3 className="text-sm font-black text-slate-900 dark:text-stone-100 uppercase tracking-tight">기상 및 예보 예약 시스템</h3>
                                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold">원하는 미래 날짜를 지정하여 상시 날씨 및 시간대별 상세 날씨를 미리 예약해둘 수 있습니다.</p>
                                </div>
                                <button
                                  onClick={() => {
                                    if (confirm("모든 운영자 날씨 설정을 완전히 초기화하시겠습니까? (유저가 직접 지정한 날씨는 유지됩니다)")) {
                                      setLocalAdminWeekly({});
                                      setLocalAdminDetailed({});
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-xl text-[10px] font-black tracking-tight transition-colors border border-stone-200 dark:border-stone-700 cursor-pointer shrink-0"
                                >
                                  설정 전체 초기화
                                </button>
                              </div>

                              {/* 날짜 선택 및 탐색 도구 */}
                              <div className="bg-stone-50/50 dark:bg-stone-900/30 p-4 rounded-3xl border border-stone-200/60 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1.5">
                                  <span className="text-[9px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-wider block">기준일 및 주단위 검색 필터</span>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="date"
                                      value={format(weatherBaseDate, 'yyyy-MM-dd')}
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          try {
                                            const parsed = parse(e.target.value, 'yyyy-MM-dd', new Date());
                                            setWeatherBaseDate(parsed);
                                          } catch (err) {
                                            console.error(err);
                                          }
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-white dark:bg-stone-850 text-slate-800 dark:text-stone-100 rounded-xl text-xs font-black border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                                    />
                                    <button
                                      onClick={() => setWeatherBaseDate(currentTime || new Date())}
                                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                                    >
                                      오늘로 이동
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="flex gap-1.5 self-end sm:self-center">
                                  <button
                                    onClick={() => setWeatherBaseDate(prev => addDays(prev, -7))}
                                    className="px-3 py-1.5 bg-white hover:bg-stone-50 dark:bg-stone-850 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300 text-[10px] font-black rounded-xl border border-stone-200 dark:border-stone-700 transition-colors shadow-sm cursor-pointer"
                                  >
                                    ◀ 이전 주
                                  </button>
                                  <button
                                    onClick={() => setWeatherBaseDate(prev => addDays(prev, 7))}
                                    className="px-3 py-1.5 bg-white hover:bg-stone-50 dark:bg-stone-850 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300 text-[10px] font-black rounded-xl border border-stone-200 dark:border-stone-700 transition-colors shadow-sm cursor-pointer"
                                  >
                                    다음 주 ▶
                                  </button>
                                </div>
                              </div>

                              {/* 요일 선택 탭 + 선택된 날짜 상세 설정 카드 */}
                              {(() => {
                                const days = [];
                                const todayStr = format(currentTime || new Date(), 'yyyy-MM-dd');
                                for (let i = 0; i < 7; i++) {
                                  days.push(addDays(weatherBaseDate, i));
                                }
                                const currentDayKeys = days.map(d => format(d, 'yyyy-MM-dd'));
                                const activeDateKey = currentDayKeys.includes(selectedWeatherDayKey) 
                                  ? selectedWeatherDayKey 
                                  : (currentDayKeys.includes(todayStr) ? todayStr : currentDayKeys[0]);

                                const activeDateObj = days.find(d => format(d, 'yyyy-MM-dd') === activeDateKey) || days[0];
                                const activeDayOfWeek = getKoreanDayName(activeDateObj);
                                const isToday = activeDateKey === todayStr;
                                const weeklySelected = localAdminWeekly[activeDateKey] || 'Unknown';

                                return (
                                  <div className="space-y-3">
                                    {/* 상단 요일 탭 바 */}
                                    <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory">
                                      {days.map((dateObj) => {
                                        const dateKey = format(dateObj, 'yyyy-MM-dd');
                                        const dayOfWeek = getKoreanDayName(dateObj);
                                        const isSelected = dateKey === activeDateKey;
                                        const isTabToday = dateKey === todayStr;
                                        const hasWeather = localAdminWeekly[dateKey] && localAdminWeekly[dateKey] !== 'Unknown';

                                        let dayColor = "text-stone-700 dark:text-stone-300";
                                        if (dayOfWeek === '토') dayColor = "text-sky-600 dark:text-sky-400";
                                        if (dayOfWeek === '일') dayColor = "text-rose-600 dark:text-rose-400";

                                        return (
                                          <button
                                            key={dateKey}
                                            onClick={() => setSelectedWeatherDayKey(dateKey)}
                                            className={`snap-start shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-2xl border transition-all cursor-pointer min-w-[64px] ${
                                              isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
                                                : isTabToday
                                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                                                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                                            }`}
                                          >
                                            <div className="flex items-center gap-1">
                                              <span className={`text-[11px] font-black ${isSelected ? 'text-white' : dayColor}`}>
                                                {dayOfWeek}
                                              </span>
                                              {isTabToday && !isSelected && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                              )}
                                            </div>
                                            <span className={`text-[9px] font-mono ${isSelected ? 'text-blue-100' : 'text-stone-400'}`}>
                                              {format(dateObj, 'M/d')}
                                            </span>
                                            {hasWeather && (
                                              <div className="mt-0.5">
                                                <WeatherIcon weather={localAdminWeekly[dateKey]} className={`h-3 w-3 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* 선택된 날짜 상세 설정 카드 */}
                                    <div className={`p-4 rounded-3xl border transition-all ${
                                      isToday 
                                        ? 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-200/60 dark:border-emerald-800/20 ring-1 ring-emerald-500/10' 
                                        : 'bg-white dark:bg-stone-900/50 border-stone-150 dark:border-stone-800/80'
                                    }`}>
                                      {/* 카드 헤더 */}
                                      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2 mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-black text-slate-800 dark:text-stone-200">
                                            {format(activeDateObj, 'yyyy년 M월 d일')} ({activeDayOfWeek}요일)
                                          </span>
                                          {isToday && (
                                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-md tracking-wider">
                                              TODAY
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] font-mono text-stone-400 font-bold">
                                          {activeDateKey}
                                        </span>
                                      </div>

                                      <div className="space-y-4">
                                        {/* 1. 일일 상시 날씨 */}
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-800 dark:text-stone-300 uppercase tracking-tight">일일 상시 기본 날씨</span>
                                            {weeklySelected !== 'Unknown' && (
                                              <button
                                                onClick={() => {
                                                  setLocalAdminWeekly(prev => {
                                                    const next = { ...prev };
                                                    delete next[activeDateKey];
                                                    return next;
                                                  });
                                                }}
                                                className="text-[9px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                                              >
                                                설정 해제
                                              </button>
                                            )}
                                          </div>
                                          <div className="grid grid-cols-4 gap-1.5">
                                            {(['Clear', 'RainSnow', 'Rainbow', 'Meteor'] as GameWeather[]).map(w => {
                                              const isSelected = weeklySelected === w || (w === 'Clear' && weeklySelected === 'Heatwave');
                                              const displayWeatherType = (w === 'Clear' && weeklySelected === 'Heatwave') ? 'Heatwave' : w;
                                              return (
                                                <button
                                                  key={w}
                                                  onClick={() => {
                                                    setLocalAdminWeekly(prev => {
                                                      const currentVal = prev[activeDateKey] || 'Unknown';
                                                      let nextWeather: GameWeather = 'Unknown';
                                                      if (w === 'Clear') {
                                                        if (currentVal === 'Clear') {
                                                          nextWeather = 'Heatwave';
                                                        } else if (currentVal === 'Heatwave') {
                                                          nextWeather = 'Unknown';
                                                        } else {
                                                          nextWeather = 'Clear';
                                                        }
                                                      } else {
                                                        nextWeather = currentVal === w ? 'Unknown' : w;
                                                      }
                                                      return {
                                                        ...prev,
                                                        [activeDateKey]: nextWeather
                                                      };
                                                    });
                                                  }}
                                                  className={`py-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                                    isSelected 
                                                      ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20 scale-102' 
                                                      : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                                                  }`}
                                                  title={translateWeather(displayWeatherType)}
                                                >
                                                  <WeatherIcon weather={displayWeatherType} className="h-4 w-4" />
                                                  <span className="text-[9px] font-black">{translateWeather(displayWeatherType)}</span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* 2. 시간대별 상세 예보 */}
                                        <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800/60">
                                          <span className="text-[10px] font-black text-slate-800 dark:text-stone-300 uppercase tracking-tight">시간대별 상세 예보 (우선 적용)</span>
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[0, 6, 12, 18].map((hour) => {
                                              const hourKey = `${activeDateKey}-${hour}`;
                                              const hourlySelected = localAdminDetailed[hourKey] || 'Unknown';
                                              return (
                                                <div key={hour} className="bg-stone-50/50 dark:bg-stone-900/30 p-2 rounded-2xl border border-stone-150/40 dark:border-stone-800/40 space-y-1.5">
                                                  <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-mono font-black text-stone-500 dark:text-stone-400">
                                                      {hour.toString().padStart(2, '0')}:00 ~ {(hour + 6).toString().padStart(2, '0')}:00
                                                    </span>
                                                    {hourlySelected !== 'Unknown' && (
                                                      <button
                                                        onClick={() => {
                                                          setLocalAdminDetailed(prev => {
                                                            const next = { ...prev };
                                                            delete next[hourKey];
                                                            return next;
                                                          });
                                                        }}
                                                        className="text-[8px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                                                      >
                                                        X
                                                      </button>
                                                    )}
                                                  </div>
                                                  <div className="flex gap-0.5 justify-center">
                                                    {(['Clear', 'RainSnow', 'Rainbow', 'Meteor'] as GameWeather[]).map(w => {
                                                      const isSelected = hourlySelected === w || (w === 'Clear' && hourlySelected === 'Heatwave');
                                                      const displayWeatherType = (w === 'Clear' && hourlySelected === 'Heatwave') ? 'Heatwave' : w;
                                                      return (
                                                        <button
                                                          key={w}
                                                          onClick={() => {
                                                            setLocalAdminDetailed(prev => {
                                                              const currentVal = prev[hourKey] || 'Unknown';
                                                              let nextWeather: GameWeather = 'Unknown';
                                                              if (w === 'Clear') {
                                                                if (currentVal === 'Clear') {
                                                                  nextWeather = 'Heatwave';
                                                                } else if (currentVal === 'Heatwave') {
                                                                  nextWeather = 'Unknown';
                                                                } else {
                                                                  nextWeather = 'Clear';
                                                                }
                                                              } else {
                                                                nextWeather = currentVal === w ? 'Unknown' : w;
                                                              }
                                                              return {
                                                                ...prev,
                                                                [hourKey]: nextWeather
                                                              };
                                                            });
                                                          }}
                                                          className={`p-1.5 rounded-lg border transition-all cursor-pointer flex-1 flex justify-center ${
                                                            isSelected 
                                                              ? 'bg-blue-500 border-blue-500 text-white shadow-sm scale-105' 
                                                              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800'
                                                          }`}
                                                          title={translateWeather(displayWeatherType)}
                                                        >
                                                          <WeatherIcon weather={displayWeatherType} className="h-3.5 w-3.5" />
                                                        </button>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Admin Action Footer / Save Button */}
                      <div className="p-3 sm:p-4 bg-stone-50/90 dark:bg-stone-900/90 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between shrink-0 gap-3">
                        <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 truncate">
                          {saveSuccess ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1.5">
                              ✓ 관리자 설정이 성공적으로 저장되었습니다.
                            </span>
                          ) : hasChanges ? (
                            <span className="text-blue-600 dark:text-blue-400 text-[10.5px] font-bold">변경한 설정을 저장하려면 설정완료 버튼을 클릭하세요.</span>
                          ) : (
                            <span className="text-stone-400 dark:text-stone-500 text-[10.5px]">변경사항이 없습니다.</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveAdminConfig}
                          disabled={isSaving || !hasChanges}
                          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none shrink-0 ml-auto"
                        >
                          {isSaving ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              저장 중...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              설정완료
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )
                }
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
};

