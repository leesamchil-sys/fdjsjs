import { useState, useEffect, useRef } from 'react';
import { Category } from '../types';

interface UseScrollAndFilterStateParams {
  isProfileDropdownOpen: boolean;
  activeCategory: Category;
}

export function useScrollAndFilterState({
  isProfileDropdownOpen,
  activeCategory,
}: UseScrollAndFilterStateParams) {
  const [isSidebarInteracting, setIsSidebarInteracting] = useState(false);
  const [forceShowIntro, setForceShowIntro] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userFilterExpandedPreference, setUserFilterExpandedPreference] = useState(() => {
    return localStorage.getItem('pig_town_filter_expanded') !== 'false';
  });

  const filterRef = useRef<HTMLDivElement>(null);
  const searchHeaderRef = useRef<HTMLDivElement>(null);
  const largeFilterPanelRef = useRef<HTMLDivElement>(null);
  const [isLargeFilterScrolledPast, setIsLargeFilterScrolledPast] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  // Monitor scroll for hiding the header
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (isProfileDropdownOpen) {
        setIsHeaderHidden(false);
        return;
      }

      const currentScrollY = window.scrollY;
      
      if (activeCategory === 'trend_checklist') {
        if (currentScrollY > 100 && currentScrollY > lastScrollY) {
          setIsHeaderHidden(true);
        } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
          setIsHeaderHidden(false);
        }
      } else {
        const hideThreshold = 150;
        const showThreshold = 60;

        if (currentScrollY > hideThreshold) {
          setIsHeaderHidden(true);
        } else if (currentScrollY < showThreshold) {
          setIsHeaderHidden(false);
        }
      }

      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isProfileDropdownOpen, activeCategory]);

  // Monitor sticky state
  useEffect(() => {
    const handleScroll = () => {
      if (!filterRef.current) return;
      
      const rect = filterRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      const stickyThreshold = isMobile ? 56 : 0;
      
      const isStuck = rect.top <= stickyThreshold + 2;
      setIsScrolled(isStuck);

      if (searchHeaderRef.current && largeFilterPanelRef.current) {
        const searchRect = searchHeaderRef.current.getBoundingClientRect();
        const largeRect = largeFilterPanelRef.current.getBoundingClientRect();
        const hasScrolledPast = largeRect.bottom <= (searchRect.bottom + 10);
        setIsLargeFilterScrolledPast(hasScrolledPast);
      } else {
        setIsLargeFilterScrolledPast(isStuck);
      }
    };

    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsFilterExpanded(userFilterExpandedPreference);
  }, [userFilterExpandedPreference]);

  const [openMobileFilter, setOpenMobileFilter] = useState<'weather' | 'level' | 'time' | 'collection' | 'star' | 'master' | 'cooking_type' | 'cooking_level' | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMobileFilter && filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenMobileFilter(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMobileFilter]);

  return {
    isSidebarInteracting,
    setIsSidebarInteracting,
    forceShowIntro,
    setForceShowIntro,
    isFilterExpanded,
    setIsFilterExpanded,
    isScrolled,
    setIsScrolled,
    userFilterExpandedPreference,
    setUserFilterExpandedPreference,
    filterRef,
    searchHeaderRef,
    largeFilterPanelRef,
    isLargeFilterScrolledPast,
    isHeaderHidden,
    setIsHeaderHidden,
    openMobileFilter,
    setOpenMobileFilter,
  };
}
