-- Add editable copies of existing category text without overwriting later edits.
insert into public.site_settings (setting_key, value) values
  ('destinations_praias_description', 'Conheça praias e lugares para aproveitar a natureza.'),
  ('destinations_natureza_description', 'Explore trilhas, florestas e experiências de ecoturismo.'),
  ('destinations_cultura_description', 'Conheça a história, cultura e tradições da região.'),
  ('destinations_gastronomia_description', 'Descubra sabores e pratos da culinária regional.')
on conflict (setting_key) do nothing;
