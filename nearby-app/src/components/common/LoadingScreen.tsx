import React from 'react';
import { motion } from 'motion/react';
import { Radar } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0C0E] text-white font-sans relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute w-[350px] h-[350px] rounded-full bg-[#0F8A5F]/15 blur-[120px] pointer-events-none" />

      {/* Main Logo & Rings */}
      <div className="relative flex items-center justify-center mb-8">
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={`pulse-ring-${ring}`}
            className="absolute rounded-full border border-[#0F8A5F]/30"
            initial={{ width: 60, height: 60, opacity: 0.8 }}
            animate={{
              width: ring * 60 + 60,
              height: ring * 60 + 60,
              opacity: [0.7, 0.2, 0]
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              delay: ring * 0.5,
              ease: 'easeOut'
            }}
          />
        ))}

        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#0F8A5F] to-emerald-400 p-[2px] shadow-[0_0_30px_rgba(15,138,95,0.4)] relative z-10">
          <div className="w-full h-full bg-[#111315] rounded-[14px] flex items-center justify-center">
            <Radar className="w-10 h-10 text-emerald-400 animate-spin-slow" />
          </div>
        </div>
      </div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center space-y-1.5 z-10"
      >
        <h1 className="text-[22px] font-bold tracking-tight text-white font-sans">Nearby</h1>
        <p className="text-[14px] text-neutral-400 font-sans">Connecting real people around you</p>
      </motion.div>

      {/* Animated Loading Bar */}
      <div className="w-36 h-1 bg-white/10 rounded-full overflow-hidden mt-8 relative z-10">
        <motion.div
          className="absolute top-0 bottom-0 bg-[#0F8A5F] rounded-full"
          initial={{ left: '-40%', width: '40%' }}
          animate={{
            left: ['-40%', '110%'],
            width: ['30%', '50%', '30%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>
    </div>
  );
};
