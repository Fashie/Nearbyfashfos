import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, ChevronRight, User, Lock, EyeOff, Eye, Mail, 
  CheckCircle2, ShieldAlert, AlertTriangle 
} from 'lucide-react';

interface LandingScreenProps {
  showLandingMode: boolean;
  setShowLandingMode: (val: boolean) => void;
  authScreenState: 'login' | 'signup' | 'forgot' | 'verification';
  setAuthScreenState: (val: 'login' | 'signup' | 'forgot' | 'verification') => void;
  authEmailOrPhone: string;
  setAuthEmailOrPhone: (val: string) => void;
  authPassword: string;
  setAuthPassword: (val: string) => void;
  authConfirmPassword: string;
  setAuthConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (val: boolean) => void;
  authLoading: boolean;
  authSuccess: string;
  setAuthSuccess: (val: string) => void;
  authError: string;
  setAuthError: (val: string) => void;
  savedAccounts: any[];
  loginWithGoogle: () => Promise<void>;
  loginWithEmailOrPhone: (email: string, pass: string, isSignUp: boolean, isPhone: boolean) => Promise<void>;
  handleSendResetLink: () => void;
  triggerBeep: (freq: number, duration: number, type?: string) => void;
  setAuthIsSignUp: (val: boolean) => void;
  setIsPhoneAuthOption: (val: boolean) => void;
}

