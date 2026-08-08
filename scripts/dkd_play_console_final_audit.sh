#!/usr/bin/env bash
set -euo pipefail

DKD_PROJECT_ROOT="${1:-.}"
cd "$DKD_PROJECT_ROOT"

node - <<'NODE'
const app = require('./app.json').expo;
const pkg = require('./package.json');
const expectedPermissions = [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.CAMERA',
].sort();
const actualPermissions = [...(app.android?.permissions || [])].sort();
if (app.version !== '0.0.9') throw new Error(`Unexpected Expo version: ${app.version}`);
if (app.android?.versionCode !== 9) throw new Error(`Unexpected Android versionCode: ${app.android?.versionCode}`);
if (pkg.version !== '0.0.9') throw new Error(`Unexpected package version: ${pkg.version}`);
if (JSON.stringify(actualPermissions) !== JSON.stringify(expectedPermissions)) throw new Error(`Unexpected Android permission set: ${actualPermissions.join(', ')}`);
console.log('DraBornGo release identity: v0.0.9 / Android versionCode 9');
console.log('Android permission set: foreground location + camera only');
NODE

npm run dkd:verify-v0.0.9
npm run dkd:play-risk-scan
npx expo-doctor@latest

DKD_AUDIT_ROOT="${TMPDIR:-${HOME:-$PWD}/.cache/draborngo}"
DKD_SOURCE_AUDIT_DIR="${DKD_AUDIT_ROOT}/dkd-play-source-audit"
DKD_WEB_AUDIT_DIR="${DKD_AUDIT_ROOT}/dkd-play-web-audit"
mkdir -p "$DKD_AUDIT_ROOT"
rm -rf "$DKD_SOURCE_AUDIT_DIR" "$DKD_WEB_AUDIT_DIR"

npx expo export --platform android --output-dir "$DKD_SOURCE_AUDIT_DIR"
npx expo export --platform web --output-dir "$DKD_WEB_AUDIT_DIR"

echo "Privacy: https://www.draborneagle.com/draborngo/privacy/"
echo "Terms: https://www.draborneagle.com/draborngo/terms/"
echo "Community: https://www.draborneagle.com/draborngo/community/"
echo "Account deletion: https://www.draborneagle.com/draborngo/account-deletion/"
echo "DraBornGo v0.0.9 source + web audit completed. No APK or AAB was produced."
