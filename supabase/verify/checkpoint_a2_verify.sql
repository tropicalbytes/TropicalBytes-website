-- Checkpoint A.2 verification — READ-ONLY (selects only). Run after 0003_definer_functions_out_of_api.sql.
-- Every row should show ok = true.
select * from (values
  ('is_admin() now lives in private (not exposed by the API)',
     exists (select 1 from pg_proc where proname = 'is_admin' and pronamespace = 'private'::regnamespace)
     and not exists (select 1 from pg_proc where proname = 'is_admin' and pronamespace = 'public'::regnamespace), ''),
  ('anon/authenticated can still execute private.is_admin() (RLS needs it)',
     has_function_privilege('anon', 'private.is_admin()', 'EXECUTE')
     and has_function_privilege('authenticated', 'private.is_admin()', 'EXECUTE'), ''),
  ('publish_menu() is SECURITY INVOKER',
     (select not prosecdef from pg_proc where proname = 'publish_menu' and pronamespace = 'public'::regnamespace), ''),
  ('anon still cannot execute publish_menu()',
     not has_function_privilege('anon', 'public.publish_menu(uuid)', 'EXECUTE'), ''),
  ('no SECURITY DEFINER function in public is executable by anon/authenticated',
     not exists (select 1 from pg_proc where pronamespace = 'public'::regnamespace and prosecdef
                 and (has_function_privilege('anon', oid, 'EXECUTE') or has_function_privilege('authenticated', oid, 'EXECUTE'))), ''),
  ('26 policies on public tables (25 + admin publish)',
     (select count(*) = 26 from pg_policies where schemaname = 'public'), (select count(*)::text from pg_policies where schemaname = 'public')),
  ('25 public policies reference private.is_admin()',
     (select count(*) = 25 from pg_policies where schemaname = 'public' and (coalesce(qual, '') || coalesce(with_check, '')) like '%private.is_admin()%'),
     (select count(*)::text from pg_policies where schemaname = 'public' and (coalesce(qual, '') || coalesce(with_check, '')) like '%private.is_admin()%')),
  ('storage policies reference private.is_admin()',
     (select count(*) = 4 from pg_policies where schemaname = 'storage' and policyname like 'menus admin %'
        and (coalesce(qual, '') || coalesce(with_check, '')) like '%private.is_admin()%'), ''),
  ('menus: only is_current / published_at are updatable',
     has_column_privilege('authenticated', 'public.menus', 'is_current', 'UPDATE')
     and not has_column_privilege('authenticated', 'public.menus', 'title', 'UPDATE')
     and not has_column_privilege('authenticated', 'public.menus', 'file_path', 'UPDATE'), ''),
  ('seed data untouched',
     (select count(*) = 16 from public.plan_options) and (select count(*) = 42 from public.menu_items)
     and (select count(*) = 39 from public.bulk_items), '')
) as v(check_name, ok, detail);
