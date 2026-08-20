import { LocationPreset } from '../../types';
import { NEIGHBORHOODS } from '../../utils/constants';
import { calculateHaversineDistance } from '../../utils/helpers';

interface GeocodeResult {
  road: string;
  town: string;
  state: string;
  formattedAddress: string;
  preset: LocationPreset;
}

class GeocodingService {
  private cache = new Map<string, GeocodeResult>();
  private lastFetchTime = 0;

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('nearby_geocoding_cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.entries(parsed).forEach(([k, v]) => {
            this.cache.set(k, v as GeocodeResult);
          });
        }
      }
    } catch (_) {}
  }

  private saveCache() {
    try {
      if (typeof localStorage !== 'undefined') {
        const obj: Record<string, GeocodeResult> = {};
        this.cache.forEach((v, k) => { obj[k] = v; });
        localStorage.setItem('nearby_geocoding_cache', JSON.stringify(obj));
      }
    } catch (_) {}
  }

  public findClosestPreset(lat: number, lng: number): LocationPreset {
    let closestPreset = NEIGHBORHOODS[0];
    let minDistance = Infinity;
    for (const preset of NEIGHBORHOODS) {
      const dist = calculateHaversineDistance(lat, lng, preset.coords.lat, preset.coords.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestPreset = preset;
      }
    }
    return closestPreset;
  }

  public async reverseGeocode(lat: number, lng: number, force = false): Promise<GeocodeResult> {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (!force && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const closest = this.findClosestPreset(lat, lng);
    let road = closest.streets[0] || 'Gbongan Road';
    let town = closest.name.split(',')[0]?.trim() || 'Osogbo';
    let state = closest.city.split(',').pop()?.trim() || 'Osun';

    const now = Date.now();
    if (force || now - this.lastFetchTime >= 3000) {
      this.lastFetchTime = now;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.address) {
            road = data.address.road || data.address.suburb || data.address.neighbourhood || road;
            town = data.address.city_district || data.address.town || data.address.city || data.address.village || town;
            state = data.address.state || data.address.county || state;
          }
        }
      } catch (err) {
        console.warn("Reverse geocode fetch failed, using fallback preset:", err);
      }
    }

    const formattedAddress = `${road}, ${town}, ${state}`;
    const result: GeocodeResult = {
      road,
      town,
      state,
      formattedAddress,
      preset: {
        name: `${road}, ${town}`,
        city: state,
        coords: { lat, lng },
        streets: [road, town, state]
      }
    };

    this.cache.set(cacheKey, result);
    this.saveCache();
    return result;
  }
}

export const geocodingService = new GeocodingService();
