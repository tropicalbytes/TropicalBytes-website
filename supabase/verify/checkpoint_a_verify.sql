-- Checkpoint A verification — READ-ONLY (selects only). Run in the Supabase Dashboard SQL Editor
-- after 0001_init.sql. Every row should show ok = true.
with
  t as (select c.relname, c.relrowsecurity from pg_class c
        where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'),
  rowcount as (select
    (select count(*) from public.admins) + (select count(*) from public.plan_tiers) + (select count(*) from public.plan_options)
  + (select count(*) from public.menu_items) + (select count(*) from public.bulk_items) + (select count(*) from public.site_settings)
  + (select count(*) from public.menus) + (select count(*) from public.offers) + (select count(*) from public.audit_log) as n),
  g as (select grantee, table_name, privilege_type from information_schema.role_table_grants
        where table_schema = 'public' and grantee in ('anon', 'authenticated'))
select * from (values
  ('9 tables in public',
     (select count(*) = 9 from t), (select string_agg(relname, ', ' order by relname) from t)),
  ('RLS enabled on all 9',
     (select bool_and(relrowsecurity) from t), (select coalesce(string_agg(relname, ', '), 'none off') from t where not relrowsecurity)),
  ('0 rows in every table (schema only)',
     (select n = 0 from rowcount), (select n::text from rowcount)),
  ('25 policies on public tables',
     (select count(*) = 25 from pg_policies where schemaname = 'public'), (select count(*)::text from pg_policies where schemaname = 'public')),
  ('4 menus policies on storage.objects',
     (select count(*) = 4 from pg_policies where schemaname = 'storage' and policyname like 'menus admin %'),
     (select count(*)::text from pg_policies where schemaname = 'storage' and policyname like 'menus admin %')),
  ('4 functions (audit_row, is_admin, publish_menu, touch_updated_at)',
     (select string_agg(proname, ',' order by proname) = 'audit_row,is_admin,publish_menu,touch_updated_at' from pg_proc where pronamespace = 'public'::regnamespace),
     (select string_agg(proname, ', ' order by proname) from pg_proc where pronamespace = 'public'::regnamespace)),
  ('all functions pin search_path',
     (select bool_and(proconfig is not null) from pg_proc where pronamespace = 'public'::regnamespace), ''),
  ('13 triggers',
     (select count(*) = 13 from pg_trigger tr join pg_class c on c.oid = tr.tgrelid
       where c.relnamespace = 'public'::regnamespace and not tr.tgisinternal),
     (select count(*)::text from pg_trigger tr join pg_class c on c.oid = tr.tgrelid
       where c.relnamespace = 'public'::regnamespace and not tr.tgisinternal)),
  ('menus bucket: public, 5 MB, PDF only',
     (select count(*) = 1 from storage.buckets where id = 'menus' and public and file_size_limit = 5242880
        and allowed_mime_types = array['application/pdf']),
     (select coalesce(max(id || ' public=' || public || ' limit=' || file_size_limit), 'missing') from storage.buckets where id = 'menus')),
  ('anon can SELECT the 7 public catalog tables',
     (select count(*) = 7 from g where grantee = 'anon' and privilege_type = 'SELECT'),
     (select string_agg(table_name, ', ' order by table_name) from g where grantee = 'anon' and privilege_type = 'SELECT')),
  ('anon has no write/truncate privileges',
     (select count(*) = 0 from g where grantee = 'anon' and privilege_type <> 'SELECT'),
     (select coalesce(string_agg(table_name || ':' || privilege_type, ', '), 'none') from g where grantee = 'anon' and privilege_type <> 'SELECT')),
  ('anon cannot read admins / audit_log',
     (select count(*) = 0 from g where grantee = 'anon' and table_name in ('admins', 'audit_log')), ''),
  ('admin price columns are updatable by authenticated (RLS limits to admins)',
     has_column_privilege('authenticated', 'public.plan_options', 'total_price', 'UPDATE')
       and has_column_privilege('authenticated', 'public.menu_items', 'price', 'UPDATE')
       and has_column_privilege('authenticated', 'public.bulk_items', 'price', 'UPDATE')
       and has_column_privilege('authenticated', 'public.offers', 'offer_price', 'UPDATE'), ''),
  ('stable ids are NOT updatable via the API',
     not has_column_privilege('authenticated', 'public.plan_options', 'id', 'UPDATE')
       and not has_column_privilege('authenticated', 'public.menu_items', 'id', 'UPDATE')
       and not has_column_privilege('authenticated', 'public.bulk_items', 'id', 'UPDATE'), ''),
  ('only one menu can be current (partial unique index)',
     exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'menus_one_current_idx'), '')
) as v(check_name, ok, detail);
