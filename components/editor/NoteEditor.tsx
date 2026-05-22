"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pin, Trash2, Clock, AlertCircle, Wand2, Loader2 } from "lucide-react";
import type { Note } from "@/lib/db/schema";
import { useVoiceRecorder } from "@/lib/hooks/useVoiceRecorder";
import { MicButton } from "@/components/voice/MicButton";
import { Waveform } from "@/components/voice/Waveform";

interface NoteEditorProps {
  noteId: string;
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isRetranscribing, setIsRetranscribing] = useState(false);
  const [retranscribeMode, setRetranscribeMode] = useState<"append" | "replace">("append");
  const [showRetranscribeMenu, setShowRetranscribeMenu] = useState(false);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const titleRef = useRef(title);
  contentRef.current = content;
  titleRef.current = title;

  useEffect(() => {
    fetch(`/api/notes/${noteId}`)
      .then((r) => r.json())
      .then((data: Note) => {
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
      });
  }, [noteId]);

  const save = useCallback(
    async (newTitle: string, newContent: string) => {
      setSaving(true);
      await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    },
    [noteId]
  );

  function scheduleSave(newTitle: string, newContent: string) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => save(newTitle, newContent), 800);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    scheduleSave(val, contentRef.current);
  }

  function handleContentChange(val: string) {
    setContent(val);
    scheduleSave(titleRef.current, val);
  }

  // ── Voice handlers ──────────────────────────────────────────────────────

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (!isFinal) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setContent((prev) => {
      const sep = prev && !prev.endsWith(" ") && !prev.endsWith("\n") ? " " : "";
      const next = prev + sep + trimmed;
      scheduleSave(titleRef.current, next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAudioReady = useCallback(
    async (blob: Blob) => {
      setIsUploading(true);
      try {
        const fd = new FormData();
        fd.append("audio", new File([blob], "recording.webm", { type: blob.type }));
        fd.append("noteId", noteId);
        const res = await fetch("/api/upload-audio", { method: "POST", body: fd });
        const data = await res.json();
        if (data.audioUrl) {
          setNote((prev) => prev ? { ...prev, audioUrl: data.audioUrl } : prev);
        }
      } catch {
        // Non-fatal — audio just won't be saved
      } finally {
        setIsUploading(false);
      }
    },
    [noteId]
  );

  const handleVoiceError = useCallback((msg: string) => {
    setVoiceError(msg);
    setTimeout(() => setVoiceError(""), 4000);
  }, []);

  const speechApiAvailable =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const { status, interim, start, stop, isSpeechApiSupported } = useVoiceRecorder({
    onTranscript: handleTranscript,
    onAudioReady: handleAudioReady,
    onError: handleVoiceError,
    useWhisperFallback: !speechApiAvailable,
  });

  const isListening = status === "listening";

  // ── Whisper re-transcription ─────────────────────────────────────────────

  async function retranscribe(mode: "append" | "replace") {
    if (!note?.audioUrl) return;
    setShowRetranscribeMenu(false);
    setIsRetranscribing(true);

    try {
      // Fetch audio from Cloudinary and send to our API
      const audioRes = await fetch(note.audioUrl);
      const audioBlob = await audioRes.blob();

      const fd = new FormData();
      fd.append("audio", new File([audioBlob], "recording.webm", { type: "audio/webm" }));
      fd.append("noteId", noteId);
      fd.append("mode", mode);

      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();

      if (data.content) {
        setContent(data.content);
        setNote((prev) => prev ? { ...prev, content: data.content } : prev);
      }
    } catch {
      setVoiceError("Re-transcription failed. Check your OpenAI API key.");
      setTimeout(() => setVoiceError(""), 4000);
    } finally {
      setIsRetranscribing(false);
    }
  }

  // ── Other actions ────────────────────────────────────────────────────────

  async function togglePin() {
    if (!note) return;
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !note.isPinned }),
    });
    const updated: Note = await res.json();
    setNote(updated);
  }

  async function deleteNote() {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    router.push("/app");
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-disabled)" }}>
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const updatedAt = new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const hasAudio = !!note.audioUrl;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative" style={{ background: "var(--bg)" }}>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Left: metadata */}
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {updatedAt}
          </span>
          <span>{wordCount} words</span>
          {saving && <span style={{ color: "var(--text-disabled)" }}>Saving…</span>}
          {saved && !saving && <span style={{ color: "var(--accent)" }}>Saved</span>}
          {isUploading && (
            <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={10} className="animate-spin" /> Saving audio…
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* Whisper re-transcribe button — only shown if note has saved audio */}
          {hasAudio && (
            <div className="relative">
              <ToolbarButton
                onClick={() => setShowRetranscribeMenu((v) => !v)}
                title="Re-transcribe with Whisper AI"
                loading={isRetranscribing}
              >
                {isRetranscribing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              </ToolbarButton>

              {showRetranscribeMenu && (
                <div
                  className="absolute right-0 top-8 z-20 flex flex-col rounded-md border overflow-hidden text-xs"
                  style={{
                    background: "var(--surface-elevated)",
                    borderColor: "var(--border)",
                    minWidth: 160,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  <button
                    onClick={() => retranscribe("append")}
                    className="px-4 py-2.5 text-left transition-colors"
                    style={{ color: "var(--text)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Append to note
                  </button>
                  <button
                    onClick={() => retranscribe("replace")}
                    className="px-4 py-2.5 text-left transition-colors border-t"
                    style={{ color: "var(--destructive)", borderColor: "var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--destructive-dim)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Replace content
                  </button>
                </div>
              )}
            </div>
          )}

          <ToolbarButton onClick={togglePin} title={note.isPinned ? "Unpin" : "Pin"} active={note.isPinned}>
            <Pin size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={deleteNote} title="Delete note" destructive>
            <Trash2 size={14} />
          </ToolbarButton>
        </div>
      </div>

      {/* ── Voice status bar ─────────────────────────────────────────────── */}
      {(isListening || interim || voiceError) && (
        <div
          className="flex items-center gap-3 px-6 py-2 border-b text-xs flex-shrink-0"
          style={{
            borderColor: "var(--border)",
            background: voiceError ? "var(--destructive-dim)" : "var(--accent-dim)",
          }}
        >
          {voiceError ? (
            <>
              <AlertCircle size={12} style={{ color: "var(--destructive)" }} />
              <span style={{ color: "var(--destructive)" }}>{voiceError}</span>
            </>
          ) : (
            <>
              <Waveform active={isListening} />
              <span style={{ color: "var(--accent)" }}>
                {!isSpeechApiSupported
                  ? "Recording… Whisper will transcribe on stop"
                  : interim
                  ? interim
                  : "Listening…"}
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Editor area ──────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col overflow-y-auto px-8 py-6 gap-4 max-w-3xl w-full mx-auto"
        onClick={() => setShowRetranscribeMenu(false)}
      >
        <textarea
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title"
          rows={1}
          className="w-full resize-none bg-transparent border-none outline-none text-2xl font-bold leading-snug"
          style={{
            fontFamily: "var(--font-syne)",
            color: "var(--text)",
            caretColor: "var(--accent)",
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
          }}
        />
        <textarea
          value={content + (interim && isListening ? " " + interim : "")}
          onChange={(e) => {
            if (!isListening) handleContentChange(e.target.value);
          }}
          readOnly={isListening}
          placeholder={
            isSpeechApiSupported
              ? "Start typing or press the mic to dictate…"
              : "Press the mic to record. Whisper will transcribe when you stop."
          }
          className="flex-1 w-full resize-none bg-transparent border-none outline-none text-base leading-relaxed min-h-[400px]"
          style={{
            fontFamily: "var(--font-onest)",
            color: isListening ? "var(--text-muted)" : "var(--text)",
            caretColor: "var(--accent)",
            cursor: isListening ? "default" : "text",
          }}
        />
      </div>

      {/* ── Floating mic button ──────────────────────────────────────────── */}
      <div
        className="absolute bottom-6 right-6 flex flex-col items-center gap-2"
        style={{ zIndex: 10 }}
      >
        {isListening && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              whiteSpace: "nowrap",
            }}
          >
            {isSpeechApiSupported ? "Recording" : "Recording → Whisper"}
          </span>
        )}
        <div
          className="rounded-full shadow-lg"
          style={{
            background: isListening ? "var(--accent)" : "var(--surface-elevated)",
            border: `2px solid ${isListening ? "var(--accent)" : "var(--border)"}`,
            padding: 10,
            transition: "all 0.2s ease",
          }}
        >
          <MicButton
            status={status}
            onStart={start}
            onStop={stop}
            invertOnActive
          />
        </div>
      </div>
    </div>
  );
}

// ── Toolbar button ─────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  destructive?: boolean;
  loading?: boolean;
}

function ToolbarButton({ onClick, title, children, active, destructive, loading }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={loading}
      className="p-1.5 rounded transition-colors disabled:opacity-40"
      style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
      onMouseEnter={(e) => {
        if (loading) return;
        (e.currentTarget as HTMLElement).style.color = destructive ? "var(--destructive)" : "var(--text)";
        (e.currentTarget as HTMLElement).style.background = destructive
          ? "var(--destructive-dim)"
          : "var(--surface-elevated)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = active ? "var(--accent)" : "var(--text-muted)";
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
