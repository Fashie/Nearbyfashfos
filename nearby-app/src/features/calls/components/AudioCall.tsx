import React from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff } from 'lucide-react';
import { Neighbor } from '../../../types';
import { useWebRTC } from '../hooks/useWebRTC';
import { useApp } from '../../../context/AppContext';

interface AudioCallProps {
  neighbor: Neighbor;
  durationSeconds: number;
  onEndCall: () => void;
}

export const AudioCall: React.FC<AudioCallProps> = ({
  neighbor,
  durationSeconds,
  onEndCall
}) => {
  const { isMuted, isSpeakerOn, toggleMute, toggleSpeaker } = useWebRTC(true, false);
  const { triggerBeep } = useApp();

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0C0E] text-white flex flex-col justify-between p-8 max-w-md mx-auto relative overflow-hidden select-none">
      {/* Ambient background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((r) => (
          <motion.div
            key={r}
            className="absolute rounded-full border border-emerald-500/20"
            initial={{ width: 140, height: 140, opacity: 0.8 }}
            animate={{
              width: r * 80 + 140,
              height: r * 80 + 140,
              opacity: [0.6, 0.1, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: r * 0.7,
              ease: 'easeOut'
            }}
          />
        ))}
      </div>

      {/* Top Caller Info */}
      <div className="text-center pt-8 relative z-10 space-y-2">
        <span className="text-[12px] uppercase tracking-widest text-emerald-400 font-semibold">
          High-Definition Audio Call
        </span>
        <h2 className="text-[26px] font-bold tracking-tight">{neighbor.name}</h2>
        <p className="text-[14px] text-neutral-400 font-medium">{formatDuration(durationSeconds)}</p>
      </div>

      {/* Center Avatar */}
      <div className="my-auto relative z-10 flex justify-center">
        <div className="relative">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-[44px] font-bold shadow-2xl border-4 border-emerald-500/40 ${neighbor.avatarColor}`}>
            {neighbor.avatarEmoji || neighbor.name.charAt(0)}
          </div>
          <span className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0B0C0E]" />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 pb-8 space-y-6">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={() => {
              triggerBeep(440, 0.05);
              toggleMute();
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition cursor-pointer ${
              isMuted ? 'bg-rose-500 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={() => {
              triggerBeep(440, 0.05);
              toggleSpeaker();
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition cursor-pointer ${
              isSpeakerOn ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
            }`}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>

        {/* End Call Button */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              triggerBeep(300, 0.1);
              onEndCall();
            }}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl transition cursor-pointer active:scale-95"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
