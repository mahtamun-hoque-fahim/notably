"use client";

import { useCallback, useEffect, useState } from "react";

export interface DemoNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
}

interface DemoSession {
  startedAt: number;
  notes: DemoNote[];
}

const KEY = "notably_demo";
const LIMIT = 10;
const EXPIRY_MS = 24 * 60 * 60 * 1000;

function loadSession(): DemoSession {
  if (typeof window === "undefined") return { startedAt: Date.now(), notes: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { startedAt: Date.now(), notes: [] };
    const s: DemoSession = JSON.parse(raw);
    if (Date.now() - s.startedAt > EXPIRY_MS) {
      localStorage.removeItem(KEY);
      return { startedAt: Date.now(), notes: [] };
    }
    return s;
  } catch {
    return { startedAt: Date.now(), notes: [] };
  }
}

function saveSession(s: DemoSession) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function useDemoNotes() {
  const [session, setSession] = useState<DemoSession>({ startedAt: Date.now(), notes: [] });
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = loadSession();
    setSession(s);
    if (s.notes.length > 0) setActiveNoteId(s.notes[0].id);
    setHydrated(true);
  }, []);

  const persist = useCallback((updated: DemoSession) => {
    setSession(updated);
    saveSession(updated);
  }, []);

  const createNote = useCallback((): DemoNote | null => {
    if (session.notes.length >= LIMIT) return null;
    const note: DemoNote = {
      id: crypto.randomUUID(),
      title: "Untitled",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
    };
    const updated = { ...session, notes: [note, ...session.notes] };
    persist(updated);
    setActiveNoteId(note.id);
    return note;
  }, [session, persist]);

  const updateNote = useCallback((id: string, changes: Partial<DemoNote>) => {
    const updated = {
      ...session,
      notes: session.notes.map((n) =>
        n.id === id ? { ...n, ...changes, updatedAt: Date.now() } : n
      ),
    };
    persist(updated);
  }, [session, persist]);

  const deleteNote = useCallback((id: string) => {
    const remaining = session.notes.filter((n) => n.id !== id);
    persist({ ...session, notes: remaining });
    if (activeNoteId === id) {
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [session, persist, activeNoteId]);

  const togglePin = useCallback((id: string) => {
    updateNote(id, { isPinned: !session.notes.find((n) => n.id === id)?.isPinned });
  }, [session, updateNote]);

  const activeNote = session.notes.find((n) => n.id === activeNoteId) ?? null;
  const notesUsed = session.notes.length;
  const notesRemaining = LIMIT - notesUsed;
  const msUntilReset = Math.max(0, EXPIRY_MS - (Date.now() - session.startedAt));
  const isAtLimit = notesUsed >= LIMIT;

  const hoursLeft = Math.floor(msUntilReset / 3600000);
  const minutesLeft = Math.floor((msUntilReset % 3600000) / 60000);
  const timeLabel = hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`;

  return {
    notes: session.notes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    notesUsed,
    notesRemaining,
    isAtLimit,
    timeLabel,
    hydrated,
  };
}
