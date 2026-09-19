import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase.js';

const AuthContext = createContext(null);

const isNative = () =>
  typeof window !== 'undefined' &&
  window.location.protocol === 'capacitor:';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u || null);
    });
    return unsub;
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isNative()) {
        await loginNative();
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const loginNative = async () => {
    try {
      const { FirebaseAuthentication } = await import(
        '@capawesome-team/capacitor-firebase-authentication'
      );

      // Buka Google Sign-In native di Android (pakai Chrome Custom Tab)
      const result = await FirebaseAuthentication.signInWithGoogle();

      // Buat credential Firebase dari token yang didapat
      const credential = GoogleAuthProvider.credential(
        result.credential?.idToken
      );

      // Sign in ke Firebase Auth
      await signInWithCredential(auth, credential);
    } catch (err) {
      if (err.message?.includes('cancelled') || err.message?.includes('cancel')) {
        // User cancel — abaikan
        return;
      }
      throw err;
    }
  };

  const handleAuthError = (err) => {
    const messages = {
      'auth/account-exists-with-different-credential': 'Akun sudah terdaftar dengan metode lain.',
      'auth/network-request-failed': 'Koneksi bermasalah. Periksa internet kamu.',
      'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu sebentar.',
      'auth/user-disabled': 'Akun ini dinonaktifkan.',
      'auth/unauthorized-domain': 'Domain tidak diizinkan di Firebase Console.',
      'auth/cancelled-popup-request': null,
      'auth/popup-closed-by-user': null,
    };

    const msg = messages[err.code];
    if (msg === null) return;
    console.error('Auth error:', err.code, err.message);
    setAuthError(msg || `Login gagal (${err.code}).`);
  };

  const logout = async () => {
    try {
      if (isNative()) {
        const { FirebaseAuthentication } = await import(
          '@capawesome-team/capacitor-firebase-authentication'
        );
        await FirebaseAuthentication.signOut();
      }
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{
      user,
      authLoading,
      authError,
      loginWithGoogle,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
