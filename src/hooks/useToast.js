import { useEffect, useState } from 'react';

// Snackbars live outside React state so any module can raise one.
let seq = 0;
let items = [];
const listeners = new Set();

const emit = () => listeners.forEach(l => l(items));

export function dismiss(id) {
  items = items.filter(item => item.id !== id);
  emit();
}

function push(message, options = {}) {
  const id = ++seq;
  const item = {
    id,
    message,
    type: options.type || 'info',
    actionLabel: options.actionLabel || null,
    onAction: options.onAction || null,
    duration: options.duration ?? (options.type === 'error' ? 6000 : 4000),
  };
  items = [...items.slice(-2), item];
  emit();
  setTimeout(() => dismiss(id), item.duration);
  return id;
}

export const toast = {
  show: (message, options) => push(message, options),
  info: (message, options) => push(message, { ...options, type: 'info' }),
  success: (message, options) => push(message, { ...options, type: 'success' }),
  error: (message, options) => push(message, { ...options, type: 'error' }),
  dismiss,
};

export function useToasts() {
  const [list, setList] = useState(items);
  useEffect(() => {
    listeners.add(setList);
    return () => { listeners.delete(setList); };
  }, []);
  return list;
}