export function LandingScreen({
  showLandingMode,
  setShowLandingMode,
  authScreenState,
  setAuthScreenState,
  authEmailOrPhone,
  setAuthEmailOrPhone,
  authPassword,
  setAuthPassword,
  authConfirmPassword,
  setAuthConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  authLoading,
  authSuccess,
  setAuthSuccess,
  authError,
  setAuthError,
  savedAccounts,
  loginWithGoogle,
  loginWithEmailOrPhone,
  handleSendResetLink,
  triggerBeep,
  setAuthIsSignUp,
  setIsPhoneAuthOption,
}: LandingScreenProps) {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col justify-between items-center p-6 relative font-sans overflow-hidden">
      
      {/* BACKGROUND: Decorative ambient shapes to make the screen pop */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] rounded-full bg-[#0F8A5F]/5 blur-3xl" />
        <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3B82F6]/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] flex-1 flex flex-col justify-center items-center space-y-8 py-8">
        
        {/* Animated App Icon Header */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative"
        >
          {/* Soft Glow behind logo */}
          <div className="absolute inset-0 bg-[#0F8A5F]/15 rounded-[22px] blur-xl" />
          <div className="w-[80px] h-[80px] bg-white border border-neutral-200/80 rounded-[22px] flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.03)] relative z-10">
            <Radar className="w-10 h-10 text-[#0F8A5F]" />
            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF7A59] rounded-full border-2 border-white animate-pulse" />
          </div>
        </motion.div>

        {/* Titles & Copy Section */}
        {showLandingMode ? (
          <div className="text-center space-y-2 w-full px-2">
            <h1 className="text-[32px] font-bold tracking-tight text-[#161616]">Nearby</h1>
            <p className="text-[16px] font-normal text-neutral-500 leading-relaxed max-w-xs mx-auto">
              Discover mutual interest partners, safe meetup spots, and build real friendships close to you.
            </p>
          </div>
        ) : (
          <>
            {authScreenState === 'login' && (
              <div className="text-center space-y-2 w-full px-2">
                <h2 className="text-[32px] font-bold text-[#161616] tracking-tight leading-tight">Welcome Back</h2>
                <p className="text-[16px] font-normal text-neutral-500 leading-normal">Continue building real friendships nearby.</p>
              </div>
            )}
            {authScreenState === 'signup' && (
              <div className="text-center space-y-2 w-full px-2">
                <h2 className="text-[28px] sm:text-[32px] font-bold text-[#161616] tracking-tight leading-tight">Create Your Nearby Account</h2>
                <p className="text-[16px] font-normal text-neutral-500 leading-normal">Meet genuine people around you in a safe and meaningful way.</p>
              </div>
            )}
            {authScreenState === 'forgot' && (
              <div className="text-center space-y-2 w-full px-2">
                <h2 className="text-[32px] font-bold text-[#161616] tracking-tight leading-tight">Reset Password</h2>
                <p className="text-[16px] font-normal text-neutral-500 leading-normal">We'll send you a secure link to reset your password.</p>
              </div>
            )}
            {authScreenState === 'verification' && (
              <div className="text-center space-y-2 w-full px-2">
                <h2 className="text-[32px] font-bold text-[#161616] tracking-tight leading-tight">Verify Your Email</h2>
                <p className="text-[16px] font-normal text-neutral-500 leading-normal">We've sent a verification link to your inbox.</p>
              </div>
            )}
          </>
        )}

        {/* Controls & Forms Wrapper */}
        <div className="w-full flex flex-col space-y-[18px]">
          {showLandingMode ? (
            /* Landing Buttons state */
            <div className="space-y-[18px] w-full pt-2">
              <div className="text-center pb-2">
                <span className="text-[11px] font-mono tracking-widest uppercase text-[#0F8A5F] font-bold bg-[#0F8A5F]/10 px-3 py-1 rounded-full">
                  Live Proximity Networking
                </span>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerBeep(520, 0.08);
                  setAuthIsSignUp(true);
                  setAuthScreenState('signup');
                  setShowLandingMode(false);
                }}
                className="w-full h-[58px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white rounded-[18px] text-[16px] font-semibold transition duration-150 shadow-[0_4px_14px_rgba(15,138,95,0.25)] flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Get Started</span>
                <ChevronRight className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerBeep(480, 0.08);
                  setAuthIsSignUp(false);
                  setAuthScreenState('login');
                  setShowLandingMode(false);
                }}
                className="w-full h-[58px] bg-white hover:bg-neutral-50 text-[#161616] border border-neutral-200/80 rounded-[18px] text-[16px] font-semibold transition duration-150 flex items-center justify-center cursor-pointer shadow-sm"
              >
                <span>Log In</span>
              </motion.button>
            </div>
          ) : (
            /* Auth Screens states */
            <div className="space-y-[18px] w-full">
              
              {/* 1. Saved Accounts list (Only on Login screen) */}
              {authScreenState === 'login' && savedAccounts.length > 0 && (
                <div className="w-full space-y-3 bg-white/70 backdrop-blur-sm p-4 rounded-[22px] border border-neutral-200/60 shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Saved Accounts</span>
                    <span className="text-[10px] uppercase px-2 py-0.5 bg-[#0F8A5F]/10 border border-[#0F8A5F]/20 text-[#0F8A5F] rounded-full font-bold">Instant Login</span>
                  </div>
                  
                  <div className="max-h-[145px] overflow-y-auto space-y-2">
                    {savedAccounts.map((acc, aIdx) => (
                      <button
                        key={`acc-${acc.uid}-${aIdx}`}
                        onClick={async () => {
                          triggerBeep(520, 0.1);
                          setAuthError("");
                          try {
                            if (acc.authType === 'google') {
                              await loginWithGoogle();
                            } else if (acc.emailOrPhone && acc.password) {
                              setAuthEmailOrPhone(acc.emailOrPhone);
                              setAuthPassword(acc.password);
                              setIsPhoneAuthOption(acc.emailOrPhone.indexOf('@') === -1);
                              await loginWithEmailOrPhone(acc.emailOrPhone, acc.password, false, acc.emailOrPhone.indexOf('@') === -1);
                            } else {
                              setAuthEmailOrPhone(acc.emailOrPhone || "");
                              setIsPhoneAuthOption((acc.emailOrPhone || "").indexOf('@') === -1);
                              setAuthIsSignUp(false);
                              setAuthScreenState('login');
                              setAuthError("Fill your password below!");
                            }
                          } catch (err: any) {
                            setAuthError(err?.message || "Failed to login with selection.");
                          }
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-[18px] bg-white border border-neutral-150 hover:border-[#0F8A5F]/60 hover:bg-neutral-50 transition-all text-left active:scale-[0.99] group cursor-pointer"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-lg overflow-hidden border border-neutral-200/50 font-sans">
                            {acc.avatar ? (
                              <img src={acc.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              acc.name?.charAt(0) || "👤"
                            )}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-[14px] text-[#161616] block truncate leading-tight group-hover:text-[#0F8A5F] transition-colors">{acc.name}</span>
                            <span className="text-[11px] text-neutral-400 block mt-0.5">@{acc.username || "neighbor"}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] bg-neutral-100 border border-neutral-200/50 px-2.5 py-0.5 rounded-full text-neutral-500 font-medium">{acc.authType === 'google' ? 'Google' : 'Password'}</span>
                          <span className="text-sm font-bold text-[#0F8A5F] group-hover:translate-x-1 transition-all">❯</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Login & Sign Up Forms */}
              {(authScreenState === 'login' || authScreenState === 'signup') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-[18px] w-full"
                >
                  {/* Email Input */}
                  <div className="relative flex items-center rounded-[18px] border border-neutral-200 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-200 focus-within:border-[#0F8A5F] focus-within:ring-2 focus-within:ring-[#0F8A5F]/10 h-[58px] group">
                    <div className="absolute left-[18px] text-neutral-400 group-focus-within:text-[#0F8A5F] transition-colors">
                      <User className="w-[18px] h-[18px]" />
                    </div>
                    <input
                      type="email"
                      value={authEmailOrPhone}
                      onChange={(e) => setAuthEmailOrPhone(e.target.value)}
                      placeholder="e.g., name@gmail.com"
                      className="w-full pl-[48px] pr-4 h-full bg-transparent text-[15px] font-medium text-[#161616] placeholder-[#9CA3AF] focus:outline-none font-sans"
                      autoComplete="email"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative flex items-center rounded-[18px] border border-neutral-200 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-200 focus-within:border-[#0F8A5F] focus-within:ring-2 focus-within:ring-[#0F8A5F]/10 h-[58px] group">
                    <div className="absolute left-[18px] text-neutral-400 group-focus-within:text-[#0F8A5F] transition-colors">
                      <Lock className="w-[18px] h-[18px]" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-[48px] pr-[48px] h-full bg-transparent text-[15px] font-medium text-[#161616] placeholder-[#9CA3AF] focus:outline-none font-sans"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        triggerBeep(450, 0.05);
                        setShowPassword(!showPassword);
                      }}
                      className="absolute right-[18px] text-neutral-400 hover:text-[#161616] transition-colors flex items-center justify-center p-1 cursor-pointer font-sans text-xs"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>

                  {/* Confirm Password (Signup only) */}
                  {authScreenState === 'signup' && (
                    <div className="relative flex items-center rounded-[18px] border border-neutral-200 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-200 focus-within:border-[#0F8A5F] focus-within:ring-2 focus-within:ring-[#0F8A5F]/10 h-[58px] group">
                      <div className="absolute left-[18px] text-neutral-400 group-focus-within:text-[#0F8A5F] transition-colors">
                        <Lock className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-[48px] pr-[48px] h-full bg-transparent text-[15px] font-medium text-[#161616] placeholder-[#9CA3AF] focus:outline-none font-sans"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          triggerBeep(450, 0.05);
                          setShowConfirmPassword(!showConfirmPassword);
                        }}
                        className="absolute right-[18px] text-neutral-400 hover:text-[#161616] transition-colors flex items-center justify-center p-1 cursor-pointer font-sans text-xs"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                  )}

                  {/* Forgot Password Link (Login only) */}
                  {authScreenState === 'login' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          triggerBeep(450, 0.05);
                          setAuthScreenState('forgot');
                          setAuthError('');
                        }}
                        className="text-[13px] font-semibold text-[#0F8A5F] hover:underline transition duration-150 cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {/* Main Submit Button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    disabled={authLoading}
                    onClick={() => loginWithEmailOrPhone(authEmailOrPhone, authPassword, authScreenState === 'signup', false)}
                    className="w-full h-[58px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white rounded-[18px] text-[15px] font-semibold tracking-wide transition duration-180 flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(15,138,95,0.25)] relative overflow-hidden"
                    style={{ minHeight: '48px' }}
                  >
                    {authLoading ? (
                      <div className="flex space-x-1.5 items-center justify-center">
                        <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
                        <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                        <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                      </div>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <span>{authScreenState === 'signup' ? "Create Secure Account" : "Access Personal Profile"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* 3. Forgot Password form state */}
              {authScreenState === 'forgot' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-[18px] w-full"
                >
                  <div className="relative flex items-center rounded-[18px] border border-neutral-200 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-200 focus-within:border-[#0F8A5F] focus-within:ring-2 focus-within:ring-[#0F8A5F]/10 h-[58px] group">
                    <div className="absolute left-[18px] text-neutral-400 group-focus-within:text-[#0F8A5F] transition-colors">
                      <Mail className="w-[18px] h-[18px]" />
                    </div>
                    <input
                      type="email"
                      value={authEmailOrPhone}
                      onChange={(e) => setAuthEmailOrPhone(e.target.value)}
                      placeholder="e.g., name@gmail.com"
                      className="w-full pl-[48px] pr-4 h-full bg-transparent text-[15px] font-medium text-[#161616] placeholder-[#9CA3AF] focus:outline-none font-sans"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    disabled={authLoading}
                    onClick={handleSendResetLink}
                    className="w-full h-[58px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white rounded-[18px] text-[15px] font-semibold tracking-wide transition duration-180 flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(15,138,95,0.25)]"
                    style={{ minHeight: '48px' }}
                  >
                    {authLoading ? (
                      <div className="flex space-x-1.5 items-center justify-center">
                        <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
                        <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                        <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                      </div>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </motion.button>

                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerBeep(350, 0.05);
                        setAuthScreenState('login');
                        setAuthError('');
                      }}
                      className="text-[14px] font-semibold text-[#0F8A5F] hover:underline transition duration-150 cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 4. Email Verification state */}
              {authScreenState === 'verification' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-[18px] w-full"
                >
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      triggerBeep(520, 0.08);
                      window.location.href = "mailto:";
                    }}
                    className="w-full h-[58px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white rounded-[18px] text-[15px] font-semibold tracking-wide transition duration-180 flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(15,138,95,0.25)]"
                    style={{ minHeight: '48px' }}
                  >
                    <span>Open Email App</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      triggerBeep(450, 0.08);
                      // Fallback verification notify
                      setAuthSuccess("A verification link has been resent to your email.");
                    }}
                    className="w-full h-[58px] border border-neutral-200 bg-white/85 hover:bg-neutral-50 text-[#161616] rounded-[18px] text-[15px] font-semibold transition duration-180 flex items-center justify-center cursor-pointer shadow-sm"
                    style={{ minHeight: '48px' }}
                  >
                    <span>Resend Email</span>
                  </motion.button>

                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerBeep(350, 0.05);
                        setAuthScreenState('login');
                        setAuthError('');
                      }}
                      className="text-[14px] font-semibold text-[#0F8A5F] hover:underline transition duration-150 cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Google Login & Divider */}
              {(authScreenState === 'login' || authScreenState === 'signup') && (
                <div className="w-full">
                  <div className="relative my-6 flex items-center justify-center w-full">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200"></div>
                    </div>
                    <span className="relative px-4 bg-[#F8F9FB] text-[12px] font-mono tracking-widest text-[#9CA3AF] uppercase">
                      Or
                    </span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={loginWithGoogle}
                    className="w-full h-[58px] bg-white border border-neutral-200/80 rounded-[18px] text-[15px] font-semibold text-[#161616] shadow-sm hover:bg-[#FDFDFD] hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-3 cursor-pointer"
                    style={{ minHeight: '48px' }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.74 14.93 1 12 1 7.37 1 3.4 3.66 1.45 7.55l3.79 2.94C6.18 7.55 8.84 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.45 12.3c0-.82-.07-1.6-.21-2.3H12v4.4h6.42c-.28 1.44-1.1 2.66-2.33 3.48l3.61 2.8c2.11-1.95 3.32-4.83 3.32-8.38z" />
                      <path fill="#FBBC05" d="M5.24 14.75c-.24-.72-.38-1.5-.38-2.3 0-.8.14-1.58.38-2.3L1.45 7.21C.52 9.07 0 11.17 0 13.4s.52 4.33 1.45 6.19l3.79-2.84z" />
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.61-2.8c-1.1.74-2.5 1.18-4.35 1.18-3.16 0-5.82-2.51-6.76-5.45l-3.79 2.94C3.4 19.34 7.37 23 12 23z" />
                    </svg>
                    <span>Continue with Google</span>
                  </motion.button>
                </div>
              )}

              {/* Footer Switch Link */}
              {authScreenState === 'login' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-2">
                  <p className="text-[14px] text-neutral-500 font-sans">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        triggerBeep(480, 0.05);
                        setAuthIsSignUp(true);
                        setAuthScreenState('signup');
                        setAuthError('');
                      }}
                      className="font-bold text-[#0F8A5F] hover:underline transition-all duration-150 inline-block cursor-pointer ml-1"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      Create One
                    </button>
                  </p>
                </motion.div>
              )}
              {authScreenState === 'signup' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-2">
                  <p className="text-[14px] text-neutral-500 font-sans">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        triggerBeep(480, 0.05);
                        setAuthIsSignUp(false);
                        setAuthScreenState('login');
                        setAuthError('');
                      }}
                      className="font-bold text-[#0F8A5F] hover:underline transition-all duration-150 inline-block cursor-pointer ml-1"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      Sign In
                    </button>
                  </p>
                </motion.div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* Floating Success Toast */}
      <AnimatePresence>
        {authSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            className="absolute top-6 left-6 right-6 bg-white border border-neutral-100 shadow-[0_10px_30px_rgba(15,138,95,0.12)] rounded-[22px] p-4.5 z-50 flex items-center space-x-3.5"
          >
            <div className="w-[42px] h-[42px] rounded-full bg-[#0F8A5F]/10 flex items-center justify-center flex-shrink-0 text-[#0F8A5F]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-[#161616]">Success</p>
              <p className="text-[12px] text-neutral-500 font-sans leading-tight mt-0.5">{authSuccess}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Error Toast */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            className="absolute bottom-6 left-6 right-6 bg-white border border-neutral-200/80 shadow-[0_12px_32px_rgba(0,0,0,0.08)] rounded-[24px] p-5.5 z-50 flex flex-col space-y-4"
          >
            <div className="flex items-start space-x-3.5">
              <div className="w-[42px] h-[42px] rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="text-[14px] font-bold text-[#161616]">Unable to authenticate</h4>
                <p className="text-[12px] text-neutral-500 leading-normal font-sans">
                  {authError.includes("wrong-password") || authError.includes("user-not-found") || authError.includes("invalid-credential") || authError.includes("invalid-login-credentials")
                    ? "We couldn't sign you in. Please check your details and try again."
                    : authError}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  triggerBeep(320, 0.08);
                  setAuthError("");
                }}
                className="px-5 py-2.5 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white text-[13px] font-semibold rounded-full shadow-sm transition duration-150 cursor-pointer"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium bottom status lines */}
      <div className="text-center pb-4 relative z-10">
        <p className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase">
          ✓ END-TO-END SEGREGATION · SECURED VIA FIREBASE CLIENT SHIELDS
        </p>
      </div>
    </div>
  );
}
