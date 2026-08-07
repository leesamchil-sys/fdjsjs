import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dog, 
  Cat, 
  Plus, 
  Trash2, 
  ThumbsUp, 
  ThumbsDown, 
  Search, 
  Soup, 
  Fish as FishIcon, 
  Sparkles,
  Check,
  ChevronDown,
  Edit2,
  X,
  Home,
  Bed,
  Siren,
  AlertTriangle
} from 'lucide-react';
import { FISHING } from '../data/fishing';
import { COOKING } from '../data/cooking';
import { SEASONAL_EVENTS, getSeasonBadgeStyle } from '../data/seasonal';
import { getExistingImagePath } from '../lib/appHelpers';
import { cn } from '../lib/utils';
import { Fish, Cooking, Pet } from '../types';
import { useBackDismiss } from '../hooks/useBackDismiss';
import versionData from '../version.json';

interface CustomFood {
  id: string;
  name: string;
  image: string;
  source: 'custom';
  ingredients?: string[];
  location?: string;
}

const normalizeName = (s: string) => s.replace(/\s+/g, '').toLowerCase();

const RAW_DOG_FOODS: CustomFood[] = [
  { id: 'raw-apple', name: '사과', image: '/images/cooking/사과.webp', source: 'custom', ingredients: ['-'], location: '7 - 12구역' },
  { id: 'raw-neutari', name: '느타리 버섯', image: '/images/cooking/느타리버섯.webp', source: 'custom', ingredients: ['-'], location: '온천산' },
  { id: 'raw-yangsongi', name: '양송이 버섯', image: '/images/cooking/양송이버섯.webp', source: 'custom', ingredients: ['-'], location: '꽃밭' },
  { id: 'raw-pyogo', name: '표고 버섯', image: '/images/cooking/표고버섯.webp', source: 'custom', ingredients: ['-'], location: '어촌' },
  { id: 'raw-geumul', name: '그물 버섯', image: '/images/cooking/그물버섯.webp', source: 'custom', ingredients: ['-'], location: '숲' },
];

const CUSTOM_DOG_FOODS: CustomFood[] = [
  { id: 'custom-dog-food', name: '강아지 전용 사료', image: '/images/cooking/강아지 사료.webp', source: 'custom' },
  { id: 'custom-common-food', name: '동물 공용 음식', image: '/images/cooking/동물 공용 음식.webp', source: 'custom' }
];

const CUSTOM_CAT_FOODS: CustomFood[] = [
  { id: 'custom-cat-food', name: '고양이 전용 사료', image: '/images/cooking/고양이 사료.webp', source: 'custom' },
  { id: 'custom-common-food', name: '동물 공용 음식', image: '/images/cooking/동물 공용 음식.webp', source: 'custom' }
];

const DOG_FOOD_TARGETS = [
  "강아지 전용 사료",
  "동물 공용 음식",
  "사과",
  "느타리 버섯",
  "양송이 버섯",
  "표고 버섯",
  "베지 샐러드",
  "믹스드 잼",
  "블루베리 잼",
  "사과 잼",
  "라즈베리 잼",
  "딸기 잼",
  "케첩",
  "구운 버섯",
  "구운 느타리버섯",
  "구운 표고버섯",
  "구운 양송이버섯",
  "버섯 파이",
  "느타리버섯 파이",
  "표고버섯 파이",
  "양송이버섯 파이",
  "미트소스 파스타",
  "씨푸드 덮밥",
  "컨트리 스튜",
  "콘수프",
  "미트버거",
  "미트소스 가지 그라탱",
  "럭셔리 씨푸드 플래터",
  "킹크랩찜",
  "황금 킹크랩찜",
  "바다 아스파라거스 새우 볶음밥",
  "미역 완자탕",
  "바다포도 표고버섯 달걀찜"
];

const CAT_FOOD_TARGETS = [
  "고양이 전용 사료",
  "동물 공용 음식",
  "민물배스",
  "하늘종개",
  "바벨",
  "큰얼룩배스",
  "미노우",
  "틸라피아",
  "왕새우",
  "민물잰더",
  "유럽잉어",
  "민물대구",
  "레드벨리 피라냐",
  "민물베도라치",
  "후첸",
  "첨 연어",
  "큰가시고기",
  "유럽처브",
  "텐치",
  "극지연어",
  "붕어",
  "유럽백조어",
  "백조어",
  "돌마자",
  "머드개복치",
  "바다빙어",
  "매화농어",
  "홍합",
  "올챙이",
  "유럽민물가재",
  "큰입배스",
  "민물게",
  "나비잉어",
  "송어",
  "루드",
  "사루기",
  "줄무늬송사리",
  "둑중개",
  "펄 고기",
  "북유럽파란가재",
  "금붕어",
  "강꼬치고기",
  "펌프킨시드",
  "유럽메기",
  "블루길",
  "북극곤들매기",
  "정어리",
  "배스",
  "가다랑어",
  "갈치",
  "바다새우",
  "전갱이",
  "대서양은상어",
  "바다가시고기",
  "노랑촉수",
  "노란전갱이",
  "아귀",
  "참문어",
  "대서양연어",
  "대서양난쟁이문어",
  "소라게",
  "흰동가리",
  "망둥어",
  "대문짝넙치",
  "유럽가자미",
  "대서양고등어",
  "유럽가재",
  "유럽날오징어",
  "복어",
  "등불성대",
  "산갈치",
  "검은점돔",
  "유럽장어",
  "킹크랩",
  "해덕대구",
  "황금 킹크랩",
  "참다랑어",
  "붉은개복치",
  "황새치",
  "개복치",
  "골드아로와나",
  "사자머리금붕어",
  "고래상어",
  "줄자돔",
  "바다거북",
  "엔젤피시",
  "베타",
  "만새기",
  "해파리",
  "양쥐돔",
  "쏠배감펭",
  "아주르담셀",
  "레나르디놀래기",
];

// 반려동물 종류별 선호 음식 목록에서 제외할 항목 이름 목록 (유지보수를 위해 상수로 관리)
export const DOG_EXCLUDED_FOODS: string[] = [
  "바다의 향연",
  "스타푸르트",
  "오션 에이드",
  "토마토 해산물 수프",
  "조개 진주 미니케이크",
  "스타푸르트 진주 미니케이크",
  "사과 진주 미니케이크",
  "오렌지 진주 미니케이크",
  "블루베리 진주 미니케이크",
  "라즈베리 진주 미니케이크",
  "스타프루트 진주 미니케이크",
  "마이멜로디 크레페",
  "시나모롤 크레페",
  "쿠로미 크레페",
];

export const CAT_EXCLUDED_FOODS: string[] = [
  "갯민숭달팽이",
  "납작등바다거북",
  "가리비",
  "만다린피시",
  "살오징어",
  "매오징어",
  "올리브바다거북",

];


interface PetFoodFinderProps {
  pets: Pet[];
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  activeSeasonIds?: string[];
  key?: string | number;
  debouncedSyncAllData?: (delay?: number) => void;
  markCollectionsModified?: () => void;
}

