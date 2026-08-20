import React, { useState } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingScreen } from './components/common/LoadingScreen';
import { BottomNav } from './components/common/BottomNav';
import { Header } from './components/shared/Header';
import { ScheduleMeetupModal } from './components/common/ScheduleMeetupModal';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './features/auth/context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { ChatProvider, useChat } from './features/chat/context/ChatContext';

import { useAuth } from './features/auth/hooks/useAuth';
import { LoginScreen } from './features/auth/components/LoginScreen';
import { SignupScreen } from './features/auth/components/SignupScreen';
import { ForgotPassword } from './features/auth/components/ForgotPassword';
import { OnboardingScreen } from './features/auth/components/OnboardingScreen';

import { RadarScreen } from './features/radar/components/RadarScreen';
import { ChatList } from './features/chat/components/ChatList';
import { ChatRoom } from './features/chat/components/ChatRoom';
import { ExploreFeed } from './features/explore/components/ExploreFeed';
import { ProfileScreen } from './features/profile/components/ProfileScreen';
import { CallScreen } from './features/calls/components/CallScreen';
import { useNotifications } from './hooks/useNotifications';

const MainNavigator: React.FC = () => {
  const { currentUser, loading, showLandingMode, showOnboarding } = useAuth();
  const { activeTab, setActiveTab, showScheduleMeetupModal, setShowScheduleMeetupModal, scheduleMeetupTargetNeighbor } = useApp();
  const { activeChatNeighbor, setActiveChatNeighbor, activeCall, endCall, neighbors, unreadTotal, sendMessage } = useChat();
  useNotifications(currentUser?.uid);

  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');

  if (loading) return <LoadingScreen message="Connecting to your neighborhood..." />;

  // Auth Flow
  if (!currentUser || showLandingMode) {
    if (authView === 'signup') return <SignupScreen onSwitchToLogin={() => setAuthView('login')} />;
    if (authView === 'forgot') return <ForgotPassword onBackToLogin={() => setAuthView('login')} />;
    return <LoginScreen onSwitchToSignup={() => setAuthView('signup')} onForgotPassword={() => setAuthView('forgot')} />;
  }

  // Onboarding
  if (showOnboarding) return <OnboardingScreen />;

  // Active Live Audio / Video Call
  if (activeCall && activeCall.active) {
    const callerNeighbor = neighbors.find((n) => n.id === activeCall.neighborId) || neighbors[0];
    return <CallScreen activeCall={activeCall} neighbor={callerNeighbor} onEndCall={endCall} />;
  }

  // Active Direct Chat Room
  if (activeChatNeighbor) {
    return (
      <div className="h-screen w-full bg-[#0B0C0E] max-w-md mx-auto flex flex-col">
        <ChatRoom
          neighbor={activeChatNeighbor}
          onBack={() => setActiveChatNeighbor(null)}
          onViewProfile={() => setActiveTab('profile')}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0B0C0E] text-white flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl">
      <Header />

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'radar' && (
          <RadarScreen
            neighbors={neighbors}
            onSelectNeighbor={(nb) => setActiveChatNeighbor(nb)}
            onViewProfile={() => setActiveTab('profile')}
          />
        )}
        {activeTab === 'chats' && (
          <ChatList
            onSelectNeighbor={(nb) => setActiveChatNeighbor(nb)}
            onOpenNewChatDrawer={() => setActiveTab('radar')}
          />
        )}
        {activeTab === 'explore' && (
          <ExploreFeed
            neighbors={neighbors}
            onSelectNeighbor={(nb) => setActiveChatNeighbor(nb)}
          />
        )}
        {activeTab === 'profile' && <ProfileScreen />}
      </main>

      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveChatNeighbor(null);
          setActiveTab(tab);
        }}
        unreadCount={unreadTotal}
      />

      {showScheduleMeetupModal && (
        <ScheduleMeetupModal
          targetNeighbor={scheduleMeetupTargetNeighbor}
          onClose={() => setShowScheduleMeetupModal(false)}
          onConfirm={(date, time, loc) => {
            if (scheduleMeetupTargetNeighbor) {
              setActiveChatNeighbor(scheduleMeetupTargetNeighbor);
              sendMessage(`📅 Proposed a Safe Meetup at ${loc} on ${date} at ${time}. Looking forward to connecting!`);
            }
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <ChatProvider>
              <MainNavigator />
            </ChatProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
