import { useNearbyRuntime } from '../context/NearbyRuntimeContext';
import AppHeaderAndBanners from './AppHeaderAndBanners';
import MainTabContent from './MainTabContent';
import CameraOverlay from './CameraOverlay';
import ChatRoomOverlay from './ChatRoomOverlay';
import CallScreenOverlay from './CallScreenOverlay';
import AppModals from './AppModals';
import BottomNav from './BottomNav';
import SecondaryModals from './SecondaryModals';

export default function NearbyAppView() {
  const { theme } = useNearbyRuntime();
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#070a13]">
      <div className={`flex flex-col h-screen w-full ${theme.appBg} font-sans antialiased overflow-hidden relative transition-all duration-300`}>
        <AppHeaderAndBanners />
        <MainTabContent />
        <CameraOverlay />
        <ChatRoomOverlay />
        <CallScreenOverlay />
        <AppModals />
        <BottomNav />
        <SecondaryModals />
      </div>
    </div>
  );
}
