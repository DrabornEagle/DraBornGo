-- DKD DraBornGo v0.0.2 - Gönderi Paneli paket görseli Storage RLS düzeltmesi
-- Önce: Paket görseli yüklenirken storage.objects RLS yüzünden
--        "new row violates row-level security policy" hatası alınabilir.
-- Sonra: Authenticated kullanıcılar sadece DraBornGo gönderi paket görseli bucket'ına
--        cargo-packages/ klasörü altında görsel yükleyebilir; public URL okunabilir.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'dkd_draborngo_cargo_package_art',
  'dkd_draborngo_cargo_package_art',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

drop policy if exists dkd_cargo_package_art_select_public on storage.objects;
create policy dkd_cargo_package_art_select_public
on storage.objects
for select
to public
using (
  bucket_id = 'dkd_draborngo_cargo_package_art'
);

drop policy if exists dkd_cargo_package_art_insert_authenticated on storage.objects;
create policy dkd_cargo_package_art_insert_authenticated
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'dkd_draborngo_cargo_package_art'
  and (storage.foldername(name))[1] = 'cargo-packages'
);

drop policy if exists dkd_cargo_package_art_update_authenticated on storage.objects;
create policy dkd_cargo_package_art_update_authenticated
on storage.objects
for update
to authenticated
using (
  bucket_id = 'dkd_draborngo_cargo_package_art'
  and (storage.foldername(name))[1] = 'cargo-packages'
)
with check (
  bucket_id = 'dkd_draborngo_cargo_package_art'
  and (storage.foldername(name))[1] = 'cargo-packages'
);
