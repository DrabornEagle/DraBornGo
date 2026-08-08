-- DraBornGo v0.212 - Google Play ödeme kapsamı ve public policy URL güvenliği
-- Amaç: TL cüzdanı yalnızca fiziksel hizmet/sipariş bakiyesi olarak konumlandırmak,
-- eski Google Docs edit linklerini canlı policy config içinde public HTML URL'lere çevirmek,
-- market/koleksiyon vitrini metinlerini kazanılmış puan mantığıyla temizlemek.
-- Not: Bu dosya canlı Supabase veritabanına otomatik uygulanmaz; SQL Editor içinde manuel çalıştırılmalıdır.

begin;

create table if not exists public.dkd_policy_center_config (
  dkd_id_value integer primary key,
  dkd_privacy_policy_doc_url_value text not null default '',
  dkd_account_deletion_form_url_value text not null default '',
  dkd_package_name_value text not null default 'com.draborneagle.draborngo',
  dkd_version_name_value text not null default '0.212.0',
  dkd_version_code_value integer not null default 212,
  dkd_updated_at_value timestamptz not null default now()
);

alter table public.dkd_policy_center_config
  add column if not exists dkd_privacy_policy_doc_url_value text not null default '',
  add column if not exists dkd_account_deletion_form_url_value text not null default '',
  add column if not exists dkd_package_name_value text not null default 'com.draborneagle.draborngo',
  add column if not exists dkd_version_name_value text not null default '0.212.0',
  add column if not exists dkd_version_code_value integer not null default 212,
  add column if not exists dkd_updated_at_value timestamptz not null default now();

insert into public.dkd_policy_center_config (
  dkd_id_value,
  dkd_privacy_policy_doc_url_value,
  dkd_account_deletion_form_url_value,
  dkd_package_name_value,
  dkd_version_name_value,
  dkd_version_code_value,
  dkd_updated_at_value
)
values (
  1,
  'https://www.draborneagle.com/draborngo/privacy/',
  'https://www.draborneagle.com/draborngo/account-deletion/',
  'com.draborneagle.draborngo',
  '0.212.0',
  212,
  now()
)
on conflict (dkd_id_value) do update
set
  dkd_privacy_policy_doc_url_value = excluded.dkd_privacy_policy_doc_url_value,
  dkd_account_deletion_form_url_value = excluded.dkd_account_deletion_form_url_value,
  dkd_package_name_value = excluded.dkd_package_name_value,
  dkd_version_name_value = excluded.dkd_version_name_value,
  dkd_version_code_value = excluded.dkd_version_code_value,
  dkd_updated_at_value = now();

grant select on table public.dkd_policy_center_config to anon, authenticated;
alter table public.dkd_policy_center_config enable row level security;

drop policy if exists dkd_policy_center_config_public_read_policy on public.dkd_policy_center_config;
create policy dkd_policy_center_config_public_read_policy
on public.dkd_policy_center_config
for select
to anon, authenticated
using (true);

do $$
declare
  dkd_hero_kicker_value text := 'KAZANILMIŞ PUAN VİTRİNİ';
  dkd_hero_title_value text := 'Görevden kazan, uygulamada kullan';
  dkd_hero_subtitle_value text := 'Puan satın alınmaz; yalnızca görev, sandık ve etkinliklerden kazanılır. TL cüzdan dijital ürün veya oyun içi avantaj satın almak için kullanılmaz.';
  dkd_logic_title_value text := 'Google Play ödeme kapsamı';
  dkd_logic_body_value text := 'TL cüzdan yalnızca fiziksel hizmet, teslimat ve sipariş ödemelerinde kullanılır. Puan, koleksiyon, özel kart, enerji veya sandık gerçek para karşılığı satılmaz.';
  dkd_legacy_market_columns_exist_value boolean := false;
  dkd_prefixed_market_columns_exist_value boolean := false;
