import React, { useState } from 'react';
import { NearbyLogo } from './NearbyLogo';
import { UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';
import { ExternalLink, Copy, Check, Wallet, ShieldCheck, Trophy, Gift, Users, QrCode, Sparkles, Menu, X, ArrowUpRight, Sun, Moon, LogIn, LogOut, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  user: UserProfile;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onOpenPayoutModal: () => void;
  onOpenAntiFraudModal: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  isAuthenticated: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeSection,
  setActiveSection,
  onOpenPayoutModal,
  onOpenAntiFraudModal,
  onOpenAuthModal,
  onSignOut,
  isAuthenticated,
  isDarkMode,
  onToggleTheme
}) => {
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(user.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Trophy },
    { id: 'referral-hub', label: 'My Hub', icon: Gift },
    { id: 'leaderboards', label: 'Leaderboards', icon: Trophy },
    { id: 'milestones', label: 'Milestones', icon: ShieldCheck },
    { id: 'teams', label: 'Team Challenge', icon: Users },
    { id: 'treasure-hunt', label: 'Treasure Hunt', icon: QrCode },
    { id: 'influencers', label: 'Influencers', icon: Trophy },
    { id: 'rules', label: 'Anti-Fraud Rules', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-slate-800 transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      {/* Main Navigation Bar - Begins cleanly at Logo */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 w-full">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
          
          {/* Logo & Brand */}
          <button
            onClick={() => setActiveSection('overview')}
            className="flex items-center text-left cursor-pointer group flex-shrink-0 min-w-0"
          >
            <NearbyLogo size="sm" showSubtitle={true} lightText={isDarkMode} className="sm:hidden" />
            <NearbyLogo size="md" showSubtitle={true} lightText={isDarkMode} className="hidden sm:flex" />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#FAFAFA] dark:bg-slate-800/80 p-1.5 rounded-[18px] border border-[#E5E7EB] dark:border-slate-700">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`px-3 py-2 rounded-[14px] text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer relative ${
                    isActive
                      ? 'bg-[#16A34A] text-white shadow-sm font-bold'
                      : 'text-[#6B7280] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#16A34A]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
            {/* Theme Toggle Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={onToggleTheme}
              className="p-2.5 rounded-[16px] bg-[#FAFAFA] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 text-[#111827] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px]"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </motion.button>

            {/* User Account Action */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-[#FAFAFA] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 p-1.5 rounded-[16px]">
                <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                <div className="text-left pr-1 min-w-0">
                  <div className="text-[11px] font-bold text-[#111827] dark:text-white truncate max-w-[90px]">{user.name}</div>
                  <div className="text-[9px] text-[#16A34A] font-bold">Member</div>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1.5 rounded-[12px] hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 bg-[#FAFAFA] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:border-[#16A34A] text-[#111827] dark:text-white px-3 py-2 rounded-[16px] text-xs font-bold cursor-pointer transition-all min-h-[44px]"
              >
                <LogIn className="w-4 h-4 text-[#16A34A]" />
                <span>Sign In</span>
              </motion.button>
            )}

            {/* Balance Card Pill */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              onClick={onOpenPayoutModal}
              className="flex items-center gap-2.5 bg-[#FAFAFA] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-[#E5E7EB] dark:border-slate-700 px-3.5 py-2 rounded-[16px] cursor-pointer transition-all shadow-sm group min-h-[44px]"
              title="Click to withdraw cash"
            >
              <div className="p-1.5 bg-[#16A34A]/10 rounded-full text-[#16A34A]">
                <Wallet className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="text-[10px] text-[#6B7280] dark:text-slate-400 uppercase tracking-wider font-semibold">Claimable Balance</div>
                <div className="text-xs font-extrabold text-[#16A34A] dark:text-emerald-400 font-display">
                  ₦{user.claimableBalanceNaira.toLocaleString()}
                </div>
              </div>
            </motion.div>

            {/* Copy Referral Link Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold px-4 py-2.5 rounded-[16px] shadow-sm transition-all cursor-pointer min-h-[44px]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Ref Link</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Mobile Actions Controls */}
          <div className="flex items-center lg:hidden gap-1 sm:gap-1.5 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onToggleTheme}
              className="p-2 sm:p-2.5 rounded-[12px] sm:rounded-[14px] bg-[#FAFAFA] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 text-[#111827] dark:text-white min-w-[36px] sm:min-w-[40px] min-h-[36px] sm:min-h-[40px] flex items-center justify-center cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenPayoutModal}
              className="flex items-center gap-1 bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#16A34A] dark:text-emerald-400 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-[12px] sm:rounded-[14px] text-[11px] sm:text-xs font-extrabold font-display min-h-[36px] sm:min-h-[40px] cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
              <span>₦{user.claimableBalanceNaira.toLocaleString()}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 sm:p-2.5 rounded-[12px] sm:rounded-[14px] bg-[#FAFAFA] dark:bg-slate-800 text-[#111827] dark:text-slate-200 border border-[#E5E7EB] dark:border-slate-700 min-w-[36px] sm:min-w-[40px] min-h-[36px] sm:min-h-[40px] flex items-center justify-center cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Dropdown Menu with Motion Animation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mt-3 p-3.5 bg-white dark:bg-[#1E293B] rounded-[24px] border border-[#E5E7EB] dark:border-slate-700 flex flex-col gap-1 shadow-2xl overflow-hidden"
            >
              {/* User Profile / Auth Action inside Mobile Dropdown Menu */}
              <div className="p-3 mb-1 bg-[#FAFAFA] dark:bg-slate-800/80 rounded-[18px] border border-[#E5E7EB] dark:border-slate-700">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#111827] dark:text-white truncate max-w-[140px]">{user.name}</div>
                        <div className="text-[10px] text-[#16A34A] font-extrabold truncate">{user.email || 'Member Account'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-extrabold text-xs rounded-[12px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onOpenAuthModal();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full h-[44px] bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-xs rounded-[14px] shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In / Register Account</span>
                  </button>
                )}
              </div>

              <div className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-slate-400 px-3 pt-1 pb-1">
                Navigation Menu
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'rules') {
                        onOpenAntiFraudModal();
                      }
                      setActiveSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3.5 py-3 rounded-[16px] text-xs font-semibold text-left transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-[#16A34A] text-white font-bold'
                        : 'text-[#111827] dark:text-slate-200 hover:bg-[#FAFAFA] dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#16A34A]'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                );
              })}

              <div className="pt-2 mt-2 border-t border-[#F3F4F6] dark:border-slate-700 flex flex-col gap-2">
                <button
                  onClick={() => {
                    onOpenAntiFraudModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#16A34A] dark:text-emerald-400 text-xs font-bold h-[48px] rounded-[16px]"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Anti-Fraud & Referral Rules</span>
                  </span>
                  <span className="text-[10px] bg-[#16A34A] text-white px-2 py-0.5 rounded-full font-bold">Policy</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white text-xs font-bold h-[52px] rounded-[18px] transition-all shadow-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Referral Link Copied!' : 'Copy Personal Invite Link'}</span>
                </button>

                <a
                  href="https://nearby.fashfos.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#FAFAFA] dark:bg-slate-800 text-[#111827] dark:text-slate-200 text-xs font-semibold h-[48px] rounded-[16px] border border-[#E5E7EB] dark:border-slate-700"
                >
                  <span>Launch nearby.fashfos.com</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#16A34A]" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
