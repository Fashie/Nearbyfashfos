import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Neighbor, CallState } from '../../../types';
import { AudioCall } from './AudioCall';
import { VideoCall } from './VideoCall';
import { useApp } from '../../../context/AppContext';

interface CallScreenProps {
  activeCall: CallState;
  neighbor: Neighbor;
  onEndCall: () => void;
  onAcceptCall?: () => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  activeCall,
  neighbor,
  onEndCall,
  onAcceptCall
}) => {
  const { triggerBeep } = useApp();
  const [durationSeconds, setDurationSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeCall.status === 'connected' || !activeCall.incoming) {
      interval = setInterval(() => {
        setDurationSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall.status, activeCall.incoming]);

  if (activeCall.incoming && activeCall.status === 'ringing') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B0C0E] text-white flex flex-col justify-between p-8 max-w-md mx-auto relative overflow-hidden">
        <div className="text-center pt-10 space-y-2">
          <span className="text-[13px] text-emerald-400 font-semibold tracking-wider uppercase">
            Incoming {activeCall.type === 'video' ? 'Video' : 'Voice'} Call
          </span>
          <h2 className="text-[28px] font-bold">{neighbor.name}</h2>
          <p className="text-[14px] text-neutral-400">{neighbor.streetName}</p>
        </div>

        <div className="my-auto flex justify-center">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-[44px] font-bold shadow-2xl border-4 border-emerald-500/40 animate-pulse ${neighbor.avatarColor}`}>
            {neighbor.avatarEmoji || neighbor.name.charAt(0)}
          </div>
        </div>

        <div className="flex items-center justify-around pb-8">
          <button
            onClick={() => {
              triggerBeep(300, 0.1);
              onEndCall();
            }}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl transition cursor-pointer active:scale-95"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          <button
            onClick={() => {
              triggerBeep(520, 0.1);
              onAcceptCall?.();
            }}
            className="w-16 h-16 rounded-full bg-[#0F8A5F] hover:bg-[#0C7A53] text-white flex items-center justify-center shadow-xl transition cursor-pointer active:scale-95 animate-bounce"
          >
            {activeCall.type === 'video' ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
          </button>
        </div>
      </div>
    );
  }

  if (activeCall.type === 'video') {
    return <VideoCall neighbor={neighbor} durationSeconds={durationSeconds} onEndCall={onEndCall} />;
  }

  return <AudioCall neighbor={neighbor} durationSeconds={durationSeconds} onEndCall={onEndCall} />;
};
