import { OceanCleaningItem } from '../types';

export const OCEAN_CLEANING_ITEMS: OceanCleaningItem[] = [
  { id: 'oc_1', seasonId: 'event_1', level: 1, name: '손상된 조개껍데기', weather: 'Always', timeSlots: [{ start: 0, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 2, excludeFromMaster: true, maxStars: 1 },
  { id: 'oc_2', seasonId: 'event_1', level: 1, name: '고토이 심해고둥', weather: 'Always', timeSlots: [{ start: 0, end: 12 }, { start: 18, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 50},
  { id: 'oc_3', seasonId: 'event_1', level: 1, name: '루시나조개', weather: 'Always', timeSlots: [{ start: 0, end: 12 }, { start: 18, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 85},
  { id: 'oc_4', seasonId: 'event_1', level: 1, name: '미니 거미고둥', weather: 'Always', timeSlots: [{ start: 0, end: 18 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 50},
  { id: 'oc_5', seasonId: 'event_1', level: 1, name: '개구리소라', weather: 'Always', timeSlots: [{ start: 0, end: 12 }, { start: 18, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 50},
  { id: 'oc_6', seasonId: 'event_1', level: 1, name: '요카별고둥', weather: 'Always', timeSlots: [{ start: 0, end: 12 }, { start: 18, end: 24 }], locations: ['청소 사건'], category: '바다청소', price: 50 },
  { id: 'oc_7', seasonId: 'event_1', level: 1, name: '은빛 대합', weather: 'Always', timeSlots: [{ start: 0, end: 18 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 65},


  { id: 'oc_8', seasonId: 'event_1', level: 2, name: '난초뿔고둥', weather: 'Always', timeSlots: [{ start: 0, end: 12 }, { start: 18, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 65},
  { id: 'oc_9', seasonId: 'event_1', level: 2, name: '뱃머리 벚꽃조개', weather: 'Always', timeSlots: [{ start: 0, end: 18 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 85},
  { id: 'oc_10', seasonId: 'event_1', level: 2, name: '매끈투구고둥', weather: 'Always', timeSlots: [{ start: 0, end: 6 }, { start: 12, end: 24 }], locations: ['청소 사건'], category: '바다청소', price: 65 },



  { id: 'oc_11', seasonId: 'event_1', level: 3, name: '흰꽈리조개', weather: 'Always', timeSlots: [{ start: 0, end: 18 }], locations: ['청소 사건'], category: '바다청소', price: 85 },
  { id: 'oc_12', seasonId: 'event_1', level: 3, name: '흰작은가시고둥', weather: 'Always', timeSlots: [{ start: 0, end: 12 }, { start: 18, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 50},
  { id: 'oc_13', seasonId: 'event_1', level: 3, name: '사프란 대왕조개', weather: 'Always', timeSlots: [{ start: 0, end: 18 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 65},




  { id: 'oc_14', seasonId: 'event_1', level: 4, name: '가는줄갯고둥', weather: 'Always', timeSlots: [{ start: 0, end: 6 }, { start: 12, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 65},
  { id: 'oc_15', seasonId: 'event_1', level: 4, name: '해시계고둥', weather: 'Always', timeSlots: [{ start: 0, end: 12 }, { start: 18, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 85},
  { id: 'oc_16', seasonId: 'event_1', level: 4, name: '사마귀알고둥', weather: 'Always', timeSlots: [{ start: 0, end: 12 }, { start: 18, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 65 },



  { id: 'oc_171', seasonId: 'event_1', level: 5, name: '등롱 화염고둥', weather: 'Always', timeSlots: [{ start: 0, end: 18 }], locations: ['청소 사건'], category: '바다청소', price: 120 },
  { id: 'oc_17', seasonId: 'event_1', level: 5, name: '라티악시스 마와', weather: 'Always', timeSlots: [{ start: 0, end: 6 }, { start: 12, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 50 },
  { id: 'oc_18', seasonId: 'event_1', level: 5, name: '라파고둥', weather: 'Always', timeSlots: [{ start: 0, end: 6 }, { start: 12, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 85 },

  { id: 'oc_191', seasonId: 'event_1', level: 6, name: '꽃송이 원뿔고둥', weather: 'Always', timeSlots: [{ start: 0, end: 6 }, { start: 12, end: 24 }], locations: ['청소 사건'], category: '바다청소' },
  { id: 'oc_19', seasonId: 'event_1', level: 6, name: '카누두루마리고둥', weather: 'Always', timeSlots: [{ start: 0, end: 12 }, { start: 18, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 65 },

  { id: 'oc_20', seasonId: 'event_1', level: 7, name: '붉은가슴고둥', weather: 'Always', timeSlots: [{ start: 0, end: 6 }, { start: 12, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소' , price: 120},
  { id: 'oc_21', seasonId: 'event_1', level: 7, name: '잔티나 글로보사', weather: 'Always', timeSlots: [{ start: 0, end: 18 }], locations: ['고래낙하 협곡'], category: '바다청소' , price: 85},
  { id: 'oc_22', seasonId: 'event_1', level: 7, name: '앵무조개', weather: 'Always', timeSlots: [{ start: 0, end: 12 }, { start: 18, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 165 },

  { id: 'oc_23', seasonId: 'event_1', level: 8, name: '주교관고둥', weather: 'Always', timeSlots: [{ start: 0, end: 12 }, { start: 18, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 120 },

  { id: 'oc_24', seasonId: 'event_1', level: 8, name: '장미두순고둥', weather: 'Rainbow', timeSlots: [{ start: 0, end: 6 }, { start: 12, end: 24 }], locations: ['고래낙하 협곡'], category: '바다청소', price: 120 },




];
