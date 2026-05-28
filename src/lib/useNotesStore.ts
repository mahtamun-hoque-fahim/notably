"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import {
  autoTitle,
  bumpQuota,
  clearNotes,
  DAILY_FREE_LIMIT,
  deleteNote as localDelete,
  getQuota,
  loadNotes,
  localDateString,
  newId,
  quotaRemaining,
  saveNote,
  updateNote as localUpdate,
  type Note,
} from "@/lib/notes";
import {
  createNoteAction,
  deleteNoteAction,
  getUsageAction,
  importNotesAction,
  listNotesAction,
  updateNoteAction,
  type ActionNote,
} from "@/lib/actions/notes";

function toNote(a: ActionNote): Note {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    createdAt: a.createdAt,
    durationMs: a.durationMs,
    lang: a.lang,
  };
}

export type SaveResult = null | "quota" | "auth";

export interface NotesStore {
  ready: boolean;
  signedIn: boolean;
  notes: Note[];
  used: number;
  remaining: number;
  plan: string;
  pendingImport: number;
  create: (text: string, durationMs: number, lang: string) => Promise<SaveResult>;
  update: (id: string, title: string, body: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  importLocal: () => Promise<void>;
  dismissImport: () => void;
}

export function useNotesStore(): NotesStore {
  const { data: session, isPending } = useSession();
  const signedIn = Boolean(session?.user);

  const [ready, setReady] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [used, setUsed] = useState(0);
  const [remaining, setRemaining] = useState(DAILY_FREE_LIMIT);
  const [plan, setPlan] = useState("free");
  const [pendingImport, setPendingImport] = useState(0);

  const refresh = useCallback(async () => {
    if (signedIn) {
      const [serverNotes, usage] = await Promise.all([
        listNotesAction(),
        getUsageAction(localDateString()),
      ]);
      setNotes(serverNotes.map(toNote));
      setUsed(usage.used);
      setRemaining(usage.remaining);
      setPlan(usage.plan);
      setPendingImport(loadNotes().length); // local notes available to migrate
    } else {
      setNotes(loadNotes());
      setUsed(getQuota().count);
      setRemaining(quotaRemaining());
      setPlan("free");
      setPendingImport(0);
    }
    setReady(true);
  }, [signedIn]);

  useEffect(() => {
    if (isPending) return;
    void refresh();
  }, [isPending, refresh]);

  const create = useCallback(
    async (text: string, durationMs: number, lang: string): Promise<SaveResult> => {
      const title = autoTitle(text);
      if (signedIn) {
        const res = await createNoteAction({
          title,
          body: text,
          durationMs,
          lang,
          localDate: localDateString(),
        });
        if (!res.ok) return res.error;
        setNotes((prev) => [toNote(res.note), ...prev]);
        setUsed((u) => u + 1);
        setRemaining((r) => (plan === "pro" ? r : Math.max(0, r - 1)));
        return null;
      }
      if (quotaRemaining() <= 0) return "quota";
      const note: Note = { id: newId(), title, body: text, createdAt: Date.now(), durationMs, lang };
      setNotes(saveNote(note));
      bumpQuota();
      setUsed(getQuota().count);
      setRemaining(quotaRemaining());
      return null;
    },
    [signedIn, plan]
  );

  const update = useCallback(
    async (id: string, title: string, body: string) => {
      if (signedIn) {
        await updateNoteAction({ id, title, body });
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, title, body } : n)));
      } else {
        setNotes(localUpdate(id, { title, body }));
      }
    },
    [signedIn]
  );

  const remove = useCallback(
    async (id: string) => {
      if (signedIn) {
        await deleteNoteAction(id);
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } else {
        setNotes(localDelete(id));
      }
    },
    [signedIn]
  );

  const importLocal = useCallback(async () => {
    if (!signedIn) return;
    const local = loadNotes();
    if (local.length === 0) {
      setPendingImport(0);
      return;
    }
    const res = await importNotesAction(
      local.map((n) => ({
        title: n.title,
        body: n.body,
        durationMs: n.durationMs,
        lang: n.lang,
        createdAt: n.createdAt,
      }))
    );
    if (res.ok) {
      clearNotes();
      setPendingImport(0);
      await refresh();
    }
  }, [signedIn, refresh]);

  const dismissImport = useCallback(() => setPendingImport(0), []);

  return {
    ready: ready && !isPending,
    signedIn,
    notes,
    used,
    remaining,
    plan,
    pendingImport,
    create,
    update,
    remove,
    importLocal,
    dismissImport,
  };
}
