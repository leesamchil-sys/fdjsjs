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
    const cloudPrefs: Record<string, any> = {};
    Object.entries(p.preferences || {}).forEach(([foodId, pref]) => {
      cloudPrefs[getPetFoodName(foodId)] = pref;
    });
    const cloudTried: Record<string, any> = {};
    Object.entries(p.tried || {}).forEach(([foodId, triedVal]) => {
      cloudTried[getPetFoodName(foodId)] = triedVal;
    });
    return { ...p, preferences: cloudPrefs, tried: cloudTried };
  }).sort((a: any, b: any) => (a.id || '').localeCompare(b.id || ''));
};

export const mapCloudPetsToLocal = (cloudPetsList: any[]): any[] => {
  return (cloudPetsList || []).map((p: any) => {
    const localPrefs: Record<string, any> = {};
    Object.entries(p.preferences || {}).forEach(([prefName, val]) => {
      localPrefs[getPetFoodId(prefName)] = val;
    });
    const localTried: Record<string, any> = {};
    Object.entries(p.tried || {}).forEach(([prefName, val]) => {
      localTried[getPetFoodId(prefName)] = val;
    });
    return { ...p, preferences: localPrefs, tried: localTried };
  });
};
