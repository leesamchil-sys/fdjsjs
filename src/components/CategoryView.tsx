import React from 'react';
import HomeDashboard from './HomeDashboard';
import CropTimer from './CropTimer';
import GardeningGuide from './GardeningGuide';
import PetFoodFinder from './PetFoodFinder';
import EncyclopediaSection from './EncyclopediaSection';
import PrivacyPolicyInner from './PrivacyPolicyInner';
import TermsOfServiceInner from './TermsOfServiceInner';
import CouponSection from './CouponSection';
import { motion } from 'motion/react';
import { AlertCircle, Hammer } from 'lucide-react';
import { Bird, Insect, Fish, Cooking, Pet } from '../types';

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
  debouncedSyncAllData: () => void;
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
  // Data props
  birds: any[];
  insects: any[];
  fish: any[];
  cooking: any[];
  gardeningItems: any[];
  cropPresets: any[];
  completedOceanCleaningIds?: Set<string>;
  masterOceanCleaningIds?: Set<string>;
  oceanCleaning?: any[];
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

export const CategoryView: React.FC<CategoryViewProps> = (props) => {
  const { activeCategory, menuStatus, allowedUids, user, handleSetCategory } = props;

  // Check if current category is disabled
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
    <>
      <div className={activeCategory === 'home' ? "block" : "hidden"}>
        <HomeDashboard 
          user={props.user}
          allowedUids={props.allowedUids}
          completedBirdIds={props.completedBirdIds}
          completedInsectIds={props.completedInsectIds}
          completedFishIds={props.completedFishIds}
          completedFoodIds={props.completedFoodIds}
          masterBirdIds={props.masterBirdIds}
          masterInsectIds={props.masterInsectIds}
          masterFishIds={props.masterFishIds}
          masterFoodIds={props.masterFoodIds}
          masterGardeningIds={props.masterGardeningIds}
          ratings={props.ratings}
          birdTotal={props.birdTotal}
          insectTotal={props.insectTotal}
          fishTotal={props.fishTotal}
          cookingTotal={props.cookingTotal}
          completedFlowerIds={props.completedFlowerIds}
          completedCropIds={props.completedCropIds}
          gardeningTotal={props.gardeningTotal}
          cropTotal={props.cropTotal}
          setActiveCategory={props.handleSetCategory}
          pets={props.pets}
          onSyncError={(type) => {
            if (type === 'permission') props.setIsPermissionDeniedError(true);
            else if (type === 'quota') props.setIsQuotaExceededError(true);
          }}
          isActive={activeCategory === 'home'}
          activeCouponsCount={props.activeCouponsCount}
          birds={props.birds}
          insects={props.insects}
          fish={props.fish}
          cooking={props.cooking}
          gardeningItems={props.gardeningItems}
        />
      </div>

      <div className={activeCategory === 'crops' ? "block" : "hidden"}>
        <CropTimer 
          onReportClick={() => props.setIsContactModalOpen(true)}
          onLoginClick={() => props.handleGoogleLogin(true)}
          onOpenStateChange={props.setIsTimerModalOpen}
          onLogout={props.handleLogout}
          onSyncError={(type) => {
            if (type === 'permission') props.setIsPermissionDeniedError(true);
            else if (type === 'quota') props.setIsQuotaExceededError(true);
          }}
          isInitialSyncDone={props.isInitialSyncDone}
          isActive={activeCategory === 'crops'}
          cropPresets={props.cropPresets}
        />
      </div>

      {activeCategory === 'gardening' && (
        <GardeningGuide 
          completedIds={props.completedGardeningIds}
          masterIds={props.masterGardeningIds}
          onToggleCompletion={props.toggleGardeningCompletion}
          onToggleMaster={props.toggleGardeningMaster}
          ratings={props.ratings}
          onRate={props.handleRate}
          maxLevel={props.MAX_DISPLAY_LEVEL}
          initialTab={props.gardeningSubTab}
          onOpenSeasonalModal={props.onOpenSeasonalModal}
          activeSeasonIds={props.activeSeasonIds}
          showSeasonalBanner={props.showSeasonalBanner}
        />
      )}

      <div className={activeCategory === 'petfood' ? "block" : "hidden"}>
        <PetFoodFinder 
          pets={props.pets} 
          setPets={(newPets) => {
            props.setPets(newPets);
            props.markCollectionsModified();
            if (props.user) props.debouncedSyncAllData();
          }} 
          key={props.user?.uid || 'guest'} 
        />
      </div>

      {activeCategory === 'coupons' && (
        <CouponSection 
          user={props.user} 
          allowedUids={props.allowedUids} 
        />
      )}

      {activeCategory !== 'crops' && activeCategory !== 'petfood' && activeCategory !== 'home' && activeCategory !== 'gardening' && activeCategory !== 'privacy' && activeCategory !== 'terms' && activeCategory !== 'coupons' && (
        <EncyclopediaSection
          activeCategory={props.activeCategory}
          currentTime={props.currentTime}
          currentGameWeather={props.currentGameWeather}
          completedBirdIds={props.completedBirdIds}
          completedInsectIds={props.completedInsectIds}
          completedFishIds={props.completedFishIds}
          completedFoodIds={props.completedFoodIds}
          completedOceanCleaningIds={props.completedOceanCleaningIds}
          masterBirdIds={props.masterBirdIds}
          masterInsectIds={props.masterInsectIds}
          masterFishIds={props.masterFishIds}
          masterFoodIds={props.masterFoodIds}
          masterOceanCleaningIds={props.masterOceanCleaningIds}
          ratings={props.ratings}
          toggleCompletion={props.toggleCompletion}
          toggleMaster={props.toggleMaster}
          handleRate={props.handleRate}
          setIsCollectionModalOpen={props.setIsCollectionModalOpen}
          currentCategoryCompleted={props.currentCategoryCompleted}
          currentCategoryTotal={props.currentCategoryTotal}
          setBulkInput={props.setBulkInput}
          bulkInput={props.bulkInput}
          setIsRecInfoOpen={props.setIsRecInfoOpen}
          isRecInfoOpen={props.isRecInfoOpen}
          setIsWeatherModalOpen={props.setIsWeatherModalOpen}
          birds={props.birds}
          insects={props.insects}
          fish={props.fish}
          cooking={props.cooking}
          oceanCleaning={props.oceanCleaning}
          onOpenSeasonalModal={props.onOpenSeasonalModal}
          activeSeasonIds={props.activeSeasonIds}
          showSeasonalBanner={props.showSeasonalBanner}
        />
      )}

      {activeCategory === 'privacy' && <PrivacyPolicyInner />}
      {activeCategory === 'terms' && <TermsOfServiceInner />}
    </>
  );
};
