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
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
  Edit2,
  X
} from 'lucide-react';
import { FISHING } from '../data/fishing';
import { COOKING } from '../data/cooking';
import { getExistingImagePath } from '../lib/appHelpers';
import { cn } from '../lib/utils';
import { Fish, Cooking, Pet } from '../types';
import { useBackDismiss } from '../hooks/useBackDismiss';

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
  { id: 'raw-apple', name: '사과', image: '/images/cooking/사과.png', source: 'custom', ingredients: ['-'], location: '7 - 12구역' },
  { id: 'raw-neutari', name: '느타리 버섯', image: '/images/cooking/느타리버섯.png', source: 'custom', ingredients: ['-'], location: '온천산' },
  { id: 'raw-yangsongi', name: '양송이 버섯', image: '/images/cooking/양송이버섯.png', source: 'custom', ingredients: ['-'], location: '꽃밭' },
  { id: 'raw-pyogo', name: '표고 버섯', image: '/images/cooking/표고버섯.png', source: 'custom', ingredients: ['-'], location: '어촌' },
  { id: 'raw-geumul', name: '그물 버섯', image: '/images/cooking/그물버섯.png', source: 'custom', ingredients: ['-'], location: '숲' },
];

const CUSTOM_DOG_FOODS: CustomFood[] = [
  { id: 'custom-dog-food', name: '강아지 전용 사료', image: '/images/cooking/강아지 사료.png', source: 'custom' },
  { id: 'custom-common-food', name: '동물 공용 음식', image: '/images/cooking/동물 공용 음식.png', source: 'custom' }
];

const CUSTOM_CAT_FOODS: CustomFood[] = [
  { id: 'custom-cat-food', name: '고양이 전용 사료', image: '/images/cooking/고양이 사료.png', source: 'custom' },
  { id: 'custom-common-food', name: '동물 공용 음식', image: '/images/cooking/동물 공용 음식.png', source: 'custom' }
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
  "황금 킹크랩찜"
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
  "큰진주조개",
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
  "개복치"
];

interface PetFoodFinderProps {
  pets: Pet[];
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  key?: string | number;
}

