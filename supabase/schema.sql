-- ZAAROUR: run once in a new Supabase project's SQL editor.
-- No service-role key is ever needed in the browser.
begin;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean language sql stable security definer
set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.cars (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(data) = 'object'),
  check (data->>'id' = id and data->>'slug' = slug),
  check (data ?& array['id','slug','make','model','year','price','mileage','images']),
  check ((data->>'price')::numeric >= 0),
  check ((data->>'mileage')::numeric >= 0),
  check ((data->>'year')::integer between 1900 and 2100),
  check (jsonb_typeof(data->'images') = 'array')
);
create index cars_make_idx on public.cars ((data->>'make'));
create index cars_featured_idx on public.cars ((data->>'featured'));

create table public.car_images (
  id uuid primary key default gen_random_uuid(),
  car_id text not null references public.cars(id) on delete cascade,
  url text not null check (length(url) between 1 and 2048),
  position integer not null default 0 check (position >= 0),
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.makes (
  id text primary key,
  name text not null unique check (length(name) between 1 and 100),
  logo text not null default ''
);
create table public.settings (
  id text primary key check (id = 'dealership'),
  data jsonb not null check (jsonb_typeof(data) = 'object')
);
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null default '' check (length(name) <= 120),
  phone text not null default '' check (length(phone) <= 60),
  message text not null default '' check (length(message) <= 4000),
  type text not null default 'contact' check (type in ('contact','whatsapp')),
  car_slug text check (length(car_slug) <= 200),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create function public.touch_car() returns trigger language plpgsql
set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
create trigger touch_car before update on public.cars
for each row execute function public.touch_car();

alter table public.admin_users enable row level security;
alter table public.cars enable row level security;
alter table public.car_images enable row level security;
alter table public.makes enable row level security;
alter table public.settings enable row level security;
alter table public.inquiries enable row level security;

-- A user may check only their own allowlist membership. No self-enrollment.
create policy admin_self_read on public.admin_users for select to authenticated
using (user_id = auth.uid());

-- Sold cars can remain visible with a badge; hideSold=true removes them from
-- public queries including direct detail URLs.
create policy cars_public_read on public.cars for select to anon, authenticated
using (
  public.is_admin() or not (
    coalesce((data->>'sold')::boolean, false)
    and coalesce((data->>'hideSold')::boolean, false)
  )
);
create policy cars_admin_write on public.cars for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy images_public_read on public.car_images for select to anon, authenticated
using (exists (select 1 from public.cars c where c.id = car_id));
create policy images_admin_write on public.car_images for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy makes_public_read on public.makes for select to anon, authenticated using (true);
create policy makes_admin_write on public.makes for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy settings_public_read on public.settings for select to anon, authenticated using (true);
create policy settings_admin_write on public.settings for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy inquiries_admin_read on public.inquiries for select to authenticated
using (public.is_admin());
create policy inquiries_admin_update on public.inquiries for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy inquiries_admin_delete on public.inquiries for delete to authenticated
using (public.is_admin());
create policy inquiries_public_insert on public.inquiries for insert to anon, authenticated
with check (
  handled = false
  and created_at between now() - interval '1 minute' and now() + interval '1 minute'
  and (type = 'whatsapp' or (length(trim(name)) >= 1 and length(trim(message)) >= 5))
);

grant usage on schema public to anon, authenticated;
grant select on public.cars, public.car_images, public.makes, public.settings to anon, authenticated;
grant insert, update, delete on public.cars, public.car_images, public.makes, public.settings to authenticated;
grant select on public.admin_users to authenticated;
grant insert on public.inquiries to anon, authenticated;
grant select, update, delete on public.inquiries to authenticated;

-- Public bucket contains PUBLIC marketing photos only. Never upload private IDs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dealership','dealership',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy dealership_public_read on storage.objects for select to anon, authenticated
using (bucket_id = 'dealership');
create policy dealership_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'dealership' and public.is_admin());
create policy dealership_admin_update on storage.objects for update to authenticated
using (bucket_id = 'dealership' and public.is_admin())
with check (bucket_id = 'dealership' and public.is_admin());
create policy dealership_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'dealership' and public.is_admin());

commit;
