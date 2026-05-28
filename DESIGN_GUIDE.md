# DESIGN_GUIDE.md — Notably

> Design system spec. Keep in sync with `globals.css` and `tailwind.config.ts`.
> Last updated: 2026-05-28

Notably is **warm, paper-like, and light-first** — a deliberate departure from the
typical dark-mode default. Think calm stationery: cream backgrounds, sage green accent,
serif display type for warmth, clean sans for everything else.

---

## Color Tokens

Defined as CSS variables in `globals.css` and mirrored in `tailwind.config.ts`.

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#f5f3ec` | Page background (warm cream) |
| `--bg-elev` | `#faf8f1` | Elevated surfaces, card headers/footers |
| `--paper` | `#ffffff` | Cards, inputs, primary surfaces |
| `--ink` | `#1c2420` | Primary text, dark buttons, dark panels |
| `--ink-mute` | `#4a544c` | Secondary text |
| `--ink-soft` | `#7a8580` | Tertiary text, placeholders, meta |
| `--sage` | `#4f7a5a` | Primary accent (mic, dots, highlights) |
| `--sage-deep` | `#2d5b3e` | Accent on hover, serif emphasis, CTA strip bg |
| `--sage-soft` | `#dce5d4` | Accent borders, selection highlight |
| `--sage-pale` | `#ecf1e7` | Accent-tinted fills (icon boxes, eyebrow pills) |
| `--line` | `rgba(28,36,32,0.08)` | Hairline borders |
| `--line-strong` | `rgba(28,36,32,0.14)` | Stronger borders, dashed previews |
| record red | `#d65656` | Recording state only (mic active, rec dot) |

---

## Typography

| Family | Variable | Use |
|---|---|---|
| **Geist Sans** (`geist` pkg) | `--font-geist-sans` | All UI, body, buttons |
| **Instrument Serif** (`next/font/google`) | `--font-instrument` | Display headings (serif spans), note titles, "01/02/03" step numbers, blockquotes — usually *italic* |

Helper: `.serif { font-family: var(--font-instrument); font-style: italic; }`

**Size scale (px):**
- Hero H1: 84 (→56 mobile →44 small), line-height 0.96, letter-spacing -0.035em
- Section H2: 56 (→40 mobile), line-height 1.0, letter-spacing -0.025em
- Card/feature title (serif): 21–32
- Body: 16–20, line-height ~1.55
- Meta / labels: 12.5–14
- Eyebrow: 13, uppercase, letter-spacing 0.12em, sage-deep

---

## Spacing & Layout

- Content max width: `1240px` (landing `.wrap`), `980px` (app)
- Section vertical padding: `100px` desktop, `72px` mobile
- Card padding: `22–36px`
- Gaps: 16px (grids), 12px (inline groups), 48–80px (hero/section columns)

---

## Border Radius

| Token | Value | Use |
|---|---|---|
| pill | `999px` | Buttons, chips, quota pill, eyebrow, inputs |
| card | `18–24px` | Note cards, plans, recorder, modals |
| large panel | `28–32px` | Demo card, CTA strip, dark "uses" panel |
| icon box | `10px` | Feature icon tiles |

---

## Shadows

- Card hover: `0 12px 28px -18px rgba(28,36,32,0.2)`
- Demo / recorder: `0 1px 0 rgba(255,255,255,1) inset, 0 30px 60px -20px rgba(28,36,32,0.18)`
- Modal: `0 40px 80px -24px rgba(28,36,32,0.4)`

---

## Component Patterns

**Buttons** (`.btn` in `globals.css`)
- `.primary` — ink bg, cream text → hover sage-deep
- `.outline` — paper bg, strong-line border → hover ink border
- `.ghost` — transparent → hover faint ink wash
- `.lg` modifier bumps padding/size; `.arrow` icon nudges right on hover
- Disabled: 0.55 opacity, no hover shift

**Mic button** (`.micBtn`) — 56px circle, ink bg, scales 1.04 on hover; turns record-red while recording (shows stop square).

**Quota pill** — paper pill with N dots (filled sage = available, grey = used) + "N of 5 free notes left". `.low` turns the count amber when ≤1 left.

**Cards** — paper bg, hairline border, radius 18–24; lift border + shadow on hover.

**Modal** — centered, blurred overlay (`rgba(28,36,32,0.4)`), `pop` scale-in, Escape to close, click-outside to dismiss.

**Eyebrow pill** — sage-pale bg, sage-soft border, sage-deep text, small check dot.

---

## Animation / Transitions

| Name | Where |
|---|---|
| `pulse-rec` | Recording dot halo |
| `blink` | Transcript caret |
| `wave-bar` / `bar` | Live waveform bars (staggered delay) |
| `word-in` | Landing demo word reveal |
| `fade-up` | Note cards entering the library |
| `fade` / `pop` | Modal overlay + panel |

Standard transition: `all 0.15s ease` for interactive elements.

---

## Theme Notes

- **Light-first by design.** No dark mode. The dark `--ink` panels ("uses" section, Pro plan, CTA strip) are accents *within* the light theme, not a mode toggle.
- Selection color is `--sage-soft` on `--ink`.
- Mobile breakpoints: 1100 / 900 / 760 / 640 / 420px (see module CSS media queries).
