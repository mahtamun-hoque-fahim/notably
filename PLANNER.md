# PLANNER.md — Notably

## Project Overview

**Notably** is a voice-to-text note-taking SaaS landing page + app.
Users speak aloud; the browser's Web Speech API transcribes in real time.
Notes are saved to `localStorage` with a 24-hour TTL and a 10-notes-per-day cap.
No account required. No server-side storage. Pure local-first experience.

**Target user:** Anyone who thinks faster than they type — students, professionals, casual note-takers.

**Key value:** Zero friction, zero data exposure, zero cost.

---

## Architecture

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| Styles | Tailwind v4 (no config file — tokens in globals.css) |
| Fonts | Syne (headings) · DM Sans (body) · JetBrains Mono (notes) |
| Storage | localStorage (client-only) |
| Voice | Web Speech API (browser-native, no SDK) |
| Auth | None — local-first, no accounts |
| DB | None |
| Deploy | Vercel (primary) · Cloudflare Pages (secondary) |

### Folder structure

```
src/
  app/
    layout.tsx          — root layout, metadata
    page.tsx            — landing page shell
    globals.css         — Tailwind v4 @theme tokens + keyframes
    notes/
      page.tsx          — notes app shell
  components/
    landing/
      LandingPage.tsx   — full landing page (hero, features, how-it-works, CTA, footer)
    notes/
      NotesApp.tsx      — recorder panel + note list + all state
  hooks/
    useVoice.ts         — Web Speech API wrapper
  lib/
    notes.ts            — localStorage CRUD, 24h TTL, daily limit helpers
```

---

## User Flows

### Visitor → Landing
1. Arrives at `/`
2. Sees hero with animated waveform demo (no mic required)
3. Reads features, how-it-works
4. Clicks "Open Notably" → `/notes`

### User → Take a Note
1. Arrives at `/notes`
2. Sees recorder panel with mic button
3. Clicks mic — browser requests microphone permission once
4. Speaks — live transcription appears word by word
5. Clicks mic again to stop (or silence triggers auto-stop)
6. Clicks "Save Note"
7. Note appears in list below with creation time + expiry countdown
8. Can click note text to edit inline
9. Can hover → trash icon to delete

### Daily Limit
- Counter ring in header shows `X/10`
- At limit: mic button disabled, toast shown
- Resets the next calendar day (checked by YYYY-MM-DD date key)

### Auto-Expiry
- Each note stores `expiresAt = createdAt + 86_400_000` ms
- `getNotes()` filters out expired on every call
- UI refreshes every 60s to update expiry labels

---

## Storage Schema (localStorage)

Key: `notably_notes`
Value: `Note[]` serialized as JSON

```ts
interface Note {
  id: string;         // crypto.randomUUID()
  content: string;    // final transcribed text
  createdAt: number;  // Unix ms
  expiresAt: number;  // createdAt + 24h
}
```

---

## API Routes

None. Entirely client-side.

---

## Env Vars

None required. Entirely client-side.

---

## Timeline / Phases

- [x] Phase 1 — Planning & repo scaffold
- [x] Phase 2 — Landing page (hero, features, how-it-works, CTA, footer)
- [x] Phase 3 — Notes app (recorder, localStorage, note list, expiry)
- [ ] Phase 4 — Polish & deploy (Vercel + Cloudflare Pages)

---

## Next Steps

1. Run `npm run build` locally — verify zero errors
2. Push to GitHub
3. Import repo on Vercel, deploy to production
4. (Optional) Set up Cloudflare Pages with `@cloudflare/next-on-pages`
5. Test voice recognition on Chrome, Edge, Safari
6. Consider adding: export notes as `.txt`, keyboard shortcut for mic toggle
