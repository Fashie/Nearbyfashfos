import React, { useState } from 'react';
import { Team, UserProfile } from '../types';
import { Users, Trophy, UserPlus, Plus, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';

interface TeamChallengeSectionProps {
  user: UserProfile;
  teams: Team[];
  onCreateTeam: (name: string) => void;
  onJoinTeam: (code: string) => void;
  onLeaveTeam?: () => void;
}

export const TeamChallengeSection: React.FC<TeamChallengeSectionProps> = ({
  user,
  teams,
  onCreateTeam,
  onJoinTeam,
  onLeaveTeam
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamCodeInput, setTeamCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const myTeam = teams.find((t) => t.id === user?.teamId || t.members.some((m) => m.id === user?.id));

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNameInput.trim()) return;
    onCreateTeam(teamNameInput.trim());
    setTeamNameInput('');
    setShowCreateModal(false);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCodeInput.trim()) return;
    onJoinTeam(teamCodeInput.trim().toUpperCase());
    setTeamCodeInput('');
    setShowJoinModal(false);
  };

  const handleCopyTeamCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section id="teams" className="py-12 sm:py-16 bg-[#FAFAFA] dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-slate-800 transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 min-w-0">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] dark:border-slate-800 pb-6 min-w-0">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-3.5 py-1.5 rounded-full mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>5-Member Team Collaboration</span>
            </div>
            <h2 className="text-[26px] sm:text-[36px] font-extrabold text-[#111827] dark:text-white font-display tracking-tight break-words">
              Collective 5-Member Team Challenge
            </h2>
            <p className="text-[#6B7280] dark:text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
              Form a squad of 5 friends! Combine your verified referral efforts to dominate the monthly team leaderboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!myTeam && (
              <>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowJoinModal(true)}
                  className="h-[48px] sm:h-[56px] px-4 sm:px-5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#111827] dark:text-white font-bold text-xs rounded-[18px] border border-[#E5E7EB] dark:border-slate-700 shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <UserPlus className="w-4 h-4 text-[#38BDF8]" />
                  <span>Join Team Code</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowCreateModal(true)}
                  className="h-[48px] sm:h-[56px] px-5 sm:px-6 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-[18px] shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Squad of 5</span>
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Prize Rule Card */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-5 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.05)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Monthly Team Cash Pool</div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-white font-display">
              Shared Cash Prize = <span className="text-[#F59E0B]">₦50,000</span>
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-slate-300 max-w-xl leading-relaxed">
              The team with the highest combined verified referrals on the <strong>Last Saturday of Every Month</strong> wins ₦50,000 (split ₦10,000 equally among all 5 members!).
            </p>
          </div>

          <div className="bg-[#FAFAFA] dark:bg-slate-900 p-4 rounded-[18px] border border-[#E5E7EB] dark:border-slate-700 text-center flex-shrink-0">
            <div className="text-xs text-[#6B7280] dark:text-slate-400">Winning Share Per Member</div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#F59E0B] font-display">₦10,000 / Member</div>
            <div className="text-[10px] text-[#16A34A] font-semibold mt-0.5">Paid Last Saturday</div>
          </div>
        </div>

        {/* Active Team Card */}
        {myTeam && (
          <div className="bg-white dark:bg-[#1E293B] border-2 border-[#16A34A] rounded-[24px] p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3F4F6] dark:border-slate-700 pb-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-[#16A34A] bg-[#16A34A]/10 px-3 py-1 rounded-full">
                  Your Active Squad
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-white font-display mt-2 flex items-center gap-2">
                  <span>{myTeam.name}</span>
                  <span className="text-xs text-[#F59E0B] font-mono font-bold bg-[#F59E0B]/10 px-2.5 py-0.5 rounded-full">
                    Rank #{myTeam.rank}
                  </span>
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-[#FAFAFA] dark:bg-slate-900 px-3.5 py-2 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700 flex items-center gap-2">
                  <span className="text-xs text-[#6B7280] dark:text-slate-400">Code:</span>
                  <strong className="text-xs text-[#16A34A] dark:text-emerald-400 font-mono font-bold">{myTeam.code}</strong>
                  <button
                    onClick={() => handleCopyTeamCode(myTeam.code)}
                    className="p-1 text-[#6B7280] hover:text-[#111827] dark:hover:text-white cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#6B7280] dark:text-slate-400">Combined Invites</div>
                  <div className="text-lg sm:text-xl font-extrabold text-[#16A34A] dark:text-emerald-400 font-mono">{myTeam.totalVerifiedInvites}</div>
                </div>

                {onLeaveTeam && (
                  <button
                    onClick={onLeaveTeam}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs rounded-[12px] border border-red-500/20 transition-all cursor-pointer"
                  >
                    Leave Squad
                  </button>
                )}
              </div>
            </div>

            {/* Team Roster */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const member = myTeam.members[i];
                return (
                  <div
                    key={i}
                    className={`p-3.5 rounded-[18px] border text-center ${
                      member
                        ? 'bg-[#FAFAFA] dark:bg-slate-900 border-[#E5E7EB] dark:border-slate-800'
                        : 'bg-[#FAFAFA]/50 dark:bg-slate-900/50 border-dashed border-[#E5E7EB] dark:border-slate-800'
                    }`}
                  >
                    {member ? (
                      <div className="space-y-1">
                        <UserAvatar
                          name={member.name}
                          avatar={member.avatar}
                          size="md"
                          className="mx-auto border-2 border-[#16A34A]"
                        />
                        <div className="font-bold text-[#111827] dark:text-white text-xs truncate">{member.name}</div>
                        <div className="text-[11px] text-[#16A34A] dark:text-emerald-400 font-mono font-bold">{member.verifiedInvites} Invites</div>
                      </div>
                    ) : (
                      <div className="py-2 text-[#6B7280] dark:text-slate-500 space-y-1">
                        <UserPlus className="w-6 h-6 mx-auto opacity-40" />
                        <div className="text-[11px] font-semibold">Empty Slot {i + 1}</div>
                        <div className="text-[9px]">Share Code</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Team Standings */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.05)]">
          <div className="p-4 bg-[#FAFAFA] dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between">
            <h4 className="font-bold text-[#111827] dark:text-white text-xs sm:text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#F59E0B]" /> Monthly Squad Leaderboard
            </h4>
            <span className="text-[11px] text-[#6B7280] dark:text-slate-400">Resets Last Saturday</span>
          </div>

          <div className="divide-y divide-[#F3F4F6] dark:divide-slate-800">
            {teams.length > 0 ? (
              teams.map((t) => (
                <div
                  key={t.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    t.id === myTeam?.id ? 'bg-[#16A34A]/10 border-l-4 border-[#16A34A]' : 'hover:bg-[#FAFAFA] dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${
                      t.rank === 1 ? 'bg-[#F59E0B] text-white' : 'bg-[#FAFAFA] dark:bg-slate-800 text-[#6B7280] dark:text-slate-300'
                    }`}>
                      #{t.rank}
                    </span>

                    <div>
                      <div className="text-sm sm:text-base font-extrabold text-[#111827] dark:text-white flex items-center gap-2 font-display">
                        <span>{t.name}</span>
                        <span className="text-xs text-[#6B7280] dark:text-slate-400 font-normal">({t.members.length}/5)</span>
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
                        Captain: {t.creatorName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    {/* Member avatars */}
                    <div className="flex -space-x-2 overflow-hidden">
                      {t.members.map((m) => (
                        <UserAvatar key={m.id} name={m.name} avatar={m.avatar} size="sm" className="ring-2 ring-white dark:ring-slate-900" />
                      ))}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm sm:text-base font-extrabold text-[#16A34A] dark:text-emerald-400 font-mono">
                        {t.totalVerifiedInvites} Invites
                      </div>
                      {t.rank === 1 ? (
                        <div className="text-xs font-bold text-[#F59E0B]">Winning ₦50,000!</div>
                      ) : (
                        <div className="text-xs text-[#6B7280] dark:text-slate-500">Chasing #1</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 sm:p-12 text-center space-y-4">
                <Users className="w-10 h-10 text-[#16A34A] mx-auto opacity-60" />
                <div className="space-y-1">
                  <div className="font-extrabold text-[#111827] dark:text-white text-base font-display">Nothing here yet</div>
                  <p className="text-xs text-[#6B7280] dark:text-slate-300 max-w-sm mx-auto">
                    No campus teams have been created yet. Form a squad of 5 with your friends to compete collectively for the ₦50,000 team prize pool!
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="h-[48px] px-6 bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-xs rounded-[18px] shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Squad</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-6 max-w-md w-full space-y-4 shadow-2xl relative"
            >
              <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-[#6B7280] dark:text-slate-400 cursor-pointer">✕</button>
              <h3 className="text-xl font-bold text-[#111827] dark:text-white font-display">Create a 5-Member Squad</h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-300">Give your team a name. You will receive an invitation code to invite 4 friends!</p>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#111827] dark:text-slate-200">Team Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Unilag Tech Titans"
                    value={teamNameInput}
                    onChange={(e) => setTeamNameInput(e.target.value)}
                    className="w-full h-[52px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] px-4 text-xs font-bold text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-[18px] text-xs shadow-md cursor-pointer"
                >
                  Create Squad & Get Code
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Team Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-6 max-w-md w-full space-y-4 shadow-2xl relative"
            >
              <button onClick={() => setShowJoinModal(false)} className="absolute top-4 right-4 text-[#6B7280] dark:text-slate-400 cursor-pointer">✕</button>
              <h3 className="text-xl font-bold text-[#111827] dark:text-white font-display">Join a Squad</h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-300">Enter the Team Code shared by your team captain.</p>

              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#111827] dark:text-slate-200">Team Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., TITAN55"
                    value={teamCodeInput}
                    onChange={(e) => setTeamCodeInput(e.target.value)}
                    className="w-full h-[52px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] px-4 text-xs font-bold uppercase font-mono text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-[18px] text-xs shadow-md cursor-pointer"
                >
                  Join Squad Now
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
