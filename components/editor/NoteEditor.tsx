"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pin, Trash2, Clock, AlertCircle } from "lucide-react";
import type { Note } from "@/lib/db/schema";
import { useVoiceRecorder } from "@/lib/hooks/useVoiceRecorder";
import { MicButton } from "@/components/voice/MicButton";
import { Waveform } from "@/components/voice/Waveform";

export function NoteEditor({ noteId }: { noteId: string }) {
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const titleRef_el = useRef<HTMLTextAreaElement>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const titleRef = useRef(title);
  contentRef.current = content;
  titleRef.current = title;

  // ── Load note ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/notes/${noteId}`)
      .then((r) => r.json())
      .then((data: Note) => {
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
        if (!data.content && (data.title === "Untitled" || !data.title)) {
          setTimeout(() => {
            titleRef_el.current?.focus();
            titleRef_el.current?.select();
          }, 50);
        }
      });
  }, [noteId]);

  // ── Save ─────────────────────────────────────────────────────────────────

  const save = useCallback(
    async (t: string, c: string) => {
      setSaving(true);
      await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, content: c }),
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    },
    [noteId]
  );

  function scheduleSave(t: string, c: string) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => save(t, c), 800);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    scheduleSave(val, contentRef.current);
  }

  function handleContentChange(val: string) {
    setContent(val);
    scheduleSave(titleRef.current, val);
  }

  // ── Voice ────────────────────────────────────────────────────────────────

  function appendTranscript(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setContent((prev) => {
      const sep = prev && !prev.endsWith(" ") && !prev.endsWith("\n") ? " " : "";
      const next = prev + sep + trimmed;
      scheduleSave(titleRef.current, next);
      return next;
    });
  }

  const { status, interim, start, stop, isSpeechApiSupported } = useVoiceRecorder({
    onTranscript: appendTranscript,
    onGroqTranscript: appendTranscript,
    onError: (msg) => { setVoiceError(msg); setTimeout(() => setVoiceError(""), 4000); },
  });

  const isListening = status === "listening";
  const isTranscribing = status === "transcribing";

  // ── Actions ──────────────────────────────────────────────────────────────

  async function togglePin() {
    if (!note) return;
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !note.isPinned }),
    });
    setNote(await res.json());
  }

  async function deleteNote() {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    router.push("/app");
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-disabled)" }}>
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const updatedAt = new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 relative" style={{ background: "var(--bg)" }}>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1"><Clock size={11} />{updatedAt}</span>
          <span>{wordCount} words</span>
          {saving && <span style={{ color: "var(--text-disabled)" }}>Saving…</span>}
          {saved && !saving && <span style={{ color: "var(--accent)" }}>Saved</span>}
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={togglePin} title={note.isPinned ? "Unpin" : "Pin"} active={note.isPinned}>
            <Pin size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={deleteNote} title="Delete note" destructive>
            <Trash2 size={14} />
          </ToolbarButton>
        </div>
      </div>

      {/* Voice status bar */}
      {(isListening || isTranscribing || interim || voiceError) && (
        <div
          className="flex items-center gap-3 px-6 py-2 border-b text-xs flex-shrink-0"
          style={{ borderColor: "var(--border)", background: voiceError ? "var(--destructive-dim)" : "var(--accent-dim)" }}
        >
          {voiceError ? (
            <><AlertCircle size={12} style={{ color: "var(--destructive)" }} /><span style={{ color: "var(--destructive)" }}>{voiceError}</span></>
          ) : isTranscribing ? (
            <><Waveform active={false} /><span style={{ color: "var(--text-muted)" }}>Transcribing with Groq…</span></>
          ) : (
            <><Waveform active={isListening} /><span style={{ color: "var(--accent)" }}>{!isSpeechApiSupported ? "Recording → Groq will transcribe on stop" : interim || "Listening…"}</span></>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6 gap-4 max-w-3xl w-full mx-auto">
        <textarea
          ref={titleRef_el}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title"
          rows={1}
          className="w-full resize-none bg-transparent border-none outline-none text-2xl font-bold leading-snug"
          style={{ fontFamily: "var(--font-syne)", color: "var(--text)", caretColor: "var(--accent)" }}
          onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
        />
        <textarea
          value={content + (interim && isListening ? " " + interim : "")}
          onChange={(e) => { if (!isListening) handleContentChange(e.target.value); }}
          readOnly={isListening}
          placeholder={isSpeechApiSupported ? "Start typing or press the mic to dictate…" : "Press the mic to record. Groq will transcribe when you stop."}
          className="flex-1 w-full resize-none bg-transparent border-none outline-none text-base leading-relaxed min-h-[400px]"
          style={{ fontFamily: "var(--font-onest)", color: isListening ? "var(--text-muted)" : "var(--text)", caretColor: "var(--accent)", cursor: isListening ? "default" : "text" }}
        />
      </div>

      {/* Floating mic */}
      <div className="absolute bottom-6 right-6 flex flex-col items-center gap-2" style={{ zIndex: 10 }}>
        {isListening && (
          <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: "var(--surface)", border: "1px solid var(--accent)", color: "var(--accent)" }}>
            {isSpeechApiSupported ? "Recording" : "Recording → Groq"}
          </span>
        )}
        <div className="rounded-full shadow-lg" style={{ background: isListening ? "var(--accent)" : "var(--surface-elevated)", border: `2px solid ${isListening ? "var(--accent)" : "var(--border)"}`, padding: 10, transition: "all 0.2s ease" }}>
          <MicButton status={status} onStart={start} onStop={stop} invertOnActive />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ onClick, title, children, active, destructive }: {
  onClick: () => void; title: string; children: React.ReactNode; active?: boolean; destructive?: boolean;
}) {
  return (
    <button onClick={onClick} title={title} className="p-1.5 rounded transition-colors" style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = destructive ? "var(--destructive)" : "var(--text)"; (e.currentTarget as HTMLElement).style.background = destructive ? "var(--destructive-dim)" : "var(--surface-elevated)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = active ? "var(--accent)" : "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}
