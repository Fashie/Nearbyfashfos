import React from 'react';
import { motion } from 'motion/react';
import { Radar, MessageSquare, Flame, Compass, User } from 'lucide-react';
import { ActiveTabType } from '../../types';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

interface BottomNavProps {
  unreadChatCount?: number;
  hasUnreadStories?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  unreadChatCount = 0,
  hasUnreadStories = false
}) => {
  const { activeTab, setActiveTab, triggerBeep } = useApp();
  const { isDark } = useTheme();

  const navItems: Array<{ id: ActiveTabType; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'radar', label: 'Radar', icon: Radar },
    { id: 'chat', label: 'Chats', icon: MessageSquare },
    { id: 'status', label: 'Stories', icon: Flame },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'menu', label: 'Profile', icon: User }
  ];

  const handleTabSelect = (tab: ActiveTabType) => {
    triggerBeep(380, 0.05);
    setActiveTab(tab);
  };

  return (
    <nav
      id="main-bottom-navigation"
      aria-label="Main Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors duration-200 ${
        isDark
          ? 'bg-[#111315]/90 border-neutral-800/80 text-neutral-400'
          : 'bg-white/90 border-neutral-200/80 text-neutral-500'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={`nav-item-${item.id}`}
              id={`nav-btn-${item.id}`}
              onClick={() => handleTabSelect(item.id)}
              className={`flex-1 flex flex-col items-center justify-center h-full relative cursor-pointer select-none transition-colors duration-150 ${
                isActive
                  ? isDark
                    ? 'text-emerald-400 font-semibold'
                    : 'text-[#0F8A5F] font-semibold'
                  : 'hover:text-neutral-300'
              }`}
            >
              <div className="relative p-1">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />

                {/* Badges */}
                {item.id === 'chat' && unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-[#FF7A59] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#111315]">
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}

                {item.id === 'status' && hasUnreadStories && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111315] animate-pulse" />
                )}
              </div>

              <span className="text-[11px] tracking-tight mt-0.5">{item.label}</span>

              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-1 w-8 h-[3px] bg-[#0F8A5F] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
