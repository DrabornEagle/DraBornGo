# DraBornGo v0.0.3 Web / Privacy / Data Safety Notu

Bu not DrabornEagle_Web reposunda DraBornGo gizlilik politikası, hesap silme ve Data Safety açıklamalarına eklenmesi gereken v0.0.3 değişikliklerini özetler.

## Yeni / güncellenen veri kullanımı

- Telefon numarası: İleti Merkezi SMS OTP doğrulaması için kullanılır.
- SMS doğrulama kayıtları: Kod düz metin saklanmaz; telefon ve kod hash kayıtları süreli olarak tutulur.
- Sipariş durum bildirimleri: Kurye görevi kabul etti, teslim aldı ve teslim etti olaylarında müşterinin aktif Expo push token kayıtlarına bildirim gönderilir.
- Sipariş kimliği / kurye iş kimliği: Bildirim yönlendirmesi ve sipariş takibi için push payload içinde kullanılır.

## Kullanım amacı

- Uygulama işlevselliği
- Hesap güvenliği ve doğrulama
- Sipariş / teslimat takibi
- Dolandırıcılık ve kötüye kullanım önleme

## Üçüncü taraf servisler

- İleti Merkezi: SMS OTP gönderimi için telefon numarası ve işlem mesajı kullanılır.
- Expo Push Service: Uygulama içi sipariş durumu bildirimlerini göndermek için push token ve bildirim payload bilgisi kullanılır.

## Google Play Data Safety önerisi

- Personal info → Phone number: Toplanır.
- App activity / App interactions veya App info and performance alanı, mevcut uygulama formuna göre bildirim ve sipariş durumları için değerlendirilmeli.
- Amaçlar: App functionality, Account management, Security/fraud prevention.
- Veri aktarımı: HTTPS/Edge Function üzerinden yapılır.
- Kullanıcı silme: Hesap silme talebiyle ilişkili profil, sipariş, cüzdan, başvuru ve uygulama kayıtları silme akışına dahil edilir.

## Uygulama içi metin önerisi

DraBornGo, telefon numaranı yalnızca SMS doğrulama, hesap güvenliği, sipariş bildirimleri ve teslimat takibi amacıyla kullanır. SMS kodları düz metin saklanmaz; doğrulama kayıtları hash ve süreli işlem kaydı olarak tutulur.
