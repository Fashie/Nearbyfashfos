import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { UserProfile } from '../../../types';

export function useProfile() {
  const { userProfile, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const saveProfile = async (updates: Partial<UserProfile>) => {
    await updateUserProfile(updates);
    setIsEditing(false);
  };

  return {
    profile: userProfile,
    isEditing,
    setIsEditing,
    saveProfile
  };
}
