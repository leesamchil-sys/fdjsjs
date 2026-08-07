import React, { Dispatch, SetStateAction } from 'react';
import { doc, setDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeJsonParse } from '../lib/utils';
import { Category, ThemeMode, Pet, SortOrder } from '../types';
import { cleanWeeklyWeather } from '../data/allMaps';

interface UseBackupRestoreParams {
  completedBirdIds: Set<string>;
  completedInsectIds: Set<string>;
  completedFishIds: Set<string>;
  completedFoodIds: Set<string>;
  completedGardeningIds: Set<string>;
  completedOceanCleaningIds: Set<string>;
  masterBirdIds: Set<string>;
  masterInsectIds: Set<string>;
  masterFishIds: Set<string>;
  masterFoodIds: Set<string>;
  masterGardeningIds: Set<string>;
  masterOceanCleaningIds: Set<string>;
  setCompletedBirdIds: Dispatch<SetStateAction<Set<string>>>;
  setCompletedInsectIds: Dispatch<SetStateAction<Set<string>>>;
  setCompletedFishIds: Dispatch<SetStateAction<Set<string>>>;
  setCompletedFoodIds: Dispatch<SetStateAction<Set<string>>>;
  setCompletedGardeningIds: Dispatch<SetStateAction<Set<string>>>;
  setCompletedOceanCleaningIds: Dispatch<SetStateAction<Set<string>>>;
  setMasterBirdIds: Dispatch<SetStateAction<Set<string>>>;
  setMasterInsectIds: Dispatch<SetStateAction<Set<string>>>;
  setMasterFishIds: Dispatch<SetStateAction<Set<string>>>;
  setMasterFoodIds: Dispatch<SetStateAction<Set<string>>>;
  setMasterGardeningIds: Dispatch<SetStateAction<Set<string>>>;
  setMasterOceanCleaningIds: Dispatch<SetStateAction<Set<string>>>;
  pets: Pet[];
  setPets: Dispatch<SetStateAction<Pet[]>>;
  ratings: Record<string, number>;
  setRatings: Dispatch<SetStateAction<Record<string, number>>>;
  flowerColorCollections: Record<string, any>;
  setFlowerColorCollections: Dispatch<SetStateAction<Record<string, any>>>;
  weeklyWeather: any;
  setWeeklyWeather: Dispatch<SetStateAction<any>>;
  detailedWeather: any;
  setDetailedWeather: Dispatch<SetStateAction<any>>;
  activeSeasonIds: string[];
  setActiveSeasonIds: Dispatch<SetStateAction<string[]>>;
  sortOrders: Record<string, SortOrder>;
  setSortOrders: Dispatch<SetStateAction<Record<string, SortOrder>>>;
  userFilterExpandedPreference: boolean;
  setUserFilterExpandedPreference: Dispatch<SetStateAction<boolean>>;
  setThemeMode: (theme: ThemeMode) => void;
  setFontSizeLevel: (level: number) => void;
  setDefaultTab: (tab: Category) => void;
  setIsDesktopSidebarExpanded: (expanded: boolean) => void;
  markCollectionsModified: () => void;
  debouncedSyncAllData: () => void;
  user: any;
  isResetting: React.MutableRefObject<boolean>;
  globalSyncTimerRef: React.MutableRefObject<any>;
  forceSyncAllData: (user: any, force?: boolean) => Promise<void>;
  appVersion: string;
}

