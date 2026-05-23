"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mic, Zap, Clock, Shield, ArrowRight, Volume2, FileText, Sparkles } from "lucide-react";

const TICKER_ITEMS = [
  "Voice to Text",
  "10 Notes Daily",
  "No Account Needed",
  "Privacy First",
  "Auto-Expires in 24h",
  "Instant Transcription",
  "Dark & Focused",
  "Always Free",
];

function TickerBar() {
  return (
    <div className="overflow-hidden border-y border-[#242436] py-3 bg-[#0D0D15]">
      <div
        className="flex gap-12 w-max"
        style={{ animation: "ticker 20s linear infinite" }}
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="flex items-center gap-3 whitespace-nowrap text-sm font-mono text-[#6B6B85] tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C6FFF] shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function WaveformDemo({ active }: { active: boolean }) {
  const bars = Array.from({ length: 28 });
  return (
    <div className="flex items-center gap-[3px] h-10">
      {bars.map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            background: active ? "#7C6FFF" : "#242436",
            height: active ? `${Math.random() * 32 + 8}px` : "6px",
            animation: active ? `waveform ${0.4 + (i % 5) * 0.12}s ease-in-out infinite ${i * 0.04}s` : "none",
            transition: "background 0.3s ease, height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

const FEATURES = [
  {
    icon: <Mic size={20} />,
    title: "Speak, Don't Type",
    body: "Uses the Web Speech API built into your browser. No plugins, no extensions. Just click, speak, and your words appear.",
  },
  {
    icon: <Zap size={20} />,
    title: "Real-Time Transcription",
    body: "Words appear as you say them. Interim results show up instantly, final text locks in when you pause.",
  },
  {
    icon: <Clock size={20} />,
    title: "Auto-Expires in 24h",
    body: "Notes live in your browser's local storage and vanish exactly 24 hours after creation. No cleanup needed.",
  },
  {
    icon: <Shield size={20} />,
    title: "Zero Data Sent",
    body: "Your notes never touch a server. Everything stays on your device. No account, no sync, no tracking.",
  },
  {
    icon: <FileText size={20} />,
    title: "10 Notes Per Day",
    body: "A focused daily limit keeps your notes intentional. Start fresh every day without carrying old clutter.",
  },
  {
    icon: <Sparkles size={20} />,
    title: "Clean & Distraction-Free",
    body: "A minimal interface built for focus. No sidebars, no folders, no noise. Just you and your thoughts.",
  },
];

const STEPS = [
  { num: "01", label: "Click the mic button", detail: "No setup. Browser asks for microphone permission once." },
  { num: "02", label: "Speak naturally", detail: "Talk at your normal pace. Notably transcribes in real time." },
  { num: "03", label: "Review your note", detail: "Edit inline if needed. Your note is saved automatically." },
  { num: "04", label: "Notes vanish in 24h", detail: "Check back fresh the next day. No buildup, no clutter." },
];

export default function LandingPage() {
  const [demoActive, setDemoActive] = useState(false);
  const [demoText, setDemoText] = useState("");
  const [demoIndex, setDemoIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const DEMO_PHRASE = "Meeting at 3pm, don't forget to bring the design mockups and ask about the Q3 timeline.";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!demoActive) return;
    if (demoIndex >= DEMO_PHRASE.length) {
      setTimeout(() => {
        setDemoActive(false);
        setDemoText("");
        setDemoIndex(0);
      }, 2000);
      return;
    }
    const t = setTimeout(() => {
      setDemoText(DEMO_PHRASE.slice(0, demoIndex + 1));
      setDemoIndex((i) => i + 1);
    }, 38);
    return () => clearTimeout(t);
  }, [demoActive, demoIndex]);

  return (
    <div className="min-h-screen bg-[#09090F] text-[#E8E8F0]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-[#242436]/60 bg-[#09090F]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7C6FFF] flex items-center justify-center">
            <Mic size={14} className="text-white" />
          </div>
          <span className="font-syne font-700 text-base tracking-tight">Notably</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-[#6B6B85]">
          <a href="#features" className="hover:text-[#E8E8F0] transition-colors">Features</a>
          <a href="#how" className="hover:text-[#E8E8F0] transition-colors">How it works</a>
        </div>
        <Link
          href="/notes"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7C6FFF] text-white text-sm font-medium hover:bg-[#6B5FEE] transition-colors"
        >
          Start Taking Notes
          <ArrowRight size={14} />
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#7C6FFF]/6 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-[#4C42CC]/4 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#7C6FFF]/30 bg-[#7C6FFF]/8 text-[#7C6FFF] text-xs font-mono tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C6FFF] animate-pulse" />
            Free — No Account Required
          </div>

          {/* Headline */}
          <h1 className="font-syne text-5xl md:text-7xl lg:text-8xl font-800 leading-[0.95] tracking-tight">
            Voice notes,{" "}
            <span className="relative inline-block">
              <span className="text-[#7C6FFF]">instantly.</span>
              <span className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7C6FFF] to-transparent" />
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#6B6B85] max-w-xl mx-auto leading-relaxed font-dm">
            Speak your thoughts. Notably transcribes them in real time.
            No account, no sync, no clutter — just 10 clean notes a day.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/notes"
              className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-[#7C6FFF] text-white font-medium text-sm hover:bg-[#6B5FEE] transition-all duration-200 shadow-[0_0_30px_rgba(124,111,255,0.3)] hover:shadow-[0_0_40px_rgba(124,111,255,0.5)]"
            >
              <Mic size={16} />
              Open Notably
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how" className="px-6 py-3.5 rounded-xl border border-[#242436] text-[#6B6B85] text-sm hover:border-[#7C6FFF]/40 hover:text-[#E8E8F0] transition-all duration-200">
              How it works
            </a>
          </div>

          {/* Demo card */}
          <div className="mt-12 mx-auto max-w-lg rounded-2xl border border-[#242436] bg-[#111118] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.4)]">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#242436]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5757]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#2ECC71]" />
              </div>
              <span className="text-xs text-[#6B6B85] font-mono">notably — note 1 of 10</span>
              <div className="flex items-center gap-1.5">
                {demoActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5757] animate-pulse" />}
                <Volume2 size={12} className={demoActive ? "text-[#7C6FFF]" : "text-[#242436]"} />
              </div>
            </div>

            {/* Card body */}
            <div className="p-5 space-y-4">
              <WaveformDemo active={demoActive} />
              <div className="min-h-[60px] font-mono text-sm text-[#E8E8F0] leading-relaxed">
                {demoText || (
                  <span className="text-[#6B6B85]">Your transcribed words appear here in real time...</span>
                )}
                {demoActive && demoIndex < DEMO_PHRASE.length && (
                  <span className="inline-block w-0.5 h-4 bg-[#7C6FFF] ml-0.5 animate-pulse align-middle" />
                )}
              </div>
              <button
                onClick={() => {
                  if (!demoActive) {
                    setDemoActive(true);
                    setDemoText("");
                    setDemoIndex(0);
                  }
                }}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                  demoActive
                    ? "bg-[#FF5757]/10 border border-[#FF5757]/30 text-[#FF5757] cursor-not-allowed"
                    : "bg-[#7C6FFF]/10 border border-[#7C6FFF]/30 text-[#7C6FFF] hover:bg-[#7C6FFF]/20"
                }`}
              >
                {demoActive ? "Recording..." : "Try the demo"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <TickerBar />

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-mono tracking-widest uppercase text-[#7C6FFF]">Features</span>
            <h2 className="font-syne text-4xl md:text-5xl font-700 tracking-tight">
              Built for speed,{" "}
              <span className="text-[#7C6FFF]">not complexity</span>
            </h2>
            <p className="text-[#6B6B85] max-w-md mx-auto">
              Everything you need to capture thoughts quickly. Nothing you don't.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-[#242436] bg-[#111118] hover:border-[#7C6FFF]/30 hover:bg-[#111118]/80 transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-lg bg-[#7C6FFF]/10 flex items-center justify-center text-[#7C6FFF] mb-4 group-hover:bg-[#7C6FFF]/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-syne font-600 text-base mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B6B85] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-28 px-6 border-t border-[#242436]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-mono tracking-widest uppercase text-[#7C6FFF]">Process</span>
            <h2 className="font-syne text-4xl md:text-5xl font-700 tracking-tight">
              Four steps,{" "}
              <span className="text-[#7C6FFF]">zero friction</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {STEPS.map((s, i) => (
              <div key={i} className="flex gap-5 p-6 rounded-2xl border border-[#242436] bg-[#111118]">
                <span className="font-mono text-3xl font-700 text-[#7C6FFF]/25 shrink-0 leading-none pt-1">
                  {s.num}
                </span>
                <div>
                  <h3 className="font-syne font-600 text-base mb-1.5">{s.label}</h3>
                  <p className="text-sm text-[#6B6B85] leading-relaxed">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl border border-[#7C6FFF]/20 bg-[#111118] p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C6FFF]/5 via-transparent to-[#4C42CC]/5 pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#7C6FFF]/15 border border-[#7C6FFF]/20">
                <Mic size={24} className="text-[#7C6FFF]" />
              </div>
              <h2 className="font-syne text-4xl md:text-5xl font-700 tracking-tight">
                Ready to speak?
              </h2>
              <p className="text-[#6B6B85] max-w-sm mx-auto">
                No sign-up. No downloads. Just open and start talking.
              </p>
              <Link
                href="/notes"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl bg-[#7C6FFF] text-white font-medium hover:bg-[#6B5FEE] transition-all shadow-[0_0_30px_rgba(124,111,255,0.3)] hover:shadow-[0_0_50px_rgba(124,111,255,0.5)]"
              >
                <Mic size={16} />
                Open Notably — It's Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#242436] px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#6B6B85]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#7C6FFF]/20 flex items-center justify-center">
              <Mic size={10} className="text-[#7C6FFF]" />
            </div>
            <span className="font-syne font-600 text-[#E8E8F0]">Notably</span>
            <span>— voice notes, no noise</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Built by</span>
            <a
              href="https://github.com/mahtamun-hoque-fahim"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7C6FFF] hover:text-[#A99FFF] transition-colors ml-1"
            >
              MAHTAMUN
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
