import fs from 'node:fs';
import path from 'node:path';

const dkd_root_value = process.cwd();
const dkd_abs_value = (dkd_path_value) => path.join(dkd_root_value, dkd_path_value);
const dkd_exists_value = (dkd_path_value) => fs.existsSync(dkd_abs_value(dkd_path_value));
const dkd_read_value = (dkd_path_value) => fs.readFileSync(dkd_abs_value(dkd_path_value), 'utf8');
const dkd_write_value = (dkd_path_value, dkd_content_value) => fs.writeFileSync(dkd_abs_value(dkd_path_value), dkd_content_value);
const dkd_delete_value = (dkd_path_value) => { if (dkd_exists_value(dkd_path_value)) fs.rmSync(dkd_abs_value(dkd_path_value), { recursive: true, force: true }); };

function dkd_replace_required_value(dkd_path_value, dkd_pattern_value, dkd_replacement_value, dkd_label_value) {
  const dkd_source_value = dkd_read_value(dkd_path_value);
  const dkd_next_value = dkd_source_value.replace(dkd_pattern_value, dkd_replacement_value);
  if (dkd_next_value === dkd_source_value) throw new Error(`DKD purge eşleşmedi: ${dkd_label_value}`);
  dkd_write_value(dkd_path_value, dkd_next_value);
}

// 1) Remove obsolete dedicated deploy automation and historical feature-only SQL.
for (const dkd_path_value of [
  '.github/workflows/dkd_urgent_courier_alert_deploy.yml',
  'supabase/migrations/20260430_dkd_mapbox_v0_9_route_coordinate_fix.sql',
  'supabase/migrations/20260808183700_dkd_v0_0_10_remove_urgent_courier.sql',
  'audit/dkd_v0_0_10_full_repo_residue.txt',
  'audit/dkd_v0_0_10_transform_status.txt',
]) dkd_delete_value(dkd_path_value);

