-- Checkpoint C (b): make the owner an admin. Run in the Supabase Dashboard SQL Editor
-- ONLY AFTER step (a): the auth user for this email exists (Authentication → Users → Add user).
--
-- Writes exactly one row to public.admins (or nothing at all):
--   * looks the user's id up from auth.users by email, so no UUID needs to be copied by hand;
--   * inserts 0 rows if that user doesn't exist yet (safe to run early, simply re-run later);
--   * on conflict do nothing (safe to run twice).
-- The returned row is the new admin. "No rows returned" means the auth user wasn't found.

insert into public.admins (user_id, email)
select id, lower(email)
from auth.users
where lower(email) = 'tropicalbytes.in@gmail.com'
on conflict (user_id) do nothing
returning user_id, email, created_at;
