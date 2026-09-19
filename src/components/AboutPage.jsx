import { X, ExternalLink, Heart, Code2, Shield, Zap } from 'lucide-react';

const STACK = [
  { label: 'React 19 + Vite', desc: 'UI framework & build tool' },
  { label: 'Capacitor 8', desc: 'Native Android & iOS wrapper' },
  { label: 'Firebase', desc: 'Auth, Firestore database' },
  { label: 'Anthropic Claude', desc: 'AI engine via custom API' },
  { label: 'cobalt.tools', desc: 'Media downloader engine' },
];

const FEATURES = [
  { icon: <Zap size={16} />, label: 'Chat AI', desc: 'Powered by Claude, bisa jawab hampir semua pertanyaan' },
  { icon: <Shield size={16} />, label: 'Data Aman', desc: 'Riwayat chat tersimpan di akun Google-mu, terenkripsi Firebase' },
  { icon: <Code2 size={16} />, label: 'Open Stack', desc: 'Dibangun di atas teknologi web standar yang terbuka' },
];

export default function AboutPage({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999, padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="about-card">
        {/* Header */}
        <div className="about-header">
          <div className="about-logo-wrap">
            <div className="empty-logo" style={{ width: 48, height: 48, fontSize: 22 }}>Z</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Zoya AI</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Versi 1.0.0</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="about-body">
          {/* Developer */}
          <section className="about-section">
            <div className="about-section-label">Pengembang</div>
            <div className="about-dev-card">
              <div className="about-dev-avatar">D</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Devin</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Independent Developer
                </div>
              </div>
              <a
                href="https://github.com/BunglonMewing"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link-btn"
                title="GitHub"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          </section>

          {/* Deskripsi */}
          <section className="about-section">
            <div className="about-section-label">Tentang</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Zoya AI adalah asisten AI personal berbasis Claude yang dilengkapi fitur downloader media dari YouTube, TikTok, Instagram, dan platform lainnya. Dibangun sebagai aplikasi mobile-first menggunakan React + Capacitor.
            </p>
          </section>

          {/* Fitur */}
          <section className="about-section">
            <div className="about-section-label">Fitur Utama</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEATURES.map((f, i) => (
                <div key={i} className="about-feature-item">
                  <div className="about-feature-icon">{f.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Stack */}
          <section className="about-section">
            <div className="about-section-label">Teknologi</div>
            <div className="about-stack-grid">
              {STACK.map((s, i) => (
                <div key={i} className="about-stack-item">
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Lisensi */}
          <section className="about-section">
            <div className="about-section-label">Lisensi</div>
            <div className="about-license-box">
              <div style={{ fontSize: 13, fontWeight: 600 }}>MIT License</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>
                Copyright &copy; 2025 Devin (BunglonMewing). Bebas digunakan, dimodifikasi, dan didistribusikan dengan mencantumkan atribusi.
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="about-credit">
            <Heart size={12} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            Dibuat dengan penuh semangat di Indonesia
          </div>
        </div>
      </div>
    </div>
  );
}
