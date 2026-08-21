import { AnimatePresence } from 'motion/react';
import ChatTab from './ChatTab';
import RadarTab from './RadarTab';
import StatusTab from './StatusTab';
import ExploreTabView from './ExploreTabView';
import MenuTab from './MenuTab';
import { useNearbyRuntime } from '../context/NearbyRuntimeContext';

export default function MainTabContent() {
  const { theme } = useNearbyRuntime();
  return (
    <div className={`flex-1 overflow-y-auto pb-20 relative ${theme.contentBg}`}>
      <AnimatePresence mode="wait">
        <ChatTab />
        <RadarTab />
        <StatusTab />
        <ExploreTabView />
        <MenuTab />
      </AnimatePresence>
    </div>
  );
}
