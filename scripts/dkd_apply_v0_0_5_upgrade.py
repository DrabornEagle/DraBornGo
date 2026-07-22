#!/usr/bin/env python3
from pathlib import Path
import json
import re

DKD_ROOT = Path(__file__).resolve().parents[1]
DKD_VERSION_NAME = "0.0.5"
DKD_VERSION_CODE = 5


def dkd_read_text(dkd_path: Path) -> str:
    return dkd_path.read_text(encoding="utf-8")


def dkd_write_text(dkd_path: Path, dkd_text: str) -> None:
    dkd_path.parent.mkdir(parents=True, exist_ok=True)
    dkd_path.write_text(dkd_text, encoding="utf-8")


def dkd_write_json(dkd_path: Path, dkd_data) -> None:
    dkd_write_text(dkd_path, json.dumps(dkd_data, ensure_ascii=False, indent=2) + "\n")


def dkd_update_release_identity() -> None:
    dkd_package_path = DKD_ROOT / "package.json"
    dkd_package = json.loads(dkd_read_text(dkd_package_path))
    dkd_package["name"] = "draborngo"
    dkd_package["version"] = DKD_VERSION_NAME
    dkd_scripts = dkd_package.setdefault("scripts", {})
    dkd_scripts["postinstall"] = "node ./scripts/dkd_restore_public_env.mjs && node ./scripts/dkd_clean_android_dependency_manifests.js"
    dkd_scripts["preandroid"] = "npm run env:restore"
    dkd_scripts["prebuild"] = "npm run env:restore"
    dkd_scripts["preexport"] = "npm run env:restore"
    dkd_scripts["dkd:verify-v0.0.5"] = "node ./scripts/dkd_verify_release_identity.mjs"
    dkd_write_json(dkd_package_path, dkd_package)

    dkd_app_path = DKD_ROOT / "app.json"
    dkd_app = json.loads(dkd_read_text(dkd_app_path))
    dkd_expo = dkd_app.setdefault("expo", {})
    dkd_expo["name"] = "DraBornGo"
    dkd_expo["slug"] = "draborngo"
    dkd_expo["version"] = DKD_VERSION_NAME
    dkd_android = dkd_expo.setdefault("android", {})
    dkd_android["versionCode"] = DKD_VERSION_CODE
    dkd_android["package"] = "com.draborneagle.draborngo"
    dkd_write_json(dkd_app_path, dkd_app)


def dkd_write_public_env_defaults() -> None:
    dkd_write_json(
        DKD_ROOT / "config" / "dkd_public_env.defaults.json",
        {
            "EXPO_PUBLIC_SUPABASE_URL": "https://guuwomvszlwhkmstewfl.supabase.co",
            "EXPO_PUBLIC_SUPABASE_ANON_KEY": "sb_publishable_bf1URxrlLlvMQ8e1Z7oxkQ_jx9mvy5g",
            "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_bf1URxrlLlvMQ8e1Z7oxkQ_jx9mvy5g",
            "EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN": "pk.eyJ1IjoiZHJhYm9ybmVhZ2xlIiwiYSI6ImNtb2w4bzJqNTBnZDcyc3NiZzd5anJpYWYifQ.dtxvJcDCckwWCFGCk7ialg",
        },
    )


def dkd_active_roots():
    return [
        DKD_ROOT / "src",
        DKD_ROOT / "scripts",
        DKD_ROOT / "tools",
        DKD_ROOT / "supabase" / "functions",
        DKD_ROOT / "web" / "DraBornGo" / "App",
    ]


def dkd_rename_active_files() -> None:
    dkd_candidates = []
    for dkd_root in dkd_active_roots():
        if not dkd_root.exists():
            continue
        for dkd_path in sorted(dkd_root.rglob("*"), key=lambda dkd_item: len(dkd_item.parts), reverse=True):
            if not dkd_path.is_file():
                continue
            if "Ally" not in dkd_path.name and "ally" not in dkd_path.name:
                continue
            dkd_new_name = dkd_path.name.replace("Ally", "DBG").replace("ally", "dbg")
            dkd_candidates.append((dkd_path, dkd_path.with_name(dkd_new_name)))

    for dkd_old_path, dkd_new_path in dkd_candidates:
        if not dkd_old_path.exists() or dkd_old_path == dkd_new_path:
            continue
        if dkd_new_path.exists():
            dkd_new_path.unlink()
        dkd_old_path.rename(dkd_new_path)


