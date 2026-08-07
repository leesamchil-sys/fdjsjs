import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { 
  ALL_BIRDS_MAP, 
  ALL_INSECTS_MAP, 
  ALL_FISH_MAP, 
  ALL_COOKING_MAP, 
  ALL_GARDENING_MAP, 
  ALL_OCEAN_CLEANING_MAP, 
  cleanWeeklyWeather 
} from '../data/allMaps';
import { 
  mapLocalPetsToCloud, 
  mapCloudPetsToLocal 
} from '../utils/petUtils';
import { safeJsonParse } from '../lib/utils';
import { Pet, WeeklyWeather, DetailedWeather, PlantedSlot } from '../types';

export interface SyncConflictInfo {
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
  onResolve?: (choice: 'cloud' | 'merge' | 'local') => Promise<void>;
}

const APP_VERSION = 'v1.4.3';

function reconstructSlotsFromFarmingSlotsMap(farmingSlotsMap: Record<string, any>): PlantedSlot[] {
  if (!farmingSlotsMap || typeof farmingSlotsMap !== 'object') return [];
  
  const activeInstanceSlots: PlantedSlot[] = Object.values(farmingSlotsMap).filter((s: any) => s && s.cropId !== null);
  activeInstanceSlots.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));

  const slotsList: PlantedSlot[] = Array.from({ length: 8 }, (_, i) => ({
    id: `slot_${i + 1}`,
    cropId: null,
    cropName: null,
    cropEmoji: null,
    originalStartTime: null,
    originalDuration: null,
    userOffset: 0,
    isNotified: false
  }));

  activeInstanceSlots.forEach((slot, index) => {
    if (index < 8) {
      slotsList[index] = {
        ...slot,
        id: `slot_${index + 1}`
      };
    }
  });

  return slotsList;
}

