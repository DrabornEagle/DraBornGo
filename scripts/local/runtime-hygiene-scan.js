const dkd_file_system_module = require('fs');
const dkd_path_module = require('path');

const dkd_project_root_path_value = dkd_path_module.resolve(__dirname, '..', '..');
const dkd_output_directory_path_value = dkd_path_module.resolve(
  dkd_project_root_path_value,
  process.argv[2] || 'audit/runtime_hygiene'
);
const dkd_finding_list_value = [];
const dkd_scanned_file_list_value = [];
const dkd_text_extension_set_value = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.yml', '.yaml', '.sql', '.html', '.md', '.sh']);
const dkd_scan_target_path_list_value = [
  dkd_path_module.join(dkd_project_root_path_value, 'App.js'),
  dkd_path_module.join(dkd_project_root_path_value, 'app.json'),
  dkd_path_module.join(dkd_project_root_path_value, 'package.json'),
  dkd_path_module.join(dkd_project_root_path_value, 'src'),
  dkd_path_module.join(dkd_project_root_path_value, 'supabase', 'functions'),
];

function dkd_record_finding_value(dkd_kind_value, dkd_file_path_value, dkd_detail_value) {
  dkd_finding_list_value.push({
    dkd_kind: dkd_kind_value,
    dkd_file: dkd_file_path_value ? dkd_path_module.relative(dkd_project_root_path_value, dkd_file_path_value) : '',
    dkd_detail: dkd_detail_value,
  });
}

function dkd_collect_text_files_value(dkd_target_path_value) {
  if (!dkd_file_system_module.existsSync(dkd_target_path_value)) return [];
  const dkd_stat_value = dkd_file_system_module.statSync(dkd_target_path_value);
  if (dkd_stat_value.isFile()) return dkd_text_extension_set_value.has(dkd_path_module.extname(dkd_target_path_value).toLowerCase()) ? [dkd_target_path_value] : [];

  const dkd_pending_path_list_value = [dkd_target_path_value];
  const dkd_file_path_list_value = [];
  while (dkd_pending_path_list_value.length > 0) {
    const dkd_current_path_value = dkd_pending_path_list_value.pop();
    for (const dkd_entry_value of dkd_file_system_module.readdirSync(dkd_current_path_value, { withFileTypes: true })) {
      if (['node_modules', '.git', 'audit', 'dist', '.expo'].includes(dkd_entry_value.name)) continue;
      const dkd_entry_path_value = dkd_path_module.join(dkd_current_path_value, dkd_entry_value.name);
      if (dkd_entry_value.isDirectory()) dkd_pending_path_list_value.push(dkd_entry_path_value);
      else if (dkd_entry_value.isFile() && dkd_text_extension_set_value.has(dkd_path_module.extname(dkd_entry_path_value).toLowerCase())) dkd_file_path_list_value.push(dkd_entry_path_value);
    }
  }
  return dkd_file_path_list_value;
}

function dkd_scan_text_file_value(dkd_file_path_value) {
  const dkd_text_value = dkd_file_system_module.readFileSync(dkd_file_path_value, 'utf8');
  dkd_scanned_file_list_value.push(dkd_path_module.relative(dkd_project_root_path_value, dkd_file_path_value));

  if (/^(<{7}|={7}|>{7})/m.test(dkd_text_value)) {
    dkd_record_finding_value('merge-conflict-marker', dkd_file_path_value, 'Çözülmemiş Git merge conflict işareti bulundu.');
  }
  if (/file:\/\/\/data\/data\/com\.termux\//i.test(dkd_text_value)) {
    dkd_record_finding_value('device-local-path', dkd_file_path_value, 'Termux cihazına özel file:// yolu kaynakta kalmış.');
  }
  if (/\/data\/data\/com\.termux\/files\/home\/projects\//i.test(dkd_text_value)) {
    dkd_record_finding_value('device-local-path', dkd_file_path_value, 'Termux projects dizinine sabitlenmiş mutlak yol kaynakta kalmış.');
  }
  if (/\bundefined\s+is\s+not\s+a\s+function\b/i.test(dkd_text_value) && !dkd_file_path_value.includes(`${dkd_path_module.sep}docs${dkd_path_module.sep}`)) {
    dkd_record_finding_value('runtime-error-residue', dkd_file_path_value, 'Ham runtime hata metni uygulama kaynağında kalmış.');
  }
}

