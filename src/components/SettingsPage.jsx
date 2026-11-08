import { useState } from 'react';
import {
  Brain, ChevronRight, Download, HardDrive, Info, LogOut, Monitor, Moon, Sun, Trash2, UserRound,
} from 'lucide-react';
import { downloads } from '../downloads.js';
import { useDownloads } from '../hooks/useDownloads.js';
import { toast } from '../hooks/useToast.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useStore } from '../hooks/useStore.js';
import { clearChats, setTheme } from '../store.js';
import { Dialog } from './Sheet.jsx';

const THEMES = [
  { id: 'system', label: 'Sistem', icon: Monitor },
  { id: 'light', label: 'Terang', icon: Sun },
  { id: 'dark', label: 'Gelap', icon: Moon },
];

const QUALITIES = [
  { id: '480', label: 'Hemat' },
  { id: '720', label: 'Standar' },
  { id: '1080', label: 'Tinggi' },
  { id: 'best', label: 'Terbaik' },
];

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function SettingsPage({ onMemoryOpen, onAboutOpen }) {
  const { settings } = useDownloads();
  const { user, loginWithGoogle, logout, authLoading, authError } = useAuth();
  const { theme, chats } = useStore();
  const [confirm, setConfirm] = useState(null);

  const runConfirm = () => {
    if (confirm === 'chats') {
      clearChats();
      toast.success('Semua percakapan dihapus.');
    }
    if (confirm === 'history') {
      downloads.clearHistory();
      toast.success('Riwayat unduhan dihapus.');
    }
    setConfirm(null);
  };

  return (
    <div className="page page--settings">
      <div className="page__scroll">
        <div className="page__inner">
          <div className="settings">
            <section className="settings-group" aria-label="Akun">
              <div className="settings-group__label">Akun</div>

              {user ? (
                <>
                  <div className="account-card">
                    {user.photoURL
                      ? <img className="account-card__avatar" src={user.photoURL} alt="" />
                      : <div className="account-card__avatar">{(user.displayName || 'Z').slice(0, 1)}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="account-card__name">{user.displayName || 'Pengguna'}</div>
                      <div className="account-card__email">{user.email}</div>
                    </div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-row__icon"><LogOut size={18} /></div>
                    <div className="setting-row__text">
                      <div className="setting-row__title">Keluar dari akun</div>
                      <div className="setting-row__sub">Chat tetap ada di perangkat ini.</div>
                    </div>
                    <button className="button button--outlined button--sm" onClick={logout}>Keluar</button>
                  </div>
                </>
              ) : (
                <div className="account-card">
                  <div className="account-card__avatar"><UserRound size={22} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="account-card__name">Belum masuk</div>
                    <div className="setting-row__sub">Sinkronkan chat dan memori ke semua perangkat.</div>
                  </div>
                  <button className="google-button" onClick={loginWithGoogle} disabled={authLoading}>
                    <GoogleGlyph />
                    {authLoading ? 'Memuat…' : 'Masuk'}
                  </button>
                </div>
              )}

              {authError && <div className="setting-block"><div className="notice notice--error">{authError}</div></div>}
            </section>

            <section className="settings-group" aria-label="Tampilan">
              <div className="settings-group__label">Tampilan</div>
              <div className="setting-block">
                <div className="setting-block__head">
                  <div className="setting-row__title">Tema</div>
                </div>
                <div className="segmented" role="group" aria-label="Tema aplikasi">
                  {THEMES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      className={`segmented__item ${theme === id ? 'is-selected' : ''}`.trim()}
                      onClick={() => setTheme(id)}
                      aria-pressed={theme === id}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="settings-group" aria-label="Setelan unduhan">
              <div className="settings-group__label">Unduhan</div>

              <div className="setting-block">
                <div className="setting-block__head">
                  <div className="setting-row__title">Kualitas default</div>
                </div>
                <div className="segmented" role="group" aria-label="Kualitas unduhan default">
                  {QUALITIES.map(({ id, label }) => (
                    <button
                      key={id}
                      className={`segmented__item ${settings.quality === id ? 'is-selected' : ''}`.trim()}
                      onClick={() => downloads.updateSettings({ quality: id })}
                      aria-pressed={settings.quality === id}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="setting-block__hint">
                  Dipakai saat Zoya memilih format otomatis, misalnya pada mode beberapa tautan.
                </div>
              </div>

              <div className="setting-block">
                <div className="setting-block__head">
                  <div className="setting-row__title">Unduhan bersamaan</div>
                  <span className="setting-block__value">{settings.concurrency} file</span>
                </div>
                <input
                  className="slider"
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={settings.concurrency}
                  onChange={(event) => downloads.updateSettings({ concurrency: Number(event.target.value) })}
                  aria-label="Jumlah unduhan bersamaan"
                />
                <div className="setting-block__hint">
                  Lebih banyak file sekaligus memakai lebih banyak data dan baterai.
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-row__icon"><HardDrive size={18} /></div>
                <div className="setting-row__text">
                  <div className="setting-row__title">Simpan riwayat</div>
                  <div className="setting-row__sub">Catat unduhan selesai dan gagal di perangkat.</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.saveHistory}
                    onChange={(event) => downloads.updateSettings({ saveHistory: event.target.checked })}
                    aria-label="Simpan riwayat unduhan"
                  />
                  <span className="switch__track" />
                  <span className="switch__thumb" />
                </label>
              </div>
            </section>

            <section className="settings-group" aria-label="Zoya">
              <div className="settings-group__label">Zoya</div>
              <button className="setting-row setting-row--button" onClick={onMemoryOpen}>
                <div className="setting-row__icon"><Brain size={18} /></div>
                <div className="setting-row__text">
                  <div className="setting-row__title">Memori AI</div>
                  <div className="setting-row__sub">Hal yang Zoya ingat tentangmu.</div>
                </div>
                <ChevronRight size={18} className="setting-row__chevron" />
              </button>
              <button className="setting-row setting-row--button" onClick={onAboutOpen}>
                <div className="setting-row__icon"><Info size={18} /></div>
                <div className="setting-row__text">
                  <div className="setting-row__title">Tentang Zoya</div>
                  <div className="setting-row__sub">Versi, teknologi, dan lisensi.</div>
                </div>
                <ChevronRight size={18} className="setting-row__chevron" />
              </button>
            </section>

            <section className="settings-group" aria-label="Data">
              <div className="settings-group__label">Data</div>
              <button className="setting-row setting-row--button" onClick={() => setConfirm('chats')}>
                <div className="setting-row__icon"><Trash2 size={18} /></div>
                <div className="setting-row__text">
                  <div className="setting-row__title">Hapus semua percakapan</div>
                  <div className="setting-row__sub">{chats.length} percakapan tersimpan.</div>
                </div>
              </button>
              <button className="setting-row setting-row--button" onClick={() => setConfirm('history')}>
                <div className="setting-row__icon"><Download size={18} /></div>
                <div className="setting-row__text">
                  <div className="setting-row__title">Hapus riwayat unduhan</div>
                  <div className="setting-row__sub">File yang sudah terunduh tetap ada.</div>
                </div>
              </button>
            </section>

            <p className="version-line">
              Zoya 2.0 · Material 3 · dibuat dengan React dan Capacitor
            </p>
          </div>
        </div>
      </div>

      <Dialog
        open={Boolean(confirm)}
        title={confirm === 'chats' ? 'Hapus semua percakapan?' : 'Hapus riwayat unduhan?'}
        actions={{
          onClose: () => setConfirm(null),
          buttons: (
            <>
              <button className="button button--text" onClick={() => setConfirm(null)}>Batal</button>
              <button className="button button--danger" onClick={runConfirm}>Hapus</button>
            </>
          ),
        }}
      >
        {confirm === 'chats'
          ? 'Semua percakapan dan pesan di akun ini akan dihapus, termasuk yang tersinkron ke Firebase.'
          : 'Catatan unduhan akan dihapus. File yang sudah tersimpan di folder Downloads tidak terpengaruh.'}
      </Dialog>
    </div>
  );
}
