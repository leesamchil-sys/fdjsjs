import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Category } from '../types';

export function useAppNavigation() {
  const [defaultTab, _setDefaultTab] = useState<Category | 'last_used'>(() => {
    const saved = localStorage.getItem('pig_town_default_tab');
    if (saved) return saved as Category | 'last_used';
    return 'last_used';
  });

  const setDefaultTab = (tab: Category | 'last_used') => {
    _setDefaultTab(tab);
    localStorage.setItem('pig_town_default_tab', tab);
  };

  const location = useLocation();
  const navigate = useNavigate();

  const [activeCategory, _setActiveCategory] = useState<Category>(() => {
    const pathname = window.location.pathname.replace(/^\/+/, '');
    const validCategories: Category[] = [
      'home', 'birds', 'insects', 'fishing', 'cooking',
      'gardening', 'crops', 'ocean_cleaning', 'petfood', 'coupons', 'trend_checklist'
    ];
    
    if (validCategories.includes(pathname as Category)) {
      return pathname as Category;
    }
    
    const savedDefault = (localStorage.getItem('pig_town_default_tab') as Category | 'last_used') || 'last_used';
    if (savedDefault !== 'last_used' && validCategories.includes(savedDefault as Category)) {
      return savedDefault as Category;
    }

    const savedLast = localStorage.getItem('last_active_category') as Category;
    if (savedLast && validCategories.includes(savedLast)) {
      return savedLast;
    }
    return 'home';
  });

  const [gardeningSubTab, setGardeningSubTab] = useState<'flower' | 'crop'>('flower');

  const setActiveCategory = (category: Category | ((prev: Category) => Category)) => {
    const newCategory = typeof category === 'function' ? category(activeCategory) : category;
    _setActiveCategory(newCategory);
    localStorage.setItem('last_active_category', newCategory);

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'instant' });
    });

    if (newCategory === 'crops') {
      setGardeningSubTab('crop');
      navigate('/crops');
    } else if (newCategory === 'gardening') {
      setGardeningSubTab('flower');
      navigate('/gardening');
    } else {
      navigate(`/${newCategory}`);
    }
  };

  // Sync route and category
  useEffect(() => {
    const rawPath = location.pathname.toLowerCase().replace(/^\/+/, '').trim();
    
    if (!rawPath || rawPath === '') {
      const savedDefault = (localStorage.getItem('pig_town_default_tab') as Category | 'last_used') || 'last_used';
      const validCategories: Category[] = [
        'home', 'birds', 'insects', 'fishing', 'cooking',
        'gardening', 'crops', 'ocean_cleaning', 'petfood', 'coupons', 'trend_checklist'
      ];
      
      let targetTab: Category = 'home';
      if (savedDefault !== 'last_used' && validCategories.includes(savedDefault as Category)) {
        targetTab = savedDefault as Category;
      } else {
        const savedLast = localStorage.getItem('last_active_category') as Category;
        if (savedLast && validCategories.includes(savedLast)) {
          targetTab = savedLast;
        }
      }

      navigate(`/${targetTab}`, { replace: true });
      _setActiveCategory(targetTab);
      return;
    }

    if (rawPath === 'gardening' || rawPath === 'crops') {
      if (activeCategory !== 'gardening' && activeCategory !== 'crops') {
        _setActiveCategory('gardening');
        localStorage.setItem('last_active_category', 'gardening');
      }
      setGardeningSubTab(rawPath === 'crops' ? 'crop' : 'flower');
      return;
    }

    const validCategories: Category[] = [
      'home', 'birds', 'insects', 'fishing', 'cooking',
      'ocean_cleaning', 'petfood', 'privacy', 'terms', 'coupons', 'trend_checklist'
    ];

    if (validCategories.includes(rawPath as Category)) {
      if (activeCategory !== rawPath) {
        _setActiveCategory(rawPath as Category);
        localStorage.setItem('last_active_category', rawPath);
      }
    }
  }, [location.pathname]);

  // Scroll restoration on route change
  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    const rawPath = location.pathname.toLowerCase();
    const prevPath = prevPathnameRef.current.toLowerCase();
    prevPathnameRef.current = location.pathname;

    if (rawPath.startsWith('/map') || prevPath.startsWith('/map')) {
      return;
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, [location.pathname]);

  const handleSetCategory = (category: Category) => {
    setActiveCategory(category);
  };

  return {
    defaultTab,
    setDefaultTab,
    location,
    navigate,
    activeCategory,
    setActiveCategory,
    gardeningSubTab,
    setGardeningSubTab,
    handleSetCategory,
  };
}
