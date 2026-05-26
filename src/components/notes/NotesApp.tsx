"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Mic, MicOff, Trash2, ArrowLeft, Clock, AlertCircle,
  CheckCircle, Volume2, VolumeX, Plus
} from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import {
  getNotes, createNote, updateNote, deleteNote,
  canCreateNote, getTodayCount, formatExpiry, formatTime,
  type Note,
} from "@/lib/notes";

// ── Waveform ──────────────────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 32 });
  return (
    <div className="flex items-center gap-[2.5px] h-8">
      {bars.map((_, i) => (
        <div
          key={i}
          className="w-[2.5px] rounded-full transition-all"
          style={{
            background: active
              ? i % 3 === 0 ? "#7C6FFF" : i % 3 === 1 ? "#A99FFF" : "#5549CC"
              : "#242436",
            height: active ? `${8 + ((i * 7 + 13) % 24)}px` : "4px",
            animation: active
              ? `waveform ${0.35 + (i % 6) * 0.09}s ease-in-out infinite ${i * 0.035}s`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Daily Limit Ring ──────────────────────────────────────────────────────────
function LimitRing({ used, total }: { used: number; total: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - used / total);
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r={r} stroke="#242436" strokeWidth="3" fill="none" />
        <circle
          cx="24" cy="24" r={r}
          stroke={used >= total ? "#FF5757" : "#7C6FFF"}
          strokeWidth="3" fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span className="text-xs font-mono font-medium text-[#E8E8F0]">{used}/{total}</span>
    </div>
  );
}

// ── NoteCard ──────────────────────────────────────────────────────────────────
function NoteCard({
  note,
  onDelete,
  onUpdate,
}: {
  note: Note;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus();
      taRef.current.setSelectionRange(draft.length, draft.length);
    }
  }, [editing, draft.length]);

  function save() {
    if (draft.trim()) onUpdate(note.id, draft.trim());
    setEditing(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setDraft(note.content); setEditing(false); }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
  }

  return (
    <div className="group relative rounded-2xl border border-[#242436] bg-[#111118] hover:border-[#7C6FFF]/25 transition-all duration-200 overflow-hidden animate-fade-up">
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#7C6FFF]/60 to-transparent" />

      <div className="p-5">
        {/* Meta row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs text-[#6B6B85] font-mono">
            <Clock size={11} />
            <span>{formatTime(note.createdAt)}</span>
            <span className="mx-1 text-[#242436]">·</span>
            <span className="text-[#4C42CC]">{formatExpiry(note)}</span>
          </div>
          <button
            onClick={() => onDelete(note.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#6B6B85] hover:text-[#FF5757] hover:bg-[#FF5757]/10 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Content */}
        {editing ? (
          <div className="space-y-2">
            <textarea
              ref={taRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKey}
              rows={4}
              className="w-full bg-[#1A1A26] border border-[#7C6FFF]/30 rounded-lg px-3 py-2 text-sm font-mono text-[#E8E8F0] resize-none outline-none focus:border-[#7C6FFF] transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={save}
                className="px-3 py-1.5 rounded-lg bg-[#7C6FFF] text-white text-xs font-medium hover:bg-[#6B5FEE] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => { setDraft(note.content); setEditing(false); }}
                className="px-3 py-1.5 rounded-lg border border-[#242436] text-[#6B6B85] text-xs hover:text-[#E8E8F0] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-sm font-mono text-[#E8E8F0] leading-relaxed cursor-pointer hover:text-[#A99FFF] transition-colors"
            onClick={() => setEditing(true)}
            title="Click to edit"
          >
            {note.content}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const finalTextRef = useRef("");

  const refresh = useCallback(() => {
    setNotes(getNotes());
    setTodayCount(getTodayCount());
  }, []);

  useEffect(() => {
    setMounted(true);
    refresh();
    // Refresh every 60s to update expiry labels + clean expired notes
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const voice = useVoice({
    onFinalResult: (text) => {
      finalTextRef.current = text;
      setCurrentText(text);
    },
    onInterimResult: (interim) => {
      setCurrentText(finalTextRef.current + (interim ? ` ${interim}` : ""));
    },
  });

  function handleSaveNote() {
    const text = (currentText || finalTextRef.current).trim();
    if (!text) { showToast("Nothing to save — speak first.", "err"); return; }
    if (!canCreateNote()) { showToast("Daily limit reached (10 notes). Come back tomorrow.", "err"); return; }
    const note = createNote(text);
    if (note) {
      refresh();
      setCurrentText("");
      finalTextRef.current = "";
      if (voice.state === "listening") voice.stopListening();
      showToast("Note saved.", "ok");
    }
  }

  function handleDelete(id: string) {
    deleteNote(id);
    refresh();
  }

  function handleUpdate(id: string, content: string) {
    updateNote(id, content);
    refresh();
  }

  function handleMicToggle() {
    if (!canCreateNote() && voice.state !== "listening") {
      showToast("Daily limit reached (10 notes). Come back tomorrow.", "err");
      return;
    }
    if (voice.state !== "listening") {
      setCurrentText("");
      finalTextRef.current = "";
    }
    voice.toggle();
  }

  const isListening = voice.state === "listening";
  const limitReached = todayCount >= 10;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#09090F] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-[#7C6FFF] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090F] text-[#E8E8F0]">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 md:px-8 py-4 border-b border-[#242436] bg-[#09090F]/90 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 text-[#6B6B85] hover:text-[#E8E8F0] transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Back</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#7C6FFF]/15 flex items-center justify-center">
            <Mic size={12} className="text-[#7C6FFF]" />
          </div>
          <span className="font-syne font-bold text-sm tracking-tight">Notably</span>
        </div>
        <LimitRing used={todayCount} total={10} />
      </header>

      <main className="max-w-2xl mx-auto px-5 md:px-6 py-8 space-y-8">
        {/* Recorder Panel */}
        <div className="rounded-2xl border border-[#242436] bg-[#111118] overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#242436]">
            <div className="flex items-center gap-2">
              {isListening ? (
                <span className="flex items-center gap-1.5 text-xs font-mono text-[#FF5757]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5757] animate-pulse" />
                  Recording
                </span>
              ) : (
                <span className="text-xs font-mono text-[#6B6B85]">Ready</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isListening ? <Volume2 size={12} className="text-[#7C6FFF]" /> : <VolumeX size={12} className="text-[#242436]" />}
            </div>
          </div>

          {/* Waveform + text area */}
          <div className="px-5 pt-5 pb-3 space-y-4">
            <Waveform active={isListening} />

            {/* Live text */}
            <div className="min-h-[80px] max-h-[180px] overflow-y-auto">
              {currentText ? (
                <p className="font-mono text-sm text-[#E8E8F0] leading-relaxed whitespace-pre-wrap">
                  {currentText}
                  {isListening && (
                    <span className="inline-block w-0.5 h-4 bg-[#7C6FFF] ml-0.5 animate-pulse align-middle" />
                  )}
                </p>
              ) : (
                <p className="font-mono text-sm text-[#6B6B85]">
                  {isListening ? "Listening... speak now." : limitReached ? "Daily limit reached. See you tomorrow." : "Press the mic button and start speaking."}
                </p>
              )}
            </div>

            {/* Error */}
            {voice.error && (
              <div className="flex items-center gap-2 text-xs text-[#FF5757] bg-[#FF5757]/8 border border-[#FF5757]/20 rounded-lg px-3 py-2">
                <AlertCircle size={12} />
                {voice.error}
              </div>
            )}

            {/* Unsupported */}
            {!voice.isSupported && (
              <div className="flex items-center gap-2 text-xs text-[#FFBD2E] bg-[#FFBD2E]/8 border border-[#FFBD2E]/20 rounded-lg px-3 py-2">
                <AlertCircle size={12} />
                Voice recognition not supported. Use Chrome or Edge.
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 px-5 pb-5">
            <button
              onClick={handleMicToggle}
              disabled={!voice.isSupported || limitReached}
              className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening
                  ? "bg-[#FF5757] shadow-[0_0_30px_rgba(255,87,87,0.4)] hover:bg-[#EE4646]"
                  : "bg-[#7C6FFF] shadow-[0_0_20px_rgba(124,111,255,0.3)] hover:bg-[#6B5FEE] hover:shadow-[0_0_30px_rgba(124,111,255,0.5)]"
              }`}
            >
              {isListening ? (
                <>
                  <span className="absolute inset-0 rounded-2xl border-2 border-[#FF5757] animate-ping opacity-40" />
                  <MicOff size={20} className="text-white relative z-10" />
                </>
              ) : (
                <Mic size={20} className="text-white" />
              )}
            </button>

            <button
              onClick={handleSaveNote}
              disabled={!currentText.trim()}
              className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl border border-[#7C6FFF]/30 bg-[#7C6FFF]/8 text-[#7C6FFF] text-sm font-medium hover:bg-[#7C6FFF]/15 hover:border-[#7C6FFF]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={16} />
              Save Note
            </button>
          </div>
        </div>

        {/* Notes list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-syne text-sm font-semibold text-[#6B6B85] tracking-wide uppercase">
              Today&rsquo;s Notes
            </h2>
            <span className="text-xs font-mono text-[#242436]">
              {notes.length} saved
            </span>
          </div>

          {notes.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#111118] border border-[#242436] flex items-center justify-center mx-auto">
                <Mic size={20} className="text-[#242436]" />
              </div>
              <p className="text-sm text-[#6B6B85]">No notes yet. Hit the mic and start talking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info strip */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#242436] bg-[#111118]">
          <Clock size={13} className="text-[#6B6B85] shrink-0" />
          <p className="text-xs text-[#6B6B85] leading-relaxed">
            Notes are stored locally and expire after 24 hours. Max 10 per day. Nothing is sent to any server.
          </p>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl z-50 transition-all duration-300 ${
            toast.type === "ok"
              ? "bg-[#111118] border-[#7C6FFF]/40 text-[#A99FFF]"
              : "bg-[#111118] border-[#FF5757]/40 text-[#FF5757]"
          }`}
        >
          {toast.type === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
