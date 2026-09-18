-- Private media bucket + policies so the server can mint signed upload URLs.
-- Prefer SUPABASE_SERVICE_ROLE_KEY in .env.local (bypasses RLS). These policies
-- are the fallback when only the anon key is set.

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', false, 62914560)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "media_insert_signed" on storage.objects;
drop policy if exists "media_update_signed" on storage.objects;
drop policy if exists "media_select_signed" on storage.objects;

create policy "media_insert_signed"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'media');

create policy "media_update_signed"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'media')
with check (bucket_id = 'media');

-- Needed to mint signed *download* URLs with the anon key (teacher queue).
-- Objects stay unlisted; paths are unguessable UUIDs. Replace with service_role.
create policy "media_select_signed"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'media');
