# DraBornGo

DraBornGo is an Expo + Supabase mobile application focused on courier, package delivery, service-network orders, live route tracking, support, account privacy, and admin operations.

## Active source rule

Only this local source is active for mobile development:

- `projects/DraBornGo`

The production app name and store-facing brand is **DraBornGo**.

## Store safety scope

DraBornGo is prepared for physical service and delivery workflows.

- The TL wallet is for physical service/order flows.
- Points, collection cards, and gamification elements do not represent cash, crypto, investment value, or withdrawable financial value.
- Digital item sales language must not be used in store-facing screens.
- Location is used for address matching, route drawing, courier visibility, and active delivery tracking.
- Camera is used for QR scanning, package/service photos, profile photos, and receipt/dekont photo upload.
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

## Termux quick start

```bash
termux-setup-storage
pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git unzip ripgrep
mkdir -p ~/projects
cd ~/projects/DraBornGo
npm install --legacy-peer-deps
npx expo install --fix
npx expo start -c --go --lan
```

## Required environment variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Repo hygiene rules

- Keep only one current source base.
- Do not commit `node_modules/`, APK/AAB files, build outputs, secrets, or local environment files.
- Preserve `.github/workflows`.
- Keep SQL files under `supabase/`.
- Use `dkd_` / `dkd.` naming for new project-owned identifiers.


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

Bu DraBornGo mobil repo private kalır ve web yayını buradan yapılmaz.
