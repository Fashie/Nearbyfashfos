import React from 'react';
import { Radar, MapPin, Bell, ChevronDown, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenLocationPicker?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unreadNotificationCount = 0,
  onOpenNotifications,
  onOpenLocationPicker
}) => {
  const { currentAddress, selectedPreset, isIframe, isQuotaExceeded } = useApp();
  const { isDark } = useTheme();

  return (
    <header
      id="app-header-bar"
      className={`sticky top-0 z-30 w-full border-b backdrop-blur-xl transition-colors duration-200 ${
        isDark
          ? 'bg-[#111315]/90 border-neutral-800/80 text-white'
          : 'bg-white/90 border-neutral-200/80 text-[#161616]'
      }`}
    >
      {/* Quota or Sandbox Warning Banner if active */}
      {isQuotaExceeded && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 text-center text-[12px] font-medium text-amber-500 flex items-center justify-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Local Safe Fallback Active: Chatting and location syncing safely offline</span>
        </div>
      )}

      <div className="max-w-md mx-auto flex items-center justify-between h-14 px-4">
        {/* Brand & Location info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0F8A5F] to-emerald-400 p-[1.5px] shadow-sm">
            <div className={`w-full h-full rounded-[9.5px] flex items-center justify-center ${isDark ? 'bg-[#111315]' : 'bg-white'}`}>
              <Radar className="w-4 h-4 text-[#0F8A5F]" />
            </div>
          </div>

          <button
            id="header-location-picker-btn"
            onClick={onOpenLocationPicker}
            className="flex flex-col text-left cursor-pointer group"
          >
            <div className="flex items-center space-x-1">
              <span className="text-[14px] font-bold tracking-tight">{selectedPreset.name || 'Osogbo'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-neutral-400 truncate max-w-[160px]">
              <MapPin className="w-2.5 h-2.5 text-[#0F8A5F] shrink-0" />
              <span className="truncate">{currentAddress.split(',')[0]}</span>
            </div>
          </button>
        </div>

        {/* Action icons (Notifications & Theme toggle) */}
        <div className="flex items-center space-x-2">
          <button
            id="header-notifications-btn"
            onClick={onOpenNotifications}
            className={`p-2 rounded-xl relative transition-colors cursor-pointer ${
              isDark ? 'bg-neutral-800/60 hover:bg-neutral-700 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
