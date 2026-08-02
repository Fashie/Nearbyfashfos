import React, { useState } from 'react';
import { UserProfile, Milestone } from '../types';
import { Award, Lock, Sparkles, Star, Users, CheckCircle2, Check, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface MilestonesSectionProps {
  user: UserProfile;
  milestones: Milestone[];
  isLoading?: boolean;
  onClaimMilestone: (invites: number) => void;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({
  user,
  milestones,
  isLoading = false,
  onClaimMilestone
}) => {
  const [claimingInvites, setClaimingInvites] = useState<number | null>(null);

  const handleClaim = async (invitesRequired: number) => {
    setClaimingInvites(invitesRequired);
    try {
      await onClaimMilestone(invitesRequired);
    } finally {
      setClaimingInvites(null);
    }
  };

  const verifiedInvites = user?.verifiedInvites || 0;
  const claimedMilestones = user?.claimedMilestones || [];

  return (
    <section id="milestones" className="py-12 sm:py-16 bg-[#FAFAFA] dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-slate-800 transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 sm:space-y-10 min-w-0">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 px-3.5 py-1.5 rounded-full">
            <Award className="w-4 h-4 text-[#16A34A] animate-pulse" />
            <span>Guaranteed Rewards For Everyone</span>
          </div>
          <h2 className="text-[26px] sm:text-[36px] font-extrabold text-[#111827] dark:text-white font-display tracking-tight break-words">
            Milestone Progression & Ambassador VIP
          </h2>
          <p className="text-[#6B7280] dark:text-slate-300 text-sm sm:text-base">
            Every invite counts! As your verified referrals grow, unlock progressive cash, physical t-shirts, exclusive badges, and official VIP Ambassador status.
          </p>
        </div>

        {/* Current Progress Banner */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-5 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.05)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280] dark:text-slate-400">Your Current Progress</div>
              <div className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-white font-display mt-1 flex flex-wrap items-center gap-2">
                <span>{verifiedInvites} Friends Invited</span>
                <span className="text-xs text-[#16A34A] font-extrabold bg-[#16A34A]/10 px-3 py-1 rounded-full border border-[#16A34A]/20">
                  {user?.isAmbassador ? 'Ambassador VIP' : 'Active Referrer'}
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-xs text-[#6B7280] dark:text-slate-400 font-medium">Next Milestone Goal</div>
              <div className="text-xs sm:text-sm font-bold text-[#F59E0B]">
                {verifiedInvites >= 100 ? 'All Milestones Achieved!' : 
                 verifiedInvites >= 50 ? '100 Invites (Ambassador Status)' :
                 verifiedInvites >= 30 ? '50 Invites (T-Shirt & ₦5,000)' :
                 verifiedInvites >= 20 ? '30 Invites (Community Badge)' :
                 verifiedInvites >= 5 ? '20 Invites (₦2,000 Cash)' : '5 Invites (1-Month Premium)'}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] sm:text-xs text-[#6B7280] dark:text-slate-400 font-bold font-mono">
              <span>0</span>
              <span>5</span>
              <span>20</span>
              <span>30</span>
              <span>50</span>
              <span>100 Invites</span>
            </div>
            <div className="w-full bg-[#F3F4F6] dark:bg-slate-900 rounded-full h-3.5 sm:h-4 p-0.5 border border-[#E5E7EB] dark:border-slate-700 relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (verifiedInvites / 100) * 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-[#16A34A] h-full rounded-full shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#16A34A] animate-spin mx-auto" />
            <div className="text-sm font-bold text-[#111827] dark:text-white">Loading Milestone Progression...</div>
          </div>
        ) : milestones.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-8 text-center space-y-3">
            <Award className="w-10 h-10 text-[#6B7280] mx-auto opacity-50" />
            <div className="text-base font-bold text-[#111827] dark:text-white">No Milestones Configured</div>
            <p className="text-xs text-[#6B7280] dark:text-slate-400">Milestone rewards will appear here once loaded from the server.</p>
          </div>
        ) : (
          /* Milestone Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {milestones.map((m) => {
              const isUnlocked = verifiedInvites >= m.invitesRequired;
              const isClaimed = claimedMilestones.includes(m.invitesRequired);
              const isClaiming = claimingInvites === m.invitesRequired;

              return (
                <motion.div
                  key={m.invitesRequired}
                  whileHover={{ y: -3 }}
                  className={`rounded-[24px] p-5 sm:p-6 border transition-all relative flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.05)] ${
                    isUnlocked
                      ? 'bg-white dark:bg-[#1E293B] border-[#16A34A]/50'
                      : 'bg-[#FAFAFA] dark:bg-slate-900/60 border-[#E5E7EB] dark:border-slate-800 opacity-80'
                  }`}
                >
                  {/* Header tag */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                      isUnlocked ? 'bg-[#16A34A] text-white' : 'bg-[#F3F4F6] dark:bg-slate-800 text-[#6B7280] dark:text-slate-400'
                    }`}>
                      {isUnlocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{m.invitesRequired} Friends Required</span>
                    </span>

                    {m.limitedCount !== undefined && (
                      <span className="text-[10px] bg-[#F59E0B]/10 text-[#F59E0B] font-bold px-2.5 py-0.5 rounded-full">
                        Limited: {m.claimedGlobalCount || 0}/{m.limitedCount}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white font-display">{m.rewardTitle}</h3>
                    <p className="text-[#6B7280] dark:text-slate-300 text-xs leading-relaxed">{m.rewardDescription}</p>
                  </div>

                  {/* Button Action */}
                  <div>
                    {isClaimed ? (
                      <div className="w-full h-[52px] bg-[#16A34A]/10 text-[#16A34A] font-bold text-xs rounded-[18px] text-center flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-[#16A34A]" />
                        <span>Reward Claimed & Verified!</span>
                      </div>
                    ) : isUnlocked ? (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        disabled={isClaiming}
                        onClick={() => handleClaim(m.invitesRequired)}
                        className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-60 text-white font-bold text-xs rounded-[18px] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying with Server...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Claim Reward Now</span>
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <div className="w-full h-[52px] bg-[#F3F4F6] dark:bg-slate-800 text-[#6B7280] dark:text-slate-400 font-semibold text-xs rounded-[18px] text-center flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Need {Math.max(0, m.invitesRequired - verifiedInvites)} More Friends</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Nearby Ambassador Showcase Box */}
        <div className="bg-white dark:bg-[#1E293B] border-2 border-[#F59E0B] rounded-[24px] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#F59E0B]">
                <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                <span>Executive Milestone (100 Verified Referrals)</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white font-display">
                The Nearby Ambassador Program
              </h3>

              <p className="text-[#6B7280] dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                Once you reach <strong>100 verified referrals</strong>, you automatically transition into an official Nearby Ambassador and Marketer with executive privileges.
              </p>

              {/* Perks List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-3.5 rounded-[16px] flex items-center gap-3">
                  <div className="p-2 bg-[#F59E0B]/10 rounded-[12px] text-[#F59E0B]"><Award className="w-5 h-5" /></div>
                  <div className="text-xs">
                    <div className="font-bold text-[#111827] dark:text-white">Profile Badge</div>
                    <div className="text-[#6B7280] dark:text-slate-400">Displayed on Nearby app</div>
                  </div>
                </div>

                <div className="bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-3.5 rounded-[16px] flex items-center gap-3">
                  <div className="p-2 bg-[#16A34A]/10 rounded-[12px] text-[#16A34A]"><Sparkles className="w-5 h-5" /></div>
                  <div className="text-xs">
                    <div className="font-bold text-[#111827] dark:text-white">Early Access</div>
                    <div className="text-[#6B7280] dark:text-slate-400">Beta test updates first</div>
                  </div>
                </div>

                <div className="bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-3.5 rounded-[16px] flex items-center gap-3">
                  <div className="p-2 bg-[#38BDF8]/10 rounded-[12px] text-[#38BDF8]"><Users className="w-5 h-5" /></div>
                  <div className="text-xs">
                    <div className="font-bold text-[#111827] dark:text-white">Leadership Channel</div>
                    <div className="text-[#6B7280] dark:text-slate-400">Direct channel with founders</div>
                  </div>
                </div>

                <div className="bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-3.5 rounded-[16px] flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-[12px] text-purple-600"><Star className="w-5 h-5" /></div>
                  <div className="text-xs">
                    <div className="font-bold text-[#111827] dark:text-white">Monthly Stipends</div>
                    <div className="text-[#6B7280] dark:text-slate-400">Ongoing activity stipends</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Badge Status Box */}
            <div className="lg:col-span-4 bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-6 rounded-[20px] text-center space-y-3">
              <Star className="w-10 h-10 text-[#F59E0B] fill-[#F59E0B] mx-auto animate-pulse" />
              <div className="font-extrabold text-[#111827] dark:text-white text-base">Ambassador Executive</div>
              <p className="text-xs text-[#6B7280] dark:text-slate-400">
                {user?.isAmbassador
                  ? 'Congratulations! You are an active Ambassador VIP.'
                  : `You are ${Math.max(0, 100 - verifiedInvites)} verified referrals away from Ambassador VIP status.`}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
