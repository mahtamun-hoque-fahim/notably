"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pin, Trash2, FolderOpen, Clock } from "lucide-react";
import type { Note } from "@/lib/db/schema";

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
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function handleTitleChange(val: string) {
    setTitle(val);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => save(val, content), 800);
  }

  function handleContentChange(val: string) {
    setContent(val);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => save(title, val), 800);
  }

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

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: "var(--bg)" }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {updatedAt}
          </span>
          <span>{wordCount} words</span>
          {saving && <span style={{ color: "var(--text-disabled)" }}>Saving…</span>}
          {saved && !saving && <span style={{ color: "var(--accent)" }}>Saved</span>}
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={togglePin}
            title={note.isPinned ? "Unpin" : "Pin"}
            active={note.isPinned}
          >
            <Pin size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => {}} title="Move to folder">
            <FolderOpen size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={deleteNote} title="Delete note" destructive>
            <Trash2 size={14} />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6 gap-4 max-w-3xl w-full mx-auto">
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
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start typing or use voice to transcribe…"
          className="flex-1 w-full resize-none bg-transparent border-none outline-none text-base leading-relaxed min-h-[400px]"
          style={{
            fontFamily: "var(--font-onest)",
            color: "var(--text)",
            caretColor: "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  destructive?: boolean;
}

function ToolbarButton({ onClick, title, children, active, destructive }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded transition-colors"
      style={{
        color: active
          ? "var(--accent)"
          : destructive
          ? "var(--text-muted)"
          : "var(--text-muted)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = destructive ? "var(--destructive)" : "var(--text)";
        (e.currentTarget as HTMLElement).style.background = destructive ? "var(--destructive-dim)" : "var(--surface-elevated)";
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
