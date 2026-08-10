import { Category } from '../types';
import { format } from 'date-fns';

// Static sets of names of files that exist in /public/images/
const birdWebp = new Set([
  "검은턱오목눈이", "검정제비갈매기", "굴뚝새", "극락풍금조", "꼬까울새", "노란머리바우어새", "노랑배딱새",
  "노랑배박새", "녹공작", "녹자작", "동고비", "동부 파랑새", "매", "멋쟁이새", "바다갈매기", "분홍가슴비둘기",
  "분홍목녹색비둘기", "분홍비둘기", "붉은뺨가마우지", "비둘기조롱이", "빨간머리때까치", "솔양진이",
  "수리부엉이", "수염오목눈이", "아메리카홍학", "아조레스멋쟁이새", "알락할미새", "얼룩비둘기", "염주비둘기",
  "오두앵갈매기", "오목눈이", "올리브비둘기", "웡가비둘기", "유럽가마우지", "유럽꾀꼬리", "유럽벌잡이새",
  "은계", "작은홍학", "잠부과일비둘기", "제비갈매기", "청공작", "청금강앵무", "청둥오리", "초록금강앵무",
  "콩새", "큰홍학", "파랑딱새", "푸른머리되새", "푸른박새", "호사북방오리", "홍금강앵무", "홍머리오리",
  "홍방울새", "황금가슴비둘기", "황금과일비둘기", "황오리", "황제가마우지", "황조롱이", "회색머리붉은참새",
  "흰머리오리", "흰비오리", "히아신스금강앵무"
]);

const birdPng = new Set([
  "칡부엉이","흰올빼미","흑공작","흑고니","푸른발얼가니새","푸른머리비둘기",
  "큰고니","코뿔바다오리","잉카제비갈매기","안경올빼미","쇠찌르레기","붉은눈썹핀치","백공작","먹황새","가창오리",
  "검은등알바트로스", "나그네알바트로스", "도둑갈매기", "분홍 저어새", "흰 저어새", "흰날개제비갈매기"
]);

const insectPng = new Set([
  "개미", "고산수염하늘소", "공작나비", "긴꼬리산누에나방", "나선주머니나방", "넉점박이잠자리", "녹색날개호랑나비",
  "녹색호랑풍뎅이", "말벌호랑하늘소", "망치다리메뚜기", "매미", "메넬라우스나비", "멧노랑나비", "무지개사마귀",
  "무지개사슴벌레", "물잠자리", "밀잠자리", "배추흰나비", "별노린재", "보라네발나비", "보라벌", "보석꽃풍뎅이",
  "분홍색 철써기", "붉은고리호랑나비", "붉은목제비나비", "사성 무당벌레", "산악사슴벌레", "슬코스키몰포나비",
  "신선나비", "아스파라거스벌레", "아폴로모시나비", "악마꽃사마귀", "여치", "연푸른부전나비", "오아시스메뚜기",
  "왕나비", "유럽갈고리나비", "은빛보석풍뎅이", "이사벨라나방", "이색무당벌레", "장수풍뎅이", "진주네발나비",
  "찔레잠자리", "칠성 무당벌레", "큰고추잠자리", "큰줄무늬메뚜기", "티폰쇠똥구리", "파란꽃풍뎅이", "파란노린재",
  "파푸아사마귀", "표범무늬네발나비", "푸른목수벌", "피카소노린재", "헤라클레스풍뎅이", "헤쿠바몰포나비",
  "헬레나몰포나비", "혜성꼬리나방", "호랑나비", "호박벌", "홍날개", "황금귀신사슴벌레", "황금보석풍뎅이",
  "흰마녀밤나방", "흰점꼬리털벌", "난초사마귀","골리앗대왕꽃무지", "데이다미아몰포나비", "무지개사슴벌레",
  "박주가리메뚜기","불꽃날개잠자리","삼색청띠제비나비","십삼성무당벌레","아틀라스풍뎅이","알렉산더비단나비",
  "유리날개나비","차이넨시스물잠자리","푸른민달팽이"
]);

