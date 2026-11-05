# ZAAROUR

A premium new and used car showroom for **ZAAROUR, Moawad, Lebanon**. All prices
are in **US Dollars**, and all odometer readings are in **kilometres**.

## Demo versus live operation

This delivery starts as a **demo with Supabase setup**, as requested.

- The public website runs immediately with ten realistic example vehicles.
  Stock photographs are illustrative and may not show the exact listed trim.
- The demo admin workspace is explicitly public and stores changes in **your
  browser only**. It is not a login system. Clearing browser storage clears
  these changes; other visitors do not see them.
- Demo inquiries are stored on that browser, **not delivered to ZAAROUR**.
- Live admin login, shared inventory, inquiry storage and image storage require
  your own Supabase project and the setup below. There is no default admin
  password, local password database or authentication bypass.
- The contact number, hours, social profiles and map location need verification
  before public launch. The `+961 00 000 000` number is intentionally a placeholder.
- No paid API, model generation service, email, SMS or live-chat service is used.
  Hosting providers' and Supabase's current free-tier limits still apply.

## Stack and repository

React, TypeScript, Vite, Tailwind CSS, Framer Motion, Three.js,
react-three-fiber/drei, TanStack Query and Supabase JS. The web app lives at
`artifacts/zaarour`; the other workspace packages are the supplied shared tools.
The dealership does not depend on the scaffold Express API or Replit database.

```
artifacts/zaarour/src/        Interactive website, demo data, Supabase adapters
artifacts/zaarour/scripts/    Public-page prerendering and crawler renderer
supabase/schema.sql          Tables, constraints, RLS and image-bucket policies
supabase/seed.sql            Generated example vehicles, makes and settings
api/seo.mjs                  Vercel on-demand public HTML and sitemap
netlify/functions/seo.mjs    Netlify equivalent
vercel.json / netlify.toml   Hosting configuration
```

## Local setup

Use **Node.js 24** and pnpm. No secrets are required for demo mode.

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example artifacts/zaarour/.env.local
pnpm --filter @workspace/zaarour run dev
```

Open the URL printed by Vite (default port 5173). In Replit use the existing
ZAAROUR preview workflow, which supplies its own port.

```sh
pnpm --filter @workspace/zaarour run typecheck
pnpm --filter @workspace/zaarour run build:static
pnpm --filter @workspace/zaarour run serve
```

`build:static` generates crawler-visible HTML for every public route, a sitemap,
robots.txt and the repeat-safe `supabase/seed.sql`.

## Supabase setup

1. Create a Supabase project on a plan appropriate for your usage.
2. Run **`supabase/schema.sql` once** in that project's SQL editor.
3. Run **`supabase/seed.sql`** if you want example inventory. Omit this step if
   you want an empty live showroom. Running the seed again does not replace
   existing car rows.
4. In `artifacts/zaarour/.env.local` (or your host's environment settings), set:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-PUBLIC-ANON-OR-PUBLISHABLE-KEY
   VITE_SITE_URL=https://YOUR-REAL-PUBLISHED-DOMAIN
   VITE_WHATSAPP_NUMBER=YOUR-COUNTRY-CODE-AND-NUMBER
   ```

   The URL and anon/publishable key are public client configuration, protected
   by RLS. **Never put a service-role key in a `VITE_` variable.** Keep every real
   key out of Git even if it is public configuration. `.env.example` contains
   names and placeholders only.
5. Restart development, or rebuild/redeploy after changing Vite variables.
6. Disable public email sign-ups if you do not need them. Only explicitly
   allowlisted users can write inventory even if sign-up remains enabled.
7. Configure the Supabase authentication Site URL and allowed redirect URLs for
   your actual domain. Email/password admin login does not depend on OAuth.

### Create the first administrator

Create an email/password user in **Supabase Authentication → Users**. Confirm
the email according to your project's authentication policy. Copy that user's
UUID, then run this SQL from the trusted Supabase SQL editor:

```sql
insert into public.admin_users(user_id)
values ('REPLACE-WITH-AUTH-USER-UUID');
```

Visit `/admin` and sign in with that user's credentials. A normal authenticated
user who is not in `admin_users` cannot manage inventory. Browser clients have
no INSERT/UPDATE/DELETE grant on `admin_users`; they cannot enroll themselves.
To remove access, delete the allowlist row using the trusted SQL editor and
revoke the user's sessions in Supabase.

### Security and data model

- `cars`: indexed ID/slug plus full camelCase vehicle document in `data` JSONB.
  Prices, mileage, year, document identity and image-array structure have DB
  constraints. Vehicle images are ordered in the document; the first is main.
- `car_images`: optional relational image metadata for future imports. The
  current app uses the ordered `cars.data.images` array as its source of truth.
- `makes`: name and optional public logo URL.
- `settings`: singleton `id='dealership'`, configuration in `data`.
- `inquiries`: contact forms and WhatsApp **click** events, never WhatsApp message
  contents or delivery confirmations.
- `admin_users`: trusted UUID allowlist, not a password table.
- Public reads honor `sold && hideSold`; protected writes require `is_admin()`.
- The public `dealership` storage bucket accepts JPEG/PNG/WebP up to 5 MB per
  upload. Only allowlisted admins can upload, change or delete photos.
  Do not place personal documents in this public marketing bucket.
- Public visitors may insert bounded inquiries, but cannot read inquiries or
  mark them handled. Consider a free server-side anti-abuse/rate-limit layer
  before promoting the public form to high-traffic audiences; RLS is access
  control, not bot protection.

