"use client";

import { Mic, MicOff, Loader2 } from "lucide-react";
import type { RecordingStatus } from "@/lib/hooks/useVoiceRecorder";

interface MicButtonProps {
  status: RecordingStatus;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  invertOnActive?: boolean;
}

export function MicButton({ status, onStart, onStop, disabled, invertOnActive }: MicButtonProps) {
  const isListening = status === "listening";
  const isLoading = status === "requesting" || status === "processing";
  const isError = status === "error";

  function handleClick() {
    if (isListening) {
      onStop();
    } else if (status === "idle" || isError) {
      onStart();
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={isListening ? "Stop recording" : "Start voice recording"}
      className="relative flex items-center justify-center rounded-full transition-all disabled:opacity-40"
      style={{
        width: 32,
        height: 32,
        background: "transparent",
        color: invertOnActive && isListening
          ? "#000"
          : isListening
          ? "var(--accent)"
          : isError
          ? "var(--destructive)"
          : "var(--text-muted)",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!isListening && !isError)
          (e.currentTarget as HTMLElement).style.color = "var(--text)";
      }}
      onMouseLeave={(e) => {
        if (!isListening && !isError)
          (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
      }}
    >
      {isLoading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : isListening ? (
        <MicOff size={15} />
      ) : (
        <Mic size={15} />
      )}
    </button>
  );
}
