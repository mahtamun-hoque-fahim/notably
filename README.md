# Notably

Voice-to-text note taking. Press record, talk, get clean searchable text back — right in the browser. Five free notes a day, no account needed.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + CSS Modules
- Web Speech API (browser-native transcription, no API keys)
- Better Auth (email + password) for accounts
- Neon (Postgres) + Drizzle ORM for synced notes
- localStorage fallback for guests
- Geist Sans + Instrument Serif
- Deploy: Vercel

## Prerequisites

- Node.js 18.18+ (or 20+)
- A Chromium-based browser or Safari for live transcription (Web Speech API)
- A Neon Postgres database (only needed for accounts/sync — guest mode needs nothing)

## Local setup

```bash
git clone https://github.com/mahtamun-hoque-fahim/notably.git
cd notably
npm install
cp .env.example .env        # fill in for accounts/sync; skip for guest-only
npm run db:migrate          # create tables in Neon (skip if running guest-only)
npm run dev
```

Open http://localhost:3000 — landing page at `/`, the app at `/app`.

> **Guest mode needs no env vars.** Recording, saving, search, and the daily quota
> all work against `localStorage`. Accounts and cross-device sync require the env
> vars below plus a migrated Neon database.

## Scripts

```bash
npm run dev          # local dev server
npm run build        # production build
npm start            # serve the production build
npm run lint         # eslint
npm run db:generate  # generate a migration from the Drizzle schema
npm run db:migrate   # apply migrations to the DB
npm run db:push      # push schema directly (dev only)
npm run db:studio    # open Drizzle Studio
```

## Env vars

Required only for accounts/sync (see `.env.example`):

- `DATABASE_URL` — Neon pooled connection (runtime)
- `DATABASE_URL_UNPOOLED` — Neon direct connection (migrations)
- `BETTER_AUTH_SECRET` — auth signing secret (`openssl rand -base64 32`)
- `NEXT_PUBLIC_APP_URL` — canonical app URL

Full details in `PLANNER.md` → Env Vars.

## Folder structure

```
src/
├── app/          # routes: / (landing), /app (recorder + library), /api/auth
├── components/   # Recorder, NoteModal, UpgradeModal, AuthModal, Icons
└── lib/          # notes, useSpeech, useNotesStore, auth, db, actions
drizzle/          # generated migrations
```

See `PLANNER.md` for the full blueprint and `DESIGN_GUIDE.md` for the design system.
