# DraBornGo

DraBornGo, kurye ve şehir hizmet operasyonlarını tek mobil merkezde birleştiren Expo + Supabase uygulamasıdır.

## v0.0.6 test kimliği
- Uygulama sürümü: `0.0.6`
- Android `versionCode`: `6`
- Paket: `com.draborneagle.draborngo`
- Expo SDK: `57` (`expo ~57.0.8`)
- React Native: `0.86.2`
- React: `19.2.3`
- Node.js: `>=22.13.0`
- Test kanalı: Expo Go `57.0.2`
- Bu aşamada APK/AAB veya Google Play dağıtım paketi üretilmez.

Expo SDK 57 Android API 36 hedef hattındadır. Store paketi üretmeye geçildiğinde Google Play güncel hedef API ve Data Safety beyanı ayrıca son kez doğrulanmalıdır.

## Aktif çekirdek
- E-posta/şifre ile hesap ve profil
- Kurye çevrimiçi durumu ve atanmış teslimatlar
- Hizmet ağı işletme/katalog görüntüleme
- Başvuru takibi
- DBG sohbet
- Gizlilik, hesap/veri silme ve yönetim operasyonları

## İzin yaklaşımı
Konum izni yalnızca kullanıcı konum gerektiren işlemi başlattığında ve uygulama görünürken istenir. Arka plan konumu, mikrofon, geniş medya erişimi, paket kurma, tüm paketleri sorgulama ve full-screen intent gibi mevcut v0.0.6 için gereksiz hassas Android izinleri engellenmiştir.

## Termux: ilk kurulum + GitHub → `~/projects/DraBornGo`
```bash
pkg update -y
pkg install -y git nodejs-lts

node -e "const v=process.versions.node.split('.').map(Number); if(v[0]<22 || (v[0]===22 && v[1]<13)){console.error('Node.js 22.13.0 veya üstü gerekli. Mevcut: '+process.versions.node); process.exit(1)}"

mkdir -p ~/projects
cd ~/projects

if [ ! -d DraBornGo/.git ]; then
  git clone -b main https://github.com/DrabornEagle/DraBornGo.git DraBornGo
fi

cd ~/projects/DraBornGo
git fetch origin --prune
git checkout main
git reset --hard origin/main
git clean -fd
rm -rf node_modules .expo
npm install --legacy-peer-deps --package-lock=false
npm run quality:local
npm run dkd:start:go
```

## Sonraki güncellemelerde GitHub → lokal birebir eşitleme
Normal eşitlemede `npm run dkd:deps:fix` kullanılmaz. `--fix` bağımlılık manifestini değiştirebildiği için yalnızca bilinçli sürüm bakımında çalıştırılır ve oluşan değişiklik GitHub'a commit edilir.

```bash
cd ~/projects/DraBornGo
git fetch origin --prune
git checkout main
git reset --hard origin/main
git clean -fd
rm -rf node_modules .expo
npm install --legacy-peer-deps --package-lock=false
npm run quality:local
npm run dkd:start:go
```

Kaynak eşitliği kontrolü:
```bash
cd ~/projects/DraBornGo
git fetch origin
git status --short
git rev-parse HEAD
git rev-parse origin/main
```
`git status --short` boş ve iki SHA aynıysa takip edilen proje dosyaları GitHub `main` ile eşittir.

## Her sürüm yükseltmesinden ÖNCE GitHub yedeği
Önce mevcut çalışan `main` sürümü uzak GitHub yedeğine alınır; sonra yeni sürüm değişikliklerine geçilir.

```bash
cd ~/projects/DraBornGo
git fetch origin --prune
git checkout main
git reset --hard origin/main
DKD_PREVIOUS_VERSION="$(node -p "require('./package.json').version")"
DKD_BACKUP="backup/v${DKD_PREVIOUS_VERSION}-final-$(date +%Y%m%d-%H%M)"
git push origin "HEAD:refs/heads/${DKD_BACKUP}"
echo "GitHub yedeği: ${DKD_BACKUP}"
```

v0.0.6 öncesi kanonik geri dönüş yedeği:
```text
backup/v0.0.5-final-20260808
```

## v0.0.5'e yerel geri dönüş
```bash
cd ~/projects/DraBornGo
git fetch origin --prune
git checkout main
git reset --hard origin/backup/v0.0.5-final-20260808
rm -rf node_modules .expo
npm install --legacy-peer-deps --package-lock=false
npm run quality:local
```

## v0.0.5'i GitHub `main` olarak tamamen geri yükleme
Bu komut yalnızca gerçekten kalıcı rollback istendiğinde kullanılır:
```bash
cd ~/projects/DraBornGo
git fetch origin --prune
git checkout main
git reset --hard origin/backup/v0.0.5-final-20260808
git push --force-with-lease origin HEAD:main
```

## Sürüm yükseltme kuralı
Her yeni sürümde sıralama sabittir:
1. Mevcut `main` GitHub backup dalına alınır.
2. `package.json` sürümü güncellenir.
3. `app.json` sürümü ve Android `versionCode` birlikte yükseltilir.
4. Expo uyumluluk kontrolü ve `expo-doctor` çalıştırılır.
5. Google Play izin/veri politikası ve web gizlilik + hesap silme sayfaları yeniden gözden geçirilir.
6. Değişiklikler GitHub `main` ve gerekli Supabase migration/Edge Function yapılarına uygulanır.
7. Termux'ta `origin/main` → `~/projects/DraBornGo` hard-sync yapılır.
8. `git status` ve SHA karşılaştırmasıyla GitHub/lokal eşitliği doğrulanır.
