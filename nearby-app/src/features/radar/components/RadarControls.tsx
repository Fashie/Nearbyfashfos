import React from 'react';
import { Navigation, Eye, Sliders, Shield } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface RadarControlsProps {
  onLocateMe: () => void;
  isLocating: boolean;
  visibilityMode: 'everyone' | 'friends' | 'hidden';
  onChangeVisibilityMode: (mode: 'everyone' | 'friends' | 'hidden') => void;
}

export const RadarControls: React.FC<RadarControlsProps> = ({
  onLocateMe,
  isLocating,
  visibilityMode,
  onChangeVisibilityMode
}) => {
  const { selectedRadiusMeters, setSelectedRadiusMeters, triggerBeep } = useApp();

  return (
    <div className="bg-[#111315]/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3.5 space-y-3 shadow-xl">
      {/* Radius Slider Row */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[12px]">
          <span className="text-neutral-400 font-medium flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Search Radius</span>
          </span>
          <span className="text-emerald-400 font-bold">{selectedRadiusMeters} meters</span>
        </div>

        <input
          type="range"
          min="100"
          max="2000"
          step="50"
          value={selectedRadiusMeters}
          onChange={(e) => {
            setSelectedRadiusMeters(Number(e.target.value));
          }}
          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#0F8A5F]"
        />
      </div>

      {/* Visibility Mode Selector */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
        <div className="flex space-x-1.5">
          {(['everyone', 'friends', 'hidden'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                triggerBeep(440, 0.05);
                onChangeVisibilityMode(mode);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition cursor-pointer ${
                visibilityMode === mode
                  ? 'bg-[#0F8A5F] text-white shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* GPS Locate Me */}
        <button
          type="button"
          onClick={() => {
            triggerBeep(520, 0.08);
            onLocateMe();
          }}
          disabled={isLocating}
          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400 transition cursor-pointer disabled:opacity-50"
          title="Locate my position"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};
