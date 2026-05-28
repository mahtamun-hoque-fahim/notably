"use client";

import { useEffect, useState } from "react";
import s from "../app/app/app.module.css";
import { CloseIcon, SparkleIcon, CheckIcon } from "./Icons";
import { startCheckoutAction } from "@/lib/actions/billing";

export interface UpgradeModalProps {
  onClose: () => void;
  signedIn: boolean;
  onNeedAuth: () => void;
}

export default function UpgradeModal({ onClose, signedIn, onNeedAuth }: UpgradeModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleGoPro() {
    if (!signedIn) {
      onNeedAuth();
      return;
    }
    setBusy(true);
    setError(null);
    const res = await startCheckoutAction();
    if (res.ok) {
      window.location.href = res.url;
      return;
    }
    setBusy(false);
    if (res.error === "auth") onNeedAuth();
    else if (res.error === "unconfigured") setError("Billing isn't set up on this deployment yet.");
    else setError("Couldn't start checkout. Please try again.");
  }

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className={s.modalHead} style={{ borderBottom: "none", paddingBottom: 0 }}>
          <span />
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={s.modalBody} style={{ paddingTop: 0 }}>
          <div className={s.upgrade}>
            <span className={s.badge}><SparkleIcon size={26} /></span>
            <h2>
              That&apos;s five for today. <span className="serif">Want more?</span>
            </h2>
            <p>
              You&apos;ve used all five free notes for today. They reset at midnight — or go Pro for
              unlimited notes, longer recordings, and auto-summaries.
            </p>
            {error && <div className={s.authError} style={{ marginBottom: 16 }}>{error}</div>}
            <div className={s.upgradeActions}>
              <button className="btn primary lg" onClick={handleGoPro} disabled={busy}>
                {busy ? "Starting checkout…" : "Go Pro — $5/mo"}
              </button>
              <button className="btn outline lg" onClick={onClose}>
                Maybe later
              </button>
            </div>
            <div className={s.upgradeNote}>
              <CheckIcon size={12} style={{ verticalAlign: -1, marginRight: 4, color: "var(--sage)" }} />
              {signedIn
                ? "Cancel anytime from your account."
                : "Free notes reset every day at midnight, your time."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
