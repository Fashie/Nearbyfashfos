import React, { useState } from 'react';
import { Influencer, UserProfile } from '../types';
import { Trophy, Star, Clock, Instagram, Twitter, Youtube, Video, CheckCircle2, XCircle, ShieldAlert, PlusCircle, ExternalLink, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { FirebaseInfluencerService } from '../services/firebaseService';
import { motion, AnimatePresence } from 'motion/react';

interface InfluencersSectionProps {
  user: UserProfile;
  approvedInfluencers: Influencer[];
  allInfluencers: Influencer[];
  onRefreshData?: () => void;
}

export const InfluencersSection: React.FC<InfluencersSectionProps> = ({
  user,
  approvedInfluencers,
  allInfluencers,
  onRefreshData
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // Admin lock protection state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminLockModal, setShowAdminLockModal] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  const [campusInput, setCampusInput] = useState(user.campus || 'UNILAG');
  const [instagramInput, setInstagramInput] = useState('');
  const [tiktokInput, setTiktokInput] = useState('');
  const [twitterInput, setTwitterInput] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [customCodeInput, setCustomCodeInput] = useState(user.referralCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if current user has an application in Firestore
  const userApplication = allInfluencers.find((inf) => inf.userId === user.id);

  const handleOpenAdminPortal = () => {
    if (showAdminPanel) {
      setShowAdminPanel(false);
    } else if (isAdminUnlocked) {
      setShowAdminPanel(true);
    } else {
      setPasskeyInput('');
      setPasskeyError(null);
      setShowAdminLockModal(true);
    }
  };

  const handleVerifyAdminPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput.trim() === 'fas1paz0l') {
      setIsAdminUnlocked(true);
      setShowAdminLockModal(false);
      setShowAdminPanel(true);
    } else {
      setPasskeyError('Invalid Admin Passkey! Verified admin access required.');
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      // Social handles are optional - use empty string instead of undefined to satisfy Firestore rules & payload
      const res = await FirebaseInfluencerService.applyForInfluencerProgram(user.id, {
        campus: campusInput,
        socialHandles: {
          instagram: instagramInput.trim() || '',
          tiktok: tiktokInput.trim() || '',
          twitter: twitterInput.trim() || '',
          youtube: youtubeInput.trim() || ''
        },
        customReferralCode: customCodeInput.trim()
      });

      if (!res.success) {
        setStatusMsg({ type: 'error', text: res.message });
        setIsSubmitting(false);
        return;
      }

      setStatusMsg({ type: 'success', text: res.message });
      setShowApplyModal(false);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit application.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (influencerId: string) => {
    try {
      await FirebaseInfluencerService.approveInfluencer(influencerId);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleReject = async (influencerId: string) => {
    try {
      await FirebaseInfluencerService.rejectInfluencer(influencerId, 'Social handles or traffic source unverified');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  return (
    <section id="influencers" className="py-14 bg-[#FAFAFA] dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-slate-800 transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 min-w-0">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-3.5 py-1.5 rounded-full">
            <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
            <span>Verified Campus Creator Network</span>
          </div>
          <h2 className="text-[26px] sm:text-[36px] font-extrabold text-[#111827] dark:text-white font-display break-words">
            Nearby Campus Influencers Challenge
          </h2>
          <p className="text-[#6B7280] dark:text-slate-300 text-base">
            Exclusive campaign for student creators, campus leaders, and digital influencers. Reach minimum referral milestones to claim grand prizes & continuous commissions!
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowApplyModal(true)}
              className="h-[48px] px-6 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-[16px] shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Apply as Campus Creator</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleOpenAdminPortal}
              className="h-[48px] px-5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#111827] dark:text-slate-200 font-bold text-xs rounded-[16px] border border-[#E5E7EB] dark:border-slate-700 shadow-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
              <span>{showAdminPanel ? 'Close Admin Review' : 'Admin Approval Portal'}</span>
            </motion.button>
          </div>
        </div>

        {/* User Application Status Banner */}
        {userApplication && (
          <div className={`p-4 rounded-[20px] border flex items-center justify-between gap-4 ${
            userApplication.verificationStatus === 'approved'
              ? 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#16A34A] dark:text-emerald-400'
              : userApplication.verificationStatus === 'pending'
              ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
          }`}>
            <div className="flex items-center gap-3">
              {userApplication.verificationStatus === 'approved' && <CheckCircle2 className="w-6 h-6 flex-shrink-0" />}
              {userApplication.verificationStatus === 'pending' && <Clock className="w-6 h-6 flex-shrink-0 animate-pulse" />}
              {userApplication.verificationStatus === 'rejected' && <XCircle className="w-6 h-6 flex-shrink-0" />}
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider">
                  Campus Creator Status: {userApplication.verificationStatus.toUpperCase()}
                </div>
                <div className="text-xs opacity-90 mt-0.5">
                  {userApplication.verificationStatus === 'approved' && 'You are an approved creator! Your profile is listed on the official standings.'}
                  {userApplication.verificationStatus === 'pending' && 'Your application is currently being reviewed by Nearby administrators.'}
                  {userApplication.verificationStatus === 'rejected' && `Application not approved: ${userApplication.rejectionReason || 'Requirements not met'}`}
                </div>
              </div>
            </div>
            {userApplication.verificationStatus === 'approved' && (
              <span className="text-xs font-mono font-bold bg-[#16A34A] text-white px-3 py-1 rounded-full">
                Code: {userApplication.customReferralCode}
              </span>
            )}
          </div>
        )}

        {/* Admin Review Drawer / Panel */}
        <AnimatePresence>
          {showAdminPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900 border-2 border-[#F59E0B] rounded-[24px] p-6 text-white space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Admin Creator Approval Portal ({allInfluencers.length} Applications)</span>
                </div>
                <span className="text-xs text-slate-400">Only Approved Creators become public</span>
              </div>

              {allInfluencers.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No creator applications submitted yet. Click "Apply as Campus Creator" above to test!</div>
              ) : (
                <div className="space-y-3">
                  {allInfluencers.map((inf) => (
                    <div key={inf.id} className="bg-slate-800 p-4 rounded-[16px] border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{inf.name}</span>
                          <span className="text-[10px] font-mono bg-slate-700 px-2 py-0.5 rounded text-amber-300">{inf.campus}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            inf.verificationStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                            inf.verificationStatus === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {inf.verificationStatus}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 flex items-center gap-3">
                          <span>Custom Code: <strong className="text-emerald-400 font-mono">{inf.customReferralCode}</strong></span>
                          <span>Referrals: <strong>{inf.analytics.verifiedReferrals}</strong></span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          {inf.socialHandles.instagram && <span>IG: {inf.socialHandles.instagram}</span>}
                          {inf.socialHandles.tiktok && <span>TikTok: {inf.socialHandles.tiktok}</span>}
                          {inf.socialHandles.twitter && <span>X: {inf.socialHandles.twitter}</span>}
                          {inf.socialHandles.youtube && <span>YT: {inf.socialHandles.youtube}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {inf.verificationStatus !== 'approved' && (
                          <button
                            onClick={() => handleApprove(inf.id)}
                            className="h-[38px] px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-[12px] transition-all cursor-pointer"
                          >
                            Approve Creator
                          </button>
                        )}
                        {inf.verificationStatus !== 'rejected' && (
                          <button
                            onClick={() => handleReject(inf.id)}
                            className="h-[38px] px-4 bg-red-600/20 hover:bg-red-600/30 text-red-300 font-bold text-xs rounded-[12px] transition-all cursor-pointer border border-red-500/30"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedule & Reward Criteria Card */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.05)] space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F3F4F6] dark:border-slate-700 pb-4">
            <div>
              <div className="text-xs text-[#F59E0B] font-bold uppercase tracking-wider">Verified Creator Standings</div>
              <h3 className="text-2xl font-extrabold text-[#111827] dark:text-white font-display mt-1">
                Verified Campus Influencer Leaderboard
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-300 mt-1">
                Only admin-approved creators with verified social handles & campus tracking are visible below.
              </p>
            </div>

            <div className="bg-[#FAFAFA] dark:bg-slate-900 px-4 py-3 rounded-[18px] border border-[#E5E7EB] dark:border-slate-700 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#F59E0B] animate-pulse" />
              <div>
                <div className="text-[10px] uppercase text-[#6B7280] dark:text-slate-400 font-semibold">Grand Finale</div>
                <div className="text-xs font-bold text-[#F59E0B] font-mono">Last Friday of 3rd Month</div>
              </div>
            </div>
          </div>

          {/* Tier Requirements Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#FAFAFA] dark:bg-slate-900 p-3.5 rounded-[16px] border border-[#E5E7EB] dark:border-slate-800 text-center">
              <div className="text-xs font-bold text-[#F59E0B]">1st Place 🥇</div>
              <div className="text-xl font-extrabold text-[#111827] dark:text-white font-display mt-0.5">₦80,000</div>
              <div className="text-[10px] text-[#F59E0B] font-mono font-semibold mt-0.5">Min 500 Referrals</div>
            </div>

            <div className="bg-[#FAFAFA] dark:bg-slate-900 p-3.5 rounded-[16px] border border-[#E5E7EB] dark:border-slate-800 text-center">
              <div className="text-xs font-bold text-[#111827] dark:text-slate-200">2nd Place 🥈</div>
              <div className="text-xl font-extrabold text-[#111827] dark:text-white font-display mt-0.5">₦40,000</div>
              <div className="text-[10px] text-[#6B7280] dark:text-slate-400 font-mono font-semibold mt-0.5">Min 250 Referrals</div>
            </div>

            <div className="bg-[#FAFAFA] dark:bg-slate-900 p-3.5 rounded-[16px] border border-[#E5E7EB] dark:border-slate-800 text-center">
              <div className="text-xs font-bold text-[#F59E0B]">3rd Place 🥉</div>
              <div className="text-xl font-extrabold text-[#111827] dark:text-white font-display mt-0.5">₦20,000</div>
              <div className="text-[10px] text-[#6B7280] dark:text-slate-400 font-mono font-semibold mt-0.5">Min 100 Referrals</div>
            </div>

            <div className="bg-[#FAFAFA] dark:bg-slate-900 p-3.5 rounded-[16px] border border-[#E5E7EB] dark:border-slate-800 text-center">
              <div className="text-xs font-bold text-[#38BDF8]">4th & 5th Place</div>
              <div className="text-xl font-extrabold text-[#111827] dark:text-white font-display mt-0.5">₦10,000 Each</div>
              <div className="text-[10px] text-[#6B7280] dark:text-slate-400 font-mono font-semibold mt-0.5">Min 50 Referrals</div>
            </div>
          </div>
        </div>

        {/* Influencers Table Card */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.05)]">
          <div className="p-4 bg-[#FAFAFA] dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between">
            <h4 className="font-bold text-[#111827] dark:text-white text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#F59E0B]" /> Approved Creator Leaderboard ({approvedInfluencers.length})
            </h4>
            <span className="text-xs text-[#6B7280] dark:text-slate-400">Verified Creators</span>
          </div>

          <div className="divide-y divide-[#F3F4F6] dark:divide-slate-800">
            {approvedInfluencers.length > 0 ? (
              approvedInfluencers.map((inf) => (
                <div key={inf.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFAFA] dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center font-extrabold text-xs ${
                      inf.rank === 1 ? 'bg-[#F59E0B] text-white' :
                      inf.rank === 2 ? 'bg-slate-300 text-[#111827]' :
                      inf.rank === 3 ? 'bg-amber-700 text-white' : 'bg-[#FAFAFA] dark:bg-slate-800 text-[#6B7280] dark:text-slate-300'
                    }`}>
                      #{inf.rank || 1}
                    </span>

                    <UserAvatar name={inf.name} avatar={inf.avatar} size="md" />

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#111827] dark:text-white flex items-center gap-2">
                        <span>{inf.name}</span>
                        <span className="text-[10px] bg-[#16A34A]/10 text-[#16A34A] px-2 py-0.5 rounded-full font-semibold">
                          VERIFIED CREATOR
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6B7280] dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{inf.campus}</span>
                        <span>•</span>
                        <span className="font-mono text-[#16A34A]">{inf.customReferralCode}</span>
                      </div>
                      {/* Social Handles */}
                      <div className="flex items-center gap-2 mt-1">
                        {inf.socialHandles.instagram && (
                          <span className="text-[10px] text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Instagram className="w-3 h-3" /> {inf.socialHandles.instagram}
                          </span>
                        )}
                        {inf.socialHandles.tiktok && (
                          <span className="text-[10px] text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Video className="w-3 h-3" /> {inf.socialHandles.tiktok}
                          </span>
                        )}
                        {inf.socialHandles.twitter && (
                          <span className="text-[10px] text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Twitter className="w-3 h-3" /> {inf.socialHandles.twitter}
                          </span>
                        )}
                        {inf.socialHandles.youtube && (
                          <span className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Youtube className="w-3 h-3" /> {inf.socialHandles.youtube}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex sm:flex-col justify-between items-end gap-1">
                    <div>
                      <div className="text-sm font-extrabold text-[#16A34A] dark:text-emerald-400 font-mono">
                        {inf.analytics.verifiedReferrals} Verified Refs
                      </div>
                      <div className="text-xs font-bold text-[#F59E0B]">
                        Grand Prize: ₦{(inf.prizeNaira || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#6B7280] dark:text-slate-400">
                      Commissions: ₦{(inf.totalCommissionsEarnedNaira || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 sm:p-12 text-center space-y-3">
                <Star className="w-10 h-10 text-[#F59E0B] mx-auto opacity-60" />
                <div className="font-extrabold text-[#111827] dark:text-white text-base font-display">No Approved Influencers Listed Yet</div>
                <p className="text-xs text-[#6B7280] dark:text-slate-300 max-w-sm mx-auto">
                  Every fake influencer has been removed. Be the first student creator to submit an application and get approved!
                </p>
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="mt-2 px-5 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-[14px] cursor-pointer"
                >
                  Apply Now
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Creator Application Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-6 max-w-md w-full space-y-4 shadow-2xl relative"
            >
              <button onClick={() => setShowApplyModal(false)} className="absolute top-4 right-4 text-[#6B7280] dark:text-slate-400 cursor-pointer">✕</button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Campus Ambassador Application</span>
                </div>
                <h3 className="text-xl font-extrabold text-[#111827] dark:text-white font-display">Apply as Campus Creator</h3>
                <p className="text-xs text-[#6B7280] dark:text-slate-400">
                  Connect your social handles to track campaign referrals, earn commissions, and get listed on the official standings.
                </p>
              </div>

              {statusMsg && (
                <div className={`p-3 rounded-[12px] text-xs font-bold ${
                  statusMsg.type === 'success' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-red-500/10 text-red-500'
                }`}>
                  {statusMsg.text}
                </div>
              )}

              <form onSubmit={handleApplySubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#111827] dark:text-slate-200">Campus / University:</label>
                  <input
                    type="text"
                    required
                    value={campusInput}
                    onChange={(e) => setCampusInput(e.target.value)}
                    className="w-full h-[48px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[14px] px-3.5 text-xs font-bold text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111827] dark:text-slate-200">Desired Custom Referral Code:</label>
                  <input
                    type="text"
                    required
                    value={customCodeInput}
                    onChange={(e) => setCustomCodeInput(e.target.value)}
                    className="w-full h-[48px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[14px] px-3.5 text-xs font-mono font-bold text-[#16A34A] dark:text-emerald-400 focus:outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#111827] dark:text-slate-200">Instagram Handle:</label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={instagramInput}
                      onChange={(e) => setInstagramInput(e.target.value)}
                      className="w-full h-[44px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] px-3 text-xs text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#111827] dark:text-slate-200">TikTok Handle:</label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={tiktokInput}
                      onChange={(e) => setTiktokInput(e.target.value)}
                      className="w-full h-[44px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] px-3 text-xs text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#111827] dark:text-slate-200">Twitter/X Handle:</label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={twitterInput}
                      onChange={(e) => setTwitterInput(e.target.value)}
                      className="w-full h-[44px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] px-3 text-xs text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#111827] dark:text-slate-200">YouTube Channel:</label>
                    <input
                      type="text"
                      placeholder="@channel"
                      value={youtubeInput}
                      onChange={(e) => setYoutubeInput(e.target.value)}
                      className="w-full h-[44px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] px-3 text-xs text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-[16px] text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting to Admin Portal...</span>
                    </>
                  ) : (
                    <span>Submit Creator Application</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Admin Passkey Lock Modal for Creator Approval Portal */}
      <AnimatePresence>
        {showAdminLockModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-6 max-w-md w-full space-y-4 shadow-2xl relative"
            >
              <button onClick={() => setShowAdminLockModal(false)} className="absolute top-4 right-4 text-[#6B7280] dark:text-slate-400 hover:text-black dark:hover:text-white cursor-pointer">✕</button>

              <div className="w-12 h-12 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-2xl flex items-center justify-center mx-auto text-[#F59E0B]">
                <Lock className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold text-[#111827] dark:text-white font-display">Admin Lock Protected</h3>
                <p className="text-xs text-[#6B7280] dark:text-slate-300">
                  The Admin Creator Approval Portal is restricted. Enter the security lock code to review and verify creator applications:
                </p>
              </div>

              <form onSubmit={handleVerifyAdminPasskey} className="space-y-3 pt-2">
                <div>
                  <input
                    type="password"
                    placeholder="Enter Lock Code..."
                    value={passkeyInput}
                    onChange={(e) => {
                      setPasskeyInput(e.target.value);
                      setPasskeyError(null);
                    }}
                    className="w-full h-[50px] bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] px-4 text-sm font-mono font-bold text-[#111827] dark:text-white focus:outline-none focus:border-[#F59E0B]"
                    autoFocus
                  />
                  {passkeyError && (
                    <p className="text-xs font-bold text-red-500 mt-1.5 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{passkeyError}</span>
                    </p>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="w-full h-[50px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-[16px] text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock Admin Creator Approval Portal</span>
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
