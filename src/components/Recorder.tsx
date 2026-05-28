"use client";

import { useEffect, useRef, useState } from "react";
import s from "../app/app/app.module.css";
import { useSpeech } from "@/lib/useSpeech";
import { formatDuration, MAX_DURATION_MS } from "@/lib/notes";
import { MicIcon, StopIcon, CheckIcon } from "./Icons";

const LANGS: { code: string; label: string }[] = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Español" },
  { code: "fr-FR", label: "Français" },
  { code: "de-DE", label: "Deutsch" },
  { code: "pt-BR", label: "Português" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "ar-SA", label: "العربية" },
  { code: "bn-BD", label: "বাংলা" },
  { code: "ja-JP", label: "日本語" },
  { code: "zh-CN", label: "中文" },
];

export interface RecorderProps {
  canRecord: boolean;
  onSave: (text: string, durationMs: number, lang: string) => void;
  onQuotaHit: () => void;
}

export default function Recorder({ canRecord, onSave, onQuotaHit }: RecorderProps) {
  const { state, finalText, interimText, durationMs, start, stop, reset, error } = useSpeech();
  const [lang, setLang] = useState("en-US");
  // After stopping, user can tweak the text before saving.
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const recording = state === "recording";
  const unsupported = state === "unsupported";

  // Auto-scroll transcript as it grows
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [finalText, interimText]);

  // Enforce the per-note max duration (free tier).
  useEffect(() => {
    if (recording && durationMs >= MAX_DURATION_MS) {
      stop();
    }
  }, [recording, durationMs, stop]);

  // When recording stops with content, move to edit mode.
  useEffect(() => {
    if (state === "idle" && finalText && !editing) {
      setDraft(finalText);
      setEditing(true);
    }
  }, [state, finalText, editing]);

  function handleMicClick() {
    if (recording) {
      stop();
      return;
    }
    if (!canRecord) {
      onQuotaHit();
      return;
    }
    setEditing(false);
    setDraft("");
    start(lang);
  }

  function handleSave() {
    const text = draft.trim();
    if (!text) return;
    onSave(text, durationMs, lang);
    reset();
    setDraft("");
    setEditing(false);
  }

  function handleDiscard() {
    reset();
    setDraft("");
    setEditing(false);
  }

  const mm = formatDuration(durationMs);
  const showingTranscript = recording || (state === "idle" && finalText && !editing);

  return (
    <div className={s.recorder}>
      <div className={s.recHead}>
        {recording ? (
          <>
            <span className="rec-dot" />
            <span className={s.lbl}>Recording</span>
          </>
        ) : (
          <span className={s.lbl}>{editing ? "Review & save" : "Ready"}</span>
        )}
        <span className={s.timer}>{mm}</span>
        <span className={s.spacer} />
        <select
          className={s.langSelect}
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          disabled={recording}
          aria-label="Transcription language"
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      {unsupported && (
        <div className={s.unsupportedBox}>
          Your browser doesn&apos;t support live voice transcription. Try Chrome, Edge, or Safari —
          or type your note below and save it.
        </div>
      )}

      {error && <div className={s.errorBox}>{error}</div>}

      <div className={s.recBody} ref={bodyRef}>
        {editing ? (
          <textarea
            className={s.recText}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Your transcript…"
            autoFocus
          />
        ) : showingTranscript ? (
          <div className={s.recTranscript}>
            {finalText}
            {interimText && <span className={s.recInterim}> {interimText}</span>}
            {recording && <span className="caret" />}
          </div>
        ) : unsupported ? (
          <textarea
            className={s.recText}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (!editing) setEditing(true);
            }}
            placeholder="Type your note here…"
          />
        ) : (
          <div className={s.recEmpty}>
            Press the mic and start talking. Your words appear here in real time.
          </div>
        )}
      </div>

      <div className={s.recFoot}>
        {recording ? (
          <div className={s.waveLive}>
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className="wave-bar"
                style={{ animationDelay: i * 0.05 + "s", height: 8 + (i % 5) * 4 }}
              />
            ))}
          </div>
        ) : editing ? (
          <span className={s.recHint}>Edit anything that came out wrong, then save.</span>
        ) : (
          <span className={s.recHint}>
            {canRecord ? "Up to 5 minutes per note." : "You've used today's free notes."}
          </span>
        )}

        <div className={s.recActions}>
          {editing && (
            <>
              <button className="btn ghost" onClick={handleDiscard}>Discard</button>
              <button className="btn primary" onClick={handleSave} disabled={!draft.trim()}>
                <CheckIcon size={15} /> Save note
              </button>
            </>
          )}
          {!editing && (
            <button
              className={`${s.micBtn} ${recording ? s.recording : ""}`}
              onClick={handleMicClick}
              disabled={unsupported}
              aria-label={recording ? "Stop recording" : "Start recording"}
            >
              {recording ? <StopIcon size={16} /> : <MicIcon size={22} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
