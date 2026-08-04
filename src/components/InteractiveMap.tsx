import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  X, ZoomIn, ZoomOut, Maximize2, Minimize2, MapPin, Locate,
  Bird as BirdIcon, Bug, Fish as FishIcon, Copy, Check, Info, Compass, ChevronDown, ChevronLeft,
  SlidersHorizontal, Star, Medal, Eye, EyeOff, ChevronUp, RefreshCcw, Layers, Edit3, Route, Plus, Trash2,
  Share2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, increment } from 'firebase/firestore';
import { BIRDS } from '../data/birds';
import { INSECTS } from '../data/insects';
import { FISHING } from '../data/fishing';
import { GameWeather } from '../types';
import { formatTimeValue, formatWeatherValue, getExistingImagePath } from '../lib/appHelpers';
import { cn } from '../lib/utils';
import { PriceTable } from './PriceTable';

// Location interface
export interface MapLocation {
  name: string;
  x: number; // 0-100 %
  y: number; // 0-100 %
  groups?: string;
  displayName?: string;
  level?: number; // 노출 단계 (2: 2단계, 3: 3단계(기본값))
  mapId?: string; // 맵 구분자 (기본값: 'town')
  section?: string; // 구역 정보 섹션 분류명 (예: '채집물', 'NPC 및 기타')
  routeGroup?: string; // 동선을 연결할 그룹 이름 (동일한 이름을 가진 마커들을 선으로 연결)
  routeOrder?: number; // 동선 연결 순서 (명시적으로 지정하고 싶은 경우)
  showRoute?: boolean; // 동선(선) 표시 여부 (true면 연결된 선을 그림)
  icon?: string; // 원형 아이콘으로 표시할 이미지 경로 (예: '/images/items/apple.webp')
}

export const MAP_CONFIGS = {
  town: { id: 'town', name: '고래섬', image: '/images/heartopia_map.webp', bgColor: '#6ca0b3' },
  whaleCanyon: { id: 'whaleCanyon', name: '고래낙하협곡', image: '/images/whalecanyon_map.webp', bgColor: '#589098' }
};

// Helper function to determine text color based on background color
function getContrastColor(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1c1917' : '#ffffff';
}

