import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeJsonParse } from '../lib/utils';

export function useActiveCouponsCount() {
  const [activeCouponsCount, setActiveCouponsCount] = useState(0);

  useEffect(() => {
    let currentDocs: any[] = [];
    
    const calculateCount = (docs: any[]) => {
      let activeCount = 0;
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const kst = new Date(utc + (9 * 60 * 60000));
      const yyyy = kst.getFullYear();
      const mm = String(kst.getMonth() + 1).padStart(2, '0');
      const dd = String(kst.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      
      const savedUsed = localStorage.getItem('used_coupons');
      const usedCoupons = savedUsed ? safeJsonParse(savedUsed, {}) : {};

      docs.forEach((data) => {
        const expiredAt = data.expiredAt || '';
        const isExpired = expiredAt < todayStr;
        const isUsed = !!usedCoupons[data.id];
        
        if (!isExpired && !isUsed) {
          activeCount++;
        }
      });
      setActiveCouponsCount(activeCount);
    };

    const couponsRef = collection(db, 'settings_coupons');
    const unsubscribe = onSnapshot(couponsRef, (snapshot) => {
      console.log(`[SNAPSHOT] active_coupons_count - path: ${couponsRef.path}, size: ${snapshot.size}`);
      currentDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      calculateCount(currentDocs);
    }, (err) => {
      console.warn("coupons count load error:", err);
      setActiveCouponsCount(0);
    });

    const handleStorageChange = () => calculateCount(currentDocs);
    window.addEventListener('used_coupons_changed', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('used_coupons_changed', handleStorageChange);
    };
  }, []);

  return activeCouponsCount;
}
