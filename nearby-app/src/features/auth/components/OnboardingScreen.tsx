import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, User, Camera, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../../../context/AppContext';

const AVAILABLE_INTERESTS = [
  'Tech', 'Design', 'Art', 'Fitness', 'Music', 'Food',
  'Startups', 'Gaming', 'Coffee', 'Photography', 'Books', 'Football'
];

export const OnboardingScreen: React.FC = () => {
  const { currentUser, updateUserProfile, setShowOnboarding } = useAuth();
  const { triggerBeep } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState('Connecting with neighbors face-to-face 👋');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Tech', 'Music']);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [ageRange, setAgeRange] = useState('22-29');

  const toggleInterest = (interest: string) => {
    triggerBeep(480, 0.05);
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleComplete = async () => {
    triggerBeep(520, 0.1);
    await updateUserProfile({
      name: name.trim() || 'Nearby Member',
      username: (name.trim() || 'member').toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000),
      bio,
      interests: selectedInterests,
      gender,
      ageRange,
      verificationLevel: 'Basic',
      trustScore: 5.0,
      meetupCount: 0
    });
    setShowOnboarding(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0C0E] text-white font-sans p-6 justify-between max-w-md mx-auto relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] h-[220px] bg-[#0F8A5F]/15 blur-[100px] pointer-events-none" />

      {/* Steps Indicator */}
      <div className="pt-6 relative z-10">
        <div className="flex space-x-2">
          {[0, 1, 2].map((s) => (
            <div
              key={`step-dot-${s}`}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= s ? 'bg-[#0F8A5F]' : 'bg-neutral-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Carousel */}
      <div className="my-auto py-6 relative z-10">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h1 className="text-[24px] font-bold tracking-tight">Set up your profile</h1>
              <p className="text-[14px] text-neutral-400">Let your neighbors know who you are</p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[13px] font-medium text-neutral-300 mb-1.5">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-12 px-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-[14px] focus:outline-none focus:border-[#0F8A5F]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-neutral-300 mb-1.5">Short Bio</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A quick sentence about yourself"
                    className="w-full h-12 px-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-[14px] focus:outline-none focus:border-[#0F8A5F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-neutral-300 mb-1.5">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full h-12 px-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-[14px] focus:outline-none focus:border-[#0F8A5F]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-neutral-300 mb-1.5">Age Range</label>
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
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-interests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h1 className="text-[24px] font-bold tracking-tight">Pick your interests</h1>
              <p className="text-[14px] text-neutral-400">Match with nearby people who love the same things</p>

              <div className="flex flex-wrap gap-2.5 pt-4">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2.5 rounded-full text-[13px] font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-[#0F8A5F] text-white shadow-md'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <span>{interest}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-guidelines"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-[22px] font-bold tracking-tight">Safe Meetup Community</h1>
              <p className="text-[14px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
                Nearby is built for authentic neighborhood friendships. Always meet in verified public places like cafes and parks.
              </p>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 text-left space-y-2 mt-4">
                <div className="flex items-center space-x-2 text-[13px] text-neutral-300">
                  <Check className="w-4 h-4 text-[#0F8A5F] shrink-0" />
                  <span>Public places for first meetups</span>
                </div>
                <div className="flex items-center space-x-2 text-[13px] text-neutral-300">
                  <Check className="w-4 h-4 text-[#0F8A5F] shrink-0" />
                  <span>Verified trust ratings from neighbors</span>
                </div>
                <div className="flex items-center space-x-2 text-[13px] text-neutral-300">
                  <Check className="w-4 h-4 text-[#0F8A5F] shrink-0" />
                  <span>Proximity privacy controls</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="pb-6 relative z-10 flex space-x-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 h-12 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-white font-medium text-[14px] transition cursor-pointer"
          >
            Back
          </button>
        )}

        <button
          onClick={() => {
            if (step < 2) {
              triggerBeep(440, 0.08);
              setStep(step + 1);
            } else {
              handleComplete();
            }
          }}
          className="flex-1 h-12 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-semibold text-[15px] rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer shadow-md active:scale-98"
        >
          <span>{step === 2 ? 'Start Exploring' : 'Continue'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
