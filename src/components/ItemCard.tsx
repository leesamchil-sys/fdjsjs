import { useState, useEffect, SyntheticEvent, memo } from 'react';
import { COOKING } from '../data/cooking';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Bird as BirdIcon, 
  Bug, 
  Soup, 
  Sprout, 
  Fish as FishIcon, 
  Clock, 
  MapPin, 
  Star, 
  Medal, 
  CheckSquare, 
  Sparkle, 
  Sun, 
  CloudRain, 
  Cloud,
  Stars,
  Rainbow as RainbowIcon,
  Heart,
  Flame
} from 'lucide-react';
import { PriceTable, getPriceForStar } from './PriceTable';
import { Category, GameWeather } from '../types';
import { getExistingImagePath, formatWeatherValue, formatTimeValue } from '../lib/appHelpers';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SEASONAL_EVENTS, getSeasonBadgeStyle } from '../data/seasonal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatIngredient = (str: string) => {
  return str.replace('raw-', '').replace('custom-', '').replace('dog-food', '사료');
};

export const formatCookingType = (cookingType: string) => {
  const map: Record<string, string> = {
    jam_sauce: '잼',
    mushroom: '버섯 요리',
    meal: '식사',
    dessert: '케이크',
    drink_tea: '음료',
    set_menu: '세트메뉴',
  };
  return map[cookingType] || '요리';
};

const normalizeForMatching = (s: string) => {
  return s.replace(/\s+/g, '').replace(/오쟁어/g, '오징어');
};

const isIngredientMatch = (itemName: string, requiredIngredientName: string): boolean => {
  const normItem = normalizeForMatching(itemName);
  const normReq = normalizeForMatching(requiredIngredientName);
  
  if (normItem === normReq) return true;
  
  // 만약 요구되는 재료가 "아무 "로 시작한다면
  if (requiredIngredientName.startsWith('아무 ')) {
    const rootReqRaw = requiredIngredientName.substring(3); // "커피", "진주 미니케이크", "잼 오징어 구이", "잼" 등
    const rootReq = normalizeForMatching(rootReqRaw);
    
    // 1. 아무 커피: 카페라떼도 포함
    if (rootReq === '커피') {
      if (normItem.includes('커피') || normItem === '카페라떼') {
        return true;
      }
    }
    
    // 2. 일반적인 포함 관계 (예: "사과 진주 미니케이크"가 "진주 미니케이크"를 포함하는지)
    if (normItem.includes(rootReq)) {
      return true;
    }
  }
  
  return false;
};

const ALL_RECIPES = [
  ...COOKING,
  ...SEASONAL_EVENTS.flatMap(e => e.cooking || [])
];

const INGREDIENT_TO_SETS = ALL_RECIPES.reduce((acc, recipe) => {
  if (recipe.cookingType === 'set_menu') {
    recipe.ingredients.forEach(ing => {
      // "Item Name Count" 또는 "Item Name xCount" 형식 지원 유연하게 파싱
      const match = ing.match(/(.+?)\s*x?\s*(\d+)$/i);
      if (match) {
        const requiredIngredientName = match[1].trim();
        const count = parseInt(match[2]);

        // ALL_RECIPES 중 이 requiredIngredientName과 매칭되는 모든 아이템에 대해 매핑 등록
        ALL_RECIPES.forEach(item => {
          if (item.cookingType !== 'set_menu' && isIngredientMatch(item.name, requiredIngredientName)) {
            if (!acc[item.name]) acc[item.name] = [];
            
            // 중복 방지 (동일 세트메뉴가 여러 번 추가되지 않도록)
            if (!acc[item.name].some(existing => existing.setMenu === recipe.name)) {
              acc[item.name].push({ setMenu: recipe.name, count });
            }
          }
        });
      }
    });
  }
  return acc;
}, {} as Record<string, { setMenu: string, count: number }[]>);



