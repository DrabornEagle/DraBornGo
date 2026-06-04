-- DKD DraBornGo v0.0.2 - Gönderi Paneli kurye havuzu push hedef düzeltmesi
-- Bu sürüm mevcut fonksiyonun dönüş tipi değiştiği için önce fonksiyonu düşürür, sonra doğru dönüş tipiyle yeniden oluşturur.
-- Önce: dkd_courier_job_push_target_tokens() eski OUT parametreleri yüzünden CREATE OR REPLACE hata verebilir.
-- Sonra: send-courier-order-alert Edge Function lisanslı/aktif kurye push tokenlarını okuyabilir.

begin;

drop function if exists public.dkd_courier_job_push_target_tokens();

create function public.dkd_courier_job_push_target_tokens()
returns table (
  user_id uuid,
  expo_push_token text,
  token text,
  dkd_expo_push_token text,
  dkd_push_segment text
)
language sql
security definer
set search_path = public
as $$
  select distinct on (dkd_token_scope.expo_push_token)
    dkd_token_scope.user_id,
    dkd_token_scope.expo_push_token,
    dkd_token_scope.expo_push_token as token,
    dkd_token_scope.expo_push_token as dkd_expo_push_token,
    'courier_licensed'::text as dkd_push_segment
  from public.dkd_push_tokens dkd_token_scope
  join public.dkd_profiles dkd_profile_scope
    on dkd_profile_scope.user_id = dkd_token_scope.user_id
  where coalesce(dkd_token_scope.is_active, false) is true
    and coalesce(dkd_token_scope.expo_push_token, '') like 'ExponentPushToken%'
    and lower(coalesce(dkd_profile_scope.courier_status, 'none')) in (
      'approved',
      'active',
      'licensed',
      'lisansli',
      'lisanslı',
      'aktif'
    )
  order by dkd_token_scope.expo_push_token, dkd_token_scope.updated_at desc nulls last;
$$;

revoke all on function public.dkd_courier_job_push_target_tokens() from public;
grant execute on function public.dkd_courier_job_push_target_tokens() to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
