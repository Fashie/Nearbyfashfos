import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface AntiFraudPolicyProps {
  isOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const AntiFraudPolicy: React.FC<AntiFraudPolicyProps> = ({
  isOpenModal = false,
  onCloseModal
}) => {
  const rules = [
    { num: 1, title: 'User Registration', desc: 'The invited user must complete sign-up on nearby.fashfos.com using your valid referral code or link.' },
    { num: 2, title: 'Account Verification', desc: 'The new user must verify their phone number or email address via standard verification code.' },
    { num: 3, title: 'Profile Completion', desc: 'The user must upload a profile photo, display name, and set their campus or location.' },
    { num: 4, title: 'First Community Activity', desc: 'The new user completes registration and joins the Nearby community.' },
    { num: 5, title: '7-Day Activity Requirement', desc: 'The newly referred user must remain active on Nearby for at least 7 consecutive days before the referral is verified.' },
    { num: 6, title: 'Strict No Self-Referral Policy', desc: 'Self-referrals, duplicate accounts on the same device, or VPN manipulation are immediately disqualified.' },
    { num: 7, title: 'Pre-Payment Verification Audit', desc: 'Nearby reserves the right to audit referrals before disbursing cash prizes to guarantee authentic quality users.' }
  ];

  const content = (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[#F3F4F6] dark:border-slate-800 pb-4">
        <div className="p-3 bg-[#16A34A]/10 rounded-[18px] text-[#16A34A]">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-[#111827] dark:text-white font-display">Referral Verification & Anti-Fraud Policy</h3>
          <p className="text-xs text-[#6B7280] dark:text-slate-300">To maintain a genuine community, rewards are distributed after full 7-day verification.</p>
        </div>
      </div>

      <div className="space-y-3">
        {rules.map((r) => (
          <div key={r.num} className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-800 p-4 rounded-[18px] flex items-start gap-3 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
            <span className="w-7 h-7 rounded-[10px] bg-[#16A34A] text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              {r.num}
            </span>
            <div>
              <div className="font-bold text-[#111827] dark:text-white text-xs sm:text-sm">{r.title}</div>
              <div className="text-[#6B7280] dark:text-slate-300 text-xs mt-0.5 leading-relaxed">{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-4 rounded-[18px] flex items-center gap-3 text-[#111827] dark:text-slate-200 text-xs">
        <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
        <span>Fake bot registrations or self-referrals lead to immediate forfeiture of earnings and account ban.</span>
      </div>
    </div>
  );

  if (isOpenModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-6 max-w-2xl w-full space-y-4 shadow-2xl relative my-8">
          <button
            onClick={onCloseModal}
            className="absolute top-4 right-4 text-[#6B7280] dark:text-slate-400 p-1 bg-[#FAFAFA] dark:bg-slate-800 rounded-full"
          >
            ✕
          </button>
          {content}
          <button
            onClick={onCloseModal}
            className="w-full h-[56px] bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-bold rounded-[18px] text-xs shadow-sm mt-4"
          >
            I Understand & Agree to Policy
          </button>
        </div>
      </div>
    );
  }

  return (
    <section id="rules" className="py-14 bg-[#FAFAFA] dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {content}
      </div>
    </section>
  );
};
