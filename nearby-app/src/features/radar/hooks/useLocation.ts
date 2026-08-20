import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { geocodingService } from '../../../services/location/GeocodingService';
import { calculateHaversineDistance } from '../../../utils/helpers';

export function useLocation() {
  const { userCoords, setUserCoords, currentAddress, setCurrentAddress, setSelectedPreset } = useApp();
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const requestGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });

        try {
          const res = await geocodingService.reverseGeocode(lat, lng);
          setCurrentAddress(res.formattedAddress);
          setSelectedPreset(res.preset);
        } catch (_) {}

        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS location lookup failed:', err);
        setGpsError(err.message || 'Unable to retrieve location');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [setUserCoords, setCurrentAddress, setSelectedPreset]);

  return {
    userCoords,
    currentAddress,
    isLocating,
    gpsError,
    requestGPSLocation,
    calculateDistance: (lat: number, lng: number) =>
      calculateHaversineDistance(userCoords.lat, userCoords.lng, lat, lng)
  };
}
