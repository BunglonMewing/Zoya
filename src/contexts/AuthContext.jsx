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
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) {
          setUser(result.user);
          setAuthError(null);
        }
      })
      .catch(err => {
        if (err.code !== 'auth/no-auth-event') {
          console.warn('getRedirectResult:', err.code);
        }
      });
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      // Selalu pakai redirect — lebih kompatibel dengan WebView
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      // Kalau redirect tidak support, fallback ke popup
      if (err.code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (popupErr) {
          handleAuthError(popupErr);
        }
      } else {
        handleAuthError(err);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthError = (err) => {
    const messages = {
      'auth/account-exists-with-different-credential': 'Akun sudah terdaftar dengan metode lain.',
      'auth/network-request-failed': 'Koneksi bermasalah. Periksa internet kamu.',
      'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu sebentar.',
      'auth/user-disabled': 'Akun ini dinonaktifkan.',
      'auth/unauthorized-domain': 'Domain belum diizinkan. Hubungi pengembang.',
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
