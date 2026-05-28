"use client";

import { useEffect, useState } from "react";
import s from "../app/app/app.module.css";
import { CloseIcon, CheckIcon } from "./Icons";
import { formatDuration, formatRelative, type Note } from "@/lib/notes";

export interface NoteModalProps {
  note: Note;
  onClose: () => void;
  onSave: (id: string, title: string, body: string) => void;
}

export default function NoteModal({ note, onClose, onSave }: NoteModalProps) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dirty = title !== note.title || body !== note.body;

  function handleSave() {
    onSave(note.id, title.trim() || "Untitled note", body);
    onClose();
  }

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHead}>
          <input
            className={s.modalTitleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
          />
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={s.modalBody}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Your note…"
          />
        </div>
        <div className={s.modalFoot}>
          <span className={s.modalMeta}>
            {formatRelative(note.createdAt)} · {formatDuration(note.durationMs)} · {note.lang}
          </span>
          <button className="btn primary" onClick={handleSave} disabled={!dirty}>
            <CheckIcon size={15} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
