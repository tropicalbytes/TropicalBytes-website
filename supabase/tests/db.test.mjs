// Database test suite — runs every migration, the seed and the admin grant on a throwaway
// in-memory PostgreSQL (PGlite), in the same order they were applied to tropicalbytes-production,
// then exercises RLS/privileges as anon, a signed-in non-admin, and the owner.
//
//   npm run test:db
//
// Never connects to Supabase. The `auth`/`storage` schemas are minimal stubs, and the default
// privileges below reproduce what tropicalbytes-production actually grants on new objects
// (checked read-only 2026-10-04) — which is what caught the missing GRANTs in 0001_init.sql.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const file = (p) => readFileSync(path.join(ROOT, p), "utf-8");

const OWNER_EMAIL = "tropicalbytes.in@gmail.com";
const ADMIN = "11111111-1111-1111-1111-111111111111";
const USER = "22222222-2222-2222-2222-222222222222";
const EMAIL = { [ADMIN]: OWNER_EMAIL, [USER]: "someone@example.com" };

let pass = 0, fail = 0;
const ok = (cond, label) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${label}`); };

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public revoke all on tables from public, anon, authenticated, service_role;
  alter default privileges in schema public grant truncate, references, trigger, maintain on tables to anon, authenticated, service_role;

  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt() ->> 'sub')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;

  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated, service_role;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
`);

async function run(role, sub, sql) {
  const claims = sub ? JSON.stringify({ sub, role, email: EMAIL[sub] }) : "";
  await db.exec(`reset role; select set_config('request.jwt.claims', '${claims}', false); set role ${role};`);
  try { const r = await db.query(sql); return { rows: r.rows, affected: r.affectedRows ?? 0 }; }
  catch (e) { return { error: e.message }; }
  finally { await db.exec("reset role; select set_config('request.jwt.claims', '', false);"); }
}
const one = async (sql) => (await db.query(sql)).rows[0];
async function verify(label, sqlFile, { multi = false } = {}) {
  const res = multi ? (await db.exec(file(sqlFile))).at(-1) : await db.query(file(sqlFile));
  for (const r of res.rows) ok(r.ok === true, `${label}: ${r.check_name}${r.detail ? ` (${r.detail})` : ""}`);
  await db.exec("reset role; select set_config('request.jwt.claims', '', false);");
}

// ---------------------------------------------------------------- Checkpoint A (0001)
await db.exec(file("supabase/migrations/0001_init.sql"));
await verify("A", "supabase/verify/checkpoint_a_verify.sql");
// ---------------------------------------------------------------- Checkpoint A.1 (0002)
await db.exec(file("supabase/migrations/0002_lock_trigger_functions.sql"));
for (const fn of ["audit_row()", "touch_updated_at()"])
  ok(!(await one(`select has_function_privilege('anon', 'public.${fn}', 'EXECUTE') v`)).v, `A.1: ${fn} not executable by anon`);
// ---------------------------------------------------------------- Checkpoint B (seed)
await db.exec(file("supabase/seed.sql"));
await verify("B", "supabase/verify/checkpoint_b_verify.sql");
await db.exec(file("supabase/seed.sql"));
ok((await one("select count(*)::int n from plan_options")).n === 16, "B: re-running the seed is a no-op");
// ---------------------------------------------------------------- Checkpoint A.2 (0003)
await db.exec(file("supabase/migrations/0003_definer_functions_out_of_api.sql"));
await verify("A.2", "supabase/verify/checkpoint_a2_verify.sql");
// ---------------------------------------------------------------- Checkpoint C (admin grant)
let g = (await db.query(file("supabase/admin/checkpoint_c_grant_admin.sql"))).rows;
ok(g.length === 0, "C: grant before the auth user exists inserts nothing");
await db.exec(`insert into auth.users values ('${ADMIN}', 'TropicalBytes.in@gmail.com'), ('${USER}', '${EMAIL[USER]}')`);
g = (await db.query(file("supabase/admin/checkpoint_c_grant_admin.sql"))).rows;
ok(g.length === 1 && g[0].user_id === ADMIN && g[0].email === OWNER_EMAIL, "C: grant finds the owner case-insensitively");
ok((await db.query(file("supabase/admin/checkpoint_c_grant_admin.sql"))).rows.length === 0, "C: grant is idempotent");
await verify("C", "supabase/verify/checkpoint_c_verify.sql", { multi: true });
ok((await run("authenticated", USER, "select private.is_admin() v")).rows[0].v === false, "C: other signed-in user is not admin");
ok((await run("anon", null, "select private.is_admin() v")).rows[0].v === false, "C: anon is not admin");

