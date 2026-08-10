import { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp, deleteField, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateBusinessHash } from '../utils/dataSyncUtils';
import { 
  ALL_BIRDS_MAP, 
  ALL_INSECTS_MAP, 
  ALL_FISH_MAP, 
  ALL_COOKING_MAP, 
  ALL_GARDENING_MAP, 
  ALL_OCEAN_CLEANING_MAP, 
  cleanWeeklyWeather 
} from '../data/allMaps';
import { mapLocalPetsToCloud, mapCloudPetsToLocal } from '../utils/petUtils';
import { safeJsonParse } from '../lib/utils';
import { OCEAN_RENAME_MAP } from '../lib/appHelpers';
import versionData from '../version.json';

const APP_VERSION = versionData.version;

function getWriteReason(prevData: any, currentData: any): string[] {
  if (!prevData) return ["initialSync"];
  const reasons: string[] = [];
  if (JSON.stringify(prevData.completedBirdNames) !== JSON.stringify(currentData.completedBirdNames)) reasons.push("completedBirdNames");
  if (JSON.stringify(prevData.completedInsectNames) !== JSON.stringify(currentData.completedInsectNames)) reasons.push("completedInsectNames");
  if (JSON.stringify(prevData.completedFishNames) !== JSON.stringify(currentData.completedFishNames)) reasons.push("completedFishNames");
  if (JSON.stringify(prevData.completedFoodNames) !== JSON.stringify(currentData.completedFoodNames)) reasons.push("completedFoodNames");
  if (JSON.stringify(prevData.completedGardeningNames) !== JSON.stringify(currentData.completedGardeningNames)) reasons.push("completedGardeningNames");
  if (JSON.stringify(prevData.completedOceanCleaningNames) !== JSON.stringify(currentData.completedOceanCleaningNames)) reasons.push("completedOceanCleaningNames");
  if (JSON.stringify(prevData.ratings) !== JSON.stringify(currentData.ratings)) reasons.push("ratings");
  if (JSON.stringify(prevData.weeklyWeather) !== JSON.stringify(currentData.weeklyWeather)) reasons.push("weeklyWeather");
  if (JSON.stringify(prevData.detailedWeather) !== JSON.stringify(currentData.detailedWeather)) reasons.push("detailedWeather");
  if (JSON.stringify(prevData.masterBirdNames) !== JSON.stringify(currentData.masterBirdNames)) reasons.push("masterBirdNames");
  if (JSON.stringify(prevData.masterInsectNames) !== JSON.stringify(currentData.masterInsectNames)) reasons.push("masterInsectNames");
  if (JSON.stringify(prevData.masterFishNames) !== JSON.stringify(currentData.masterFishNames)) reasons.push("masterFishNames");
  if (JSON.stringify(prevData.masterFoodNames) !== JSON.stringify(currentData.masterFoodNames)) reasons.push("masterFoodNames");
  if (JSON.stringify(prevData.masterGardeningNames) !== JSON.stringify(currentData.masterGardeningNames)) reasons.push("masterGardeningNames");
  if (JSON.stringify(prevData.masterOceanCleaningNames) !== JSON.stringify(currentData.masterOceanCleaningNames)) reasons.push("masterOceanCleaningNames");
  if (JSON.stringify(prevData.pets) !== JSON.stringify(currentData.pets)) reasons.push("pets");
  if (JSON.stringify(prevData.flowerColorCollections) !== JSON.stringify(currentData.flowerColorCollections)) reasons.push("flowerColorCollections");
  return reasons.length > 0 ? reasons : ["unknown"];
}

