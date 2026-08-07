import React, { Suspense } from 'react';
import { motion } from 'motion/react';
import { Hammer } from 'lucide-react';
import { Pet } from '../types';
import { HomeTabContent } from './tabs/HomeTabContent';
import { CropsTabContent } from './tabs/CropsTabContent';
import { GardeningTabContent } from './tabs/GardeningTabContent';
import { PetFoodTabContent } from './tabs/PetFoodTabContent';
import { TrendChecklistTabContent } from './tabs/TrendChecklistTabContent';
import { CouponsTabContent } from './tabs/CouponsTabContent';
import { BirdTabContent } from './tabs/BirdTabContent';
import { InsectTabContent } from './tabs/InsectTabContent';
import { FishingTabContent } from './tabs/FishingTabContent';
import { CookingTabContent } from './tabs/CookingTabContent';
import { OceanCleaningTabContent } from './tabs/OceanCleaningTabContent';
import { PrivacyTabContent } from './tabs/PrivacyTabContent';
import { TermsTabContent } from './tabs/TermsTabContent';

interface CategoryViewProps {
  activeCategory: string;
  user: any;
  allowedUids: string[];
  menuStatus: Record<string, { active: boolean; message?: string }>;
  completedBirdIds: Set<string>;
  completedInsectIds: Set<string>;
  completedFishIds: Set<string>;
  completedFoodIds: Set<string>;
  masterBirdIds: Set<string>;
  masterInsectIds: Set<string>;
  masterFishIds: Set<string>;
  masterFoodIds: Set<string>;
  completedFlowerIds: Set<string>;
  completedCropIds: Set<string>;
  completedGardeningIds: Set<string>;
  masterGardeningIds: Set<string>;
  birdTotal: number;
  insectTotal: number;
  fishTotal: number;
  cookingTotal: number;
  gardeningTotal: number;
  cropTotal: number;
  pets: any[];
  ratings: any;
  handleSetCategory: (cat: string) => void;
  handleGoogleLogin: (bypass: boolean) => void;
  setIsContactModalOpen: (open: boolean) => void;
  setIsTimerModalOpen: (open: boolean) => void;
  setIsPermissionDeniedError: (err: boolean) => void;
  setIsQuotaExceededError: (err: boolean) => void;
  toggleGardeningCompletion: (id: string, cat: string) => void;
  toggleGardeningMaster: (id: string, cat: string) => void;
  handleRate: (id: string, rating: number) => void;
  MAX_DISPLAY_LEVEL: number;
  gardeningSubTab: string;
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  markCollectionsModified: () => void;
  debouncedSyncAllData: (delay?: number) => void;
  getGlobalSyncRemainingTime?: () => number | null;
  onFarmingSyncScheduled?: (targetTime: number, isPending: boolean) => void;
  onCropCompleted?: (completedSlots: any[]) => void;
  currentTime: any;
  currentGameWeather: any;
  isInitialSyncDone?: boolean;
  toggleCompletion: (id: string, cat: string) => void;
  toggleMaster: (id: string, cat: string) => void;
  setIsCollectionModalOpen: (open: boolean) => void;
  currentCategoryCompleted: number;
  currentCategoryTotal: number;
  setBulkInput: (val: string) => void;
  bulkInput: string;
  setIsRecInfoOpen: (open: boolean) => void;
  isRecInfoOpen?: boolean;
  handleLogout: () => Promise<void>;
  setIsWeatherModalOpen?: (open: boolean) => void;
  activeCouponsCount?: number;
  onOpenSeasonalModal?: () => void;
  activeSeasonIds?: string[];
  showSeasonalBanner?: boolean;
  birds: any[];
  insects: any[];
  fish: any[];
  cooking: any[];
  gardeningItems: any[];
  cropPresets: any[];
  completedOceanCleaningIds?: Set<string>;
  masterOceanCleaningIds?: Set<string>;
  oceanCleaningTotal?: number;
  oceanCleaning?: any[];
  onLocationClick?: (locationName: string, itemName: string) => void;
  highlightedItemName?: string;
  onIngredientModalChange?: (open: boolean) => void;
  flowerColorCollections?: Record<string, Record<string, boolean>>;
  onToggleFlowerColor?: (itemId: string, variantKey: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  home: '대시보드',
  birds: '새 도감',
  insects: '곤충 도감',
  fishing: '낚시 도감',
  cooking: '요리 도감',
  gardening: '원예/작물 도감',
  crops: '작물&맞춤형 알림',
  petfood: '펫 먹이 찾기',
  trend_checklist: '트렌드상점 체크리스트',
  coupons: '리딤코드',
  privacy: '개인정보처리방침',
  terms: '이용약관',
  ocean_cleaning: '바다청소 도감'
};

const MenuDisabledScreen: React.FC<{ message?: string; title: string; onGoHome: () => void }> = ({ message, title, onGoHome }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-[75vh] p-8 text-center"
  >
    <div className="w-24 h-24 bg-amber-50 dark:bg-amber-950/30 rounded-[40px] flex items-center justify-center mb-8 shadow-2xl shadow-amber-500/10 border border-amber-100 dark:border-amber-900/50">
      <Hammer className="h-12 w-12 text-amber-500 animate-pulse" />
    </div>
    <h2 className="text-3xl font-black text-slate-900 dark:text-stone-100 mb-4 tracking-tighter">
      페이지 점검 중
    </h2>
    <p className="text-stone-500 dark:text-stone-400 font-bold text-base leading-relaxed max-w-sm whitespace-pre-wrap">
      {message || "원활한 서비스 이용을 위해 해당 메뉴를 정비하고 있습니다.\n최대한 빠른 시일 내에 다시 안정적인 서비스를 제공해 드리겠습니다."}
    </p>
    
    <button 
      onClick={onGoHome}
      className="mt-10 px-8 py-4 bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
    >
      홈으로 이동
    </button>
  </motion.div>
);

export const CategoryView: React.FC<CategoryViewProps> = React.memo((props) => {
  const { activeCategory, menuStatus, allowedUids, user, handleSetCategory } = props;

  const status = menuStatus[activeCategory];
  const isDisabled = status?.active === false;
  const isWhitelisted = user && allowedUids.includes(user.uid);
  const shouldBlock = isDisabled && !isWhitelisted;

  if (shouldBlock) {
    return (
      <MenuDisabledScreen 
        message={status?.message} 
        title={CATEGORY_LABELS[activeCategory] || activeCategory}
        onGoHome={() => handleSetCategory('home')}
      />
    );
  }

  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[50vh]">
        <div className="relative w-8 h-8 mb-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-stone-200 dark:border-stone-800" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-stone-800 dark:border-t-stone-200 animate-spin" />
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium tracking-tight">화면을 준비하는 중입니다...</p>
      </div>
    }>
      {activeCategory === 'home' && <HomeTabContent {...props} />}
      <div className={activeCategory === 'crops' ? 'flex flex-col flex-1 min-h-0 w-full h-full' : 'hidden'}>
        <CropsTabContent {...props} />
      </div>
      {activeCategory === 'gardening' && <GardeningTabContent {...props} />}
      {activeCategory === 'petfood' && <PetFoodTabContent {...props} />}
      {activeCategory === 'trend_checklist' && <TrendChecklistTabContent {...props} />}
      {activeCategory === 'coupons' && <CouponsTabContent {...props} />}
      {activeCategory === 'birds' && <BirdTabContent {...props} />}
      {activeCategory === 'insects' && <InsectTabContent {...props} />}
      {activeCategory === 'fishing' && <FishingTabContent {...props} />}
      {activeCategory === 'cooking' && <CookingTabContent {...props} />}
      {activeCategory === 'ocean_cleaning' && <OceanCleaningTabContent {...props} />}
      {activeCategory === 'privacy' && <PrivacyTabContent {...props} />}
      {activeCategory === 'terms' && <TermsTabContent {...props} />}
    </Suspense>
  );
});
