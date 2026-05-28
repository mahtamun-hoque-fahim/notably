"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import s from "./app.module.css";
import Recorder from "@/components/Recorder";
import NoteModal from "@/components/NoteModal";
import UpgradeModal from "@/components/UpgradeModal";
import { MicFilled, SearchIcon, TrashIcon } from "@/components/Icons";
import {
  autoTitle,
  bumpQuota,
  DAILY_FREE_LIMIT,
  deleteNote,
  formatDuration,
  formatRelative,
  getQuota,
  loadNotes,
  newId,
  quotaRemaining,
  saveNote,
  updateNote,
  type Note,
} from "@/lib/notes";

export default function AppPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [remaining, setRemaining] = useState<number>(DAILY_FREE_LIMIT);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Note | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage after mount (avoids hydration mismatch).
  useEffect(() => {
    setNotes(loadNotes());
    setRemaining(quotaRemaining());
    setHydrated(true);
  }, []);

  const usedToday = getQuota().count;
  const canRecord = remaining > 0;

  function handleSave(text: string, durationMs: number, lang: string) {
    const note: Note = {
      id: newId(),
      title: autoTitle(text),
      body: text,
      createdAt: Date.now(),
      durationMs,
      lang,
    };
    setNotes(saveNote(note));
    bumpQuota();
    setRemaining(quotaRemaining());
  }

  function handleQuotaHit() {
    setShowUpgrade(true);
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setNotes(deleteNote(id));
  }

  function handleNoteSave(id: string, title: string, body: string) {
    setNotes(updateNote(id, { title, body }));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }, [notes, query]);

  return (
    <div className={s.shell}>
      <header className={s.topbar}>
        <div className={s.topbarRow}>
          <Link href="/" className={s.brand}>
            <span className={s.brandMic}><MicFilled size={11} /></span>
            notably
          </Link>
          <div
            className={`${s.quotaPill} ${hydrated && remaining <= 1 ? s.low : ""}`}
            title="Free notes reset at midnight"
          >
            <span className={s.quotaDots}>
              {Array.from({ length: DAILY_FREE_LIMIT }).map((_, i) => (
                <span
                  key={i}
                  className={`${s.quotaDot} ${hydrated && i < usedToday ? s.used : ""}`}
                />
              ))}
            </span>
            {hydrated ? (
              <span>
                <b>{remaining}</b> of {DAILY_FREE_LIMIT} free notes left
              </span>
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
        </div>
      </header>

      <main className={s.main}>
        <Recorder canRecord={canRecord} onSave={handleSave} onQuotaHit={handleQuotaHit} />

        <div className={s.libHead}>
          <div className={s.libTitle}>
            Your library
            {hydrated && notes.length > 0 && <span className={s.libCount}>{notes.length}</span>}
          </div>
          {hydrated && notes.length > 0 && (
            <div className={s.searchBox}>
              <SearchIcon size={18} />
              <input
                className={s.searchInput}
                placeholder="Search your notes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {!hydrated ? null : filtered.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emoji}>🎙️</div>
            {notes.length === 0 ? (
              <>
                <h3>No notes yet</h3>
                <p>Press the mic above and say something. It&apos;ll show up here.</p>
              </>
            ) : (
              <>
                <h3>Nothing matches &ldquo;{query}&rdquo;</h3>
                <p>Try a different word.</p>
              </>
            )}
          </div>
        ) : (
          <div className={s.noteGrid}>
            {filtered.map((n) => (
              <div key={n.id} className={`${s.noteCard} fade-up`} onClick={() => setActive(n)}>
                <div className={s.noteCardTop}>
                  <div className={s.noteCardTitle}>{n.title}</div>
                  <button
                    className={s.delBtn}
                    onClick={(e) => handleDelete(n.id, e)}
                    aria-label="Delete note"
                  >
                    <TrashIcon size={17} />
                  </button>
                </div>
                <div className={s.noteCardBody}>{n.body}</div>
                <div className={s.noteCardMeta}>
                  <span>{formatRelative(n.createdAt)}</span>
                  <span className={s.dot} />
                  <span>{formatDuration(n.durationMs)}</span>
                  <span className={s.dot} />
                  <span>{n.lang}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {active && (
        <NoteModal note={active} onClose={() => setActive(null)} onSave={handleNoteSave} />
      )}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
