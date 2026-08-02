import React, { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Mail, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const EmailVerificationBanner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = auth.currentUser;

  // Don't show if user is not logged in, or anonymous, or already verified
  if (!currentUser || currentUser.isAnonymous || currentUser.emailVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(currentUser);
      setSent(true);
    } catch (err: any) {
      console.error('Error sending verification email:', err);
      setError(err.message || 'Failed to send verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs font-semibold">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            Your email <strong className="font-extrabold">{currentUser.email}</strong> is not verified yet. Please check your inbox.
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <AnimatePresence mode="wait">
            {sent ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Link sent! Check inbox
              </span>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-[12px] font-bold text-[11px] hover:bg-amber-600 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                <span>Resend Verification Email</span>
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
