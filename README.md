# Notably

Voice-to-text note taking. Press record, talk, get clean searchable text back — right in the browser. Five free notes a day, no account needed.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + CSS Modules
- Web Speech API (browser-native transcription, no API keys)
- Better Auth (email + password) for accounts
- Neon (Postgres) + Drizzle ORM for synced notes
- Stripe (Checkout + portal + webhooks) for the Pro tier
- OpenAI: Whisper fallback (`/api/transcribe`) + Pro note enrichment (title/summary/tags)
- Export: copy/download Markdown (all); email (Resend), Slack (webhook), Notion (Pro)
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

The app degrades gracefully — each tier is independent:

**Guest mode** (no vars): record, save, search, daily quota, all local.

**Accounts & sync:**
- `DATABASE_URL` — Neon pooled connection (runtime)
- `DATABASE_URL_UNPOOLED` — Neon direct connection (migrations)
- `BETTER_AUTH_SECRET` — auth signing secret (`openssl rand -base64 32`)
- `NEXT_PUBLIC_APP_URL` — canonical app URL

**Pro tier (Stripe):**
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` (the $5/mo recurring price), `STRIPE_WEBHOOK_SECRET`
- Add a Stripe webhook → `/api/webhooks/stripe` for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Enable the customer portal in the Stripe dashboard

**Whisper fallback + AI enrichment (OpenAI):**
- `OPENAI_API_KEY` — enables `/api/transcribe` (Firefox) and Pro note enrichment
- `OPENAI_ENRICH_MODEL` — optional, defaults to `gpt-4o-mini`

**Email export (Resend):**
- `RESEND_API_KEY`, `EXPORT_FROM_EMAIL` — enable "email this note" for Pro
- Slack & Notion export need no env vars — each Pro user connects their own (account menu → Integrations)

Full details in `PLANNER.md` → Env Vars. See `.env.example`.

## Folder structure

```
src/
├── app/          # routes: / (landing), /app, /api/auth, /api/transcribe, /api/webhooks/stripe
├── components/   # Recorder, NoteModal, UpgradeModal, AuthModal, ExportModal, IntegrationsModal, Icons
└── lib/          # notes, export, useSpeech, useMediaRecorder, useNotesStore, auth, stripe, db, actions (notes/billing/enrich/integrations)
drizzle/          # generated migrations
```

See `PLANNER.md` for the full blueprint and `DESIGN_GUIDE.md` for the design system.
