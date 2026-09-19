import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginBanner() {
  const { loginWithGoogle, authLoading } = useAuth();

  return (
    <div className="login-banner">
      <div className="login-banner-text">
        <span className="login-banner-title">Masuk untuk sinkronisasi chat</span>
        <span className="login-banner-sub">Riwayat & memori tersimpan permanen di semua perangkat</span>
      </div>
      <button
        className="login-banner-btn"
        onClick={loginWithGoogle}
        disabled={authLoading}
      >
        {authLoading ? '...' : 'Masuk'}
      </button>
    </div>
  );
}