const fishPng = new Set([
  "가다랑어", "갈치", "강꼬치고기", "개복치", "검은점돔", "귀상어", "극지연어", "금붕어", "나비잉어",
  "노란전갱이", "노랑촉수", "대문짝넙치", "대서양고등어", "대서양난쟁이문어", "대서양연어", "대서양은상어",
  "돌마자", "두툽상어", "둑중개", "등불성대", "레드벨리 피라냐", "루드", "망둥어", "매화농어", "머드개복치",
  "미노우", "민물게", "민물대구", "민물배스", "민물베도라치", "민물잰더", "바다가시고기", "바다빙어", "바다새우",
  "바벨", "배스", "백조어", "복어", "북극곤들매기", "북유럽파란가재", "붉은개복치", "붕어", "블루길",
  "사루기", "산갈치", "소라게", "송어", "아귀", "올챙이", "왕새우", "유럽가자미", "유럽가재", "유럽날오징어",
  "유럽메기", "유럽민물가재", "유럽백조어", "유럽잉어", "유럽장어", "유럽참개구리", "유럽처브", "전갱이",
  "정어리", "줄무늬송사리", "참다랑어", "참문어", "첨 연어", "청상아리", "큰가시고기", "큰얼룩배스",
  "큰입배스", "큰진주조개", "킹크랩", "텐치", "틸라피아", "펄 고기", "펌프킨시드", "하늘종개", "해덕대구",
  "해마", "홍합", "황금 킹크랩", "황새치", "후첸", "흰동가리","고래상어", "골드아로와나", "사자머리금붕어", "줄자돔",
  "만새기","바다거북","베타","레나르디놀래기","쏠배감펭","아주르담셀","양쥐돔","엔젤피시","해파리",
  "가리비", "갯민숭달팽이", "납작등바다거북", "만다린피시", "매오징어", "살오징어", "올리브바다거북"
]);

const cookingPng = new Set([
  "강아지 사료", "검은 트러플 크림 파스타", "검은 트러플 파이", "고양이 사료", "괴상한 음료", "괴상한 음식",
  "구운 그물버섯", "구운 느타리버섯", "구운 버섯", "구운 양송이버섯", "구운 표고버섯", "그린 롤케이크",
  "그물버섯 파이", "느타리버섯 파이", "당근 케이크", "동물 공용 음식", "딸기 밀크셰이크", "딸기 잼",
  "라즈베리 밀크셰이크", "라즈베리 잼", "랍스터 냉채", "럭셔리 씨푸드 플래터", "레드 롤케이크",
  "리트리버 콘파나", "리트리버카눌레", "말차 밀크셰이크", "몰티즈 카눌레", "몰티즈 콘파나", "미트버거",
  "미트소스 가지 그라탱", "미트소스 파스타", "믹스드 잼", "밀크셰이크", "버섯 파이", "베지 샐러드",
  "북유럽 파란가재 냉채", "블루 롤케이크", "블루베리 밀크셰이크", "블루베리 잼", "사과 밀크셰이크",
  "사과 잼", "스카이 롤케이크", "씨푸드 덮밥", "씨푸드 피자", "애플파이", "양송이버섯 파이",
  "옐로우 롤케이크", "오렌지 밀크셰이크", "오렌지 잼", "오리지널 롤케이크", "온천란", "잉글리시 애프터눈 티",
  "잔디 케이크", "초코 밀크셰이크", "초콜릿 소스", "치즈케이크", "카페라떼", "캔들라이트 디너",
  "캠핑 세트", "커피", "컨트리 스튜", "케첩", "콘수프", "킹크랩찜", "티라미수", "파인애플 밀크셰이크",
  "파인애플 잼", "퍼플 롤케이크", "포도 밀크셰이크", "포도 잼", "표고버섯 파이", "피시 앤 칩스",
  "하트 강아지", "황금 킹크랩찜", "훈제 연어 베이글", "사과", "오렌지 롤케이크",
  "느타리버섯", "양송이버섯", "표고버섯", "상큼한 그린티","상큼한 그린 밀크티","말차 그린 밀크티","국화차","로즈티",
  "코코아 밀크티","진한 홍차","밀크티","치즈 새우와 집게발 튀김","새우 아보카도 컵","고급 애프터눈 티 세트",
  "라즈베리 진주 미니케이크","미역 완자탕","바다 아스파라거스 새우 볶음밥","바다포도 표고버섯 달걀찜","조개 진주 미니케이크","블루베리 진주 미니케이크",
  "사과 진주 미니케이크","스타프루트 진주 미니케이크","오렌지 진주 미니케이크","오션 에이드","잼 오징어구이","토마토 해산물 수프","바다의 향연",
  "딸기 잼 오징어구이", "블루베리 잼 오징어구이", "사과 잼 오징어구이", "스타프루트 잼 오징어구이", "파인애플 잼 오징어구이","마이멜로디 크레페","시나모롤 크레페","쿠로미 크레페"
]);

