# DraBornGo APK Update Center v0.0.4

Bu sürüm, Google Play dışı resmi APK dağıtımı için kullanıcı onaylı güncelleme akışını ekler.

## Eklenenler

- Uygulama açılışta `https://www.draborneagle.com/DraBornGo/App/dkd_draborngo_update_manifest.json` dosyasını kontrol eder.
- Hızlı erişim menüsüne **Sürüm ve Güncelleme Merkezi** eklendi.
- Web yayını için `web/DraBornGo/App/` klasörü hazırlandı.
- Manifest, sürüm notu, SHA-256 alanı ve indirme sayfası hazırlandı.

## Bilinçli olarak eklenmeyenler

- `REQUEST_INSTALL_PACKAGES` izni eklenmedi.
- Sessiz APK kurulumu yapılmadı.
- Google Play’e ileride dönüş için yüksek riskli kurulum izni kullanılmadı.

## APK build sonrası yapılacaklar

1. Yeni APK dosyasını `dkd_draborngo_latest.apk` adıyla yayınla.
2. APK SHA-256 değerini hesapla.
3. `dkd_draborngo_update_manifest.json` içindeki `dkd_sha256` alanını güncelle.
4. `dkd_draborngo_sha256.txt` dosyasını aynı değerle güncelle.

## Sürüm

- Version Name: `0.0.4`
- Version Code: `4`
- Paket adı: `com.draborneagle.draborngo`
