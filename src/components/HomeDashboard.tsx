import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import { 
  Pin, 
  Pencil, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  Calendar, 
  User, 
  Bird, 
  Bug, 
  Fish, 
  Soup,
  Sprout,
  Flower,
  Heart,
  Dog,
  Cat,
  ExternalLink,
  ArrowLeft,
  Ticket,
  ChevronRight,
  ChevronLeft,
  Waves,
  Star,
  ChevronDown
} from 'lucide-react';
import { doc, setDoc, deleteDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn, safeJsonParse } from '../lib/utils';
import { Notice, Pet } from '../types';
import { BIRDS } from '../data/birds';
import { INSECTS } from '../data/insects';
import { FISHING } from '../data/fishing';
import { COOKING } from '../data/cooking';
import { GARDENING_ITEMS } from '../data/gardening';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface HomeDashboardProps {
  user: any;
  completedBirdIds: Set<string>;
  completedInsectIds: Set<string>;
  completedFishIds: Set<string>;
  completedFoodIds: Set<string>;
  completedFlowerIds: Set<string>;
  completedCropIds: Set<string>;
  completedOceanCleaningIds?: Set<string>;
  masterBirdIds?: Set<string>;
  masterInsectIds?: Set<string>;
  masterFishIds?: Set<string>;
  masterFoodIds?: Set<string>;
  masterGardeningIds?: Set<string>;
  masterOceanCleaningIds?: Set<string>;
  ratings?: Record<string, number>;
  birdTotal: number;
  insectTotal: number;
  fishTotal: number;
  cookingTotal: number;
  gardeningTotal: number;
  cropTotal: number;
  oceanCleaningTotal?: number;
  setActiveCategory?: (category: any, subCategory?: string) => void;
  pets?: any[];
  onSyncError?: (type: 'permission' | 'quota') => void;
  allowedUids?: string[];
  isActive?: boolean;
  activeCouponsCount?: number;
  // Data props
  birds: any[];
  insects: any[];
  fish: any[];
  cooking: any[];
  gardeningItems: any[];
  oceanCleaning?: any[];
}

const RingChart = ({ 
  total, 
  completed, 
  master, 
  fiveStar, 
  compColorClass,
  masterColorClass,
  fiveStarColorClass,
  masterTotal
}: { 
  total: number; 
  completed: number; 
  master: number; 
  fiveStar: number; 
  compColorClass: string; 
  masterColorClass: string; 
  fiveStarColorClass: string; 
  masterTotal?: number;
}) => {
  const compPct = total > 0 ? (completed / total) * 100 : 0;
  const effectiveMasterTotal = masterTotal ?? total;
  const masterPct = effectiveMasterTotal > 0 ? (master / effectiveMasterTotal) * 100 : 0;
  const fiveStarPct = total > 0 ? (fiveStar / total) * 100 : 0;

  const rOuter = 24;
  const rMiddle = 17;
  const rInner = 10;
  const strokeWidth = 3.2;

  const cOuter = 2 * Math.PI * rOuter;
  const cMiddle = 2 * Math.PI * rMiddle;
  const cInner = 2 * Math.PI * rInner;

  const offsetOuter = cOuter - (Math.min(compPct, 100) / 100) * cOuter;
  const offsetMiddle = cMiddle - (Math.min(masterPct, 100) / 100) * cMiddle;
  const offsetInner = cInner - (Math.min(fiveStarPct, 100) / 100) * cInner;

  return (
    <div className="relative flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 lg:w-24 lg:h-24 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        {/* Background Tracks */}
        <circle cx="32" cy="32" r={rOuter} fill="none" stroke="currentColor" className="text-stone-200/40 dark:text-stone-850" strokeWidth={strokeWidth} />
        <circle cx="32" cy="32" r={rMiddle} fill="none" stroke="currentColor" className="text-stone-200/40 dark:text-stone-850" strokeWidth={strokeWidth} />
        <circle cx="32" cy="32" r={rInner} fill="none" stroke="currentColor" className="text-stone-200/40 dark:text-stone-850" strokeWidth={strokeWidth} />

        {/* Foreground Progress Rings */}
        {compPct > 0 && (
          <circle 
            cx="32" 
            cy="32" 
            r={rOuter} 
            fill="none" 
            stroke="currentColor" 
            className={compColorClass} 
            strokeWidth={strokeWidth} 
            strokeDasharray={cOuter} 
            strokeDashoffset={offsetOuter} 
            strokeLinecap="round"
          />
        )}
        {masterPct > 0 && (
          <circle 
            cx="32" 
            cy="32" 
            r={rMiddle} 
            fill="none" 
            stroke="currentColor" 
            className={masterColorClass} 
            strokeWidth={strokeWidth} 
            strokeDasharray={cMiddle} 
            strokeDashoffset={offsetMiddle} 
            strokeLinecap="round"
          />
        )}
        {fiveStarPct > 0 && (
          <circle 
            cx="32" 
            cy="32" 
            r={rInner} 
            fill="none" 
            stroke="currentColor" 
            className={fiveStarColorClass} 
            strokeWidth={strokeWidth} 
            strokeDasharray={cInner} 
            strokeDashoffset={offsetInner} 
            strokeLinecap="round"
          />
        )}
      </svg>
      {/* Percentage Center Text */}
      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
        <span className={`text-[10px] sm:text-xs md:text-sm lg:text-base font-mono font-black leading-none ${compColorClass}`}>
          {Math.round(compPct)}%
        </span>
      </div>
    </div>
  );
};

interface InfinitePageCarouselProps {
  currentPage: number;
  maxPages?: number;
  onPageChange: (newPage: number) => void;
  renderPage: (page: number) => React.ReactNode;
  triggerRef?: React.MutableRefObject<{ goNext: () => void; goPrev: () => void } | null>;
}

