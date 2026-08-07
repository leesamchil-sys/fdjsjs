import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeJsonParse } from '../lib/utils';

export function useActiveCouponsCount() {
  const [activeCouponsCount, setActiveCouponsCount] = useState(0);

  useEffect(() => {
    let currentDocs: any[] = [];
    let isMounted = true;
    
    const calculateCount = (docs: any[]) => {
      let activeCount = 0;
      const now = new Date();
      
      const savedUsed = localStorage.getItem('used_coupons');
      const usedCoupons = savedUsed ? safeJsonParse(savedUsed, {}) : {};

      docs.forEach((data) => {
        let expiryStr = data.expiredAt || '';
        if (!expiryStr) return;
        if (!expiryStr.includes('T')) {
          if (expiryStr.includes(' ')) {
            expiryStr = expiryStr.replace(' ', 'T');
          } else {
            expiryStr = `${expiryStr}T23:59:59`;
          }
        }
        const expiryDate = new Date(expiryStr);
        const isExpired = now > expiryDate;
        const isUsed = !!usedCoupons[data.id];
        
        if (!isExpired && !isUsed) {
          activeCount++;
        }
      });
      if (isMounted) {
        setActiveCouponsCount(activeCount);
      }
    };

    const fetchCouponsCount = async () => {
      try {
        const cacheTime = localStorage.getItem('pt_cached_coupons_time');
        const cachedData = localStorage.getItem('pt_cached_coupons');
        const isCacheValid = cacheTime && cachedData && (Date.now() - parseInt(cacheTime, 10) < 3600000); // 1시간 캐시

        const parseCreatedAt = (val: any): string => {
          if (!val) return '';
          if (typeof val === 'string') return val;
          if (typeof val === 'number') return new Date(val).toISOString();
          if (val && typeof val === 'object') {
            if (typeof val.toMillis === 'function') {
              return new Date(val.toMillis()).toISOString();
            }
            if (typeof val.toDate === 'function') {
              return val.toDate().toISOString();
            }
            if (typeof val.seconds === 'number') {
              return new Date(val.seconds * 1000).toISOString();
            }
            if (val instanceof Date) {
              return val.toISOString();
            }
          }
          return '';
        };

        if (isCacheValid) {
          const parsed = safeJsonParse(cachedData, null);
          if (parsed && Array.isArray(parsed)) {
            console.log("[Cache] useActiveCouponsCount - Loaded and normalizing coupons from local cache");
            const normalized = parsed.map(item => ({
              id: item.id,
              code: item.code || '',
              title: item.title || '',
              expiredAt: item.expiredAt || '',
              createdAt: parseCreatedAt(item.createdAt),
            }));
            const sorted = normalized.sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              
              if (timeB !== timeA) {
                return timeB - timeA; // 최신 등록순 (내림차순)
              }
              return a.expiredAt.localeCompare(b.expiredAt);
            });
            currentDocs = sorted;
            calculateCount(currentDocs);
            return;
          }
        }

        const couponsRef = collection(db, 'settings_coupons');
        console.log(`[GET_DOCS] useActiveCouponsCount - path: ${couponsRef.path}`);
        const snapshot = await getDocs(couponsRef);
        if (!isMounted) return;
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            code: data.code || '',
            title: data.title || '',
            expiredAt: data.expiredAt || '',
            createdAt: parseCreatedAt(data.createdAt),
          };
        });

        // 최신 등록순 정렬 (createdAt 내림차순, 없을 경우 아래쪽에 배치)
        const sorted = items.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          
          if (timeB !== timeA) {
            return timeB - timeA; // 최신 등록순 (내림차순)
          }
          return a.expiredAt.localeCompare(b.expiredAt);
        });

        currentDocs = sorted;
        
        // Save to cache
        try {
          localStorage.setItem('pt_cached_coupons', JSON.stringify(currentDocs));
          localStorage.setItem('pt_cached_coupons_time', Date.now().toString());
        } catch (e) {
          console.warn("Coupons caching error:", e);
        }

        calculateCount(currentDocs);
      } catch (err) {
        console.warn("coupons count load error:", err);
        if (isMounted) {
          setActiveCouponsCount(0);
        }
      }
    };

    fetchCouponsCount();

    const handleStorageChange = () => {
      if (currentDocs.length > 0) {
        calculateCount(currentDocs);
      } else {
        fetchCouponsCount();
      }
    };
    window.addEventListener('used_coupons_changed', handleStorageChange);
    
    const handleDataChange = () => {
      // Force a re-fetch since data changed in Firebase (cache was cleared)
      fetchCouponsCount();
    };
    window.addEventListener('coupons_data_changed', handleDataChange);

    return () => {
      isMounted = false;
      window.removeEventListener('used_coupons_changed', handleStorageChange);
      window.removeEventListener('coupons_data_changed', handleDataChange);
    };
  }, []);

  return activeCouponsCount;
}
