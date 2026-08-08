import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const dkd_project_root_value = process.cwd();
const dkd_scan_root_values = ['App.js', 'src', 'plugins', 'tools'];
const dkd_allowed_extension_values = new Set(['.js', '.mjs', '.cjs']);
const dkd_ignored_directory_values = new Set(['node_modules', '.git', '.expo', 'android', 'ios', 'dist', 'web-build']);
const dkd_file_values = [];

function dkd_extension_value(dkd_path_value) {
  const dkd_last_dot_index_value = dkd_path_value.lastIndexOf('.');
  return dkd_last_dot_index_value >= 0 ? dkd_path_value.slice(dkd_last_dot_index_value) : '';
}

function dkd_collect_files_value(dkd_path_value) {
  let dkd_stats_value;
  try {
    dkd_stats_value = statSync(dkd_path_value);
  } catch {
    return;
  }

  if (dkd_stats_value.isFile()) {
    if (dkd_allowed_extension_values.has(dkd_extension_value(dkd_path_value))) {
      dkd_file_values.push(dkd_path_value);
    }
    return;
  }

  if (!dkd_stats_value.isDirectory()) return;

  const dkd_directory_name_value = dkd_path_value.split('/').filter(Boolean).at(-1) || '';
  if (dkd_ignored_directory_values.has(dkd_directory_name_value)) return;

  readdirSync(dkd_path_value).forEach((dkd_entry_value) => {
    dkd_collect_files_value(join(dkd_path_value, dkd_entry_value));
  });
}

dkd_scan_root_values.forEach((dkd_root_value) => {
  dkd_collect_files_value(join(dkd_project_root_value, dkd_root_value));
});

let dkd_failed_count_value = 0;

dkd_file_values.sort().forEach((dkd_file_value) => {
  const dkd_result_value = spawnSync(process.execPath, ['--check', dkd_file_value], {
    encoding: 'utf8',
  });

  if (dkd_result_value.status !== 0) {
    dkd_failed_count_value += 1;
    console.error(`\n[DKD SYNTAX ERROR] ${relative(dkd_project_root_value, dkd_file_value)}`);
    console.error(String(dkd_result_value.stderr || dkd_result_value.stdout || '').trim());
  }
});

if (dkd_failed_count_value > 0) {
  console.error(`\nDraBornGo syntax check failed: ${dkd_failed_count_value} file(s).`);
  process.exit(1);
}

console.log(`DraBornGo syntax check passed: ${dkd_file_values.length} file(s).`);
