import { useState, useEffect, MutableRefObject } from 'react';
import { User } from 'firebase/auth';

interface UseAppLifecycleParams {
  user: User | null;
  isInitialSyncDone: boolean;
  isInitialSyncDoneRef: MutableRefObject<boolean>;
  isDirtyRef: MutableRefObject<boolean>;
  debouncedSyncAllData: (delay?: number) => void;
  forceSyncAllData: (userToSync: User) => Promise<boolean>;
  auth: any;
  setToastMessage: (msg: string | null) => void;
}

export function useAppLifecycle({
  user,
  isInitialSyncDone,
  isInitialSyncDoneRef,
  isDirtyRef,
  debouncedSyncAllData,
  forceSyncAllData,
  auth,
  setToastMessage,
}: UseAppLifecycleParams) {
  const [windowWidth, setWindowWidth] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Responsive window resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut (Ctrl+S / Cmd+S) to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        
        if (user) {
          isDirtyRef.current = true;
          debouncedSyncAllData(0);
        }
        
        setToastMessage('진행 상황이 저장되었습니다.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, debouncedSyncAllData, setToastMessage]);

  // Visitation stats counter
  useEffect(() => {
    const checkDateAndIncrement = () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const lastVisitedDate = localStorage.getItem('pigtown_last_visited_date');
        
        if (lastVisitedDate !== today) {
          const currentTotal = parseInt(localStorage.getItem('pigtown_total_visitors') || '0', 10);
          localStorage.setItem('pigtown_total_visitors', (currentTotal + 1).toString());
          localStorage.setItem('pigtown_last_visited_date', today);
        }
      } catch (e) {
        console.error('Failed to update visitor stats:', e);
      }
    };

    checkDateAndIncrement();
  }, []);

  // Background sync listeners (beforeunload, online, visibilitychange)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (auth.currentUser && localStorage.getItem('has_unsynced_changes') === 'true') {
        const msg = '진행 중인 데이터 동기화가 아직 완료되지 않았습니다. 지금 종료하면 변경 사항이 사라지거나 다음에 접속할 때 처리됩니다. 정말 종료하시겠습니까?';
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload, { capture: true });

    const handleOnline = () => {
      console.log("[Sync] Network returned. Checking for unsynced changes...");
      if (user && isInitialSyncDone && localStorage.getItem('has_unsynced_changes') === 'true') {
        isDirtyRef.current = true;
        debouncedSyncAllData();
      }
    };
    window.addEventListener('online', handleOnline);

    const handleVisibilityChange = async () => {
      if (document.hidden === true) {
        console.log("[Sync] Tab hidden / entered background. Checking for unsynced changes...");
        const hasUnsynced = localStorage.getItem('has_unsynced_changes') === 'true';
        if (auth.currentUser && isInitialSyncDoneRef.current && (hasUnsynced || isDirtyRef.current)) {
          try {
            console.log("[Sync] Unsynced changes detected. Attempting background forceSyncAllData...");
            await forceSyncAllData(auth.currentUser);
            console.log("[Sync] Background forceSyncAllData successful.");
          } catch (err) {
            console.warn("[Sync] Background forceSyncAllData failed on visibilitychange:", err);
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const syncCheckInterval = setInterval(() => {
      if (user && isInitialSyncDone && localStorage.getItem('has_unsynced_changes') === 'true') {
        console.log("[Sync] Safety check: triggering sync for leftover changes.");
        isDirtyRef.current = true;
        debouncedSyncAllData(1500); 
      }
    }, 15000);

    return () => {
      clearInterval(syncCheckInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isInitialSyncDone, debouncedSyncAllData, forceSyncAllData, auth]);

  return {
    windowWidth,
  };
}