export default function PetFoodFinder({ pets, setPets, activeSeasonIds = [], debouncedSyncAllData, markCollectionsModified }: PetFoodFinderProps) {
  const [activePetId, setActivePetId] = useState<string>(() => {
    if (pets.length > 0) return pets[0].id;
    return '';
  });

  const [activePetTab, setActivePetTab] = useState<'active' | 'hotel'>('active');

  const [newPetName, setNewPetName] = useState('');
  // Set default type to null (unselected)
  const [newPetType, setNewPetType] = useState<'dog' | 'cat' | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPreference, setFilterPreference] = useState<'all' | 'tried' | 'notTried' | 'like' | 'dislike'>('all');
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  // Custom alert and confirm states to fix sandbox iframe blocks
  const [customAlert, setCustomAlert] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showHotelGuide, setShowHotelGuide] = useState(false);
  const [petToDelete, setPetToDelete] = useState<{ id: string; name: string } | null>(null);
  const [petToEdit, setPetToEdit] = useState<{ id: string; name: string } | null>(null);
  const [editPetName, setEditPetName] = useState('');

  // Removal request states
  const [itemToRemove, setItemToRemove] = useState<CustomFood | Fish | Cooking | null>(null);
  const [removeReason, setRemoveReason] = useState<'none' | 'not_eat' | 'other'>('none');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [hiddenItemIds, setHiddenItemIds] = useState<Set<string>>(new Set());

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useBackDismiss(showAddForm, () => setShowAddForm(false), 'petFoodAddForm');
  useBackDismiss(showDropdown, () => setShowDropdown(false), 'petFoodDropdown');
  useBackDismiss(!!customAlert, () => setCustomAlert(null), 'petFoodAlert');
  useBackDismiss(!!toastMessage, () => setToastMessage(null), 'petFoodToast');
  useBackDismiss(showHotelGuide, () => setShowHotelGuide(false), 'petFoodHotelGuide');
  useBackDismiss(!!petToDelete, () => setPetToDelete(null), 'petFoodDeleteConfirm');
  useBackDismiss(!!petToEdit, () => setPetToEdit(null), 'petFoodEditForm');
  useBackDismiss(!!itemToRemove, () => setItemToRemove(null), 'petFoodRemoveRequest');

  // 펫 호텔 가이드 최초 1회 팝업 제어 (7/30 ~ 일주일간 노출, 개발 프리뷰를 위해 7/29부터 활성화)
  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_pet_hotel_guide_v4');
    const now = new Date();
    // 2026년 7월 29일 00시 00분 00초 (월은 0부터 시작하므로 6 = 7월)
    const startDate = new Date(2026, 6, 29, 0, 0, 0);
    // 2026년 8월 6일 23시 59분 59초 (월은 0부터 시작하므로 7 = 8월)
    const endDate = new Date(2026, 7, 6, 23, 59, 59);
    
    if (now >= startDate && now <= endDate && !hasSeen) {
      setShowHotelGuide(true);
    }
  }, []);

  // 토스트 메시지 자동 닫기 타이머
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // 드롭다운 바깥 영역 클릭 시 닫기
  useEffect(() => {
    if (!showDropdown) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const insideDesktop = dropdownRef.current && dropdownRef.current.contains(target);
      const insideMobile = mobileDropdownRef.current && mobileDropdownRef.current.contains(target);
      
      if (!insideDesktop && !insideMobile) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showDropdown]);

  const activePets = pets.filter(p => !p.isHotel);
  const hotelPets = pets.filter(p => p.isHotel);
  const activePet = pets.find(p => p.id === activePetId && !p.isHotel) || activePets[0] || null;

  const handleSelectPet = (id: string) => {
    setActivePetId(id);
  };

  useEffect(() => {
    const activePetsList = pets.filter(p => !p.isHotel);
    const isCurrentActiveHotel = pets.some(p => p.id === activePetId && p.isHotel);
    const isCurrentActiveMissing = !pets.some(p => p.id === activePetId);

    if (isCurrentActiveHotel || isCurrentActiveMissing) {
      if (activePetsList.length > 0) {
        setActivePetId(activePetsList[0].id);
      } else {
        setActivePetId('');
      }
    }
  }, [pets, activePetId]);

  const handleAddPet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim()) {
      setCustomAlert('이름을 작성해주세요.');
      return;
    }

    // Raise alert if pet type is not selected
    if (!newPetType) {
      setCustomAlert('🐾 강아지 또는 고양이 중 반려동물의 종류를 선택해 주세요!');
      return;
    }

    const newPet: Pet = {
      id: 'pet-' + Date.now(),
      name: newPetName.trim(),
      type: newPetType,
      preferences: {}
    };

    setPets(prev => [...prev, newPet]);
    markCollectionsModified?.();
    debouncedSyncAllData?.();
    handleSelectPet(newPet.id);
    setNewPetName('');
    setNewPetType(null); // Reset selection
    setShowAddForm(false);

    // 새 펫 추가 후 해당 카드로 부드럽게 스크롤하여 포커스
    setTimeout(() => {
      const element = document.getElementById(`pet-card-${newPet.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const handleDeletePet = (id: string, name: string) => {
    setPetToDelete({ id, name });
  };

  const handleToggleHotel = (id: string) => {
    setPets(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nextHotel = !p.isHotel;
      return { ...p, isHotel: nextHotel };
    }));
    markCollectionsModified?.();
    debouncedSyncAllData?.();
  };

  const handleTogglePreference = (itemId: string, direction: 'like' | 'dislike') => {
    if (!activePet || activePet.isHotel) return;

    setPets(prev => prev.map(p => {
      if (p.id !== activePet.id || p.isHotel) return p;

      const currentPref = p.preferences[itemId] || 'neutral';
      let nextPref: 'like' | 'dislike' | 'neutral' = 'neutral';

      if (direction === 'like') {
        nextPref = currentPref === 'like' ? 'neutral' : 'like';
      } else if (direction === 'dislike') {
        nextPref = currentPref === 'dislike' ? 'neutral' : 'dislike';
      }

      const isTried = p.tried?.[itemId] || false;
      const newTried = {
        ... (p.tried || {})
      };

      // 좋아요/싫어요 선택 시, 먹여봄(tried)도 자동으로 true로 설정
      // 좋아요/싫어요 해제 시, 먹여봄(tried)도 자동으로 false로 설정
      if (nextPref === 'like' || nextPref === 'dislike') {
        newTried[itemId] = true;
      } else {
        newTried[itemId] = false;
      }

      return {
        ...p,
        preferences: {
          ...p.preferences,
          [itemId]: nextPref
        },
        tried: newTried
      };
    }));
    markCollectionsModified?.();
    debouncedSyncAllData?.();
  };

  const handleToggleTried = (itemId: string) => {
    if (!activePet || activePet.isHotel) return;

    setPets(prev => prev.map(p => {
      if (p.id !== activePet.id || p.isHotel) return p;

      const isTried = p.tried?.[itemId] || false;
      const nextTriedVal = !isTried;
      
      const newTried = {
        ... (p.tried || {}),
        [itemId]: nextTriedVal
      };

      const newPreferences = {
        ...p.preferences
      };

      // 먹여봄 해제 시, 하위 선호도(좋아요/싫어요)도 자동으로 neutral(해제)로 설정
      if (!nextTriedVal) {
        newPreferences[itemId] = 'neutral';
      }

      return {
        ...p,
        preferences: newPreferences,
        tried: newTried
      };
    }));
    markCollectionsModified?.();
    debouncedSyncAllData?.();
  };

  const handleSendRemoveReport = async () => {
    if (!itemToRemove || !activePet) return;

    if (removeReason === 'none') {
      setCustomAlert('제거 사유를 선택해 주세요.');
      return;
    }

    if (removeReason === 'other' && !otherReasonText.trim()) {
      setCustomAlert('기타 사유를 입력해 주세요.');
      return;
    }

    setIsSendingReport(true);

    const reasonLabel = removeReason === 'not_eat' 
      ? `${activePet.type === 'dog' ? '강아지' : '고양이'}가 먹지 않음` 
      : `기타 사유: ${otherReasonText.trim()}`;

    const APP_VERSION = versionData.version;
    const formattedMessage = `📢 [도감 제거 요청]\n\n• 대상 아이템: ${itemToRemove.name} (ID: ${itemToRemove.id})\n• 반려동물: ${activePet.name} (${activePet.type === 'dog' ? '강아지' : '고양이'})\n• 요청 사유: ${reasonLabel}\n• 앱 버전: ${APP_VERSION}`;

    const formData = new FormData();
    formData.append('message', formattedMessage);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          setHiddenItemIds(prev => {
            const next = new Set(prev);
            next.add(itemToRemove.id);
            return next;
          });
          
          setToastMessage('제거 요청이 완료되었습니다.\n해당 카드는 화면에서 숨김 처리되었습니다.');
          setTimeout(() => setToastMessage(null), 4000);
        } else {
          throw new Error(data?.error || 'Server error');
        }
      } else {
        throw new Error('HTTP status ' + response.status);
      }
    } catch (err) {
      console.error("Failed to send removal report:", err);
      setCustomAlert('시스템 오류로 인해 제보가 정상적으로 접수되지 않았습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSendingReport(false);
      setItemToRemove(null);
      setRemoveReason('none');
      setOtherReasonText('');
    }
  };



  const getFilteredItems = () => {
    if (!activePet) return [];

    const isCat = activePet.type === 'cat';
    const targets = isCat ? CAT_FOOD_TARGETS : DOG_FOOD_TARGETS;

    const list: Array<CustomFood | Fish | Cooking> = targets.map(targetName => {
      const normTarget = normalizeName(targetName);
      
      if (isCat) {
        if (normTarget === '고양이전용사료' || normTarget === '고양이사료') {
          return { id: 'custom-cat-food', name: '고양이 전용 사료', image: '/images/cooking/고양이 사료.webp', source: 'custom' };
        }
        if (normTarget === '동물공용음식' || normTarget === '공용사료') {
          return { id: 'custom-common-food', name: '동물 공용 음식', image: '/images/cooking/동물 공용 음식.webp', source: 'custom' };
        }
        const foundFish = FISHING.find(f => normalizeName(f.name) === normTarget);
        if (foundFish) {
          return { ...foundFish, name: targetName };
        }
      } else {
        if (normTarget === '강아지전용사료' || normTarget === '강아지사료') {
          return { id: 'custom-dog-food', name: '강아지 전용 사료', image: '/images/cooking/강아지 사료.webp', source: 'custom' };
        }
        if (normTarget === '동물공용음식' || normTarget === '공용사료') {
          return { id: 'custom-common-food', name: '동물 공용 음식', image: '/images/cooking/동물 공용 음식.webp', source: 'custom' };
        }
        const foundRaw = RAW_DOG_FOODS.find(r => normalizeName(r.name) === normTarget);
        if (foundRaw) return foundRaw;

        const foundCook = COOKING.find(c => {
          const normC = normalizeName(c.name);
          return normC === normTarget || (normTarget === '콘스프' && normC === '콘수프') || (normTarget === '구운버섯' && normC === '구운버섯') || (normTarget === '구운버섯' && normC === '구운 버섯');
        });
        if (foundCook) {
          return { ...foundCook, name: targetName };
        }
      }
      return undefined;
    }).filter((item): item is CustomFood | Fish | Cooking => item !== undefined);

    // 반려동물 종류별 제외 항목 목록 (공백 제거 후 비교)
    const excludedList = isCat ? CAT_EXCLUDED_FOODS : DOG_EXCLUDED_FOODS;
    const normalizedExcludedSet = new Set(excludedList.map(name => normalizeName(name)));

    // 시즌 이벤트 도감 설정(activeSeasonIds)이 ON 상태인 경우 해당 시즌 음식 추가
    if (activeSeasonIds && activeSeasonIds.length > 0) {
      const activeEvents = SEASONAL_EVENTS.filter(e => activeSeasonIds.includes(e.id));
      
      activeEvents.forEach(event => {
        if (isCat) {
          // 고양이는 시즌 물고기(fishing)만 추가
          if (event.fishing) {
            event.fishing.forEach(fish => {
              const norm = normalizeName(fish.name);
              if (normalizedExcludedSet.has(norm)) return;
              if (!list.some(item => normalizeName(item.name) === norm)) {
                list.push(fish);
              }
            });
          }
        } else {
          // 강아지는 시즌 요리(cooking)만 추가
          if (event.cooking) {
            event.cooking.forEach(cook => {
              const norm = normalizeName(cook.name);
              if (normalizedExcludedSet.has(norm)) return;
              if (!list.some(item => normalizeName(item.name) === norm)) {
                list.push(cook);
              }
            });
          }
        }
      });
    }

    // 전체 목록에서도 지정된 제외 항목 정제
    const sanitizedList = list.filter(item => {
      const norm = normalizeName(item.name);
      return !normalizedExcludedSet.has(norm);
    });

    let filtered = sanitizedList.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let metaMatch = false;
      if ('ingredients' in item && item.ingredients) {
        metaMatch = item.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
      } else if ('locations' in item && item.locations) {
        metaMatch = item.locations.some(loc => loc.toLowerCase().includes(searchQuery.toLowerCase()));
      }

      return nameMatch || metaMatch;
    });

    if (filterPreference !== 'all') {
      filtered = filtered.filter(item => {
        const pref = activePet.preferences[item.id] || 'neutral';
        const isTried = activePet.tried?.[item.id] || pref === 'like' || pref === 'dislike' || false;
        
        if (filterPreference === 'tried') return isTried;
        if (filterPreference === 'notTried') return !isTried;
        if (filterPreference === 'like') return isTried && pref === 'like';
        if (filterPreference === 'dislike') return isTried && pref === 'dislike';
        
        return true;
      });
    }

    let finalFiltered = filtered.filter(item => !hiddenItemIds.has(item.id));
    
    // Ensure unique IDs to prevent duplicate keys in React
    const seenIds = new Set<string>();
    finalFiltered = finalFiltered.filter(item => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    finalFiltered.sort((a, b) => {
      const levelA = 'level' in a ? Number((a as any).level) || 0 : 0;
      const levelB = 'level' in b ? Number((b as any).level) || 0 : 0;
      if (levelA !== levelB) {
        return levelA - levelB;
      }
      return a.name.localeCompare(b.name);
    });
    return finalFiltered;
  };

  const getItemSeason = (item: CustomFood | Fish | Cooking) => {
    if ('seasonId' in item && item.seasonId) {
      const ev = SEASONAL_EVENTS.find(e => e.id === item.seasonId);
      if (ev) return ev;
    }
    const norm = normalizeName(item.name);
    for (const ev of SEASONAL_EVENTS) {
      if (ev.fishing?.some(f => f.id === item.id || normalizeName(f.name) === norm)) return ev;
      if (ev.cooking?.some(c => c.id === item.id || normalizeName(c.name) === norm)) return ev;
      if (ev.crops?.some(cr => cr.id === item.id || normalizeName(cr.name) === norm)) return ev;
    }
    return null;
  };

  const filteredItems = getFilteredItems();

  return (
    <div ref={rootRef} className="space-y-6 max-w-[1240px] mx-auto select-none px-1 py-1 overflow-visible">
      
      {/* Privacy disclaimer banner */}
      <div className="bg-stone-50/60 dark:bg-stone-950/45 p-3 rounded-xl border border-stone-200/50 dark:border-stone-850/80 flex items-start gap-2.5">
        <span className="text-base shrink-0 select-none">💡</span>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-stone-400 font-bold">
          펫 먹이 찾기 및 선호도 설정은 로그인 시 실시간으로 클라우드에 동기화되어 안전하게 보존됩니다. (비로그인 시에는 현재 브라우저의 로컬 저장소에만 저장됩니다)
        </p>
      </div>

      {/* 1. MASTER CONTROL BOARD (Consolidated & Compact) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border border-stone-200/50 dark:border-stone-850 shadow-sm space-y-4">
        
        {/* Row A: Title & Action Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-100 dark:border-stone-800/70">
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-stone-100 flex items-center gap-1.5">
              <span>🍽️</span> 아이가 좋아하는 음식 찾기
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-404 mt-1 font-bold">
              우리 아이의 입맛 취향을 손쉽게 기록하고 맛있는 음식을 간편하게 검색해 보세요.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setShowAddForm(prev => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs",
                showAddForm
                  ? "bg-rose-500 text-white! border-rose-500"
                  : "bg-slate-900 text-white dark:bg-stone-100 dark:text-stone-900"
              )}
            >
              <Plus className="h-3 w-3" />
              마이펫 추가
            </button>
          </div>
        </div>

        {/* Dynamic add form - Beautifully revised layout with unselected default state and alerts */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddPet}
              className="overflow-hidden bg-stone-50/50 dark:bg-stone-950/40 p-3.5 sm:p-4 rounded-xl border border-stone-200/60 dark:border-stone-800/85 flex flex-col md:flex-row gap-3.5 items-stretch md:items-end animate-in fade-in"
            >
              <div className="flex-1 space-y-1.5">
                <span className="text-[11px] font-black text-stone-500 dark:text-stone-400 block uppercase tracking-wider">
                  마이펫 이름
                </span>
                <input
                  type="text"
                  placeholder="아이의 이름을 입력해 주세요 (예: 돼지)"
                  value={newPetName}
                  onChange={e => setNewPetName(e.target.value)}
                  className="w-full text-xs font-black px-3 py-2 border rounded-xl bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 text-stone-800 dark:text-stone-150"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-stone-500 dark:text-stone-500 block uppercase tracking-wider">
                  반려동물 종류 (필수 선택)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPetType('dog')}
                    className={cn(
                      "flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-black transition-all cursor-pointer",
                      newPetType === 'dog'
                        ? "bg-orange-500 border-orange-500 text-white dark:bg-orange-600 dark:border-orange-600 dark:text-orange-100 shadow-xs"
                        : "bg-white border-stone-200 text-stone-400 hover:border-orange-300 dark:bg-stone-900 dark:border-stone-800"
                    )}
                  >
                    <Dog className={cn("h-4 w-4", newPetType === 'dog' ? "text-white" : "text-orange-500 dark:text-orange-400")} /> 강아지
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPetType('cat')}
                    className={cn(
                      "flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-black transition-all cursor-pointer",
                      newPetType === 'cat'
                        ? "bg-sky-500 border-sky-450 text-white dark:text-sky-100 shadow-xs"
                        : "bg-white border-stone-200 text-stone-400 hover:border-sky-300 dark:bg-stone-900 dark:border-stone-800"
                    )}
                  >
                    <Cat className={cn("h-4 w-4", newPetType === 'cat' ? "text-white" : "text-sky-550")} /> 고양이
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-605 text-white font-black rounded-xl text-xs cursor-pointer active:scale-95 transition-all w-full md:w-auto text-center"
              >
                등록완료
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Row B: Beautiful Registered Pet Profile Tabs / Onboarding Space */}
        <div className="bg-stone-50/20 dark:bg-stone-950/10 p-2 rounded-xl">
          {pets.length === 0 ? (
            <div className="py-8 px-4 sm:px-6 flex flex-col items-center justify-center text-center bg-stone-50/30 dark:bg-stone-955/20 rounded-xl border border-dashed border-stone-200 dark:border-stone-850 max-w-2xl mx-auto my-1 space-y-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-955/35 flex items-center justify-center text-2xl animate-bounce">
                🐾
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-stone-800 dark:text-stone-100">아직 등록된 아이가 없어요!</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-md mx-auto font-bold">
                  아이가 좋아하는 먹이와 레시피 취향을 기록하려면 먼저 반려동물을 등록해 주세요.
                </p>
              </div>

              {/* Bento Steps Guidance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left pt-2">
                <div className="bg-white dark:bg-stone-950/40 p-3 rounded-xl border border-stone-150 dark:border-stone-850/60 flex flex-col justify-start">
                  <span className="text-amber-500 dark:text-amber-400 font-extrabold text-[10px] uppercase mb-1">Step 1. 등록</span>
                  <p className="text-xs text-stone-700 dark:text-stone-300 font-extrabold leading-snug">
                    우측 상단의 <strong className="text-amber-500 font-black">마이펫 추가</strong>를 눌러 강아지/고양이의 종류를 고르고 이름을 적어 신규 프로필을 만들어요.
                  </p>
                </div>
                <div className="bg-white dark:bg-stone-950/40 p-3 rounded-xl border border-stone-150 dark:border-stone-850/60 flex flex-col justify-start">
                  <span className="text-amber-500 dark:text-amber-400 font-extrabold text-[10px] uppercase mb-1">Step 2. 정보 탐색</span>
                  <p className="text-xs text-stone-700 dark:text-stone-300 font-extrabold leading-snug">
                    강아지는 맛있는 <strong className="text-amber-500 font-black">요리/과일</strong>, 고양이는 다양한 <strong className="text-amber-500 font-black">물고기</strong> 목록이 보여요.
                  </p>
                </div>
                <div className="bg-white dark:bg-stone-950/40 p-3 rounded-xl border border-stone-150 dark:border-stone-850/60 flex flex-col justify-start">
                  <span className="text-amber-500 dark:text-amber-400 font-extrabold text-[10px] uppercase mb-1">Step 3. 교감 기록</span>
                  <p className="text-xs text-stone-700 dark:text-stone-300 font-extrabold leading-snug">
                    아이 선호도에 맞게 <strong className="text-emerald-500 font-black">좋아요🟢</strong> 또는 <strong className="text-rose-500 font-black">싫어요❌</strong>를 누르며 입맛 취향을 기록해요.
                  </p>
                </div>
              </div>

              {/* Interaction Call to Actions */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />마이펫 등록하기
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Pet Category Tabs Header */}
              <div className="flex items-center gap-1 bg-stone-100/90 dark:bg-stone-900/70 p-1 rounded-xl w-full sm:w-fit border border-stone-200/60 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setActivePetTab('active')}
                  className={cn(
                    "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
                    activePetTab === 'active'
                      ? "bg-white dark:bg-stone-800 text-stone-850 dark:text-stone-100 shadow-xs"
                      : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                  )}
                >
                  <span>🐾 마이펫</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                    activePetTab === 'active'
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                  )}>
                    {activePets.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePetTab('hotel')}
                  className={cn(
                    "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
                    activePetTab === 'hotel'
                      ? "bg-white dark:bg-stone-800 text-stone-850 dark:text-stone-100 shadow-xs"
                      : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                  )}
                >
                  <span>🏡 펫 호텔</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                    activePetTab === 'hotel'
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                  )}>
                    {hotelPets.length}
                  </span>
                </button>
              </div>

              {/* Tab Content: Active Pets */}
              {activePetTab === 'active' && (
                <>
                  {activePets.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-400 dark:text-stone-500 font-bold bg-white dark:bg-stone-950/20 rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                      🏡 현재 집에 있는 마이펫이 없어요. 펫 호텔에서 데려오거나 새로 등록해 주세요!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                          {activePets.map(p => {
                            const isActive = p.id === activePetId;
                            const isDog = p.type === 'dog';
                            const countLikes = Object.values(p.preferences || {}).filter(v => v === 'like').length;
                            const countDislikes = Object.values(p.preferences || {}).filter(v => v === 'dislike').length;

                            return (
                              <div
                                id={`pet-card-${p.id}`}
                                key={p.id}
                                onClick={() => handleSelectPet(p.id)}
                                className={cn(
                                  "group relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer select-none border",
                                  isActive
                                    ? isDog
                                      ? "bg-amber-500/10 border-amber-500/60 text-stone-850 dark:text-stone-100 ring-1 ring-amber-400/30 font-black"
                                      : "bg-sky-500/10 border-sky-550/60 text-stone-850 dark:text-stone-100 ring-1 ring-sky-400/30 font-black"
                                    : "bg-white dark:bg-stone-950/30 border-stone-200 hover:bg-stone-50 dark:border-stone-850 dark:text-stone-300 dark:hover:bg-stone-850"
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className={cn(
                                    "p-2 rounded-xl shrink-0 transition-colors flex items-center justify-center h-9 w-9",
                                    isDog ? "bg-amber-100 dark:bg-amber-955/40 text-amber-600" : "bg-sky-100 dark:bg-sky-955/40 text-sky-600"
                                  )}>
                                    {isDog ? <Dog className="h-5 w-5" /> : <Cat className="h-5 w-5" />}
                                  </span>

                                  <div className="min-w-0 pr-1">
                                    <p className="text-[11.5px] sm:text-xs font-extra-bold text-slate-800 dark:text-stone-100 truncate">
                                      {p.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[9.5px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                        🟢 {countLikes}
                                      </span>
                                      <span className="text-[9.5px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                                        ❌ {countDislikes}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleHotel(p.id);
                                    }}
                                    className="p-1 text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-amber-400 dark:hover:bg-stone-800/60 rounded-lg transition-all cursor-pointer"
                                    title="펫 호텔로 보내기"
                                  >
                                    <Bed className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPetToEdit({ id: p.id, name: p.name });
                                      setEditPetName(p.name);
                                    }}
                                    className="p-1 text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-amber-400 dark:hover:bg-stone-800/60 rounded-lg transition-all cursor-pointer"
                                    title="이름 수정"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePet(p.id, p.name);
                                    }}
                                    className="p-1 text-stone-500 hover:text-rose-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-rose-400 dark:hover:bg-stone-800/60 rounded-lg transition-all cursor-pointer"
                                    title="펫 삭제"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tab Content: Hotel Pets */}
              {activePetTab === 'hotel' && (
                <>
                  {hotelPets.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500 font-bold bg-white dark:bg-stone-950/20 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 space-y-2">
                      <div className="text-xl">🏡</div>
                      <p>펫 호텔 보관함에 맡겨진 반려동물이 없어요.</p>
                      <p className="text-[11px] text-stone-400 font-medium">
                        마이펫 카드 우측의 침대 아이콘을 눌러 잠시 호텔에 보관할 수 있습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                          {hotelPets.map(p => {
                            const isDog = p.type === 'dog';
                            const countLikes = Object.values(p.preferences || {}).filter(v => v === 'like').length;
                            const countDislikes = Object.values(p.preferences || {}).filter(v => v === 'dislike').length;

                            return (
                              <div
                                id={`pet-card-${p.id}`}
                                key={p.id}
                                onClick={() => {
                                  setToastMessage(`🏡 '${p.name}'은(는) 호텔에 있어요.`);
                                }}
                                className="group relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer select-none border bg-stone-100/40 dark:bg-stone-900/30 border-stone-200/60 dark:border-stone-800/60 opacity-70 hover:opacity-100"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                                  <span className={cn(
                                    "p-2 rounded-xl shrink-0 transition-colors flex items-center justify-center h-9 w-9 opacity-70",
                                    isDog ? "bg-amber-100/50 dark:bg-amber-955/20 text-amber-600/70" : "bg-sky-100/50 dark:bg-sky-955/20 text-sky-600/70"
                                  )}>
                                    {isDog ? <Dog className="h-5 w-5" /> : <Cat className="h-5 w-5" />}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11.5px] sm:text-xs font-extra-bold text-stone-600 dark:text-stone-400 truncate">
                                      {p.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[9.5px] font-black text-emerald-600/60 dark:text-emerald-400/60 flex items-center gap-0.5">
                                        🟢 {countLikes}
                                      </span>
                                      <span className="text-[9.5px] font-black text-rose-600/60 dark:text-rose-400/60 flex items-center gap-0.5">
                                        ❌ {countDislikes}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleHotel(p.id);
                                    }}
                                    className="p-1 text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-amber-400 dark:hover:bg-stone-800/60 rounded-lg transition-all cursor-pointer"
                                    title="호텔에서 데려오기"
                                  >
                                    <Home className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPetToEdit({ id: p.id, name: p.name });
                                      setEditPetName(p.name);
                                    }}
                                    className="p-1 text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-amber-400 dark:hover:bg-stone-800/60 rounded-lg transition-all cursor-pointer"
                                    title="이름 수정"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePet(p.id, p.name);
                                    }}
                                    className="p-1 text-stone-500 hover:text-rose-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-rose-400 dark:hover:bg-stone-800/60 rounded-lg transition-all cursor-pointer"
                                    title="펫 삭제"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row C: STICKY Selected Pet Filter & Search controls */}
      {activePet && (
        <div 
          ref={stickyHeaderRef}
          className="sticky top-[var(--sticky-top-mobile)] lg:top-[var(--sticky-top-desktop)] z-[50] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-3 bg-neutral-50/95 dark:bg-stone-955/95 backdrop-blur-md border-b border-stone-200/35 dark:border-stone-850/50 shadow-xs transition-all mb-4 font-sans"
        >
          <div className="max-w-[1240px] mx-auto w-full px-1">
            <div className="rounded-xl sm:rounded-[32px] border border-stone-200/40 dark:border-stone-850/50 bg-white dark:bg-stone-900 shadow-lg sm:shadow-xl shadow-neutral-250/10 dark:shadow-none overflow-visible p-1.5 sm:p-4 flex flex-col gap-1.5 sm:gap-3">
              
              {/* Mobile Only: Highly Compact Search & Filter Controls */}
              <div className="sm:hidden flex flex-col gap-1.5 w-full">
                {/* Row 1: Pet Dropdown & Search Bar side-by-side */}
                <div className="flex items-center gap-1.5 w-full">
                  <div className="relative shrink-0" ref={mobileDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowDropdown(prev => !prev)}
                      className="flex items-center gap-1.5 bg-stone-100/80 hover:bg-stone-200/70 dark:bg-stone-800/80 dark:hover:bg-stone-750/70 rounded-lg pl-1.5 pr-2.5 py-1 transition-all text-xs font-black text-slate-855 dark:text-stone-100 select-none shadow-3xs group"
                    >
                      <span className={cn(
                        "p-1 rounded-md shrink-0 transition-colors flex items-center justify-center h-6 w-6",
                        activePet.type === 'dog' 
                          ? "bg-amber-100 dark:bg-amber-955/40 text-amber-600" 
                          : "bg-sky-100 dark:bg-sky-955/40 text-sky-600"
                      )}>
                        {activePet.type === 'dog' ? <Dog className="h-4 w-4" /> : <Cat className="h-4 w-4" />}
                      </span>
                      <span className="max-w-[70px] truncate">{activePet.name}</span>
                      <ChevronDown className={cn("h-3 w-3 text-stone-500 transition-transform duration-200 shrink-0", showDropdown && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {showDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-[60] cursor-default" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDropdown(false);
                            }} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.96 }}
                            transition={{ duration: 0.12, ease: "easeOut" }}
                            className="absolute left-0 mt-1.5 w-40 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-xl z-[70] py-1 overflow-hidden origin-top-left"
                          >
                            <div className="max-h-56 overflow-y-auto custom-scrollbar">
                              {activePets.map(p => {
                                const isSelected = p.id === activePet.id;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      handleSelectPet(p.id);
                                      setShowDropdown(false);
                                    }}
                                    className={cn(
                                      "w-full px-2.5 py-2 text-left flex items-center justify-between text-xs font-black transition-all cursor-pointer",
                                      isSelected 
                                        ? "text-slate-900 bg-stone-100/60 dark:text-white dark:bg-stone-800/50" 
                                        : "text-stone-605 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-850/60"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span className={cn(
                                        "p-1 rounded-md shrink-0 transition-colors flex items-center justify-center h-5.5 w-5.5",
                                        p.type === 'dog' 
                                          ? "bg-amber-100 dark:bg-amber-955/40 text-amber-600" 
                                          : "bg-sky-100 dark:bg-sky-955/40 text-sky-600"
                                      )}>
                                        {p.type === 'dog' ? <Dog className="h-3.5 w-3.5" /> : <Cat className="h-3.5 w-3.5" />}
                                      </span>
                                      <span className="truncate">{p.name}</span>
                                    </div>
                                    {isSelected && <Check className="h-3 w-3 text-emerald-500 shrink-0 ml-1" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Search input field customized to integrate perfectly */}
                  <div className="relative flex-1 group overflow-hidden h-[34px]">
                    <Search className={cn(
                      "absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-colors z-[15]",
                      searchQuery ? "text-slate-900 dark:text-stone-100" : "text-neutral-400 dark:text-stone-550 group-focus-within:text-slate-900"
                    )} />
                    <input
                      type="text"
                      placeholder="검색어를 입럭해주세요"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full h-full rounded-lg border border-neutral-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-955 pl-8.5 pr-8 py-1.5 text-xs focus:border-slate-800 dark:focus:border-stone-600 focus:bg-white dark:focus:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-semibold text-neutral-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-550"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-850 text-stone-400 transition-colors cursor-pointer z-[15]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Structured Unified Main Filter Block & Conditional Sub-Filters */}
                <div className="flex flex-col w-full">
                  <div className="flex bg-stone-100/60 dark:bg-stone-955 border border-stone-200/50 dark:border-stone-900/30 p-0.5 rounded-lg select-none w-full">
                    <button
                      type="button"
                      onClick={() => setFilterPreference('all')}
                      className={cn(
                        "flex-1 text-center py-1 rounded-md text-[11px] font-black tracking-tight transition-all cursor-pointer whitespace-nowrap",
                        filterPreference === 'all'
                          ? "bg-white dark:bg-stone-800 text-slate-850 dark:text-stone-100 shadow-3xs font-black"
                          : "text-stone-500 dark:text-stone-400 hover:text-stone-700"
                      )}
                    >
                      전체
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPreference('tried')}
                      className={cn(
                        "flex-1 text-center py-1 rounded-md text-[11px] font-black tracking-tight transition-all cursor-pointer whitespace-nowrap",
                        (filterPreference === 'tried' || filterPreference === 'like' || filterPreference === 'dislike')
                          ? "bg-white dark:bg-stone-800 text-slate-850 dark:text-stone-100 shadow-3xs font-black"
                          : "text-stone-500 dark:text-stone-400 hover:text-stone-700"
                      )}
                    >
                      먹여봄
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPreference('notTried')}
                      className={cn(
                        "flex-1 text-center py-1 rounded-md text-[11px] font-black tracking-tight transition-all cursor-pointer whitespace-nowrap",
                        filterPreference === 'notTried'
                          ? "bg-white dark:bg-stone-800 text-slate-850 dark:text-stone-100 shadow-3xs font-black"
                          : "text-stone-500 dark:text-stone-400 hover:text-stone-700"
                      )}
                    >
                      안먹여봄
                    </button>
                  </div>

                  <AnimatePresence>
                    {(filterPreference === 'tried' || filterPreference === 'like' || filterPreference === 'dislike') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden w-full mt-1.5"
                      >
                        <div className="flex bg-stone-100/35 dark:bg-stone-900/40 border border-stone-200/35 dark:border-stone-850/40 p-0.5 rounded-lg select-none w-full">
                          <button
                            type="button"
                            onClick={() => setFilterPreference('tried')}
                            className={cn(
                              "flex-1 text-center py-0.5 rounded text-[10.5px] font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap",
                              filterPreference === 'tried'
                                ? "bg-white dark:bg-stone-800 text-slate-850 dark:text-stone-100 shadow-3xs"
                                : "text-stone-400 dark:text-stone-500"
                            )}
                          >
                            전체
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterPreference('like')}
                            className={cn(
                              "flex-1 text-center py-0.5 rounded text-[10.5px] font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-0.5",
                              filterPreference === 'like'
                                ? "bg-white dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 shadow-3xs font-extrabold"
                                : "text-stone-400 dark:text-stone-500"
                            )}
                          >
                            🟢 좋아요
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterPreference('dislike')}
                            className={cn(
                              "flex-1 text-center py-0.5 rounded text-[10.5px] font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-0.5",
                              filterPreference === 'dislike'
                                ? "bg-white dark:bg-stone-800 text-rose-600 dark:text-rose-455 shadow-3xs font-extrabold"
                                : "text-stone-400 dark:text-stone-500"
                            )}
                          >
                            ❌ 싫어요
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Desktop Only: Original Structured Controls (Kept with 100% fidelity to prevent regression) */}
              <div className="hidden sm:flex flex-col gap-3 w-full">
                
                {/* Row 1: Pet Details & Primary Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-stone-150/60 dark:border-stone-850/60">
                  
                  {/* Pet Selection & Badge */}
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      "p-2 rounded-xl shrink-0 transition-colors flex items-center justify-center h-10 w-10",
                      activePet.type === 'dog' 
                        ? "bg-amber-100 dark:bg-amber-955/40 text-amber-600" 
                        : "bg-sky-100 dark:bg-sky-955/40 text-sky-600"
                    )}>
                      {activePet.type === 'dog' ? <Dog className="h-5.5 w-5.5" /> : <Cat className="h-5.5 w-5.5" />}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowDropdown(prev => !prev)}
                          className="flex items-center gap-1.5 bg-stone-100/70 hover:bg-stone-200/60 dark:bg-stone-800/70 dark:hover:bg-stone-700/60 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer font-black text-xs text-slate-855 dark:text-stone-100 shadow-3xs group select-none min-w-[70px] justify-between"
                        >
                          <span className="truncate pr-0.5">{activePet.name}</span>
                          <ChevronDown className={cn("h-3.5 w-3.5 text-stone-500 pointer-events-none group-hover:text-stone-800 dark:group-hover:text-stone-350 transition-transform duration-200 shrink-0", showDropdown && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                          {showDropdown && (
                            <>
                              <div 
                                className="fixed inset-0 z-[60] cursor-default" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDropdown(false);
                                }} 
                              />
                              <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                transition={{ duration: 0.12, ease: "easeOut" }}
                                className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-xl z-[70] py-1.5 overflow-hidden origin-top-left"
                              >
                                <div className="max-h-56 overflow-y-auto custom-scrollbar">
                                  {activePets.map(p => {
                                    const isSelected = p.id === activePet.id;
                                    return (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                          handleSelectPet(p.id);
                                          setShowDropdown(false);
                                        }}
                                        className={cn(
                                          "w-full px-2.5 py-2 text-left flex items-center justify-between text-xs font-black transition-all cursor-pointer",
                                          isSelected 
                                            ? "text-slate-900 bg-stone-100/60 dark:text-white dark:bg-stone-800/50" 
                                            : "text-stone-605 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-850/60"
                                        )}
                                      >
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span className={cn(
                                            "p-1 rounded-md shrink-0 transition-colors flex items-center justify-center h-5.5 w-5.5",
                                            p.type === 'dog' 
                                              ? "bg-amber-100 dark:bg-amber-955/40 text-amber-600" 
                                              : "bg-sky-100 dark:bg-sky-955/40 text-sky-600"
                                          )}>
                                            {p.type === 'dog' ? <Dog className="h-3.5 w-3.5" /> : <Cat className="h-3.5 w-3.5" />}
                                          </span>
                                          <span className="truncate">{p.name}</span>
                                        </div>
                                        {isSelected && <Check className="h-3 w-3 text-emerald-500 shrink-0 ml-1" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <span className={cn(
                        "text-[10px] font-black px-1.5 py-0.5 rounded-lg text-white leading-none shrink-0 select-none",
                        activePet.type === 'dog' ? "bg-amber-500 dark:bg-amber-600" : "bg-sky-500 dark:bg-sky-600"
                      )}>
                        {activePet.type === 'dog' ? '강아지' : '고양이'}
                      </span>
                    </div>
                  </div>

                  {/* Primary Filters (전체, 먹여봄, 안먹여봄) */}
                  <div className="flex bg-stone-100/50 dark:bg-stone-955 border border-stone-200 dark:border-stone-700/60 p-0.5 sm:p-1 rounded-xl gap-0.5 sm:gap-1 shrink-0 select-none text-[11px] sm:text-xs font-bold shadow-3xs">
                    <button
                      type="button"
                      onClick={() => setFilterPreference('all')}
                      className={cn(
                        "px-2 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap",
                        filterPreference === 'all'
                          ? "bg-slate-800 text-white dark:bg-white dark:text-stone-900 shadow-xs font-black"
                          : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                      )}
                    >
                      전체
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPreference('tried')}
                      className={cn(
                        "px-2 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap",
                        (filterPreference === 'tried' || filterPreference === 'like' || filterPreference === 'dislike')
                          ? "bg-slate-800 text-white dark:bg-white dark:text-stone-900 shadow-xs font-black"
                          : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                      )}
                    >
                      먹여봄
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPreference('notTried')}
                      className={cn(
                        "px-2 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap",
                        filterPreference === 'notTried'
                          ? "bg-slate-800 text-white dark:bg-white dark:text-stone-900 shadow-xs font-black"
                          : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                      )}
                    >
                      안먹여봄
                    </button>
                  </div>
                </div>

                {/* Row 2: Search Input & Tried Sub-filters */}
                <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
                  
                  {/* Search Box Box - identical to other encyclopedia tab search inputs */}
                  <div className="relative flex-1 group overflow-hidden h-[40px] sm:h-[42px]">
                    <Search className={cn(
                      "absolute left-3.5 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors z-[15]",
                      searchQuery ? "text-slate-900 dark:text-stone-100" : "text-neutral-400 dark:text-stone-550 group-focus-within:text-slate-900 dark:group-focus-within:text-stone-100"
                    )} />
                    <input
                      type="text"
                      placeholder="검색어를 입력해주세요"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full h-full rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-955 pl-12 pr-12 py-2 sm:py-3 text-[14.5px] sm:text-[15px] focus:border-slate-900 dark:focus:border-stone-600 focus:bg-white dark:focus:bg-stone-950 focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-stone-600/10 transition-all font-semibold text-neutral-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-550"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-850 text-stone-400 transition-colors cursor-pointer z-[15]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sub-Filters for 'Tried' (좋아요, 싫어요) */}
                  <AnimatePresence>
                    {(filterPreference === 'tried' || filterPreference === 'like' || filterPreference === 'dislike') && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 'auto' }}
                        exit={{ opacity: 0, x: 10, width: 0 }}
                        className="overflow-hidden flex items-center md:shrink-0"
                      >
                        <div className="flex bg-stone-200/55 dark:bg-stone-950 border border-stone-200 dark:border-stone-850/80 p-0.5 sm:p-1 rounded-xl gap-0.5 sm:gap-1 shrink-0 select-none text-[11px] sm:text-xs font-bold w-full md:w-auto justify-end shadow-3xs">
                          <button
                            type="button"
                            onClick={() => setFilterPreference('tried')}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap",
                              filterPreference === 'tried'
                                ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-black"
                                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:text-stone-350"
                            )}
                          >
                            전체
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterPreference('like')}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap",
                              filterPreference === 'like'
                                ? "bg-emerald-500 text-white shadow-xs font-black"
                                : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5"
                            )}
                          >
                            🟢 좋아요
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterPreference('dislike')}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap",
                              filterPreference === 'dislike'
                                ? "bg-rose-500 text-white shadow-xs font-black"
                                : "text-rose-500 dark:text-rose-455 hover:bg-rose-500/5"
                            )}
                          >
                            ❌ 싫어요
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. EXTREMELY BEAUTIFUL & READABLE COMFORTABLE GRID LIST (2 columns on mobile, clean typography, long title wrap) */}
      {activePet && (
        <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 content-start min-h-[calc(100vh-300px)]">
          {filteredItems.map(item => {
            const pref = activePet.preferences[item.id] || 'neutral';
            const isTried = activePet.tried?.[item.id] || false;
            const isCustom = 'source' in item && item.source === 'custom';
            const isRainbow = activePet.type === 'cat' && !isCustom && (item as Fish).weather === 'Rainbow';
            const seasonEvent = getItemSeason(item);
            const itemLevel = 'level' in item ? (item as any).level : undefined;
            
            let imgUrl: string | null = null;
            if (isCustom && 'image' in item && (item as CustomFood).image) {
              imgUrl = (item as CustomFood).image;
            } else if ('ingredients' in item) {
              imgUrl = getExistingImagePath('cooking', item.name, item);
            } else if ('locations' in item) {
              imgUrl = getExistingImagePath('fishing', item.name, item);
            } else {
              imgUrl = getExistingImagePath(activePet.type === 'dog' ? 'cooking' : 'fishing', item.name, item);
            }

            return (
              <motion.div
                key={item.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl transition-all p-3 sm:p-4 flex flex-col justify-between select-none shadow-[xs] border",
                  pref === 'neutral' && !isRainbow && "bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-850/80 hover:border-stone-300 dark:hover:border-stone-750",
                  pref === 'neutral' && isRainbow && "border-zinc-300 dark:border-slate-700 bg-gradient-to-r from-rose-200/40 via-amber-200/40 via-emerald-200/40 via-sky-200/40 via-indigo-200/40 to-rose-200/40 dark:from-slate-900 dark:via-rose-900/25 dark:via-amber-900/25 dark:via-emerald-900/25 dark:via-sky-900/25 dark:via-indigo-900/25 dark:to-slate-900 bg-[length:400%_400%] animate-rainbow shadow-zinc-100/10 dark:shadow-slate-950/40 text-zinc-950 dark:text-slate-100",
                  pref === 'like' && "bg-emerald-50/85 dark:bg-emerald-950/20 border-emerald-300/85 dark:border-emerald-800/40 ring-1 ring-emerald-400/30",
                  pref === 'dislike' && "bg-rose-50/85 dark:bg-rose-950/20 border-rose-300/85 dark:border-rose-800/40 ring-1 ring-rose-400/30"
                )}
              >
                {/* Level Badge on Top-Left */}
                {itemLevel !== undefined && (() => {
                  const levelBadgeStyle = (() => {
                    const lvl = Number(itemLevel);
                    if (isNaN(lvl) || lvl <= 1) {
                      return "bg-sky-50 dark:bg-sky-950/45 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/50";
                    }
                    if (lvl === 2) {
                      return "bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/50";
                    }
                    if (lvl === 3) {
                      return "bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/50";
                    }
                    if (lvl === 4) {
                      return "bg-amber-50 dark:bg-amber-950/45 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/50";
                    }
                    if (lvl === 5) {
                      return "bg-rose-50 dark:bg-rose-950/45 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/50";
                    }
                    if (lvl === 6) {
                      return "bg-teal-50 dark:bg-teal-950/45 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/50";
                    }
                    return "bg-violet-50 dark:bg-violet-950/45 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-800/50";
                  })();

                  return (
                    <span className={cn(
                      "absolute top-2 left-2.5 z-10 inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11.5px] font-black border shadow-3xs leading-none tracking-wide",
                      levelBadgeStyle
                    )}>
                      Lv.{itemLevel}
                    </span>
                  );
                })()}

                {/* Siren Report Button on Top-Right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToRemove(item);
                    setRemoveReason('none');
                    setOtherReasonText('');
                  }}
                  title={`${item.name} 제거 요청 제보하기`}
                  className="absolute top-1.5 right-1.5 z-20 p-1 text-rose-500/80 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Siren className="w-[17px] h-[17px]" />
                </button>

                {/* Seasonal Badge on Top-Right - shifted left to avoid overlapping with Siren */}
                {seasonEvent && (() => {
                  const badgeStyle = getSeasonBadgeStyle(seasonEvent.id);
                  return (
                    <span className={cn(
                      "absolute top-2 right-9 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black border shadow-2xs backdrop-blur-xs",
                      badgeStyle.bg,
                      badgeStyle.text,
                      badgeStyle.border
                    )}>
                      {seasonEvent.emoji && <span>{seasonEvent.emoji}</span>}
                      <span>{seasonEvent.shortName || seasonEvent.name}</span>
                    </span>
                  );
                })()}
                {/* Main section: image + text info */}
                <div className="space-y-2.5 flex-1 flex flex-col">
                  
                  {/* Image Container with comfortable size on both mobile & desktop */}
                  <div className={cn(
                    "h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center p-0.5 overflow-hidden shrink-0 transition-colors mx-auto",
                    imgUrl && !failedImages[item.id]
                      ? "bg-transparent border-none"
                      : "border bg-stone-50 dark:bg-stone-950/40 border-stone-150 dark:border-stone-800/80"
                  )}>
                    {imgUrl && !failedImages[item.id] ? (
                      <img
                        src={imgUrl}
                        draggable={false}
                        alt={item.name}
                        className="h-full w-full object-contain pointer-events-none group-hover:scale-105 transition-transform"
                        onError={() => {
                          setFailedImages(prev => ({ ...prev, [item.id]: true }));
                        }}
                      />
                    ) : (
                      activePet.type === 'dog' ? (
                        <Soup className="h-5 w-5 sm:h-6 sm:w-6 text-stone-400 dark:text-stone-500" />
                      ) : (
                        <FishIcon className="h-5 w-5 sm:h-6 sm:w-6 text-stone-400 dark:text-stone-500" />
                      )
                    )}
                  </div>

                  {/* Text details - Title wraps nicely into up to two lines cleanly */}
                  <div className="flex-1 text-center min-w-0 flex flex-col justify-between">
                    <h4 className="text-xs sm:text-[13px] md:text-sm font-black text-slate-850 dark:text-stone-100 tracking-tight leading-snug line-clamp-2 min-h-[36px] flex items-center justify-center">
                      {item.name}
                    </h4>

                    {/* Description subtext without useless labels */}
                    {!isCustom && (
                      <div className="mt-1.5 w-full">
                        {'ingredients' in item && Array.isArray((item as Cooking).ingredients) ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {(item as Cooking).ingredients.map((ing, idx) => (
                              <span 
                                key={`ing-${item.id}-${idx}`}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-tight border shadow-2xs bg-stone-50 dark:bg-stone-850 border-stone-200/50 dark:border-stone-800 text-stone-600 dark:text-stone-400"
                              >
                                <Soup className="h-2.5 w-2.5 shrink-0 text-amber-500 dark:text-amber-400" />
                                <span>{ing.replace(/\s+(\d+)$/, ' $1')}</span>
                              </span>
                            ))}
                          </div>
                        ) : 'locations' in item && Array.isArray((item as Fish).locations) ? (
                          <span className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-black block leading-tight line-clamp-2 text-center">
                            {(item as Fish).weather === 'Always' ? '🌤️' : (item as Fish).weather === 'Clear/Rainbow' ? '☀️' : (item as Fish).weather === 'Rain/Snow/Rainbow' ? '🌧️' : (item as Fish).weather === 'Rainbow' ? '🌈' : '🌊'} {(item as Fish).locations.join(', ')}
                          </span>
                        ) : (item as any).location ? (
                          <span className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-black block leading-tight text-center">
                            📍 {(item as any).location}
                          </span>
                        ) : null}
                      </div>
                    )}

                   {/* Change '고유기호식품' designation to '펫샵 구매' as explicitly requested */}
                    {isCustom && (
                      <span className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-black block mt-1.5 uppercase text-center tracking-wider">
                        { (item as CustomFood).location ? `📍 ${(item as CustomFood).location}` : '🛒 펫샵 구매' }
                      </span>
                    )}
                  </div>
                </div>

                {/* Highly readable actions segment with beautiful alignment */}
                <div className="flex flex-col gap-1.5 mt-3 pt-2.5 border-t border-stone-100/80 dark:border-stone-800/60">
                  <button
                    type="button"
                    onClick={() => handleToggleTried(item.id)}
                    className={cn(
                      "w-full flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-black active:scale-95 transition-all outline-none cursor-pointer border text-center shadow-xs",
                      isTried
                        ? "bg-sky-500 border-sky-500 text-white"
                        : "bg-stone-50 border-stone-150 hover:border-sky-300 text-stone-600 hover:text-sky-550 dark:bg-stone-950 dark:border-stone-850 dark:text-stone-300"
                    )}
                  >
                    {isTried ? '✅ 먹여봄' : '✅ 먹여보기'}
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePreference(item.id, 'like')}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-black active:scale-95 transition-all outline-none cursor-pointer border text-center",
                        pref === 'like'
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                          : "bg-stone-50 border-stone-150 hover:border-emerald-300 text-stone-600 hover:text-emerald-550 dark:bg-stone-950 dark:border-stone-850 dark:text-stone-300"
                      )}
                    >
                      🟢 좋아요
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePreference(item.id, 'dislike')}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-black active:scale-95 transition-all outline-none cursor-pointer border text-center",
                        pref === 'dislike'
                          ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                          : "bg-stone-50 border-stone-150 hover:border-rose-300 text-stone-600 hover:text-rose-550 dark:bg-stone-950 dark:border-stone-850 dark:text-stone-300"
                      )}
                    >
                      ❌ 싫어요
                    </button>
                  </div>
                </div>

                {/* Decorative Shimmer & Sparkles for Rainbow Cards */}
                {isRainbow && pref === 'neutral' && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/45 dark:via-white/15 to-transparent animate-shimmer" />
                    
                    {/* Subtle Sparkles */}
                    <Sparkles className="absolute top-3 left-[15%] h-2.5 w-2.5 text-white animate-sparkle drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]" style={{ animationDelay: '0.5s' }} />
                    <Sparkles className="absolute bottom-6 right-[20%] h-2 w-2 text-white animate-sparkle drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]" style={{ animationDelay: '1.2s' }} />
                    <Sparkles className="absolute top-1/2 right-3 h-3 w-3 text-white animate-sparkle drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]" style={{ animationDelay: '2.8s' }} />
                  </div>
                )}
              </motion.div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-center bg-stone-50/50 dark:bg-stone-900/30 rounded-xl border border-dashed border-stone-200 dark:border-stone-850">
              <span className="text-xs font-bold text-stone-400 dark:text-stone-500">
                조건에 맞는 음식을 찾을 수 없습니다. 다른 키워드로 검색해보세요!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Custom Alert/Confirm dialogs overlay */}
      <AnimatePresence>
        {customAlert && (
          <div key="custom-alert-dialog" className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 rounded-2xl p-5 max-w-sm w-full border border-stone-200 dark:border-stone-800 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2.5 text-amber-550">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-black text-stone-850 dark:text-stone-100">알림</h3>
              </div>
              <p className="text-xs font-bold text-stone-600 dark:text-stone-300 whitespace-pre-line leading-relaxed text-left">
                {customAlert}
              </p>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setCustomAlert(null)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {petToDelete && (
          <div key="pet-delete-dialog" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 rounded-2xl p-5 max-w-sm w-full border border-stone-200 dark:border-stone-800 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2.5 text-rose-500">
                <Trash2 className="h-5 w-5" />
                <h3 className="text-sm font-black text-stone-850 dark:text-stone-100">마이펫 삭제</h3>
              </div>
              <p className="text-xs font-bold text-stone-600 dark:text-stone-300 whitespace-pre-line leading-relaxed text-left">
                ‘{petToDelete.name}’ 의 먹이 설정 및 기록을 정말 삭제하시겠습니까?
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPetToDelete(null)}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 dark:bg-stone-800 dark:hover:bg-stone-750 dark:text-stone-300 font-extrabold rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPets(prev => prev.filter(p => p.id !== petToDelete.id));
                    markCollectionsModified?.();
                    debouncedSyncAllData?.();
                    setPetToDelete(null);
                  }}
                  className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
                >
                  삭제하기
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {petToEdit && (
          <div key="pet-edit-dialog" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 rounded-2xl p-5 max-w-sm w-full border border-stone-200 dark:border-stone-800 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2.5 text-amber-500">
                <Edit2 className="h-5 w-5" />
                <h3 className="text-sm font-black text-stone-850 dark:text-stone-100">마이펫 이름 수정</h3>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 block uppercase tracking-wider">
                  새로운 이름
                </label>
                <input
                  type="text"
                  value={editPetName}
                  onChange={e => setEditPetName(e.target.value)}
                  className="w-full text-xs font-black px-3 py-2 border rounded-xl bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 text-stone-800 dark:text-stone-150"
                  placeholder="이름을 입력해 주세요"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPetToEdit(null)}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 dark:bg-stone-800 dark:hover:bg-stone-750 dark:text-stone-300 font-extrabold rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editPetName.trim()) {
                      setCustomAlert('이름을 작성해주세요.');
                      return;
                    }
                    setPets(prev => prev.map(p => p.id === petToEdit.id ? { ...p, name: editPetName.trim() } : p));
                    markCollectionsModified?.();
                    debouncedSyncAllData?.();
                    setPetToEdit(null);
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
                >
                  수정하기
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {itemToRemove && activePet && (
          <div key="item-remove-dialog" className="fixed inset-0 z-[100] select-none">
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" aria-hidden="true" />
            <div className="fixed inset-0 overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-4 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-stone-900 rounded-2xl p-5 max-w-sm w-full border border-stone-200 dark:border-stone-800 shadow-xl space-y-4 text-left inline-block align-middle relative z-10"
                >
              <div className="flex items-center gap-2.5 text-rose-500">
                <Siren className="h-4.5 w-4.5 animate-pulse text-rose-500" />
                <h3 className="text-sm font-black text-stone-850 dark:text-stone-100">
                  {itemToRemove.name} 제거 요청
                </h3>
              </div>

              <div className="text-xs sm:text-sm font-bold leading-snug text-left">
                <p className="text-stone-600 dark:text-stone-300">제거하려는 사유를 선택해주세요.</p>
                <p className="text-rose-500 dark:text-rose-400 mt-0.5">제보하기 시 해당 아이템은 즉시 숨겨집니다.</p>
              </div>

              <div className="space-y-3">
                {/* Dropdown Menu */}
                <div className="text-left">
                  <div className="relative">
                    <select
                      value={removeReason}
                      onChange={(e) => setRemoveReason(e.target.value as any)}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs font-black text-stone-800 dark:text-stone-150 focus:outline-none focus:ring-2 focus:ring-rose-550/20 focus:border-rose-550 appearance-none cursor-pointer"
                    >
                      <option value="none">사유를 선택해 주세요</option>
                      <option value="not_eat">
                        {activePet.type === 'dog' ? '강아지' : '고양이'}가 먹지 않음
                      </option>
                      <option value="other">기타 사유</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Other Reason Text Input */}
                <AnimatePresence initial={false}>
                  {removeReason === 'other' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-left overflow-hidden mt-2"
                    >
                      <textarea
                        value={otherReasonText}
                        onChange={(e) => setOtherReasonText(e.target.value)}
                        placeholder="상세 사유를 입력해주세요."
                        rows={3}
                        className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs font-black text-stone-800 dark:text-stone-150 focus:outline-none focus:ring-2 focus:ring-rose-550/20 focus:border-rose-550 placeholder-stone-400 dark:placeholder-stone-600 resize-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSendingReport}
                  onClick={() => {
                    setItemToRemove(null);
                    setRemoveReason('none');
                    setOtherReasonText('');
                  }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 dark:bg-stone-850 dark:hover:bg-stone-800 dark:text-stone-300 font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={isSendingReport}
                  onClick={handleSendRemoveReport}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSendingReport ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>전송중...</span>
                    </>
                  ) : (
                    <span>제보하기</span>
                  )}
                </button>
              </div>
            </motion.div>
            </div>
            </div>
          </div>
        )}


        {toastMessage && (
          <motion.div
            key="toast-message"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-4 py-3 bg-stone-900/95 dark:bg-white/95 text-stone-100 dark:text-stone-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-2xl flex items-center gap-2.5 min-w-[280px] max-w-[90%] border border-stone-800 dark:border-stone-200"
          >
            <span className="text-sm">🏡</span>
            <span className="flex-1 text-left leading-tight">{toastMessage}</span>
            <button 
              type="button" 
              onClick={() => setToastMessage(null)}
              className="text-stone-400 hover:text-white dark:text-stone-500 dark:hover:text-stone-900 ml-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}

        {showHotelGuide && (
          <div key="hotel-guide" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 my-8 text-stone-900 dark:text-stone-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5.5 w-5.5 text-amber-500 shrink-0" />
                  <div>
                    <h3 className="text-base font-black text-stone-900 dark:text-stone-100 leading-tight">펫 보관하기 기능이 추가되었어요!</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('has_seen_pet_hotel_guide_v4', 'true');
                    setShowHotelGuide(false);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="space-y-2 text-left">
                  <p className="text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
                    잠시 제외하고 싶은 마이펫은 펫 호텔에 보관하여 목록에서 숨길 수 있습니다.
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-100 dark:border-rose-900/30 flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span>펫 호텔에 있는 동안에는 먹이 목록 확인이 불가하므로, 다시 집으로 데려온 뒤 확인해 주세요!</span>
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-800/80">
                  {/* Step 1: Sending to Hotel */}
                  <div className="space-y-2">
                    <p className="font-bold text-xs text-stone-500 dark:text-stone-400 text-left flex items-center gap-2">
                      <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">1</span>
                      펫호텔로 보내기
                    </p>
                    <div className="p-3 bg-stone-50 dark:bg-stone-950/25 border border-stone-200 dark:border-stone-850 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-955/40 text-amber-600 shrink-0 h-8 w-8 flex items-center justify-center">
                          <Dog className="h-4 w-4" />
                        </span>
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-800 dark:text-stone-100">돼지 (예시)</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">🟢 3</span>
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">❌ 1</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 bg-amber-500/10 dark:bg-amber-400/10 border-1.5 border-amber-500 text-amber-600 dark:text-amber-400 rounded-lg animate-pulse" title="펫호텔로 보내기">
                          <Bed className="h-3.5 w-3.5" />
                        </div>
                        <div className="p-1 text-stone-300 dark:text-stone-700 rounded-lg">
                          <Edit2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="p-1 text-stone-300 dark:text-stone-700 rounded-lg">
                          <Trash2 className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 text-left pl-7 leading-relaxed">
                      펫 카드의 <span className="font-bold text-stone-700 dark:text-stone-300">침대 아이콘</span>을 누르면 펫호텔로 이동하여 목록에서 보이지 않게 됩니다.
                    </p>
                  </div>

                  {/* Step 2: Retrieving from Hotel */}
                  <div className="space-y-2 pt-1">
                    <p className="font-bold text-xs text-stone-500 dark:text-stone-400 text-left flex items-center gap-2">
                      <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">2</span>
                      집으로 다시 데려오기
                    </p>
                    <div className="p-3 bg-stone-100/40 dark:bg-stone-900/30 border border-stone-200/60 dark:border-stone-800/60 opacity-80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-amber-100/50 dark:bg-amber-955/20 text-amber-600/70 shrink-0 h-8 w-8 flex items-center justify-center">
                          <Dog className="h-4 w-4" />
                        </span>
                        <div className="text-left">
                          <p className="text-xs font-black text-stone-500 dark:text-stone-400">돼지 (예시)</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-emerald-600/60 dark:text-emerald-400/60">🟢 3</span>
                            <span className="text-[10px] font-bold text-rose-600/60 dark:text-rose-400/60">❌ 1</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 bg-emerald-500/10 dark:bg-emerald-400/10 border-1.5 border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-lg animate-pulse" title="집으로 데려오기">
                          <Home className="h-3.5 w-3.5" />
                        </div>
                        <div className="p-1 text-stone-300 dark:text-stone-700 rounded-lg">
                          <Edit2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="p-1 text-stone-300 dark:text-stone-700 rounded-lg">
                          <Trash2 className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 text-left pl-7 leading-relaxed">
                      보관함에 있는 <span className="font-bold text-stone-700 dark:text-stone-300">집 아이콘</span>을 누르면 다시 원래 목록으로 돌아옵니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('has_seen_pet_hotel_guide_v4', 'true');
                    setShowHotelGuide(false);
                  }}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 font-bold rounded-xl text-sm active:scale-[0.98] transition-all cursor-pointer text-center"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
