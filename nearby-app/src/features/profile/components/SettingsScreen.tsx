import React from 'react';
import { Moon, Sun, Bell, Volume2, Shield, Lock, LogOut, ArrowLeft, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../hooks/useTheme';

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { signOutUser, currentUser, userProfile } = useAuth();
  const { soundEnabled, setSoundEnabled, triggerBeep } = useApp();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    triggerBeep(300, 0.1);
    await signOutUser();
    onClose();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0C0E] text-white font-sans p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-6 border-b border-neutral-800">
        <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight">Settings & Privacy</h1>
      </div>

      {/* Settings Sections */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {/* Account Group */}
        <div className="space-y-2">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-neutral-500">Account</span>
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl divide-y divide-neutral-800 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-medium">{userProfile?.name || 'Nearby Member'}</h3>
                  <p className="text-[12px] text-neutral-500">{currentUser?.email || 'No email attached'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Group */}
        <div className="space-y-2">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-neutral-500">Preferences</span>
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl divide-y divide-neutral-800 overflow-hidden">
            {/* Theme Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300">
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-[14px] font-medium">Dark Mode</h3>
                  <p className="text-[12px] text-neutral-500">Night-safe contrast interface</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isDark ? 'bg-[#0F8A5F]' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-medium">Sound Effects</h3>
                  <p className="text-[12px] text-neutral-500">Audio feedback on interactions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  triggerBeep(520, 0.05);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  soundEnabled ? 'bg-[#0F8A5F]' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Safety & Verification */}
        <div className="space-y-2">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-neutral-500">Safety & Trust</span>
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl divide-y divide-neutral-800 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-medium">Verification Status</h3>
                  <p className="text-[12px] text-emerald-400 font-semibold">Community Verified ✓</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-semibold text-[14px] flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Nearby</span>
        </button>
      </div>
    </div>
  );
};
