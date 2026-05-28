"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import s from "./landing.module.css";
import {
  ArrowIcon,
  BoltIcon,
  CheckIcon,
  LangIcon,
  LockIcon,
  MicFilled,
  PlusIcon,
  SearchIcon,
  SparkleIcon,
  TagIcon,
} from "@/components/Icons";

// ───── Top nav ─────
function Nav() {
  return (
    <nav className={s.nav}>
      <div className={s.wrap}>
        <div className={s.navRow}>
          <Link href="/" className={s.brand}>
            <span className={s.brandMic}>
              <MicFilled size={11} />
            </span>
            notably
          </Link>
          <div className={s.navLinks}>
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#uses">Use cases</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className={s.navCta}>
            <Link className="btn ghost" href="/app">Sign in</Link>
            <Link className="btn primary" href="/app">Start free</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ───── Live transcript demo ─────
const TRANSCRIPT =
  "Okay, quick voice memo before the train comes in. Three things from today: first, the team agreed on shipping the audio recorder by Friday — that means design freeze tomorrow. Second, I need to call Sam back about the renewal. And third, remind me to pick up oat milk, the small carton, on the way home. That's it.";

function LiveDemo() {
  const words = TRANSCRIPT.split(/(\s+)/);
  const [shown, setShown] = useState(0);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setShown((cur) => {
        if (cur >= words.length) {
          window.setTimeout(() => {
            setShown(0);
            setTimer(0);
          }, 2500);
          return cur;
        }
        return cur + 1;
      });
    }, 110);
    return () => clearInterval(id);
  }, [words.length]);

  useEffect(() => {
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");
  const recording = shown < words.length;

  return (
    <div className="relative">
      <div className={s.demo}>
        <div className={s.demoHead}>
          <span className="rec-dot" />
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>
            {recording ? "Recording" : "Saved"}
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 13.5, color: "var(--ink-mute)", fontWeight: 500 }}>
            {mm}:{ss}
          </span>
          <span style={{ flex: 1 }} />
          <span className={s.chip}>EN · auto</span>
          <span className={s.chip}>draft 1 of 5</span>
        </div>
        <div className={s.demoBody}>
          <div className={s.demoTitle}>Tuesday morning, platform 4</div>
          <div className={s.transcript}>
            {words.map((w, i) => (
              <span key={i} className={s.word + (i < shown ? " " + s.in : "")}>
                {w}
              </span>
            ))}
            {recording && <span className="caret" />}
          </div>
        </div>
        <div className={s.demoFoot}>
          <div className={s.waveform}>
            {Array.from({ length: 48 }).map((_, i) => (
              <span
                key={i}
                style={{
                  animationDelay: i * 0.04 + "s",
                  height: 12 + (i % 6) * 2,
                }}
              />
            ))}
          </div>
          <button className={s.stopBtn} aria-label="Stop" />
        </div>
      </div>

      <div className={`${s.floatNote} ${s.f1}`}>
        <span className={s.tag}>auto</span>
        <span>2 actions detected</span>
      </div>
      <div className={`${s.floatNote} ${s.f2}`}>
        <span className={s.tag}>tag</span>
        <span>#commute · #todo</span>
      </div>
    </div>
  );
}

// ───── Hero ─────
function Hero() {
  return (
    <section className={s.hero}>
      <div className={s.wrap}>
        <div className={s.heroGrid}>
          <div>
            <span className={s.eyebrow}>
              <span className={s.dot}>✓</span>
              No app to install — works in your browser
            </span>
            <h1 className={s.heroH}>
              Voice,
              <br />
              <span className="serif">written down.</span>
            </h1>
            <p className={s.heroSub}>
              Notably turns the things you say into notes you can read. Press record, talk for a
              minute, get clean text back. Five free a day, no account needed.
            </p>
            <div className={s.heroCtas}>
              <Link className="btn primary lg" href="/app">
                Start recording <ArrowIcon />
              </Link>
              <a className="btn outline lg" href="#how">
                See how it works
              </a>
            </div>
            <div className={s.heroMeta}>
              <span>
                <span className={s.check}><CheckIcon size={14} /></span>5 free notes/day
              </span>
              <span>
                <span className={s.check}><CheckIcon size={14} /></span>No sign-up to try
              </span>
              <span>
                <span className={s.check}><CheckIcon size={14} /></span>60+ languages
              </span>
            </div>
          </div>
          <LiveDemo />
        </div>
      </div>
    </section>
  );
}

