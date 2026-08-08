#!/usr/bin/env bash
set -euo pipefail

dkd_project_root_value="${1:-.}"
cd "$dkd_project_root_value"

dkd_risk_pattern="$(node <<'NODE'
function dkd_join_value(dkd_parts_value) {
  return dkd_parts_value.join('_');
}
const dkd_terms_value = [
  dkd_join_value(['RECORD', 'AUDIO']),
  dkd_join_value(['ACCESS', 'BACKGROUND', 'LOCATION']),
  dkd_join_value(['READ', 'EXTERNAL', 'STORAGE']),
  dkd_join_value(['WRITE', 'EXTERNAL', 'STORAGE']),
  dkd_join_value(['READ', 'MEDIA', 'IMAGES']),
  dkd_join_value(['READ', 'MEDIA', 'VIDEO']),
  dkd_join_value(['READ', 'MEDIA', 'VISUAL', 'USER', 'SELECTED']),
  dkd_join_value(['MANAGE', 'EXTERNAL', 'STORAGE']),
  dkd_join_value(['QUERY', 'ALL', 'PACKAGES']),
  dkd_join_value(['REQUEST', 'INSTALL', 'PACKAGES']),
  dkd_join_value(['SYSTEM', 'ALERT', 'WINDOW']),
  dkd_join_value(['USE', 'FULL', 'SCREEN', 'INTENT']),
  ['com', 'google', 'android', 'gms', 'permission', 'AD_ID'].join('\\.')
];
console.log(dkd_terms_value.join('|'));
NODE
)"

if [ ! -f "./node_modules/expo/bin/cli" ]; then
  echo "HATA: node_modules/expo yok. Önce npm install --legacy-peer-deps çalıştır."
  exit 1
fi

node ./node_modules/expo/bin/cli config --type public --json > dkd_expo_cli_public_config_verify.json

if grep -E "$dkd_risk_pattern" dkd_expo_cli_public_config_verify.json >/dev/null 2>&1; then
  echo "HATA: Expo CLI public config içinde riskli izin kalıntısı bulundu."
  grep -Eo "$dkd_risk_pattern" dkd_expo_cli_public_config_verify.json | sort -u
  exit 1
fi

echo "TAMAM: Expo CLI public config riskli izin açısından temiz."
