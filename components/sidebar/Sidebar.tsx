"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  Plus,
  FileText,
  FolderOpen,
  Trash2,
  Pin,
  ChevronDown,
  ChevronRight,
  Folder,
  LogOut,
} from "lucide-react";
import type { Note, Folder as FolderType } from "@/lib/db/schema";

interface SidebarProps {
  activeNoteId?: string;
}

export function Sidebar({ activeNoteId }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [allNotesOpen, setAllNotesOpen] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [notesRes, foldersRes] = await Promise.all([
      fetch("/api/notes"),
      fetch("/api/folders"),
    ]);
    setNotes(await notesRes.json());
    setFolders(await foldersRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, pathname]);

  async function createNote(folderId?: string) {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", content: "", folderId }),
    });
    const note: Note = await res.json();
    await fetchAll();
    router.push(`/app/note/${note.id}`);
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim() }),
    });
    setNewFolderName("");
    setShowNewFolder(false);
    fetchAll();
  }

  async function deleteNote(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await fetchAll();
    if (activeNoteId === id) router.push("/app");
  }

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const unpinnedNotes = notes.filter((n) => !n.isPinned);

  return (
    <aside
      className="flex flex-col h-screen border-r flex-shrink-0"
      style={{
        width: "var(--sidebar-width)",
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          className="text-base font-bold tracking-tight"
          style={{ fontFamily: "var(--font-syne)", color: "var(--text)" }}
        >
          Notably
        </span>
        <button
          onClick={() => signOut().then(() => router.push("/sign-in"))}
          title="Sign out"
          className="p-1 rounded transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text)";
            (e.currentTarget as HTMLElement).style.background = "var(--surface-elevated)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <LogOut size={14} />
        </button>
      </div>

      {/* New Note button */}
      <div className="px-3 pt-3">
        <button
          onClick={() => createNote()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          <Plus size={14} />
          New Note
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1">
        {loading ? (
          <div className="px-3 py-4 text-xs" style={{ color: "var(--text-muted)" }}>
            Loading...
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinnedNotes.length > 0 && (
              <section className="mb-1">
                <div
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Pin size={10} />
                  Pinned
                </div>
                {pinnedNotes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    active={activeNoteId === note.id}
                    onDelete={deleteNote}
                    onClick={() => router.push(`/app/note/${note.id}`)}
                  />
                ))}
              </section>
            )}

            {/* Folders */}
            <section>
              <button
                className="flex items-center gap-1 w-full px-2 py-1 rounded text-xs font-semibold uppercase tracking-widest hover:bg-[var(--surface-elevated)] transition-colors"
                style={{ color: "var(--text-muted)" }}
                onClick={() => setFoldersOpen((v) => !v)}
              >
                {foldersOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Folders
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNewFolder(true);
                    setFoldersOpen(true);
                  }}
                  className="ml-auto p-0.5 rounded hover:text-[var(--accent)] transition-colors"
                  title="New folder"
                >
                  <Plus size={12} />
                </button>
              </button>

              {foldersOpen && (
                <>
                  {showNewFolder && (
                    <div className="px-2 py-1">
                      <input
                        autoFocus
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") createFolder();
                          if (e.key === "Escape") setShowNewFolder(false);
                        }}
                        onBlur={() => {
                          if (!newFolderName.trim()) setShowNewFolder(false);
                        }}
                        placeholder="Folder name…"
                        className="w-full text-xs px-2 py-1 rounded border"
                        style={{
                          background: "var(--bg)",
                          borderColor: "var(--accent)",
                          color: "var(--text)",
                          outline: "none",
                        }}
                      />
                    </div>
                  )}
                  {folders.map((folder) => (
                    <div key={folder.id}>
                      <button
                        onClick={() => router.push(`/app/folder/${folder.id}`)}
                        className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm transition-colors hover:bg-[var(--surface-elevated)]"
                        style={{
                          color: pathname === `/app/folder/${folder.id}` ? "var(--accent)" : "var(--text-muted)",
                        }}
                      >
                        <Folder size={13} style={{ color: folder.color }} />
                        <span className="truncate">{folder.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            createNote(folder.id);
                          }}
                          className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-[var(--accent)] transition-colors"
                          title="New note in folder"
                        >
                          <Plus size={11} />
                        </button>
                      </button>
                    </div>
                  ))}
                  {folders.length === 0 && !showNewFolder && (
                    <p className="text-xs px-3 py-1" style={{ color: "var(--text-disabled)" }}>
                      No folders yet
                    </p>
                  )}
                </>
              )}
            </section>

            {/* All Notes */}
            <section>
              <button
                className="flex items-center gap-1 w-full px-2 py-1 rounded text-xs font-semibold uppercase tracking-widest hover:bg-[var(--surface-elevated)] transition-colors"
                style={{ color: "var(--text-muted)" }}
                onClick={() => setAllNotesOpen((v) => !v)}
              >
                {allNotesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                All Notes
                <span
                  className="ml-auto text-xs font-normal"
                  style={{ color: "var(--text-disabled)" }}
                >
                  {notes.length}
                </span>
              </button>
              {allNotesOpen &&
                unpinnedNotes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    active={activeNoteId === note.id}
                    onDelete={deleteNote}
                    onClick={() => router.push(`/app/note/${note.id}`)}
                  />
                ))}
              {allNotesOpen && unpinnedNotes.length === 0 && pinnedNotes.length === 0 && (
                <p className="text-xs px-3 py-2" style={{ color: "var(--text-disabled)" }}>
                  No notes yet. Create one above.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </aside>
  );
}

interface NoteItemProps {
  note: Note;
  active: boolean;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
}

function NoteItem({ note, active, onDelete, onClick }: NoteItemProps) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-2 w-full px-3 py-2 rounded text-sm transition-colors text-left"
      style={{
        background: active ? "var(--accent-dim)" : "transparent",
        color: active ? "var(--accent)" : "var(--text)",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-elevated)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <FileText size={13} className="mt-0.5 flex-shrink-0" style={{ color: active ? "var(--accent)" : "var(--text-muted)" }} />
      <span className="flex-1 truncate text-xs leading-snug">{note.title || "Untitled"}</span>
      <span
        onClick={(e) => onDelete(note.id, e)}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all hover:text-[#ff4444] cursor-pointer"
        role="button"
        title="Delete note"
      >
        <Trash2 size={11} />
      </span>
    </button>
  );
}
