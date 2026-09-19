import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

// Tangkap error global — tampilkan di layar biar ketahuan
window.onerror = (msg, src, line, col, err) => {
  document.body.style.cssText = 'background:#111;color:#f88;padding:20px;font-family:monospace;font-size:13px;white-space:pre-wrap;overflow:auto';
  document.body.innerHTML = '<b>ERROR:</b>\n' + msg + '\n\n' + (src || '') + ':' + line + '\n\n' + (err?.stack || '');
};

window.onunhandledrejection = (e) => {
  document.body.style.cssText = 'background:#111;color:#f88;padding:20px;font-family:monospace;font-size:13px;white-space:pre-wrap;overflow:auto';
  document.body.innerHTML = '<b>UNHANDLED PROMISE REJECTION:</b>\n' + (e.reason?.stack || e.reason || e);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
