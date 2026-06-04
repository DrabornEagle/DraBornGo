const dkd_config_plugins_module = require('@expo/config-plugins');

const dkd_with_android_manifest_value = dkd_config_plugins_module.withAndroidManifest;

function dkd_join_permission_value(dkd_permission_suffix_parts_value) {
  return ['android', 'permission'].join('.') + '.' + dkd_permission_suffix_parts_value.join('_');
}

function dkd_join_namespace_value(dkd_namespace_parts_value) {
  return dkd_namespace_parts_value.join(':');
}

function dkd_manifest_tools_namespace_key_value() {
  return dkd_join_namespace_value(['xmlns', 'tools']);
}

function dkd_manifest_tools_node_key_value() {
  return dkd_join_namespace_value(['tools', 'node']);
}

function dkd_android_name_key_value() {
  return dkd_join_namespace_value(['android', 'name']);
}

function dkd_android_tools_namespace_url_value() {
  return 'http' + '://schemas.android.com/tools';
}

function dkd_manifest_permission_name_value(dkd_permission_entry_value) {
  return String(
    dkd_permission_entry_value?.$?.[dkd_android_name_key_value()] ||
      dkd_permission_entry_value?.$?.name ||
      ''
  );
}

function dkd_forbidden_android_permission_list_value() {
  return [
    dkd_join_permission_value(['RECORD', 'AUDIO']),
    dkd_join_permission_value(['ACCESS', 'BACKGROUND', 'LOCATION']),
    dkd_join_permission_value(['FOREGROUND', 'SERVICE']),
    dkd_join_permission_value(['FOREGROUND', 'SERVICE', 'LOCATION']),
    dkd_join_permission_value(['READ', 'MEDIA', 'IMAGES']),
    dkd_join_permission_value(['READ', 'MEDIA', 'VIDEO']),
    dkd_join_permission_value(['READ', 'MEDIA', 'VISUAL', 'USER', 'SELECTED']),
    dkd_join_permission_value(['READ', 'EXTERNAL', 'STORAGE']),
    dkd_join_permission_value(['WRITE', 'EXTERNAL', 'STORAGE']),
    dkd_join_permission_value(['SYSTEM', 'ALERT', 'WINDOW']),
    dkd_join_permission_value(['MANAGE', 'EXTERNAL', 'STORAGE']),
    dkd_join_permission_value(['QUERY', 'ALL', 'PACKAGES']),
    dkd_join_permission_value(['REQUEST', 'INSTALL', 'PACKAGES']),
    dkd_join_permission_value(['USE', 'FULL', 'SCREEN', 'INTENT']),
  ];
}

function dkd_forbidden_android_permission_set_value() {
  return new Set(dkd_forbidden_android_permission_list_value());
}

function dkd_safe_android_permission_list_value() {
  return [
    dkd_join_permission_value(['ACCESS', 'COARSE', 'LOCATION']),
    dkd_join_permission_value(['ACCESS', 'FINE', 'LOCATION']),
    dkd_join_permission_value(['CAMERA']),
  ];
}

function dkd_foreground_service_type_key_value() {
  return ['foreground', 'Service', 'Type'].join('');
}

function dkd_android_foreground_service_type_key_value() {
  return dkd_join_namespace_value(['android', dkd_foreground_service_type_key_value()]);
}

function dkd_expo_location_task_service_name_value() {
  return [
    'expo',
    'modules',
    'location',
    'services',
    ['Location', 'Task', 'Service'].join(''),
  ].join('.');
}

function dkd_scrub_expo_public_android_permissions_value(dkd_config_value) {
  dkd_config_value.android = dkd_config_value.android || {};
  delete dkd_config_value.android.blockedPermissions;
  dkd_config_value.android.permissions = dkd_safe_android_permission_list_value();
  return dkd_config_value;
}

