import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

/**
 * 유저별/버전별 고유 로그를 남깁니다.
 * 새로고침 시 중복 생성을 방지하고 마지막 활동 시간만 업데이트합니다.
 */
export const logVersion = async (version: string, userId?: string | null, email?: string | null) => {
  try {
    if (userId) {
      // 1. 로그인 유저: users 컬렉션에 버전 정보 및 마지막 활동 시간 업데이트
      const userRef = doc(db, 'users', userId);
      
      // 가입일(joinDate)이 없는 경우에만 처음으로 기록
      const userSnap = await getDoc(userRef);
      const updateData: any = {
        uid: userId,
        ...(email ? { email } : {}),
        lastAppVersion: version,
        lastActive: serverTimestamp()
      };
      
      if (!userSnap.exists() || !userSnap.data()?.joinDate) {
        updateData.joinDate = serverTimestamp();
      }

      console.count("[WRITE] setDoc");
      console.log({
        function: "logVersion",
        reason: "userVersionSyncOnLogin",
        path: userRef.path,
        time: new Date().toISOString()
      });
      await setDoc(userRef, updateData, { merge: true });
    } else {
      // 2. 비로그인 유저: visitor_logs 컬렉션에 기기별/버전별 고유 로그 관리
      let deviceId = localStorage.getItem('pt_device_id');
      if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        localStorage.setItem('pt_device_id', deviceId);
        localStorage.setItem('pt_first_visit', new Date().toISOString());
      }

      // 세션 횟수 추적
      const lastSessionUpdate = sessionStorage.getItem('pt_session_tracked');
      let sessionCount = parseInt(localStorage.getItem('pt_session_count') || '0');
      if (!lastSessionUpdate) {
        sessionCount += 1;
        localStorage.setItem('pt_session_count', sessionCount.toString());
        sessionStorage.setItem('pt_session_tracked', 'true');
      }

      const firstVisit = localStorage.getItem('pt_first_visit');
      const logId = `visitor_${deviceId}_${version.replace(/\./g, '_')}`;
      
      const docRef = doc(db, 'visitor_logs', logId);
      console.count("[WRITE] setDoc");
      console.log({
        function: "logVersion",
        reason: "visitorVersionSyncOnVisit",
        path: docRef.path,
        time: new Date().toISOString()
      });
      await setDoc(docRef, {
        deviceId: deviceId,
        version: version,
        lastActive: serverTimestamp(),
        firstVisit: firstVisit ? new Date(firstVisit) : serverTimestamp(),
        sessionCount: sessionCount,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        referrer: document.referrer || 'direct',
        isVisitor: true
      }, { merge: true });
      
    }
  } catch (err) {
    // Fail silently
  }
};
