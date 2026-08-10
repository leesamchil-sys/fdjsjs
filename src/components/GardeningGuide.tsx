import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Star, Medal, CheckSquare, Clock, RefreshCcw, X, ChevronDown, Eye, EyeOff, Calendar, Sparkles, Settings, ChevronRight, Compass, Heart, SearchX } from 'lucide-react';
import { cn, safeJsonParse } from '../lib/utils';
import { GARDENING_ITEMS, FLOWER_IMAGE_MAPPING, CROP_IMAGE_MAPPING, FLOWER_COLOR_VARIANTS } from '../data/gardening';
import { SEASONAL_EVENTS, isSeasonOngoing, getSeasonBadgeStyle } from '../data/seasonal';
import { GardeningItem } from '../types';
import EncyclopediaFilterDropdown from './EncyclopediaFilterDropdown';
import CrossbreedingModal from './CrossbreedingModal';
import FlowerColorModal from './FlowerColorModal';
import SortDropdown from './SortDropdown';
import { SortOrder } from '../types';
import { PriceTable } from './PriceTable';

export interface GardeningGuideProps {
  completedIds?: Set<string>;
  masterIds?: Set<string>;
  onToggleCompletion?: (id: string) => void;
  onToggleMaster?: (id: string) => void;
  ratings?: { [itemName: string]: number };
  onRate?: (id: string | null, name: string, rating: number) => void;
  maxLevel?: number;
  initialTab?: 'flower' | 'crop';
  onOpenSeasonalModal?: () => void;
  activeSeasonIds?: string[];
  showSeasonalBanner?: boolean;
  flowerColorCollections?: Record<string, Record<string, boolean>>;
  onToggleFlowerColor?: (itemId: string, variantKey: string) => void;
}

interface GardeningCardProps {
  key?: string;
  item: GardeningItem;
  currentRating: number;
  isCompleted: boolean;
  isMaster: boolean;
  isFavorite: boolean;
  onToggleCompletion?: (id: string) => void;
  onToggleMaster?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  handleRate: (id: string, name: string, rating: number) => void;
  onShowCrossbreeding?: (item: GardeningItem) => void;
  onShowColorModal?: (item: GardeningItem) => void;
  flowerColors?: Record<string, boolean>;
  hidePrices?: boolean;
}

