import { dkd_supabase_runtime_config, supabase } from '../lib/supabase';

const dkd_policy_center_table_name_value = 'dkd_policy_center_config';
const dkd_policy_center_select_value = 'dkd_privacy_policy_doc_url_value, dkd_account_deletion_form_url_value, dkd_package_name_value, dkd_version_name_value, dkd_version_code_value';

function dkd_clean_policy_text_value(dkd_source_value) {
  return String(dkd_source_value || '').trim();
}

function dkd_clean_policy_version_code_value(dkd_source_value) {
  const dkd_numeric_value = Number(dkd_source_value);
  return Number.isFinite(dkd_numeric_value) ? Math.max(1, Math.trunc(dkd_numeric_value)) : 1;
}

export async function dkd_fetch_policy_center_config_value() {
  if (!dkd_supabase_runtime_config.dkd_is_ready) {
    return { dkd_data_value: null, dkd_error_value: null };
  }

  const dkd_response_value = await supabase
    .from(dkd_policy_center_table_name_value)
    .select(dkd_policy_center_select_value)
    .eq('dkd_id_value', 1)
    .maybeSingle();

  if (dkd_response_value?.error) {
    return { dkd_data_value: null, dkd_error_value: dkd_response_value.error };
  }

  return { dkd_data_value: dkd_response_value?.data || null, dkd_error_value: null };
}

export async function dkd_save_policy_center_config_value(dkd_input_value = {}) {
  if (!dkd_supabase_runtime_config.dkd_is_ready) {
    return { dkd_data_value: null, dkd_error_value: null, dkd_local_only_value: true };
  }

  const dkd_payload_value = {
    dkd_id_value: 1,
    dkd_privacy_policy_doc_url_value: dkd_clean_policy_text_value(dkd_input_value.dkd_privacy_policy_doc_url_value),
    dkd_account_deletion_form_url_value: dkd_clean_policy_text_value(dkd_input_value.dkd_account_deletion_form_url_value),
    dkd_package_name_value: dkd_clean_policy_text_value(dkd_input_value.dkd_package_name_value || 'com.draborneagle.draborngo'),
    dkd_version_name_value: dkd_clean_policy_text_value(dkd_input_value.dkd_version_name_value || 'v0.0.5'),
    dkd_version_code_value: dkd_clean_policy_version_code_value(dkd_input_value.dkd_version_code_value || 4),
    dkd_updated_at_value: new Date().toISOString(),
  };

  const dkd_response_value = await supabase
    .from(dkd_policy_center_table_name_value)
    .upsert(dkd_payload_value, { onConflict: 'dkd_id_value' })
    .select(dkd_policy_center_select_value)
    .maybeSingle();

  if (dkd_response_value?.error) {
    return { dkd_data_value: null, dkd_error_value: dkd_response_value.error, dkd_local_only_value: true };
  }

  return { dkd_data_value: dkd_response_value?.data || dkd_payload_value, dkd_error_value: null, dkd_local_only_value: false };
}
