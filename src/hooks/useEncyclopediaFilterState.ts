import { useState } from 'react';

export function useEncyclopediaFilterState() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedTimeBlocks, setSelectedTimeBlocks] = useState<string[]>([]);
  const [selectedWeathers, setSelectedWeathers] = useState<string[]>([]);
  const [selectedCookingTypes, setSelectedCookingTypes] = useState<string[]>([]);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  return {
    searchQuery,
    setSearchQuery,
    selectedLevels,
    setSelectedLevels,
    selectedTimeBlocks,
    setSelectedTimeBlocks,
    selectedWeathers,
    setSelectedWeathers,
    selectedCookingTypes,
    setSelectedCookingTypes,
    isWeatherModalOpen,
    setIsWeatherModalOpen,
  };
}
