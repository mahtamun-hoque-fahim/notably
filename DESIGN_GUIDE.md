# DESIGN_GUIDE.md — Notably

> Living design system reference. Updated when new components or tokens are added.
> Last updated: 2025-05-20

---

## Color Tokens

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Background | `--bg` | `#0a0a0a` | Page background |
| Surface | `--surface` | `#111111` | Sidebar, cards, panels |
| Surface Elevated | `--surface-elevated` | `#1a1a1a` | Hover states, dropdowns |
| Border | `--border` | `#1f1f1f` | Dividers, outlines |
| Accent | `--accent` | `#00e676` | CTAs, active states, recording indicator |
| Accent Dim | `--accent-dim` | `rgba(0,230,118,0.12)` | Accent backgrounds, active note bg |
| Text Primary | `--text` | `#f0f0f0` | Body text, note content |
| Text Muted | `--text-muted` | `#888888` | Sidebar labels, captions |
| Text Disabled | `--text-disabled` | `#444444` | Placeholder counts, disabled |
| Destructive | `--destructive` | `#ff4444` | Delete, error |
| Destructive Dim | `--destructive-dim` | `rgba(255,68,68,0.12)` | Destructive hover bg |

---

## Typography

**Font Stack:**
- Headings: `Syne` — variable `--font-syne` — weights 400, 600, 700
- Body: `Onest` — variable `--font-onest` — weights 400, 500, 600
- Code / Mono: `JetBrains Mono` — variable `--font-mono` — weights 400, 500

**Scale:**

| Name | Size | Usage |
|---|---|---|
| App name | 1rem / 700 / Syne | Sidebar brand label |
| Note title | 1.5rem / 700 / Syne | Editor title textarea |
| Body | 1rem / 400 / Onest | Note content, sidebar items |
| Small | 0.875rem / 400 / Onest | Metadata, word count |
| XS | 0.75rem / 600 / Onest uppercase | Section headers (PINNED, FOLDERS) |

---

## Spacing

4px base grid. Common values: 4, 8, 12, 16, 24, 32, 48.

Sidebar width: `--sidebar-width: 260px`

---

## Component Patterns

### Sidebar Note Item
```tsx
// Active state
background: var(--accent-dim); color: var(--accent)
// Hover state
background: var(--surface-elevated); color: var(--text)
// Default
background: transparent; color: var(--text)
// Delete icon: opacity-0, reveals on group-hover
```

### Note Editor Textarea
```tsx
// Title textarea
bg-transparent border-none outline-none
font-family: var(--font-syne); font-size: 1.5rem; font-weight: 700
caret-color: var(--accent)
auto-resize on input

// Content textarea
bg-transparent border-none outline-none
font-family: var(--font-onest); font-size: 1rem; line-height: 1.75
caret-color: var(--accent)
min-height: 400px
```

### Toolbar Button
```tsx
// Default: color var(--text-muted), bg transparent
// Hover: color var(--text), bg var(--surface-elevated)
// Hover destructive: color var(--destructive), bg var(--destructive-dim)
// Active (pinned): color var(--accent)
p-1.5 rounded transition-colors
```

### Primary Button (New Note)
```tsx
background: var(--accent); color: #000; font-weight: 600
w-full px-3 py-2 rounded text-sm
```

### Ghost / Accent Dim Button
```tsx
background: var(--accent-dim); color: var(--accent)
px-3 py-1.5 rounded text-sm font-medium
```

### Folder Input (inline)
```tsx
bg: var(--bg); border: var(--accent); color: var(--text)
text-xs px-2 py-1 rounded; outline: none
```

### Note Card (Folder View)
```tsx
background: var(--surface); border: var(--border); rounded-md p-4
hover: border-color rgba(0,230,118,0.3)
transition-colors cursor-pointer
```

### Clerk Auth Pages
```tsx
// Container
min-h-screen flex items-center justify-center bg: var(--bg)
// Brand above Clerk widget
font-syne text-3xl font-bold + muted tagline
// Clerk appearance variables: matches dark palette
colorBackground: #111111, colorInputBackground: #1a1a1a
colorPrimary: #00e676, formButtonPrimary color: #000
```

---

## Animations

| Usage | Value |
|---|---|
| Hover state changes | `transition-colors duration-150` |
| Opacity reveals | `transition-opacity duration-150` |
| Transform | `transition-transform duration-200` |

No heavy animations. Recording pulse (Phase 2): `animate-pulse` on mic ring.

---

## Dark Mode Notes

- Dark-first, no light mode.
- Layer order: `#0a0a0a` (bg) → `#111111` (surface/sidebar) → `#1a1a1a` (elevated/hover)
- Never pure white — `#f0f0f0` max
- Accent `#00e676` only on dark backgrounds

---

## Phase 2 Additions (Voice Recorder)

- Mic button: circular, `border-2 border-[--border]`, hover `border-[--accent]`
- Recording active: green ring pulse `ring-2 ring-[--accent] animate-pulse`
- Waveform bars: 5 bars, heights animated with CSS keyframes, color `var(--accent)`
- Status badge: "Listening…" in `--accent`, "Transcribing…" in `--text-muted`