def dkd_replace_active_text(dkd_text: str) -> str:
    dkd_next = dkd_text
    dkd_next = dkd_next.replace("LOOTONIA", "DRABORNGO")
    dkd_next = dkd_next.replace("Lootonia", "DraBornGo")
    dkd_next = dkd_next.replace("lootonia", "draborngo")
    dkd_next = dkd_next.replace("ALLY", "DBG")
    dkd_next = dkd_next.replace("Ally", "DBG")
    dkd_next = re.sub(r"(?<![A-Za-z])ally(?=[A-Z_]|[^A-Za-z]|$)", "dbg", dkd_next)
    return dkd_next


def dkd_update_active_text_files() -> None:
    dkd_suffixes = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", ".md", ".html", ".yml", ".yaml", ".sh", ".txt"}
    dkd_paths = []
    for dkd_root in dkd_active_roots():
        if not dkd_root.exists():
            continue
        dkd_paths.extend(
            dkd_path
            for dkd_path in dkd_root.rglob("*")
            if dkd_path.is_file() and dkd_path.suffix.lower() in dkd_suffixes
        )
    for dkd_file_name in ["App.js", "README.md", "app.config.js", "eas.json"]:
        dkd_path = DKD_ROOT / dkd_file_name
        if dkd_path.exists():
            dkd_paths.append(dkd_path)

    for dkd_path in sorted(set(dkd_paths)):
        dkd_old = dkd_read_text(dkd_path)
        dkd_new = dkd_replace_active_text(dkd_old)
        if dkd_new != dkd_old:
            dkd_write_text(dkd_path, dkd_new)


def dkd_update_version_remnants() -> None:
    dkd_targets = [
        "src/services/dkd_app_update_service.js",
        "src/features/legal/dkd_app_update_center_modal.js",
        "src/services/dkd_policy_center_service.js",
        "src/features/map/MapHomeScreen.js",
        "src/features/legal/dkd_google_play_policy_center_modal.js",
        "web/DraBornGo/App/index.html",
        "web/DraBornGo/App/dkd_draborngo_update_manifest.json",
        "web/DraBornGo/App/dkd_draborngo_release_notes.html",
        ".github/workflows/dkdev_build_apk.yml",
        ".github/workflows/dkd_build_signed_apk.yml",
        ".github/workflows/dkd_build_signed_aab.yml",
    ]
    for dkd_relative in dkd_targets:
        dkd_path = DKD_ROOT / dkd_relative
        if not dkd_path.exists():
            continue
        dkd_old = dkd_read_text(dkd_path)
        dkd_new = dkd_old.replace("v0.0.4", "v0.0.5").replace("0.0.4", "0.0.5")
        if dkd_path.name == "dkd_app_update_service.js":
            dkd_new = dkd_new.replace("|| 4;", "|| 5;")
        if dkd_path.name == "dkd_app_update_center_modal.js":
            dkd_new = dkd_new.replace("|| 4}", "|| 5}")
        if dkd_new != dkd_old:
            dkd_write_text(dkd_path, dkd_new)


def dkd_remove_silent_install_notice() -> None:
    dkd_path = DKD_ROOT / "src" / "features" / "legal" / "dkd_app_update_center_modal.js"
    if not dkd_path.exists():
        return
    dkd_text = dkd_read_text(dkd_path)
    dkd_text = re.sub(
        r"\n\s*<View style=\{dkd_styles\.dkd_warning_card\}>\s*<MaterialCommunityIcons[^\n]*\n\s*<Text style=\{dkd_styles\.dkd_warning_text\}>Uygulama sessiz kurulum yapmaz\..*?</Text>\s*</View>\s*",
        "\n",
        dkd_text,
        flags=re.S,
    )
    dkd_text = re.sub(r"\n\s*dkd_warning_card:\s*\{.*?\n\s*\},", "", dkd_text, flags=re.S)
    dkd_text = re.sub(r"\n\s*dkd_warning_text:\s*\{.*?\n\s*\},", "", dkd_text, flags=re.S)
    dkd_write_text(dkd_path, dkd_text)


