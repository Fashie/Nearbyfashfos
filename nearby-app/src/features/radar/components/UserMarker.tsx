import React from 'react';
import { motion } from 'motion/react';
import { Neighbor } from '../../../types';
import { ShieldCheck, MapPin } from 'lucide-react';

interface UserMarkerProps {
  neighbor: Neighbor;
  onClick: () => void;
  xPercent: number;
  yPercent: number;
}

export const UserMarker: React.FC<UserMarkerProps> = ({
  neighbor,
  onClick,
  xPercent,
  yPercent
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: 'translate(-50%, -50%)'
      }}
      className="absolute z-20 flex flex-col items-center cursor-pointer group select-none"
    >
      {/* Avatar with pulse ring */}
      <div className="relative">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[18px] font-bold shadow-lg border-2 border-white/80 ${neighbor.avatarColor}`}>
          {neighbor.avatarEmoji || neighbor.name.charAt(0)}
        </div>

        {neighbor.verificationLevel === 'Verified' && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0F8A5F] rounded-full flex items-center justify-center text-[10px] text-white border-2 border-[#111315]">
            ✓
          </span>
        )}

        {neighbor.onlineStatus === 'active' && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#111315] animate-pulse" />
        )}
      </div>

      {/* Distance & Name Pill */}
      <div className="mt-1 px-2 py-0.5 rounded-full bg-[#111315]/90 border border-neutral-700/60 shadow-md backdrop-blur-sm text-center">
        <span className="text-[10px] font-semibold text-white truncate block max-w-[70px]">
          {neighbor.name.split(' ')[0]}
        </span>
        <span className="text-[9px] text-emerald-400 font-medium block">
          {neighbor.distanceMeters}m
        </span>
      </div>
    </motion.button>
  );
};
