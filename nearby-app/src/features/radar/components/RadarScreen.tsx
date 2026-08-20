import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Shield, Sparkles, Coffee, Trees, Building2, Flame } from 'lucide-react';
import { Neighbor } from '../../../types';
import { SNAP_HOTSPOTS } from '../../../utils/constants';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { UserMarker } from './UserMarker';
import { RadarControls } from './RadarControls';

interface RadarScreenProps {
  neighbors: Neighbor[];
  onSelectNeighbor: (neighbor: Neighbor) => void;
  onViewProfile: (neighbor: Neighbor) => void;
}

export const RadarScreen: React.FC<RadarScreenProps> = ({
  neighbors,
  onSelectNeighbor,
  onViewProfile
}) => {
  const { selectedRadiusMeters, triggerBeep, setShowScheduleMeetupModal, setScheduleMeetupTargetNeighbor } = useApp();
  const { currentUser, userProfile } = useAuth();
  const { isLocating, requestGPSLocation } = useLocation();

  const [visibilityMode, setVisibilityMode] = useState<'everyone' | 'friends' | 'hidden'>('everyone');

  // Filter neighbors within radius
  const filteredNeighbors = neighbors.filter((nb) => nb.distanceMeters <= selectedRadiusMeters);

  return (
    <div className="relative flex flex-col h-full bg-[#0B0C0E] text-white font-sans overflow-hidden">
      {/* Radar Proximity Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        {/* Animated Sweep Radar Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3, 4].map((ring) => (
            <motion.div
              key={`radar-ring-${ring}`}
              className="absolute rounded-full border border-[#0F8A5F]/20"
              style={{
                width: `${ring * 22}%`,
                height: `${ring * 22}%`
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.02, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: ring * 0.6,
                ease: 'easeInOut'
              }}
            />
          ))}

          {/* Rotating radar sweep beam */}
          <motion.div
            className="absolute w-72 h-72 rounded-full pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, rgba(15, 138, 95, 0.15) 0deg, transparent 60deg, transparent 360deg)'
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </div>

        {/* Center: Current User Marker */}
        <div className="relative z-10 flex flex-col items-center select-none">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F8A5F] to-emerald-400 p-[2px] shadow-[0_0_30px_rgba(15,138,95,0.5)]">
              <div className="w-full h-full bg-[#111315] rounded-[14px] flex items-center justify-center text-[22px] font-bold">
                {userProfile?.avatarEmoji || '🙋‍♂️'}
              </div>
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#111315] animate-ping" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#111315]" />
          </div>

          <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-[#0F8A5F] text-white text-[11px] font-bold shadow-md">
            You (Center)
          </div>
        </div>

        {/* Nearby Neighbors Markers */}
        {filteredNeighbors.map((nb, idx) => {
          // Compute polar offset positioning within viewport
          const angle = (idx * (360 / Math.max(filteredNeighbors.length, 1)) + 45) * (Math.PI / 180);
          const normalizedDist = Math.min(nb.distanceMeters / (selectedRadiusMeters || 500), 0.9);
          const radiusPercent = 18 + normalizedDist * 28; // between 18% and 46% radius
          const xPercent = 50 + radiusPercent * Math.cos(angle);
          const yPercent = 50 + radiusPercent * Math.sin(angle);

          return (
            <UserMarker
              key={nb.id}
              neighbor={nb}
              onClick={() => {
                triggerBeep(480, 0.05);
                onSelectNeighbor(nb);
              }}
              xPercent={xPercent}
              yPercent={yPercent}
            />
          );
        })}

        {/* Safe Meetup Verified Hotspot Markers */}
        {SNAP_HOTSPOTS.slice(0, 3).map((spot, idx) => {
          const x = 50 + (idx === 0 ? -32 : idx === 1 ? 30 : -20);
          const y = 50 + (idx === 0 ? -28 : idx === 1 ? 25 : 32);

          return (
            <button
              key={spot.name}
              type="button"
              onClick={() => {
                triggerBeep(520, 0.08);
                setShowScheduleMeetupModal(true);
              }}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute z-10 p-1.5 rounded-xl bg-neutral-900/90 border border-emerald-500/30 hover:border-emerald-400 backdrop-blur-md flex items-center space-x-1 shadow-md cursor-pointer transition active:scale-95"
            >
              <span className="text-[14px]">{spot.emoji}</span>
              <div className="text-left hidden sm:block">
                <span className="text-[10px] font-bold text-white block truncate max-w-[80px]">{spot.name}</span>
                <span className="text-[8px] text-emerald-400 font-medium">Safe Spot</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Floating Radar Controls Bar */}
      <div className="p-4 pb-20 relative z-30 max-w-md mx-auto w-full">
        <RadarControls
          onLocateMe={requestGPSLocation}
          isLocating={isLocating}
          visibilityMode={visibilityMode}
          onChangeVisibilityMode={setVisibilityMode}
        />
      </div>
    </div>
  );
};