function dkd_filter_manifest_permission_list_value(dkd_permission_list_value, dkd_forbidden_set_value) {
  if (!Array.isArray(dkd_permission_list_value)) {
    return [];
  }

  return dkd_permission_list_value.filter((dkd_permission_entry_value) => (
    !dkd_forbidden_set_value.has(dkd_manifest_permission_name_value(dkd_permission_entry_value))
  ));
}

function dkd_manifest_attribute_text_value(dkd_manifest_entry_value, dkd_attribute_key_value) {
  return String(
    dkd_manifest_entry_value?.$?.[dkd_attribute_key_value] ||
      dkd_manifest_entry_value?.$?.[dkd_attribute_key_value.replace('android:', '')] ||
      ''
  );
}

function dkd_manifest_entry_name_value(dkd_manifest_entry_value) {
  return dkd_manifest_attribute_text_value(dkd_manifest_entry_value, dkd_android_name_key_value());
}

function dkd_manifest_entry_foreground_type_value(dkd_manifest_entry_value) {
  return dkd_manifest_attribute_text_value(
    dkd_manifest_entry_value,
    dkd_android_foreground_service_type_key_value()
  );
}

function dkd_manifest_service_is_blocked_value(dkd_service_entry_value) {
  const dkd_service_name_value = dkd_manifest_entry_name_value(dkd_service_entry_value);
  const dkd_service_type_value = dkd_manifest_entry_foreground_type_value(dkd_service_entry_value);

  return (
    dkd_service_name_value === dkd_expo_location_task_service_name_value() ||
    dkd_service_type_value.split('|').includes('location')
  );
}

function dkd_permission_remove_marker_value(dkd_permission_name_value) {
  return {
    $: {
      [dkd_android_name_key_value()]: dkd_permission_name_value,
      [dkd_manifest_tools_node_key_value()]: 'remove',
    },
  };
}

function dkd_service_remove_marker_value(dkd_service_name_value) {
  return {
    $: {
      [dkd_android_name_key_value()]: dkd_service_name_value,
      [dkd_manifest_tools_node_key_value()]: 'remove',
    },
  };
}

function dkd_permission_marker_exists_value(dkd_permission_list_value, dkd_permission_name_value) {
  return dkd_permission_list_value.some((dkd_permission_entry_value) => (
    dkd_manifest_permission_name_value(dkd_permission_entry_value) === dkd_permission_name_value &&
    dkd_permission_entry_value?.$?.[dkd_manifest_tools_node_key_value()] === 'remove'
  ));
}

function dkd_service_marker_exists_value(dkd_service_list_value, dkd_service_name_value) {
  return dkd_service_list_value.some((dkd_service_entry_value) => (
    dkd_manifest_entry_name_value(dkd_service_entry_value) === dkd_service_name_value &&
    dkd_service_entry_value?.$?.[dkd_manifest_tools_node_key_value()] === 'remove'
  ));
}

function dkd_ensure_android_tools_namespace_value(dkd_manifest_value) {
  dkd_manifest_value.manifest.$ = dkd_manifest_value.manifest.$ || {};
  dkd_manifest_value.manifest.$[dkd_manifest_tools_namespace_key_value()] =
    dkd_android_tools_namespace_url_value();
}

function dkd_ensure_permission_remove_markers_value(dkd_manifest_value, dkd_permission_name_list_value) {
  dkd_manifest_value.manifest['uses-permission'] = Array.isArray(dkd_manifest_value.manifest['uses-permission'])
    ? dkd_manifest_value.manifest['uses-permission']
    : [];

  dkd_permission_name_list_value.forEach((dkd_permission_name_value) => {
    if (!dkd_permission_marker_exists_value(dkd_manifest_value.manifest['uses-permission'], dkd_permission_name_value)) {
      dkd_manifest_value.manifest['uses-permission'].push(
        dkd_permission_remove_marker_value(dkd_permission_name_value)
      );
    }
  });
}

