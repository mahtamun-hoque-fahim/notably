# PLANNER.md — Notably

> Living technical document. Updated whenever `update repo` is triggered.
> Last updated: 2025-05-20

---

## Overview

| Field | Value |
|---|---|
| Project | Notably |
| Purpose | Voice-to-text note taking app — capture thoughts instantly by speaking |
| Target User | Individuals who want a fast, distraction-free note taking experience |
| Key Value | Browser-native voice transcription with a clean dark editor |
| Status | 🔄 In Progress |
| Repo | `https://github.com/mahtamun-hoque-fahim/notably` |
| Live URL | TBD |

---

## Architecture

**Stack:**
- Framework: Next.js 16 App Router (TypeScript)
- Styling: Tailwind CSS v4
- Database: Neon (PostgreSQL) via Drizzle ORM
- Auth: Clerk
- Storage: Cloudinary (Phase 3 — audio files)
- Transcription: Web Speech API (Phase 2) + OpenAI Whisper API (Phase 3)
- Deployment: Vercel + Cloudflare Pages

**Folder Structure:**
```
/
├── app/
│   ├── (auth)/sign-in, sign-up     ← Clerk hosted UI
│   ├── (app)/                      ← Protected app shell
│   │   ├── layout.tsx              ← Sidebar + main area
│   │   ├── page.tsx                ← Empty state
│   │   ├── note/[id]/page.tsx      ← Note editor
│   │   └── folder/[id]/page.tsx    ← Folder view
│   ├── api/
│   │   ├── notes/route.ts          ← GET list, POST create
│   │   ├── notes/[id]/route.ts     ← GET, PUT, DELETE
│   │   ├── folders/route.ts        ← GET list, POST create
│   │   ├── folders/[id]/route.ts   ← PUT, DELETE
│   │   └── transcribe/route.ts     ← Phase 3 (Whisper)
│   ├── layout.tsx                  ← Root layout, ClerkProvider, fonts
│   └── globals.css                 ← CSS variables, resets
├── components/
│   ├── ui/                         ← Reusable primitives
│   ├── sidebar/Sidebar.tsx         ← Nav, folders, notes list
│   └── editor/NoteEditor.tsx       ← Title + content editor, toolbar
├── lib/
│   └── db/
│       ├── index.ts                ← Edge-compatible neon-http driver
│       └── schema.ts               ← Drizzle schema (notes, folders)
├── middleware.ts                   ← Clerk auth guard
├── drizzle.config.ts
├── .env.example
├── PLANNER.md
├── DESIGN_GUIDE.md
└── README.md
```

---

## User Flows

### Flow 1: Sign Up
1. User visits `/` → redirected to `/sign-in`
2. Clicks "Sign Up" → Clerk hosted UI at `/sign-up`
3. Email/password or OAuth → Clerk creates user
4. Redirected to `/app` (empty state)

### Flow 2: Create & Edit Note
1. User clicks "New Note" in sidebar
2. POST `/api/notes` → note created → redirect to `/app/note/[id]`
3. User types in title / content fields
4. Auto-save fires 800ms after last keystroke (PUT `/api/notes/[id]`)
5. "Saved" indicator confirms sync

### Flow 3: Voice Transcription (Phase 2)
1. User clicks mic button in note toolbar
2. `useVoiceRecorder` hook starts `MediaRecorder` + Web Speech API
3. Interim transcriptions shown in real-time
4. On stop → final text appended to note content
5. Auto-save fires

### Flow 4: Folders
1. User clicks + next to Folders in sidebar
2. Types folder name → Enter → POST `/api/folders`
3. Sidebar refreshes, new folder appears
4. Clicking folder → `/app/folder/[id]` shows filtered notes

---

## DB Schema

```ts
// folders
export const folders = pgTable("folders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#00e676"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// notes
export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  title: text("title").notNull().default("Untitled"),
  content: text("content").notNull().default(""),
  isPinned: boolean("is_pinned").notNull().default(false),
  wordCount: text("word_count").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notes` | Clerk | List user notes (optional `?folderId=`) |
| POST | `/api/notes` | Clerk | Create note |
| GET | `/api/notes/[id]` | Clerk | Get single note |
| PUT | `/api/notes/[id]` | Clerk | Update note |
| DELETE | `/api/notes/[id]` | Clerk | Delete note |
| GET | `/api/folders` | Clerk | List user folders |
| POST | `/api/folders` | Clerk | Create folder |
| PUT | `/api/folders/[id]` | Clerk | Update folder |
| DELETE | `/api/folders/[id]` | Clerk | Delete folder |
| POST | `/api/transcribe` | Clerk | Whisper transcription (Phase 3) |

---

## Env Vars

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | ✅ | Neon direct connection (migrations) |
| `BETTER_AUTH_SECRET` | ✅ | BetterAuth signing secret (32+ chars) |
| `BETTER_AUTH_URL` | ✅ | App base URL (e.g. https://notably.vercel.app) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL |
| `OPENAI_API_KEY` | ⚠️ Phase 3 | Whisper transcription |
| `CLOUDINARY_CLOUD_NAME` | ⚠️ Phase 3 | Audio file storage |
| `CLOUDINARY_API_KEY` | ⚠️ Phase 3 | Cloudinary uploads |
| `CLOUDINARY_API_SECRET` | ⚠️ Phase 3 | Cloudinary uploads |

---

## Phases & Timeline

| Phase | Name | Status | Key Tasks |
|---|---|---|---|
| 1 | Core Notes + Auth | ✅ | BetterAuth (email/password), Neon/Drizzle, note CRUD, sidebar, editor |
| 2 | Voice Transcription | ✅ | `useVoiceRecorder` hook, Web Speech API, floating mic button, waveform, interim preview |
| 3 | Whisper + Audio | ✅ | MediaRecorder parallel capture, Cloudinary audio upload, OpenAI Whisper re-transcription, fallback mode |
| 4 | Search + Polish | ⏳ | Full-text search, tags, keyboard shortcuts, Lighthouse audit |

---

## Next Steps

1. [ ] Push schema to Neon: `npx drizzle-kit push`
2. [ ] Add all env vars to Vercel + Cloudflare Pages dashboards
3. [ ] Test auth flow (sign-in, sign-up, protected routes)
4. [ ] Test note CRUD end-to-end
5. [ ] Begin Phase 2: `useVoiceRecorder` hook + mic button in editor toolbar

---

## Decisions Log

- **2025-05-20** — Auth: BetterAuth + Drizzle adapter + email/password. Clerk was scaffolded in Phase 1 and removed before deployment in favour of BetterAuth (no third-party dependency, full control over sign-in UI).
- **2025-05-20** — Voice: Web Speech API (browser-native, free). Whisper added in Phase 3 as accuracy upgrade.
- **2025-05-20** — DB: `wordCount` stored as `text` to avoid integer migration friction; parsed to number on client.
- **2025-05-20** — Auto-save: 800ms debounce on title + content changes. No manual save button.
- **2025-05-20** — Voice interim: shown inline in content textarea (readOnly during recording) and in status bar. Final transcript appended to content on `isFinal` event.
