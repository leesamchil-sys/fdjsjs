import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface LoginWarningModalProps {
  loginWarningType: 'webview' | 'iframe' | null;
  onClose: () => void;
  onOpenNewWindow: () => void;
  onGoogleLogin: (force?: boolean) => void;
}

export const LoginWarningModal: React.FC<LoginWarningModalProps> = ({
  loginWarningType,
  onClose,
  onOpenNewWindow,
  onGoogleLogin,
}) => {
  return (
    <AnimatePresence>
      {loginWarningType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-stone-200 dark:border-stone-800 animate-zoomIn"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-300 rounded-lg shrink-0">
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-extrabold text-xs text-stone-950 dark:text-stone-100">
                  {loginWarningType === 'webview' ? '구글 로그인 오류 방지 안내' : '구글 로그인 미리보기 제한 안내'}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3.5 space-y-4 text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
              {loginWarningType === 'webview' ? (
                <>
                  <div className="bg-stone-50 dark:bg-stone-950 rounded-xl p-3 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 font-bold">
                    카카오톡, 네이버 카페 등 인앱 브라우저에서는 구글 로그인이 차단될 수 있습니다.
                  </div>
                  
                  <p>
                    구글은 사용자 계정을 보호하기 위해 웹뷰 환경에서의 계정 인증 시도를 전면 금지하고 있습니다.
                  </p>

                  <div className="space-y-2 bg-stone-50/50 dark:bg-stone-950/50 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
                    <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-[10px] uppercase tracking-wider">🛠️ 해결 방법</h4>
                    <ol className="list-decimal pl-4 space-y-1.5 text-stone-600 dark:text-stone-400">
                      <li>화면 우측 상단이나 하단 메뉴 버튼(<span className="font-bold">`⋮`</span> 혹은 공유 버튼 <span className="font-bold">`⎋`</span>)을 탭합니다.</li>
                      <li><strong className="text-stone-950 dark:text-stone-200">'다른 브라우저로 열기'</strong> 또는 <strong className="text-stone-950 dark:text-stone-200">'Chrome/Safari로 열기'</strong>를 선택해 주세요.</li>
                      <li>또는, 주소를 복사하여 모바일의 기본 브라우저 주소창에 붙여넣어 접속해주세요.</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="bg-stone-50 dark:bg-stone-950 rounded-xl p-3.5 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 leading-snug">
                  <p className="font-extrabold mb-1">⚠️ 팝업 차단 / 로그인 실패 가능성 안내</p>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1.5">
                    미리보기 화면에서는 구글 보안 정책에 의해 <strong>로그인이 차단될 확률이 매우 높습니다</strong>.<br/><br/>
                    아래의 <strong className="text-sky-600 dark:text-sky-400">"새 창(새 탭)으로 열기"</strong> 버튼을 클릭하여 새 브라우저 탭에서 안정적으로 로그인하시는 것을 권장합니다!
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-2">
                {loginWarningType === 'iframe' && (
                  <button
                    onClick={onOpenNewWindow}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    🚀 새 창(새 탭)으로 열기
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const url = window.location.href;
                      navigator.clipboard.writeText(url);
                      alert("주소가 복사되었습니다! 새 브라우저 주소창에 붙여넣어 접속해 보세요.");
                    }}
                    className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl transition-all active:scale-95 text-[11px] text-center cursor-pointer"
                  >
                    주소 복사
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onGoogleLogin(true);
                    }}
                    className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 font-bold rounded-xl transition-all active:scale-95 text-[11px] text-center cursor-pointer"
                  >
                    무시하고 시도
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
