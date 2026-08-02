import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Radar,
  MessageCircle,
  MapPinned,
  ShieldCheck,
  ArrowRight,
  Lock,
  UserCheck,
  Menu,
  X,
  Gift,
  Users,
  Trophy,
} from 'lucide-react';

const NEARBY_APP_URL = 'https://nearby.fashfos.com';
const REFERRAL_APP_URL = '/referralgames/';

function RadarVisual() {
  const dots = [
    { top: '18%', left: '68%', delay: 0 },
    { top: '58%', left: '82%', delay: 0.6 },
    { top: '72%', left: '30%', delay: 1.1 },
    { top: '30%', left: '20%', delay: 1.6 },
  ];

  return (
    <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] mx-auto">
      <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />

      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border border-[var(--color-primary)]/25 animate-radar-ping"
          style={{ animationDelay: `${i * 1}s` }}
        />
      ))}

      <div className="absolute inset-[10%] rounded-full border border-[var(--color-divider-light)]" />
      <div className="absolute inset-[28%] rounded-full border border-[var(--color-divider-light)]" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-[18px] bg-white shadow-[var(--shadow-soft-lg)] flex items-center justify-center relative">
          <Radar className="w-8 h-8 text-[var(--color-primary)]" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--color-accent)] rounded-full border-2 border-white" />
        </div>
      </div>

      {dots.map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 + d.delay * 0.3, ease: 'easeOut' }}
          className="absolute w-9 h-9 rounded-full bg-white shadow-[var(--shadow-soft-md)] border border-white flex items-center justify-center text-[11px] font-semibold text-[var(--color-primary)]"
          style={{ top: d.top, left: d.left }}
        >
          <span
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{ background: i % 2 === 0 ? 'var(--color-primary-light)' : '#EAF0FF' }}
          >
            {['A', 'K', 'S', 'M'][i]}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function NavBar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bg-light)]/80 backdrop-blur-md border-b border-[var(--color-divider-light)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-white shadow-[var(--shadow-soft-sm)] flex items-center justify-center relative">
            <Radar className="w-4.5 h-4.5 text-[var(--color-primary)]" />
          </div>
          <span className="font-bold text-[17px] tracking-tight">Nearby</span>
        </div>

        <nav className="hidden sm:flex items-center gap-8 text-[14px] font-medium text-[var(--color-text-secondary)]">
          <a href="#what-is-nearby" className="hover:text-[var(--color-text-primary)] transition-premium">What it does</a>
          <a href="#how-it-works" className="hover:text-[var(--color-text-primary)] transition-premium">How it works</a>
          <a href="#referral" className="hover:text-[var(--color-text-primary)] transition-premium">Referral</a>
          <a href="#safety" className="hover:text-[var(--color-text-primary)] transition-premium">Safety</a>
        </nav>

        <a
          href={NEARBY_APP_URL}
          className="hidden sm:inline-flex items-center gap-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-[14px] font-semibold px-4 py-2 rounded-[18px] transition-premium shadow-[var(--shadow-soft-sm)]"
        >
          Open Nearby
          <ArrowRight className="w-3.5 h-3.5" />
        </a>

        <button
          className="sm:hidden w-9 h-9 flex items-center justify-center rounded-[12px] bg-white shadow-[var(--shadow-soft-sm)]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
        </button>
      </div>

      {open && (
        <div className="sm:hidden px-6 pb-5 flex flex-col gap-4 text-[15px] font-medium text-[var(--color-text-secondary)]">
          <a href="#what-is-nearby" onClick={() => setOpen(false)}>What it does</a>
          <a href="#how-it-works" onClick={() => setOpen(false)}>How it works</a>
          <a href="#referral" onClick={() => setOpen(false)}>Referral</a>
          <a href="#safety" onClick={() => setOpen(false)}>Safety</a>
          <a
            href={NEARBY_APP_URL}
            className="inline-flex items-center justify-center gap-1.5 bg-[var(--color-primary)] text-white font-semibold px-4 py-2.5 rounded-[18px] mt-1"
          >
            Open Nearby <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-16 grid sm:grid-cols-2 gap-12 items-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="space-y-6 text-center sm:text-left"
      >
        <div className="inline-flex items-center gap-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[13px] font-semibold px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
          Now finding people near you
        </div>

        <h1 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight leading-[1.1] text-[var(--color-text-primary)]">
          Real friendships,
          <br />
          closer than you think.
        </h1>

        <p className="text-[17px] text-[var(--color-text-secondary)] leading-relaxed max-w-md mx-auto sm:mx-0">
          Nearby helps you discover mutual-interest people around you, chat safely,
          and meet up at places built for comfort and trust — not just another feed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start pt-2">
          <a
            href={NEARBY_APP_URL}
            className="inline-flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-[15px] px-6 py-3.5 rounded-[18px] transition-premium shadow-[var(--shadow-soft-md)]"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#what-is-nearby"
            className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-text-primary)] font-semibold text-[15px] px-6 py-3.5 rounded-[18px] border border-[var(--color-divider-light)] transition-premium hover:shadow-[var(--shadow-soft-sm)]"
          >
            See how it works
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <RadarVisual />
      </motion.div>
    </section>
  );
}

const features = [
  {
    icon: Radar,
    title: 'Discover who is around',
    body: 'See genuine, mutual-interest people nearby — not endless strangers from across the globe.',
  },
  {
    icon: MessageCircle,
    title: 'Chat before you meet',
    body: 'Get to know someone at your own pace with real-time chat and calls, all in one place.',
  },
  {
    icon: MapPinned,
    title: 'Meet at safe spots',
    body: 'When you are ready, Nearby points you to well-lit, public meetup spots built for comfort.',
  },
];

