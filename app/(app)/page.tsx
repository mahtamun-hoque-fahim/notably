"use client";

import { Mic, FileText, Folder } from "lucide-react";

const tips = [
  { icon: FileText, text: "Press ⌘N to create a new note instantly" },
  { icon: Mic,      text: "Click the mic button to dictate with your voice" },
  { icon: Folder,   text: "Organise notes into folders from the sidebar" },
];

export default function AppHomePage() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-8 px-8"
      style={{ color: "var(--text-muted)" }}
    >
      {/* Logo mark */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--accent-dim)", border: "1px solid rgba(0,230,118,0.2)" }}
      >
        <FileText size={24} style={{ color: "var(--accent)" }} />
      </div>

      {/* Heading */}
      <div className="text-center">
        <h2
          className="text-xl font-bold mb-1"
          style={{ fontFamily: "var(--font-syne)", color: "var(--text)" }}
        >
          No note selected
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Choose a note from the sidebar or create a new one
        </p>
      </div>

      {/* Tips */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {tips.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent-dim)" }}
            >
              <Icon size={13} style={{ color: "var(--accent)" }} />
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
