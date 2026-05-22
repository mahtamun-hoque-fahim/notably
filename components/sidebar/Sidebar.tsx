"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  Plus, FileText, Trash2, Pin, ChevronDown, ChevronRight,
  Folder, LogOut, Search, X,
} from "lucide-react";
import type { Note, Folder as FolderType } from "@/lib/db/schema";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [allNotesOpen, setAllNotesOpen] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [searching, setSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const isSearching = searchQuery.trim().length > 0;

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    const [notesRes, foldersRes] = await Promise.all([
      fetch("/api/notes"),
      fetch("/api/folders"),
    ]);
    setNotes(await notesRes.json());
    setFolders(await foldersRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll, pathname]);

  // ── Search ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => { setSearchResults(data); setSearching(false); });
  }, [debouncedQuery]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────

  useKeyboardShortcuts({
    "cmd+k": (e) => { e.preventDefault(); searchInputRef.current?.focus(); },
    "ctrl+k": (e) => { e.preventDefault(); searchInputRef.current?.focus(); },
    "cmd+n": (e) => { e.preventDefault(); createNote(); },
    "ctrl+n": (e) => { e.preventDefault(); createNote(); },
    "escape": () => {
      if (searchQuery) { setSearchQuery(""); searchInputRef.current?.blur(); }
    },
  });

  // ── Actions ──────────────────────────────────────────────────────────────

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
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await fetchAll();
    if (pathname === `/app/note/${id}`) router.push("/app");
  }

  async function deleteFolder(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/folders/${id}`, { method: "DELETE" });
    fetchAll();
    if (pathname === `/app/folder/${id}`) router.push("/app");
  }

  // ── Derived state ────────────────────────────────────────────────────────

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const unpinnedNotes = notes.filter((n) => !n.isPinned);
  const activeNoteId = pathname.startsWith("/app/note/") ? pathname.split("/").pop() : undefined;

  function noteCountForFolder(folderId: string) {
    return notes.filter((n) => n.folderId === folderId).length;
  }

  function highlightMatch(text: string, query: string) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text.slice(0, 40);
    const start = Math.max(0, idx - 15);
    const snippet = text.slice(start, start + 60);
    return (start > 0 ? "…" : "") + snippet;
  }

  // ── Render ───────────────────────────────────────────────────────────────

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

      {/* New Note + Search */}
      <div className="px-3 pt-3 pb-2 flex flex-col gap-2">
        <button
          onClick={() => createNote()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          <Plus size={14} />
          New Note
          <span
            className="ml-auto text-xs font-normal opacity-60 hidden sm:inline"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            ⌘N
          </span>
        </button>

        {/* Search bar */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded border transition-colors"
          style={{
            background: "var(--bg)",
            borderColor: isSearching ? "var(--accent)" : "var(--border)",
          }}
        >
          <Search size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes…"
            className="flex-1 bg-transparent border-none outline-none text-xs min-w-0"
            style={{ color: "var(--text)" }}
          />
          {isSearching && (
            <button onClick={() => setSearchQuery("")} style={{ color: "var(--text-muted)" }}>
              <X size={11} />
            </button>
          )}
          {!isSearching && (
            <span
              className="text-xs opacity-40 hidden sm:inline"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", flexShrink: 0 }}
            >
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2 py-1 flex flex-col gap-1">
        {loading ? (
          <div className="px-3 py-4 text-xs" style={{ color: "var(--text-muted)" }}>Loading…</div>
        ) : isSearching ? (
          /* ── Search results ── */
          <section>
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Results
              </span>
              <span className="text-xs" style={{ color: "var(--text-disabled)" }}>
                {searching ? "…" : `${searchResults.length}`}
              </span>
            </div>
            {!searching && searchResults.length === 0 && (
              <p className="text-xs px-3 py-3 text-center" style={{ color: "var(--text-disabled)" }}>
                No notes match "{searchQuery}"
              </p>
            )}
            {searchResults.map((note) => (
              <button
                key={note.id}
                onClick={() => { router.push(`/app/note/${note.id}`); setSearchQuery(""); }}
                className="flex flex-col w-full px-3 py-2 rounded text-left transition-colors"
                style={{
                  background: activeNoteId === note.id ? "var(--accent-dim)" : "transparent",
                  color: "var(--text)",
                }}
                onMouseEnter={(e) => {
                  if (activeNoteId !== note.id) (e.currentTarget as HTMLElement).style.background = "var(--surface-elevated)";
                }}
                onMouseLeave={(e) => {
                  if (activeNoteId !== note.id) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span className="text-xs font-medium truncate" style={{ color: activeNoteId === note.id ? "var(--accent)" : "var(--text)" }}>
                  {note.title || "Untitled"}
                </span>
                <span className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {highlightMatch(note.content, searchQuery)}
                </span>
              </button>
            ))}
          </section>
        ) : (
          /* ── Normal nav ── */
          <>
            {/* Pinned */}
            {pinnedNotes.length > 0 && (
              <section className="mb-1">
                <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  <Pin size={10} /> Pinned
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
                  onClick={(e) => { e.stopPropagation(); setShowNewFolder(true); setFoldersOpen(true); }}
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
                        onBlur={() => { if (!newFolderName.trim()) setShowNewFolder(false); }}
                        placeholder="Folder name…"
                        className="w-full text-xs px-2 py-1 rounded border outline-none"
                        style={{ background: "var(--bg)", borderColor: "var(--accent)", color: "var(--text)" }}
                      />
                    </div>
                  )}
                  {folders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      noteCount={noteCountForFolder(folder.id)}
                      active={pathname === `/app/folder/${folder.id}`}
                      onDelete={deleteFolder}
                      onClick={() => router.push(`/app/folder/${folder.id}`)}
                      onNewNote={() => createNote(folder.id)}
                    />
                  ))}
                  {folders.length === 0 && !showNewFolder && (
                    <p className="text-xs px-3 py-1" style={{ color: "var(--text-disabled)" }}>No folders yet</p>
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
                <span className="ml-auto text-xs font-normal" style={{ color: "var(--text-disabled)" }}>
                  {notes.length}
                </span>
              </button>

              {allNotesOpen && unpinnedNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  active={activeNoteId === note.id}
                  onDelete={deleteNote}
                  onClick={() => router.push(`/app/note/${note.id}`)}
                />
              ))}
              {allNotesOpen && notes.length === 0 && (
                <p className="text-xs px-3 py-2" style={{ color: "var(--text-disabled)" }}>
                  No notes yet
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </aside>
  );
}

// ── NoteItem ─────────────────────────────────────────────────────────────────

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
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-elevated)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <FileText size={13} className="mt-0.5 flex-shrink-0" style={{ color: active ? "var(--accent)" : "var(--text-muted)" }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs truncate">{note.title || "Untitled"}</div>
        {note.wordCount !== "0" && (
          <div className="text-xs mt-0.5" style={{ color: "var(--text-disabled)" }}>
            {note.wordCount} words
          </div>
        )}
      </div>
      <span
        onClick={(e) => onDelete(note.id, e)}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all hover:text-[#ff4444] cursor-pointer flex-shrink-0 mt-0.5"
        role="button"
        title="Delete"
      >
        <Trash2 size={11} />
      </span>
    </button>
  );
}

// ── FolderItem ───────────────────────────────────────────────────────────────

interface FolderItemProps {
  folder: FolderType;
  noteCount: number;
  active: boolean;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
  onNewNote: () => void;
}

function FolderItem({ folder, noteCount, active, onDelete, onClick, onNewNote }: FolderItemProps) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm transition-colors"
      style={{
        background: active ? "var(--accent-dim)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-elevated)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <Folder size={13} style={{ color: folder.color, flexShrink: 0 }} />
      <span className="flex-1 truncate text-xs text-left">{folder.name}</span>

      {/* Note count badge */}
      {noteCount > 0 && (
        <span
          className="text-xs px-1.5 rounded-full group-hover:hidden"
          style={{ background: "var(--border)", color: "var(--text-muted)" }}
        >
          {noteCount}
        </span>
      )}

      {/* Action buttons on hover */}
      <span className="hidden group-hover:flex items-center gap-0.5">
        <span
          onClick={(e) => { e.stopPropagation(); onNewNote(); }}
          className="p-0.5 rounded hover:text-[var(--accent)] transition-colors cursor-pointer"
          role="button"
          title="New note in folder"
        >
          <Plus size={11} />
        </span>
        <span
          onClick={(e) => onDelete(folder.id, e)}
          className="p-0.5 rounded hover:text-[#ff4444] transition-colors cursor-pointer"
          role="button"
          title="Delete folder"
        >
          <Trash2 size={11} />
        </span>
      </span>
    </button>
  );
}
