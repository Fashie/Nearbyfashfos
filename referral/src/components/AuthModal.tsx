import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { FirebaseUserService } from '../services/firebaseService';
import { OperationState } from '../types';
import {
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  CheckSquare,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [state, setState] = useState<OperationState>({
    loading: false,
    error: null,
    success: null
  });

  if (!isOpen) return null;

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setState({ loading: true, error: null, success: null });

    try {
      if (mode === 'forgot_password') {
        if (!email) {
          throw new Error('Please enter your email address to reset your password.');
        }
        await sendPasswordResetEmail(auth, email);
        setState({
          loading: false,
          error: null,
          success: 'Password reset email sent! Check your inbox for instructions.'
        });
        return;
      }

      // Configure Remember Me / Session Persistence
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      if (mode === 'signup') {
        if (!email || !password || !name) {
          throw new Error('Please fill in all required fields (Name, Email, Password).');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await FirebaseUserService.createUserProfile(cred.user.uid, cred.user.email || email, name);

        // Send Email Verification
        try {
          await sendEmailVerification(cred.user);
        } catch (verifyErr) {
          console.warn('Could not send verification email immediately:', verifyErr);
        }

        setState({
          loading: false,
          error: null,
          success: 'Account created! A verification link was sent to your email.'
        });
      } else {
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }

        const cred = await signInWithEmailAndPassword(auth, email, password);
        
        // Ensure user doc exists in firestore
        const existing = await FirebaseUserService.getUserProfile(cred.user.uid);
        if (!existing) {
          await FirebaseUserService.createUserProfile(
            cred.user.uid,
            cred.user.email || email,
            cred.user.displayName || undefined
          );
        }

        setState({ loading: false, error: null, success: 'Logged in successfully!' });
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      let msg = err.message || 'Authentication failed. Please try again.';
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        msg = `Domain Authorization Required: '${currentDomain}' is not added to Firebase Authorized Domains. To enable sign-in on ${currentDomain}, open Firebase Console > Authentication > Settings > Authorized Domains and add '${currentDomain}'.`;
      } else if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        msg = 'Invalid email or password credentials.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered. Try signing in instead.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please try again in a few minutes.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters long.';
      }
      setState({ loading: false, error: msg, success: null });
    }
  };

  const handleGoogleSignIn = async () => {
    setState({ loading: true, error: null, success: null });
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithPopup(auth, googleProvider);
      const existing = await FirebaseUserService.getUserProfile(cred.user.uid);
      if (!existing) {
        await FirebaseUserService.createUserProfile(
          cred.user.uid,
          cred.user.email || '',
          cred.user.displayName || undefined
        );
      }
      setState({ loading: false, error: null, success: 'Signed in with Google!' });
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      let errorMsg = err.message || 'Google sign-in failed.';
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        errorMsg = `Domain Authorization Required: '${currentDomain}' is not authorized for Google Sign-In in Firebase. Please add '${currentDomain}' under Firebase Console > Authentication > Settings > Authorized Domains.`;
      } else if (err.code === 'auth/popup-blocked') {
        errorMsg = 'Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Google sign-in popup was closed before completing. Please try again.';
      }
      setState({ loading: false, error: errorMsg, success: null });
    }
  };

  const handleAnonymousSignIn = async () => {
    setState({ loading: true, error: null, success: null });
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInAnonymously(auth);
      const existing = await FirebaseUserService.getUserProfile(cred.user.uid);
      if (!existing) {
        await FirebaseUserService.createUserProfile(
          cred.user.uid,
          `campus_user_${cred.user.uid.substring(0, 5)}@nearby.fashfos.com`,
          `Campus Guest ${cred.user.uid.substring(0, 4).toUpperCase()}`
        );
      }
      setState({ loading: false, error: null, success: 'Signed in as Campus Guest!' });
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Guest Auth Error:', err);
      let errorMsg = err.message || 'Guest sign-in failed.';
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        errorMsg = `Domain Authorization Required: Please add '${currentDomain}' to Firebase Console > Authentication > Settings > Authorized Domains.`;
      } else if (err.code === 'auth/admin-restricted-operation') {
        errorMsg = 'Guest access is currently unavailable. Please sign in or create an account using email or Google above.';
      }
      setState({ loading: false, error: errorMsg, success: null });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-[28px] border border-[#E5E7EB] dark:border-slate-700 p-6 sm:p-8 shadow-2xl overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white bg-[#FAFAFA] dark:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto border border-[#16A34A]/20">
            {mode === 'forgot_password' ? (
              <KeyRound className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-[#111827] dark:text-white font-display">
            {mode === 'signup'
              ? 'Create Nearby Account'
              : mode === 'forgot_password'
              ? 'Reset Your Password'
              : 'Welcome to Nearby'}
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-slate-300">
            {mode === 'forgot_password'
              ? 'Enter your registered email to receive a password reset link.'
              : 'Sign in to access your account, referrals, and campus leaderboards'}
          </p>
        </div>

        {/* State Banner: Loading, Success, Error with Retry */}
        <AnimatePresence mode="wait">
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-[16px] text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{state.error}</span>
              </div>
              <button
                onClick={() => handleAuth()}
                className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-[8px] text-[10px] hover:bg-rose-700 flex items-center gap-1 cursor-pointer flex-shrink-0"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </motion.div>
          )}

          {state.success && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3.5 bg-[#16A34A]/10 border border-[#16A34A]/30 rounded-[16px] text-[#16A34A] dark:text-emerald-400 text-xs flex items-center gap-2 font-bold"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{state.success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-200 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chisom Adebayo"
                  className="w-full h-[48px] pl-10 pr-4 bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#111827] dark:text-slate-200 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu.ng"
                className="w-full h-[48px] pl-10 pr-4 bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
              />
            </div>
          </div>

          {mode !== 'forgot_password' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#111827] dark:text-slate-200">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setState({ loading: false, error: null, success: null });
                    }}
                    className="text-[11px] font-bold text-[#16A34A] dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[48px] pl-10 pr-4 bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                />
              </div>
            </div>
          )}

          {/* Remember Me Toggle */}
          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 cursor-pointer select-none text-[#111827] dark:text-slate-300 font-medium"
              >
                {rememberMe ? (
                  <CheckSquare className="w-4 h-4 text-[#16A34A]" />
                ) : (
                  <Square className="w-4 h-4 text-[#6B7280]" />
                )}
                <span>Remember me on this browser</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={state.loading}
            className="w-full h-[50px] bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white font-extrabold text-xs rounded-[18px] shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {state.loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>
                {mode === 'signup'
                  ? 'Create Free Account'
                  : mode === 'forgot_password'
                  ? 'Send Reset Link'
                  : 'Sign In to Nearby'}
              </span>
            )}
          </button>
        </form>

        {mode === 'forgot_password' ? (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode('login');
                setState({ loading: false, error: null, success: null });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E7EB] dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-[#6B7280]">
                <span className="bg-white dark:bg-[#1E293B] px-3">Or Continue With</span>
              </div>
            </div>

            <div className="w-full">
              <button
                onClick={handleGoogleSignIn}
                disabled={state.loading}
                className="w-full h-[48px] bg-[#FAFAFA] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] text-xs font-bold text-[#111827] dark:text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <Mail className="w-4 h-4 text-[#16A34A]" />
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-[#6B7280] dark:text-slate-400">
              {mode === 'signup' ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'signup' ? 'login' : 'signup');
                  setState({ loading: false, error: null, success: null });
                }}
                className="text-[#16A34A] dark:text-emerald-400 font-extrabold hover:underline cursor-pointer"
              >
                {mode === 'signup' ? 'Sign In' : 'Register Now'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
