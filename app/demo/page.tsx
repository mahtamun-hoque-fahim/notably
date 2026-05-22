"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Plus, FileText, Trash2, Pin, ChevronDown, ChevronRight,
  Mic, Clock, AlertCircle, ArrowRight,
} from "lucide-react";
import { useDemoNotes, type DemoNote } from "@/lib/hooks/useDemoNotes";
import { useVoiceRecorder } from "@/lib/hooks/useVoiceRecorder";
import { MicButton } from "@/components/voice/MicButton";
import { Waveform } from "@/components/voice/Waveform";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";

export default function DemoPage() {
  const {
    notes, activeNote, activeNoteId, setActiveNoteId,
    createNote, updateNote, deleteNote, togglePin,
    notesUsed, notesRemaining, isAtLimit, timeLabel, hydrated,
  } = useDemoNotes();

  if (!hydrated) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)" }}>
      {/* Demo banner */}
      <DemoBanner
        notesUsed={notesUsed}
        notesRemaining={notesRemaining}
        isAtLimit={isAtLimit}
        timeLabel={timeLabel}
      />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <DemoSidebar
          notes={notes}
          activeNoteId={activeNoteId}
          isAtLimit={isAtLimit}
          onSelectNote={setActiveNoteId}
          onNewNote={() => createNote()}
          onDeleteNote={deleteNote}
        />

        {/* Editor */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {isAtLimit && !activeNote ? (
            <LimitReached timeLabel={timeLabel} />
          ) : activeNote ? (
            <DemoEditor
              note={activeNote}
              onUpdate={updateNote}
              onDelete={() => deleteNote(activeNote.id)}
              onTogglePin={() => togglePin(activeNote.id)}
            />
          ) : (
            <DemoEmptyState isAtLimit={isAtLimit} onNew={() => createNote()} />
          )}
        </main>
      </div>
    </div>
  );
}

// ── Banner ────────────────────────────────────────────────────────────────────

