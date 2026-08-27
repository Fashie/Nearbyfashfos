import React from 'react';
import { Sparkles } from 'lucide-react';

interface SystemBannersProps {
  dismissedIframeWarning: boolean;
  setDismissedIframeWarning: (val: boolean) => void;
  firestoreQuotaExceeded: boolean;
  setFirestoreQuotaExceeded: (val: boolean) => void;
  googleBillingError: boolean;
  setGoogleBillingError: (val: boolean) => void;
  audioFeedback: string;
  triggerBeep: (freq: number, duration: number, type?: string) => void;
}

export function SystemBanners({
  dismissedIframeWarning,
  setDismissedIframeWarning,
  firestoreQuotaExceeded,
  setFirestoreQuotaExceeded,
  googleBillingError,
  setGoogleBillingError,
  audioFeedback,
  triggerBeep,
}: SystemBannersProps) {
  const isIframe = window.self !== window.top;

  return (
    <div className="relative w-full select-none">
      {/* --- Sandbox Session Ephemeral Warning Banner --- */}
      {isIframe && !dismissedIframeWarning && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 z-20">
          <div className="flex-1 space-y-1">
            <p className="font-semibold flex items-center space-x-1.5">
              <span>⚠️ Session Ephemeral in Sandbox</span>
            </p>
            <p className="opacity-80 text-[11px] leading-relaxed">
              Mobile browsers block secure storage inside iframes. To make your profile, chats, and registrations 100% permanent and survive reloads, please open the application in a direct tab!
            </p>
            <div className="pt-1.5 flex items-center space-x-3">
              <button 
                onClick={() => {
                  triggerBeep(520, 0.05);
                  window.open(window.location.href, '_blank');
                }}
                className="bg-amber-600/20 hover:bg-amber-600/45 text-amber-200 border border-amber-500/35 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center space-x-1"
              >
                <span>🔗 Open in New Direct Tab</span>
              </button>
              <button 
                onClick={() => {
                  triggerBeep(400, 0.05);
                  setDismissedIframeWarning(true);
                }}
                className="text-zinc-400 hover:text-white underline text-[10px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Firestore Quota Exceeded Warn Banner --- */}
      {firestoreQuotaExceeded && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2.5 text-xs text-rose-300 flex items-start justify-between space-x-2 z-20">
          <div className="flex-1 space-y-1">
            <p className="font-semibold flex items-center space-x-1.5">
              <span>🔥 Daily Database Quota Limit Exceeded</span>
            </p>
            <p className="opacity-80 text-[11px] leading-relaxed">
              Firebase has rejected a database operation because the project quota or configuration was reached. Your data is not being silently stored in a device-only fallback. Check your Firebase project quota, billing, and security rules, then retry.
            </p>
          </div>
          <button 
            onClick={() => setFirestoreQuotaExceeded(false)}
            className="text-rose-400 hover:text-white transition cursor-pointer text-sm font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* --- Google Maps Billing Warning Banner --- */}
      {googleBillingError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-300 flex items-start justify-between space-x-2 z-20">
          <div className="flex-1 space-y-1">
            <p className="font-semibold flex items-center space-x-1">
              <span>🗺️ Google Maps Reverse Geocoding Billing Required</span>
            </p>
            <p className="opacity-80 text-[11px] leading-relaxed">
              Google Maps reverse geocoding indicates billing is not enabled. We've instantly activated our high-precision OSM Nominatim reverse geocoder and offline geometric proximity matcher!
            </p>
            <p className="text-[11px] pt-1">
              <a 
                href="https://console.cloud.google.com/project/plucky-sky-dh7sp/billing/enable" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-white font-medium text-red-200 pr-2"
              >
                🔗 Enable GCP Billing
              </a>
              •
              <a 
                href="https://developers.google.com/maps/gmp-get-started" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-white font-medium pl-2"
              >
                Get Started Guide
              </a>
            </p>
          </div>
          <button 
            onClick={() => setGoogleBillingError(false)}
            className="text-red-400 hover:text-white transition cursor-pointer text-sm font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* --- Dynamic Feedback Indicator --- */}
      {audioFeedback && (
        <div className="absolute top-16 left-0 right-0 mx-auto w-3/4 max-w-xs bg-indigo-600 text-white text-center py-2 px-3 rounded-full text-xs font-semibold shadow-lg z-50 flex items-center justify-center space-x-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{audioFeedback}</span>
        </div>
      )}
    </div>
  );
}