export function useBackupRestore({
  completedBirdIds,
  completedInsectIds,
  completedFishIds,
  completedFoodIds,
  completedGardeningIds,
  completedOceanCleaningIds,
  masterBirdIds,
  masterInsectIds,
  masterFishIds,
  masterFoodIds,
  masterGardeningIds,
  masterOceanCleaningIds,
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
  pets,
  setPets,
  ratings,
  setRatings,
  flowerColorCollections,
  setFlowerColorCollections,
  weeklyWeather,
  setWeeklyWeather,
  detailedWeather,
  setDetailedWeather,
  activeSeasonIds,
  setActiveSeasonIds,
  sortOrders,
  setSortOrders,
  userFilterExpandedPreference,
  setUserFilterExpandedPreference,
  setThemeMode,
  setFontSizeLevel,
  setDefaultTab,
  setIsDesktopSidebarExpanded,
  markCollectionsModified,
  debouncedSyncAllData,
  user,
  isResetting,
  globalSyncTimerRef,
  forceSyncAllData,
  appVersion
}: UseBackupRestoreParams) {

  const handleBackupData = () => {
    const backup = {
      completed_bird_ids: Array.from(completedBirdIds),
      completed_insect_ids: Array.from(completedInsectIds),
      completed_fish_ids: Array.from(completedFishIds),
      completed_food_ids: Array.from(completedFoodIds),
      completed_gardening_ids: Array.from(completedGardeningIds),
      completed_ocean_cleaning_ids: Array.from(completedOceanCleaningIds),
      master_bird_ids: Array.from(masterBirdIds),
      master_insect_ids: Array.from(masterInsectIds),
      master_fish_ids: Array.from(masterFishIds),
      master_food_ids: Array.from(masterFoodIds),
      master_gardening_ids: Array.from(masterGardeningIds),
      master_ocean_cleaning_ids: Array.from(masterOceanCleaningIds),
      pigtown_pets: pets,
      item_ratings: ratings,
      flower_color_collections: flowerColorCollections,
      weekly_weather: weeklyWeather,
      detailed_weather: detailedWeather,
      active_season_ids: activeSeasonIds,
      trend_checklist_checked_ids: (() => {
        const checked = localStorage.getItem('trend_checklist_checked_ids');
        return safeJsonParse(checked, []);
      })(),
      ui_settings: {
        theme: localStorage.getItem('pig_town_theme_mode') || 'system',
        fontSize: parseInt(localStorage.getItem('pig_town_font_size_level') || '3', 10),
        default_tab: localStorage.getItem('pig_town_default_tab') || 'home',
        sidebar_expanded: localStorage.getItem('pig_town_sidebar_expanded') !== 'false',
        sort_orders: sortOrders,
        filter_expanded: userFilterExpandedPreference
      },
      notification_settings: {
        tg_bot_token: localStorage.getItem('tg_bot_token') || '',
        tg_chat_id: localStorage.getItem('tg_chat_id') || '',
        tg_gas_url: localStorage.getItem('tg_gas_url') || '',
        is_tg_configured: localStorage.getItem('is_tg_configured') === 'true',
        is_gas_configured: localStorage.getItem('is_gas_configured') === 'true',
        sound_enabled: localStorage.getItem('farming_sound_enabled') !== 'false',
        presets: (() => {
          const p = localStorage.getItem('user_notification_presets');
          return safeJsonParse(p, []);
        })()
      },
      farming_data: {
        slots: (() => {
          const s = localStorage.getItem('farming_slots');
          return safeJsonParse(s, null);
        })()
      },
      map_data: {
        custom_routes: safeJsonParse(localStorage.getItem('pigTownCustomRoutes'), {}),
        hidden_locations: safeJsonParse(localStorage.getItem('pigTownHiddenLocations'), [])
      },
      version: '1.1.0',
      app_version: appVersion,
      backup_date: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  };

  const handleRestoreData = (data: any) => {
    if (!data || typeof data !== 'object') {
      throw new Error('올바르지 않은 백업 파일 데이터 형식입니다.');
    }

    const hasKeys = [
      'completed_bird_ids', 
      'completed_insect_ids', 
      'pigtown_pets', 
      'item_ratings',
      'ui_settings',
      'notification_settings'
    ].some(k => k in data);

    if (!hasKeys) {
      throw new Error('피그타운의 백업 파일 형식이 아닌 것 같습니다.');
    }

    const toSet = (arr: any) => new Set<string>(Array.isArray(arr) ? arr.map(String) : []);

    const birdIds = data.completed_bird_ids || [];
    const insectIds = data.completed_insect_ids || [];
    const fishIds = data.completed_fish_ids || [];
    const foodIds = data.completed_food_ids || [];
    const gardeningIds = data.completed_gardening_ids || [];
    const oceanCleaningIds = data.completed_ocean_cleaning_ids || [];

    setCompletedBirdIds(toSet(birdIds));
    setCompletedInsectIds(toSet(insectIds));
    setCompletedFishIds(toSet(fishIds));
    setCompletedFoodIds(toSet(foodIds));
    setCompletedGardeningIds(toSet(gardeningIds));
    setCompletedOceanCleaningIds(toSet(oceanCleaningIds));

    const masterBirds = data.master_bird_ids || [];
    const masterInsects = data.master_insect_ids || [];
    const masterFish = data.master_fish_ids || [];
    const masterFood = data.master_food_ids || [];
    const masterGardening = data.master_gardening_ids || [];
    const masterOceanCleaning = data.master_ocean_cleaning_ids || [];

    setMasterBirdIds(toSet(masterBirds));
    setMasterInsectIds(toSet(masterInsects));
    setMasterFishIds(toSet(masterFish));
    setMasterFoodIds(toSet(masterFood));
    setMasterGardeningIds(toSet(masterGardening));
    setMasterOceanCleaningIds(toSet(masterOceanCleaning));

    const restoredPets = Array.isArray(data.pigtown_pets) ? data.pigtown_pets : [];
    setPets(restoredPets);

    const restoredRatings = data.item_ratings && typeof data.item_ratings === 'object' ? data.item_ratings : {};
    setRatings(restoredRatings);

    const restoredWeekly = data.weekly_weather && typeof data.weekly_weather === 'object' ? cleanWeeklyWeather(data.weekly_weather) : {};
    setWeeklyWeather(restoredWeekly);

    const restoredDetailed = data.detailed_weather && typeof data.detailed_weather === 'object' ? data.detailed_weather : {};
    setDetailedWeather(restoredDetailed);

    const restoredFlowerColors = data.flower_color_collections && typeof data.flower_color_collections === 'object' ? data.flower_color_collections : {};
    setFlowerColorCollections(restoredFlowerColors);

    const restoredSeasonIds = Array.isArray(data.active_season_ids) ? data.active_season_ids : [];
    setActiveSeasonIds(restoredSeasonIds);

    const restoredTrendCheckedIds = Array.isArray(data.trend_checklist_checked_ids) ? data.trend_checklist_checked_ids : [];

    localStorage.setItem('completed_bird_ids', JSON.stringify(Array.from(toSet(birdIds))));
    localStorage.setItem('completed_insect_ids', JSON.stringify(Array.from(toSet(insectIds))));
    localStorage.setItem('completed_fish_ids', JSON.stringify(Array.from(toSet(fishIds))));
    localStorage.setItem('completed_food_ids', JSON.stringify(Array.from(toSet(foodIds))));
    localStorage.setItem('completed_gardening_ids', JSON.stringify(Array.from(toSet(gardeningIds))));
    localStorage.setItem('completed_ocean_cleaning_ids', JSON.stringify(Array.from(toSet(oceanCleaningIds))));

    localStorage.setItem('master_bird_ids', JSON.stringify(Array.from(toSet(masterBirds))));
    localStorage.setItem('master_insect_ids', JSON.stringify(Array.from(toSet(masterInsects))));
    localStorage.setItem('master_fish_ids', JSON.stringify(Array.from(toSet(masterFish))));
    localStorage.setItem('master_food_ids', JSON.stringify(Array.from(toSet(masterFood))));
    localStorage.setItem('master_gardening_ids', JSON.stringify(Array.from(toSet(masterGardening))));
    localStorage.setItem('master_ocean_cleaning_ids', JSON.stringify(Array.from(toSet(masterOceanCleaning))));

    localStorage.setItem('pigtown_pets', JSON.stringify(restoredPets));
    localStorage.setItem('item_ratings', JSON.stringify(restoredRatings));
    localStorage.setItem('weekly_weather', JSON.stringify(restoredWeekly));
    localStorage.setItem('detailed_weather', JSON.stringify(restoredDetailed));
    localStorage.setItem('flower_color_collections', JSON.stringify(restoredFlowerColors));
    localStorage.setItem('active_season_ids', JSON.stringify(restoredSeasonIds));
    localStorage.setItem('trend_checklist_checked_ids', JSON.stringify(restoredTrendCheckedIds));

    window.dispatchEvent(new Event('trend_checklist_changed'));

    const uiTheme = (data.ui_settings && data.ui_settings.theme) || 'system';
    const uiFontSize = (data.ui_settings && typeof data.ui_settings.fontSize === 'number') ? data.ui_settings.fontSize : 3;
    const uiDefaultTab = (data.ui_settings && data.ui_settings.default_tab) || 'home';
    const uiSidebarExpanded = (data.ui_settings && data.ui_settings.sidebar_expanded !== undefined) ? data.ui_settings.sidebar_expanded : true;
    const uiSortOrders = (data.ui_settings && data.ui_settings.sort_orders) || {};
    const uiFilterExpanded = (data.ui_settings && data.ui_settings.filter_expanded !== undefined) ? data.ui_settings.filter_expanded : true;

    setThemeMode(uiTheme as ThemeMode);
    setFontSizeLevel(uiFontSize);
    setDefaultTab(uiDefaultTab as Category);
    setIsDesktopSidebarExpanded(uiSidebarExpanded);
    const updatedSortOrders = { ...sortOrders, ...uiSortOrders };
    setSortOrders(updatedSortOrders);
    setUserFilterExpandedPreference(uiFilterExpanded);
    
    localStorage.setItem('pig_town_theme_mode', uiTheme);
    localStorage.setItem('pig_town_font_size_level', uiFontSize.toString());
    localStorage.setItem('pig_town_default_tab', uiDefaultTab);
    localStorage.setItem('pig_town_sidebar_expanded', String(uiSidebarExpanded));
    localStorage.setItem('pig_town_sort_orders', JSON.stringify(updatedSortOrders));
    localStorage.setItem('pig_town_filter_expanded', String(uiFilterExpanded));

    const ns = data.notification_settings || {};
    const tgToken = ns.tg_bot_token || '';
    const tgChatId = ns.tg_chat_id || '';
    const tgGasUrl = ns.tg_gas_url || '';
    const isTgConf = ns.is_tg_configured !== undefined ? ns.is_tg_configured : (tgToken.trim() !== '' && tgChatId.trim() !== '');
    const isGasConf = ns.is_gas_configured !== undefined ? ns.is_gas_configured : (tgGasUrl.trim() !== '');
    const soundEnabled = ns.sound_enabled !== undefined ? ns.sound_enabled : true;
    const restoredPresets = Array.isArray(ns.presets) ? ns.presets : [];

    localStorage.setItem('tg_bot_token', tgToken);
    localStorage.setItem('tg_chat_id', tgChatId);
    localStorage.setItem('tg_gas_url', tgGasUrl);
    localStorage.setItem('is_tg_configured', JSON.stringify(isTgConf));
    localStorage.setItem('is_gas_configured', JSON.stringify(isGasConf));
    localStorage.setItem('farming_sound_enabled', JSON.stringify(soundEnabled));
    localStorage.setItem('user_notification_presets', JSON.stringify(restoredPresets));

    if (user) {
      localStorage.setItem(`tg_bot_token_user_${user.uid}`, tgToken);
      localStorage.setItem(`tg_chat_id_user_${user.uid}`, tgChatId);
      localStorage.setItem(`tg_gas_url_user_${user.uid}`, tgGasUrl);
      localStorage.setItem(`is_tg_configured_user_${user.uid}`, JSON.stringify(isTgConf));
      localStorage.setItem(`is_gas_configured_user_${user.uid}`, JSON.stringify(isGasConf));
    }

    const incomingSlots = (data.farming_data && Array.isArray(data.farming_data.slots)) ? data.farming_data.slots : [];
    const filledSlots = Array.from({ length: 8 }, (_, i) => {
      const isSlot = incomingSlots[i] || {};
      const originalStartTime = isSlot.originalStartTime !== undefined ? isSlot.originalStartTime : (isSlot.startTime !== undefined ? isSlot.startTime : null);
      const originalDuration = isSlot.originalDuration !== undefined ? isSlot.originalDuration : (isSlot.duration !== undefined ? isSlot.duration : null);

      return {
        id: isSlot.id || `slot_${i + 1}`,
        cropId: isSlot.cropId !== undefined ? isSlot.cropId : null,
        cropName: isSlot.cropName !== undefined ? isSlot.cropName : null,
        cropEmoji: isSlot.cropEmoji !== undefined ? isSlot.cropEmoji : null,
        originalStartTime: originalStartTime,
        originalDuration: originalDuration,
        userOffset: isSlot.userOffset !== undefined ? isSlot.userOffset : 0,
        isNotified: isSlot.isNotified !== undefined ? isSlot.isNotified : false,
        isFiveStarMode: isSlot.isFiveStarMode !== undefined ? isSlot.isFiveStarMode : false,
        fiveStarNotificationState: isSlot.fiveStarNotificationState !== undefined ? isSlot.fiveStarNotificationState : null,
        notifiedStages: isSlot.notifiedStages !== undefined ? isSlot.notifiedStages : [],
        startTime: isSlot.startTime !== undefined ? isSlot.startTime : null,
        duration: isSlot.duration !== undefined ? isSlot.duration : null,
        targetTime: isSlot.targetTime !== undefined ? isSlot.targetTime : null
      };
    });

    localStorage.setItem('farming_slots', JSON.stringify(filledSlots));

    if (data.map_data) {
      if (data.map_data.custom_routes) {
        localStorage.setItem('pigTownCustomRoutes', JSON.stringify(data.map_data.custom_routes));
      }
      if (data.map_data.hidden_locations) {
        localStorage.setItem('pigTownHiddenLocations', JSON.stringify(data.map_data.hidden_locations));
      }
    }

    window.dispatchEvent(new Event('local-backup-imported'));
    window.dispatchEvent(new Event('map-data-imported'));
    markCollectionsModified();

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const farmingSlotsPayload: Record<string, any> = {};
      filledSlots.forEach((slot: any) => {
        if (slot && slot.cropId !== null) {
          if (!slot.instanceId) {
            slot.instanceId = Math.random().toString(36).substring(2, 15);
          }
          farmingSlotsPayload[slot.instanceId] = {
            ...slot,
            updatedAt: serverTimestamp()
          };
        }
      });

      const forceSyncFarmingAndPresets = async () => {
        try {
          await setDoc(userDocRef, {
            farmingSlots: farmingSlotsPayload,
            slots: deleteField(),
            userPresets: restoredPresets,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          console.error("[Backup Sync] Force sync failed:", err);
        }
      };
      forceSyncFarmingAndPresets();

      if (globalSyncTimerRef.current) clearTimeout(globalSyncTimerRef.current);
      globalSyncTimerRef.current = setTimeout(() => {
        debouncedSyncAllData();
      }, 300);
    }
  };

  const handleConfirmRestore = async (importPendingData: any, setRestoreSuccessMessage: (msg: string) => void, setRestoreErrorMessage: (msg: string) => void, setImportPendingData: (data: any) => void) => {
    if (!importPendingData) return;
    try {
      isResetting.current = true;
      handleRestoreData(importPendingData);
      
      if (user) {
        await forceSyncAllData(user, true);
      }
      
      setRestoreSuccessMessage('백업 파일의 도감 기록 및 설정 복원을 완료했습니다.');
      setImportPendingData(null);
    } catch (error: any) {
      setRestoreErrorMessage('복원 도중 오류가 발생했습니다: ' + (error?.message || error));
      setImportPendingData(null);
    } finally {
      setTimeout(() => {
        isResetting.current = false;
      }, 3000);
    }
  };

  return {
    handleBackupData,
    handleRestoreData,
    handleConfirmRestore
  };
}