function DemoBanner({ notesUsed, notesRemaining, isAtLimit, timeLabel }: {
  notesUsed: number; notesRemaining: number; isAtLimit: boolean; timeLabel: string;
}) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 20px", flexShrink: 0,
        background: isAtLimit ? "var(--destructive-dim)" : "rgba(0,230,118,0.07)",
        borderBottom: `1px solid ${isAtLimit ? "rgba(255,68,68,0.2)" : "rgba(0,230,118,0.15)"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "var(--font-syne)", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
          Notably
        </span>
        <span style={{ width: 1, height: 14, background: "var(--border)", display: "inline-block" }} />
        <span style={{ fontSize: 12, color: isAtLimit ? "var(--destructive)" : "var(--accent)" }}>
          Demo mode
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {isAtLimit
            ? `Limit reached · Resets in ${timeLabel}`
            : `${notesUsed}/10 notes used · Resets in ${timeLabel}`}
        </span>
      </div>
      <Link
        href="/sign-up"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, fontWeight: 600,
          color: "#000", background: "var(--accent)",
          padding: "5px 14px", borderRadius: 5, textDecoration: "none",
        }}
      >
        Sign up for unlimited <ArrowRight size={11} />
      </Link>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function DemoSidebar({ notes, activeNoteId, isAtLimit, onSelectNote, onNewNote, onDeleteNote }: {
  notes: DemoNote[]; activeNoteId: string | null; isAtLimit: boolean;
  onSelectNote: (id: string) => void; onNewNote: () => void; onDeleteNote: (id: string) => void;
}) {
  const [allOpen, setAllOpen] = useState(true);

  useKeyboardShortcuts({
    "cmd+n": (e) => { e.preventDefault(); if (!isAtLimit) onNewNote(); },
    "ctrl+n": (e) => { e.preventDefault(); if (!isAtLimit) onNewNote(); },
  });

  const pinned = notes.filter((n) => n.isPinned);
  const unpinned = notes.filter((n) => !n.isPinned);

  return (
    <aside
      style={{
        width: "var(--sidebar-width)", flexShrink: 0,
        background: "var(--surface)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", height: "100%", overflowY: "auto",
      }}
    >
      <div style={{ padding: "12px 10px 8px" }}>
        <button
          onClick={onNewNote}
          disabled={isAtLimit}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, padding: "8px 12px", borderRadius: 6, border: "none", cursor: isAtLimit ? "not-allowed" : "pointer",
            background: isAtLimit ? "var(--border)" : "var(--accent)",
            color: isAtLimit ? "var(--text-disabled)" : "#000",
            fontSize: 13, fontWeight: 600, opacity: isAtLimit ? 0.6 : 1,
          }}
        >
          <Plus size={14} />
          {isAtLimit ? "Limit reached" : "New Note"}
        </button>
      </div>

      <div style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {pinned.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              <Pin size={9} /> Pinned
            </div>
            {pinned.map((n) => <NoteRow key={n.id} note={n} active={n.id === activeNoteId} onClick={() => onSelectNote(n.id)} onDelete={() => onDeleteNote(n.id)} />)}
          </div>
        )}

        <button
          onClick={() => setAllOpen((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", width: "100%" }}
        >
          {allOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          Notes
          <span style={{ marginLeft: "auto", fontWeight: 400, color: "var(--text-disabled)" }}>{notes.length}</span>
        </button>

        {allOpen && unpinned.map((n) => (
          <NoteRow key={n.id} note={n} active={n.id === activeNoteId} onClick={() => onSelectNote(n.id)} onDelete={() => onDeleteNote(n.id)} />
        ))}

        {notes.length === 0 && (
          <p style={{ fontSize: 11, color: "var(--text-disabled)", padding: "8px 6px" }}>No notes yet</p>
        )}
      </div>
    </aside>
  );
}

function NoteRow({ note, active, onClick, onDelete }: { note: DemoNote; active: boolean; onClick: () => void; onDelete: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", display: "flex", alignItems: "flex-start", gap: 7,
        padding: "7px 8px", borderRadius: 6, border: "none", cursor: "pointer", textAlign: "left",
        background: active ? "var(--accent-dim)" : hover ? "var(--surface-elevated)" : "transparent",
        color: active ? "var(--accent)" : "var(--text)",
      }}
    >
      <FileText size={12} style={{ marginTop: 1, flexShrink: 0, color: active ? "var(--accent)" : "var(--text-muted)" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {note.title || "Untitled"}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-disabled)" }}>
          {note.content.trim().split(/\s+/).filter(Boolean).length} words
        </div>
      </div>
      {hover && (
        <span
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ padding: "1px", color: "var(--text-muted)", flexShrink: 0, marginTop: 1 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ff4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <Trash2 size={11} />
        </span>
      )}
    </button>
  );
}

// ── Editor ────────────────────────────────────────────────────────────────────

function DemoEditor({ note, onUpdate, onDelete, onTogglePin }: {
  note: DemoNote; onUpdate: (id: string, changes: Partial<DemoNote>) => void;
  onDelete: () => void; onTogglePin: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [voiceError, setVoiceError] = useState("");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const titleRef_el = useRef<HTMLTextAreaElement>(null);
  contentRef.current = content;

  // Sync when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    if (!note.content && (note.title === "Untitled" || !note.title)) {
      setTimeout(() => { titleRef_el.current?.focus(); titleRef_el.current?.select(); }, 50);
    }
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function scheduleSave(t: string, c: string) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => onUpdate(note.id, { title: t, content: c }), 600);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    scheduleSave(val, contentRef.current);
  }

  function handleContentChange(val: string) {
    setContent(val);
    scheduleSave(title, val);
  }

  function appendTranscript(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next = contentRef.current + (contentRef.current && !contentRef.current.endsWith(" ") ? " " : "") + trimmed;
    setContent(next);
    scheduleSave(title, next);
  }

  const { status, interim, start, stop, isSpeechApiSupported } = useVoiceRecorder({
    onTranscript: appendTranscript,
    // No Groq in demo — would need auth
    onError: (msg) => { setVoiceError(msg); setTimeout(() => setVoiceError(""), 4000); },
  });

  const isListening = status === "listening";
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const updatedAt = new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", background: "var(--bg)", minHeight: 0 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--text-muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{updatedAt}</span>
          <span>{wordCount} words</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ToolBtn onClick={onTogglePin} title={note.isPinned ? "Unpin" : "Pin"} active={note.isPinned}><Pin size={13} /></ToolBtn>
          <ToolBtn onClick={onDelete} title="Delete" destructive><Trash2 size={13} /></ToolBtn>
        </div>
      </div>

      {/* Voice status */}
      {(isListening || interim || voiceError) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0, background: voiceError ? "var(--destructive-dim)" : "var(--accent-dim)" }}>
          {voiceError
            ? <><AlertCircle size={11} style={{ color: "var(--destructive)" }} /><span style={{ fontSize: 11, color: "var(--destructive)" }}>{voiceError}</span></>
            : <><Waveform active={isListening} /><span style={{ fontSize: 11, color: "var(--accent)" }}>{interim || "Listening…"}</span></>
          }
        </div>
      )}

      {/* No Speech API warning in demo */}
      {!isSpeechApiSupported && (
        <div style={{ padding: "8px 24px", borderBottom: "1px solid var(--border)", background: "rgba(255,68,68,0.06)", fontSize: 11, color: "var(--text-muted)" }}>
          Voice not available in this browser.{" "}
          <Link href="/sign-up" style={{ color: "var(--accent)" }}>Sign up</Link> for full Groq AI transcription.
        </div>
      )}

      {/* Text areas */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, width: "100%", margin: "0 auto" }}>
        <textarea
          ref={titleRef_el}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title"
          rows={1}
          style={{ width: "100%", resize: "none", background: "transparent", border: "none", outline: "none", fontSize: 24, fontWeight: 700, fontFamily: "var(--font-syne)", color: "var(--text)", caretColor: "var(--accent)" }}
          onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
        />
        <textarea
          value={content + (interim && isListening ? " " + interim : "")}
          onChange={(e) => { if (!isListening) handleContentChange(e.target.value); }}
          readOnly={isListening}
          placeholder="Start typing or press the mic to dictate…"
          style={{ flex: 1, width: "100%", resize: "none", background: "transparent", border: "none", outline: "none", fontSize: 15, lineHeight: 1.75, fontFamily: "var(--font-onest)", color: isListening ? "var(--text-muted)" : "var(--text)", caretColor: "var(--accent)", minHeight: 360, cursor: isListening ? "default" : "text" }}
        />
      </div>

      {/* Floating mic */}
      <div style={{ position: "absolute", bottom: 24, right: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 10 }}>
        {isListening && (
          <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: "var(--surface)", border: "1px solid var(--accent)", color: "var(--accent)", whiteSpace: "nowrap" }}>
            Recording
          </span>
        )}
        <div style={{ borderRadius: "50%", background: isListening ? "var(--accent)" : "var(--surface-elevated)", border: `2px solid ${isListening ? "var(--accent)" : "var(--border)"}`, padding: 10, transition: "all 0.2s", boxShadow: isListening ? "0 0 20px rgba(0,230,118,0.3)" : "none" }}>
          <MicButton status={status} onStart={start} onStop={stop} invertOnActive />
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ onClick, title, children, active, destructive }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean; destructive?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} title={title} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ padding: 6, borderRadius: 5, border: "none", cursor: "pointer", background: hover ? (destructive ? "var(--destructive-dim)" : "var(--surface-elevated)") : "transparent", color: hover ? (destructive ? "var(--destructive)" : "var(--text)") : (active ? "var(--accent)" : "var(--text-muted)") }}>
      {children}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function DemoEmptyState({ isAtLimit, onNew }: { isAtLimit: boolean; onNew: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "var(--text-muted)" }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Mic size={20} style={{ color: "var(--accent)" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Ready to capture</p>
        <p style={{ fontSize: 12 }}>Create a note and start speaking</p>
      </div>
      {!isAtLimit && (
        <button onClick={onNew} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 6, border: "none", cursor: "pointer", background: "var(--accent)", color: "#000", fontSize: 13, fontWeight: 600 }}>
          <Plus size={14} /> New Note
        </button>
      )}
    </div>
  );
}

// ── Limit reached ────────────────────────────────────────────────────────────

function LimitReached({ timeLabel }: { timeLabel: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 40 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--destructive-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AlertCircle size={20} style={{ color: "var(--destructive)" }} />
      </div>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <p style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-syne)", color: "var(--text)", marginBottom: 8 }}>Daily limit reached</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          You&apos;ve used all 10 free notes for today. Your notes reset in <strong style={{ color: "var(--text)" }}>{timeLabel}</strong>.
          Sign up for unlimited notes, folders, and search — free forever.
        </p>
      </div>
      <Link
        href="/sign-up"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 8, background: "var(--accent)", color: "#000", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
      >
        Create free account <ArrowRight size={14} />
      </Link>
      <Link href="/" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Back to home</Link>
    </div>
  );
}
