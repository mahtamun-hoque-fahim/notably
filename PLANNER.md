# PLANNER.md — Notably

> Living technical document. Updated whenever `update repo` is triggered.
> Last updated: 2026-05-28

---

## Overview

| Field | Value |
|---|---|
| Project | Notably |
| Purpose | Turn spoken words into clean, searchable text notes — record, transcribe live, save. |
| Target User | Students, journalists, founders, writers — anyone who thinks out loud. |
| Key Value | Zero-friction voice capture in the browser. No install, no account to try, 5 free notes/day. |
| Status | 🔄 In Progress — Phases 1–3 complete |
| Repo | `https://github.com/mahtamun-hoque-fahim/notably` |
| Live URL | `(Vercel — to be connected)` |

---

## Architecture

**Stack:**
- Framework: Next.js 14 App Router (TypeScript)
- Styling: Tailwind CSS + CSS Modules (page-scoped)
- Transcription: **Web Speech API** (browser-native `SpeechRecognition`) — zero cost, no keys
- Persistence: **dual-mode** — localStorage for guests, **Neon (Postgres) + Drizzle ORM** for signed-in users
- Auth: **Better Auth** (email + password, Drizzle adapter, 30-day sessions)
- Billing: **Stripe** Checkout + customer portal + webhooks (Pro subscription)
- Fallback transcription: **OpenAI Whisper** (`/api/transcribe`) for browsers without Web Speech
- Export: copy/download Markdown (all users, client-side); **email (Resend), Slack (incoming webhook), Notion (internal integration)** for Pro
- Fonts: Geist Sans (`geist` pkg) + Instrument Serif (`next/font/google`)
- Deployment: Vercel (primary)

**Transcription paths:**
- **Primary** — Web Speech API, live, free, client-only (Chrome/Edge/Safari).
- **Fallback** — Firefox & others: MediaRecorder captures audio, posts to `/api/transcribe`, Whisper returns text. Session-gated (costs money per call); degrades to manual typing if not signed in or not configured.

**Data modes:**
- **Guest** — notes live in `localStorage`, quota tracked locally, resets at local midnight.
- **Signed in** — notes + quota live in Neon; enforced server-side via Server Actions; synced across devices. On first sign-in, local notes can be imported into the account.

**Folder Structure:**
```
/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts, metadata
│   │   ├── globals.css             # Design tokens + shared animations
│   │   ├── page.tsx                # Landing page (all sections)
│   │   ├── landing.module.css      # Landing-specific styles
│   │   ├── app/
│   │   │   ├── page.tsx            # The app: recorder + library + auth wiring
│   │   │   └── app.module.css      # App-specific styles
│   │   └── api/
│   │       ├── auth/[...all]/route.ts   # Better Auth handler (GET/POST)
│   │       ├── transcribe/route.ts      # Whisper fallback (Node, session-gated)
│   │       └── webhooks/stripe/route.ts # Stripe webhook → flips user.plan
│   ├── components/
│   │   ├── Icons.tsx               # Shared SVG icon set
│   │   ├── Recorder.tsx            # Web Speech + Whisper fallback + manual typing
│   │   ├── NoteModal.tsx           # View / edit a saved note
│   │   ├── UpgradeModal.tsx        # Quota hit → starts Stripe checkout
│   │   ├── AuthModal.tsx           # Sign in / create account
│   │   ├── ExportModal.tsx         # Copy/download (all) + email/slack/notion (Pro)
│   │   └── IntegrationsModal.tsx   # Manage Slack webhook + Notion connection
│   └── lib/
│       ├── notes.ts                # Local note CRUD, quota, formatters
│       ├── export.ts               # Client export: markdown / copy / download
│       ├── useSpeech.ts            # Web Speech API hook (primary)
│       ├── useMediaRecorder.ts     # MediaRecorder → Whisper hook (fallback)
│       ├── useNotesStore.ts        # Dual-mode store (local ⇄ server)
│       ├── auth.ts                 # Better Auth server instance
│       ├── auth-client.ts          # Better Auth React client
│       ├── stripe.ts               # Lazy Stripe client + billing config
│       ├── db/
│       │   ├── index.ts            # Edge-safe Neon HTTP db client
│       │   └── schema.ts           # Drizzle schema (auth + app + stripe + integrations)
│       └── actions/
│           ├── notes.ts            # Server Actions: note CRUD + server quota
│           ├── billing.ts          # Server Actions: checkout + customer portal
│           ├── enrich.ts           # Server Action: LLM title/summary/tags (Pro)
│           └── integrations.ts     # Server Actions: connections + export dispatch
├── drizzle/                        # Generated migrations
├── drizzle.config.ts
├── .env.example
├── PLANNER.md
├── DESIGN_GUIDE.md
└── README.md
```

