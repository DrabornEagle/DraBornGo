#!/usr/bin/env bash
set -euo pipefail

dkd_project_root_value="${1:-.}"
cd "$dkd_project_root_value"

dkd_report_dir_value="dkd_play_console_audit_logs"
dkd_report_file_value="$dkd_report_dir_value/dkd_play_console_final_audit_report.txt"
mkdir -p "$dkd_report_dir_value"

{
  echo "DraBornGo Google Play final audit"
  echo "Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo "Project: $(pwd)"
  echo
  echo "== App version =="
  node -e "const fs=require('fs'); const dkd_app_value=JSON.parse(fs.readFileSync('app.json','utf8')).expo; console.log(dkd_app_value.version); console.log(dkd_app_value.android && dkd_app_value.android.versionCode);"
  echo
  echo "== Blocked permissions in app.json =="
  node -e "const fs=require('fs'); const dkd_app_value=JSON.parse(fs.readFileSync('app.json','utf8')).expo; console.log((dkd_app_value.android && dkd_app_value.android.blockedPermissions || []).join('\n'));"
  echo
  echo "== Foreground location permission check =="
  node -e "const fs=require('fs'); const dkd_app_value=JSON.parse(fs.readFileSync('app.json','utf8')).expo; const dkd_permissions_value=(dkd_app_value.android && dkd_app_value.android.permissions || []); const dkd_blocked_value=['android','permission'].join('.')+'.'+['FOREGROUND','SERVICE','LOCATION'].join('_'); if(dkd_permissions_value.includes(dkd_blocked_value)){ console.error('HATA: Android foreground service location izni app.json içinde kalmış.'); process.exit(1); } console.log('OK: Android foreground service location izni app.json içinde yok.');"
  echo
  echo "== Risky source/app config permission strings =="
  rg -n "READ_MEDIA_IMAGES|READ_MEDIA_VIDEO|READ_MEDIA_VISUAL_USER_SELECTED|READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE|QUERY_ALL_PACKAGES|REQUEST_INSTALL_PACKAGES|MANAGE_EXTERNAL_STORAGE|USE_FULL_SCREEN_INTENT" app.json package.json package-lock.json src supabase || true
  echo
  echo "== Broad gallery permission requests in source =="
  rg -n "requestMediaLibraryPermissionsAsync|READ_MEDIA_IMAGES|READ_MEDIA_VIDEO" src package.json package-lock.json || true

  echo
  echo "== DKD dependency manifest cleaner verification =="
  node ./scripts/dkd_clean_android_dependency_manifests.js
  node ./scripts/dkd_play_risk_scan.js

  echo
  echo "== Public policy URLs =="
  rg -n "https://www.draborneagle.com/draborngo/privacy/|https://www.draborneagle.com/draborngo/account-deletion/|https://www.draborneagle.com/draborngo/terms/|docs.google.com/document/.*/edit|DESTEK_EPOSTASI_EKLE" app.json src store_assets store_assets/google_play supabase README* || true
  echo
  echo "== Active source old billing RPC call scan =="
  rg -n "dkd_market_token_shop_buy|dkd_business_product_buy_with_token|dkd_business_product_buy_with_token_dkd" src || true
  echo
  echo "== Active source user-facing billing wording risk scan =="
  rg -n "Satın al\"|>Satın al<|Satın alındı|Puan Market|token shop|Puan bilgisi|PUAN BİLGİSİ|100 Puan|Radar Nakit|Hızlı token|token takviyesi|extra token" src store_assets/google_play || true
  echo
  echo "== Google Play Billing scope language =="
  rg -n "fiziksel hizmet|dijital ürün|oyun içi avantaj|puan satın|gerçek para|TL cüzdan" src store_assets store_assets/google_play supabase/sql supabase/migrations || true
  echo
  echo "== Wallet to digital advantage risk scan =="
  rg -n -i "wallet_tl.*(token|puan|shard|boss|energy|enerji|card|kart|chest|sandık|sandik)|token.*wallet_tl|puan.*wallet_tl|TL.*puan|puan.*TL|TOKEN.*TL|TL.*TOKEN|100 Puan|10 TL|cüzdan.*kart|cüzdan.*sandık|cüzdan.*enerji" src store_assets/google_play supabase/sql supabase/migrations || true
  echo
  echo "== Legacy migration old billing residue scan =="
  dkd_legacy_scan_files_value=$(find supabase/migrations supabase/sql -type f \( -name '*.sql' -o -name '*.md' \) 2>/dev/null | grep -v '20260515_dkd_google_play_point_redeem_direct_v0_216.sql' | grep -v '20260515_dkd_google_play_point_redeem_direct_v0_217.sql' || true)
  if [ -n "$dkd_legacy_scan_files_value" ]; then
    printf '%s\n' "$dkd_legacy_scan_files_value" | xargs rg -n "dkd_market_token_shop_buy|dkd_business_product_buy_with_token|paid_token|spent_token|price_token|buy_with_token" || true
  fi
  echo
  echo "== Social safety moderation controls =="
  rg -n "dkd_social_block_user|dkd_social_report_user|dkd_social_admin_moderation_queue|Şikayet et|Engelle|Moderasyon Kuyruğu" src supabase || true
  echo
  echo "== Terms acceptance gate =="
  rg -n "dkd_terms_accepted|dkd_terms_version|dkd_community_policy_version|Kullanım Şartları|Topluluk Kuralları" src store_assets/google_play store_assets supabase || true
} | tee "$dkd_report_file_value"

echo "Audit report saved: $dkd_report_file_value"
