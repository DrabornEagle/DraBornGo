# DraBornGo

> Aktif sürüm: **v0.0.17** • Android versionCode **3** • Expo SDK **57** • Aktif lokal repo: `~/projects/DraBornGo`

DraBornGo Google Play sürümü, mevcut yetkili kuryelerin teslimat görevlerini görmesi, görevi kabul etmesi, alım/teslim adımlarını ve rotayı yönetmesi, çalışma-kazanç özetlerini takip etmesi için kullanılan kurye operasyon uygulamasıdır.

## v0.0.17 test düzeni

- Android versionCode **3** olarak sabittir ve üretim AAB oluşturulana kadar artırılmaz.
- Test Expo Go üzerinden yapılır; bu sürüm geçişinde APK veya AAB üretilmez.
- Kurye operasyon erişimi mevcut hesap yetkisine göre çalışır.
- İşletme/admin tarafındaki ayrı operasyonlar ileride DraBornGo Panel / Web Panel altında ayrıştırılacaktır.
- Supabase'deki geçmiş veri şemaları ve kayıtlar geri yükleme ihtiyacı için korunur.

## Google Play güvenlik kapsamı

- Konum yalnız uygulama açıkken kurye görevi, rota ve aktif teslimat için kullanılır.
- Arka plan konumu ve foreground location service etkin değildir.
- Kamera ve sistem görsel seçicisi yalnız kullanıcının başlattığı profil görseli işleminde kullanılır.
- Mikrofon ve geniş medya/depolama izinleri engellidir.
- Hesap silme uygulama içinden ve resmi web sayfasından başlatılabilir.
- Üretim Android güncellemeleri Google Play üzerinden dağıtılır; Expo Go test döneminde webden APK güncellemesi yapılmaz.

## Aktif kaynak ve eşitleme

GitHub `main` ve `~/projects/DraBornGo` her sürüm değişikliğinden sonra birebir eşit tutulur. Her yeni sürümden önce çalışan `main` tarihli bir `backup/...` dalında korunur.

## Ortam değişkenleri

Service-role anahtarları, veritabanı parolaları, Android signing bilgileri ve özel tokenlar repoya commit edilmez. Mobil çalışma zamanı yalnız public Expo değişkenlerini kullanır.

## Web

Canlı şirket sitesi ayrı repodan yayınlanır: `DrabornEagle/DrabornEagle_Web`. DraBornGo ürün, gizlilik, şartlar ve hesap silme sayfaları v0.0.17 ile eşit tutulur.
