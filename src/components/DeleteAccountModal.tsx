import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, RefreshCcw, Trash2 } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (val: string) => void;
  isDeleterLoading: boolean;
  deleteError: string | null;
  onDeleteAccount: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  deleteConfirmText,
  setDeleteConfirmText,
  isDeleterLoading,
  deleteError,
  onDeleteAccount,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isDeleterLoading) onClose();
            }}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 shadow-2xl p-6 overflow-hidden z-10 font-sans"
          >
            {/* Close Button */}
            <button
              disabled={isDeleterLoading}
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-300 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title Section */}
            <div className="flex items-center gap-3 mb-4 select-none">
              <div className="p-2.5 bg-red-100/80 dark:bg-red-500/20 rounded-2xl text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-stone-100 tracking-tight leading-tight">회원 탈퇴</h3>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">Account Delete & Goodbye</p>
              </div>
            </div>

            {/* Warning Notice Box */}
            <div className="space-y-3.5 mb-5 text-stone-605">
              <div className="p-4 bg-red-50/50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-xs space-y-2 text-red-950 dark:text-red-400 font-medium leading-relaxed">
                <p className="font-extrabold flex items-center gap-1 text-red-800 dark:text-red-300">
                  ⚠️ 주의 사항을 반드시 확인해 주세요!
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-red-900/90 dark:text-red-300/80">
                  <li>서버 데이터베이스의 <strong>모든 도감 수집 및 진행 내역, 성급, 날씨 정보</strong>가 <strong>영구적으로 복구 불가능하게 삭제</strong>됩니다.</li>
                  <li>서버에 연동 등록되어 있던 회원 인증 정보가 안전하게 탈퇴 및 영구 파기 처리됩니다.</li>
                  <li>웹 브라우저 임시보관 데이터가 싹 비워지고 완전히 초기 상태로 돌아갑니다.</li>
                  <li>이 작업은 어떠한 방법으로도 실행 취소할 수 없습니다.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block pl-1">
                  동의 확인 문구 입력
                </label>
                <p className="text-[10.5px] text-stone-500 dark:text-stone-500 pl-1 leading-snug">
                  안전한 탈퇴를 위해 아래 입력란에 <span className="font-extrabold text-red-700 dark:text-red-400">탈퇴하기</span>를 정확히 입력해 주세요.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={isDeleterLoading}
                  placeholder="탈퇴하기"
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-100 text-xs font-semibold focus:outline-none focus:border-red-500 dark:focus:border-red-400 focus:bg-white dark:focus:bg-stone-900 placeholder:text-stone-300 dark:placeholder:text-stone-700 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Error Box */}
            {deleteError && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200/50 rounded-2xl flex items-start gap-2 text-red-900">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-[10.5px] font-semibold leading-relaxed whitespace-pre-line">{deleteError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isDeleterLoading}
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/90 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isDeleterLoading || deleteConfirmText !== '탈퇴하기'}
                onClick={onDeleteAccount}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-98"
              >
                {isDeleterLoading ? (
                  <>
                    <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                    <span>탈퇴 진행 중...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>탈퇴하기</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
