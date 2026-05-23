# DESIGN_GUIDE.md — Notably

## Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#09090F` | Page background |
| `--color-surface` | `#111118` | Cards, panels |
| `--color-surface-2` | `#1A1A26` | Textarea, input fields |
| `--color-border` | `#242436` | Dividers, card borders |
| `--color-accent` | `#7C6FFF` | Primary accent, mic button active, CTAs |
| `--color-accent-dim` | `#4C42CC` | Accent hover, deep glows |
| `--color-accent-glow` | `rgba(124,111,255,0.18)` | Shadow/glow effects |
| `--color-text` | `#E8E8F0` | Primary text |
| `--color-muted` | `#6B6B85` | Secondary text, labels |
| `--color-danger` | `#FF5757` | Recording state, errors, delete |
| `--color-warn` | `#FFBD2E` | Unsupported browser warning |

---

## Typography

| Role | Family | Weight | Size |
|---|---|---|---|
| Display heading | Syne | 800 | 5xl–8xl |
| Section heading | Syne | 700 | 2xl–4xl |
| UI label | Syne | 600 | sm–base |
| Body copy | DM Sans | 400/300 | sm–base |
| Note content | JetBrains Mono | 400 | sm |
| Meta / timestamps | JetBrains Mono | 400 | xs |
| Badges / counters | JetBrains Mono | 500 | xs |

---

## Spacing Scale

Uses Tailwind defaults. Key custom values:
- Card padding: `p-5` (20px)
- Section padding: `py-28` (112px)
- Gap between notes: `gap-3` (12px)

---

## Border Radius

| Component | Radius |
|---|---|
| Cards / panels | `rounded-2xl` (16px) |
| Buttons (primary) | `rounded-xl` (12px) |
| Mic button | `rounded-2xl` |
| Badges / tags | `rounded-full` |
| Inputs / textareas | `rounded-lg` (8px) |

---

## Shadow / Glow Tokens

- Mic active: `shadow-[0_0_30px_rgba(255,87,87,0.4)]`
- Mic idle: `shadow-[0_0_20px_rgba(124,111,255,0.3)]`
- CTA button: `shadow-[0_0_30px_rgba(124,111,255,0.3)]`
- CTA hover: `shadow-[0_0_50px_rgba(124,111,255,0.5)]`
- Background glow blur: `blur-[120px]` at 6% opacity

---

## Component Patterns

### Primary Button
```
bg-[#7C6FFF] text-white px-6 py-3.5 rounded-xl font-medium text-sm
hover:bg-[#6B5FEE]
shadow-[0_0_30px_rgba(124,111,255,0.3)]
```

### Ghost Button
```
border border-[#242436] text-[#6B6B85] px-6 py-3.5 rounded-xl text-sm
hover:border-[#7C6FFF]/40 hover:text-[#E8E8F0]
```

### Accent Ghost Button
```
bg-[#7C6FFF]/8 border border-[#7C6FFF]/30 text-[#7C6FFF]
hover:bg-[#7C6FFF]/15
```

### Card
```
rounded-2xl border border-[#242436] bg-[#111118]
hover:border-[#7C6FFF]/25
accent bar: h-[2px] bg-gradient-to-r from-[#7C6FFF]/60 to-transparent
```

### Mic Button (idle)
```
w-14 h-14 rounded-2xl bg-[#7C6FFF]
shadow-[0_0_20px_rgba(124,111,255,0.3)]
```

### Mic Button (recording)
```
w-14 h-14 rounded-2xl bg-[#FF5757]
shadow-[0_0_30px_rgba(255,87,87,0.4)]
+ ping ring: border-2 border-[#FF5757] animate-ping opacity-40
```

### Toast (success)
```
bg-[#111118] border border-[#7C6FFF]/40 text-[#A99FFF]
```

### Toast (error)
```
bg-[#111118] border border-[#FF5757]/40 text-[#FF5757]
```

---

## Animations

| Name | Usage |
|---|---|
| `waveform` | Waveform bars — scaleY 0.3–1.0, per-bar delay offset |
| `fade-up` | Note card entry — translateY 16px → 0, opacity 0 → 1 |
| `glow-pulse` | Box-shadow pulse for mic button on hover |
| `ticker` | Infinite horizontal scroll ticker bar |
| `animate-ping` | Recording ring around mic button |
| `animate-pulse` | REC dot, cursor blink, spinner |

---

## Dark Mode

Dark-only. No light mode. Background is near-black (`#09090F`) not pure black.
Use `backdrop-blur-xl` + `/80` bg opacity for sticky nav glass effect.

---

## No-Emoji Rule

No emojis anywhere in UI, code, commits, or docs. Use Lucide icons only.
