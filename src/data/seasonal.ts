import { Bird, Insect, Fish, GardeningItem, CropPreset, OceanCleaningItem, Cooking } from '../types';
import { OCEAN_CLEANING_ITEMS } from './oceanCleaning';
import { getServerTimeKST } from '../utils/serverTime';

export interface SeasonalEvent {
  id: string;
  name: string;
  emoji?: string;
  shortName?: string;
  startDate?: string; // e.g. '2026-01-01'
  endDate?: string;   // e.g. '2026-12-31'
  birds?: Bird[];
  insects?: Insect[];
  fishing?: Fish[];
  gardening?: GardeningItem[];
  crops?: CropPreset[];
  oceanCleaning?: OceanCleaningItem[];
  cooking?: Cooking[];
}

/**
 * Checks if a season event is currently ongoing based on startDate and endDate.
 * If startDate or endDate is not defined, defaults to true.
 */
export function isSeasonOngoing(event: SeasonalEvent, now = getServerTimeKST()): boolean {
  if (!event.startDate && !event.endDate) return true;

  if (event.startDate) {
    const start = new Date(event.startDate + 'T00:00:00');
    if (!isNaN(start.getTime()) && now < start) return false;
  }

  if (event.endDate) {
    const end = new Date(event.endDate + 'T23:59:59');
    if (!isNaN(end.getTime()) && now > end) return false;
  }

  return true;
}

/**
 * Checks if a season event has ended.
 */
export function isSeasonEnded(event: SeasonalEvent, now = getServerTimeKST()): boolean {
  if (!event.endDate) return false;
  const end = new Date(event.endDate + 'T23:59:59');
  return !isNaN(end.getTime()) && now > end;
}

/**
 * Returns season status: 'ongoing' | 'ended' | 'upcoming'
 */
export function getSeasonStatus(event: SeasonalEvent, now = getServerTimeKST()): 'ongoing' | 'ended' | 'upcoming' {
  if (event.startDate) {
    const start = new Date(event.startDate + 'T00:00:00');
    if (!isNaN(start.getTime()) && now < start) return 'upcoming';
  }
  if (event.endDate) {
    const end = new Date(event.endDate + 'T23:59:59');
    if (!isNaN(end.getTime()) && now > end) return 'ended';
  }
  return 'ongoing';
}

export interface SeasonBadgeStyle {
  bg: string;
  text: string;
  border: string;
}

export const SEASON_BADGE_STYLES: Record<string, SeasonBadgeStyle> = {
  event_1: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/60'
  },
  sanrio: {
    bg: 'bg-pink-50 dark:bg-pink-950/40',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800/60'
  }
};

export const DEFAULT_SEASON_BADGE_STYLE: SeasonBadgeStyle = {
  bg: 'bg-amber-50 dark:bg-amber-950/30',
  text: 'text-amber-600 dark:text-amber-400',
  border: 'border-amber-200 dark:border-amber-900/50'
};

export function getSeasonBadgeStyle(seasonId?: string): SeasonBadgeStyle {
  if (!seasonId) return DEFAULT_SEASON_BADGE_STYLE;
  return SEASON_BADGE_STYLES[seasonId] || DEFAULT_SEASON_BADGE_STYLE;
}

