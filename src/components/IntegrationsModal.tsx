"use client";

import { useEffect, useState } from "react";
import s from "../app/app/app.module.css";
import { CheckIcon, CloseIcon, NotionIcon, SlackIcon } from "./Icons";
import {
  removeConnectionAction,
  saveNotionAction,
  saveSlackAction,
} from "@/lib/actions/integrations";
import type { Connections } from "./ExportModal";

export interface IntegrationsModalProps {
  connections: Connections;
  onClose: () => void;
  onChanged: () => void;
}

export default function IntegrationsModal({ connections, onClose, onChanged }: IntegrationsModalProps) {
  const [slackUrl, setSlackUrl] = useState("");
  const [notionToken, setNotionToken] = useState("");
  const [notionPage, setNotionPage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<{ slack?: string; notion?: string }>({});

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function saveSlack() {
    setBusy("slack");
    setErr((e) => ({ ...e, slack: undefined }));
    const res = await saveSlackAction(slackUrl);
    setBusy(null);
    if (res.ok) {
      setSlackUrl("");
      onChanged();
    } else {
      setErr((e) => ({ ...e, slack: res.error === "invalid" ? "Enter a valid Slack webhook URL." : "Couldn't save." }));
    }
  }

  async function saveNotion() {
    setBusy("notion");
    setErr((e) => ({ ...e, notion: undefined }));
    const res = await saveNotionAction(notionToken, notionPage);
    setBusy(null);
    if (res.ok) {
      setNotionToken("");
      setNotionPage("");
      onChanged();
    } else {
      setErr((e) => ({ ...e, notion: res.error === "invalid" ? "Check the token and page link." : "Couldn't save." }));
    }
  }

  async function disconnect(provider: "slack" | "notion") {
    setBusy(provider);
    await removeConnectionAction(provider);
    setBusy(null);
    onChanged();
  }

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHead}>
          <div style={{ fontFamily: "var(--font-instrument), serif", fontSize: 22 }}>Integrations</div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={s.modalBody}>
          {/* Slack */}
          <div className={s.intGroup}>
            <div className={s.intHead}>
              <span className={s.exportIcon}><SlackIcon size={18} /></span>
              <span className={s.name}>Slack</span>
              {connections.slack && (
                <span className={s.connected}><CheckIcon size={13} /> Connected</span>
              )}
            </div>
            {connections.slack ? (
              <div className={s.intActions}>
                <button className="btn ghost" onClick={() => disconnect("slack")} disabled={busy === "slack"}>
                  Disconnect
                </button>
              </div>
            ) : (
              <>
                <div className={s.intHelp}>
                  Create an{" "}
                  <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noreferrer">
                    incoming webhook
                  </a>{" "}
                  for a channel and paste its URL.
                </div>
                {err.slack && <div className={s.authError} style={{ marginBottom: 10 }}>{err.slack}</div>}
                <div className={s.intField}>
                  <input
                    value={slackUrl}
                    onChange={(e) => setSlackUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/…"
                  />
                </div>
                <div className={s.intActions}>
                  <button className="btn primary" onClick={saveSlack} disabled={busy === "slack" || !slackUrl}>
                    {busy === "slack" ? "Saving…" : "Connect"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Notion */}
          <div className={s.intGroup}>
            <div className={s.intHead}>
              <span className={s.exportIcon}><NotionIcon size={18} /></span>
              <span className={s.name}>Notion</span>
              {connections.notion && (
                <span className={s.connected}><CheckIcon size={13} /> Connected</span>
              )}
            </div>
            {connections.notion ? (
              <div className={s.intActions}>
                <button className="btn ghost" onClick={() => disconnect("notion")} disabled={busy === "notion"}>
                  Disconnect
                </button>
              </div>
            ) : (
              <>
                <div className={s.intHelp}>
                  Create an{" "}
                  <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer">
                    internal integration
                  </a>
                  , share a page with it, then paste the token and that page&apos;s link.
                </div>
                {err.notion && <div className={s.authError} style={{ marginBottom: 10 }}>{err.notion}</div>}
                <div className={s.intField}>
                  <input
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    placeholder="Internal integration token (ntn_… or secret_…)"
                  />
                </div>
                <div className={s.intField}>
                  <input
                    value={notionPage}
                    onChange={(e) => setNotionPage(e.target.value)}
                    placeholder="Notion page link or ID"
                  />
                </div>
                <div className={s.intActions}>
                  <button
                    className="btn primary"
                    onClick={saveNotion}
                    disabled={busy === "notion" || !notionToken || !notionPage}
                  >
                    {busy === "notion" ? "Saving…" : "Connect"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
