# Notably

Voice-powered note taking app — speak to capture, type to refine.

## Stack

- Next.js 16 App Router (TypeScript)
- Tailwind CSS v4
- Neon (PostgreSQL) + Drizzle ORM
- Clerk (auth)
- Vercel + Cloudflare Pages

## Prerequisites

- Node.js 20+
- Neon database project
- Clerk application

## Setup

```bash
git clone https://github.com/mahtamun-hoque-fahim/notably.git
cd notably
npm install
cp .env.example .env.local
# Fill in all values in .env.local
npx drizzle-kit push
npm run dev
```

## Env Vars

See `.env.example` for all required variables. Full descriptions in `PLANNER.md`.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npx drizzle-kit push # Push schema to Neon (dev)
npx drizzle-kit generate  # Generate migration files
npx drizzle-kit migrate   # Run migrations (prod)
```

## Folder Structure

```
app/           Next.js pages + API routes
components/    Sidebar, NoteEditor, UI primitives
lib/db/        Drizzle schema + Neon client
middleware.ts  Clerk auth guard
drizzle/       Generated migration files
```

## Deploy

- **Vercel**: connect repo, add env vars, deploy `main`
- **Cloudflare Pages**: connect repo, build command `npm run build`, output `.next`
