import { supabase } from '../lib/supabase';
export async function deleteAdminCourierJob(dkd_job_id_input_value){
  const dkd_job_id_value=Number(dkd_job_id_input_value);
  const dkd_payload_list_value=[{dkd_param_job_id:dkd_job_id_value},{dkd_job_id:dkd_job_id_value}];
  let dkd_last_result_value={data:null,error:null};
  for(const dkd_payload_value of dkd_payload_list_value){
    const dkd_result_value=await supabase.rpc('dkd_admin_courier_job_delete',dkd_payload_value);
    dkd_last_result_value=dkd_result_value;
    if(!dkd_result_value?.error)return dkd_result_value;
    const dkd_message_value=String(dkd_result_value?.error?.message||'').toLowerCase();
    if(!dkd_message_value.includes('schema cache')&&!dkd_message_value.includes('could not find the function'))return dkd_result_value;
  }
  return dkd_last_result_value;
}