def dkd_write_verify_script() -> None:
    dkd_text = """import dkd_file_system_module from 'node:fs';
import dkd_path_module from 'node:path';

const dkd_root_path_value = process.cwd();
const dkd_package_value = JSON.parse(dkd_file_system_module.readFileSync(dkd_path_module.join(dkd_root_path_value, 'package.json'), 'utf8'));
const dkd_app_value = JSON.parse(dkd_file_system_module.readFileSync(dkd_path_module.join(dkd_root_path_value, 'app.json'), 'utf8'));
const dkd_env_value = JSON.parse(dkd_file_system_module.readFileSync(dkd_path_module.join(dkd_root_path_value, 'config', 'dkd_public_env.defaults.json'), 'utf8'));
const dkd_error_text_values = [];

if (dkd_package_value.version !== '0.0.5') dkd_error_text_values.push('package.json version 0.0.5 değil.');
if (dkd_app_value?.expo?.version !== '0.0.5') dkd_error_text_values.push('app.json expo.version 0.0.5 değil.');
if (Number(dkd_app_value?.expo?.android?.versionCode) !== 5) dkd_error_text_values.push('Android versionCode 5 değil.');
if (dkd_app_value?.expo?.name !== 'DraBornGo') dkd_error_text_values.push('Uygulama adı DraBornGo değil.');

for (const dkd_key_name_value of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN']) {
  if (!String(dkd_env_value?.[dkd_key_name_value] || '').trim()) dkd_error_text_values.push(`${dkd_key_name_value} boş.`);
}

const dkd_scan_root_name_values = ['src', 'scripts', 'tools', 'supabase/functions'];
const dkd_text_extension_values = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.md', '.html', '.yml', '.yaml', '.sh', '.txt']);
const dkd_forbidden_pattern_value = /Lootonia|lootonia|LOOTONIA|\\bAlly\\b|ally_id|AllyHub|allyService|useAllyHubState/;

function dkd_scan_path_value(dkd_path_value) {
  if (!dkd_file_system_module.existsSync(dkd_path_value)) return;
  const dkd_stat_value = dkd_file_system_module.statSync(dkd_path_value);
  if (dkd_stat_value.isDirectory()) {
    for (const dkd_entry_name_value of dkd_file_system_module.readdirSync(dkd_path_value)) dkd_scan_path_value(dkd_path_module.join(dkd_path_value, dkd_entry_name_value));
    return;
  }
  if (!dkd_text_extension_values.has(dkd_path_module.extname(dkd_path_value).toLowerCase())) return;
  const dkd_text_value = dkd_file_system_module.readFileSync(dkd_path_value, 'utf8');
  if (dkd_forbidden_pattern_value.test(dkd_text_value)) dkd_error_text_values.push(`Eski kimlik kaldı: ${dkd_path_module.relative(dkd_root_path_value, dkd_path_value)}`);
}

for (const dkd_scan_root_name_value of dkd_scan_root_name_values) dkd_scan_path_value(dkd_path_module.join(dkd_root_path_value, dkd_scan_root_name_value));

if (dkd_error_text_values.length) {
  console.error(dkd_error_text_values.join('\\n'));
  process.exit(1);
}
console.log('DKD v0.0.5 kimlik, sürüm ve public env doğrulaması başarılı.');
"""
    dkd_write_text(DKD_ROOT / "scripts" / "dkd_verify_release_identity.mjs", dkd_text)


def dkd_write_termux_updater() -> None:
    dkd_text = """#!/data/data/com.termux/files/usr/bin/bash
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
"""
    dkd_path = DKD_ROOT / "scripts" / "dkd_termux_update_v0_0_5.sh"
    dkd_write_text(dkd_path, dkd_text)
    dkd_path.chmod(0o755)


def dkd_write_release_docs() -> None:
    dkd_write_text(
        DKD_ROOT / "docs" / "dkd_draborngo_v0_0_5_upgrade.md",
        """# DraBornGo v0.0.5

- Uygulama sürümü: `0.0.5`
- Android versionCode: `5`
- Proje klasörü: `~/Projects/DraBornGo`
- Önceki sürüm yedeği: GitHub `backup/v0.0.4` dalı ve Termux ZIP yedeği
- Public Supabase ve Mapbox ayarları `config/dkd_public_env.defaults.json` üzerinden otomatik geri yüklenir.
- Aktif uygulama kodundaki Ally kimliği DBG, `ally_id` alanı `dbg_id` olarak taşınır.
- Eski uygulanmış SQL migration dosyaları değiştirilmez; canlı veritabanına ileri yönlü v0.0.5 migration uygulanır.
""",
    )
    dkd_readme_path = DKD_ROOT / "README.md"
    if dkd_readme_path.exists():
        dkd_readme = dkd_read_text(dkd_readme_path)
        dkd_banner = "> Aktif sürüm: DraBornGo v0.0.5 • Android versionCode 5 • Termux proje yolu: `~/Projects/DraBornGo`\n\n"
        if dkd_banner not in dkd_readme:
            dkd_write_text(dkd_readme_path, dkd_banner + dkd_readme)


def main() -> None:
    dkd_update_release_identity()
    dkd_write_public_env_defaults()
    dkd_rename_active_files()
    dkd_update_active_text_files()
    dkd_update_version_remnants()
    dkd_remove_silent_install_notice()
    dkd_write_verify_script()
    dkd_write_termux_updater()
    dkd_write_release_docs()
    print("DraBornGo v0.0.5 source upgrade prepared.")


if __name__ == "__main__":
    main()
