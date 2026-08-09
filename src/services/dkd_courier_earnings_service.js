import { supabase } from '../lib/supabase';

export async function dkd_fetch_courier_earnings_summary_value(dkd_user_id_value = null) {
  const dkd_result_value = await supabase.rpc('dkd_courier_earnings_summary_dkd', {
    dkd_param_user_id: dkd_user_id_value || null,
  });
  return {
    data: dkd_result_value?.data || {},
    error: dkd_result_value?.error || null,
  };
}

export function dkd_format_work_duration_value(dkd_seconds_value) {
  const dkd_seconds_number_value = Math.max(0, Number(dkd_seconds_value || 0));
  const dkd_hours_value = Math.floor(dkd_seconds_number_value / 3600);
  const dkd_minutes_value = Math.floor((dkd_seconds_number_value % 3600) / 60);
  if (dkd_hours_value <= 0) return `${dkd_minutes_value} dk`;
  return `${dkd_hours_value} sa ${dkd_minutes_value} dk`;
}

export function dkd_format_earnings_money_value(dkd_value) {
  const dkd_number_value = Number(dkd_value || 0);
  return `${(Number.isFinite(dkd_number_value) ? dkd_number_value : 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}
