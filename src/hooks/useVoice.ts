"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceState = "idle" | "listening" | "processing" | "error" | "unsupported";

interface UseVoiceOptions {
  onFinalResult?: (text: string) => void;
  onInterimResult?: (text: string) => void;
  lang?: string;
}

interface UseVoiceReturn {
  state: VoiceState;
  interimText: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggle: () => void;
}


export function useVoice({
  onFinalResult,
  onInterimResult,
  lang = "en-US",
}: UseVoiceOptions = {}): UseVoiceReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalBufferRef = useRef<string>("");

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const buildRecognition = useCallback(() => {
    if (!isSupported) return null;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setState("listening");
      setError(null);
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += t + " ";
        } else {
          interim += t;
        }
      }
      if (final) {
        finalBufferRef.current += final;
        onFinalResult?.(finalBufferRef.current.trim());
      }
      setInterimText(interim);
      onInterimResult?.(interim);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      const msgs: Record<string, string> = {
        "not-allowed": "Microphone access denied. Please allow microphone permissions.",
        "no-speech": "No speech detected. Try again.",
        "audio-capture": "No microphone found.",
        "network": "Network error during transcription.",
      };
      setError(msgs[e.error] ?? `Recognition error: ${e.error}`);
      setState("error");
    };

    rec.onend = () => {
      if (state !== "error") setState("idle");
      setInterimText("");
    };

    return rec;
  }, [isSupported, lang, onFinalResult, onInterimResult, state]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setState("unsupported");
      setError("Your browser doesn't support voice recognition. Try Chrome or Edge.");
      return;
    }
    finalBufferRef.current = "";
    const rec = buildRecognition();
    if (!rec) return;
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setError("Could not start recording.");
      setState("error");
    }
  }, [isSupported, buildRecognition]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState("idle");
    setInterimText("");
  }, []);

  const toggle = useCallback(() => {
    if (state === "listening") {
      stopListening();
    } else {
      startListening();
    }
  }, [state, startListening, stopListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    state,
    interimText,
    error,
    isSupported,
    startListening,
    stopListening,
    toggle,
  };
}
