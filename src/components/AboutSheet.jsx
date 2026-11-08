import { ExternalLink, Heart } from 'lucide-react';
import { Sheet } from './Sheet.jsx';
import ZoyaMark from './ZoyaMark.jsx';

const STACK = [
  ['Material 3', 'color roles, type scale, shape, motion'],
  ['React 19 + Vite', 'antarmuka dan build'],
  ['Capacitor 8', 'pembungkus Android'],
  ['Firebase', 'login Google dan Firestore'],
  ['Claude', 'mesin chat lewat API Zoya'],
];

export default function AboutSheet({ onClose }) {
  return (
    <Sheet open onClose={onClose} title="Tentang Zoya">
      <div className="about">
        <div className="about__head">
          <ZoyaMark size={56} />
          <div>
            <div className="about__name">Zoya</div>
            <div className="about__version">Versi 2.0.0 · open source</div>
          </div>
          <div className="spacer" />
          <a
            className="icon-button"
            href="https://github.com/BunglonMewing"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub pengembang"
            title="GitHub"
          >
            <ExternalLink size={18} />
          </a>
        </div>

        <section className="about__section">
          <div className="about__label">Apa ini</div>
          <p className="about__text">
            Zoya menggabungkan dua hal: asisten AI untuk bertanya dan mengobrol, serta pengunduh media
            untuk mengambil video, audio, atau gambar dari tautan. Antrean unduhan, riwayat, dan memori
            AI semuanya ada di satu aplikasi.
          </p>
        </section>

        <section className="about__section">
          <div className="about__label">Yang bisa dilakukan</div>
          <div className="about__list">
            <div className="about__item"><strong>Unduh</strong><span>pilih format dan kualitas, jeda, lanjutkan, ulangi</span></div>
            <div className="about__item"><strong>Batch</strong><span>tempel banyak tautan sekaligus</span></div>
            <div className="about__item"><strong>Riwayat</strong><span>cari, unduh ulang, atau hapus dengan undo</span></div>
            <div className="about__item"><strong>Chat</strong><span>memori AI dan sinkronisasi saat masuk</span></div>
          </div>
        </section>

        <section className="about__section">
          <div className="about__label">Dibangun dengan</div>
          <div className="about__list">
            {STACK.map(([name, description]) => (
              <div key={name} className="about__item"><strong>{name}</strong><span>{description}</span></div>
            ))}
          </div>
        </section>

        <section className="about__section">
          <div className="about__label">Lisensi</div>
          <div className="about__license">
            MIT License · Copyright © 2025 Devin (BunglonMewing). Bebas dipakai, diubah, dan
            didistribusikan dengan atribusi.
          </div>
        </section>

        <div className="about__credit">
          <Heart size={12} style={{ color: 'var(--m3-error)' }} />
          Dibuat di Indonesia
        </div>
      </div>
    </Sheet>
  );
}
