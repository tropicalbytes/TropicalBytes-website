-- Checkpoint B verification: READ-ONLY (selects only). Run in the Supabase Dashboard SQL Editor
-- after seed.sql. Every row should show ok = true.
select * from (values
  ('4 plan tiers',            (select count(*) = 4  from public.plan_tiers),    (select count(*)::text from public.plan_tiers)),
  ('16 plan options',         (select count(*) = 16 from public.plan_options),  (select count(*)::text from public.plan_options)),
  ('42 menu items (18 veg / 18 non-veg / 6 desserts)',
     (select count(*) filter (where category = 'veg') = 18 and count(*) filter (where category = 'non_veg') = 18
             and count(*) filter (where category = 'dessert') = 6 from public.menu_items),
     (select string_agg(category || '=' || n, ' ' order by category) from
        (select category, count(*) n from public.menu_items group by category) x)),
  ('39 bulk items (18 veg / 21 non-veg, no desserts)',
     (select count(*) filter (where category = 'veg') = 18 and count(*) filter (where category = 'non_veg') = 21
             and count(*) = 39 from public.bulk_items),
     (select count(*)::text from public.bulk_items)),
  ('2 site settings',         (select count(*) = 2 from public.site_settings),  (select count(*)::text from public.site_settings)),
  ('monthly-veg-1 = 4560, monthly-veg-2 = 9120',
     (select string_agg(id || '=' || total_price, ' ' order by id) = 'monthly-veg-1=4560 monthly-veg-2=9120'
        from public.plan_options where id like 'monthly-veg-%'),
     (select string_agg(id || '=' || total_price, ' ' order by id) from public.plan_options where id like 'monthly-veg-%')),
  ('every plan total = days × meals × a whole per-meal price',
     (select bool_and(o.total_price % (t.duration_days * o.meal_count) = 0)
        from public.plan_options o join public.plan_tiers t on t.id = o.tier_id), ''),
  ('only Weekly marked popular',
     (select string_agg(id, ',') = 'weekly' from public.plan_tiers where is_popular), ''),
  ('Fish Curry is the only seasonal (unpriced) item',
     (select string_agg(id, ',') = 'party-nonveg-fish-curry' from public.bulk_items where is_seasonal and price is null), ''),
  ('stable ids kept (spot check)',
     (select count(*) = 4 from (
        select id from public.plan_options where id = 'weekly-veg-1'
        union all select id from public.menu_items where id in ('veg-alfredo-penne-pasta-veg', 'dessert-tiramisu')
        union all select id from public.bulk_items where id = 'party-veg-paneer-chilly') s), ''),
  ('everything active',
     (select bool_and(is_active) from (
        select is_active from public.plan_tiers union all select is_active from public.plan_options
        union all select is_active from public.menu_items union all select is_active from public.bulk_items) a), ''),
  ('103 seed inserts audited',
     (select count(*) = 103 from public.audit_log where action = 'INSERT'), (select count(*)::text from public.audit_log)),
  ('no admins, menus, or offers yet (Checkpoint C / admin UI)',
     (select count(*) = 0 from public.admins) and (select count(*) = 0 from public.menus) and (select count(*) = 0 from public.offers), '')
) as v(check_name, ok, detail);
