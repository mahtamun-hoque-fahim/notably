"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type WhisperStatus =
  | "idle"
  | "loading"     // downloading model (~40MB, first time only)
  | "transcribing"
  | "error";

interface UseWhisperTranscriberReturn {
  transcribe: (audioBlob: Blob) => Promise<string>;
  status: WhisperStatus;
  loadProgress: number; // 0–100
  error: string;
}

let workerRef: Worker | null = null;

export function useWhisperTranscriber(): UseWhisperTranscriberReturn {
  const [status, setStatus] = useState<WhisperStatus>("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState("");
  const pendingRef = useRef<Map<string, { resolve: (t: string) => void; reject: (e: Error) => void }>>(new Map());

  useEffect(() => {
    // Initialise shared worker once
    if (!workerRef && typeof window !== "undefined") {
      workerRef = new Worker("/whisper-worker.js", { type: "module" });
    }

    const worker = workerRef;
    if (!worker) return;

    const handler = (event: MessageEvent) => {
      const { type, id, transcript, message, progress } = event.data;
      const pending = pendingRef.current.get(id);

      if (type === "loading") {
        setStatus("loading");
        if (progress?.progress != null) {
          setLoadProgress(Math.round(progress.progress));
        }
      }

      if (type === "transcribing") {
        setStatus("transcribing");
        setLoadProgress(100);
      }

      if (type === "done" && pending) {
        pendingRef.current.delete(id);
        setStatus("idle");
        setLoadProgress(0);
        pending.resolve(transcript ?? "");
      }

      if (type === "error" && pending) {
        pendingRef.current.delete(id);
        setStatus("error");
        setError(message ?? "Transcription failed");
        pending.reject(new Error(message));
        setTimeout(() => { setStatus("idle"); setError(""); }, 4000);
      }
    };

    worker.addEventListener("message", handler);
    return () => worker.removeEventListener("message", handler);
  }, []);

  const transcribe = useCallback(async (audioBlob: Blob): Promise<string> => {
    const worker = workerRef;
    if (!worker) throw new Error("Worker not ready");

    setStatus("loading");
    setError("");

    // Convert blob to Float32Array (16kHz mono PCM)
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0); // mono

    const id = Math.random().toString(36).slice(2);

    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });
      worker.postMessage({ type: "transcribe", id, audio: channelData }, [
        channelData.buffer,
      ]);
    });
  }, []);

  return { transcribe, status, loadProgress, error };
}
