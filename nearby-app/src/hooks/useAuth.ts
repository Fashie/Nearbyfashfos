import { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { User } from 'firebase/auth';
import { authService } from '../features/authentication/services/authService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    login: authService.login,
    signup: authService.signup,
    logout: authService.logout,
    loginWithGoogle: authService.loginWithGoogle
  };
}
