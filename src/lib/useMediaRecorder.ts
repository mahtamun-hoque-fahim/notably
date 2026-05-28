"use client";

import { useCallback, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "transcribing";

export interface UseMediaRecorderReturn {
  state: RecorderState;
  durationMs: number;
  error: string | null;
  start: () => Promise<void>;
  stopAndTranscribe: (lang: string) => Promise<string | null>;
  cancel: () => void;
}

// Records mic audio with MediaRecorder and sends it to /api/transcribe (Whisper).
// Used only when the Web Speech API is unavailable (e.g. Firefox).
export function useMediaRecorder(): UseMediaRecorderReturn {
  const [state, setState] = useState<RecorderState>("idle");
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const teardown = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setDurationMs(0);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = rec;
      rec.start();
      startedAtRef.current = Date.now();
      setState("recording");
      timerRef.current = window.setInterval(() => {
        setDurationMs(Date.now() - startedAtRef.current);
      }, 250);
    } catch {
      setError("Couldn't access the microphone. Check permissions and try again.");
      setState("idle");
    }
  }, []);

  const stopAndTranscribe = useCallback(
    async (lang: string): Promise<string | null> => {
      const rec = recorderRef.current;
      if (!rec) return null;

      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const blob: Blob = await new Promise((resolve) => {
        rec.onstop = () => resolve(new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" }));
        rec.stop();
      });

      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      recorderRef.current = null;

      setState("transcribing");
      try {
        const fd = new FormData();
        fd.append("audio", blob, "audio.webm");
        fd.append("lang", lang);
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        if (!res.ok) {
          if (res.status === 401) setError("Sign in to use cloud transcription in this browser.");
          else if (res.status === 503) setError("Cloud transcription isn't enabled on this deployment.");
          else setError("Transcription failed. You can type your note instead.");
          setState("idle");
          return null;
        }
        const data = (await res.json()) as { text?: string };
        setState("idle");
        return data.text ?? "";
      } catch {
        setError("Transcription failed. You can type your note instead.");
        setState("idle");
        return null;
      }
    },
    []
  );

  const cancel = useCallback(() => {
    try {
      recorderRef.current?.stop();
    } catch {
      /* ignore */
    }
    teardown();
    setState("idle");
    setDurationMs(0);
  }, [teardown]);

  return { state, durationMs, error, start, stopAndTranscribe, cancel };
}