// 2) Keep the generic v0.0.9 runtime bridge migration, remove only its retired snapshot RPC.
{
  const dkd_path_value = 'supabase/migrations/20260808175000_dkd_v0_0_9_restore_runtime_rpc_bridges.sql';
  dkd_replace_required_value(
    dkd_path_value,
    /\ncreate or replace function public\.dkd_urgent_courier_snapshot_fast_dkd\([\s\S]*?grant execute on function public\.dkd_urgent_courier_snapshot_fast_dkd\(integer, integer\) to authenticated, service_role;\n/,
    '\n',
    'runtime bridge retired snapshot RPC',
  );
}

// 3) Generic courier push targeting should depend only on approved courier status.
{
  const dkd_path_value = 'supabase/migrations/20260519_dkd_courier_cargo_push_status_fix.sql';
  dkd_replace_required_value(
    dkd_path_value,
    /\s+and \(\n\s+public\.dkd_urgent_courier_license_active_dkd\(dkd_token_scope\.user_id\) is true\n\s+or lower\(coalesce\(dkd_profile_scope\.courier_status, ''\)\) in \('approved', 'active', 'aktif', 'onayli', 'onaylı'\)\n\s+\)/,
    "\n    and lower(coalesce(dkd_profile_scope.courier_status, '')) in ('approved', 'active', 'aktif', 'onayli', 'onaylı')",
    'generic courier token eligibility',
  );
}

// 4) Preserve generic courier reassignment/admin deletion logic while removing the retired feature cleanup branch.
{
  const dkd_path_value = 'supabase/migrations/20260430_dkd_courier_reassign_admin_delete_order_details.sql';
  let dkd_source_value = dkd_read_value(dkd_path_value);
  dkd_source_value = dkd_source_value.replace(
    '-- Admin silerse: ilişkili kurye işi / kargo gönderisi / işletme siparişi / acil kurye kayıtları tüm kullanıcılardan kaldırılır.',
    '-- Admin silerse: ilişkili kurye işi / kargo gönderisi / işletme siparişi tüm kullanıcılardan kaldırılır.',
  );
  dkd_source_value = dkd_source_value.replace(/^\s*dkd_urgent_order_id_text_value text := '';\n/m, '');
  dkd_source_value = dkd_source_value.replace(/^\s*dkd_deleted_urgent_orders_count_value integer := 0;\n/m, '');
  dkd_source_value = dkd_source_value.replace(/^\s*dkd_deleted_urgent_items_count_value integer := 0;\n/m, '');
  dkd_source_value = dkd_source_value.replace(/^\s*dkd_deleted_urgent_messages_count_value integer := 0;\n/m, '');
  dkd_source_value = dkd_source_value.replace(
    /\n\s*dkd_urgent_order_id_text_value := coalesce\([\s\S]*?\n\s*\);/,
    '',
  );
  dkd_source_value = dkd_source_value.replace(
    /\n\s*or \(dkd_urgent_order_id_text_value <> '' and \([\s\S]*?\n\s*\)\);/,
    ';',
  );
  dkd_source_value = dkd_source_value.replace(
    /\n\s*if to_regclass\('public\.dkd_urgent_courier_messages'\)[\s\S]*?\n\s*end if;\n\n\s*if to_regclass\('public\.dkd_urgent_courier_order_items'\)[\s\S]*?\n\s*end if;\n\n\s*if to_regclass\('public\.dkd_urgent_courier_orders'\)[\s\S]*?\n\s*end if;/,
    '',
  );
  dkd_source_value = dkd_source_value.replace(
    /'dkd_deleted_business_history_count', dkd_deleted_business_history_count_value,\n\s*'dkd_deleted_urgent_orders_count'[\s\S]*?'dkd_deleted_urgent_messages_count', dkd_deleted_urgent_messages_count_value/,
    "'dkd_deleted_business_history_count', dkd_deleted_business_history_count_value",
  );
  if (/urgent_courier|dkd_urgent_order|dkd_deleted_urgent|acil kurye/i.test(dkd_source_value)) {
    throw new Error('Generic admin-delete migration içinde retired feature kalıntısı kaldı.');
  }
  dkd_write_value(dkd_path_value, dkd_source_value);
}

// 5) Rewrite the permanent source audit so it can guard against reintroduction without embedding the retired literals in main.
{
  const dkd_path_value = '.github/workflows/dkd_v0_0_10_source_audit.yml';
  const dkd_source_value = `name: DKD v0.0.10 Expo Source Audit\n\non:\n  push:\n    branches: [main]\n    paths-ignore:\n      - audit/**\n\npermissions:\n  contents: write\n\nconcurrency:\n  group: dkd-v0-0-10-source-audit\n  cancel-in-progress: true\n\njobs:\n  dkd_source_audit:\n    name: Expo Go Android and web source audit\n    runs-on: ubuntu-latest\n    timeout-minutes: 25\n    env:\n      CI: '1'\n      EXPO_NO_TELEMETRY: '1'\n    steps:\n      - name: Checkout finalized v0.0.10 source\n        uses: actions/checkout@v4\n\n      - name: Setup Node 22\n        uses: actions/setup-node@v4\n        with:\n          node-version: '22'\n          cache: 'npm'\n\n      - name: Install locked dependencies\n        run: npm ci\n\n      - name: Verify v0.0.10 identity\n        run: npm run dkd:verify-v0.0.10\n\n      - name: Assert retired courier module stays absent\n        shell: bash\n        run: |\n          DKD_REMOVED_KEY='urgent''_courier'\n          DKD_REMOVED_EDGE='send-urgent''-courier-alert'\n          if grep -RniEi \"${'${DKD_REMOVED_KEY}'}|${'${DKD_REMOVED_EDGE}'}\" src supabase/functions --exclude-dir=node_modules; then\n            echo 'Retired courier module residue detected.'\n            exit 1\n          fi\n\n      - name: Run Google Play source risk scan\n        run: npm run dkd:play-risk-scan\n\n      - name: Run Android and web source export audit only\n        run: npm run play:final-audit\n\n      - name: Record successful non-build audit\n        shell: bash\n        run: |\n          mkdir -p audit\n          {\n            echo \"DraBornGo v0.0.10 remote source audit: PASS\"\n            echo \"Android versionCode: 10\"\n            echo \"Retired courier module active source: NONE\"\n            echo \"Android source export: PASS\"\n            echo \"Web source export: PASS\"\n            echo \"APK/AAB produced: NO\"\n            echo \"Commit: ${'${GITHUB_SHA}'}\"\n          } > audit/dkd_v0_0_10_remote_audit.txt\n          git config user.name \"github-actions[bot]\"\n          git config user.email \"41898282+github-actions[bot]@users.noreply.github.com\"\n          git add audit/dkd_v0_0_10_remote_audit.txt\n          git commit -m \"audit: confirm v0.0.10 Expo source checks\" || true\n          git push origin HEAD:main\n`;
  dkd_write_value(dkd_path_value, dkd_source_value);
}

// Temporary scanner artifacts must not remain in the final working tree.
dkd_delete_value('.github/workflows/dkd_v0_0_10_repo_scan.yml');

console.log('DKD v0.0.10 repository residue purge prepared.');
