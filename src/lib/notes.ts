export interface Note {
  id: string;
  content: string;
  interim?: string;
  createdAt: number; // Unix ms
  expiresAt: number; // Unix ms (createdAt + 24h)
}

const STORAGE_KEY = "notably_notes";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DAILY_LIMIT = 10;

function now() {
  return Date.now();
}

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Returns all non-expired notes from localStorage
export function getNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const notes: Note[] = JSON.parse(raw);
    const live = notes.filter((n) => n.expiresAt > now());
    // If any expired, persist the cleaned list
    if (live.length !== notes.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(live));
    }
    return live.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

// Returns how many notes were created today (regardless of expiry)
export function getTodayCount(): number {
  const today = todayKey();
  return getNotes().filter((n) => {
    const date = new Date(n.createdAt).toISOString().slice(0, 10);
    return date === today;
  }).length;
}

export function canCreateNote(): boolean {
  return getTodayCount() < DAILY_LIMIT;
}

export function createNote(content: string): Note | null {
  if (!canCreateNote()) return null;
  const ts = now();
  const note: Note = {
    id: crypto.randomUUID(),
    content,
    createdAt: ts,
    expiresAt: ts + TTL_MS,
  };
  const existing = getNotes();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([note, ...existing]));
  return note;
}

export function updateNote(id: string, content: string): boolean {
  const notes = getNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  notes[idx] = { ...notes[idx], content };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  return true;
}

export function deleteNote(id: string): boolean {
  const notes = getNotes();
  const filtered = notes.filter((n) => n.id !== id);
  if (filtered.length === notes.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function msUntilExpiry(note: Note): number {
  return Math.max(0, note.expiresAt - now());
}

export function formatExpiry(note: Note): string {
  const ms = msUntilExpiry(note);
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (h >= 1) return `expires in ${h}h ${m}m`;
  return `expires in ${m}m`;
}

export function formatTime(ts: number): string {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ts));
}
