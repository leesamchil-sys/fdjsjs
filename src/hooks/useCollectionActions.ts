import { useCallback } from 'react';
import { Category } from '../types';
import { 
  ALL_BIRDS_MAP, 
  ALL_INSECTS_MAP, 
  ALL_FISH_MAP, 
  ALL_COOKING_MAP, 
  ALL_GARDENING_MAP, 
  ALL_OCEAN_CLEANING_MAP 
} from '../data/allMaps';
import { safeJsonParse } from '../lib/utils';

export function useCollectionActions(
  user: any,
  completedBirdIds: Set<string>, setCompletedBirdIds: (s: Set<string>) => void,
  completedInsectIds: Set<string>, setCompletedInsectIds: (s: Set<string>) => void,
  completedFishIds: Set<string>, setCompletedFishIds: (s: Set<string>) => void,
  completedFoodIds: Set<string>, setCompletedFoodIds: (s: Set<string>) => void,
  completedGardeningIds: Set<string>, setCompletedGardeningIds: (s: Set<string>) => void,
  completedOceanCleaningIds: Set<string>, setCompletedOceanCleaningIds: (s: Set<string>) => void,
  masterBirdIds: Set<string>, setMasterBirdIds: (s: Set<string>) => void,
  masterInsectIds: Set<string>, setMasterInsectIds: (s: Set<string>) => void,
  masterFishIds: Set<string>, setMasterFishIds: (s: Set<string>) => void,
  masterFoodIds: Set<string>, setMasterFoodIds: (s: Set<string>) => void,
  masterGardeningIds: Set<string>, setMasterGardeningIds: (s: Set<string>) => void,
  masterOceanCleaningIds: Set<string>, setMasterOceanCleaningIds: (s: Set<string>) => void,
  flowerColorCollections: Record<string, Record<string, boolean>>, setFlowerColorCollections: (fc: any) => void,
  ratings: Record<string, number>, setRatings: (r: any) => void,
  markCollectionsModified: () => void,
  debouncedSyncAllData: (delay?: number) => void
) {

  const updateCollectionState = useCallback((categoryName: Category, newIds: Set<string>) => {
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

    markCollectionsModified();
    if (user) {
      debouncedSyncAllData();
    }
  }, [
    user,
    setCompletedBirdIds,
    setCompletedInsectIds,
    setCompletedFishIds,
    setCompletedFoodIds,
    setCompletedGardeningIds,
    setCompletedOceanCleaningIds,
    markCollectionsModified,
    debouncedSyncAllData
  ]);

  const VALID_MAIN_CATEGORIES = new Set<string>([
    'birds',
    'insects',
    'fishing',
    'cooking',
    'crops',
    'gardening',
    'ocean_cleaning'
  ]);

  const resolveIdAndCategory = (itemOrId: any, fallbackCategory?: Category) => {
    let id = '';
    let cat: string | undefined = undefined;

    // 1. Extract properties from itemOrId if it's an object
    if (typeof itemOrId === 'object' && itemOrId !== null) {
      id = String(itemOrId.id ?? '');

      if (itemOrId.mainCategory && VALID_MAIN_CATEGORIES.has(itemOrId.mainCategory)) {
        cat = itemOrId.mainCategory;
      } else if (itemOrId.type && VALID_MAIN_CATEGORIES.has(itemOrId.type)) {
        cat = itemOrId.type;
      } else if (itemOrId.category && VALID_MAIN_CATEGORIES.has(itemOrId.category)) {
        cat = itemOrId.category;
      }
    } else if (itemOrId !== undefined && itemOrId !== null) {
      id = String(itemOrId);
    }

    // 2. If cat wasn't specified directly on the object, fallbackCategory takes priority if valid
    if (!cat && fallbackCategory && VALID_MAIN_CATEGORIES.has(fallbackCategory as string)) {
      cat = fallbackCategory as string;
    }

    // 3. Only if cat is STILL invalid/missing, search item maps by ID
    if (!cat || !VALID_MAIN_CATEGORIES.has(cat)) {
      if (ALL_BIRDS_MAP.some((i: any) => String(i.id) === id)) cat = 'birds';
      else if (ALL_INSECTS_MAP.some((i: any) => String(i.id) === id)) cat = 'insects';
      else if (ALL_FISH_MAP.some((i: any) => String(i.id) === id)) cat = 'fishing';
      else if (ALL_COOKING_MAP.some((i: any) => String(i.id) === id)) cat = 'cooking';
      else if (ALL_GARDENING_MAP.some((i: any) => String(i.id) === id)) cat = 'gardening';
      else if (ALL_OCEAN_CLEANING_MAP.some((i: any) => String(i.id) === id)) cat = 'ocean_cleaning';
    }

    return { id, cat: (cat || 'birds') as Category };
  };

  const getCategoryInfo = useCallback((cat: Category) => {
    if (cat === 'birds') {
      return {
        completedSet: completedBirdIds,
        completedSetter: setCompletedBirdIds,
        completedKey: 'completed_bird_ids',
        masterSet: masterBirdIds,
        masterSetter: setMasterBirdIds,
        masterKey: 'master_bird_ids',
      };
    } else if (cat === 'insects') {
      return {
        completedSet: completedInsectIds,
        completedSetter: setCompletedInsectIds,
        completedKey: 'completed_insect_ids',
        masterSet: masterInsectIds,
        masterSetter: setMasterInsectIds,
        masterKey: 'master_insect_ids',
      };
    } else if (cat === 'fishing') {
      return {
        completedSet: completedFishIds,
        completedSetter: setCompletedFishIds,
        completedKey: 'completed_fish_ids',
        masterSet: masterFishIds,
        masterSetter: setMasterFishIds,
        masterKey: 'master_fish_ids',
      };
    } else if (cat === 'cooking') {
      return {
        completedSet: completedFoodIds,
        completedSetter: setCompletedFoodIds,
        completedKey: 'completed_food_ids',
        masterSet: masterFoodIds,
        masterSetter: setMasterFoodIds,
        masterKey: 'master_food_ids',
      };
    } else if (cat === 'crops' || cat === 'gardening') {
      return {
        completedSet: completedGardeningIds,
        completedSetter: setCompletedGardeningIds,
        completedKey: 'completed_gardening_ids',
        masterSet: masterGardeningIds,
        masterSetter: setMasterGardeningIds,
        masterKey: 'master_gardening_ids',
      };
    } else if (cat === 'ocean_cleaning') {
      return {
        completedSet: completedOceanCleaningIds,
        completedSetter: setCompletedOceanCleaningIds,
        completedKey: 'completed_ocean_cleaning_ids',
        masterSet: masterOceanCleaningIds,
        masterSetter: setMasterOceanCleaningIds,
        masterKey: 'master_ocean_cleaning_ids',
      };
    }
    return null;
  }, [
    completedBirdIds, setCompletedBirdIds, masterBirdIds, setMasterBirdIds,
    completedInsectIds, setCompletedInsectIds, masterInsectIds, setMasterInsectIds,
    completedFishIds, setCompletedFishIds, masterFishIds, setMasterFishIds,
    completedFoodIds, setCompletedFoodIds, masterFoodIds, setMasterFoodIds,
    completedGardeningIds, setCompletedGardeningIds, masterGardeningIds, setMasterGardeningIds,
    completedOceanCleaningIds, setCompletedOceanCleaningIds, masterOceanCleaningIds, setMasterOceanCleaningIds
  ]);

  const toggleCompletion = useCallback((itemOrId: any, category?: Category) => {
    const { id, cat } = resolveIdAndCategory(itemOrId, category);
    if (!id) return;

    const info = getCategoryInfo(cat);
    if (!info) return;

    let isUnchecking = false;

    info.completedSetter(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        isUnchecking = true;
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(info.completedKey, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    // 1. Requirement 1: If completion is unchecked, uncheck master as well!
    if (isUnchecking) {
      info.masterSetter(prev => {
        if (prev.has(id)) {
          const nextMaster = new Set(prev);
          nextMaster.delete(id);
          try {
            localStorage.setItem(info.masterKey, JSON.stringify(Array.from(nextMaster)));
          } catch (e) {
            console.warn(e);
          }
          return nextMaster;
        }
        return prev;
      });

      // Also remove rating if it exists for this item
      let name: string | undefined;
      if (typeof itemOrId === 'object' && itemOrId !== null && itemOrId.name) {
        name = itemOrId.name;
      } else {
        const found = ALL_BIRDS_MAP.find((i: any) => String(i.id) === id) ||
                      ALL_INSECTS_MAP.find((i: any) => String(i.id) === id) ||
                      ALL_FISH_MAP.find((i: any) => String(i.id) === id) ||
                      ALL_COOKING_MAP.find((i: any) => String(i.id) === id) ||
                      ALL_GARDENING_MAP.find((i: any) => String(i.id) === id) ||
                      ALL_OCEAN_CLEANING_MAP.find((i: any) => String(i.id) === id);
        if (found) name = found.name;
      }
      if (name && ratings[name]) {
        const updated = { ...ratings };
        delete updated[name];
        setRatings(updated);
        localStorage.setItem('item_ratings', JSON.stringify(updated));
      }
    }

    markCollectionsModified();
    if (user) {
      debouncedSyncAllData();
    }
  }, [
    getCategoryInfo,
    ratings,
    setRatings,
    markCollectionsModified,
    debouncedSyncAllData,
    user
  ]);

  const toggleMasterCompletion = useCallback((itemOrId: any, category?: Category) => {
    const { id, cat } = resolveIdAndCategory(itemOrId, category);
    if (!id) return;

    const info = getCategoryInfo(cat);
    if (!info) return;

    info.masterSetter(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(info.masterKey, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    markCollectionsModified();
    if (user) {
      debouncedSyncAllData();
    }
  }, [
    getCategoryInfo,
    markCollectionsModified,
    debouncedSyncAllData,
    user
  ]);

  const handleToggleFlowerColor = useCallback((itemId: string, variantKey: string) => {
    setFlowerColorCollections(prev => {
      const updated = { ...prev };
      const currentVal = updated[itemId] || {};
      let currentRecord: Record<string, boolean> = {};

      if (Array.isArray(currentVal)) {
        // Migrate legacy array to Record<string, boolean>
        currentVal.forEach((key) => {
          if (key) currentRecord[key] = true;
        });
      } else if (typeof currentVal === 'object') {
        currentRecord = { ...currentVal };
      }

      if (currentRecord[variantKey]) {
        delete currentRecord[variantKey];
      } else {
        currentRecord[variantKey] = true;
      }

      if (Object.keys(currentRecord).length === 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = currentRecord;
      }

      localStorage.setItem('flower_color_collections', JSON.stringify(updated));
      return updated;
    });

    markCollectionsModified();
    if (user) {
      debouncedSyncAllData();
    }
  }, [setFlowerColorCollections, markCollectionsModified, debouncedSyncAllData, user]);

  const handleRateItem = useCallback((itemOrName: any, rating: number, category?: Category) => {
    let name: string;
    if (typeof itemOrName === 'object' && itemOrName !== null) {
      name = itemOrName.name || itemOrName.id;
    } else {
      name = itemOrName;
    }
    if (!name) return;

    // 1. Update ratings state & localStorage
    setRatings(prev => {
      const updated = { ...prev };
      if (rating === 0) {
        delete updated[name];
      } else {
        updated[name] = rating;
      }
      localStorage.setItem('item_ratings', JSON.stringify(updated));
      return updated;
    });

    // 2. Resolve item ID and Category
    let { id, cat } = resolveIdAndCategory(itemOrName, category);

    if (!id || !cat) {
      const found = ALL_BIRDS_MAP.find((i: any) => i.name === name) ||
                    ALL_INSECTS_MAP.find((i: any) => i.name === name) ||
                    ALL_FISH_MAP.find((i: any) => i.name === name) ||
                    ALL_COOKING_MAP.find((i: any) => i.name === name) ||
                    ALL_GARDENING_MAP.find((i: any) => i.name === name) ||
                    ALL_OCEAN_CLEANING_MAP.find((i: any) => i.name === name);
      if (found) {
        id = String(found.id);
        cat = ((found as any).mainCategory || (found as any).type || (found as any).category || cat) as Category;
      }
    }

    if (id && cat) {
      const info = getCategoryInfo(cat);
      if (info) {
        if (rating > 0) {
          // Requirement 2: Rating > 0 automatically checks completion
          info.completedSetter(prev => {
            if (!prev.has(id)) {
              const next = new Set(prev);
              next.add(id);
              try {
                localStorage.setItem(info.completedKey, JSON.stringify(Array.from(next)));
              } catch (e) {
                console.warn(e);
              }
              return next;
            }
            return prev;
          });
        } else {
          // Requirement 3: Rating === 0 automatically unchecks completion
          info.completedSetter(prev => {
            if (prev.has(id)) {
              const next = new Set(prev);
              next.delete(id);
              try {
                localStorage.setItem(info.completedKey, JSON.stringify(Array.from(next)));
              } catch (e) {
                console.warn(e);
              }
              return next;
            }
            return prev;
          });

          // Requirement 1: Since completion is unchecked, uncheck master as well
          info.masterSetter(prev => {
            if (prev.has(id)) {
              const nextMaster = new Set(prev);
              nextMaster.delete(id);
              try {
                localStorage.setItem(info.masterKey, JSON.stringify(Array.from(nextMaster)));
              } catch (e) {
                console.warn(e);
              }
              return nextMaster;
            }
            return prev;
          });
        }
      }
    }

    markCollectionsModified();
    if (user) {
      debouncedSyncAllData();
    }
  }, [
    setRatings,
    getCategoryInfo,
    markCollectionsModified,
    debouncedSyncAllData,
    user
  ]);

  const toggleOceanCleaning = useCallback((item: any) => {
    toggleCompletion(item, 'ocean_cleaning');
  }, [toggleCompletion]);

  const resetLocalCollectionStates = useCallback(() => {
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
    setFlowerColorCollections({});
    setRatings({});

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
      'completed_ocean_cleaning_ids',
      'master_ocean_cleaning_ids',
      'item_ratings',
      'flower_color_collections'
    ];
    keysToClear.forEach(k => localStorage.removeItem(k));
  }, [
    setCompletedBirdIds, setCompletedInsectIds, setCompletedFishIds, setCompletedFoodIds, setCompletedGardeningIds, setCompletedOceanCleaningIds,
    setMasterBirdIds, setMasterInsectIds, setMasterFishIds, setMasterFoodIds, setMasterGardeningIds, setMasterOceanCleaningIds,
    setFlowerColorCollections, setRatings
  ]);

  return {
    updateCollectionState,
    toggleCompletion,
    toggleMasterCompletion,
    handleToggleFlowerColor,
    handleRateItem,
    toggleOceanCleaning,
    resetLocalCollectionStates,
  };
}