// ---------------------------------------------------------------- anon (public website)
let r = await run("anon", null, "select count(*)::int n from plan_options");
ok(r.rows?.[0].n === 16, `anon reads plan_options (${r.error ?? r.rows[0].n})`);
r = await run("anon", null, "select count(*)::int n from menu_items where category = 'dessert'");
ok(r.rows?.[0].n === 6, "anon reads desserts from menu_items (party form source)");
r = await run("anon", null, "update plan_options set total_price = 1 where id = 'weekly-veg-1'");
ok(!!r.error, "anon cannot change prices");
r = await run("anon", null, "insert into menu_items (category, name, price, is_vegetarian) values ('veg', 'x', 1, true)");
ok(!!r.error, "anon cannot insert menu items");
ok(!!(await run("anon", null, "select * from audit_log")).error, "anon cannot read audit_log");
ok(!!(await run("anon", null, "select * from admins")).error, "anon cannot read admins");
ok(!!(await run("anon", null, "select public.publish_menu(gen_random_uuid())")).error, "anon cannot call publish_menu");
ok(!!(await run("anon", null, "select public.is_admin()")).error, "is_admin is not an API function any more");

// ---------------------------------------------------------------- signed-in non-admin
r = await run("authenticated", USER, "update plan_options set total_price = 1 where id = 'weekly-veg-1'");
ok(r.affected === 0 && !r.error, "non-admin price update affects 0 rows (RLS)");
ok(!!(await run("authenticated", USER, "insert into offers (title) values ('hack')")).error, "non-admin cannot insert offers");
ok((await run("authenticated", USER, "select count(*)::int n from audit_log")).rows?.[0].n === 0, "non-admin sees 0 audit rows");
ok((await run("authenticated", USER, "select count(*)::int n from admins")).rows?.[0].n === 0, "non-admin sees 0 admins");
ok(!!(await run("authenticated", USER, `insert into admins values ('${USER}', 'x')`)).error, "non-admin cannot make themselves admin");

// ---------------------------------------------------------------- owner: price management
r = await run("authenticated", ADMIN, "update plan_options set total_price = 1500 where id = 'weekly-veg-1'");
ok(r.affected === 1, `admin updates subscription price (${r.error ?? "1 row"})`);
r = await run("authenticated", ADMIN, "update menu_items set price = 320, name = 'Alfredo Penne Pasta (Veg)' where id = 'veg-alfredo-penne-pasta-veg'");
ok(r.affected === 1, `admin updates menu price + renames (${r.error ?? "1 row"})`);
ok((await one("select count(*)::int n from menu_items where id = 'veg-alfredo-penne-pasta-veg'")).n === 1, "rename keeps the stable id");
r = await run("authenticated", ADMIN, "update menu_items set price = 375 where id = 'dessert-tiramisu'");
ok(r.affected === 1, "admin updates a dessert price (shared by individual + party)");
r = await run("authenticated", ADMIN, "update bulk_items set price = 1100 where id = 'party-veg-paneer-chilly'");
ok(r.affected === 1, `admin updates party/bulk price (${r.error ?? "1 row"})`);
r = await run("authenticated", ADMIN, "update bulk_items set price = 1800, is_seasonal = false where id = 'party-nonveg-fish-curry'");
ok(r.affected === 1, "admin prices a seasonal item");
ok(!!(await run("authenticated", ADMIN, "update bulk_items set is_seasonal = true where id = 'party-veg-ghee-rice'")).error, "seasonal + price rejected");
ok(!!(await run("authenticated", ADMIN, "update plan_options set total_price = 0 where id = 'weekly-veg-1'")).error, "price ≤ 0 rejected");
ok(!!(await run("authenticated", ADMIN, "update plan_options set id = 'renamed' where id = 'weekly-veg-1'")).error, "stable id cannot be rewritten");
r = await run("authenticated", ADMIN, "insert into menu_items (category, name, price, is_vegetarian) values ('veg', 'New Dish', 290, true) returning id");
ok(r.rows?.[0]?.id?.length === 36, "admin adds an item → random stable id");
ok(!!(await run("authenticated", ADMIN, "insert into menu_items (id, category, name, price, is_vegetarian) values ('x', 'veg', 'X', 1, true)")).error, "admin cannot choose ids");
ok((await run("authenticated", ADMIN, "update plan_options set is_active = false where id = 'salad-veg-1'")).affected === 1, "admin disables a plan option");
ok((await run("anon", null, "select count(*)::int n from plan_options")).rows?.[0].n === 15, "disabled option hidden from public");
ok(!!(await run("authenticated", ADMIN, "delete from plan_options where id = 'salad-veg-1'")).error, "plans cannot be hard-deleted");
ok((await run("authenticated", ADMIN, "update site_settings set value = 'Minimum order quantity: 2kg' where key = 'party_minimum_order_label'")).affected === 1, "admin edits a site setting");
ok(!!(await run("authenticated", ADMIN, "insert into plan_tiers (name, duration_days, tagline) values ('Fortnight', 12, '') returning id")).rows?.[0]?.id, "admin adds a plan tier");

