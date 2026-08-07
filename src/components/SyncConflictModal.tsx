import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, LogOut, AlertTriangle } from 'lucide-react';

export interface SyncConflictData {
  cloudCount?: number;
  localCount?: number;
  cloudPetsCount?: number;
  localPetsCount?: number;
  cloudActiveSlotsCount?: number;
  localActiveSlotsCount?: number;
  resolve: (choice: 'merge' | 'cloud' | 'local') => void;
}

interface SyncConflictModalProps {
  syncConflict: SyncConflictData | null;
  onCancelConflict: () => void;
  onLogout: (force?: boolean) => void;
  showOverwriteConfirm: boolean;
  setShowOverwriteConfirm: (show: boolean) => void;
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
  syncConflict,
  onCancelConflict,
  onLogout,
  showOverwriteConfirm,
  setShowOverwriteConfirm,
}) => {
  return (
    <AnimatePresence>
      {syncConflict && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-stone-100 overflow-hidden z-10"
          >
            <div className="p-6 md:p-8 space-y-6">
              {!showOverwriteConfirm ? (
                <>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl">
                      <RefreshCcw className="h-8 w-8 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">도감 데이터 동기화 선택</h3>
                    <p className="text-[14px] text-stone-500 leading-relaxed px-1">
                      {!localStorage.getItem('sync_resolved_uid') 
                        ? "로그인 전에 입력된 도감 이력이 발견되었습니다. 기존 계정 데이터와 어떻게 동기화할지 선택해 주세요."
                        : "이전 세션 또는 다른 계정의 로컬 데이터 이력이 발견되었습니다. 기존 계정 데이터와 어떻게 동기화할지 선택해 주세요."
                      }
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Option 1: Merge (Recommended) */}
                    <button
                      onClick={() => syncConflict.resolve('merge')}
                      className="w-full p-4 text-left border-2 border-indigo-500 hover:bg-indigo-50/50 rounded-2xl transition-all group flex items-start gap-3.5 cursor-pointer"
                    >
                      <div className="mt-0.5 p-1 px-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-black">합치기</div>
                      <div className="flex-1">
                        <div className="text-[14px] font-black text-slate-800 flex items-center gap-1.5">
                          두 데이터 병합하기 <span className="text-xs text-indigo-500 font-bold">(추천)</span>
                        </div>
                        <div className="text-xs text-stone-500 font-medium mt-1">
                          기존 계정 데이터와 {!localStorage.getItem('sync_resolved_uid') ? '로그인 전' : '현재 기기의'} 체크 항목, 등록된 반려동물(펫) 목록, 활성화된 작물 알림 정보를 지움 없이 안전하게 병합합니다.
                        </div>
                      </div>
                    </button>

                    {/* Option 2: Cloud only */}
                    <button
                      onClick={() => syncConflict.resolve('cloud')}
                      className="w-full p-4 text-left border border-stone-200 hover:border-stone-400 hover:bg-stone-50 rounded-2xl transition-all flex items-start gap-3.5 cursor-pointer"
                    >
                      <div className="mt-0.5 p-1 px-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-black">불러오기</div>
                      <div className="flex-1">
                        <div className="text-[14px] font-black text-slate-800">
                          기존 계정 데이터 유지
                        </div>
                        <div className="text-[11px] text-stone-500 font-bold mt-0.5 flex flex-wrap gap-x-2">
                          <span>• 도감 {syncConflict.cloudCount || 0}개 완료</span>
                          {(syncConflict.cloudPetsCount || 0) > 0 && <span>• 펫 {syncConflict.cloudPetsCount}마리</span>}
                          {(syncConflict.cloudActiveSlotsCount || 0) > 0 && <span>• 작물 알림 {syncConflict.cloudActiveSlotsCount}개</span>}
                        </div>
                        <div className="text-xs text-stone-500 font-medium mt-1.5">
                          서버에 보존 중이던 기존 이력 및 설정 데이터를 복원합니다. {!localStorage.getItem('sync_resolved_uid') ? '최근 로그인 없이 추가한 변경 정보' : '현재 기기에 저장되어 있던 로컬 데이터'}(도감 완료 {syncConflict.localCount || 0}개{(syncConflict.localPetsCount || 0) > 0 ? `, 펫 ${syncConflict.localPetsCount}마리` : ''}{(syncConflict.localActiveSlotsCount || 0) > 0 ? `, 알림 ${syncConflict.localActiveSlotsCount}개` : ''})는 사라집니다.
                        </div>
                      </div>
                    </button>

                    {/* Option 3: Guest only/Cloud overwrite */}
                    <button
                      onClick={() => setShowOverwriteConfirm(true)}
                      className="w-full p-4 text-left border border-rose-200 hover:border-rose-400 hover:bg-rose-50/30 rounded-2xl transition-all flex items-start gap-3.5 group cursor-pointer"
                    >
                      <div className="mt-0.5 p-1 px-1.5 bg-rose-50 text-rose-500 rounded-lg text-xs font-black">덮어쓰기</div>
                      <div className="flex-1">
                        <div className="text-[14px] font-black text-slate-800 group-hover:text-rose-600 transition-colors">
                          {!localStorage.getItem('sync_resolved_uid') ? '로그인 전 데이터로 덮어쓰기' : '현재 기기 데이터로 덮어쓰기'}
                        </div>
                        <div className="text-[11px] text-rose-600 font-bold mt-0.5 flex flex-wrap gap-x-2">
                          <span>• 도감 {syncConflict.localCount || 0}개 완료</span>
                          {(syncConflict.localPetsCount || 0) > 0 && <span>• 펫 {syncConflict.localPetsCount}마리</span>}
                          {(syncConflict.localActiveSlotsCount || 0) > 0 && <span>• 작물 알림 {syncConflict.localActiveSlotsCount}개</span>}
                        </div>
                        <div className="text-xs text-stone-500 font-medium mt-1.5">
                          서버에 저장된 정보를 모두 지우고, {!localStorage.getItem('sync_resolved_uid') ? '로그인하지 않은 상태에서 저장한 현재 내용' : '현재 기기에 남아있는 로컬 데이터'}로 교체합니다.
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onCancelConflict();
                        onLogout(false);
                      }}
                      className="w-full py-3.5 border border-stone-200 hover:bg-stone-50 text-stone-400 hover:text-stone-600 text-[11px] font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      로그아웃 (다음에 다시 선택하기)
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl">
                      <AlertTriangle className="h-8 w-8 animate-bounce" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">정말 덮어쓰시겠습니까?</h3>
                    <p className="text-[14px] text-stone-500 leading-relaxed px-1">
                      서버에 저장되어 있는 기존 계정 정보가 로컬 기기의 데이터로 전면 덮어씌워집니다.
                    </p>
                    
                    <div className="w-full text-left bg-stone-50 rounded-xl p-3.5 border border-stone-200/60 text-xs text-stone-600 space-y-1.5">
                      <div className="font-bold text-slate-700 flex items-center justify-between">
                        <span>🗑️ 영구 삭제될 데이터 (서버 저장분)</span>
                      </div>
                      <div className="pl-3 text-stone-500 font-medium">
                        • 도감 완료: {syncConflict.cloudCount || 0}개
                        {(syncConflict.cloudPetsCount || 0) > 0 && ` / 펫: ${syncConflict.cloudPetsCount}마리`}
                        {(syncConflict.cloudActiveSlotsCount || 0) > 0 && ` / 알림: ${syncConflict.cloudActiveSlotsCount}개`}
                      </div>
                      
                      <div className="font-bold text-rose-600 mt-2.5 flex items-center justify-between">
                        <span>💾 업로드될 데이터 (로컬 보관분)</span>
                      </div>
                      <div className="pl-3 text-stone-500 font-medium">
                        • 도감 완료: {syncConflict.localCount || 0}개
                        {(syncConflict.localPetsCount || 0) > 0 && ` / 펫: ${syncConflict.localPetsCount}마리`}
                        {(syncConflict.localActiveSlotsCount || 0) > 0 && ` / 알림: ${syncConflict.localActiveSlotsCount}개`}
                      </div>
                    </div>

                    <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                      ⚠️ 이 작업은 되돌릴 수 없습니다. 신중히 결정해 주세요!
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => syncConflict.resolve('local')}
                      className="w-full py-3.5 bg-rose-500 hover:bg-rose-650 active:scale-98 text-white font-black rounded-2xl transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      기존 내용 지우고 덮어쓰기
                    </button>
                    <button
                      onClick={() => setShowOverwriteConfirm(false)}
                      className="w-full py-3.5 bg-stone-100 hover:bg-stone-200 active:scale-98 text-stone-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      취소하고 동기화 방식 다시 선택
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
