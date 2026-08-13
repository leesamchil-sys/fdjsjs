import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  Calendar,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
  Pencil,
  Share2
} from 'lucide-react';
import { collection, doc, onSnapshot, addDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface Coupon {
  id: string;
  code: string;
  title: string;
  expiredAt: string; // YYYY-MM-DD
  createdAt?: string;
}

const isNewCoupon = (createdAt?: string) => {
  if (!createdAt) return false;
  try {
    const createdTime = new Date(createdAt).getTime();
    const nowTime = new Date().getTime();
    const diffMs = nowTime - createdTime;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3; // 3일 이내 등록됨
  } catch (e) {
    return false;
  }
};

interface CouponSectionProps {
  user: any;
  allowedUids: string[];
}

export default function CouponSection({ user, allowedUids }: CouponSectionProps) {
  // Accordion fold/unfold states (default open for active and today, closed for expired)
  const [isTodayOpen, setIsTodayOpen] = useState(true);
  const [isActiveOpen, setIsActiveOpen] = useState(true);
  const [isExpiredOpen, setIsExpiredOpen] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to calculate KST date strings
  const getKSTDateString = (daysOffset: number = 0) => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetDate = new Date(utc + (9 * 60 * 60000) + (daysOffset * 24 * 60 * 60000));
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getKSTDateString(0);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [currentTime] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [usedCoupons, setUsedCoupons] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('used_coupons');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

  // Admin states
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [expiredAt, setExpiredAt] = useState('');
  const [expiredTime, setExpiredTime] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setTitle(coupon.title);
    
    // Parse expiredAt for time
    if (coupon.expiredAt.includes(' ')) {
      const [date, time] = coupon.expiredAt.split(' ');
      setExpiredAt(date);
      setExpiredTime(time);
    } else {
      setExpiredAt(coupon.expiredAt);
      setExpiredTime('');
    }
    
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCoupon(null);
    setCode('');
    setTitle('');
    setExpiredAt('');
    setExpiredTime('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeAddModal = () => {
    setEditingCoupon(null);
    setCode('');
    setTitle('');
    setExpiredAt('');
    setExpiredTime('');
    setFormError(null);
    setIsModalOpen(false);
  };

  const closeEditModal = () => {
    setEditingCoupon(null);
    setCode('');
    setTitle('');
    setExpiredAt('');
    setExpiredTime('');
    setFormError(null);
    setIsEditModalOpen(false);
  };

  const openDeleteModal = (id: string) => {
    setCouponToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Admin Identification
  const adminUids = (import.meta.env.VITE_ADMIN_UIDS || '').split(',');
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',');
  const isAdmin = !!(user && (
    adminUids.includes(user.uid) ||
    (user.email && adminEmails.includes(user.email)) ||
    user.email === 'hungry.pig001@gmail.com' ||
    allowedUids.includes(user.uid)
  ));

  // Real-time listener
  useEffect(() => {
    const couponsRef = collection(db, 'settings_coupons');
    const q = query(couponsRef, orderBy('expiredAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`[SNAPSHOT] settings_coupons - path: ${couponsRef.path}, size: ${snapshot.size}`);
      const items: Coupon[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          code: data.code || '',
          title: data.title || '',
          expiredAt: data.expiredAt || '',
          createdAt: data.createdAt || '',
        });
      });
      
      // 최신 등록순 정렬 (createdAt 내림차순, 없을 경우 아주 오래된 과거 시점으로 설정해 아래쪽에 배치)
      const sorted = items.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        
        if (timeB !== timeA) {
          return timeB - timeA; // 최신 등록순 (내림차순)
        }
        // 등록일이 동일하거나 둘 다 없는 경우, 만료일 기준 오름차순으로 정렬
        return a.expiredAt.localeCompare(b.expiredAt);
      });
      setCoupons(sorted);
      setLoading(false);
    }, (error) => {
      console.error("쿠폰 수신 실패:", error);
      setCoupons([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 2000);
  };

  const handleCopy = (id: string, codeText: string) => {
    navigator.clipboard.writeText(codeText)
      .then(() => {
        setCopiedId(id);
        showToast(`✓ 복사 완료: ${codeText}`);
        setTimeout(() => setCopiedId(null), 1200);

        // Record the stamp date in format yyyy.mm.dd
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const stampDate = `${yyyy}.${mm}.${dd}`;

        const updatedCoupons = { ...usedCoupons, [id]: stampDate };
        if (!usedCoupons[id]) {
          setUsedCoupons(updatedCoupons);
          try {
            localStorage.setItem('used_coupons', JSON.stringify(updatedCoupons));
            window.dispatchEvent(new Event('used_coupons_changed'));
          } catch (e) {
            console.error("Local storage save error:", e);
          }
        }
      })
      .catch((err) => {
        console.error("복사 오류:", err);
        showToast("❌ 복사에 실패했습니다.");
      });
  };

  const handleShareAvailable = () => {
    const available = [...expiringSoonCoupons, ...activeCoupons];
    if (available.length === 0) {
      showToast("📢 복사할 수 있는 쿠폰이 없습니다.");
      return;
    }

    let text = "✨ [두근두근타운 리딤코드] ✨\n\n";
    text += "🎁 사용 가능한 쿠폰 목록\n";
    text += "----------------------------\n";
    
    available.forEach((c, idx) => {
      let badgeText = '';
      if (isNewCoupon(c.createdAt)) {
        try {
          const date = new Date(c.createdAt!);
          if (!isNaN(date.getTime())) {
            const m = date.getMonth() + 1;
            const d = date.getDate();
            badgeText = ` [${m}월 ${d}일 신규 추가]`;
          }
        } catch (e) {
          // fallback in case of date parse error
          badgeText = ' [신규 추가]';
        }
      }
      text += `${idx + 1}.${badgeText}\n`;
      text += `🎟️ 리딤코드: ${c.code}\n`;
      // Ensure we don't have double emojis in the share text
      const cleanTitle = c.title.startsWith('🎀') ? c.title.replace('🎀', '').trim() : c.title.trim();
      text += `🎀 아이템: ${cleanTitle}\n`;
      
      const displayExp = c.expiredAt.includes(' ') 
        ? `${c.expiredAt} 까지` 
        : `${c.expiredAt} 까지`;
        
      text += `📅 만료일: ${displayExp}\n\n`;
    });
    
    text += "----------------------------\n";
    text += "출처: 피그타운(도감 수집/펫 먹이 기록/작물 성장 알림을 도와주는 사이트)\n";
    text += `🔗 주소: ${window.location.origin}`;

    navigator.clipboard.writeText(text).then(() => {
      showToast("✨ 전체 쿠폰 정보가 복사되었습니다!");
    }).catch(err => {
      console.error("공유하기 오류:", err);
      showToast("❌ 복사에 실패했습니다.");
    });
  };

  const handleDelete = async (id?: string) => {
    const targetId = id || couponToDelete;
    if (!targetId) return;
    try {
      const docRef = doc(db, 'settings_coupons', targetId);
      console.count("[WRITE] deleteDoc");
      console.log({
        function: "handleDelete",
        reason: "couponDeleted",
        path: docRef.path,
        time: new Date().toISOString()
      });
      await deleteDoc(docRef);
      setCoupons(prev => prev.filter(coupon => coupon.id !== targetId));
      showToast("🗑️ 쿠폰이 정상적으로 삭제되었습니다.");
    } catch (err) {
      console.error("삭제 실패:", err);
      showToast("❌ 쿠폰 삭제 중 에러가 발생했습니다.");
    } finally {
      setIsDeleteModalOpen(false);
      setCouponToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !expiredAt.trim() || !title.trim()) {
      setFormError('쿠폰 코드, 내용, 만료일을 전부 알맞게 작성해 주세요.');
      return;
    }

    if (expiredAt < todayStr) {
      setFormError('지난 날짜는 선택할 수 없습니다.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    // 중복 쿠폰 코드 유효성 검사 (대소문자 구분 없이 비교)
    const normalizedCode = code.trim().toUpperCase();
    if (editingCoupon) {
      // 수정 중인 경우: 자기 자신을 제외한 다른 쿠폰과 중복되는지 확인
      const isDuplicate = coupons.some(c => c.id !== editingCoupon.id && c.code.trim().toUpperCase() === normalizedCode);
      if (isDuplicate) {
        setFormError('이미 등록된 동일한 쿠폰 코드가 존재합니다.');
        setSubmitting(false);
        return;
      }
    } else {
      // 신규 등록인 경우: 기존 전체 쿠폰 중 중복되는지 확인
      const isDuplicate = coupons.some(c => c.code.trim().toUpperCase() === normalizedCode);
      if (isDuplicate) {
        setFormError('이미 등록된 동일한 쿠폰 코드가 존재합니다.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const finalExpiredAt = expiredTime.trim() ? `${expiredAt} ${expiredTime.trim()}` : expiredAt;
      
      const couponData: any = {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        expiredAt: finalExpiredAt,
      };

      if (!editingCoupon) {
        // 새 쿠폰 추가 시에만 등록일자(createdAt) 부여
        couponData.createdAt = new Date().toISOString();
      }

      if (editingCoupon) {
        console.log("Updating coupon at:", `coupons/${editingCoupon.id}`);
        const docRef = doc(db, 'settings_coupons', editingCoupon.id);
        console.count("[WRITE] updateDoc");
        console.log({
          function: "handleSubmit_edit",
          reason: "couponUpdated",
          path: docRef.path,
          time: new Date().toISOString()
        });
        await updateDoc(docRef, couponData);
        showToast("✏️ 쿠폰이 수정되었습니다.");
      } else {
        console.log("Adding coupon to: coupons");
        const collRef = collection(db, 'settings_coupons');
        console.count("[WRITE] addDoc");
        console.log({
          function: "handleSubmit_add",
          reason: "couponAdded",
          path: collRef.path,
          time: new Date().toISOString()
        });
        await addDoc(collRef, couponData);
        showToast("🎉 새로운 리딤코드가 성공적으로 발행되었습니다!");
      }
      
      setCode('');
      setTitle('');
      setExpiredAt('');
      setExpiredTime('');
      setEditingCoupon(null);
      setIsEditModalOpen(false);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("작업 실패:", err);
      const errMsg = err.message || '';
      if (errMsg.includes('No document to update') || errMsg.includes('not-found')) {
        setFormError('수정하려는 쿠폰이 이미 데이터베이스에서 삭제되었거나 찾을 수 없습니다. 목록을 다시 확인해 주세요.');
      } else {
        setFormError(`오류: ${errMsg || err}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Group coupons
  const expiringSoonCoupons: Coupon[] = [];
  const activeCoupons: Coupon[] = [];
  const expiredCoupons: Coupon[] = [];

  coupons.forEach(coupon => {
    // Use currentTime for more precise expiration check
    let expiryStr = coupon.expiredAt;
    if (!expiryStr.includes(' ')) {
      expiryStr = `${expiryStr} 23:59:59`;
    }
    
    const expiryDate = new Date(expiryStr);
    const isExpired = currentTime > expiryDate;

    if (isExpired) {
      expiredCoupons.push(coupon);
    } else {
      // For "Expiring Soon", we check if it expires within 7 days
      const diffDays = (expiryDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 7) {
        expiringSoonCoupons.push(coupon);
      } else {
        activeCoupons.push(coupon);
      }
    }
  });

  // Calculate actual counts from Firestore (no hardcoded/simulated defaults)
  const displayExpiringSoonCount = expiringSoonCoupons.length;
  const displayActiveCount = activeCoupons.length;
  const displayExpiredCount = expiredCoupons.length;

  return (
    <div className="max-w-[1240px] mx-auto w-full font-sans text-left pb-16">
      
      {/* Admin floating button at top right */}
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>등록하기</span>
          </button>
        </div>
      )}

      <div className="space-y-4">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-10 h-10 border-4 border-stone-200 dark:border-stone-800 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">쿠폰 정보를 불러오는 중입니다...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center bg-white/50 dark:bg-stone-900/20 rounded-3xl border border-stone-100 dark:border-stone-800/60 shadow-xs">
            <div className="w-16 h-16 bg-stone-50 dark:bg-stone-800/50 rounded-2xl flex items-center justify-center mb-5 border border-stone-100 dark:border-stone-800 shadow-sm transform -rotate-3">
              <Ticket className="h-7 w-7 text-stone-300 dark:text-stone-600" />
            </div>
            <h3 className="text-[15px] font-bold text-stone-700 dark:text-stone-300 mb-1.5">등록된 리딤코드가 없습니다</h3>
            <p className="text-[13px] font-medium text-stone-400 dark:text-stone-500">
              새로운 코드가 발급되면 이곳에 표시됩니다.
            </p>
          </div>
        ) : (
          <>
            {/* SECTION 1: 🔥 마감임박 */}
            {expiringSoonCoupons.length > 0 && (
          <div className="rounded-2xl border border-stone-200/60 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-2xs overflow-hidden">
            <div
              onClick={() => setIsTodayOpen(!isTodayOpen)}
              onKeyDown={(e) => e.key === 'Enter' && setIsTodayOpen(!isTodayOpen)}
              role="button"
              tabIndex={0}
              className="w-full px-5 py-4 flex items-center justify-between bg-orange-500/[0.02] dark:bg-orange-500/[0.015] border-b border-stone-100 dark:border-stone-850 select-none cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🔥</span>
                <span className="text-sm font-black text-orange-600 dark:text-orange-400 tracking-tight">
                  마감 임박 쿠폰
                </span>
                <span className="font-mono text-[10px] font-black bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-0.5 rounded-full">
                  {displayExpiringSoonCount}
                </span>
              </div>
              {isTodayOpen ? (
                <ChevronUp className="h-4 w-4 text-stone-400 dark:text-stone-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-400 dark:text-stone-500" />
              )}
            </div>

            <AnimatePresence initial={false}>
              {isTodayOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden p-4 bg-stone-50/50 dark:bg-stone-900/40"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {expiringSoonCoupons.map(coupon => (
                      <CouponDisplayCard 
                        key={coupon.id}
                        coupon={coupon}
                        type="today"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                        onDelete={openDeleteModal}
                        onEdit={openEditModal}
                        isAdmin={isAdmin}
                        todayStr={todayStr}
                        currentTime={currentTime}
                        usedDate={usedCoupons[coupon.id]}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* SECTION 2: 🟢 사용 가능 */}
        {activeCoupons.length > 0 && (
          <div className="rounded-2xl border border-stone-200/60 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-2xs overflow-hidden">
            <div
              onClick={() => setIsActiveOpen(!isActiveOpen)}
              onKeyDown={(e) => e.key === 'Enter' && setIsActiveOpen(!isActiveOpen)}
              role="button"
              tabIndex={0}
              className="w-full px-5 py-4 flex items-center justify-between bg-emerald-500/[0.01] border-b border-stone-100 dark:border-stone-850 select-none cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🟢</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  사용 가능한 쿠폰
                </span>
                <span className="font-mono text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                  {displayActiveCount}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareAvailable();
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black transition-all cursor-pointer group/share"
                >
                  <Share2 className="h-3.5 w-3.5 transition-transform group-hover/share:scale-110" />
                  <span className="hidden sm:inline">공유하기</span>
                </button>
                {isActiveOpen ? (
                  <ChevronUp className="h-4 w-4 text-stone-400 dark:text-stone-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-stone-400 dark:text-stone-500" />
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {isActiveOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden p-4 bg-stone-50/50 dark:bg-stone-900/40"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {activeCoupons.map(coupon => (
                      <CouponDisplayCard 
                        key={coupon.id}
                        coupon={coupon}
                        type="active"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                        onDelete={openDeleteModal}
                        onEdit={openEditModal}
                        isAdmin={isAdmin}
                        todayStr={todayStr}
                        currentTime={currentTime}
                        usedDate={usedCoupons[coupon.id]}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* SECTION 3: ⚫ 만료됨 */}
        {expiredCoupons.length > 0 && (
          <div className="rounded-2xl border border-stone-200/60 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-2xs overflow-hidden">
            <div
              onClick={() => setIsExpiredOpen(!isExpiredOpen)}
              onKeyDown={(e) => e.key === 'Enter' && setIsExpiredOpen(!isExpiredOpen)}
              role="button"
              tabIndex={0}
              className="w-full px-5 py-4 flex items-center justify-between bg-stone-100/[0.3] dark:bg-stone-950/[0.2] border-b border-stone-100 dark:border-stone-850 select-none cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">⚫</span>
                <span className="text-sm font-black text-stone-500 dark:text-stone-400 tracking-tight">
                  만료된 쿠폰
                </span>
                <span className="font-mono text-[10px] font-black bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2.5 py-0.5 rounded-full">
                  {displayExpiredCount}
                </span>
              </div>
              {isExpiredOpen ? (
                <ChevronUp className="h-4 w-4 text-stone-400 dark:text-stone-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-400 dark:text-stone-500" />
              )}
            </div>

            <AnimatePresence initial={false}>
              {isExpiredOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden p-4 bg-stone-50/50 dark:bg-stone-900/40"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {expiredCoupons.map(coupon => (
                      <CouponDisplayCard 
                        key={coupon.id}
                        coupon={coupon}
                        type="expired"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                        onDelete={openDeleteModal}
                        onEdit={openEditModal}
                        isAdmin={isAdmin}
                        todayStr={todayStr}
                        currentTime={currentTime}
                        usedDate={usedCoupons[coupon.id]}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
          </>
        )}

      </div>

      {/* FLOAT TOAST NOTIFICATION CONTAINER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 bg-slate-900/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl border border-stone-800 shadow-xl text-white text-xs font-black tracking-tight flex items-center gap-2 max-w-[340px] text-center"
          >
            <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN POPUP CREATION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAddModal}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 p-6 shadow-2xl text-left z-10"
            >
              {/* Close Icon button */}
              <button
                onClick={closeAddModal}
                className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-stone-100 tracking-tight leading-none">
                    신규 리딤코드 등록
                  </h3>
                  <p className="text-[10px] font-extrabold text-stone-400 dark:text-stone-500 mt-1">
                    새롭게 발행된 인게임 쿠폰 코드를 실시간 DB에 추가합니다.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* Coupon Code input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 block">
                    인게임 쿠폰 코드 (자동 대문자 변환) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="예: PIGTOWN-HERO-99"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 text-xs font-bold rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Reward description / Title input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 block">
                    상품명 및 혜택 상세 정보 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="예: 🎁 전설 소환권 x10"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-bold rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Datepicker and Timepicker */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 block">
                      사용 만료일자 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={expiredAt}
                      onChange={(e) => setExpiredAt(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-bold rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 block">
                      만료 시간 (선택)
                    </label>
                    <input
                      type="time"
                      value={expiredTime}
                      onChange={(e) => setExpiredTime(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-bold rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-[11px] text-rose-500 font-black flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {formError}
                  </p>
                )}

                {/* Button actions */}
                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-black transition-all active:scale-95 cursor-pointer text-center"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 text-center"
                  >
                    {submitting ? '등록 중...' : '등록 완료'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN POPUP EDIT MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditModal}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 p-6 shadow-2xl text-left z-10"
            >
              {/* Close Icon button */}
              <button
                onClick={closeEditModal}
                className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-50 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-stone-100 tracking-tight leading-none">
                    쿠폰 정보 수정
                  </h3>
                  <p className="text-[10px] font-extrabold text-stone-400 dark:text-stone-500 mt-1">
                    기존 쿠폰의 내용을 수정합니다.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* Coupon Code input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 block">
                    인게임 쿠폰 코드 (자동 대문자 변환) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="예: PIGTOWN-HERO-99"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 text-xs font-bold rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Reward description / Title input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 block">
                    상품명 및 혜택 상세 정보 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="예: 🎁 전설 소환권 x10"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-bold rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Datepicker and Timepicker */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 block">
                      사용 만료일자 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={expiredAt}
                      onChange={(e) => setExpiredAt(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-bold rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 block">
                      만료 시간 (선택)
                    </label>
                    <input
                      type="time"
                      value={expiredTime}
                      onChange={(e) => setExpiredTime(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-bold rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-[11px] text-rose-500 font-black flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {formError}
                  </p>
                )}

                {/* Button actions */}
                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-black transition-all active:scale-95 cursor-pointer text-center"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 text-center"
                  >
                    {submitting ? '수정 중...' : '수정 완료'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN POPUP DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-8 shadow-2xl border border-stone-200 dark:border-stone-850 text-center z-10"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                <Trash2 className="h-7 w-7" />
              </div>
              <h4 className="mb-2 text-lg font-black text-stone-900 dark:text-stone-100">정말 삭제하시겠습니까?</h4>
              <p className="mb-8 text-xs font-bold text-stone-500 dark:text-stone-400">
                이 작업은 되돌릴 수 없으며 모든 데이터가 영구 삭제됩니다.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 rounded-xl bg-stone-100 dark:bg-stone-800 py-3 text-xs font-black text-stone-700 dark:text-stone-300 transition-colors hover:bg-stone-200 dark:hover:bg-stone-750 cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDelete()}
                  className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 py-3 text-xs font-black text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* 
  ELEGANT DRIBBBLE LEVEL PREMIUM CARD COMPONENT
  - Rounded corners (16px / rounded-2xl)
  - Card Gap (12px handled by the outer grid layout)
  - Internal Padding 16px (p-4)
  - Shadows applied nicely
  - Clicking anywhere on the card copies the code
*/
interface CouponDisplayCardProps {
  coupon: Coupon;
  type: 'today' | 'active' | 'expired';
  copiedId: string | null;
  onCopy: (id: string, code: string) => void;
  onDelete: (id: string) => void;
  onEdit: (coupon: Coupon) => void;
  isAdmin: boolean;
  todayStr: string;
  currentTime: Date;
  usedDate?: string | null;
}

const CouponDisplayCard: React.FC<CouponDisplayCardProps> = ({
  coupon,
  type,
  copiedId,
  onCopy,
  onDelete,
  onEdit,
  isAdmin,
  todayStr,
  currentTime,
  usedDate
}) => {
  const isExpired = type === 'expired';
  
  // Check if it's today (ignoring time for this specific check)
  const expiryDatePart = coupon.expiredAt.split(' ')[0];
  const isToday = expiryDatePart === todayStr;

  const d1 = new Date(todayStr);
  const d2 = new Date(expiryDatePart);
  const diffTime = d2.getTime() - d1.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div
      onClick={() => {
        if (!isExpired) {
          onCopy(coupon.id, coupon.code);
        }
      }}
      className={cn(
        "relative flex w-full min-h-[120px] overflow-hidden rounded-2xl border transition-all duration-300 select-none group/card cursor-pointer shadow-xs",
        isExpired
          ? "bg-stone-50 dark:bg-stone-900/80 border-stone-200/50 dark:border-stone-800 opacity-60 cursor-not-allowed"
          : usedDate
            ? "bg-stone-100/50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800"
            : isToday
              ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/50 dark:border-orange-900/50 hover:border-orange-400 dark:hover:border-orange-400 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              : "bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 hover:border-emerald-400 dark:hover:border-emerald-500/80 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
      )}
    >
      {/* Dimmed wrapper for core coupon info when used */}
      <div className={cn(
        "flex flex-1 w-full min-h-[118px] transition-all duration-300",
        usedDate && "opacity-[0.55] dark:opacity-[0.62] pointer-events-none"
      )}>
        {/* 1. Left Compartment: Main Gift / Reward Information */}
        <div className="flex-1 p-4 flex flex-col justify-between text-left relative overflow-hidden">
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {isExpired ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                만료됨
              </span>
            ) : (
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black border shadow-sm",
                isToday
                  ? "bg-orange-600 text-white border-orange-700 shadow-orange-500/20"
                  : daysDiff <= 7
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-500/30 dark:border-amber-700/50"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-700/50"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isToday ? "bg-white" : daysDiff <= 7 ? "bg-amber-500" : "bg-emerald-500")} />
                {daysDiff === 0 ? "오늘마감" : `D-${daysDiff}`}
              </span>
            )}
            {!isExpired && !usedDate && isNewCoupon(coupon.createdAt) && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-500 text-white border border-rose-600 shadow-sm shadow-rose-500/20 animate-pulse">
                NEW
              </span>
            )}
          </div>

          {/* Coupon Code in Main part (Large, Prominent) & Item Name wrapped under it */}
          <div className="my-1.5 flex flex-col text-left">
            <span className={cn(
              "font-mono text-base sm:text-lg font-black tracking-widest uppercase block truncate leading-tight",
              isExpired
                ? "text-stone-400 dark:text-stone-550 line-through"
                : isToday
                  ? "text-orange-600 dark:text-orange-400"
                  : daysDiff <= 7
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
            )}>
              {coupon.code}
            </span>
            <span className={cn(
              "text-[12px] sm:text-[13px] font-semibold text-stone-600 dark:text-stone-300 mt-1 leading-snug line-clamp-1",
              isExpired && "text-stone-400/80 dark:text-stone-500 line-through"
            )}>
              {coupon.title.startsWith('🎀') ? coupon.title : `🎀 ${coupon.title}`}
            </span>
          </div>

          {/* Date Footer */}
          <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-500 dark:text-stone-400 mt-2">
            <Calendar className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500 shrink-0" />
            <span>
              {coupon.expiredAt.includes(' ') 
                ? `${coupon.expiredAt} 까지` 
                : isToday 
                  ? "오늘 23:59 까지" 
                  : `${coupon.expiredAt} 까지`}
            </span>
          </div>
        </div>

        {/* 2. Vertical Coupon Tear-off Divider Line with top and bottom circular punch holes */}
        <div className="relative w-px flex flex-col justify-between items-center py-2 shrink-0">
          {/* Top Notch Hole */}
          <div className={cn(
            "absolute top-0 -translate-y-1/2 w-4 h-4 rounded-full bg-inherit border border-stone-200 dark:border-stone-700 z-10",
          )} />
          
          {/* Solid Tear Line */}
          <div className="h-full border-l border-solid border-stone-300 dark:border-stone-600 transition-colors" />
          
          {/* Bottom Notch Hole */}
          <div className={cn(
            "absolute bottom-0 translate-y-1/2 w-4 h-4 rounded-full bg-inherit border border-stone-200 dark:border-stone-700 z-10",
          )} />
        </div>

        {/* 3. Right Compartment: Narrow, Subtle Copy Zone */}
        <div className={cn(
          "w-[72px] sm:w-[84px] flex flex-col justify-center items-center p-2 relative z-10 text-center transition-colors shrink-0",
          isExpired
            ? "bg-stone-100/30 dark:bg-stone-900/10"
            : isToday
              ? "bg-orange-500/[0.01] dark:bg-orange-500/[0.02] group-hover/card:bg-orange-500/[0.06] dark:group-hover/card:bg-orange-500/[0.1]"
              : "bg-emerald-500/[0.01] dark:bg-emerald-500/[0.02] group-hover/card:bg-emerald-500/[0.06] dark:group-hover/card:bg-emerald-500/[0.1]"
        )}>
          {/* Subtle, non-flashy action feedback */}
          {isExpired ? (
            <span className="text-[10px] font-extrabold text-stone-400 dark:text-stone-500">
              만료
            </span>
          ) : usedDate ? (
            <div className="flex flex-col items-center gap-1 text-rose-500 dark:text-rose-450 font-black text-[10px] sm:text-[11px] tracking-tight">
              <Check className="h-4 w-4 text-rose-500" />
              <span>완료</span>
            </div>
          ) : (
            <div className={cn(
              "flex flex-col items-center gap-1 transition-all",
              isToday
                ? "text-stone-400 dark:text-stone-400 group-hover/card:text-orange-600 dark:group-hover/card:text-orange-400"
                : "text-stone-400 dark:text-stone-400 group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400"
            )}>
              <Copy className="h-4 w-4 shrink-0 opacity-60 group-hover/card:opacity-100" />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-tight">복사</span>
            </div>
          )}
        </div>
      </div>

      {/* Unified Stamp for Used/Expired */}
      <AnimatePresence>
        {(usedDate || isExpired) && (
          <motion.div
            initial={{ scale: 3, opacity: 0, rotate: -35 }}
            animate={{ scale: 1, opacity: 1, rotate: -10 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 140 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-20"
          >
            <div className={cn(
              "border-[3px] border-double font-black px-6 py-2.5 rounded-xl flex flex-col items-center justify-center leading-none select-none",
              isExpired
                ? "border-stone-500/60 text-stone-500/60 dark:border-stone-500/60 dark:text-stone-500/60"
                : usedDate && daysDiff <= 7
                  ? "border-orange-500/80 text-orange-500/80 dark:text-orange-400"
                  : usedDate
                    ? "border-emerald-500/80 text-emerald-500/80 dark:text-emerald-400"
                    : "border-stone-500/60 text-stone-500/60 dark:border-stone-500/60 dark:text-stone-500/60"
            )}>
              {usedDate && <span className="text-[9px] font-bold tracking-[0.15em] mb-1.5 opacity-85 font-mono">{usedDate}</span>}
              <span className="text-[13px] sm:text-[14px] font-black tracking-[0.3em] mr-[-0.3em] whitespace-nowrap uppercase">
                {usedDate ? "사용완료" : "사용 만료"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Edit Action overlaid on right area */}
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(coupon);
          }}
          className="absolute top-1.5 right-8 opacity-0 group-hover/card:opacity-100 transition-opacity p-1 rounded-md bg-stone-500 hover:bg-stone-600 text-white z-50 cursor-pointer"
          title="쿠폰 수정"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}

      {/* Admin Delete Action overlaid on right area */}
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(coupon.id);
          }}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity p-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white z-50 cursor-pointer"
          title="쿠폰 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
