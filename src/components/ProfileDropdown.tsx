import React from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProfileDropdownProps {
  isMobile: boolean;
  authLoading: boolean;
  user: any;
  isProfileDropdownOpen: boolean;
  setIsProfileDropdownOpen: (open: boolean) => void;
  handleLogout: () => void;
  handleGoogleLogin: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isMobile,
  authLoading,
  user,
  isProfileDropdownOpen,
  setIsProfileDropdownOpen,
  handleLogout,
  handleGoogleLogin,
}) => {
  return (
    <div className={cn("flex items-center h-10 profile-dropdown-container", !isMobile ? "hidden lg:flex border-l border-stone-200/60 dark:border-stone-800 pl-3.5" : "")}>
      {authLoading ? (
        <div className="h-7 w-7 sm:h-8.5 sm:w-8.5 rounded-xl bg-neutral-100 dark:bg-stone-800 animate-pulse" />
      ) : user ? (
        <div className="relative font-sans">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="relative flex items-center justify-center rounded-xl overflow-visible hover:ring-2 hover:ring-stone-300 dark:hover:ring-stone-600 transition-all active:scale-95 cursor-pointer z-20 group"
          >
            {user.photoURL ? (
              <img referrerPolicy="no-referrer" src={user.photoURL} alt={user.displayName} className="h-7 w-7 sm:h-8.5 sm:w-8.5 rounded-xl object-cover bg-white shadow-xs border border-neutral-200 dark:border-stone-800" />
            ) : (
              <div className="h-7 w-7 sm:h-8.5 sm:w-8.5 rounded-xl border border-neutral-200 dark:border-stone-800 bg-neutral-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center font-black text-xs shadow-xs">
                {user.displayName ? user.displayName[0] : 'U'}
              </div>
            )}
            
            <div className="absolute -bottom-1 -right-1 bg-neutral-800 dark:bg-stone-200 border-2 border-white dark:border-stone-900 rounded-full h-3.5 w-3.5 flex items-center justify-center shadow-sm">
              <ChevronDown className="h-2 w-2 text-white dark:text-stone-900 stroke-[3]" />
            </div>
          </button>

          {isProfileDropdownOpen && (
            <>
              <div className="fixed inset-0 z-[240]" onClick={() => setIsProfileDropdownOpen(false)} />
              <div className={cn(
                "absolute top-[120%] min-w-[200px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden z-[250] animate-in fade-in slide-in-from-top-2 duration-200",
                isMobile ? "right-0 translate-x-1" : "right-0"
              )}>
                <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/20">
                  <p className="text-[13px] font-black text-stone-900 dark:text-white truncate pr-2">{user.displayName || '섬 주민'}</p>
                  <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 mt-0.5 truncate">{user.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer group"
                  >
                    로그아웃
                    <LogOut className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => handleGoogleLogin()}
          className="flex h-7 sm:h-8.5 items-center justify-center px-2.5 sm:px-3 rounded-lg bg-neutral-900 dark:bg-stone-100 hover:bg-neutral-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-[10px] sm:text-[11.5px] font-black transition-all active:scale-95 shadow-sm shadow-slate-900/10 cursor-pointer w-[64px] sm:w-auto"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-3.5 h-3.5 bg-white rounded-full p-0.5 shrink-0 sm:mr-1.5", isMobile ? "hidden" : "hidden sm:block")}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="whitespace-nowrap">로그인</span>
        </button>
      )}
    </div>
  );
};
