import dkd_expo_constants_module from 'expo-constants';
import { dkd_generated_public_env_value } from './dkd_public_env.generated';

function dkd_object_value(dkd_candidate_value) {
  return dkd_candidate_value && typeof dkd_candidate_value === 'object' ? dkd_candidate_value : {};
}

function dkd_text_value(dkd_candidate_value) {
  return String(dkd_candidate_value || '').trim();
}

function dkd_runtime_process_env_value(dkd_key_name_value) {
  try {
    const dkd_process_value = typeof process !== 'undefined' ? process : undefined;
    return dkd_text_value(dkd_process_value?.env?.[dkd_key_name_value]);
  } catch (dkd_runtime_env_error_value) {
    void dkd_runtime_env_error_value;
    return '';
  }
}

const dkd_expo_config_extra_value = dkd_object_value(
  dkd_expo_constants_module?.expoConfig?.extra
  || dkd_expo_constants_module?.manifest?.extra
  || dkd_expo_constants_module?.manifest2?.extra
);

const dkd_public_env_extra_value = dkd_object_value(dkd_expo_config_extra_value.dkd_public_env);
const dkd_generated_public_config_value = dkd_object_value(dkd_generated_public_env_value);

export function dkd_public_env_value(dkd_key_name_value) {
  const dkd_process_env_value = dkd_runtime_process_env_value(dkd_key_name_value);
  const dkd_generated_env_value = dkd_text_value(dkd_generated_public_config_value[dkd_key_name_value]);
  const dkd_extra_direct_value = dkd_text_value(dkd_expo_config_extra_value[dkd_key_name_value]);
  const dkd_extra_nested_value = dkd_text_value(dkd_public_env_extra_value[dkd_key_name_value]);

  return dkd_process_env_value
    || dkd_generated_env_value
    || dkd_extra_direct_value
    || dkd_extra_nested_value
    || '';
}

export function dkd_public_env_ready_value(dkd_key_name_values) {
  return dkd_key_name_values.every((dkd_key_name_value) => Boolean(dkd_public_env_value(dkd_key_name_value)));
}
