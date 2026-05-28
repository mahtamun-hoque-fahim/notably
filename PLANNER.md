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
| Status | 🔄 In Progress — Phase 1 (MVP) complete |
| Repo | `https://github.com/mahtamun-hoque-fahim/notably` |
| Live URL | `(Vercel — to be connected)` |

---

## Architecture

**Stack:**
- Framework: Next.js 14 App Router (TypeScript)
- Styling: Tailwind CSS + CSS Modules (page-scoped)
- Transcription: **Web Speech API** (browser-native `SpeechRecognition`) — zero cost, no keys
- Persistence: **localStorage** (MVP) → Neon (Postgres) + Drizzle planned for Phase 2
- Fonts: Geist Sans (`geist` pkg) + Instrument Serif (`next/font/google`)
- Auth: None yet → Better Auth planned (Phase 2)
- Deployment: Vercel (primary)

**Folder Structure:**
```
/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, fonts, metadata
│   │   ├── globals.css         # Design tokens + shared animations
│   │   ├── page.tsx            # Landing page (all sections)
│   │   ├── landing.module.css  # Landing-specific styles
│   │   └── app/
│   │       ├── page.tsx        # The app: recorder + library
│   │       └── app.module.css  # App-specific styles
│   ├── components/
│   │   ├── Icons.tsx           # Shared SVG icon set
│   │   ├── Recorder.tsx        # Record → live transcript → review → save
│   │   ├── NoteModal.tsx       # View / edit a saved note
│   │   └── UpgradeModal.tsx    # Shown when daily quota is hit
│   └── lib/
│       ├── notes.ts            # Note CRUD, quota logic, formatters
│       └── useSpeech.ts        # Web Speech API hook
├── public/
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

**Phase 1: none.** All state in `localStorage`:
- `notably.notes.v1` → `Note[]`
- `notably.quota.v1` → `{ date: "YYYY-MM-DD", count: number }`

**Note shape (`src/lib/notes.ts`):**
```ts
type Note = {
  id: string;          // n_<base36ts>_<rand>
  title: string;       // auto-generated, editable
  body: string;        // transcript text
  createdAt: number;   // epoch ms
  durationMs: number;  // recording length
  lang: string;        // BCP-47 code, e.g. "en-US"
}
```

**Phase 2 (planned, Drizzle / Neon):**
```ts
// users      — id, email, name, plan ('free'|'pro'), createdAt
// notes       — id, userId(fk), title, body, durationMs, lang, createdAt, updatedAt
// usage       — id, userId(fk), date, count   (daily quota, server-enforced)
```

---

## API Routes

**Phase 1: none** (fully client-side).

**Phase 2 (planned):**
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/notes` | session | Create a note (server quota check) |
| GET | `/api/notes` | session | List the user's notes |
| PATCH | `/api/notes/:id` | session | Edit a note |
| DELETE | `/api/notes/:id` | session | Delete a note |
| POST | `/api/transcribe` | session | Whisper fallback for non-WebSpeech browsers |
| POST | `/api/checkout` | session | Stripe checkout for Pro |
| POST | `/api/webhooks/stripe` | signature | Update plan on payment |

---

## Env Vars

**Phase 1: none required.** App runs with zero config.

**Phase 2 (planned):**
| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Neon pooled connection |
| `DATABASE_URL_UNPOOLED` | yes | Neon direct (migrations only) |
| `BETTER_AUTH_SECRET` | yes | Better Auth signing secret |
| `NEXT_PUBLIC_APP_URL` | yes | Canonical app URL |
| `OPENAI_API_KEY` | optional | Whisper transcription fallback |
| `STRIPE_SECRET_KEY` | optional | Pro billing |
| `STRIPE_WEBHOOK_SECRET` | optional | Stripe webhook verification |

---

## Timeline / Phases

| Phase | Status | Key tasks |
|---|---|---|
| **Phase 1 — MVP** | ✅ Complete | Landing page; in-browser recorder (Web Speech); live transcript; save/edit/delete; search; 5/day quota + upgrade modal; localStorage persistence |
| **Phase 2 — Accounts & sync** | ⏳ | Better Auth; Neon + Drizzle; server-side notes & quota; cross-device sync |
| **Phase 3 — Pro tier** | ⏳ | Stripe billing; unlimited + 4h notes; Whisper fallback; auto-titles/summaries/tags via LLM; speaker labels |
| **Phase 4 — Power features** | ⏳ | Notion/Slack/email export; admin + staff dashboards (per design ref); offline queue |

---

## Next Steps

1. Connect the repo to Vercel and verify the production deploy.
2. Stand up Neon + Drizzle schema (`users`, `notes`, `usage`) behind a `getDb()` stub.
3. Add Better Auth (email + OAuth), gate `/app` library sync behind a session.
4. Migrate localStorage notes into the account on first sign-in.
5. Add a Whisper `/api/transcribe` fallback for Firefox / unsupported browsers.
6. Wire Stripe checkout to flip `plan` → `pro` and lift the daily cap.
