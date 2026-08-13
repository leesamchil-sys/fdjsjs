export const FLOWER_IMAGE_MAPPING: Record<string, string> = {
  '데이지': 'daisy',
  '팬지': 'pansy',
  '꽃양귀비': 'cornpoppy',
  '안스리움': 'laceleaf',
  '나팔꽃': 'morningglory',
  '칼라': 'callalily',
  '카네이션': 'carnation',
  '튤립': 'tulip',
  '백합': 'lily',
  '장미': 'rose',
  '히아신스': 'hyacinth',
  '호접란': 'phalaenopsis'
};

export const CROP_IMAGE_MAPPING: Record<string, string> = {
  '토마토': 'tomatoloot_finish',
  '감자': 'potatoloot_finish',
  '벼': 'rice_finish',
  '밀': 'wheatloot_finish',
  '양상추': 'lettuceloot_finish',
  '파인애플': 'pineapple_finish',
  '당근': 'carrotloot_finish',
  '딸기': 'strawberryloot_finish',
  '옥수수': 'cornloot_finish',
  '포도': 'grapeloot_finish',
  '가지': 'eggplantloot_finish',
  '찻잎': 'teatreeloot_finish',
  '카카오': 'cocoaloot_finish',
  '아보카도': 'avocado_finish',
  '트러플': 'truffle'
};

import { GardeningItem } from '../types';

export const GARDENING_ITEMS: GardeningItem[] = [
  // --- 꽃 (원예도감) ---

{ id: 'g-daisy', name: '데이지', emoji: '🌼', category: 'flower', level: 3, duration: '18시간', price: 100 },
{ id: 'g-pansy', name: '팬지', emoji: '🌸', category: 'flower', level: 4, duration: '18시간', price: 100 },
{ id: 'g-poppy', name: '꽃양귀비', emoji: '🏵️', category: 'flower', level: 5, duration: '1일', price: 185 },
{ id: 'g-anthurium', name: '안스리움', emoji: '🌷', category: 'flower', level: 5, duration: '1일', price: 185 },
{ id: 'g-morning-glory', name: '나팔꽃', emoji: '💮', category: 'flower', level: 6, duration: '1일 6시간', price: 250 },
{ id: 'g-calla-lily', name: '칼라', emoji: '🌿', category: 'flower', level: 6, duration: '1일 6시간', price: 250 },
{ id: 'g-carnation', name: '카네이션', emoji: '🌺', category: 'flower', level: 7, duration: '1일 6시간', price: 305 },
{ id: 'g-tulip', name: '튤립', emoji: '🌷', category: 'flower', level: 8, duration: '2일', price: 330 },
{ id: 'g-lily', name: '백합', emoji: '⚜️', category: 'flower', level: 9, duration: '2일', price: 415 },
{ id: 'g-rose', name: '장미', emoji: '🌹', category: 'flower', level: 10, duration: '3일', price: 485 },
{ id: 'g-hyacinth', name: '히아신스', emoji: '🌸', category: 'flower', level: 11, duration: '3일', price: 330 },
{ id: 'g-level12-phalaenopsis', name: '호접란', emoji: '🦋', category: 'flower', level: 12, duration: '3일', price: 765 },
{ id: 'g-level13-unknown', name: '???', emoji: '❓', category: 'flower', level: 13, duration: '3일', price: 0 },

// --- 작물 ---
{ id: 'g-tomato', name: '토마토', emoji: '🍅', category: 'crop', level: 1, duration: '15분', price: 30 },
{ id: 'g-potato', name: '감자', emoji: '🥔', category: 'crop', level: 1, duration: '1시간', price: 90 },
{ id: 'g-rice', name: '벼', emoji: '🌾', category: 'crop', level: 1, duration: '20분',price: 37 },
{ id: 'g-wheat', name: '밀', emoji: '🌾', category: 'crop', level: 2, duration: '4시간',price: 285 },
{ id: 'g-lettuce', name: '양상추', emoji: '🥬', category: 'crop', level: 3, duration: '8시간', price: 435 },
{ id: 'g-pineapple', name: '파인애플', emoji: '🍍', category: 'crop', level: 4, duration: '30분',price: 52 },
{ id: 'g-carrot', name: '당근', emoji: '🥕', category: 'crop', level: 5, duration: '2시간',price: 155 },
{ id: 'g-strawberry', name: '딸기', emoji: '🍓', category: 'crop', level: 6, duration: '6시간',price: 375 },
{ id: 'g-corn', name: '옥수수', emoji: '🌽', category: 'crop', level: 6, duration: '12시간',price: 515 },
{ id: 'g-grape', name: '포도', emoji: '🍇', category: 'crop', level: 7, duration: '10시간',price: 480 },
{ id: 'g-eggplant', name: '가지', emoji: '🍆', category: 'crop', level: 8, duration: '7시간',price: 406 },
{ id: 'g-tea-leaf', name: '찻잎', emoji: '🍃', category: 'crop', level: 11, duration: '45분',price: 75 },
{ id: 'g-cacao', name: '카카오', emoji: '🍫', category: 'crop', level: 12, duration: '5시간',price: 330 },
{ id: 'g-avocado', name: '아보카도', emoji: '🥑', category: 'crop', level: 13, duration: '14시간',price: 549 }
] as GardeningItem[];
