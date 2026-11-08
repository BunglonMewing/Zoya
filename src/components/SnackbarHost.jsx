import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { dismiss } from '../hooks/useToast.js';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export default function SnackbarHost({ toasts }) {
  return (
    <div className="snackbar-host" aria-live="polite" aria-atomic="false">
      {toasts.map(t => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div key={t.id} className={`snackbar snackbar--${t.type}`}>
            <Icon size={18} className="snackbar__icon" />
            <span className="snackbar__message type-body-medium">{t.message}</span>
            {t.actionLabel && (
              <button
                className="snackbar__action type-label-large"
                onClick={() => { t.onAction?.(); dismiss(t.id); }}
              >
                {t.actionLabel}
              </button>
            )}
            <button className="snackbar__close" onClick={() => dismiss(t.id)} aria-label="Tutup notifikasi">
              <XCircle size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
