export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // in meters
}

export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 50) return 'Right here (<50m)';
  if (distanceMeters < 1000) return `${distanceMeters}m away`;
  const km = (distanceMeters / 1000).toFixed(1);
  return `${km}km away`;
}

export function safeFormatTime(timestamp: any): string {
  if (!timestamp) return 'Just now';
  const str = String(timestamp);
  if (str.includes('PM') || str.includes('AM') || str.toLowerCase() === 'just now' || str.toLowerCase() === 'yesterday') {
    return str;
  }
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return str;
  }
  try {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return str;
  }
}

export function formatRelativeTime(timestamp: string | number): string {
  if (!timestamp) return 'Just now';
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  if (isNaN(time)) return String(timestamp);
  
  const diffSec = Math.floor((Date.now() - time) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function triggerAudioBeep(freq = 440, duration = 0.1, type: OscillatorType = 'sine'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

export function detectUrls(text: string): RegExpMatchArray | null {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex);
}
