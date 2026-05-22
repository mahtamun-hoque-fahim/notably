"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingStatus =
  | "idle"
  | "requesting"
  | "listening"
  | "transcribing"
  | "error";

interface UseVoiceRecorderOptions {
  /** Fired for each final Web Speech API result (real-time path) */
  onTranscript: (text: string) => void;
  /** Fired when Groq returns the transcript (fallback path) */
  onGroqTranscript?: (text: string) => void;
  onError?: (msg: string) => void;
}

interface UseVoiceRecorderReturn {
  status: RecordingStatus;
  interim: string;
  start: () => void;
  stop: () => void;
  isSpeechApiSupported: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function useVoiceRecorder({
  onTranscript,
  onGroqTranscript,
  onError,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [interim, setInterim] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");

  const isSpeechApiSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Send audio blob to Groq via our API route
  const transcribeWithGroq = useCallback(
    async (blob: Blob) => {
      if (blob.size < 1000) return; // too small to be real speech
      setStatus("transcribing");
      try {
        const fd = new FormData();
        fd.append(
          "audio",
          new File([blob], "recording.webm", { type: blob.type })
        );
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        const data = await res.json();
        if (data.transcript) {
          onGroqTranscript?.(data.transcript);
        }
      } catch {
        onError?.("Transcription failed. Please try again.");
      } finally {
        setStatus("idle");
      }
    },
    [onGroqTranscript, onError]
  );

  const stopMediaRecorder = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop(); // triggers onstop → blob assembled
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    // Stop media recorder — if fallback mode, onstop triggers Groq
    stopMediaRecorder();
    setInterim("");
    if (isSpeechApiSupported) setStatus("idle");
    // else status transitions to "transcribing" inside transcribeWithGroq
  }, [isSpeechApiSupported, stopMediaRecorder]);

  const start = useCallback(async () => {
    setStatus("requesting");
    setInterim("");

    // Request mic access
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch {
      onError?.("Microphone access denied. Please allow microphone permissions.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    // ── MediaRecorder (always runs for Groq fallback) ─────────────────────
    audioChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "audio/ogg";

    mimeTypeRef.current = mimeType;
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
      audioChunksRef.current = [];
      // Only send to Groq if Web Speech API was NOT available (fallback mode)
      if (!isSpeechApiSupported) {
        transcribeWithGroq(blob);
      }
    };

    mediaRecorder.start(250);

    // ── Web Speech API (real-time, Chrome/Edge) ───────────────────────────
    if (isSpeechApiSupported) {
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
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += t;
          else interimText += t;
        }
        setInterim(interimText);
        if (finalText) {
          onTranscript(finalText.trim());
          setInterim("");
        }
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech") return; // non-fatal
        onError?.(
          event.error === "not-allowed"
            ? "Microphone access denied."
            : `Voice error: ${event.error}`
        );
      };

      recognition.onend = () => {
        if (recognitionRef.current) {
          try { recognition.start(); } catch { /* already started */ }
        }
      };

      try { recognition.start(); } catch {
        onError?.("Could not start voice recognition.");
      }
    } else {
      // Groq fallback — just show listening state
      setStatus("listening");
    }
  }, [isSpeechApiSupported, onTranscript, onError, transcribeWithGroq]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      stopMediaRecorder();
    };
  }, [stopMediaRecorder]);

  return { status, interim, start, stop, isSpeechApiSupported };
}
