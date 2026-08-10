import { ALL_COOKING_MAP, dbFish } from '../data/allMaps';

const CUSTOM_PET_FOODS = [
  { id: 'raw-apple', name: '사과' },
  { id: 'raw-neutari', name: '느타리 버섯' },
  { id: 'raw-yangsongi', name: '양송이 버섯' },
  { id: 'raw-pyogo', name: '표고 버섯' },
  { id: 'custom-dog-food', name: '강아지 전용 사료' },
  { id: 'custom-cat-food', name: '고양이 전용 사료' },
  { id: 'custom-common-food', name: '동물 공용 음식' }
];

export const getPetFoodName = (id: string): string => {
  const foundCustom = CUSTOM_PET_FOODS.find(c => c.id === id);
  if (foundCustom) return foundCustom.name;
  const foundCook = ALL_COOKING_MAP.find(c => c.id === id);
  if (foundCook) return foundCook.name;
  const foundFish = dbFish.find(f => f.id === id);
  if (foundFish) return foundFish.name;
  return id;
};

export const getPetFoodId = (name: string): string => {
  const foundCustom = CUSTOM_PET_FOODS.find(c => c.name === name);
  if (foundCustom) return foundCustom.id;
  const foundCook = ALL_COOKING_MAP.find(c => c.name === name);
  if (foundCook) return foundCook.id;
  const foundFish = dbFish.find(f => f.name === name);
  if (foundFish) return foundFish.id;
  return name;
};

export const mapLocalPetsToCloud = (localPetsList: any[]): any[] => {
  return (localPetsList || []).map((p: any) => {
    if (!p || typeof p !== 'object') return p;
    const cloudPrefs: Record<string, any> = {};
    if (p.preferences && typeof p.preferences === 'object') {
      Object.entries(p.preferences).forEach(([foodId, pref]) => {
        if (foodId) cloudPrefs[getPetFoodName(foodId)] = pref;
      });
    }
    const cloudTried: Record<string, any> = {};
    if (p.tried && typeof p.tried === 'object') {
      Object.entries(p.tried).forEach(([foodId, triedVal]) => {
        if (foodId) cloudTried[getPetFoodName(foodId)] = triedVal;
      });
    }
    return {
      ...p,
      hasCustomImage: !!p.hasCustomImage,
      preferences: cloudPrefs,
      tried: cloudTried
    };
  });
};

export const mapCloudPetsToLocal = (cloudPetsList: any[]): any[] => {
  return (cloudPetsList || []).map((p: any) => {
    if (!p || typeof p !== 'object') return p;
    const localPrefs: Record<string, any> = {};
    if (p.preferences && typeof p.preferences === 'object') {
      Object.entries(p.preferences).forEach(([prefName, val]) => {
        if (prefName) localPrefs[getPetFoodId(prefName)] = val;
      });
    }
    const localTried: Record<string, any> = {};
    if (p.tried && typeof p.tried === 'object') {
      Object.entries(p.tried).forEach(([prefName, val]) => {
        if (prefName) localTried[getPetFoodId(prefName)] = val;
      });
    }
    return {
      ...p,
      hasCustomImage: !!p.hasCustomImage,
      preferences: localPrefs,
      tried: localTried
    };
  });
};
