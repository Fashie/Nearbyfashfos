import React, { useState } from 'react';
import { LeaderboardEntry, UserProfile } from '../types';
import { Trophy, Calendar, Clock, Award, ChevronLeft, ChevronRight, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';

type LeaderboardTab = 'weekly' | 'biweekly' | 'monthly' | 'all-time';

interface LeaderboardsSectionProps {
  user: UserProfile;
  leaderboards: {
    weekly: LeaderboardEntry[];
    biweekly: LeaderboardEntry[];
    monthly: LeaderboardEntry[];
    'all-time': LeaderboardEntry[];
  };
  isLoading?: boolean;
}

export const LeaderboardsSection: React.FC<LeaderboardsSectionProps> = ({
  user,
  leaderboards,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('weekly');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const gameConfigs: Record<
    LeaderboardTab,
    {
      title: string;
      scheduleText: string;
      status: string;
      statusBadge: string;
      countdown: string;
      prizes: { rank: string; amount: string; color: string }[];
      ruleDetail: string;
    }
  > = {
    weekly: {
      title: 'Weekly Sprint Challenge',
      scheduleText: 'Opens Every Monday for 7 Days',
      status: 'ACTIVE NOW (Day 3 of 7)',
      statusBadge: 'bg-[#16A34A] text-white',
      countdown: '3 Days, 14 Hrs Remaining',
      prizes: [
        { rank: '1st Place 🥇', amount: '₦20,000', color: 'text-[#F59E0B]' },
        { rank: '2nd Place 🥈', amount: '₦10,000', color: 'text-[#111827] dark:text-slate-200' },
        { rank: '3rd Place 🥉', amount: '₦5,000', color: 'text-[#16A34A]' },
        { rank: 'Top 10', amount: 'Special Badge ⭐', color: 'text-[#16A34A]' }
      ],
      ruleDetail: 'Every Monday, the 7-day referral sprint begins. At the end of 7 days, top referrers receive instant bank payouts!'
    },
    biweekly: {
      title: 'Bi-Weekly Mega Challenge',
      scheduleText: 'Resets Every 14 Days',
      status: 'ACTIVE NOW (Week 1 of 2)',
      statusBadge: 'bg-[#38BDF8] text-white',
      countdown: '7 Days Remaining',
      prizes: [
        { rank: '1st Place 🥇', amount: '₦30,000', color: 'text-[#F59E0B]' },
        { rank: '2nd Place 🥈', amount: '₦15,000', color: 'text-[#111827] dark:text-slate-200' },
        { rank: '3rd Place 🥉', amount: '₦7,500', color: 'text-[#38BDF8]' }
      ],
      ruleDetail: 'Bi-weekly campus referral marathon! The top performers across 14 days split ₦52,500 in total prizes.'
    },
    monthly: {
      title: 'Monthly Champion Race',
      scheduleText: 'Pays Out on the Last Saturday of every month',
      status: 'RESETTING THIS LAST SATURDAY',
      statusBadge: 'bg-[#F59E0B] text-white',
      countdown: '5 Days Until Reset',
      prizes: [
        { rank: '1st Champion 🥇', amount: '₦50,000', color: 'text-[#F59E0B]' },
        { rank: '2nd Place 🥈', amount: '₦30,000', color: 'text-[#111827] dark:text-slate-200' },
        { rank: '3rd Place 🥉', amount: '₦20,000', color: 'text-[#F59E0B]' }
      ],
      ruleDetail: 'On the Last Saturday of every month, overall top referrers are awarded up to ₦50,000 and celebrated across the Nearby ecosystem!'
    },
    'all-time': {
      title: '3-Month All-Time Legends',
      scheduleText: '3-Month Cumulative Hall of Fame',
      status: 'PERMANENT STANDINGS',
      statusBadge: 'bg-purple-600 text-white',
      countdown: '3-Month Grand Standings',
      prizes: [
        { rank: '1st Legend 🥇', amount: '₦100,000', color: 'text-[#F59E0B]' },
        { rank: '2nd Legend 🥈', amount: '₦50,000', color: 'text-[#111827] dark:text-slate-200' },
        { rank: '3rd Legend 🥉', amount: '₦25,000', color: 'text-[#F59E0B]' }
      ],
      ruleDetail: 'The 3-month ultimate hall of fame recognizing top student growth drivers across all participating Nigerian campuses.'
    }
  };

  const currentConfig = gameConfigs[activeTab];
  const allEntries = leaderboards[activeTab] || [];

  // Reset page when tab changes
  const handleTabChange = (tab: LeaderboardTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(allEntries.length / pageSize));
  const paginatedEntries = allEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Find user's entry across allEntries
  const currentUserEntry = allEntries.find((e) => e.userId === user?.id);

  return (
    <section id="leaderboards" className="py-12 sm:py-16 bg-[#FAFAFA] dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-slate-800 transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 min-w-0">
        
        {/* Header & Tabs */}
        <div className="text-center max-w-3xl mx-auto space-y-3 min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-3.5 py-1.5 rounded-full">
            <Trophy className="w-4 h-4 text-[#F59E0B] animate-bounce" />
            <span>Real-Time Live Cash Leaderboards</span>
          </div>
          <h2 className="text-[26px] sm:text-[36px] font-extrabold text-[#111827] dark:text-white font-display tracking-tight break-words">
            Live Competitive Cash Races
          </h2>
          <p className="text-[#6B7280] dark:text-slate-300 text-xs sm:text-base">
            Share your personal referral link, invite verified friends, and climb the live standings in real-time!
          </p>

          {/* Navigation Tabs */}
          <div className="pt-4 flex items-center justify-center min-w-0">
            <div className="bg-white dark:bg-[#1E293B] p-1.5 rounded-[22px] border border-[#E5E7EB] dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full max-w-2xl shadow-sm min-w-0">
              <button
                onClick={() => handleTabChange('weekly')}
                className={`h-[44px] sm:h-[48px] px-2 sm:px-3 rounded-[16px] text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'weekly'
                    ? 'bg-[#16A34A] text-white shadow-sm scale-[1.01]'
                    : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <span>Weekly Sprint</span>
                <span className="text-[10px] bg-white/20 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-full font-mono">₦20k</span>
              </button>

              <button
                onClick={() => handleTabChange('biweekly')}
                className={`h-[44px] sm:h-[48px] px-2 sm:px-3 rounded-[16px] text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'biweekly'
                    ? 'bg-[#38BDF8] text-white shadow-sm scale-[1.01]'
                    : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <span>Bi-Weekly</span>
                <span className="text-[10px] bg-white/20 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-full font-mono">₦30k</span>
              </button>

              <button
                onClick={() => handleTabChange('monthly')}
                className={`h-[44px] sm:h-[48px] px-2 sm:px-3 rounded-[16px] text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'monthly'
                    ? 'bg-[#F59E0B] text-white shadow-sm scale-[1.01]'
                    : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <span>Monthly Race</span>
                <span className="text-[10px] bg-white/20 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-full font-mono">₦50k</span>
              </button>

              <button
                onClick={() => handleTabChange('all-time')}
                className={`h-[44px] sm:h-[48px] px-2 sm:px-3 rounded-[16px] text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'all-time'
                    ? 'bg-purple-600 text-white shadow-sm scale-[1.01]'
                    : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <span>3-Month</span>
                <span className="text-[10px] bg-white/20 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-full font-mono">Legends</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Tab Config Banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-5 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.05)] space-y-5"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F3F4F6] dark:border-slate-700 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${currentConfig.statusBadge}`}>
                    {currentConfig.status}
                  </span>
                  <span className="text-xs text-[#6B7280] dark:text-slate-400 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#16A34A]" />
                    {currentConfig.scheduleText}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#111827] dark:text-white font-display">{currentConfig.title}</h3>
                <p className="text-xs text-[#6B7280] dark:text-slate-300 mt-1 max-w-2xl">{currentConfig.ruleDetail}</p>
              </div>

              {/* Countdown Badge */}
              <div className="bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 px-4 py-3 rounded-[18px] flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#16A34A] animate-pulse" />
                <div>
                  <div className="text-[10px] uppercase text-[#6B7280] dark:text-slate-400 font-semibold">Time Status</div>
                  <div className="text-sm font-extrabold text-[#16A34A] font-mono">{currentConfig.countdown}</div>
                </div>
              </div>
            </div>

            {/* Prize Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentConfig.prizes.map((p, i) => (
                <div key={i} className="bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-3.5 rounded-[16px] text-center">
                  <div className="text-xs font-semibold text-[#6B7280] dark:text-slate-400">{p.rank}</div>
                  <div className={`text-base sm:text-lg font-extrabold font-display mt-0.5 ${p.color}`}>{p.amount}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Highlight Current User Standing if present */}
        {user && currentUserEntry && (
          <div className="bg-[#16A34A]/10 border-2 border-[#16A34A] rounded-[20px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-[#16A34A] text-white font-extrabold text-sm flex items-center justify-center">
                #{currentUserEntry.rank}
              </span>
              <UserAvatar name={user.name} avatar={user.avatar} size="md" />
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-[#111827] dark:text-white flex items-center gap-2">
                  <span>Your Live Rank in {currentConfig.title}</span>
                  <span className="text-[10px] bg-[#16A34A] text-white px-2 py-0.5 rounded-full uppercase">You</span>
                </div>
                <div className="text-xs text-[#6B7280] dark:text-slate-300 font-medium">
                  {currentUserEntry.verifiedInvites} Verified Friends Invited
                </div>
              </div>
            </div>

            <div className="text-right flex items-center gap-4">
              <div>
                <div className="text-[10px] uppercase text-[#6B7280] dark:text-slate-400 font-bold">Estimated Cash Prize</div>
                <div className="text-sm sm:text-base font-extrabold text-[#F59E0B]">
                  {currentUserEntry.prizeNaira > 0 ? `₦${currentUserEntry.prizeNaira.toLocaleString()}` : 'Top Rank Eligible'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#16A34A] animate-spin mx-auto" />
            <div className="text-sm font-bold text-[#111827] dark:text-white">Fetching Live Leaderboard Standings...</div>
          </div>
        ) : allEntries.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-8 sm:p-12 text-center space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.05)]">
            <div className="w-16 h-16 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto border border-[#16A34A]/20">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-[#111827] dark:text-white font-display">
                No Standings Logged Yet
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] dark:text-slate-300 max-w-md mx-auto">
                Be the first to share your personal invite link and invite verified campus friends to claim the #1 spot on this live cash leaderboard!
              </p>
            </div>
          </div>
        ) : (
          /* Leaderboard Table with Pagination */
          <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.05)]">
            <div className="p-4 bg-[#FAFAFA] dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-[#111827] dark:text-white text-xs sm:text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#F59E0B]" /> Live Standings (Showing {paginatedEntries.length} of {allEntries.length})
              </h4>
              <span className="text-[11px] text-[#16A34A] font-bold bg-[#16A34A]/10 px-2.5 py-0.5 rounded-full">Updated Live</span>
            </div>

            <div className="divide-y divide-[#F3F4F6] dark:divide-slate-800">
              {paginatedEntries.map((entry) => {
                const isUser = entry.userId === user?.id;

                return (
                  <div
                    key={entry.userId}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                      isUser
                        ? 'bg-[#16A34A]/10 border-l-4 border-[#16A34A] font-bold'
                        : 'hover:bg-[#FAFAFA] dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[10px] flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${
                        entry.rank === 1 ? 'bg-[#F59E0B] text-white' :
                        entry.rank === 2 ? 'bg-slate-200 text-[#111827]' :
                        entry.rank === 3 ? 'bg-amber-700 text-white' :
                        'bg-[#FAFAFA] dark:bg-slate-800 text-[#6B7280] dark:text-slate-300'
                      }`}>
                        #{entry.rank}
                      </span>

                      <UserAvatar name={entry.name} avatar={entry.avatar} size="md" />

                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-[#111827] dark:text-white flex items-center gap-1.5 truncate">
                          <span className="truncate">{entry.name}</span>
                          {isUser && (
                            <span className="text-[9px] bg-[#16A34A] text-white px-1.5 py-0.2 rounded font-bold">YOU</span>
                          )}
                          {entry.badge && (
                            <span className="text-[9px] sm:text-[10px] bg-[#16A34A]/10 text-[#16A34A] dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                              {entry.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-[#6B7280] dark:text-slate-400">Verified Nearby Member</div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs sm:text-sm font-extrabold text-[#16A34A] dark:text-emerald-400 font-mono">
                        {entry.verifiedInvites} Invites
                      </div>
                      {entry.prizeNaira > 0 ? (
                        <div className="text-[11px] font-bold text-[#F59E0B]">
                          Est: ₦{entry.prizeNaira.toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#6B7280] dark:text-slate-500">Contender</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-[#FAFAFA] dark:bg-slate-900 border-t border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-2 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-[#111827] dark:text-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="text-xs font-bold text-[#6B7280] dark:text-slate-300">
                  Page <span className="text-[#16A34A]">{currentPage}</span> of {totalPages}
                </div>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-2 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-[#111827] dark:text-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};

