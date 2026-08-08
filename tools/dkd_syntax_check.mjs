import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';

const dkd_require_value = createRequire(import.meta.url);
const dkd_babel_parser_value = dkd_require_value('@babel/parser');
const dkd_project_root_value = process.cwd();
const dkd_scan_root_values = ['App.js', 'src', 'plugins', 'tools'];
const dkd_allowed_extension_values = new Set(['.js', '.mjs', '.cjs']);
const dkd_ignored_directory_values = new Set([
  'node_modules',
  '.git',
  '.expo',
  'android',
  'ios',
  'dist',
  'web-build',
]);
const dkd_file_values = [];

function dkd_extension_value(dkd_path_value) {
  const dkd_last_dot_index_value = dkd_path_value.lastIndexOf('.');
  return dkd_last_dot_index_value >= 0
    ? dkd_path_value.slice(dkd_last_dot_index_value)
    : '';
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

  const dkd_directory_name_value = dkd_path_value
    .split('/')
    .filter(Boolean)
    .at(-1) || '';

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
  const dkd_relative_path_value = relative(dkd_project_root_value, dkd_file_value);

  try {
    const dkd_source_value = readFileSync(dkd_file_value, 'utf8');

    dkd_babel_parser_value.parse(dkd_source_value, {
      sourceType: 'unambiguous',
      allowAwaitOutsideFunction: true,
      plugins: [
        'jsx',
        'flow',
        'importMeta',
        'optionalChaining',
        'nullishCoalescingOperator',
        'topLevelAwait',
      ],
    });
  } catch (dkd_error_value) {
    dkd_failed_count_value += 1;
    console.error(`\n[DKD METRO/BABEL SYNTAX ERROR] ${dkd_relative_path_value}`);
    console.error(String(dkd_error_value?.message || dkd_error_value));

    if (dkd_error_value?.loc) {
      console.error(
        `Konum: satır ${dkd_error_value.loc.line}, sütun ${dkd_error_value.loc.column}`,
      );
    }
  }
});

if (dkd_failed_count_value > 0) {
  console.error(`\nDraBornGo syntax check failed: ${dkd_failed_count_value} file(s).`);
  process.exit(1);
}

console.log(
  `DraBornGo Metro/Babel syntax check passed: ${dkd_file_values.length} file(s).`,
);
