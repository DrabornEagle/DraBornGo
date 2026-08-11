const dkd_file_system_module = require('fs');
const dkd_path_module = require('path');

function dkd_read_json_file(dkd_relative_file_path_value) {
  const dkd_full_file_path_value = dkd_path_module.join(__dirname, dkd_relative_file_path_value);
  const dkd_file_content_value = dkd_file_system_module.readFileSync(dkd_full_file_path_value, 'utf8');
  return JSON.parse(dkd_file_content_value);
}

function dkd_android_permission_value(dkd_permission_suffix_parts_value) {
  return ['android', 'permission'].join('.') + '.' + dkd_permission_suffix_parts_value.join('_');
}

const dkd_app_json_value = dkd_read_json_file('app.json');
const dkd_package_json_value = dkd_read_json_file('package.json');
const dkd_android_target_sdk_value = 36;
const dkd_android_version_code_value = 4;

let dkd_public_env_defaults_value = {};

try {
  dkd_public_env_defaults_value = dkd_read_json_file(
    'config/dkd_public_env.defaults.json'
  );
} catch (dkd_public_env_defaults_error_value) {
  void dkd_public_env_defaults_error_value;
  dkd_public_env_defaults_value = {};
}

function dkd_public_env_text_value(dkd_env_key_value) {
  const dkd_runtime_env_value = String(
    process.env[dkd_env_key_value] || ''
  ).trim();

  const dkd_default_env_value = String(
    dkd_public_env_defaults_value[dkd_env_key_value] || ''
  ).trim();

  return dkd_runtime_env_value || dkd_default_env_value;
}

const dkd_public_env_config_value = {
  EXPO_PUBLIC_SUPABASE_URL: dkd_public_env_text_value('EXPO_PUBLIC_SUPABASE_URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: dkd_public_env_text_value('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: dkd_public_env_text_value('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || dkd_public_env_text_value('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: dkd_public_env_text_value('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN')
};

const dkd_expo_config_value = dkd_app_json_value.expo || {};
const dkd_android_config_value = dkd_expo_config_value.android || {};

const dkd_safe_android_permissions_value = [
  dkd_android_permission_value(['ACCESS', 'COARSE', 'LOCATION']),
  dkd_android_permission_value(['ACCESS', 'FINE', 'LOCATION']),
  dkd_android_permission_value(['CAMERA'])
];

const dkd_blocked_android_permission_set_value = new Set([
  dkd_android_permission_value(['RECORD', 'AUDIO']),
  dkd_android_permission_value(['ACCESS', 'BACKGROUND', 'LOCATION']),
  dkd_android_permission_value(['FOREGROUND', 'SERVICE']),
  dkd_android_permission_value(['FOREGROUND', 'SERVICE', 'LOCATION']),
  dkd_android_permission_value(['READ', 'MEDIA', 'IMAGES']),
  dkd_android_permission_value(['READ', 'MEDIA', 'VIDEO']),
  dkd_android_permission_value(['READ', 'MEDIA', 'VISUAL', 'USER', 'SELECTED']),
  dkd_android_permission_value(['READ', 'EXTERNAL', 'STORAGE']),
  dkd_android_permission_value(['WRITE', 'EXTERNAL', 'STORAGE']),
  dkd_android_permission_value(['SYSTEM', 'ALERT', 'WINDOW']),
  dkd_android_permission_value(['MANAGE', 'EXTERNAL', 'STORAGE']),
  dkd_android_permission_value(['QUERY', 'ALL', 'PACKAGES']),
  dkd_android_permission_value(['REQUEST', 'INSTALL', 'PACKAGES']),
  dkd_android_permission_value(['USE', 'FULL', 'SCREEN', 'INTENT'])
]);

function dkd_clean_android_config_value(dkd_source_android_config_value = {}) {
  const {
    blockedPermissions: dkd_removed_blocked_permissions_value,
    permissions: dkd_removed_permissions_value,
    ...dkd_clean_config_value
  } = dkd_source_android_config_value;

  void dkd_removed_blocked_permissions_value;
  void dkd_removed_permissions_value;

  return {
    ...dkd_clean_config_value,
    versionCode: dkd_source_android_config_value.versionCode || dkd_android_version_code_value,
    permissions: dkd_safe_android_permissions_value.filter(
      (dkd_permission_name_value) => !dkd_blocked_android_permission_set_value.has(dkd_permission_name_value)
    )
  };
}

function dkd_normalize_plugin_config_values(dkd_source_plugins_value = []) {
  return dkd_source_plugins_value.filter((dkd_plugin_entry_value) => {
    const dkd_plugin_name_value = Array.isArray(dkd_plugin_entry_value)
      ? dkd_plugin_entry_value[0]
      : dkd_plugin_entry_value;

    return dkd_plugin_name_value !== 'expo-camera';
  });
}

module.exports = function dkd_resolve_expo_app_config(dkd_config_params_value) {
  const dkd_base_config_value =
    dkd_config_params_value && dkd_config_params_value.config
      ? dkd_config_params_value.config
      : {};

  const dkd_base_android_config_value = dkd_clean_android_config_value(dkd_base_config_value.android || {});
  const dkd_project_android_config_value = dkd_clean_android_config_value(dkd_android_config_value);
  const dkd_project_plugins_value = dkd_normalize_plugin_config_values(dkd_expo_config_value.plugins || []);
  const dkd_policy_safety_plugin_path_value = './plugins/dkd_android_policy_safety_plugin';

  return {
    ...dkd_base_config_value,
    ...dkd_expo_config_value,
    version: dkd_package_json_value.version || dkd_expo_config_value.version,
    android: {
      ...dkd_base_android_config_value,
      ...dkd_project_android_config_value,
      versionCode: dkd_android_config_value.versionCode || dkd_android_version_code_value,
      permissions: dkd_safe_android_permissions_value
    },
    plugins: [
      ...dkd_project_plugins_value,
      dkd_policy_safety_plugin_path_value
    ],
    extra: {
      ...(dkd_base_config_value.extra || {}),
      ...(dkd_expo_config_value.extra || {}),
      dkd_android_target_sdk: dkd_android_target_sdk_value,
      dkd_android_version_code: dkd_android_version_code_value,
      dkd_public_env: dkd_public_env_config_value,
      EXPO_PUBLIC_SUPABASE_URL: dkd_public_env_config_value.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: dkd_public_env_config_value.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: dkd_public_env_config_value.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: dkd_public_env_config_value.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
    }
  };
};