---

## User Flows

### Flow 1: First voice note (no account)
1. User lands on `/`, clicks **Start recording** → `/app`
2. Picks language (default English US), presses the mic button
3. Browser asks for mic permission → granted
4. User talks; words stream into the transcript live, waveform animates, timer counts up
5. User presses stop (or hits the 5-min cap) → enters review mode
6. User edits the transcript if needed, presses **Save note**
7. Note appears in the library with an auto-generated title; daily quota decrements

### Flow 2: Browse & search library
1. On `/app`, saved notes render as cards (newest first)
2. User types in the search box → filters by title or body text
3. User clicks a card → modal opens with full text, editable title + body
4. User edits, presses **Save**, or deletes via the trash icon on the card

### Flow 3: Hit the free limit
1. User has saved 5 notes today; quota pill reads "0 of 5 free notes left"
2. User presses the mic → **Upgrade modal** appears
3. User can dismiss ("Maybe later") — quota resets at local midnight

---

## DB Schema

**Guest mode: none** — `localStorage` keys:
- `notably.notes.v1` → `Note[]`
- `notably.quota.v1` → `{ date: "YYYY-MM-DD", count: number }`

**Signed-in mode: Neon (Postgres) via Drizzle** (`src/lib/db/schema.ts`).

Better Auth core tables:
- `user` — id, name, email (unique), emailVerified, image, **plan** ('free'|'pro'), **stripeCustomerId**, **stripeSubscriptionId**, timestamps
- `session` — id, expiresAt, token (unique), ipAddress, userAgent, userId(fk), timestamps
- `account` — id, accountId, providerId, userId(fk), tokens, password, timestamps
- `verification` — id, identifier, value, expiresAt, timestamps

App tables:
- `notes` — id, userId(fk, cascade), title, body, **summary** (AI, nullable), **tags** (AI, text[]), durationMs, lang, createdAt, updatedAt · index on userId
- `usage` — id, userId(fk, cascade), date ("YYYY-MM-DD" local), count · **unique(userId, date)** → server-enforced daily quota
- `integrations` — id, userId(fk, cascade), provider ('slack'|'notion'), config (JSON string of secrets) · **unique(userId, provider)**

Migrations: `0000` (initial), `0001` (stripe columns), `0002` (note summary + tags), `0003` (integrations). Apply with `npm run db:migrate`.

**Local `Note` shape (`src/lib/notes.ts`):**
```ts
type Note = {
  id: string; title: string; body: string;
  createdAt: number; durationMs: number; lang: string;
}
```

---

## API Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET/POST | `/api/auth/[...all]` | — | Better Auth (sign up, sign in, session, sign out) |
| POST | `/api/transcribe` | session | Whisper fallback for non-WebSpeech browsers |
| POST | `/api/webhooks/stripe` | signature | Flip `user.plan` on subscription events |

**Server Actions** (session-gated):
| Action | File | Purpose |
|---|---|---|
| `listNotesAction()` | notes | Fetch the user's notes |
| `getUsageAction(localDate)` | notes | Today's used/remaining + plan |
| `createNoteAction(...)` | notes | Create a note; enforces free quota server-side |
| `updateNoteAction(...)` | notes | Edit a note (ownership-checked) |
| `deleteNoteAction(id)` | notes | Delete a note (ownership-checked) |
| `importNotesAction(items)` | notes | Bulk-migrate local notes on first sign-in (quota-exempt) |
| `startCheckoutAction()` | billing | Create a Stripe Checkout session → returns URL |
| `openPortalAction()` | billing | Create a Stripe customer-portal session → returns URL |
| `enrichNoteAction(id)` | enrich | **Pro:** LLM-generate title + summary + tags for a note |
| `getConnectionsAction()` | integrations | Which providers are connected (no secrets) + email availability |
| `saveSlackAction / saveNotionAction` | integrations | **Pro:** store a Slack webhook / Notion token+page |
| `removeConnectionAction(provider)` | integrations | Disconnect a provider |
| `exportNoteAction(id, target, email?)` | integrations | **Pro:** send a note to email / Slack / Notion |

