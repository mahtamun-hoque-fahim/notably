"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import type { Note, Folder } from "@/lib/db/schema";

export default function FolderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [notesRes, foldersRes] = await Promise.all([
        fetch(`/api/notes?folderId=${id}`),
        fetch("/api/folders"),
      ]);
      const allNotes: Note[] = await notesRes.json();
      const allFolders: Folder[] = await foldersRes.json();
      setNotes(allNotes);
      setFolder(allFolders.find((f) => f.id === id) ?? null);
      setLoading(false);
    }
    load();
  }, [id]);

  async function createNote() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: id }),
    });
    const note: Note = await res.json();
    router.push(`/app/note/${note.id}`);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-disabled)" }}>
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <h1
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-syne)", color: "var(--text)" }}
        >
          {folder?.name ?? "Folder"}
        </h1>
        <button
          onClick={createNote}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded font-medium transition-colors"
          style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
        >
          <Plus size={13} /> New Note
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {notes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3"
            style={{ color: "var(--text-muted)" }}
          >
            <FileText size={32} style={{ color: "var(--text-disabled)" }} />
            <p className="text-sm">No notes in this folder yet</p>
          </div>
        ) : (
          <div className="grid gap-2 max-w-2xl">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => router.push(`/app/note/${note.id}`)}
                className="flex flex-col gap-1 p-4 rounded-md border text-left transition-colors"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,230,118,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                }}
              >
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {note.title || "Untitled"}
                </span>
                <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {note.content.slice(0, 80) || "No content"}
                </span>
                <span className="text-xs" style={{ color: "var(--text-disabled)" }}>
                  {note.wordCount} words ·{" "}
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
