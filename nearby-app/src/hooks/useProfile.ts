import { useState, useEffect } from 'react';
import { profileService } from '../features/profile/services/profileService';

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    profileService.getUserProfile(userId)
      .then((data) => {
        setProfile(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  const updateProfile = async (data: any) => {
    if (!userId) return;
    await profileService.saveUserProfile(userId, data);
    setProfile((prev: any) => ({ ...prev, ...data }));
  };

  return {
    profile,
    loading,
    updateProfile
  };
}