const starColors = {
  1: {
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-800",
    text: "text-slate-600 dark:text-slate-400",
    starBg: "bg-slate-250 dark:bg-slate-800",
    starText: "text-slate-850 dark:text-slate-300",
    activeRing: "ring-2 ring-slate-400 dark:ring-slate-500",
  },
  2: {
    bg: "bg-emerald-50/50 dark:bg-emerald-950/10",
    border: "border-emerald-100 dark:border-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    starBg: "bg-emerald-100 dark:bg-emerald-900/50",
    starText: "text-emerald-800 dark:text-emerald-300",
    activeRing: "ring-2 ring-emerald-500 dark:ring-emerald-400",
  },
  3: {
    bg: "bg-sky-50/50 dark:bg-sky-950/10",
    border: "border-sky-100 dark:border-sky-900/30",
    text: "text-sky-700 dark:text-sky-450",
    starBg: "bg-sky-100 dark:bg-sky-900/50",
    starText: "text-sky-800 dark:text-sky-300",
    activeRing: "ring-2 ring-sky-500 dark:ring-sky-400",
  },
  4: {
    bg: "bg-amber-50/50 dark:bg-amber-950/10",
    border: "border-amber-100 dark:border-amber-900/30",
    text: "text-amber-700 dark:text-amber-450",
    starBg: "bg-amber-100 dark:bg-amber-900/50",
    starText: "text-amber-850 dark:text-amber-300",
    activeRing: "ring-2 ring-amber-500 dark:ring-amber-400",
  },
  5: {
    bg: "bg-rose-50/50 dark:bg-rose-950/10",
    border: "border-rose-100 dark:border-rose-900/30",
    text: "text-rose-700 dark:text-rose-450",
    starBg: "bg-rose-100 dark:bg-rose-900/50",
    starText: "text-rose-850 dark:text-rose-300",
    activeRing: "ring-2 ring-rose-500 dark:ring-rose-400",
  }
};

export interface ItemCardProps {
  key?: string | number;
  item: any;
  type: Category;
  isRecommend?: boolean;
  recommendTarget?: 'general' | 'fivestar' | 'all' | 'none';
  isCompleted?: boolean;
  onToggle?: () => void;
  isMaster?: boolean;
  onToggleMaster?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  rating: number;
  onRate: (name: string, rating: number) => void;
  hidePrices?: boolean;
  currentHour?: number;
  currentGameWeather?: GameWeather;
  onLocationClick?: (locationName: string, itemName: string) => void;
  onIngredientClick?: (ingredientName: string) => void;
}

