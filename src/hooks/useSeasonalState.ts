import { useState, useEffect, useMemo } from 'react';
import { SEASONAL_EVENTS, isSeasonOngoing } from '../data/seasonal';

export function useSeasonalState() {
  const [activeSeasonIds, setActiveSeasonIds] = useState<string[]>(() => {
    let active: string[] = [];
    let known: string[] = [];

    try {
      const savedActive = localStorage.getItem('active_season_ids');
      const savedKnown = localStorage.getItem('known_season_ids');
      
      if (savedActive) {
        active = JSON.parse(savedActive);
      } else {
        active = SEASONAL_EVENTS.filter(e => isSeasonOngoing(e)).map(e => e.id);
      }

      if (savedKnown) {
        known = JSON.parse(savedKnown);
      } else {
        known = active;
      }

      // Auto-enable newly added ongoing events that the user hasn't seen yet
      const newOngoing = SEASONAL_EVENTS.filter(e => isSeasonOngoing(e) && !known.includes(e.id)).map(e => e.id);
      if (newOngoing.length > 0) {
        active = [...active, ...newOngoing];
      }
    } catch (e) {
      console.error('Failed to parse season ids', e);
      active = SEASONAL_EVENTS.filter(e => isSeasonOngoing(e)).map(e => e.id);
    }
    return active;
  });

  const effectiveSeasonIds = activeSeasonIds;

  const toggleSeason = (seasonId: string) => {
    setActiveSeasonIds(prev => {
      if (prev.includes(seasonId)) {
        return prev.filter(id => id !== seasonId);
      } else {
        return [...prev, seasonId];
      }
    });
  };

  const showSeasonalBanner = useMemo(() => {
    return SEASONAL_EVENTS.length > 0;
  }, []);

  useEffect(() => {
    localStorage.setItem('active_season_ids', JSON.stringify(activeSeasonIds));
    try {
      const savedKnown = localStorage.getItem('known_season_ids');
      let known = savedKnown ? JSON.parse(savedKnown) : [];
      let changed = false;
      
      SEASONAL_EVENTS.forEach(e => {
        if (!known.includes(e.id)) {
          known.push(e.id);
          changed = true;
        }
      });
      
      if (changed) {
        localStorage.setItem('known_season_ids', JSON.stringify(known));
      }
    } catch (e) {
      console.error('Failed to update known_season_ids', e);
      localStorage.setItem('known_season_ids', JSON.stringify(SEASONAL_EVENTS.map(e => e.id)));
    }
  }, [activeSeasonIds]);

  return {
    activeSeasonIds,
    setActiveSeasonIds,
    effectiveSeasonIds,
    toggleSeason,
    showSeasonalBanner,
  };
}
