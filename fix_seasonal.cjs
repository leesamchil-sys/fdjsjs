const fs = require('fs');
let code = fs.readFileSync('src/data/seasonal.ts', 'utf8');

code = code.replace(
  /import \{ (.*?) \} from '\.\.\/types';/,
  "import { $1, Cooking } from '../types';"
);

code = code.replace(
  /oceanCleaning\?: OceanCleaningItem\[\];/g,
  "oceanCleaning?: OceanCleaningItem[];\n  cooking?: Cooking[];"
);

const newCooking = `
    cooking: [
      { id: 's1_c_1', level: 1, name: '토마토 해산물 수프', ingredients: ['바다새우 1', '토마토 1', '바다 아스파라거스 1', '밀 1'], cookingType: 'event_1', price: 450 },
      { id: 's1_c_2', level: 1, name: '오션 에이드', ingredients: ['스피룰리나 파우더 2', '스타프루트 2'], cookingType: 'event_1', price: 190 },
      { id: 's1_c_3', level: 1, name: '바다의 향연', ingredients: ['토마토 해산물 수프 1', '오션 에이드 1', '아무 진주 미니케이크 1', '아무 잼 오징어 구이 1'], cookingType: 'event_1', price: 1700 },
      { id: 's1_c_4', level: 1, name: '조개 진주 미니케이크', ingredients: ['가라비 1', '밀 1', '우유 1', '아무 과일 1'], cookingType: 'event_1', price: 570 },
      { id: 's1_c_5', level: 1, name: '스타프루트 진주 미니케이크', ingredients: ['가라비 1', '밀 1', '우유 1', '스타프루트 1'], cookingType: 'event_1', price: 570 },
      { id: 's1_c_6', level: 1, name: '사과 진주 미니케이크', ingredients: ['가라비 1', '밀 1', '우유 1', '사과 1'], cookingType: 'event_1', price: 590 },
      { id: 's1_c_7', level: 1, name: '오렌지 진주 미니케이크', ingredients: ['가라비 1', '밀 1', '우유 1', '오렌지 1'], cookingType: 'event_1', price: 590 },
      { id: 's1_c_8', level: 1, name: '블루베리 진주 미니케이크', ingredients: ['가라비 1', '밀 1', '우유 1', '블루베리 1'], cookingType: 'event_1', price: 570 },
      { id: 's1_c_9', level: 1, name: '라즈베리 진주 미니케이크', ingredients: ['가라비 1', '밀 1', '우유 1', '라즈베리 1'], cookingType: 'event_1', price: 590 },
      { id: 's1_c_10', level: 1, name: '잼 오징어구이', ingredients: ['살오징어 1', '바다 포도 1', '미역 1', '아무 잼 1'], cookingType: 'event_1', price: 440 },
      { id: 's1_c_11', level: 1, name: '사과 잼 오징어구이', ingredients: ['살오징어 1', '바다 포도 1', '미역 1', '사과 잼 1'], cookingType: 'event_1', price: 550 },
      { id: 's1_c_12', level: 1, name: '블루베리 잼 오징어구이', ingredients: ['살오징어 1', '바다 포도 1', '미역 1', '블루베리 잼 1'], cookingType: 'event_1', price: 450 },
      { id: 's1_c_13', level: 1, name: '스타프루트 잼 오징어구이', ingredients: ['살오징어 1', '바다 포도 1', '미역 1', '스타프루트 잼 1'], cookingType: 'event_1', price: 480 },
      { id: 's1_c_14', level: 1, name: '파인애플 잼 오징어구이', ingredients: ['살오징어 1', '바다 포도 1', '미역 1', '파인애플 잼 1'], cookingType: 'event_1', price: 560 },
      { id: 's1_c_15', level: 1, name: '딸기 잼 오징어구이', ingredients: ['살오징어 1', '바다 포도 1', '미역 1', '딸기 잼 1'], cookingType: 'event_1', price: 1860 },
      { id: 's1_c_16', level: 1, name: '미역 완자탕', ingredients: ['미역 2', '고기 2'], cookingType: 'event_1', price: 500 },
      { id: 's1_c_17', level: 1, name: '바다포도 표고버섯 달걀찜', ingredients: ['바다 포도 2', '표고버섯 1', '멸균란 1'], cookingType: 'event_1', price: 230 },
      { id: 's1_c_18', level: 1, name: '바다 아스파라거스 새우 볶음밥', ingredients: ['벼 1', '바다 아스파라거스 2', '바다 새우 1'], cookingType: 'event_1', price: 160 },
    ]
`;

code = code.replace(
  /oceanCleaning: \[\s*([\s\S]*?)\]\s*\}/g,
  "oceanCleaning: [\n$1],\n" + newCooking + "  }"
);

fs.writeFileSync('src/data/seasonal.ts', code, 'utf8');