export function useUserDataSync(user: any) {
  // Collection ID sets
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
    const parsed = safeJsonParse(saved, []).map((id: string) => {
      if (id === 'g-level12-phalaenopsis') return 'g-phalaenopsis';
      if (id === 'g-level13-unknown') return 'g-geranium';
      return id;
    });
    return new Set(parsed);
  });
  const [completedOceanCleaningIds, setCompletedOceanCleaningIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('completed_ocean_cleaning_ids');
    return new Set(safeJsonParse(saved, []));
  });

  // Master Sets
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
    const parsed = safeJsonParse(saved, []).map((id: string) => {
      if (id === 'g-level12-phalaenopsis') return 'g-phalaenopsis';
      if (id === 'g-level13-unknown') return 'g-geranium';
      return id;
    });
    return new Set(parsed);
  });
  const [masterOceanCleaningIds, setMasterOceanCleaningIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('master_ocean_cleaning_ids');
    return new Set(safeJsonParse(saved, []));
  });

  const [flowerColorCollections, setFlowerColorCollections] = useState<Record<string, Record<string, boolean>>>(() => {
    const saved = localStorage.getItem('flower_color_collections');
    return safeJsonParse(saved, {});
  });

  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('pigtown_pets');
    return safeJsonParse(saved, []);
  });

  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('item_ratings');
    return safeJsonParse(saved, {});
  });

  const [weeklyWeather, setWeeklyWeather] = useState<WeeklyWeather>(() => {
    const saved = localStorage.getItem('weekly_weather');
    return safeJsonParse(saved, {});
  });

  const [detailedWeather, setDetailedWeather] = useState<DetailedWeather>(() => {
    const saved = localStorage.getItem('detailed_weather');
    return safeJsonParse(saved, {});
  });

  const [syncConflict, setSyncConflict] = useState<SyncConflictInfo | null>(null);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const isInitialSyncDoneRef = useRef(false);
  const isResettingRef = useRef(false);
  const lastSyncedDataRef = useRef<string>('');
  const syncTimeoutRef = useRef<any>(null);

  const [isPermissionDeniedError, setIsPermissionDeniedError] = useState(false);
  const [isQuotaExceededError, setIsQuotaExceededError] = useState(false);

  const markCollectionsModified = useCallback(() => {
    localStorage.setItem('has_unsynced_changes', 'true');
    window.dispatchEvent(new Event('sync-status-changed'));
  }, []);

  function seedLastSyncedDataRef(data: any, ratingsData: any, weekly: any, detailed: any, petsData: any) {
    lastSyncedDataRef.current = JSON.stringify({
      completedBirdNames: data.completedBirdNames || [],
      completedInsectNames: data.completedInsectNames || [],
      completedFishNames: data.completedFishNames || [],
      completedFoodNames: data.completedFoodNames || [],
      completedGardeningNames: data.completedGardeningNames || [],
      completedOceanCleaningNames: data.completedOceanCleaningNames || [],
      ratings: ratingsData,
      weeklyWeather: weekly,
      detailedWeather: detailed,
      masterBirdNames: data.masterBirdNames || [],
      masterInsectNames: data.masterInsectNames || [],
      masterFishNames: data.masterFishNames || [],
      masterFoodNames: data.masterFoodNames || [],
      masterGardeningNames: data.masterGardeningNames || [],
      masterOceanCleaningNames: data.masterOceanCleaningNames || [],
      pets: petsData,
      flowerColorCollections: data.flowerColorCollections || {}
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

    const flowerColors = fields.flowerColors || fields.flowerColorCollections || {};
    setFlowerColorCollections(flowerColors);

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
    localStorage.setItem('flower_color_collections', JSON.stringify(flowerColors));

    if (fields.slots && fields.slots.length > 0) {
      localStorage.setItem('farming_slots', JSON.stringify(fields.slots));
      window.dispatchEvent(new Event('storage'));
    }

    localStorage.setItem('local_collections_updated_at', Date.now().toString());
    localStorage.setItem('sync_resolved_uid', loginUid);
  }

  async function writeLocalDataToFirestore(loggedInUser: any, fields: any) {
    const userDocRef = doc(db, 'users', loggedInUser.uid);
    const birdNames = Array.from(fields.birds).map((id: any) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
    const insectNames = Array.from(fields.insects).map((id: any) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
    const fishNames = Array.from(fields.fish).map((id: any) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
    const foodNames = Array.from(fields.food).map((id: any) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
    const gardeningNames = Array.from(fields.gardening).map((id: any) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();
    const oceanCleaningNames = Array.from(fields.oceanCleaning || []).map((id: any) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort();
    const masterBirdNames = Array.from(fields.masterBirds).map((id: any) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
    const masterInsectNames = Array.from(fields.masterInsects).map((id: any) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
    const masterFishNames = Array.from(fields.masterFish).map((id: any) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
    const masterFoodNames = Array.from(fields.masterFood).map((id: any) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
    const masterGardeningNames = Array.from(fields.masterGardening).map((id: any) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();
    const masterOceanCleaningNames = Array.from(fields.masterOceanCleaning || safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), [])).map((id: any) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort();

    const cloudPetsForWrite = mapLocalPetsToCloud(fields.pets);

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
      masterOceanCleaningNames,
      ratings: fields.ratings,
      weeklyWeather: fields.weeklyWeather,
      detailedWeather: fields.detailedWeather,
      flowerColorCollections: fields.flowerColors || fields.flowerColorCollections || {},
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
      userPresets: (() => {
        const presetsStr = localStorage.getItem('user_notification_presets');
        return presetsStr ? safeJsonParse(presetsStr, []) : [];
      })(),
      soundEnabled: (() => {
        const savedSound = localStorage.getItem('farming_sound_enabled');
        return savedSound ? safeJsonParse(savedSound, true) : true;
      })(),
      keepActualNotify: localStorage.getItem('farming_keep_actual_notify') === 'true',
      lastAppVersion: APP_VERSION,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  async function runInitialSync(loggedInUser: any) {
    if (!loggedInUser) return;
    let cloudPetsRaw: any[] = [];
    try {
      console.log("[Sync] Starting runInitialSync for user:", loggedInUser.uid);
      const loginUid = loggedInUser.uid;
      const userDocRef = doc(db, 'users', loggedInUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (auth.currentUser?.uid !== loginUid) {
        console.warn("[Sync] runInitialSync: loginUid changed after database read. Exiting.");
        return;
      }

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
      const localFlowerColorsStr = localStorage.getItem('flower_color_collections');

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
      const localFlowerColors = safeJsonParse(localFlowerColorsStr, {});

      const hasLocalProgress = localBirds.size > 0 || localInsects.size > 0 || localFish.size > 0 || localFood.size > 0 ||
        localGardening.size > 0 || localOceanCleaning.size > 0 || Object.keys(localWeekly).length > 0 || Object.keys(localDetailed).length > 0 || localPets.length > 0 ||
        localSlotsList.some((s: any) => s && s.cropId !== null) || Object.keys(localFlowerColors).length > 0;

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
        const cloudFlowerColors = data.flowerColorCollections || {};

        cloudPetsRaw = data.pets || [];
        const cloudPets = mapCloudPetsToLocal(cloudPetsRaw);
        const cloudSlotsList: any[] = data.farmingSlots 
          ? reconstructSlotsFromFarmingSlotsMap(data.farmingSlots)
          : (Array.isArray(data.slots) 
              ? data.slots 
              : Object.keys(data.slots || {}).sort().map(k => ({ ...data.slots[k], id: k })));

        const hasCloudProgress = cloudBirds.size > 0 || cloudInsects.size > 0 || cloudFish.size > 0 || cloudFood.size > 0 ||
          cloudGardening.size > 0 || cloudOceanCleaning.size > 0 || Object.keys(cloudWeeklyWeather).length > 0 || Object.keys(cloudDetailedWeather).length > 0 || cloudPets.length > 0 ||
          cloudSlotsList.some((s: any) => s && s.cropId !== null) || Object.keys(cloudFlowerColors).length > 0;

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
          if (typeof a !== 'object' || a === null) return a === b;

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

        const arePetsEqual = (a: any[], b: any[]): boolean => {
          const sortedA = [...(a || [])].sort((p1, p2) => String(p1.id || p1.name || '').localeCompare(String(p2.id || p2.name || '')));
          const sortedB = [...(b || [])].sort((p1, p2) => String(p1.id || p1.name || '').localeCompare(String(p2.id || p2.name || '')));
          return areValuesEqual(sortedA, sortedB);
        };

        const areSlotsEqual = (a: any[], b: any[]): boolean => {
          const listA = (a || []).map(s => s || {});
          const listB = (b || []).map(s => s || {});
          
          if (listA.length !== listB.length) return false;
          
          for (let i = 0; i < listA.length; i++) {
            const sa = listA[i];
            const sb = listB[i];
            if (sa.id !== sb.id) return false;
            if (sa.cropId !== sb.cropId) return false;
            if (sa.cropName !== sb.cropName) return false;
            if (sa.cropEmoji !== sb.cropEmoji) return false;
            
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
        if (!areValuesEqual(cloudFlowerColors, localFlowerColors)) {
          diffFields.push("원예 색상 도감");
        }

        const hasDifferences = () => diffFields.length > 0;

        if (hasLocalProgress && hasDifferences()) {
          const isSameUserSession = localStorage.getItem('sync_resolved_uid') === loggedInUser.uid;
          if (isSameUserSession) {
            console.log("[Sync] Same user session detected (sync_resolved_uid === currentUser.uid). Bypassing conflict popup.");
            const choice = localStorage.getItem('has_unsynced_changes') === 'true' ? 'merge' : 'cloud';
            isResettingRef.current = true;
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
                  slots: cloudSlotsList,
                  flowerColors: cloudFlowerColors
                }, loggedInUser.uid);

                seedLastSyncedDataRef(data, cloudRatings, cloudWeeklyWeather, cloudDetailedWeather, cloudPetsRaw);
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

                const mergedFlowerColors: Record<string, Record<string, boolean>> = {};
                const allKeys = new Set([...Object.keys(cloudFlowerColors), ...Object.keys(localFlowerColors)]);
                allKeys.forEach(key => {
                  const cloudVariants = cloudFlowerColors[key] || {};
                  const localVariants = localFlowerColors[key] || {};
                  const mergedVariants: Record<string, boolean> = {};
                  const allVariantsKeys = new Set([...Object.keys(cloudVariants), ...Object.keys(localVariants)]);
                  allVariantsKeys.forEach(variantKey => {
                    mergedVariants[variantKey] = !!(cloudVariants[variantKey] || localVariants[variantKey]);
                  });
                  mergedFlowerColors[key] = mergedVariants;
                });

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
                  slots: finalFarmingSlots,
                  flowerColors: mergedFlowerColors
                };

                await writeLocalDataToFirestore(loggedInUser, mergedData);
                applyFetchedDataToLocal(mergedData, loggedInUser.uid);
              }

              localStorage.removeItem('has_unsynced_changes');
              setIsInitialSyncDone(true);
              isInitialSyncDoneRef.current = true;
            } catch (e) {
              console.error("[Sync] Silent conflict resolution error:", e);
            } finally {
              isResettingRef.current = false;
            }
            return;
          }

          console.log("[Sync] Conflict detected: Local progress and cloud source differ. Triggering modal choice.");
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
              isResettingRef.current = true;
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
                    slots: cloudSlotsList,
                    flowerColors: cloudFlowerColors
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
                    slots: localSlotsList,
                    flowerColors: localFlowerColors
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
                    slots: localSlotsList,
                    flowerColors: localFlowerColors
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

                  const mergedFlowerColors: Record<string, Record<string, boolean>> = {};
                  const allKeys = new Set([...Object.keys(cloudFlowerColors), ...Object.keys(localFlowerColors)]);
                  allKeys.forEach(key => {
                    const cloudVariants = cloudFlowerColors[key] || {};
                    const localVariants = localFlowerColors[key] || {};
                    const mergedVariants: Record<string, boolean> = {};
                    const allVariantsKeys = new Set([...Object.keys(cloudVariants), ...Object.keys(localVariants)]);
                    allVariantsKeys.forEach(variantKey => {
                      mergedVariants[variantKey] = !!(cloudVariants[variantKey] || localVariants[variantKey]);
                    });
                    mergedFlowerColors[key] = mergedVariants;
                  });

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
                    slots: finalFarmingSlots,
                    flowerColors: mergedFlowerColors
                  };

                  await writeLocalDataToFirestore(loggedInUser, mergedData);
                  applyFetchedDataToLocal(mergedData, loggedInUser.uid);
                }

                localStorage.removeItem('has_unsynced_changes');
                setIsInitialSyncDone(true);
                isInitialSyncDoneRef.current = true;
                setSyncConflict(null);
              } catch (e) {
                console.error("[Sync] Error in conflict modal resolution choice:", e);
              } finally {
                isResettingRef.current = false;
              }
            }
          });
          return;
        }

        if (hasCloudProgress && (!hasLocalProgress || !hasDifferences())) {
          console.log("[Sync] Clean adoption of Firestore cloud database progress.");
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
            slots: cloudSlotsList,
            flowerColors: cloudFlowerColors
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
            slots: localSlotsList,
            flowerColors: localFlowerColors
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
            slots: [],
            flowerColors: {}
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
          slots: localSlotsList,
          flowerColors: localFlowerColors
        };

        if (hasLocalProgress) {
          await writeLocalDataToFirestore(loggedInUser, initData);
        }
        applyFetchedDataToLocal(initData, loggedInUser.uid);
      }

      localStorage.removeItem('has_unsynced_changes');
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

  return {
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
    markCollectionsModified,
    runInitialSync,
    writeLocalDataToFirestore,
    applyFetchedDataToLocal,
    seedLastSyncedDataRef,
    isPermissionDeniedError,
    isQuotaExceededError,
  };
}
