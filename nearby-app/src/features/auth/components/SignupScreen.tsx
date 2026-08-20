import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Radar, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../../../context/AppContext';
import { isValidEmail, isValidPassword } from '../../../utils/validators';

interface SignupScreenProps {
  onSwitchToLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onSwitchToLogin }) => {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { triggerBeep } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      triggerBeep(300, 0.15);
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      triggerBeep(300, 0.15);
      return;
    }
    if (!isValidPassword(password)) {
      setError('Password must be at least 6 characters.');
      triggerBeep(300, 0.15);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, name.trim());
      triggerBeep(520, 0.1);
    } catch (err: any) {
      const msg = err.message?.includes('email-already-in-use')
        ? 'An account with this email already exists.'
        : 'Registration failed. Please try again.';
      setError(msg);
      triggerBeep(280, 0.2);
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

        <h1 className="text-[26px] font-bold tracking-tight mb-1">Create an account</h1>
        <p className="text-[14px] text-neutral-400">Join your neighborhood community today</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 my-auto py-4 relative z-10">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[13px] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-[13px] font-medium text-neutral-300 mb-1.5">Full name</label>
          <div className="relative">
            <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="signup-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sade Bello"
              className="w-full h-12 pl-10 pr-4 bg-neutral-900/80 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-[14px] focus:outline-none focus:border-[#0F8A5F] transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-neutral-300 mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="signup-email-input"
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
          <label className="block text-[13px] font-medium text-neutral-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="signup-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full h-12 pl-10 pr-4 bg-neutral-900/80 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-[14px] focus:outline-none focus:border-[#0F8A5F] transition"
              required
            />
          </div>
        </div>

        <button
          id="signup-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-semibold text-[15px] rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50 mt-2 shadow-md active:scale-98"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Sign In */}
      <div className="text-center pb-6 relative z-10">
        <p className="text-[13px] text-neutral-400">
          Already have an account?{' '}
          <button
            id="signup-switch-login-btn"
            onClick={onSwitchToLogin}
            className="text-emerald-400 font-semibold hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
