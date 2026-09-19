import { useState, useEffect } from 'react';

export default function App() {
  const [status, setStatus] = useState('Memuat Firebase...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const test = async () => {
      try {
        setStatus('Import firebase/app...');
        const { initializeApp } = await import('firebase/app');
        setStatus('Import firebase/auth...');
        const { getAuth } = await import('firebase/auth');
        setStatus('Import firebase/firestore...');
        const { getFirestore } = await import('firebase/firestore');

        setStatus('Init Firebase...');
        const config = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };

        setStatus('Config: ' + JSON.stringify(config, null, 2));

        const app = initializeApp(config);
        setStatus('Firebase OK! App name: ' + app.name);
      } catch (err) {
        setError(err.message + '\n\n' + err.stack);
      }
    };
    test();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111',
      color: '#fff',
      padding: 20,
      fontFamily: 'monospace',
      fontSize: 12,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
    }}>
      {error ? (
        <>
          <div style={{ color: '#f88', fontWeight: 'bold', marginBottom: 12 }}>ERROR:</div>
          <div style={{ color: '#f88' }}>{error}</div>
        </>
      ) : (
        <>
          <div style={{ color: '#8f8', fontWeight: 'bold', marginBottom: 12 }}>STATUS:</div>
          <div style={{ color: '#8ab4f8' }}>{status}</div>
        </>
      )}
    </div>
  );
}
