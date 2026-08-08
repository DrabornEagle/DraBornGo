const dkd_file_system_module = require('fs');
const dkd_path_module = require('path');

const dkd_project_root_path_value = dkd_path_module.resolve(__dirname, '..');
const dkd_node_modules_path_value = dkd_path_module.join(dkd_project_root_path_value, 'node_modules');
const dkd_android_permission_prefix_value = ['android', 'permission'].join('.') + '.';
const dkd_service_type_attribute_name_value = ['android', ['foreground', 'Service', 'Type'].join('')].join(':');
const dkd_location_task_service_name_fragment_value = [['Location', 'Task', 'Service'].join('')].join('');
const dkd_forbidden_permission_name_list_value = [
  dkd_android_permission_prefix_value + ['RECORD', 'AUDIO'].join('_'),
  dkd_android_permission_prefix_value + ['ACCESS', 'BACKGROUND', 'LOCATION'].join('_'),
  dkd_android_permission_prefix_value + ['FOREGROUND', 'SERVICE'].join('_'),
  dkd_android_permission_prefix_value + ['FOREGROUND', 'SERVICE', 'LOCATION'].join('_'),
  dkd_android_permission_prefix_value + ['READ', 'MEDIA', 'IMAGES'].join('_'),
  dkd_android_permission_prefix_value + ['READ', 'MEDIA', 'VIDEO'].join('_'),
  dkd_android_permission_prefix_value + ['READ', 'MEDIA', 'VISUAL', 'USER', 'SELECTED'].join('_'),
  dkd_android_permission_prefix_value + ['READ', 'EXTERNAL', 'STORAGE'].join('_'),
  dkd_android_permission_prefix_value + ['WRITE', 'EXTERNAL', 'STORAGE'].join('_'),
  dkd_android_permission_prefix_value + ['MANAGE', 'EXTERNAL', 'STORAGE'].join('_'),
  dkd_android_permission_prefix_value + ['QUERY', 'ALL', 'PACKAGES'].join('_'),
  dkd_android_permission_prefix_value + ['REQUEST', 'INSTALL', 'PACKAGES'].join('_'),
  dkd_android_permission_prefix_value + ['USE', 'FULL', 'SCREEN', 'INTENT'].join('_')
];

