import { useState, useEffect, useMemo, useRef, SyntheticEvent } from 'react';
import { 
  Bird as BirdIcon,
  Search,
  MapPin, 
  Clock, 
  Sun, 
  CloudRain, 
  CloudSun,
  Sparkle, 
  Rainbow as RainbowIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCcw,
  Star,
  Info,
  CheckSquare,
  BookOpen,
  X,
  Bug,
  Fish as FishIcon,
  Medal,
  Soup,
  Check,
  Sprout,
  Settings,
  Eye,
  EyeOff,
  DollarSign,
  Heart,
  Calendar,
  Sparkles,
  Compass,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getHours } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Bird, Insect, Fish, Cooking, Category, GameWeather } from '../types';
import { BIRDS } from '../data/birds';
import { INSECTS } from '../data/insects';
import { FISHING } from '../data/fishing';
import { COOKING } from '../data/cooking';
import EncyclopediaFilterDropdown from './EncyclopediaFilterDropdown';
import SortDropdown from './SortDropdown';
import { 
  getExistingImagePath,
  getKoreanDayName,
  formatWeatherValue,
  formatTimeValue
} from '../lib/appHelpers';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { ItemCard, formatIngredient, formatCookingType } from './ItemCard';
import { SEASONAL_EVENTS } from '../data/seasonal';

// Main component props interface
interface EncyclopediaSectionProps {
  activeCategory: Category;
  currentTime: Date;
  currentGameWeather: GameWeather;
  completedBirdIds: Set<string>;
  completedInsectIds: Set<string>;
  completedFishIds: Set<string>;
  completedFoodIds: Set<string>;
  completedOceanCleaningIds?: Set<string>;
  masterBirdIds: Set<string>;
  masterInsectIds: Set<string>;
  masterFishIds: Set<string>;
  masterFoodIds: Set<string>;
  masterOceanCleaningIds?: Set<string>;
  ratings: Record<string, number>;
  toggleCompletion: (id: string) => void;
  toggleMaster: (id: string) => void;
  handleRate: (id: string, name: string, rating: number) => void;
  setIsCollectionModalOpen: (open: boolean) => void;
  currentCategoryCompleted: number;
  currentCategoryTotal: number;
  setBulkInput: (v: string) => void;
  bulkInput: string;
  setIsRecInfoOpen: (open: boolean) => void;
  isRecInfoOpen?: boolean;
  setIsWeatherModalOpen?: (open: boolean) => void;
  onOpenSeasonalModal?: () => void;
  activeSeasonIds?: string[];
  showSeasonalBanner?: boolean;
  // Data props
  birds: Bird[];
  insects: Insect[];
  fish: Fish[];
  cooking: Cooking[];
  oceanCleaning?: any[];
}

const CATCH_ALL_LOCATIONS = [
  '전체', '모든 구역', '모든 바다', '모든 호수', '모든 강',
  '바다 전체', '호수 전체', '강 전체',
  '꽃밭 전체', '도심 전체', '어촌 전체', '숲 전체', '온천산 전체'
];

const CATCH_ALL_LOCATION_MAPPING: Record<string, string[]> = {
  '모든 호수': ['온천산 호수', '온천산 화산호수'],
  '모든 바다': ['고래바다', '구해', '동해', '바다 낚시(황금물고기)', '잔잔한 바다'],
};

const sortSubLocations = (subs: string[]): string[] => {
  const priorityList = CATCH_ALL_LOCATIONS;
  
  return [...subs].sort((a, b) => {
    // 1. Priority items first
    const aIsPriority = priorityList.includes(a);
    const bIsPriority = priorityList.includes(b);
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    if (aIsPriority && bIsPriority) {
      return priorityList.indexOf(a) - priorityList.indexOf(b);
    }
    
    // 2. "기타" is last list item
    const aIsGita = a === '기타';
    const bIsGita = b === '기타';
    if (aIsGita && !bIsGita) return 1;
    if (!aIsGita && bIsGita) return -1;
    if (aIsGita && bIsGita) return 0;
    
    // 3. Special characters (e.g., "???") go right before "기타"
    const isSpecial = (str: string) => str === '???' || /^[^a-zA-Z0-9가-힣\s]+$/.test(str);
    const aIsSpec = isSpecial(a);
    const bIsSpec = isSpecial(b);
    if (aIsSpec && !bIsSpec) return 1;
    if (!aIsSpec && bIsSpec) return -1;
    if (aIsSpec && bIsSpec) {
      return a.localeCompare(b, 'ko-KR');
    }
    
    // 4. Default: alphabetical sort
    return a.localeCompare(b, 'ko-KR');
  });
};