export default function PetFoodFinder({ pets, setPets }: PetFoodFinderProps) {
  const [activePetId, setActivePetId] = useState<string>(() => {
    if (pets.length > 0) return pets[0].id;
    return '';
  });

  const [newPetName, setNewPetName] = useState('');
  // Set default type to null (unselected)
  const [newPetType, setNewPetType] = useState<'dog' | 'cat' | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPreference, setFilterPreference] = useState<'all' | 'tried' | 'notTried' | 'like' | 'dislike'>('all');
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  // Custom alert and confirm states to fix sandbox iframe blocks
  const [customAlert, setCustomAlert] = useState<string | null>(null);
  const [petToDelete, setPetToDelete] = useState<{ id: string; name: string } | null>(null);
  const [petToEdit, setPetToEdit] = useState<{ id: string; name: string } | null>(null);
  const [editPetName, setEditPetName] = useState('');

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useBackDismiss(showAddForm, () => setShowAddForm(false), 'petFoodAddForm');
  useBackDismiss(showDropdown, () => setShowDropdown(false), 'petFoodDropdown');
  useBackDismiss(!!customAlert, () => setCustomAlert(null), 'petFoodAlert');
  useBackDismiss(!!petToDelete, () => setPetToDelete(null), 'petFoodDeleteConfirm');
  useBackDismiss(!!petToEdit, () => setPetToEdit(null), 'petFoodEditForm');

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

  const activePet = pets.find(p => p.id === activePetId) || pets[0];

  const handleSelectPet = (id: string) => {
    setActivePetId(id);
  };

  useEffect(() => {
    // If current active pet is gone (due to delete or restore), switch to first available
    if (pets.length > 0 && !pets.some(p => p.id === activePetId)) {
      setActivePetId(pets[0].id);
    } else if (pets.length === 0 && activePetId !== '') {
      setActivePetId('');
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

  const handleTogglePreference = (itemId: string, direction: 'like' | 'dislike') => {
    if (!activePet) return;

    setPets(prev => prev.map(p => {
      if (p.id !== activePet.id) return p;

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
  };

  const handleToggleTried = (itemId: string) => {
    if (!activePet) return;

    setPets(prev => prev.map(p => {
      if (p.id !== activePet.id) return p;

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
  };



  const getFilteredItems = () => {
    if (!activePet) return [];

    const isCat = activePet.type === 'cat';
    const targets = isCat ? CAT_FOOD_TARGETS : DOG_FOOD_TARGETS;

    const list: Array<CustomFood | Fish | Cooking> = targets.map(targetName => {
      const normTarget = normalizeName(targetName);
      
      if (isCat) {
        if (normTarget === '고양이전용사료' || normTarget === '고양이사료') {
          return { id: 'custom-cat-food', name: '고양이 전용 사료', image: '/images/cooking/고양이 사료.png', source: 'custom' };
        }
        if (normTarget === '동물공용음식' || normTarget === '공용사료') {
          return { id: 'custom-common-food', name: '동물 공용 음식', image: '/images/cooking/동물 공용 음식.png', source: 'custom' };
        }
        const foundFish = FISHING.find(f => normalizeName(f.name) === normTarget);
        if (foundFish) {
          return { ...foundFish, name: targetName };
        }
      } else {
        if (normTarget === '강아지전용사료' || normTarget === '강아지사료') {
          return { id: 'custom-dog-food', name: '강아지 전용 사료', image: '/images/cooking/강아지 사료.png', source: 'custom' };
        }
        if (normTarget === '동물공용음식' || normTarget === '공용사료') {
          return { id: 'custom-common-food', name: '동물 공용 음식', image: '/images/cooking/동물 공용 음식.png', source: 'custom' };
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

    let filtered = list.filter(item => {
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

    return filtered;
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
                  placeholder="아이의 이름을 입력해 주세요 (예: 초코)"
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
          {pets.length > 0 && (
            <span className="text-xs font-extrabold text-amber-500 dark:text-amber-400 tracking-wide block mb-3.5">
              🐾 등록된 마이펫 목록
            </span>
          )}

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
            <div className="flex flex-col gap-2">
              <div className="max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                  {pets.map(p => {
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
                          setPetToEdit({ id: p.id, name: p.name });
                          setEditPetName(p.name);
                        }}
                        className="p-1 text-stone-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-955/20 rounded-lg transition-all cursor-pointer"
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
                        className="p-1 text-stone-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg transition-all cursor-pointer"
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
        </div>
      </div>

      {/* Row C: STICKY Selected Pet Filter & Search controls */}
      {activePet && (
        <div 
          ref={stickyHeaderRef}
          className="sticky top-[var(--sticky-top-mobile,56px)] lg:top-[var(--sticky-top-desktop,0px)] z-[50] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-3 bg-neutral-50/95 dark:bg-stone-955/95 backdrop-blur-md border-b border-stone-200/35 dark:border-stone-850/50 shadow-xs transition-all mb-4 font-sans"
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
                              {pets.map(p => {
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
                                  {pets.map(p => {
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
            
            let imgUrl: string | null = null;
            if (isCustom && 'image' in item) {
              imgUrl = (item as CustomFood).image;
            } else {
              imgUrl = getExistingImagePath(activePet.type === 'dog' ? 'cooking' : 'fishing', item.name);
            }

            return (
              <motion.div
                key={item.id}
                layout
                className={cn(
                  "group relative overflow-hidden rounded-2xl transition-all p-3 sm:p-4 flex flex-col justify-between select-none shadow-[xs] border",
                  pref === 'neutral' && !isRainbow && "bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-850/80 hover:border-stone-300 dark:hover:border-stone-750",
                  pref === 'neutral' && isRainbow && "border-zinc-300 dark:border-slate-700 bg-gradient-to-r from-rose-200/40 via-amber-200/40 via-emerald-200/40 via-sky-200/40 via-indigo-200/40 to-rose-200/40 dark:from-slate-900 dark:via-rose-900/25 dark:via-amber-900/25 dark:via-emerald-900/25 dark:via-sky-900/25 dark:via-indigo-900/25 dark:to-slate-900 bg-[length:400%_400%] animate-rainbow shadow-zinc-100/10 dark:shadow-slate-950/40 text-zinc-950 dark:text-slate-100",
                  pref === 'like' && "bg-emerald-50/85 dark:bg-emerald-950/20 border-emerald-300/85 dark:border-emerald-800/40 ring-1 ring-emerald-400/30",
                  pref === 'dislike' && "bg-rose-50/85 dark:bg-rose-950/20 border-rose-300/85 dark:border-rose-800/40 ring-1 ring-rose-400/30"
                )}
              >
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
                        {activePet.type === 'dog' ? (
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
                        ) : (
                          <span className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-black block leading-tight line-clamp-2 text-center">
                            {(item as Fish).weather === 'Always' ? '🌤️' : (item as Fish).weather === 'Clear/Rainbow' ? '☀️' : (item as Fish).weather === 'Rain/Snow/Rainbow' ? '🌧️' : (item as Fish).weather === 'Rainbow' ? '🌈' : '🌊'} {(item as Fish).locations.join(', ')}
                          </span>
                        )}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
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
      </AnimatePresence>
    </div>
  );
}
