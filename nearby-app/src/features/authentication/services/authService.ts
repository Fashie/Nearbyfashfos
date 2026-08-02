import { auth } from '../../../services/firebase';
import { 
  signInWithEmailAndPassword as fSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fCreateUserWithEmailAndPassword,
  signOut as fSignOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

export const authService = {
  getCurrentUser: () => auth.currentUser,

  login: async (email: string, pass: string) => {
    return fSignInWithEmailAndPassword(auth, email, pass);
  },

  signup: async (email: string, pass: string) => {
    return fCreateUserWithEmailAndPassword(auth, email, pass);
  },

  logout: async () => {
    return fSignOut(auth);
  },

  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }
};
