
export type ThemeMode = 'light' | 'dark' | 'system';

export type GameWeather = 'Clear' | 'RainSnow' | 'Rainbow' | 'Meteor' | 'Unknown' | 'Heatwave';

export type SpawnWeather = 'Always' | 'Rain/Snow/Rainbow' | 'Clear/Rainbow' | 'Rainbow';

export type BirdWeatherCondition = 'Always' | 'Rainbow' | 'Clear/Rainbow' | 'Rain/Snow/Rainbow';

export interface TimeSlot {
  start: number; // 0-24
  end: number;   // 0-24
}

export type Category = 'home' | 'birds' | 'insects' | 'fishing' | 'cooking' | 'crops' | 'petfood' | 'gardening' | 'privacy' | 'terms' | 'coupons' | 'ocean_cleaning';
export type SortOrder = 'level' | 'name' | 'location';

export interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: any; // Date, Timestamp, or number
  updatedAt?: any; // Date, Timestamp, or number
  isPinned?: boolean;
  author?: string;
}

export interface Cooking {
  id: string;
  seasonId?: string;
  level: number;
  name: string;
  ingredients: string[];
  cookingType: 'jam_sauce' | 'mushroom' | 'meal' | 'dessert' | 'drink_tea' | 'set_menu' | 'event_1';
  price?: number;
}

export interface Bird {
  id: string;
  seasonId?: string;
  level: number;
  name: string;
  weather: BirdWeatherCondition;
  timeSlots: TimeSlot[];
  locations: string[];
  category: string;
  price?: number;
  fiveStarCondition?: {
    weather: BirdWeatherCondition;
    timeSlots: TimeSlot[];
    action: string;
    price?: number;
  };
}

export interface Insect {
  id: string;
  seasonId?: string;
  level: number;
  name: string;
  weather: SpawnWeather;
  timeSlots: TimeSlot[];
  locations: string[];
  category: string;
  price?: number;
}

export interface Fish {
  id: string;
  seasonId?: string;
  level: number;
  name: string;
  shadowSize: string;
  weather: SpawnWeather;
  timeSlots: TimeSlot[];
  locations: string[];
  category: string;
  price?: number;
}

export interface WeeklyWeather {
  [date: string]: GameWeather; // key: YYYY-MM-DD
}

export interface DetailedWeather {
  [key: string]: GameWeather; // key: YYYY-MM-DD-HH (HH is 0, 6, 12, 18)
}

export interface CropPreset {
  id: string;
  seasonId?: string;
  name: string;
  emoji: string;
  defaultTime: number; // in seconds
  color: string; // style theme: green, amber, red, etc.
  category: 'crop' | 'general';
  price?: number;
}

export interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  preferences: { [foodId: string]: 'like' | 'dislike' | 'neutral' };
  tried?: { [foodId: string]: boolean };
}

export interface PlantedSlot {
  id: string;
  cropId: string | null;
  cropName: string | null;
  cropEmoji: string | null;
  originalStartTime: number | null; // timestamp
  originalDuration: number | null; // in seconds
  userOffset: number; // in seconds
  isNotified: boolean;
  isFiveStarMode?: boolean;
  notifiedStages?: number[]; // [1, 2, 3, 4]
  customStage3Time?: number; // timestamp for 3rd stage if modified
  fiveStarNotificationState?: {
    [stageId: number]: {
      preSent: boolean;
      actualSent: boolean;
      completed: boolean;
    };
  };
  instanceId?: string | null;
  updatedAt?: number | null;
}

export interface GardeningItem {
  id: string;
  seasonId?: string;
  name: string;
  emoji: string;
  category: 'flower' | 'crop';
  level: number;
  duration: string;
  price?: number;
}

export interface OceanCleaningItem {
  id: string;
  seasonId?: string;
  level: number;
  name: string;
  weather?: string;
  timeSlots?: TimeSlot[];
  locations?: string[];
  category: string;
  proficiency?: string | number; // e.g. 85, 60, '-'
  isUpdatePending?: boolean;
}


