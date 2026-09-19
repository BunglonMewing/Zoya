import {
  doc, collection, getDocs, setDoc, deleteDoc,
  onSnapshot, serverTimestamp, writeBatch, query, orderBy, limit,
} from 'firebase/firestore';
import { db } from './firebase.js';

// ─── Chats ────────────────────────────────────────────────────────────────────

export function subscribeChats(uid, callback) {
  const ref = collection(db, 'users', uid, 'chats');
  const q = query(ref, orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const chats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(chats);
  });
}

export async function saveChat(uid, chat) {
  const ref = doc(db, 'users', uid, 'chats', chat.id);
  await setDoc(ref, {
    title: chat.title,
    messages: chat.messages,
    createdAt: chat.createdAt || Date.now(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteChat(uid, chatId) {
  await deleteDoc(doc(db, 'users', uid, 'chats', chatId));
}

// ─── Memories ────────────────────────────────────────────────────────────────

export function subscribeMemories(uid, callback) {
  const ref = collection(db, 'users', uid, 'memories');
  const q = query(ref, orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const memories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(memories);
  });
}

export async function saveMemory(uid, memory) {
  const ref = doc(db, 'users', uid, 'memories', memory.id);
  await setDoc(ref, {
    text: memory.text,
    createdAt: memory.createdAt || Date.now(),
  });
}

export async function deleteMemory(uid, memoryId) {
  await deleteDoc(doc(db, 'users', uid, 'memories', memoryId));
}

// ─── Auto-memory dari AI response ────────────────────────────────────────────
// Ekstrak fakta penting dari pesan user untuk dijadikan memori otomatis

export function extractAutoMemory(userMessage) {
  const triggers = [
    // Nama
    { regex: /nama (saya|aku|gue|gw) (adalah |adalah|ialah )?([A-Z][a-z]+)/i, format: m => `Nama pengguna: ${m[3]}` },
    // Pekerjaan
    { regex: /saya (seorang |adalah seorang )?([a-zA-Z ]+) (di|pada|untuk|sebagai)/i, format: m => `Pekerjaan: ${m[2].trim()}` },
    // Umur
    { regex: /saya (berumur |berusia |umur )?(\d{1,2}) tahun/i, format: m => `Umur: ${m[2]} tahun` },
    // Lokasi
    { regex: /saya (tinggal|berada|ada|domisili) di ([A-Za-z ]+)/i, format: m => `Lokasi: ${m[2].trim()}` },
    // Hobi
    { regex: /hobi saya (adalah |ialah )?([a-zA-Z ,]+)/i, format: m => `Hobi: ${m[2].trim()}` },
    // Bahasa
    { regex: /saya (bisa|belajar|sedang belajar) (bahasa )?([A-Za-z]+)/i, format: m => `Bisa bahasa: ${m[3]}` },
  ];

  const results = [];
  for (const t of triggers) {
    const m = userMessage.match(t.regex);
    if (m) results.push(t.format(m));
  }
  return results;
}
