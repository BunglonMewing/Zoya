import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { auth, googleProvider } from '../lib/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (isNative) return;

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) setUser(result.user);
      })
      .catch((err) => {
        if (err?.code !== 'auth/no-auth-event') {
          setAuthError('Login gagal setelah redirect. Coba lagi.');
        }
      });
  }, [isNative]);

  const loginWithGoogle = async () => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isNative) {
        await loginNative();
      } else {
        await loginWeb();
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const loginWeb = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/popup-closed-by-user'
      ) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw err;
      }
    }
  };

  const loginNative = async () => {
    await signInWithRedirect(auth, googleProvider);
  };

  const handleAuthError = (err) => {
    const messages = {
      'auth/account-exists-with-different-credential': 'Akun sudah terdaftar dengan metode login lain.',
      'auth/network-request-failed': 'Koneksi bermasalah. Periksa internet kamu.',
      'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu sebentar.',
      'auth/user-disabled': 'Akun ini dinonaktifkan.',
      'auth/cancelled-popup-request': null,
      'auth/popup-closed-by-user': null,
    };

    const msg = messages[err?.code];
    if (msg === null) return;

    setAuthError(msg || 'Login gagal. Coba lagi.');
    console.error('Auth error:', err?.code, err?.message);
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
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        authError,
        loginWithGoogle,
        logout,
        clearError,
        isNative,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
