import { useState, useEffect, useCallback } from 'react';
import { safeJsonParse } from '../lib/utils';

export function useGameState() {
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('item_ratings');
    return safeJsonParse(saved, {});
  });

  const [presets, setPresets] = useState<any[]>(() => {
    const saved = localStorage.getItem('user_notification_presets');
    return safeJsonParse(saved, []);
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('item_ratings', JSON.stringify(ratings));
    }
  }, [ratings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_notification_presets', JSON.stringify(presets));
    }
  }, [presets]);

  const handleRate = useCallback((itemName: string, rating: number) => {
    setRatings(prev => {
      const next = { ...prev };
      if (rating <= 0) {
        delete next[itemName];
      } else {
        next[itemName] = rating;
      }
      return next;
    });
  }, []);

  return {
    ratings,
    setRatings,
    presets,
    setPresets,
    handleRate,
  };
}
