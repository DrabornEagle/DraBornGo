import { dkd_supabase_runtime_config, supabase } from '../lib/supabase';

const dkd_account_deletion_table_name_value = 'dkd_account_deletion_requests';
const dkd_account_deletion_select_value = 'dkd_id_value, dkd_user_id_value, dkd_user_email_value, dkd_display_name_value, dkd_request_note_value, dkd_status_value, dkd_admin_note_value, dkd_requested_at_value, dkd_reviewed_at_value, dkd_reviewed_by_value, dkd_deleted_at_value';

function dkd_clean_text_value(dkd_source_value) {
  return String(dkd_source_value || '').trim();
}

function dkd_is_missing_relation_value(dkd_error_value) {
  const dkd_message_value = String(dkd_error_value?.message || dkd_error_value?.details || '').toLowerCase();
  return dkd_message_value.includes('does not exist') || dkd_message_value.includes('schema cache') || dkd_message_value.includes('could not find');
}

async function dkd_resolve_account_deletion_identity_value(dkd_input_value = {}) {
  const dkd_input_user_id_value = dkd_clean_text_value(dkd_input_value?.dkd_user_id_value || dkd_input_value);
  const dkd_input_email_value = dkd_clean_text_value(dkd_input_value?.dkd_user_email_value);
  let dkd_auth_user_value = null;

  if (dkd_supabase_runtime_config.dkd_is_ready) {
    try {
      const dkd_auth_response_value = await supabase.auth.getUser();
      dkd_auth_user_value = dkd_auth_response_value?.data?.user || null;
    } catch {
      dkd_auth_user_value = null;
    }
  }

  const dkd_auth_user_id_value = dkd_clean_text_value(dkd_auth_user_value?.id);
  const dkd_auth_email_value = dkd_clean_text_value(dkd_auth_user_value?.email);

  return {
    dkd_user_id_value: dkd_auth_user_id_value || dkd_input_user_id_value,
    dkd_user_email_value: dkd_auth_email_value || dkd_input_email_value,
  };
}

export async function dkd_fetch_my_account_deletion_request_value(dkd_input_value = {}) {
  if (!dkd_supabase_runtime_config.dkd_is_ready) return { dkd_data_value: null, dkd_error_value: null };

  const dkd_identity_value = await dkd_resolve_account_deletion_identity_value(dkd_input_value);
  const dkd_user_id_text_value = dkd_clean_text_value(dkd_identity_value.dkd_user_id_value);
  if (!dkd_user_id_text_value) return { dkd_data_value: null, dkd_error_value: null };

  const dkd_rpc_response_value = await supabase.rpc('dkd_my_account_deletion_request');
  if (!dkd_rpc_response_value?.error) {
    const dkd_rpc_rows_value = Array.isArray(dkd_rpc_response_value?.data)
      ? dkd_rpc_response_value.data
      : dkd_rpc_response_value?.data
        ? [dkd_rpc_response_value.data]
        : [];
    return { dkd_data_value: dkd_rpc_rows_value?.[0] || null, dkd_error_value: null };
  }

  if (!dkd_is_missing_relation_value(dkd_rpc_response_value.error)) {
    return { dkd_data_value: null, dkd_error_value: dkd_rpc_response_value.error };
  }

  const dkd_response_value = await supabase
    .from(dkd_account_deletion_table_name_value)
    .select(dkd_account_deletion_select_value)
    .eq('dkd_user_id_value', dkd_user_id_text_value)
    .in('dkd_status_value', ['pending', 'approved', 'rejected'])
    .order('dkd_requested_at_value', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dkd_response_value?.error) {
    if (dkd_is_missing_relation_value(dkd_response_value.error)) return { dkd_data_value: null, dkd_error_value: null, dkd_sql_missing_value: true };
    return { dkd_data_value: null, dkd_error_value: dkd_response_value.error };
  }

  return { dkd_data_value: dkd_response_value?.data || null, dkd_error_value: null };
}

