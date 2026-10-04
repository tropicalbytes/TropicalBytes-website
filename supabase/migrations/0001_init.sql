-- TropicalBytes Admin Panel — Phase 1 schema
-- Design rules:
--   * Text primary keys are STABLE KEYS. Existing ids (e.g. 'weekly-veg-1') are preserved by the seed;
--     rows created in the admin get a random key. Ids never derive from editable names.
--   * Money is integer rupees. No floats.
--   * Derived values (per-meal price, delivery label) are computed in code, never stored.
--   * Public (anon) can read only active rows. Only users listed in public.admins can write.
--   * Nothing is hard-deleted for plans; use is_active. Every change is written to audit_log.
--   * Table privileges are GRANTed explicitly (this project's default privileges give anon/authenticated
--     no SELECT/INSERT/UPDATE/DELETE on new tables). RLS policies then decide which ROWS each role sees.
--   * Runs as one transaction: if any statement fails, nothing is created.

begin;

-- ---------------------------------------------------------------- admins
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "admins read admins" on public.admins for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------- helpers
create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- subscription plans
create table public.plan_tiers (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(name) between 1 and 80),
  duration_days smallint not null check (duration_days between 1 and 366),
  tagline text not null default '' check (char_length(tagline) <= 120),
  is_popular boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_options (
  id text primary key default gen_random_uuid()::text,
  tier_id text not null references public.plan_tiers (id) on update cascade,
  food_type text not null check (food_type in ('Veg', 'Non-Veg')),
  meal_count smallint not null check (meal_count in (1, 2)),
  total_price integer not null check (total_price between 1 and 200000),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tier_id, food_type, meal_count)
);
create index plan_options_tier_idx on public.plan_options (tier_id);

-- ---------------------------------------------------------------- individual menu (meals + desserts)
create table public.menu_items (
  id text primary key default gen_random_uuid()::text,
  category text not null check (category in ('veg', 'non_veg', 'dessert')),
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 300),
  price integer not null check (price between 1 and 100000),
  is_vegetarian boolean not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menu_items_category_idx on public.menu_items (category, sort_order);

-- ---------------------------------------------------------------- party / bulk
-- Desserts are NOT duplicated here. Client confirmed (2026-09-29) that party
-- dessert pricing intentionally shares the individual dessert menu — the
-- party form reads menu_items where category = 'dessert' directly, so there
-- is exactly one row (and one price) per dessert, never two to drift apart.
create table public.bulk_items (
  id text primary key default gen_random_uuid()::text,
  category text not null check (category in ('veg', 'non_veg')),
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 300),
  unit text not null check (unit in ('kg', 'piece')),
  price integer check (price is null or price between 1 and 100000),
  is_seasonal boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_seasonal and price is null) or (not is_seasonal and price is not null))
);
create index bulk_items_category_idx on public.bulk_items (category, sort_order);

-- ---------------------------------------------------------------- settings
create table public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value text not null check (char_length(value) <= 500),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- weekly menu PDFs
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  file_path text not null unique,
  file_name text not null,
  size_bytes bigint not null check (size_bytes > 0),
  is_current boolean not null default false,
  uploaded_by uuid default auth.uid() references auth.users (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  published_at timestamptz
);
create unique index menus_one_current_idx on public.menus (is_current) where is_current;
create index menus_uploaded_by_idx on public.menus (uploaded_by);

-- ---------------------------------------------------------------- offers (display-only in Phase 1)
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 300),
  discount_label text check (discount_label is null or char_length(discount_label) <= 40),
  offer_price integer check (offer_price is null or offer_price between 1 and 200000),
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

-- ---------------------------------------------------------------- audit log
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  actor_email text,
  table_name text not null,
  row_id text,
  action text not null,
  old_data jsonb,
  new_data jsonb
);
create index audit_log_at_idx on public.audit_log (at desc);
create index audit_log_row_idx on public.audit_log (table_name, row_id);

create or replace function public.audit_row()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  pk text := coalesce(tg_argv[0], 'id');
  o jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  n jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
begin
  insert into public.audit_log (actor, actor_email, table_name, row_id, action, old_data, new_data)
  values (auth.uid(), auth.jwt() ->> 'email', tg_table_name, coalesce(n ->> pk, o ->> pk), tg_op, o, n);
  return null;
end;
$$;

