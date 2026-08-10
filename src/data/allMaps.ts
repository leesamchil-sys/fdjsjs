import { BIRDS } from './birds';
import { INSECTS } from './insects';
import { FISHING, FISHING as dbFish } from './fishing';
import { COOKING } from './cooking';
import { GARDENING_ITEMS } from './gardening';
import { CROP_PRESETS } from './crops';
import { OCEAN_CLEANING_ITEMS } from './oceanCleaning';
import { SEASONAL_EVENTS } from './seasonal';
import { WeeklyWeather, GameWeather } from '../types';

export { dbFish };

export const MAX_DISPLAY_LEVEL = 14;

export const cleanWeeklyWeather = (weekly: any): WeeklyWeather => {
  if (!weekly || typeof weekly !== 'object') return {};
  const cleaned: WeeklyWeather = {};
  Object.keys(weekly).forEach(key => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      cleaned[key] = weekly[key] as GameWeather;
    }
  });
  return cleaned;
};

export const ALL_BIRDS_MAP = [...BIRDS, ...SEASONAL_EVENTS.flatMap(e => e.birds || [])];
export const ALL_INSECTS_MAP = [...INSECTS, ...SEASONAL_EVENTS.flatMap(e => e.insects || [])];
export const ALL_FISH_MAP = [...FISHING, ...SEASONAL_EVENTS.flatMap(e => e.fishing || [])];
export const ALL_COOKING_MAP = [...COOKING, ...SEASONAL_EVENTS.flatMap(e => e.cooking || [])];

export const ALL_GARDENING_MAP = [
  ...GARDENING_ITEMS,
  ...SEASONAL_EVENTS.flatMap(e => e.gardening || []),
  ...SEASONAL_EVENTS.flatMap(e => (e.crops || []).map(crop => {
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
  }))
];

export const ALL_OCEAN_CLEANING_MAP = OCEAN_CLEANING_ITEMS;

export const ALL_CROPS_MAP = [
  ...CROP_PRESETS,
  ...SEASONAL_EVENTS.flatMap(e => e.crops || [])
];
