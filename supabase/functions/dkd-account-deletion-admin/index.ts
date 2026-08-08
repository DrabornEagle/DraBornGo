import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const dkd_cors_headers_value = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function dkd_json_response_value(dkd_body_value: unknown, dkd_status_value = 200) {
  return new Response(JSON.stringify(dkd_body_value), {
    status: dkd_status_value,
    headers: dkd_cors_headers_value,
  });
}

Deno.serve(async (dkd_request_value: Request) => {
  if (dkd_request_value.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: dkd_cors_headers_value });
  }
  if (dkd_request_value.method !== 'POST') {
    return dkd_json_response_value({ dkd_ok_value: false, dkd_reason_value: 'dkd_method_not_allowed' }, 405);
  }

  const dkd_auth_header_value = String(dkd_request_value.headers.get('Authorization') || '').trim();
  const dkd_access_token_value = dkd_auth_header_value.replace(/^Bearer\s+/i, '').trim();
  if (!dkd_access_token_value) {
    return dkd_json_response_value({ dkd_ok_value: false, dkd_reason_value: 'dkd_auth_required' }, 401);
  }

  const dkd_supabase_url_value = Deno.env.get('SUPABASE_URL') || '';
  const dkd_anon_key_value = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const dkd_service_role_key_value = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!dkd_supabase_url_value || !dkd_anon_key_value || !dkd_service_role_key_value) {
    return dkd_json_response_value({ dkd_ok_value: false, dkd_reason_value: 'dkd_server_config_missing' }, 500);
  }

  const dkd_user_client_value = createClient(dkd_supabase_url_value, dkd_anon_key_value, {
    global: { headers: { Authorization: dkd_auth_header_value } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const dkd_service_client_value = createClient(dkd_supabase_url_value, dkd_service_role_key_value, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const dkd_auth_user_response_value = await dkd_service_client_value.auth.getUser(dkd_access_token_value);
  const dkd_admin_user_id_value = String(dkd_auth_user_response_value?.data?.user?.id || '').trim();
  if (dkd_auth_user_response_value.error || !dkd_admin_user_id_value) {
    return dkd_json_response_value({ dkd_ok_value: false, dkd_reason_value: 'dkd_auth_invalid' }, 401);
  }

  const dkd_admin_response_value = await dkd_service_client_value
    .from('dkd_admin_users')
    .select('user_id,role_key')
    .eq('user_id', dkd_admin_user_id_value)
    .maybeSingle();
  if (dkd_admin_response_value.error || !dkd_admin_response_value.data?.user_id) {
    return dkd_json_response_value({ dkd_ok_value: false, dkd_reason_value: 'dkd_admin_required' }, 403);
  }

  let dkd_request_body_value: Record<string, unknown> = {};
  try {
    dkd_request_body_value = await dkd_request_value.json();
  } catch {
    dkd_request_body_value = {};
  }

  const dkd_request_id_value = String(dkd_request_body_value?.dkd_request_id_value || '').trim();
  const dkd_admin_note_value = String(dkd_request_body_value?.dkd_admin_note_value || '').trim();
  if (!dkd_request_id_value) {
    return dkd_json_response_value({ dkd_ok_value: false, dkd_reason_value: 'dkd_request_id_missing' }, 400);
  }

  const dkd_manifest_response_value = await dkd_user_client_value.rpc('dkd_admin_account_deletion_storage_manifest', {
    dkd_param_request_id_value: dkd_request_id_value,
  });
  if (dkd_manifest_response_value.error) {
    return dkd_json_response_value({
      dkd_ok_value: false,
      dkd_reason_value: 'dkd_manifest_failed',
      dkd_error_value: dkd_manifest_response_value.error.message,
    }, 400);
  }

  const dkd_manifest_value = dkd_manifest_response_value.data || {};
  const dkd_object_values = Array.isArray(dkd_manifest_value?.dkd_objects_value)
    ? dkd_manifest_value.dkd_objects_value
    : [];
  const dkd_bucket_map_value = new Map<string, string[]>();

  for (const dkd_object_value of dkd_object_values) {
    const dkd_bucket_id_value = String(dkd_object_value?.dkd_bucket_id_value || '').trim();
    const dkd_object_name_value = String(dkd_object_value?.dkd_object_name_value || '').trim();
    if (!dkd_bucket_id_value || !dkd_object_name_value) continue;
    const dkd_bucket_paths_value = dkd_bucket_map_value.get(dkd_bucket_id_value) || [];
    dkd_bucket_paths_value.push(dkd_object_name_value);
    dkd_bucket_map_value.set(dkd_bucket_id_value, dkd_bucket_paths_value);
  }

  let dkd_deleted_storage_object_count_value = 0;
  for (const [dkd_bucket_id_value, dkd_bucket_paths_value] of dkd_bucket_map_value.entries()) {
    for (let dkd_index_value = 0; dkd_index_value < dkd_bucket_paths_value.length; dkd_index_value += 100) {
      const dkd_path_chunk_value = dkd_bucket_paths_value.slice(dkd_index_value, dkd_index_value + 100);
      const dkd_remove_response_value = await dkd_service_client_value.storage
        .from(dkd_bucket_id_value)
        .remove(dkd_path_chunk_value);
      if (dkd_remove_response_value.error) {
        return dkd_json_response_value({
          dkd_ok_value: false,
          dkd_reason_value: 'dkd_storage_cleanup_failed',
          dkd_bucket_id_value,
          dkd_error_value: dkd_remove_response_value.error.message,
        }, 500);
      }
      dkd_deleted_storage_object_count_value += dkd_path_chunk_value.length;
    }
  }

  const dkd_finalize_response_value = await dkd_user_client_value.rpc('dkd_admin_approve_account_deletion', {
    dkd_param_request_id_value: dkd_request_id_value,
    dkd_param_admin_note_value: dkd_admin_note_value || 'Admin onayıyla hesap, ilişkili veriler ve Storage dosyaları silindi.',
  });
  if (dkd_finalize_response_value.error) {
    return dkd_json_response_value({
      dkd_ok_value: false,
      dkd_reason_value: 'dkd_finalize_failed',
      dkd_error_value: dkd_finalize_response_value.error.message,
    }, 500);
  }

  return dkd_json_response_value({
    dkd_ok_value: true,
    dkd_deleted_storage_object_count_value,
    dkd_result_value: dkd_finalize_response_value.data || null,
  });
});
