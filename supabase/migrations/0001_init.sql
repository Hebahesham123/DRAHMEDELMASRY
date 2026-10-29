-- =====================================================================
-- Dr. Ahmed El Masry website — database schema
-- Run this once in the Supabase SQL editor (or `supabase db push`).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Admin users (people allowed into /admin)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'editor' check (role in ('owner','editor')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'owner');
$$;

-- ---------------------------------------------------------------------
-- Site-wide settings, one row per language (menu, footer, contact info …)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  lang       text primary key check (lang in ('ar','en')),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Fixed pages (home, about us, cv, contact …), one row per page + language
-- ---------------------------------------------------------------------
create table if not exists public.pages (
  key        text not null,
  lang       text not null check (lang in ('ar','en')),
  data       jsonb not null default '{}'::jsonb,
  seo        jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (key, lang)
);

-- ---------------------------------------------------------------------
-- Content items: services, success stories, surgery tips, FAQs, videos,
-- gallery photos, testimonials, team, news, home sections …
-- ---------------------------------------------------------------------
create table if not exists public.items (
  id                 uuid primary key default gen_random_uuid(),
  type               text not null,
  lang               text not null check (lang in ('ar','en')),
  slug               text not null,
  title              text not null default '',
  excerpt            text not null default '',
  image              text not null default '',
  image_alt          text not null default '',
  detail_image       text not null default '',
  detail_image_alt   text not null default '',
  detail_image_title text not null default '',
  body_html          text not null default '',
  link               text not null default '',
  extra              jsonb not null default '{}'::jsonb,
  seo                jsonb not null default '{}'::jsonb,
  sort_order         integer not null default 0,
  featured           boolean not null default false,
  published          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (type, slug)
);
create index if not exists items_type_lang_idx on public.items (type, lang, published, sort_order);
create index if not exists items_slug_lower_idx on public.items (type, lower(btrim(slug)));

-- ---------------------------------------------------------------------
-- Messages sent from the contact forms
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null default '',
  phone      text not null default '',
  message    text not null default '',
  lang       text not null default 'ar',
  page       text not null default '',
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();
drop trigger if exists pages_touch on public.pages;
create trigger pages_touch before update on public.pages for each row execute function public.touch_updated_at();
drop trigger if exists items_touch on public.items;
create trigger items_touch before update on public.items for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------
alter table public.admins   enable row level security;
alter table public.settings enable row level security;
alter table public.pages    enable row level security;
alter table public.items    enable row level security;
alter table public.messages enable row level security;

-- public website can read everything that is published
drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings for select using (true);
drop policy if exists "pages read" on public.pages;
create policy "pages read" on public.pages for select using (true);
drop policy if exists "items read" on public.items;
create policy "items read" on public.items for select using (published or public.is_admin());

-- admins can change content
drop policy if exists "settings write" on public.settings;
create policy "settings write" on public.settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "pages write" on public.pages;
create policy "pages write" on public.pages for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "items write" on public.items;
create policy "items write" on public.items for all using (public.is_admin()) with check (public.is_admin());

-- anyone can send a message, only admins can read/manage them
drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages for insert with check (true);
drop policy if exists "messages admin" on public.messages;
create policy "messages admin" on public.messages for select using (public.is_admin());
drop policy if exists "messages admin update" on public.messages;
create policy "messages admin update" on public.messages for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "messages admin delete" on public.messages;
create policy "messages admin delete" on public.messages for delete using (public.is_admin());

-- admins table: admins can see the list, only owners can change it
drop policy if exists "admins read" on public.admins;
create policy "admins read" on public.admins for select using (public.is_admin());
drop policy if exists "admins write" on public.admins;
create policy "admins write" on public.admins for all using (public.is_owner()) with check (public.is_owner());

grant select on public.settings, public.pages, public.items to anon, authenticated;
grant insert on public.messages to anon, authenticated;
grant all on public.settings, public.pages, public.items, public.messages, public.admins to authenticated;
grant all on all tables in schema public to service_role;
grant execute on function public.is_admin(), public.is_owner() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage bucket for images / PDFs uploaded from the dashboard
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());