function WhatIsNearby() {
  return (
    <section id="what-is-nearby" className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
        <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">What Nearby actually does</h2>
        <p className="text-[16px] text-[var(--color-text-secondary)] leading-relaxed">
          Nearby is a human connection platform. It turns "who's around me" into real,
          comfortable friendships — with safety built into every step.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {features.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="bg-[var(--color-card-light)] rounded-[20px] p-6 shadow-[var(--shadow-soft-sm)] border border-[var(--color-divider-light)] transition-premium hover:shadow-[var(--shadow-soft-md)]"
          >
            <div className="w-11 h-11 rounded-[14px] bg-[var(--color-primary-light)] flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-[17px] font-semibold mb-1.5">{title}</h3>
            <p className="text-[14.5px] text-[var(--color-text-secondary)] leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const steps = [
  { label: '01', title: 'Turn on your radar', body: 'Nearby quietly surfaces people around you who share your interests.' },
  { label: '02', title: 'Start a conversation', body: 'Chat, call, and build comfort before ever meeting in person.' },
  { label: '03', title: 'Meet up, safely', body: 'Pick a suggested safe spot and meet on your own terms.' },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white border-y border-[var(--color-divider-light)]">
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">How it works</h2>
          <p className="text-[16px] text-[var(--color-text-secondary)]">Three simple, deliberate steps — in this order, by design.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.label} className="text-center sm:text-left space-y-2">
              <span className="text-[13px] font-bold text-[var(--color-secondary)] tracking-wide">{s.label}</span>
              <h3 className="text-[18px] font-semibold">{s.title}</h3>
              <p className="text-[14.5px] text-[var(--color-text-secondary)] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const referralSteps = [
  { icon: Gift, title: 'Get your code', body: 'Every Nearby account comes with a unique referral link, ready to share.' },
  { icon: Users, title: 'Invite your people', body: 'Share it with friends — when they join and get active, you both score points.' },
  { icon: Trophy, title: 'Climb & cash out', body: 'Earn milestones, land on leaderboards, and redeem real payouts as you go.' },
];

function ReferralSection() {
  return (
    <section id="referral" className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
        <div className="inline-flex items-center gap-2 bg-[#EAF0FF] text-[var(--color-secondary)] text-[13px] font-semibold px-3 py-1.5 rounded-full mb-1">
          <Gift className="w-3.5 h-3.5" />
          Nearby Referral & Games Hub
        </div>
        <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">Bring friends, earn rewards</h2>
        <p className="text-[16px] text-[var(--color-text-secondary)] leading-relaxed">
          Referring people to Nearby isn't just a link — it's its own hub with milestones,
          team challenges, and leaderboards for the most active connectors.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mb-10">
        {referralSteps.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="bg-[var(--color-card-light)] rounded-[20px] p-6 shadow-[var(--shadow-soft-sm)] border border-[var(--color-divider-light)] transition-premium hover:shadow-[var(--shadow-soft-md)]"
          >
            <div className="w-11 h-11 rounded-[14px] bg-[#EAF0FF] flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-[var(--color-secondary)]" />
            </div>
            <h3 className="text-[17px] font-semibold mb-1.5">{title}</h3>
            <p className="text-[14.5px] text-[var(--color-text-secondary)] leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <a
          href={REFERRAL_APP_URL}
          className="inline-flex items-center gap-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90 text-white font-semibold text-[15px] px-6 py-3.5 rounded-[18px] transition-premium shadow-[var(--shadow-soft-md)]"
        >
          Open the Referral Hub
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}

function Safety() {
  return (
    <section id="safety" className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
      <div className="bg-[var(--color-primary)] rounded-[24px] px-8 py-12 sm:py-16 text-white grid sm:grid-cols-2 gap-10 items-center overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="space-y-4 relative">
          <h2 className="text-[26px] sm:text-[30px] font-bold tracking-tight">Built to feel safe, not just look nice</h2>
          <p className="text-[15.5px] text-white/85 leading-relaxed max-w-md">
            Safety isn't a footnote for Nearby — it shapes every meetup suggestion and every profile you see.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 relative">
          {[
            { icon: UserCheck, text: 'Profile checks to reduce fake accounts' },
            { icon: MapPinned, text: 'Meetup spots chosen for visibility and comfort' },
            { icon: Lock, text: 'Private chat before any location is shared' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white/10 rounded-[16px] px-4 py-3.5">
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[14.5px] font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 sm:py-24 text-center space-y-6">
      <ShieldCheck className="w-9 h-9 text-[var(--color-primary)] mx-auto" />
      <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight max-w-lg mx-auto">
        Your next real friendship might be closer than you think.
      </h2>
      <a
        href={NEARBY_APP_URL}
        className="inline-flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-[15.5px] px-7 py-4 rounded-[18px] transition-premium shadow-[var(--shadow-soft-md)]"
      >
        Open Nearby
        <ArrowRight className="w-4 h-4" />
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-divider-light)]">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13.5px] text-[var(--color-text-tertiary)]">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-[var(--color-primary)]" />
          <span>© {new Date().getFullYear()} Nearby, by Fashfos.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href={NEARBY_APP_URL} className="hover:text-[var(--color-text-primary)] transition-premium">Open app</a>
          <a href={REFERRAL_APP_URL} className="hover:text-[var(--color-text-primary)] transition-premium">Referral</a>
          <a href="#safety" className="hover:text-[var(--color-text-primary)] transition-premium">Safety</a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-light)] font-sans text-[var(--color-text-primary)] overflow-x-hidden">
      <NavBar />
      <Hero />
      <WhatIsNearby />
      <HowItWorks />
      <ReferralSection />
      <Safety />
      <FinalCta />
      <Footer />
    </div>
  );
}
