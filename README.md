# 3Dsfera – Cosmic Luxury Expo Hall

Futuristic 3D exhibition floor built with Vite + React, Tailwind, Framer Motion, React Three Fiber/Drei, and Supabase for realtime chat.

## Setup

1) Install deps: `npm install`  
2) Set env in `.env`:
```
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```
3) Run dev server: `npm run dev`

## Supabase (RLS + Realtime)

SQL to create the `messages` table, enable RLS, and broadcast inserts:
```sql
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  content text not null,
  product_id text,
  sender uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Authenticated can insert messages"
  on public.messages for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can read messages"
  on public.messages for select
  using (true);

-- Realtime (Postgres Changes) should be enabled for the public schema / messages table
-- In the dashboard: Database > Replication > Replication slots > Start for public.messages
```

## Features
- Cinematic loader, tutorial modal, and orbit-limited controls over an infinite neon grid.
- Floating product pods with hover labels; clicking focuses the camera and opens the chat rail.
- Supabase realtime feed with `postgres_changes` subscription on `messages`.
- Glassmorphism UI, deep-space gradients, neon blue accents, Inter/Sora typography.

## File Map
- `src/App.jsx` — main experience shell and state (auth, products, chat, tutorial).
- `src/components/` — 3D scene, loader overlay, tutorial modal, auth card, chat overlay.
- `src/lib/supabaseClient.js` — Supabase client bootstrap.
- `tailwind.config.js`, `postcss.config.js`, `src/index.css` — styling system.
