# Notably

Voice-to-text note taking. Press record, talk, get clean searchable text back — right in the browser. Five free notes a day, no account needed.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + CSS Modules
- Web Speech API (browser-native transcription, no API keys)
- localStorage persistence (MVP)
- Geist Sans + Instrument Serif
- Deploy: Vercel

## Prerequisites

- Node.js 18.18+ (or 20+)
- A Chromium-based browser or Safari for live transcription (Web Speech API)

## Local setup

```bash
git clone https://github.com/mahtamun-hoque-fahim/notably.git
cd notably
npm install
npm run dev
```

Open http://localhost:3000 — landing page at `/`, the app at `/app`.

> Phase 1 needs **no environment variables**. It runs entirely client-side.

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build
npm start        # serve the production build
npm run lint     # eslint
```

## Env vars

None required for Phase 1. Phase 2 (accounts, sync, Pro) will add Neon, Better Auth,
and Stripe vars — see `PLANNER.md` → Env Vars for the full list.

## Folder structure

```
src/
├── app/          # routes: / (landing), /app (recorder + library)
├── components/   # Recorder, NoteModal, UpgradeModal, Icons
└── lib/          # notes.ts (storage + quota), useSpeech.ts (Web Speech hook)
```

See `PLANNER.md` for the full blueprint and `DESIGN_GUIDE.md` for the design system.
