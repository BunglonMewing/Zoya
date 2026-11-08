import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Material 3 modal bottom sheet.
export function Sheet({ open, onClose, title, description, children, footer, className = '' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => { if (event.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="sheet-host">
      <div className="sheet-scrim" onClick={onClose} />
      <div className={`sheet ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__handle" aria-hidden="true" />
        <header className="sheet__header">
          <div className="sheet__heading">
            <h2 className="sheet__title type-title-medium">{title}</h2>
            {description && <p className="sheet__description type-body-small">{description}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </header>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

// Material 3 alert dialog for destructive confirmations.
export function Dialog({ open, title, children, actions }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => { if (event.key === 'Escape') actions?.onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, actions]);

  if (!open) return null;

  return createPortal(
    <div className="dialog-host">
      <div className="dialog-scrim" onClick={actions?.onClose} />
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <h2 className="dialog__title type-headline-small">{title}</h2>
        <div className="dialog__body type-body-medium">{children}</div>
        <div className="dialog__actions">{actions?.buttons}</div>
      </div>
    </div>,
    document.body
  );
}
