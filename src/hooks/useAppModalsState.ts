import { useState } from 'react';

export function useAppModalsState() {
  const [isSyncingBeforeReload, setIsSyncingBeforeReload] = useState(false);
  const [isSeasonalModalOpen, setIsSeasonalModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [importPendingData, setImportPendingData] = useState<any>(null);
  const [restoreSuccessMessage, setRestoreSuccessMessage] = useState<string | null>(null);
  const [restoreErrorMessage, setRestoreErrorMessage] = useState<string | null>(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isSupporterRegisterModalOpen, setIsSupporterRegisterModalOpen] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(true);
  const [updateDismissed, setUpdateDismissed] = useState(true);

  return {
    isSyncingBeforeReload,
    setIsSyncingBeforeReload,
    isSeasonalModalOpen,
    setIsSeasonalModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    importPendingData,
    setImportPendingData,
    restoreSuccessMessage,
    setRestoreSuccessMessage,
    restoreErrorMessage,
    setRestoreErrorMessage,
    isTimerModalOpen,
    setIsTimerModalOpen,
    isSupportModalOpen,
    setIsSupportModalOpen,
    isSupporterRegisterModalOpen,
    setIsSupporterRegisterModalOpen,
    updateAvailable,
    setUpdateAvailable,
    updateDismissed,
    setUpdateDismissed,
  };
}
