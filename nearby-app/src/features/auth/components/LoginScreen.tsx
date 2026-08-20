import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Radar, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../../../context/AppContext';
import { isValidEmail } from '../../../utils/validators';

interface LoginScreenProps {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSwitchToSignup,
  onSwitchToForgotPassword
}) => {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const { triggerBeep } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      triggerBeep(300, 0.15);
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      triggerBeep(300, 0.15);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      triggerBeep(520, 0.1);
    } catch (err: any) {
      const msg = err.message?.includes('invalid-credential') || err.message?.includes('user-not-found')
        ? 'Invalid email or password. Please try again.'
        : 'Sign-in failed. Please check your connection.';
      setError(msg);
      triggerBeep(280, 0.2);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      triggerBeep(520, 0.1);
    } catch (err: any) {
      setError('Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0C0E] text-white font-sans p-6 justify-between max-w-md mx-auto relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[#0F8A5F]/15 blur-[100px] pointer-events-none" />

      {/* Top Brand */}
      <div className="pt-8 relative z-10">
        <div className="flex items-center space-x-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0F8A5F]/20 border border-[#0F8A5F]/40 flex items-center justify-center">
            <Radar className="w-6 h-6 text-[#0F8A5F]" />
          </div>
          <span className="text-[20px] font-bold tracking-tight">Nearby</span>
        </div>

        <h1 className="text-[26px] font-bold tracking-tight mb-1">Welcome back</h1>
        <p className="text-[14px] text-neutral-400">Sign in to connect with neighbors around you</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 my-auto py-6 relative z-10">
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
              id="login-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-12 pl-10 pr-4 bg-neutral-900/80 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-[14px] focus:outline-none focus:border-[#0F8A5F] transition"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[13px] font-medium text-neutral-300">Password</label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-[12px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="login-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 pl-10 pr-4 bg-neutral-900/80 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-[14px] focus:outline-none focus:border-[#0F8A5F] transition"
              required
            />
          </div>
        </div>

        <button
          id="login-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-semibold text-[15px] rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50 mt-2 shadow-md active:scale-98"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-[12px]">
            <span className="bg-[#0B0C0E] px-2 text-neutral-500">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-white font-medium text-[14px] flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </form>

      {/* Switch to Sign up */}
      <div className="text-center pb-6 relative z-10">
        <p className="text-[13px] text-neutral-400">
          Don't have an account?{' '}
          <button
            id="login-switch-signup-btn"
            onClick={onSwitchToSignup}
            className="text-emerald-400 font-semibold hover:underline cursor-pointer"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
};