export const RAW_SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'event_1',
    name: '고래 탐사 시즌',
    emoji: '🐳',
    shortName: '고래 탐사',
    startDate: '2026-07-11',
    endDate: '2026-08-22',
    birds: [
      { id: 's1_b1', seasonId: 'event_1', level: 1, name: '흰날개제비갈매기', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['고래산', '길 잃은 새 사건'], category: '꽃밭', price: 20 },
      { id: 's1_b2', seasonId: 'event_1', level: 1, name: '도둑갈매기', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['꽃밭 전체', '길 잃은 새 사건'], category: '꽃밭', price: 15 },
      { id: 's1_b3', seasonId: 'event_1', level: 1, name: '흰 저어새', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['온천산 호수', '길 잃은 새 사건'], category: '온천산', price: 15 },
      { id: 's1_b4', seasonId: 'event_1', level: 1, name: '나그네알바트로스', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['보랏빛 해변','길 잃은 새 사건'], category: '꽃밭', price: 15 },
      { id: 's1_b5', seasonId: 'event_1', level: 1, name: '검은등알바트로스', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['온천산 바위절벽','길 잃은 새 사건'], category: '온천산', price: 15 },
      { id: 's1_b6', seasonId: 'event_1', level: 1, name: '분홍 저어새', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['길 잃은 새 사건(2단계)'], category: '길 잃은 새 사건', price: 27 },    
    ],
    insects: [
      { id: 's1_i1', seasonId: 'event_1', level: 1, name: '초록 꽃무지', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['순록탑', '길 잃은 벌레 사건'], category: '숲', price: 0 },
      { id: 's1_i2', seasonId: 'event_1', level: 1, name: '청남색잎벌레', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['숲속 섬', '길 잃은 벌레 사건'], category: '숲', price: 0 },
      { id: 's1_i3', seasonId: 'event_1', level: 1, name: '클라우디나아그리아스나비', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['점핑 플랫폼', '길 잃은 벌레 사건'], category: '숲', price: 0 },
      { id: 's1_i4', seasonId: 'event_1', level: 1, name: '흰줄눈무늬밤나방', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['영혼의 참나무 숲', '길 잃은 벌레 사건'], category: '숲', price: 0 },
      { id: 's1_i5', seasonId: 'event_1', level: 1, name: '키세이스태양모르포나비', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['길 잃은 벌레 사건(3단계)'], category: '길 잃은 벌레 사건', price: 0 },
    ],
    fishing: [
      { id: 's1_f1', seasonId: 'event_1', level: 1, name: '가리비', shadowSize: '소형', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['고래바다'], category: '바다', price: 100 },
      { id: 's1_f2', seasonId: 'event_1', level: 1, name: '만다린피시', shadowSize: '소형', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['고래바다'], category: '바다', price: 155 },
      { id: 's1_f3', seasonId: 'event_1', level: 1, name: '갯민숭달팽이', shadowSize: '소형', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['연해 물고기 떼 사건(2단계)'], category: '바다', price: 210 },
      { id: 's1_f4', seasonId: 'event_1', level: 1, name: '살오징어', shadowSize: '소형', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['고래바다'], category: '바다', price: 155 },
      { id: 's1_f5', seasonId: 'event_1', level: 1, name: '매오징어', shadowSize: '소형', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['고래바다'], category: '바다', price: 100 },
      { id: 's1_f6', seasonId: 'event_1', level: 1, name: '납작등바다거북', shadowSize: '중형', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['고래바다'], category: '바다', price: 155 },
      { id: 's1_f7', seasonId: 'event_1', level: 1, name: '올리브바다거북', shadowSize: '중형', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['고래바다'], category: '바다', price: 155 },
    ],
     
    gardening: [
      { id: 's1_g1', seasonId: 'event_1', name: '수선화', emoji: '🌼', category: 'flower', level: 1, duration: '18시간', price: 125 },
    ],
    crops: [
      { id: 's1_c1', seasonId: 'event_1', name: '스타프루트', emoji: '🍈', defaultTime: 900, color: 'green', category: 'crop', price: 30 },
    ],
    oceanCleaning: OCEAN_CLEANING_ITEMS,

        cooking: [
      { id: 's1_c_1', seasonId: 'event_1', level: 1, name: '토마토 해산물 수프', ingredients: ['바다새우 x1', '토마토 x1', '바다 아스파라거스 x1', '밀 x1'], cookingType: 'meal', price: 450 },
      { id: 's1_c_2', seasonId: 'event_1', level: 1, name: '조개 진주 미니케이크', ingredients: ['가리비 x1', '밀 x1', '우유 x1', '아무 과일 x1'], cookingType: 'dessert', price: 570 },
      { id: 's1_c_3', seasonId: 'event_1', level: 1, name: '잼 오징어구이', ingredients: ['살오징어 x1', '바다 포도 x1', '미역 x1', '아무 잼 x1'], cookingType: 'meal', price: 440 },
      { id: 's1_c_4', seasonId: 'event_1', level: 1, name: '오션 에이드', ingredients: ['스피룰리나 파우더 x2', '스타프루트 x2'], cookingType: 'drink_tea', price: 190 },
      { id: 's1_c_5', seasonId: 'event_1', level: 1, name: '스타프루트 잼 오징어구이', ingredients: ['살오징어 x1', '바다 포도 x1', '미역 x1', '스타프루트 잼 x1'], cookingType: 'meal', price: 480 },
      { id: 's1_c_6', seasonId: 'event_1', level: 1, name: '사과 진주 미니케이크', ingredients: ['가리비 x1', '밀 x1', '우유 x1', '사과 x1'], cookingType: 'dessert', price: 590 },
      { id: 's1_c_7', seasonId: 'event_1', level: 1, name: '오렌지 진주 미니케이크', ingredients: ['가리비 x1', '밀 x1', '우유 x1', '오렌지 x1'], cookingType: 'dessert', price: 590 },
      { id: 's1_c_8', seasonId: 'event_1', level: 1, name: '블루베리 진주 미니케이크', ingredients: ['가리비 x1', '밀 x1', '우유 x1', '블루베리 x1'], cookingType: 'dessert', price: 570 },
      { id: 's1_c_9', seasonId: 'event_1', level: 1, name: '라즈베리 진주 미니케이크', ingredients: ['가리비 x1', '밀 x1', '우유 x1', '라즈베리 x1'], cookingType: 'dessert', price: 590 },
      { id: 's1_c_10', seasonId: 'event_1', level: 1, name: '사과 잼 오징어구이', ingredients: ['살오징어 x1', '바다 포도 x1', '미역 x1', '사과 잼 x1'], cookingType: 'meal', price: 550 },
      { id: 's1_c_11', seasonId: 'event_1', level: 1, name: '블루베리 잼 오징어구이', ingredients: ['살오징어 x1', '바다 포도 x1', '미역 x1', '블루베리 잼 x1'], cookingType: 'meal', price: 450 },
      { id: 's1_c_12', seasonId: 'event_1', level: 1, name: '스타프루트 진주 미니케이크', ingredients: ['가리비 x1', '밀 x1', '우유 x1', '스타프루트 x1'], cookingType: 'dessert', price: 570 },
      { id: 's1_c_13', seasonId: 'event_1', level: 1, name: '파인애플 잼 오징어구이', ingredients: ['살오징어 x1', '바다 포도 x1', '미역 x1', '파인애플 잼 x1'], cookingType: 'meal', price: 560 },
      { id: 's1_c_14', seasonId: 'event_1', level: 1, name: '딸기 잼 오징어구이', ingredients: ['살오징어 x1', '바다 포도 x1', '미역 x1', '딸기 잼 x1'], cookingType: 'meal', price: 1860 },
      { id: 's1_c_15', seasonId: 'event_1', level: 1, name: '바다의 향연', ingredients: ['토마토 해산물 수프 x1', '오션 에이드 x1', '아무 진주 미니케이크 x1', '아무 잼 오징어 구이 x1'], cookingType: 'set_menu', price: 1700 },

    ]
  },

    {
    id: 'sanrio',
    name: 'SANRIO CHARACTERS',
    emoji: '🎀',
    shortName: '산리오',
    startDate: '2026-07-17',
    endDate: '2026-08-24',
        cooking: [
      { id: 'sanrio_1', seasonId: 'sanrio', level: 1, name: '마이멜로디 크레페', ingredients: ['밀 x1', '버터 x1', '달걀 x1', '우유 x1'], cookingType: 'drink_tea', price: 670 },
      { id: 'sanrio_2', seasonId: 'sanrio', level: 2, name: '시나모롤 크레페', ingredients: ['밀 x1', '버터 x1', '달걀 x1', '커피 원두 x1'], cookingType: 'drink_tea', price: 670 },
      { id: 'sanrio_3', seasonId: 'sanrio', level: 3, name: '쿠로미 크레페', ingredients: ['밀 x1', '버터 x1', '달걀 x1', '라즈베리 x1'], cookingType: 'drink_tea', price: 670 },
    ]
  }
];

function processSeasonItems<T extends { excludeFromMaster?: boolean }>(items?: T[]): T[] | undefined {
  if (!items) return undefined;
  return items.map(item => ({
    ...item,
    excludeFromMaster: item.excludeFromMaster ?? true
  }));
}

export const SEASONAL_EVENTS: SeasonalEvent[] = RAW_SEASONAL_EVENTS.map(event => ({
  ...event,
  birds: processSeasonItems(event.birds),
  insects: processSeasonItems(event.insects),
  fishing: processSeasonItems(event.fishing),
  gardening: processSeasonItems(event.gardening),
  crops: processSeasonItems(event.crops),
  oceanCleaning: processSeasonItems(event.oceanCleaning),
  cooking: processSeasonItems(event.cooking),
}));
