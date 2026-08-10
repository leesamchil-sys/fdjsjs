import { useState, useRef } from 'react';
import versionData from '../version.json';

const APP_VERSION = versionData.version;

export function useContactReport() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'loading' | 'info'>('success');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleReportSubmit = async (
    reportType: 'bug' | 'info' | 'suggest',
    messageContent: string,
    files: File[],
    memberStatus: 'member' | 'non-member' | null
  ) => {
    setIsContactModalOpen(false);
    
    setToastType('loading');
    if (files && files.length > 0) {
      setToastMessage('이미지 전송중입니다.\n잠시만 기다려주세요.');
    } else {
      setToastMessage('전송중입니다.\n잠시만 기다려주세요.');
    }
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    const typeLabel = 
      reportType === 'bug' ? '🐛 기능 오류/버그' : 
      reportType === 'info' ? '📖 도감 정보 오류' : 
      '💡 개선 아이디어/기타';
    
    const memberLabel = memberStatus === 'member' ? '로그인 유저(회원)' : memberStatus === 'non-member' ? '비회원' : '미선택';

    const formattedMessage = `📢 [신규 제보 등록]\n\n• 분류: ${typeLabel}\n• 앱 버전: ${APP_VERSION}\n• 회원상태: ${memberLabel}\n• 내용:\n${messageContent}`;

    const formData = new FormData();
    formData.append('message', formattedMessage);
    
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          setToastType('success');
          setToastMessage('제보해주셔서 감사합니다.');
          toastTimeoutRef.current = setTimeout(() => {
            setToastMessage(null);
          }, 4000);
        } else {
          throw new Error(data?.error || 'Server error');
        }
      } else {
        throw new Error('HTTP status ' + response.status);
      }
    } catch (err) {
      console.error("Failed to send contact info:", err);
      setToastType('error');
      setToastMessage('시스템 오류로 인해 제보가 정상적으로 접수되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      toastTimeoutRef.current = setTimeout(() => {
        setToastMessage(null);
      }, 6000);
    }
  };

  return {
    isContactModalOpen,
    setIsContactModalOpen,
    toastMessage,
    setToastMessage,
    toastType,
    setToastType,
    toastTimeoutRef,
    handleReportSubmit,
  };
}
