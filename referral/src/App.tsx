import React, { useState, useEffect } from 'react';
import {
  FirebaseUserService,
  FirebaseTeamService,
  FirebaseQRService,
  FirebasePayoutService,
  FirebaseNotificationService,
  FirebaseMilestoneService,
  FirebaseReferralService
} from './services/firebaseService';

import { useTheme } from './hooks/useTheme';
import { useAuthUser } from './hooks/useAuthUser';
import { useFirestoreData } from './hooks/useFirestoreData';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ReferralHub } from './components/ReferralHub';
import { LeaderboardsSection } from './components/LeaderboardsSection';
import { MilestonesSection } from './components/MilestonesSection';
import { TeamChallengeSection } from './components/TeamChallengeSection';
import { TreasureHuntSection } from './components/TreasureHuntSection';
import { InfluencersSection } from './components/InfluencersSection';
import { AntiFraudPolicy } from './components/AntiFraudPolicy';
import { PayoutModal } from './components/PayoutModal';
import { AuthModal } from './components/AuthModal';
import { FashFOSFooter } from './components/FashFOSFooter';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { ProtectedSection } from './components/ProtectedSection';

import { UserProfile, PayoutRequest, Team } from './types';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAntiFraudModal, setShowAntiFraudModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { isDarkMode, toggleTheme } = useTheme();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const { user, isAuthenticated, authLoading, handleSignOut } = useAuthUser(showToast);
  const {
    teams,
    qrCodes,
    payoutHistory,
    milestones,
    milestonesLoading,
    influencers,
    allInfluencers,
    globalStats,
    statsLoading,
    referralRecords,
    referralAnalytics,
    leaderboards,
    leaderboardsLoading
  } = useFirestoreData(user?.id);

  // Detect incoming referral code from URL parameters (?ref=CODE) or subpaths (/ref/CODE)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let refCode = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('invite');

      if (!refCode && window.location.pathname.startsWith('/ref/')) {
        const parts = window.location.pathname.split('/ref/');
        if (parts[1]) {
          refCode = parts[1].split('/')[0];
        }
      }

      if (refCode) {
        const cleanCode = refCode.trim().toUpperCase();
        console.log('📌 Captured referral invite link code:', cleanCode);
        localStorage.setItem('nearby_pending_ref', cleanCode);

        // Log click to Firestore
        FirebaseReferralService.logLinkClickByCode(cleanCode);

        // Clean up URL bar without reloads
        const cleanPath = window.location.pathname.startsWith('/ref/') ? '/' : window.location.pathname;
        window.history.replaceState({}, document.title, cleanPath);
      }
    } catch (e) {
      console.warn('Error extracting URL referral params:', e);
    }
  }, []);

  // Handler: Open Payout Modal with auth protection
  const handleOpenPayoutModal = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      showToast('Please sign in or register to request cash withdrawals.');
      return;
    }
    setShowPayoutModal(true);
  };

  // Handler: Claim milestone
  const handleClaimMilestone = async (invitesReq: number) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      showToast('Please sign in to claim milestone rewards.');
      return;
    }
    if (!user) return;

    const result = await FirebaseMilestoneService.claimMilestoneReward(user.id, invitesReq);
    if (!result.success) {
      showToast(`⚠️ ${result.message}`);
      return;
    }

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });

    showToast(`🏆 ${result.message}`);
  };

  // Handler: Create Team in Firestore
  const handleCreateTeam = async (teamName: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      showToast('Please sign in to create a squad.');
      return;
    }
    if (!user) return;

    try {
      const newTeam = await FirebaseTeamService.createTeam(user, teamName);
      showToast(`Team "${newTeam.name}" created successfully! Code: ${newTeam.code}`);
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Failed to create squad'}`);
    }
  };

  // Handler: Join Team
  const handleJoinTeam = async (code: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      showToast('Please sign in to join a squad.');
      return;
    }
    if (!user) return;

    try {
      const joinedTeam = await FirebaseTeamService.joinTeam(user, code);
      showToast(`Joined squad "${joinedTeam.name}" successfully!`);
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Failed to join squad'}`);
    }
  };

  // Handler: Leave Team
  const handleLeaveTeam = async () => {
    if (!isAuthenticated || !user || !user.teamId) return;

    try {
      await FirebaseTeamService.leaveTeam(user.id, user.teamId);
      await FirebaseUserService.updateUserProfile({ ...user, teamId: undefined });
      showToast('You have left your squad.');
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Failed to leave squad'}`);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <RefreshCw className="w-10 h-10 text-[#16A34A] animate-spin" />
        <div className="font-extrabold text-lg font-display">Loading Nearby...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAFAFA] dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 z-50 bg-[#16A34A] text-white text-xs font-bold px-4 py-3 rounded-[16px] shadow-xl flex items-center gap-2 border border-emerald-400/30 max-w-[calc(100vw-2rem)]"
          >
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Navbar */}
      <Navbar
        user={user}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenPayoutModal={handleOpenPayoutModal}
        onOpenAntiFraudModal={() => setShowAntiFraudModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        isAuthenticated={isAuthenticated}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Email Verification Banner */}
      <EmailVerificationBanner />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeSection === 'overview' && (
              <>
                <Hero
                  user={user}
                  globalStats={globalStats}
                  statsLoading={statsLoading}
                  isAuthenticated={isAuthenticated}
                  onOpenAuthModal={() => setShowAuthModal(true)}
                  onNavigate={(sec) => setActiveSection(sec)}
                />
                <ReferralHub
                  user={user}
                  payoutHistory={payoutHistory}
                  referralAnalytics={referralAnalytics}
                  referralRecords={referralRecords}
                  isAuthenticated={isAuthenticated}
                  onOpenAuthModal={() => setShowAuthModal(true)}
                  onOpenPayoutModal={handleOpenPayoutModal}
                />
                <LeaderboardsSection
                  user={user}
                  leaderboards={leaderboards}
                  isLoading={leaderboardsLoading}
                />
                <MilestonesSection
                  user={user}
                  milestones={milestones}
                  isLoading={milestonesLoading}
                  onClaimMilestone={handleClaimMilestone}
                />
                <TeamChallengeSection
                  user={user}
                  teams={teams}
                  onCreateTeam={handleCreateTeam}
                  onJoinTeam={handleJoinTeam}
                  onLeaveTeam={handleLeaveTeam}
                />
                <TreasureHuntSection
                  user={user}
                  qrCodes={qrCodes}
                  onRedeemSuccess={() => showToast('🎉 Campus Treasure QR Code verified and redeemed!')}
                />
                <InfluencersSection
                  user={user}
                  approvedInfluencers={influencers}
                  allInfluencers={allInfluencers}
                />
                <AntiFraudPolicy />
              </>
            )}

            {activeSection === 'referral-hub' && (
              !isAuthenticated ? (
                <ProtectedSection
                  title="My Referral Dashboard"
                  description="Sign in to view your unique referral link, balance breakdown, and cash payout request history."
                  onOpenAuthModal={() => setShowAuthModal(true)}
                />
              ) : (
                <ReferralHub
                  user={user}
                  payoutHistory={payoutHistory}
                  referralAnalytics={referralAnalytics}
                  referralRecords={referralRecords}
                  onOpenPayoutModal={handleOpenPayoutModal}
                />
              )
            )}

            {activeSection === 'leaderboards' && (
              <LeaderboardsSection
                user={user}
                leaderboards={leaderboards}
                isLoading={leaderboardsLoading}
              />
            )}

            {activeSection === 'milestones' && (
              <MilestonesSection
                user={user}
                milestones={milestones}
                isLoading={milestonesLoading}
                onClaimMilestone={handleClaimMilestone}
              />
            )}

            {activeSection === 'teams' && (
              <TeamChallengeSection
                user={user}
                teams={teams}
                onCreateTeam={handleCreateTeam}
                onJoinTeam={handleJoinTeam}
                onLeaveTeam={handleLeaveTeam}
              />
            )}

            {activeSection === 'treasure-hunt' && (
              <TreasureHuntSection
                user={user}
                qrCodes={qrCodes}
                onRedeemSuccess={() => showToast('🎉 Campus Treasure QR Code verified and redeemed!')}
              />
            )}

            {activeSection === 'influencers' && (
              <InfluencersSection
                user={user}
                approvedInfluencers={influencers}
                allInfluencers={allInfluencers}
              />
            )}

            {activeSection === 'rules' && <AntiFraudPolicy />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Firebase Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => showToast('Welcome back!')}
      />

      {/* Cash Payout Modal */}
      <PayoutModal
        isOpen={showPayoutModal}
        user={user}
        payoutHistory={payoutHistory}
        onClose={() => setShowPayoutModal(false)}
        onSuccess={() => showToast('💸 Withdrawal request submitted for review!')}
      />

      {/* Anti-Fraud Policy Modal */}
      {showAntiFraudModal && (
        <AntiFraudPolicy
          isOpenModal={true}
          onCloseModal={() => setShowAntiFraudModal(false)}
        />
      )}

      {/* Footer */}
      <FashFOSFooter />
    </div>
  );
}
