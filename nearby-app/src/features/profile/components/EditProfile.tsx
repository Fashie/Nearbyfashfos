import React, { useState, useRef } from 'react';
import { Camera, X, Check, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface EditProfileProps {
  profile: UserProfile | null;
  onSave: (updates: Partial<UserProfile>) => void;
  onClose: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({
  profile,
  onSave,
  onClose
}) => {
  const { triggerBeep } = useApp();
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [gender, setGender] = useState(profile?.gender || 'Male');
  const [ageRange, setAgeRange] = useState(profile?.ageRange || '25-34');
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(profile?.customProfilePhoto || null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    triggerBeep(520, 0.1);
    onSave({
      name: name.trim(),
      bio: bio.trim(),
      website: website.trim(),
      gender,
      ageRange,
      customProfilePhoto: avatarPhoto
    });
    onClose();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0C0E] text-white font-sans p-6 justify-between max-w-md mx-auto relative overflow-hidden">
      {/* Hidden file selector */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-[18px] font-bold">Edit Profile</h2>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 rounded-xl bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-semibold text-[13px] cursor-pointer shadow-md"
        >
          Save
        </button>
      </div>

      {/* Avatar Photo Editor */}
      <div className="flex flex-col items-center my-6">
        <div className="relative">
          {avatarPhoto ? (
            <img
              src={avatarPhoto}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-[#0F8A5F]/40 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center text-[36px] font-bold border-4 border-neutral-700">
              {profile?.avatarEmoji || '🙋‍♂️'}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0F8A5F] text-white flex items-center justify-center border-2 border-[#0B0C0E] cursor-pointer shadow-md hover:scale-105 transition"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div>
          <label className="block text-[13px] font-medium text-neutral-400 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-[14px] focus:outline-none focus:border-[#0F8A5F]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-neutral-400 mb-1">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-[14px] focus:outline-none focus:border-[#0F8A5F] resize-none"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-neutral-400 mb-1">Website / Link</label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="foslibrary.com.ng"
            className="w-full h-12 px-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-[14px] focus:outline-none focus:border-[#0F8A5F]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-neutral-400 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full h-12 px-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-[14px] focus:outline-none focus:border-[#0F8A5F]"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-neutral-400 mb-1">Age Range</label>
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full h-12 px-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-[14px] focus:outline-none focus:border-[#0F8A5F]"
            >
              <option value="18-21">18-21</option>
              <option value="22-29">22-29</option>
              <option value="30-39">30-39</option>
              <option value="40+">40+</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
