import React, { useState } from 'react';
import { UserProfile, PlatformGlobalStats } from '../types';
import { Share2, Sparkles, Trophy, ShieldCheck, QrCode, Flame, Users, Lock, ArrowRight, Award } from 'lucide-react';
import { NearbyLogo } from './NearbyLogo';
import { motion } from 'motion/react';

interface HeroProps {
  user: UserProfile;
  globalStats: PlatformGlobalStats | null;
  statsLoading?: boolean;
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
  onNavigate: (section: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  user,
  globalStats,
  statsLoading = false,
  isAuthenticated = false,
  onOpenAuthModal,
  onNavigate
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(user.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Real platform metrics from database snapshot
  const displayStats = globalStats || {
    totalUsers: user.id ? 1 : 0,
    totalReferrals: user.verifiedInvites || 0,
    totalAppDownloads: user.verifiedInvites || 0,
    totalRewardsPaidNaira: user.totalEarningsNaira || 0,
    activeContestants: user.verifiedInvites || 0,
    updatedAt: new Date().toISOString()
  };

  return (
    <div className="relative overflow-hidden bg-[#FAFAFA] dark:bg-[#0F172A] pt-4 sm:pt-6 pb-12 sm:pb-14 transition-colors duration-200 w-full max-w-full">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-0 right-1/4 w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] bg-[#16A34A]/10 dark:bg-[#16A34A]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-10 w-[220px] sm:w-[400px] h-[220px] sm:h-[400px] bg-[#38BDF8]/10 dark:bg-[#38BDF8]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="relative max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-center min-w-0">
          
          {/* Left Column - Main Intro & Personal Referral Link */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left min-w-0">
            
            {/* Top Status Banner */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 px-3 py-1.5 rounded-full text-xs font-bold text-[#111827] dark:text-slate-200 shadow-sm max-w-full"
              >
                <Flame className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B] flex-shrink-0" />
                <span className="truncate">Nearby Referral Games</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] flex-shrink-0" />
                <span className="text-[#16A34A] font-extrabold flex-shrink-0">{user.verifiedInvites} Invites</span>
              </motion.div>

              <div className="inline-flex items-center gap-1.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-1.5 rounded-full text-xs font-extrabold text-[#F59E0B] max-w-full">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />
                <span className="truncate">₦500,000+ Monthly Pool</span>
              </div>
            </div>

            {/* App Title & Headline */}
            <h1 className="text-[24px] sm:text-[38px] lg:text-[48px] font-extrabold text-[#111827] dark:text-white font-display tracking-tight leading-[1.18] break-words">
              Discover local friends on <br className="hidden sm:inline" />
              <span className="text-[#16A34A] relative inline-block">
                Nearby Social Media
                <svg className="absolute -bottom-1 left-0 w-full h-2 text-[#16A34A]/30" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,10 Q50,20 100,10" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
              </span>
            </h1>

            {/* Friendly Warm Subtitle */}
            <p className="text-[#6B7280] dark:text-slate-300 text-xs sm:text-base lg:text-lg max-w-2xl font-normal leading-relaxed mx-auto lg:mx-0 break-words">
              Welcome to Nearby (<a href="https://nearby.fashfos.com" target="_blank" rel="noreferrer" className="text-[#16A34A] font-semibold underline hover:text-[#15803D] break-all">nearby.fashfos.com</a>) — the hyper-local campus and city social network! Invite your friends with your personal referral link, race on weekly cash leaderboards, hunt campus QR codes, and claim instant cash rewards.
            </p>

            {/* Individual User Activity Statistics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-1">
              {/* Stat 1: User Verified Invites */}
              <div className="bg-white dark:bg-slate-800/80 border border-[#E5E7EB] dark:border-slate-700/80 rounded-[16px] p-3 text-left space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-[#6B7280] dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                  <span>Your Invites</span>
                  <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                </div>
                <div className="text-base sm:text-lg font-extrabold text-[#111827] dark:text-white font-display">
                  {isAuthenticated ? (user.verifiedInvites || 0).toLocaleString() : 0}
                </div>
                <div className="text-[10px] text-amber-500 font-bold">Verified Friends</div>
              </div>

              {/* Stat 2: Pending Invites */}
              <div className="bg-white dark:bg-slate-800/80 border border-[#E5E7EB] dark:border-slate-700/80 rounded-[16px] p-3 text-left space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-[#6B7280] dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                  <span>Pending</span>
                  <Users className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <div className="text-base sm:text-lg font-extrabold text-[#111827] dark:text-white font-display">
                  {isAuthenticated ? (user.pendingInvites || 0).toLocaleString() : 0}
                </div>
                <div className="text-[10px] text-sky-500 font-bold">Awaiting Steps</div>
              </div>

              {/* Stat 3: Total Earnings */}
              <div className="bg-white dark:bg-slate-800/80 border border-[#E5E7EB] dark:border-slate-700/80 rounded-[16px] p-3 text-left space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-[#6B7280] dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                  <span>Your Earnings</span>
                  <Award className="w-3.5 h-3.5 text-[#16A34A]" />
                </div>
                <div className="text-base sm:text-lg font-extrabold text-[#16A34A] dark:text-emerald-400 font-display">
                  ₦{isAuthenticated ? (user.totalEarningsNaira || 0).toLocaleString() : 0}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Rewards Earned</div>
              </div>

              {/* Stat 4: Claimable Balance */}
              <div className="bg-white dark:bg-slate-800/80 border border-[#E5E7EB] dark:border-slate-700/80 rounded-[16px] p-3 text-left space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-[#6B7280] dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                  <span>Claimable</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <div className="text-base sm:text-lg font-extrabold text-[#111827] dark:text-white font-display">
                  ₦{isAuthenticated ? (user.claimableBalanceNaira || 0).toLocaleString() : 0}
                </div>
                <div className="text-[10px] text-purple-500 font-bold">Ready To Withdraw</div>
              </div>
            </div>

            {/* Personal Referral Hub CTA Box (Single Referral Link Location in Referral Hub) */}
            <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.05)] max-w-xl mx-auto lg:mx-0 text-left space-y-3.5 w-full min-w-0">
              <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-slate-400 font-semibold gap-2">
                <span className="flex items-center gap-1.5 text-[#16A34A] font-extrabold truncate">
                  <Share2 className="w-4 h-4 flex-shrink-0" /> Campus Referral Program
                </span>
                <span className="text-[10px] sm:text-[11px] bg-[#16A34A]/10 text-[#16A34A] px-2 sm:px-2.5 py-0.5 rounded-full font-bold flex-shrink-0">
                  {isAuthenticated ? (user.hasFollowedSocials ? 'Link Unlocked' : 'Social Follow Required') : 'Account Required'}
                </span>
              </div>

              {!isAuthenticated ? (
                <div className="bg-[#16A34A]/5 border border-[#16A34A]/20 rounded-[16px] p-4 text-center space-y-2.5">
                  <p className="text-xs sm:text-sm font-extrabold text-[#111827] dark:text-white">
                    Sign In to Unlock Your Unique Referral Link!
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#6B7280] dark:text-slate-300">
                    Each member gets their own referral link synchronized with nearby.fashfos.com. Sign up via Email or Google to start inviting friends and earning cash.
                  </p>
                  <div className="pt-1 flex justify-center">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={onOpenAuthModal}
                      className="px-6 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-xs sm:text-sm rounded-[14px] shadow-md flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Create Account / Sign In</span>
                    </motion.button>
                  </div>
                </div>
              ) : !user.hasFollowedSocials ? (
                <div className="bg-[#FFFBEB] dark:bg-amber-950/30 border border-[#F59E0B]/30 rounded-[16px] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#F59E0B]">
                    <Lock className="w-5 h-5 flex-shrink-0" />
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#111827] dark:text-white font-display">
                      Follow @nearby_app_ to Unlock Referral Link
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#6B7280] dark:text-slate-300">
                    Follow Nearby on Instagram, X, LinkedIn or TikTok in the Referral Hub to assign and unlock your unique invite link!
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onNavigate('referral-hub')}
                    className="w-full h-[46px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-[14px] shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Go to Referral Hub & Unlock Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                <div className="bg-[#16A34A]/5 border border-[#16A34A]/20 rounded-[16px] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#16A34A]">
                      <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#111827] dark:text-white font-display">
                        Unique Referral Link Active & Unlocked!
                      </h4>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6B7280] dark:text-slate-300">
                    Your unique referral link is ready in the Referral Hub. Share it across WhatsApp, Telegram, or social media to earn cash rewards.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onNavigate('referral-hub')}
                    className="w-full h-[46px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-[14px] shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Open Referral Hub to Copy & Share</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch justify-center lg:justify-start gap-3 pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onNavigate('leaderboards')}
                className="h-[52px] sm:h-[56px] px-7 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm sm:text-base rounded-[18px] shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Trophy className="w-5 h-5 text-amber-300" />
                <span>View Cash Leaderboards</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onNavigate('treasure-hunt')}
                className="h-[52px] sm:h-[56px] px-6 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#111827] dark:text-white font-bold text-xs sm:text-sm rounded-[18px] border border-[#E5E7EB] dark:border-slate-700 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#16A34A]" />
                <span>Campus QR Treasure Hunt</span>
              </motion.button>
            </div>
          </div>

          {/* Right Column - Community Visual & Game Schedule Card */}
          <div className="lg:col-span-5 space-y-5">
            {/* Community Visual Header */}
            <div className="relative rounded-[24px] overflow-hidden shadow-md border border-[#E5E7EB] dark:border-slate-700 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#16A34A]/30 p-6 sm:p-7 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#38BDF8] uppercase tracking-wider bg-[#38BDF8]/10 px-3 py-1 rounded-full border border-[#38BDF8]/20">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
                  Real-World Social Network
                </div>
                <div className="p-2 bg-white/10 rounded-[14px]">
                  <Share2 className="w-5 h-5 text-[#22C55E]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-extrabold font-display leading-snug">
                  Real Campus Friends.<br />
                  Verified Connections.<br />
                  Instant Cash Games.
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Connect locally across Nigerian universities and cities with zero fake accounts or bots.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-[#22C55E]">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Verified Student Community</span>
              </div>
            </div>

            {/* Active Competitions Floating Card */}
            <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-5 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.05)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#F3F4F6] dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <NearbyLogo size="sm" showSubtitle={false} />
                  <div>
                    <h3 className="font-bold text-[#111827] dark:text-white text-sm sm:text-base font-display">Nearby Cash Games</h3>
                    <p className="text-[11px] text-[#6B7280] dark:text-slate-400">Direct payouts to all Nigerian banks</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-[#16A34A] bg-[#16A34A]/10 px-3 py-1 rounded-full border border-[#16A34A]/20">
                  3 Active Games
                </span>
              </div>

              {/* Game Tiers */}
              <div className="space-y-2.5">
                {/* Game 1: Weekly */}
                <motion.div 
                  whileHover={{ x: 4 }}
                  onClick={() => onNavigate('leaderboards')}
                  className="bg-[#FAFAFA] dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-3.5 rounded-[16px] flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-[12px] bg-[#16A34A]/10 text-[#16A34A] font-extrabold text-xs flex items-center justify-center">
                      1st
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#111827] dark:text-white">Weekly Sprint (7 Days)</div>
                      <div className="text-[11px] text-[#6B7280] dark:text-slate-400">Opens 1st Monday of Month</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-[#F59E0B] font-display">₦20,000</div>
                    <div className="text-[10px] text-[#16A34A] font-semibold">1st Prize</div>
                  </div>
                </motion.div>

                {/* Game 2: Bi-Weekly */}
                <motion.div 
                  whileHover={{ x: 4 }}
                  onClick={() => onNavigate('leaderboards')}
                  className="bg-[#FAFAFA] dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-3.5 rounded-[16px] flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-[12px] bg-[#38BDF8]/10 text-[#38BDF8] font-extrabold text-xs flex items-center justify-center">
                      2nd
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#111827] dark:text-white">Bi-Weekly Mega Challenge</div>
                      <div className="text-[11px] text-[#6B7280] dark:text-slate-400">Opens 2nd Wednesday</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-[#F59E0B] font-display">₦30,000</div>
                    <div className="text-[10px] text-[#38BDF8] font-semibold">1st Prize</div>
                  </div>
                </motion.div>

                {/* Game 3: Monthly */}
                <motion.div 
                  whileHover={{ x: 4 }}
                  onClick={() => onNavigate('leaderboards')}
                  className="bg-[#FAFAFA] dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-3.5 rounded-[16px] flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-[12px] bg-[#F59E0B]/10 text-[#F59E0B] font-extrabold text-xs flex items-center justify-center">
                      MAX
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#111827] dark:text-white">Monthly Grand Champion</div>
                      <div className="text-[11px] text-[#6B7280] dark:text-slate-400">Pays Out Last Saturday</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-[#F59E0B] font-display">₦50,000</div>
                    <div className="text-[10px] text-[#F59E0B] font-semibold">Grand Prize</div>
                  </div>
                </motion.div>
              </div>

              {/* Anti-Fraud Trust Note */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#6B7280] dark:text-slate-400">
                <span className="flex items-center gap-1.5 text-[#16A34A] font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" /> Anti-Fraud Audit System
                </span>
                <button
                  onClick={() => onNavigate('rules')}
                  className="text-[#6B7280] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white underline cursor-pointer"
                >
                  View 7-day policy
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
