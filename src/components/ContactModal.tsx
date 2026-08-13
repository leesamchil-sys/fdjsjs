import React, { useState, useEffect } from 'react';
import { X, Send, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: 'bug' | 'info' | 'suggest', message: string, file: File | null, memberStatus: 'member' | 'non-member' | null) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [reportType, setReportType] = useState<'bug' | 'info' | 'suggest'>('bug');
  const [message, setMessage] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [memberStatus, setMemberStatus] = useState<'member' | 'non-member' | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const showRefField = reportType === 'info' || reportType === 'suggest';

  useEffect(() => {
    if (!isOpen) return;

    setFileError(null);
    setFile(null);

    const checkCooldown = () => {
      const lastTime = localStorage.getItem('last_contact_submitted_time');
      if (lastTime) {
        const elapsed = Date.now() - parseInt(lastTime, 10);
        const remaining = Math.max(0, 60000 - elapsed);
        setCooldownRemaining(Math.ceil(remaining / 1000));
      } else {
        setCooldownRemaining(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();

    if (!memberStatus) {
      alert('회원 여부를 선택해주세요.');
      return;
    }
    if (trimmedMessage.length < 3) {
      alert('제보 내용을 최소 3자 이상 입력해주세요.');
      return;
    }
    if (cooldownRemaining > 0) return;

    let finalMessage = trimmedMessage;
    if (showRefField && referenceUrl.trim()) {
      finalMessage += `\n\n🔗 참고 사이트:\n${referenceUrl.trim()}`;
    }

    onSubmit(reportType, finalMessage, file, memberStatus);
    localStorage.setItem('last_contact_submitted_time', Date.now().toString());
    setCooldownRemaining(60);
    setMessage('');
    setReferenceUrl('');
    setFile(null);
    setMemberStatus(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 15 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 15 }} 
            className={cn(
              "relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-stone-200 dark:border-stone-800 transition-all",
              showRefField ? "space-y-3.5" : "space-y-5"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 dark:bg-amber-400/10 rounded-lg text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-stone-100">도감 및 기능 제보하기</h3>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">제보하신 내용은 최대한 빠르게 확인하겠습니다.</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-lg text-neutral-400 dark:text-stone-500 hover:bg-neutral-100 dark:hover:bg-stone-800 hover:text-neutral-600 dark:hover:text-stone-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selector */}
            <div className={cn("space-y-4", showRefField ? "space-y-3.5" : "space-y-4")}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider block">제보 구분</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'bug', label: '오류/버그', icon: AlertTriangle, activeClass: 'border-rose-500/30 bg-rose-50/50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400' },
                    { id: 'info', label: '도감 오류', icon: HelpCircle, activeClass: 'border-blue-500/30 bg-blue-50/50 text-blue-600 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-400' },
                    { id: 'suggest', label: '아이디어/기타', icon: Sparkles, activeClass: 'border-emerald-500/30 bg-emerald-50/50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400' }
                  ] as const).map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setReportType(type.id);
                        if (type.id === 'bug') {
                          setReferenceUrl(''); // clear if bug is selected
                        }
                      }}
                      className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                        reportType === type.id 
                          ? type.activeClass 
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950/60 text-stone-600 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 shadow-sm'
                      }`}
                    >
                      <type.icon className="h-3.5 w-3.5" />
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider block">회원 여부</label>
                <div className="flex gap-2">
                    {(['member', 'non-member'] as const).map(status => (
                        <button
                          key={status}                
                          type="button"
                          onClick={() => setMemberStatus(status)}
                          className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs font-bold border transition-all ${
                            memberStatus === status
                              ? 'border-neutral-900 dark:border-stone-100 bg-neutral-900 dark:bg-stone-100 text-white dark:text-stone-900'
                              : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950/60 text-stone-600 dark:text-stone-200'
                          }`}
                        >
                          {status === 'member' ? '회원' : '비회원'}
                        </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Reference URL Input */}
            {showRefField && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider block">참고할만한 사이트 (선택)</label>
                <input
                  type="text"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full text-xs font-semibold px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 focus:ring-2 focus:ring-stone-950/5 dark:focus:ring-white/5 transition-all"
                />
              </div>
            )}

            {/* File Input */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider block">스크린샷 첨부(선택, 최대 10MB)</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0] || null;
                      if (selectedFile) {
                        const maxSize = 10 * 1024 * 1024; // 10MB
                        if (selectedFile.size > maxSize) {
                          setFileError('이미지 용량은 10MB 이하여야 합니다.');
                          setFile(null);
                        } else {
                          setFileError(null);
                          setFile(selectedFile);
                        }
                      } else {
                        setFileError(null);
                        setFile(null);
                      }
                    }}
                    className="w-full text-xs text-stone-500 dark:text-stone-400
                      file:mr-4 file:py-1.5 sm:file:py-2 file:px-4
                      file:rounded-xl file:border-0
                      file:text-xs file:font-semibold
                      file:bg-stone-100 dark:file:bg-stone-800
                      file:text-stone-700 dark:file:text-stone-300
                      hover:file:bg-stone-200 dark:hover:file:bg-stone-700
                    "
                />
                {fileError && (
                  <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 animate-in fade-in duration-200">
                    ⚠️ {fileError}
                  </p>
                )}
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider block">제보 내용</label>
              <div className={cn(
                "relative overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 transition-all",
                showRefField ? "h-24" : "h-32"
              )}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={"자세하게 작성해주시면 큰 도움이 됩니다.\n예) '곤충 등장 시간이 달라요.', '버튼이 눌리지 않아요.'"}
                  className="w-[133.33%] text-[16px] p-3.5 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:border-stone-900 dark:focus:border-stone-100 focus:ring-4 focus:ring-stone-950/5 dark:focus:ring-white/5 focus:outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500 font-medium font-sans resize-none origin-top-left scale-75 animate-in fade-in duration-200"
                  style={{ height: showRefField ? '128px' : '170.7px' }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 sm:py-3 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-850 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                닫기
              </button>
              <button
                onClick={handleSubmit}
                disabled={cooldownRemaining > 0 || !!fileError}
                className="flex-1 py-2.5 sm:py-3 bg-neutral-900 dark:bg-stone-100 hover:bg-neutral-800 dark:hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-white dark:text-stone-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Send className="h-3 w-3" />
                <span>{cooldownRemaining > 0 ? `${cooldownRemaining}초 대기` : '제보하기'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
