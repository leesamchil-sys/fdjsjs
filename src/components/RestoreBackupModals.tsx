import React from 'react';
import { Database, Check, AlertTriangle } from 'lucide-react';

interface RestoreBackupModalsProps {
  importPendingData: any;
  setImportPendingData: (val: any) => void;
  restoreSuccessMessage: string | null;
  setRestoreSuccessMessage: (val: string | null) => void;
  restoreErrorMessage: string | null;
  setRestoreErrorMessage: (val: string | null) => void;
  onConfirmRestore: () => void;
}

export const RestoreBackupModals: React.FC<RestoreBackupModalsProps> = ({
  importPendingData,
  setImportPendingData,
  restoreSuccessMessage,
  setRestoreSuccessMessage,
  restoreErrorMessage,
  setRestoreErrorMessage,
  onConfirmRestore,
}) => {
  return (
    <>
      {/* Custom Confirm Restore Sub-modal outside settings modal */}
      {importPendingData && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div onClick={() => setImportPendingData(null)} className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md" />
          <div id="confirm-restore-overlay" className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
              <Database className="h-9 w-9" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-stone-50">도감 기록을 불러올까요?</h3>
            <div className="text-xs text-stone-550 dark:text-stone-400 leading-relaxed max-w-[280px]">
              선택한 백업 파일의 기록으로 기존 정보가 <strong className="text-rose-500">전부 덮어쓰기</strong>됩니다.<br />기존 정보는 복구할 수 없으니 주의하세요.
            </div>
            <div className="flex flex-col w-full gap-2 pt-1">
              <button
                type="button"
                onClick={onConfirmRestore}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                불러오기
              </button>
              <button
                type="button"
                onClick={() => setImportPendingData(null)}
                className="w-full py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-extrabold rounded-2xl text-xs transition-all active:scale-95 cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Success Sub-modal outside settings modal */}
      {restoreSuccessMessage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div onClick={() => setRestoreSuccessMessage(null)} className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md" />
          <div id="success-restore-overlay" className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
              <Check className="h-9 w-9" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-stone-50">불러오기 완료</h3>
            <div className="text-xs text-stone-550 dark:text-stone-400 leading-relaxed max-w-[280px]">
              {restoreSuccessMessage}
            </div>
            <button
              type="button"
              onClick={() => setRestoreSuccessMessage(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* Custom Error Sub-modal outside settings modal */}
      {restoreErrorMessage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div onClick={() => setRestoreErrorMessage(null)} className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md" />
          <div id="error-restore-overlay" className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
              <AlertTriangle className="h-9 w-9" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-stone-50">불러오기 실패</h3>
            <div className="text-xs text-rose-500 leading-relaxed max-w-[280px] break-all font-bold">
              {restoreErrorMessage}
            </div>
            <button
              type="button"
              onClick={() => setRestoreErrorMessage(null)}
              className="w-full py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-extrabold rounded-2xl text-xs transition-all active:scale-95 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}
    </>
  );
};
