# Notably

Voice-to-text note-taking app. Speak, transcribe, save — no account needed.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind v4
- Web Speech API (browser-native)
- localStorage (no DB, no server)
- Vercel (deploy)

## Prerequisites

- Node.js >= 20.9.0
- Chrome or Edge (Web Speech API support)

## Local Setup

```bash
git clone https://github.com/mahtamun-hoque-fahim/notably.git
cd notably
npm install
npm run dev
```

Open http://localhost:3000

## Env Vars

None. Fully client-side.

## Commands

```
npm run dev        # local dev server
npm run build      # production build
npm run start      # serve production build
npm run typegen    # regenerate Next.js route types
```

## Folder Structure

```
src/
  app/          — pages + layout + globals.css
  components/   — landing/, notes/
  hooks/        — useVoice.ts
  lib/          — notes.ts (localStorage helpers)
```

## Deploy

Import repo on Vercel. No env vars needed. Framework: Next.js.
