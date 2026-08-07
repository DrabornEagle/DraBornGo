import { dkd_generated_public_env_value } from './dkd_public_env.generated';

function dkd_clean_public_value(dkd_value) {
  return String(dkd_value || '').trim();
}

export function dkd_public_env_value(dkd_key_name_value) {
  let dkd_runtime_value = '';
  try {
    dkd_runtime_value = dkd_clean_public_value(process?.env?.[dkd_key_name_value]);
  } catch {
    dkd_runtime_value = '';
  }
  return dkd_runtime_value || dkd_clean_public_value(dkd_generated_public_env_value?.[dkd_key_name_value]);
}