function ItemCardComponent({ 
  item, 
  type, 
  isRecommend = false, 
  recommendTarget = 'none',
  isCompleted = false, 
  onToggle, 
  isMaster = false, 
  onToggleMaster,
  isFavorite = false,
  onToggleFavorite,
  rating, 
  onRate,
  hidePrices = false,
  currentHour,
  currentGameWeather,
  onLocationClick,
  onIngredientClick
}: ItemCardProps) {
  const maxStars = (item as any).maxStars ?? 5;
  const effectiveRating = Math.min(rating || 0, maxStars);
  const [hoverRating, setHoverRating] = useState(0);
  const [showSetMenuTooltip, setShowSetMenuTooltip] = useState(false);
  const seasonInfo = (type !== 'ocean_cleaning' && item.seasonId) ? SEASONAL_EVENTS.find(e => e.id === item.seasonId) : null;
  const badgeStyle = getSeasonBadgeStyle(item.seasonId);
  const [imgRatio, setImgRatio] = useState<'portrait' | 'landscape' | 'square'>('square');
  const [imgError, setImgError] = useState(false);
  const hasPrice = item.price !== undefined || item.fiveStarCondition?.price !== undefined;
  const [activeTab, setActiveTab] = useState<'info' | 'price'>(hidePrices ? 'info' : 'price');

  useEffect(() => {
    setActiveTab(hidePrices ? 'info' : 'price');
  }, [hidePrices]);

  const matchesTimeInternal = (slots: any[], hour: number) => {
    if (!slots) return false;
    return slots.some(slot => {
      if (slot.start < slot.end) {
        return hour >= slot.start && hour < slot.end;
      } else {
        return hour >= slot.start || hour < slot.end;
      }
    });
  };

  const matchesWeatherInternal = (itemWeather: string, contextWeather: GameWeather) => {
    if (!itemWeather) return true;
    if (itemWeather === 'Always') return false;
    const actualContextWeather = (contextWeather === 'Heatwave' || contextWeather === 'Meteor') ? 'Clear' : contextWeather;
    if (itemWeather === actualContextWeather) return true;
    if (actualContextWeather === 'Clear' && itemWeather === 'Clear/Rainbow') return true;
    if (actualContextWeather === 'RainSnow' && itemWeather === 'Rain/Snow/Rainbow') return true;
    if (actualContextWeather === 'Rainbow' && (itemWeather === 'Rainbow' || itemWeather === 'Clear/Rainbow' || itemWeather === 'Rain/Snow/Rainbow')) return true;
    return false;
  };

  const isGenMatched = currentHour !== undefined && currentGameWeather !== undefined
    ? (item.timeSlots ? matchesTimeInternal(item.timeSlots, currentHour) && matchesWeatherInternal(item.weather, currentGameWeather) : false)
    : true;

  const isFiveMatched = currentHour !== undefined && currentGameWeather !== undefined && item.fiveStarCondition
    ? (item.fiveStarCondition.timeSlots && item.fiveStarCondition.weather ? matchesTimeInternal(item.fiveStarCondition.timeSlots, currentHour) && matchesWeatherInternal(item.fiveStarCondition.weather, currentGameWeather) : false)
    : true;

  useEffect(() => {
    setImgError(false);
    setImgRatio('square');
  }, [item.imageUrl, item.name]);

  const handleImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const ratio = naturalHeight / naturalWidth;
    if (ratio > 1.25) setImgRatio('portrait');
    else if (ratio < 0.8) setImgRatio('landscape');
    else setImgRatio('square');
  };

  const isRainbow = item.weather === 'Rainbow';
  const useRainbowStyle = isRainbow;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative flex flex-col w-full overflow-hidden rounded-[32px] border transition-all duration-200",
        "hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-md",
        "select-none cursor-default",
        "min-h-[250px] sm:min-h-[260px] h-full",
        useRainbowStyle
          ? "border-zinc-300 dark:border-slate-700 bg-gradient-to-r from-rose-200/40 via-amber-200/40 via-emerald-200/40 via-sky-200/40 via-indigo-200/40 to-rose-200/40 dark:from-slate-900 dark:via-rose-900/25 dark:via-amber-900/25 dark:via-emerald-900/25 dark:via-sky-900/25 dark:via-indigo-900/25 dark:to-slate-900 bg-[length:400%_400%] animate-rainbow shadow-zinc-100/10 dark:shadow-slate-950/40 text-zinc-950 dark:text-slate-100 overflow-hidden"
          : "border-stone-200/60 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
      )}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="flex flex-col h-full pt-4 sm:pt-5 px-3 sm:px-5 pb-5 sm:pb-6.5">
        {/* 1. Header: Primary Info Badges */}
        <div className={cn(
          "flex items-center justify-between gap-0.5 border-b flex-nowrap",
          useRainbowStyle
            ? "mb-1 pb-1.5 border-zinc-300/40 dark:border-zinc-700"
            : "mb-1 pb-1.5 border-neutral-200/50 dark:border-stone-800"
        )}>
          <div className="flex items-center gap-1 shrink-0 flex-nowrap">
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider border shadow-2xs shrink-0 whitespace-nowrap",
              isRainbow
                ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800"
                : "bg-neutral-50 dark:bg-stone-800 text-neutral-400 dark:text-stone-300 border-neutral-200 dark:border-stone-700"
            )}>
              Lv.{item.level}
            </span>
            {type === 'cooking' ? (
              <>
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider border transition-all shadow-2xs shrink-0 whitespace-nowrap",
                  "bg-amber-50 dark:bg-amber-500/15 border-amber-100 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
                )}>
                  {item.cookingType ? formatCookingType(item.cookingType) : '요리'}
                </span>
                {item.heatControlCount !== undefined && item.heatControlCount !== null && item.heatControlCount !== '' && item.heatControlCount !== 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9.5px] font-black tracking-wider border transition-all shadow-2xs shrink-0 whitespace-nowrap flex items-center gap-0.5",
                    "bg-rose-50 dark:bg-rose-500/15 border-rose-100 dark:border-rose-500/30 text-rose-600 dark:text-rose-400"
                  )}>
                    <Flame className="h-2.5 w-2.5 text-rose-500 dark:text-rose-400 shrink-0" />
                    <span>불조절 {typeof item.heatControlCount === 'number' ? `${item.heatControlCount}회` : item.heatControlCount}</span>
                  </span>
                )}
              </>
            ) : (item.weather && item.weather.trim() !== '') ? (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider border transition-all shadow-2xs shrink-0 whitespace-nowrap",
                isRainbow
                  ? "bg-white dark:bg-stone-900/60 border-indigo-300 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-300 font-black"
                  : item.weather === 'Always' 
                    ? "bg-amber-50 dark:bg-amber-500/15 border-amber-100 dark:border-amber-500/30 text-amber-600 dark:text-amber-400" 
                    : item.weather === 'Clear/Rainbow'
                      ? "bg-orange-50 dark:bg-orange-500/15 border-orange-100 dark:border-orange-500/30 text-orange-600 dark:text-orange-400"
                      : item.weather === 'Rain/Snow/Rainbow'
                        ? "bg-blue-50 dark:bg-blue-500/15 border-blue-100 dark:border-blue-500/30 text-blue-600 dark:text-blue-400"
                        : "bg-neutral-50 dark:bg-stone-800 text-neutral-400 dark:text-stone-300 border-neutral-200 dark:border-stone-700"
              )}>
                {formatWeatherValue(item.weather)}
              </span>
            ) : null}
            {seasonInfo && badgeStyle && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[9.5px] font-black tracking-tight border shadow-2xs shrink-0 whitespace-nowrap flex items-center gap-0.5",
                badgeStyle.bg, badgeStyle.text, badgeStyle.border
              )}>
                {seasonInfo.emoji && <span>{seasonInfo.emoji}</span>}
                <span>{seasonInfo.shortName || seasonInfo.name}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
            {onToggleFavorite && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-all border-2 active:scale-90 shadow-2xs cursor-pointer",
                  isFavorite
                    ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30" 
                    : "bg-white dark:bg-stone-850 border-neutral-300 dark:border-stone-700 text-neutral-300 dark:text-stone-400 hover:border-rose-400 dark:hover:border-rose-500 hover:text-rose-500"
                )}
              >
                <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
              </button>
            )}
            {isCompleted && onToggleMaster && !item.excludeFromMaster && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMaster();
                }}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-all border-2 active:scale-90 shadow-2xs cursor-pointer",
                  isMaster
                    ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30" 
                    : "bg-white dark:bg-stone-850 border-neutral-300 dark:border-stone-700 text-neutral-300 dark:text-stone-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-500"
                )}
              >
                <Medal className="h-4 w-4" />
              </button>
            )}
            {onToggle && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-all border-2 active:scale-90 shadow-2xs cursor-pointer",
                  isCompleted 
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                    : isRainbow 
                      ? "bg-white/90 dark:bg-stone-850/60 border-indigo-300 dark:border-indigo-800/80 text-indigo-500 dark:text-indigo-400 hover:bg-white dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300"
                      : "bg-white dark:bg-stone-850 border-neutral-300 dark:border-stone-700 text-neutral-300 dark:text-stone-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-500"
                )}
              >
                <CheckSquare className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Primary Identity: Large Name & Small Thumb */}
        <div className="py-2.5 sm:py-3 relative flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-black tracking-tight leading-[1.2] line-clamp-2 mb-1 sm:mb-1.5",
              useRainbowStyle
                ? "text-[16px] text-indigo-950 dark:text-indigo-200 font-black drop-shadow-2xs"
                : "text-[16px] text-neutral-900 dark:text-stone-200"
            )}>
              {item.name}
            </h3>
            {type === 'cooking' && INGREDIENT_TO_SETS[item.name] && (
              <div className="relative mb-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSetMenuTooltip(!showSetMenuTooltip);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all shadow-sm active:scale-95 cursor-pointer",
                    showSetMenuTooltip
                      ? "bg-amber-500 border-amber-600 text-white"
                      : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-400 hover:border-amber-400"
                  )}
                >
                  <Medal className={cn("h-2.5 w-2.5", showSetMenuTooltip ? "text-white" : "text-amber-500")} />
                  <span className="text-[9px] font-black tracking-tight">세트메뉴 재료</span>
                </button>

                <AnimatePresence>
                  {showSetMenuTooltip && (
                    <>
                      <div 
                        className="fixed inset-0 z-[100]" 
                        onClick={() => setShowSetMenuTooltip(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute top-full left-0 mt-1 z-[110] min-w-[140px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl p-2.5 space-y-1.5"
                      >
                        <div className="text-[9px] font-bold text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-stone-800 pb-1 mb-1">
                          포함된 세트메뉴
                        </div>
                        {INGREDIENT_TO_SETS[item.name].map((data, i) => (
                          <div key={i} className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-black text-stone-800 dark:text-stone-200 truncate">
                              {data.setMenu}
                            </span>
                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 rounded-md shrink-0">
                              {data.count}개 필요
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            <p className={cn(
              "text-[9.5px] leading-relaxed line-clamp-1 font-semibold",
              isRainbow
                ? "text-indigo-950/80 dark:text-indigo-300/80 font-bold"
                : "text-stone-400 dark:text-stone-400"
            )}>
              {item.description}
            </p>
          </div>

          <div className={cn(
            "rounded-xl overflow-hidden flex items-center justify-center transition-all bg-white dark:bg-stone-900 relative shrink-0",
            imgRatio === 'portrait' 
              ? "w-12 h-16" 
              : imgRatio === 'landscape' 
                ? "w-20 h-16" 
                : "w-16 h-16",
            useRainbowStyle
              ? "shadow-md border border-indigo-200/80 dark:border-indigo-800/80"
              : "shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-neutral-50 dark:border-stone-850"
          )}>
            {(() => {
              const imgUrl = item.imageUrl || getExistingImagePath(type, item.name, item);
              return imgUrl && !imgError ? (
                <img loading="lazy" 
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
                <div className="w-full h-full flex items-center justify-center bg-stone-50 dark:bg-stone-800/40 text-stone-300 dark:text-stone-500">
                  {type === 'birds' ? (
                    <BirdIcon className="h-6 w-6" />
                  ) : type === 'insects' ? (
                    <Bug className="h-6 w-6" />
                  ) : type === 'cooking' ? (
                    <Soup className="h-6 w-6 text-amber-500/80 dark:text-amber-400/80" />
                  ) : type === 'crops' ? (
                    <Sprout className="h-6 w-6 text-emerald-500/80 dark:text-emerald-400/80" />
                  ) : type === 'ocean_cleaning' ? (
                    <Sparkle className="h-6 w-6 text-blue-500/80 dark:text-blue-400/80 animate-pulse" />
                  ) : (
                    <FishIcon className="h-6 w-6" />
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* 3. Footer Area: Metadata & Rating */}
        <div className={cn(
          "border-t pt-3 space-y-3 mt-auto",
          useRainbowStyle
            ? "border-indigo-300/40 dark:border-indigo-800/40"
            : "border-neutral-200/50 dark:border-stone-800"
        )}>
          {type === 'cooking' ? (
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex items-center gap-1 px-1">
                <button
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    "text-[9.5px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer",
                    activeTab === 'info' 
                      ? (useRainbowStyle ? "bg-indigo-600 text-white dark:bg-indigo-500" : "bg-slate-800 text-white dark:bg-stone-200 dark:text-stone-900")
                      : (useRainbowStyle ? "text-indigo-900/60 hover:text-indigo-900 dark:text-indigo-200/60 dark:hover:text-indigo-200" : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300")
                  )}
                >
                  레시피
                </button>
                <button
                  onClick={() => setActiveTab('price')}
                  className={cn(
                    "text-[9.5px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer",
                    activeTab === 'price' 
                      ? (useRainbowStyle ? "bg-indigo-600 text-white dark:bg-indigo-500" : "bg-slate-800 text-white dark:bg-stone-200 dark:text-stone-900")
                      : (useRainbowStyle ? "text-indigo-900/60 hover:text-indigo-900 dark:text-indigo-200/60 dark:hover:text-indigo-200" : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300")
                  )}
                >
                  판매 가격표
                </button>
              </div>
              <div className={cn(
                "flex flex-col border transition-all duration-300 gap-2 py-3 px-3 rounded-2xl text-[10.5px] justify-center",
                useRainbowStyle
                  ? "bg-white/70 dark:bg-stone-900/40 backdrop-blur-md border-indigo-300/40 dark:border-indigo-805 text-indigo-950 dark:text-indigo-200 font-black"
                  : "bg-stone-100/80 dark:bg-stone-800/40 border-stone-200/50 dark:border-stone-800 text-stone-500 dark:text-stone-300 font-bold"
              )}>
                {activeTab === 'info' ? (
                  <div className="flex flex-wrap gap-1.5 w-full min-w-0" id={`ingredients-box-${item.id}`}>
                    {item.ingredients ? (
                      item.ingredients.map((ing: string, idx: number) => (
                        <span 
                          key={`ing-${item.id}-${idx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onIngredientClick) {
                              onIngredientClick(ing);
                            }
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold tracking-tight transition-all border shadow-2xs cursor-pointer active:scale-95 hover:scale-105",
                            useRainbowStyle
                              ? "bg-white dark:bg-stone-900/60 border-indigo-200 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                              : "bg-stone-50 dark:bg-stone-850 border-stone-200/50 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-500/10"
                          )}
                          title={`${formatIngredient(ing)} 재료가 들어가는 요리 목록 보기`}
                        >
                          <Soup className="h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400" />
                          <span>{formatIngredient(ing)}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11.5px] text-stone-400 dark:text-stone-500 pl-1">정보 없음</span>
                    )}
                  </div>
                ) : (
                  <PriceTable item={item} type={type} variant="compact" />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1 px-1">
                <button
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    "text-[9.5px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer",
                    activeTab === 'info' 
                      ? (useRainbowStyle ? "bg-indigo-600 text-white dark:bg-indigo-500" : "bg-slate-800 text-white dark:bg-stone-200 dark:text-stone-900")
                      : (useRainbowStyle ? "text-indigo-900/60 hover:text-indigo-900 dark:text-indigo-200/60 dark:hover:text-indigo-200" : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300")
                  )}
                >
                  출현 정보
                </button>
                <button
                  onClick={() => setActiveTab('price')}
                  className={cn(
                    "text-[9.5px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer",
                    activeTab === 'price' 
                      ? (useRainbowStyle ? "bg-indigo-600 text-white dark:bg-indigo-500" : "bg-slate-800 text-white dark:bg-stone-200 dark:text-stone-900")
                      : (useRainbowStyle ? "text-indigo-900/60 hover:text-indigo-900 dark:text-indigo-200/60 dark:hover:text-indigo-200" : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300")
                  )}
                >
                  판매 가격표
                </button>
              </div>

              <div className={cn(
                "flex flex-col border transition-all duration-300 gap-2 py-3 px-3 rounded-2xl text-[10.5px] justify-center",
                item.fiveStarCondition
                  ? "bg-gradient-to-br from-amber-500/[0.02] to-orange-500/[0.01] dark:from-amber-950/10 dark:to-orange-950/5 border-amber-200/50 dark:border-amber-900/30 text-stone-600 dark:text-stone-300 font-bold"
                  : useRainbowStyle
                    ? "bg-white/70 dark:bg-stone-900/40 backdrop-blur-md border-indigo-300/40 dark:border-indigo-805 text-indigo-950 dark:text-indigo-200 font-black"
                    : "bg-stone-100/80 dark:bg-stone-800/40 border-stone-200/50 dark:border-stone-800 text-stone-500 dark:text-stone-300 font-bold"
              )}>
                {activeTab === 'info' ? (
                  <>
                    {/* Basic Spawn Info Row/Rows */}
                    <div className={cn("transition-opacity", isRecommend && recommendTarget === 'fivestar' && !isGenMatched ? "opacity-35 grayscale" : "opacity-100")}>
                      {isRecommend && recommendTarget === 'fivestar' && !isGenMatched && (
                        <div className="text-[9.5px] text-stone-500 dark:text-stone-400 mb-1 font-bold tracking-tight">※ 현재 추천 조건 아님</div>
                      )}
                      {type === 'ocean_cleaning' ? (
                        <div className="flex flex-col gap-1 w-full text-[10.5px] font-extrabold">
                          <div className="flex items-center gap-1.5 min-w-0 text-stone-600 dark:text-stone-300">
                            <Clock className={cn("h-3.5 w-3.5 shrink-0", useRainbowStyle ? "text-indigo-600 dark:text-indigo-400" : "text-stone-400 dark:text-stone-500")} />
                            <span className="truncate">{item.isUpdatePending ? "업데이트 예정" : formatTimeValue(item.timeSlots)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0 text-stone-600 dark:text-stone-300">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500" />
                            {item.locations && item.locations.length > 0 ? (
                              <span className="truncate text-stone-600 dark:text-stone-300 font-bold">
                                {item.locations.join(', ')}
                              </span>
                            ) : (
                              <span className="truncate text-stone-400">정보 없음</span>
                            )}
                          </div>
                          {item.proficiency !== undefined && item.proficiency !== null && item.proficiency !== '' && (
                            <div className="flex items-center gap-1.5 min-w-0 text-stone-600 dark:text-stone-300">
                              <Medal className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500" />
                              <span className="truncate">숙련도: {item.proficiency}</span>
                            </div>
                          )}
                        </div>
                      ) : type === 'birds' ? (
                        <div className="flex items-center justify-between gap-1.5 text-[10.5px] font-extrabold w-full">
                          <div className="flex items-center gap-1.5 min-w-0 text-stone-600 dark:text-stone-300 shrink-0">
                            <Clock className={cn("h-3.5 w-3.5 shrink-0", useRainbowStyle ? "text-indigo-600 dark:text-indigo-400" : "text-stone-400 dark:text-stone-500")} />
                            <span className="truncate">{formatTimeValue(item.timeSlots)}</span>
                          </div>
                          {!(isRecommend && recommendTarget === 'fivestar' && !isGenMatched) && (
                            <>
                              <div className="h-2.5 w-px bg-stone-300 dark:bg-stone-700 shrink-0" />
                              <div className="flex items-center gap-1 min-w-0 text-stone-600 dark:text-stone-300 justify-end">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500" />
                                {item.locations && item.locations.length > 0 ? (
                                  onLocationClick ? (
                                    <div className="flex items-center gap-1 truncate font-black">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onLocationClick(item.locations![0], item.name);
                                        }}
                                        title={`${item.locations[0]} (지도에서 위치 보기)`}
                                        className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                      >
                                        {item.locations[0]}
                                      </button>
                                      {item.locations.length > 1 && (
                                        <span className="text-stone-400 dark:text-stone-500 font-normal">
                                          외 {item.locations.length - 1}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="truncate text-stone-600 dark:text-stone-300 font-bold">
                                      {item.locations[0]}
                                      {item.locations.length > 1 && ` 외 ${item.locations.length - 1}`}
                                    </span>
                                  )
                                ) : (
                                  <span className="truncate text-stone-400">정보 없음</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 w-full text-[10.5px] font-extrabold">
                          <div className="flex items-center gap-1.5 min-w-0 text-stone-600 dark:text-stone-300">
                            <Clock className={cn("h-3.5 w-3.5 shrink-0", useRainbowStyle ? "text-indigo-600 dark:text-indigo-400" : "text-stone-400 dark:text-stone-500")} />
                            <span className="truncate">{formatTimeValue(item.timeSlots)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0 text-stone-600 dark:text-stone-300">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500" />
                            {item.locations && item.locations.length > 0 ? (
                              onLocationClick ? (
                                <div className="flex items-center flex-wrap gap-x-1 min-w-0 font-black">
                                  {item.locations.map((loc, idx) => (
                                    <span key={idx} className="inline-flex items-center">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onLocationClick(loc, item.name);
                                        }}
                                        title={`${loc} (지도에서 위치 보기)`}
                                        className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer text-left"
                                      >
                                        {loc}
                                      </button>
                                      {idx < item.locations!.length - 1 && (
                                        <span className="text-stone-400 dark:text-stone-500 font-normal mr-1">,</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="truncate text-stone-600 dark:text-stone-300 font-bold">
                                  {item.locations.join(', ')}
                                </span>
                              )
                            ) : (
                              <span className="truncate text-stone-400">정보 없음</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 5-Star Condition Row */}
                    {item.fiveStarCondition && (
                      <div className={cn("mt-2 pt-1.5 border-t border-dashed border-amber-200/50 dark:border-amber-900/30 text-[10.5px] select-none space-y-1 transition-opacity", isRecommend && recommendTarget === 'general' && !isFiveMatched ? "opacity-35 grayscale" : "opacity-100")}>
                        {isRecommend && recommendTarget === 'general' && !isFiveMatched && (
                          <div className="text-[9.5px] text-stone-500 dark:text-stone-400 mb-0.5 font-bold tracking-tight">※ 현재 추천 조건 아님</div>
                        )}
                        <div className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <span>★ {item.fiveStarCondition.action} 시간:</span>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 text-stone-500 dark:text-stone-400 font-bold text-[10.5px] w-full">
                          <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                            <span className="inline-flex items-center gap-1 shrink-0">
                              <WeatherIcon weather={item.fiveStarCondition.weather as GameWeather} className="h-3.5 w-3.5 shrink-0 opacity-80" />
                              <span>{formatWeatherValue(item.fiveStarCondition.weather)}</span>
                            </span>
                            <span className="text-stone-300 dark:text-stone-700 font-normal shrink-0">|</span>
                            <span className="truncate">{formatTimeValue(item.fiveStarCondition.timeSlots)}</span>
                          </div>
                          {isRecommend && recommendTarget === 'fivestar' && (
                            <div className="flex items-center gap-1 min-w-0 justify-end">
                              <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" />
                              <span className="truncate" title={item.locations ? item.locations.join(', ') : '정보 없음'}>
                                {item.locations ? item.locations.join(', ') : '정보 없음'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <PriceTable item={item} type={type} variant="compact" />
                )}
              </div>
            </div>
          )}

          <div className={cn(
            "flex items-center justify-between border-dashed flex-wrap gap-1.5 pt-2 border-t",
            useRainbowStyle 
              ? "border-indigo-300/60 dark:border-indigo-805"
              : "border-neutral-100 dark:border-stone-800"
          )}>
            <div className="flex items-center gap-0.5 -ml-1 min-h-[22px]">
              {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
                <button
                  key={`star-${item.id}-${star}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={(e) => {
                     e.stopPropagation();
                     onRate(item.name, effectiveRating === star ? 0 : star);
                     setHoverRating(0);
                  }}
                  className="p-0.5 transition-all hover:scale-125 active:scale-150"
                >
                  <Star 
                    className={cn(
                      "h-3.5 w-3.5 transition-all duration-300",
                      (hoverRating || effectiveRating) >= star 
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.6)]" 
                        : isRainbow
                          ? "text-indigo-950/20 dark:text-indigo-300/20 fill-white dark:fill-stone-900/40"
                          : "text-stone-200 fill-stone-100/40 dark:text-stone-700 dark:fill-stone-800/40"
                    )}
                  />
                </button>
              ))}
            </div>
            
            {effectiveRating === maxStars && effectiveRating > 0 && (
              <span className={cn(
                "text-[8px] font-black px-2 py-0.5 rounded-full border shadow-2xs",
                isRainbow
                  ? "text-indigo-950 dark:text-indigo-300 bg-white dark:bg-indigo-950/60 border-indigo-200/50 dark:border-indigo-805/50"
                  : "text-amber-500 bg-amber-500/10 border-amber-500/20"
              )}>
                MAX
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Decorative Shimmer & Sparkles for Rainbow Cards */}
      {isRainbow && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[32px]">
          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/45 dark:via-white/15 to-transparent animate-shimmer" />
          
          {/* Subtle Sparkles */}
          <Sparkle className="absolute top-4 left-1/4 h-2.5 w-2.5 text-white animate-sparkle drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]" style={{ animationDelay: '0.5s' }} />
          <Sparkle className="absolute bottom-8 right-1/3 h-2 w-2 text-white animate-sparkle drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]" style={{ animationDelay: '1.2s' }} />
          <Sparkle className="absolute top-1/2 right-4 h-3 w-3 text-white animate-sparkle drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]" style={{ animationDelay: '2.8s' }} />
        </div>
      )}

      {/* CLEAR STAMP OVERLAY */}
      {isCompleted && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20">
          <div className="border-[3.5px] font-black px-4 py-2.5 rounded-2xl transform -rotate-12 transition-all duration-500 flex flex-col items-center justify-center border-emerald-500/50 text-emerald-500/80 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <span className="leading-none tracking-[0.15em] text-xl">
              도감 CLEAR
            </span>
          </div>
        </div>
      )}

      {/* Master Badge Overlay (Centered in Card, behind complete overlay) */}
      {isMaster && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-[0.25]">
           <img loading="lazy" src="/images/medal.webp" alt="Master Badge" className="w-28 h-28 sm:w-32 sm:h-32 object-contain" />
        </div>
      )}
    </motion.div>
  );
}

export const ItemCard = memo(ItemCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.item === nextProps.item &&
    prevProps.item?.id === nextProps.item?.id &&
    prevProps.type === nextProps.type &&
    prevProps.isRecommend === nextProps.isRecommend &&
    prevProps.recommendTarget === nextProps.recommendTarget &&
    prevProps.isCompleted === nextProps.isCompleted &&
    prevProps.isMaster === nextProps.isMaster &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.rating === nextProps.rating &&
    prevProps.hidePrices === nextProps.hidePrices &&
    prevProps.currentHour === nextProps.currentHour &&
    prevProps.currentGameWeather === nextProps.currentGameWeather &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onToggleMaster === nextProps.onToggleMaster &&
    prevProps.onToggleFavorite === nextProps.onToggleFavorite &&
    prevProps.onRate === nextProps.onRate &&
    prevProps.onLocationClick === nextProps.onLocationClick &&
    prevProps.onIngredientClick === nextProps.onIngredientClick
  );
});

export function WeatherIcon({ weather, showStars = false, className }: { weather: GameWeather | string, showStars?: boolean, className?: string }) {
  const isKnown = ['Clear', 'RainSnow', 'Meteor', 'Rainbow', 'Unknown', 'Heatwave'].includes(weather);
  const displayWeather = isKnown ? weather : 'Unknown';
  return (
    <div className={cn("relative inline-flex items-center justify-center shrink-0", className)}>
      {displayWeather === 'Clear' && <Sun className="w-full h-full text-amber-500" />}
      {displayWeather === 'RainSnow' && <CloudRain className="w-full h-full text-slate-400" />}
      {displayWeather === 'Meteor' && <span className="text-[1.1em] leading-none flex items-center justify-center select-none">☄️</span>}
      {displayWeather === 'Rainbow' && <RainbowIcon className="w-full h-full text-rose-400" />}
      {displayWeather === 'Unknown' && <Cloud className="w-full h-full text-neutral-300" />}
      {displayWeather === 'Heatwave' && <span className="text-[1.1em] leading-none flex items-center justify-center select-none">🌡️</span>}
      {showStars && (
        <Stars className="absolute -top-1 -right-1 h-2 w-2 text-amber-200 animate-pulse" />
      )}
    </div>
  );
}

export function translateWeather(w: GameWeather | string) {
  const dict: Record<string, string> = {
    Clear: '맑음',
    RainSnow: '비/눈',
    Meteor: '유성우',
    Rainbow: '무지개',
    Unknown: '날씨정보 없음',
    Heatwave: '폭염'
  };
  return dict[w as string] || '날씨정보 없음';
}

export function getWeatherButtonClass(isSelected: boolean) {
  if (!isSelected) {
    return "bg-neutral-50 dark:bg-stone-800/80 text-neutral-450 dark:text-stone-400 hover:bg-neutral-100 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-stone-300 border border-neutral-200/50 dark:border-stone-700/60";
  }
  return "bg-sky-100 border-sky-400 text-sky-800 dark:bg-sky-950/40 dark:border-sky-500 dark:text-sky-400 shadow-md font-extrabold scale-105 border";
}