// ---------------------------------------------------------------- audit trail
const au = await one(`select count(*) filter (where actor = '${ADMIN}')::int by_admin,
  bool_and(actor_email = '${OWNER_EMAIL}') filter (where actor is not null) email_ok,
  (select (old_data ->> 'total_price') || '→' || (new_data ->> 'total_price') from audit_log
     where row_id = 'weekly-veg-1' and action = 'UPDATE' order by id desc limit 1) wv from audit_log`);
ok(au.by_admin >= 8 && au.email_ok, `admin changes audited with actor + email (${au.by_admin})`);
ok(au.wv === "1350→1500", `price change recorded old→new (${au.wv})`);
ok((await one("select updated_at > created_at u from plan_options where id = 'weekly-veg-1'")).u, "updated_at bumped");
ok(!!(await run("authenticated", ADMIN, "delete from audit_log")).error, "audit_log is append-only via the API");

// ---------------------------------------------------------------- offers
await run("authenticated", ADMIN, `insert into offers (title, start_date, end_date) values
  ('Live', current_date - 1, current_date + 5), ('Future', current_date + 10, current_date + 20), ('Inactive', null, null)`);
await run("authenticated", ADMIN, "update offers set is_active = false where title = 'Inactive'");
ok((await run("anon", null, "select string_agg(title, ',' order by title) t from offers")).rows?.[0].t === "Live", "anon sees only live offers");
ok(!!(await run("authenticated", ADMIN, "insert into offers (title, start_date, end_date) values ('Bad', current_date, current_date - 1)")).error, "offer end before start rejected");

// ---------------------------------------------------------------- menu PDFs + publish
r = await run("authenticated", ADMIN, `insert into menus (title, file_path, file_name, size_bytes) values
  ('Week 1', 'w1.pdf', 'w1.pdf', 1000), ('Week 2', 'w2.pdf', 'w2.pdf', 1000), ('Week 3', 'w3.pdf', 'w3.pdf', 1000) returning id, uploaded_by`);
ok(r.rows?.length === 3 && r.rows[0].uploaded_by === ADMIN, "admin adds menus; uploaded_by set automatically");
const [m1, m2, m3] = r.rows;
ok(!!(await run("authenticated", USER, `select public.publish_menu('${m1.id}')`)).error, "non-admin cannot publish");
await run("authenticated", ADMIN, `select public.publish_menu('${m1.id}')`);
await run("authenticated", ADMIN, `select public.publish_menu('${m2.id}')`);
ok((await one("select string_agg(title, ',') t from menus where is_current")).t === "Week 2", "publish swaps the current menu");
ok((await run("anon", null, "select string_agg(title, ',') t from menus")).rows?.[0].t === "Week 2", "anon sees only the current menu");
ok(/menu not found/.test((await run("authenticated", ADMIN, "select public.publish_menu(gen_random_uuid())")).error ?? ""), "publishing an unknown menu fails clearly");
ok(!!(await run("authenticated", ADMIN, `update menus set is_current = true where id = '${m3.id}'`)).error, "a second current menu is blocked");
ok(!!(await run("authenticated", ADMIN, `update menus set title = 'x' where id = '${m2.id}'`)).error, "menu title/file cannot be edited");
ok((await run("authenticated", USER, `update menus set is_current = false where id = '${m2.id}'`)).affected === 0, "non-admin cannot unpublish");
ok((await run("authenticated", ADMIN, `delete from menus where id = '${m2.id}'`)).affected === 0, "the current menu cannot be deleted");
ok((await run("authenticated", ADMIN, `delete from menus where id = '${m1.id}'`)).affected === 1, "an old menu can be deleted");

// ---------------------------------------------------------------- storage
ok((await run("authenticated", ADMIN, "insert into storage.objects (bucket_id, name) values ('menus', 'a.pdf')")).affected === 1, "admin uploads to the menus bucket");
ok(!!(await run("authenticated", USER, "insert into storage.objects (bucket_id, name) values ('menus', 'b.pdf')")).error, "non-admin cannot upload");
ok((await run("anon", null, "select count(*)::int n from storage.objects")).rows?.[0].n === 0, "anon cannot list the bucket");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
