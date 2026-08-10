import React from 'react';
import EncyclopediaSection from '../EncyclopediaSection';

export const InsectTabContent: React.FC<any> = React.memo((props) => {
  return (
    <EncyclopediaSection
      activeCategory="insects"
      currentTime={props.currentTime}
      currentGameWeather={props.currentGameWeather}
      completedBirdIds={props.completedBirdIds}
      completedInsectIds={props.completedInsectIds}
      completedFishIds={props.completedFishIds}
      completedFoodIds={props.completedFoodIds}
      completedOceanCleaningIds={props.completedOceanCleaningIds}
      masterBirdIds={props.masterBirdIds}
      masterInsectIds={props.masterInsectIds}
      masterFishIds={props.masterFishIds}
      masterFoodIds={props.masterFoodIds}
      masterOceanCleaningIds={props.masterOceanCleaningIds}
      ratings={props.ratings}
      toggleCompletion={props.toggleCompletion}
      toggleMaster={props.toggleMaster}
      handleRate={props.handleRate}
      setIsCollectionModalOpen={props.setIsCollectionModalOpen}
      currentCategoryCompleted={props.currentCategoryCompleted}
      currentCategoryTotal={props.currentCategoryTotal}
      setBulkInput={props.setBulkInput}
      bulkInput={props.bulkInput}
      setIsRecInfoOpen={props.setIsRecInfoOpen}
      isRecInfoOpen={props.isRecInfoOpen}
      setIsWeatherModalOpen={props.setIsWeatherModalOpen}
      birds={props.birds}
      insects={props.insects}
      fish={props.fish}
      cooking={props.cooking}
      oceanCleaning={props.oceanCleaning}
      onOpenSeasonalModal={props.onOpenSeasonalModal}
      activeSeasonIds={props.activeSeasonIds}
      showSeasonalBanner={props.showSeasonalBanner}
      onLocationClick={props.onLocationClick}
      highlightedItemName={props.highlightedItemName}
      onIngredientModalChange={props.onIngredientModalChange}
    />
  );
});
