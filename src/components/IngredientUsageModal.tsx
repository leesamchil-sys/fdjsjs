import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Soup, 
  X, 
  Check, 
  Crown, 
  BookOpen, 
  Sparkles,
  Coins,
  ArrowRight,
  Flame,
  ExternalLink
} from 'lucide-react';
import { COOKING } from '../data/cooking';
import { SEASONAL_EVENTS } from '../data/seasonal';
import { Cooking } from '../types';
import { formatIngredient, formatCookingType } from './ItemCard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseIngredientNames = (raw: string): string[] => {
  if (!raw) return [];
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  return parts.map(part => {
    let cleaned = part.replace(/^raw-|^custom-/, '').trim();
    cleaned = cleaned.replace(/^또는\s*/, '');
    const match = cleaned.match(/^(.+?)\s*(?:x\s*|\s+)?\d+개?$/i);
    if (match) return match[1].trim();
    return cleaned;
  });
};

const normalizeStr = (s: string) => s.replace(/\s+/g, '').toLowerCase();

const FRUIT_LIST = ["사과", "블루베리", "라즈베리", "오렌지", "파인애플", "딸기", "포도"];
const VEGGIE_LIST = ["토마토", "감자", "양상추", "당근", "가지", "옥수수", "아보카도"];
const MUSHROOM_LIST = ["느타리버섯", "표고버섯", "양송이버섯", "그물버섯", "검은 트러플"];
const COFFEE_LIST = ["커피", "카페라떼"];
const CRAYFISH_LIST = ["유럽 가재", "유럽 민물 가재", "파란 북유럽 가재", "아무 가재", "가재"];
const CANDY_LIST = ["빨간색 사탕", "주황색 사탕", "노란색 사탕", "초록색 사탕", "파란색 사탕", "청록색 사탕", "보라색 사탕"];

export const isIngredientUsedInRecipe = (targetIng: string, recipe: Cooking): boolean => {
  if (!recipe.ingredients || recipe.ingredients.length === 0) return false;

  const normTarget = normalizeStr(targetIng);

  return recipe.ingredients.some(reqStr => {
    const parsedNames = parseIngredientNames(reqStr);
    return parsedNames.some(reqName => {
      const normReq = normalizeStr(reqName);

      // Special exclusion: '포도' and '바다포도' are strictly separate items
      if ((normTarget === '포도' && normReq.includes('바다포도')) || (normTarget === '바다포도' && normReq === '포도')) {
        return false;
      }
      if ((normReq === '포도' && normTarget.includes('바다포도')) || (normReq === '바다포도' && normTarget === '포도')) {
        return false;
      }

      // Special exclusion: '커피원두' and '커피' are strictly separate
      if ((normTarget === '커피원두' && normReq === '커피') || (normTarget === '커피' && normReq === '커피원두')) {
        return false;
      }

      // Exact match check
      if (normTarget === normReq) return true;

      // Wildcard check 1: Target is "아무 과일" or "과일"
      if (normReq === '아무과일' || normReq === '과일') {
        if (FRUIT_LIST.some(f => normalizeStr(f) === normTarget)) return true;
        if (normTarget === '아무과일' || normTarget === '과일') return true;
      }
      if (normTarget === '아무과일' || normTarget === '과일') {
        if (FRUIT_LIST.some(f => normalizeStr(f) === normReq)) return true;
      }

      // Wildcard check 2: Target is "아무 야채" or "야채"
      if (normReq === '아무야채' || normReq === '야채') {
        if (VEGGIE_LIST.some(v => normalizeStr(v) === normTarget)) return true;
        if (normTarget === '아무야채' || normTarget === '야채') return true;
      }
      if (normTarget === '아무야채' || normTarget === '야채') {
        if (VEGGIE_LIST.some(v => normalizeStr(v) === normReq)) return true;
      }

      // Wildcard check 3: Target is "아무 버섯" or "버섯"
      if (normReq === '아무버섯' || normReq === '버섯') {
        if (MUSHROOM_LIST.some(m => normalizeStr(m) === normTarget)) return true;
        if (normTarget === '아무버섯' || normTarget === '버섯') return true;
      }
      if (normTarget === '아무버섯' || normTarget === '버섯') {
        if (MUSHROOM_LIST.some(m => normalizeStr(m) === normReq)) return true;
      }

      // Wildcard check 4: Target is "아무 커피" or "커피"
      if (normReq === '아무커피' || normReq === '커피') {
        if (COFFEE_LIST.some(c => normalizeStr(c) === normTarget)) return true;
      }
      if (normTarget === '아무커피' || normTarget === '커피') {
        if (COFFEE_LIST.some(c => normalizeStr(c) === normReq)) return true;
      }

      // Wildcard check 5: Target is "아무 가재" or "가재"
      if (normReq === '아무가재' || normReq === '가재') {
        if (CRAYFISH_LIST.some(cr => normalizeStr(cr) === normTarget)) return true;
      }
      if (normTarget === '아무가재' || normTarget === '가재') {
        if (CRAYFISH_LIST.some(cr => normalizeStr(cr) === normReq)) return true;
      }

      // Wildcard check 6: Target is "아무 사탕" or "사탕"
      if (normReq === '아무사탕' || normReq === '사탕') {
        if (CANDY_LIST.some(cd => normalizeStr(cd) === normTarget)) return true;
      }
      if (normTarget === '아무사탕' || normTarget === '사탕') {
        if (CANDY_LIST.some(cd => normalizeStr(cd) === normReq)) return true;
      }

      return false;
    });
  });
};

