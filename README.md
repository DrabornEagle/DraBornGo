# DraBornGo

DraBornGo, kurye ve şehir hizmet operasyonlarını tek mobil merkezde birleştiren Expo + Supabase uygulamasıdır.

## v0.0.6 test kimliği
- Expo SDK 57
- React Native 0.86
- React 19.2.3
- Android versionCode 3
- Test kanalı: Expo Go
- Bu aşamada APK/AAB üretimi yapılmaz.

## Aktif çekirdek
- E-posta/şifre ile hesap ve profil
- Kurye çevrimiçi durumu ve atanmış teslimatlar
- Hizmet ağı işletme/katalog görüntüleme
- Başvuru takibi
- DBG sohbet
- Gizlilik, hesap/veri silme ve yönetim operasyonları

## İzin yaklaşımı
Konum izni yalnızca kullanıcı konum gerektiren işlemi başlattığında ve uygulama görünürken istenir. Arka plan konumu ve gereksiz hassas Android izinleri engellenmiştir.

## Yerel test
```bash
npm install --legacy-peer-deps --package-lock=false
npx expo install --fix
npx expo-doctor
npx expo start --go --tunnel --clear
```
