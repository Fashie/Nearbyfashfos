import React from 'react';
import { NearbyLogo } from './NearbyLogo';
import { ExternalLink, ShieldCheck, Globe, Mail, Instagram, Twitter, Linkedin, Video } from 'lucide-react';

export const FashFOSFooter: React.FC = () => {
  return (
    <footer className="bg-[#0F172A] text-slate-400 border-t border-slate-800 pt-12 pb-8 text-xs w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-10 min-w-0">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Col 1: FashFOS Parent Company & Nearby */}
          <div className="lg:col-span-2 space-y-4">
            <NearbyLogo size="md" showSubtitle={true} lightText={true} />
            <p className="text-slate-300 leading-relaxed max-w-sm text-xs">
              FashFOS Inc. is a conglomerate innovating across Technology, Social Media, Agriculture, and Automobile. Our flagship social platform, <strong>Nearby</strong>, empowers hyper-local campus and city connections.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href="https://nearby.fashfos.com"
                target="_blank"
                rel="noreferrer"
                className="bg-[#16A34A] text-white font-bold px-4 py-2.5 rounded-[12px] hover:bg-[#15803D] transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <span>Visit nearby.fashfos.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Official Social Media Channels */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-300 mb-2 uppercase tracking-wider">Connect On Social Media</div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://instagram.com/nearby_app_"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-pink-600/20 hover:border-pink-500/50 border border-slate-700 rounded-[10px] text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                  <span>@nearby_app_</span>
                </a>

                <a
                  href="https://x.com/nearby_app_"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-sky-600/20 hover:border-sky-500/50 border border-slate-700 rounded-[10px] text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                >
                  <Twitter className="w-3.5 h-3.5 text-sky-400" />
                  <span>@nearby_app_</span>
                </a>

                <a
                  href="https://linkedin.com/company/nearby_app_"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600/20 hover:border-blue-500/50 border border-slate-700 rounded-[10px] text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                >
                  <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                  <span>nearby_app_</span>
                </a>

                <a
                  href="https://tiktok.com/@nearby_app_"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-purple-600/20 hover:border-purple-500/50 border border-slate-700 rounded-[10px] text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                >
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span>@nearby_app_</span>
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Games & Referral Hub */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs font-display">Referral Games</h4>
            <ul className="space-y-2 text-slate-300">
              <li><a href="#leaderboards" className="hover:text-[#16A34A] transition-colors">Weekly Sprint (₦20k)</a></li>
              <li><a href="#leaderboards" className="hover:text-[#38BDF8] transition-colors">Bi-Weekly Mega (₦30k)</a></li>
              <li><a href="#leaderboards" className="hover:text-[#F59E0B] transition-colors">Monthly Champion (₦50k)</a></li>
              <li><a href="#milestones" className="hover:text-[#16A34A] transition-colors">Referral Milestones</a></li>
              <li><a href="#teams" className="hover:text-[#38BDF8] transition-colors">5-Member Team Challenge</a></li>
              <li><a href="#treasure-hunt" className="hover:text-[#F59E0B] transition-colors">Campus Treasure QR Hunt</a></li>
              <li><a href="#influencers" className="hover:text-[#16A34A] transition-colors">Influencers Challenge</a></li>
            </ul>
          </div>

          {/* Col 3: FashFOS Subsidiaries */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs font-display">FashFOS Ecosystem</h4>
            <ul className="space-y-2 text-slate-300">
              <li><span className="text-white font-semibold">Nearby Social Media</span> (<a href="https://nearby.fashfos.com" className="text-[#16A34A] hover:underline">nearby.fashfos.com</a>)</li>
              <li><span>FashFOS Agriculture & Farms</span></li>
              <li><span>FashFOS Automobile</span></li>
              <li><span>FashFOS Technology & Innovation</span></li>
            </ul>
          </div>

          {/* Col 4: Contact & Anti-Fraud */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs font-display">Trust & Security</h4>
            <div className="space-y-2 text-slate-300">
              <p className="flex items-center gap-1.5 text-[#16A34A] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                Anti-Fraud Verified System
              </p>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Referral bonuses are subject to 7-day active user verification before cash payout.
              </p>
              <div className="pt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-[#16A34A]" /> support@fashfos.com
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Globe className="w-3.5 h-3.5 text-[#16A34A]" /> www.fashfos.com
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} <strong>FashFOS Inc.</strong> All rights reserved. Main Company Domain: www.fashfos.com
          </div>

          <div className="flex items-center gap-4">
            <a href="https://nearby.fashfos.com" className="text-slate-300 hover:text-[#16A34A] transition-colors">Nearby App Portal</a>
            <span>•</span>
            <span>Made with care for Nearby Social Media</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