function GardeningCard({
  item,
  currentRating,
  isCompleted,
  isMaster,
  isFavorite,
  onToggleCompletion,
  onToggleMaster,
  onToggleFavorite,
  handleRate,
  onShowCrossbreeding,
  onShowColorModal,
  flowerColors = {},
  hidePrices = false
}: GardeningCardProps) {
  const maxStars = item.maxStars ?? 5;
  const effectiveRating = Math.min(currentRating || 0, maxStars);
  const [imgError, setImgError] = useState(false);
  const [imgRatio, setImgRatio] = useState<'portrait' | 'landscape' | 'square'>('square');
  const [activeCardTab, setActiveCardTab] = useState<'info' | 'price'>(hidePrices ? 'info' : 'price');

  const variants = item.category === 'flower' ? (FLOWER_COLOR_VARIANTS[item.name] || []) : [];
  const totalColorCount = variants.length;
  const collectedColorCount = variants.filter(v => flowerColors[v]).length;

  useEffect(() => {
    setActiveCardTab(hidePrices ? 'info' : 'price');
  }, [hidePrices]);

  useEffect(() => {
    setImgError(false);
    setImgRatio('square');
  }, [item.name]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const ratio = naturalHeight / naturalWidth;
    if (ratio > 1.25) setImgRatio('portrait');
    else if (ratio < 0.8) setImgRatio('landscape');
    else setImgRatio('square');
  };

  const imageFolder = item.category === 'crop' ? 'crops' : 'gardening';
  const flowerPrefix = item.category === 'flower' ? FLOWER_IMAGE_MAPPING[item.name] : undefined;
  const cropFilename = item.category === 'crop' ? CROP_IMAGE_MAPPING[item.name] : undefined;
  
  const imgUrl = flowerPrefix 
    ? `/images/gardening/${item.name}/${flowerPrefix}_1.webp`
    : cropFilename
      ? `/images/crops/${cropFilename}.webp`
      : `/images/${imageFolder}/${item.name}.webp`;

  const seasonInfo = item.seasonId ? SEASONAL_EVENTS.find(e => e.id === item.seasonId) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative flex flex-col w-full overflow-hidden base-card-style"
      )}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="flex flex-col h-full p-4 sm:p-5 justify-between">
        {/* 1. Header: Level and Completion buttons */}
        <div className="flex items-center justify-between mb-1 pb-1.5 border-b border-neutral-200/50 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase tracking-widest border shadow-2xs bg-neutral-50 dark:bg-stone-800 text-neutral-400 dark:text-stone-300 border-neutral-200 dark:border-stone-100/10">
              Lv.{item.level}
            </span>
            {seasonInfo && (() => {
              const badgeStyle = getSeasonBadgeStyle(seasonInfo.id);
              return (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-tight border shadow-2xs shrink-0 whitespace-nowrap flex items-center gap-0.5",
                  badgeStyle.bg, badgeStyle.text, badgeStyle.border
                )}>
                  {seasonInfo.emoji && <span>{seasonInfo.emoji}</span>}
                  <span>{seasonInfo.shortName || seasonInfo.name}</span>
                </span>
              );
            })()}
          </div>

          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id);
                }}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-all border-2 active:scale-90 shadow-2xs cursor-pointer",
                  isFavorite
                    ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30"
                    : "bg-white dark:bg-stone-850 border-neutral-300 dark:border-stone-700 text-neutral-300 dark:text-stone-400 hover:border-rose-400 dark:hover:border-rose-500 hover:text-rose-500"
                )}
                title="즐겨찾기"
              >
                <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
              </button>
            )}

            {isCompleted && onToggleMaster && !item.excludeFromMaster && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMaster(item.id);
                }}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-all border-2 active:scale-90 shadow-2xs cursor-pointer",
                  isMaster
                    ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30"
                    : "bg-white dark:bg-stone-850 border-neutral-300 dark:border-stone-700 text-neutral-300 dark:text-stone-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-500"
                )}
                title="명인 달성"
              >
                <Medal className="h-4 w-4" />
              </button>
            )}

            {onToggleCompletion && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompletion(item.id);
                }}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-all border-2 active:scale-90 shadow-2xs cursor-pointer",
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-white dark:bg-stone-850 border-neutral-300 dark:border-stone-700 text-neutral-300 dark:text-stone-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-500"
                )}
                title="도감 등록 완료"
              >
                <CheckSquare className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Identity Area: Name and Thumbnail image (or fallback to emoji) */}
        <div className="flex-1 py-4 relative flex items-center justify-between gap-3 min-h-[76px]">
          <div className="flex-1 min-w-0 z-10">
            <h3 className="font-black tracking-tight leading-[1.2] line-clamp-2 text-[16px] text-neutral-900 dark:text-stone-200">
              {item.name}
            </h3>
          </div>

          <div className={cn(
            "rounded-xl overflow-hidden flex items-center justify-center transition-all bg-white dark:bg-stone-900 relative shrink-0 z-10",
            imgRatio === 'portrait' 
              ? "w-12 h-16" 
              : imgRatio === 'landscape' 
                ? "w-20 h-16" 
                : "w-16 h-16",
            "shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-neutral-50 dark:border-stone-800"
          )}>
            {!imgError ? (
              <img 
                src={imgUrl} 
                onLoad={handleImageLoad}
                draggable={false}
                onError={() => setImgError(true)}
                alt={item.name}
                className={cn(
                  "transition-all duration-700 group-hover:scale-110 pointer-events-none",
                  imgRatio === 'portrait' ? "h-full w-auto object-contain p-2" : "w-full h-full object-contain p-0.5"
                )}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-50 dark:bg-stone-950/70 border border-stone-150 dark:border-stone-800 shadow-inner group-hover:scale-105 transition-all duration-300">
                <span className="text-3.5xl sm:text-4xl pointer-events-none select-none">
                  {item.emoji}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Footer Area: Growth Time / Prices */}
        <div className="border-t border-neutral-200/50 dark:border-stone-800 pt-3 space-y-3">
          {item.price !== undefined && (
            <div className="flex items-center gap-1 px-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCardTab('info');
                }}
                className={cn(
                  "text-[9.5px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer",
                  activeCardTab === 'info' 
                    ? "bg-slate-800 text-white dark:bg-stone-200 dark:text-stone-900"
                    : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
                )}
              >
                성장시간
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCardTab('price');
                }}
                className={cn(
                  "text-[9.5px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer",
                  activeCardTab === 'price' 
                    ? "bg-slate-800 text-white dark:bg-stone-200 dark:text-stone-900"
                    : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
                )}
              >
                판매 가격표
              </button>
            </div>
          )}

          <div className="min-h-[46px] flex flex-col justify-center">
            {activeCardTab === 'info' || item.price === undefined ? (
              <div className="flex flex-wrap items-center gap-1.5 w-full min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold tracking-tight transition-all border shadow-2xs bg-stone-50 dark:bg-stone-850 border-stone-200/50 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-emerald-300 dark:hover:border-emerald-700">
                  <Clock className="h-3 w-3 shrink-0 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                  <span>성장시간: {item.duration}</span>
                </span>

                {item.category === 'flower' && onShowCrossbreeding && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowCrossbreeding(item);
                    }}
                    className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black text-rose-500/90 dark:text-rose-400/85 hover:text-rose-600 dark:hover:text-rose-300 transition-all border border-transparent active:scale-95 cursor-pointer bg-transparent"
                  >
                    교배표
                  </button>
                )}
              </div>
            ) : (
              <PriceTable item={item} type={item.category === 'crop' ? 'crops' : 'gardening'} variant="compact" />
            )}
          </div>

          {/* Ratings Rating Line exactly conforming to Food Card */}
          <div className="flex items-center justify-between border-t border-neutral-100 dark:border-stone-800 pt-2 border-dashed flex-wrap gap-1.5">
            <div className="flex items-center gap-0.5 -ml-1">
              {Array.from({ length: maxStars }, (_, i) => i + 1).map((starIdx) => {
                const active = starIdx <= effectiveRating;
                return (
                  <button
                    key={starIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRate(item.id, item.name, effectiveRating === starIdx ? 0 : starIdx);
                    }}
                    className="p-0.5 transition-all hover:scale-125 active:scale-150"
                    title={`${starIdx}점 부여`}
                  >
                    <Star 
                      className={cn(
                        "h-3.5 w-3.5 transition-all duration-300",
                        active 
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.6)]" 
                          : "text-stone-200 dark:text-stone-700 fill-stone-100/45 dark:fill-stone-800/40"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              {effectiveRating === maxStars && effectiveRating > 0 && (
                <span className="text-[8px] font-black px-2 py-0.5 rounded-full border shadow-2xs text-amber-500 bg-amber-500/10 border-amber-500/20 animate-bounce">
                  MAX
                </span>
              )}

              {item.category === 'flower' && onShowColorModal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowColorModal(item);
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all border border-emerald-500/30 bg-emerald-500/10 active:scale-95 cursor-pointer shrink-0"
                  title="색상별 수집 체크"
                >
                  <span>🎨 {collectedColorCount}/{totalColorCount}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CLEAR STAMP OVERLAY - elevated with z-20 to display perfectly on top of thumbnails */}
      {isCompleted && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20">
          <div className="border-[3.5px] font-black px-4 py-2.5 rounded-2xl transform -rotate-12 transition-all duration-500 flex flex-col items-center justify-center border-emerald-500/50 text-emerald-500/80 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <span className="leading-none tracking-[0.15em] text-xl">
              도감 CLEAR
            </span>
          </div>
        </div>
      )}

      {/* Master Badge Overlay (Centered in Card, behind complete overlay) */}
      {isMaster && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-[0.25]">
           <img src="/images/medal.webp" alt="Master Badge" className="w-28 h-28 sm:w-32 sm:h-32 object-contain" />
        </div>
      )}
    </motion.div>
  );
}

