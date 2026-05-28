"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal types — Web Speech API isn't in lib.dom by default.
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  readonly length: number;
  [idx: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [idx: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export type SpeechState = "idle" | "recording" | "paused" | "unsupported";

export interface UseSpeechReturn {
  state: SpeechState;
  finalText: string;
  interimText: string;
  durationMs: number;
  start: (lang?: string) => void;
  stop: () => void;
  reset: () => void;
  error: string | null;
}

export function useSpeech(): UseSpeechReturn {
  const [state, setState] = useState<SpeechState>("idle");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  // Stop in progress — distinguish user-stop from network-restart.
  const stoppingRef = useRef(false);

  // Detect support on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      setState("unsupported");
    }
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(
    (lang = "en-US") => {
      if (typeof window === "undefined") return;
      const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (!Ctor) {
        setState("unsupported");
        return;
      }

      setError(null);
      setFinalText("");
      setInterimText("");
      setDurationMs(0);

      const r = new Ctor();
      r.continuous = true;
      r.interimResults = true;
      r.lang = lang;

      r.onresult = (ev: SpeechRecognitionEvent) => {
        let interim = "";
        let finalDelta = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          const t = res[0]?.transcript ?? "";
          if (res.isFinal) finalDelta += t;
          else interim += t;
        }
        if (finalDelta) {
          setFinalText((prev) => (prev ? prev + " " + finalDelta.trim() : finalDelta.trim()));
        }
        setInterimText(interim);
      };

      r.onerror = (ev: SpeechRecognitionErrorEvent) => {
        // "no-speech" and "aborted" are normal; surface only real failures.
        if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
          setError("Microphone permission denied. Allow mic access and try again.");
          stoppingRef.current = true;
        } else if (ev.error === "audio-capture") {
          setError("No microphone found.");
          stoppingRef.current = true;
        } else if (ev.error !== "no-speech" && ev.error !== "aborted") {
          setError(`Recognition error: ${ev.error}`);
        }
      };

      r.onend = () => {
        // Chrome stops continuous recognition after silence — auto-restart unless user stopped.
        if (!stoppingRef.current && recognitionRef.current === r) {
          try {
            r.start();
            return;
          } catch {
            /* fall through */
          }
        }
        setState("idle");
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recognitionRef.current = r;
      stoppingRef.current = false;
      startedAtRef.current = Date.now();

      try {
        r.start();
        setState("recording");
        timerRef.current = window.setInterval(() => {
          setDurationMs(Date.now() - startedAtRef.current);
        }, 250);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start recording.");
        setState("idle");
      }
    },
    []
  );

  const stop = useCallback(() => {
    stoppingRef.current = true;
    setInterimText("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState("idle");
  }, []);

  const reset = useCallback(() => {
    cleanup();
    stoppingRef.current = false;
    setFinalText("");
    setInterimText("");
    setDurationMs(0);
    setError(null);
    setState("idle");
  }, [cleanup]);

  return { state, finalText, interimText, durationMs, start, stop, reset, error };
}