function InfinitePageCarousel({
  currentPage,
  maxPages = 2,
  onPageChange,
  renderPage,
  triggerRef,
}: InfinitePageCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const isAnimatingRef = useRef(false);

  const prevPage = maxPages > 1 ? (currentPage === 1 ? maxPages : currentPage - 1) : 1;
  const nextPage = maxPages > 1 ? (currentPage === maxPages ? 1 : currentPage + 1) : 1;

  const animateToNext = () => {
    if (isAnimatingRef.current || maxPages <= 1) return;
    const width = containerRef.current?.offsetWidth || 300;
    isAnimatingRef.current = true;
    animate(x, -width, {
      type: "spring",
      stiffness: 350,
      damping: 32,
      onComplete: () => {
        x.set(0);
        const target = currentPage === maxPages ? 1 : currentPage + 1;
        onPageChange(target);
        isAnimatingRef.current = false;
      },
    });
  };

  const animateToPrev = () => {
    if (isAnimatingRef.current || maxPages <= 1) return;
    const width = containerRef.current?.offsetWidth || 300;
    isAnimatingRef.current = true;
    animate(x, width, {
      type: "spring",
      stiffness: 350,
      damping: 32,
      onComplete: () => {
        x.set(0);
        const target = currentPage === 1 ? maxPages : currentPage - 1;
        onPageChange(target);
        isAnimatingRef.current = false;
      },
    });
  };

  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = {
        goNext: animateToNext,
        goPrev: animateToPrev,
      };
    }
  });

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (isAnimatingRef.current || maxPages <= 1) return;
    const width = containerRef.current?.offsetWidth || 300;
    const threshold = Math.min(width * 0.15, 40);

    if (info.offset.x < -threshold || info.velocity.x < -200) {
      animateToNext();
    } else if (info.offset.x > threshold || info.velocity.x > 200) {
      animateToPrev();
    } else {
      animate(x, 0, {
        type: "spring",
        stiffness: 400,
        damping: 30,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="overflow-hidden w-full relative touch-pan-y select-none"
    >
      <motion.div
        style={{ x }}
        drag={maxPages > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={maxPages > 1 ? 0.8 : 0}
        onDragEnd={handleDragEnd}
        className={cn(
          "w-full relative",
          maxPages > 1 && "cursor-grab active:cursor-grabbing"
        )}
      >
        {/* Prev Page */}
        {maxPages > 1 && (
          <div className="absolute top-0 left-[-100%] w-full h-full pointer-events-none">
            {renderPage(prevPage)}
          </div>
        )}

        {/* Current Page */}
        <div className="w-full relative">
          {renderPage(currentPage)}
        </div>

        {/* Next Page */}
        {maxPages > 1 && (
          <div className="absolute top-0 left-[100%] w-full h-full pointer-events-none">
            {renderPage(nextPage)}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function HomeDashboard({
  user,
  completedBirdIds,
  completedInsectIds,
  completedFishIds,
  completedFoodIds,
  completedFlowerIds,
  completedCropIds,
  completedOceanCleaningIds = new Set(),
  masterBirdIds = new Set(),
  masterInsectIds = new Set(),
  masterFishIds = new Set(),
  masterFoodIds = new Set(),
  masterGardeningIds = new Set(),
  masterOceanCleaningIds = new Set(),
  ratings = {},
  birdTotal,
  insectTotal,
  fishTotal,
  cookingTotal,
  gardeningTotal,
  cropTotal,
  oceanCleaningTotal,
  setActiveCategory,
  pets,
  onSyncError,
  allowedUids = [],
  isActive = true,
  activeCouponsCount = 0,
  birds,
  insects,
  fish,
  cooking,
  gardeningItems,
  oceanCleaning = []
}: HomeDashboardProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>(() => {
    return (localStorage.getItem('pigtown_dashboard_view_mode') as 'simple' | 'detailed') || 'simple';
  });
  const [collectionPage, setCollectionPage] = useState<number>(1);
  const [maxPages, setMaxPages] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return 1;
    }
    return 2;
  });
  const carouselTriggerRef = useRef<{ goNext: () => void; goPrev: () => void } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMaxPages(1);
        setCollectionPage(1);
      } else {
        setMaxPages(2);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleViewModeChange = (mode: 'simple' | 'detailed') => {
    setViewMode(mode);
    localStorage.setItem('pigtown_dashboard_view_mode', mode);
  };
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  // 실시간 작물알리미용 상태
  const [slots, setSlots] = useState<any[]>([]);
  const lastRawSlotsRef = useRef<string>('');
  // 펫 먹이찾기용 상태
  const [localPets, setLocalPets] = useState<any[]>([]);
  // 공지사항 팝업 모달 상태
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [activeNoticeDetail, setActiveNoticeDetail] = useState<Notice | null>(null);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);



  const maxDisplayLevel = 14;

  const stats = useMemo(() => {
    const visibleBirds = birds.filter(b => b.level <= maxDisplayLevel);
    const visibleInsects = insects.filter(i => i.level <= maxDisplayLevel);
    const visibleFish = fish.filter(f => f.level <= maxDisplayLevel);
    const visibleCooking = cooking.filter(c => c.level <= maxDisplayLevel);
    const visibleFlowers = gardeningItems.filter(g => g.category === 'flower');
    const visibleCrops = gardeningItems.filter(g => g.category === 'crop');
    const visibleOceanCleaning = (oceanCleaning || []).filter(o => o.level <= maxDisplayLevel);
    const oceanTotal = oceanCleaningTotal ?? visibleOceanCleaning.length;

    const getEffectiveRating = (name: string, maxStars?: number) => {
      const targetMax = maxStars ?? 5;
      const r = ratings[name] || 0;
      return Math.min(r, targetMax);
    };

    return {
      birds: {
        master: visibleBirds.filter(b => !b.excludeFromMaster && masterBirdIds.has(b.id)).length,
        masterTotal: visibleBirds.filter(b => !b.excludeFromMaster).length,
        fiveStar: visibleBirds.filter(b => completedBirdIds.has(b.id) && getEffectiveRating(b.name, b.maxStars) === (b.maxStars ?? 5) && (ratings[b.name] || 0) > 0).length
      },
      insects: {
        master: visibleInsects.filter(i => !i.excludeFromMaster && masterInsectIds.has(i.id)).length,
        masterTotal: visibleInsects.filter(i => !i.excludeFromMaster).length,
        fiveStar: visibleInsects.filter(i => completedInsectIds.has(i.id) && getEffectiveRating(i.name, i.maxStars) === (i.maxStars ?? 5) && (ratings[i.name] || 0) > 0).length
      },
      fishing: {
        master: visibleFish.filter(f => !f.excludeFromMaster && masterFishIds.has(f.id)).length,
        masterTotal: visibleFish.filter(f => !f.excludeFromMaster).length,
        fiveStar: visibleFish.filter(f => completedFishIds.has(f.id) && getEffectiveRating(f.name, f.maxStars) === (f.maxStars ?? 5) && (ratings[f.name] || 0) > 0).length
      },
      cooking: {
        master: visibleCooking.filter(c => !c.excludeFromMaster && masterFoodIds.has(c.id)).length,
        masterTotal: visibleCooking.filter(c => !c.excludeFromMaster).length,
        fiveStar: visibleCooking.filter(c => completedFoodIds.has(c.id) && getEffectiveRating(c.name, c.maxStars) === (c.maxStars ?? 5) && (ratings[c.name] || 0) > 0).length
      },
      gardening: {
        master: visibleFlowers.filter(g => !g.excludeFromMaster && masterGardeningIds.has(g.id)).length,
        masterTotal: visibleFlowers.filter(g => !g.excludeFromMaster).length,
        fiveStar: visibleFlowers.filter(g => completedFlowerIds.has(g.id) && getEffectiveRating(g.name, g.maxStars) === (g.maxStars ?? 5) && (ratings[g.name] || 0) > 0).length
      },
      crops: {
        master: visibleCrops.filter(g => !g.excludeFromMaster && masterGardeningIds.has(g.id)).length,
        masterTotal: visibleCrops.filter(g => !g.excludeFromMaster).length,
        fiveStar: visibleCrops.filter(g => completedCropIds.has(g.id) && getEffectiveRating(g.name, g.maxStars) === (g.maxStars ?? 5) && (ratings[g.name] || 0) > 0).length
      },
      oceanCleaning: {
        total: oceanTotal,
        master: visibleOceanCleaning.filter(o => !o.excludeFromMaster && masterOceanCleaningIds.has(o.id)).length,
        masterTotal: visibleOceanCleaning.filter(o => !o.excludeFromMaster).length,
        fiveStar: visibleOceanCleaning.filter(o => completedOceanCleaningIds.has(o.id) && getEffectiveRating(o.name, o.maxStars) === (o.maxStars ?? 5) && (ratings[o.name] || 0) > 0).length
      }
    };
  }, [
    masterBirdIds, masterInsectIds, masterFishIds, masterFoodIds, masterGardeningIds, masterOceanCleaningIds,
    completedBirdIds, completedInsectIds, completedFishIds, completedFoodIds, completedFlowerIds, completedCropIds, completedOceanCleaningIds,
    ratings, oceanCleaning, oceanCleaningTotal
  ]);

  useEffect(() => {
    setCurrentNoticeIndex(0);
  }, [notices]);

  // 팝업이 열려 있을 때 배경(본문) 스크롤 방지
  useEffect(() => {
    if (isNoticeModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isNoticeModalOpen]);

  useEffect(() => {
    if (pets) {
      setLocalPets(pets);
    } else {
      const saved = localStorage.getItem('pigtown_pets');
      setLocalPets(safeJsonParse(saved, []));
    }
  }, [pets]);

  useEffect(() => {
    if (!isActive) return;

    const loadSlots = () => {
      const saved = localStorage.getItem('farming_slots');
      if (saved === lastRawSlotsRef.current) return;
      lastRawSlotsRef.current = saved || '';

      const parsed = safeJsonParse(saved, null);
      if (parsed) {
        if (Array.isArray(parsed)) {
          setSlots(parsed);
        } else if (typeof parsed === 'object') {
          const arr = Array.from({ length: 8 }, (_, i) => {
            const id = `slot_${i + 1}`;
            const val = (parsed as any)[id];
            return val ? { id, ...val } : { id, cropId: null, cropName: null, cropEmoji: null, startTime: null, duration: null, targetTime: null, isNotified: false };
          });
          setSlots(arr);
        }
      }
    };

    loadSlots();
    const interval = setInterval(() => {
      loadSlots();
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const getRemainingTimeText = (targetTimeMs: number | null) => {
    if (!targetTimeMs) return '';
    const now = Date.now();
    const diff = targetTimeMs - now;
    if (diff <= 0) return '수확 가능! 🌟';

    const secs = Math.floor(diff / 1000);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    if (h > 0) {
      return `${h}시간 ${m}분 ${s}초`;
    }
    if (m > 0) {
      return `${m}분 ${s}초`;
    }
    return `${s}초`;
  };

  const getRemainingTimeSimple = (targetTimeMs: number | null) => {
    if (!targetTimeMs) return '-';
    const now = Date.now();
    const diff = targetTimeMs - now;
    if (diff <= 0) return '수확 가능! 🌟';
    
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    if (h > 0) return `${h}시간 ${m}분 후`;
    return `${m}분 후`;
  };

  const getProgressPercent = (startTime: number | null, durationSecs: number | null, targetTime: number | null) => {
    if (!startTime || !durationSecs || !targetTime) return 0;
    const now = Date.now();
    const total = durationSecs * 1000;
    const elapsed = now - startTime;
    if (elapsed >= total) return 100;
    if (elapsed <= 0) return 0;
    return Math.min(100, Math.floor((elapsed / total) * 1000) / 10);
  };

  const getFoodFriendlyName = (id: string) => {
    const custom: Record<string, string> = {
      'raw-apple': '🍎 사과',
      'raw-neutari': '🍄 느타리 버섯',
      'raw-yangsongi': '🍄 양송이 버섯',
      'raw-pyogo': '🍄 표고 버섯',
      'custom-dog-food': '🍖 강아지 전용 사료',
      'custom-cat-food': '🐟 고양이 전용 사료',
      'custom-common-food': '🥛 동물 공용 음식'
    };
    return custom[id] || id;
  };

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Admin Check
  const adminUids = (import.meta.env.VITE_ADMIN_UIDS || '').split(',');
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',');

  const isAdmin = !!(user && (
    adminUids.includes(user.uid) ||
    (user.email && adminEmails.includes(user.email)) ||
    user.email === 'hungry.pig001@gmail.com' ||
    allowedUids.includes(user.uid)
  ));

  const loadNotices = async () => {
    try {
      const cacheTime = localStorage.getItem('pt_cached_notices_time');
      const cachedData = localStorage.getItem('pt_cached_notices');
      const isCacheValid = cacheTime && cachedData && (Date.now() - parseInt(cacheTime, 10) < 3600000); // 1시간 캐시

      if (isCacheValid) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed && Array.isArray(parsed)) {
            console.log("[Cache] HomeDashboard - Loaded notices from 1-hour local cache");
            const reconstructed = parsed.map((notice: any) => ({
              ...notice,
              createdAt: notice.createdAt ? { toDate: () => new Date(notice.createdAt) } : null,
              updatedAt: notice.updatedAt ? { toDate: () => new Date(notice.updatedAt) } : null,
            }));
            setNotices(reconstructed);
            setPermissionError(false);
            setLoading(false);
            return;
          }
        } catch (err) {}
      }

      const noticesRef = collection(db, 'notices');
      console.log(`[GET_DOCS] notices - path: ${noticesRef.path}`);
      const snapshot = await getDocs(noticesRef);
      const items: Notice[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || '',
          content: data.content || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          isPinned: !!data.isPinned,
          author: data.author || '관리자'
        });
      });

      // Sort: pinned first, then by date descending
      items.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (Number(a.createdAt) || 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (Number(b.createdAt) || 0);
        return timeB - timeA;
      });

      // Cache notices to localStorage
      try {
        const cacheItems = items.map(item => ({
          ...item,
          createdAt: item.createdAt ? (typeof item.createdAt.toDate === 'function' ? item.createdAt.toDate().toISOString() : item.createdAt) : null,
          updatedAt: item.updatedAt ? (typeof item.updatedAt.toDate === 'function' ? item.updatedAt.toDate().toISOString() : item.updatedAt) : null,
        }));
        localStorage.setItem('pt_cached_notices', JSON.stringify(cacheItems));
        localStorage.setItem('pt_cached_notices_time', Date.now().toString());
      } catch (err) {
        console.warn("Notices caching error:", err);
      }

      setNotices(items);
      setPermissionError(false);
      setLoading(false);
    } catch (err: any) {
      if (isAdmin) {
        console.warn("[관리자 알림] 공지사항 fetch 권한 부족: firestore.rules 수동 게시가 필요할 수 있습니다.");
        setPermissionError(true);
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.GET, 'notices');
        } catch (e) {
          // Handled - reports to system if we explicitly throw
        }
      } else {
        // 일반 사용자 / 비로그인 사용자는 에러 노출이나 console.error 없이 조용히 넘어갑니다.
        setNotices([]);
        setPermissionError(false);
        setLoading(false);
      }
    }
  };

  // One-time load when dashboard is active (supports 1-hour cache)
  useEffect(() => {
    if (!isActive) {
      return;
    }
    
    const cacheTime = localStorage.getItem('pt_cached_notices_time');
    const cachedData = localStorage.getItem('pt_cached_notices');
    const isCacheValid = cacheTime && cachedData && (Date.now() - parseInt(cacheTime, 10) < 3600000);

    if (isCacheValid && notices.length > 0) {
      setLoading(false);
      return;
    }

    loadNotices();
  }, [isActive, isAdmin]);

  const openCreateForm = () => {
    setEditingNotice(null);
    setTitle('');
    setContent('');
    setIsPinned(false);
    setError(null);
    setFormOpen(true);
  };

  const openEditForm = (notice: Notice) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setIsPinned(!!notice.isPinned);
    setError(null);
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingNotice) {
        // Edit Notice
        const ref = doc(db, 'notices', editingNotice.id);
        try {
          console.count("[WRITE] updateDoc");
          console.log({
            function: "handleSave_edit",
            reason: "noticeUpdated",
            path: ref.path,
            time: new Date().toISOString()
          });
          await updateDoc(ref, {
            title: title.trim(),
            content: content.trim(),
            isPinned,
            updatedAt: serverTimestamp()
          });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.UPDATE, `notices/${editingNotice.id}`);
        }
      } else {
        // Create Notice
        const collRef = collection(db, 'notices');
        const newDocRef = doc(collRef);
        const id = newDocRef.id;
        try {
          console.count("[WRITE] setDoc");
          console.log({
            function: "handleSave_create",
            reason: "noticeCreated",
            path: newDocRef.path,
            time: new Date().toISOString()
          });
          await setDoc(newDocRef, {
            id,
            title: title.trim(),
            content: content.trim(),
            isPinned,
            author: '피그타운',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, `notices/${id}`);
        }
      }
      
      // Clear cache so that the next loadNotices or reload fetches fresh data
      localStorage.removeItem('pt_cached_notices');
      localStorage.removeItem('pt_cached_notices_time');
      window.dispatchEvent(new Event('notices_data_changed'));

      await loadNotices();
      setFormOpen(false);
    } catch (err: any) {
      console.error("공지사항 저장 실패:", err);
      let errMsg = err.message || err;
      const parsed = safeJsonParse(err.message, null as any);
      if (parsed && parsed.error) {
        errMsg = parsed.error;
      }
      setError(`저장 중 오류 발생: ${String(errMsg)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, 'notices', id);
      console.count("[WRITE] deleteDoc");
      console.log({
        function: "handleDelete",
        reason: "noticeDeleted",
        path: docRef.path,
        time: new Date().toISOString()
      });
      await deleteDoc(docRef);
      
      // Clear cache so that the next loadNotices or reload fetches fresh data
      localStorage.removeItem('pt_cached_notices');
      localStorage.removeItem('pt_cached_notices_time');
      window.dispatchEvent(new Event('notices_data_changed'));
      
      await loadNotices();
      setDeleteId(null);
    } catch (err: any) {
      console.error("공지사항 삭제 실패:", err);
      try {
        handleFirestoreError(err, OperationType.DELETE, `notices/${id}`);
      } catch (e: any) {
        let errMsg = e.message || e;
        const parsed = safeJsonParse(e.message, null as any);
        if (parsed && parsed.error) {
          errMsg = parsed.error;
        }
        alert(`삭제 실패: ${String(errMsg)}`);
      }
    }
  };

  const formatDate = (val: any) => {
    if (!val) return '';
    let d: Date;
    if (typeof val.toDate === 'function') {
      d = val.toDate();
    } else if (val instanceof Date) {
      d = val;
    } else {
      d = new Date(val);
    }
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-[1240px] mx-auto w-full space-y-6 animate-fade-in">
          {/* Mobile Rolling Notice Air Bulb */}
          {notices.length > 0 && (
            <div className="px-1">
              <div 
                onClick={() => {
                  setActiveNoticeDetail(notices[currentNoticeIndex]);
                  setIsNoticeModalOpen(true);
                }}
                className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-400/10 hover:bg-amber-500/15 dark:hover:bg-amber-400/15 border border-amber-200/50 dark:border-amber-400/20 px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all active:scale-[0.98] select-none text-[11px] font-black text-stone-800 dark:text-stone-200 w-full shadow-xs"
              >
                <span className="flex-shrink-0 flex items-center gap-1 font-extrabold text-[9px] bg-amber-500/20 px-2 py-0.5 rounded-lg text-amber-800 dark:text-amber-300">
                  📢 알림
                </span>
                <div className="flex-1 min-w-0 overflow-hidden relative h-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={notices[currentNoticeIndex].id}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute inset-0 truncate font-black flex items-center"
                    >
                      {notices[currentNoticeIndex].title}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <span className="flex-shrink-0 text-[10px] text-amber-600 dark:text-amber-400 font-extrabold">➔</span>
              </div>
            </div>
          )}

          {/* 2. Collection Progress Widget (Row Grid) - Compact Padding */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-1 gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-stone-850 dark:text-stone-100 flex items-center gap-1.5">
                  📊 수집 현황
                </h2>
                {/* Page Control Switcher */}
                {maxPages > 1 && (
                  <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/80 px-1.5 py-0.5 rounded-xl border border-stone-200/50 dark:border-stone-700/50 text-xs font-bold text-stone-600 dark:text-stone-300 select-none">
                    <button
                      type="button"
                      onClick={() => carouselTriggerRef.current?.goPrev()}
                      className={cn(
                        "p-0.5 rounded-md transition-all hover:text-stone-900 dark:hover:text-stone-100 active:scale-95",
                        collectionPage === 1 ? "text-amber-600 dark:text-amber-400 font-black" : "opacity-50 hover:opacity-100"
                      )}
                      title="이전 페이지"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-extrabold px-1 font-mono">
                      {collectionPage} / {maxPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => carouselTriggerRef.current?.goNext()}
                      className={cn(
                        "p-0.5 rounded-md transition-all hover:text-stone-900 dark:hover:text-stone-100 active:scale-95",
                        collectionPage === 2 ? "text-cyan-600 dark:text-cyan-400 font-black" : "opacity-50 hover:opacity-100"
                      )}
                      title="다음 페이지"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Page Dot Indicators */}
                {maxPages > 1 && (
                  <div className="flex items-center gap-1.5 mr-1 bg-stone-100/60 dark:bg-stone-800/40 px-2 py-1.5 rounded-xl border border-stone-200/30 dark:border-stone-700/30">
                    <button
                      type="button"
                      onClick={() => {
                        if (collectionPage !== 1) carouselTriggerRef.current?.goPrev();
                      }}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        collectionPage === 1 ? "w-4 bg-amber-500 dark:bg-amber-400" : "w-2 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400"
                      )}
                      aria-label="1페이지"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (collectionPage !== 2) carouselTriggerRef.current?.goNext();
                      }}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        collectionPage === 2 ? "w-4 bg-cyan-500 dark:bg-cyan-400" : "w-2 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400"
                      )}
                      aria-label="2페이지"
                    />
                  </div>
                )}

                {/* View Mode Toggle */}
                <div className="flex items-center bg-stone-100/80 dark:bg-stone-800/80 p-0.5 rounded-xl border border-stone-200/40 dark:border-stone-700/50 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('simple')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all",
                      viewMode === 'simple'
                        ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs"
                        : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                    )}
                  >
                    기본
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('detailed')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all",
                      viewMode === 'detailed'
                        ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs"
                        : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                    )}
                  >
                    상세
                  </button>
                </div>
              </div>
            </div>

            <InfinitePageCarousel
              currentPage={collectionPage}
              maxPages={maxPages}
              onPageChange={setCollectionPage}
              triggerRef={carouselTriggerRef}
              renderPage={(page) => (
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {viewMode === 'simple' ? (
                    page === 1 ? (
                    <>
                      {/* Simple Birds Card */}
                      <div 
                        onClick={() => setActiveCategory?.('birds')}
                        className="bg-amber-50/40 hover:bg-amber-100/40 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-3 sm:p-5 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none h-[90px] sm:h-[110px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] sm:text-sm font-black text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/40 px-2 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                            새 도감
                          </span>
                          <Bird className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl sm:text-4xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                            {completedBirdIds.size}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-stone-400 dark:text-stone-500 ml-1.5">
                            / {birdTotal}
                          </span>
                        </div>
                      </div>

                      {/* Simple Insects Card */}
                      <div 
                        onClick={() => setActiveCategory?.('insects')}
                        className="bg-emerald-50/40 hover:bg-emerald-100/40 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-3 sm:p-5 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none h-[90px] sm:h-[110px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] sm:text-sm font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40">
                            곤충 도감
                          </span>
                          <Bug className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl sm:text-4xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                            {completedInsectIds.size}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-stone-400 dark:text-stone-500 ml-1.5">
                            / {insectTotal}
                          </span>
                        </div>
                      </div>

                      {/* Simple Fishing Card */}
                      <div 
                        onClick={() => setActiveCategory?.('fishing')}
                        className="bg-blue-50/40 hover:bg-blue-100/40 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 p-3 sm:p-5 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none h-[90px] sm:h-[110px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] sm:text-sm font-black text-blue-800 dark:text-blue-300 bg-blue-100/60 dark:bg-blue-900/40 px-2 py-0.5 rounded-lg border border-blue-200/50 dark:border-blue-800/40">
                            낚시 도감
                          </span>
                          <Fish className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl sm:text-4xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                            {completedFishIds.size}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-stone-400 dark:text-stone-500 ml-1.5">
                            / {fishTotal}
                          </span>
                        </div>
                      </div>

                      {/* Simple Cooking Card */}
                      <div 
                        onClick={() => setActiveCategory?.('cooking')}
                        className="bg-purple-50/40 hover:bg-purple-100/40 dark:bg-purple-950/10 dark:hover:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 p-3 sm:p-5 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none h-[90px] sm:h-[110px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] sm:text-sm font-black text-purple-800 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-900/40 px-2 py-0.5 rounded-lg border border-purple-200/50 dark:border-purple-800/40">
                            요리 도감
                          </span>
                          <Soup className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl sm:text-4xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                            {completedFoodIds.size}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-stone-400 dark:text-stone-500 ml-1.5">
                            / {cookingTotal}
                          </span>
                        </div>
                      </div>

                      {/* Simple Gardening Card */}
                      <div 
                        onClick={() => setActiveCategory?.('gardening', 'flower')}
                        className="bg-rose-50/40 hover:bg-rose-100/40 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-3 sm:p-5 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none h-[90px] sm:h-[110px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] sm:text-sm font-black text-rose-800 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-900/40 px-2 py-0.5 rounded-lg border border-rose-200/50 dark:border-rose-800/40">
                            원예 도감
                          </span>
                          <Flower className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl sm:text-4xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                            {completedFlowerIds.size}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-stone-400 dark:text-stone-500 ml-1.5">
                            / {gardeningTotal}
                          </span>
                        </div>
                      </div>

                      {/* Simple Crops Card */}
                      <div 
                        onClick={() => setActiveCategory?.('gardening', 'crop')}
                        className="bg-lime-50/40 hover:bg-lime-100/40 dark:bg-lime-950/10 dark:hover:bg-lime-950/20 border border-lime-200 dark:border-lime-900/60 p-3 sm:p-5 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none h-[90px] sm:h-[110px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] sm:text-sm font-black text-lime-800 dark:text-lime-300 bg-lime-100/60 dark:bg-lime-900/40 px-2 py-0.5 rounded-lg border border-lime-200/50 dark:border-lime-800/40">
                            작물 도감
                          </span>
                          <Sprout className="h-4 w-4 sm:h-5 sm:w-5 text-lime-600 dark:text-lime-400 shrink-0" />
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl sm:text-4xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                            {completedCropIds.size}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-stone-400 dark:text-stone-500 ml-1.5">
                            / {cropTotal}
                          </span>
                        </div>
                      </div>

                      {/* Simple Ocean Cleaning Card (Page 1 on PC) */}
                      <div 
                        onClick={() => setActiveCategory?.('ocean_cleaning')}
                        className="hidden lg:flex bg-cyan-50/40 hover:bg-cyan-100/40 dark:bg-cyan-950/10 dark:hover:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/60 p-3 sm:p-5 rounded-2xl transition-all shadow-xs flex-col justify-between cursor-pointer active:scale-98 select-none h-[90px] sm:h-[110px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] sm:text-sm font-black text-cyan-800 dark:text-cyan-300 bg-cyan-100/60 dark:bg-cyan-900/40 px-2 py-0.5 rounded-lg border border-cyan-200/50 dark:border-cyan-800/40">
                            바다청소 도감
                          </span>
                          <Waves className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl sm:text-4xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                            {completedOceanCleaningIds.size}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-stone-400 dark:text-stone-500 ml-1.5">
                            / {stats.oceanCleaning.total}
                          </span>
                        </div>
                      </div>

                      {/* Empty Placeholder Card for Page 1 Slot 8 on PC */}
                      <div 
                        className="hidden lg:flex border border-dashed border-stone-200/60 dark:border-stone-800/50 rounded-2xl bg-stone-50/10 dark:bg-stone-900/10 items-center justify-center h-[90px] sm:h-[110px] select-none opacity-20"
                      />
                    </>
                  ) : (
                    <>
                      {/* Simple Ocean Cleaning Card (Page 2 on Mobile/Tablet) */}
                      <div 
                        onClick={() => setActiveCategory?.('ocean_cleaning')}
                        className="flex lg:hidden bg-cyan-50/40 hover:bg-cyan-100/40 dark:bg-cyan-950/10 dark:hover:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/60 p-3 sm:p-5 rounded-2xl transition-all shadow-xs flex-col justify-between cursor-pointer active:scale-98 select-none h-[90px] sm:h-[110px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] sm:text-sm font-black text-cyan-800 dark:text-cyan-300 bg-cyan-100/60 dark:bg-cyan-900/40 px-2 py-0.5 rounded-lg border border-cyan-200/50 dark:border-cyan-800/40">
                            바다청소 도감
                          </span>
                          <Waves className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl sm:text-4xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                            {completedOceanCleaningIds.size}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-stone-400 dark:text-stone-500 ml-1.5">
                            / {stats.oceanCleaning.total}
                          </span>
                        </div>
                      </div>

                      {/* Empty Placeholder Card for Slot 1 on PC */}
                      <div 
                        className="hidden lg:flex border border-dashed border-stone-200/60 dark:border-stone-800/50 rounded-2xl bg-stone-50/10 dark:bg-stone-900/10 items-center justify-center h-[90px] sm:h-[110px] select-none opacity-20"
                      />

                      {/* Empty Placeholder Cards for Slots 2-6 (Mobile & PC) */}
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div 
                          key={`empty-simple-${idx}`}
                          className="border border-dashed border-stone-200/60 dark:border-stone-800/50 rounded-2xl bg-stone-50/10 dark:bg-stone-900/10 flex items-center justify-center h-[90px] sm:h-[110px] select-none opacity-20"
                        />
                      ))}

                      {/* Empty Placeholder Cards for Slots 7-8 (PC only) */}
                      {[6, 7].map((idx) => (
                        <div 
                          key={`empty-simple-pc-${idx}`}
                          className="hidden lg:flex border border-dashed border-stone-200/60 dark:border-stone-800/50 rounded-2xl bg-stone-50/10 dark:bg-stone-900/10 items-center justify-center h-[90px] sm:h-[110px] select-none opacity-20"
                        />
                      ))}
                    </>
                  )
                ) : (
                  page === 1 ? (
                    <>
                      {/* Birds Card */}
                      <div 
                        onClick={() => setActiveCategory?.('birds')}
                        className="bg-amber-50/40 hover:bg-amber-100/40 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-2.5 sm:p-4 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none min-h-[120px] sm:min-h-[140px]"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] sm:text-sm font-black text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/40 truncate">
                            새 도감
                          </span>
                          <Bird className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        </div>
                        
                        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
                          <div className="hidden xl:block shrink-0">
                            <RingChart 
                              total={birdTotal} 
                              completed={completedBirdIds.size} 
                              master={stats.birds.master} 
                              masterTotal={stats.birds.masterTotal}
                              fiveStar={stats.birds.fiveStar} 
                              compColorClass="text-amber-500 dark:text-amber-400" 
                              masterColorClass="text-orange-500 dark:text-orange-400"
                              fiveStarColorClass="text-purple-500 dark:text-purple-400"
                            />
                          </div>
                          <div className="flex-1 w-full min-w-0 text-left">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-bold mr-0.5">전체</span>
                              <span className="text-lg sm:text-xl md:text-2xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                                {completedBirdIds.size}
                              </span>
                              <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 font-extrabold">
                                / {birdTotal}
                              </span>
                            </div>
                            <div className="h-px bg-amber-100/70 dark:bg-amber-900/30 my-1 sm:my-1.5 w-full" />
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-300 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-orange-500 text-orange-500 shrink-0" />
                                  <span>명인</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.birds.master} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {stats.birds.masterTotal}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-300 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-purple-500 text-purple-500 shrink-0" />
                                  <span>5성</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.birds.fiveStar} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {birdTotal}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Insects Card */}
                      <div 
                        onClick={() => setActiveCategory?.('insects')}
                        className="bg-emerald-50/40 hover:bg-emerald-100/40 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-2.5 sm:p-4 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none min-h-[120px] sm:min-h-[140px]"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] sm:text-sm font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40 truncate">
                            곤충 도감
                          </span>
                          <Bug className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        </div>
                        
                        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
                          <div className="hidden xl:block shrink-0">
                            <RingChart 
                              total={insectTotal} 
                              completed={completedInsectIds.size} 
                              master={stats.insects.master} 
                              masterTotal={stats.insects.masterTotal}
                              fiveStar={stats.insects.fiveStar} 
                              compColorClass="text-emerald-500 dark:text-emerald-400" 
                              masterColorClass="text-orange-500 dark:text-orange-400"
                              fiveStarColorClass="text-purple-500 dark:text-purple-400"
                            />
                          </div>
                          <div className="flex-1 w-full min-w-0 text-left">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-bold mr-0.5">전체</span>
                              <span className="text-lg sm:text-xl md:text-2xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                                {completedInsectIds.size}
                              </span>
                              <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 font-extrabold">
                                / {insectTotal}
                              </span>
                            </div>
                            <div className="h-px bg-emerald-100/70 dark:bg-emerald-900/30 my-1 sm:my-1.5 w-full" />
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-emerald-500 text-emerald-500 shrink-0" />
                                  <span>명인</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.insects.master} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {stats.insects.masterTotal}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-300 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-purple-500 text-purple-500 shrink-0" />
                                  <span>5성</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.insects.fiveStar} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {insectTotal}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fishing Card */}
                      <div 
                        onClick={() => setActiveCategory?.('fishing')}
                        className="bg-blue-50/40 hover:bg-blue-100/40 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 p-2.5 sm:p-4 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none min-h-[120px] sm:min-h-[140px]"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] sm:text-sm font-black text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-lg border border-blue-200 dark:border-stone-800/50 truncate">
                            낚시 도감
                          </span>
                          <Fish className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        </div>
                        
                        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
                          <div className="hidden xl:block shrink-0">
                            <RingChart 
                              total={fishTotal} 
                              completed={completedFishIds.size} 
                              master={stats.fishing.master} 
                              masterTotal={stats.fishing.masterTotal}
                              fiveStar={stats.fishing.fiveStar} 
                              compColorClass="text-blue-500 dark:text-blue-400" 
                              masterColorClass="text-orange-500 dark:text-orange-400"
                              fiveStarColorClass="text-purple-500 dark:text-purple-400"
                            />
                          </div>
                          <div className="flex-1 w-full min-w-0 text-left">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-bold mr-0.5">전체</span>
                              <span className="text-lg sm:text-xl md:text-2xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                                {completedFishIds.size}
                              </span>
                              <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 font-extrabold">
                                / {fishTotal}
                              </span>
                            </div>
                            <div className="h-px bg-blue-100/70 dark:bg-blue-900/30 my-1 sm:my-1.5 w-full" />
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-blue-500 text-blue-500 shrink-0" />
                                  <span>명인</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.fishing.master} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {stats.fishing.masterTotal}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-300 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-purple-500 text-purple-500 shrink-0" />
                                  <span>5성</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.fishing.fiveStar} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {fishTotal}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cooking Card */}
                      <div 
                        onClick={() => setActiveCategory?.('cooking')}
                        className="bg-pink-50/40 hover:bg-pink-100/40 dark:bg-pink-950/10 dark:hover:bg-pink-950/20 border border-pink-200 dark:border-pink-900/60 p-2.5 sm:p-4 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none min-h-[120px] sm:min-h-[140px]"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] sm:text-sm font-black text-pink-800 dark:text-pink-300 bg-pink-50 dark:bg-pink-900/40 px-1.5 py-0.5 rounded-lg border border-pink-200 dark:border-pink-800/50 truncate">
                            요리 도감
                          </span>
                          <Soup className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0" />
                        </div>
                        
                        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
                          <div className="hidden xl:block shrink-0">
                            <RingChart 
                              total={cookingTotal} 
                              completed={completedFoodIds.size} 
                              master={stats.cooking.master} 
                              masterTotal={stats.cooking.masterTotal}
                              fiveStar={stats.cooking.fiveStar} 
                              compColorClass="text-pink-500 dark:text-pink-400" 
                              masterColorClass="text-orange-500 dark:text-orange-400"
                              fiveStarColorClass="text-purple-500 dark:text-purple-400"
                            />
                          </div>
                          <div className="flex-1 w-full min-w-0 text-left">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-bold mr-0.5">전체</span>
                              <span className="text-lg sm:text-xl md:text-2xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                                {completedFoodIds.size}
                              </span>
                              <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 font-extrabold">
                                / {cookingTotal}
                              </span>
                            </div>
                            <div className="h-px bg-pink-100/70 dark:bg-pink-900/30 my-1 sm:my-1.5 w-full" />
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-indigo-500 text-indigo-500 shrink-0" />
                                  <span>명인</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.cooking.master} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {stats.cooking.masterTotal}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-300 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-purple-500 text-purple-500 shrink-0" />
                                  <span>5성</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.cooking.fiveStar} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {cookingTotal}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gardening Card */}
                      <div 
                        onClick={() => setActiveCategory?.('gardening', 'flower')}
                        className="bg-rose-50/40 hover:bg-rose-100/40 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-2.5 sm:p-4 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none min-h-[120px] sm:min-h-[140px]"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] sm:text-sm font-black text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/40 px-1.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800/50 truncate">
                            원예 도감
                          </span>
                          <Flower className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        </div>
                        
                        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
                          <div className="hidden xl:block shrink-0">
                            <RingChart 
                              total={gardeningTotal} 
                              completed={completedFlowerIds.size} 
                              master={stats.gardening.master} 
                              masterTotal={stats.gardening.masterTotal}
                              fiveStar={stats.gardening.fiveStar} 
                              compColorClass="text-rose-500 dark:text-rose-400" 
                              masterColorClass="text-orange-500 dark:text-orange-400"
                              fiveStarColorClass="text-purple-500 dark:text-purple-400"
                            />
                          </div>
                          <div className="flex-1 w-full min-w-0 text-left">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-bold mr-0.5">전체</span>
                              <span className="text-lg sm:text-xl md:text-2xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                                {completedFlowerIds.size}
                              </span>
                              <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 font-extrabold">
                                / {gardeningTotal}
                              </span>
                            </div>
                            <div className="h-px bg-rose-100/70 dark:bg-rose-900/30 my-1 sm:my-1.5 w-full" />
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-rose-500 text-rose-500 shrink-0" />
                                  <span>명인</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.gardening.master} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {stats.gardening.masterTotal}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-300 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-purple-500 text-purple-500 shrink-0" />
                                  <span>5성</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.gardening.fiveStar} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {gardeningTotal}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Crops Card */}
                      <div 
                        onClick={() => setActiveCategory?.('gardening', 'crop')}
                        className="bg-lime-50/40 hover:bg-lime-100/40 dark:bg-lime-950/10 dark:hover:bg-lime-950/20 border border-lime-200 dark:border-lime-900/60 p-2.5 sm:p-4 rounded-2xl transition-all shadow-xs flex flex-col justify-between cursor-pointer active:scale-98 select-none min-h-[120px] sm:min-h-[140px]"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] sm:text-sm font-black text-lime-800 dark:text-lime-300 bg-lime-50 dark:bg-lime-900/40 px-1.5 py-0.5 rounded-lg border border-lime-200 dark:border-lime-800/40 truncate">
                            작물 도감
                          </span>
                          <Sprout className="h-4 w-4 text-lime-600 dark:text-lime-400 shrink-0" />
                        </div>
                        
                        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
                          <div className="hidden xl:block shrink-0">
                            <RingChart 
                              total={cropTotal} 
                              completed={completedCropIds.size} 
                              master={stats.crops.master} 
                              masterTotal={stats.crops.masterTotal}
                              fiveStar={stats.crops.fiveStar} 
                              compColorClass="text-lime-500 dark:text-lime-400" 
                              masterColorClass="text-orange-500 dark:text-orange-400"
                              fiveStarColorClass="text-purple-500 dark:text-purple-400"
                            />
                          </div>
                          <div className="flex-1 w-full min-w-0 text-left">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-bold mr-0.5">전체</span>
                              <span className="text-lg sm:text-xl md:text-2xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                                {completedCropIds.size}
                              </span>
                              <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 font-extrabold">
                                / {cropTotal}
                              </span>
                            </div>
                            <div className="h-px bg-lime-100/70 dark:bg-lime-900/30 my-1 sm:my-1.5 w-full" />
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-lime-600 dark:text-lime-400 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-lime-500 text-lime-500 shrink-0" />
                                  <span>명인</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.crops.master} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {stats.crops.masterTotal}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-300 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-purple-500 text-purple-500 shrink-0" />
                                  <span>5성</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.crops.fiveStar} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {cropTotal}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Ocean Cleaning Card (Page 1 on PC) */}
                      <div 
                        onClick={() => setActiveCategory?.('ocean_cleaning')}
                        className="hidden lg:flex bg-cyan-50/40 hover:bg-cyan-100/40 dark:bg-cyan-950/10 dark:hover:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/60 p-2.5 sm:p-4 rounded-2xl transition-all shadow-xs flex-col justify-between cursor-pointer active:scale-98 select-none min-h-[120px] sm:min-h-[140px]"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] sm:text-sm font-black text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/40 px-1.5 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-800/40 truncate">
                            바다청소 도감
                          </span>
                          <Waves className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        </div>
                        
                        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
                          <div className="hidden xl:block shrink-0">
                            <RingChart 
                              total={stats.oceanCleaning.total} 
                              completed={completedOceanCleaningIds.size} 
                              master={stats.oceanCleaning.master} 
                              masterTotal={stats.oceanCleaning.masterTotal}
                              fiveStar={stats.oceanCleaning.fiveStar} 
                              compColorClass="text-cyan-500 dark:text-cyan-400" 
                              masterColorClass="text-orange-500 dark:text-orange-400"
                              fiveStarColorClass="text-purple-500 dark:text-purple-400"
                            />
                          </div>
                          <div className="flex-1 w-full min-w-0 text-left">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-bold mr-0.5">전체</span>
                              <span className="text-lg sm:text-xl md:text-2xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                                {completedOceanCleaningIds.size}
                              </span>
                              <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 font-extrabold">
                                / {stats.oceanCleaning.total}
                              </span>
                            </div>
                            <div className="h-px bg-cyan-100/70 dark:bg-cyan-900/30 my-1 sm:my-1.5 w-full" />
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-orange-500 text-orange-500 shrink-0" />
                                  <span>명인</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.oceanCleaning.master} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {stats.oceanCleaning.masterTotal}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-300 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-purple-500 text-purple-500 shrink-0" />
                                  <span>5성</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.oceanCleaning.fiveStar} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {stats.oceanCleaning.total}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Empty Placeholder Card for Page 1 Slot 8 on PC */}
                      <div 
                        className="hidden lg:flex border border-dashed border-stone-200/60 dark:border-stone-800/50 rounded-2xl bg-stone-50/10 dark:bg-stone-900/10 min-h-[110px] sm:min-h-[140px] select-none opacity-20"
                      />
                    </>
                  ) : (
                    <>
                      {/* Detailed Ocean Cleaning Card (Page 2 on Mobile/Tablet) */}
                      <div 
                        onClick={() => setActiveCategory?.('ocean_cleaning')}
                        className="flex lg:hidden bg-cyan-50/40 hover:bg-cyan-100/40 dark:bg-cyan-950/10 dark:hover:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/60 p-2.5 sm:p-4 rounded-2xl transition-all shadow-xs flex-col justify-between cursor-pointer active:scale-98 select-none min-h-[120px] sm:min-h-[140px]"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] sm:text-sm font-black text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/40 px-1.5 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-800/40 truncate">
                            바다청소 도감
                          </span>
                          <Waves className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        </div>
                        
                        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
                          <div className="hidden xl:block shrink-0">
                            <RingChart 
                              total={stats.oceanCleaning.total} 
                              completed={completedOceanCleaningIds.size} 
                              master={stats.oceanCleaning.master} 
                              masterTotal={stats.oceanCleaning.masterTotal}
                              fiveStar={stats.oceanCleaning.fiveStar} 
                              compColorClass="text-cyan-500 dark:text-cyan-400" 
                              masterColorClass="text-orange-500 dark:text-orange-400"
                              fiveStarColorClass="text-purple-500 dark:text-purple-400"
                            />
                          </div>
                          <div className="flex-1 w-full min-w-0 text-left">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-bold mr-0.5">전체</span>
                              <span className="text-lg sm:text-xl md:text-2xl font-mono font-black text-stone-900 dark:text-stone-100 leading-none">
                                {completedOceanCleaningIds.size}
                              </span>
                              <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 font-extrabold">
                                / {stats.oceanCleaning.total}
                              </span>
                            </div>
                            <div className="h-px bg-cyan-100/70 dark:bg-cyan-900/30 my-1 sm:my-1.5 w-full" />
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-orange-500 text-orange-500 shrink-0" />
                                  <span>명인</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.oceanCleaning.master} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {stats.oceanCleaning.masterTotal}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-300 whitespace-nowrap">
                                  <Star className="h-3 w-3 fill-purple-500 text-purple-500 shrink-0" />
                                  <span>5성</span>
                                </div>
                                <div className="font-mono text-stone-900 dark:text-stone-100 font-extrabold text-[10px] sm:text-xs whitespace-nowrap">
                                  {stats.oceanCleaning.fiveStar} <span className="text-stone-400 dark:text-stone-500 font-bold">/ {stats.oceanCleaning.total}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                  {/* Empty Placeholder Card for Slot 1 on PC */}
                  <div 
                    className="hidden lg:flex border border-dashed border-stone-200/60 dark:border-stone-800/50 rounded-2xl bg-stone-50/10 dark:bg-stone-900/10 min-h-[110px] sm:min-h-[140px] select-none opacity-20"
                  />

                  {/* Detailed Empty Placeholder Cards for Slots 2-6 (Mobile & PC) */}
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div 
                      key={`empty-detailed-${idx}`}
                      className="border border-dashed border-stone-200/60 dark:border-stone-800/50 rounded-2xl bg-stone-50/10 dark:bg-stone-900/10 min-h-[110px] sm:min-h-[140px] select-none opacity-20"
                    />
                  ))}

                  {/* Detailed Empty Placeholder Cards for Slots 7-8 (PC only) */}
                  {[6, 7].map((idx) => (
                    <div 
                      key={`empty-detailed-pc-${idx}`}
                      className="hidden lg:flex border border-dashed border-stone-200/60 dark:border-stone-800/50 rounded-2xl bg-stone-50/10 dark:bg-stone-900/10 min-h-[110px] sm:min-h-[140px] select-none opacity-20"
                    />
                  ))}
                </>
              )
            )}
          </div>
        )}
      />
          </section>

          {/* Coupon Entry Ribbon Banner */}
          <div 
            onClick={() => setActiveCategory?.('coupons')}
            className="group flex items-center justify-between p-5 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 bg-white dark:bg-stone-900 shadow-[0_2px_10px_-2px_rgba(245,158,11,0.1)] hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 cursor-pointer select-none active:scale-[0.99]"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20 shrink-0">
                <Ticket className="h-6 w-6" />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight leading-none">
                    두근두근타운 리딤코드
                  </h3>
                  {activeCouponsCount > 0 ? (
                    <span className="text-[10px] font-black tracking-wider bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                      {activeCouponsCount}개 사용 가능
                    </span>
                  ) : (
                    <span className="text-[10px] font-black tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded-full">
                      새로운 쿠폰 없음
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400 leading-tight">
                  지금 바로 리딤코드를 확인하고 혜택을 받아보세요!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0 bg-stone-100 dark:bg-stone-800 p-2 rounded-xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 text-stone-400 dark:text-stone-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>

          {/* 2.5 Bento grid zone for Crop Timer and Pets preference info */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: CropTimer simplified Widget */}
            <div className="flex flex-col p-4 md:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 justify-between h-[210px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-emerald-555 dark:text-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-black text-neutral-855 dark:text-stone-200 uppercase tracking-tight">
                    실시간 알림 현황
                  </h3>
                </div>
                {setActiveCategory && (
                  <button
                    onClick={() => setActiveCategory('crops')}
                    className="text-[10px] font-black text-stone-500 dark:text-stone-400 hover:text-neutral-900 dark:hover:text-stone-100 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    상세보기 <ExternalLink className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>

              {/* Simplified count rendering instead of long cards */}
              {(() => {
                const getSlotTimesSimple = (s: any) => {
                  let originalStart = 0;
                  if (s.originalStartTime) {
                    if (typeof s.originalStartTime === 'object' && typeof s.originalStartTime.toMillis === 'function') {
                      originalStart = s.originalStartTime.toMillis();
                    } else if (typeof s.originalStartTime === 'object' && typeof s.originalStartTime.seconds === 'number') {
                      originalStart = s.originalStartTime.seconds * 1000;
                    } else {
                      originalStart = Number(s.originalStartTime) || 0;
                    }
                  } else if (s.startTime) {
                    originalStart = Number(s.startTime) || 0;
                  }

                  const originalDurationSec = Number(s.originalDuration) || Number(s.duration) || 0;
                  const userOffsetSec = Number(s.userOffset) || 0;
                  const currentDurationSec = Math.max(0, originalDurationSec + userOffsetSec);
                  const targetTime = originalStart + (currentDurationSec * 1000);
                  
                  // For 5-star mode, actual completion has +60s buffer
                  const actualTargetTime = s.isFiveStarMode ? targetTime + 60000 : targetTime;

                  return { startTime: originalStart, targetTime: actualTargetTime };
                };

                const activeSlots = slots.filter(s => s.cropName || s.cropId);
                const nowTime = Date.now();
                
                const calculatedSlots = activeSlots.map(s => {
                  const { targetTime } = getSlotTimesSimple(s);
                  return { ...s, calculatedTargetTime: targetTime };
                });

                const growingSlots = calculatedSlots.filter(s => s.calculatedTargetTime > nowTime);
                const completedSlots = calculatedSlots.filter(s => s.calculatedTargetTime <= nowTime);

                if (activeSlots.length === 0) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center py-2 text-center">
                      <p className="text-xs font-extrabold text-stone-505 dark:text-stone-405 leading-none">
                        등록된 알림이 없습니다.
                      </p>
                      {setActiveCategory && (
                        <button
                          onClick={() => setActiveCategory('crops')}
                          className="mt-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          새로운 알림 등록하기 ➔
                        </button>
                      )}
                    </div>
                  );
                }

                const growingCount = growingSlots.length;
                const minTargetTime = growingCount > 0 ? Math.min(...growingSlots.map(s => s.calculatedTargetTime)) : null;

                const completedCount = completedSlots.length;
                const mostRecentCompletedTargetTime = completedCount > 0 ? Math.max(...completedSlots.map(s => s.calculatedTargetTime)) : null;

                const formatSimpleDate = (ts: number) => {
                  const d = new Date(ts);
                  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                };

                return (
                  <div className="flex-1 flex items-center justify-between gap-3 py-2 text-center">
                    <div className="flex-1 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl flex flex-col justify-center items-center">
                      <p className="text-[10px] font-extrabold text-stone-500 dark:text-stone-400">예약된 알림 🌱</p>
                      <p className="text-xl font-mono font-black text-amber-600 dark:text-amber-500 mt-2">
                        {growingCount}개
                      </p>
                      <p className="text-[10px] text-stone-400 font-bold mt-1 min-h-[14px]">
                        {growingCount > 0 && minTargetTime ? getRemainingTimeSimple(minTargetTime) : ''}
                      </p>
                    </div>
                    
                    <div className="flex-1 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl flex flex-col justify-center items-center">
                      <p className="text-[10px] font-extrabold text-stone-500 dark:text-stone-400">완료된 알림 🌟</p>
                      <p className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-500 mt-2">
                        {completedCount}개
                      </p>
                      <p className="text-[10px] text-stone-400 font-bold mt-1 min-h-[14px]">
                        {completedCount > 0 && mostRecentCompletedTargetTime ? `${formatSimpleDate(mostRecentCompletedTargetTime)} 완료` : ''}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right: PetFood simplified Widget */}
            <div className="flex flex-col p-4 md:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 justify-between h-[210px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🐾</span>
                  <h3 className="text-xs font-black text-neutral-855 dark:text-stone-200 uppercase tracking-tight">
                  펫 먹이 선호현황 (요약)
                  </h3>
                </div>
                {setActiveCategory && (
                  <button
                    onClick={() => setActiveCategory('petfood')}
                    className="text-[10px] font-black text-stone-500 dark:text-stone-400 hover:text-neutral-900 dark:hover:text-stone-100 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    상세보기 <ExternalLink className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>

              {localPets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-2 text-center">
                  <p className="text-xs font-extrabold text-stone-505 dark:text-stone-405 leading-none">
                    등록된 마이 펫이 없습니다.
                  </p>
                  {setActiveCategory && (
                    <button
                      onClick={() => setActiveCategory('petfood')}
                      className="mt-2 text-[10px] font-black text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline cursor-pointer"
                    >
                      마이 펫 등록하기 ➔
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto scrollbar-thin py-1 pr-1 space-y-1 my-1 max-h-[140px] text-left">
                  {localPets.slice(0, 5).map((pet) => {
                    const preferences = pet.preferences || {};
                    let likeCount = 0;
                    let dislikeCount = 0;
                    Object.values(preferences).forEach(pref => {
                      if (pref === 'like') likeCount++;
                      if (pref === 'dislike') dislikeCount++;
                    });

                    return (
                      <div key={pet.id} className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-stone-100/60 dark:hover:bg-stone-800/60 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          {pet.type === 'dog' ? (
                            <Dog className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <Cat className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          )}
                          <span className="font-extrabold text-neutral-800 dark:text-stone-100 truncate text-sm">
                            {pet.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs text-stone-600 dark:text-stone-300">
                          <span className="flex items-center gap-1 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-extrabold">
                            👍 {likeCount}
                          </span>
                          <span className="flex items-center gap-1 bg-rose-500/10 dark:bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold">
                            👎 {dislikeCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>


      {/* 5.5 Unified Notice List/Detail Modal */}
      <AnimatePresence>
        {isNoticeModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsNoticeModalOpen(false);
                setActiveNoticeDetail(null);
              }}
              className="absolute inset-0 bg-neutral-950/70 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              className="relative w-full max-w-2xl h-[520px] sm:h-[620px] max-h-[85vh] rounded-3xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] ring-1 ring-black/5 dark:ring-white/10 z-10 flex flex-col justify-between"
            >
              {!activeNoticeDetail ? (
                /* --- A. LIST VIEW --- */
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-750 pb-4 shrink-0">
                    <div className="text-left">
                      <h2 className="text-base sm:text-lg md:text-xl font-black text-neutral-900 dark:text-stone-100 tracking-tight leading-none flex items-center gap-2">
                        📢 피그타운 공지사항
                      </h2>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-1.5 leading-none">
                        피그타운의 새로운 소식과 주요 업데이트 및 공지사항을 확인해 보세요.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsNoticeModalOpen(false);
                        setActiveNoticeDetail(null);
                      }}
                      className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors cursor-pointer shrink-0"
                      title="닫기"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* List Content */}
                  <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-3 my-1 scrollbar-thin">
                    {loading ? (
                      <div className="space-y-3">
                        <div className="h-20 bg-stone-50/50 dark:bg-stone-900/40 rounded-xl animate-pulse" />
                      </div>
                    ) : notices.length === 0 ? (
                      <div className="min-h-[250px] flex flex-col items-center justify-center p-6 text-center rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-550 shadow-xs">
                        <div className="mb-2">
                          <span className="text-3xl filter saturate-75">📢</span>
                        </div>
                        <h4 className="text-stone-800 dark:text-stone-300 text-[12px] font-black tracking-tight leading-normal mb-1">
                          피그타운의 공지사항이 없습니다.
                        </h4>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold leading-relaxed max-w-[200px] mx-auto">
                          새로운 소식이 등록되는 대로 안내해 드리겠습니다.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-stone-100 dark:divide-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
                        {notices.map((notice) => (
                          <div
                            key={notice.id}
                            onClick={() => setActiveNoticeDetail(notice)}
                            className={`group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-stone-50 dark:hover:bg-stone-850/60 transition-all cursor-pointer ${
                              notice.isPinned ? "bg-amber-50/20 dark:bg-amber-950/10" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              {notice.isPinned ? (
                                <span className="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 leading-none mt-0.5">
                                  📌 필독
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 leading-none mt-0.5">
                                  📄 공지
                                </span>
                              )}
                              
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <h3 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                                  {notice.title}
                                </h3>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium line-clamp-1">
                                  {notice.content}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800/40 pt-2 sm:pt-0">
                              <span className="text-[10px] font-extrabold text-stone-500 dark:text-stone-400">
                                ✍️ {notice.author || '피그타운'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-stone-400 dark:text-stone-500">
                                {formatDate(notice.createdAt).split(' ')[0]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-stone-150 dark:border-stone-850 flex justify-between items-center shrink-0">
                    <div>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            // Close Notice list modal and open Create Notice Modal
                            setIsNoticeModalOpen(false);
                            openCreateForm();
                          }}
                          className="flex py-1.5 px-3 items-center gap-1.5 bg-neutral-900 dark:bg-stone-100 hover:bg-neutral-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>공지 등록하기</span>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setIsNoticeModalOpen(false);
                        setActiveNoticeDetail(null);
                      }}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
                    >
                      닫기
                    </button>
                  </div>
                </>
              ) : (
                /* --- B. DETAIL VIEW --- */
                <>
                  {/* Header / Meta with Back Button */}
                  <div className="flex items-start justify-between border-b border-stone-150 dark:border-stone-750 pb-4 shrink-0">
                    <div className="space-y-1.5 text-left flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => setActiveNoticeDetail(null)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95 border border-stone-250/25 dark:border-stone-700/30"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          뒤로가기
                        </button>
                        {activeNoticeDetail.isPinned && (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[10px] font-black leading-none shrink-0">
                            📌 필독 공지
                          </span>
                        )}
                      </div>
                      <h2 className="text-base sm:text-lg md:text-xl font-black text-neutral-900 dark:text-stone-100 tracking-tight leading-snug">
                        {activeNoticeDetail.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-stone-400 dark:text-stone-550 font-bold">
                        <span>✍️ {activeNoticeDetail.author || '피그타운'}</span>
                        <span>•</span>
                        <span className="font-mono">{formatDate(activeNoticeDetail.createdAt)}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsNoticeModalOpen(false);
                        setActiveNoticeDetail(null);
                      }}
                      className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors cursor-pointer shrink-0"
                      title="닫기"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto pr-2 text-left text-neutral-800 dark:text-stone-205 text-xs md:text-sm lg:text-base font-medium leading-relaxed whitespace-pre-wrap pt-4 scrollbar-thin">
                    {activeNoticeDetail.content}
                  </div>

                  {/* Actions (Close/Edit/Delete) */}
                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center shrink-0 gap-2">
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              const targetNotice = activeNoticeDetail;
                              setIsNoticeModalOpen(false);
                              setActiveNoticeDetail(null);
                              openEditForm(targetNotice);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-stone-200 dark:hover:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
                          >
                            <Pencil className="h-3 w-3" />
                            수정하기
                          </button>
                          <button
                            onClick={() => {
                              const targetNotice = activeNoticeDetail;
                              setIsNoticeModalOpen(false);
                              setActiveNoticeDetail(null);
                              setDeleteId(targetNotice.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/20 dark:border-rose-900/10 font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
                          >
                            <Trash2 className="h-3 w-3" />
                            삭제하기
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setIsNoticeModalOpen(false);
                        setActiveNoticeDetail(null);
                      }}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
                    >
                      닫기
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}

        {/* Notice Create/Edit Form Modal */}
        {formOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-stone-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-150 dark:border-stone-800 shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4 shrink-0 font-scale-lock">
                <h2 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>📢</span>
                  {editingNotice ? '공지사항 수정' : '공지사항 작성'}
                </h2>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-y-auto space-y-4 py-4 pr-1 text-left scrollbar-thin">
                {error && (
                  <div className="p-3.5 text-xs font-bold bg-rose-50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/10">
                    ⚠️ {error}
                  </div>
                )}

                <div className="space-y-1.5 shrink-0">
                  <label className="text-[11px] font-extrabold text-stone-400 dark:text-stone-500 uppercase tracking-widest pl-1">
                    공지 제목
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력해 주세요"
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950/40 hover:bg-stone-100/50 dark:hover:bg-stone-950/80 focus:bg-white dark:focus:bg-stone-900 focus:ring-1 focus:ring-amber-500/20 focus:border-amber-500 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl text-xs md:text-sm font-bold text-stone-900 dark:text-stone-100 focus:outline-none transition-all placeholder-stone-400 dark:placeholder-stone-600"
                    required
                  />
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col min-h-[220px]">
                  <label className="text-[11px] font-extrabold text-stone-400 dark:text-stone-500 uppercase tracking-widest pl-1 shrink-0">
                    공지 내용
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="공지 내용을 입력해 주세요"
                    disabled={submitting}
                    className="w-full flex-1 px-4 py-3.5 bg-stone-50 dark:bg-stone-950/40 hover:bg-stone-100/50 dark:hover:bg-stone-950/80 focus:bg-white dark:focus:bg-stone-900 focus:ring-1 focus:ring-amber-500/20 focus:border-amber-500 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 focus:outline-none transition-all resize-none placeholder-stone-400 dark:placeholder-stone-600 scrollbar-thin"
                    required
                  />
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pl-1 py-1">
                  <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      disabled={submitting}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500 peer-checked:border-amber-600 peer-checked:after:translate-x-4 transition-all duration-200 shadow-inner" />
                    <span className="text-xs font-black text-stone-700 dark:text-stone-200">
                      📌 상단 고정하기 (최신순 우선)
                    </span>
                  </label>
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    disabled={submitting}
                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-stone-200 dark:hover:bg-stone-100 text-white dark:text-stone-900 font-extrabold text-xs rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {submitting ? '저장 중...' : editingNotice ? '수정 완료' : '등록 완료'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-stone-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-150 dark:border-stone-800 shadow-2xl p-6 flex flex-col text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
                <span>⚠️</span> 공지사항 삭제
              </h3>
              <p className="text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                정말 이 공지사항을 영구 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
              </p>
              
              <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-extrabold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteId)}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  삭제하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
