"use client";

import type { Note } from "@/lib/notes";

// Render a note as Markdown — used for copy-to-clipboard and .md download.
export function noteToMarkdown(note: Note): string {
  const lines: string[] = [`# ${note.title}`, ""];
  if (note.summary) {
    lines.push(`> ${note.summary}`, "");
  }
  lines.push(note.body.trim(), "");
  if (note.tags && note.tags.length > 0) {
    lines.push(note.tags.map((t) => `#${t}`).join(" "), "");
  }
  const date = new Date(note.createdAt).toLocaleString();
  lines.push(`---`, `*Captured with Notably · ${date}*`);
  return lines.join("\n");
}

export function noteToPlainText(note: Note): string {
  const parts: string[] = [note.title];
  if (note.summary) parts.push("", note.summary);
  parts.push("", note.body.trim());
  if (note.tags && note.tags.length > 0) parts.push("", note.tags.map((t) => `#${t}`).join(" "));
  return parts.join("\n");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadMarkdown(note: Note): void {
  const md = noteToMarkdown(note);
  const slug =
    note.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "note";
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
