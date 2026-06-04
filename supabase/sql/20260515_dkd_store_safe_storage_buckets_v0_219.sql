-- DKD DraBornGo v0.219 store-safe storage bucket compatibility
-- Creates new DraBornGo bucket names for future uploads. Existing old public URLs keep working if old buckets still exist.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('dkd_draborngo_card_art', 'dkd_draborngo_card_art', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('dkd_draborngo_special_target_art', 'dkd_draborngo_special_target_art', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('dkd_draborngo_business_product_art', 'dkd_draborngo_business_product_art', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('dkd_draborngo_courier_docs', 'dkd_draborngo_courier_docs', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('dkd_draborngo_cargo_package_art', 'dkd_draborngo_cargo_package_art', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
