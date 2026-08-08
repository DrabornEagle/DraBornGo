# DraBornGo

> Aktif sürüm: **v0.0.8** • Android versionCode **8** • Expo SDK **57** • Aktif lokal repo: `~/projects/DraBornGo`

DraBornGo; kurye, paket teslimatı, hizmet ağı siparişleri, canlı rota takibi, güvenli kullanıcı iletişimi, hesap gizliliği ve admin operasyonlarına odaklanan Expo + Supabase mobil uygulamasıdır.

## Aktif kaynak kuralı

Mobil geliştirmede tek aktif lokal kaynak:

- `~/projects/DraBornGo`

GitHub `main` ve bu lokal repo her sürüm değişikliğinden sonra birebir eşit tutulur. Her yeni sürümden önce çalışan `main`, `backup/pre-vX.Y.Z-YYYYMMDD-HHMM` biçimindeki tarihli bir dalda korunur.

v0.0.8 öncesi tam geri dönüş dalı:

- `backup/pre-v0.0.8-20260808-1608`

## v0.0.8 test düzeni

- Expo SDK 57 kullanılır.
- Android versionCode 8'dir.
- Test Expo Go üzerinden yapılır.
- Bu aşamada APK veya AAB üretilmez.
- Login ekranının tasarımı korunmuştur.
- Ana Sayfa kurye kontrol merkezi mantığıyla sıfırdan modern, renkli ve animasyonlu olarak yenilenmiştir.
- Ana Sayfadaki Destek Paneli tamamen kaldırılmıştır.
- Ortak tema; kurye, lojistik, profil, başvurular ve ilişkili mevcut modüllerde yeni görsel dili kullanır.
- Android Expo Go içinde uzaktan push bildirimi development/release build gerektirir; bu özellik ancak ilgili build aşaması bilinçli olarak başlatıldığında ayrıca doğrulanacaktır.

## Google Play güvenlik kapsamı

- Konum; adres eşleştirme, rota çizimi, kurye görünürlüğü ve aktif teslimat takibi için yalnız uygulama açıkken kullanılır.
- Arka plan konumu ve foreground location service izni etkin değildir.
- Kamera yalnız kullanıcının başlattığı paket/hizmet/profil/başvuru görseli işlemleri için kullanılır.
- Mikrofon, geniş medya/depolama, uygulama kurma, overlay ve arka plan konum izinleri v0.0.8 güvenli izin setinde yoktur.
- Google Play dağıtımındaki uygulama webden APK indirip kendini güncellemez; üretim güncellemeleri yalnız Google Play üzerinden yapılır.
- Hesap silme uygulama içinden ve public web kaynağı üzerinden başlatılabilir.
- Supabase hesap silme RPC'lerinde anonim çalıştırma yetkisi kaldırılmış, erişim authenticated/service_role ile sınırlandırılmıştır.

## Termux temiz eşitleme + denetim + Expo Go başlatma

```bash
termux-setup-storage
pkg update -y && pkg upgrade -y
pkg install -y git nodejs-lts

mkdir -p ~/projects
if [ -d ~/projects/DraBornGo/.git ]; then
  cd ~/projects/DraBornGo
  git fetch origin --prune
  git checkout main
  git reset --hard origin/main
  git clean -fd
else
  cd ~/projects
  git clone https://github.com/DrabornEagle/DraBornGo.git DraBornGo
  cd DraBornGo
fi

node -v
rm -rf node_modules .expo
npm install --no-package-lock
npm run dkd:verify-v0.0.8
npm run dkd:play-risk-scan
npm run play:final-audit

git fetch origin --prune
git reset --hard origin/main
git clean -fd
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" && test -z "$(git status --porcelain)" && echo "DKD OK: Lokal repo GitHub main ile birebir eşit."

npm run dkd:start:go
```

Expo SDK 57 için Node.js en az 22.13.x olmalıdır. `node -v` daha düşük gösteriyorsa Termux paketlerini güncellemeden projeyi başlatmayın.

## Tam v0.0.7 geri alma

Aşağıdaki komut GitHub `main` dalını v0.0.8 öncesi yedeğe geri yazar. Yalnız tam rollback gerektiğinde kullanılmalıdır.

```bash
cd ~/projects/DraBornGo || exit 1
git fetch origin --prune
git checkout main
git reset --hard origin/backup/pre-v0.0.8-20260808-1608
git push --force-with-lease origin main
git fetch origin --prune
git reset --hard origin/main
git clean -fd
rm -rf node_modules .expo
npm install --no-package-lock
npm run dkd:start:go
```

## Ortam değişkenleri

Public mobil çalışma zamanı yapılandırması proje scriptleri tarafından geri yüklenir. Service-role anahtarları, veritabanı parolaları, signing bilgileri veya özel tokenlar repoya commit edilmez.

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=YOUR_PUBLIC_MAPBOX_TOKEN
```

## Repo kuralları

- Tek güncel kaynak kullanılır.
- `node_modules/`, APK/AAB, build çıktıları, secret dosyaları ve lokal `.env` dosyaları commit edilmez.
- `.github/workflows` korunur; Expo Go test döneminde APK/AAB build workflow'ları çalıştırılmaz.
- SQL değişiklikleri `supabase/migrations/` altında izlenir ve canlı Supabase'e migration olarak uygulanır.
- Yeni proje kimliklerinde `dkd_` / `dkd.` standardı kullanılır.
- GitHub ile eşitleme sonrasında `npx expo install --fix` rastgele çalıştırılmaz; bağımlılık değişikliği önce gözden geçirilip GitHub'a yazılmalıdır.

## Web yayın ayrımı

Canlı şirket sitesi ayrı repodan yayınlanır:

- Repo: `DrabornEagle/DrabornEagle_Web`
- DraBornGo ürün alanı: `https://www.draborneagle.com/draborngo/`
- Gizlilik: `https://www.draborneagle.com/draborngo/privacy/`
- Hesap silme: `https://www.draborneagle.com/draborngo/account-deletion/`
- Kullanım şartları: `https://www.draborneagle.com/draborngo/terms/`
- Topluluk kuralları: `https://www.draborneagle.com/draborngo/community/`

Canlı web reposunun v0.0.8 öncesi yedeği: `backup/draborngo-pre-v0.0.8-20260808-1608`.
