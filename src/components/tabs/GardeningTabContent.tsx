import React from 'react';
import GardeningGuide from '../GardeningGuide';

export const GardeningTabContent: React.FC<any> = React.memo((props) => {
  return (
    <GardeningGuide 
      completedIds={props.completedGardeningIds}
      masterIds={props.masterGardeningIds}
      onToggleCompletion={props.toggleGardeningCompletion}
      onToggleMaster={props.toggleGardeningMaster}
      ratings={props.ratings}
      onRate={props.handleRate}
      maxLevel={props.MAX_DISPLAY_LEVEL}
      initialTab={props.gardeningSubTab}
      onOpenSeasonalModal={props.onOpenSeasonalModal}
      activeSeasonIds={props.activeSeasonIds}
      showSeasonalBanner={props.showSeasonalBanner}
      flowerColorCollections={props.flowerColorCollections}
      onToggleFlowerColor={props.onToggleFlowerColor}
    />
  );
});
