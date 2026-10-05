-- Checkpoint A.1: follow-up to 0001_init.sql (Supabase advisor 0028/0029).
-- audit_row() and touch_updated_at() are trigger functions; nothing should call them over the API.
-- New functions get EXECUTE for PUBLIC by default, which exposed them as /rest/v1/rpc/* endpoints.
-- Triggers keep firing after this: PostgreSQL does not check EXECUTE on a trigger function per row.
-- Changes privileges only. No tables, rows, or policies are touched.
--
-- Intentionally NOT revoked (advisor warnings accepted):
--   * is_admin():    RLS policies call it as anon/authenticated, so those roles must be able to execute it.
--                      It only ever returns whether the CALLER is an admin.
--   * publish_menu(): admin RPC; it checks is_admin() itself and raises 42501 for everyone else.

begin;

revoke execute on function public.audit_row()        from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

commit;
