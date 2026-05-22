"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingStatus =
  | "idle"
  | "requesting"
  | "listening"
  | "uploading"
  | "transcribing"
  | "error";

interface UseVoiceRecorderOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onAudioReady?: (blob: Blob) => void;
  onError?: (msg: string) => void;
  useWhisperFallback?: boolean; // if true, skip Web Speech API and use Whisper only
}

interface UseVoiceRecorderReturn {
  status: RecordingStatus;
  interim: string;
  start: () => void;
  stop: () => void;
  isSupported: boolean;
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
  onAudioReady,
  onError,
  useWhisperFallback = false,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [interim, setInterim] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isSpeechApiSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const isSupported =
    typeof window !== "undefined" && "mediaDevices" in navigator;

  const stopMediaRecorder = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    // Stop speech recognition
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    // Stop media recorder — onstop will fire and deliver the blob
    stopMediaRecorder();

    setInterim("");
  }, [stopMediaRecorder]);

  const start = useCallback(async () => {
    setStatus("requesting");
    setInterim("");

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

    // ── MediaRecorder (always runs — captures audio for Whisper) ──────────
    audioChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "audio/ogg";

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];
      if (blob.size > 1000) {
        onAudioReady?.(blob);
      }
    };

    mediaRecorder.start(250); // collect in 250ms chunks

    // ── Web Speech API (real-time, only if supported and not forced Whisper) ──
    if (!useWhisperFallback && isSpeechApiSupported) {
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
          onTranscript(finalText, true);
          setInterim("");
        }
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech") return; // non-fatal, keep recording
        const msg =
          event.error === "not-allowed"
            ? "Microphone access denied."
            : `Voice error: ${event.error}`;
        onError?.(msg);
      };

      recognition.onend = () => {
        // Restart if still meant to be listening
        if (recognitionRef.current) {
          try { recognition.start(); } catch { /* already started */ }
        }
      };

      try {
        recognition.start();
      } catch {
        onError?.("Could not start voice recognition.");
      }
    } else {
      // Whisper-only mode — no real-time transcript, just show recording status
      setStatus("listening");
    }
  }, [isSpeechApiSupported, useWhisperFallback, onTranscript, onAudioReady, onError]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      stopMediaRecorder();
    };
  }, [stopMediaRecorder]);

  return { status, interim, start, stop, isSupported, isSpeechApiSupported };
}
