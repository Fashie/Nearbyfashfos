import { useState, useEffect } from 'react';
import { Neighbor } from '../types';

export function useRadar(neighbors: Neighbor[], currentCoords: { lat: number; lng: number } | null) {
  const [nearbyNeighbors, setNearbyNeighbors] = useState<Neighbor[]>([]);

  useEffect(() => {
    if (!currentCoords) {
      setNearbyNeighbors([]);
      return;
    }
    
    // Sort or filter neighbors by calculated distance relative to coords
    const sorted = [...neighbors].sort((a, b) => {
      const distA = a.distanceMeters || 1000;
      const distB = b.distanceMeters || 1000;
      return distA - distB;
    });
    setNearbyNeighbors(sorted);
  }, [neighbors, currentCoords]);

  return {
    nearbyNeighbors
  };
}