SQL is intended for a **new project**. Do not rerun `schema.sql` over an existing
installation; write a reviewed migration instead.

## Administrator workflow

The workspace supports all vehicle details, multiple images, main-image
selection/reordering, featured/new-arrival flags, sold visibility, makes,
inquiries and settings. Demo mode uses a separate local backend; live mode
uses Supabase Auth, RLS and Storage.

### WhatsApp, social profiles and business information

Use **Admin → Settings** to change the WhatsApp number, telephone, address,
working hours, and Facebook/Instagram/TikTok/X links. In demo mode these values
apply to that browser only. In live mode they are shared.

`VITE_WHATSAPP_NUMBER` provides the default before a settings row exists.
Store phone numbers with their country code; WhatsApp links strip punctuation.
Every vehicle link prepares a message including the particular vehicle.

Social URLs begin as `#`, deliberately, per the brief. Replace them before
launch. Confirm the exact showroom location before replacing the approximate
OpenStreetMap area pin. Approximate coordinates are not a verified business
address. Do not publish invented opening hours or customer testimonials.

## Free hosting setup

No paid dependency is needed. Free hosting is subject to each provider's
eligibility, quota and usage rules; this repository cannot guarantee permanent
zero hosting cost for every usage level.

### Vercel

1. Import `alicharara506-sys/zaarour-cars`, branch `main`.
2. Keep the project root at the **repository root**, not the web subdirectory.
3. Select Node 24; `vercel.json` supplies install/build/output settings.
4. Add the public Supabase variables and the actual `VITE_SITE_URL`. The two
   Supabase variables must also be available to serverless functions, not only
   the build.
5. Deploy. Public route rewrites use `api/seo.mjs`, which reads current inventory
   and returns complete HTML before JavaScript executes.

### Netlify

1. Import the repository at its root and select branch `main`.
2. Use the included `netlify.toml`. Node 24, build command, functions and output
   directory are already specified.
3. Set the same variables for both build and functions.
4. Deploy.

### Static-only hosts

Upload `artifacts/zaarour/dist/public` after `build:static`. Configure clean URLs
and an SPA fallback for `/admin`. Static HTML/sitemap reflect the last build.
**Rebuild after inventory changes** on static-only hosting. Vercel/Netlify
adapters avoid that limitation: HTML and sitemap refresh from Supabase with a
short cache (about 30–90 seconds).

The ordinary Vite development server is for interactive development; it does
not run host serverless functions. Use the static build/preview when inspecting
crawler-visible output. No hosting account has been published automatically.

## SEO / AEO / local discovery

- Semantic, crawler-visible HTML for Home, Inventory, About, Contact and every
  slug-based vehicle route; not just client-injected metadata.
- Per-car title includes year, make, model, USD price and Lebanon.
- Unique descriptions, canonical links when `VITE_SITE_URL` is configured,
  Open Graph and Twitter cards. Vehicle previews include image and USD price.
- Car/Offer, AutoDealer, BreadcrumbList and FAQPage JSON-LD.
- Plain-text specifications and descriptions, USD prices and kilometre readings.
- Buyer FAQs explain payment currency, inspection questions and WhatsApp.
- Moawad, Lebanon context throughout; Beirut/Mount Lebanon service-area context.
- robots.txt excludes `/admin`; sitemap excludes hidden sold vehicles.
- Live sitemap and public HTML from current inventory on Vercel/Netlify.
- Lazy 3D, route splitting, responsive image sizing and reduced-motion support.

**Before indexing:** set the real published domain, number, hours and showroom
coordinates. Set `VITE_GEO_LATITUDE` and `VITE_GEO_LONGITUDE` to verified showroom
coordinates to enable `geo.position`/ICBM tags and AutoDealer coordinates. Set
optional `VITE_OPENING_HOURS_SCHEMA` to confirmed hours in Schema.org format.
The demo does not represent its approximate map pin as a precise business address. Structured data
helps machines interpret content but does not guarantee search ranking,
citations by AI engines, or rich-result eligibility.

## 3D and image attribution

The interactive concept car uses Khronos Group's **Toy Car** GLB:
<https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ToyCar>.
The source documents **CC0 1.0** licensing, with the original car model by
**Guido Odendahl**, extensions and scene composition by **Eric Chadwick**.
It is an illustrative concept car, not a claim that a pictured vehicle is for
sale. The model is loaded from a public CDN/source URL; failures retain the
photographic fallback. Third-party asset delivery requires network access.

Demo photographs come from Unsplash under its free image license:
<https://unsplash.com/license>. Replace them with photos of your actual stock
before trading on the site. Vehicle names and brand marks remain the property
of their owners and do not imply official affiliation.

## Launch checklist

- [ ] Connect your Supabase project and execute schema/seed as appropriate.
- [ ] Create and allowlist the administrator.
- [ ] Replace demo stock, images, contact number, social links and example hours.
- [ ] Verify inspection, warranty and business claims before publishing.
- [ ] Confirm exact showroom location and structured business information.
- [ ] Configure actual domain, serverless environment values and canonical URLs.
- [ ] Verify admin, Storage policies, inquiry delivery and mobile 3D on live setup.
- [ ] Add anti-abuse protection appropriate to your public form traffic.

No production Supabase project was connected or live authentication/storage
tested as part of the credential-free demo build.