export async function dkd_submit_account_deletion_request_value(dkd_input_value = {}) {
  if (!dkd_supabase_runtime_config.dkd_is_ready) return { dkd_data_value: null, dkd_error_value: new Error('supabase_not_ready') };

  const dkd_identity_value = await dkd_resolve_account_deletion_identity_value(dkd_input_value);
  const dkd_user_id_text_value = dkd_clean_text_value(dkd_identity_value.dkd_user_id_value);
  if (!dkd_user_id_text_value) return { dkd_data_value: null, dkd_error_value: new Error('user_id_missing') };

  const dkd_rpc_response_value = await supabase.rpc('dkd_request_account_deletion', {
    dkd_param_user_id_value: dkd_user_id_text_value,
    dkd_param_request_note_value: dkd_clean_text_value(dkd_input_value.dkd_request_note_value) || 'Profil sayfasından hesap ve veri silme talebi oluşturuldu.',
    dkd_param_user_email_value: dkd_clean_text_value(dkd_identity_value.dkd_user_email_value || dkd_input_value.dkd_user_email_value),
    dkd_param_display_name_value: dkd_clean_text_value(dkd_input_value.dkd_display_name_value),
  });

  if (dkd_rpc_response_value?.error) {
    return { dkd_data_value: null, dkd_error_value: dkd_rpc_response_value.error };
  }

  return { dkd_data_value: dkd_rpc_response_value?.data || null, dkd_error_value: null };
}

export async function dkd_fetch_admin_account_deletion_requests_value() {
  if (!dkd_supabase_runtime_config.dkd_is_ready) return { dkd_data_value: [], dkd_error_value: null };

  const dkd_rpc_response_value = await supabase.rpc('dkd_admin_account_deletion_requests_list');
  if (!dkd_rpc_response_value?.error) {
    return { dkd_data_value: Array.isArray(dkd_rpc_response_value?.data) ? dkd_rpc_response_value.data : [], dkd_error_value: null };
  }

  if (!dkd_is_missing_relation_value(dkd_rpc_response_value.error)) {
    return { dkd_data_value: [], dkd_error_value: dkd_rpc_response_value.error };
  }

  const dkd_table_response_value = await supabase
    .from(dkd_account_deletion_table_name_value)
    .select(dkd_account_deletion_select_value)
    .order('dkd_requested_at_value', { ascending: false })
    .limit(100);

  if (dkd_table_response_value?.error) {
    return { dkd_data_value: [], dkd_error_value: dkd_table_response_value.error };
  }

  return { dkd_data_value: Array.isArray(dkd_table_response_value?.data) ? dkd_table_response_value.data : [], dkd_error_value: null };
}

export async function dkd_reject_account_deletion_request_value(dkd_input_value = {}) {
  const dkd_request_id_value = dkd_clean_text_value(dkd_input_value.dkd_request_id_value);
  if (!dkd_request_id_value) return { dkd_data_value: null, dkd_error_value: new Error('request_id_missing') };

  const dkd_response_value = await supabase.rpc('dkd_admin_reject_account_deletion', {
    dkd_param_request_id_value: dkd_request_id_value,
    dkd_param_admin_note_value: dkd_clean_text_value(dkd_input_value.dkd_admin_note_value) || 'Admin panelinden reddedildi.',
  });

  if (dkd_response_value?.error) return { dkd_data_value: null, dkd_error_value: dkd_response_value.error };
  return { dkd_data_value: dkd_response_value?.data || null, dkd_error_value: null };
}

export async function dkd_approve_account_deletion_request_value(dkd_input_value = {}) {
  const dkd_request_id_value = dkd_clean_text_value(dkd_input_value.dkd_request_id_value);
  if (!dkd_request_id_value) return { dkd_data_value: null, dkd_error_value: new Error('request_id_missing') };

  const dkd_response_value = await supabase.rpc('dkd_admin_approve_account_deletion', {
    dkd_param_request_id_value: dkd_request_id_value,
    dkd_param_admin_note_value: dkd_clean_text_value(dkd_input_value.dkd_admin_note_value) || 'Admin panelinden onaylandı ve kullanıcı verileri silindi.',
  });

  if (dkd_response_value?.error) return { dkd_data_value: null, dkd_error_value: dkd_response_value.error };
  return { dkd_data_value: dkd_response_value?.data || null, dkd_error_value: null };
}

export async function dkd_cancel_account_deletion_request_value(dkd_input_value = {}) {
  if (!dkd_supabase_runtime_config.dkd_is_ready) return { dkd_data_value: null, dkd_error_value: new Error('supabase_not_ready') };

  const dkd_identity_value = await dkd_resolve_account_deletion_identity_value(dkd_input_value);
  const dkd_user_id_text_value = dkd_clean_text_value(dkd_identity_value.dkd_user_id_value);
  if (!dkd_user_id_text_value) return { dkd_data_value: null, dkd_error_value: new Error('user_id_missing') };

  const dkd_response_value = await supabase.rpc('dkd_cancel_account_deletion_request', {
    dkd_param_user_id_value: dkd_user_id_text_value,
  });

  if (dkd_response_value?.error) return { dkd_data_value: null, dkd_error_value: dkd_response_value.error };
  return { dkd_data_value: dkd_response_value?.data || null, dkd_error_value: null };
}
