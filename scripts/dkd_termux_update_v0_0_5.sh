#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

dkd_project_root="$HOME/Projects"
dkd_target_path="$dkd_project_root/DraBornGo"
dkd_legacy_path="$dkd_project_root/Lootonia"
dkd_download_path="$HOME/storage/downloads"
dkd_timestamp_value="$(date +%Y%m%d_%H%M%S)"
dkd_backup_file="$dkd_download_path/DKD_DraBornGo_SourceCode_v0.0.4_${dkd_timestamp_value}.zip"
dkd_latest_backup_file="$dkd_download_path/DKD_DraBornGo_SourceCode.zip"

pkg update -y
pkg install -y git nodejs-lts zip unzip
termux-setup-storage >/dev/null 2>&1 || true
mkdir -p "$dkd_project_root" "$dkd_download_path"

if [ -d "$dkd_target_path" ]; then
  cd "$dkd_target_path"
  rm -f "$dkd_latest_backup_file"
  zip -qr "$dkd_backup_file" . -x '.git/*' 'node_modules/*' '.expo/*' 'dist/*' '.dkd-export-check/*'
  cp -f "$dkd_backup_file" "$dkd_latest_backup_file"
elif [ -d "$dkd_legacy_path" ]; then
  mv "$dkd_legacy_path" "$dkd_target_path"
fi

if [ ! -d "$dkd_target_path/.git" ]; then
  rm -rf "$dkd_target_path"
  git clone https://github.com/DrabornEagle/DraBornGo.git "$dkd_target_path"
fi

cd "$dkd_target_path"
git remote set-url origin https://github.com/DrabornEagle/DraBornGo.git
git fetch origin main
git reset --hard origin/main
git clean -fd -e .env -e .env.local -e .env.production
npm install
npm run env:restore
npm run dkd:verify-v0.0.5
npx expo start -c
