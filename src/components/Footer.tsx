import React from 'react';
import { Coffee } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  user?: any;
  onDeleteAccount?: () => void;
  onOpenSupport: () => void;
  onOpenContact: () => void;
}

export default function Footer({ onOpenPrivacy, onOpenTerms, user, onDeleteAccount, onOpenSupport, onOpenContact }: FooterProps) {
  return (
    <footer className="mt-auto pt-4 pb-2 border-t border-stone-200/40 text-center select-none w-full">
      <div className="flex flex-col items-center gap-1 text-[10.5px] text-stone-400 font-medium font-sans">
        {/* <div className="flex items-center gap-3 mb-1">
          <button 
            onClick={onOpenSupport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEE500] text-[#3C1E1E] rounded-full font-black text-[10px] hover:bg-[#FDD800] transition-all active:scale-95 shadow-sm"
          >
            <Coffee className="h-3 w-3" />
            개발자 커피사주기
          </button>
        </div> */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenPrivacy}
            className="hover:text-amber-600 hover:underline transition-colors font-bold cursor-pointer text-stone-500"
          >
            개인정보 처리방침
          </button>
          <span className="text-stone-300">|</span>
          <button 
            onClick={onOpenTerms}
            className="hover:text-amber-600 hover:underline transition-colors font-bold cursor-pointer text-stone-500"
          >
            서비스약관
          </button>
          {user && onDeleteAccount && (
            <>
              <span className="text-stone-300">|</span>
              <button 
                onClick={onDeleteAccount}
                className="hover:text-red-600 hover:underline transition-colors font-bold cursor-pointer text-stone-500"
              >
                회원탈퇴
              </button>
            </>
          )}
        </div>
        <div className="text-[10px] text-stone-350 tracking-tight flex flex-col gap-0.5">
          <p>© 2026 PigTown. All rights reserved.</p>
          <p className="opacity-70 font-normal leading-tight px-4 max-w-xs mx-auto">
            개인이 운영하는 비공식 팬 사이트이며, 두근두근타운 공식과는 어떠한 관계도 없습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}

