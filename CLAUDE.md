@AGENTS.md

# Project: AppStore

## What this app does
A personal app portfolio — a public-facing store where Adarsh showcases apps he has built.
Visitors can browse apps, see ratings, filter by category, and open the live app.
Admin mode (password-protected) allows adding, editing, deleting apps and changing ratings inline.

## Stack
- Framework: Next.js (App Router)
- Styling: Tailwind CSS
- Database: Supabase (Postgres) — project: `rnejrzbqomwbtispoasy`
- Storage: Supabase Storage — bucket: `screenshots` (public)
- Deployment: Vercel

## Pages
- `/` — Public store + inline admin mode (password modal, sessionStorage auth)
- `/admin` — Redirects to `/` (admin is now inline on the store page)

## API routes
- `GET /api/apps` — List all apps (public)
- `POST /api/apps` — Create app (requires `x-admin-password` header)
- `PATCH /api/apps/[id]` — Update app (requires `x-admin-password` header)
- `DELETE /api/apps/[id]` — Delete app (requires `x-admin-password` header)
- `POST /api/apps/upload` — Upload screenshot to Supabase Storage (requires `x-admin-password` header)
- `POST /api/webhooks/vercel` — Auto-creates app entry on Vercel production deployment (HMAC-SHA1 verified)

## Database
Single table: `apps`
- `id` uuid PK
- `name` text
- `description` text
- `url` text
- `screenshot_url` text
- `rating` text — 'great' | 'good' | 'bad'
- `tags` text[] — e.g. ['AI', 'Dev Tools']
- `created_at` timestamptz

## Key features
- Screenshot upload: JPEG/PNG/WebP → Supabase Storage → public URL
- Vercel webhook: on production `deployment.succeeded`, screenshots via `image.thum.io`, auto-inserts app entry
- Tag filtering + search: client-side, filter by tag pills or search by name/description
- PWA: manifest.json, theme-color, apple-web-app-capable

## Environment variables (never commit)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_PASSWORD` — password for admin mode
- `VERCEL_WEBHOOK_SECRET` — HMAC secret for Vercel webhook verification

## Key commands
- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run lint` — run linter

## Rules for Claude
- Always use TypeScript
- Use Tailwind for all styling — no inline styles
- Admin auth is header-based (`x-admin-password`) — no Supabase Auth
- Never modify `/lib/supabase.ts` directly
- Always handle loading and error states in UI
- App is a PWA — keep manifest.json and mobile layout intact
