> Aktif sürüm: DraBornGo v0.0.8 • Android versionCode 8 • Expo SDK 57 • Termux proje yolu: `~/projects/DraBornGo`

# DraBornGo

DraBornGo is an Expo + Supabase mobile application focused on courier, package delivery, service-network orders, live route tracking, account privacy, moderation, and admin operations.

## Active source rule

Only this local source is active for mobile development:

- `~/projects/DraBornGo`

The production app name and store-facing brand is **DraBornGo**.

For every version upgrade, the current GitHub `main` state must be preserved first in a dated `backup/pre-vX.Y.Z-YYYYMMDD-HHMM` branch before version, dependency, policy, web or Supabase changes are applied. After changes, local `~/projects/DraBornGo` must be hard-synced to `origin/main` so GitHub and the active local source remain identical.

Current v0.0.7 rollback branch:

- `backup/pre-v0.0.8-20260808-1608`

## Current test mode

- DraBornGo v0.0.8 uses Expo SDK 57.
- Android versionCode is 8.
- Current development/testing is through Expo Go.
- No APK or AAB is produced for this test phase.
- Remote Android push notifications are not expected to work inside Expo Go; a development/release build will be required only when that feature is intentionally tested later.

## v0.0.8 UI baseline

- Login screen visual design is preserved.
- Home screen is rebuilt as a modern courier control center with stronger color hierarchy, courier/logistics icons, animated entry, live-status pulse, floating ambience and animated emphasis.
- Home Support Panel is removed completely from the Home screen.
- Courier Operations, Service Network, Applications, Chat, Profile and full menu access are emphasized with modern action cards.
- Shared app theme tokens are refreshed so courier, logistics, profile, application and related modules use the new visual language without redesigning Login.

## Store safety scope

DraBornGo is prepared for physical service and delivery workflows.

- Digital item sales language must not be used in store-facing screens.
- Location is used for address matching, route drawing, courier visibility and active delivery tracking.
- Background location and foreground-location service permissions are disabled unless a future reviewed feature explicitly requires them.
- Camera is used only for user-initiated package/service, profile, application or related photo flows.
- Microphone, broad Android photo/video library, package-install, overlay and background-location permissions are not part of the v0.0.8 safe permission set.
- Google Play releases must update only through Google Play; the app must not download or install replacement APK files from the web.
- Account deletion is available inside the app and through the public account-deletion web resource.

## Main modules

- Authentication and profile
- Courier and package operations
- Service network orders
- Live route and map tracking
- Moderation and safe communication
- Admin panels
- Push notification foundation
- Privacy and account deletion flows

## Termux hard sync + audit + Expo Go start

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
npm run dkd:verify-v0.0.8
npm run dkd:play-risk-scan
npm run play:final-audit

git fetch origin --prune
git reset --hard origin/main
git clean -fd
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" && test -z "$(git status --porcelain)" && echo "DKD OK: Lokal repo GitHub main ile birebir eşit."

npm run dkd:start:go
```

Expo SDK 57 için Node.js sürümü en az 22.13.x olmalıdır. `node -v` daha düşük bir sürüm gösteriyorsa Termux paketlerini güncellemeden projeyi başlatmayın.

## Full rollback to pre-v0.0.8

This intentionally rewrites GitHub `main` back to the exact backup state. Use only for a full rollback.

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
- Do not commit `node_modules/`, APK/AAB files, build outputs, secrets or local environment files.
- Preserve `.github/workflows` but do not run APK/AAB workflows during Expo Go-only test phases.
- Keep SQL files under `supabase/` and apply production DDL through tracked migrations.
- Use `dkd_` / `dkd.` naming for new project-owned identifiers.
- Do not run `expo install --fix` casually after the repo has been synchronized; dependency changes must be reviewed and committed first so the local source does not silently diverge from GitHub.

## Web publication separation

DrabornEagle company web pages are published from the separate public repository:

- Repo: `DrabornEagle/DrabornEagle_Web`
- Main site: `https://www.draborneagle.com/`
- DraBornGo product center: `https://www.draborneagle.com/draborngo/`
- Privacy: `https://www.draborneagle.com/draborngo/privacy/`
- Account deletion: `https://www.draborneagle.com/draborngo/account-deletion/`
- Terms: `https://www.draborneagle.com/draborngo/terms/`
- Community rules: `https://www.draborneagle.com/draborngo/community/`

The mobile repository remains the source of the app. `DrabornEagle/DrabornEagle_Web` remains the canonical source of live legal and product pages. Its pre-v0.0.8 backup branch is `backup/draborngo-pre-v0.0.8-20260808-1608`.
