import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';

// Test import AuthContext
let AuthProvider, useAuth;
let importError = null;

try {
  const mod = await import('./contexts/AuthContext.jsx');
  AuthProvider = mod.AuthProvider;
  useAuth = mod.useAuth;
} catch (err) {
  importError = err.message + '\n' + err.stack;
}

function TestApp() {
  if (importError) {
    return (
      <div style={{ background:'#111', color:'#f88', padding:20, fontFamily:'monospace', fontSize:12, whiteSpace:'pre-wrap', minHeight:'100vh' }}>
        <b>ERROR IMPORT AuthContext:</b>{'\n\n'}{importError}
      </div>
    );
  }

  const { user, loginWithGoogle, authError } = useAuth();

  return (
    <div style={{ background:'#111', color:'#fff', padding:20, fontFamily:'monospace', fontSize:13, minHeight:'100vh' }}>
      <div style={{ color:'#8f8', marginBottom:12 }}>AuthContext OK!</div>
      <div>user: {user === undefined ? 'loading...' : user === null ? 'belum login' : user.email}</div>
      {authError && <div style={{ color:'#f88', marginTop:8 }}>authError: {authError}</div>}
      <button
        onClick={loginWithGoogle}
        style={{ marginTop:16, padding:'10px 20px', background:'#8ab4f8', color:'#111', border:'none', borderRadius:8, fontSize:14 }}
      >
        Test Login Google
      </button>
    </div>
  );
}

function Root() {
  if (importError || !AuthProvider) return <TestApp />;
  return <AuthProvider><TestApp /></AuthProvider>;
}

createRoot(document.getElementById('root')).render(<Root />);
