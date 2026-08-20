import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, SwitchCamera } from 'lucide-react';
import { Neighbor } from '../../../types';
import { useWebRTC } from '../hooks/useWebRTC';
import { useApp } from '../../../context/AppContext';

interface VideoCallProps {
  neighbor: Neighbor;
  durationSeconds: number;
  onEndCall: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  neighbor,
  durationSeconds,
  onEndCall
}) => {
  const { localStream, isMuted, isVideoOff, toggleMute, toggleVideo } = useWebRTC(true, true);
  const { triggerBeep } = useApp();
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between max-w-md mx-auto relative overflow-hidden select-none">
      {/* Remote Video / Simulated Feed */}
      <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
        <div className="flex flex-col items-center space-y-3">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-[44px] font-bold shadow-2xl border-4 border-emerald-500/40 ${neighbor.avatarColor}`}>
            {neighbor.avatarEmoji || neighbor.name.charAt(0)}
          </div>
          <h3 className="text-[18px] font-bold text-white">{neighbor.name}</h3>
          <span className="text-[13px] text-neutral-400 font-medium">{formatDuration(durationSeconds)}</span>
        </div>
      </div>

      {/* Picture-in-picture Local Self Video */}
      <div className="absolute top-6 right-6 w-28 h-40 rounded-2xl bg-black border-2 border-white/30 overflow-hidden shadow-2xl z-20">
        {isVideoOff ? (
          <div className="w-full h-full flex items-center justify-center text-[12px] text-neutral-400">
            Camera Off
          </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
        )}
      </div>

      {/* Top Header */}
      <div className="p-6 relative z-10 bg-gradient-to-b from-black/80 to-transparent">
        <span className="text-[12px] uppercase tracking-widest text-emerald-400 font-semibold">
          Encrypted Video Call
        </span>
      </div>

      {/* Bottom Controls */}
      <div className="p-6 pb-10 relative z-10 bg-gradient-to-t from-black/90 to-transparent space-y-4">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={() => {
              triggerBeep(440, 0.05);
              toggleMute();
            }}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition cursor-pointer ${
              isMuted ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={() => {
              triggerBeep(440, 0.05);
              toggleVideo();
            }}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition cursor-pointer ${
              isVideoOff ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

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
