"use client";

import { useEffect, useState } from "react";
import s from "../app/app/app.module.css";
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  MailIcon,
  NotionIcon,
  SlackIcon,
} from "./Icons";
import { copyToClipboard, downloadMarkdown, noteToMarkdown } from "@/lib/export";
import type { Note } from "@/lib/notes";
import { exportNoteAction, type ExportTarget } from "@/lib/actions/integrations";

export interface Connections {
  slack: boolean;
  notion: boolean;
  emailConfigured: boolean;
}

export interface ExportModalProps {
  note: Note;
  isPro: boolean;
  signedIn: boolean;
  connections: Connections;
  accountEmail?: string | null;
  onClose: () => void;
  onNeedUpgrade: () => void;
  onManageIntegrations: () => void;
}

type Status = { kind: "idle" | "ok" | "error"; msg?: string; on?: string };

export default function ExportModal({
  note,
  isPro,
  signedIn,
  connections,
  accountEmail,
  onClose,
  onNeedUpgrade,
  onManageIntegrations,
}: ExportModalProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState(accountEmail ?? "");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleCopy() {
    const ok = await copyToClipboard(noteToMarkdown(note));
    setStatus(ok ? { kind: "ok", on: "copy" } : { kind: "error", msg: "Couldn't copy" });
  }

  function handleDownload() {
    downloadMarkdown(note);
    setStatus({ kind: "ok", on: "download" });
  }

  async function runExport(target: ExportTarget) {
    if (!isPro) {
      onNeedUpgrade();
      return;
    }
    setBusy(target);
    setStatus({ kind: "idle" });
    const res = await exportNoteAction(note.id, target, target === "email" ? email : undefined);
    setBusy(null);
    if (res.ok) {
      setStatus({ kind: "ok", on: target });
    } else if (res.error === "notconnected") {
      setStatus({ kind: "error", msg: "Connect this first in Integrations." });
    } else if (res.error === "unconfigured") {
      setStatus({ kind: "error", msg: "Email isn't enabled on this deployment." });
    } else if (res.error === "pro") {
      onNeedUpgrade();
    } else {
      setStatus({ kind: "error", msg: "Export failed. Try again." });
    }
  }

  const okOn = status.kind === "ok" ? status.on : undefined;

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className={s.modalHead}>
          <div style={{ fontFamily: "var(--font-instrument), serif", fontSize: 22 }}>Export note</div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={s.modalBody}>
          {status.kind === "error" && (
            <div className={s.authError} style={{ marginBottom: 14 }}>{status.msg}</div>
          )}

          <div className={s.exportList}>
            <button className={s.exportRow} onClick={handleCopy}>
              <span className={s.exportIcon}><CopyIcon size={18} /></span>
              <span className={s.exportText}>
                <span className={s.t}>Copy as Markdown</span>
                <span className={s.d}>To paste anywhere</span>
              </span>
              {okOn === "copy" && <span className={s.exportStatus}><CheckIcon size={14} /> Copied</span>}
            </button>

            <button className={s.exportRow} onClick={handleDownload}>
              <span className={s.exportIcon}><DownloadIcon size={18} /></span>
              <span className={s.exportText}>
                <span className={s.t}>Download .md</span>
                <span className={s.d}>Save the file to your device</span>
              </span>
              {okOn === "download" && <span className={s.exportStatus}><CheckIcon size={14} /> Saved</span>}
            </button>
          </div>

          <div className={s.exportDivider}>Send to</div>

          <div className={s.exportList}>
            {/* Email */}
            <div>
              <button
                className={s.exportRow}
                onClick={() => runExport("email")}
                disabled={busy !== null}
              >
                <span className={s.exportIcon}><MailIcon size={18} /></span>
                <span className={s.exportText}>
                  <span className={s.t}>Email</span>
                  <span className={s.d}>Send this note to an inbox</span>
                </span>
                {!isPro ? (
                  <span className={s.proTag}>Pro</span>
                ) : okOn === "email" ? (
                  <span className={s.exportStatus}><CheckIcon size={14} /> Sent</span>
                ) : busy === "email" ? (
                  <span className={`${s.exportStatus} ${s.muted}`}>Sending…</span>
                ) : null}
              </button>
              {isPro && (
                <div className={s.emailField}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="recipient@email.com"
                  />
                </div>
              )}
            </div>

            {/* Slack */}
            <button
              className={s.exportRow}
              onClick={() => (isPro && !connections.slack ? onManageIntegrations() : runExport("slack"))}
              disabled={busy !== null}
            >
              <span className={s.exportIcon}><SlackIcon size={18} /></span>
              <span className={s.exportText}>
                <span className={s.t}>Slack</span>
                <span className={s.d}>
                  {isPro && !connections.slack ? "Connect a channel webhook" : "Post to your channel"}
                </span>
              </span>
              {!isPro ? (
                <span className={s.proTag}>Pro</span>
              ) : okOn === "slack" ? (
                <span className={s.exportStatus}><CheckIcon size={14} /> Sent</span>
              ) : busy === "slack" ? (
                <span className={`${s.exportStatus} ${s.muted}`}>Sending…</span>
              ) : !connections.slack ? (
                <span className={`${s.exportStatus} ${s.muted}`}>Connect</span>
              ) : null}
            </button>

            {/* Notion */}
            <button
              className={s.exportRow}
              onClick={() => (isPro && !connections.notion ? onManageIntegrations() : runExport("notion"))}
              disabled={busy !== null}
            >
              <span className={s.exportIcon}><NotionIcon size={18} /></span>
              <span className={s.exportText}>
                <span className={s.t}>Notion</span>
                <span className={s.d}>
                  {isPro && !connections.notion ? "Connect a workspace page" : "Add as a new page"}
                </span>
              </span>
              {!isPro ? (
                <span className={s.proTag}>Pro</span>
              ) : okOn === "notion" ? (
                <span className={s.exportStatus}><CheckIcon size={14} /> Added</span>
              ) : busy === "notion" ? (
                <span className={`${s.exportStatus} ${s.muted}`}>Sending…</span>
              ) : !connections.notion ? (
                <span className={`${s.exportStatus} ${s.muted}`}>Connect</span>
              ) : null}
            </button>
          </div>

          {isPro && (
            <div className={s.manageLink}>
              <button onClick={onManageIntegrations}>Manage integrations</button>
            </div>
          )}
          {!signedIn && (
            <div className={s.upgradeNote} style={{ textAlign: "center", marginTop: 14 }}>
              Copy and download work offline. Sign in &amp; go Pro to send to email, Slack, or Notion.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