**Webhook events handled:** `checkout.session.completed` → set plan `pro`; `customer.subscription.updated` → `pro` if active/trialing else `free`; `customer.subscription.deleted` → `free`.

---

## Env Vars

**Guest mode: none.** The app runs and saves locally with zero config.
**Accounts & sync require:**

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | accounts | Neon pooled connection (app runtime) |
| `DATABASE_URL_UNPOOLED` | accounts | Neon direct connection (migrations only) |
| `BETTER_AUTH_SECRET` | accounts | Better Auth signing secret (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | accounts | Canonical app URL (Better Auth base URL, Stripe redirects) |
| `STRIPE_SECRET_KEY` | Pro | Stripe secret key |
| `STRIPE_PRICE_ID` | Pro | Price ID for the $5/mo Pro subscription |
| `STRIPE_WEBHOOK_SECRET` | Pro | Verifies incoming Stripe webhooks |
| `OPENAI_API_KEY` | fallback + AI | Whisper transcription + note enrichment |
| `OPENAI_ENRICH_MODEL` | optional | Model for enrichment (default `gpt-4o-mini`) |
| `RESEND_API_KEY` | email export | Resend API key for emailing notes |
| `EXPORT_FROM_EMAIL` | email export | Verified Resend "from" address |

Tiers degrade independently: no DB → guest mode; DB but no Stripe → accounts + sync, no Pro; no OpenAI key → no cloud transcription fallback (manual typing instead).

See `.env.example`.

---

## Timeline / Phases

| Phase | Status | Key tasks |
|---|---|---|
| **Phase 1 — MVP** | ✅ Complete | Landing page; in-browser recorder (Web Speech); live transcript; save/edit/delete; search; 5/day quota + upgrade modal; localStorage persistence |
| **Phase 2 — Accounts & sync** | ✅ Complete | Better Auth (email+password); Neon + Drizzle schema; Server Actions for notes & server-side quota; dual-mode store; cross-device sync; local→account import on sign-in |
| **Phase 3 — Pro tier & fallback** | ✅ Complete | Stripe Checkout + customer portal + webhooks (plan sync); upgrade flow wired end-to-end; Pro badge + manage-subscription; Whisper `/api/transcribe` fallback + MediaRecorder capture for Firefox |
| **Phase 4 — AI + export** | 🔄 In progress | ✅ LLM auto-title/summary/tags (Pro); ✅ export: copy/download Markdown (all) + email/Slack/Notion (Pro) + Integrations manager. ⏳ speaker labels; admin + staff dashboards; OAuth + email verification |

---

## Next Steps

1. **Provision Neon** + set `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` in Vercel; run `npm run db:migrate`.
2. **Stripe setup:** create a $5/mo recurring Price, set `STRIPE_SECRET_KEY` + `STRIPE_PRICE_ID`; add a webhook endpoint pointing at `/api/webhooks/stripe` for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`; set `STRIPE_WEBHOOK_SECRET`. Enable the customer portal in the Stripe dashboard.
3. **Whisper:** set `OPENAI_API_KEY` to enable cloud transcription for Firefox users.
4. Test full flows: sign up → record → sync; quota hit → checkout → Pro → manage/cancel; Firefox → record → Whisper.
5. Add email verification + password reset (wire Resend).
6. Add OAuth providers (GitHub / Google) via Better Auth `socialProviders`.
7. Add rate limiting on auth + transcribe + enrich endpoints (Upstash / Arcjet).
8. Finish Phase 4: speaker labels, admin + staff dashboards (per reference design).
9. Optional: upgrade Slack/Notion from paste-credentials to full OAuth connect flows.
