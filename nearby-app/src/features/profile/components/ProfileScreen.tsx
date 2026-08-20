import React, { useState } from 'react';
import { Settings, Edit3, ShieldCheck, MapPin, Calendar, ExternalLink, Award, Heart } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useApp } from '../../../context/AppContext';
import { EditProfile } from './EditProfile';
import { SettingsScreen } from './SettingsScreen';

export const ProfileScreen: React.FC = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const { currentAddress, triggerBeep } = useApp();

  const [showEdit, setShowEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (showEdit) {
    return <EditProfile profile={userProfile} onSave={updateUserProfile} onClose={() => setShowEdit(false)} />;
  }

  if (showSettings) {
    return <SettingsScreen onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-[#0B0C0E] text-white font-sans overflow-y-auto pb-24">
      {/* Top Banner & Profile Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-[#0F8A5F]/30 via-emerald-800/20 to-teal-900/30 w-full" />

        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => {
              triggerBeep(480, 0.05);
              setShowSettings(true);
            }}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Avatar Card */}
        <div className="px-6 -mt-12 flex items-end justify-between">
          <div className="relative">
            {userProfile?.customProfilePhoto ? (
              <img
                src={userProfile.customProfilePhoto}
                alt="Profile"
                className="w-24 h-24 rounded-3xl object-cover border-4 border-[#0B0C0E] shadow-2xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-[#181A1D] border-4 border-[#0B0C0E] flex items-center justify-center text-[38px] font-bold shadow-2xl">
                {userProfile?.avatarEmoji || '🙋‍♂️'}
              </div>
            )}
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0B0C0E]" />
          </div>

          <button
            onClick={() => {
              triggerBeep(480, 0.05);
              setShowEdit(true);
            }}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-[13px] flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Name, Bio, Location */}
      <div className="px-6 pt-4 space-y-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-[22px] font-bold tracking-tight">{userProfile?.name || 'Nearby Member'}</h1>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[13px] text-neutral-400 font-medium">@{userProfile?.username || 'member'}</p>
        </div>

        <p className="text-[14px] text-neutral-300 leading-relaxed">
          {userProfile?.bio || 'Connecting with neighbors and making real-world local friends!'}
        </p>

        {userProfile?.website && (
          <a
            href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1 text-[13px] text-emerald-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{userProfile.website}</span>
          </a>
        )}

        <div className="flex items-center space-x-2 text-[12px] text-neutral-400 pt-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate">{currentAddress || 'Local Neighborhood'}</span>
        </div>
      </div>

      {/* Trust & Community Metrics Bento */}
      <div className="grid grid-cols-3 gap-3 px-6 pt-6">
        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
          <span className="text-[18px] font-bold text-emerald-400 block">5.0 ★</span>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Trust Score</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
          <span className="text-[18px] font-bold text-white block">12</span>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Safe Meetups</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
          <span className="text-[18px] font-bold text-teal-400 block">Verified</span>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Badge</span>
        </div>
      </div>

      {/* Interests Chips */}
      <div className="px-6 pt-6 space-y-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-400">Interests & Hobbies</h3>
        <div className="flex flex-wrap gap-2 pt-1">
          {(userProfile?.interests || ['Tech', 'Design', 'Coffee', 'Football']).map((interest) => (
            <span
              key={interest}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[12px] text-neutral-300 font-medium"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
