import { FileText } from "lucide-react";

export default function AppHomePage() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-3"
      style={{ color: "var(--text-muted)" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: "var(--accent-dim)" }}
      >
        <FileText size={22} style={{ color: "var(--accent)" }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
          Select a note to open it
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Or create a new one from the sidebar
        </p>
      </div>
    </div>
  );
}