// Dynamically glob all files under /public/images/ at build/compile time using Vite!
// This automatically registers any new files/folders uploaded by users inside /public/images/.
const dynamicImageMap = new Map<string, string>();

try {
  const globbedImages = import.meta.glob([
    '/public/images/**/*.{png,jpg,jpeg,svg,webp,PNG,JPG,JPEG,SVG,WEBP}'
  ]);

  Object.keys(globbedImages).forEach(fullPath => {
    // Convert to browser path, e.g. "/images/some_folder/image_name.png"
    const publicImagesIndex = fullPath.indexOf('public/images/');
    const browserPath = publicImagesIndex !== -1
      ? '/' + fullPath.substring(publicImagesIndex + 7)
      : fullPath.replace(/^\/public/, '');
    
    const filenameWithExt = fullPath.split('/').pop() || '';
    const nameWithoutExt = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')).trim();
    
    if (nameWithoutExt) {
      // 1. Map name to browser path, e.g. "검은턱오목눈이" -> "/images/bird/검은턱오목눈이.webp"
      dynamicImageMap.set(nameWithoutExt, browserPath);
      
      // 2. Map subfolder + name to prevent collisions and support direct subfolder matching
      // e.g. "bird/검은턱오목눈이" -> "/images/bird/검은턱오목눈이.webp"
      // e.g. "sanrio/마이멜로디 크레페" -> "/images/sanrio/마이멜로디 크레페.png"
      const pathParts = fullPath.split('/');
      if (pathParts.length >= 5) {
        const subfolder = pathParts[pathParts.length - 2]; // e.g. "bird", "sanrio", "event1", etc.
        dynamicImageMap.set(`${subfolder}/${nameWithoutExt}`, browserPath);
      }
    }
  });
} catch (e) {
  console.error("Failed to build dynamic image maps via Vite import.meta.glob:", e);
}

export function getExistingImagePath(type: Category, name: string, item?: any): string | null {
  const subfolder = type === 'birds' ? 'bird' : type === 'insects' ? 'insect' : type === 'cooking' ? 'cooking' : type === 'fishing' ? 'fish' : type === 'ocean_cleaning' ? 'ocean_cleaning' : 'fish';
  const cleanName = name.trim();
  
  let lookupName = cleanName;
  if (type === 'cooking') {
    if (lookupName === '강아지 전용 사료' || lookupName === '강아지 전용사료') {
      lookupName = '강아지 사료';
    } else if (lookupName === '고양이 전용 사료' || lookupName === '고양이 전용사료') {
      lookupName = '고양이 사료';
    } else if (lookupName === '동물 공용 음식' || lookupName === '동물 공용음식' || lookupName === '공용 사료' || lookupName === '공용사료') {
      lookupName = '동물 공용 음식';
    }
  }

  // 0. If item has seasonId, try matching with that subfolder first (handling potential event_1 vs event1 subfolder mismatch)
  if (item && item.seasonId) {
    const seasonKey = `${item.seasonId}/${lookupName}`;
    if (dynamicImageMap.has(seasonKey)) {
      return dynamicImageMap.get(seasonKey)!;
    }
    
    const normalizedSeasonId = item.seasonId.replace('_', '');
    const normalizedSeasonKey = `${normalizedSeasonId}/${lookupName}`;
    if (dynamicImageMap.has(normalizedSeasonKey)) {
      return dynamicImageMap.get(normalizedSeasonKey)!;
    }
  }

  // 1. Try matching with specific category subfolder first (e.g. "bird/검은턱오목눈이" or "sanrio/마이멜로디 크레페")
  const subfolderKey = `${subfolder}/${lookupName}`;
  if (dynamicImageMap.has(subfolderKey)) {
    return dynamicImageMap.get(subfolderKey)!;
  }

  // 2. Also try matching with original category key (e.g. "birds/검은턱오목눈이")
  const categoryKey = `${type}/${lookupName}`;
  if (dynamicImageMap.has(categoryKey)) {
    return dynamicImageMap.get(categoryKey)!;
  }

  // 3. Try matching by exact filename directly across any folder (e.g. "마이멜로디 크레페" or "토마토 해산물 수프")
  if (dynamicImageMap.has(lookupName)) {
    return dynamicImageMap.get(lookupName)!;
  }

  // 4. Legacy static fallbacks
  if (type === 'birds') {
    if (birdWebp.has(lookupName)) {
      return `/images/${subfolder}/${lookupName}.webp`;
    }
    if (birdPng.has(lookupName)) {
      return `/images/${subfolder}/${lookupName}.webp`;
    }
  } else if (type === 'insects') {
    if (insectPng.has(lookupName)) {
      return `/images/${subfolder}/${lookupName}.webp`;
    }
  } else if (type === 'fishing') {
    if (fishPng.has(lookupName)) {
      return `/images/${subfolder}/${lookupName}.webp`;
    }
  } else if (type === 'cooking') {
    if (cookingPng.has(lookupName)) {
      return `/images/${subfolder}/${lookupName}.webp`;
    }
  } else if (type === 'ocean_cleaning') {
    return `/images/${subfolder}/${lookupName}.webp`;
  }
  
  return null;
}

