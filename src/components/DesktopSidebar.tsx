import React from 'react';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, Home, Bird as BirdIcon, Bug, Fish as FishIcon, Soup, Flower, Sprout, Heart, Settings, Ticket, Waves } from 'lucide-react';
import { Category } from '../types';
import Footer from './Footer';

interface DesktopSidebarProps {
  isSidebarInteracting: boolean;
  setIsSidebarInteracting: (interacting: boolean) => void;
  isDesktopSidebarExpanded: boolean;
  setIsDesktopSidebarExpanded: (expanded: boolean) => void;
  activeCategory: Category;
  setActiveCategory: (category: Category) => void;
  menuStatus: Record<string, { active: boolean; message?: string }>;
  allowedUids: string[];
  birdTotal: number;
  completedBirdIds: Set<string>;
  insectTotal: number;
  completedInsectIds: Set<string>;
  fishTotal: number;
  completedFishIds: Set<string>;
  cookingTotal: number;
  completedFoodIds: Set<string>;
  completedGardeningIds: Set<string>;
  gardeningItemsLength: number;
  user: any;
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsDeleteAccountModalOpen: (open: boolean) => void;
  setIsSupportModalOpen: (open: boolean) => void;
  setIsContactModalOpen: (open: boolean) => void;
  setDeleteConfirmText: (text: string) => void;
  setDeleteError: (error: string | null) => void;
  activeCouponsCount: number;
  isModalActive?: boolean;
  activeEventId?: string;
  oceanCleaningTotal?: number;
  completedOceanCleaningIds?: Set<string>;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isSidebarInteracting,
  setIsSidebarInteracting,
  isDesktopSidebarExpanded,
  setIsDesktopSidebarExpanded,
  activeCategory,
  setActiveCategory,
  menuStatus,
  allowedUids,
  birdTotal,
  completedBirdIds,
  insectTotal,
  completedInsectIds,
  fishTotal,
  completedFishIds,
  cookingTotal,
  completedFoodIds,
  completedGardeningIds,
  gardeningItemsLength,
  user,
  setIsSettingsModalOpen,
  setIsDeleteAccountModalOpen,
  setIsSupportModalOpen,
  setIsContactModalOpen,
  setDeleteConfirmText,
  setDeleteError,
  activeCouponsCount,
  isModalActive = false,
  activeEventId = '',
  oceanCleaningTotal = 0,
  completedOceanCleaningIds = new Set<string>(),
}) => {
  const isWhitelisted = user && allowedUids.includes(user.uid);

  const menuItems = [
    { id: 'home', label: '대시보드', icon: Home, total: null, completed: null, badge: null },
    { id: 'coupons', label: '두두타 리딤코드', icon: Ticket, total: null, completed: null, badge: activeCouponsCount > 0 ? activeCouponsCount : null },
    { id: 'divider_home', label: '---', icon: () => null, total: null, completed: null, badge: null },
    { id: 'birds', label: '새 도감', icon: BirdIcon, total: birdTotal, completed: completedBirdIds.size, badge: null },
    { id: 'insects', label: '곤충 도감', icon: Bug, total: insectTotal, completed: completedInsectIds.size, badge: null },
    { id: 'fishing', label: '낚시 도감', icon: FishIcon, total: fishTotal, completed: completedFishIds.size, badge: null },
    { id: 'cooking', label: '요리 도감', icon: Soup, total: cookingTotal, completed: completedFoodIds.size, badge: null },
    { id: 'gardening', label: '원예/작물 도감', icon: Flower, total: gardeningItemsLength, completed: completedGardeningIds.size, badge: null },
    ...(activeEventId === 'event_1' ? [
      { id: 'ocean_cleaning' as const, label: '바다청소 도감', icon: Waves, total: oceanCleaningTotal, completed: completedOceanCleaningIds.size, badge: null }
    ] : []),
    { id: 'divider', label: '---', icon: () => null, total: null, completed: null, badge: null },
    { id: 'crops', label: '작물&맞춤형 알림', icon: Sprout, total: null, completed: null, badge: null },
    { id: 'petfood', label: '펫 먹이 찾기', icon: Heart, total: null, completed: null, badge: null }
  ].filter(item => {
    if (item.id.startsWith('divider')) return true;
    const status = menuStatus[item.id];
    if (status?.active === false && !isWhitelisted) return false;
    return true;
  });

  return (
    <div 
      onMouseEnter={() => setIsSidebarInteracting(true)}
      onMouseLeave={() => setIsSidebarInteracting(false)}
      onTouchStart={() => setIsSidebarInteracting(true)}
      onTouchEnd={() => setIsSidebarInteracting(false)}
      onTouchCancel={() => setIsSidebarInteracting(false)}
      className={cn(
        "border-r border-stone-200/50 dark:border-stone-850 bg-white/70 dark:bg-stone-900/60 backdrop-blur-md h-screen fixed left-0 top-0 hidden lg:flex flex-col shrink-0 transition-all duration-300 font-scale-lock group",
        isModalActive ? "z-[20] pointer-events-none" : "z-[60]",
        isDesktopSidebarExpanded ? "w-64" : "w-[76px]"
      )}
    >
      <button
        onClick={() => setIsDesktopSidebarExpanded(!isDesktopSidebarExpanded)}
        className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white dark:bg-stone-900 border border-l-0 border-stone-200/50 dark:border-stone-800 shadow-sm rounded-r-2xl py-4 flex items-center justify-center w-4 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 z-50 cursor-pointer"
        title={isDesktopSidebarExpanded ? "사이드바 접기" : "사이드바 펼치기"}
      >
        {isDesktopSidebarExpanded ? <ChevronLeft className="w-3.5 h-3.5 shrink-0 -ml-1" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 -ml-1" />}
      </button>

      <div className={cn(
        "flex flex-col h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain",
        isDesktopSidebarExpanded ? "px-4 py-4" : "px-2 py-4 items-center"
      )}>
        <div className="space-y-6 w-full flex-1 flex flex-col">
          <div 
            onClick={() => setActiveCategory('home')}
            className={cn(
              "flex items-center gap-2.5 py-3 border-b border-neutral-100 dark:border-stone-800 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all",
              isDesktopSidebarExpanded ? "px-2" : "px-0 justify-center w-full"
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-stone-800 text-white shadow-lg shadow-slate-900/10 dark:shadow-none overflow-hidden border border-stone-100 dark:border-stone-800/50 shrink-0">
              <img src="/images/new_logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            {isDesktopSidebarExpanded && (
              <div className="min-w-0">
                <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-stone-100 leading-none truncate">PIG TOWN</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 block uppercase tracking-widest leading-none truncate">도감 & 작물 재배 알림이</span>
                </div>
              </div>
            )}
          </div>

          <nav className="space-y-2 w-full">
            {menuItems.map(item => (
              item.id === 'divider' || item.id === 'divider_home' ? (
                <div key={item.id} className="h-px bg-stone-200 dark:bg-stone-800 my-4" />
              ) : (
                <button
                  key={item.id}
                  onClick={() => setActiveCategory(item.id)}
                  title={!isDesktopSidebarExpanded ? item.label : undefined}
                  className={cn(
                    "w-full flex items-center py-2 rounded-lg text-sm font-medium transition-all group",
                    isDesktopSidebarExpanded ? "px-3 justify-between" : "px-0 justify-center",
                    activeCategory === item.id 
                      ? "bg-slate-900 text-white dark:bg-stone-100 dark:text-stone-900 font-extrabold" 
                      : "text-stone-600 hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-800"
                  )}
                >
                  <div className="flex items-center gap-3 relative">
                    <div className="relative">
                      <item.icon className={cn("w-5 h-5 shrink-0", activeCategory === item.id ? "text-amber-400" : "text-stone-400")} />
                      {!isDesktopSidebarExpanded && 'badge' in item && item.badge !== null && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white border border-white dark:border-stone-900">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {isDesktopSidebarExpanded && (
                      <div className="flex items-center gap-2">
                        <span className="truncate">{item.label}</span>
                        {'badge' in item && item.badge !== null && (
                          <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {isDesktopSidebarExpanded && item.total !== null && (
                    <span className="text-[10px] font-bold opacity-60">
                      {item.completed} / {item.total}
                    </span>
                  )}
                </button>
              )
            ))}
          </nav>
          
          <div className="mt-auto pt-4 pb-2">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              title={!isDesktopSidebarExpanded ? '환경 설정' : undefined}
              className={cn(
                "w-full flex items-center py-2 rounded-lg text-sm font-medium transition-all cursor-pointer group",
                isDesktopSidebarExpanded ? "px-3 gap-3" : "px-0 justify-center",
                "text-stone-600 hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-800"
              )}
            >
              <Settings className="h-4 w-4 text-stone-500 dark:text-stone-400 group-hover:rotate-12 transition-all shrink-0" />
              {isDesktopSidebarExpanded && "환경 설정"}
            </button>
          </div>
        </div>

        {isDesktopSidebarExpanded && (
          <div className="mt-4 pt-4 border-t border-stone-200/50 dark:border-stone-800">
            <Footer 
              onOpenPrivacy={() => setActiveCategory('privacy')} 
              onOpenTerms={() => setActiveCategory('terms')}
              user={user} 
              onDeleteAccount={() => {
                setDeleteConfirmText('');
                setDeleteError(null);
                setIsDeleteAccountModalOpen(true);
              }} 
              onOpenSupport={() => setIsSupportModalOpen(true)}
              onOpenContact={() => setIsContactModalOpen(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