-- ---------------------------------------------------------------- triggers
do $$
declare t text;
begin
  foreach t in array array['plan_tiers', 'plan_options', 'menu_items', 'bulk_items', 'site_settings', 'offers'] loop
    execute format('create trigger trg_%1$s_touch before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;

  foreach t in array array['plan_tiers', 'plan_options', 'menu_items', 'bulk_items', 'offers', 'menus'] loop
    execute format('create trigger trg_%1$s_audit after insert or update or delete on public.%1$s for each row execute function public.audit_row(''id'')', t);
  end loop;
end $$;
create trigger trg_site_settings_audit after insert or update or delete on public.site_settings
  for each row execute function public.audit_row('key');

-- ---------------------------------------------------------------- atomic publish
create or replace function public.publish_menu(p_menu_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.menus where id = p_menu_id) then
    raise exception 'menu not found' using errcode = 'P0002';
  end if;
  update public.menus set is_current = false where is_current and id <> p_menu_id;
  update public.menus set is_current = true, published_at = now() where id = p_menu_id;
end;
$$;
revoke all on function public.publish_menu(uuid) from public, anon;
grant execute on function public.publish_menu(uuid) to authenticated;

-- ---------------------------------------------------------------- row level security
do $$
declare t text;
begin
  foreach t in array array['plan_tiers', 'plan_options', 'menu_items', 'bulk_items', 'site_settings', 'offers', 'menus', 'audit_log'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "read active" on public.plan_tiers   for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "read active" on public.plan_options for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "read active" on public.menu_items   for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "read active" on public.bulk_items   for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "read all"    on public.site_settings for select to anon, authenticated using (true);
create policy "read current" on public.menus       for select to anon, authenticated using (is_current or (select public.is_admin()));
create policy "read live" on public.offers for select to anon, authenticated using (
  (select public.is_admin())
  or (
    is_active
    and (start_date is null or start_date <= (now() at time zone 'Asia/Kolkata')::date)
    and (end_date   is null or end_date   >= (now() at time zone 'Asia/Kolkata')::date)
  )
);
create policy "admins read audit" on public.audit_log for select to authenticated using ((select public.is_admin()));

create policy "admin insert" on public.plan_tiers   for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.plan_tiers   for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin insert" on public.plan_options for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.plan_options for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin insert" on public.menu_items for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.menu_items for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.menu_items for delete to authenticated using ((select public.is_admin()));

create policy "admin insert" on public.bulk_items for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.bulk_items for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.bulk_items for delete to authenticated using ((select public.is_admin()));

create policy "admin update" on public.site_settings for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin insert" on public.offers for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.offers for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.offers for delete to authenticated using ((select public.is_admin()));

create policy "admin insert" on public.menus for insert to authenticated with check ((select public.is_admin()));
create policy "admin delete" on public.menus for delete to authenticated using ((select public.is_admin()) and not is_current);
-- No direct UPDATE policy on menus: publishing goes through publish_menu() only.

-- ---------------------------------------------------------------- table privileges
-- Start from zero for the API roles, then grant exactly what the policies above need.
-- UPDATE is granted per column and excludes id/created_at, so a stable key can never be
-- rewritten through the API; INSERT excludes id so admin-created rows always get a random key.
revoke all on public.admins, public.plan_tiers, public.plan_options, public.menu_items, public.bulk_items,
              public.site_settings, public.menus, public.offers, public.audit_log
  from anon, authenticated;

grant select on public.plan_tiers, public.plan_options, public.menu_items, public.bulk_items,
                public.site_settings, public.menus, public.offers
  to anon, authenticated;
grant select on public.admins, public.audit_log to authenticated;

grant insert (name, duration_days, tagline, is_popular, is_active, sort_order),
      update (name, duration_days, tagline, is_popular, is_active, sort_order)
  on public.plan_tiers to authenticated;
grant insert (tier_id, food_type, meal_count, total_price, is_active, sort_order),
      update (total_price, is_active, sort_order)
  on public.plan_options to authenticated;
grant insert (category, name, description, price, is_vegetarian, is_active, sort_order),
      update (category, name, description, price, is_vegetarian, is_active, sort_order),
      delete
  on public.menu_items to authenticated;
grant insert (category, name, description, unit, price, is_seasonal, is_active, sort_order),
      update (category, name, description, unit, price, is_seasonal, is_active, sort_order),
      delete
  on public.bulk_items to authenticated;
grant update (value) on public.site_settings to authenticated;
grant insert (title, description, discount_label, offer_price, start_date, end_date, is_active),
      update (title, description, discount_label, offer_price, start_date, end_date, is_active),
      delete
  on public.offers to authenticated;
grant insert (title, file_path, file_name, size_bytes), delete on public.menus to authenticated;

-- service_role (server-only scripts) bypasses RLS but still needs table privileges.
grant all on public.admins, public.plan_tiers, public.plan_options, public.menu_items, public.bulk_items,
             public.site_settings, public.menus, public.offers, public.audit_log
  to service_role;

-- ---------------------------------------------------------------- storage (weekly menu PDFs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menus', 'menus', true, 5242880, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "menus admin read"   on storage.objects for select to authenticated using (bucket_id = 'menus' and (select public.is_admin()));
create policy "menus admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'menus' and (select public.is_admin()));
create policy "menus admin update" on storage.objects for update to authenticated using (bucket_id = 'menus' and (select public.is_admin())) with check (bucket_id = 'menus' and (select public.is_admin()));
create policy "menus admin delete" on storage.objects for delete to authenticated using (bucket_id = 'menus' and (select public.is_admin()));

commit;
