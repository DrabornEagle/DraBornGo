# DraBornGo

> Aktif sürüm: **v0.0.6** • Android versionCode **6** • Expo SDK **57** • Aktif lokal repo: `~/projects/DraBornGo`

DraBornGo; kurye, paket teslimatı, hizmet ağı siparişleri, canlı rota takibi, destek, hesap gizliliği ve admin operasyonlarına odaklanan Expo + Supabase mobil uygulamasıdır.

## Aktif kaynak kuralı

Mobil geliştirmede tek aktif lokal kaynak:

- `~/projects/DraBornGo`

GitHub `main` ve bu lokal repo her sürüm değişikliğinden sonra birebir eşit tutulur. Yeni sürüme geçmeden önce mevcut çalışan `main`, tarihli `backup/...` dalında korunur.

## v0.0.6 test düzeni

- Expo SDK 57 kullanılır.
- Android versionCode 6'dır.
- Test Expo Go üzerinden yapılır.
- Bu aşamada APK veya AAB üretilmez.
- Login, Ana Sayfa ve genel kullanıcı arayüzü sürüm/politika güncellemeleri nedeniyle yeniden tasarlanmaz.
- Android Expo Go içinde uzaktan push bildirimi development/release build gerektirir; bu özellik APK/AAB aşamasında ayrıca doğrulanacaktır.

## Google Play güvenlik kapsamı

- TL cüzdanı fiziksel hizmet/sipariş akışları içindir.
- Konum; adres eşleştirme, rota çizimi, kurye görünürlüğü ve aktif teslimat takibi için kullanılır.
- Arka plan konumu ve foreground location service izni etkin değildir.
- Kamera; QR, paket/hizmet/profil/dekont görselleri için kullanılır.
- Ara sıra görsel seçimi için geniş `READ_MEDIA_IMAGES/READ_MEDIA_VIDEO` izinleri istenmez.
- Google Play dağıtımındaki uygulama webden APK indirip kendini güncellemez; güncellemeler yalnız Google Play üzerinden yapılır.
- Hesap silme ve gizlilik sayfaları public olarak draborneagle.com altında yayınlanır.

## Termux temiz eşitleme + Expo Go başlatma

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
npx expo-doctor@latest
npm run dkd:verify-v0.0.6
npm run dkd:play-risk-scan

git fetch origin --prune
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" && test -z "$(git status --porcelain)" && echo "DKD OK: Lokal repo GitHub main ile birebir eşit."

npm run dkd:start:go
```

Expo SDK 57 için Node.js en az 22.13.x olmalıdır. `node -v` daha düşük gösteriyorsa Termux paketlerini güncellemeden projeyi başlatmayın.

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
- `.github/workflows` korunur; Expo Go test döneminde build workflow'ları çalıştırılmaz.
- SQL değişiklikleri `supabase/migrations/` altında izlenir ve canlı Supabase'e migration olarak uygulanır.
- Yeni proje kimliklerinde `dkd_` / `dkd.` standardı kullanılır.
- GitHub ile eşitleme sonrasında `npx expo install --fix` rastgele çalıştırılmaz; bağımlılık değişikliği önce gözden geçirilip GitHub'a yazılmalıdır.

## Web yayın ayrımı

Canlı şirket sitesi ayrı repodan yayınlanır:

- `DrabornEagle/DrabornEagle_Web`
- DraBornGo ürün alanı: `https://www.draborneagle.com/draborngo/`
- Gizlilik: `https://www.draborneagle.com/draborngo/privacy/`
- Hesap silme: `https://www.draborneagle.com/draborngo/account-deletion/`
- Kullanım şartları: `https://www.draborneagle.com/draborngo/terms/`
