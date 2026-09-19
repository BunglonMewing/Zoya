import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase.js';

const AuthContext = createContext(null);

// Deteksi apakah berjalan di dalam WebView Capacitor / Android
const isCapacitor = () =>
  typeof window !== 'undefined' &&
  (window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    window.location.hostname === 'localhost' && navigator.userAgent.includes('wv'));

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

  useEffect(() => {
    // Tangkap hasil redirect login
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) {
          setUser(result.user);
          setAuthError(null);
        }
      })
      .catch(err => {
        if (
          err.code !== 'auth/no-auth-event' &&
          err.code !== 'auth/null-user'
        ) {
          console.error('Redirect result error:', err.code);
        }
      });
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isCapacitor()) {
        // Di Android WebView — langsung pakai redirect
        await signInWithRedirect(auth, googleProvider);
        // Halaman akan reload, hasil ditangkap di useEffect atas
      } else {
        // Di browser biasa — coba popup dulu
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (err) {
          if (
            err.code === 'auth/popup-blocked' ||
            err.code === 'auth/popup-closed-by-user' ||
            err.code === 'auth/cancelled-popup-request'
          ) {
            await signInWithRedirect(auth, googleProvider);
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthError = (err) => {
    const messages = {
      'auth/account-exists-with-different-credential': 'Akun sudah terdaftar dengan metode login lain.',
      'auth/network-request-failed': 'Koneksi bermasalah. Periksa internet kamu.',
      'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu sebentar.',
      'auth/user-disabled': 'Akun ini dinonaktifkan.',
      'auth/unauthorized-domain': 'Domain tidak diizinkan. Hubungi pengembang.',
      'auth/cancelled-popup-request': null,
      'auth/popup-closed-by-user': null,
    };

    const msg = messages[err.code];
    if (msg === null) return;
    console.error('Auth error:', err.code, err.message);
    setAuthError(msg || `Login gagal (${err.code}). Coba lagi.`);
  };

  const logout = async () => {
    try {
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
