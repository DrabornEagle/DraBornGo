import { supabase } from '../lib/supabase';

function dkd_to_number_or_null(dkd_value) {
  const dkd_numeric_value = Number(dkd_value);
  return Number.isFinite(dkd_numeric_value) ? dkd_numeric_value : null;
}

export async function dkd_upsert_courier_live_location(dkd_input_value) {
  const dkd_payload_value = {
    dkd_param_lat: dkd_to_number_or_null(dkd_input_value?.dkd_lat),
    dkd_param_lng: dkd_to_number_or_null(dkd_input_value?.dkd_lng),
    dkd_param_eta_min: dkd_to_number_or_null(dkd_input_value?.dkd_eta_min),
    dkd_param_heading_deg: dkd_to_number_or_null(dkd_input_value?.dkd_heading_deg),
    dkd_param_plate_no: String(dkd_input_value?.dkd_plate_no || '').trim().toUpperCase() || null,
    dkd_param_vehicle_type: String(dkd_input_value?.dkd_vehicle_type || '').trim().toLowerCase() || null,
  };

  const dkd_rpc_result_value = await supabase.rpc('dkd_courier_location_ping', dkd_payload_value);
  if (!dkd_rpc_result_value?.error) return dkd_rpc_result_value;

  const dkd_user_result_value = await supabase.auth.getUser();
  const dkd_user_id_value = dkd_user_result_value?.data?.user?.id || null;
  if (!dkd_user_id_value) return dkd_rpc_result_value;

  const dkd_upsert_result_value = await supabase.from('dkd_courier_live_locations').upsert({
    courier_user_id: dkd_user_id_value,
    lat: dkd_payload_value.dkd_param_lat,
    lng: dkd_payload_value.dkd_param_lng,
    eta_min: dkd_payload_value.dkd_param_eta_min,
    heading_deg: dkd_payload_value.dkd_param_heading_deg,
    plate_no: dkd_payload_value.dkd_param_plate_no,
    vehicle_type: dkd_payload_value.dkd_param_vehicle_type,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'courier_user_id' });

  if (dkd_upsert_result_value?.error) return dkd_rpc_result_value;
  return { data: { ok: true }, error: null };
}
