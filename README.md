> Aktif sürüm: DraBornGo v0.0.6 • Android versionCode 6 • Expo SDK 57 • Termux proje yolu: `~/projects/DraBornGo`

# DraBornGo

DraBornGo is an Expo + Supabase mobile application focused on courier, package delivery, service-network orders, live route tracking, support, account privacy, and admin operations.

## Active source rule

Only this local source is active for mobile development:

- `~/projects/DraBornGo`

The production app name and store-facing brand is **DraBornGo**.

For every version upgrade, the current GitHub `main` state must be preserved first in a dated `backup/...` branch before version, dependency, policy, web or Supabase changes are applied. After changes, local `~/projects/DraBornGo` must be hard-synced to `origin/main` so GitHub and the active local source remain identical.

## Current test mode

- DraBornGo v0.0.6 uses Expo SDK 57.
- Android versionCode is 6.
- Current development/testing is through Expo Go.
- No APK or AAB is produced for this test phase.
- Remote Android push notifications are not expected to work inside Expo Go; a development/release build will be required when that feature is tested later.

## Store safety scope

DraBornGo is prepared for physical service and delivery workflows.

- The TL wallet is for physical service/order flows.
- Points, collection cards, and gamification elements do not represent cash, crypto, investment value, or withdrawable financial value.
- Digital item sales language must not be used in store-facing screens.
- Location is used for address matching, route drawing, courier visibility, and active delivery tracking.
- Background location and foreground-location service permissions are disabled unless a future reviewed feature explicitly requires them.
- Camera is used for QR scanning, package/service photos, profile photos, and receipt/dekont photo upload.
- Broad Android photo/video library permissions are not requested for occasional user-selected media.
- Google Play releases must update only through Google Play; the app must not download or install replacement APK files from the web.
- Account deletion and privacy pages are hosted publicly at draborneagle.com.

## Main modules

- Authentication and profile
- Courier and package operations
- Service network orders
- Live route and map tracking
- Support and moderation
- Admin panels
- Push notification foundation
- Privacy and account deletion flows

## Termux clean sync + Expo Go start

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

rm -rf node_modules .expo
npm install --no-package-lock
npx expo-doctor@latest
npm run dkd:verify-v0.0.6
npm run dkd:play-risk-scan

git fetch origin --prune
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" && test -z "$(git status --porcelain)" && echo "DKD OK: Lokal repo GitHub main ile birebir eşit."

npm run dkd:start:go
```

Expo SDK 57 için Node.js sürümü en az 22.13.x olmalıdır. `node -v` daha düşük bir sürüm gösteriyorsa Termux paketlerini güncellemeden projeyi başlatmayın.

## Required environment variables

Public/mobile runtime configuration is restored by the project scripts. Never commit service-role keys, database passwords, signing credentials, private tokens or other server secrets.

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=YOUR_PUBLIC_MAPBOX_TOKEN
```

## Repo hygiene rules

- Keep only one current source base.
- Do not commit `node_modules/`, APK/AAB files, build outputs, secrets, or local environment files.
- Preserve `.github/workflows` but do not run APK/AAB workflows during Expo Go-only test phases.
- Keep SQL files under `supabase/` and apply production DDL through tracked migrations.
- Use `dkd_` / `dkd.` naming for new project-owned identifiers.
- Do not run `expo install --fix` casually after the repo has been synchronized; dependency changes must be reviewed and committed first so the local source does not silently diverge from GitHub.

## DKD mağaza güvenliği güncel notu

Kart satış/ilan akışı mağaza sürümünde kapalıdır. Kazanılmış puan dili yalnızca fiziksel hizmet, teslimat ve güvenli vitrin bağlamında kullanılır. Eski marka storage anahtarları dkd_draborngo_* standardına taşınmıştır.

## Web yayın ayrımı

DrabornEagle şirket web sitesi ayrı public repo üzerinden yayınlanır:

- Repo: `DrabornEagle/DrabornEagle_Web`
- Ana site: `https://www.draborneagle.com/`
- DraBornGo ürün alanı: `https://www.draborneagle.com/draborngo/`
- Gizlilik: `https://www.draborneagle.com/draborngo/privacy/`
- Hesap silme: `https://www.draborneagle.com/draborngo/account-deletion/`
- Kullanım şartları: `https://www.draborneagle.com/draborngo/terms/`

The mobile repository remains the source of the app. The public website repository remains the canonical source of the live legal/product pages.
