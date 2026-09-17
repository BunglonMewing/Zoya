import { useState } from 'react';
import { X, Brain, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../hooks/useStore.js';
import { addMemory, deleteMemory } from '../store.js';

export default function MemoryModal({ onClose }) {
  const { memories } = useStore();
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    addMemory(text);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      z: 999, zIndex: 999, padding: 16,
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '100%', maxWidth: 480,
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Brain size={18} color="var(--accent)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Memori AI</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {memories.length} item tersimpan
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Memory list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {memories.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 0',
              color: 'var(--text-muted)', fontSize: 13,
            }}>
              <Brain size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>Belum ada memori</div>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                Tambah informasi yang ingin diingat AI
              </div>
            </div>
          ) : (
            <div className="memory-list">
              {memories.map(m => (
                <div key={m.id} className="memory-item">
                  <span style={{ flex: 1 }}>{m.text}</span>
                  <button className="memory-del icon-btn" onClick={() => deleteMemory(m.id)} title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add memory */}
        <div style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex', gap: 8,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Contoh: Nama saya Budi, saya suka teknologi..."
            style={{
              flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '8px 12px',
              color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            style={{
              padding: '8px 14px', background: 'var(--accent)', color: '#fff',
              borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 4,
              opacity: input.trim() ? 1 : 0.5, cursor: input.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Plus size={14} />
            Tambah
          </button>
        </div>
      </div>
    </div>
  );
}
