-- Keep public and staff read policies separate and avoid permissive SELECT overlap.
-- This changes policies only; it does not update or remove application rows.

drop policy if exists "Public can read destinations" on public.destinations;
create policy "Public can read destinations" on public.destinations
    for select to anon using (is_published);
drop policy if exists "Authenticated can read destinations" on public.destinations;
create policy "Authenticated can read destinations" on public.destinations
    for select to authenticated using (is_published or (select private.has_site_editor_access()));
drop policy if exists "Published destinations only" on public.destinations;
create policy "Published destinations only" on public.destinations as restrictive
    for select to anon using (is_published);
drop policy if exists "Staff draft visibility guard for destinations" on public.destinations;
create policy "Staff draft visibility guard for destinations" on public.destinations as restrictive
    for select to authenticated using (is_published or (select private.has_site_editor_access()));

drop policy if exists "Site editors manage destinations" on public.destinations;
drop policy if exists "Site editors insert destinations" on public.destinations;
create policy "Site editors insert destinations" on public.destinations
    for insert to authenticated with check ((select private.has_site_editor_access()));
drop policy if exists "Site editors update destinations" on public.destinations;
create policy "Site editors update destinations" on public.destinations
    for update to authenticated using ((select private.has_site_editor_access()))
    with check ((select private.has_site_editor_access()));
drop policy if exists "Site editors delete destinations" on public.destinations;
create policy "Site editors delete destinations" on public.destinations
    for delete to authenticated using ((select private.has_site_editor_access()));

drop policy if exists "Public can read events" on public.events;
create policy "Public can read events" on public.events
    for select to anon using (is_published);
drop policy if exists "Authenticated can read events" on public.events;
create policy "Authenticated can read events" on public.events
    for select to authenticated using (is_published or (select private.has_site_editor_access()));
drop policy if exists "Published events only" on public.events;
create policy "Published events only" on public.events as restrictive
    for select to anon using (is_published);
drop policy if exists "Staff draft visibility guard for events" on public.events;
create policy "Staff draft visibility guard for events" on public.events as restrictive
    for select to authenticated using (is_published or (select private.has_site_editor_access()));

drop policy if exists "Site editors manage events" on public.events;
drop policy if exists "Site editors insert events" on public.events;
create policy "Site editors insert events" on public.events
    for insert to authenticated with check ((select private.has_site_editor_access()));
drop policy if exists "Site editors update events" on public.events;
create policy "Site editors update events" on public.events
    for update to authenticated using ((select private.has_site_editor_access()))
    with check ((select private.has_site_editor_access()));
drop policy if exists "Site editors delete events" on public.events;
create policy "Site editors delete events" on public.events
    for delete to authenticated using ((select private.has_site_editor_access()));

drop policy if exists "Public can read featured routes" on public.featured_routes;
create policy "Public can read featured routes" on public.featured_routes
    for select to anon using (is_published);
drop policy if exists "Authenticated can read featured routes" on public.featured_routes;
create policy "Authenticated can read featured routes" on public.featured_routes
    for select to authenticated using (is_published or (select private.has_site_editor_access()));
drop policy if exists "Published routes only" on public.featured_routes;
create policy "Published routes only" on public.featured_routes as restrictive
    for select to anon using (is_published);
drop policy if exists "Staff draft visibility guard for routes" on public.featured_routes;
create policy "Staff draft visibility guard for routes" on public.featured_routes as restrictive
    for select to authenticated using (is_published or (select private.has_site_editor_access()));

drop policy if exists "Site editors manage routes" on public.featured_routes;
drop policy if exists "Site editors insert routes" on public.featured_routes;
create policy "Site editors insert routes" on public.featured_routes
    for insert to authenticated with check ((select private.has_site_editor_access()));
drop policy if exists "Site editors update routes" on public.featured_routes;
create policy "Site editors update routes" on public.featured_routes
    for update to authenticated using ((select private.has_site_editor_access()))
    with check ((select private.has_site_editor_access()));
drop policy if exists "Site editors delete routes" on public.featured_routes;
create policy "Site editors delete routes" on public.featured_routes
    for delete to authenticated using ((select private.has_site_editor_access()));

drop policy if exists "Public can read assistant responses" on public.assistant_responses;
create policy "Public can read assistant responses" on public.assistant_responses
    for select to anon using (is_published);
drop policy if exists "Authenticated can read assistant responses" on public.assistant_responses;
create policy "Authenticated can read assistant responses" on public.assistant_responses
    for select to authenticated using (is_published or (select private.has_site_editor_access()));
drop policy if exists "Published assistant responses only" on public.assistant_responses;
create policy "Published assistant responses only" on public.assistant_responses as restrictive
    for select to anon using (is_published);
drop policy if exists "Staff draft visibility guard for assistant responses" on public.assistant_responses;
create policy "Staff draft visibility guard for assistant responses" on public.assistant_responses as restrictive
    for select to authenticated using (is_published or (select private.has_site_editor_access()));

drop policy if exists "Site editors manage assistant responses" on public.assistant_responses;
drop policy if exists "Site editors insert assistant responses" on public.assistant_responses;
create policy "Site editors insert assistant responses" on public.assistant_responses
    for insert to authenticated with check ((select private.has_site_editor_access()));
drop policy if exists "Site editors update assistant responses" on public.assistant_responses;
create policy "Site editors update assistant responses" on public.assistant_responses
    for update to authenticated using ((select private.has_site_editor_access()))
    with check ((select private.has_site_editor_access()));
drop policy if exists "Site editors delete assistant responses" on public.assistant_responses;
create policy "Site editors delete assistant responses" on public.assistant_responses
    for delete to authenticated using ((select private.has_site_editor_access()));
