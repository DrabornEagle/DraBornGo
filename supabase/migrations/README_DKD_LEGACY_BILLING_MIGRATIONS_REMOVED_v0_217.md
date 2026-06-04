# DKD v0.217 legacy billing migration cleanup

Google Play final audit içinde karışıklık oluşturan eski billing/puan migration geçmişi aktif `supabase/migrations` klasöründen çıkarıldı.

Aktif istemci kodu artık yalnızca yeni güvenli kazanılmış puan RPC akışlarını kullanır. Güncel çalıştırılacak SQL dosyası `supabase/sql/20260515_dkd_google_play_point_redeem_direct_v0_216.sql` içinde korunur.

Not: Bu temizlik eski tarihsel migration kayıtlarını hedefler; mevcut Supabase veritabanındaki aktif tablo/kolon uyumluluğu ayrıca güncel SQL dosyasıyla korunur.
