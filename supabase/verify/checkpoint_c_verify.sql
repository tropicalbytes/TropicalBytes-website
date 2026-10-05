-- Checkpoint C verification: READ-ONLY. Run in the Supabase Dashboard SQL Editor after
-- checkpoint_c_grant_admin.sql. Every row should show ok = true.
--
-- The first statement impersonates the owner for THIS query only (set_config/set local are
-- transaction-scoped and end when the query finishes): it signs the request as the owner's
-- user id and switches to the `authenticated` role, so the checks below go through the real
-- RLS policies exactly as the admin panel will. Nothing is written.

select set_config('request.jwt.claims',
  (select json_build_object('sub', id, 'role', 'authenticated', 'email', email)::text
     from auth.users where lower(email) = 'tropicalbytes.in@gmail.com'),
  true);
set local role authenticated;

select * from (values
  ('signed in as the owner',                  auth.uid() is not null,                              coalesce(auth.uid()::text, 'auth user not found')),
  ('private.is_admin() = true for the owner', coalesce(private.is_admin(), false),                ''),
  ('owner sees exactly 1 admin row (own)',     (select count(*) = 1 from public.admins),            (select coalesce(max(email), '') from public.admins)),
  ('owner can read the audit log',            (select count(*) > 0 from public.audit_log),         (select count(*)::text from public.audit_log)),
  ('owner sees all 16 plan options',          (select count(*) = 16 from public.plan_options),     ''),
  ('owner may edit prices (column privilege)', has_column_privilege('public.plan_options', 'total_price', 'UPDATE')
                                               and has_column_privilege('public.menu_items', 'price', 'UPDATE')
                                               and has_column_privilege('public.bulk_items', 'price', 'UPDATE'), '')
) as v(check_name, ok, detail);
