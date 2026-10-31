-- =============================================================================
-- Admin panel: images for every content section.
--
-- Articles, books and presentations already store their image in
-- content_items.cover_path. Links had no image column.
-- Uploads go to the public 'covers' bucket, which had no write policies, so
-- every upload was refused (including for staff).
--
-- Apply once: Supabase Dashboard → SQL Editor → paste → Run.
-- Safe to re-run.
-- =============================================================================

alter table public.links add column if not exists image_path text;  -- Storage path in bucket 'covers', or a full URL

-- Staff who manage content (articles, books, presentations) or settings (links)
-- may add, replace and remove images in the 'covers' bucket. Reading needs no
-- policy: the bucket is public.
drop policy if exists "staff insert covers" on storage.objects;
drop policy if exists "staff update covers" on storage.objects;
drop policy if exists "staff delete covers" on storage.objects;
drop policy if exists "staff select covers" on storage.objects;

create policy "staff insert covers" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'covers'
    and (public.has_permission('manage_content') or public.has_permission('manage_settings'))
  );

create policy "staff update covers" on storage.objects for update to authenticated
  using (
    bucket_id = 'covers'
    and (public.has_permission('manage_content') or public.has_permission('manage_settings'))
  )
  with check (
    bucket_id = 'covers'
    and (public.has_permission('manage_content') or public.has_permission('manage_settings'))
  );

-- Deleting through the Storage API also needs read access to the object row.
create policy "staff select covers" on storage.objects for select to authenticated
  using (
    bucket_id = 'covers'
    and (public.has_permission('manage_content') or public.has_permission('manage_settings'))
  );

create policy "staff delete covers" on storage.objects for delete to authenticated
  using (
    bucket_id = 'covers'
    and (public.has_permission('manage_content') or public.has_permission('manage_settings'))
  );

-- -----------------------------------------------------------------------------
-- Give a login admin rights (run separately, once per person):
--   1. Authentication → Users → Add user (email + password).
--   2. Run, with that person's email:
--
-- insert into public.profile_permissions (profile_id, permission)
-- select id, 'admin' from auth.users where email = 'you@example.com'
-- on conflict do nothing;
-- -----------------------------------------------------------------------------
