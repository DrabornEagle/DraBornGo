#!/usr/bin/env bash
set -euo pipefail

DKD_PROJECT_ROOT="${1:-.}"
cd "$DKD_PROJECT_ROOT"

node - <<'NODE'
const app = require('./app.json').expo;
const pkg = require('./package.json');
if (app.version !== '0.0.7') throw new Error(`Unexpected Expo version: ${app.version}`);
if (app.android?.versionCode !== 7) throw new Error(`Unexpected Android versionCode: ${app.android?.versionCode}`);
if (pkg.version !== '0.0.7') throw new Error(`Unexpected package version: ${pkg.version}`);
console.log('DraBornGo release identity: v0.0.7 / Android versionCode 7');
NODE

npx expo-doctor@latest
npx expo export --platform android --output-dir /tmp/dkd-play-source-audit

echo "Privacy: https://www.draborneagle.com/draborngo/privacy/"
echo "Terms: https://www.draborneagle.com/draborngo/terms/"
echo "Community: https://www.draborneagle.com/draborngo/community/"
echo "Account deletion: https://www.draborneagle.com/draborngo/account-deletion/"
echo "DraBornGo source audit completed. No APK or AAB was produced."
