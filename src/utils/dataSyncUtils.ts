export type SyncOrigin = 'remote' | 'local';

export function calculateBusinessHash(data: any): string {
  const businessData = {
    completedBirdNames: data.completedBirdNames || [],
    completedInsectNames: data.completedInsectNames || [],
    completedFishNames: data.completedFishNames || [],
    completedFoodNames: data.completedFoodNames || [],
    completedGardeningNames: data.completedGardeningNames || [],
    completedOceanCleaningNames: data.completedOceanCleaningNames || [],
    ratings: data.ratings || {},
    weeklyWeather: data.weeklyWeather || {},
    detailedWeather: data.detailedWeather || {},
    masterBirdNames: data.masterBirdNames || [],
    masterInsectNames: data.masterInsectNames || [],
    masterFishNames: data.masterFishNames || [],
    masterFoodNames: data.masterFoodNames || [],
    masterGardeningNames: data.masterGardeningNames || [],
    masterOceanCleaningNames: data.masterOceanCleaningNames || [],
    pets: data.pets || [],
    farmingSlots: data.farmingSlots || {},
    flowerColorCollections: data.flowerColorCollections || {}
  };
  return JSON.stringify(businessData);
}