// Complete mappings of location names to map coordinates
export const LOCATION_COORDINATES: Record<string, MapLocation> = {
  // 1단계
  '구해_1': { name: '구해', x: 49.3, y: 8, groups: '구해, 바다 전체, 모든 바다', level: 1 },
  '온천산': { name: '온천산 전체', displayName: '온천산', x: 49.3, y: 21.1, groups: '온천산, 온천산 전체', level: 1 },
  '고래바다_1': { name: '고래바다', x: 9.3, y: 53.2, groups: '고래바다, 바다 전체, 모든 바다, 해변, 고래바다 해변', level: 1 },
  '꽃밭': { name: '꽃밭 전체', displayName: '꽃밭', x: 19, y: 54, groups: '꽃밭, 꽃밭 전체', level: 1 },
  '도심_1': { name: '도심', x: 50, y: 50, groups: '도심, 도심 전체', level: 1 },
  '도시 근교': { name: '도시 근교', x: 41.8, y: 59, groups: '도시 근교', level: 1 },
  '잔잔한 바다_1': { name: '잔잔한 바다', x: 48.2, y: 74.3, groups: '잔잔한 바다, 바다 전체, 모든 바다,바다 낚시(황금물고기)', level: 1 },
  '숲': { name: '숲 전체', displayName: '숲', x: 80.4, y: 51.9, groups: '숲, 숲 전체', level: 1 },
  '동해_1': { name: '동해', x: 93.5, y: 53.1, groups: '동해, 바다 전체, 모든 바다', level: 1 },


  // 2단계
  '도심_2': { name: '도심', x: 50, y: 50, groups: '도심, 도심 전체,블랑코 머리', level: 2 },  
  '도시 근교_2': { name: '도시 근교', x: 41.8, y: 59, groups: '도시 근교', level: 2 },
  '구해_2': { name: '구해', x: 49.3, y: 8, groups: '구해, 바다 전체, 모든 바다, 해변, 구해 해변', level: 2 },
  '고래바다_2': { name: '고래바다', x: 9.3, y: 53.2, groups: '고래바다, 바다 전체, 모든 바다, 고래바다 해변, 해변', level: 2 },
  '잔잔한 바다_2': { name: '잔잔한 바다', x: 48.2, y: 74.3, groups: '잔잔한 바다, 바다 전체, 모든 바다, 해변', level: 2 },
  '바다 낚시': { name: '바다 낚시', x: 47.6, y: 80, groups: '바다 낚시, 바다 낚시(황금물고기)', level: 2 },
  '동해_2': { name: '동해', x: 93.5, y: 53.1, groups: '동해, 바다 전체, 모든 바다, 해변', level: 2 },
  '온천산 유적': { name: '온천산 유적', x: 29, y: 17.9, groups: '온천산 유적, 온천산 전체', level: 2 },
  '온천산 화산호수': { name: '온천산 화산호수', x: 39.4, y: 17.4, groups: '온천산 화산호수, 온천산 전체, 모든 호수, 물가', level: 2 },
  '온천산 호수_1': { name: '온천산 호수', x: 39.1, y: 19.7, groups: '온천산 호수, 온천산 전체, 모든 호수, 물가', level: 2 },
  '온천산 온천': { name: '온천산 온천', x: 52.3, y: 22.5, groups: '온천산 온천, 온천산 전체, 물가', level: 2 },
  '온천산 호수_2': { name: '온천산 호수', x: 54.1, y: 26, groups: '온천산 호수, 온천산 전체, 모든 호수', level: 2 },
  '온천산 바위절벽': { name: '온천산 바위절벽', x: 64.9, y: 23.5, groups: '온천산 바위절벽, 온천산 전체', level: 2 },
  '고래산': { name: '고래산', x: 18.6, y: 43.1, groups: '고래산', level: 2 },
  '노을강': { name: '노을강', x: 33, y: 33.4, groups: '노을강, 강 전체, 모든 강, 강가, 물가', level: 2 },
  '근교 호수_1': { name: '근교 호수', x: 45.6, y: 38.9, groups: '근교 호수, 호수 전체, 모든 호수, 물가', level: 2 },
  '근교 호수_2': { name: '근교 호수', x: 62.5, y: 44.6, groups: '근교 호수, 호수 전체, 모든 호수, 물가', level: 2 },
  '근교 호수_3': { name: '근교 호수', x: 49.4, y: 60.5, groups: '근교 호수, 호수 전체, 모든 호수, 물가', level: 2 },
  '얕은 강': { name: '얕은 강', x: 66.8, y: 33.9, groups: '얕은 강, 강 전체, 모든 강, 강가, 물가', level: 2 },
  '순록탑': { name: '순록탑', x: 80.8, y: 37.4, groups: '순록탑, 숲 전체', level: 2 },
  '숲속 호수_1': { name: '숲속 호수', x: 77.6, y: 43.3, groups: '숲속 호수, 숲 전체, 모든 호수, 물가', level: 2 },
  '숲속 호수_2': { name: '숲속 호수', x: 74.5, y: 59.8, groups: '숲속 호수, 숲 전체, 모든 호수, 물가', level: 2 },
  '숲속 섬': { name: '숲속 섬', x: 93.6, y: 33.6, groups: '숲속 섬, 숲 전체', level: 2 },
  '영혼의 참나무 숲': { name: '영혼의 참나무 숲', x: 80.6, y: 53, groups: '영혼의 참나무 숲, 숲 전체', level: 2 },
  '점핑 플랫폼': { name: '점핑 플랫폼', x: 78.5, y: 69, groups: '점핑 플랫폼, 숲 전체', level: 2 },
  '거목강': { name: '거목강', x: 61.2, y: 66.6, groups: '거목강, 강 전체, 모든 강, 강가, 물가', level: 2 },
  '어촌 동쪽 부두': { name: '어촌 동쪽 부두', x: 59.6, y: 73.4, groups: '어촌 동쪽 부두, 어촌 전체', level: 2 },
  '어촌 광장': { name: '어촌 광장', x: 51.3, y: 69.8, groups: '어촌 광장, 어촌 전체', level: 2 },
  '어촌 부두': { name: '어촌 부두', x: 40.8, y: 68.8, groups: '어촌 부두, 어촌 전체', level: 2 },
  '어촌 등대': { name: '어촌 등대', x: 38.2, y: 77.8, groups: '어촌 등대, 어촌 전체', level: 2 },
  '고요한 강': { name: '고요한 강', x: 35.2, y: 68.4, groups: '고요한 강, 강 전체, 모든 강, 강가, 물가', level: 2 },
  '보랏빛 해변': { name: '보랏빛 해변', x: 20.8, y: 72.2, groups: '보랏빛 해변, 꽃밭 전체', level: 2 },
  '풍차꽃밭': { name: '풍차꽃밭', x: 19.1, y: 64, groups: '풍차꽃밭, 꽃밭 전체', level: 2 },
  '초원 호수': { name: '초원 호수', x: 22.9, y: 53.6, groups: '초원 호수, 꽃밭 전체, 호수 전체, 모든 호수, 물가', level: 2 },
  '집 근처': { name: '집 근처', x: 47.8, y: 32.5, groups: '집 근처', level: 2 },  
  '길 잃은 새 사건': { name: '길 잃은 새 사건', x: 78.6, y: 62.3, groups: '길 잃은 새 사건,길 잃은 새 사건(2단계)', level: 2 },
  '길 잃은 벌레 사건': { name: '길 잃은 벌레 사건', x: 21.8, y: 42.5, groups: '길 잃은 벌레 사건, 길 잃은 벌레 사건(3단계)', level: 2 },

  // 사건 (Events / Etc) - User customized
  '새 사건': { name: '새 사건', x: 47.5, y: 69.1, groups: '새 사건', level: 2 },
  '곤충 유인 사건': { name: '곤충 유인 사건', x: 50.7, y: 22.8, groups: '곤충 유인 사건', level: 2 },

  '예술의 거리': { name: '예술의 거리', x: 43.9, y: 49.4, level: 2 },
  '거주 거리': { name: '거주 거리', x: 47.6, y: 44.1, level: 2 },
  '가든 스트리트': {name: '가든 스트리트', x: 54.9, y: 51, level: 2 },
  '중앙 광장': { name: '중앙 광장', x: 48.9, y: 53.9, level: 2 },

  // --- 고래낙하협곡 샘플 데이터 ---
  // (이미지 업로드 가이드: //images/items/ 경로에 해당 이미지를 업로드하고 아래 icon 경로를 지정하세요.)

// 오염물
'고래_오염물_1': { name: '오염물 1', displayName: '오염물', mapId: 'whaleCanyon', x: 63, y: 71, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_2': { name: '오염물 2', displayName: '오염물', mapId: 'whaleCanyon', x: 65.2, y: 74.8, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_3': { name: '오염물 3', displayName: '오염물', mapId: 'whaleCanyon', x: 70.9, y: 73.6, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_4': { name: '오염물 4', displayName: '오염물', mapId: 'whaleCanyon', x: 66.5, y: 64.2, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_5': { name: '오염물 5', displayName: '오염물', mapId: 'whaleCanyon', x: 73.9, y: 61.4, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_6': { name: '오염물 6', displayName: '오염물', mapId: 'whaleCanyon', x: 73.7, y: 50.4, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_7': { name: '오염물 7', displayName: '오염물', mapId: 'whaleCanyon', x: 74.2, y: 29.6, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_8': { name: '오염물 8', displayName: '오염물', mapId: 'whaleCanyon', x: 68.1, y: 25.8, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_9': { name: '오염물 9', displayName: '오염물', mapId: 'whaleCanyon', x: 46.5, y: 37.8, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_10': { name: '오염물 10', displayName: '오염물', mapId: 'whaleCanyon', x: 43.7, y: 39.1, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_11': { name: '오염물 11', displayName: '오염물', mapId: 'whaleCanyon', x: 46.3, y: 42.7, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_12': { name: '오염물 12', displayName: '오염물', mapId: 'whaleCanyon', x: 47, y: 44.9, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_13': { name: '오염물 13', displayName: '오염물', mapId: 'whaleCanyon', x: 25.8, y: 62.9, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_14': { name: '오염물 14', displayName: '오염물', mapId: 'whaleCanyon', x: 38, y: 63.3, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_15': { name: '오염물 15', displayName: '오염물', mapId: 'whaleCanyon', x: 38.7, y: 62.7, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },
'고래_오염물_16': { name: '오염물 16', displayName: '오염물', mapId: 'whaleCanyon', x: 39.8, y: 66.5, level: 1, section: '오염물', routeGroup: '오염물', showRoute: true, icon: '/images/바다 채집물/오염물.webp' },

// 바다 아스파라거스
'고래_바다아스파라거스_1': { name: '바다 아스파라거스 1', displayName: '바다 아스파라거스', mapId: 'whaleCanyon', x: 61.7, y: 67.9, level: 1, section: '채집물', routeGroup: '바다 아스파라거스', showRoute: true, icon: '/images/바다 채집물/바다 아스파라거스.webp' },
'고래_바다아스파라거스_2': { name: '바다 아스파라거스 2', displayName: '바다 아스파라거스', mapId: 'whaleCanyon', x: 48.0, y: 66.8, level: 1, section: '채집물', routeGroup: '바다 아스파라거스', showRoute: true, icon: '/images/바다 채집물/바다 아스파라거스.webp' },
'고래_바다아스파라거스_3': { name: '바다 아스파라거스 3', displayName: '바다 아스파라거스', mapId: 'whaleCanyon', x: 45.7, y: 63.3, level: 1, section: '채집물', routeGroup: '바다 아스파라거스', showRoute: true, icon: '/images/바다 채집물/바다 아스파라거스.webp' },
'고래_바다아스파라거스_4': { name: '바다 아스파라거스 4', displayName: '바다 아스파라거스', mapId: 'whaleCanyon', x: 41.9, y: 65.9, level: 1, section: '채집물', routeGroup: '바다 아스파라거스', showRoute: true, icon: '/images/바다 채집물/바다 아스파라거스.webp' },
'고래_바다아스파라거스_5': { name: '바다 아스파라거스 5', displayName: '바다 아스파라거스', mapId: 'whaleCanyon', x: 34.5, y: 64.2, level: 1, section: '채집물', routeGroup: '바다 아스파라거스', showRoute: true, icon: '/images/바다 채집물/바다 아스파라거스.webp' },
'고래_바다아스파라거스_6': { name: '바다 아스파라거스 6', displayName: '바다 아스파라거스', mapId: 'whaleCanyon', x: 28.7, y: 66.9, level: 1, section: '채집물', routeGroup: '바다 아스파라거스', showRoute: true, icon: '/images/바다 채집물/바다 아스파라거스.webp' },
'고래_바다아스파라거스_7': { name: '바다 아스파라거스 7', displayName: '바다 아스파라거스', mapId: 'whaleCanyon', x: 26.7, y: 54.5, level: 1, section: '채집물', routeGroup: '바다 아스파라거스', showRoute: true, icon: '/images/바다 채집물/바다 아스파라거스.webp' },
'고래_바다아스파라거스_8': { name: '바다 아스파라거스 8 ', displayName: '바다 아스파라거스', mapId: 'whaleCanyon', x: 20.9, y: 72.7, level: 1, section: '채집물', routeGroup: '바다 아스파라거스', showRoute: true, icon: '/images/바다 채집물/바다 아스파라거스.webp' },
'고래_바다아스파라거스_9': { name: '바다 아스파라거스 9', displayName: '바다 아스파라거스', mapId: 'whaleCanyon', x: 31.9, y: 77.5, level: 1, section: '채집물', routeGroup: '바다 아스파라거스', showRoute: true, icon: '/images/바다 채집물/바다 아스파라거스.webp' },
'고래_바다아스파라거스_10': { name: '바다 아스파라거스 10', displayName: '바다 아스파라거스', mapId: 'whaleCanyon', x: 46.6, y: 76.6, level: 1, section: '채집물', routeGroup: '바다 아스파라거스', showRoute: true, icon: '/images/바다 채집물/바다 아스파라거스.webp' },


// 미역
'고래_미역_1': { name: '미역 1', displayName: '미역', mapId: 'whaleCanyon', x: 36.9, y: 46.6, level: 1, section: '채집물', routeGroup: '미역', showRoute: true, icon: '/images/바다 채집물/미역.webp' },
'고래_미역_2': { name: '미역 2', displayName: '미역', mapId: 'whaleCanyon', x: 37.0, y: 40.7, level: 1, section: '채집물', routeGroup: '미역', showRoute: true, icon: '/images/바다 채집물/미역.webp' },
'고래_미역_3': { name: '미역 3', displayName: '미역', mapId: 'whaleCanyon', x: 40.4, y: 36.0, level: 1, section: '채집물', routeGroup: '미역', showRoute: true, icon: '/images/바다 채집물/미역.webp' },
'고래_미역_4': { name: '미역 4', displayName: '미역', mapId: 'whaleCanyon', x: 45.1, y: 35.5, level: 1, section: '채집물', routeGroup: '미역', showRoute: false, icon: '/images/바다 채집물/미역.webp' },
'고래_미역_5': { name: '미역 5', displayName: '미역', mapId: 'whaleCanyon', x: 51.0, y: 42.4, level: 1, section: '채집물', routeGroup: '미역', showRoute: true, icon: '/images/바다 채집물/미역.webp' },
'고래_미역_6': { name: '미역 6', displayName: '미역', mapId: 'whaleCanyon', x: 47.3, y: 49.1, level: 1, section: '채집물', routeGroup: '미역', showRoute: true, icon: '/images/바다 채집물/미역.webp' },
'고래_미역_7': { name: '미역 7', displayName: '미역', mapId: 'whaleCanyon', x: 50.4, y: 55.3, level: 1, section: '채집물', routeGroup: '미역', showRoute: true, icon: '/images/바다 채집물/미역.webp' },
'고래_미역_8': { name: '미역 8', displayName: '미역', mapId: 'whaleCanyon', x: 55.9, y: 56.9, level: 1, section: '채집물', routeGroup: '미역', showRoute: true, icon: '/images/바다 채집물/미역.webp' },
'고래_미역_9': { name: '미역 9', displayName: '미역', mapId: 'whaleCanyon', x: 59.0, y: 65.0, level: 1, section: '채집물', routeGroup: '미역', showRoute: true, icon: '/images/바다 채집물/미역.webp' },
'고래_미역_10': { name: '미역 10', displayName: '미역', mapId: 'whaleCanyon', x: 62.9, y: 66.4, level: 1, section: '채집물', routeGroup: '미역', showRoute: true, icon: '/images/바다 채집물/미역.webp' },

// 바다 포도
'고래_바다포도_1': { name: '바다 포도 1', displayName: '바다 포도', mapId: 'whaleCanyon', x: 66.0, y: 63.9, level: 1, section: '채집물', routeGroup: '바다 포도', showRoute: true, icon: '/images/바다 채집물/바다 포도.webp' },
'고래_바다포도_2': { name: '바다 포도 2', displayName: '바다 포도', mapId: 'whaleCanyon', x: 68.3, y: 64.8, level: 1, section: '채집물', routeGroup: '바다 포도', showRoute: true, icon: '/images/바다 채집물/바다 포도.webp' },
'고래_바다포도_3': { name: '바다 포도 3', displayName: '바다 포도', mapId: 'whaleCanyon', x: 70.7, y: 62.3, level: 1, section: '채집물', routeGroup: '바다 포도', showRoute: true, icon: '/images/바다 채집물/바다 포도.webp' },
'고래_바다포도_4': { name: '바다 포도 4', displayName: '바다 포도', mapId: 'whaleCanyon', x: 70.7, y: 56.6, level: 1, section: '채집물', routeGroup: '바다 포도', showRoute: true, icon: '/images/바다 채집물/바다 포도.webp' },
'고래_바다포도_5': { name: '바다 포도 5', displayName: '바다 포도', mapId: 'whaleCanyon', x: 69.8, y: 49.8, level: 1, section: '채집물', routeGroup: '바다 포도', showRoute: true, icon: '/images/바다 채집물/바다 포도.webp' },
'고래_바다포도_6': { name: '바다 포도 6', displayName: '바다 포도', mapId: 'whaleCanyon', x: 74.5, y: 43.1, level: 1, section: '채집물', routeGroup: '바다 포도', showRoute: true, icon: '/images/바다 채집물/바다 포도.webp' },
'고래_바다포도_7': { name: '바다 포도 7', displayName: '바다 포도', mapId: 'whaleCanyon', x: 69.9, y: 35.2, level: 1, section: '채집물', routeGroup: '바다 포도', showRoute: true, icon: '/images/바다 채집물/바다 포도.webp' },
'고래_바다포도_8': { name: '바다 포도 8', displayName: '바다 포도', mapId: 'whaleCanyon', x: 71.7, y: 30.9, level: 1, section: '채집물', routeGroup: '바다 포도', showRoute: true, icon: '/images/바다 채집물/바다 포도.webp' },
'고래_바다포도_9': { name: '바다 포도 9', displayName: '바다 포도', mapId: 'whaleCanyon', x: 64.4, y: 28.5, level: 1, section: '채집물', routeGroup: '바다 포도', showRoute: true, icon: '/images/바다 채집물/바다 포도.webp' },
'고래_바다포도_10': { name: '바다 포도 10', displayName: '바다 포도', mapId: 'whaleCanyon', x: 55.5, y: 32.4, level: 1, section: '채집물', routeGroup: '바다 포도', showRoute: true, icon: '/images/바다 채집물/바다 포도.webp' },

// 단일 위치
'고래_돌고래 먹이통_1': { name: '돌고래 먹이통', mapId: 'whaleCanyon', x: 50.9, y: 54.5, level: 1, section: '편의시설', routeGroup: '돌고래 먹이통', showRoute: false, icon: '/images/바다 채집물/돌고래 먹이통.webp' },
'고래_쉼터_1': { name: '쉼터', mapId: 'whaleCanyon', x: 46.1, y: 35.3, level: 1, section: '편의시설', routeGroup: '쉼터', showRoute: false, icon: '/images/바다 채집물/카페.webp' },

// 말미잘
'고래_말미잘_1': { name: '말미잘 1', displayName: '말미잘', mapId: 'whaleCanyon', x: 24.4, y: 48.3, level: 1, section: '편의시설', routeGroup: '말미잘', showRoute: false, icon: '/images/바다 채집물/말미잘.webp' },
'고래_말미잘_2': { name: '말미잘 2', displayName: '말미잘', mapId: 'whaleCanyon', x: 58.4, y: 29.9, level: 1, section: '편의시설', routeGroup: '말미잘', showRoute: false, icon: '/images/바다 채집물/말미잘.webp' },
'고래_말미잘_3': { name: '말미잘 3', displayName: '말미잘', mapId: 'whaleCanyon', x: 64.0, y: 69.5, level: 1, section: '편의시설', routeGroup: '말미잘', showRoute: false, icon: '/images/바다 채집물/말미잘.webp' },

// 포토존
'고래_포토존_1': { name: '포토존 1', displayName: '포토존', mapId: 'whaleCanyon', x: 54.9, y: 60.4, level: 1, section: '포토존', routeGroup: '포토존', showRoute: false, icon: '/images/바다 채집물/포토존.webp' },
'고래_포토존_2': { name: '포토존 2', displayName: '포토존', mapId: 'whaleCanyon', x: 64.4, y: 42.6, level: 1, section: '포토존', routeGroup: '포토존', showRoute: false, icon: '/images/바다 채집물/포토존.webp' },
'고래_포토존_3': { name: '포토존 3', displayName: '포토존', mapId: 'whaleCanyon', x: 38.8, y: 24.9, level: 1, section: '포토존', routeGroup: '포토존', showRoute: false, icon: '/images/바다 채집물/포토존.webp' },


// 지명 (Landmarks - Text Only - Always visible)
'고래_고래낙하': { name: '고래낙하', mapId: 'whaleCanyon', x: 43.1, y: 40.8, level: 1, section: '지명' },
'고래_산호거리': { name: '산호 거리', mapId: 'whaleCanyon', x: 68.5, y: 53.2, level: 1, section: '지명' },
'고래_캠핑장': { name: '캠핑장', mapId: 'whaleCanyon', x: 71.7, y: 76.3, level: 1, section: '지명' },
'고래_해파리동굴': { name: '해파리 동굴', mapId: 'whaleCanyon', x: 36.3, y: 62.7, level: 1, section: '지명' },

};

export const ROUTE_COLORS: Record<string, string> = {
"바다 아스파라거스": "#8B5CF6", // 보라
"미역": "#2563EB",              // 파랑
"바다 포도": "#06B6D4",         // 청록
"오염물": "#DC2626",            // 빨강
"임시 그룹 2": "#EAB308",       // 노랑
};

export const getGroupColor = (groupName: string): string => {
  if (ROUTE_COLORS[groupName]) {
    return ROUTE_COLORS[groupName];
  }
  // 정의되지 않은 임시 그룹이나 동적 그룹의 경우 기본 색상(파란색) 반환
  return "#3B82F6";
};

export interface CustomRoute {
  id: string;
  name: string;
  color: string;
  keys: string[];
  visible?: boolean;
}

export const PALETTE_COLORS = [
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

interface InteractiveMapProps {
  isOpen: boolean;
  onClose: () => void;
  highlightedLocationName?: string; // Loaded initially from card click
  highlightedItemName?: string;     // Loaded initially from card click
  onClearHighlight?: () => void;    // Callback to clear highlight in App.tsx
  onToggleCompletion?: (id: string) => void;
  completedIds?: Set<string>;
  onSelectCreature?: (name: string, category: string) => void;
  birds?: any[];
  insects?: any[];
  fish?: any[];
  ratings?: Record<string, number>;
  masterBirdIds?: Set<string>;
  masterInsectIds?: Set<string>;
  masterFishIds?: Set<string>;
  isAdmin?: boolean;
  initialMapId?: string;
  initialLocationKey?: string;
  onPermalinkRestored?: () => void;
}

// Group guides for the sidebar (rendered under group titles)
const GROUP_GUIDES: Record<string, string> = {
  '돌고래 먹이통': '좋아하는 음식: 정어리,배스,전갱이',
};

// --- Mappings between coordinate keys and URL IDs ---
export const mapKeyToLocationId = (key: string): string => {
  return key;
};

export const mapLocationIdToKey = (id: string): string => {
  const decoded = decodeURIComponent(id).trim();
  const lower = decoded.toLowerCase();
  
  // Fallback to searching LOCATION_COORDINATES case-insensitively
  for (const k of Object.keys(LOCATION_COORDINATES)) {
    if (k.toLowerCase() === lower) {
      return k;
    }
  }
  return decoded;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = React.memo(({
  isOpen,
  onClose,
  highlightedLocationName = '',
  highlightedItemName = '',
  onClearHighlight,
  onToggleCompletion,
  completedIds = new Set(),
  onSelectCreature,
  birds,
  insects,
  fish,
  ratings = {},
  masterBirdIds = new Set(),
  masterInsectIds = new Set(),
  masterFishIds = new Set(),
  isAdmin = false,
  initialMapId = 'town',
  initialLocationKey = '',
  onPermalinkRestored
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [extraPadding, setExtraPadding] = useState({ top: 0, right: 0, bottom: 0, left: 0 });

  const resetPadding = useCallback(() => {
    setExtraPadding({ top: 0, right: 0, bottom: 0, left: 0 });
  }, []);

  const handleClearHighlight = () => {
    if (onClearHighlight) {
      onClearHighlight();
    }
  };

  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [currentMapId, setCurrentMapId] = useState<string>('town');
  const [isMapMenuOpen, setIsMapMenuOpen] = useState(false);
  const mapMenuRef = useRef<HTMLDivElement>(null);

  // --- Sharing States ---
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [mapShareToast, setMapShareToast] = useState<string | null>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Close share menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trackShare = async (mapId: string, hasLocation: boolean, pinId?: string) => {
    const date = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, 'map_share_stats', date);
    
    const updateData: any = {
      [`${mapId}.total_shares`]: increment(1),
      [`${mapId}.shares_with_location`]: increment(hasLocation ? 1 : 0),
      [`${mapId}.shares_without_location`]: increment(hasLocation ? 0 : 1),
    };
    
    if (hasLocation && pinId) {
       updateData[`${mapId}.pin_counts.${pinId}`] = increment(1);
    }
    
    await setDoc(statsRef, updateData, { merge: true });
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedLocation) {
      if (typeof window !== 'undefined') {
        const urlMapId = currentMapId === 'town' ? '고래섬' : '고래낙하협곡';
        const url = `${window.location.origin}/map=${encodeURIComponent(urlMapId)}`;
        navigator.clipboard.writeText(url);
        trackShare(currentMapId, false);
        setMapShareToast("지도 링크가 복사되었습니다.");
        setTimeout(() => setMapShareToast(null), 2500);
      }
    } else {
      setIsShareMenuOpen(!isShareMenuOpen);
    }
  };

  const handleCopyUrl = (includeLocation: boolean) => {
    if (typeof window !== 'undefined') {
      const urlMapId = currentMapId === 'town' ? '고래섬' : '고래낙하협곡';
      let urlPath = `/map=${encodeURIComponent(urlMapId)}`;
      if (includeLocation && selectedLocationKey) {
        urlPath += `?location=${encodeURIComponent(mapKeyToLocationId(selectedLocationKey))}`;
      }
      navigator.clipboard.writeText(`${window.location.origin}${urlPath}`);
      trackShare(currentMapId, includeLocation, includeLocation ? selectedLocationKey || undefined : undefined);
      setMapShareToast("지도 링크가 복사되었습니다.");
      setIsShareMenuOpen(false);
      setTimeout(() => setMapShareToast(null), 2500);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setSelectedLocation(null);
      setSelectedLocationKey(null); setIsSharedLinkView(false);
      setSelectedItemName('');
      setActiveRouteId(null);
      setSelectedCustomRouteId(null);
      setIsCustomRouteMode(false);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mapMenuRef.current && !mapMenuRef.current.contains(event.target as Node)) {
        setIsMapMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isMapLoading, setIsMapLoading] = useState(true);

  // Adjust and constrain offset when map finishes loading
  useEffect(() => {
    if (!isMapLoading && selectedLocation) {
      const panX = -(selectedLocation.x - 50) * 8;
      const panY = -(selectedLocation.y - 50) * 8;
      setOffset(getConstrainedOffset(panX, panY, zoom));
    }
  }, [isMapLoading, selectedLocation, zoom]);

  // Set isMapLoading to true whenever the map ID changes so that the onLoad handler can re-center
  useEffect(() => {
    setIsMapLoading(true);
  }, [currentMapId]);
  
  const [hiddenLocationKeys, setHiddenLocationKeys] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pigTownHiddenLocations');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });
  const [hiddenGroupRoutes, setHiddenGroupRoutes] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pigTownHiddenGroupRoutes');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const [customRoutes, setCustomRoutes] = useState<Record<string, CustomRoute[]>>(() => {
    try {
      const savedNew = localStorage.getItem('pigTownCustomRoutes');
      if (savedNew) {
        return JSON.parse(savedNew);
      }
      
      // Fallback & Migration of old single route
      const savedOld = localStorage.getItem('pigTownCustomRoute');
      if (savedOld) {
        const oldRoute = JSON.parse(savedOld);
        const migrated: Record<string, CustomRoute[]> = {};
        Object.entries(oldRoute).forEach(([mapId, keys]) => {
          if (Array.isArray(keys) && keys.length > 0) {
            migrated[mapId] = [{
              id: `route_${Date.now()}_${mapId}`,
              name: '기본 경로 1',
              color: '#F59E0B',
              keys: keys,
              visible: true
            }];
          }
        });
        return migrated;
      }
      return {};
    } catch (e) {
      return {};
    }
  });
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [selectedCustomRouteId, setSelectedCustomRouteId] = useState<string | null>(null);
  const [isCustomRouteMode, setIsCustomRouteMode] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [lastClickedRoutePin, setLastClickedRoutePin] = useState<string | null>(null);

  const [editingRouteNameId, setEditingRouteNameId] = useState<string | null>(null);
  const [colorPickerOpenId, setColorPickerOpenId] = useState<string | null>(null);
  const [isCustomRoutesCollapsed, setIsCustomRoutesCollapsed] = useState(true);
  const [backupRoutesKeys, setBackupRoutesKeys] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const handleImported = () => {
      // Refresh hidden locations
      const savedHidden = localStorage.getItem('pigTownHiddenLocations');
      if (savedHidden) {
        try {
          setHiddenLocationKeys(new Set(JSON.parse(savedHidden)));
        } catch (e) {}
      }
      // Refresh custom routes
      const savedRoutes = localStorage.getItem('pigTownCustomRoutes');
      if (savedRoutes) {
        try {
          setCustomRoutes(JSON.parse(savedRoutes));
        } catch (e) {}
      }
    };
    window.addEventListener('map-data-imported', handleImported);
    return () => window.removeEventListener('map-data-imported', handleImported);
  }, []);

  useEffect(() => {
    if (!isCustomRouteMode) {
      setLastClickedRoutePin(null);
    }
  }, [isCustomRouteMode]);

  useEffect(() => {
    localStorage.setItem('pigTownHiddenLocations', JSON.stringify([...hiddenLocationKeys]));
  }, [hiddenLocationKeys]);

  useEffect(() => {
    localStorage.setItem('pigTownHiddenGroupRoutes', JSON.stringify([...hiddenGroupRoutes]));
  }, [hiddenGroupRoutes]);

  useEffect(() => {
    localStorage.setItem('pigTownHiddenLocations', JSON.stringify([...hiddenLocationKeys]));
  }, [hiddenLocationKeys]);

  useEffect(() => {
    localStorage.setItem('pigTownCustomRoutes', JSON.stringify(customRoutes));
  }, [customRoutes]);

  // Close color picker when clicking outside (Requirement 2)
  useEffect(() => {
    if (!colorPickerOpenId) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInside = target.closest(`[data-color-picker-trigger="${colorPickerOpenId}"]`) || 
                       target.closest(`[data-color-picker-container="${colorPickerOpenId}"]`);
      if (!isInside) {
        setColorPickerOpenId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [colorPickerOpenId]);

  // Auto-scroll the color picker container into view when opened (Requirement 4)
  useEffect(() => {
    if (colorPickerOpenId) {
      setTimeout(() => {
        const pickerContainer = document.querySelector(`[data-color-picker-container="${colorPickerOpenId}"]`);
        if (pickerContainer) {
          pickerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }, [colorPickerOpenId]);

  // Handlers for Custom Routes
  const handleAddNewRoute = () => {
    const mapRoutes = customRoutes[currentMapId] || [];
    
    // Find a PALETTE_COLOR that is not currently used by any route in the current map
    const existingColors = mapRoutes.map(r => r.color.toLowerCase());
    const unusedColor = PALETTE_COLORS.find(c => !existingColors.includes(c.toLowerCase()));
    
    // If all 8 colors are used, fallback to modulo indexing
    const defaultColor = unusedColor || PALETTE_COLORS[mapRoutes.length % PALETTE_COLORS.length];
    
    const defaultName = `경로 ${mapRoutes.length + 1}`;
    const newRouteId = `route_${Date.now()}`;
    
    const newRoute: CustomRoute = {
      id: newRouteId,
      name: defaultName,
      color: defaultColor,
      keys: [],
      visible: true,
    };
    
    const updatedRoutes = {
      ...customRoutes,
      [currentMapId]: [...mapRoutes, newRoute]
    };
    
    setCustomRoutes(updatedRoutes);
    localStorage.setItem('pigTownCustomRoutes', JSON.stringify(updatedRoutes));
    
    // Backup is empty list for new route
    setBackupRoutesKeys(prev => ({ ...prev, [newRouteId]: [] }));
    
    // Auto-expand custom routes panel so the user can see it
    setIsCustomRoutesCollapsed(false);
    
    // Auto-select and enter edit mode
    setActiveRouteId(newRouteId);
    setIsCustomRouteMode(true);

    // Focus/Scroll to the newly added route (Requirement 1)
    setTimeout(() => {
      const element = document.getElementById(`route-item-${newRouteId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 120);
  };

  const handleToggleEditRoute = (routeId: string) => {
    if (isCustomRouteMode && activeRouteId === routeId) {
      setIsCustomRouteMode(false);
    } else {
      const route = (customRoutes[currentMapId] || []).find(r => r.id === routeId);
      if (route) {
        setBackupRoutesKeys(prev => ({ ...prev, [routeId]: [...route.keys] }));
      }
      setActiveRouteId(routeId);
      setIsCustomRouteMode(true);
    }
  };

  const handleCancelEditRoute = (routeId: string) => {
    const backupKeys = backupRoutesKeys[routeId];
    const mapRoutes = customRoutes[currentMapId] || [];
    let updatedRoutesList = mapRoutes;

    if (backupKeys !== undefined) {
      if (backupKeys.length === 0) {
        // If backup is empty, it means this was a newly created route with no saved points.
        // We delete it entirely.
        updatedRoutesList = mapRoutes.filter(r => r.id !== routeId);
      } else {
        // Otherwise, restore the original points from backup.
        updatedRoutesList = mapRoutes.map(r => r.id === routeId ? { ...r, keys: backupKeys } : r);
      }
    } else {
      // In case backup doesn't exist, if the route itself is empty, clean it up.
      const route = mapRoutes.find(r => r.id === routeId);
      if (route && route.keys.length === 0) {
        updatedRoutesList = mapRoutes.filter(r => r.id !== routeId);
      }
    }

    const updatedRoutes = {
      ...customRoutes,
      [currentMapId]: updatedRoutesList
    };
    
    setCustomRoutes(updatedRoutes);
    localStorage.setItem('pigTownCustomRoutes', JSON.stringify(updatedRoutes));
    
    setIsCustomRouteMode(false);
    setActiveRouteId(null);
  };

  const handleCloseAttempt = () => {
    resetPadding();
    if (isCustomRouteMode && activeRouteId) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  // Add global Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If confirmation dialogs are open, close them first
        if (showCloseConfirm) {
          setShowCloseConfirm(false);
          return;
        }
        if (showResetConfirm) {
          setShowResetConfirm(false);
          return;
        }
        // Otherwise attempt to close map
        handleCloseAttempt();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCustomRouteMode, activeRouteId, showCloseConfirm, showResetConfirm, onClose]);

  const handleToggleRouteVisibility = (routeId: string) => {
    const mapRoutes = customRoutes[currentMapId] || [];
    const updatedRoutes = {
      ...customRoutes,
      [currentMapId]: mapRoutes.map(r => r.id === routeId ? { ...r, visible: r.visible === false ? true : false } : r)
    };
    setCustomRoutes(updatedRoutes);
    localStorage.setItem('pigTownCustomRoutes', JSON.stringify(updatedRoutes));
  };

  const handleDeleteRoute = (routeId: string) => {
    const mapRoutes = customRoutes[currentMapId] || [];
    const updatedRoutes = {
      ...customRoutes,
      [currentMapId]: mapRoutes.filter(r => r.id !== routeId)
    };
    setCustomRoutes(updatedRoutes);
    localStorage.setItem('pigTownCustomRoutes', JSON.stringify(updatedRoutes));
    
    if (activeRouteId === routeId) {
      setActiveRouteId(null);
      setIsCustomRouteMode(false);
    }
  };

  const handleSaveRouteName = (routeId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    
    const mapRoutes = customRoutes[currentMapId] || [];
    const updatedRoutes = {
      ...customRoutes,
      [currentMapId]: mapRoutes.map(r => r.id === routeId ? { ...r, name: trimmed } : r)
    };
    setCustomRoutes(updatedRoutes);
    localStorage.setItem('pigTownCustomRoutes', JSON.stringify(updatedRoutes));
    setEditingRouteNameId(null);
  };

  const handleChangeRouteColor = (routeId: string, color: string, shouldClose = true) => {
    const mapRoutes = customRoutes[currentMapId] || [];
    const updatedRoutes = {
      ...customRoutes,
      [currentMapId]: mapRoutes.map(r => r.id === routeId ? { ...r, color } : r)
    };
    setCustomRoutes(updatedRoutes);
    localStorage.setItem('pigTownCustomRoutes', JSON.stringify(updatedRoutes));
    if (shouldClose) {
      setColorPickerOpenId(null);
    }
  };

  const handleToggleColorPicker = (routeId: string) => {
    setColorPickerOpenId(prev => prev === routeId ? null : routeId);
  };

  
  // Tab within tooltip
  const [activeTooltipTab, setActiveTooltipTab] = useState<'selected' | 'all'>('selected');
  
  // Tab within the full list of creatures (all / birds / insects / fishing / other)
  const [selectedCreatureTab, setSelectedCreatureTab] = useState<'all' | 'birds' | 'insects' | 'fishing' | 'other'>('all');
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'collected' | 'uncollected'>('all');
  const [starFilter, setStarFilter] = useState<'all' | 'done' | 'todo'>('all');
  const [masterFilter, setMasterFilter] = useState<'all' | 'done' | 'todo'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter for only specific creatures to this sub-location (hiding catch-all/general group items)
  const [onlyThisRegion, setOnlyThisRegion] = useState(false);

  // Reset onlyThisRegion filter and tab selection when selectedLocation changes
  useEffect(() => {
    setOnlyThisRegion(false);
    setSelectedCreatureTab('all');
  }, [selectedLocation]);
  
  // Stateful location coordinates so they can be dragged and exported in dev mode
  const [locations, setLocations] = useState<Record<string, MapLocation>>(LOCATION_COORDINATES);
  const [draggingMarker, setDraggingMarker] = useState<string | null>(null);
  const [selectedLocationKey, setSelectedLocationKey] = useState<string | null>(null);
  const [isSharedLinkView, setIsSharedLinkView] = useState<boolean>(false);

  // Synchronize browser address bar with map and selected location
  useEffect(() => {
    if (isOpen) {
      const locationId = selectedLocationKey ? mapKeyToLocationId(selectedLocationKey) : null;
      const urlMapId = currentMapId === 'town' ? '고래섬' : '고래낙하협곡';
      let newUrl = `/map=${encodeURIComponent(urlMapId)}`;
      if (locationId) {
        newUrl += `?location=${encodeURIComponent(locationId)}`;
      }
      if (location.pathname + location.search !== newUrl) {
        const path = location.pathname.toLowerCase();
        // Prevent race conditions where closing the map updates the pathname to non-map categories,
        // but this effect still runs before unmount and overwrites the URL back to /map.
        if (path.startsWith('/map') || path === '/' || path === '') {
          navigate(newUrl, { replace: true });
        }
      }
    }
  }, [isOpen, currentMapId, selectedLocationKey, location, navigate]);

  // Auto expand and focus/scroll group in Gu-yeok info when selectedLocation changes
  useEffect(() => {
    if (selectedLocation && currentMapId !== 'town') {
      const groupName = selectedLocation.routeGroup || selectedLocation.displayName || selectedLocation.name;
      if (groupName) {
        setExpandedGroups(prev => {
          const next = new Set(prev);
          next.add(groupName);
          return next;
        });

        // Use setTimeout to allow the expanding animation/render to finish, then scroll it into view
        setTimeout(() => {
          const subItemElement = selectedLocationKey ? document.getElementById(`sub-item-${selectedLocationKey}`) : null;
          if (subItemElement) {
            subItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            const element = document.getElementById(`group-card-${groupName}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 180);
      }
    }
  }, [selectedLocation, selectedLocationKey, currentMapId]);

  // --- Simulation & Grouping States ---
  const [simGroups, setSimGroups] = useState<string[]>(['임시 그룹 1', '임시 그룹 2']);
  const [selectedSimGroup, setSelectedSimGroup] = useState<string>('임시 그룹 1');
  const [newSimGroupName, setNewSimGroupName] = useState<string>('');
  const [newPinName, setNewPinName] = useState<string>('');
  const [newPinGroup, setNewPinGroup] = useState<string>('');
  const [isAddingNewGroupInline, setIsAddingNewGroupInline] = useState<boolean>(false);
  const [inlineGroupName, setInlineGroupName] = useState<string>('');
  const [hideAllOriginalPins, setHideAllOriginalPins] = useState<boolean>(false);

  // Helper to generate a unique key for a segment between two locations
  const getSegmentKey = (keyA: string, keyB: string) => {
    return [keyA, keyB].sort().join('<->');
  };

  // Calculate segment overlaps and offset coordinates for all visible routes
  const offsetPaths = useMemo(() => {
    const segmentRouteMap: Record<string, string[]> = {}; // segmentKey -> [routeIds]
    const routesData: Array<{ 
      id: string, 
      type: 'custom' | 'group', 
      keys: string[], 
      color: string, 
      isHighlighted?: boolean,
      isSelected?: boolean,
      originalId?: string,
      groupName?: string
    }> = [];

    // --- Collect Custom Routes ---
    const currentCustomRoutes = customRoutes[currentMapId] || [];
    currentCustomRoutes.forEach(route => {
      if (route.visible === false) return;
      const visibleKeys = route.keys.filter(k => !hiddenLocationKeys.has(k) && locations[k]);
      if (visibleKeys.length < 2) return;
      
      const isEditingThisRoute = isCustomRouteMode && activeRouteId === route.id;
      const isSelectedRoute = selectedCustomRouteId === route.id;
      
      routesData.push({ 
        id: `custom-${route.id}`, 
        type: 'custom',
        keys: visibleKeys, 
        color: route.color,
        isHighlighted: isEditingThisRoute || isSelectedRoute,
        isSelected: isSelectedRoute,
        originalId: route.id
      });
    });

    // --- Collect Group Routes ---
    const groupMap = (Object.entries(locations) as [string, MapLocation][]).reduce((acc, [key, loc]) => {
      const mapId = loc.mapId || 'town';
      if (mapId !== currentMapId) return acc;
      if (hiddenLocationKeys.has(key)) return acc;
      const isOriginal = !key.startsWith('TEMP_PIN_');
      if (hideAllOriginalPins && isOriginal) return acc;
      
      if (loc.routeGroup && loc.showRoute !== false) {
        if (!acc[loc.routeGroup]) acc[loc.routeGroup] = [];
        acc[loc.routeGroup].push({ key, loc });
      }
      return acc;
    }, {} as Record<string, Array<{key: string, loc: MapLocation}>>);

    Object.entries(groupMap).forEach(([groupName, groupItems]) => {
      if (groupItems.length < 2) return;
      if (hiddenGroupRoutes.has(groupName)) return; // Filter out hidden group routes
      const sorted = [...groupItems].sort((a, b) => {
        if (a.loc.routeOrder !== undefined && b.loc.routeOrder !== undefined) return a.loc.routeOrder - b.loc.routeOrder;
        const numA = parseInt(a.loc.name.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.loc.name.match(/\d+/)?.[0] || '0', 10);
        if (numA !== numB) return numA - numB;
        return 0;
      });
      const keys = sorted.map(i => i.key);
      routesData.push({ 
        id: `group-${groupName}`, 
        type: 'group',
        keys, 
        color: getGroupColor(groupName),
        groupName: groupName
      });
    });

    // --- Build Segment Overlap Map ---
    // We only consider overlapping routes that are actually rendered together
    const showCustom = currentCustomRoutes.filter(r => r.visible !== false && r.keys.length > 0).length > 0 || isCustomRouteMode;
    const activeRoutesData = routesData.filter(r => {
      if (r.type === 'custom') return showCustom;
      if (r.type === 'group') {
        if (!showCustom) return true;
        if (currentMapId === 'whaleCanyon') return true;
        return false;
      }
      return false;
    });

    activeRoutesData.forEach(route => {
      for (let i = 0; i < route.keys.length - 1; i++) {
        const segKey = getSegmentKey(route.keys[i], route.keys[i+1]);
        if (!segmentRouteMap[segKey]) segmentRouteMap[segKey] = [];
        segmentRouteMap[segKey].push(route.id);
      }
    });

    // --- Calculate Offset Segments ---
    const GAP = 0.6; // Parallel gap distance in SVG coordinates

    return activeRoutesData.map(route => {
      const segments: Array<{p1: {x: number, y: number}, p2: {x: number, y: number}}> = [];
      
      for (let i = 0; i < route.keys.length - 1; i++) {
        const k1 = route.keys[i];
        const k2 = route.keys[i+1];
        const l1 = locations[k1];
        const l2 = locations[k2];
        const segKey = getSegmentKey(k1, k2);
        
        const sharingRoutes = segmentRouteMap[segKey] || [];
        const routeIndex = sharingRoutes.indexOf(route.id);
        const totalSharing = sharingRoutes.length;
        
        if (totalSharing > 1) {
          const offsetAmount = (routeIndex - (totalSharing - 1) / 2) * GAP;
          
          const dx = l2.x - l1.x;
          const dy = l2.y - l1.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          
          if (len > 0) {
            const nx = -dy / len;
            const ny = dx / len;
            segments.push({
              p1: { x: l1.x + nx * offsetAmount, y: l1.y + ny * offsetAmount },
              p2: { x: l2.x + nx * offsetAmount, y: l2.y + ny * offsetAmount }
            });
          } else {
            segments.push({ p1: l1, p2: l2 });
          }
        } else {
          segments.push({ p1: l1, p2: l2 });
        }
      }
      
      return { ...route, segments, isDimmedByCustomMode: route.type === 'group' && showCustom && currentMapId === 'whaleCanyon' };
    });
  }, [currentMapId, customRoutes, locations, hiddenLocationKeys, hideAllOriginalPins, isCustomRouteMode, activeRouteId, selectedCustomRouteId, hiddenGroupRoutes]);

  const potentialDragMarkerRef = useRef<string | null>(null);

  const handleRenameLocation = (key: string, newName: string) => {
    setLocations(prev => {
      const updated = { ...prev };
      if (updated[key]) {
        updated[key] = {
          ...updated[key],
          name: newName,
          displayName: newName
        };
      }
      return updated;
    });
    setSelectedLocation(prev => {
      if (prev) {
        if (selectedLocationKey === key) {
          return { ...prev, name: newName, displayName: newName };
        }
        // Fallback name search
        const locKey = Object.keys(locations).find(k => locations[k].name === prev.name);
        if (locKey === key) {
          return { ...prev, name: newName, displayName: newName };
        }
      }
      return prev;
    });
  };

  const handleDeleteLocation = (key: string) => {
    setLocations(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setSelectedLocation(null);
    setSelectedLocationKey(null); setIsSharedLinkView(false);
  };

  const handleAddNewPin = () => {
    if (!clickedCoords || !newPinName.trim()) return;
    const pinName = newPinName.trim();
    const pinKey = `TEMP_PIN_${Date.now()}`;
    const newLoc: MapLocation = {
      name: pinName,
      displayName: pinName,
      x: clickedCoords.x,
      y: clickedCoords.y,
      mapId: currentMapId,
      level: 2,
      section: '임시 핀',
      routeGroup: selectedSimGroup || undefined,
      showRoute: selectedSimGroup ? true : false
    };
    setLocations(prev => ({
      ...prev,
      [pinKey]: newLoc
    }));
    setNewPinName('');
    setClickedCoords(null);
    setSelectedLocation(newLoc);
    setSelectedLocationKey(pinKey);
  };

  const handleAddSimGroup = () => {
    if (newSimGroupName.trim() && !simGroups.includes(newSimGroupName.trim())) {
      setSimGroups([...simGroups, newSimGroupName.trim()]);
      setSelectedSimGroup(newSimGroupName.trim());
      setNewSimGroupName('');
    }
  };

  const handleDeleteSimGroup = (groupName: string) => {
    setSimGroups(prev => prev.filter(g => g !== groupName));
    setLocations(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (updated[key].routeGroup === groupName) {
          updated[key] = {
            ...updated[key],
            routeGroup: undefined,
            showRoute: false
          };
        }
      });
      return updated;
    });
  };

  const handleResetSimulation = () => {
    setLocations(JSON.parse(JSON.stringify(LOCATION_COORDINATES)));
    setSimGroups(['임시 그룹 1', '임시 그룹 2']);
    setSelectedSimGroup('임시 그룹 1');
    setClickedCoords(null);
    setSelectedLocation(null);
    setSelectedLocationKey(null); setIsSharedLinkView(false);
    setNewPinName('');
    setNewPinGroup('');
    setIsAddingNewGroupInline(false);
    setInlineGroupName('');
    setHideAllOriginalPins(false);
  };
  const wasDraggingRef = useRef(false);
  const dragStartScreenRef = useRef({ x: 0, y: 0 });
  const onSelectCreatureRef = useRef(onSelectCreature);
  const lastSyncedItemNameRef = useRef<string>('');

  // Keep callback ref updated
  useEffect(() => {
    onSelectCreatureRef.current = onSelectCreature;
  }, [onSelectCreature]);

  // Prevent main page scrolling when the interactive map is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Mobile device detection
  const [isMobile, setIsMobile] = useState(false);
  const [modalSize, setModalSize] = useState<{ width: string; height: string }>({ width: '100%', height: '80vh' });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updateModalSize = () => {
      if (window.innerWidth < 1024) {
        setModalSize({ width: '100%', height: '90vh' });
        return;
      }

      // Desktop layout
      const padding = 64; // 32px padding on each side
      const maxH = 750;   // Reasonable maximum map height on standard screens
      const minH = 450;   // Reasonable minimum map height to keep it usable
      
      const availH = window.innerHeight - padding;
      const availW = window.innerWidth - padding;
      
      // We want: mapWidth = mapHeight
      // Total modal width = mapWidth + 350px (sidebar)
      // So modalWidth = mapHeight + 350px
      // Therefore, mapHeight must fit both vertical and horizontal available space.
      // 1. mapHeight <= availH
      // 2. mapHeight + 350 <= availW  =>  mapHeight <= availW - 350
      
      let optimalHeight = Math.min(availH, availW - 350);
      
      // Bound the optimal height
      optimalHeight = Math.min(Math.max(optimalHeight, minH), maxH);
      
      // Ensure we don't overflow the viewport height and width under extreme conditions
      if (optimalHeight + padding > window.innerHeight) {
        optimalHeight = window.innerHeight - padding;
      }
      if (optimalHeight + 350 + padding > window.innerWidth) {
        optimalHeight = window.innerWidth - 350 - padding;
      }
      
      // Absolute minimum fallback to avoid issues
      optimalHeight = Math.max(optimalHeight, 300);
      
      const width = `${optimalHeight + 350}px`;
      const height = `${optimalHeight}px`;
      
      setModalSize({ width, height });
    };

    updateModalSize();
    window.addEventListener('resize', updateModalSize);
    return () => window.removeEventListener('resize', updateModalSize);
  }, [isOpen]);

  // Map Share Onboarding Guide
  const [showShareGuide, setShowShareGuide] = useState(false);
  const [shareBtnRect, setShareBtnRect] = useState<DOMRect | null>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const hasShown = localStorage.getItem('pigtown_map_share_guide_shown');
      if (!hasShown) {
        const timer = setTimeout(() => {
          setShowShareGuide(true);
          if (shareButtonRef.current) {
            setShareBtnRect(shareButtonRef.current.getBoundingClientRect());
          }
        }, 500); // 500ms delay to let opening transitions stabilize
        return () => clearTimeout(timer);
      }
    } else {
      setShowShareGuide(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showShareGuide) return;
    const updatePosition = () => {
      if (shareButtonRef.current) {
        setShareBtnRect(shareButtonRef.current.getBoundingClientRect());
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [showShareGuide]);

  const handleCloseGuide = () => {
    localStorage.setItem('pigtown_map_share_guide_shown', 'true');
    setShowShareGuide(false);
  };

  // Developer Mode Settings
  const [devMode, setDevMode] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ x: number; y: number } | null>(null);
  const [isLocationsCopied, setIsLocationsCopied] = useState(false);

  // Map elements dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement>(null);

  // Export current locations coordinates to clipboard
  const exportLocationsToClipboard = () => {
    const sortedEntries = (Object.entries(locations) as Array<[string, MapLocation]>)
      .filter(([key, loc]) => {
        // Must belong to current map
        const mapId = loc.mapId || 'town';
        if (mapId !== currentMapId) return false;
        
        // Exclude if hidden by individual eye toggle
        if (hiddenLocationKeys.has(key)) return false;
        
        // Exclude if hideAllOriginalPins is active and it is an original pin
        const isOriginal = !key.startsWith('TEMP_PIN_');
        if (hideAllOriginalPins && isOriginal) return false;
        
        return true;
      })
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
    
    const outputLines = sortedEntries.map(([key, loc]) => {
      return `${loc.name} : (${loc.x}, ${loc.y})`;
    });
    const textToCopy = outputLines.join('\n');
    navigator.clipboard.writeText(textToCopy);
    setIsLocationsCopied(true);
    setTimeout(() => setIsLocationsCopied(false), 2000);
  };

  // Calculate minimum zoom dynamically to fit the map based on container width
  const getMinZoom = () => {
    if (!mapContainerRef.current || !mapImageRef.current) return 0.4;
    const containerWidth = mapContainerRef.current.clientWidth;
    const imgWidth = mapImageRef.current.clientWidth;

    if (imgWidth === 0) return 0.4;

    // Scale strictly to fit the horizontal container width
    return containerWidth / imgWidth;
  };

  // Constrain offset based on current zoom level and temporary edge padding
  const getConstrainedOffset = (x: number, y: number, currentZoom: number, paddingOverride?: typeof extraPadding) => {
    if (!mapContainerRef.current || !mapImageRef.current) return { x, y };

    const padding = paddingOverride || extraPadding;
    const containerWidth = mapContainerRef.current.clientWidth || 1;
    const containerHeight = mapContainerRef.current.clientHeight || 1;

    const imgW = mapImageRef.current.clientWidth * currentZoom;
    const imgH = mapImageRef.current.clientHeight * currentZoom;

    const baseMaxOffsetX = Math.max(0, (imgW - containerWidth) / 2);
    const baseMaxOffsetY = Math.max(0, (imgH - containerHeight) / 2);

    const maxRightShift = baseMaxOffsetX + (padding.left || 0);
    const maxLeftShift = -(baseMaxOffsetX + (padding.right || 0));

    const maxDownShift = baseMaxOffsetY + (padding.top || 0);
    const maxUpShift = -(baseMaxOffsetY + (padding.bottom || 0));

    return {
      x: Math.min(Math.max(x, maxLeftShift), maxRightShift),
      y: Math.min(Math.max(y, maxUpShift), maxDownShift)
    };
  };

  // Center map on target location, adding minimal required padding if location is near map edges
  const centerOnLocation = (targetLocation: MapLocation, targetZoom = 2.2) => {
    if (!mapContainerRef.current || !mapImageRef.current) return;

    const containerWidth = mapContainerRef.current.clientWidth || 1;
    const containerHeight = mapContainerRef.current.clientHeight || 1;

    const imgW = mapImageRef.current.clientWidth * targetZoom;
    const imgH = mapImageRef.current.clientHeight * targetZoom;

    // Ideal unconstrained offset to place targetLocation at exact center (50%, 50%)
    const idealPanX = -(targetLocation.x - 50) * (imgW / 100);
    const idealPanY = -(targetLocation.y - 50) * (imgH / 100);

    const baseMaxOffsetX = Math.max(0, (imgW - containerWidth) / 2);
    const baseMaxOffsetY = Math.max(0, (imgH - containerHeight) / 2);

    let neededLeft = 0;
    let neededRight = 0;
    let neededTop = 0;
    let neededBottom = 0;

    if (idealPanX > baseMaxOffsetX) {
      neededLeft = idealPanX - baseMaxOffsetX;
    } else if (idealPanX < -baseMaxOffsetX) {
      neededRight = (-idealPanX) - baseMaxOffsetX;
    }

    if (idealPanY > baseMaxOffsetY) {
      neededTop = idealPanY - baseMaxOffsetY;
    } else if (idealPanY < -baseMaxOffsetY) {
      neededBottom = (-idealPanY) - baseMaxOffsetY;
    }

    const newPadding = {
      left: Math.ceil(Math.max(0, neededLeft)),
      right: Math.ceil(Math.max(0, neededRight)),
      top: Math.ceil(Math.max(0, neededTop)),
      bottom: Math.ceil(Math.max(0, neededBottom))
    };

    setExtraPadding(newPadding);
    setZoom(targetZoom);

    setTimeout(() => {
      setOffset({ x: idealPanX, y: idealPanY });
    }, 40);
  };

  // Combine all items to find spawn tables
  const allCreatures = useMemo(() => {
    const finalBirds = birds || BIRDS;
    const finalInsects = insects || INSECTS;
    const finalFish = fish || FISHING;
    return [
      ...finalBirds.map(b => ({ ...b, dbType: 'birds' })),
      ...finalInsects.map(i => ({ ...i, dbType: 'insects' })),
      ...finalFish.map(f => ({ ...f, dbType: 'fishing' }))
    ];
  }, [birds, insects, fish]);

  // Dynamically sync groups from DB for mapped locations 1:1 with the encyclopedia filters
  const dynamicLocations = useMemo(() => {
    const locs = { ...LOCATION_COORDINATES };
    const catchAllKeywords = ['전체', '모든 '];
    
    // Process all locations from the database
    allCreatures.forEach(item => {
      const itemCategory = item.category || '기타';
      if (item.locations) {
        item.locations.forEach(loc => {
          const isCatchAll = catchAllKeywords.some(kw => loc.includes(kw)) || loc === '전체';
          if (!isCatchAll) {
            // Find ALL entries in locs where locs[key].name matches loc exactly
            Object.keys(locs).forEach(key => {
              if (locs[key].name === loc) {
                if (!locs[key].groups) {
                  locs[key] = {
                    ...locs[key],
                    groups: itemCategory
                  };
                }
              }
            });
          }
        });
      }
    });
    
    return locs;
  }, [allCreatures]);

  // Memoized Markers Rendering to prevent unnecessary re-creation and re-rendering on zoom/pan/state updates
  const memoizedMarkers = useMemo(() => {
    return (Object.entries(locations) as [string, MapLocation][])
      .filter(([key, loc]) => (loc.mapId || 'town') === currentMapId)
      .map(([key, loc], idx) => {
        if (hiddenLocationKeys.has(key)) return null;
        
        const isOriginal = !key.startsWith('TEMP_PIN_');
        if (hideAllOriginalPins && isOriginal) return null;
        
        const isSelected = (selectedLocationKey && selectedLocationKey === key) ||
          (selectedLocationKey && mapKeyToLocationId(selectedLocationKey) === mapKeyToLocationId(key)) ||
          (selectedLocation && selectedLocation === loc) ||
          (selectedLocation && selectedLocation.name === loc.name && (selectedLocation.mapId || 'town') === (loc.mapId || 'town') && (selectedLocation.level || 3) === (loc.level || 3));
          
        const isHighlighted = Boolean(highlightedLocationName) && (
          highlightedLocationName === loc.name ||
          highlightedLocationName === loc.displayName ||
          Boolean(loc.groups && loc.groups.split(',').map(g => g.trim()).includes(highlightedLocationName))
        );
        const pinLevel = loc.level || 3;
        const isLandmark = loc.mapId === 'whaleCanyon' && loc.section === '지명';
      
      let isVisible = devMode;
      if (!isVisible) {
        if (isSelected || isHighlighted) {
          isVisible = true;
        } else if (isLandmark) {
          isVisible = true;
        } else if (loc.icon) {
          isVisible = zoom > 1.02;
        } else if (pinLevel === 1) {
          isVisible = zoom <= 1.02;
        } else {
          if (pinLevel === 2 && zoom > 1.02) {
            isVisible = true;
          } else if (pinLevel === 3 && zoom > 1.4) {
            isVisible = true;
          }
        }
      }
      
      if (!isVisible) return null;

      const hasCreatures = allCreatures.some(c => {
        if (!c.locations) return false;
        if (c.locations.includes(loc.name)) return true;
        if (loc.groups) {
          const groupList = loc.groups.split(',').map(g => g.trim());
          return c.locations.some(cl => groupList.includes(cl));
        }
        return false;
      });

      const isTextOnly = !devMode && !loc.icon && (!hasCreatures || pinLevel === 1 || isLandmark);
      const isFloorText = !loc.icon && pinLevel === 2 && !hasCreatures && !loc.groups && !devMode;
      const computedScale = (isMobile ? 0.85 : 1.0) / zoom;
      const hideLabelByDefault = !!loc.icon || (loc.mapId === 'whaleCanyon' && (loc.section === '채집물' || loc.section === 'NPC 및 기타' || loc.section === '편의시설' || loc.section === '포토존'));
      const showLabelText = !hideLabelByDefault || isSelected || isHighlighted;
      
      const isClickableIcon = loc.icon && (
        loc.displayName === '미역' || loc.displayName === '바다 아스파라거스' || loc.displayName === '바다 포도' ||
        loc.name.includes('미역') || loc.name.includes('바다 아스파라거스') || loc.name.includes('바다 포도') ||
        (loc.mapId && loc.mapId !== 'town')
      );

      const activeRoute = (customRoutes[currentMapId] || []).find(r => r.id === activeRouteId) 
        || (customRoutes[currentMapId] || []).find(r => r.id === selectedCustomRouteId && r.keys.includes(key))
        || (customRoutes[currentMapId] || []).find(r => r.visible !== false && r.keys.includes(key));
      
      const visibleRouteKeys = activeRoute ? activeRoute.keys.filter(k => !hiddenLocationKeys.has(k)) : [];
      const customRouteIndex = activeRoute ? visibleRouteKeys.indexOf(key) : -1;
      const isCustomRouteTarget = customRouteIndex !== -1;
      const isLastClicked = isCustomRouteMode && lastClickedRoutePin === key;
      
      let markerZIndex = 20;
      if (isLandmark) {
        markerZIndex = 1;
      } else if (isLastClicked) {
        markerZIndex = 100;
      } else if (isCustomRouteMode && activeRouteId && isCustomRouteTarget) {
        markerZIndex = 70;
      } else if (isCustomRouteTarget) {
        markerZIndex = 60;
      } else if (isSelected) {
        markerZIndex = isSharedLinkView ? 200 : 50;
      } else if (isHighlighted) {
        markerZIndex = 40;
      } else if (pinLevel === 2 && !loc.groups) {
        markerZIndex = 5;
      }

      const isDimmedByShare = isSharedLinkView && !isSelected && !isHighlighted;

      return (
        <div
           key={`marker-${key}`}
           className={`absolute transition-all duration-500 ${isDimmedByShare ? 'opacity-40 grayscale-0' : 'opacity-100'}`}
           style={{ 
             left: `${loc.x}%`, 
             top: `${loc.y}%`, 
             transform: `translate(-50%, -50%) scale(${computedScale})`,
             transformOrigin: 'center',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d',
             zIndex: markerZIndex
           }}
        >
          <button
            onMouseDown={(e) => {
              if (devMode) {
                e.stopPropagation();
                e.preventDefault();
                potentialDragMarkerRef.current = key;
                dragStartScreenRef.current = { x: e.clientX, y: e.clientY };
                wasDraggingRef.current = false;
              }
            }}
            onTouchStart={(e) => {
              if (devMode) {
                e.stopPropagation();
                const touch = e.touches[0];
                potentialDragMarkerRef.current = key;
                dragStartScreenRef.current = { x: touch.clientX, y: touch.clientY };
                wasDraggingRef.current = false;
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (wasDraggingRef.current) {
                return;
              }
              
              if (isCustomRouteMode && activeRouteId) {
                setLastClickedRoutePin(key);
                setCustomRoutes(prev => {
                  const currentList = prev[currentMapId] || [];
                  const updatedList = currentList.map(route => {
                    if (route.id === activeRouteId) {
                      const nextKeys = route.keys.includes(key)
                        ? route.keys.filter(k => k !== key)
                        : [...route.keys, key];
                      return { ...route, keys: nextKeys };
                    }
                    return route;
                  });
                  const updated = { ...prev, [currentMapId]: updatedList };
                  localStorage.setItem('pigTownCustomRoutes', JSON.stringify(updated));
                  return updated;
                });
                return;
              }
              
              if ((pinLevel === 2 && !hasCreatures && !loc.groups && !devMode) || (loc.icon && !devMode && !isClickableIcon)) {
                return;
              }
              
              handleClearHighlight(); setIsSharedLinkView(false);
              
              if (pinLevel === 1 && !devMode) {
                setSelectedLocation(loc);
                setSelectedLocationKey(key);
                setIsSharedLinkView(false);
                setSelectedItemName('');
                setActiveTooltipTab('all');
                centerOnLocation(loc, 1.8);
                return;
              }

              setSelectedLocation(loc);
              setSelectedLocationKey(key);
              setIsSharedLinkView(false);
              setSelectedItemName('');
              setActiveTooltipTab('all');
              centerOnLocation(loc, Math.max(zoom, 2.0));
            }}
            className={`group/marker relative flex flex-col items-center p-0.5 rounded-full transition-all duration-300 ${isFloorText || isLandmark || (loc.icon && !devMode && !isClickableIcon) ? 'pointer-events-none select-none' : 'cursor-pointer pointer-events-auto'} ${
              isSelected && !isLandmark
                ? 'scale-110' 
                : isHighlighted && !isLandmark ? 'scale-105' : (!isLandmark ? 'hover:scale-105' : '')
            }`}
          >
            {isTextOnly ? (
              <span className={`font-black tracking-widest uppercase whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] transition-all duration-200 ${
                isLandmark ? 'text-[13px] lg:text-[15.5px] text-stone-200 font-black tracking-[0.12em]' :
                isSelected ? 'text-amber-400 scale-105 transition-transform' : 
                isHighlighted ? 'text-amber-300 scale-102 transition-transform' :
                pinLevel === 1 ? 'text-[12px] lg:text-[14.5px] text-stone-200 group-hover/marker:text-amber-400 group-hover/marker:scale-105' : 'text-[11px] lg:text-[13px] text-stone-300 transition-colors'
              }`}>
                {loc.displayName || loc.name}
              </span>
            ) : (
              <>
                {(isCustomRouteTarget && activeRoute && (activeRoute.id === activeRouteId || activeRoute.id === selectedCustomRouteId)) && (() => {
                  let hasPinOnRight = false;
                  let hasPinOnLeft = false;
                  (Object.entries(locations) as [string, MapLocation][]).forEach(([oKey, oLoc]) => {
                    if (oKey === key || (oLoc.mapId || 'town') !== currentMapId) return;
                    if (oLoc.section === '지명') return;
                    const dist = Math.hypot(oLoc.x - loc.x, oLoc.y - loc.y);
                    if (dist < 4.5) {
                      if (oLoc.x >= loc.x) hasPinOnRight = true;
                      if (oLoc.x < loc.x) hasPinOnLeft = true;
                    }
                  });
                  
                  let positionClasses = '-top-3 -right-3';
                  if (hasPinOnRight && hasPinOnLeft) {
                    positionClasses = '-top-6 left-1/2 -translate-x-1/2';
                  } else if (hasPinOnRight) {
                    positionClasses = '-top-3 -left-3';
                  }

                  return (
                    <div 
                      className={`absolute ${positionClasses} font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-stone-900 z-50 pointer-events-none transition-all duration-300`}
                      style={{ backgroundColor: activeRoute.color, color: getContrastColor(activeRoute.color) }}
                    >
                      {customRouteIndex + 1}
                    </div>
                  );
                })()}
                {loc.icon ? (
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center overflow-hidden border-2 shadow-lg transition-all bg-stone-900 ${
                    isSelected 
                      ? 'border-amber-400 scale-105 shadow-[0_0_12px_rgba(251,191,36,0.7)] ring-1 ring-amber-400 ring-offset-1 ring-offset-stone-900' 
                      : isHighlighted
                        ? 'border-amber-500/80 animate-pulse-slow shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                        : devMode 
                        ? 'border-red-500 opacity-80'
                        : 'border-stone-700 opacity-90 group-hover/marker:border-amber-400 group-hover/marker:opacity-100'
                  }`}>
                    <img loading="lazy" src={loc.icon} alt={loc.name} className="w-full h-full object-contain p-0.5" />
                  </div>
                ) : (
                  <div className={`h-4.5 w-4.5 md:h-5.5 md:w-5.5 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
                    isSelected 
                      ? 'bg-amber-400 border-stone-900 text-stone-900 scale-110' 
                      : isHighlighted
                        ? 'bg-amber-500/80 border-stone-900 text-stone-950 animate-pulse-slow shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        : devMode 
                        ? 'bg-red-500 border-stone-900 text-white hover:bg-red-400 animate-pulse'
                        : 'bg-stone-900 border-amber-400 text-amber-400 group-hover/marker:bg-amber-500/20'
                  }`}>
                    <MapPin className="h-2 w-2 md:h-2.5 md:w-2.5 fill-current" />
                  </div>
                )}
                {showLabelText && (
                  <div className={`absolute top-full mt-1 px-1 md:px-1.5 py-0.5 rounded-md text-[10px] md:text-[12px] font-black border tracking-tight whitespace-nowrap shadow-sm transition-all ${
                    isSelected 
                      ? 'bg-amber-400 text-stone-950 border-amber-500 scale-105'
                      : isHighlighted
                        ? 'bg-amber-500/90 text-stone-950 border-amber-600'
                        : devMode 
                        ? 'bg-red-500 text-white border-red-400'
                        : 'bg-stone-900/90 text-stone-300 border-stone-800 group-hover/marker:text-white'
                  }`}>
                    {loc.displayName || loc.name}
                  </div>
                )}
              </>
            )}
          </button>
        </div>
      );
    });
  }, [currentMapId, locations, hiddenLocationKeys, hideAllOriginalPins, selectedLocationKey, selectedLocation, highlightedLocationName, devMode, zoom, allCreatures, isMobile, isSharedLinkView, customRoutes, activeRouteId, selectedCustomRouteId, isCustomRouteMode, lastClickedRoutePin]);

  // Update locations state when dynamicLocations changes to capture any edits from the DB
  useEffect(() => {
    setLocations(prev => {
      const updated = { ...dynamicLocations };
      // Preserve any manually dragged coordinates during this session
      Object.keys(prev).forEach(key => {
        if (updated[key] && prev[key].x !== LOCATION_COORDINATES[key]?.x) {
          updated[key].x = prev[key].x;
          updated[key].y = prev[key].y;
        }
      });
      return updated;
    });
  }, [dynamicLocations]);

  // Handle wheel events globally when open, filtering for map container targets
  useEffect(() => {
    if (!isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      const container = mapContainerRef.current;
      if (!container) return;

      const isInsideMap = container.contains(e.target as Node);
      if (!isInsideMap) return;

      e.preventDefault();
      
      const zoomFactor = 0.15;
      const direction = e.deltaY < 0 ? 1 : -1;
      
      setZoom(prevZoom => {
        const minZ = getMinZoom();
        const nextZoom = Math.max(minZ, Math.min(prevZoom + direction * zoomFactor, 4));
        
        if (nextZoom < minZ + 0.1) {
          setSelectedLocation(null);
        }
        
        setOffset(prevOffset => {
          return getConstrainedOffset(prevOffset.x, prevOffset.y, nextZoom);
        });
        
        return nextZoom;
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen, zoom]);

  // Adjust zoom/offset when container resizes
  useEffect(() => {
    const handleResize = () => {
      const minZ = getMinZoom();
      setZoom(prev => {
        const clamped = Math.max(minZ, prev);
        setOffset(prevOff => getConstrainedOffset(prevOff.x, prevOff.y, clamped));
        return clamped;
      });
    };

    window.addEventListener('resize', handleResize);
    // Trigger initial adjustment once components load
    setTimeout(handleResize, 100);
    setTimeout(handleResize, 500); // Back-up for slow image sizing
    
    return () => window.removeEventListener('resize', handleResize);
  }, [modalSize]);

  // Helper to find a location by key or name (preferring higher levels for duplicate names)
  const findLocationMatch = (locNameOrKey: string): MapLocation | null => {
    if (!locNameOrKey) return null;
    
    const searchName = locNameOrKey.trim();
    
    // 1. Direct key match
    if (locations[searchName]) {
      return locations[searchName];
    }
    
    // 2. Name match or Group match (preferring higher level for overlaps like 구해, 동해, 잔잔한 바다, 고래바다)
    const candidates = (Object.values(locations) as MapLocation[]).filter(
      (loc: MapLocation) => {
        if (!loc) return false;
        
        // Match by name or display name
        if (loc.name === searchName || loc.displayName === searchName) return true;
        
        // Match by group
        if (loc.groups) {
          const groupList = loc.groups.split(',').map(g => g.trim());
          if (groupList.includes(searchName)) return true;
        }
        
        return false;
      }
    );
    
    if (candidates.length > 0) {
      const sorted = [...candidates].sort((a: MapLocation, b: MapLocation) => (b.level || 3) - (a.level || 3));
      return sorted[0];
    }
    return null;
  };

  const prevIsOpenRef = useRef(false);
  const prevHighlightLocRef = useRef('');
  const prevHighlightItemRef = useRef('');

  // Sync state if highlighted values from card click change
  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      setIsSharedLinkView(false);
      resetPadding();
      return;
    }

    const justOpened = !prevIsOpenRef.current;
    
    if (justOpened) {
      resetPadding();
      setLocations(JSON.parse(JSON.stringify(LOCATION_COORDINATES)));
      setSimGroups(['임시 그룹 1', '임시 그룹 2']);
      setSelectedSimGroup('임시 그룹 1');
      setDevMode(false);
      setClickedCoords(null);
      setNewPinName('');
      setNewPinGroup('');
      setIsAddingNewGroupInline(false);
      setInlineGroupName('');
      setHideAllOriginalPins(false);
      if (!initialLocationKey && !highlightedLocationName) {
        setSelectedLocation(null);
        setSelectedLocationKey(null);
        setIsSharedLinkView(false);
      }
      setIsCustomRoutesCollapsed(true);
      setActiveRouteId(null);
      setSelectedCustomRouteId(null);
      setIsCustomRouteMode(false);
    }

    const highlightLocChanged = highlightedLocationName !== prevHighlightLocRef.current;
    
    // Check if the item changed, but ignore changes that we just sent OUT (internal changes)
    const highlightItemChanged = highlightedItemName !== prevHighlightItemRef.current && highlightedItemName !== lastSyncedItemNameRef.current;

    prevIsOpenRef.current = true;
    prevHighlightLocRef.current = highlightedLocationName || '';
    prevHighlightItemRef.current = highlightedItemName || '';

    // Only process changes if something actually changed from external props or it just opened
    if (justOpened || highlightLocChanged || highlightItemChanged) {
      if (justOpened && initialLocationKey) {
        const resolvedKey = mapLocationIdToKey(initialLocationKey);
        let matched = LOCATION_COORDINATES[resolvedKey];
        let actualKey = resolvedKey;

        if (!matched) {
          matched = findLocationMatch(resolvedKey) || null;
          if (matched) {
            const foundKey = Object.keys(LOCATION_COORDINATES).find(
              k => LOCATION_COORDINATES[k].name === matched?.name && (!matched.mapId || LOCATION_COORDINATES[k].mapId === matched.mapId)
            );
            if (foundKey) actualKey = foundKey;
          }
        }

        if (matched) {
          const targetMapId = matched.mapId || 'town';
          setCurrentMapId(targetMapId);
          setSelectedLocation(matched);
          setSelectedLocationKey(actualKey);
          setSelectedItemName('');
          setIsSharedLinkView(true);
          
          centerOnLocation(matched, 2.2);
          if (onPermalinkRestored) {
            setTimeout(onPermalinkRestored, 1000);
          }

          // Auto-expand group card in sidebar
          const groupName = matched.routeGroup || matched.displayName || matched.name;
          if (groupName) {
            setExpandedGroups(new Set([groupName]));
          }
        } else {
          // If a location key was passed but not matched, clear selection
          setCurrentMapId(initialMapId);
          setSelectedLocation(null);
          setSelectedLocationKey(null);
          setIsSharedLinkView(false);
          setSelectedItemName('');
          const minZ = getMinZoom();
          setZoom(minZ);
          setOffset({ x: 0, y: 0 });
          resetPadding();
          if (onPermalinkRestored) {
            setTimeout(onPermalinkRestored, 1000);
          }
        }
      } else if (highlightedLocationName) {
        const matched = findLocationMatch(highlightedLocationName);
        if (matched) {
          const targetMapId = matched.mapId || 'town';
          setCurrentMapId(targetMapId);
          setSelectedLocation(matched);
          
          // Find the key in LOCATION_COORDINATES
          const foundKey = Object.keys(LOCATION_COORDINATES).find(
            k => LOCATION_COORDINATES[k].name === matched.name && (!matched.mapId || LOCATION_COORDINATES[k].mapId === matched.mapId)
          );
          if (foundKey) {
            setSelectedLocationKey(foundKey);
          } else {
            setSelectedLocationKey(null);
            setIsSharedLinkView(false);
          }

          setSelectedItemName(highlightedItemName || '');
          lastSyncedItemNameRef.current = highlightedItemName || '';
          setActiveTooltipTab('all');
          
          centerOnLocation(matched, 2.2);
        } else {
          // If a location name was passed but not matched, clear the selection
          setSelectedLocation(null);
          setSelectedLocationKey(null);
          setIsSharedLinkView(false);
          setSelectedItemName(highlightedItemName || '');
          lastSyncedItemNameRef.current = highlightedItemName || '';
        }
      } else if (justOpened) {
        // Reset to default map and clear selection when opened manually without a location
        setCurrentMapId(initialMapId);
        setSelectedLocation(null);
        setSelectedLocationKey(null);
        setIsSharedLinkView(false);
        setSelectedItemName('');
        const minZ = getMinZoom();
        setZoom(minZ);
        setOffset({ x: 0, y: 0 });
        resetPadding();
        if (onPermalinkRestored) {
          setTimeout(onPermalinkRestored, 1000);
        }
      }
    }
  }, [highlightedLocationName, highlightedItemName, isOpen, locations, initialMapId, initialLocationKey, onPermalinkRestored, resetPadding]);

  // Sync selected creature logic removed to prevent auto-scrolling of background main cards


  // Find all creatures spawned in the currently selected location
  const creaturesInSelectedLocation = useMemo(() => {
    if (!selectedLocation) return [];
    
    // Build a set of all acceptable location names for the selected spot
    const targetNames = new Set<string>();
    targetNames.add(selectedLocation.name);
    
    if (selectedLocation.groups) {
      selectedLocation.groups.split(',').forEach(g => {
        const trimmed = g.trim();
        if (trimmed) {
          targetNames.add(trimmed);
        }
      });
    }
    
    return allCreatures.filter(c => {
      if (!c.locations) return false;
      return c.locations.some(loc => targetNames.has(loc));
    });
  }, [selectedLocation, allCreatures]);

  // Filter creatures list by ONLY specific creatures of this region (excluding catch-all / general ones if onlyThisRegion is true)
  const creaturesFilteredByRegion = useMemo(() => {
    if (!selectedLocation) return [];
    return creaturesInSelectedLocation.filter(c => {
      if (!onlyThisRegion) return true;
      if (!c.locations) return false;
      
      const broadGroups = new Set([
        '바다 전체', '모든 바다', '온천산 전체', '강 전체', '모든 강', 
        '호수 전체', '모든 호수', '숲 전체', '꽃밭 전체', '물가', '강가', '해변', '어촌 전체', '도심 전체'
      ]);
      
      // It is specific if it matches selectedLocation.name (if not broad) 
      // or any of selectedLocation's groups that are not broad.
      if (c.locations.includes(selectedLocation.name) && !broadGroups.has(selectedLocation.name)) {
        return true;
      }
      
      if (selectedLocation.groups) {
        const groupList = selectedLocation.groups.split(',').map(g => g.trim());
        const specificGroups = groupList.filter(g => !broadGroups.has(g));
        return c.locations.some(cl => cl === selectedLocation.name || specificGroups.includes(cl));
      }
      
      return c.locations.includes(selectedLocation.name);
    });
  }, [creaturesInSelectedLocation, onlyThisRegion, selectedLocation]);

  // Dynamic Tab counts for creatures in selected location (reflecting the region filter)
  const tabCounts = useMemo(() => {
    let birdsCount = 0;
    let insectsCount = 0;
    let fishingCount = 0;
    let otherCount = 0;
    
    creaturesFilteredByRegion.forEach(c => {
      if (c.dbType === 'birds') birdsCount++;
      else if (c.dbType === 'insects') insectsCount++;
      else if (c.dbType === 'fishing') fishingCount++;
      else otherCount++;
    });
    
    return { 
      all: creaturesFilteredByRegion.length,
      birds: birdsCount, 
      insects: insectsCount, 
      fishing: fishingCount, 
      other: otherCount 
    };
  }, [creaturesFilteredByRegion]);

  // Filter creaturesInSelectedLocation by active creature tab and new filters
  const filteredCreaturesByTab = useMemo(() => {
    let creatures = creaturesFilteredByRegion.filter(c => {
      if (selectedCreatureTab === 'all') return true;
      if (selectedCreatureTab === 'birds') return c.dbType === 'birds';
      if (selectedCreatureTab === 'insects') return c.dbType === 'insects';
      if (selectedCreatureTab === 'fishing') return c.dbType === 'fishing';
      return c.dbType !== 'birds' && c.dbType !== 'insects' && c.dbType !== 'fishing';
    });

    // Apply new filters
    return creatures.filter(c => {
      // Collection
      if (collectionFilter === 'collected' && !completedIds.has(c.id)) return false;
      if (collectionFilter === 'uncollected' && completedIds.has(c.id)) return false;

      // 5 Star (Rating >= 5)
      const rating = ratings[c.name] || 0;
      if (starFilter === 'done' && rating < 5) return false;
      if (starFilter === 'todo' && rating >= 5) return false;

      // Master
      let isMaster = false;
      if (c.dbType === 'birds') isMaster = masterBirdIds.has(c.id);
      else if (c.dbType === 'insects') isMaster = masterInsectIds.has(c.id);
      else if (c.dbType === 'fishing') isMaster = masterFishIds.has(c.id);

      if (masterFilter !== 'all' && c.excludeFromMaster) return false;
      if (masterFilter === 'done' && !isMaster) return false;
      if (masterFilter === 'todo' && isMaster) return false;

      return true;
    });
  }, [creaturesFilteredByRegion, selectedCreatureTab, collectionFilter, starFilter, masterFilter, completedIds, ratings, masterBirdIds, masterInsectIds, masterFishIds]);

  // Auto select first non-empty tab when selectedLocation changes or tabCounts changes
  useEffect(() => {
    if (selectedLocation) {
      if (tabCounts[selectedCreatureTab] === 0) {
        if (tabCounts.all > 0) {
          setSelectedCreatureTab('all');
        } else if (tabCounts.birds > 0) {
          setSelectedCreatureTab('birds');
        } else if (tabCounts.insects > 0) {
          setSelectedCreatureTab('insects');
        } else if (tabCounts.fishing > 0) {
          setSelectedCreatureTab('fishing');
        } else if (tabCounts.other > 0) {
          setSelectedCreatureTab('other');
        }
      }
    }
  }, [selectedLocation, tabCounts, selectedCreatureTab]);

  // Check if there are any general/common creatures in the active tab (which would be hidden if onlyThisRegion is true)
  const hasCommonCreaturesInActiveTab = useMemo(() => {
    if (!selectedLocation) return false;
    
    const activeTabCreaturesTotal = creaturesInSelectedLocation.filter(c => {
      if (selectedCreatureTab === 'all') return true;
      if (selectedCreatureTab === 'birds') return c.dbType === 'birds';
      if (selectedCreatureTab === 'insects') return c.dbType === 'insects';
      if (selectedCreatureTab === 'fishing') return c.dbType === 'fishing';
      return c.dbType !== 'birds' && c.dbType !== 'insects' && c.dbType !== 'fishing';
    });
    
    return activeTabCreaturesTotal.some(c => !c.locations.includes(selectedLocation.name));
  }, [creaturesInSelectedLocation, selectedCreatureTab, selectedLocation]);

  // Drag handlers for panning
  const isPanningRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    isPanningRef.current = true;
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    dragStartScreenRef.current = { x: e.clientX, y: e.clientY };
    wasDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (potentialDragMarkerRef.current && mapImageRef.current) {
      const dist = Math.hypot(e.clientX - dragStartScreenRef.current.x, e.clientY - dragStartScreenRef.current.y);
      if (dist > 5) {
        wasDraggingRef.current = true;
        if (draggingMarker !== potentialDragMarkerRef.current) {
          setDraggingMarker(potentialDragMarkerRef.current);
        }
      }
    }

    if (draggingMarker && mapImageRef.current) {
      const rect = mapImageRef.current.getBoundingClientRect();
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;
      
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      
      setLocations(prev => ({
         ...prev,
        [draggingMarker]: {
          ...prev[draggingMarker],
          x: parseFloat(x.toFixed(1)),
          y: parseFloat(y.toFixed(1))
        }
      }));
      return;
    }

    if (!isDragging || !isPanningRef.current) return;
    
    // Check displacement to define if dragging was significant
    if (Math.hypot(e.clientX - dragStartScreenRef.current.x, e.clientY - dragStartScreenRef.current.y) > 5) {
      wasDraggingRef.current = true;
    }
    
    requestAnimationFrame(() => {
      const nextX = e.clientX - dragStart.x;
      const nextY = e.clientY - dragStart.y;
      setOffset(getConstrainedOffset(nextX, nextY, zoom));
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    isPanningRef.current = false;
    setDraggingMarker(null);
    potentialDragMarkerRef.current = null;
    setTimeout(() => {
      wasDraggingRef.current = false;
    }, 100);
  };

  // Touch support for mobile panning & dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      isPanningRef.current = true;
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
      dragStartScreenRef.current = { x: touch.clientX, y: touch.clientY };
      wasDraggingRef.current = false;
    } else if (e.touches.length === 2) {
      // Initialize pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      setDragStart({ x: distance, y: zoom }); // Use dragStart to store initial distance and zoom
      setIsDragging(false);
      isPanningRef.current = false;
      wasDraggingRef.current = true; // Pinch zoom counts as dragging
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (potentialDragMarkerRef.current && mapImageRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - dragStartScreenRef.current.x, touch.clientY - dragStartScreenRef.current.y);
      if (dist > 5) {
        wasDraggingRef.current = true;
        if (draggingMarker !== potentialDragMarkerRef.current) {
          setDraggingMarker(potentialDragMarkerRef.current);
        }
      }
    }

    if (draggingMarker && mapImageRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = mapImageRef.current.getBoundingClientRect();
      let x = ((touch.clientX - rect.left) / rect.width) * 100;
      let y = ((touch.clientY - rect.top) / rect.height) * 100;
      
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      
      setLocations(prev => ({
        ...prev,
        [draggingMarker]: {
          ...prev[draggingMarker],
          x: parseFloat(x.toFixed(1)),
          y: parseFloat(y.toFixed(1))
        }
      }));
      return;
    }

    if (e.touches.length === 2) {
      // Prevent browser default gesture (scrolling, scaling)
      if (e.cancelable) {
        e.preventDefault();
      }
      
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      
      const initialDistance = dragStart.x;
      const initialZoom = dragStart.y;
      
      if (initialDistance > 0) {
        const zoomFactor = distance / initialDistance;
        const nextZoom = Math.max(getMinZoom(), Math.min(initialZoom * zoomFactor, 4));
        
        setZoom(nextZoom);
        setOffset(getConstrainedOffset(offset.x, offset.y, nextZoom));
      }
      return;
    }

    if (!isDragging || !isPanningRef.current || e.touches.length > 1) return;
    
    const touch = e.touches[0];
    if (Math.hypot(touch.clientX - dragStartScreenRef.current.x, touch.clientY - dragStartScreenRef.current.y) > 5) {
      wasDraggingRef.current = true;
    }
    
    // Prevent browser scroll when panning
    if (e.cancelable) {
      e.preventDefault();
    }
    
    requestAnimationFrame(() => {
      const nextX = touch.clientX - dragStart.x;
      const nextY = touch.clientY - dragStart.y;
      setOffset(getConstrainedOffset(nextX, nextY, zoom));
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    isPanningRef.current = false;
    setDraggingMarker(null);
    potentialDragMarkerRef.current = null;
    setTimeout(() => {
      wasDraggingRef.current = false;
    }, 100);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => {
      const nextZoom = Math.min(prev + 0.4, 4);
      setOffset(prevOffset => getConstrainedOffset(prevOffset.x, prevOffset.y, nextZoom));
      return nextZoom;
    });
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const minZ = getMinZoom();
      const nextZoom = Math.max(prev - 0.4, minZ);
      
      if (nextZoom < minZ + 0.1) {
        setSelectedLocation(null);
      }
      
      setOffset(prevOffset => getConstrainedOffset(prevOffset.x, prevOffset.y, nextZoom));
      return nextZoom;
    });
  };

  const handleResetZoom = () => {
    const minZ = getMinZoom();
    setZoom(minZ);
    setOffset({ x: 0, y: 0 });
    setSelectedLocation(null);
    handleClearHighlight(); setIsSharedLinkView(false);
  };

  const handleDoubleClick = () => {
    setZoom(prevZoom => {
      const nextZoom = Math.min(prevZoom + 0.5, 4);
      setOffset(prevOffset => {
        return getConstrainedOffset(prevOffset.x, prevOffset.y, nextZoom);
      });
      return nextZoom;
    });
  };

  // Map Click Handler for Dev Mode Coordinate Picker or selecting markers
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapImageRef.current) return;
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }

    const rect = mapImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (devMode) {
      setClickedCoords({ x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) });
    } else {
      setSelectedLocation(null);
      setSelectedLocationKey(null); setIsSharedLinkView(false);
      setSelectedItemName('');
      handleClearHighlight(); setIsSharedLinkView(false);
    }
  };

  const handleFilterLocationOnly = () => {
    if (!selectedLocation) return;
    setOnlyThisRegion(prev => !prev);
  };

  // Render specific item info in tooltip tab
  const selectedItemObject = useMemo(() => {
    if (!selectedItemName) return null;
    return allCreatures.find(c => c.name === selectedItemName);
  }, [selectedItemName, allCreatures]);

  return (
    <>
      {/* Toast Notification for Map Share (Requirement 2) */}
      {mapShareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[250] bg-stone-900 border border-stone-800 text-stone-100 px-5 py-2.5 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 animate-fadeIn pointer-events-none">
          <Check className="h-4 w-4 text-emerald-500" />
          <span>{mapShareToast}</span>
        </div>
      )}

      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-stone-950/30 backdrop-blur-[2px] select-none font-sans transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'}`}
      >
      <div 
        className={`relative bg-stone-900/95 border border-stone-800 text-stone-100 rounded-3xl w-full ${isMobile ? 'max-w-5xl h-[90vh]' : ''} flex flex-col lg:flex-row overflow-hidden shadow-2xl transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}
        style={isMobile ? {} : {
          width: modalSize.width,
          height: modalSize.height,
          maxWidth: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
          {/* Main Map Stage Panel */}
          <div className="relative bg-stone-950 overflow-hidden flex flex-col h-1/2 lg:h-full lg:flex-1">
            {/* Header overlay */}
            <div className="absolute top-2 left-2 right-1.5 z-[60] flex items-start justify-between pointer-events-none">
              <div className="flex items-start gap-1.5 pointer-events-auto">
                {/* PIG TOWN Brand Header Badge */}
                {!isCustomRouteMode && (
                <div className="flex flex-col gap-1 bg-stone-900/95 border border-stone-850/90 backdrop-blur-md p-2 rounded-xl shadow-lg select-none w-auto min-w-max shrink-0">
                  <div className="flex items-center gap-1.5 px-0.5">
                    <div className="h-4 w-4 rounded bg-stone-950 flex items-center justify-center overflow-hidden border border-stone-850 shrink-0">
                      <img loading="lazy" src="/images/new_logo.webp" alt="Pig Town Logo" className="h-full w-full object-contain" />
                    </div>
                    <span className="text-[10px] font-black text-amber-400 tracking-wider">피그타운</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 px-0.5 h-5 lg:h-8 lg:gap-3">
                    <span className="text-[9px] font-bold text-stone-400 shrink-0 leading-none lg:text-sm">맵 선택:</span>
                    <div ref={mapMenuRef} className="relative group/map-select flex items-center h-full">
                      <button
                        onClick={() => setIsMapMenuOpen(!isMapMenuOpen)}
                        className="flex items-center justify-between bg-stone-950/80 border border-stone-850 px-2 py-0 h-5 lg:h-8 lg:px-3 lg:text-xs rounded-lg text-[9px] font-extrabold text-stone-200 outline-none cursor-pointer hover:border-amber-500/50 transition-colors focus:ring-1 focus:ring-amber-500 min-w-[80px] lg:min-w-[120px]"
                      >
                        {MAP_CONFIGS[currentMapId as keyof typeof MAP_CONFIGS]?.name}
                        <ChevronDown className="h-3 w-3 text-amber-500 group-hover/map-select:text-amber-400" />
                      </button>
                      
                      {isMapMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-stone-900 border border-stone-800 rounded-lg shadow-xl z-[100] min-w-[120px] overflow-hidden">
                          {Object.values(MAP_CONFIGS).map(map => (
                            <button
                              key={map.id}
                              onClick={() => {
                                if (map.id !== currentMapId) {
                                  setSelectedLocation(null);
                                  setSelectedLocationKey(null); setIsSharedLinkView(false);
                                  setSelectedItemName('');
                                  setZoom(1);
                                  setOffset({ x: 0, y: 0 });
                                  setExpandedGroups(new Set());
                                }
                                setCurrentMapId(map.id);
                                setIsMapMenuOpen(false);
                                setIsMapLoading(true);
                              }}
                              className={`block w-full text-left px-3 py-2 text-xs font-bold ${currentMapId === map.id ? 'bg-amber-900/50 text-amber-100' : 'text-stone-300 hover:bg-stone-800'}`}
                            >
                              {map.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}

                {/* Dev Mode Coordinator Toggle */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setDevMode(!devMode);
                      setClickedCoords(null);
                      setSelectedLocation(null);
                    }}
                    className={`pointer-events-auto flex items-center gap-1.5 text-[10px] lg:text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-md active:scale-95 ${devMode ? "bg-amber-500 border-amber-400 text-stone-950 animate-pulse-slow" : "bg-stone-900/90 border-stone-850 text-stone-300 hover:bg-stone-800"}`}
                  >
                    <Compass className={`h-3.5 w-3.5 ${devMode ? "text-stone-950 animate-spin-slow" : "text-amber-500"}`} />
                    <span>{devMode ? "좌표 비활성" : "좌표 활성"}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 pointer-events-auto">
                {/* Share Button (Requirement 2) */}
                <div className="relative" ref={shareMenuRef}>
                  <button
                    ref={shareButtonRef}
                    type="button"
                    onClick={handleShareClick}
                    className="h-8 w-8 rounded-xl bg-stone-900/90 border border-stone-850 flex items-center justify-center hover:bg-stone-800 text-stone-200 active:scale-95 shadow-md transition-all cursor-pointer"
                    title="공유하기"
                  >
                    <Share2 className="h-4 w-4 text-amber-400" />
                  </button>
                  {isShareMenuOpen && selectedLocation && (
                    <div className="absolute right-0 top-full mt-2 bg-stone-950 border border-stone-800 rounded-xl shadow-2xl z-[150] min-w-[155px] overflow-hidden p-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(false)}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-stone-300 hover:bg-stone-800 hover:text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Compass className="h-3.5 w-3.5 text-amber-500" />
                        <span>지도만 공유하기</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(true)}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-stone-300 hover:bg-stone-800 hover:text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                        <span>선택한 위치 공유</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (zoom > 1.02) {
                      const minZ = getMinZoom();
                      setZoom(minZ);
                      setOffset({ x: 0, y: 0 });
                      setSelectedLocation(null);
                    } else {
                      setZoom(1.5);
                      setOffset({ x: 0, y: 0 });
                    }
                  }}
                  className="h-8 w-8 rounded-xl bg-stone-900/90 border border-stone-850 flex items-center justify-center hover:bg-stone-800 text-stone-200 active:scale-95 shadow-md transition-all cursor-pointer"
                  title={zoom > 1.02 ? "전체보기" : "상세보기"}
                >
                  {zoom > 1.02 ? (
                    <Minimize2 className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-amber-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseAttempt}
                  className="h-8 w-8 rounded-full bg-rose-600 border border-rose-500 flex items-center justify-center hover:bg-rose-500 text-white active:scale-95 shadow-lg transition-all cursor-pointer ml-1"
                  title="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Dev Mode Control Panel */}
            {devMode && (
              <div className="absolute bottom-4 left-4 z-25 bg-stone-900/95 border border-stone-800/85 p-3.5 rounded-2xl shadow-2xl w-60 flex flex-col gap-3 backdrop-blur-md pointer-events-auto animate-fadeIn">
                <div className="flex items-center justify-between text-[11px] font-black text-amber-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span>시뮬레이션 설정</span>
                  </div>
                </div>

                {/* Hide All Toggle Option */}
                <div className="bg-stone-950/40 rounded-xl p-2.5 border border-stone-800/80 flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-stone-300 flex items-center gap-1.5">
                    <EyeOff className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    기존 좌표 모두 숨기기
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHideAllOriginalPins(!hideAllOriginalPins);
                    }}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      hideAllOriginalPins ? 'bg-amber-400' : 'bg-stone-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        hideAllOriginalPins ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 pt-1.5 border-t border-stone-800/80">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportLocationsToClipboard();
                    }}
                    className="w-full py-2 text-[10.5px] font-black bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    {isLocationsCopied ? <Check className="h-3.5 w-3.5 text-white shrink-0" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
                    <span>{isLocationsCopied ? '복사 완료!' : '전체 위치 내보내기'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetSimulation();
                    }}
                    className="w-full py-1.5 text-[10px] font-black bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer border border-stone-750"
                  >
                    <RefreshCcw className="h-3 w-3 text-rose-400" />
                    <span>시뮬레이션 초기화</span>
                  </button>
                </div>
              </div>
            )}

            {/* Map Interaction Stage */}
            <div 
              ref={mapContainerRef}
              className={`w-full h-full relative ${devMode ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ 
                touchAction: 'none',
                backgroundColor: MAP_CONFIGS[currentMapId as keyof typeof MAP_CONFIGS]?.bgColor || '#0f172a'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDoubleClick={handleDoubleClick}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={handleMapClick}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Guidance bubble overlay at the top of the map view */}
              {isCustomRouteMode && activeRouteId && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-stone-900/95 text-stone-200 px-4 py-2 rounded-full shadow-xl border border-stone-800 flex items-center gap-2 text-xs font-black pointer-events-auto">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>새로운 경로를 선택하여 연결 후 저장하세요</span>
                </div>
              )}
              <div
                className={`absolute origin-center ${isDragging ? '' : 'transition-transform duration-100 ease-out'}`}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformStyle: 'preserve-3d',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  textRendering: 'optimizeLegibility',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div className="relative w-full aspect-square pointer-events-none select-none">
                  <img
                    ref={mapImageRef}
                    src={MAP_CONFIGS[currentMapId as keyof typeof MAP_CONFIGS]?.image || '/images/heartopia_map.webp'}
                    alt={`${MAP_CONFIGS[currentMapId as keyof typeof MAP_CONFIGS]?.name || 'World'} Map`}
                    className="w-full h-full object-cover rounded-2xl"
                    style={{ imageRendering: 'auto' }}
                    onLoad={() => setIsMapLoading(false)}
                    onDragStart={(e) => e.preventDefault()}
                  />

                  {/* Detailed Map Markers (Visible based on zoom, level status, or developer mode) */}
                  <div className="absolute inset-0 z-10 pointer-events-auto">
                    {/* SVG Routes Overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 1 }}>
                      {offsetPaths.map(route => {
                        if (route.type === 'custom') {
                          return (
                            <g key={`custom-route-group-${route.id}`}>
                              {route.segments.map((seg, idx) => (
                                <line
                                  key={`custom-seg-${route.id}-${idx}`}
                                  x1={seg.p1.x} y1={seg.p1.y}
                                  x2={seg.p2.x} y2={seg.p2.y}
                                  stroke={route.color}
                                  strokeWidth={route.isHighlighted ? "0.8" : "0.5"}
                                  strokeLinecap="round"
                                  className="transition-all duration-300"
                                  style={{ 
                                    filter: route.isHighlighted 
                                      ? `drop-shadow(0 0 2px ${route.color}) drop-shadow(0 0 1px rgba(0,0,0,0.9))` 
                                      : 'drop-shadow(0 0 0.8px rgba(0,0,0,0.8))',
                                    opacity: (selectedCustomRouteId && !route.isSelected && !isCustomRouteMode) ? 0.4 : 1
                                  }}
                                />
                              ))}
                            </g>
                          );
                        } else {
                          // Group routes
                          const isDimmedByShare = isSharedLinkView;
                          // @ts-ignore
                          const isDimmed = isDimmedByShare || route.isDimmedByCustomMode;
                          return (
                            <g key={`group-route-group-${route.id}`} className={`transition-all duration-500 ${isDimmed ? 'opacity-30 saturate-50' : 'opacity-100'}`}>
                              {route.segments.map((seg, idx) => (
                                <line
                                  key={`group-seg-${route.id}-${idx}`}
                                  x1={seg.p1.x} y1={seg.p1.y}
                                  x2={seg.p2.x} y2={seg.p2.y}
                                  stroke={route.color}
                                  strokeWidth="0.5"
                                  strokeDasharray="1.2,1.2"
                                  strokeLinecap="round"
                                />
                              ))}
                            </g>
                          );
                        }
                      })}

                      {/* Sequence Numbers for Selected Custom Route */}
                      {(customRoutes[currentMapId] || []).map(route => {
                        if (route.id !== selectedCustomRouteId || route.visible === false) return null;
                        const visibleRouteKeys = route.keys.filter(k => !hiddenLocationKeys.has(k));
                        
                        return (
                          <g key={`route-numbers-${route.id}`}>
                            {visibleRouteKeys.map((key, index) => {
                              const loc = locations[key];
                              if (!loc) return null;
                              return (
                                <g key={`route-point-${route.id}-${key}`}>
                                  <circle 
                                    cx={loc.x} 
                                    cy={loc.y} 
                                    r="0.5" 
                                    fill={route.color} 
                                    stroke="white" 
                                    strokeWidth="0.1"
                                  />
                                  <text 
                                    x={loc.x} 
                                    y={loc.y} 
                                    dy="0.18"
                                    textAnchor="middle" 
                                    fontSize="0.4" 
                                    fontWeight="bold"
                                    fill="white"
                                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                                  >
                                    {index + 1}
                                  </text>
                                </g>
                              );
                            })}
                          </g>
                        );
                      })}
                    </svg>

                    {memoizedMarkers}
                  </div>

                  {/* Dev Mode Click Indicator & New Pin Adding Popover */}
                  {devMode && clickedCoords && (
                    <div
                      className="absolute z-50 pointer-events-auto"
                      style={{ 
                        left: `${clickedCoords.x}%`, 
                        top: `${clickedCoords.y}%`, 
                        transform: `translate(-50%, -100%) scale(${1 / zoom})`,
                        transformOrigin: 'bottom center',
                        marginBottom: '12px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative bg-stone-900 border-2 border-amber-400 p-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] w-64 flex flex-col gap-3 text-left">
                        {/* Little pointing arrow */}
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-stone-900 border-r-2 border-b-2 border-amber-400 rotate-45 z-[-1]" />
                        
                        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                          <span className="text-[12px] font-black text-amber-400 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 fill-current text-amber-400" />
                            새로운 좌표 생성
                          </span>
                          <span className="text-[10px] font-mono text-stone-500">
                            X:{clickedCoords.x}% Y:{clickedCoords.y}%
                          </span>
                        </div>

                        {/* Pin Name input */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10.5px] font-bold text-stone-300">핀 이름</label>
                          <input
                            type="text"
                            placeholder="예: 채집장소, 상인"
                            value={newPinName}
                            onChange={(e) => setNewPinName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddNewPin();
                              }
                            }}
                            className="bg-stone-950 border border-stone-800 focus:border-amber-400 outline-none text-xs text-white px-2.5 py-1.5 rounded-lg transition-all"
                            autoFocus
                          />
                        </div>

                        {/* Group Selection */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10.5px] font-bold text-stone-300 flex items-center justify-between">
                            <span>동선 그룹 선택</span>
                            <button
                              type="button"
                              onClick={() => setIsAddingNewGroupInline(!isAddingNewGroupInline)}
                              className="text-[10px] text-amber-400 hover:underline font-black cursor-pointer"
                            >
                              {isAddingNewGroupInline ? '선택으로 복귀' : '+ 새 그룹'}
                            </button>
                          </label>

                          {isAddingNewGroupInline ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="새 그룹 이름..."
                                value={inlineGroupName}
                                onChange={(e) => setInlineGroupName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && inlineGroupName.trim()) {
                                    const trimmed = inlineGroupName.trim();
                                    if (!simGroups.includes(trimmed)) {
                                      setSimGroups([...simGroups, trimmed]);
                                      setSelectedSimGroup(trimmed);
                                    }
                                    setInlineGroupName('');
                                    setIsAddingNewGroupInline(false);
                                  }
                                }}
                                className="flex-1 bg-stone-950 border border-stone-800 focus:border-amber-400 outline-none text-[11px] text-white px-2 py-1 rounded"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (inlineGroupName.trim()) {
                                    const trimmed = inlineGroupName.trim();
                                    if (!simGroups.includes(trimmed)) {
                                      setSimGroups([...simGroups, trimmed]);
                                      setSelectedSimGroup(trimmed);
                                    }
                                    setInlineGroupName('');
                                    setIsAddingNewGroupInline(false);
                                  }
                                }}
                                className="bg-amber-400 hover:bg-amber-300 text-stone-950 text-[10px] font-black px-2 py-1 rounded cursor-pointer"
                              >
                                추가
                              </button>
                            </div>
                          ) : (
                            <select
                              value={selectedSimGroup}
                              onChange={(e) => setSelectedSimGroup(e.target.value)}
                              className="bg-stone-950 border border-stone-800 focus:border-amber-400 outline-none text-xs text-white px-2 py-1.5 rounded-lg cursor-pointer transition-all"
                            >
                              <option value="">(그룹 없음 / 동선 미표시)</option>
                              {simGroups.map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => setClickedCoords(null)}
                            className="flex-1 py-1.5 text-xs text-stone-400 hover:text-white bg-stone-850 hover:bg-stone-800 rounded-lg transition-all font-bold cursor-pointer"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={handleAddNewPin}
                            disabled={!newPinName.trim()}
                            className="flex-1 py-1.5 text-xs font-black bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:pointer-events-none text-stone-950 rounded-lg transition-all shadow-md cursor-pointer"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Floating Vertical Zoom Controls (Bottom Right) */}
              <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  className="h-11 w-11 lg:h-12 lg:w-12 rounded-full bg-stone-900/90 border border-stone-800 flex items-center justify-center hover:bg-stone-800 text-stone-200 active:scale-95 shadow-xl transition-all cursor-pointer backdrop-blur-md"
                  title="확대"
                >
                  <ZoomIn className="h-5 w-5 text-amber-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  className="h-11 w-11 lg:h-12 lg:w-12 rounded-full bg-stone-900/90 border border-stone-800 flex items-center justify-center hover:bg-stone-800 text-stone-200 active:scale-95 shadow-xl transition-all cursor-pointer backdrop-blur-md"
                  title="축소"
                >
                  <ZoomOut className="h-5 w-5 text-amber-400" />
                </button>
              </div>

            </div>

          </div>

          {/* Right Information Tooltip Panel */}
          <div className="w-full lg:w-[350px] bg-stone-900 border-t lg:border-t-0 lg:border-l border-stone-800 flex flex-col h-3/5 lg:h-full overflow-hidden shrink-0">
            {selectedLocation && !devMode && currentMapId === 'town' ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header of selected location */}
                <div className="p-3 border-b border-stone-800 bg-stone-900/60 flex flex-col shrink-0 gap-2">
                  {devMode ? (
                    (() => {
                      const selKey = Object.keys(locations).find(
                        k => locations[k].name === selectedLocation.name && 
                             (locations[k].level || 3) === (selectedLocation.level || 3)
                      );
                      if (!selKey) {
                        return (
                          <div className="min-w-0 pl-1">
                            <h3 className="text-xs sm:text-sm font-black text-white leading-none truncate">{selectedLocation.name}</h3>
                          </div>
                        );
                      }
                      
                      const currentLocVal = locations[selKey];
                      
                      return (
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-500">임시 정보 수정</span>
                            <span className="font-mono text-[9px] text-stone-500">({currentLocVal.x}%, {currentLocVal.y}%)</span>
                          </div>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={currentLocVal.name}
                              onChange={(e) => handleRenameLocation(selKey, e.target.value)}
                              className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-100 outline-none focus:border-amber-500/50"
                              placeholder="핀 이름 수정"
                            />
                            <button
                              onClick={() => handleDeleteLocation(selKey)}
                              className="px-2.5 py-1 text-xs font-black bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all cursor-pointer"
                              title="삭제"
                            >
                              삭제
                            </button>
                          </div>
                          
                          {/* Route Group Assignment within Simulation Mode */}
                          <div className="space-y-1 pt-1.5 border-t border-stone-850">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-stone-400">시뮬레이션 그룹 지정</span>
                              {currentLocVal.routeGroup && (
                                <button
                                  onClick={() => {
                                    setLocations(prev => ({
                                      ...prev,
                                      [selKey]: { ...prev[selKey], routeGroup: undefined, showRoute: false }
                                    }));
                                  }}
                                  className="text-[9px] font-black text-rose-400 hover:underline"
                                >
                                  그룹 해제
                                </button>
                              )}
                            </div>
                            <div className="flex gap-1.5 items-center">
                              <select
                                value={currentLocVal.routeGroup || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLocations(prev => ({
                                    ...prev,
                                    [selKey]: { ...prev[selKey], routeGroup: val || undefined, showRoute: val ? true : false }
                                  }));
                                }}
                                className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-[11px] text-stone-300 outline-none cursor-pointer"
                              >
                                <option value="">-- 지정 안 함 --</option>
                                {simGroups.map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="min-w-0 pl-1">
                        <h3 className="text-xs sm:text-sm font-black text-white leading-none truncate">{selectedLocation.name}</h3>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabs inside Information Tooltip */}
                {selectedItemName && (
                  <div className="flex border-b border-stone-800 bg-stone-900/40 p-1 shrink-0">
                    <button
                      onClick={() => setActiveTooltipTab('selected')}
                      className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        activeTooltipTab === 'selected'
                          ? 'bg-stone-800 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      도감 정보
                    </button>
                    <button
                      onClick={() => setActiveTooltipTab('all')}
                      className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        activeTooltipTab === 'all'
                          ? 'bg-stone-800 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      전체 목록 ({creaturesInSelectedLocation.length})
                    </button>
                  </div>
                )}

                {/* Tooltip Contents */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {activeTooltipTab === 'selected' && selectedItemObject ? (
                    /* Selected Book Card Info */
                    <div className="space-y-3.5 animate-fadeIn">
                      <div className="bg-stone-950/40 border border-stone-800/60 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300 shrink-0 overflow-hidden">
                          {getExistingImagePath(selectedItemObject.dbType, selectedItemObject.name, selectedItemObject) ? (
                            <img loading="lazy" 
                              src={getExistingImagePath(selectedItemObject.dbType, selectedItemObject.name, selectedItemObject)!} 
                              alt={selectedItemObject.name} 
                              className="h-full w-full object-contain p-0.5"
                              style={{ imageRendering: 'pixelated' }}
                              referrerPolicy="no-referrer"
                            />
                          ) : selectedItemObject.dbType === 'birds' ? (
                            <BirdIcon className="h-6 w-6 text-indigo-400" />
                          ) : selectedItemObject.dbType === 'insects' ? (
                            <Bug className="h-6 w-6 text-amber-500" />
                          ) : (
                            <FishIcon className="h-6 w-6 text-sky-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
                            Lv.{selectedItemObject.level} | {selectedItemObject.dbType === 'birds' ? '새' : selectedItemObject.dbType === 'insects' ? '곤충' : '물고기'}
                          </span>
                          <h4 className="text-sm font-black text-white truncate leading-tight mt-0.5">{selectedItemObject.name}</h4>
                        </div>
                      </div>

                      {/* Conditions list */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-extrabold text-stone-400">도감 출현 조건</div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-stone-850/60 p-2.5 rounded-xl border border-stone-800">
                            <span className="text-[9px] font-bold text-stone-400 block mb-0.5">날씨 조건</span>
                            <span className="text-[11px] font-black text-stone-200">
                              {formatWeatherValue(selectedItemObject.weather)}
                            </span>
                          </div>

                          <div className="bg-stone-850/60 p-2.5 rounded-xl border border-stone-800">
                            <span className="text-[9px] font-bold text-stone-400 block mb-0.5">출현 시간</span>
                            <span className="text-[11px] font-black text-stone-200 leading-tight">
                              {formatTimeValue(selectedItemObject.timeSlots)}
                            </span>
                          </div>

                          <div className="bg-stone-850/60 p-2.5 rounded-xl border border-stone-800 col-span-2">
                            <span className="text-[9px] font-bold text-stone-400 block mb-0.5 flex items-center gap-1">
                              <Locate className="h-3 w-3 text-amber-500" />
                              <span>출현 장소</span>
                            </span>
                            <span className="text-[11px] font-black text-stone-200 leading-normal">
                              {selectedItemObject.locations && selectedItemObject.locations.length > 0 
                                ? selectedItemObject.locations.join(', ') 
                                : '정보 없음'}
                            </span>
                          </div>
                        </div>

                        {selectedItemObject.fiveStarCondition && (
                          <div className="bg-amber-950/10 border border-amber-900/30 p-3 rounded-xl space-y-1.5">
                            <div className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                              <span>★ 5성 조건: {selectedItemObject.fiveStarCondition.action}</span>
                            </div>
                            <div className="text-[10px] font-bold text-stone-300 leading-normal flex flex-wrap gap-x-2">
                              <span>날씨: {formatWeatherValue(selectedItemObject.fiveStarCondition.weather)}</span>
                              <span className="text-stone-700">|</span>
                              <span>시간: {formatTimeValue(selectedItemObject.fiveStarCondition.timeSlots)}</span>
                            </div>
                          </div>
                        )}
                        
                        <PriceTable item={selectedItemObject} type={selectedItemObject.dbType} variant="compact" forceDark={true} />
                      </div>

                      {/* Link to show same area list */}
                      <button
                        onClick={() => setActiveTooltipTab('all')}
                        className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 font-black text-xs text-stone-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                      >
                        <span>같은 장소에 출현하는 다른 도감 보기</span>
                      </button>
                    </div>
                  ) : (
                    /* All creatures in this location */
                    <div className="space-y-3.5 animate-fadeIn">
                      {/* Creature Tab Selector */}
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex border border-stone-800/80 bg-stone-950/45 p-1 rounded-xl gap-1 flex-1">
                          {(['all', 'birds', 'insects', 'fishing', 'other'] as const)
                            .filter(tab => tabCounts[tab] > 0)
                            .map((tab) => {
                              const label = tab === 'all' ? '전체' : tab === 'birds' ? '새' : tab === 'insects' ? '곤충' : tab === 'fishing' ? '낚시' : '기타';
                              const count = tabCounts[tab];
                              const isActive = selectedCreatureTab === tab;
                              return (
                                <button
                                  key={tab}
                                  onClick={() => setSelectedCreatureTab(tab)}
                                  className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                    isActive
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/35 font-black shadow-xs'
                                      : 'text-stone-450 hover:text-stone-200 hover:bg-stone-850/50 border border-transparent'
                                  }`}
                                >
                                  <span>{label}</span>
                                  <span className={`text-[8.5px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-amber-400 text-stone-950 font-black' : 'bg-stone-800 text-stone-400'}`}>{count}</span>
                                </button>
                              );
                            })}
                        </div>
                        <div className="relative" ref={filterRef}>
                          <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={cn(
                              "h-[40px] w-[40px] rounded-xl flex items-center justify-center transition-all border shadow-sm",
                              (collectionFilter !== 'all' || starFilter !== 'all' || masterFilter !== 'all')
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-stone-800 border-stone-750 text-stone-400"
                            )}
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </button>
                          {isFilterOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-stone-900 rounded-2xl border border-stone-800 shadow-xl z-50 p-4 space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-black text-stone-400 uppercase">
                                  <Check className="h-3.5 w-3.5" /> 수집 현황
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  {['all', 'collected', 'uncollected'].map(opt => (
                                    <button key={opt} onClick={() => setCollectionFilter(opt as any)} className={cn("px-2 py-1.5 text-xs rounded-xl transition-all font-semibold cursor-pointer", collectionFilter === opt ? "bg-emerald-600 text-white shadow-xs" : "bg-stone-800 hover:bg-stone-700 text-stone-300")}>
                                      {opt === 'all' ? '전체' : opt === 'collected' ? '완료' : '미수집'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-black text-stone-400 uppercase">
                                  <Star className="h-3.5 w-3.5" /> 5성 현황
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  {['all', 'done', 'todo'].map(opt => (
                                    <button key={opt} onClick={() => setStarFilter(opt as any)} className={cn("px-2 py-1.5 text-xs rounded-xl transition-all font-semibold cursor-pointer", starFilter === opt ? "bg-emerald-600 text-white shadow-xs" : "bg-stone-800 hover:bg-stone-700 text-stone-300")}>
                                      {opt === 'all' ? '전체' : opt === 'done' ? '완료' : '미완료'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-black text-stone-400 uppercase">
                                  <Medal className="h-3.5 w-3.5" /> 명인 현황
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  {['all', 'done', 'todo'].map(opt => (
                                    <button key={opt} onClick={() => setMasterFilter(opt as any)} className={cn("px-2 py-1.5 text-xs rounded-xl transition-all font-semibold cursor-pointer", masterFilter === opt ? "bg-emerald-600 text-white shadow-xs" : "bg-stone-800 hover:bg-stone-700 text-stone-300")}>
                                      {opt === 'all' ? '전체' : opt === 'done' ? '완료' : '미완료'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Filter Only Location Button */}
                      {(onlyThisRegion || hasCommonCreaturesInActiveTab) && (
                        <button
                          onClick={handleFilterLocationOnly}
                          className={cn(
                            "w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mb-2 border",
                            onlyThisRegion
                              ? "bg-blue-600 hover:bg-blue-500 text-white border-blue-400/60 shadow-md ring-2 ring-blue-500/40"
                              : "bg-stone-800 hover:bg-stone-750 text-stone-300 border-stone-700/80"
                          )}
                        >
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0 transition-all",
                              onlyThisRegion
                                ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                                : "bg-stone-600 opacity-60"
                            )}
                          />
                          <span>{`이 지역의 ${selectedCreatureTab === 'all' ? '도감' : selectedCreatureTab === 'birds' ? '새' : selectedCreatureTab === 'insects' ? '곤충' : selectedCreatureTab === 'fishing' ? '낚시' : '도감'}만 보기`}</span>
                        </button>
                      )}

                      <div className="text-[11.5px] lg:text-[13px] font-extrabold text-stone-400">
                        <span>
                          이 장소에서 출현하는{' '}
                          {selectedCreatureTab === 'all'
                            ? '친구들'
                            : selectedCreatureTab === 'birds'
                            ? '새'
                            : selectedCreatureTab === 'insects'
                            ? '곤충'
                            : selectedCreatureTab === 'fishing'
                            ? '물고기'
                            : '기타'}{' '}
                          ({filteredCreaturesByTab.length}종)
                        </span>
                      </div>

                      {filteredCreaturesByTab.length > 0 ? (
                        <div className="space-y-2">
                          {filteredCreaturesByTab.map((creature) => {
                            const isCollected = completedIds.has(creature.id);
                            return (
                              <div 
                                key={`loc-creature-${creature.id}`}
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                  creature.name === selectedItemName
                                    ? 'bg-amber-500/10 border-amber-500/30 text-white'
                                    : 'bg-stone-850/40 border-stone-800/80 hover:border-stone-700 text-stone-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-9 w-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0 overflow-hidden">
                                    {getExistingImagePath(creature.dbType, creature.name, creature) ? (
                                      <img loading="lazy" 
                                        src={getExistingImagePath(creature.dbType, creature.name, creature)!} 
                                        alt={creature.name} 
                                        className="h-full w-full object-contain p-0.5"
                                        style={{ imageRendering: 'pixelated' }}
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : creature.dbType === 'birds' ? (
                                      <BirdIcon className="h-4 w-4 text-indigo-400" />
                                    ) : creature.dbType === 'insects' ? (
                                      <Bug className="h-4 w-4 text-amber-500" />
                                    ) : (
                                      <FishIcon className="h-4 w-4 text-sky-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-nowrap mb-0.5">
                                      <span className="text-[9.5px] lg:text-[11px] font-bold text-stone-400">Lv.{creature.level}</span>
                                      <span className="text-[12px] lg:text-[13.5px] font-black truncate leading-none">{creature.name}</span>
                                    </div>
                                    <span className="text-[9.5px] lg:text-[11px] font-bold text-stone-400 block truncate">
                                      {formatWeatherValue(creature.weather)} | {formatTimeValue(creature.timeSlots)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {onToggleCompletion && (
                                    <button
                                      onClick={() => onToggleCompletion(creature.id)}
                                      className={`h-6.5 px-2 rounded-md text-[9.5px] lg:text-[11px] font-black transition-all cursor-pointer ${
                                        isCollected
                                          ? 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-400'
                                          : 'bg-stone-800 border border-stone-750 text-stone-400 hover:text-stone-200'
                                      }`}
                                    >
                                      {isCollected ? '수집완료' : '미수집'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedItemName(creature.name);
                                      setActiveTooltipTab('selected');
                                    }}
                                    className="h-6.5 px-2 rounded-md bg-stone-800 hover:bg-stone-750 border border-stone-700 text-[9.5px] lg:text-[11px] font-bold text-stone-300 hover:text-white cursor-pointer"
                                  >
                                    정보
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-[11px] text-stone-500">이 탭에 해당하는 출현 정보가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* No selected location screen (Guide Panel or Section List) */
              <div className="flex flex-col h-full overflow-hidden bg-stone-900 animate-fadeIn">
                <div className="p-4 border-b border-stone-800 bg-stone-900/60 flex items-center justify-between shrink-0">
                  <span className="text-xs font-black text-stone-400">구역 정보</span>
                  <div className="flex items-center gap-1">
                  </div>
                </div>
                {(() => {
                  const currentEntries = (Object.entries(locations) as [string, MapLocation][]).filter(([key, loc]) => (loc.mapId || 'town') === currentMapId);
                  const hasSections = currentMapId !== 'town';
                  
                  return (
                    <>
                      {(() => {
                        if (hasSections) {
                          const groupedItems = currentEntries.reduce((acc, [key, loc]) => {
                            if (loc.section === '지명') return acc;
                            const section = loc.section || (currentMapId === 'town' ? '마을 구역' : '기타');
                            const groupName = loc.routeGroup || loc.displayName || loc.name;
                            if (!acc[section]) acc[section] = {};
                            if (!acc[section][groupName]) acc[section][groupName] = [];
                            acc[section][groupName].push({ key, loc });
                            return acc;
                          }, {} as Record<string, Record<string, { key: string; loc: MapLocation }[]>>);

                          return (
                            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                              {/* Custom Routes Panel */}
                              {currentMapId === "whaleCanyon" && (
                                <div className="bg-stone-950/45 border border-stone-800/85 rounded-xl p-3 mb-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    {isCustomRouteMode ? (
                                      <div className="flex items-center gap-1.5 py-1">
                                        <span className="text-[11px] font-black text-amber-500 uppercase tracking-wider">경로 편집 중</span>
                                      </div>
                                    ) : (
                                      <>
                                        <div 
                                          onClick={() => setIsCustomRoutesCollapsed(!isCustomRoutesCollapsed)}
                                          className="flex items-center gap-1.5 cursor-pointer select-none py-1 group flex-1"
                                        >
                                          <span className="text-[11px] font-black text-amber-500 uppercase tracking-wider group-hover:text-amber-400 transition-colors">나만의 커스텀 경로</span>
                                          <span className="text-[9.5px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded-full font-bold group-hover:bg-stone-750 transition-colors">
                                            {(customRoutes[currentMapId] || []).length}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            onClick={handleAddNewRoute}
                                            className="text-[9.5px] px-2 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                                          >
                                            <Plus className="h-3 w-3" /> 새 경로 추가
                                          </button>
                                          <button
                                            onClick={() => setIsCustomRoutesCollapsed(!isCustomRoutesCollapsed)}
                                            className="p-1 rounded bg-stone-900 border border-stone-850 hover:bg-stone-800 hover:border-stone-700 transition-all cursor-pointer flex items-center justify-center"
                                            title={isCustomRoutesCollapsed ? "펼치기" : "접기"}
                                          >
                                            {isCustomRoutesCollapsed ? (
                                              <ChevronDown className="h-3.5 w-3.5 text-stone-400 hover:text-amber-500" />
                                            ) : (
                                              <ChevronUp className="h-3.5 w-3.5 text-amber-500" />
                                            )}
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {!isCustomRoutesCollapsed && (
                                    <div className="h-[180px] flex flex-col justify-start">
                                      {(customRoutes[currentMapId] || []).length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-3 bg-stone-950/25 rounded-lg border border-dashed border-stone-850">
                                          <p className="text-[10px] text-stone-500">생성된 커스텀 경로가 없습니다.</p>
                                          <p className="text-[9px] text-stone-600 mt-0.5">새 경로 추가 버튼을 눌러 나만의 동선을 만들어보세요!</p>
                                        </div>
                                      ) : (
                                        <div className="h-full space-y-2 overflow-y-auto pr-1 scrollbar-thin transition-all duration-300">
                                          {(customRoutes[currentMapId] || []).map((route) => {
                                            const isEditing = isCustomRouteMode && activeRouteId === route.id;
                                            const pointCount = route.keys.length;
                                            
                                            return (
                                              <div 
                                                key={route.id} 
                                                id={`route-item-${route.id}`}
                                                onClick={(e) => {
                                                  if (isCustomRouteMode) return;
                                                  if ((e.target as HTMLElement).closest('button, input, [data-color-picker-trigger]')) return;
                                                  setSelectedCustomRouteId(prev => prev === route.id ? null : route.id);
                                                }}
                                                className={`flex flex-col p-2 rounded-lg border transition-all ${
                                                  isEditing || selectedCustomRouteId === route.id
                                                    ? 'bg-amber-950/10 border-amber-500/30 cursor-pointer' 
                                                    : 'bg-stone-950/30 border-stone-850 hover:border-stone-800 cursor-pointer'
                                                }`}
                                              >
                                                {/* Route Header Row */}
                                                <div className="flex items-center justify-between gap-2">
                                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {/* Color Circle and Picker Dropdown Trigger */}
                                                    <div className="relative shrink-0" data-color-picker-trigger={route.id}>
                                                      <button 
                                                        onClick={() => (!isCustomRouteMode || isEditing) && handleToggleColorPicker(route.id)}
                                                        disabled={isCustomRouteMode && !isEditing}
                                                        className={`w-3.5 h-3.5 rounded-full border border-stone-700 flex items-center justify-center shadow-sm transition-transform ${
                                                          isCustomRouteMode && !isEditing
                                                            ? 'cursor-not-allowed opacity-50' 
                                                            : 'cursor-pointer hover:scale-110'
                                                        }`}
                                                        style={{ backgroundColor: route.color }}
                                                        title={isCustomRouteMode && !isEditing ? "" : "색상 변경"}
                                                      />
                                                    </div>
                                                    
                                                    {/* Route Name (Editable) */}
                                                    {editingRouteNameId === route.id ? (
                                                      <input
                                                        type="text"
                                                        defaultValue={route.name}
                                                        autoFocus
                                                        onBlur={(e) => handleSaveRouteName(route.id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                          if (e.key === 'Enter') handleSaveRouteName(route.id, e.currentTarget.value);
                                                        }}
                                                        className="bg-stone-800 border border-stone-600 text-stone-200 text-[11px] px-1.5 py-0.5 rounded focus:outline-none focus:border-amber-500 w-full"
                                                      />
                                                    ) : (
                                                      <div className="flex items-center gap-1 min-w-0 flex-1">
                                                        <span 
                                                          onClick={() => (!isCustomRouteMode || isEditing) && setEditingRouteNameId(route.id)}
                                                          className={`text-[11px] font-bold truncate ${
                                                            isCustomRouteMode && !isEditing
                                                              ? 'text-stone-500 cursor-not-allowed' 
                                                              : 'text-stone-300 cursor-pointer hover:text-amber-400'
                                                          }`}
                                                          title={isCustomRouteMode && !isEditing ? "" : "클릭하여 이름 변경"}
                                                        >
                                                          {route.name}
                                                        </span>
                                                        {(!isCustomRouteMode || isEditing) && (
                                                          <Edit3 
                                                            onClick={() => setEditingRouteNameId(route.id)}
                                                            className="h-2.5 w-2.5 text-stone-500 hover:text-amber-500 cursor-pointer shrink-0" 
                                                            title="이름 변경"
                                                          />
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
 
                                                  {/* Controls (Visibility, Edit, Delete, Save, Cancel) */}
                                                  <div className="flex items-center gap-1 shrink-0">
                                                    {/* Visibility Toggle (only when not editing) */}
                                                    {!isEditing && (
                                                      <button
                                                        onClick={() => handleToggleRouteVisibility(route.id)}
                                                        className={`p-1 rounded transition-colors hover:bg-stone-800 text-stone-500 hover:text-stone-300 cursor-pointer`}
                                                        title={route.visible !== false ? "숨기기" : "보이기"}
                                                      >
                                                        {route.visible !== false ? <Eye className="h-3 w-3 text-amber-500" /> : <EyeOff className="h-3 w-3" />}
                                                      </button>
                                                    )}
 
                                                    {isEditing ? (
                                                      <div className="flex items-center gap-1">
                                                        {/* Save Button */}
                                                        <button
                                                          onClick={() => {
                                                            if (pointCount > 0) {
                                                              handleToggleEditRoute(route.id);
                                                            }
                                                          }}
                                                          disabled={pointCount === 0}
                                                          className={`px-2 py-1 font-black text-[10px] rounded transition-colors ${
                                                            pointCount === 0 
                                                              ? 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-850 opacity-60' 
                                                              : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 cursor-pointer'
                                                          }`}
                                                          title={pointCount === 0 ? "최소 1개 이상의 연결이 필요합니다" : "저장"}
                                                        >
                                                          저장
                                                        </button>
                                                        {/* Cancel Button */}
                                                        <button
                                                          onClick={() => handleCancelEditRoute(route.id)}
                                                          className="px-2 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold text-[10px] rounded transition-colors cursor-pointer"
                                                          title="취소"
                                                        >
                                                          취소
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <>
                                                        {/* Edit Button */}
                                                        <button
                                                          onClick={() => !isCustomRouteMode && handleToggleEditRoute(route.id)}
                                                          disabled={isCustomRouteMode}
                                                          className={`p-1 rounded transition-colors ${
                                                            isCustomRouteMode 
                                                              ? 'text-stone-700 cursor-not-allowed opacity-50' 
                                                              : 'hover:bg-stone-800 text-stone-500 hover:text-stone-300 cursor-pointer'
                                                          }`}
                                                          title={isCustomRouteMode ? "" : "경로 편집"}
                                                        >
                                                          <Edit3 className="h-3 w-3" />
                                                        </button>
 
                                                        {/* Delete Button */}
                                                        <button
                                                          onClick={() => !isCustomRouteMode && handleDeleteRoute(route.id)}
                                                          disabled={isCustomRouteMode}
                                                          className={`p-1 rounded transition-colors ${
                                                            isCustomRouteMode 
                                                              ? 'text-stone-700 cursor-not-allowed opacity-50' 
                                                              : 'hover:bg-red-950/40 text-stone-600 hover:text-red-400 cursor-pointer'
                                                          }`}
                                                          title={isCustomRouteMode ? "" : "경로 삭제"}
                                                        >
                                                          <Trash2 className="h-3 w-3" />
                                                        </button>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
 
                                                {/* Inline Color Picker (Requirement 4 & 8) */}
                                                {colorPickerOpenId === route.id && (
                                                  <div 
                                                    data-color-picker-container={route.id}
                                                    className="mt-1.5 p-1.5 bg-stone-900 rounded border border-stone-800/85 flex flex-col gap-1.5"
                                                  >
                                                    <div className="grid grid-cols-8 gap-1 justify-items-center">
                                                      {PALETTE_COLORS.map(c => (
                                                        <button
                                                          key={c}
                                                          onClick={() => handleChangeRouteColor(route.id, c, true)}
                                                          className={`w-3.5 h-3.5 rounded-full border cursor-pointer hover:scale-110 transition-all ${route.color.toLowerCase() === c.toLowerCase() ? 'border-white scale-110 shadow-sm' : 'border-stone-800'}`}
                                                          style={{ backgroundColor: c }}
                                                          title="색상 선택"
                                                        />
                                                      ))}
                                                    </div>
                                                    
                                                    {/* Custom Color Editor Button spanning full width */}
                                                    <div className="relative">
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const inputEl = document.getElementById(`color-input-${route.id}`);
                                                          if (inputEl) inputEl.click();
                                                        }}
                                                        className="w-full py-1 px-2 rounded bg-stone-850 hover:bg-stone-800 border border-stone-700 text-[9px] text-stone-300 transition-colors flex items-center justify-center gap-1 cursor-pointer font-bold animate-fadeIn"
                                                      >
                                                        <div 
                                                          className="w-2.5 h-2.5 rounded-full border border-stone-600 shrink-0" 
                                                          style={{ backgroundColor: route.color }}
                                                        />
                                                        색상 상세 편집
                                                      </button>
                                                      <input
                                                        id={`color-input-${route.id}`}
                                                        type="color"
                                                        value={route.color.startsWith('#') && route.color.length === 7 ? route.color : '#FFFFFF'}
                                                        onChange={(e) => handleChangeRouteColor(route.id, e.target.value, false)}
                                                        className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
                                                      />
                                                    </div>
                                                  </div>
                                                )}
 
                                                {/* Point Count */}
                                                <div className="flex items-center justify-between mt-1 pl-5">
                                                  <span className="text-[9px] text-stone-500 font-medium">
                                                    연결된 채집물: <strong className="text-stone-400">{pointCount}개</strong>
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {Object.entries(groupedItems).map(([sectionName, groups]) => (
                                <div key={sectionName} className="space-y-3">
                                  <h4 className="text-xs font-black text-amber-500 border-b border-stone-800 pb-1">{sectionName}</h4>
                                  <div className="space-y-1.5">
                                    {Object.entries(groups).map(([groupName, locs]) => {
                                      const firstLoc = locs[0].loc;
                                      const isExpanded = expandedGroups.has(groupName);
                                      
                                      const locKeys = locs.map(item => item.key);
                                      const hiddenCount = locKeys.filter(k => hiddenLocationKeys.has(k)).length;
                                      const isGroupHidden = hiddenCount === locs.length;
                                      
                                      const toggleGroupVisibility = (e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        const newHidden = new Set(hiddenLocationKeys);
                                        locKeys.forEach(k => {
                                          if (isGroupHidden) newHidden.delete(k);
                                          else newHidden.add(k);
                                        });
                                        setHiddenLocationKeys(newHidden);
                                      };

                                      const toggleGroupRouteVisibility = (e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        const newHiddenRoutes = new Set(hiddenGroupRoutes);
                                        if (newHiddenRoutes.has(groupName)) {
                                          newHiddenRoutes.delete(groupName);
                                        } else {
                                          newHiddenRoutes.add(groupName);
                                        }
                                        setHiddenGroupRoutes(newHiddenRoutes);
                                      };
                                      
                                      const toggleGroupExpand = (e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        const newExpanded = new Set(expandedGroups);
                                        if (isExpanded) newExpanded.delete(groupName);
                                        else newExpanded.add(groupName);
                                        setExpandedGroups(newExpanded);
                                      };

                                      return (
                                        <div key={groupName} className="flex flex-col space-y-1">
                                          {(() => {
                                            const isSelectedGroup = locs.length === 1 && selectedLocation && (
                                              selectedLocation.name === firstLoc.name && 
                                              (selectedLocation.level || 3) === (firstLoc.level || 3)
                                            );

                                            return (
                                              <div 
                                                id={`group-card-${groupName}`}
                                                onClick={(e) => {
                                                  if (locs.length > 1) {
                                                    toggleGroupExpand(e);
                                                  } else {
                                                    setSelectedLocation(firstLoc);
                                                    setSelectedLocationKey(locs[0].key);
                                                    setIsSharedLinkView(false);
                                                    setSelectedItemName('');
                                                    handleClearHighlight();
                                                    centerOnLocation(firstLoc, 2.2);
                                                  }
                                                }}
                                                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                                  isSelectedGroup 
                                                    ? 'bg-amber-400/10 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)]' 
                                                    : 'bg-stone-850/60 border-stone-800 hover:border-stone-750'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2.5">
                                                  {firstLoc.icon ? (
                                                    <div className={`h-8 w-8 rounded-md bg-stone-900 border border-stone-700 overflow-hidden shrink-0 transition-opacity ${isGroupHidden ? 'opacity-30' : 'opacity-100'}`}>
                                                      <img loading="lazy" src={firstLoc.icon} alt={groupName} className="w-full h-full object-contain p-0.5" />
                                                    </div>
                                                  ) : (
                                                    <div className={`h-8 w-8 rounded-md bg-stone-900 border border-stone-700 flex items-center justify-center shrink-0 transition-opacity ${isGroupHidden ? 'opacity-30' : 'opacity-100'}`}>
                                                      <MapPin className="h-4 w-4 text-stone-500" />
                                                    </div>
                                                  )}
                                                  <div className={`text-left transition-opacity ${isGroupHidden ? 'opacity-40' : 'opacity-100'}`}>
                                                    <div className={`text-xs font-bold ${isSelectedGroup ? 'text-amber-400' : 'text-stone-200'}`}>{groupName}</div>
                                                    {/* 안내 문구 노출 로직 */}
                                                    {(() => {
                                                      const trimmedName = groupName.trim();
                                                      // 돌고래 먹이통 안내 문구 (직접 매칭 및 포함 검사)
                                                      const guide = GROUP_GUIDES[trimmedName] || 
                                                                   (trimmedName === '돌고래 먹이통' ? '좋아하는 음식: 정어리,배스,전갱이' : null) ||
                                                                   (trimmedName.includes('먹이통') ? '좋아하는 음식: 정어리,배스,전갱이' : null);
                                                      
                                                      return guide ? (
                                                        <div className="text-[10px] text-stone-400 mt-1.5 leading-tight font-medium">
                                                          {guide}
                                                        </div>
                                                      ) : null;
                                                    })()}
                                                  </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                  {locs.some(l => l.loc.showRoute) && (
                                                    <button 
                                                      onClick={toggleGroupRouteVisibility}
                                                      disabled={isGroupHidden}
                                                      className={`p-1.5 rounded-md transition-colors ${
                                                        isGroupHidden 
                                                          ? 'text-stone-700 cursor-not-allowed opacity-50' 
                                                          : hiddenGroupRoutes.has(groupName) 
                                                            ? 'text-stone-600 hover:text-stone-500 hover:bg-stone-800 cursor-pointer' 
                                                            : 'text-amber-500 hover:text-amber-400 hover:bg-amber-400/10 cursor-pointer'
                                                      }`}
                                                      title={isGroupHidden ? "위치가 숨겨져 있어 경로를 표시할 수 없습니다" : (hiddenGroupRoutes.has(groupName) ? "경로 표시" : "경로 숨기기")}
                                                    >
                                                      <Route className={`h-4 w-4 ${(isGroupHidden || hiddenGroupRoutes.has(groupName)) ? 'opacity-40' : 'opacity-100'}`} />
                                                    </button>
                                                  )}
                                                  <button 
                                                    onClick={toggleGroupVisibility}
                                                    className="p-1.5 rounded-md hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                                                  >
                                                    {isGroupHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                  </button>
                                                  
                                                  {locs.length > 1 && (
                                                    <button 
                                                      onClick={toggleGroupExpand}
                                                      className="p-1.5 rounded-md hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                                                    >
                                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                          
                                          {/* Sub-items */}
                                          {isExpanded && locs.length > 1 && (
                                            <div className="pl-4 pr-1 py-1 space-y-1">
                                              {locs.map(({ key, loc }, idx) => {
                                                const isHidden = hiddenLocationKeys.has(key);
                                                const isSubItemSelected = selectedLocation && 
                                                  selectedLocation.name === loc.name && 
                                                  (selectedLocation.level || 3) === (loc.level || 3);
                                                
                                                const toggleVisibility = (e: React.MouseEvent) => {
                                                  e.stopPropagation();
                                                  const newHidden = new Set(hiddenLocationKeys);
                                                  if (isHidden) newHidden.delete(key);
                                                  else newHidden.add(key);
                                                  setHiddenLocationKeys(newHidden);
                                                };
                                                
                                                return (
                                                  <div 
                                                    key={key} 
                                                    id={`sub-item-${key}`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSelectedLocation(loc);
                                                      setSelectedLocationKey(key);
                                                      setSelectedItemName('');
                                                      handleClearHighlight();
                                                      setIsSharedLinkView(false);
                                                      centerOnLocation(loc, 2.2);
                                                    }}
                                                    className={`flex items-center justify-between p-2 rounded-lg transition-all border cursor-pointer ${
                                                      isSubItemSelected 
                                                        ? 'bg-amber-400/20 border-amber-400 text-white font-bold' 
                                                        : 'bg-stone-800/40 border-stone-800/50 hover:border-stone-700 hover:bg-stone-800/60'
                                                    }`}
                                                  >
                                                    <div className={`text-[10px] font-medium transition-opacity ${
                                                      isSubItemSelected
                                                        ? 'text-amber-400 font-extrabold'
                                                        : isHidden ? 'text-stone-500' : 'text-stone-300'
                                                    }`}>
                                                      {loc.name}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <button 
                                                        onClick={toggleVisibility}
                                                        className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                                                      >
                                                        {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                      </button>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                  return (
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="h-14 w-14 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 shadow-inner">
                        <Compass className="h-7 w-7 text-stone-400 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-white">구역을 선택해 주세요</h3>
                        <p className="text-[10px] text-stone-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                          지도에서 특정 장소의 마커를 클릭하시거나 도감 목록에서 <strong className="text-stone-350">장소명</strong>을 클릭하면 해당 위치의 상세 정보와 함께 출현하는 도감 목록이 이곳에 나타납니다.
                        </p>
                      </div>
                      <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-800/80 text-[10px] text-stone-400 max-w-[260px] text-left space-y-2">
                        <div className="font-bold text-stone-350 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>월드맵 이용 팁</span>
                        </div>
                        <ul className="list-disc pl-3.5 space-y-1 text-stone-500">
                          <li>지도 영역은 <strong className="text-stone-450">드래그</strong>하여 자유롭게 이동할 수 있습니다.</li>
                          <li>마우스 <strong className="text-stone-450">휠</strong>로 확대/축소할 수 있습니다.</li>
                          <li>지도 축척에 따라 <strong className="text-stone-450">구역명 노출 레벨</strong>이 자동으로 활성화됩니다.</li>
                        </ul>
                      </div>
                    </div>
                  );
                })()}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
       {showResetConfirm && (
        <div 
          key="interactive-map-reset-confirm" 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
        >
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-bold text-stone-200 mb-2">커스텀 경로 초기화</h3>
            <p className="text-sm text-stone-400 mb-6">
              커스텀 경로를 초기화하시겠습니까? 설정하신 나만의 경로가 삭제되고 기본 동선으로 되돌아갑니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 font-medium transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setCustomRoutes(prev => {
                    const updated = { ...prev, [currentMapId]: [] };
                    localStorage.setItem('pigTownCustomRoutes', JSON.stringify(updated));
                    return updated;
                  });
                  setActiveRouteId(null);
                  setIsCustomRouteMode(false);
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded bg-red-600/90 text-white hover:bg-red-500 font-medium transition-colors cursor-pointer"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
      {showCloseConfirm && (
        <div 
          key="interactive-map-close-confirm" 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
        >
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-bold text-stone-200 mb-2">경로 편집 종료</h3>
            <p className="text-sm text-stone-400 mb-6">
              경로를 편집 중입니다. 정말로 지도를 닫으시겠습니까?<br />
              확인을 누르면 편집 중인 내용이 저장되지 않고 취소됩니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 font-medium transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (activeRouteId) {
                    handleCancelEditRoute(activeRouteId);
                  }
                  setShowCloseConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      {showShareGuide && shareBtnRect && (
        <div className="fixed inset-0 z-[200] pointer-events-auto flex items-center justify-center font-sans">
          {/* Dimmed Background SVG with Spotlight cutout */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <mask id="share-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <circle
                  cx={shareBtnRect.left + shareBtnRect.width / 2}
                  cy={shareBtnRect.top + shareBtnRect.height / 2}
                  r={Math.max(shareBtnRect.width, shareBtnRect.height) / 2 + 10}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(12, 10, 9, 0.85)"
              mask="url(#share-spotlight-mask)"
            />
          </svg>

          {/* Indicator Pointer Line from Central Card to Spotlight */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {(() => {
              const startX = window.innerWidth / 2;
              const startY = window.innerHeight / 2 - 120; // top-ish of card
              const endX = shareBtnRect.left + shareBtnRect.width / 2;
              const endY = shareBtnRect.top + shareBtnRect.height / 2 + 25; // bottom of circle
              
              if (Math.abs(startY - endY) > 50) {
                return (
                  <g>
                    <path
                      d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${(startY + endY) / 2 - 40}, ${endX} ${endY}`}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                      className="animate-pulse"
                    />
                    <circle cx={endX} cy={endY} r="4" fill="#fbbf24" />
                  </g>
                );
              }
              return null;
            })()}
          </svg>

          {/* Central Guide Card */}
          <div className="relative z-10 bg-stone-900/95 border border-stone-800 text-stone-100 rounded-2xl p-4.5 max-w-[310px] w-[90%] mx-auto shadow-2xl flex flex-col gap-3 text-center animate-scaleIn">
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Share2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-black text-amber-400 tracking-tight mt-1">
                🗺️ 지도 공유 기능 안내
              </h3>
            </div>
            
            <div className="space-y-2.5 text-left">
              <p className="text-[11.5px] text-stone-300 leading-relaxed">
                지도 <span className="text-amber-400 font-extrabold">공유 버튼</span>이 추가되었습니다. 보고 계신 지도 화면이나 특정 위치를 친구들과 공유해보세요.
              </p>
              
              <div className="bg-stone-950/50 rounded-xl p-2.5 border border-stone-800 space-y-2">
                <div className="flex gap-2 items-start">
                  <div className="h-5 w-5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                    <Compass className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200 leading-none mb-1">지도만 공유하기</h4>
                    <p className="text-[11.5px] text-stone-400 leading-normal">
                      선택된 핀이 없을 때 공유 버튼을 누르면 전체 지도 주소가 복사됩니다.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 items-start pt-2 border-t border-stone-850">
                  <div className="h-5 w-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200 leading-none mb-1">현재 위치 공유하기</h4>
                    <p className="text-[11.5px] text-stone-400 leading-normal">
                      특정 핀을 선택한 상태에서 공유 버튼을 누르면 해당 핀의 상세 주소가 복사됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseGuide}
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-amber-500/10 cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // If active state changed, we must re-render to update visibility classes
  if (prevProps.isOpen !== nextProps.isOpen) return false;
  // If it is currently closed and stays closed, skip re-rendering entirely!
  if (!nextProps.isOpen) return true;
  // Otherwise, it is open, let it re-render to reflect new data
  return false;
});
