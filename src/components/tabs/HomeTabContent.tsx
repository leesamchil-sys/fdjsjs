import React from 'react';
import HomeDashboard from '../HomeDashboard';

export const HomeTabContent: React.FC<any> = (props) => {
  return (
    <HomeDashboard 
      user={props.user}
      allowedUids={props.allowedUids}
      completedBirdIds={props.completedBirdIds}
      completedInsectIds={props.completedInsectIds}
      completedFishIds={props.completedFishIds}
      completedFoodIds={props.completedFoodIds}
      masterBirdIds={props.masterBirdIds}
      masterInsectIds={props.masterInsectIds}
      masterFishIds={props.masterFishIds}
      masterFoodIds={props.masterFoodIds}
      masterGardeningIds={props.masterGardeningIds}
      ratings={props.ratings}
      birdTotal={props.birdTotal}
      insectTotal={props.insectTotal}
      fishTotal={props.fishTotal}
      cookingTotal={props.cookingTotal}
      completedFlowerIds={props.completedFlowerIds}
      completedCropIds={props.completedCropIds}
      gardeningTotal={props.gardeningTotal}
      cropTotal={props.cropTotal}
      setActiveCategory={props.handleSetCategory}
      pets={props.pets}
      onSyncError={(type: string) => {
        if (type === 'permission') props.setIsPermissionDeniedError(true);
        else if (type === 'quota') props.setIsQuotaExceededError(true);
      }}
      isActive={props.activeCategory === 'home'}
      activeCouponsCount={props.activeCouponsCount}
      birds={props.birds}
      insects={props.insects}
      fish={props.fish}
      cooking={props.cooking}
      gardeningItems={props.gardeningItems}
      completedOceanCleaningIds={props.completedOceanCleaningIds}
      masterOceanCleaningIds={props.masterOceanCleaningIds}
      oceanCleaningTotal={props.oceanCleaningTotal}
      oceanCleaning={props.oceanCleaning}
    />
  );
};
