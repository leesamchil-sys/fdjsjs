import { Bird, Insect, Fish, GardeningItem, CropPreset, OceanCleaningItem, Cooking } from '../types';

export interface SeasonalEvent {
  id: string;
  name: string;
  shortName?: string;
  birds?: Bird[];
  insects?: Insect[];
  fishing?: Fish[];
  gardening?: GardeningItem[];
  crops?: CropPreset[];
  oceanCleaning?: OceanCleaningItem[];
  cooking?: Cooking[];
}

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'event_1',
    name: '심해에서의 만남',
    shortName: '심해',
    birds: [
      { id: 's1_b1', seasonId: 'event_1', level: 1, name: '흰날개제비갈매기', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['고래산'], category: '꽃밭', price: 20 },
      { id: 's1_b2', seasonId: 'event_1', level: 1, name: '도둑갈매기', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['꽃밭 전체'], category: '꽃밭', price: 15 },
      { id: 's1_b3', seasonId: 'event_1', level: 1, name: '흰 저어새', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['온천산 호수'], category: '온천산', price: 15 },
      { id: 's1_b4', seasonId: 'event_1', level: 1, name: '나그네알바트로스', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['보랏빛 해변'], category: '꽃밭', price: 15 },
      { id: 's1_b5', seasonId: 'event_1', level: 1, name: '검은등알바트로스', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['바위절벽'], category: '온천산', price: 15 },    
    ],
    insects: [
      { id: 's1_i1', seasonId: 'event_1', level: 100, name: '', weather: 'Clear/Rainbow', timeSlots: [{start: 6, end: 18}], locations: ['???'], category: '이벤트', price: 120 },
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
      { id: 's1_g1', seasonId: 'event_1', name: '수선화', emoji: '🌷', category: 'flower', level: 1, duration: '업데이트 예정', price: 0 },
    ],
    crops: [
      { id: 's1_c1', seasonId: 'event_1', name: '스타프루트', emoji: '🍈', defaultTime: 900, color: 'green', category: 'crop', price: 30 },
    ],
    oceanCleaning: [
{ id: 'oc_1', seasonId: 'event_1', level: 1, name: '손상된 조개껍데기', weather: 'Always', timeSlots: [{start: 0, end: 24}], locations: ['해변'], category: '바다청소', proficiency: '-' },
      { id: 'oc_2', seasonId: 'event_1', level: 1, name: '고토이 심해고둥', weather: 'Always', timeSlots: [{start: 0, end: 12}, {start: 18, end: 24}], locations: ['해변'], category: '바다청소', proficiency: 85 },
      { id: 'oc_3', seasonId: 'event_1', level: 1, name: '루시나조개', weather: 'Always', timeSlots: [{start: 0, end: 12}, {start: 18, end: 24}], locations: ['해변'], category: '바다청소', proficiency: 60 },
      { id: 'oc_4', seasonId: 'event_1', level: 1, name: '미니 거미고둥', weather: 'Always', timeSlots: [{start: 0, end: 18}], locations: ['해변'], category: '바다청소', proficiency: 85 },
      { id: 'oc_5', seasonId: 'event_1', level: 1, name: '개구리소라', weather: 'Always', timeSlots: [{start: 0, end: 12}, {start: 18, end: 24}], locations: ['해변'], category: '바다청소', proficiency: 85 },
      { id: 'oc_6', seasonId: 'event_1', level: 1, name: '요카별고둥', weather: 'Always', timeSlots: [], locations: ['해변'], category: '바다청소', proficiency: '업데이트 예정', isUpdatePending: true },
      { id: 'oc_7', seasonId: 'event_1', level: 1, name: '은빛 대합', weather: 'Always', timeSlots: [{start: 0, end: 18}], locations: ['해변'], category: '바다청소', proficiency: 75 },

      { id: 'oc_8', seasonId: 'event_1', level: 2, name: '난초뿔고둥', weather: 'Always', timeSlots: [{start: 0, end: 12}, {start: 18, end: 24}], locations: ['해변'], category: '바다청소', proficiency: 75 },
      { id: 'oc_9', seasonId: 'event_1', level: 2, name: '뱃머리 벚꽃조개', weather: 'Always', timeSlots: [{start: 0, end: 18}], locations: ['해변'], category: '바다청소', proficiency: 60 },
      { id: 'oc_10', seasonId: 'event_1', level: 2, name: '매끈투구고둥', weather: 'Always', timeSlots: [], locations: ['해변'], category: '바다청소', proficiency: '업데이트 예정', isUpdatePending: true },

      { id: 'oc_11', seasonId: 'event_1', level: 3, name: '흰꽈리조개', weather: 'Always', timeSlots: [], locations: ['해변'], category: '바다청소', proficiency: '업데이트 예정', isUpdatePending: true },
      { id: 'oc_12', seasonId: 'event_1', level: 3, name: '흰작은가시고둥', weather: 'Always', timeSlots: [{start: 0, end: 12}, {start: 18, end: 24}], locations: ['해변'], category: '바다청소', proficiency: 85 },
      { id: 'oc_13', seasonId: 'event_1', level: 3, name: '사프란 대왕조개', weather: 'Always', timeSlots: [{start: 0, end: 18}], locations: ['해변'], category: '바다청소', proficiency: 75 },

      { id: 'oc_14', seasonId: 'event_1', level: 4, name: '가는줄갯고둥', weather: 'Always', timeSlots: [{start: 0, end: 6}, {start: 12, end: 24}], locations: ['해변'], category: '바다청소', proficiency: 75 },
      { id: 'oc_15', seasonId: 'event_1', level: 4, name: '해시계고둥', weather: 'Always', timeSlots: [{start: 0, end: 12}, {start: 18, end: 24}], locations: ['해변'], category: '바다청소', proficiency: 60 },
      { id: 'oc_16', seasonId: 'event_1', level: 4, name: '사마귀알고둥', weather: 'Always', timeSlots: [{start: 0, end: 12}, {start: 18, end: 24}], locations: ['해변'], category: '바다청소', proficiency: 75 },

      { id: 'oc_17', seasonId: 'event_1', level: 5, name: '랜턴 따개비고둥', weather: 'Always', timeSlots: [], locations: ['해변'], category: '바다청소', proficiency: '업데이트 예정', isUpdatePending: true },
      { id: 'oc_18', seasonId: 'event_1', level: 5, name: '마르가리타 꽃고둥', weather: 'Always', timeSlots: [], locations: ['해변'], category: '바다청소', proficiency: '업데이트 예정', isUpdatePending: true },
      { id: 'oc_19', seasonId: 'event_1', level: 5, name: '양파고둥', weather: 'Always', timeSlots: [], locations: ['해변'], category: '바다청소', proficiency: '업데이트 예정', isUpdatePending: true },
    ],

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
      { id: 's1_c_16', seasonId: 'event_1', level: 1, name: '미역 완자탕', ingredients: ['미역 x2', '고기 x2'], cookingType: 'meal', price: 500 },
      { id: 's1_c_17', seasonId: 'event_1', level: 1, name: '바다포도 표고버섯 달걀찜', ingredients: ['바다 포도 x2', '표고버섯 x1', '멸균란 x1'], cookingType: 'meal', price: 230 },
      { id: 's1_c_18', seasonId: 'event_1', level: 1, name: '바다 아스파라거스 새우 볶음밥', ingredients: ['벼 x1', '바다 아스파라거스 x2', '바다 새우 x1'], cookingType: 'meal', price: 160 },
    ]
  }
];