begin
  if to_regclass('public.dkd_market_ui_config') is null then
    return;
  end if;

  select exists (
    select 1
    from information_schema.columns dkd_market_columns
    where dkd_market_columns.table_schema = 'public'
      and dkd_market_columns.table_name = 'dkd_market_ui_config'
      and dkd_market_columns.column_name = 'id'
  )
  into dkd_legacy_market_columns_exist_value;

  if dkd_legacy_market_columns_exist_value then
    execute 'insert into public.dkd_market_ui_config (id) values (1) on conflict (id) do nothing';

    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'hero_kicker') then
      execute 'update public.dkd_market_ui_config set hero_kicker = $1 where id = 1' using dkd_hero_kicker_value;
    end if;
    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'hero_title') then
      execute 'update public.dkd_market_ui_config set hero_title = $1 where id = 1' using dkd_hero_title_value;
    end if;
    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'hero_subtitle') then
      execute 'update public.dkd_market_ui_config set hero_subtitle = $1 where id = 1' using dkd_hero_subtitle_value;
    end if;
    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'logic_title') then
      execute 'update public.dkd_market_ui_config set logic_title = $1 where id = 1' using dkd_logic_title_value;
    end if;
    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'logic_body') then
      execute 'update public.dkd_market_ui_config set logic_body = $1 where id = 1' using dkd_logic_body_value;
    end if;
    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'updated_at') then
      execute 'update public.dkd_market_ui_config set updated_at = now() where id = 1';
    end if;
  end if;

  select exists (
    select 1
    from information_schema.columns dkd_market_columns
    where dkd_market_columns.table_schema = 'public'
      and dkd_market_columns.table_name = 'dkd_market_ui_config'
      and dkd_market_columns.column_name = 'dkd_id_value'
  )
  into dkd_prefixed_market_columns_exist_value;

  if dkd_prefixed_market_columns_exist_value then
    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'dkd_hero_kicker_value') then
      execute 'update public.dkd_market_ui_config set dkd_hero_kicker_value = $1 where dkd_id_value = 1' using dkd_hero_kicker_value;
    end if;
    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'dkd_hero_title_value') then
      execute 'update public.dkd_market_ui_config set dkd_hero_title_value = $1 where dkd_id_value = 1' using dkd_hero_title_value;
    end if;
    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'dkd_hero_subtitle_value') then
      execute 'update public.dkd_market_ui_config set dkd_hero_subtitle_value = $1 where dkd_id_value = 1' using dkd_hero_subtitle_value;
    end if;
    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'dkd_logic_title_value') then
      execute 'update public.dkd_market_ui_config set dkd_logic_title_value = $1 where dkd_id_value = 1' using dkd_logic_title_value;
    end if;
    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'dkd_logic_body_value') then
      execute 'update public.dkd_market_ui_config set dkd_logic_body_value = $1 where dkd_id_value = 1' using dkd_logic_body_value;
    end if;
    if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_ui_config' and dkd_market_columns.column_name = 'dkd_updated_at_value') then
      execute 'update public.dkd_market_ui_config set dkd_updated_at_value = now() where dkd_id_value = 1';
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.dkd_market_reward_types') is null then
    return;
  end if;

  if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_reward_types' and dkd_market_columns.column_name = 'reward_kind') then
    execute 'update public.dkd_market_reward_types set title = $1, subtitle = $2 where lower(coalesce(reward_kind, '''')) in (''shard'', ''shards'')' using 'Parça', 'Kazanılmış koleksiyon kaynağı';
    execute 'update public.dkd_market_reward_types set title = $1, subtitle = $2 where lower(coalesce(reward_kind, '''')) in (''ticket'', ''boss'', ''boss_tickets'')' using 'Özel Kart', 'Sabit kurallı özel hedef hakkı';
    execute 'update public.dkd_market_reward_types set title = $1, subtitle = $2 where lower(coalesce(reward_kind, '''')) in (''token'', ''puan'')' using 'Puan', 'Yalnızca kazanılmış puan';
  end if;
end $$;

-- Puan ödülü veren paketler, puanı tekrar puana çeviren kapalı döngü algısı oluşturmaması için pasifleştirilir.
do $$
begin
  if to_regclass('public.dkd_market_shop_defs') is null then
    return;
  end if;

  if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_shop_defs' and dkd_market_columns.column_name = 'reward_kind')
     and exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_market_shop_defs' and dkd_market_columns.column_name = 'is_active') then
    execute 'update public.dkd_market_shop_defs set is_active = false where lower(coalesce(reward_kind, '''')) in (''token'', ''puan'')';
  end if;
end $$;

-- İşletme fiziksel ürün sipariş kayıtlarında eski TOKEN para birimi etiketi varsa PUAN olarak okunur.
do $$
begin
  if to_regclass('public.dkd_business_product_orders') is null then
    return;
  end if;

  if exists (select 1 from information_schema.columns dkd_market_columns where dkd_market_columns.table_schema = 'public' and dkd_market_columns.table_name = 'dkd_business_product_orders' and dkd_market_columns.column_name = 'currency_code') then
    execute 'update public.dkd_business_product_orders set currency_code = $1 where upper(coalesce(currency_code, '''')) = $2' using 'PUAN', 'TOKEN';
  end if;
end $$;

commit;
