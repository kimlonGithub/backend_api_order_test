-- Seed data for translate_regions (Option B — two tables)
-- Run after migration 20260205163611_add_translate_regions

-- translate_regions
INSERT INTO translate_regions (id, name, native_name, flag_url, default_locale, is_active, sort_order)
VALUES
  ('asia', 'Asia', 'Asia', '/translate/asia.png', 'en', true, 1),
  ('th', 'Thailand', 'Thailand', '/translate/th.png', 'th', true, 2),
  ('kh', 'Cambodia', 'Cambodia', '/translate/km.webp', 'km', true, 3),
  ('my', 'Malaysia', 'Malaysia', '/translate/my.png', 'ms', true, 4);

-- translate_region_locales (one row per region–locale)
INSERT INTO translate_region_locales (region_id, locale_code, sort_order)
VALUES
  ('asia', 'en', 0),
  ('asia', 'zh', 1),
  ('th', 'en', 0),
  ('th', 'th', 1),
  ('kh', 'en', 0),
  ('kh', 'km', 1),
  ('kh', 'zh', 2),
  ('my', 'en', 0),
  ('my', 'ms', 1),
  ('my', 'zh', 2);
