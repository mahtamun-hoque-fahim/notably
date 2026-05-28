"use client";

import { useEffect, useState } from "react";
import s from "../app/app/app.module.css";
import { CloseIcon, MicFilled } from "./Icons";
import { signIn, signUp } from "@/lib/auth-client";

export interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit() {
    setError(null);
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const res =
        mode === "signin"
          ? await signIn.email({ email, password })
          : await signUp.email({ email, password, name: name || email.split("@")[0] });

      // Better Auth returns { data, error }
      const err = (res as { error?: { message?: string } | null })?.error;
      if (err) {
        setError(err.message || "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      onSuccess();
    } catch {
      setError("Couldn't reach the server. Is the database configured?");
      setBusy(false);
    }
  }

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className={s.modalHead}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 600, fontSize: 18 }}>
            <span className={s.brandMic}><MicFilled size={11} /></span>
            notably
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={s.modalBody}>
          <div className={s.authTabs}>
            <button
              className={`${s.authTab} ${mode === "signin" ? s.active : ""}`}
              onClick={() => { setMode("signin"); setError(null); }}
            >
              Sign in
            </button>
            <button
              className={`${s.authTab} ${mode === "signup" ? s.active : ""}`}
              onClick={() => { setMode("signup"); setError(null); }}
            >
              Create account
            </button>
          </div>

          {error && <div className={s.authError}>{error}</div>}

          {mode === "signup" && (
            <div className={s.field}>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          )}
          <div className={s.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yours.com"
              autoComplete="email"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className={s.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <button
            className={`btn primary lg ${s.authSubmit}`}
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <div className={s.authSwitch}>
            {mode === "signin" ? (
              <>New to Notably? <button onClick={() => setMode("signup")}>Create an account</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode("signin")}>Sign in</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
