import { useState, useEffect } from 'react';
import { WeeklyWeather, DetailedWeather } from '../types';
import { safeJsonParse } from '../lib/utils';
import { addHours, isAfter } from 'date-fns';

function cleanWeeklyWeather(data: any): WeeklyWeather {
  if (!data || typeof data !== 'object') return {};
  const cleaned: WeeklyWeather = {};
  const now = new Date();
  const currentYear = now.getFullYear();
  
  Object.keys(data).forEach(key => {
    const parts = key.split('-');
    if (parts.length >= 2) {
      const m = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      if (!isNaN(m) && !isNaN(d)) {
        const entryDate = new Date(currentYear, m - 1, d, 23, 59, 59);
        if (isAfter(entryDate, addHours(now, -48))) {
          cleaned[key] = data[key];
        }
      }
    }
  });
  return cleaned;
}

export function useWeatherState() {
  const [weeklyWeather, setWeeklyWeather] = useState<WeeklyWeather>(() => {
    const saved = localStorage.getItem('weekly_weather');
    const parsed = safeJsonParse(saved, {});
    return cleanWeeklyWeather(parsed);
  });
  const [draftWeeklyWeather, setDraftWeeklyWeather] = useState<WeeklyWeather>({});

  const [detailedWeather, setDetailedWeather] = useState<DetailedWeather>(() => {
    const saved = localStorage.getItem('detailed_weather');
    const parsed: DetailedWeather = safeJsonParse(saved, {});
    const cleaned: DetailedWeather = {};
    const now = new Date();
    Object.keys(parsed).forEach(key => {
      const [y, m, d, h] = key.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && !isNaN(h)) {
        const entryDate = new Date(y, m - 1, d, h);
        if (isAfter(addHours(entryDate, 6), now)) {
          cleaned[key] = parsed[key];
        }
      }
    });
    return cleaned;
  });
  const [draftDetailedWeather, setDraftDetailedWeather] = useState<DetailedWeather>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('weekly_weather', JSON.stringify(weeklyWeather));
    }
  }, [weeklyWeather]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('detailed_weather', JSON.stringify(detailedWeather));
    }
  }, [detailedWeather]);

  return {
    weeklyWeather,
    setWeeklyWeather,
    draftWeeklyWeather,
    setDraftWeeklyWeather,
    detailedWeather,
    setDetailedWeather,
    draftDetailedWeather,
    setDraftDetailedWeather,
  };
}
