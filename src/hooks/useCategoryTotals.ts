import { useMemo } from 'react';
import { Category, Bird, Insect, Fish, Cooking } from '../types';
import { SEASONAL_EVENTS } from '../data/seasonal';
import { GARDENING_ITEMS } from '../data/gardening';
import { ALL_OCEAN_CLEANING_MAP } from '../data/allMaps';

interface UseCategoryTotalsParams {
  effectiveSeasonIds: string[];
  activeCategory: Category;
  completedBirdIds: Set<string>;
  completedInsectIds: Set<string>;
  completedFishIds: Set<string>;
  completedFoodIds: Set<string>;
  completedGardeningIds: Set<string>;
  completedOceanCleaningIds: Set<string>;
  MAX_DISPLAY_LEVEL: number;
  dbBirds: Bird[];
  dbInsects: Insect[];
  dbFish: Fish[];
  dbCooking: Cooking[];
}

export function useCategoryTotals({
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
}: UseCategoryTotalsParams) {
  const gardeningItems = useMemo(() => {
    const seasonalGardening = SEASONAL_EVENTS
      .filter(e => effectiveSeasonIds.includes(e.id))
      .flatMap(e => e.gardening || []);
    const seasonalCrops = SEASONAL_EVENTS
      .filter(e => effectiveSeasonIds.includes(e.id))
      .flatMap(e => (e.crops || []).map(crop => {
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
          excludeFromMaster: crop.excludeFromMaster ?? true
        };
      }));
    return [...GARDENING_ITEMS, ...seasonalGardening, ...seasonalCrops];
  }, [effectiveSeasonIds]);

  const birdTotal = useMemo(() => dbBirds.filter(b => b.level <= MAX_DISPLAY_LEVEL && (!b.seasonId || effectiveSeasonIds.includes(b.seasonId))).length, [dbBirds, MAX_DISPLAY_LEVEL, effectiveSeasonIds]);
  const insectTotal = useMemo(() => dbInsects.filter(i => i.level <= MAX_DISPLAY_LEVEL && (!i.seasonId || effectiveSeasonIds.includes(i.seasonId))).length, [dbInsects, MAX_DISPLAY_LEVEL, effectiveSeasonIds]);
  const fishTotal = useMemo(() => dbFish.filter(f => f.level <= MAX_DISPLAY_LEVEL && (!f.seasonId || effectiveSeasonIds.includes(f.seasonId))).length, [dbFish, MAX_DISPLAY_LEVEL, effectiveSeasonIds]);
  const cookingTotal = useMemo(() => dbCooking.filter(c => c.level <= MAX_DISPLAY_LEVEL && (!c.seasonId || effectiveSeasonIds.includes(c.seasonId))).length, [dbCooking, MAX_DISPLAY_LEVEL, effectiveSeasonIds]);

  const gardeningFlowerItems = useMemo(() => gardeningItems.filter(i => i.category === 'flower'), [gardeningItems]);
  const gardeningCropItems = useMemo(() => gardeningItems.filter(i => i.category === 'crop'), [gardeningItems]);

  const gardeningTotal = useMemo(() => gardeningFlowerItems.filter(i => i.level <= MAX_DISPLAY_LEVEL).length, [gardeningFlowerItems, MAX_DISPLAY_LEVEL]);
  const cropTotal = useMemo(() => gardeningCropItems.filter(i => i.level <= MAX_DISPLAY_LEVEL).length, [gardeningCropItems, MAX_DISPLAY_LEVEL]);

  const completedFlowerIds = useMemo(() => new Set([...completedGardeningIds].filter(id => gardeningFlowerItems.find(i => i.id === id))), [completedGardeningIds, gardeningFlowerItems]);
  const completedCropIds = useMemo(() => new Set([...completedGardeningIds].filter(id => gardeningCropItems.find(i => i.id === id))), [completedGardeningIds, gardeningCropItems]);

  const oceanCleaning = useMemo(() => ALL_OCEAN_CLEANING_MAP, []);

  const oceanCleaningTotal = useMemo(() => {
    return oceanCleaning.filter(i => i.level <= MAX_DISPLAY_LEVEL && (!i.seasonId || effectiveSeasonIds.includes(i.seasonId))).length;
  }, [oceanCleaning, MAX_DISPLAY_LEVEL, effectiveSeasonIds]);

  const effectiveCompletedBirdIds = useMemo(() => new Set([...completedBirdIds].filter(id => dbBirds.find(b => b.id === id && (!b.seasonId || effectiveSeasonIds.includes(b.seasonId))))), [completedBirdIds, dbBirds, effectiveSeasonIds]);
  const effectiveCompletedInsectIds = useMemo(() => new Set([...completedInsectIds].filter(id => dbInsects.find(i => i.id === id && (!i.seasonId || effectiveSeasonIds.includes(i.seasonId))))), [completedInsectIds, dbInsects, effectiveSeasonIds]);
  const effectiveCompletedFishIds = useMemo(() => new Set([...completedFishIds].filter(id => dbFish.find(f => f.id === id && (!f.seasonId || effectiveSeasonIds.includes(f.seasonId))))), [completedFishIds, dbFish, effectiveSeasonIds]);
  const effectiveCompletedFoodIds = useMemo(() => new Set([...completedFoodIds].filter(id => dbCooking.find(c => c.id === id && (!c.seasonId || effectiveSeasonIds.includes(c.seasonId))))), [completedFoodIds, dbCooking, effectiveSeasonIds]);
  const effectiveCompletedOceanCleaningIds = useMemo(() => new Set([...completedOceanCleaningIds].filter(id => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id && (!o.seasonId || effectiveSeasonIds.includes(o.seasonId))))), [completedOceanCleaningIds, effectiveSeasonIds]);
  const effectiveCompletedGardeningIds = useMemo(() => new Set([...completedGardeningIds].filter(id => gardeningItems.find(g => g.id === id && (!g.seasonId || effectiveSeasonIds.includes(g.seasonId))))), [completedGardeningIds, gardeningItems, effectiveSeasonIds]);

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

  return {
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
  };
}
