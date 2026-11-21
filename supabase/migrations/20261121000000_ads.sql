-- =============================================================================
-- Ads: four slots beside the page (left top/bottom, right top/bottom) on wide
-- screens, shown inside the page on smaller ones. Each ad is either an image
-- with a link (your own ads) or an ad network's code (e.g. Google AdSense).
-- Several ads may share a slot; the site rotates between them.
--
-- Apply once: Supabase Dashboard → SQL Editor → paste → Run.
-- Safe to re-run.
-- =============================================================================

create table if not exists public.ads (
  id                bigint generated always as identity primary key,
  name              text not null,                          -- Internal name, shown only in the admin
  kind              text not null default 'image'
                      check (kind in ('image', 'embed')),   -- image = own ad, embed = ad network code
  slot              text not null
                      check (slot in ('left_top', 'left_bottom', 'right_top', 'right_bottom')),
  image_path        text,                                   -- Tall image for the side rails (bucket 'covers', folder 'ads')
  banner_image_path text,                                   -- Optional wide image for the in-page placement
  link_url          text,                                   -- Where a click on an image ad goes
  alt_text          text,                                   -- Describes the image for screen readers
  embed_html        text,                                   -- Ad network code, run as given (staff only)
  pages             text[] not null default '{}',           -- Pages to show on; empty = every public page
  active            boolean not null default true,
  starts_at         timestamptz,                            -- Optional schedule
  ends_at           timestamptz,
  position          integer not null default 0,             -- Order in the admin list
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint ads_image_needs_image check (kind <> 'image' or image_path is not null),
  constraint ads_embed_needs_code  check (kind <> 'embed' or coalesce(btrim(embed_html), '') <> ''),
  constraint ads_link_is_web       check (link_url is null or link_url ~* '^https?://'),
  constraint ads_dates_in_order    check (starts_at is null or ends_at is null or starts_at < ends_at),
  constraint ads_known_pages       check (pages <@ array[
    'home', 'articles', 'article', 'books', 'book',
    'presentations', 'presentation', 'links', 'author'
  ]::text[])
);

create index if not exists ads_slot_idx on public.ads (slot) where active;

-- Keep updated_at current.
create or replace function public.ads_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ads_touch_updated_at on public.ads;
create trigger ads_touch_updated_at before update on public.ads
  for each row execute function public.ads_touch_updated_at();

-- -----------------------------------------------------------------------------
-- Access
--   Visitors see only live ads (active and inside their schedule).
--   Staff with manage_settings (or admin) see and change all of them.
-- -----------------------------------------------------------------------------
alter table public.ads enable row level security;

grant select on public.ads to anon, authenticated;
grant insert, update, delete on public.ads to authenticated;

drop policy if exists "public read live ads" on public.ads;
drop policy if exists "staff read ads" on public.ads;
drop policy if exists "staff insert ads" on public.ads;
drop policy if exists "staff update ads" on public.ads;
drop policy if exists "staff delete ads" on public.ads;

create policy "public read live ads" on public.ads for select to anon, authenticated
  using (
    active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );

create policy "staff read ads" on public.ads for select to authenticated
  using (public.has_permission('manage_settings'));

create policy "staff insert ads" on public.ads for insert to authenticated
  with check (public.has_permission('manage_settings'));

create policy "staff update ads" on public.ads for update to authenticated
  using (public.has_permission('manage_settings'))
  with check (public.has_permission('manage_settings'));

create policy "staff delete ads" on public.ads for delete to authenticated
  using (public.has_permission('manage_settings'));

-- Ad images go to the existing public 'covers' bucket (folder 'ads'). The
-- staff upload policies from 20261031000000_admin_images.sql already cover
-- manage_settings, so nothing changes in Storage.