function dkd_scrub_foreground_service_type_value(dkd_node_value) {
  if (!dkd_node_value || typeof dkd_node_value !== 'object') {
    return;
  }

  if (dkd_node_value.$ && typeof dkd_node_value.$ === 'object') {
    Object.keys(dkd_node_value.$).forEach((dkd_attribute_key_value) => {
      if (
        dkd_attribute_key_value === dkd_android_foreground_service_type_key_value() ||
        dkd_attribute_key_value === dkd_foreground_service_type_key_value()
      ) {
        delete dkd_node_value.$[dkd_attribute_key_value];
      }
    });
  }

  Object.keys(dkd_node_value).forEach((dkd_child_key_value) => {
    const dkd_child_value = dkd_node_value[dkd_child_key_value];

    if (Array.isArray(dkd_child_value)) {
      dkd_child_value.forEach((dkd_nested_value) => dkd_scrub_foreground_service_type_value(dkd_nested_value));
      return;
    }

    if (dkd_child_value && typeof dkd_child_value === 'object') {
      dkd_scrub_foreground_service_type_value(dkd_child_value);
    }
  });
}

function dkd_scrub_android_application_service_list_value(dkd_manifest_value) {
  const dkd_application_list_value = dkd_manifest_value?.manifest?.application;

  if (!Array.isArray(dkd_application_list_value)) {
    return;
  }

  dkd_application_list_value.forEach((dkd_application_value) => {
    const dkd_service_list_value = Array.isArray(dkd_application_value.service)
      ? dkd_application_value.service
      : [];

    const dkd_filtered_service_list_value = dkd_service_list_value.filter(
      (dkd_service_entry_value) => !dkd_manifest_service_is_blocked_value(dkd_service_entry_value)
    );

    if (!dkd_service_marker_exists_value(
      dkd_filtered_service_list_value,
      dkd_expo_location_task_service_name_value()
    )) {
      dkd_filtered_service_list_value.push(
        dkd_service_remove_marker_value(dkd_expo_location_task_service_name_value())
      );
    }

    dkd_application_value.service = dkd_filtered_service_list_value;
  });
}

function dkd_apply_android_policy_safety_plugin(dkd_config_value) {
  const dkd_config_without_public_permission_leaks_value =
    dkd_scrub_expo_public_android_permissions_value(dkd_config_value);

  return dkd_with_android_manifest_value(
    dkd_config_without_public_permission_leaks_value,
    (dkd_config_with_manifest_value) => {
      const dkd_manifest_value = dkd_config_with_manifest_value.modResults;
      const dkd_forbidden_set_value = dkd_forbidden_android_permission_set_value();
      const dkd_forbidden_permission_list_value = dkd_forbidden_android_permission_list_value();

      dkd_ensure_android_tools_namespace_value(dkd_manifest_value);

      dkd_manifest_value.manifest['uses-permission'] = dkd_filter_manifest_permission_list_value(
        dkd_manifest_value.manifest['uses-permission'],
        dkd_forbidden_set_value
      );

      dkd_manifest_value.manifest['uses-permission-sdk-23'] = dkd_filter_manifest_permission_list_value(
        dkd_manifest_value.manifest['uses-permission-sdk-23'],
        dkd_forbidden_set_value
      );

      dkd_manifest_value.manifest['uses-permission-sdk-m'] = dkd_filter_manifest_permission_list_value(
        dkd_manifest_value.manifest['uses-permission-sdk-m'],
        dkd_forbidden_set_value
      );

      dkd_ensure_permission_remove_markers_value(
        dkd_manifest_value,
        dkd_forbidden_permission_list_value
      );

      dkd_scrub_android_application_service_list_value(dkd_manifest_value);
      dkd_scrub_foreground_service_type_value(dkd_manifest_value.manifest);

      return dkd_config_with_manifest_value;
    }
  );
}

module.exports = dkd_apply_android_policy_safety_plugin;