// Helper to get 6-hour cycle key (0, 6, 12, 18)
export const getCycleHour = (hour: number) => {
  if (hour < 6) return 0;
  if (hour < 12) return 6;
  if (hour < 18) return 12;
  return 18;
};

export const getDetailedKey = (date: Date) => {
  const d = format(date, 'yyyy-MM-dd');
  const h = getCycleHour(date.getHours());
  return `${d}-${h}`;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const differenceInDays = (date2: Date, date1: Date): number => {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const getGameDayString = (date: Date): string => {
  const d = new Date(date);
  if (d.getHours() < 6) {
    d.setDate(d.getDate() - 1);
  }
  return format(d, 'yyyy-MM-dd');
};

export const getKoreanDayName = (date: Date): string => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
};

export const formatWeatherValue = (weather: string) => {
  if (!weather || weather.trim() === '') return '-';
  if (weather === 'Always') return '날씨무관';
  if (weather === 'Rain/Snow/Rainbow') return '눈/비/무지개';
  if (weather === 'Clear/Rainbow') return '맑음/무지개';
  if (weather === 'Rainbow') return '무지개';
  if (weather === 'Clear') return '맑음';
  if (weather === 'RainSnow') return '비/눈';
  if (weather === 'Meteor') return '유성우';
  return weather;
};

export const formatTimeValue = (slots: { start: number; end: number }[] | undefined | null) => {
  if (!slots || slots.length === 0) {
    return '시간무관';
  }
  if (slots.length === 1 && slots[0].start === 0 && slots[0].end === 24) {
    return '시간무관';
  }
  return slots.map(s => `${s.start.toString().padStart(2, '0')}-${s.end.toString().padStart(2, '0')}시`).join(', ');
};

export const OCEAN_RENAME_MAP: Record<string, string> = {
  '손상된 조개껍데기': '손상된 바닷조개',
  '은빛 대합': '개굴잠쟁이',
  '뱃머리 벚꽃조개': '프로라 텔린조개',
  '샤프란 대왕조개': '크로세아 클램',
  '사프란 대왕조개': '크로세아 클램',
  '가는줄갯고둥': '무명올각시실꾸리고둥',
  '등롱 화염고둥': '노빌리스 두순고둥'
};

export function migrateItemRatings(ratings: Record<string, number>): Record<string, number> {
  const newRatings = { ...ratings };
  for (const [oldName, newName] of Object.entries(OCEAN_RENAME_MAP)) {
    if (newRatings[oldName] !== undefined && newRatings[newName] === undefined) {
      newRatings[newName] = newRatings[oldName];
      delete newRatings[oldName];
    }
  }
  return newRatings;
}

