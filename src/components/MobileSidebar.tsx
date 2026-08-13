import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bird, Bug, Fish, Soup, Flower, Sprout, Heart, Home, Settings, X, Ticket, Waves } from 'lucide-react';
import { cn } from '../lib/utils';
import Footer from './Footer';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  menuStatus: Record<string, { active: boolean; message?: string }>;
  allowedUids: string[];
  // Stats
  birdTotal: number;
  insectTotal: number;
  fishTotal: number;
  cookingTotal: number;
  completedBirdIds: Set<string>;
  completedInsectIds: Set<string>;
  completedFishIds: Set<string>;
  completedFoodIds: Set<string>;
  completedGardeningIds: Set<string>;
  // Handlers
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsDeleteAccountModalOpen: (open: boolean) => void;
  setDeleteConfirmText: (text: string) => void;
  setDeleteError: (error: string | null) => void;
  setIsSupportModalOpen: (open: boolean) => void;
  setIsContactModalOpen: (open: boolean) => void;
  user: any;
  GARDENING_ITEMS: any[];
  activeCouponsCount: number;
  activeEventId?: string;
  oceanCleaningTotal?: number;
  completedOceanCleaningIds?: Set<string>;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  activeCategory,
  setActiveCategory,
  menuStatus,
  allowedUids,
  birdTotal,
  insectTotal,
  fishTotal,
  cookingTotal,
  completedBirdIds,
  completedInsectIds,
  completedFishIds,
  completedFoodIds,
  completedGardeningIds,
  setIsSettingsModalOpen,
  setIsDeleteAccountModalOpen,
  setDeleteConfirmText,
  setDeleteError,
  setIsSupportModalOpen,
  setIsContactModalOpen,
  user,
  GARDENING_ITEMS,
  activeCouponsCount,
  activeEventId = '',
  oceanCleaningTotal = 0,
  completedOceanCleaningIds = new Set<string>(),
}) => {
  const isWhitelisted = user && allowedUids.includes(user.uid);

  const menuItems = [
    { id: 'home', label: '대시보드', icon: Home, total: null, completed: null, badge: null },
    { id: 'coupons', label: '두두타 리딤코드', icon: Ticket, total: null, completed: null, badge: activeCouponsCount > 0 ? activeCouponsCount : null },
    { id: 'divider_home', label: '---', icon: () => null, total: null, completed: null, badge: null },
    { id: 'birds', label: '새 도감', icon: Bird, total: birdTotal, completed: completedBirdIds.size, badge: null },
    { id: 'insects', label: '곤충 도감', icon: Bug, total: insectTotal, completed: completedInsectIds.size, badge: null },
    { id: 'fishing', label: '낚시 도감', icon: Fish, total: fishTotal, completed: completedFishIds.size, badge: null },
    { id: 'cooking', label: '요리 도감', icon: Soup, total: cookingTotal, completed: completedFoodIds.size, badge: null },
    { id: 'gardening', label: '원예/작물 도감', icon: Flower, total: GARDENING_ITEMS.length, completed: completedGardeningIds.size, badge: null },
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden flex">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-72 max-w-xs bg-white dark:bg-stone-900 h-full flex flex-col justify-between p-5 shadow-2xl z-[150] border-r border-neutral-100 dark:border-stone-850 transition-colors overflow-y-auto overscroll-contain"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-stone-800 pb-4">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:opacity-95"
                  onClick={() => {
                    setActiveCategory('home');
                    onClose();
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-stone-800 overflow-hidden border border-neutral-100 dark:border-stone-800/80">
                    <img src="/images/new_logo.png" alt="Logo" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-sm font-black text-neutral-900 dark:text-stone-200 leading-none">PIG TOWN</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-neutral-400 dark:text-stone-500">도감 & 작물 알림이</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-stone-800 text-neutral-400 dark:text-stone-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {menuItems.map(item => (
                  item.id === 'divider' || item.id === 'divider_home' ? (
                    <div key={item.id} className="h-px bg-stone-200 dark:bg-stone-800 my-3" />
                  ) : (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveCategory(item.id);
                        onClose();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer",
                        activeCategory === item.id 
                          ? "bg-slate-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm font-black" 
                          : "text-neutral-500 dark:text-stone-400 hover:bg-neutral-50 dark:hover:bg-stone-800/60"
                      )}
                    >
                      <span className="flex items-center gap-2.5 text-[12px] font-sans">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                        {'badge' in item && item.badge !== null && (
                          <span className="flex h-4 min-w-4 px-1.5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white ml-1">
                            {item.badge}
                          </span>
                        )}
                      </span>
                      {item.total !== null && (
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full font-mono",
                          activeCategory === item.id 
                            ? "bg-white/25 text-white dark:bg-stone-900/25 dark:text-stone-900 font-extrabold" 
                            : "bg-neutral-100 text-neutral-500 dark:bg-stone-800 dark:text-stone-400"
                        )}>
                          {item.completed}/{item.total}
                        </span>
                      )}
                    </button>
                  )
                ))}
              </nav>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    setIsSettingsModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black text-stone-600 dark:text-stone-300 bg-stone-100/50 hover:bg-stone-100 dark:bg-stone-950/40 dark:hover:bg-stone-950/80 border border-stone-200/50 dark:border-stone-850 shadow-xs transition-all active:scale-95 cursor-pointer group"
                >
                  <span className="flex items-center gap-2.5 font-sans">
                    <Settings className="h-4 w-4 text-stone-500 dark:text-stone-400 group-hover:rotate-12 transition-all shrink-0" />
                    환경 설정
                  </span>
                </button>
              </div>
            </div>

            <div className="border-t border-stone-200/40 dark:border-stone-800/85 pt-4">
              <Footer 
                onOpenPrivacy={() => {
                  onClose();
                  setActiveCategory('privacy');
                }} 
                onOpenTerms={() => {
                  onClose();
                  setActiveCategory('terms');
                }}
                user={user}
                onDeleteAccount={() => {
                  onClose();
                  setDeleteConfirmText('');
                  setDeleteError(null);
                  setIsDeleteAccountModalOpen(true);
                }} 
                onOpenSupport={() => {
                  onClose();
                  setIsSupportModalOpen(true);
                }}
                onOpenContact={() => {
                  onClose();
                  setIsContactModalOpen(true);
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
