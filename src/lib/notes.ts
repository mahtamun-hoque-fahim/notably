// Notably — local note storage + daily quota tracking.
// MVP: pure client-side. Future: sync to Neon when auth lands.

export type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: number;   // epoch ms
  durationMs: number;  // recording duration
  lang: string;        // e.g. "en-US"
  summary?: string | null; // AI summary (Pro, server-only)
  tags?: string[];     // AI tags (Pro, server-only)
};

const NOTES_KEY = "notably.notes.v1";
const QUOTA_KEY = "notably.quota.v1";

export const DAILY_FREE_LIMIT = 5;
export const MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutes per note (free tier)

// ───────── Notes CRUD ─────────

export function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Note[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function saveNote(note: Note): Note[] {
  const all = loadNotes();
  const next = [note, ...all.filter((n) => n.id !== note.id)];
  localStorage.setItem(NOTES_KEY, JSON.stringify(next));
  return next;
}

export function updateNote(id: string, patch: Partial<Note>): Note[] {
  const all = loadNotes();
  const next = all.map((n) => (n.id === id ? { ...n, ...patch } : n));
  localStorage.setItem(NOTES_KEY, JSON.stringify(next));
  return next;
}

export function deleteNote(id: string): Note[] {
  const all = loadNotes();
  const next = all.filter((n) => n.id !== id);
  localStorage.setItem(NOTES_KEY, JSON.stringify(next));
  return next;
}

// Wipe local notes — called after migrating them into a signed-in account.
export function clearNotes(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(NOTES_KEY);
}

// ───────── Quota ─────────

type Quota = { date: string; count: number };

// "YYYY-MM-DD" in the user's local timezone — quota resets at local midnight.
export function localDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getQuota(): Quota {
  if (typeof window === "undefined") return { date: localDateString(), count: 0 };
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return { date: localDateString(), count: 0 };
    const q = JSON.parse(raw) as Quota;
    if (q.date !== localDateString()) return { date: localDateString(), count: 0 };
    return q;
  } catch {
    return { date: localDateString(), count: 0 };
  }
}

export function bumpQuota(): Quota {
  const q = getQuota();
  const next: Quota = { date: q.date, count: q.count + 1 };
  localStorage.setItem(QUOTA_KEY, JSON.stringify(next));
  return next;
}

export function quotaRemaining(): number {
  return Math.max(0, DAILY_FREE_LIMIT - getQuota().count);
}

// ───────── Utilities ─────────

export function newId(): string {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Generate a title from the first line / first words of the body.
export function autoTitle(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "Untitled note";
  // First sentence up to 60 chars
  const firstSentence = trimmed.split(/[.!?\n]/)[0].trim();
  if (firstSentence.length <= 60) return firstSentence || "Untitled note";
  // Otherwise truncate on a word boundary
  const slice = firstSentence.slice(0, 60);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 30 ? slice.slice(0, lastSpace) : slice) + "…";
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function formatRelative(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;

  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
