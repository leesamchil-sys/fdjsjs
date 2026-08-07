import React from 'react';
import PetFoodFinder from '../PetFoodFinder';

export const PetFoodTabContent: React.FC<any> = (props) => {
  return (
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
  );
};
