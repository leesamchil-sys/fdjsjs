import { useState, useEffect, useRef } from 'react';

export function useLayoutUiState() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pig_town_sidebar_expanded');
      return saved ? saved === 'true' : true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem('pig_town_sidebar_expanded', String(isDesktopSidebarExpanded));
  }, [isDesktopSidebarExpanded]);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isProfileDropdownOpen) return;

    const handleGlobalClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleGlobalClick);
      document.addEventListener('touchstart', handleGlobalClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [isProfileDropdownOpen]);

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const isMapPermalinkOnStartup = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/map=') || 
    window.location.pathname === '/map' || 
    window.location.pathname.startsWith('/map/')
  );

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (isMapPermalinkOnStartup) return false;
    const hasSeenWelcome = localStorage.getItem('has_seen_pigtown_welcome');
    const hasSeenGuide = localStorage.getItem('has_seen_pigtown_guide');
    return !hasSeenWelcome && !hasSeenGuide;
  });

  const [isRecInfoOpen, setIsRecInfoOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [isSharedLinkView, setIsSharedLinkView] = useState(false);
  const [initialMapId, setInitialMapId] = useState<string>('town');
  const [initialLocationKey, setInitialLocationKey] = useState<string>('');
  const wasOpenedViaUrlRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  return {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isDesktopSidebarExpanded,
    setIsDesktopSidebarExpanded,
    isProfileDropdownOpen,
    setIsProfileDropdownOpen,
    isGuideOpen,
    setIsGuideOpen,
    isWelcomeOpen,
    setIsWelcomeOpen,
    isRecInfoOpen,
    setIsRecInfoOpen,
    isMapOpen,
    setIsMapOpen,
    isIngredientModalOpen,
    setIsIngredientModalOpen,
    isSharedLinkView,
    setIsSharedLinkView,
    initialMapId,
    setInitialMapId,
    initialLocationKey,
    setInitialLocationKey,
    wasOpenedViaUrlRef,
    isInitialLoadRef,
  };
}
