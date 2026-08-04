import { CropPreset } from '../types';

export const CROP_PRESETS: CropPreset[] = [
  // Crops (Existing)
  { id: 'tomato', name: '토마토', price: 1400, emoji: '🍅', defaultTime: 900, color: 'red', category: 'crop' },
  { id: 'rice', name: '벼', emoji: '🍚', defaultTime: 1200, color: 'yellow', category: 'crop' },
  { id: 'pineapple', name: '파인애플', emoji: '🍍', defaultTime: 1800, color: 'amber', category: 'crop' },
  { id: 'tea_leaves', name: '찻잎', emoji: '🌿', defaultTime: 2700, color: 'green', category: 'crop' },
  { id: 'potato', name: '감자', emoji: '🥔', defaultTime: 3600, color: 'neutral', category: 'crop' },
  { id: 'carrot', name: '당근', emoji: '🥕', defaultTime: 7200, color: 'orange', category: 'crop' },
  { id: 'wheat', name: '밀', emoji: '🌾', defaultTime: 14400, color: 'yellow', category: 'crop' },
  { id: 'cocoa', name: '카카오', emoji: '🍫', defaultTime: 18000, color: 'amber', category: 'crop' },
  { id: 'strawberry', name: '딸기', emoji: '🍓', defaultTime: 21600, color: 'rose', category: 'crop' },
  { id: 'eggplant', name: '가지', emoji: '🍆', defaultTime: 25200, color: 'purple', category: 'crop' },
  { id: 'lettuce', name: '양상추', emoji: '🥬', defaultTime: 28800, color: 'emerald', category: 'crop' },
  { id: 'grape', name: '포도', emoji: '🍇', defaultTime: 36000, color: 'indigo', category: 'crop' },
  { id: 'corn', name: '옥수수', emoji: '🌽', defaultTime: 43200, color: 'yellow', category: 'crop' },
  { id: 'avocado', name: '아보카도', emoji: '🥑', defaultTime: 50400, color: 'lime', category: 'crop' },
  
  // General Reminders
  { id: 'wood', name: '희귀 목재', emoji: '🌲', defaultTime: 7200, color: 'stone', category: 'general' },
  { id: 'truffle', name: '트러플', emoji: '🍄', defaultTime: 780, color: 'stone', category: 'general' }
];
