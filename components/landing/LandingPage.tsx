"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, FileText, Search, Folder, ArrowRight, Zap } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export function LandingPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [typedText, setTypedText] = useState("");
  const fullText = "Meeting notes for Q3 review. The key takeaway was that…";

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(t);
      }
    }, 38);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes waveBar {
          from { height: var(--min); }
          to   { height: var(--max); }
        }
        @keyframes gridPan {
          from { background-position: 0 0; }
          to   { background-position: 40px 40px; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0; }
        }
        .fadeup { animation: fadeUp 0.7s ease both; }
        .d1 { animation-delay: 0.1s; }
        .d2 { animation-delay: 0.25s; }
        .d3 { animation-delay: 0.4s; }
        .d4 { animation-delay: 0.55s; }
        .d5 { animation-delay: 0.7s; }
      `}</style>

      {/* Grid background */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(rgba(0,230,118,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,230,118,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          animation: "gridPan 8s linear infinite",
        }}
      />

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="fadeup d1"
        style={{
          position: "relative", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 40px",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <span style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
          Notably
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isLoggedIn ? (
            <Link
              href="/app"
              style={{
                fontSize: 13, fontWeight: 600, color: "#000",
                background: "var(--accent)", padding: "6px 16px",
                borderRadius: 6, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              Open app <ArrowRight size={12} />
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", padding: "6px 14px" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                Sign in
              </Link>
              <Link
                href="/demo"
                style={{
                  fontSize: 13, fontWeight: 600, color: "#000",
                  background: "var(--accent)", padding: "6px 16px",
                  borderRadius: 6, textDecoration: "none",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                Try free <ArrowRight size={12} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative", zIndex: 1,
          maxWidth: 900, margin: "0 auto",
          padding: "80px 40px 60px",
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <div className="fadeup d1" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32, padding: "5px 14px", borderRadius: 99, border: "1px solid rgba(0,230,118,0.25)", background: "rgba(0,230,118,0.06)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", boxShadow: "0 0 8px var(--accent)" }} />
          <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>10 free notes/day · No signup needed</span>
        </div>

        {/* Headline */}
        <h1
          className="fadeup d2"
          style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(42px, 7vw, 80px)",
            lineHeight: 1.05, letterSpacing: "-0.03em",
            color: "var(--text)", margin: "0 0 24px",
          }}
        >
          Think out loud.
          <br />
          <span style={{ color: "var(--accent)" }}>Notably</span> remembers.
        </h1>

        <p
          className="fadeup d3"
          style={{ fontSize: 17, color: "var(--text-muted)", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.6 }}
        >
          Voice-powered notes that capture thoughts the moment they strike.
          Speak. It writes itself.
        </p>

        {/* CTAs */}
        <div className="fadeup d4" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
          <Link
            href="/demo"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--accent)", color: "#000",
              padding: "12px 28px", borderRadius: 8,
              fontSize: 14, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 0 32px rgba(0,230,118,0.25)",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Mic size={15} /> Try it now — it&apos;s free
          </Link>
          <Link
            href="/sign-up"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              color: "var(--text-muted)", border: "1px solid var(--border)",
              padding: "12px 22px", borderRadius: 8,
              fontSize: 14, fontWeight: 500, textDecoration: "none",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            Sign up free <ArrowRight size={13} />
          </Link>
        </div>

        <p className="fadeup d4" style={{ fontSize: 12, color: "var(--text-disabled)" }}>
          No credit card · Notes auto-delete after 24h · Try before you commit
        </p>
      </section>

      {/* ── App Mockup ───────────────────────────────────────────────────── */}
      <div className="fadeup d5" style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto 80px", padding: "0 40px" }}>
        <div
          style={{
            borderRadius: 12, border: "1px solid var(--border)",
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* Window chrome */}
          <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "var(--text-disabled)", margin: "0 auto" }}>Notably</span>
          </div>

          {/* App shell */}
          <div style={{ display: "flex", height: 380 }}>
            {/* Sidebar */}
            <div style={{ width: 200, background: "var(--surface)", borderRight: "1px solid var(--border)", padding: "12px 0", flexShrink: 0 }}>
              {/* New note button */}
              <div style={{ margin: "0 10px 10px", padding: "7px 12px", background: "var(--accent)", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#000", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>+</span> New Note
              </div>
              {/* Search */}
              <div style={{ margin: "0 10px 10px", padding: "6px 10px", background: "var(--bg)", borderRadius: 6, border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
                <Search size={10} style={{ color: "var(--text-disabled)" }} />
                <span style={{ fontSize: 10, color: "var(--text-disabled)" }}>Search notes…</span>
              </div>
              {/* Pinned */}
              <div style={{ padding: "2px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-disabled)", textTransform: "uppercase", marginBottom: 2 }}>Pinned</div>
              {[
                { title: "Project ideas", wc: "142 words", active: false },
                { title: "Q3 meeting notes", wc: "89 words", active: true },
              ].map((n) => (
                <div key={n.title} style={{ padding: "7px 12px", display: "flex", alignItems: "flex-start", gap: 6, background: n.active ? "rgba(0,230,118,0.1)" : "transparent" }}>
                  <FileText size={11} style={{ color: n.active ? "var(--accent)" : "var(--text-muted)", marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, color: n.active ? "var(--accent)" : "var(--text)", marginBottom: 1 }}>{n.title}</div>
                    <div style={{ fontSize: 9, color: "var(--text-disabled)" }}>{n.wc}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: "8px 12px 2px", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-disabled)", textTransform: "uppercase" }}>All Notes</div>
              {["Daily standup", "Book recommendations"].map((t) => (
                <div key={t} style={{ padding: "7px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <FileText size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Editor */}
            <div style={{ flex: 1, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
              {/* Toolbar */}
              <div style={{ borderBottom: "1px solid var(--border)", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "var(--text-disabled)" }}>May 22 · 89 words</span>
                <span style={{ fontSize: 10, color: "var(--accent)" }}>Saved</span>
              </div>

              {/* Voice status bar */}
              <div style={{ borderBottom: "1px solid var(--border)", padding: "7px 20px", background: "rgba(0,230,118,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
                <MockWaveform />
                <span style={{ fontSize: 10, color: "var(--accent)" }}>Listening…</span>
              </div>

              {/* Content */}
              <div style={{ padding: "20px 24px", flex: 1 }}>
                <div style={{ fontFamily: "var(--font-syne)", fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Q3 meeting notes</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  {typedText}
                  <span style={{ animation: "blink 1s step-end infinite", color: "var(--accent)" }}>|</span>
                </div>
              </div>

              {/* Floating mic */}
              <div style={{ position: "absolute", bottom: 20, right: 28 }}>
                <div style={{ position: "relative", width: 36, height: 36 }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--accent)", opacity: 0.15, animation: "pulseRing 1.5s ease-out infinite" }} />
                  <div style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mic size={15} color="#000" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glow under mockup */}
        <div style={{ position: "absolute", bottom: -40, left: "50%", transform: "translateX(-50%)", width: 400, height: 80, background: "radial-gradient(ellipse, rgba(0,230,118,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      </div>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto 80px", padding: "0 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            { icon: Mic,      title: "Voice-first",     desc: "Speak naturally. Web Speech API transcribes in real-time — no API cost, no delay." },
            { icon: Zap,      title: "Instant capture", desc: "Press ⌘N to open a note. Press mic. Done. No friction between thought and text." },
            { icon: Search,   title: "Full-text search",desc: "⌘K searches across all your notes. Find anything in under a second." },
            { icon: Folder,   title: "Organised",       desc: "Group notes into folders. Pin the important ones. Keep everything clean." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              style={{ padding: "20px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", transition: "border-color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,230,118,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,230,118,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon size={15} style={{ color: "var(--accent)" }} />
              </div>
              <div style={{ fontFamily: "var(--font-syne)", fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Free tier explainer ───────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto 80px", padding: "0 40px", textAlign: "center" }}>
        <div style={{ padding: "32px", borderRadius: 12, border: "1px solid rgba(0,230,118,0.2)", background: "rgba(0,230,118,0.04)" }}>
          <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
            Try before you commit
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
            No account needed. Take up to <strong style={{ color: "var(--accent)" }}>10 notes per day</strong> right in your browser. Notes live for <strong style={{ color: "var(--text)" }}>24 hours</strong>, then disappear.
            When you&apos;re ready for unlimited — create a free account.
          </p>
          <Link
            href="/demo"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--accent)", color: "#000",
              padding: "11px 24px", borderRadius: 7,
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}
          >
            <Mic size={14} /> Open the demo
          </Link>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 40px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-syne)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
          Ready for unlimited?
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 28 }}>
          Sign up free. All your notes, synced, forever.
        </p>
        <Link
          href="/sign-up"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            border: "1px solid var(--accent)", color: "var(--accent)",
            padding: "12px 28px", borderRadius: 8,
            fontSize: 14, fontWeight: 600, textDecoration: "none",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#000"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}
        >
          Create free account <ArrowRight size={14} />
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <span style={{ fontFamily: "var(--font-syne)", fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Notably</span>
        <div style={{ display: "flex", gap: 20 }}>
          <Link href="/sign-in" style={{ fontSize: 12, color: "var(--text-disabled)", textDecoration: "none" }}>Sign in</Link>
          <Link href="/sign-up" style={{ fontSize: 12, color: "var(--text-disabled)", textDecoration: "none" }}>Sign up</Link>
          <Link href="/demo" style={{ fontSize: 12, color: "var(--text-disabled)", textDecoration: "none" }}>Demo</Link>
        </div>
      </footer>
    </div>
  );
}

function MockWaveform() {
  const bars = [3, 6, 9, 5, 8, 4, 7, 5, 3];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, height: 14 }}>
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            width: 2, borderRadius: 2, background: "var(--accent)",
            animation: `waveBar ${0.5 + i * 0.07}s ease-in-out ${i * 0.04}s infinite alternate`,
            "--min": "2px", "--max": `${h}px`,
          } as React.CSSProperties}
        />
      ))}
    </span>
  );
}
