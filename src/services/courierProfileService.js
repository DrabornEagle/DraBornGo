import { supabase } from '../lib/supabase';
export async function fetchCourierProfile(){
  const dkd_auth_value=await supabase.auth.getUser();
  const dkd_user_id_value=dkd_auth_value?.data?.user?.id;
  if(!dkd_user_id_value)return {data:null,error:new Error('session_required')};
  return supabase.from('dkd_profiles').select('user_id,nickname,avatar_emoji,avatar_image_url,courier_status,courier_completed_jobs,courier_cancelled_jobs,courier_active_days,courier_last_completed_at,courier_fastest_eta_min,courier_city,courier_zone,courier_vehicle_type,courier_profile_meta,dkd_country,dkd_city,dkd_region,dkd_courier_online').eq('user_id',dkd_user_id_value).maybeSingle();
}
export async function fetchCourierJobHistory(dkd_limit_value=40){
  const dkd_auth_value=await supabase.auth.getUser();
  const dkd_user_id_value=dkd_auth_value?.data?.user?.id;
  if(!dkd_user_id_value)return {data:[],error:new Error('session_required')};
  const dkd_limit_number_value=Math.min(100,Math.max(1,Number(dkd_limit_value||40)));
  const dkd_result_value=await supabase.from('dkd_courier_jobs').select('*').eq('assigned_user_id',dkd_user_id_value).order('created_at',{ascending:false}).limit(dkd_limit_number_value);
  return {data:Array.isArray(dkd_result_value?.data)?dkd_result_value.data:[],error:dkd_result_value?.error||null};
}
