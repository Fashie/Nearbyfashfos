import React from 'react';
import { Lock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ProtectedSectionProps {
  title: string;
  description: string;
  onOpenAuthModal: () => void;
}

export const ProtectedSection: React.FC<ProtectedSectionProps> = ({
  title,
  description,
  onOpenAuthModal
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-[#1E293B] rounded-[28px] border border-[#E5E7EB] dark:border-slate-700 p-8 sm:p-12 shadow-xl space-y-6 max-w-xl mx-auto"
      >
        <div className="w-16 h-16 rounded-3xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto border border-[#16A34A]/20">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[#111827] dark:text-white font-display">
            {title}
          </h2>
          <p className="text-sm text-[#6B7280] dark:text-slate-300 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[20px] p-4 text-left space-y-2 text-xs text-[#6B7280] dark:text-slate-400">
          <div className="font-bold text-[#111827] dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>Member Account Required</span>
          </div>
          <p>
            To prevent referral fraud and maintain accurate payouts, this feature requires a verified member account.
          </p>
        </div>

        <button
          onClick={onOpenAuthModal}
          className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-extrabold text-sm rounded-[20px] shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Sign In / Register Account</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
