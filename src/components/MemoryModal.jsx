import { useState } from 'react';
import { Brain, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../hooks/useStore.js';
import { addMemory, deleteMemory } from '../store.js';
import { toast } from '../hooks/useToast.js';
import { Sheet } from './Sheet.jsx';

export default function MemoryModal({ onClose }) {
  const { memories } = useStore();
  const [value, setValue] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    addMemory(text);
    setValue('');
    toast.success('Memori ditambahkan.');
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Memori AI"
      description={`${memories.length} hal diingat Zoya saat menjawab.`}
    >
      {memories.length === 0 ? (
        <div className="memory-empty">
          <Brain size={28} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          Belum ada memori. Tambahkan nama, pekerjaan, atau preferensi supaya jawaban Zoya lebih relevan.
        </div>
      ) : (
        <div className="memory-list">
          {memories.map(memory => (
            <div key={memory.id} className="memory-item">
              <span>{memory.text}</span>
              <button
                className="icon-button"
                onClick={() => deleteMemory(memory.id)}
                aria-label={`Hapus memori: ${memory.text}`}
                title="Hapus"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="memory-add" onSubmit={submit}>
        <label className="sr-only" htmlFor="memory-input">Memori baru</label>
        <input
          id="memory-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Contoh: aku suka jawaban singkat"
        />
        <button className="icon-button icon-button--filled" type="submit" disabled={!value.trim()} aria-label="Tambah memori">
          <Plus size={20} />
        </button>
      </form>
    </Sheet>
  );
}
