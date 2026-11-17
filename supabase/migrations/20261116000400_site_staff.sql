-- Acesso administrativo para contas criadas no Supabase Auth.
-- Repetível; não apaga nem altera conteúdo existente.

create table if not exists public.site_staff (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('admin', 'developer')),
    created_at timestamptz not null default now()
);

alter table public.site_staff enable row level security;
revoke all on table public.site_staff from public, anon, authenticated;
grant select on table public.site_staff to authenticated;

drop policy if exists "Staff can read own role" on public.site_staff;
create policy "Staff can read own role" on public.site_staff
    for select to authenticated using (user_id = (select auth.uid()));

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.has_site_editor_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select (select auth.uid()) is not null and exists (
        select 1 from public.site_staff
        where user_id = (select auth.uid())
          and role in ('admin', 'developer')
    );
$$;
revoke all on function private.has_site_editor_access() from public, anon, authenticated;
grant execute on function private.has_site_editor_access() to authenticated;

-- Editors can see drafts and manage public-facing content. Anonymous visitors
-- keep their existing published-only read and pending-only submission access.
grant insert, update, delete on public.destinations, public.events,
    public.featured_routes, public.assistant_responses to authenticated;
grant usage, select on sequence public.destinations_id_seq, public.events_id_seq,
    public.featured_routes_id_seq, public.assistant_responses_id_seq to authenticated;

drop policy if exists "Published destinations only" on public.destinations;
create policy "Published destinations only" on public.destinations as restrictive
    for select to anon, authenticated using (is_published or (select private.has_site_editor_access()));
drop policy if exists "Site editors manage destinations" on public.destinations;
create policy "Site editors manage destinations" on public.destinations
    for all to authenticated using ((select private.has_site_editor_access()))
    with check ((select private.has_site_editor_access()));

drop policy if exists "Published events only" on public.events;
create policy "Published events only" on public.events as restrictive
    for select to anon, authenticated using (is_published or (select private.has_site_editor_access()));
drop policy if exists "Site editors manage events" on public.events;
create policy "Site editors manage events" on public.events
    for all to authenticated using ((select private.has_site_editor_access()))
    with check ((select private.has_site_editor_access()));

drop policy if exists "Published routes only" on public.featured_routes;
create policy "Published routes only" on public.featured_routes as restrictive
    for select to anon, authenticated using (is_published or (select private.has_site_editor_access()));
drop policy if exists "Site editors manage routes" on public.featured_routes;
create policy "Site editors manage routes" on public.featured_routes
    for all to authenticated using ((select private.has_site_editor_access()))
    with check ((select private.has_site_editor_access()));

drop policy if exists "Published assistant responses only" on public.assistant_responses;
create policy "Published assistant responses only" on public.assistant_responses as restrictive
    for select to anon, authenticated using (is_published or (select private.has_site_editor_access()));
drop policy if exists "Site editors manage assistant responses" on public.assistant_responses;
create policy "Site editors manage assistant responses" on public.assistant_responses
    for all to authenticated using ((select private.has_site_editor_access()))
    with check ((select private.has_site_editor_access()));

-- If an earlier draft of this migration was applied, its policies have now been
-- replaced, so the legacy public helper can be removed without cascading.
drop function if exists public.has_site_editor_access();
