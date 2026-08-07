import React from 'react';
import CropTimer from '../CropTimer';

export const CropsTabContent: React.FC<any> = (props) => {
  return (
    <CropTimer 
      onReportClick={() => props.setIsContactModalOpen(true)}
      onLoginClick={() => props.handleGoogleLogin(true)}
      onOpenStateChange={props.setIsTimerModalOpen}
      onLogout={props.handleLogout}
      onSyncError={(type: string) => {
        if (type === 'permission') props.setIsPermissionDeniedError(true);
        else if (type === 'quota') props.setIsQuotaExceededError(true);
      }}
      isInitialSyncDone={props.isInitialSyncDone}
      isActive={props.activeCategory === 'crops'}
      cropPresets={props.cropPresets}
      getGlobalSyncRemainingTime={props.getGlobalSyncRemainingTime}
      debouncedSyncAllData={props.debouncedSyncAllData}
      onFarmingSyncScheduled={props.onFarmingSyncScheduled}
      onCropCompleted={props.onCropCompleted}
    />
  );
};
