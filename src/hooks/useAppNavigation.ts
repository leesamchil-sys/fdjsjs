import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Category } from '../types';

export function useAppNavigation() {
  const [defaultTab, setDefaultTab] = useState<'daily' | 'collection' | 'interactive_map' | 'trend_checklist' | 'calculator' | 'pet_guide' | 'farming_timer' | 'gardening_timer' | 'cooking_calculator' | 'ocean_cleaning' | 'coupons'>('collection');
  const location = useLocation();
  const navigate = useNavigate();

  const [activeCategory, _setActiveCategory] = useState<Category>(() => {
    const pathname = window.location.pathname.replace(/^\/+/, '');
    const validCategories: Category[] = [
      'birds', 'insects', 'fishing', 'cooking',
      'gardening', 'crops', 'ocean_cleaning', 'petfood'
    ];
    
    if (validCategories.includes(pathname as Category)) {
      return pathname as Category;
    }
    
    const saved = localStorage.getItem('last_active_category') as Category;
    if (saved && validCategories.includes(saved)) {
      return saved;
    }
    return 'birds';
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
      if (activeCategory) {
        navigate(`/${activeCategory}`, { replace: true });
      } else {
        navigate('/birds', { replace: true });
        _setActiveCategory('birds');
      }
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
  useEffect(() => {
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