function getFarmingSyncRemainingTime(): number | null {
  const nextSyncTimeStr = localStorage.getItem('farming_next_sync_target_at');
  if (!nextSyncTimeStr) return null;
  const nextSyncTime = parseInt(nextSyncTimeStr, 10);
  if (isNaN(nextSyncTime)) return null;
  const remaining = nextSyncTime - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function useRealtimeSync(
  user: any,
  isInitialSyncDone: boolean,
  isInitialSyncDoneRef: MutableRefObject<boolean>,
  setCompletedBirdIds: (ids: Set<string>) => void,
  setCompletedInsectIds: (ids: Set<string>) => void,
  setCompletedFishIds: (ids: Set<string>) => void,
  setCompletedFoodIds: (ids: Set<string>) => void,
  setCompletedGardeningIds: (ids: Set<string>) => void,
  setCompletedOceanCleaningIds: (ids: Set<string>) => void,
  setMasterBirdIds: (ids: Set<string>) => void,
  setMasterInsectIds: (ids: Set<string>) => void,
  setMasterFishIds: (ids: Set<string>) => void,
  setMasterFoodIds: (ids: Set<string>) => void,
  setMasterGardeningIds: (ids: Set<string>) => void,
  setMasterOceanCleaningIds: (ids: Set<string>) => void,
  setFlowerColorCollections: (colors: any) => void,
  setRatings: (ratings: any) => void,
  setWeeklyWeather: (weather: any) => void,
  setDetailedWeather: (weather: any) => void,
  setPets: (pets: any[]) => void,
  setIsPermissionDeniedError?: (val: boolean) => void,
  setIsQuotaExceededError?: (val: boolean) => void,
  isDirtyRefParam?: MutableRefObject<boolean>,
  isResettingParam?: MutableRefObject<boolean>,
  globalSyncTimerRefParam?: MutableRefObject<NodeJS.Timeout | null>
) {
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(() => {
    return localStorage.getItem('has_unsynced_changes') === 'true';
  });

  const localIsDirtyRef = useRef(false);
  const isDirtyRef = isDirtyRefParam || localIsDirtyRef;

  const localIsResetting = useRef(false);
  const isResetting = isResettingParam || localIsResetting;

  const localGlobalSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const globalSyncTimerRef = globalSyncTimerRefParam || localGlobalSyncTimerRef;

  const lastSyncedDataRef = useRef<string | null>(null);
  // NEW: Track mutation sequence to distinguish between user-driven and snapshot-driven updates
  const localMutationSequenceRef = useRef(0);
  const lastAppliedRemoteHashRef = useRef<string | null>(null);
  const lastWrittenHashRef = useRef<string | null>(null);
  
  const globalSyncTargetTimeRef = useRef<number | null>(null);
  const hasFarmingSyncPendingRef = useRef(false);

  useEffect(() => {
    const handleSyncStatus = () => {
      setHasUnsyncedChanges(localStorage.getItem('has_unsynced_changes') === 'true');
    };
    window.addEventListener('storage', handleSyncStatus);
    window.addEventListener('sync-status-changed', handleSyncStatus);
    return () => {
      window.removeEventListener('storage', handleSyncStatus);
      window.removeEventListener('sync-status-changed', handleSyncStatus);
    };
  }, []);

  const markCollectionsModified = useCallback(() => {
    isDirtyRef.current = true;
    localMutationSequenceRef.current++; // Increment on mutation
    localStorage.setItem('has_unsynced_changes', 'true');
    localStorage.setItem('local_collections_updated_at', Date.now().toString());
    setHasUnsyncedChanges(true);
    window.dispatchEvent(new Event('sync-status-changed'));
  }, []);

  const debouncedSyncAllData = useCallback((delay: number = 2000) => {
    if (!user) return;

    const farmingRemaining = getFarmingSyncRemainingTime();
    let actualDelay = delay;
    if (farmingRemaining !== null && farmingRemaining > 0) {
      actualDelay = Math.min(delay, farmingRemaining);
    }

    if (globalSyncTimerRef.current) clearTimeout(globalSyncTimerRef.current);

    globalSyncTargetTimeRef.current = Date.now() + actualDelay;
    globalSyncTimerRef.current = setTimeout(async () => {
      hasFarmingSyncPendingRef.current = false;
      const localBirdsStr = localStorage.getItem('completed_bird_ids');
      const localInsectsStr = localStorage.getItem('completed_insect_ids');
      const localFishStr = localStorage.getItem('completed_fish_ids');
      const localFoodStr = localStorage.getItem('completed_food_ids');
      const localGardeningStr = localStorage.getItem('completed_gardening_ids');
      const localOceanCleaningStr = localStorage.getItem('completed_ocean_cleaning_ids');
      const localRatingsStr = localStorage.getItem('item_ratings');
      const localWeeklyStr = localStorage.getItem('weekly_weather');
      const localDetailedStr = localStorage.getItem('detailed_weather');
      const localMasterBirdsStr = localStorage.getItem('master_bird_ids');
      const localMasterInsectsStr = localStorage.getItem('master_insect_ids');
      const localMasterFishStr = localStorage.getItem('master_fish_ids');
      const localMasterFoodStr = localStorage.getItem('master_food_ids');
      const localMasterGardeningStr = localStorage.getItem('master_gardening_ids');
      const localMasterOceanCleaningStr = localStorage.getItem('master_ocean_cleaning_ids');
      const localPetsStr = localStorage.getItem('pigtown_pets');
      const rawLocalSlots = localStorage.getItem('farming_slots');
      const localFlowerColorsStr = localStorage.getItem('flower_color_collections');

      const localBirds = safeJsonParse(localBirdsStr, []).sort();
      const localInsects = safeJsonParse(localInsectsStr, []).sort();
      const localFish = safeJsonParse(localFishStr, []).sort();
      const localFood = safeJsonParse(localFoodStr, []).sort();
      const localGardening = safeJsonParse(localGardeningStr, []).sort();
      const localRatings = safeJsonParse(localRatingsStr, {});
      const localWeekly = safeJsonParse(localWeeklyStr, {});
      const localDetailed = safeJsonParse(localDetailedStr, {});
      const localMasterBirds = safeJsonParse(localMasterBirdsStr, []).sort();
      const localMasterInsects = safeJsonParse(localMasterInsectsStr, []).sort();
      const localMasterFish = safeJsonParse(localMasterFishStr, []).sort();
      const localMasterFood = safeJsonParse(localMasterFoodStr, []).sort();
      const localMasterGardening = safeJsonParse(localMasterGardeningStr, []).sort();
      const localPets = safeJsonParse(localPetsStr, []);
      const slotsList = safeJsonParse(rawLocalSlots, []);
      const localFlowerColors = safeJsonParse(localFlowerColorsStr, {});

      const birdNames = localBirds.map((id: string) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
      const insectNames = localInsects.map((id: string) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
      const fishNames = localFish.map((id: string) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
      const foodNames = localFood.map((id: string) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
      const gardeningNames = localGardening.map((id: string) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();
      const masterBirdNames = localMasterBirds.map((id: string) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
      const masterInsectNames = localMasterInsects.map((id: string) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
      const masterFishNames = localMasterFish.map((id: string) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
      const masterFoodNames = localMasterFood.map((id: string) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
      const masterGardeningNames = localMasterGardening.map((id: string) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();

      const cloudPets = mapLocalPetsToCloud(localPets);

      const currentData = {
        completedBirdNames: birdNames,
        completedInsectNames: insectNames,
        completedFishNames: fishNames,
        completedFoodNames: foodNames,
        completedGardeningNames: gardeningNames,
        completedOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("completed_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
        ratings: localRatings,
        weeklyWeather: localWeekly,
        detailedWeather: localDetailed,
        masterBirdNames: masterBirdNames,
        masterInsectNames: masterInsectNames,
        masterFishNames: masterFishNames,
        masterFoodNames: masterFoodNames,
        masterGardeningNames: masterGardeningNames,
        masterOceanCleaningNames: Array.from(new Set(safeJsonParse(localStorage.getItem("master_ocean_cleaning_ids"), []))).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort(),
        pets: cloudPets,
        slots: slotsList,
        flowerColorCollections: localFlowerColors
      };

      const dataJson = JSON.stringify(currentData);

      if (!isInitialSyncDoneRef.current) {
        isInitialSyncDoneRef.current = true;
      }

      // NEW LOGIC
      const currentBusinessHash = calculateBusinessHash(currentData);
      const isRemoteDerived = lastAppliedRemoteHashRef.current === currentBusinessHash;
      const isUnchanged = lastWrittenHashRef.current === currentBusinessHash;
      
      if ((isRemoteDerived || isUnchanged) && !isDirtyRef.current) {
        console.log("[SYNC_SKIP]", { businessHash: currentBusinessHash, isRemoteDerived, isUnchanged });
        localStorage.removeItem('has_unsynced_changes');
        isDirtyRef.current = false;
        setHasUnsyncedChanges(false);
        window.dispatchEvent(new Event('sync-status-changed'));
        return;
      }

      isDirtyRef.current = false;
      const writePayloadHash = currentBusinessHash; 

      try {
        const userDocRef = doc(db, 'users', user.uid);
        localStorage.setItem('local_last_write_at', Date.now().toString());
        localStorage.setItem('collections_write_lock_at', Date.now().toString());

        const prevDataStr = lastSyncedDataRef.current;
        const prevData = safeJsonParse(prevDataStr, null);
        const prevRatings = prevData?.ratings || {};

        const ratingsForWrite: Record<string, any> = { ...localRatings };
        Object.keys(prevRatings).forEach(name => {
          if (localRatings[name] === undefined || localRatings[name] === 0) {
            ratingsForWrite[name] = deleteField();
          }
        });

        const prevWeekly = prevData?.weeklyWeather || {};
        const weeklyForWrite: Record<string, any> = { ...localWeekly };
        Object.keys(prevWeekly).forEach(dayKey => {
          if (localWeekly[dayKey] === undefined) {
            weeklyForWrite[dayKey] = deleteField();
          }
        });

        const prevDetailed = prevData?.detailedWeather || {};
        const detailedForWrite: Record<string, any> = { ...localDetailed };
        Object.keys(prevDetailed).forEach(key => {
          if (localDetailed[key] === undefined) {
            detailedForWrite[key] = deleteField();
          }
        });

        await setDoc(userDocRef, {
          ...currentData,
          slots: deleteField(),
          ratings: ratingsForWrite,
          weeklyWeather: weeklyForWrite,
          detailedWeather: detailedForWrite,
          lastAppVersion: APP_VERSION,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Update successful hashes ONLY after success
        lastWrittenHashRef.current = writePayloadHash;
        lastSyncedDataRef.current = dataJson;

        console.log("[SYNC_WRITE_SUCCESS]", { businessHash: writePayloadHash });

        if (!isDirtyRef.current) {
          localStorage.removeItem('has_unsynced_changes');
          setHasUnsyncedChanges(false);
          window.dispatchEvent(new Event('sync-status-changed'));
        }
      } catch (err: any) {
        console.error("Firestore cloud sync failed:", err);
        const errStr = String(err).toLowerCase();
        if ((err?.code === 'permission-denied' || errStr.includes('permission')) && setIsPermissionDeniedError) {
          setIsPermissionDeniedError(true);
        } else if ((err?.code === 'resource-exhausted' || errStr.includes('quota exceeded') || errStr.includes('resource-exhausted')) && setIsQuotaExceededError) {
          setIsQuotaExceededError(true);
        }

        isDirtyRef.current = true;
        localStorage.setItem('has_unsynced_changes', 'true');
        setHasUnsyncedChanges(true);
        window.dispatchEvent(new Event('sync-status-changed'));
      }
    }, delay);
  }, [user, setIsPermissionDeniedError, setIsQuotaExceededError]);

  const forceSyncAllData = useCallback(async (loggedInUser: any) => {
    if (!loggedInUser) return false;
    try {
      const localBirds = safeJsonParse(localStorage.getItem('completed_bird_ids'), []).sort();
      const localInsects = safeJsonParse(localStorage.getItem('completed_insect_ids'), []).sort();
      const localFish = safeJsonParse(localStorage.getItem('completed_fish_ids'), []).sort();
      const localFood = safeJsonParse(localStorage.getItem('completed_food_ids'), []).sort();
      const localGardening = safeJsonParse(localStorage.getItem('completed_gardening_ids'), []).sort();
      const localOceanCleaning = safeJsonParse(localStorage.getItem('completed_ocean_cleaning_ids'), []).sort();
      const localRatings = safeJsonParse(localStorage.getItem('item_ratings'), {});
      const localWeekly = safeJsonParse(localStorage.getItem('weekly_weather'), {});
      const localDetailed = safeJsonParse(localStorage.getItem('detailed_weather'), {});
      const localMasterBirds = safeJsonParse(localStorage.getItem('master_bird_ids'), []).sort();
      const localMasterInsects = safeJsonParse(localStorage.getItem('master_insect_ids'), []).sort();
      const localMasterFish = safeJsonParse(localStorage.getItem('master_fish_ids'), []).sort();
      const localMasterFood = safeJsonParse(localStorage.getItem('master_food_ids'), []).sort();
      const localMasterGardening = safeJsonParse(localStorage.getItem('master_gardening_ids'), []).sort();
      const localMasterOceanCleaning = safeJsonParse(localStorage.getItem('master_ocean_cleaning_ids'), []).sort();
      const localPets = safeJsonParse(localStorage.getItem('pigtown_pets'), []);
      const slotsList = safeJsonParse(localStorage.getItem('farming_slots'), []);
      const localFlowerColors = safeJsonParse(localStorage.getItem('flower_color_collections'), {});

      const birdNames = localBirds.map((id: string) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
      const insectNames = localInsects.map((id: string) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
      const fishNames = localFish.map((id: string) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
      const foodNames = localFood.map((id: string) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
      const gardeningNames = localGardening.map((id: string) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();
      const oceanCleaningNames = localOceanCleaning.map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort();
      const masterBirdNames = localMasterBirds.map((id: string) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
      const masterInsectNames = localMasterInsects.map((id: string) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
      const masterFishNames = localMasterFish.map((id: string) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
      const masterFoodNames = localMasterFood.map((id: string) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
      const masterGardeningNames = localMasterGardening.map((id: string) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();
      const masterOceanCleaningNames = localMasterOceanCleaning.map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort();

      const cloudPets = mapLocalPetsToCloud(localPets);

      const farmingSlotsPayload: any = {};
      const slotsListArray = Array.isArray(slotsList) ? slotsList : [];
      slotsListArray.forEach((s: any) => {
        if (s && s.cropId !== null) {
          if (!s.instanceId) {
            s.instanceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          }
          if (!s.updatedAt) {
            s.updatedAt = Date.now();
          }
          farmingSlotsPayload[s.instanceId] = s;
        }
      });

      const currentData = {
        completedBirdNames: birdNames,
        completedInsectNames: insectNames,
        completedFishNames: fishNames,
        completedFoodNames: foodNames,
        completedGardeningNames: gardeningNames,
        completedOceanCleaningNames: oceanCleaningNames,
        ratings: localRatings,
        weeklyWeather: localWeekly,
        detailedWeather: localDetailed,
        masterBirdNames: masterBirdNames,
        masterInsectNames: masterInsectNames,
        masterFishNames: masterFishNames,
        masterFoodNames: masterFoodNames,
        masterGardeningNames: masterGardeningNames,
        masterOceanCleaningNames: masterOceanCleaningNames,
        pets: cloudPets,
        farmingSlots: farmingSlotsPayload,
        flowerColorCollections: localFlowerColors
      };

      const userDocRef = doc(db, 'users', loggedInUser.uid);
      localStorage.setItem('local_last_write_at', Date.now().toString());
      localStorage.setItem('collections_write_lock_at', Date.now().toString());

      await setDoc(userDocRef, {
        ...currentData,
        slots: deleteField(),
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

      lastSyncedDataRef.current = JSON.stringify({ ...currentData, slots: slotsList });
      if (!isDirtyRef.current) {
        localStorage.removeItem('has_unsynced_changes');
        setHasUnsyncedChanges(false);
        window.dispatchEvent(new Event('sync-status-changed'));
      }
      return true;
    } catch (err) {
      console.error("[Sync] forceSyncAllData failed:", err);
      return false;
    }
  }, []);

  // Passive snapshot listener for real-time sync across devices
  useEffect(() => {
    if (!user || !isInitialSyncDone) {
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const activeUnsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (isResetting.current || !snapshot.exists()) return;
      if (snapshot.metadata.hasPendingWrites) {
        console.log("[Sync] Snapshot has pending writes, skipping passive update to prevent loops.");
        return;
      }

      // 1. Prevent passive sync from overwriting local edits if local changes are currently unsynced
      const hasUnsynced = localStorage.getItem('has_unsynced_changes') === 'true';
      if (isDirtyRef.current || hasUnsynced) {
        console.log("[Sync] Local collection changes are pending. Skipping passive snapshot to protect rapid user actions.");
        return;
      }

      const data = snapshot.data();
      
      // Calculate hash of remote data to track as 'applied remote hash'
      const remoteBusinessHash = calculateBusinessHash(data);
      lastAppliedRemoteHashRef.current = remoteBusinessHash;
      
      console.log("[SYNC_REMOTE]", { businessHash: remoteBusinessHash });

      const cloudUpdatedAt = data.updatedAt ? data.updatedAt.toDate().getTime() : 0;
      const localUpdatedAt = parseInt(localStorage.getItem('local_collections_updated_at') || '0', 10);
      const localWriteLockAt = parseInt(localStorage.getItem('collections_write_lock_at') || '0', 10);

      // 2. Lock window & timestamp checks to prevent echo overrides
      if (localUpdatedAt > localWriteLockAt || cloudUpdatedAt <= localUpdatedAt + 500) {
        console.log("[Sync] Local edits newer than write lock or cloud update not newer. Skipping passive snapshot.");
        return;
      }

      if ((Date.now() - localWriteLockAt < 10000) && (cloudUpdatedAt <= localWriteLockAt + 5000)) {
        console.log("[Sync] Recently locked write echo detected. Skipping passive snapshot.");
        return;
      }

      const cloudBirdNames = new Set<string>(data.completedBirdNames || []);
      const cloudInsectNames = new Set<string>(data.completedInsectNames || []);
      const cloudFishNames = new Set<string>(data.completedFishNames || []);
      const cloudFoodNames = new Set<string>(data.completedFoodNames || []);
      const cloudGardeningNames = new Set<string>(data.completedGardeningNames || []);
      const cloudOceanCleaningNames = new Set<string>((data.completedOceanCleaningNames || []).map((name: string) => OCEAN_RENAME_MAP[name] || name));
      const cloudMasterBirdNames = new Set<string>(data.masterBirdNames || []);
      const cloudMasterInsectNames = new Set<string>(data.masterInsectNames || []);
      const cloudMasterFishNames = new Set<string>(data.masterFishNames || []);
      const cloudMasterFoodNames = new Set<string>(data.masterFoodNames || []);
      const cloudMasterGardeningNames = new Set<string>(data.masterGardeningNames || []);
      const cloudMasterOceanCleaningNames = new Set<string>((data.masterOceanCleaningNames || []).map((name: string) => OCEAN_RENAME_MAP[name] || name));

      const cloudBirdIds = new Set(ALL_BIRDS_MAP.filter(b => cloudBirdNames.has(b.name) || cloudBirdNames.has(b.id)).map(b => b.id));
      const cloudInsectIds = new Set(ALL_INSECTS_MAP.filter(i => cloudInsectNames.has(i.name) || cloudInsectNames.has(i.id)).map(i => i.id));
      const cloudFishIds = new Set(ALL_FISH_MAP.filter(f => cloudFishNames.has(f.name) || cloudFishNames.has(f.id)).map(f => f.id));
      const cloudFoodIds = new Set(ALL_COOKING_MAP.filter(c => cloudFoodNames.has(c.name) || cloudFoodNames.has(c.id)).map(c => c.id));
      const cloudGardeningIds = new Set(ALL_GARDENING_MAP.filter(g => cloudGardeningNames.has(g.name) || cloudGardeningNames.has(g.id)).map(g => g.id));
      const cloudOceanCleaningIds = new Set(ALL_OCEAN_CLEANING_MAP.filter(o => cloudOceanCleaningNames.has(o.name) || cloudOceanCleaningNames.has(o.id)).map(o => o.id));

      const cloudMasterBirdIds = new Set(ALL_BIRDS_MAP.filter(b => cloudMasterBirdNames.has(b.name) || cloudMasterBirdNames.has(b.id)).map(b => b.id));
      const cloudMasterInsectIds = new Set(ALL_INSECTS_MAP.filter(i => cloudMasterInsectNames.has(i.name) || cloudMasterInsectNames.has(i.id)).map(i => i.id));
      const cloudMasterFishIds = new Set(ALL_FISH_MAP.filter(f => cloudMasterFishNames.has(f.name) || cloudMasterFishNames.has(f.id)).map(f => f.id));
      const cloudMasterFoodIds = new Set(ALL_COOKING_MAP.filter(c => cloudMasterFoodNames.has(c.name) || cloudMasterFoodNames.has(c.id)).map(c => c.id));
      const cloudMasterGardeningIds = new Set(ALL_GARDENING_MAP.filter(g => cloudMasterGardeningNames.has(g.name) || cloudMasterGardeningNames.has(g.id)).map(g => g.id));
      const cloudMasterOceanCleaningIds = new Set(ALL_OCEAN_CLEANING_MAP.filter(o => cloudMasterOceanCleaningNames.has(o.name) || cloudMasterOceanCleaningNames.has(o.id)).map(o => o.id));

      setCompletedBirdIds(cloudBirdIds);
      setCompletedInsectIds(cloudInsectIds);
      setCompletedFishIds(cloudFishIds);
      setCompletedFoodIds(cloudFoodIds);
      setCompletedGardeningIds(cloudGardeningIds);
      setCompletedOceanCleaningIds(cloudOceanCleaningIds);

      setMasterBirdIds(cloudMasterBirdIds);
      setMasterInsectIds(cloudMasterInsectIds);
      setMasterFishIds(cloudMasterFishIds);
      setMasterFoodIds(cloudMasterFoodIds);
      setMasterGardeningIds(cloudMasterGardeningIds);
      setMasterOceanCleaningIds(cloudMasterOceanCleaningIds);

      if (data.ratings) {
        setRatings(data.ratings);
        localStorage.setItem('item_ratings', JSON.stringify(data.ratings));
      }
      if (data.flowerColorCollections) {
        setFlowerColorCollections(data.flowerColorCollections);
        localStorage.setItem('flower_color_collections', JSON.stringify(data.flowerColorCollections));
      }
      if (data.pets) {
        const decodedPets = mapCloudPetsToLocal(data.pets);
        setPets(decodedPets);
        localStorage.setItem('pigtown_pets', JSON.stringify(decodedPets));
      }
      if (data.weeklyWeather) {
        const cleanedWeekly = cleanWeeklyWeather(data.weeklyWeather);
        setWeeklyWeather(cleanedWeekly);
        localStorage.setItem('weekly_weather', JSON.stringify(cleanedWeekly));
      }
      if (data.detailedWeather) {
        setDetailedWeather(data.detailedWeather);
        localStorage.setItem('detailed_weather', JSON.stringify(data.detailedWeather));
      }

      localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(cloudBirdIds)));
      localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(cloudInsectIds)));
      localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(cloudFishIds)));
      localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(cloudFoodIds)));
      localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(cloudGardeningIds)));
      localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(cloudOceanCleaningIds)));

      localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(cloudMasterBirdIds)));
      localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(cloudMasterInsectIds)));
      localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(cloudMasterFishIds)));
      localStorage.setItem('master_food_ids', JSON.stringify(Array.from(cloudMasterFoodIds)));
      localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(cloudMasterGardeningIds)));
      localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(cloudMasterOceanCleaningIds)));

      const birdNames = Array.from(cloudBirdIds).map((id: string) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
      const insectNames = Array.from(cloudInsectIds).map((id: string) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
      const fishNames = Array.from(cloudFishIds).map((id: string) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
      const foodNames = Array.from(cloudFoodIds).map((id: string) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
      const gardeningNames = Array.from(cloudGardeningIds).map((id: string) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();
      const oceanCleaningNames = Array.from(cloudOceanCleaningIds).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort();
      const masterBirdNames = Array.from(cloudMasterBirdIds).map((id: string) => ALL_BIRDS_MAP.find(b => b.id === id)?.name || id).sort();
      const masterInsectNames = Array.from(cloudMasterInsectIds).map((id: string) => ALL_INSECTS_MAP.find(i => i.id === id)?.name || id).sort();
      const masterFishNames = Array.from(cloudMasterFishIds).map((id: string) => ALL_FISH_MAP.find(f => f.id === id)?.name || id).sort();
      const masterFoodNames = Array.from(cloudMasterFoodIds).map((id: string) => ALL_COOKING_MAP.find(c => c.id === id)?.name || id).sort();
      const masterGardeningNames = Array.from(cloudMasterGardeningIds).map((id: string) => ALL_GARDENING_MAP.find(g => g.id === id)?.name || id).sort();
      const masterOceanCleaningNames = Array.from(cloudMasterOceanCleaningIds).map((id: string) => ALL_OCEAN_CLEANING_MAP.find(o => o.id === id)?.name || id).sort();

      const decodedPets = data.pets ? mapCloudPetsToLocal(data.pets) : [];
      const cloudPetsData = mapLocalPetsToCloud(decodedPets);

      lastSyncedDataRef.current = JSON.stringify({
        completedBirdNames: birdNames,
        completedInsectNames: insectNames,
        completedFishNames: fishNames,
        completedFoodNames: foodNames,
        completedGardeningNames: gardeningNames,
        completedOceanCleaningNames: oceanCleaningNames,
        ratings: data.ratings || {},
        weeklyWeather: cleanWeeklyWeather(data.weeklyWeather || {}),
        detailedWeather: data.detailedWeather || {},
        masterBirdNames: masterBirdNames,
        masterInsectNames: masterInsectNames,
        masterFishNames: masterFishNames,
        masterFoodNames: masterFoodNames,
        masterGardeningNames: masterGardeningNames,
        masterOceanCleaningNames: masterOceanCleaningNames,
        pets: cloudPetsData,
        slots: safeJsonParse(localStorage.getItem('farming_slots'), []),
        flowerColorCollections: data.flowerColorCollections || {}
      });
    });

    return () => activeUnsubscribe();
  }, [
    user,
    isInitialSyncDone,
    setCompletedBirdIds,
    setCompletedInsectIds,
    setCompletedFishIds,
    setCompletedFoodIds,
    setCompletedGardeningIds,
    setCompletedOceanCleaningIds,
    setMasterBirdIds,
    setMasterInsectIds,
    setMasterFishIds,
    setMasterFoodIds,
    setMasterGardeningIds,
    setMasterOceanCleaningIds,
    setRatings,
    setFlowerColorCollections,
    setPets,
    setWeeklyWeather,
    setDetailedWeather
  ]);

  const getGlobalSyncRemainingTime = useCallback(() => {
    if (!globalSyncTargetTimeRef.current) return null;
    const remaining = globalSyncTargetTimeRef.current - Date.now();
    return remaining > 0 ? remaining : 0;
  }, []);

  const onFarmingSyncScheduled = useCallback((targetAt: number) => {
    hasFarmingSyncPendingRef.current = true;
    localStorage.setItem('farming_next_sync_target_at', targetAt.toString());
    debouncedSyncAllData(2000);
  }, [debouncedSyncAllData]);

  return {
    hasUnsyncedChanges,
    setHasUnsyncedChanges,
    isDirtyRef,
    isResetting,
    lastSyncedDataRef,
    globalSyncTimerRef,
    markCollectionsModified,
    debouncedSyncAllData,
    forceSyncAllData,
    getGlobalSyncRemainingTime,
    onFarmingSyncScheduled,
  };
}