export default function EncyclopediaSection({
  activeCategory,
  currentTime,
  currentGameWeather,
  completedBirdIds,
  completedInsectIds,
  completedFishIds,
  completedFoodIds,
  completedOceanCleaningIds = new Set(),
  masterBirdIds,
  masterInsectIds,
  masterFishIds,
  masterFoodIds,
  masterOceanCleaningIds = new Set(),
  ratings,
  toggleCompletion,
  toggleMaster,
  handleRate,
  setIsCollectionModalOpen,
  currentCategoryCompleted,
  currentCategoryTotal,
  setBulkInput,
  bulkInput,
  setIsRecInfoOpen,
  isRecInfoOpen,
  setIsWeatherModalOpen,
  birds,
  insects,
  fish,
  cooking,
  oceanCleaning = [],
  onOpenSeasonalModal,
  activeSeasonIds = [],
  showSeasonalBanner = true
}: EncyclopediaSectionProps) {

  // Isolated Filter States
  const [searchQuery, setSearchQuery] = useState('');

  const seasonalStats = useMemo(() => {
    const activeEvents = SEASONAL_EVENTS.filter(e => activeSeasonIds.includes(e.id));
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
      activeEvents
    };
  }, [activeSeasonIds]);
  const [isSeasonFilterEnabled, setIsSeasonFilterEnabled] = useState(false);
  const [selectedSeasonFilters, setSelectedSeasonFilters] = useState<string[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'collected' | 'uncollected'>('all');
  const [starFilter, setStarFilter] = useState<'all' | 'done' | 'todo'>('all');
  const [masterFilter, setMasterFilter] = useState<'all' | 'done' | 'todo'>('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [openMobileFilter, setOpenMobileFilter] = useState<string | null>(null);
  const [filterPage, setFilterPage] = useState(0);
  const [selectedCookingTypes, setSelectedCookingTypes] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedWeathers, setSelectedWeathers] = useState<GameWeather[]>([]);
  const [selectedTimeBlocks, setSelectedTimeBlocks] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedMainLocation, setSelectedMainLocation] = useState<string | null>(null);
  const [selectedMobileMainLocation, setSelectedMobileMainLocation] = useState<string | null>(null);
  const [includeCommon, setIncludeCommon] = useState<boolean>(true);
  const [sortOrders, setSortOrders] = useState<Record<string, string>>({
    birds: 'level',
    insects: 'level',
    fishing: 'level',
    cooking: 'level',
    ocean_cleaning: 'level'
  });
  const [userFilterExpandedPreference, setUserFilterExpandedPreference] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  // Reset active tab and search when category changes
  useEffect(() => {
    setActiveTab('all');
    setSearchQuery('');
    setCollectionFilter('all');
    setStarFilter('all');
    setMasterFilter('all');
    setSelectedCookingTypes([]);
    setSelectedLevels([]);
    setSelectedWeathers([]);
    setSelectedTimeBlocks([]);
    setSelectedLocations([]);
    setSelectedMainLocation(null);
    setSelectedMobileMainLocation(null);
    setFilterPage(0);
    setFilterByFiveStar(false);
    setShowPrices(false);
  }, [activeCategory]);

  const [showPrices, setShowPrices] = useState<boolean>(false);

  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('encyclopedia_favorites');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('encyclopedia_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn(e);
    }
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // States for recommendations settings
  const [recExcludeCompleted, setRecExcludeCompleted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rec_exclude_completed');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [recIncludeUnratedStars, setRecIncludeUnratedStars] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rec_include_unrated_stars');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const [recIncludeUncompletedMaster, setRecIncludeUncompletedMaster] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rec_include_uncompleted_master');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const [recTargetCriteria, setRecTargetCriteria] = useState<'spawn' | 'general' | 'fivestar' | 'all'>(() => {
    try {
      const saved = localStorage.getItem('rec_target_criteria');
      return (saved === 'spawn' || saved === 'general' || saved === 'fivestar' || saved === 'all') ? saved : 'spawn';
    } catch {
      return 'spawn';
    }
  });

  const [filterByFiveStar, setFilterByFiveStar] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('filter_by_five_star');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [isRecSettingsOpen, setIsRecSettingsOpen] = useState(false);
  const recSettingsRef = useRef<HTMLDivElement>(null);
  const recScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('rec_exclude_completed', String(recExcludeCompleted));
    } catch (e) {
      console.warn(e);
    }
  }, [recExcludeCompleted]);

  useEffect(() => {
    try {
      localStorage.setItem('rec_include_unrated_stars', String(recIncludeUnratedStars));
    } catch (e) {
      console.warn(e);
    }
  }, [recIncludeUnratedStars]);

  useEffect(() => {
    try {
      localStorage.setItem('rec_include_uncompleted_master', String(recIncludeUncompletedMaster));
    } catch (e) {
      console.warn(e);
    }
  }, [recIncludeUncompletedMaster]);

  useEffect(() => {
    try {
      localStorage.setItem('rec_target_criteria', recTargetCriteria);
    } catch (e) {
      console.warn(e);
    }
  }, [recTargetCriteria]);

  useEffect(() => {
    try {
      localStorage.setItem('filter_by_five_star', String(filterByFiveStar));
    } catch (e) {
      console.warn(e);
    }
  }, [filterByFiveStar]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isRecInfoOpen) return;
      if (recSettingsRef.current && !recSettingsRef.current.contains(event.target as Node)) {
        setIsRecSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isRecInfoOpen]);

  const [showLocationGuide, setShowLocationGuide] = useState(() => {
    try {
      return localStorage.getItem('dismissed_location_guide_v2') !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismissGuide = () => {
    setShowLocationGuide(false);
    try {
      localStorage.setItem('dismissed_location_guide_v2', 'true');
    } catch (e) {
      console.warn(e);
    }
  };

  const categoryNoun = useMemo(() => {
    switch (activeCategory) {
      case 'birds': return '새';
      case 'insects': return '곤충';
      case 'fishing': return '물고기';
      case 'cooking': return '요리';
      case 'crops': return '작물';
      case 'petfood': return '펫푸드';
      case 'gardening': return '원예';
      default: return '생물';
    }
  }, [activeCategory]);

  // Reset search and filter states when category changes
  useEffect(() => {
    setSearchQuery('');
    setCollectionFilter('all');
    setStarFilter('all');
    setMasterFilter('all');
    setSelectedCookingTypes([]);
    setSelectedLevels([]);
    setSelectedWeathers([]);
    setSelectedTimeBlocks([]);
    setSelectedLocations([]);
    setSelectedMainLocation(null);
    setSelectedMobileMainLocation(null);
    setIncludeCommon(true);
    setFilterPage(0);
  }, [activeCategory]);

  // Scroll states for sticky bar behaviors
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLargeFilterScrolledPast, setIsLargeFilterScrolledPast] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const searchHeaderRef = useRef<HTMLDivElement>(null);
  const largeFilterPanelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Monitor sticky state using the filter container's viewport position
  useEffect(() => {
    const handleScroll = () => {
      if (!filterRef.current) return;
      
      const width = window.innerWidth;
      const isMob = width < 1024;
      setIsMobile(isMob);

      const rect = filterRef.current.getBoundingClientRect();
      
      let stickyThreshold = isMob ? 56 : 0;
      if (searchHeaderRef.current) {
        const computedStyle = window.getComputedStyle(searchHeaderRef.current);
        const topVal = parseInt(computedStyle.top);
        if (!isNaN(topVal)) {
          stickyThreshold = topVal;
        }
      }
      
      const isStuck = rect.top <= stickyThreshold + 2;
      setIsScrolled(isStuck);

      if (searchHeaderRef.current && largeFilterPanelRef.current) {
        const searchRect = searchHeaderRef.current.getBoundingClientRect();
        const largeRect = largeFilterPanelRef.current.getBoundingClientRect();
        const hasScrolledPast = largeRect.bottom <= (searchRect.bottom + 10);
        setIsLargeFilterScrolledPast(hasScrolledPast);
      } else {
        setIsLargeFilterScrolledPast(isStuck);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Reset filter page when category changes
    setFilterPage(0);
  }, [activeCategory, isFilterExpanded]);

  useEffect(() => {
    setSelectedMainLocation(null);
    setSelectedMobileMainLocation(null);
    setSelectedLocations([]);
  }, [activeCategory]);

  // Sync expanded state with user preference
  useEffect(() => {
    setIsFilterExpanded(userFilterExpandedPreference);
  }, [userFilterExpandedPreference]);

  // Check if we are on a valid category
  if (activeCategory === 'crops' || activeCategory === 'gardening' || activeCategory === 'petfood' || activeCategory === 'home') {
    return null;
  }

  // Map database structures based on category
  const visibleData = useMemo(() => {
    if (activeCategory === 'birds') return birds;
    if (activeCategory === 'insects') return insects;
    if (activeCategory === 'fishing') return fish;
    if (activeCategory === 'cooking') return cooking;
    if (activeCategory === 'ocean_cleaning') return oceanCleaning;
    return [];
  }, [activeCategory, birds, insects, fish, cooking, oceanCleaning]);

  // Dynamic location groups filtered by category
  const locationGroups = useMemo<{ main: string; subs: string[] }[]>(() => {
    const map = new Map<string, Set<string>>();
    let targetData: any[] = [];
    if (activeCategory === 'birds') targetData = birds;
    else if (activeCategory === 'insects') targetData = insects;
    else if (activeCategory === 'fishing') targetData = fish;
    else if (activeCategory === 'cooking') targetData = cooking;
    else if (activeCategory === 'ocean_cleaning') targetData = oceanCleaning;

    targetData.forEach(item => {
      const cat = item.category || '기타';
      if (!map.has(cat)) {
        map.set(cat, new Set<string>());
      }
      const set = map.get(cat)!;
      if (item.locations) {
        item.locations.forEach((loc: string) => {
          set.add(loc);
        });
      }
    });

    const sortedMains = Array.from(map.keys()).sort((a, b) => {
      const aIsGita = a === '기타';
      const bIsGita = b === '기타';
      if (aIsGita && !bIsGita) return 1;
      if (!aIsGita && bIsGita) return -1;
      if (aIsGita && bIsGita) return 0;
      
      const isSpecial = (str: string) => str === '???' || /^[^a-zA-Z0-9가-힣\s]+$/.test(str);
      const aIsSpec = isSpecial(a);
      const bIsSpec = isSpecial(b);
      if (aIsSpec && !bIsSpec) return 1;
      if (!aIsSpec && bIsSpec) return -1;
      if (aIsSpec && bIsSpec) {
        return a.localeCompare(b, 'ko-KR');
      }
      
      return a.localeCompare(b, 'ko-KR');
    });
    return sortedMains.map(main => ({
      main,
      subs: sortSubLocations(Array.from(map.get(main)!))
    }));
  }, [activeCategory]);

  const completedIds = useMemo(() => {
    if (activeCategory === 'birds') return completedBirdIds;
    if (activeCategory === 'insects') return completedInsectIds;
    if (activeCategory === 'fishing') return completedFishIds;
    if (activeCategory === 'cooking') return completedFoodIds;
    if (activeCategory === 'ocean_cleaning') return completedOceanCleaningIds;
    return new Set<string>();
  }, [activeCategory, completedBirdIds, completedInsectIds, completedFishIds, completedFoodIds, completedOceanCleaningIds]);

  // Weather check logic helper
  const matchesWeather = (itemWeather: string, contextWeather: GameWeather) => {
    const isKnown = ['Clear', 'RainSnow', 'Meteor', 'Rainbow', 'Heatwave', 'Unknown'].includes(contextWeather);
    const normalizedContext = isKnown ? contextWeather : 'Unknown';
    const actualContext = normalizedContext === 'Heatwave' ? 'Clear' : normalizedContext;
    if (!itemWeather || itemWeather === 'Always') return true;
    if (actualContext === 'Rainbow') return true;
    if (actualContext === 'Clear' && itemWeather === 'Clear/Rainbow') return true;
    if (actualContext === 'RainSnow' && itemWeather === 'Rain/Snow/Rainbow') return true;
    return itemWeather === actualContext;
  };

  const matchesRecommendationWeather = (itemWeather: string, contextWeather: GameWeather) => {
    if (!itemWeather) return true;
    if (itemWeather === 'Always') {
      if (activeCategory === 'ocean_cleaning') return true; // 바다청소는 예외적으로 날씨무관 노출
      return false; // 날씨무관은 기본적으로 추천에 노출하지 않음
    }
    const isKnown = ['Clear', 'RainSnow', 'Meteor', 'Rainbow', 'Heatwave', 'Unknown'].includes(contextWeather);
    const normalizedContext = isKnown ? contextWeather : 'Unknown';
    const actualContext = normalizedContext === 'Heatwave' ? 'Clear' : normalizedContext;
    if (itemWeather === actualContext) return true;
    if (actualContext === 'Clear' && itemWeather === 'Clear/Rainbow') return true;
    if (actualContext === 'RainSnow' && itemWeather === 'Rain/Snow/Rainbow') return true;
    if (actualContext === 'Rainbow' && (itemWeather === 'Rainbow' || itemWeather === 'Clear/Rainbow' || itemWeather === 'Rain/Snow/Rainbow')) return true;
    return false;
  };

  const matchesTime = (slots: Bird['timeSlots'], hour: number) => {
    return slots.some(slot => {
      if (slot.start < slot.end) {
        return hour >= slot.start && hour < slot.end;
      } else {
        return hour >= slot.start || hour < slot.end;
      }
    });
  };

  const currentHour = getHours(currentTime);

  // 5-star items recommendations
  const recommendedItems = useMemo(() => {
    const hour = getHours(currentTime);
    const filtered = (visibleData as any[]).filter(item => {
      const isCompleted = completedIds.has(item.id);
      
      if (isCompleted) {
        if (recExcludeCompleted) {
          const rating = ratings[item.name] || 0;
          const masterIds = activeCategory === 'birds' 
            ? masterBirdIds 
            : activeCategory === 'insects' 
              ? masterInsectIds 
              : activeCategory === 'fishing' 
                ? masterFishIds 
                : activeCategory === 'ocean_cleaning'
                  ? masterOceanCleaningIds
                  : masterFoodIds;
          const isMaster = masterIds.has(item.id);

          const isStarIncomplete = recIncludeUnratedStars && rating < 5;
          const isMasterIncomplete = recIncludeUncompletedMaster && !isMaster;

          if (!isStarIncomplete && !isMasterIncomplete) {
            return false;
          }
        }
      }

      // 5성 촬영 조건 추천 분기처리 (공통 로직 준비)
      const matchesGeneral = () => {
        if (!item.timeSlots) return false;
        return matchesTime(item.timeSlots, hour) && matchesRecommendationWeather(item.weather, currentGameWeather);
      };

      const matchesFiveStar = () => {
        if (!item.fiveStarCondition) return false;
        const fs = item.fiveStarCondition;
        if (!fs.timeSlots || !fs.weather) return false;
        return matchesTime(fs.timeSlots, hour) && matchesRecommendationWeather(fs.weather, currentGameWeather);
      };

      if (activeCategory === 'birds') {
        if (recTargetCriteria === 'spawn') {
          return matchesGeneral();
        } else if (recTargetCriteria === 'general') {
          return matchesGeneral() || (item.weather === 'Always' && matchesFiveStar());
        } else if (recTargetCriteria === 'fivestar') {
          return matchesFiveStar();
        } else { // 'all'
          return matchesGeneral() || matchesFiveStar();
        }
      } else {
        // For other categories, default to general matching
        return matchesGeneral();
      }
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
      } else {
        return a.level - b.level;
      }
    });
  }, [
    currentTime, 
    completedIds, 
    visibleData, 
    currentGameWeather, 
    activeCategory, 
    sortOrders, 
    recExcludeCompleted, 
    recIncludeUnratedStars, 
    recIncludeUncompletedMaster, 
    recTargetCriteria,
    ratings, 
    masterBirdIds, 
    masterInsectIds, 
    masterFishIds, 
    masterFoodIds
  ]);

  const resetFilters = () => {
    setIsSeasonFilterEnabled(false);
    setSelectedSeasonFilters([]);
    setSearchQuery('');
    setSelectedLevels([]);
    setSelectedTimeBlocks([]);
    setSelectedWeathers([]);
    setSelectedCookingTypes([]);
    setSelectedLocations([]);
    setSelectedMainLocation(null);
    setCollectionFilter('all');
    setStarFilter('all');
    setMasterFilter('all');
    setFilterByFiveStar(false);
    setShowPrices(false);
    setSortOrders(prev => ({
      ...prev,
      [activeCategory]: 'level'
    }));
  };

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return visibleData;
    return (visibleData as (Bird | Insect)[]).filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [visibleData, searchQuery]);

  // Filter and compute full list
  const filteredItems = useMemo(() => {
    const items = filteredBySearch.filter(item => {
      if (activeTab === 'favorites' && !favorites[item.id]) return false;

      if (isSeasonFilterEnabled && selectedSeasonFilters.length > 0) {
        if (!item.seasonId || !selectedSeasonFilters.includes(item.seasonId)) return false;
      }

      const isCollected = completedIds.has(item.id);
      const currentRating = ratings[item.name] || 0;

      if (collectionFilter === 'uncollected' && isCollected) return false;
      if (collectionFilter === 'collected' && !isCollected) return false;

      if (starFilter === 'done' && currentRating < 5) return false;
      if (starFilter === 'todo' && currentRating >= 5) return false;

      const isMaster = (activeCategory === 'birds' ? masterBirdIds : activeCategory === 'insects' ? masterInsectIds : activeCategory === 'fishing' ? masterFishIds : activeCategory === 'ocean_cleaning' ? masterOceanCleaningIds : masterFoodIds).has(item.id);
      if (masterFilter === 'done' && !isMaster) return false;
      if (masterFilter === 'todo' && isMaster) return false;

      if (activeCategory === 'cooking') {
        const levelMatch = selectedLevels.length === 0 || selectedLevels.includes(item.level);
        let typeMatch = true;
        if (selectedCookingTypes.length > 0) {
          typeMatch = selectedCookingTypes.includes(item.cookingType);
        }
        return levelMatch && typeMatch;
      }

      const levelMatch = selectedLevels.length === 0 || selectedLevels.includes(item.level);
      if (!levelMatch) return false;
      
      // Determine what weather and time slots to use for filtering
      const useFiveStar = activeCategory === 'birds' && filterByFiveStar;
      
      if (useFiveStar && !item.fiveStarCondition) return false; // exclude if no 5-star condition

      const targetWeather = useFiveStar ? item.fiveStarCondition.weather : item.weather;
      const targetTimeSlots = useFiveStar ? item.fiveStarCondition.timeSlots : item.timeSlots;

      const isAlwaysItem = targetTimeSlots?.some(slot => slot.start === 0 && slot.end === 24) || false;
      
      const timeMatch = selectedTimeBlocks.length === 0 || selectedTimeBlocks.some(block => {
        if (block === 'always') return isAlwaysItem;
        if (isAlwaysItem) return false;
        
        return targetTimeSlots?.some(slot => {
          if (block === 'am-1') return (slot.start >= 0 && slot.start < 6) || (slot.end > 0 && slot.end <= 6);
          if (block === 'am-2') return (slot.start >= 6 && slot.start < 12) || (slot.end > 6 && slot.end <= 12);
          if (block === 'pm-1') return (slot.start >= 12 && slot.start < 18) || (slot.end > 12 && slot.end <= 18);
          if (block === 'pm-2') return (slot.start >= 18 && slot.start < 24) || (slot.end > 18 && slot.end <= 24);
          return false;
        });
      });

      if (!timeMatch) return false;

      const weatherMatch = selectedWeathers.length === 0 || selectedWeathers.includes(targetWeather as string);

      if (!weatherMatch) return false;

      // Location Filter
      if (selectedLocations.length > 0) {
        const itemLocations = item.locations || [];
        const itemCategory = (item as any).category || '기타';

        const hasDirectMatch = selectedLocations.some(loc => 
          itemLocations.includes(loc)
        );

        const hasCatchAllMatch = () => {
          if (!includeCommon) return false;
          // Does the item have any of our catch-all locations?
          const catchAllsInItem = itemLocations.filter(loc => CATCH_ALL_LOCATIONS.includes(loc));
          if (catchAllsInItem.length === 0) return false;

          return selectedLocations.some(selectedLoc => {
            // Does this selected location match any of the catch-all locations for this item?
            for (const catchAll of catchAllsInItem) {
                if (CATCH_ALL_LOCATION_MAPPING[catchAll]?.includes(selectedLoc)) return true;
            }

            // Original logic
            const parentGroup = locationGroups.find(g => g.subs.includes(selectedLoc));
            return parentGroup && parentGroup.main === itemCategory;
          });
        };

        if (!hasDirectMatch && !hasCatchAllMatch()) {
          return false;
        }
      } else if (selectedMainLocation !== null) {
        const itemCategory = (item as any).category || '기타';
        if (itemCategory !== selectedMainLocation) return false;
      }

      return true;
    });

    return [...items].sort((a, b) => {
      const currentSortOrder = sortOrders[activeCategory] || 'level';

      if (currentSortOrder === 'name') {
        return a.name.localeCompare(b.name, 'ko');
      } else if (currentSortOrder === 'location') {
        const locA = (activeCategory === 'cooking') ? '' : (a.locations && a.locations[0]) || '';
        const locB = (activeCategory === 'cooking') ? '' : (b.locations && b.locations[0]) || '';
        return locA.localeCompare(locB, 'ko');
      } else {
        return a.level - b.level;
      }
    });
  }, [filteredBySearch, collectionFilter, isSeasonFilterEnabled, selectedSeasonFilters, starFilter, masterFilter, completedIds, selectedLevels, selectedTimeBlocks, selectedWeathers, selectedCookingTypes, selectedLocations, selectedMainLocation, includeCommon, activeCategory, sortOrders, ratings, masterBirdIds, masterInsectIds, masterFishIds, masterFoodIds, filterByFiveStar, activeTab, favorites]);

  const shouldShowCompact = isScrolled && (!isFilterExpanded || isLargeFilterScrolledPast);

  // Time & Weather constant structures for selectors inside component
  const weatherOptions = useMemo(() => {
    let data: any[] = [];
    if (activeCategory === 'birds') data = birds;
    else if (activeCategory === 'insects') data = insects; 
    else if (activeCategory === 'fishing') data = fish; 

    let weathers: string[] = [];

    if (activeCategory === 'birds') {
        if (filterByFiveStar) {
            weathers = data
                .map(b => b.fiveStarCondition?.weather)
                .filter((w): w is string => !!w);
        } else {
            weathers = data
                .map(b => b.weather)
                .filter((w): w is string => !!w);
        }
    } else {
        weathers = data
            .map(b => b.weather)
            .filter((w): w is string => !!w);
    }

    const uniqueWeathers = Array.from(new Set(weathers));
    const result = uniqueWeathers.filter(w => w !== 'Always');
    if (uniqueWeathers.includes('Always')) {
      result.unshift('Always');
    }
    return result;
  }, [activeCategory, filterByFiveStar]);
  const alwaysBlock = { value: 'always', label: '시간무관' };
  const amBlocks = [
    { value: 'am-1', label: '새벽', sub: '00~06' },
    { value: 'am-2', label: '오전', sub: '06~12' }
  ];
  const pmBlocks = [
    { value: 'pm-1', label: '오후', sub: '12~18' },
    { value: 'pm-2', label: '저녁', sub: '18~24' }
  ];

  const currentLevelRange = useMemo(() => Array.from({ length: 14 }, (_, i) => i + 1), []);
  const isTimeFilterNeeded = activeCategory !== 'cooking';

  const handleWeatherFilterClick = (w: GameWeather) => {
    setSelectedWeathers(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
  };

  const handleTimeFilterClick = (b: string) => {
    setSelectedTimeBlocks(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  return (
    <>
      {activeCategory !== 'cooking' && (
        <section className="mb-4 max-w-[1240px] mx-auto w-full px-2 sm:px-4 lg:px-6">
          {currentGameWeather !== 'Unknown' && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-stone-200">
                  지금 잡을 수 있는 {activeCategory === 'birds' ? '새' : activeCategory === 'insects' ? '곤충' : activeCategory === 'ocean_cleaning' ? '도감' : '물고기'}
                </h2>
  
                {/* 세부 설정 버튼 및 팝업 */}
                <div className="relative inline-block" ref={recSettingsRef}>
                  <button 
                    type="button"
                    onClick={() => setIsRecSettingsOpen(!isRecSettingsOpen)}
                    className={cn(
                      "inline-flex items-center justify-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer",
                      isRecSettingsOpen 
                        ? "bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:border-stone-100 dark:text-stone-900" 
                        : "bg-white dark:bg-stone-900 border-stone-200/60 dark:border-stone-800/80 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700 shadow-xs"
                    )}
                    title="추천 세부 설정 및 안내"
                  >
                    <Settings className="h-3 w-3 stroke-[2.5]" />
                    <span>추천 설정</span>
                  </button>
  
                  <AnimatePresence>
                    {isRecSettingsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute -left-28 sm:left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl p-4 z-[300] text-sm text-stone-700 dark:text-stone-300 font-sans"
                      >
                        <h4 className="font-extrabold text-stone-900 dark:text-stone-100 mb-2.5 pb-2 border-b border-stone-100 dark:border-stone-800 text-sm flex items-center gap-1.5">
                          <Settings className="h-4 w-4 text-amber-500" />
                          추천 조건 세부 설정
                        </h4>
                        <div className="space-y-3 font-semibold">
                          {/* Option 1: Exclude completed entirely */}
                          <label className="flex items-start gap-2.5 cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                            <input 
                              type="checkbox"
                              checked={recExcludeCompleted}
                              onChange={(e) => setRecExcludeCompleted(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded-sm border-stone-300 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                            />
                            <div className="flex-1">
                              <span className="block leading-tight text-stone-900 dark:text-stone-200 text-[13px]">완료된 도감 제외</span>
                              <span className="text-[11px] text-stone-400 font-medium block mt-1">이미 완료 체크한 도감은 표시하지 않습니다.</span>
                            </div>
                          </label>
  
                          {/* Option 2: Include unrated stars */}
                          <label className={cn(
                            "flex items-start gap-2.5 cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors",
                            !recExcludeCompleted && "opacity-50 pointer-events-none"
                          )}>
                            <input 
                              type="checkbox"
                              checked={recIncludeUnratedStars}
                              disabled={!recExcludeCompleted}
                              onChange={(e) => setRecIncludeUnratedStars(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded-sm border-stone-300 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                            />
                            <div className="flex-1">
                              <span className="block leading-tight text-stone-900 dark:text-stone-200 text-[13px]">5성 미완료 도감 포함</span>
                              <span className="text-[11px] text-stone-400 font-medium block mt-1">도감을 완료했어도 성급이 5성 미만이면 추천 목록에 보여줍니다.</span>
                            </div>
                          </label>
  
                          {/* Option 3: Include uncompleted master */}
                          <label className={cn(
                            "flex items-start gap-2.5 cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors",
                            !recExcludeCompleted && "opacity-50 pointer-events-none"
                          )}>
                            <input 
                              type="checkbox"
                              checked={recIncludeUncompletedMaster}
                              disabled={!recExcludeCompleted}
                              onChange={(e) => setRecIncludeUncompletedMaster(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded-sm border-stone-300 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                            />
                            <div className="flex-1">
                              <span className="block leading-tight text-stone-900 dark:text-stone-200 text-[13px]">명인 미완료 도감 포함</span>
                              <span className="text-[11px] text-stone-400 font-medium block mt-1">도감을 완료했어도 명인 미완료 상태면 추천 목록에 보여줍니다.</span>
                            </div>
                          </label>
                        </div>

                        {/* 추천 조건 탭 */}
                        {activeCategory === 'birds' && (
                          <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                            <span className="block leading-tight font-bold text-xs text-stone-900 dark:text-stone-200">
                              추천 조건 기준 설정
                            </span>
                            <div className="grid grid-cols-4 gap-1 bg-stone-100 dark:bg-stone-950 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setRecTargetCriteria('spawn')}
                                className={cn(
                                  "py-1.5 px-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-lg transition-all whitespace-nowrap",
                                  recTargetCriteria === 'spawn'
                                    ? "bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs cursor-pointer"
                                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                                )}
                              >
                                출현 날씨
                              </button>
                              <button
                                type="button"
                                onClick={() => setRecTargetCriteria('general')}
                                className={cn(
                                  "py-1.5 px-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-lg transition-all whitespace-nowrap",
                                  recTargetCriteria === 'general'
                                    ? "bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs cursor-pointer"
                                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                                )}
                              >
                                현재 날씨
                              </button>
                              <button
                                type="button"
                                onClick={() => setRecTargetCriteria('fivestar')}
                                className={cn(
                                  "py-1.5 px-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-lg transition-all whitespace-nowrap",
                                  recTargetCriteria === 'fivestar'
                                    ? "bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs cursor-pointer"
                                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                                )}
                              >
                                5성 조건
                              </button>
                              <button
                                type="button"
                                onClick={() => setRecTargetCriteria('all')}
                                className={cn(
                                  "py-1.5 px-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-lg transition-all whitespace-nowrap",
                                  recTargetCriteria === 'all'
                                    ? "bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs cursor-pointer"
                                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                                )}
                              >
                                모두 표시
                              </button>
                            </div>
                            <p className="text-[11px] leading-normal font-medium mt-1.5 text-balance text-stone-400">
                              {recTargetCriteria === 'spawn' && "현재 시간과 일반 출현 날씨가 일치하는 새들을 추천합니다. (항상 출현하는 날씨무관 새는 제외됩니다.)"}
                              {recTargetCriteria === 'general' && "현재 날씨/시간에 일치하는 새들을 추천합니다. (날씨무관 새도 5성 조건에 맞으면 포함됩니다.)"}
                              {recTargetCriteria === 'fivestar' && "5성 특수 행동(날개펴기 등)의 날씨/시간에 맞는 새를 추천합니다."}
                              {recTargetCriteria === 'all' && "일반 출현 또는 5성 행동 조건 중 하나라도 맞으면 모두 추천합니다."}
                            </p>
                          </div>
                        )}
  
                        {/* Information Guide Link at Bottom */}
                        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
                          <button
                            type="button"
                            onClick={() => {
                              setIsRecSettingsOpen(false);
                              setIsRecInfoOpen(true);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/10 transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <Info className="h-4 w-4 shrink-0" />
                              추천 조건 및 가이드 보러가기
                            </span>
                            <span className="text-[10px] opacity-70">보기 &rarr;</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
    
          {currentGameWeather === 'Unknown' ? (
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-stone-100/40 dark:bg-stone-900/20 border border-stone-200/50 dark:border-stone-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-stone-200/30 dark:bg-stone-800/30 text-stone-500 dark:text-stone-400 shrink-0 mt-0.5">
                  <CloudSun className="h-4.5 w-4.5" />
                </div>
                <div className="space-y-0.5">
                  <h5 className="text-[12px] sm:text-[13px] font-bold text-stone-700 dark:text-stone-300">
                    날씨 설정이 되어있지 않습니다.
                  </h5>
                  <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium break-keep leading-relaxed">
                    우측 상단 날씨 설정을 현재 게임 내 날씨와 맞춰주시면, 수집 상황에 딱 맞는 도감을 추천해 드려요!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWeatherModalOpen?.(true)}
                className="w-full sm:w-auto justify-center shrink-0 inline-flex items-center gap-1 px-3.5 py-2 sm:py-1.5 text-[11px] font-black text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800/80 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98] whitespace-nowrap"
              >
                <span>날씨 설정하기</span>
                <span className="text-[9px] opacity-70">&rarr;</span>
              </button>
            </div>
          ) : recommendedItems.length === 0 ? (
            <div className="w-full min-h-[130px] flex flex-col items-center justify-center p-6 rounded-3xl bg-stone-100/50 dark:bg-stone-900/40 border border-dashed border-stone-200 dark:border-stone-800 text-center">
              <p className="text-[12px] font-bold text-stone-400 dark:text-stone-500">
                현재 조건에 맞는 추천 도감이 없습니다.
              </p>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 max-w-xs break-keep">
                추천 설정 필터를 변경하거나 시간이 지나면 새로운 도감이 추천됩니다.
              </p>
            </div>
          ) : (
            <div ref={recScrollRef} className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 px-2 sm:px-4 lg:px-6 scroll-pl-2 sm:scroll-pl-4 snap-x snap-mandatory scroll-smooth select-none">
              <AnimatePresence>
                {recommendedItems.map((item: any) => {
                  let currentTarget = recTargetCriteria;
                  if (activeCategory !== 'birds') {
                    currentTarget = 'spawn';
                  }

                  if (currentTarget === 'spawn') {
                    currentTarget = 'general';
                  } else if (currentTarget === 'general' && item.weather === 'Always') {
                    currentTarget = 'fivestar';
                  } else if (currentTarget === 'all') {
                    const isGen = item.timeSlots ? matchesTime(item.timeSlots, currentHour) && matchesRecommendationWeather(item.weather, currentGameWeather) : false;
                    const isFive = item.fiveStarCondition ? matchesTime(item.fiveStarCondition.timeSlots, currentHour) && matchesRecommendationWeather(item.fiveStarCondition.weather, currentGameWeather) : false;
                    if (isGen && !isFive) currentTarget = 'general';
                    else if (!isGen && isFive) currentTarget = 'fivestar';
                  }

                  return (
                    <motion.div 
                      key={`rec-${item.id}`} 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="min-w-[255px] xs:min-w-[265px] sm:min-w-[280px] snap-start snap-always"
                    >
                      <ItemCard 
                        item={item} 
                        type={activeCategory}
                        isRecommend 
                        recommendTarget={currentTarget}
                        isCompleted={completedIds.has(item.id)}
                        onToggle={() => toggleCompletion(item.id)}
                        isMaster={(activeCategory === 'birds' ? masterBirdIds : activeCategory === 'insects' ? masterInsectIds : activeCategory === 'fishing' ? masterFishIds : (activeCategory as string) === 'ocean_cleaning' ? masterOceanCleaningIds : masterFoodIds).has(item.id)}
                        onToggleMaster={() => toggleMaster(item.id)}
                        isFavorite={favorites[item.id] || false}
                        onToggleFavorite={() => toggleFavorite(item.id)}
                        rating={ratings[item.name] || 0}
                        onRate={(name, r) => handleRate(item.id, name, r)}
                        hidePrices={!showPrices}
                        currentHour={currentHour}
                        currentGameWeather={currentGameWeather}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      )}

      {/* Filter Section Area */}
      <section ref={filterRef} className="relative">
        {openMobileFilter && (
          <div className="fixed inset-0 z-[50] bg-slate-900/5 backdrop-blur-[0.5px]" onClick={() => setOpenMobileFilter(null)} />
        )}
        
        {/* Sticky Header: Search Bar + Filter Content */}
        <div ref={searchHeaderRef} className={cn(
          "sticky top-[var(--sticky-top-mobile,56px)] lg:top-[var(--sticky-top-desktop,0px)] -mx-4 sm:-mx-6 md:-mx-8 bg-neutral-50/95 dark:bg-stone-955/95 backdrop-blur-md px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-3 border-b border-stone-200/35 dark:border-stone-900/40 shadow-xs font-scale-lock",
          openMobileFilter ? "z-[70]" : "z-[50]"
        )}>
          <div className="max-w-[1240px] mx-auto w-full px-2 sm:px-4 lg:px-6">
            <div className="rounded-2xl sm:rounded-[32px] border border-stone-200/40 dark:border-stone-800/50 bg-white dark:bg-stone-900 shadow-xl shadow-neutral-200/30 dark:shadow-none overflow-visible">
              
              {/* Search & Status Bar */}
              <div className="p-2 sm:p-4 flex items-center gap-2 sm:gap-3 w-full">
                <div className="relative flex-1 group overflow-hidden h-[40px] sm:h-[42px]">
                  <Search className={cn(
                    "absolute left-3.5 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors z-10",
                    searchQuery ? "text-slate-900 dark:text-stone-100" : "text-neutral-400 dark:text-stone-550 group-focus-within:text-slate-900 dark:group-focus-within:text-stone-100"
                  )} />
                  <input 
                    type="text" 
                    placeholder="검색어를 입력해주세요"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-full rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-955 pl-11 xs:pl-12 pr-11 xs:pr-12 py-2 sm:py-3 text-[12.5px] xs:text-[13.5px] sm:text-[15px] focus:border-slate-900 dark:focus:border-stone-600 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-stone-600/10 transition-all font-semibold text-neutral-900 dark:text-stone-100 placeholder:text-[11px] xs:placeholder:text-[12.5px] sm:placeholder:text-[14.5px] placeholder:text-stone-300 dark:placeholder:text-stone-550"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-850 text-stone-400 transition-colors cursor-pointer z-10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab(activeTab === 'all' ? 'favorites' : 'all')}
                    className={cn(
                      "h-[40px] sm:h-[42px] px-2.5 sm:px-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 font-bold text-[11px] sm:text-[13px] transition-all cursor-pointer shrink-0 border",
                      activeTab === 'favorites'
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20 border border-rose-500"
                        : "bg-white dark:bg-stone-900 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 shadow-sm"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", activeTab === 'favorites' ? "fill-current" : "")} />
                    <span className="hidden sm:inline">즐겨찾기</span>
                  </button>

                  {/* Filters */}
                  <div className="flex items-center gap-2">
                      <EncyclopediaFilterDropdown
                      collectionFilter={collectionFilter}
                      setCollectionFilter={setCollectionFilter}
                      isSeasonFilterEnabled={isSeasonFilterEnabled}
                      setIsSeasonFilterEnabled={setIsSeasonFilterEnabled}
                      selectedSeasonFilters={selectedSeasonFilters}
                      setSelectedSeasonFilters={setSelectedSeasonFilters}
                      starFilter={starFilter}
                      setStarFilter={setStarFilter}
                      masterFilter={masterFilter}
                      setMasterFilter={setMasterFilter}
                      activeCategory={activeCategory}
                      showPrices={showPrices}
                      setShowPrices={setShowPrices}
                    />
                  </div>
                </div>
                



              </div>

              {/* Sub-bar: Desktop and Mobile Filters Bar */}
              {activeCategory !== 'ocean_cleaning' && (
                <div className={cn(
                  "border-t border-neutral-200/55 dark:border-stone-800 bg-neutral-50/80 dark:bg-stone-900 rounded-b-2xl sm:rounded-b-[32px] transition-all duration-300 ease-out z-40",
                  openMobileFilter ? "overflow-visible max-h-none" : "overflow-hidden",
                  shouldShowCompact 
                    ? cn("block opacity-100 translate-y-0", openMobileFilter ? "max-h-none" : "max-h-40") 
                    : "opacity-100 max-h-40 translate-y-0 md:opacity-0 md:max-h-0 md:-translate-y-1 md:pointer-events-none"
                )}>
                
                <div className="relative py-2 sm:py-3 px-3 sm:px-4">
                  <div className="flex flex-col gap-2.5 max-w-[1240px] mx-auto w-full">
                    <div className="flex flex-row flex-wrap items-center gap-1.5 w-full justify-start overflow-visible">
                    {activeCategory === 'cooking' ? (
                      <>
                        <div className={cn(
                          "relative flex-1 lg:flex-none lg:w-[110px] xl:w-36",
                          openMobileFilter === 'cooking_type' ? "z-[130]" : "z-[10]"
                        )}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMobileFilter(openMobileFilter === 'cooking_type' ? null : 'cooking_type');
                            }}
                            className={cn(
                              "w-full h-9 flex items-center justify-center gap-1.5 px-1.5 sm:px-2 py-1.5 rounded-xl border text-[10px] xs:text-[11px] font-bold transition-all shadow-xs cursor-pointer",
                              openMobileFilter === 'cooking_type' || selectedCookingTypes.length > 0
                                ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900 dark:hover:bg-stone-100" 
                                : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:bg-stone-850 dark:border-stone-700/80 dark:text-stone-400 dark:hover:bg-stone-800"
                            )}
                          >
                            <span className="truncate">{selectedCookingTypes.length === 0 ? '요리' : `요리(${selectedCookingTypes.length})`}</span>
                            <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform duration-300", openMobileFilter === 'cooking_type' && "rotate-180")} />
                          </button>
                          <AnimatePresence>
                            {openMobileFilter === 'cooking_type' && (
                              <motion.div 
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 w-[180px] mt-1.5 bg-white dark:bg-stone-900 border border-neutral-200/80 dark:border-stone-800 rounded-xl shadow-xl z-[100] p-1.5 space-y-0.5"
                              >
                                {[
                                  { value: 'jam_sauce', label: '잼' },
                                  { value: 'mushroom', label: '버섯 요리' },
                                  { value: 'meal', label: '식사' },
                                  { value: 'dessert', label: '케이크' },
                                  { value: 'drink_tea', label: '음료' },
                                  { value: 'set_menu', label: '세트메뉴' },
                                ].map(opt => (
                                  <button 
                                    key={opt.value} 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setSelectedCookingTypes(prev => prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]); 
                                    }}
                                    className={cn(
                                      "w-full text-left px-2.5 py-2 text-[10.5px] font-bold rounded-lg transition-all flex items-center justify-between cursor-pointer", 
                                      selectedCookingTypes.includes(opt.value) 
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-stone-900 shadow-xs" 
                                        : "text-neutral-600 dark:text-stone-300 hover:bg-neutral-50 dark:hover:bg-stone-800"
                                    )}
                                  >
                                    <span>{opt.label}</span>
                                    {selectedCookingTypes.includes(opt.value) && <Check className="h-3 w-3 shrink-0" />}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className={cn(
                          "relative flex-1 lg:flex-none lg:w-[90px] xl:w-32",
                          openMobileFilter === 'cooking_level' ? "z-[130]" : "z-[10]"
                        )}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMobileFilter(openMobileFilter === 'cooking_level' ? null : 'cooking_level');
                            }}
                            className={cn(
                              "w-full h-9 flex items-center justify-center gap-1.5 px-1.5 sm:px-2 py-1.5 rounded-xl border text-[10px] xs:text-[11px] font-bold transition-all shadow-xs cursor-pointer",
                              openMobileFilter === 'cooking_level' || selectedLevels.length > 0
                                ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900 dark:hover:bg-stone-100" 
                                : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:bg-stone-850 dark:border-stone-700/80 dark:text-stone-400 dark:hover:bg-stone-800"
                            )}
                          >
                            <span className="truncate">{selectedLevels.length === 0 ? '레벨' : `레벨(${selectedLevels.length})`}</span>
                            <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform duration-300", openMobileFilter === 'cooking_level' && "rotate-180")} />
                          </button>
                          <AnimatePresence>
                            {openMobileFilter === 'cooking_level' && (
                              <motion.div 
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 sm:left-0 w-[200px] mt-1.5 bg-white dark:bg-stone-900 border border-neutral-200/80 dark:border-stone-800 rounded-2xl shadow-xl z-[100] p-4"
                              >
                                <div className="grid grid-cols-4 gap-2">
                                  {currentLevelRange.map(lv => (
                                    <button 
                                      key={lv} 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setSelectedLevels(prev => prev.includes(lv) ? prev.filter(l => l !== lv) : [...prev, lv]); 
                                      }}
                                      className={cn(
                                        "h-10 w-full rounded-xl text-[12px] font-black border transition-all flex items-center justify-center cursor-pointer shadow-sm", 
                                        selectedLevels.includes(lv) 
                                          ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-stone-900" 
                                          : "bg-white dark:bg-stone-850 text-stone-400 dark:text-stone-550 border-stone-100 dark:border-stone-800 hover:border-slate-300"
                                      )}
                                    >
                                      {lv}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="hidden lg:flex relative flex-none z-[10] min-w-[130px]">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowPrices(prev => !prev); }}
                            className={cn(
                              "w-full h-9 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] xs:text-[11px] font-bold transition-all shadow-xs cursor-pointer select-none",
                              showPrices 
                                ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900" 
                                : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:bg-stone-850 dark:border-stone-700/80 dark:text-stone-400 dark:hover:bg-stone-800"
                            )}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Tag className="h-3.5 w-3.5 shrink-0" />
                              <span>{showPrices ? "판매가 숨기기" : "판매가 전체 보기"}</span>
                            </span>
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              showPrices 
                                ? "bg-white dark:bg-stone-900" 
                                : "bg-stone-300 dark:bg-stone-600"
                            )} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {activeCategory === 'birds' && (
                          <div className="relative flex-1 sm:flex-none lg:w-[90px] xl:w-28 z-[10]">
                            <button
                              type="button"
                              onClick={() => setFilterByFiveStar(prev => !prev)}
                              className={cn(
                                "w-full h-9 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] xs:text-[11px] font-bold transition-all shadow-xs cursor-pointer select-none whitespace-nowrap",
                                filterByFiveStar 
                                  ? "bg-amber-500 border-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:border-amber-600 dark:hover:bg-amber-700 text-white shadow-xs" 
                                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:bg-stone-850 dark:border-stone-700/80 dark:text-stone-300 dark:hover:bg-stone-800"
                              )}
                            >
                              {filterByFiveStar ? (
                                <Star className="h-3.5 w-3.5 fill-amber-200 text-amber-200 dark:fill-amber-300 dark:text-amber-300 animate-pulse" />
                              ) : (
                                <BirdIcon className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                              )}
                              <span>{filterByFiveStar ? "5성조건" : "일반조건"}</span>
                            </button>
                          </div>
                        )}
                        <div className={cn(
                          "relative flex-1 sm:flex-none lg:w-[90px] xl:w-28",
                          openMobileFilter === 'weather' ? "z-[130]" : "z-[10]"
                        )}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMobileFilter(openMobileFilter === 'weather' ? null : 'weather');
                            }}
                            className={cn(
                              "w-full h-9 flex items-center justify-between px-1.5 sm:px-2 py-1.5 rounded-xl border text-[10px] xs:text-[11px] font-bold transition-all shadow-xs cursor-pointer",
                              openMobileFilter === 'weather' || selectedWeathers.length > 0
                                ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900 dark:hover:bg-stone-100" 
                                : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:bg-stone-850 dark:border-stone-700/80 dark:text-stone-400"
                            )}
                          >
                            <span className="truncate">{selectedWeathers.length === 0 ? '날씨' : `날씨(${selectedWeathers.length})`}</span>
                            <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform duration-300", openMobileFilter === 'weather' && "rotate-180")} />
                          </button>
                          <AnimatePresence>
                            {openMobileFilter === 'weather' && (
                              <motion.div 
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 w-[160px] mt-1.5 bg-white dark:bg-stone-900 border border-neutral-200/80 dark:border-stone-800 rounded-xl shadow-xl z-[100] p-1.5 space-y-1"
                              >
                                {weatherOptions.map(w => (
                                  <button 
                                    key={w} 
                                    onClick={(e) => { e.stopPropagation(); handleWeatherFilterClick(w as GameWeather); }}
                                    className={cn(
                                      "w-full text-left px-2.5 py-2 text-[10.5px] font-bold rounded-lg transition-all flex items-center justify-between cursor-pointer", 
                                      selectedWeathers.includes(w as GameWeather) ? "bg-sky-600 text-white shadow-sm" : "text-neutral-600 dark:text-stone-300 hover:bg-neutral-50 dark:hover:bg-stone-800"
                                    )}
                                  >
                                    <span>{formatWeatherValue(w)}</span>
                                    {selectedWeathers.includes(w as GameWeather) && <Check className="h-3 w-3" />}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className={cn(
                          "relative flex-1 sm:flex-none lg:w-[90px] xl:w-28",
                          openMobileFilter === 'time' ? "z-[130]" : "z-[10]"
                        )}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMobileFilter(openMobileFilter === 'time' ? null : 'time');
                            }}
                            className={cn(
                              "w-full h-9 flex items-center justify-between px-1.5 sm:px-2 py-1.5 rounded-xl border text-[10px] xs:text-[11px] font-bold transition-all shadow-xs cursor-pointer",
                              openMobileFilter === 'time' || selectedTimeBlocks.length > 0 
                                ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900 dark:hover:bg-stone-100" 
                                : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:bg-stone-850 dark:border-stone-700/80 dark:text-stone-400"
                            )}
                          >
                            <span className="truncate">{selectedTimeBlocks.length === 0 ? '시간' : `시간(${selectedTimeBlocks.length})`}</span>
                            <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform duration-300", openMobileFilter === 'time' && "rotate-180")} />
                          </button>
                          <AnimatePresence>
                            {openMobileFilter === 'time' && (
                              <motion.div 
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-[200px] mt-1.5 bg-white dark:bg-stone-900 border border-neutral-200/80 dark:border-stone-800 rounded-[24px] shadow-2xl z-[100] p-3 space-y-2"
                              >
                                <button
                                  onClick={() => handleTimeFilterClick(alwaysBlock.value)}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[10.5px] font-black transition-all cursor-pointer",
                                    selectedTimeBlocks.includes(alwaysBlock.value) ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white dark:bg-stone-850 text-stone-500 border-stone-100 dark:border-stone-800"
                                  )}
                                >
                                  <Sparkle className={cn("h-3 w-3", selectedTimeBlocks.includes(alwaysBlock.value) ? "text-amber-500" : "text-stone-300")} />
                                  <span>{alwaysBlock.label}</span>
                                </button>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {[...amBlocks, ...pmBlocks].map((b) => (
                                    <button 
                                      key={b.value} onClick={() => handleTimeFilterClick(b.value)} 
                                      className={cn(
                                        "px-2 py-2.5 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all gap-0.5",
                                        selectedTimeBlocks.includes(b.value) 
                                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                                          : "bg-white dark:bg-stone-850 text-stone-600 dark:text-stone-400 border-stone-100 dark:border-stone-800 hover:bg-stone-50"
                                      )}
                                    >
                                      <span className="text-[12px] font-black">{b.label}</span>
                                      <span className={cn("text-[9.5px] font-bold opacity-75", selectedTimeBlocks.includes(b.value) ? "text-indigo-100" : "text-stone-400")}>
                                        {b.sub}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className={cn(
                          "relative flex-1 sm:flex-none lg:w-[90px] xl:w-28",
                          openMobileFilter === 'level' ? "z-[130]" : "z-[10]"
                        )}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMobileFilter(openMobileFilter === 'level' ? null : 'level');
                            }}
                            className={cn(
                              "w-full h-9 flex items-center justify-between px-1.5 sm:px-2 py-1.5 rounded-xl border text-[10px] xs:text-[11px] font-bold transition-all shadow-xs cursor-pointer",
                              openMobileFilter === 'level' || selectedLevels.length > 0
                                ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900 dark:hover:bg-stone-100" 
                                : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:bg-stone-850 dark:border-stone-700/80 dark:text-stone-400"
                            )}
                          >
                            <span className="truncate">{selectedLevels.length === 0 ? '레벨' : `레벨(${selectedLevels.length})`}</span>
                            <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform duration-300", openMobileFilter === 'level' && "rotate-180")} />
                          </button>
                          <AnimatePresence>
                            {openMobileFilter === 'level' && (
                              <motion.div 
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 sm:left-0 w-[200px] mt-1.5 bg-white dark:bg-stone-900 border border-neutral-200/80 dark:border-stone-800 rounded-2xl shadow-xl z-[100] p-4"
                              >
                                <div className="grid grid-cols-4 gap-2">
                                  {currentLevelRange.map(lv => (
                                    <button 
                                      key={lv} onClick={() => setSelectedLevels(prev => prev.includes(lv) ? prev.filter(l => l !== lv) : [...prev, lv])}
                                      className={cn(
                                        "h-10 w-full rounded-xl text-[12px] font-black border transition-all flex items-center justify-center cursor-pointer shadow-sm", 
                                        selectedLevels.includes(lv) 
                                          ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-stone-900" 
                                          : "bg-white dark:bg-stone-850 text-stone-400 dark:text-stone-500 border-stone-100 dark:border-stone-800 hover:border-slate-300"
                                      )}
                                    >
                                      {lv}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className={cn(
                          "sm:relative flex-1 sm:flex-none lg:w-[90px] xl:w-28",
                          openMobileFilter === 'location_nested' ? "z-[130]" : "z-[10]"
                        )}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMobileFilter !== 'location_nested') {
                                setOpenMobileFilter('location_nested');
                                setSelectedMobileMainLocation(null);
                              } else {
                                setOpenMobileFilter(null);
                              }
                            }}
                            className={cn(
                              "w-full h-9 flex items-center justify-between px-1.5 sm:px-2 py-1.5 rounded-xl border text-[10px] xs:text-[11px] font-bold transition-all shadow-xs cursor-pointer",
                              openMobileFilter === 'location_nested' || selectedLocations.length > 0
                                ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900 dark:hover:bg-stone-100" 
                                : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:bg-stone-850 dark:border-stone-700/80 dark:text-stone-400"
                            )}
                          >
                            <span className="truncate">{selectedLocations.length === 0 ? '장소' : `장소(${selectedLocations.length})`}</span>
                            <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform duration-300", openMobileFilter === 'location_nested' && "rotate-180")} />
                          </button>
                          <AnimatePresence>
                            {openMobileFilter === 'location_nested' && (
                              <motion.div 
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-3 right-3 sm:left-auto sm:right-0 sm:translate-x-0 w-auto sm:w-[350px] mt-1.5 bg-white dark:bg-stone-900 border border-neutral-200/80 dark:border-stone-800 rounded-2xl shadow-2xl z-[100] flex overflow-hidden h-[280px]"
                              >
                                {/* Left: Main Categories */}
                                <div className="w-[105px] xs:w-[115px] shrink-0 border-r border-neutral-200/50 dark:border-stone-800/60 overflow-y-auto overscroll-contain p-1.5 xs:p-2 custom-scrollbar space-y-1 bg-stone-50/20 dark:bg-stone-900/20">
                                  <button
                                    onClick={() => {
                                      setSelectedMobileMainLocation(null);
                                    }}
                                    className={cn(
                                      "w-full text-left px-2 py-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer",
                                      selectedMobileMainLocation === null 
                                        ? "bg-slate-900 text-white dark:bg-white dark:text-stone-900 shadow-sm" 
                                        : "text-stone-400 dark:text-stone-500 hover:text-slate-900 dark:hover:text-stone-200"
                                    )}
                                  >
                                    <span className="text-[10.5px] font-black truncate mr-0.5">전체 보기</span>
                                    <ChevronRight className={cn("h-3 w-3 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5", selectedMobileMainLocation === null && "opacity-100")} />
                                  </button>
                                  {locationGroups.map(group => {
                                    const count = group.subs.filter(s => selectedLocations.includes(s)).length;
                                    return (
                                      <button
                                        key={group.main}
                                        onClick={() => {
                                          setSelectedMobileMainLocation(group.main);
                                        }}
                                        className={cn(
                                          "w-full text-left px-2 py-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer",
                                          selectedMobileMainLocation === group.main 
                                            ? "bg-slate-900 text-white dark:bg-white dark:text-stone-900 shadow-sm" 
                                            : "text-stone-400 dark:text-stone-500 hover:text-slate-900 dark:hover:text-stone-200"
                                        )}
                                      >
                                        <span className="text-[10.5px] font-black truncate mr-0.5">{group.main}</span>
                                        {count > 0 ? (
                                          <span className={cn(
                                            "h-4 px-1.5 rounded-full text-[8.5px] font-black flex items-center justify-center min-w-[16px] shrink-0",
                                            selectedMobileMainLocation === group.main ? "bg-white text-slate-900 dark:bg-stone-900 dark:text-white" : "bg-blue-600 text-white"
                                          )}>{count}</span>
                                        ) : (
                                          <ChevronRight className={cn("h-3 w-3 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5", selectedMobileMainLocation === group.main && "opacity-100")} />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                {/* Right: Sub Categories */}
                                <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-2 bg-stone-50/10 dark:bg-stone-950/20">
                                  <div className="flex flex-col gap-1">
                                    {!selectedMobileMainLocation ? (
                                      <>
                                        <div className="flex items-center justify-between px-1.5 xs:px-2 mb-2 gap-1">
                                          <span className="text-[10px] font-black text-stone-400 shrink-0">전체 보기</span>
                                          <div className="flex items-center gap-1.5 overflow-hidden shrink-0">
                                            {selectedLocations.length > 0 && (
                                              <button
                                                onClick={() => setIncludeCommon(prev => !prev)}
                                                className={cn(
                                                  "px-1.5 py-0.5 rounded text-[8.5px] font-extrabold transition-colors border cursor-pointer whitespace-nowrap shrink-0",
                                                  includeCommon
                                                    ? "bg-stone-50 border-stone-200 text-stone-400 dark:bg-stone-850 dark:border-stone-800"
                                                    : "bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500 font-black shadow-xs"
                                                )}
                                              >
                                                {`이 지역의 ${categoryNoun}만 보기`}
                                              </button>
                                            )}
                                            <button onClick={() => setSelectedLocations([])} className="text-[9px] font-bold text-blue-500 cursor-pointer shrink-0">초기화</button>
                                          </div>
                                        </div>
                                        {sortSubLocations(
                                          Array.from(new Set(locationGroups.flatMap(g => g.subs) as string[]))
                                        ).filter(sub => !CATCH_ALL_LOCATIONS.includes(sub))
                                         .map(sub => {
                                            const isActive = selectedLocations.includes(sub);
                                            return (
                                              <button
                                                key={`all-${sub}`}
                                                onClick={() => setSelectedLocations(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub])}
                                                className={cn(
                                                  "w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer",
                                                  isActive 
                                                    ? "bg-blue-600/10 text-blue-600 dark:bg-blue-900/20" 
                                                    : "text-slate-900 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800"
                                                )}
                                              >
                                                <span className="text-[12px] font-black">{sub}</span>
                                                {isActive && <Check className="h-3 w-3" />}
                                              </button>
                                            );
                                          })}
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex items-center justify-between px-1.5 xs:px-2 mb-2 gap-1">
                                          <span className="text-[10px] font-black text-stone-400 truncate max-w-[60px] xs:max-w-[80px] shrink-0">{selectedMobileMainLocation}</span>
                                          <div className="flex items-center gap-1.5 overflow-hidden shrink-0">
                                            {selectedLocations.length > 0 && (
                                              <button
                                                onClick={() => setIncludeCommon(prev => !prev)}
                                                className={cn(
                                                  "px-1.5 py-0.5 rounded text-[8.5px] font-extrabold transition-colors border cursor-pointer whitespace-nowrap shrink-0",
                                                  includeCommon
                                                    ? "bg-stone-50 border-stone-200 text-stone-400 dark:bg-stone-850 dark:border-stone-800"
                                                    : "bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500 font-black shadow-xs"
                                                )}
                                              >
                                                {`이 지역의 ${categoryNoun}만`}
                                              </button>
                                            )}
                                            <button onClick={() => setSelectedLocations([])} className="text-[9px] font-bold text-blue-500 cursor-pointer shrink-0">초기화</button>
                                          </div>
                                        </div>
                                        {(locationGroups.find(g => g.main === selectedMobileMainLocation)?.subs || [])
                                          .filter(sub => !CATCH_ALL_LOCATIONS.includes(sub))
                                          .map(sub => {
                                          const isActive = selectedLocations.includes(sub);
                                          return (
                                            <button
                                              key={sub}
                                              onClick={() => setSelectedLocations(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub])}
                                              className={cn(
                                                "w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer",
                                                isActive 
                                                  ? "bg-blue-600/10 text-blue-600 dark:bg-blue-900/20" 
                                                  : "text-slate-900 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800"
                                              )}
                                            >
                                              <span className="text-[12px] font-black">{sub}</span>
                                              {isActive && <Check className="h-3 w-3" />}
                                            </button>
                                          );
                                        })}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="hidden lg:flex relative flex-none z-[10] min-w-[120px] justify-center items-center shrink-0">
                          <button
                            onClick={() => setShowPrices(prev => !prev)}
                            className={cn(
                              "w-full h-9 flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] xs:text-[11px] font-bold transition-all shadow-xs cursor-pointer select-none",
                              showPrices 
                                ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-stone-900" 
                                : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:bg-stone-850 dark:border-stone-700/80 dark:text-stone-400 dark:hover:bg-stone-800"
                            )}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <DollarSign className="h-3.5 w-3.5 shrink-0" />
                              <span>{showPrices ? "판매가 숨기기" : "판매가 전체 보기"}</span>
                            </span>
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              showPrices 
                                ? "bg-white dark:bg-stone-900" 
                                : "bg-stone-300 dark:bg-stone-600"
                            )} />
                          </button>
                        </div>
                      </>
                    )}
                    
                    <AnimatePresence>
                      {(activeCategory === 'cooking' ? (selectedCookingTypes.length > 0 || selectedLevels.length > 0) : (selectedWeathers.length > 0 || selectedLevels.length > 0 || selectedTimeBlocks.length > 0 || selectedLocations.length > 0 || showPrices)) && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} 
                          onClick={resetFilters}
                          className="h-9 w-9 shrink-0 bg-slate-900 dark:bg-white text-white dark:text-stone-900 rounded-xl flex items-center justify-center shadow-lg hover:bg-slate-800 dark:hover:bg-stone-100 transition-colors"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Removed bulky redundant bottom-aligned switch to save vertical space */}
                </div>
              </div>
                
                {/* Sub-bar end */}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* PC Expanded Filter Panel */}
        {activeCategory !== 'ocean_cleaning' && (
          <div ref={largeFilterPanelRef} className="hidden md:block -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
            <AnimatePresence>
              {isFilterExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 text-stone-900 dark:text-stone-100 max-w-[1240px] mx-auto w-full px-2 sm:px-4 lg:px-6">
                  <div className="relative p-3 sm:p-5 rounded-2xl sm:rounded-[32px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl shadow-stone-200/30 dark:shadow-none min-h-[280px] flex items-center">
                    <AnimatePresence mode="wait" initial={false}>
                      {filterPage === 0 ? (
                        <motion.div
                          key="expanded-p0"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="w-full py-2 sm:py-0"
                        >
                          {activeCategory === 'birds' && (
                            <div className="mb-5 pb-5 border-b border-stone-100 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                  <h4 className="text-[14px] sm:text-[15.5px] font-black text-slate-900 dark:text-stone-100 tracking-tight">새 도감 필터 기준 설정</h4>
                                </div>
                                <p className="text-[11px] sm:text-[11.5px] font-semibold text-stone-400 dark:text-stone-500 max-w-2xl leading-relaxed">
                                  {filterByFiveStar 
                                    ? "5성 조건(날씨/레벨/시간)에 따라 필터됩니다." 
                                    : "일반 출현 조건(날씨/레벨/시간)에 따라 필터됩니다."}
                                </p>
                              </div>
                              <div className="flex items-center h-10 bg-stone-100 dark:bg-stone-950 p-0.5 rounded-xl border border-stone-200/50 dark:border-stone-800/80 shrink-0 select-none shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => setFilterByFiveStar(false)}
                                  className={cn(
                                    "h-full px-4 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                                    !filterByFiveStar
                                      ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100 shadow-xs border border-stone-200/20 dark:border-stone-700/30"
                                      : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400"
                                  )}
                                >
                                  <BirdIcon className={cn("h-3.5 w-3.5", !filterByFiveStar ? "text-sky-500 dark:text-sky-400 animate-pulse" : "text-stone-400 dark:text-stone-500")} />
                                  일반 출현 필터
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFilterByFiveStar(true)}
                                  className={cn(
                                    "h-full px-4 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                                    filterByFiveStar
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400"
                                  )}
                                >
                                  <Star className={cn("h-3.5 w-3.5", filterByFiveStar ? "fill-amber-200 text-amber-200 dark:fill-amber-300 dark:text-amber-300 animate-pulse" : "text-stone-400 dark:text-stone-500")} />
                                  5성 조건 필터
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                            {activeCategory === 'cooking' ? (
                              <>
                                <div className="space-y-3 sm:space-y-4">
                                  <div className="flex items-center gap-3.5">
                                    <div className="h-10 w-10 rounded-2xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                                      <Soup className="h-5.5 w-5.5" />
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-[14px] sm:text-[15.5px] font-black text-slate-900 dark:text-stone-100 tracking-tight">요리 종류</p>
                                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Cooking Type</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {[
                                      { value: 'jam_sauce', label: '잼' },
                                      { value: 'mushroom', label: '버섯 요리' },
                                      { value: 'meal', label: '식사' },
                                      { value: 'dessert', label: '케이크' },
                                      { value: 'drink_tea', label: '음료' },
                                      { value: 'set_menu', label: '세트메뉴' },
                                    ].map(opt => (
                                      <button
                                        key={opt.value}
                                        onClick={() => setSelectedCookingTypes(prev => prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value])}
                                        className={cn(
                                          "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs font-black transition-all cursor-pointer",
                                          selectedCookingTypes.includes(opt.value) 
                                            ? "bg-slate-900 text-white border-slate-900 shadow-lg ring-4 ring-slate-900/10 dark:bg-white dark:text-stone-900 dark:border-white" 
                                            : "bg-stone-50 dark:bg-stone-850 text-stone-400 dark:text-stone-400 border-stone-100 dark:border-stone-800/80 hover:border-stone-300 hover:bg-white dark:hover:bg-stone-800 dark:hover:border-stone-700"
                                        )}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-3 sm:space-y-4 md:border-x md:border-stone-100 md:dark:border-stone-800 md:px-6 px-1">
                                  <div className="flex items-center gap-3.5">
                                    <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                      <Star className="h-5.5 w-5.5" />
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-[14px] sm:text-[15.5px] font-black text-slate-900 dark:text-stone-100 tracking-tight">요리 레벨</p>
                                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Cooking Level</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-6 gap-1.5 ">
                                    {currentLevelRange.map(lv => (
                                      <button
                                        key={lv}
                                        onClick={() => setSelectedLevels(prev => prev.includes(lv) ? prev.filter(l => l !== lv) : [...prev, lv])}
                                        className={cn(
                                          "h-10 w-10 rounded-xl flex items-center justify-center text-[12px] font-black border transition-all cursor-pointer",
                                          selectedLevels.includes(lv) 
                                            ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105 dark:bg-white dark:text-stone-900 dark:border-white" 
                                            : "bg-stone-50 dark:bg-stone-850 text-stone-400 dark:text-stone-400 border-stone-100/80 dark:border-stone-800/85 hover:border-stone-300 hover:bg-white dark:hover:bg-stone-800 dark:hover:border-stone-700"
                                        )}
                                      >
                                        {lv}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                  <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                                        <Info className="h-4.5 w-4.5" />
                                      </div>
                                      <div className="space-y-0.5">
                                        <p className="text-[10.5px] font-black text-slate-900 dark:text-stone-100 tracking-tight font-sans">컬렉션 도움말</p>
                                        <p className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Guide</p>
                                      </div>
                                    </div>
                                    <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 leading-relaxed pl-1">
                                      요리에 필요한 재료는 카드 상세 정보에서 확인할 수 있습니다. 5성 달성 여부를 체크하여 도감을 완성해 보세요.
                                    </p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="space-y-3 sm:space-y-4">
                                  <div className="flex items-center gap-3.5">
                                    <div className="h-10 w-10 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                                      <CloudRain className="h-5.5 w-5.5" />
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-[14px] sm:text-[15.5px] font-black text-slate-900 dark:text-stone-100 tracking-tight">등장 날씨</p>
                                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Weather Condition</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {weatherOptions.map(w => (
                                      <button
                                        key={w}
                                        onClick={() => handleWeatherFilterClick(w as GameWeather)}
                                        className={cn(
                                          "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs font-black transition-all cursor-pointer",
                                          selectedWeathers.includes(w as GameWeather) 
                                            ? "bg-slate-900 text-white border-slate-900 shadow-lg ring-4 ring-slate-900/10 dark:bg-white dark:text-stone-900 dark:border-white" 
                                            : "bg-stone-50 dark:bg-stone-850 text-stone-400 dark:text-stone-400 border-stone-100 dark:border-stone-800/80 hover:border-stone-300 hover:bg-white dark:hover:bg-stone-800 dark:hover:border-stone-700"
                                        )}
                                      >
                                        {w === 'Always' ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : w === 'Clear/Rainbow' ? <Sun className="h-3.5 w-3.5 text-orange-500" /> : w === 'Rain/Snow/Rainbow' ? <CloudRain className="h-3.5 w-3.5 text-blue-500" /> : <RainbowIcon className="h-3.5 w-3.5 text-indigo-500" />}
                                        {formatWeatherValue(w)}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-3 sm:space-y-4 md:border-x md:border-stone-100 md:dark:border-stone-800 md:px-6 px-1">
                                  <div className="flex items-center gap-3.5">
                                    <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                      <Star className="h-5.5 w-5.5" />
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-[14px] sm:text-[15.5px] font-black text-slate-900 dark:text-stone-100 tracking-tight"> 레벨</p>
                                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Minimum Level</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-6 gap-1.5 ">
                                    {currentLevelRange.map(lv => (
                                      <button
                                        key={lv}
                                        onClick={() => setSelectedLevels(prev => prev.includes(lv) ? prev.filter(l => l !== lv) : [...prev, lv])}
                                        className={cn(
                                          "h-10 rounded-xl flex items-center justify-center text-[12px] font-black border transition-all cursor-pointer",
                                          selectedLevels.includes(lv) 
                                            ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105 dark:bg-white dark:text-stone-900 dark:border-white" 
                                            : "bg-stone-50 dark:bg-stone-850 text-stone-400 dark:text-stone-400 border-stone-100 dark:border-stone-800/80 hover:border-stone-300 hover:bg-white dark:hover:bg-stone-800 dark:hover:border-stone-700"
                                        )}
                                      >
                                        {lv}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-3 sm:space-y-4 md:px-4">
                                  <div className="flex items-center gap-3.5">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                      <Clock className="h-5.5 w-5.5" />
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-[14px] sm:text-[15.5px] font-black text-slate-900 dark:text-stone-100 tracking-tight">등장 시간</p>
                                      <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Time Slots</p>
                                    </div>
                                  </div>
                                  
                                  <div className={cn("space-y-3 sm:space-y-4", !isTimeFilterNeeded && "opacity-30 grayscale pointer-events-none")}>
                                    <button
                                      onClick={() => handleTimeFilterClick(alwaysBlock.value)}
                                      className={cn(
                                        "w-full flex items-center justify-between px-4 py-2 rounded-xl border text-[11px] font-black transition-all cursor-pointer",
                                        selectedTimeBlocks.includes(alwaysBlock.value)
                                          ? "bg-slate-900 text-white border-slate-900 shadow-md dark:bg-white dark:text-stone-900 dark:border-white"
                                          : "bg-stone-50 dark:bg-stone-850 text-stone-400 dark:text-stone-400 border-stone-100 dark:border-stone-800/80 hover:border-stone-300 hover:bg-white dark:hover:bg-stone-800 dark:hover:border-stone-700"
                                      )}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <Sparkle className={cn("h-3.5 w-3.5", selectedTimeBlocks.includes(alwaysBlock.value) ? "text-white dark:text-stone-900" : "text-amber-500")} />
                                        <span>{alwaysBlock.label}</span>
                                      </div>
                                      {selectedTimeBlocks.includes(alwaysBlock.value) && <Check className="h-3.5 w-3.5" />}
                                    </button>

                                    <div className="grid grid-cols-2 gap-2">
                                      {[...amBlocks, ...pmBlocks].map((b) => {
                                        const isActive = selectedTimeBlocks.includes(b.value);
                                        return (
                                          <button 
                                            key={b.value} 
                                            onClick={() => handleTimeFilterClick(b.value)} 
                                            className={cn(
                                              "px-2 py-2 text-[11.5px] font-black rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer",
                                              isActive 
                                                ? "bg-slate-900 text-white border-slate-900 shadow-md dark:bg-white dark:text-stone-900 dark:border-white" 
                                                : "bg-stone-50 dark:bg-stone-850 text-slate-500 dark:text-stone-400 border-stone-100 dark:border-stone-800/80 hover:border-stone-200 hover:bg-white dark:hover:bg-stone-800 dark:hover:border-stone-700"
                                            )}
                                          >
                                            <span className="text-[12.5px] font-black">{b.label}</span>
                                            <span className={cn("text-[10px] font-bold", isActive ? "text-slate-300 dark:text-stone-500" : "text-stone-400 dark:text-stone-500")}>
                                              {b.sub}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="expanded-p1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                          className="w-full h-full flex flex-col"
                        >
                          <div className="flex flex-col md:flex-row h-full w-full">
                            {/* Left: Main Categories with Header */}
                            <div className="w-full md:w-[220px] flex flex-col space-y-3 sm:space-y-4 h-auto md:h-full pr-0 md:pr-5 pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-neutral-200/50 dark:border-stone-800/60">
                               <div className="flex items-center gap-3.5 mb-3 md:mb-5 shrink-0">
                                <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                  <MapPin className="h-5.5 w-5.5" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[14px] sm:text-[15.5px] font-black text-slate-900 dark:text-stone-100 tracking-tight">장소 필터</p>
                                  <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Location</p>
                                </div>
                              </div>

                              <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1 pb-2 max-h-[140px] md:max-h-[220px]">
                                <button
                                  onClick={() => {
                                    setSelectedMainLocation(null);
                                  }}
                                  className={cn(
                                    "w-full px-4 py-3 rounded-2xl text-[11px] font-black text-left transition-all cursor-pointer",
                                    selectedMainLocation === null
                                      ? "bg-slate-900 text-white dark:bg-white dark:text-stone-900 shadow-md"
                                      : "text-stone-400 dark:text-stone-500 hover:text-slate-900 dark:hover:text-stone-200"
                                  )}
                                >
                                  전체 보기
                                </button>
                                {locationGroups.map(group => {
                                  const count = group.subs.filter(s => selectedLocations.includes(s)).length;
                                  return (
                                    <button
                                      key={group.main}
                                      onClick={() => {
                                        setSelectedMainLocation(group.main);
                                      }}
                                      className={cn(
                                        "w-full px-4 py-3 rounded-2xl text-[11px] font-black text-left transition-all flex items-center justify-between group cursor-pointer",
                                        selectedMainLocation === group.main
                                          ? "bg-slate-900 text-white dark:bg-white dark:text-stone-900 shadow-md"
                                          : "text-stone-400 dark:text-stone-500 hover:text-slate-900 dark:hover:text-stone-200"
                                      )}
                                    >
                                      <span>{group.main}</span>
                                      {count > 0 ? (
                                        <span className={cn(
                                          "h-4 px-1.5 rounded-full text-[9px] font-black flex items-center justify-center",
                                          selectedMainLocation === group.main ? "bg-white text-slate-900 dark:bg-stone-900 dark:text-white" : "bg-blue-600 text-white"
                                        )}>{count}</span>
                                      ) : (
                                        <ChevronRight className={cn("h-3.5 w-3.5 opacity-40 transition-transform group-hover:translate-x-0.5", selectedMainLocation === group.main && "opacity-100")} />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right: Sub Categories Bubbles */}
                            <div className="flex-1 flex flex-col pt-3 md:pt-0 md:pl-5">
                              <div className="flex items-center justify-between mb-4 md:mb-5 px-1 shrink-0">
                                <div className="space-y-0.5">
                                  <p className="text-[14px] sm:text-[15.5px] font-black text-slate-800 dark:text-stone-200">상세 지역 {selectedMainLocation && `(${selectedMainLocation})`}</p>
                                  <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Sub Locations</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedLocations.length > 0 && (
                                    <>
                                      <button
                                        onClick={() => setIncludeCommon(prev => !prev)}
                                        className={cn(
                                          "px-2.5 py-1 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all flex items-center gap-1.5 border shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                                          includeCommon
                                            ? "bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:bg-stone-850 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800"
                                            : "bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 shadow-sm"
                                        )}
                                      >
                                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", includeCommon ? "bg-stone-400 dark:bg-stone-500" : "bg-white animate-pulse")} />
                                        <span>{`이 지역의 ${categoryNoun}만 보기`}</span>
                                      </button>

                                      <button onClick={() => setSelectedLocations([])} className="text-[10px] font-bold text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer">
                                        <RefreshCcw className="h-2.5 w-2.5" />
                                        <span>초기화</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1 flex flex-col gap-3 min-h-0">
                                <div className="flex-1 flex flex-wrap content-start gap-1.5 sm:gap-2 overflow-y-auto max-h-[180px] sm:max-h-[220px] pr-2 sm:pr-4 custom-scrollbar pb-4">
                                {!selectedMainLocation ? (
                                  sortSubLocations(
                                    Array.from(new Set(locationGroups.flatMap(g => g.subs) as string[]))
                                  ).filter(sub => !CATCH_ALL_LOCATIONS.includes(sub))
                                   .map(sub => {
                                      const isActive = selectedLocations.includes(sub);
                                      return (
                                        <button
                                          key={`all-${sub}`}
                                          onClick={() => setSelectedLocations(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub])}
                                          className={cn(
                                            "px-5 py-3 rounded-2xl border text-[11px] font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm",
                                            isActive
                                              ? "bg-blue-600 border-blue-600 text-white shadow-md ring-4 ring-blue-600/10 dark:bg-blue-500 dark:border-blue-500"
                                              : "bg-white dark:bg-stone-850 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-blue-400 dark:hover:border-blue-700"
                                          )}
                                        >
                                          {sub}
                                        </button>
                                      );
                                    })
                                ) : (
                                  (locationGroups.find(g => g.main === selectedMainLocation)?.subs || [])
                                    .filter(sub => !CATCH_ALL_LOCATIONS.includes(sub))
                                    .map(sub => {
                                    const isActive = selectedLocations.includes(sub);
                                    return (
                                      <button
                                        key={sub}
                                        onClick={() => setSelectedLocations(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub])}
                                        className={cn(
                                          "px-5 py-3 rounded-2xl border text-[11px] font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm",
                                          isActive
                                            ? "bg-blue-600 border-blue-600 text-white shadow-md ring-4 ring-blue-600/10 dark:bg-blue-500 dark:border-blue-500"
                                            : "bg-white dark:bg-stone-850 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-blue-400 dark:hover:border-blue-700"
                                        )}
                                      >
                                        {sub}
                                        {isActive && <Check className="h-3.5 w-3.5" />}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Navigation Buttons (Container level for correct stacking on top of overlays) */}
                    {activeCategory !== 'cooking' && filterPage === 0 && (
                      <div className="absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20">
                        <div className="w-10 h-10 flex items-center justify-center pointer-events-auto">
                          <button
                            onClick={() => {
                              setFilterPage(1);
                              handleDismissGuide();
                            }}
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-900 dark:bg-stone-50 text-white dark:text-stone-900 shadow-xl flex items-center justify-center group transition-all hover:scale-110 active:scale-95 border-2 border-white dark:border-stone-800"
                          >
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {activeCategory !== 'cooking' && filterPage === 1 && (
                      <div className="absolute -left-2 sm:-left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20">
                        <div className="w-10 h-10 flex items-center justify-center pointer-events-auto">
                          <button
                            onClick={() => setFilterPage(0)}
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-900 dark:bg-stone-50 text-white dark:text-stone-900 shadow-xl flex items-center justify-center group transition-all hover:scale-110 active:scale-95 border-2 border-white dark:border-stone-800"
                          >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:-translate-x-0.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Location Filter Guide Overlay (PC Onboarding) */}
                    {showLocationGuide && activeCategory !== 'cooking' && filterPage === 0 && (
                      <div className="absolute inset-0 bg-white/40 dark:bg-stone-950/50 backdrop-blur-md rounded-2xl sm:rounded-[31px] hidden md:flex flex-col justify-center items-center z-10 px-6 py-8 text-center select-none border border-slate-200/50 dark:border-stone-800/50 shadow-2xl">
                        <div className="max-w-md mx-auto flex flex-col items-center space-y-4">
                          <div className="h-14 w-14 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.1)] animate-pulse">
                            <MapPin className="h-7 w-7 text-blue-600 dark:text-blue-400 animate-bounce" />
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="text-[17px] sm:text-[18.5px] font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 justify-center">
                              장소 필터가 추가되었어요!
                            </h4>
                            <p className="text-[11.5px] sm:text-[12.5px] font-semibold leading-relaxed text-slate-600 dark:text-stone-200">
                              도감별 상세 지역(온천산, 바다 등)별로 도감을 모아볼 수 있는 <span className="text-blue-600 dark:text-blue-400 font-extrabold">장소 필터</span>가 추가되었습니다.
                            </p>
                          </div>

                          <button
                            onClick={handleDismissGuide}
                            className="px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[12px] sm:text-[12.5px] font-black transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
                          >
                            <span>다시 보지 않기</span>
                          </button>
                        </div>

                        {/* Arrow Pointer pointing to the > button */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-end pointer-events-none select-none">
                          <motion.div
                            animate={{ x: [0, 6, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="flex items-center gap-1.5 mr-11 lg:mr-14"
                          >
                            <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-blue-950 px-2.5 py-1.5 rounded-xl shadow-lg ring-1 ring-blue-500/10 whitespace-nowrap">
                              여기를 클릭해 보세요!
                            </span>
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center animate-pulse border border-blue-200 dark:border-blue-500/30">
                              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                              </svg>
                            </div>
                          </motion.div>
                          
                          {/* Pulsing focal circle around the real button to highlight and clarify where to Click */}
                          <div className="absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-blue-500 animate-ping opacity-75 pointer-events-none" />
                          <div className="absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-blue-500/80 pointer-events-none shadow-[0_0_15px_rgba(59,130,246,0.35)] bg-transparent" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        <div className="mb-6" />

        {/* Results Grid Header */}
        <div className="flex items-center justify-between mb-4 pb-1 border-b border-stone-200/65 dark:border-stone-850 px-2 sm:px-4 lg:px-6 max-w-[1240px] mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-stone-100">
              {activeTab === 'favorites' ? '즐겨찾기 목록' : '도감 목록'}
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-stone-300 font-medium">총 {filteredItems.length}개</span>
          </div>
          
          <div className="flex items-center gap-2">
            {searchQuery || isSeasonFilterEnabled || selectedLevels.length > 0 || selectedTimeBlocks.length > 0 || selectedWeathers.length > 0 || selectedLocations.length > 0 || collectionFilter !== 'all' || starFilter !== 'all' || masterFilter !== 'all' || showPrices ? (
              <button 
                onClick={resetFilters}
                className="text-[10px] font-bold text-neutral-500 hover:text-neutral-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <RefreshCcw className="h-3 w-3" />
                필터 초기화
              </button>
            ) : null}
            <SortDropdown 
              sortOrder={sortOrders[activeCategory] || 'level'} 
              setSortOrder={(s) => setSortOrders(prev => ({ ...prev, [activeCategory]: s }))} 
              options={
                (['cooking', 'crops'].includes(activeCategory)) 
                ? [
                    { value: 'level', label: '레벨순' },
                    { value: 'name', label: '이름순' }
                  ]
                : [
                    { value: 'level', label: '레벨순' },
                    { value: 'name', label: '이름순' },
                    { value: 'location', label: '위치순' }
                  ]
              }
            />
          </div>
        </div>

        {/* Responsive Season Banner Button for both PC and Mobile */}
        {['birds', 'insects', 'fishing', 'cooking', 'ocean_cleaning'].includes(activeCategory) && onOpenSeasonalModal && showSeasonalBanner && (
          <div className="px-1.5 sm:px-4 lg:px-6 mb-4 w-full max-w-[1240px] mx-auto">
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
                      "시즌 이벤트 도감을 활성화하려면 선택하세요"
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

        {filteredItems.length > 0 ? (
          <motion.div 
            key="results-grid"
            layout
            className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 sm:gap-6 px-1.5 sm:px-4 lg:px-6 max-w-[1240px] mx-auto w-full select-none"
          >

            {filteredItems.map((item: any) => (
              <motion.div
                key={item.id}
                layout
                className="h-full"
              >
                <ItemCard 
                  item={item} 
                  type={activeCategory}
                  isCompleted={completedIds.has(item.id)}
                  onToggle={() => toggleCompletion(item.id)}
                  isMaster={(activeCategory === 'birds' ? masterBirdIds : activeCategory === 'insects' ? masterInsectIds : activeCategory === 'fishing' ? masterFishIds : activeCategory === 'ocean_cleaning' ? masterOceanCleaningIds : masterFoodIds).has(item.id)}
                  onToggleMaster={() => toggleMaster(item.id)}
                  isFavorite={favorites[item.id] || false}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                  rating={ratings[item.name] || 0}
                  onRate={(name, r) => handleRate(item.id, name, r)}
                  hidePrices={!showPrices}
                  currentHour={currentHour}
                  currentGameWeather={currentGameWeather}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="no-results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-stone-900 rounded-3xl border border-neutral-100 dark:border-stone-800 shadow-sm max-w-[1240px] mx-auto w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] lg:w-[calc(100%-3rem)] mb-10"
          >
            <div className="h-16 w-16 bg-neutral-50 dark:bg-stone-800 rounded-full flex items-center justify-center mb-6">
              <Search className="h-8 w-8 text-neutral-300 dark:text-stone-550" />
            </div>
            {searchQuery && filteredBySearch.length > 0 ? (
              <>
                <h4 className="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-2">필터에 의해 숨겨진 도감이 있습니다.</h4>
                <p className="text-sm text-neutral-500 dark:text-stone-400 mb-8 leading-relaxed max-w-xs mx-auto">
                  검색어와 일치하는 도감이 {filteredBySearch.length}개 있지만,<br/>
                  현재 적용된 필터 조건에 맞지 않습니다.
                </p>
                <button 
                  onClick={resetFilters}
                  className="px-6 py-3 bg-neutral-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-sm font-bold shadow-lg shadow-neutral-200 dark:shadow-none transition-transform active:scale-95 cursor-pointer"
                >
                  모든 필터 초기화
                </button>
              </>
            ) : (
              <>
                <h4 className="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-2">
                  {activeTab === 'favorites' ? '즐겨찾기한 도감이 없습니다.' : '조건에 맞는 도감이 없습니다.'}
                </h4>
                <p className="text-sm text-neutral-500 dark:text-stone-400 leading-relaxed max-w-xs mx-auto">
                  {activeTab === 'favorites' ? (
                    '도감에서 즐겨찾기를 추가해 보세요!'
                  ) : (
                    <>입력하신 조건과 일치하는<br/>도감을 찾을 수 없습니다.</>
                  )}
                </p>
              </>
            )}
          </motion.div>
        )}
      </section>
    </>
  );
}
