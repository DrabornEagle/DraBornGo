# DraBornGo Web Privacy/Data Safety Update - SMS OTP v0.0.3

Bu içerik DrabornEagle_Web reposunda ilgili gizlilik ve hesap silme sayfalarına eklenmek için hazırlandı.

## Gizlilik Politikası sayfasına eklenecek alan

DraBornGo, isteğe bağlı SMS doğrulama ve hesap güvenliği için telefon numaranı işler. SMS doğrulama kodları İleti Merkezi altyapısı üzerinden gönderilir. Bu kullanım yalnızca giriş güvenliği, hesap doğrulama, hesap kurtarma, sipariş güvenliği ve kullanıcı tarafından başlatılan işlem bildirimleri içindir. Telefon numarası pazarlama SMS'i, reklam hedefleme veya üçüncü taraflara satış amacıyla kullanılmaz.

OTP kodları kısa süreli geçerlidir. DraBornGo OTP kodunu düz metin olarak saklamaz; güvenlik amacıyla doğrulama kaydını hash ve işlem zamanı bilgileriyle tutar. Hatalı deneme sayısı ve gönderim sıklığı kötüye kullanımı önlemek için sınırlandırılır.

## Data Safety kısa notu

Toplanan yeni veri tipi: Telefon numarası / SMS doğrulama kaydı.
Amaç: Uygulama işlevselliği, hesap yönetimi, güvenlik, dolandırıcılığı/kötüye kullanımı önleme.
Paylaşım: SMS gönderimi için hizmet sağlayıcı olarak İleti Merkezi/eMarka altyapısına aktarım yapılır. Pazarlama amacıyla kullanılmaz.
Şifreleme: Trafik HTTPS üzerinden iletilir. OTP kodları düz metin saklanmaz.
Silme: Hesap silme talebiyle kullanıcıya bağlı doğrulama ve hesap kayıtları silme akışına dahil edilmelidir; yasal saklama zorunluluğu bulunan sınırlı kayıtlar hariçtir.

## Play Console Data Safety seçim notu

- Personal info: Phone number seçilmeli.
- App activity veya App info/performance altında OTP güvenlik logları kullanılıyorsa ilgili tanım kontrol edilmeli.
- Data is encrypted in transit: Evet.
- Users can request data deletion: Evet.
- Shared with third party/service provider: SMS sağlayıcısı için hizmet sağlayıcı aktarımı açıklanmalı.
