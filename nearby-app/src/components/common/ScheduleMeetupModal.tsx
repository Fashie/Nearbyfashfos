import React, { useState } from 'react';
import { Calendar, Clock, MapPin, ShieldCheck, X, Check } from 'lucide-react';
import { Neighbor } from '../../types';
import { SNAP_HOTSPOTS } from '../../utils/constants';
import { useApp } from '../../context/AppContext';

interface ScheduleMeetupModalProps {
  targetNeighbor: Neighbor | null;
  onClose: () => void;
  onConfirm: (date: string, time: string, location: string) => void;
}

export const ScheduleMeetupModal: React.FC<ScheduleMeetupModalProps> = ({
  targetNeighbor,
  onClose,
  onConfirm
}) => {
  const { triggerBeep } = useApp();
  const [selectedSpot, setSelectedSpot] = useState(SNAP_HOTSPOTS[0].name);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('16:00');

  const handleConfirm = () => {
    triggerBeep(520, 0.1);
    onConfirm(date, time, selectedSpot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#181A1D] border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-[16px] font-bold text-white">Safe Public Meetup</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-[13px] text-neutral-400">
            Propose a verified public meetup with{' '}
            <span className="font-semibold text-white">{targetNeighbor?.name || 'Neighbor'}</span>:
          </p>

          {/* Hotspot options */}
          <div className="space-y-2">
            <label className="text-[12px] font-medium text-neutral-400 block">Verified Public Location</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {SNAP_HOTSPOTS.map((spot) => (
                <button
                  key={spot.name}
                  type="button"
                  onClick={() => setSelectedSpot(spot.name)}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                    selectedSpot === spot.name
                      ? 'bg-[#0F8A5F]/15 border-[#0F8A5F] text-white'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 text-left">
                    <span className="text-[16px]">{spot.emoji}</span>
                    <div>
                      <span className="text-[13px] font-semibold block">{spot.name}</span>
                      <span className="text-[11px] text-neutral-500">{spot.category}</span>
                    </div>
                  </div>
                  {selectedSpot === spot.name && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-neutral-400 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-900 border border-neutral-800 rounded-xl text-[13px] text-white focus:outline-none focus:border-[#0F8A5F]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-neutral-400 block mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-900 border border-neutral-800 rounded-xl text-[13px] text-white focus:outline-none focus:border-[#0F8A5F]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-neutral-400">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-[#0F8A5F] hover:bg-[#0C7A53] text-white text-[13px] font-semibold transition cursor-pointer shadow-md"
          >
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
};