// ───── How it works ─────
function How() {
  const steps = [
    {
      n: "01",
      t: "Press record",
      d: "Open notably in any browser. One button. No setup, no account. Talk for as long as you need.",
    },
    {
      n: "02",
      t: "We listen",
      d: "Your voice becomes text in real time. Watch the transcript scroll as you speak. Pause, resume, keep going.",
    },
    {
      n: "03",
      t: "It's yours",
      d: "A clean, searchable note appears in your library. Edit it, share it, paste it somewhere. That's the whole thing.",
    },
  ];
  return (
    <section id="how" className={`${s.section} ${s.how}`}>
      <div className={s.wrap}>
        <div className={s.sectionHead}>
          <div className={s.sectionEyebrow}>How it works</div>
          <h2 className={s.sectionH}>
            Three steps. <span className="serif">Honestly, two.</span>
          </h2>
        </div>
        <div className={s.steps}>
          {steps.map((step) => (
            <div className={s.step} key={step.n}>
              <div className={s.num}>{step.n}</div>
              <h3>{step.t}</h3>
              <p>{step.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───── Features ─────
function Features() {
  return (
    <section id="features" className={s.section}>
      <div className={s.wrap}>
        <div className={s.sectionHead}>
          <div className={s.sectionEyebrow}>Features</div>
          <h2 className={s.sectionH}>
            Small surface. <span className="serif">A lot of care.</span>
          </h2>
          <p className={s.sectionSub}>
            Everything you need to capture a thought before it leaves. Nothing you don&apos;t.
          </p>
        </div>
        <div className={s.featuresGrid}>
          <div className={`${s.feature} ${s.wide}`}>
            <div className={s.iconBox}><BoltIcon /></div>
            <h4>Real-time transcription</h4>
            <p>Words show up as you say them. No spinner, no wait. Faster than typing, in any language.</p>
            <div className={s.preview}>
              <span style={{ color: "var(--sage-deep)" }}>▌</span>{" "}
              <span>so the next step is to call Sam back about</span>{" "}
              <span style={{ opacity: 0.5 }}>the renewal—</span>
            </div>
          </div>
          <div className={`${s.feature} ${s.med}`}>
            <div className={s.iconBox}><LangIcon /></div>
            <h4>60+ languages</h4>
            <p>Auto-detect or pick. Mix two in one note.</p>
            <div className={s.langRow}>
              {["English", "Español", "Français", "Deutsch", "日本語", "हिन्दी", "Português", "العربية", "中文"].map((l) => (
                <span key={l} className={s.langChip}>{l}</span>
              ))}
            </div>
          </div>
          <div className={`${s.feature} ${s.sm}`}>
            <div className={s.iconBox}><SparkleIcon /></div>
            <h4>Auto-titles</h4>
            <p>We name your note for you — something you can actually find later.</p>
          </div>
          <div className={`${s.feature} ${s.sm}`}>
            <div className={s.iconBox}><TagIcon /></div>
            <h4>Tags that find themselves</h4>
            <p>People, places, action items — pulled out automatically.</p>
          </div>
          <div className={`${s.feature} ${s.med}`}>
            <div className={s.iconBox}><SearchIcon /></div>
            <h4>Search what you said</h4>
            <p>Every word, indexed. Find a thought from three weeks ago in two seconds.</p>
            <div className={s.preview} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "var(--ink-soft)" }}><SearchIcon size={16} /></span>
              <span>
                &ldquo;oat milk&rdquo; — <span style={{ color: "var(--sage-deep)", fontWeight: 500 }}>1 match · Tuesday</span>
              </span>
            </div>
          </div>
          <div className={`${s.feature} ${s.sm}`}>
            <div className={s.iconBox}><LockIcon /></div>
            <h4>Yours alone</h4>
            <p>Encrypted at rest. We don&apos;t train on your notes. Export everything, anytime.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───── Use cases ─────
function Uses() {
  const items = [
    { who: "Students.", what: "Lecture notes, recorded.", desc: "Stop scribbling. Talk after class, summarize the lecture in your own words, walk away with a clean study sheet.", stat: "14 min average note · 3× faster than typing" },
    { who: "Journalists.", what: "Interviews, transcribed.", desc: "Record the conversation. Get a timestamped transcript back. Quote pull is two clicks away.", stat: "Up to 4 hours per session · 99 languages" },
    { who: "Founders.", what: "Standups, captured.", desc: "Talk through your morning on the walk to work. Hand it to your team as a written update.", stat: "Slack, Notion & email export built in" },
    { who: "Writers.", what: "Drafts, dictated.", desc: "First draft, out loud. Edit on the page. Some books are easier said than written.", stat: "Words flow ~3× faster spoken" },
  ];
  return (
    <section id="uses" className={s.section}>
      <div className={s.wrap}>
        <div className={s.uses}>
          <div className={s.sectionHead} style={{ marginBottom: 0 }}>
            <div className={s.sectionEyebrow}>Used by</div>
            <h2 className={s.sectionH}>
              For anyone who <span className="serif">thinks out loud.</span>
            </h2>
            <p className={s.sectionSub}>It turns out a lot of us do.</p>
          </div>
          <div className={s.usesGrid}>
            {items.map((u, i) => (
              <div className={s.useCard} key={i}>
                <div className={s.who}>{u.who}</div>
                <div className={s.what}>{u.what}</div>
                <div className={s.desc}>{u.desc}</div>
                <div className={s.stat}>
                  <span style={{ width: 4, height: 4, borderRadius: 2, background: "#c4d5b7" }} />
                  {u.stat}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ───── Pricing ─────
function Pricing() {
  return (
    <section id="pricing" className={s.section} style={{ background: "var(--bg)" }}>
      <div className={s.wrap}>
        <div className={s.sectionHead} style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
          <div className={s.sectionEyebrow}>Pricing</div>
          <h2 className={s.sectionH} style={{ margin: "0 auto 18px" }}>
            Try it free. <span className="serif">Upgrade when you outgrow it.</span>
          </h2>
          <p className={s.sectionSub} style={{ margin: "0 auto" }}>
            Five notes a day, free, forever. Or unlimited everything for a coffee a month.
          </p>
        </div>
        <div className={s.pricingGrid}>
          <div className={s.plan}>
            <div className={s.pname}>Free</div>
            <div className={s.price}>$0<span className={s.per}>/forever</span></div>
            <div className={s.pdesc}>Enough for most days. No card needed.</div>
            <ul>
              <li><CheckIcon /><span><b style={{ fontWeight: 500 }}>5 voice notes</b> per day</span></li>
              <li><CheckIcon /><span>Real-time transcription</span></li>
              <li><CheckIcon /><span>60+ languages</span></li>
              <li><CheckIcon /><span>Search & export</span></li>
              <li><CheckIcon /><span>Up to 5 minutes per note</span></li>
            </ul>
            <Link className="btn outline lg" href="/app">Start free</Link>
            <div className={s.ftnote}>Notes save locally on this device. Sign up free to keep them in sync.</div>
          </div>
          <div className={`${s.plan} ${s.pro}`}>
            <span className={s.ptag}>Most loved</span>
            <div className={s.pname}>Pro</div>
            <div className={s.price}>$5<span className={s.per}>/month</span></div>
            <div className={s.pdesc}>For people whose best thoughts arrive on the move.</div>
            <ul>
              <li><CheckIcon /><span><b style={{ fontWeight: 500 }}>Unlimited</b> voice notes, every day</span></li>
              <li><CheckIcon /><span>Notes up to 4 hours long</span></li>
              <li><CheckIcon /><span>Auto-titles, tags & summaries</span></li>
              <li><CheckIcon /><span>Speaker labels (interviews)</span></li>
              <li><CheckIcon /><span>Notion, Slack, email export</span></li>
              <li><CheckIcon /><span>Priority transcription</span></li>
            </ul>
            <Link
              className="btn primary lg"
              href="/app"
              style={{ background: "var(--bg-elev)", color: "var(--ink)" }}
            >
              Go Pro <ArrowIcon />
            </Link>
            <div className={s.ftnote}>$48/yr if you&apos;d rather pay once. Cancel anytime.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───── Testimonials ─────
function Testimonials() {
  const items = [
    { q: "I keep my best ideas now. I used to forget them on the way to the office.", n: "Anya R.", r: "Product designer", i: "AR" },
    { q: "Transcribed a 2-hour interview in the time it took to walk to the café. Pulled three quotes straight into the draft.", n: "Marcus L.", r: "Reporter, The Daily", i: "ML" },
    { q: "My phone's notes app was a graveyard. Notably is the first one I actually re-read.", n: "Priya K.", r: "Writer & student", i: "PK" },
  ];
  return (
    <section className={`${s.section} ${s.testimonials}`}>
      <div className={s.wrap}>
        <div className={s.sectionHead}>
          <div className={s.sectionEyebrow}>Words from people</div>
          <h2 className={s.sectionH}>
            Said out loud, <span className="serif">written here.</span>
          </h2>
        </div>
        <div className={s.testiGrid}>
          {items.map((t, i) => (
            <div className={s.testi} key={i}>
              <blockquote>&ldquo;{t.q}&rdquo;</blockquote>
              <div className={s.who}>
                <div className={s.avatar}>{t.i}</div>
                <div>
                  <div className={s.name}>{t.n}</div>
                  <div className={s.role}>{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───── FAQ ─────
function FAQ() {
  const [open, setOpen] = useState<number>(0);
  const items = [
    { q: "What happens to my free notes if I don't sign up?", a: "You can take five voice notes a day right now, no account required. They live on this device, in your browser. Sign up free anytime to keep them across phones and computers." },
    { q: "How accurate is the transcription?", a: "Notably uses your browser's built-in speech engine — about 96% word accuracy on clear English audio, and works across 60+ languages including code-switching mid-sentence. Pro adds speaker labels for interviews." },
    { q: "What's the difference between Free and Pro?", a: "Free gets you 5 notes a day, up to 5 minutes each — plenty for most days. Pro removes all limits, extends note length to 4 hours, and unlocks auto-summaries, smart tags, speaker labels, and integrations." },
    { q: "Do you train on my voice notes?", a: "No. Your notes are yours. They're stored locally by default, never used to train models, and you can export or delete everything anytime." },
    { q: "Does it work offline?", a: "The note editor works offline. Transcription itself uses your browser's speech engine, which streams to the network — so you'll need a connection for that part." },
    { q: "Can I edit a transcript?", a: "Yes. Every note is a normal text document. Edit, delete words, paste in additions. Save when you're done." },
  ];
  return (
    <section id="faq" className={s.section}>
      <div className={s.wrap}>
        <div className={s.sectionHead} style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
          <div className={s.sectionEyebrow}>Questions</div>
          <h2 className={s.sectionH} style={{ margin: "0 auto" }}>
            Things people ask, <span className="serif">answered.</span>
          </h2>
        </div>
        <div className={s.faqList}>
          {items.map((it, i) => (
            <div key={i} className={`${s.faqItem} ${open === i ? s.open : ""}`}>
              <button
                className={s.faqQ}
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span>{it.q}</span>
                <span className={s.icon}><PlusIcon size={20} /></span>
              </button>
              <div className={s.faqA}>
                <div className={s.faqAInner}>{it.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───── CTA + Footer ─────
function CTA() {
  return (
    <section style={{ padding: "40px 0 100px" }}>
      <div className={s.wrap}>
        <div className={s.ctaStrip}>
          <h2>
            The thought you almost forgot. <span className="serif">Caught.</span>
          </h2>
          <div className={s.actions}>
            <Link className="btn primary lg" href="/app">
              Start your first note <ArrowIcon />
            </Link>
            <span className={s.small}>5 notes today, free. No sign-up. No card.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <footer className={s.footer}>
      <div className={s.wrap}>
        <div className={s.footerGrid}>
          <div className={s.footerBrand}>
            <Link href="/" className={s.brand}>
              <span className={s.brandMic}><MicFilled size={11} /></span>
              notably
            </Link>
            <p>Voice notes that become text. Five a day, free.</p>
            <form
              className={s.newsletter}
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <input
                placeholder="you@yours.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
              <button type="submit">{sent ? "✓ done" : "Subscribe"}</button>
            </form>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 12 }}>
              One short letter a month. Updates, tips, occasional thinking.
            </div>
          </div>
          <div className={s.footerCol}>
            <h5>Product</h5>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a>Changelog</a></li>
              <li><a>Roadmap</a></li>
            </ul>
          </div>
          <div className={s.footerCol}>
            <h5>Company</h5>
            <ul>
              <li><a>About</a></li>
              <li><a>Blog</a></li>
              <li><a>Careers</a></li>
              <li><a>Press</a></li>
            </ul>
          </div>
          <div className={s.footerCol}>
            <h5>Support</h5>
            <ul>
              <li><a>Help center</a></li>
              <li><a>Contact</a></li>
              <li><a>Status</a></li>
              <li><a>API docs</a></li>
            </ul>
          </div>
        </div>
        <div className={s.footerBase}>
          <span>© 2026 Notably</span>
          <div className={s.legal}>
            <a>Privacy</a>
            <a>Terms</a>
            <a>Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main>
      <Nav />
      <Hero />
      <How />
      <Features />
      <Uses />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
