import React from 'react';
import PetFoodFinder from '../PetFoodFinder';
import PetFoodNewFeaturesPopup from '../PetFoodNewFeaturesPopup';

export const PetFoodTabContent: React.FC<any> = (props) => {
  return (
    <div className="w-full flex-1 flex flex-col relative">
      <PetFoodNewFeaturesPopup canShow={true} />
      <PetFoodFinder 
        pets={props.pets} 
        setPets={(newPets: any) => {
          props.setPets(newPets);
          props.markCollectionsModified();
          if (props.user) props.debouncedSyncAllData();
        }} 
        activeSeasonIds={props.activeSeasonIds}
        key={props.user?.uid || 'guest'} 
      />
    </div>
  );
};
