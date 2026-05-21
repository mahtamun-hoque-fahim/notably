"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signUp.email({ name, email, password });
    setLoading(false);
    if (err) {
      setError(err.message ?? "Sign up failed");
      return;
    }
    router.push("/app");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Brand */}
        <div className="text-center">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-syne)", color: "var(--text)" }}
          >
            Notably
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Voice-powered note taking
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-6 rounded-lg border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--text)" }}
          >
            Create account
          </h2>

          {error && (
            <p
              className="text-xs px-3 py-2 rounded"
              style={{
                background: "var(--destructive-dim)",
                color: "var(--destructive)",
              }}
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="px-3 py-2 rounded text-sm border outline-none transition-colors"
              style={{
                background: "var(--surface-elevated)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="px-3 py-2 rounded text-sm border outline-none transition-colors"
              style={{
                background: "var(--surface-elevated)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="px-3 py-2 rounded text-sm border outline-none transition-colors"
              style={{
                background: "var(--surface-elevated)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 py-2 rounded text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Create account
          </button>

          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link
              href="/sign-in"
              style={{ color: "var(--accent)" }}
              className="hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
