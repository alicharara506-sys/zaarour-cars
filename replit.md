# ZAAROUR

A premium automotive showroom with demo inventory and Supabase-ready administration.

## Run & Operate

- `pnpm --filter @workspace/zaarour run dev` — interactive dealership website
- `pnpm --filter @workspace/zaarour run build:static` — prerender public pages and generate seed SQL
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- No environment variables required for browser-local demo mode.
- See `.env.example` and `README.md` for optional live Supabase and hosting configuration.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Website: React + Vite + Tailwind, Framer Motion, Three.js/react-three-fiber
- Live data/auth/storage: direct Supabase client with admin allowlist and RLS
- Supplied Express/Drizzle packages remain scaffolding, not dealership dependencies.

## Where things live

- `artifacts/zaarour/src` — public pages, admin, browser demo store and Supabase client
- `artifacts/zaarour/scripts` — crawler renderer and prerendering
- `supabase/schema.sql` / `supabase/seed.sql` — live project setup
- `api/seo.mjs` / `netlify/functions/seo.mjs` — on-demand HTML and live sitemap

## Architecture decisions

- Demo mode is explicitly browser-local. Do not present it as secure authentication or shared persistence.
- Model/photographs illustrate demo vehicles; actual stock photography and confirmed business details are needed before launch.

## Product

Inventory search/filter/sort, complete vehicle pages, a lazy interactive 3D showroom,
WhatsApp contact, and local-demo or live Supabase administration. Full setup is in README.md.

## User preferences

The original full feature brief is in the attached text file; durable scope decisions are indexed in agent memory.

## Gotchas

- No Supabase project was connected for this demo; do not claim live Auth/Storage verification.
- Static-only hosts need rebuilding after inventory changes; included Vercel/Netlify functions read live public inventory.
- Set VITE_SITE_URL to the actual published origin before indexing. Never use a development domain as a production canonical.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
