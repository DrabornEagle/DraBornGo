-- DKD DraBornGo v0.0.3 - SMS OTP tablo izin düzeltmesi
-- Hata: permission denied for table dkd_sms_otp_requests
-- Güvenli tekrar çalıştırma: Sipariş, kullanıcı, cüzdan veya OTP geçmişi silmez.

begin;

do $$
begin
  if to_regclass('public.dkd_sms_otp_requests') is null then
    raise exception 'dkd_sms_otp_requests tablosu yok. Önce dkd_v0_0_3_sms_otp_and_customer_push_fix.sql dosyasını çalıştır.';
  end if;
end $$;

revoke all on table public.dkd_sms_otp_requests from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.dkd_sms_otp_requests to service_role;

notify pgrst, 'reload schema';

commit;
