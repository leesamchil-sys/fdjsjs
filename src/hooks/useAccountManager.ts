import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, deleteUser, reauthenticateWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import versionData from '../version.json';

const APP_VERSION = versionData.version;

function checkIsInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /KAKAOTALK|Instagram|NAVER|Line|FB_IAB|FB4A|FBAN|FB_IAB/i.test(ua);
}

export function useAccountManager(
  isDirtyRef?: MutableRefObject<boolean>,
  isResetting?: MutableRefObject<boolean>,
  globalSyncTimerRef?: MutableRefObject<NodeJS.Timeout | null>,
  forceSyncAllData?: any,
  resetLocalCollectionStates?: any
) {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [loginWarningType, setLoginWarningType] = useState<'iframe' | 'webview' | null>(null);

  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleterLoading, setIsDeleterLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleForceLogout = async () => {
    try {
      console.warn("[AuthSync] Triggering force logout...");
      if (globalSyncTimerRef?.current) {
        clearTimeout(globalSyncTimerRef.current);
        globalSyncTimerRef.current = null;
      }

      if (isResetting) {
        isResetting.current = true;
      }

      // We do not reset React states or clear localStorage.
      // This preserves all local gameplay data to prevent data loss.
      // If the logout was an error or transient issue, logging back in preserves the data.

      if (isDirtyRef) {
        isDirtyRef.current = false;
      }
      
      await signOut(auth);

      // We do NOT set isResetting.current to false here because we are immediately reloading the page,
      // and we want isResetting.current to remain true during the auth state transition to prevent
      // the App.tsx's useEffect from clearing the local storage.

      alert("보안 정책 또는 관리자 요청에 의해 강제 로그아웃되었습니다.");
      window.location.reload();
    } catch (err) {
      console.error("[Sync] Force logout failed:", err);
      try {
        await signOut(auth);
        window.location.reload();
      } catch {}
    }
  };

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync version and forceLogout on login
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      getDocFromServer(userDocRef).then((docSnap) => {
        let shouldUpdate = true;
        let hasForceLogoutField = false;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.forceLogout === true) {
            handleForceLogout();
            return;
          }
          if (data.forceLogout !== undefined) {
            hasForceLogoutField = true;
          }
          if (data.lastAppVersion === APP_VERSION) {
            shouldUpdate = false;
          }
        }
        
        const updatePayload: any = {};
        if (shouldUpdate || !hasForceLogoutField) {
          updatePayload.lastAppVersion = APP_VERSION;
          updatePayload.updatedAt = serverTimestamp();
        }
        if (!hasForceLogoutField) {
          updatePayload.forceLogout = false;
        }

        if (Object.keys(updatePayload).length > 0) {
          setDoc(userDocRef, updatePayload, { merge: true }).catch(err => {
            console.warn("[AuthSync] Initial version sync failed:", err);
          });
        }
      }).catch(err => {
        console.warn("[AuthSync] Version check failed:", err);
      });
    }
  }, [user]);

  // Real-time active subscription for forceLogout
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.forceLogout === true) {
          console.warn("[AuthSync] Real-time force logout trigger detected.");
          handleForceLogout();
        }
      }
    }, (err) => {
      console.warn("[AuthSync] Failed to subscribe to user doc for real-time forceLogout checks:", err);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      setIsTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      if (authLoading) {
        setIsTimedOut(true);
      }
    }, 25000);
    return () => clearTimeout(timer);
  }, [authLoading]);

  const handleGoogleLogin = async (bypassCheck: boolean = false) => {
    const isIFrame = window.self !== window.top;
    const isWebView = checkIsInAppBrowser();

    if (bypassCheck !== true) {
      if (isWebView) {
        setLoginWarningType('webview');
        return;
      }
      if (isIFrame) {
        setLoginWarningType('iframe');
        return;
      }
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      if (
        errorCode === 'auth/popup-closed-by-user' || 
        errorCode === 'auth/cancelled-popup-request' ||
        errorMessage.includes('popup-closed-by-user') ||
        errorMessage.includes('cancelled-popup-request')
      ) {
        return;
      }

      if (isIFrame && !bypassCheck) {
        setLoginWarningType('iframe');
      } else {
        alert(`로그인 중 오류가 발생했습니다.\n\n사유: ${errorMessage || errorCode || '알 수 없는 오류'}\n\n만약 미리보기(iFrame) 중이라면 상단의 [새 창에서 열기] 버튼을 눌러 접속해 보세요!`);
      }
    }
  };

  const handleLogout = async (shouldClearLocal: boolean = true) => {
    try {
      if (globalSyncTimerRef?.current) {
        clearTimeout(globalSyncTimerRef.current);
        globalSyncTimerRef.current = null;
      }

      const hasUnsynced = localStorage.getItem('has_unsynced_changes') === 'true';
      const forceSync = forceSyncAllData && (typeof forceSyncAllData === 'object' && 'current' in forceSyncAllData) ? forceSyncAllData.current : forceSyncAllData;
      if (shouldClearLocal && user && forceSync && (hasUnsynced || isDirtyRef?.current)) {
        await forceSync(user);
      }

      if (shouldClearLocal) {
        const keysToClear = [
          'completed_bird_ids',
          'completed_insect_ids',
          'completed_fish_ids',
          'completed_food_ids',
          'completed_gardening_ids',
          'master_bird_ids',
          'master_insect_ids',
          'master_fish_ids',
          'master_food_ids',
          'master_gardening_ids',
          'completed_ocean_cleaning_ids',
          'master_ocean_cleaning_ids',
          'pigtown_pets',
          'item_ratings',
          'weekly_weather',
          'detailed_weather',
          'farming_slots',
          'user_notification_presets',
          'sync_resolved_uid',
          'has_unsynced_changes',
          'local_collections_updated_at',
          'local_farming_updated_at',
          'farming_write_lock_at',
          'flower_color_collections'
        ];
        keysToClear.forEach(key => localStorage.removeItem(key));
      }

      if (isDirtyRef) {
        isDirtyRef.current = false;
      }
      await signOut(auth);
    } catch (err) {
      console.error("[Sync] Logout aborted due to sync failure:", err);
      alert("데이터를 서버에 동기화하는 중 오류가 발생했습니다. 네트워크 상태를 확인하시거나 잠시 후 다시 시도해 주세요.\n\n오류: " + (err instanceof Error ? err.message : err));
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      alert("로그인된 사용자만 회원탈퇴할 수 있습니다.");
      return;
    }

    if (deleteConfirmText !== '탈퇴하기') {
      setDeleteError("입력 문구가 '탈퇴하기'와 정확히 일치하지 않습니다.");
      return;
    }

    setIsDeleterLoading(true);
    setDeleteError(null);
    if (isResetting) {
      isResetting.current = true;
    }

    let userDocRef: any = null;
    let backupData: any = null;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("탈퇴를 진행할 인증 세션 정보가 없습니다. 다시 로그인해 주세요.");
      }

      const uid = currentUser.uid;
      userDocRef = doc(db, 'users', uid);

      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          backupData = docSnap.data();
        }
      } catch {
        // backup fail silent
      }

      await deleteDoc(userDocRef);

      try {
        await deleteUser(currentUser);
      } catch (authErr: any) {
        if (authErr?.code === 'auth/requires-recent-login' || String(authErr).includes('recent-login') || String(authErr).includes('requires-recent-login')) {
          try {
            setDeleteError("🔒 보안 검증: 가입된 구글 계정을 영구 삭제하려면 추가 인증이 필요한 상태입니다.\n안전한 탈퇴 진행을 위해 표시되는 구글 인증 창에서 로그인 진행 부탁드립니다.");
            
            await reauthenticateWithPopup(currentUser, googleProvider);
            await deleteDoc(userDocRef);
            await deleteUser(currentUser);
          } catch (reauthErr: any) {
            if (backupData) {
              await setDoc(userDocRef, backupData);
            }
            throw reauthErr;
          }
        } else {
          if (backupData) {
            await setDoc(userDocRef, backupData);
          }
          throw authErr;
        }
      }

      localStorage.clear();
      const resetLocal = resetLocalCollectionStates && (typeof resetLocalCollectionStates === 'object' && 'current' in resetLocalCollectionStates) ? resetLocalCollectionStates.current : resetLocalCollectionStates;
      if (resetLocal) {
        resetLocal();
      }

      if (isDirtyRef) {
        isDirtyRef.current = false;
      }
      setIsDeleteAccountModalOpen(false);
      setDeleteConfirmText('');
      alert("회원 탈퇴 및 모든 계정 데이터가 정상적으로 삭제되었습니다.");
    } catch (err: any) {
      console.error("[AccountDelete] Failed:", err);
      setDeleteError(err?.message || "회원탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setIsDeleterLoading(false);
      if (isResetting) {
        isResetting.current = false;
      }
    }
  };

  return {
    user,
    setUser,
    authLoading,
    isTimedOut,
    loginWarningType,
    setLoginWarningType,
    isDeleteAccountModalOpen,
    setIsDeleteAccountModalOpen,
    deleteConfirmText,
    setDeleteConfirmText,
    isDeleterLoading,
    deleteError,
    setDeleteError,
    handleGoogleLogin,
    handleLogout,
    handleDeleteAccount,
  };
}
