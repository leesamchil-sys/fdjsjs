import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyInner() {
  return (
    <div className="max-w-[1240px] w-full mx-auto pb-12 pt-2 px-4 sm:pt-6 sm:px-5 md:px-6 animate-fade-in">
      <div className="max-w-3xl space-y-4 text-[13.5px] sm:text-[14.5px] text-stone-600 dark:text-stone-300 leading-relaxed">
          <p>본 서비스(이하 '피그타운')는 로그인 시 최소한의 식별 정보와 서비스 이용에 필요한 최소 데이터만 보관하며, 사용자의 개인정보 보호를 최우선으로 생각합니다.</p>
          
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 mt-6">1. 📦 수집하는 개인정보 항목</h3>
            <p>본 서비스는 사용자의 도감 정보를 다른 기기에서도 확인할 수 있도록 아래의 최소한의 정보만 서버에 저장합니다.</p>
            
            <div className="bg-stone-50/80 dark:bg-stone-800/20 rounded-xl p-4 sm:p-5 border border-stone-200/60 dark:border-stone-800/60 space-y-3 mt-1">
              <div className="flex gap-3">
                <span className="font-black text-amber-600 dark:text-amber-400">①</span>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-stone-200 mb-1">구글 고유 식별값(UID) 및 이메일 주소</h4>
                  <p className="text-sm">구글 로그인을 할 때 부여되는 고유 코드 번호와 이메일 주소입니다.<br /><span className="text-stone-500 dark:text-stone-400">(※ 로그인 후 계정 식별 및 데이터베이스 연동을 위해 안전하게 저장되며, 그 외 이름, 연락처 등의 개인정보는 일체 서버에 저장되지 않습니다.)</span></p>
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-3 border-t border-stone-200/50 dark:border-stone-800/50">
                <span className="font-black text-amber-600 dark:text-amber-400">②</span>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-stone-200 mb-1/2">도감 진행 상태 정보</h4>
                  <p className="text-sm">사용자가 수집 완료를 체크한 도감 정보(새, 곤충, 물고기 등) 및 각 항목의 달성 성급 정보를 저장합니다.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-3 border-t border-stone-200/50 dark:border-stone-800/50">
                <span className="font-black text-amber-600 dark:text-amber-400">③</span>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-stone-200 mb-1/2">작물 재배 타이머 정보</h4>
                  <p className="text-sm">작물 재배 시작 시간, 완료 시간 설정값 등을 저장하여 어느 기기에서 접속하셔도 최신 상태를 이어서 확인하실 수 있습니다.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 mt-6">2. 🎯 개인정보의 수집 및 이용 목적</h3>
            <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100/50 dark:border-amber-900/30">
              <p className="text-amber-900 dark:text-amber-200/90">
                저장된 정보는 다른 사용자에게 노출되거나 어떠한 제3자와도 공유되지 않으며, 오직 <strong className="text-amber-600 dark:text-amber-400">사용자의 개인 게임 진행 상태 동기화 목적</strong> 외에는 그 어떤 용도로도 가공되거나 사용되지 않습니다.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 mt-6">3. 💾 로컬(기기 내부) 저장 정보 안내</h3>
            <div className="bg-stone-50 border-l-4 border-l-stone-300 dark:bg-stone-800/40 dark:border-l-stone-600 rounded-r-xl p-4 mt-1">
              <p className="text-sm text-stone-700 dark:text-stone-300">다음과 같은 민감하거나 개별적인 설정 정보는 서버로 전송되지 않으며, 사용자 기기(브라우저)의 로컬 저장소(Local Storage)에만 자동 분리 보존됩니다.</p>
              <ul className="list-disc leading-loose pl-5 text-sm font-medium text-stone-600 dark:text-stone-400 mt-2">
                <li>텔레그램 봇 토큰 및 채팅 ID</li>
                <li>커스텀 구글 웹앱(GAS) 주소</li>
                <li>효과음(On/Off) 및 테마 설정</li>
              </ul>
            </div>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 mt-6">4. 🗑️ 개인정보의 파기</h3>
            <p>사용자가 회원 탈퇴를 요청하는 경우, 서버에 저장된 사용자 식별 정보(UID, 이메일) 및 이용 기록(도감, 작물 데이터 등)은 지체 없이 복구 불가능한 방법으로 영구 삭제됩니다.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 mt-6">5. 🛡️ 보안에 대한 안내</h3>
            <div className="bg-stone-50/80 dark:bg-stone-800/20 rounded-xl p-4 sm:p-5 border border-stone-200/60 dark:border-stone-800/60">
              <p>
                본 서비스는 애초에 사용자의 민감한 개인정보(이름, 연락처, 비밀번호 등)를 일체 수집하거나 저장하지 않기 때문에, 정보 유출로 인한 위험성이 매우 낮습니다. 앞으로도 게임 진행 상황 유지를 위한 최소한의 데이터만을 안전하게 취급하여 운영하도록 노력하겠습니다.
              </p>
            </div>
          </section>
          
          <div className="pt-8 text-sm text-stone-400 dark:text-stone-500">
            시행일자: 2026년 5월 31일
          </div>
      </div>
    </div>
  );
}
