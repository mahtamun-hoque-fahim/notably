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
| Status | 🔄 In Progress — Phases 1 & 2 complete |
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
- Fonts: Geist Sans (`geist` pkg) + Instrument Serif (`next/font/google`)
- Deployment: Vercel (primary)

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
│   │       └── auth/[...all]/route.ts  # Better Auth handler (GET/POST)
│   ├── components/
│   │   ├── Icons.tsx               # Shared SVG icon set
│   │   ├── Recorder.tsx            # Record → live transcript → review → save
│   │   ├── NoteModal.tsx           # View / edit a saved note
│   │   ├── UpgradeModal.tsx        # Shown when daily quota is hit
│   │   └── AuthModal.tsx           # Sign in / create account
│   └── lib/
│       ├── notes.ts                # Local note CRUD, quota, formatters
│       ├── useSpeech.ts            # Web Speech API hook
│       ├── useNotesStore.ts        # Dual-mode store (local ⇄ server)
│       ├── auth.ts                 # Better Auth server instance
│       ├── auth-client.ts          # Better Auth React client
│       ├── db/
│       │   ├── index.ts            # Edge-safe Neon HTTP db client
│       │   └── schema.ts           # Drizzle schema (auth + app tables)
│       └── actions/
│           └── notes.ts            # Server Actions: note CRUD + server quota
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
- `user` — id, name, email (unique), emailVerified, image, **plan** ('free'|'pro'), createdAt, updatedAt
- `session` — id, expiresAt, token (unique), ipAddress, userAgent, userId(fk), timestamps
- `account` — id, accountId, providerId, userId(fk), tokens, password, timestamps
- `verification` — id, identifier, value, expiresAt, timestamps

App tables:
- `notes` — id, userId(fk, cascade), title, body, durationMs, lang, createdAt, updatedAt · index on userId
- `usage` — id, userId(fk, cascade), date ("YYYY-MM-DD" local), count · **unique(userId, date)** → server-enforced daily quota

Migration generated at `drizzle/0000_*.sql`. Apply with `npm run db:migrate`.

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

**Server Actions** (`src/lib/actions/notes.ts`, all session-gated):
| Action | Purpose |
|---|---|
| `listNotesAction()` | Fetch the signed-in user's notes |
| `getUsageAction(localDate)` | Today's used/remaining + plan |
| `createNoteAction(...)` | Create a note; enforces free quota server-side |
| `updateNoteAction(...)` | Edit a note (ownership-checked) |
| `deleteNoteAction(id)` | Delete a note (ownership-checked) |
| `importNotesAction(items)` | Bulk-migrate local notes on first sign-in (quota-exempt) |

**Phase 3 (planned):** `/api/transcribe` (Whisper fallback), `/api/checkout` + `/api/webhooks/stripe` (Pro billing).

---

## Env Vars

**Guest mode: none.** The app runs and saves locally with zero config.
**Accounts & sync require:**

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Neon pooled connection (app runtime) |
| `DATABASE_URL_UNPOOLED` | yes | Neon direct connection (migrations only) |
| `BETTER_AUTH_SECRET` | yes | Better Auth signing secret (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | yes | Canonical app URL (Better Auth base URL) |
| `OPENAI_API_KEY` | Phase 3 | Whisper transcription fallback |
| `STRIPE_SECRET_KEY` | Phase 3 | Pro billing |
| `STRIPE_WEBHOOK_SECRET` | Phase 3 | Stripe webhook verification |

See `.env.example`.

---

## Timeline / Phases

| Phase | Status | Key tasks |
|---|---|---|
| **Phase 1 — MVP** | ✅ Complete | Landing page; in-browser recorder (Web Speech); live transcript; save/edit/delete; search; 5/day quota + upgrade modal; localStorage persistence |
| **Phase 2 — Accounts & sync** | ✅ Complete | Better Auth (email+password); Neon + Drizzle schema; Server Actions for notes & server-side quota; dual-mode store; cross-device sync; local→account import on sign-in |
| **Phase 3 — Pro tier** | ⏳ | Stripe billing; unlimited + 4h notes; Whisper fallback; auto-titles/summaries/tags via LLM; speaker labels |
| **Phase 4 — Power features** | ⏳ | Notion/Slack/email export; admin + staff dashboards (per design ref); offline queue; OAuth + email verification |

---

## Next Steps

1. **Provision Neon** + set `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` in Vercel.
2. Run `npm run db:migrate` against the Neon DB to create the tables.
3. Verify the full auth flow on the deploy (sign up → record → sync → sign out → sign in elsewhere).
4. Add email verification + a password-reset flow (wire Resend for transactional email).
5. Add OAuth providers (GitHub / Google) via Better Auth `socialProviders`.
6. Add rate limiting on the auth endpoints (Upstash / Arcjet).
7. Begin Phase 3: Stripe checkout → flip `user.plan` to `pro` and lift the cap; Whisper `/api/transcribe` fallback for Firefox.