export default function GardeningGuide({
  completedIds = new Set(),
  masterIds = new Set(),
  onToggleCompletion,
  onToggleMaster,
  ratings: ratingsProp,
  onRate: onRateProp,
  maxLevel,
  initialTab = 'flower',
  onOpenSeasonalModal,
  activeSeasonIds = [],
  showSeasonalBanner = true,
  flowerColorCollections = {},
  onToggleFlowerColor
}: GardeningGuideProps) {
  const [activeTab, setActiveTab] = useState<'flower' | 'crop'>(initialTab);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [selectedColorItem, setSelectedColorItem] = useState<GardeningItem | null>(null);

  const handleShowColorModal = (item: GardeningItem) => {
    setSelectedColorItem(item);
    setIsColorModalOpen(true);
  };

  const allGardeningItems = React.useMemo(() => {
    const activeEvents = SEASONAL_EVENTS.filter(e => activeSeasonIds.includes(e.id));
    const seasonalGardening = activeEvents.flatMap(e => e.gardening || []);
    const seasonalCrops = activeEvents.flatMap(e => (e.crops || []).map(crop => {
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
        ...crop,
        id: crop.id,
        seasonId: crop.seasonId,
        name: crop.name,
        emoji: crop.emoji,
        category: 'crop' as const,
        level: 1,
        duration: durationStr,
        price: crop.price,
        excludeFromMaster: crop.excludeFromMaster ?? true,
      };
    }));
    return [...GARDENING_ITEMS, ...seasonalGardening, ...seasonalCrops];
  }, [activeSeasonIds]);

  const seasonalStats = React.useMemo(() => {
    const now = new Date();
    const activeEvents = SEASONAL_EVENTS.filter(e => activeSeasonIds.includes(e.id));
    const ongoingEvents = SEASONAL_EVENTS.filter(e => isSeasonOngoing(e, now));
    const offOngoingEvents = ongoingEvents.filter(e => !activeSeasonIds.includes(e.id));

    const activeBirdsCount = activeEvents.reduce((acc, e) => acc + (e.birds?.length || 0), 0);
    const activeInsectsCount = activeEvents.reduce((acc, e) => acc + (e.insects?.length || 0), 0);
    const activeFishCount = activeEvents.reduce((acc, e) => acc + (e.fishing?.length || 0), 0);
    const totalCreatures = activeBirdsCount + activeInsectsCount + activeFishCount;

    const activeGardeningCount = activeEvents.reduce((acc, e) => acc + (e.gardening?.length || 0), 0);
    const activeCropsCount = activeEvents.reduce((acc, e) => acc + (e.crops?.length || 0), 0);
    const totalPlants = activeGardeningCount + activeCropsCount;

    const activeNames = activeEvents.map(e => e.name).join(', ') || '없음';

    return {
      activeCount: activeEvents.length,
      creaturesCount: totalCreatures,
      plantsCount: totalPlants,
      names: activeNames,
      activeEvents,
      ongoingEvents,
      offOngoingEvents
    };
  }, [activeSeasonIds]);
  
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showPrices, setShowPrices] = useState<boolean>(false);
  const [isSeasonFilterEnabled, setIsSeasonFilterEnabled] = useState(false);
  const [selectedSeasonFilters, setSelectedSeasonFilters] = useState<string[]>(() => SEASONAL_EVENTS.map(s => s.id));
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'collected' | 'uncollected'>('all');
  const [starFilter, setStarFilter] = useState<'all' | 'done' | 'todo'>('all');
  const [masterFilter, setMasterFilter] = useState<'all' | 'done' | 'todo'>('all');

  const [favoritesTab, setFavoritesTab] = useState<'all' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('gardening_favorites');
      return safeJsonParse(saved, {});
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gardening_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save gardening favorites", e);
    }
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [sortOrder, setSortOrder] = useState<SortOrder>('level');

  const [selectedCrossbreedingItem, setSelectedCrossbreedingItem] = useState<GardeningItem | null>(null);
  const [isCrossbreedingModalOpen, setIsCrossbreedingModalOpen] = useState(false);

  const handleShowCrossbreeding = (item: GardeningItem) => {
    setSelectedCrossbreedingItem(item);
    setIsCrossbreedingModalOpen(true);
  };
  
  // Custom user star ratings lookup state loaded from localStorage for fallback
  const [localRatings, setLocalRatings] = useState<{ [itemId: string]: number }>(() => {
    const saved = localStorage.getItem('pigtown_gardening_ratings');
    return safeJsonParse(saved, {});
  });

  // Save ratings state changes to localStorage securely
  useEffect(() => {
    try {
       localStorage.setItem('pigtown_gardening_ratings', JSON.stringify(localRatings));
    } catch (e) {
       console.error("Failed to save gardening ratings", e);
    }
  }, [localRatings]);

  // Handle user toggling or choosing rating for cards
  const handleRate = (itemId: string, itemName: string, ratingValue: number) => {
    const currentRating = getRatingFor(allGardeningItems.find(g => g.id === itemId) as GardeningItem);
    const targetRating = currentRating === ratingValue ? 0 : ratingValue;

    if (onRateProp) {
      onRateProp(itemId, itemName, targetRating);
    } else {
      setLocalRatings(prev => {
        return {
          ...prev,
          [itemId]: targetRating
        };
      });
    }
  };

  const getRatingFor = (item: GardeningItem) => {
    if (ratingsProp !== undefined) {
      return ratingsProp[item.name] !== undefined ? ratingsProp[item.name] : 0;
    }
    return localRatings[item.id] !== undefined ? localRatings[item.id] : 0;
  };

  const filteredItems = React.useMemo(() => {
    const result = allGardeningItems.filter(item => {
    // 0. Level check
    if (maxLevel !== undefined && item.level > maxLevel) return false;
    // 0.5. Season filter
    if (isSeasonFilterEnabled && selectedSeasonFilters.length > 0) {
      if (!item.seasonId || !selectedSeasonFilters.includes(item.seasonId)) return false;
    }
    // 1. Tab check
    if (item.category !== activeTab) return false;
    // 2. Favorites check
    if (favoritesTab === 'favorites' && !favorites[item.id]) return false;
    // Filters
    const isCollected = completedIds.has(item.id);
    const isMaster = masterIds.has(item.id);
    const rating = getRatingFor(item);
    
    // Convert 'all' | 'collected' | 'uncollected' to 'all' | 'done' | 'todo'
    if (collectionFilter === 'collected' && !isCollected) return false;
    if (collectionFilter === 'uncollected' && isCollected) return false;
    
    // Star and Master logic already matches component types
    const itemMaxStars = item.maxStars ?? 5;
    const effectiveRating = Math.min(rating, itemMaxStars);
    if (starFilter === 'done' && effectiveRating < itemMaxStars) return false;
    if (starFilter === 'todo' && effectiveRating >= itemMaxStars) return false;

    if (masterFilter !== 'all' && item.excludeFromMaster) return false;
    if (masterFilter === 'done' && !isMaster) return false;
    if (masterFilter === 'todo' && isMaster) return false;
    // Search check
    if (searchTerm.trim() !== '') {
      const nQuery = searchTerm.replace(/\s+/g, '').toLowerCase();
      const nItemName = item.name.replace(/\s+/g, '').toLowerCase();
      if (!nItemName.includes(nQuery)) return false;
    }
    return true;
  });
  
  return [...result].sort((a, b) => {
    if (sortOrder === 'name') {
        return a.name.localeCompare(b.name, 'ko');
    } else { // 'level'
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name, 'ko');
    }
  });
  }, [allGardeningItems, maxLevel, activeTab, completedIds, masterIds, isSeasonFilterEnabled, selectedSeasonFilters, collectionFilter, starFilter, masterFilter, searchTerm, sortOrder, ratingsProp, localRatings, favoritesTab, favorites]);

  return (
    <div id="gardening-guide-layout" className="w-full mx-auto text-stone-800 dark:text-stone-100">
      
      {/* Modern Unified Filter Box (Tabs + Search + Filters) */}
      <div 
        id="gardening-top-menu" 
        className="sticky-nav-surface mb-6 font-scale-lock"
      >
        <div className="max-w-[1240px] mx-auto w-full">
          <div className="filter-menu-container">
            <div className="p-1.5 sm:p-4 flex flex-col gap-3">
              {/* Row 1: Tabs */}
              <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-2xl border border-stone-150 dark:border-stone-850 self-start">
                {([
                  { id: 'flower', label: '🌸 원예 도감' },
                  { id: 'crop', label: '🌽 작물 도감' }
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-5 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2",
                      activeTab === tab.id
                        ? "bg-black text-white dark:bg-white dark:text-stone-900 shadow-lg"
                        : "text-stone-500 hover:bg-stone-200 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Row 2: Search bar + Filters */}
              <div className="flex items-center gap-2 sm:gap-3 w-full">
                <div className="relative flex-1 group overflow-hidden search-bar-container">
                  <Search className={cn(
                    "absolute left-3.5 sm:left-4 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 transition-colors z-10",
                    searchTerm ? "text-slate-900 dark:text-stone-100" : "text-neutral-400 dark:text-stone-550 group-focus-within:text-slate-900 dark:group-focus-within:text-stone-100"
                  )} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="검색어를 입력해주세요"
                    className="search-bar-input"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-850 text-stone-400 transition-colors cursor-pointer z-10"
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* LIKE (Favorites) BUTTON */}
                  <button
                    onClick={() => setFavoritesTab(favoritesTab === 'all' ? 'favorites' : 'all')}
                    className={cn(
                      "h-[36px] sm:h-[42px] px-2.5 sm:px-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 font-bold text-[11px] sm:text-[13px] transition-all cursor-pointer shrink-0 border",
                      favoritesTab === 'favorites'
                        ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20"
                        : "bg-white dark:bg-stone-900 text-stone-550 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 border border-stone-300/70 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 shadow-2xs"
                    )}
                    title={favoritesTab === 'favorites' ? "전체 보기" : "즐겨찾기만 보기"}
                  >
                    <Heart className={cn("h-4 w-4", favoritesTab === 'favorites' ? "fill-current" : "")} />
                    <span className="hidden md:inline">즐겨찾기</span>
                  </button>

                  {/* FILTERS DROPDOWN */}
                  <EncyclopediaFilterDropdown
                    collectionFilter={collectionFilter}
                    setCollectionFilter={setCollectionFilter}
                    isSeasonFilterEnabled={isSeasonFilterEnabled}
                    setIsSeasonFilterEnabled={setIsSeasonFilterEnabled}
                    selectedSeasonFilters={selectedSeasonFilters}
                    setSelectedSeasonFilters={setSelectedSeasonFilters}
                    activeSeasonIds={activeSeasonIds}
                    starFilter={starFilter}
                    setStarFilter={setStarFilter}
                    masterFilter={masterFilter}
                    setMasterFilter={setMasterFilter}
                    showPrices={showPrices}
                    setShowPrices={setShowPrices}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-1 sm:px-2 pb-8">
        {/* Row 3: Status Summary - Outside the top menu for app-wide alignment */}
        <div className="flex items-center justify-between mb-4 pb-1 border-b border-stone-200/65 dark:border-stone-850 px-1 max-w-[1240px] mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-stone-100">도감 목록</span>
            <span className="text-[10px] text-neutral-400 dark:text-stone-300 font-medium">총 {filteredItems.length}건</span>
          </div>
          
          <div className="flex items-center gap-2">
            {(searchTerm !== '' || isSeasonFilterEnabled || collectionFilter !== 'all' || starFilter !== 'all' || masterFilter !== 'all' || sortOrder !== 'level' || favoritesTab !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setCollectionFilter('all');
                  setIsSeasonFilterEnabled(false);
                  setSelectedSeasonFilters([]);
                  setStarFilter('all');
                  setMasterFilter('all');
                  setSortOrder('level');
                  setFavoritesTab('all');
                }}
                className="text-[10px] font-bold text-neutral-500 hover:text-neutral-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <RefreshCcw className="h-3 w-3" />
                필터 초기화
              </button>
            )}
            <SortDropdown sortOrder={sortOrder} setSortOrder={setSortOrder} options={[{ value: 'level', label: '레벨순' }, { value: 'name', label: '이름순' }]} />
          </div>
        </div>

        {/* Responsive Season Banner Button for both PC and Mobile */}
        {onOpenSeasonalModal && showSeasonalBanner && (
          <div className="px-1 mb-4 w-full max-w-[1240px] mx-auto">
            <button
              onClick={onOpenSeasonalModal}
              className="w-full p-3.5 sm:p-4 bg-stone-50/80 hover:bg-stone-100/80 dark:bg-stone-900/40 dark:hover:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs active:scale-[0.99] transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Compass className="h-5 w-5 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-sm text-stone-800 dark:text-stone-200 tracking-tight">시즌 이벤트 도감 설정</span>
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-pulse" />
                    {seasonalStats.offOngoingEvents.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                        {seasonalStats.offOngoingEvents.length}개 활성화 가능
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] sm:text-xs text-stone-500 dark:text-stone-400 font-bold mt-0.5 leading-snug truncate">
                    {seasonalStats.activeCount > 0 ? (
                      <>
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                          {seasonalStats.activeEvents[0]?.name}
                          {seasonalStats.activeCount > 1 ? ` 외 ${seasonalStats.activeCount - 1}개` : ''}
                        </span>
                        <span> 활성화 중</span>
                      </>
                    ) : (
                      "활성화된 시즌 이벤트가 없습니다."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-stone-400 dark:text-stone-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors shrink-0 ml-auto">
                <ChevronRight className="h-5 w-5" />
              </div>
            </button>
          </div>
        )}

        {/* Grid of clean matching Card layouts */}
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredItems.length === 0 ? (
            <motion.div
              id="gardening-empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="empty-view-wrapper"
            >
              <div className="empty-view-icon-box">
                <SearchX className="h-8 w-8 text-stone-400" />
              </div>
              <p className="text-stone-500 dark:text-stone-400 font-medium text-lg mb-1">
                조건에 맞는 아이템이 없습니다.
              </p>
              <p className="text-stone-400 dark:text-stone-500 text-sm">
                필터를 변경하거나 검색어를 다르게 입력해 보세요.
              </p>
            </motion.div>
          ) : (
            <motion.div
              id="gardening-cards-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-1 max-w-[1240px] mx-auto w-full select-none"
            >
              {filteredItems.map(item => {
                const currentRating = getRatingFor(item);
                const isCompleted = completedIds.has(item.id);
                const isMaster = masterIds.has(item.id);

                return (
                  <GardeningCard
                    key={item.id}
                    item={item}
                    currentRating={currentRating}
                    isCompleted={isCompleted}
                    isMaster={isMaster}
                    isFavorite={favorites[item.id] || false}
                    onToggleCompletion={onToggleCompletion}
                    onToggleMaster={onToggleMaster}
                    onToggleFavorite={toggleFavorite}
                    handleRate={handleRate}
                    onShowCrossbreeding={handleShowCrossbreeding}
                    onShowColorModal={handleShowColorModal}
                    flowerColors={flowerColorCollections[item.id] || {}}
                    hidePrices={!showPrices}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CrossbreedingModal 
        isOpen={isCrossbreedingModalOpen}
        onClose={() => setIsCrossbreedingModalOpen(false)}
        item={selectedCrossbreedingItem}
      />

      <FlowerColorModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        item={selectedColorItem}
        flowerColors={selectedColorItem ? (flowerColorCollections[selectedColorItem.id] || {}) : {}}
        onToggleColor={onToggleFlowerColor || (() => {})}
      />
    </div>
  );
}
