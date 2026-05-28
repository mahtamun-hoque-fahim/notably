"use client";

import { useEffect, useState } from "react";
import s from "../app/app/app.module.css";
import { CloseIcon, CheckIcon, SparkleIcon } from "./Icons";
import { formatDuration, formatRelative, type Note } from "@/lib/notes";

export interface NoteModalProps {
  note: Note;
  signedIn: boolean;
  isPro: boolean;
  onClose: () => void;
  onSave: (id: string, title: string, body: string) => void;
  onEnrich: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onNeedUpgrade: () => void;
}

export default function NoteModal({
  note,
  signedIn,
  isPro,
  onClose,
  onSave,
  onEnrich,
  onNeedUpgrade,
}: NoteModalProps) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [summary, setSummary] = useState(note.summary ?? null);
  const [tags, setTags] = useState<string[]>(note.tags ?? []);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

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

  async function handleEnhance() {
    if (!isPro) {
      onNeedUpgrade();
      return;
    }
    setEnriching(true);
    setEnrichError(null);
    const res = await onEnrich(note.id);
    setEnriching(false);
    if (!res.ok) {
      if (res.error === "unconfigured") setEnrichError("AI features aren't enabled on this deployment.");
      else setEnrichError("Couldn't enhance this note. Try again.");
    }
    // On success, the store updates the note; the prop sync effect reflects it.
  }

  // Reflect store updates pushed into the note prop (e.g. after enrich elsewhere).
  useEffect(() => {
    setSummary(note.summary ?? null);
    setTags(note.tags ?? []);
    setTitle(note.title);
  }, [note.summary, note.tags, note.title]);

  const hasAi = Boolean(summary) || tags.length > 0;

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
          {hasAi && (
            <div className={s.aiBlock}>
              <div className={s.aiLabel}><SparkleIcon size={12} /> AI summary</div>
              {summary && <div className={s.aiSummary}>{summary}</div>}
              {tags.length > 0 && (
                <div className={s.tagRow}>
                  {tags.map((t) => (
                    <span key={t} className={s.tag}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Your note…"
          />

          {enrichError && (
            <div className={s.authError} style={{ marginTop: 14 }}>{enrichError}</div>
          )}
        </div>
        <div className={s.modalFoot}>
          <div className={s.aiAction}>
            {signedIn ? (
              <button
                className={`btn outline ${s.enhanceBtn}`}
                onClick={handleEnhance}
                disabled={enriching}
                title={isPro ? "Generate a title, summary and tags" : "Pro feature"}
              >
                {enriching ? (
                  <><span className={s.aiSpin} /> Enhancing…</>
                ) : (
                  <><SparkleIcon size={15} /> {hasAi ? "Re-enhance" : "Enhance with AI"}</>
                )}
              </button>
            ) : (
              <span className={s.modalMeta}>
                {formatRelative(note.createdAt)} · {formatDuration(note.durationMs)} · {note.lang}
              </span>
            )}
          </div>
          <button className="btn primary" onClick={handleSave} disabled={!dirty}>
            <CheckIcon size={15} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
