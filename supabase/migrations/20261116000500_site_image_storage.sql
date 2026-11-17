-- Bucket público para fotografias do site. Alterações no bucket ficam restritas à equipe.
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

drop policy if exists "Site editors read managed images" on storage.objects;
create policy "Site editors read managed images" on storage.objects
    for select to authenticated
    using (bucket_id = 'site-images' and (select private.has_site_editor_access()));

drop policy if exists "Site editors upload images" on storage.objects;
create policy "Site editors upload images" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'site-images' and (select private.has_site_editor_access()));

drop policy if exists "Site editors update images" on storage.objects;
create policy "Site editors update images" on storage.objects
    for update to authenticated
    using (bucket_id = 'site-images' and (select private.has_site_editor_access()))
    with check (bucket_id = 'site-images' and (select private.has_site_editor_access()));

drop policy if exists "Site editors delete images" on storage.objects;
create policy "Site editors delete images" on storage.objects
    for delete to authenticated
    using (bucket_id = 'site-images' and (select private.has_site_editor_access()));
