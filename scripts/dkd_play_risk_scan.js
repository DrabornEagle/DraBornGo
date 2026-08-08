const dkd_file_system_module = require('fs');
const dkd_path_module = require('path');

const dkd_project_root_path_value = dkd_path_module.resolve(__dirname, '..');
const dkd_scan_root_path_list_value = [
  dkd_path_module.join(dkd_project_root_path_value, 'app.json'),
  dkd_path_module.join(dkd_project_root_path_value, 'app.config.js'),
  dkd_path_module.join(dkd_project_root_path_value, 'plugins'),
  dkd_path_module.join(dkd_project_root_path_value, 'src'),
  dkd_path_module.join(dkd_project_root_path_value, 'node_modules', 'expo-location', 'android', 'src', 'main', 'AndroidManifest.xml'),
  dkd_path_module.join(dkd_project_root_path_value, 'node_modules', 'expo-camera', 'android', 'src', 'main', 'AndroidManifest.xml')
];

const dkd_risk_text_list_value = [
  ['FOREGROUND', 'SERVICE', 'LOCATION'].join('_'),
  ['ACCESS', 'BACKGROUND', 'LOCATION'].join('_'),
  ['android', 'permission'].join('.') + '.' + ['FOREGROUND', 'SERVICE'].join('_'),
  ['foreground', 'Service', 'Type'].join(''),
  ['Location', 'Task', 'Service'].join(''),
  ['android', 'permission'].join('.') + '.' + ['RECORD', 'AUDIO'].join('_')
];
const dkd_risk_pattern_value = new RegExp(dkd_risk_text_list_value.map((dkd_risk_text_value) => (
  dkd_risk_text_value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
)).join('|'), 'g');
const dkd_ignored_path_part_list_value = [
  `${dkd_path_module.sep}.git${dkd_path_module.sep}`,
  `${dkd_path_module.sep}dkd_play_console_audit_logs${dkd_path_module.sep}`
];

function dkd_collect_file_paths_value(dkd_scan_path_value) {
  if (!dkd_file_system_module.existsSync(dkd_scan_path_value)) {
    return [];
  }

  const dkd_stat_value = dkd_file_system_module.statSync(dkd_scan_path_value);

  if (dkd_stat_value.isFile()) {
    return [dkd_scan_path_value];
  }

  const dkd_pending_directory_path_list_value = [dkd_scan_path_value];
  const dkd_file_path_list_value = [];

  while (dkd_pending_directory_path_list_value.length > 0) {
    const dkd_current_directory_path_value = dkd_pending_directory_path_list_value.pop();
    const dkd_directory_entry_list_value = dkd_file_system_module.readdirSync(dkd_current_directory_path_value, { withFileTypes: true });

    dkd_directory_entry_list_value.forEach((dkd_directory_entry_value) => {
      const dkd_entry_path_value = dkd_path_module.join(dkd_current_directory_path_value, dkd_directory_entry_value.name);

      if (dkd_ignored_path_part_list_value.some((dkd_ignored_path_part_value) => dkd_entry_path_value.includes(dkd_ignored_path_part_value))) {
        return;
      }

      if (dkd_directory_entry_value.isDirectory()) {
        dkd_pending_directory_path_list_value.push(dkd_entry_path_value);
        return;
      }

      if (dkd_directory_entry_value.isFile()) {
        dkd_file_path_list_value.push(dkd_entry_path_value);
      }
    });
  }

  return dkd_file_path_list_value;
}

function dkd_scan_file_value(dkd_file_path_value) {
  const dkd_file_text_value = dkd_file_system_module.readFileSync(dkd_file_path_value, 'utf8');
  const dkd_match_list_value = [...new Set(dkd_file_text_value.match(dkd_risk_pattern_value) || [])];

  if (dkd_match_list_value.length === 0) {
    return [];
  }

  return [{
    dkd_file_path: dkd_path_module.relative(dkd_project_root_path_value, dkd_file_path_value),
    dkd_matches: dkd_match_list_value
  }];
}

const dkd_result_list_value = dkd_scan_root_path_list_value.flatMap((dkd_scan_root_path_value) => (
  dkd_collect_file_paths_value(dkd_scan_root_path_value).flatMap((dkd_file_path_value) => dkd_scan_file_value(dkd_file_path_value))
));

if (dkd_result_list_value.length > 0) {
  console.error('DKD Play risk scan: riskli manifest/kaynak izi bulundu. AAB alma.');
  dkd_result_list_value.forEach((dkd_result_value) => {
    console.error(`${dkd_result_value.dkd_file_path}: ${dkd_result_value.dkd_matches.join(', ')}`);
  });
  process.exit(1);
}

console.log('DKD Play risk scan temiz: riskli foreground service / background location / audio izi bulunmadı.');
