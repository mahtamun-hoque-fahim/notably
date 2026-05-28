"use client";

import { useEffect } from "react";
import s from "../app/app/app.module.css";
import { CloseIcon, SparkleIcon, CheckIcon } from "./Icons";

export interface UpgradeModalProps {
  onClose: () => void;
}

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
            <div className={s.upgradeActions}>
              <button className="btn primary lg" disabled title="Billing coming soon">
                Go Pro — $5/mo
              </button>
              <button className="btn outline lg" onClick={onClose}>
                Maybe later
              </button>
            </div>
            <div className={s.upgradeNote}>
              <CheckIcon size={12} style={{ verticalAlign: -1, marginRight: 4, color: "var(--sage)" }} />
              Free notes reset every day at midnight, your time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
