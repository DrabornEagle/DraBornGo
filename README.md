# DraBornGo

DraBornGo, kurye ve şehir hizmet operasyonlarını tek mobil merkezde birleştiren Expo + Supabase uygulamasıdır.

## v0.0.6 test kimliği
- Expo SDK 57, güncel SDK 57 patch hattı
- React Native 0.86
- React 19.2.3
- Android versionCode 6
- Test kanalı: Expo Go 57.0.2
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

## Temiz Expo Go kurulumu
```bash
npm install --legacy-peer-deps --package-lock=false
npm run dkd:deps:fix
npm run quality:local
npm run dkd:start:go
```

## GitHub ile birebir yerel eşitleme
```bash
cd ~/Projects/DraBornGo
git fetch origin --prune
git checkout main
git reset --hard origin/main
rm -rf node_modules .expo
npm install --legacy-peer-deps --package-lock=false
npm run dkd:deps:fix
npm run quality:local
```

## Her sürümden önce yedek
```bash
cd ~/Projects/DraBornGo
git fetch origin --prune
git checkout main
git pull --ff-only
DKD_BACKUP="backup/v$(node -p "require('./package.json').version")-$(date +%Y%m%d-%H%M)"
git branch "$DKD_BACKUP"
git push origin "$DKD_BACKUP"
echo "$DKD_BACKUP"
```

## Bir yedek dala yerel geri dönüş
```bash
cd ~/Projects/DraBornGo
git fetch origin --prune
git checkout main
git reset --hard origin/YEDEK_DAL_ADI
rm -rf node_modules .expo
npm install --legacy-peer-deps --package-lock=false
npm run dkd:deps:fix
npm run quality:local
```
