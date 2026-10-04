-- Checkpoint A.2 — clears the remaining Supabase security advisor warnings (lints 0028/0029)
-- left after 0002. No tables, rows, or data are changed.
--
-- 1. is_admin() moves from public (exposed as /rest/v1/rpc/is_admin) to a new `private` schema,
--    which the Data API does not expose. RLS policies reference the function by OID, so all 29
--    existing policies keep working unchanged. Its execute grants move with it.
-- 2. publish_menu() becomes SECURITY INVOKER: it now runs with the caller's own privileges and RLS,
--    so it can no longer do anything the caller couldn't. To allow that, admins get UPDATE on just
--    menus.is_current / menus.published_at, gated by an admin-only RLS policy. The partial unique
--    index menus_one_current_idx still guarantees at most one current menu at all times.

begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

alter function public.is_admin() set schema private;
alter function private.is_admin() set search_path = '';   -- body is fully qualified (public.admins, auth.uid())

create or replace function public.publish_menu(p_menu_id uuid)
returns void
language plpgsql security invoker
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.menus where id = p_menu_id) then
    raise exception 'menu not found' using errcode = 'P0002';
  end if;
  update public.menus set is_current = false where is_current and id <> p_menu_id;
  update public.menus set is_current = true, published_at = now() where id = p_menu_id;
end;
$$;

grant update (is_current, published_at) on public.menus to authenticated;
create policy "admin publish" on public.menus for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

commit;