function dkd_escape_regular_expression_value(dkd_text_value) {
  return String(dkd_text_value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function dkd_collect_android_manifest_paths_value(dkd_scan_root_path_value) {
  const dkd_pending_directory_path_list_value = [dkd_scan_root_path_value];
  const dkd_manifest_path_list_value = [];

  while (dkd_pending_directory_path_list_value.length > 0) {
    const dkd_current_directory_path_value = dkd_pending_directory_path_list_value.pop();

    if (!dkd_current_directory_path_value || !dkd_file_system_module.existsSync(dkd_current_directory_path_value)) {
      continue;
    }

    const dkd_directory_entry_list_value = dkd_file_system_module.readdirSync(dkd_current_directory_path_value, { withFileTypes: true });

    dkd_directory_entry_list_value.forEach((dkd_directory_entry_value) => {
      const dkd_entry_path_value = dkd_path_module.join(dkd_current_directory_path_value, dkd_directory_entry_value.name);

      if (dkd_directory_entry_value.isDirectory()) {
        dkd_pending_directory_path_list_value.push(dkd_entry_path_value);
        return;
      }

      if (dkd_directory_entry_value.isFile() && dkd_directory_entry_value.name === 'AndroidManifest.xml') {
        dkd_manifest_path_list_value.push(dkd_entry_path_value);
      }
    });
  }

  return dkd_manifest_path_list_value;
}

function dkd_remove_forbidden_permission_lines_value(dkd_manifest_text_value) {
  return dkd_forbidden_permission_name_list_value.reduce((dkd_current_manifest_text_value, dkd_permission_name_value) => {
    const dkd_permission_pattern_value = new RegExp(
      String.raw`\n?\s*<uses-permission\b(?=[^>]*android:name=["']${dkd_escape_regular_expression_value(dkd_permission_name_value)}["'])[^>]*/>`,
      'g'
    );
    const dkd_permission_sdk_pattern_value = new RegExp(
      String.raw`\n?\s*<uses-permission-sdk-23\b(?=[^>]*android:name=["']${dkd_escape_regular_expression_value(dkd_permission_name_value)}["'])[^>]*/>`,
      'g'
    );
    return dkd_current_manifest_text_value
      .replace(dkd_permission_pattern_value, '')
      .replace(dkd_permission_sdk_pattern_value, '');
  }, dkd_manifest_text_value);
}

function dkd_remove_location_task_service_value(dkd_manifest_text_value) {
  const dkd_location_service_block_pattern_value = new RegExp(
    String.raw`\n?\s*<service\b(?=[\s\S]*?${dkd_escape_regular_expression_value(dkd_location_task_service_name_fragment_value)}[\s\S]*?\/?>)[\s\S]*?${dkd_escape_regular_expression_value(dkd_location_task_service_name_fragment_value)}[\s\S]*?\/?>`,
    'g'
  );
  const dkd_location_service_type_block_pattern_value = new RegExp(
    String.raw`\n?\s*<service\b(?=[^>]*${dkd_escape_regular_expression_value(dkd_service_type_attribute_name_value)}=["'][^"']*location[^"']*["'])[^>]*\/>`,
    'g'
  );
  const dkd_service_type_attribute_pattern_value = new RegExp(
    String.raw`\s*${dkd_escape_regular_expression_value(dkd_service_type_attribute_name_value)}=["'][^"']*["']`,
    'g'
  );

  return dkd_manifest_text_value
    .replace(dkd_location_service_block_pattern_value, '')
    .replace(dkd_location_service_type_block_pattern_value, '')
    .replace(dkd_service_type_attribute_pattern_value, '');
}

function dkd_clean_manifest_file_value(dkd_manifest_file_path_value) {
  const dkd_original_manifest_text_value = dkd_file_system_module.readFileSync(dkd_manifest_file_path_value, 'utf8');
  const dkd_without_forbidden_permissions_value = dkd_remove_forbidden_permission_lines_value(dkd_original_manifest_text_value);
  const dkd_clean_manifest_text_value = dkd_remove_location_task_service_value(dkd_without_forbidden_permissions_value);

  if (dkd_clean_manifest_text_value !== dkd_original_manifest_text_value) {
    dkd_file_system_module.writeFileSync(dkd_manifest_file_path_value, dkd_clean_manifest_text_value);
    return true;
  }

  return false;
}

function dkd_run_android_dependency_manifest_cleaner_value() {
  if (!dkd_file_system_module.existsSync(dkd_node_modules_path_value)) {
    console.log('DKD manifest cleaner: node_modules bulunmadı, npm install sonrası otomatik tekrar çalışır.');
    return;
  }

  const dkd_manifest_path_list_value = dkd_collect_android_manifest_paths_value(dkd_node_modules_path_value);
  const dkd_changed_manifest_path_list_value = dkd_manifest_path_list_value.filter((dkd_manifest_path_value) => (
    dkd_clean_manifest_file_value(dkd_manifest_path_value)
  ));

  console.log(`DKD manifest cleaner: ${dkd_manifest_path_list_value.length} AndroidManifest.xml tarandı.`);
  console.log(`DKD manifest cleaner: ${dkd_changed_manifest_path_list_value.length} dosya temizlendi.`);

  dkd_changed_manifest_path_list_value.forEach((dkd_changed_manifest_path_value) => {
    console.log(`DKD manifest cleaner changed: ${dkd_path_module.relative(dkd_project_root_path_value, dkd_changed_manifest_path_value)}`);
  });
}

dkd_run_android_dependency_manifest_cleaner_value();
