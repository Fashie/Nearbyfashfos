import React, { useState } from 'react';
import { UserProfile, PayoutRequest, ReferralAnalytics, ReferralRecord } from '../types';
import {
  Share2,
  Copy,
  Check,
  Wallet,
  QrCode,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  ArrowUpRight,
  Users,
  Gift,
  AlertTriangle,
  MousePointerClick,
  Download,
  UserCheck,
  TrendingUp,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  HelpCircle,
  Lock,
  Video,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { FirebaseReferralService, FirebaseUserService } from '../services/firebaseService';

interface ReferralHubProps {
  user: UserProfile;
  payoutHistory: PayoutRequest[];
  referralAnalytics?: ReferralAnalytics;
  referralRecords?: ReferralRecord[];
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
  onOpenPayoutModal: () => void;
}

export const ReferralHub: React.FC<ReferralHubProps> = ({
  user,
  payoutHistory,
  referralAnalytics,
  referralRecords = [],
  isAuthenticated = false,
  onOpenAuthModal,
  onOpenPayoutModal
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstagram, setCopiedInstagram] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAntiAbuseModal, setShowAntiAbuseModal] = useState(false);
  const [isUnlockingSocial, setIsUnlockingSocial] = useState(false);
  const [clickedPlatform, setClickedPlatform] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const handleSocialCardClick = (platformName: string) => {
    setClickedPlatform(platformName);
    setUnlockError(null);
  };

  const handleConfirmUnlock = async () => {
    if (!isAuthenticated || !user.id) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    if (!clickedPlatform) {
      setUnlockError(
        "⚠️ Please click at least one of the social media channels above (Instagram, X, LinkedIn, or TikTok) to visit and follow @nearby_app_ before confirming!"
      );
      return;
    }

    setIsUnlockingSocial(true);
    setUnlockError(null);
    try {
      await FirebaseUserService.markSocialFollowed(user.id, clickedPlatform);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.warn('Error unlocking social follow:', err);
    } finally {
      setIsUnlockingSocial(false);
    }
  };

  // Default analytics if snapshot is empty
  const analytics: ReferralAnalytics = referralAnalytics || {
    clicks: 0,
    installs: user.verifiedInvites || 0,
    successfulRegistrations: user.verifiedInvites || 0,
    verifiedReferrals: user.verifiedInvites || 0,
    fraudulentReferrals: 0,
    conversionRate: 0
  };

  const handleCopyLink = async () => {
    navigator.clipboard.writeText(user.referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    // Log link copy/click
    await FirebaseReferralService.logLinkClick(user.id, user.referralCode);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInstagramBio = () => {
    const igText = `Join me on Nearby Social Media! Use my invite code: ${user.referralCode} at ${user.referralLink}`;
    navigator.clipboard.writeText(igText);
    setCopiedInstagram(true);
    setTimeout(() => setCopiedInstagram(false), 2000);
  };

  const shareText = `Join me on Nearby Social Media (nearby.fashfos.com) - the hyper-local campus & city social network! Use my referral code ${user.referralCode} or sign up with my link: ${user.referralLink}`;

  const shareWhatsApp = async () => {
    await FirebaseReferralService.logLinkClick(user.id, user.referralCode);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareTelegram = async () => {
    await FirebaseReferralService.logLinkClick(user.id, user.referralCode);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(user.referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareX = async () => {
    await FirebaseReferralService.logLinkClick(user.id, user.referralCode);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareFacebook = async () => {
    await FirebaseReferralService.logLinkClick(user.id, user.referralCode);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(user.referralLink)}`, '_blank');
  };

  return (
    <section id="referral-hub" className="py-12 sm:py-16 bg-[#FAFAFA] dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-slate-800 transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 min-w-0">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] dark:border-slate-800 pb-6 min-w-0">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 px-3.5 py-1.5 rounded-full mb-2">
              <Gift className="w-3.5 h-3.5" />
              <span>Referral & Rewards Hub</span>
            </div>
            <h2 className="text-[26px] sm:text-[36px] font-extrabold text-[#111827] dark:text-white font-display tracking-tight break-words">
              My Personal Referral & Analytics Hub
            </h2>
            <p className="text-[#6B7280] dark:text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
              Track your personal invite links, member conversions, retention metrics, and request cash withdrawals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAntiAbuseModal(true)}
              className="h-[48px] sm:h-[56px] px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-[18px] border border-[#E5E7EB] dark:border-slate-700 shadow-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>Anti-Abuse Policy</span>
            </button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={onOpenPayoutModal}
              className="h-[48px] sm:h-[56px] px-5 sm:px-6 bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-xs rounded-[18px] shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span>Request Withdrawal</span>
            </motion.button>
          </div>
        </div>

        {/* Real-Time Conversion Pipeline & Metrics Cards (5-Metric Overview) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Metric 1: Clicks */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[20px] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase text-[#6B7280] dark:text-slate-400">Link Clicks</span>
              <MousePointerClick className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white font-display">{analytics.clicks}</div>
            <p className="text-[10px] text-slate-500 mt-1">Unique Traffic</p>
          </div>

          {/* Metric 2: Installs */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[20px] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase text-[#6B7280] dark:text-slate-400">App Installs</span>
              <Download className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white font-display">{analytics.installs}</div>
            <p className="text-[10px] text-slate-500 mt-1">Downloads Tracked</p>
          </div>

          {/* Metric 3: Successful Registrations */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[20px] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase text-[#6B7280] dark:text-slate-400">Registrations</span>
              <UserCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white font-display">{analytics.successfulRegistrations}</div>
            <p className="text-[10px] text-slate-500 mt-1">Signed Up Members</p>
          </div>

          {/* Metric 4: Verified Referrals */}
          <div className="bg-white dark:bg-[#1E293B] border border-emerald-500/30 dark:border-emerald-500/30 rounded-[20px] p-4 shadow-sm bg-emerald-50/20 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase text-[#16A34A] dark:text-emerald-400">Verified Referrals</span>
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#16A34A] dark:text-emerald-400 font-display">{analytics.verifiedReferrals}</div>
            <p className="text-[10px] text-[#16A34A] font-bold mt-1">7-Day Active Validated</p>
          </div>

          {/* Metric 5: Fraudulent Referrals */}
          <div className="bg-white dark:bg-[#1E293B] border border-red-200 dark:border-red-900/50 rounded-[20px] p-4 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase text-red-500">Fraudulent / Blocked</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-500 font-display">{analytics.fraudulentReferrals}</div>
            <p className="text-[10px] text-red-400 mt-1">Filtered by Server Audit</p>
          </div>
        </div>

        {/* Conversion Analytics Rate Banner */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#16A34A]/30 text-white rounded-[24px] p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#E5E7EB] dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#16A34A]/20 rounded-[16px] text-[#22C55E]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">Conversion Analytics Rate</div>
              <div className="text-2xl font-extrabold font-display">
                {analytics.conversionRate}% Conversion Performance
              </div>
              <p className="text-xs text-slate-300">
                Calculated based on your unique link clicks and verified registrations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-300">Claimable Balance</div>
              <div className="text-xl font-extrabold text-[#22C55E]">₦{user.claimableBalanceNaira.toLocaleString()}</div>
            </div>
            <button
              onClick={onOpenPayoutModal}
              className="h-[48px] px-5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-[16px] shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Cash Out</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-Channel Sharing & Tools Section */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Unique Link & Code Generator */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-5 sm:p-6 space-y-6 shadow-[0_4px_25px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] dark:border-slate-700 pb-3">
              <h3 className="text-base sm:text-lg font-extrabold text-[#111827] dark:text-white font-display flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#16A34A]" />
                Your Personal Invite Link
              </h3>
              <span className="text-[10px] font-extrabold bg-[#16A34A]/10 text-[#16A34A] px-2.5 py-1 rounded-full">
                Protected Link
              </span>
            </div>

            {/* Direct Link Input or Social Follow Lock */}
            {isAuthenticated && !user.hasFollowedSocials ? (
              <div className="bg-[#FFFBEB] dark:bg-amber-950/40 border-2 border-dashed border-[#F59E0B] rounded-[22px] p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-[#F59E0B]/20 rounded-2xl text-[#F59E0B] flex-shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-[#111827] dark:text-white font-display">
                      Follow Nearby Socials to Unlock Your Unique Referral Link
                    </h4>
                    <p className="text-xs text-[#6B7280] dark:text-slate-300 mt-1">
                      Before a unique referral link can be assigned to you, you MUST click and follow Nearby on at least <strong>one</strong> of our official social media handles below:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <a
                    href="https://instagram.com/nearby_app_"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleSocialCardClick('Instagram')}
                    className={`p-3 bg-white dark:bg-slate-800 border rounded-[16px] flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer relative ${
                      clickedPlatform === 'Instagram'
                        ? 'border-2 border-[#16A34A] bg-[#16A34A]/5'
                        : 'border-[#E5E7EB] dark:border-slate-700 hover:border-[#E1306C]'
                    }`}
                  >
                    <Instagram className="w-5 h-5 text-[#E1306C]" />
                    <span className="text-xs font-bold text-[#111827] dark:text-white">Instagram</span>
                    <span className="text-[10px] text-[#6B7280] dark:text-slate-400 font-mono">@nearby_app_</span>
                    {clickedPlatform === 'Instagram' && (
                      <span className="text-[9px] bg-[#16A34A] text-white px-2 py-0.5 rounded-full font-bold">Opened ✓</span>
                    )}
                  </a>

                  <a
                    href="https://x.com/nearby_app_"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleSocialCardClick('X / Twitter')}
                    className={`p-3 bg-white dark:bg-slate-800 border rounded-[16px] flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer relative ${
                      clickedPlatform === 'X / Twitter'
                        ? 'border-2 border-[#16A34A] bg-[#16A34A]/5'
                        : 'border-[#E5E7EB] dark:border-slate-700 hover:border-sky-500'
                    }`}
                  >
                    <Twitter className="w-5 h-5 text-sky-500" />
                    <span className="text-xs font-bold text-[#111827] dark:text-white">X (Twitter)</span>
                    <span className="text-[10px] text-[#6B7280] dark:text-slate-400 font-mono">@nearby_app_</span>
                    {clickedPlatform === 'X / Twitter' && (
                      <span className="text-[9px] bg-[#16A34A] text-white px-2 py-0.5 rounded-full font-bold">Opened ✓</span>
                    )}
                  </a>

                  <a
                    href="https://linkedin.com/company/nearby_app_"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleSocialCardClick('LinkedIn')}
                    className={`p-3 bg-white dark:bg-slate-800 border rounded-[16px] flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer relative ${
                      clickedPlatform === 'LinkedIn'
                        ? 'border-2 border-[#16A34A] bg-[#16A34A]/5'
                        : 'border-[#E5E7EB] dark:border-slate-700 hover:border-blue-600'
                    }`}
                  >
                    <div className="w-5 h-5 bg-blue-600 text-white font-extrabold text-[11px] rounded flex items-center justify-center">in</div>
                    <span className="text-xs font-bold text-[#111827] dark:text-white">LinkedIn</span>
                    <span className="text-[10px] text-[#6B7280] dark:text-slate-400 font-mono">nearby_app_</span>
                    {clickedPlatform === 'LinkedIn' && (
                      <span className="text-[9px] bg-[#16A34A] text-white px-2 py-0.5 rounded-full font-bold">Opened ✓</span>
                    )}
                  </a>

                  <a
                    href="https://tiktok.com/@nearby_app_"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleSocialCardClick('TikTok')}
                    className={`p-3 bg-white dark:bg-slate-800 border rounded-[16px] flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer relative ${
                      clickedPlatform === 'TikTok'
                        ? 'border-2 border-[#16A34A] bg-[#16A34A]/5'
                        : 'border-[#E5E7EB] dark:border-slate-700 hover:border-pink-500'
                    }`}
                  >
                    <Video className="w-5 h-5 text-pink-500" />
                    <span className="text-xs font-bold text-[#111827] dark:text-white">TikTok</span>
                    <span className="text-[10px] text-[#6B7280] dark:text-slate-400 font-mono">@nearby_app_</span>
                    {clickedPlatform === 'TikTok' && (
                      <span className="text-[9px] bg-[#16A34A] text-white px-2 py-0.5 rounded-full font-bold">Opened ✓</span>
                    )}
                  </a>
                </div>

                {unlockError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[14px] text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{unlockError}</span>
                  </div>
                )}

                <div className="pt-1">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleConfirmUnlock}
                    disabled={isUnlockingSocial}
                    className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-[16px] text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {isUnlockingSocial ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Social Follow & Unlocking Link...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>I've Followed @nearby_app_ — Unlock My Unique Referral Link!</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-[#111827] dark:text-slate-200">Your Unique Link:</label>
                  {!isAuthenticated ? (
                    <div className="bg-[#16A34A]/5 border border-[#16A34A]/20 rounded-[18px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <span className="text-xs font-bold text-[#111827] dark:text-slate-200 text-center sm:text-left">
                        Sign in or create an account to get your personal referral link.
                      </span>
                      <button
                        onClick={onOpenAuthModal}
                        className="flex-shrink-0 px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-xs rounded-[14px] shadow-sm cursor-pointer transition-all"
                      >
                        Sign In / Register
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type="text"
                        readOnly
                        value={user.referralLink || `https://nearby.fashfos.com/?ref=${user.referralCode}`}
                        className="w-full h-[52px] sm:h-[56px] bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] px-4 text-xs font-bold text-[#16A34A] dark:text-emerald-400 font-mono select-all focus:outline-none focus:border-[#16A34A]"
                      />
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={handleCopyLink}
                        className="w-full sm:w-auto flex-shrink-0 h-[52px] sm:h-[56px] px-6 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-[18px] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Referral Code Box */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 p-4 rounded-[18px] gap-3">
                  <div>
                    <div className="text-[11px] text-[#6B7280] dark:text-slate-400 uppercase font-semibold">Unique Referral Code</div>
                    <div className="text-xl font-extrabold text-[#111827] dark:text-white font-mono tracking-wider">{user.referralCode}</div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleCopyCode}
                      className="flex-1 sm:flex-initial h-[48px] px-4 bg-white dark:bg-slate-800 text-[#111827] dark:text-slate-200 text-xs font-bold rounded-[14px] border border-[#E5E7EB] dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setShowQrModal(true)}
                      className="flex-1 sm:flex-initial h-[48px] px-4 bg-[#16A34A]/10 text-[#16A34A] dark:text-emerald-400 text-xs font-bold rounded-[14px] border border-[#16A34A]/30 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Show QR Code</span>
                    </motion.button>
                  </div>
                </div>
              </>
            )}

            {/* Social Share Buttons Grid */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-extrabold text-[#111827] dark:text-slate-200">Direct Social Media Channels:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* WhatsApp */}
                <button
                  onClick={shareWhatsApp}
                  className="h-[48px] bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>WhatsApp Share</span>
                </button>

                {/* Telegram */}
                <button
                  onClick={shareTelegram}
                  className="h-[48px] bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs rounded-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram Share</span>
                </button>

                {/* X / Twitter */}
                <button
                  onClick={shareX}
                  className="h-[48px] bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold text-xs rounded-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Twitter className="w-4 h-4 fill-white" />
                  <span>X (Twitter) Share</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={shareFacebook}
                  className="h-[48px] bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs rounded-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Facebook className="w-4 h-4 fill-white" />
                  <span>Facebook Share</span>
                </button>

                {/* Instagram Caption Copy */}
                <button
                  onClick={handleCopyInstagramBio}
                  className="h-[48px] bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white font-bold text-xs rounded-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm col-span-2 sm:col-span-1"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{copiedInstagram ? 'IG Text Copied!' : 'Instagram Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Verified Referral Records & Stream */}
          <div className="lg:col-span-5 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-5 sm:p-6 space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-[#111827] dark:text-white font-display flex items-center gap-2">
                <Users className="w-4 h-4 text-[#16A34A]" />
                Referral Records & Audit Logs
              </h3>
              <span className="text-[11px] text-[#16A34A] font-extrabold bg-[#16A34A]/10 px-2.5 py-0.5 rounded-full">
                7-Day Verification
              </span>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {referralRecords.length > 0 ? (
                referralRecords.map((item) => (
                  <div key={item.id} className="bg-[#FAFAFA] dark:bg-slate-900 p-3.5 rounded-[16px] border border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#111827] dark:text-white flex items-center gap-1.5">
                        <span>{item.referredUserName}</span>
                        <span className="text-[10px] text-[#6B7280] dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700">{item.campus}</span>
                      </div>
                      <div className="text-[11px] text-[#6B7280] dark:text-slate-400 mt-0.5">{item.step}</div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {item.status === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 text-[#16A34A] font-bold bg-[#16A34A]/10 px-2 py-0.5 rounded-[8px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : item.status === 'FRAUDULENT' ? (
                        <span className="inline-flex items-center gap-1 text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-[8px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#F59E0B] font-semibold bg-[#F59E0B]/10 px-2 py-0.5 rounded-[8px]">
                          <Clock className="w-3.5 h-3.5" /> Auditing
                        </span>
                      )}
                      <div className="text-[10px] text-[#6B7280] dark:text-slate-500 mt-1">
                        {item.createdAt.substring(0, 10)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#FAFAFA] dark:bg-slate-900/60 p-6 rounded-[18px] border border-dashed border-[#E5E7EB] dark:border-slate-800 text-center space-y-2">
                  <Users className="w-8 h-8 text-[#16A34A] mx-auto opacity-60" />
                  <div className="font-bold text-[#111827] dark:text-white text-xs">No referral records logged yet</div>
                  <p className="text-[11px] text-[#6B7280] dark:text-slate-400 max-w-xs mx-auto">
                    Share your unique referral link or QR code across WhatsApp and campus groups. Every signup will be recorded here in real-time!
                  </p>
                </div>
              )}
            </div>

            {/* Payout History Brief */}
            <div className="pt-3 border-t border-[#F3F4F6] dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-[#111827] dark:text-slate-200 font-bold mb-2">
                <span>Recent Withdrawals</span>
                <button onClick={onOpenPayoutModal} className="text-[#16A34A] hover:underline text-[11px]">View All</button>
              </div>

              {payoutHistory.length > 0 ? (
                <div className="space-y-2">
                  {payoutHistory.slice(0, 2).map((pay) => (
                    <div key={pay.id} className="bg-[#FAFAFA] dark:bg-slate-900 p-3 rounded-[14px] flex items-center justify-between text-xs border border-[#E5E7EB] dark:border-slate-800">
                      <div>
                        <div className="text-[#111827] dark:text-white font-bold">₦{pay.amountNaira.toLocaleString()} ({pay.type})</div>
                        <div className="text-[10px] text-[#6B7280] dark:text-slate-400">{pay.bankName} • {pay.accountNumber}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${
                        pay.status === 'Paid' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                      }`}>
                        {pay.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6B7280] dark:text-slate-400 italic">No payouts requested yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* QR Code Modal Generator */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white p-1 rounded-full bg-[#FAFAFA] dark:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>

              <h3 className="text-xl font-bold text-[#111827] dark:text-white font-display">Your Personal QR Code</h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-300">Scan this QR code with any smartphone camera to sign up on Nearby via your unique link!</p>

              {/* QR Code Graphic Box */}
              <div className="bg-white p-5 rounded-[20px] inline-block shadow-md border-2 border-[#16A34A] my-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(user.referralLink)}`}
                  alt="Personal Referral QR Code"
                  className="w-44 h-44 mx-auto"
                />
              </div>

              <div className="text-xs text-[#16A34A] font-mono font-bold bg-[#FAFAFA] dark:bg-slate-900 p-3 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700">
                Referral Code: {user.referralCode}
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowQrModal(false)}
                className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-[18px] text-xs shadow-md cursor-pointer"
              >
                Close QR Code
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Anti-Abuse Modal */}
      <AnimatePresence>
        {showAntiAbuseModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-6 max-w-md w-full text-left space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAntiAbuseModal(false)}
                className="absolute top-4 right-4 text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white p-1 rounded-full bg-[#FAFAFA] dark:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 text-[#16A34A] font-extrabold text-sm uppercase tracking-wider">
                <ShieldCheck className="w-5 h-5" />
                <span>Nearby Anti-Fraud Engine</span>
              </div>

              <h3 className="text-lg font-bold text-[#111827] dark:text-white font-display">
                How We Protect Against Referral Abuse
              </h3>

              <div className="space-y-3 text-xs text-[#6B7280] dark:text-slate-300 leading-relaxed">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-[14px] border border-slate-200 dark:border-slate-800 space-y-1">
                  <strong className="text-slate-900 dark:text-white font-bold">1. Self-Referral Prevention:</strong>
                  <p>Users cannot refer themselves or sign up using their own invite links. Server checks validate authenticated user IDs.</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-[14px] border border-slate-200 dark:border-slate-800 space-y-1">
                  <strong className="text-slate-900 dark:text-white font-bold">2. Duplicate Account Filter:</strong>
                  <p>A referred user can only be claimed once across the entire network. Secondary attempts are blocked automatically.</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-[14px] border border-slate-200 dark:border-slate-800 space-y-1">
                  <strong className="text-slate-900 dark:text-white font-bold">3. 7-Day Active Audit:</strong>
                  <p>Rewards are verified after the referred friend stays active for 7 days, eliminating bot signups and fake profiles.</p>
                </div>
              </div>

              <button
                onClick={() => setShowAntiAbuseModal(false)}
                className="w-full h-[48px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-[16px] text-xs shadow-md cursor-pointer"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

