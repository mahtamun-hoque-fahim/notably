"use client";

import { useEffect, useRef, useState } from "react";
import s from "../app/app/app.module.css";
import { useSpeech } from "@/lib/useSpeech";
import { useMediaRecorder } from "@/lib/useMediaRecorder";
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
  signedIn: boolean;
  onSave: (text: string, durationMs: number, lang: string) => void;
  onQuotaHit: () => void;
}

export default function Recorder({ canRecord, signedIn, onSave, onQuotaHit }: RecorderProps) {
  const speech = useSpeech();
  const media = useMediaRecorder();
  const [lang, setLang] = useState("en-US");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  // Captured duration of the just-finished recording, used when saving.
  const [savedDuration, setSavedDuration] = useState(0);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const fallback = speech.state === "unsupported";

  // ── Web Speech path state ──
  const speechRecording = !fallback && speech.state === "recording";
  // ── Whisper fallback path state ──
  const mediaRecording = fallback && media.state === "recording";
  const transcribing = fallback && media.state === "transcribing";

  const recording = speechRecording || mediaRecording;
  const liveDuration = fallback ? media.durationMs : speech.durationMs;
  const error = fallback ? media.error : speech.error;

  // Auto-scroll the live transcript (speech path only).
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [speech.finalText, speech.interimText]);

  // Enforce per-note max duration on the speech path.
  useEffect(() => {
    if (speechRecording && speech.durationMs >= MAX_DURATION_MS) speech.stop();
  }, [speechRecording, speech]);

  // Speech path: when recording stops with content, move to review.
  useEffect(() => {
    if (!fallback && speech.state === "idle" && speech.finalText && !editing) {
      setDraft(speech.finalText);
      setSavedDuration(speech.durationMs);
      setEditing(true);
    }
  }, [fallback, speech.state, speech.finalText, speech.durationMs, editing]);

  async function handleMicClick() {
    if (recording) {
      if (fallback) {
        const dur = media.durationMs;
        const text = await media.stopAndTranscribe(lang);
        if (text) {
          setDraft(text);
          setSavedDuration(dur);
          setEditing(true);
        }
      } else {
        speech.stop();
      }
      return;
    }
    if (!canRecord) {
      onQuotaHit();
      return;
    }
    setEditing(false);
    setDraft("");
    if (fallback) await media.start();
    else speech.start(lang);
  }

  function handleSave() {
    const text = draft.trim();
    if (!text) return;
    onSave(text, savedDuration || liveDuration, lang);
    reset();
  }

  function reset() {
    speech.reset();
    media.cancel();
    setDraft("");
    setEditing(false);
    setSavedDuration(0);
  }

  const mm = formatDuration(editing ? savedDuration : liveDuration);
  const showingLiveTranscript = speechRecording || (!fallback && speech.state === "idle" && speech.finalText && !editing);

  // The manual-typing textarea is the last resort: fallback browser, not
  // recording/transcribing, and not already in review of a transcript.
  const showTypeBox = fallback && !mediaRecording && !transcribing && !editing;

  let headLabel = "Ready";
  if (recording) headLabel = "Recording";
  else if (transcribing) headLabel = "Transcribing…";
  else if (editing) headLabel = "Review & save";

  return (
    <div className={s.recorder}>
      <div className={s.recHead}>
        {recording ? (
          <>
            <span className="rec-dot" />
            <span className={s.lbl}>{headLabel}</span>
          </>
        ) : (
          <span className={s.lbl}>{headLabel}</span>
        )}
        <span className={s.timer}>{mm}</span>
        <span className={s.spacer} />
        <select
          className={s.langSelect}
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          disabled={recording || transcribing}
          aria-label="Transcription language"
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      {fallback && (
        <div className={s.unsupportedBox}>
          {signedIn
            ? "Live transcription isn't available in this browser, so we'll transcribe your recording in the cloud when you stop. You can also type a note below."
            : "Live transcription isn't available in this browser. Sign in to use cloud transcription, or type your note below."}
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
        ) : transcribing ? (
          <div className={s.recEmpty}>Transcribing your recording…</div>
        ) : mediaRecording ? (
          <div className={s.recEmpty}>Recording… your transcript appears when you press stop.</div>
        ) : showingLiveTranscript ? (
          <div className={s.recTranscript}>
            {speech.finalText}
            {speech.interimText && <span className={s.recInterim}> {speech.interimText}</span>}
            {speechRecording && <span className="caret" />}
          </div>
        ) : showTypeBox ? (
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
        ) : transcribing ? (
          <span className={s.recHint}>Hang tight — this usually takes a few seconds.</span>
        ) : (
          <span className={s.recHint}>
            {canRecord ? "Up to 5 minutes per note." : "You've used today's free notes."}
          </span>
        )}

        <div className={s.recActions}>
          {editing ? (
            <>
              <button className="btn ghost" onClick={reset}>Discard</button>
              <button className="btn primary" onClick={handleSave} disabled={!draft.trim()}>
                <CheckIcon size={15} /> Save note
              </button>
            </>
          ) : (
            <button
              className={`${s.micBtn} ${recording ? s.recording : ""}`}
              onClick={handleMicClick}
              disabled={transcribing}
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
