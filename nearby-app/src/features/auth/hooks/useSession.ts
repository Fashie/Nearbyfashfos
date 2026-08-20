import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export function useSession() {
  const { currentUser, userProfile, hasSavedAccountOnDisk, isLoading } = useAuth();
  const [isRestoring, setIsRestoring] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoading) {
      setIsRestoring(false);
    }
  }, [isLoading]);

  return {
    isAuthenticated: Boolean(currentUser),
    isRestoring,
    hasSavedAccountOnDisk,
    currentUser,
    userProfile
  };
}
