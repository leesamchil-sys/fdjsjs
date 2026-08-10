import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsOfServiceInner() {
  return (
    <div className="max-w-[1240px] w-full mx-auto pb-12 pt-2 px-4 sm:pt-6 sm:px-5 md:px-6 animate-fade-in">
      <div className="max-w-3xl space-y-4 text-[13.5px] sm:text-[14.5px] text-stone-600 dark:text-stone-300 leading-relaxed">
          <p>환영합니다! 본 서비스(이하 '피그타운')를 이용해 주셔서 감사합니다. 개인 프로젝트로 운영되는 사이트인 만큼, 가벼운 마음으로 이용 전 아래의 기본 안내 사항을 확인해 주시기 바랍니다.</p>
          
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 mt-6">1. 🎯 성격 및 목적</h3>
            <div className="bg-stone-50/80 dark:bg-stone-800/20 rounded-xl p-4 sm:p-5 border border-stone-200/60 dark:border-stone-800/60">
              <p>본 서비스는 취미 목적으로 무료 오픈된 <strong className="text-emerald-600 dark:text-emerald-400">비공식 팬 웹사이트</strong>입니다. 게임 도감과 작물 타이머 등의 편의를 돕기 위해 만들어졌으며, 두근두근타운의 원작사 및 공식 채널과는 일체 관련이 없습니다.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 mt-6">2. ⚙️ 데이터 보관 및 서비스 제공</h3>
            <div className="bg-stone-50/80 dark:bg-stone-800/20 rounded-xl p-4 sm:p-5 border border-stone-200/60 dark:border-stone-800/60">
              <ul className="list-disc leading-loose pl-5 space-y-1">
                <li>비영리로 운영되는 서버 환경 특성상 오류나 대규모 개편 등으로 인해 <strong>도감 진행 상황 등의 데이터가 예기치 않게 소실될 수 있으며, 완전한 복구를 보증하기 어렵습니다.</strong> 중요한 메모 등은 별도로 관리해 주시길 권장합니다.</li>
                <li>개발자 개인 사정이나 시스템 이슈, 혹은 원작자의 요청이 발생할 경우 사전 공지 없이 서비스의 일부 기능이나 전체 운영이 중단될 수 있습니다.</li>
                <li>원할 시 언제든지 더보기 탭에서 자신의 데이터를 삭제하고 회원 탈퇴를 진행하실 수 있습니다.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 mt-6">3. 🔗 외부 기능 연동 (Telegram 등)</h3>
            <div className="bg-stone-50/80 dark:bg-stone-800/20 rounded-xl p-4 sm:p-5 border border-stone-200/60 dark:border-stone-800/60">
              <p>구글 스크립트(GAS)나 텔레그램 알림 등 사용자가 선택적으로 연결하는 파생 기능은 사용 환경에 따라 원활하지 않을 수 있으며, 외부 서비스 자체의 변동으로 발생하는 문제에 대해서는 조치가 지연되거나 불가능할 수 있습니다.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 mt-6">4. 🎨 저작권</h3>
            <div className="bg-stone-50/80 dark:bg-stone-800/20 rounded-xl p-4 sm:p-5 border border-stone-200/60 dark:border-stone-800/60">
              <p>본 서비스 내에 포함된 원작 게임(두근두근타운) 관련 이미지, 명칭, 아이템 등 모든 에셋의 지식재산권은 게임의 원작사에게 귀속됩니다.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 mt-6">5. 🛠️ 이용자 지원</h3>
            <div className="bg-sky-50/60 dark:bg-sky-900/10 rounded-xl p-4 sm:p-5 border border-sky-100/60 dark:border-sky-900/30">
              <p className="text-sky-900/90 dark:text-sky-200/90 font-medium">
                본 서비스를 아껴주시는 모든 분들께 깊이 감사드리며, <strong>건의해 주시는 버그 및 개선 사항에 대해서는 가능한 범위 내에서 최대한 성의 있게 대응하고 꾸준히 다듬어 나가겠습니다.</strong>
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
