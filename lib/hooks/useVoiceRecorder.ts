"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingStatus =
  | "idle"
  | "requesting"
  | "listening"
  | "processing"
  | "error";

interface UseVoiceRecorderOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (msg: string) => void;
}

interface UseVoiceRecorderReturn {
  status: RecordingStatus;
  interim: string;
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

// Augment window for webkit prefix
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function useVoiceRecorder({
  onTranscript,
  onError,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus("idle");
    setInterim("");
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      onError?.("Voice input is not supported in this browser.");
      setStatus("error");
      return;
    }

    setStatus("requesting");

    const SpeechRecognitionClass =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event) => {
      let interimText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      setInterim(interimText);

      if (finalText) {
        onTranscript(finalText, true);
        setInterim("");
      }
    };

    recognition.onerror = (event) => {
      const msg =
        event.error === "not-allowed"
          ? "Microphone access denied. Please allow microphone permissions."
          : event.error === "no-speech"
          ? "No speech detected. Try again."
          : `Voice error: ${event.error}`;
      onError?.(msg);
      setStatus("error");
      recognitionRef.current = null;
      setTimeout(() => setStatus("idle"), 3000);
    };

    recognition.onend = () => {
      // Restart if still meant to be listening (continuous mode can cut off)
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started
        }
      }
    };

    try {
      recognition.start();
    } catch {
      onError?.("Could not start voice recognition.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [isSupported, onTranscript, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  return { status, interim, start, stop, isSupported };
}
