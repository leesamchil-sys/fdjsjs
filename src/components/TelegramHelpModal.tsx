import React from 'react';
import { X, Bot, User, Search, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TelegramHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramHelpModal: React.FC<TelegramHelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-neutral-100 flex flex-col max-h-[85svh] font-sans"
          >
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/50">
              <h3 className="text-sm font-extrabold text-neutral-900 flex items-center gap-2">
                <Bot className="h-4 w-4 text-indigo-600" />
                텔레그램 알림 상세 가이드
              </h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-5 text-neutral-600 text-xs leading-relaxed">
               <div className="space-y-3">
                 <h4 className="font-extrabold text-neutral-900 text-sm flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px]">1</span>
                    봇 생성 및 API 토큰 발급
                 </h4>
                 <p>텔레그램에서 <span className="font-bold text-neutral-800">@BotFather</span>를 검색하여 대화를 시작합니다.</p>
                 <p className="bg-neutral-100 p-2 rounded-lg font-mono text-[11px] text-neutral-700">/newbot 명령 전송 후 봇 이름과 ID를 설정하세요.</p>
                 <p>발급된 <span className="font-bold text-indigo-700">API Token</span>을 복사합니다.</p>
               </div>

               <div className="space-y-3 pt-2 border-t border-neutral-100">
                 <h4 className="font-extrabold text-neutral-900 text-sm flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px]">2</span>
                    봇 활성화
                 </h4>
                 <p>생성한 봇과의 대화방에 들어가 <span className="font-bold text-neutral-800">/start</span> 버튼을 누르거나 메시지를 보냅니다. (이 과정을 거쳐야 알림 발송이 가능해집니다!)</p>
               </div>

               <div className="space-y-3 pt-2 border-t border-neutral-100">
                 <h4 className="font-extrabold text-neutral-900 text-sm flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-black text-[10px]">3</span>
                    Chat ID 획득
                 </h4>
                 <p>텔레그램에서 <span className="font-bold text-neutral-800">@userinfobot</span>을 검색합니다.</p>
                 <p>대화방에 아무 메시지나 보내면 아래와 같이 본인 정보를 알려줍니다.</p>
                 <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 flex items-center gap-3">
                    <User className="h-6 w-6 text-rose-400" />
                    <div>
                        <p className="text-[10px] font-bold text-rose-800">Id: 123456789</p>
                        <p className="text-[9px] text-rose-600">이 숫자(ID)를 복사해서 Chat ID 필드에 입력하세요.</p>
                    </div>
                 </div>
               </div>

               <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-[11px] text-indigo-800 font-medium">
                  <p className="font-bold mb-1">💡 팁:</p>
                  <p>모든 정보 입력 후 상단의 '연동 테스트' 버튼을 눌러 메시지가 정상적으로 오는지 확인해 보세요.</p>
               </div>
            </div>

            <div className="p-4 border-t border-neutral-100 shrink-0">
               <button onClick={onClose} className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]">
                 닫기
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
