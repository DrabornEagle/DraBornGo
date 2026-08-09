create table if not exists public.dkd_app_release_notes (
  dkd_id_value smallint primary key default 1 check (dkd_id_value = 1),
  dkd_release_note_value text not null check (char_length(btrim(dkd_release_note_value)) between 1 and 4000),
  dkd_version_name_value text not null default '0.0.15',
  dkd_version_code_value integer not null default 3,
  dkd_updated_at_value timestamptz not null default now()
);

alter table public.dkd_app_release_notes enable row level security;

drop policy if exists dkd_app_release_notes_read_all_v1 on public.dkd_app_release_notes;
create policy dkd_app_release_notes_read_all_v1
on public.dkd_app_release_notes
for select
to anon, authenticated
using (true);

drop policy if exists dkd_app_release_notes_insert_admin_v1 on public.dkd_app_release_notes;
create policy dkd_app_release_notes_insert_admin_v1
on public.dkd_app_release_notes
for insert
to authenticated
with check (public.dkd_is_admin());

drop policy if exists dkd_app_release_notes_update_admin_v1 on public.dkd_app_release_notes;
create policy dkd_app_release_notes_update_admin_v1
on public.dkd_app_release_notes
for update
to authenticated
using (public.dkd_is_admin())
with check (public.dkd_is_admin());

grant select on public.dkd_app_release_notes to anon, authenticated;
grant insert, update on public.dkd_app_release_notes to authenticated;
revoke delete on public.dkd_app_release_notes from anon, authenticated;

insert into public.dkd_app_release_notes (
  dkd_id_value,
  dkd_release_note_value,
  dkd_version_name_value,
  dkd_version_code_value,
  dkd_updated_at_value
)
values (
  1,
  'DraBornGo v0.0.15: Hizmet Ağı Merkezi, Gönderi Oluştur ve Siparişlerim kullanıcı kaynak kodundan kaldırıldı. Supabase tarafındaki ilgili veri ve sunucu yapıları ileride geri yükleme amacıyla korunuyor. Android versionCode 3 sabit ve test Expo Go üzerinden devam ediyor.',
  '0.0.15',
  3,
  now()
)
on conflict (dkd_id_value) do nothing;
