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
  const [user, setUser] = useState(undefined); // undefined = masih loading
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const isNative = Capacitor.isNativePlatform(); // true kalau Android/iOS

  useEffect(() => {
    // Subscribe perubahan state login
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u || null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Tangkap hasil redirect login (khusus web, bukan native)
    if (!isNative) {
      getRedirectResult(auth)
        .then(result => {
          if (result?.user) setUser(result.user);
        })
        .catch(err => {
          if (err.code !== 'auth/no-auth-event') {
            setAuthError('Login gagal setelah redirect. Coba lagi.');
          }
        });
    }
  }, [isNative]);

  const loginWithGoogle = async () => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isNative) {
        // Android / iOS — pakai plugin native Google Auth
        await loginNative();
      } else {
        // Web — coba popup dulu, fallback ke redirect
        await loginWeb();
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── Web login ──────────────────────────────────────────────────────────────
  const loginWeb = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // Popup diblokir browser — fallback ke redirect
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-closed-by-user'
      ) {
        await signInWithRedirect(auth, googleProvider);
        // Halaman akan reload, hasil ditangkap di useEffect getRedirectResult
      } else {
        throw err;
      }
    }
  };

  // ─── Native login (Android/iOS via Capacitor) ───────────────────────────────
  const loginNative = async () => {
  await signInWithRedirect(auth, googleProvider);
};

      await signInWithCredential(auth, credential);
    } catch (err) {
      // Kalau plugin belum diinstall, fallback ke redirect
      if (err.message?.includes('GoogleAuth') || err.code === 'UNIMPLEMENTED') {
        console.warn('Plugin native tidak tersedia, fallback ke redirect.');
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw err;
      }
    }
  };

  // ─── Error handler ──────────────────────────────────────────────────────────
  const handleAuthError = (err) => {
    const messages = {
      'auth/account-exists-with-different-credential': 'Akun sudah terdaftar dengan metode login lain.',
      'auth/network-request-failed': 'Koneksi bermasalah. Periksa internet kamu.',
      'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu sebentar.',
      'auth/user-disabled': 'Akun ini dinonaktifkan.',
      'auth/cancelled-popup-request': null, // Abaikan
      'auth/popup-closed-by-user': null,    // Abaikan
    };

    const msg = messages[err.code];
    if (msg === null) return; // Error yang bisa diabaikan
    setAuthError(msg || 'Login gagal. Coba lagi.');
    console.error('Auth error:', err.code, err.message);
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
      isNative,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
