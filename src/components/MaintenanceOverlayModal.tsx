import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Settings, RefreshCcw } from 'lucide-react';

interface MaintenanceOverlayModalProps {
  isShowMaintenance: boolean;
  isMaintenanceCompleted: boolean;
  manualCompletedPreview: boolean;
  isForceUpdateRequired: boolean;
  isPermissionDeniedError: boolean;
  isQuotaExceededError: boolean;
  isManualQuotaExceeded: boolean;
  isSyncingBeforeReload: boolean;
  maintenanceStart: string;
  maintenanceEnd: string;
  forceUpdateMessage: string;
  quotaCountdown: string;
  onUpdateAndSync: () => void;
}

export const MaintenanceOverlayModal: React.FC<MaintenanceOverlayModalProps> = ({
  isShowMaintenance,
  isMaintenanceCompleted,
  manualCompletedPreview,
  isForceUpdateRequired,
  isPermissionDeniedError,
  isQuotaExceededError,
  isManualQuotaExceeded,
  isSyncingBeforeReload,
  maintenanceStart,
  maintenanceEnd,
  forceUpdateMessage,
  quotaCountdown,
  onUpdateAndSync,
}) => {
  const shouldShow =
    isShowMaintenance ||
    isMaintenanceCompleted ||
    manualCompletedPreview ||
    isForceUpdateRequired ||
    isQuotaExceededError ||
    isManualQuotaExceeded ||
    isSyncingBeforeReload;

  if (!shouldShow) return null;

  const isQuota = isQuotaExceededError || isManualQuotaExceeded;

  return (
    <div className={`fixed inset-0 z-[10000] ${isQuota ? 'bg-stone-900/40 dark:bg-stone-950/60' : 'bg-stone-900/80 dark:bg-stone-950/90'} backdrop-blur-md flex items-center justify-center p-6 text-center`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-3xl shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {isQuota ? (
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <img src="/images/new_logo.webp" alt="logo" className="w-full h-full object-contain animate-bounce" />
          </div>
        ) : (
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            (isMaintenanceCompleted || manualCompletedPreview)
              ? 'bg-emerald-500/10' 
              : isShowMaintenance 
                ? 'bg-blue-500/10' 
                : 'bg-amber-500/10'
          }`}>
            {(isMaintenanceCompleted || manualCompletedPreview) ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-500 animate-bounce" />
            ) : isShowMaintenance ? (
              <Settings className="h-8 w-8 text-blue-500 animate-spin-slow" />
            ) : (
              <RefreshCcw className={`h-8 w-8 text-amber-500 ${isSyncingBeforeReload ? 'animate-spin' : 'animate-spin-slow'}`} />
            )}
          </div>
        )}
        
        <h2 className="text-xl font-bold text-slate-900 dark:text-stone-100 mb-3">
          {(isMaintenanceCompleted || manualCompletedPreview) ? '서버 점검이 완료되었습니다!' :
           isShowMaintenance ? '서버 점검 중입니다' :
           isForceUpdateRequired 
             ? '업데이트가 필요합니다' 
             : isQuota 
               ? '서버 할당량 초과' 
               : '데이터 동기화 오류'}
        </h2>
        
        <div className="text-slate-600 dark:text-stone-400 text-sm leading-relaxed mb-8">
          {(isMaintenanceCompleted || manualCompletedPreview) ? (
            <>
              아래 버튼을 눌러 앱을 다시 시작해 주세요.
            </>
          ) : isShowMaintenance ? (
            <>
              더 안정적인 서비스를 위해 서버 점검 중입니다.<br />
              {maintenanceStart && maintenanceEnd && (
                <div className="my-3.5 p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 text-[11px] font-black border border-blue-200 dark:border-blue-500/20 leading-tight">
                  점검 예정 시간<br/>
                  <span className="text-blue-500 dark:text-blue-300 text-[13px] mt-1 inline-block font-mono">{maintenanceStart} ~ {maintenanceEnd}</span>
                </div>
              )}
            </>
          ) : isForceUpdateRequired ? (
            <>
              {forceUpdateMessage.trim() ? (
                <span className="whitespace-pre-wrap">{forceUpdateMessage.trim()}</span>
              ) : (
                <>안정적인 서비스 이용을 위해<br />최신 버전 업데이트가 필요합니다.</>
              )}
            </>
          ) : isQuota ? (
            <>금일 접속자가 많아 서버 허용량을 초과했습니다.<br />16시 10분 이후에 접속 부탁드립니다.</>
          ) : isSyncingBeforeReload ? (
            <>데이터를 동기화하고 있습니다.<br />잠시만 기다려 주세요.</>
          ) : (
            <>데이터 동기화에 실패했습니다.<br />문제가 계속되면 수동으로 새로고침해 주세요.</>
          )}
        </div>

        {isQuota && quotaCountdown !== "00:00:00" ? (
          <div className="w-full bg-stone-50 dark:bg-stone-900 text-slate-800 dark:text-white font-bold py-4 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-inner dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border border-stone-200 dark:border-stone-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
            <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-widest opacity-90 relative z-10">재시작까지 남은 시간</span>
            <span className="text-xl font-mono tabular-nums tracking-widest relative z-10 drop-shadow-sm dark:drop-shadow-md">{quotaCountdown || "00:00:00"}</span>
          </div>
        ) : (
          <button 
            onClick={onUpdateAndSync}
            className={`w-full ${
              (isMaintenanceCompleted || manualCompletedPreview)
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                : isShowMaintenance 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-amber-500 hover:bg-amber-600 text-stone-950'
            } font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer`}
          >
            {(isMaintenanceCompleted || manualCompletedPreview) ? "지금 시작하기" : 
             isShowMaintenance ? "새로고침" : 
             (isPermissionDeniedError || isQuota ? "새로고침" : "지금 업데이트")}
          </button>
        )}
      </motion.div>
    </div>
  );
};