for (const dkd_required_path_value of [
  dkd_path_module.join(dkd_project_root_path_value, 'App.js'),
  dkd_path_module.join(dkd_project_root_path_value, 'app.json'),
  dkd_path_module.join(dkd_project_root_path_value, 'package.json'),
]) {
  if (!dkd_file_system_module.existsSync(dkd_required_path_value)) {
    dkd_record_finding_value('missing-required-file', dkd_required_path_value, 'Zorunlu çalışma zamanı dosyası bulunamadı.');
  }
}

try {
  const dkd_app_config_value = JSON.parse(dkd_file_system_module.readFileSync(dkd_path_module.join(dkd_project_root_path_value, 'app.json'), 'utf8'));
  const dkd_package_config_value = JSON.parse(dkd_file_system_module.readFileSync(dkd_path_module.join(dkd_project_root_path_value, 'package.json'), 'utf8'));
  if (String(dkd_app_config_value?.expo?.version || '') !== String(dkd_package_config_value?.version || '')) {
    dkd_record_finding_value('release-version-mismatch', null, 'app.json expo.version ile package.json version eşleşmiyor.');
  }
  if (String(dkd_app_config_value?.expo?.android?.package || '') !== 'com.draborneagle.draborngo') {
    dkd_record_finding_value('android-package-mismatch', null, 'Android package kimliği beklenen DraBornGo kimliğiyle eşleşmiyor.');
  }
} catch (dkd_config_error_value) {
  dkd_record_finding_value('config-parse-error', null, `app/package JSON okunamadı: ${String(dkd_config_error_value?.message || dkd_config_error_value)}`);
}

for (const dkd_scan_target_path_value of dkd_scan_target_path_list_value) {
  for (const dkd_file_path_value of dkd_collect_text_files_value(dkd_scan_target_path_value)) {
    dkd_scan_text_file_value(dkd_file_path_value);
  }
}

dkd_file_system_module.mkdirSync(dkd_output_directory_path_value, { recursive: true });
const dkd_report_value = {
  dkd_ok: dkd_finding_list_value.length === 0,
  dkd_scanned_file_count: dkd_scanned_file_list_value.length,
  dkd_findings: dkd_finding_list_value,
};
dkd_file_system_module.writeFileSync(
  dkd_path_module.join(dkd_output_directory_path_value, 'runtime_hygiene_report.json'),
  `${JSON.stringify(dkd_report_value, null, 2)}\n`,
  'utf8'
);
dkd_file_system_module.writeFileSync(
  dkd_path_module.join(dkd_output_directory_path_value, 'runtime_hygiene_summary.txt'),
  dkd_finding_list_value.length === 0
    ? `PASS - ${dkd_scanned_file_list_value.length} runtime/source file tarandı; kritik hijyen bulgusu yok.\n`
    : `FAIL - ${dkd_finding_list_value.length} kritik hijyen bulgusu bulundu.\n${dkd_finding_list_value.map((dkd_item_value) => `- ${dkd_item_value.dkd_kind}: ${dkd_item_value.dkd_file} ${dkd_item_value.dkd_detail}`).join('\n')}\n`,
  'utf8'
);

if (dkd_finding_list_value.length > 0) {
  console.error(`DKD runtime hygiene: ${dkd_finding_list_value.length} kritik bulgu.`);
  for (const dkd_item_value of dkd_finding_list_value) {
    console.error(`${dkd_item_value.dkd_kind}: ${dkd_item_value.dkd_file} ${dkd_item_value.dkd_detail}`);
  }
  process.exit(1);
}

console.log(`DKD runtime hygiene PASS: ${dkd_scanned_file_list_value.length} dosya tarandı.`);