/** Split any comma-separated strings inside recipe ingredients into individual pill items */
export const flattenIngredientStrings = (ingredients: string[]): string[] => {
  const result: string[] = [];
  ingredients.forEach(str => {
    if (str.includes(',')) {
      str.split(',').forEach(sub => {
        const trimmed = sub.trim();
        if (trimmed) result.push(trimmed);
      });
    } else {
      result.push(str);
    }
  });
  return result;
};

interface IngredientUsageModalProps {
  isOpen: boolean;
  rawIngredient: string | null;
  onClose: () => void;
  completedIds: Set<string>;
  masterFoodIds: Set<string>;
  toggleCompletion: (id: string) => void;
  toggleMaster: (id: string) => void;
  onSelectDish?: (dishName: string) => void;
}

export const IngredientUsageModal: React.FC<IngredientUsageModalProps> = ({
  isOpen,
  rawIngredient,
  onClose,
  completedIds,
  masterFoodIds,
  toggleCompletion,
  toggleMaster,
  onSelectDish
}) => {
  const [selectedIngIndex, setSelectedIngIndex] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'uncompleted' | 'unmastered'>('all');

  // Extract ingredient names
  const parsedIngredients = useMemo(() => {
    if (!rawIngredient) return [];
    return parseIngredientNames(rawIngredient);
  }, [rawIngredient]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    setSelectedIngIndex(0);
    setFilterType('all');
  }, [rawIngredient]);

  const activeIngredient = parsedIngredients[selectedIngIndex] || parsedIngredients[0] || '';

  const ALL_RECIPES: Cooking[] = useMemo(() => {
    const list = [...COOKING];
    SEASONAL_EVENTS.forEach(event => {
      if (event.cooking) {
        event.cooking.forEach(c => {
          if (!list.some(existing => existing.id === c.id)) {
            list.push(c as Cooking);
          }
        });
      }
    });
    return list;
  }, []);

  // Filter recipes using activeIngredient
  const matchingRecipes = useMemo(() => {
    if (!activeIngredient) return [];
    return ALL_RECIPES.filter(r => isIngredientUsedInRecipe(activeIngredient, r));
  }, [ALL_RECIPES, activeIngredient]);

  // Check if activeIngredient is EXACTLY a craftable dish name (e.g. "치즈케이크" when used in "고급 애프터눈 티 세트")
  const craftableRecipe = useMemo(() => {
    if (!activeIngredient) return null;
    const norm = normalizeStr(activeIngredient);
    return ALL_RECIPES.find(r => normalizeStr(r.name) === norm);
  }, [ALL_RECIPES, activeIngredient]);

  // Filtered by filterType
  const filteredRecipes = useMemo(() => {
    return matchingRecipes.filter(recipe => {
      const isComp = completedIds.has(recipe.id);
      const isMast = masterFoodIds.has(recipe.id);

      if (filterType === 'uncompleted' && isComp) return false;
      if (filterType === 'unmastered' && isMast) return false;

      return true;
    });
  }, [matchingRecipes, completedIds, masterFoodIds, filterType]);

  const totalCount = matchingRecipes.length;
  const completedCount = matchingRecipes.filter(r => completedIds.has(r.id)).length;
  const masterCount = matchingRecipes.filter(r => masterFoodIds.has(r.id)).length;

  if (!isOpen || !rawIngredient) return null;

  return (
    <AnimatePresence>
      {/* High z-index z-[1000] to always sit cleanly on top of mobile sidebar (z-[150]) */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-stone-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-2xl max-h-[88vh] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-800 dark:text-stone-100 font-sans"
        >
          {/* Header Section */}
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800/80 bg-stone-50/90 dark:bg-stone-900/95 backdrop-blur-md flex flex-col gap-3">
            {/* Title & Close */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-center shrink-0">
                  <Soup className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">재료 활용 정보</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-amber-300 font-extrabold">
                      {totalCount}개 요리에 사용됨
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white truncate">
                    '{activeIngredient}' 사용 요리 목록
                  </h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Ingredient selector (if multiple, e.g. "우유 2, 블루베리 2") */}
            {parsedIngredients.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 shrink-0 mr-1">세부 재료:</span>
                {parsedIngredients.map((ingName, idx) => (
                  <button
                    key={ingName}
                    onClick={() => setSelectedIngIndex(idx)}
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border shrink-0",
                      selectedIngIndex === idx
                        ? "bg-amber-500 border-amber-400 text-stone-950 shadow-xs"
                        : "bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700"
                    )}
                  >
                    {ingName}
                  </button>
                ))}
              </div>
            )}

            {/* Craftable Recipe Banner ONLY if exact match exists (e.g. "치즈케이크") */}
            {craftableRecipe && (
              <div className="bg-amber-500/10 dark:bg-gradient-to-r dark:from-amber-950/40 dark:via-stone-850 dark:to-stone-900 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 font-bold text-amber-700 dark:text-amber-400 text-xs">
                    Lv.{craftableRecipe.level}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-xs font-black text-amber-800 dark:text-amber-300">제작 가능한 요리 재료</span>
                    </div>
                    <div className="text-sm font-black text-stone-900 dark:text-white truncate">{craftableRecipe.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleCompletion(craftableRecipe.id, 'cooking')}
                    className={cn(
                      "w-[82px] py-1.5 rounded-xl text-[11px] font-black transition-all border flex items-center justify-center gap-1 cursor-pointer shrink-0",
                      completedIds.has(craftableRecipe.id)
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-xs"
                        : "bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                    )}
                  >
                    <Check className="w-3 h-3 shrink-0" />
                    <span>{completedIds.has(craftableRecipe.id) ? "수집완료" : "미수집"}</span>
                  </button>

                  <button
                    onClick={() => toggleMaster(craftableRecipe.id, 'cooking')}
                    className={cn(
                      "w-[98px] py-1.5 rounded-xl text-[11px] font-black transition-all border flex items-center justify-center gap-1 cursor-pointer shrink-0",
                      masterFoodIds.has(craftableRecipe.id)
                        ? "bg-amber-500 border-amber-400 text-stone-950 shadow-xs"
                        : "bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                    )}
                  >
                    <Crown className="w-3 h-3 shrink-0" />
                    <span>{masterFoodIds.has(craftableRecipe.id) ? "명인완료" : "명인 미완료"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Filter Tabs & Quick Progress */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-950/80 p-1 rounded-2xl border border-stone-300/80 dark:border-stone-800">
                <button
                  onClick={() => setFilterType('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                    filterType === 'all'
                      ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs border border-stone-200 dark:border-stone-700"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                  )}
                  title="이 재료로 만들 수 있는 모든 요리 표시"
                >
                  전체 요리 ({totalCount})
                </button>
                <button
                  onClick={() => setFilterType('uncompleted')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                    filterType === 'uncompleted'
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                  )}
                  title="아직 도감을 수집하지 않은 요리만 보기"
                >
                  도감 미수집 ({totalCount - completedCount})
                </button>
                <button
                  onClick={() => setFilterType('unmastered')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                    filterType === 'unmastered'
                      ? "bg-amber-500 text-stone-950 shadow-xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                  )}
                  title="아직 명인을 달성하지 않은 요리만 보기"
                >
                  명인 미완료 ({totalCount - masterCount})
                </button>
              </div>

              {/* Progress Counters */}
              <div className="flex items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-400 bg-stone-200/60 dark:bg-stone-800/60 px-3 py-1.5 rounded-xl border border-stone-300/60 dark:border-stone-750">
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  수집 {completedCount}/{totalCount}
                </span>
                <span className="text-stone-400 dark:text-stone-600">•</span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Crown className="w-3.5 h-3.5" />
                  명인 {masterCount}/{totalCount}
                </span>
              </div>
            </div>
          </div>

          {/* Body Recipe List */}
          <div className="p-3 sm:p-5 overflow-y-auto max-h-[55vh] space-y-2.5 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700 scrollbar-track-transparent">
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => {
                const isComp = completedIds.has(recipe.id);
                const isMast = masterFoodIds.has(recipe.id);

                // Flatten any comma-separated ingredient strings into distinct pill items
                const flattenedIngs = flattenIngredientStrings(recipe.ingredients);

                return (
                  <div
                    key={recipe.id}
                    className={cn(
                      "group p-3 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                      isComp && isMast
                        ? "bg-stone-100/70 dark:bg-stone-900/60 border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700"
                        : "bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700/80 hover:border-amber-500/50 shadow-xs"
                    )}
                  >
                    {/* Left: Recipe Info */}
                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-center overflow-hidden shadow-2xs">
                          <img
                            src={`/images/cooking/${recipe.name}.webp`}
                            alt={recipe.name}
                            className="w-9 h-9 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const parent = (e.target as HTMLElement).parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'fallback-icon text-amber-500 font-bold text-xl';
                                fallback.innerText = '🍲';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        </div>
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-stone-900 dark:bg-stone-950/90 border border-stone-700 text-[9.5px] font-black text-amber-400 shadow-2xs">
                          Lv.{recipe.level}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-stone-900 dark:text-white truncate">
                            {recipe.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-700/60 text-stone-700 dark:text-stone-300 text-[9.5px] font-bold">
                            {formatCookingType(recipe.cookingType)}
                          </span>
                          {recipe.price !== undefined && (
                            <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-0.5" title="1성 기준 (기본 가격)">
                              <Coins className="w-3 h-3 text-amber-500 shrink-0" />
                              {recipe.price}G ~
                            </span>
                          )}
                          {recipe.heatControlCount !== undefined && recipe.heatControlCount > 0 && (
                            <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
                              <Flame className="w-3 h-3 text-orange-500 shrink-0" />
                              불조절 {recipe.heatControlCount}회
                            </span>
                          )}
                        </div>

                        {/* Ingredients Pill Row - Highlight ONLY matching ingredient pill */}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {flattenedIngs.map((ingStr, idx) => {
                            const isMatch = isIngredientUsedInRecipe(activeIngredient, { ingredients: [ingStr] } as any);
                            return (
                              <span
                                key={idx}
                                className={cn(
                                  "px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold border transition-all flex items-center gap-1",
                                  isMatch
                                    ? "bg-amber-500/15 dark:bg-amber-500/20 border-amber-500/60 text-amber-900 dark:text-amber-200 font-black shadow-2xs ring-1 ring-amber-500/30"
                                    : "bg-white dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400"
                                )}
                              >
                                {isMatch && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                {formatIngredient(ingStr)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (Move to Dish Card, Toggle Collection & Master) */}
                    <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200 dark:border-stone-750/60">
                      {onSelectDish && (
                        <button
                          onClick={() => {
                            onSelectDish(recipe.name);
                            onClose();
                          }}
                          className="w-[82px] py-1.5 rounded-xl bg-stone-100 hover:bg-amber-500 hover:text-stone-950 dark:bg-stone-800 dark:hover:bg-amber-500 dark:text-stone-300 dark:hover:text-stone-950 text-stone-700 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 border border-stone-300 dark:border-stone-700 shrink-0 shadow-2xs"
                          title={`'${recipe.name}' 요리 도감 카드로 이동`}
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span>도감상세</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleCompletion(recipe.id, 'cooking')}
                        className={cn(
                          "w-[82px] py-1.5 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0",
                          isComp
                            ? "bg-emerald-600 border-emerald-500 text-white shadow-2xs"
                            : "bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                        )}
                      >
                        <Check className={cn("w-3.5 h-3.5 shrink-0", isComp ? "text-white" : "text-stone-400")} />
                        <span>{isComp ? "수집완료" : "미수집"}</span>
                      </button>

                      <button
                        onClick={() => toggleMaster(recipe.id, 'cooking')}
                        className={cn(
                          "w-[98px] py-1.5 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0",
                          isMast
                            ? "bg-amber-500 border-amber-400 text-stone-950 shadow-2xs ring-1 ring-amber-400/50"
                            : "bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                        )}
                      >
                        <Crown className={cn("w-3.5 h-3.5 shrink-0", isMast ? "text-stone-950 fill-stone-950" : "text-stone-400")} />
                        <span>{isMast ? "명인완료" : "명인 미완료"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-stone-500 dark:text-stone-400 font-bold text-sm">
                선택한 필터 조건에 해당하는 요리가 없습니다.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

