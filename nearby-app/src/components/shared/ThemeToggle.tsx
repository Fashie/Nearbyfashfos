import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { triggerBeep } = useApp();

  const handleToggle = () => {
    triggerBeep(520, 0.05);
    toggleTheme();
  };

  return (
    <button
      id="theme-toggle-btn"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`p-2 rounded-xl transition-colors cursor-pointer ${
        isDark
          ? 'bg-neutral-800/80 hover:bg-neutral-700 text-amber-300'
          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
      } ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};
