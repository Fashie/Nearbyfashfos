import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../../../context/AppContext';
import { isValidEmail } from '../../../utils/validators';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const { sendPasswordReset } = useAuth();
  const { triggerBeep } = useApp();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      triggerBeep(300, 0.15);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSubmitted(true);
      triggerBeep(520, 0.1);
    } catch (err: any) {
      setError('Failed to send reset email. Please ensure the email is registered.');
      triggerBeep(280, 0.2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0C0E] text-white font-sans p-6 justify-between max-w-md mx-auto relative overflow-hidden">
      {/* Top back button */}
      <div className="pt-6">
        <button
          onClick={onBackToLogin}
          className="flex items-center space-x-2 text-neutral-400 hover:text-white text-[14px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to sign in</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="my-auto py-6">
        <h1 className="text-[24px] font-bold tracking-tight mb-2">Reset your password</h1>
        <p className="text-[14px] text-neutral-400 mb-6">
          Enter your registered email address and we'll send you instructions to reset your password.
        </p>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
            <h3 className="font-semibold text-[15px]">Check your inbox</h3>
            <p className="text-[13px] text-neutral-300">
              We have sent password reset instructions to <span className="font-medium text-white">{email}</span>.
            </p>
            <button
              onClick={onBackToLogin}
              className="mt-4 w-full h-11 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-semibold text-[14px] rounded-xl cursor-pointer transition"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[13px] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-neutral-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-10 pr-4 bg-neutral-900/80 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-[14px] focus:outline-none focus:border-[#0F8A5F] transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-semibold text-[15px] rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50 shadow-md active:scale-98"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="pb-6" />
    </div>
  );
};
