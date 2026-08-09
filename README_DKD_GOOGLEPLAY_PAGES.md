# DraBornGo Google Play Public Pages

DraBornGo Google Play için gerekli public ürün/yasal sayfaları `https://www.draborneagle.com/draborngo/` altında yayınlanır.

## Canonical canlı web kaynağı

Canlı `draborneagle.com` web içeriğinin canonical GitHub kaynağı:

- Repo: `DrabornEagle/DrabornEagle_Web`
- Ürün: `https://www.draborneagle.com/draborngo/`
- Gizlilik: `https://www.draborneagle.com/draborngo/privacy/`
- Hesap ve veri silme: `https://www.draborneagle.com/draborngo/account-deletion/`
- Kullanım şartları: `https://www.draborneagle.com/draborngo/terms/`
- Topluluk kuralları: `https://www.draborneagle.com/draborngo/community/`

Bu mobil repodaki `web/draborngo/` ve `web/DraBornGo/App/` dosyaları uygulama/politika geliştirmesi için izlenen kaynak kopyalarıdır; canlı sitenin canonical yayın kaynağı `DrabornEagle/DrabornEagle_Web` reposudur.

## Google Play güvenlik kapsamı

- Hesap oluşturan kullanıcı için uygulama içinde hesap silme yolu bulunur.
- Uygulama dışında, uygulamayı kaldırmış kullanıcının da erişebildiği public hesap ve veri silme talep yolu bulunur.
- Gizlilik politikası public, erişilebilir ve DraBornGo/DrabornEagle kimliğini açıkça belirtir.
- Kullanıcı içerikli iletişim alanları için raporlama, engelleme ve moderasyon kuralları belgelenir.
- Google Play sürümündeki uygulama webden APK indirerek kendini güncellemez; üretim güncellemeleri Google Play üzerinden yapılır.
- Web hesap silme yolu giriş yapmadan erişilebilir olmalıdır; kullanıcıdan parola veya doğrulama kodu istenmez.
- v0.0.14 Android izin seti ön plan hassas/yaklaşık konum ve kamera ile sınırlandırılmıştır; arka plan konum, mikrofon, geniş medya/depolama, overlay ve paket kurma izinleri engellenir.
- Hedef Android API 36 olarak tutulur.

## v0.0.14 test notu

DraBornGo v0.0.14 / Android versionCode 3 aşamasında test Expo SDK 57 uyumlu Expo Go üzerinden yürütülür. Google Play'de mevcut yayımlanmış Android versionCode 2 olduğu için bir sonraki üretim AAB kimliği 3 olarak sabit tutulur. AAB oluşturulana kadar versionCode 3 değiştirilmeyecektir. Bu test aşamasında APK/AAB üretilmez veya web üzerinden uygulama paketi dağıtılmaz.
