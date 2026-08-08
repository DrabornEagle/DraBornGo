-- DraBornGo v0.0.11
-- Keep the courier profile locked in SİPARİŞTE while an assigned delivery is active.

create or replace function public.dkd_courier_job_sync_busy_profile_dkd()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  dkd_status_value text := lower(coalesce(new.status, ''));
  dkd_pickup_status_value text := lower(coalesce(new.pickup_status, ''));
begin
  if new.assigned_user_id is not null
     and coalesce(new.is_active, true) = true
     and dkd_status_value in ('accepted', 'assigned', 'to_business', 'picked_up', 'to_customer', 'delivering')
     and dkd_pickup_status_value not in ('delivered', 'cancelled', 'canceled') then
    update public.dkd_profiles
    set dkd_courier_online = false,
        dkd_courier_auto_assigned_job_id = new.id,
        dkd_courier_last_online_at = now()
    where user_id = new.assigned_user_id;
  elsif new.assigned_user_id is not null
        and (
          coalesce(new.is_active, true) = false
          or dkd_status_value in ('completed', 'delivered', 'cancelled', 'canceled')
          or dkd_pickup_status_value in ('delivered', 'cancelled', 'canceled')
        ) then
    update public.dkd_profiles
    set dkd_courier_online = false,
        dkd_courier_auto_assigned_job_id = null,
        dkd_courier_last_online_at = now()
    where user_id = new.assigned_user_id
      and (dkd_courier_auto_assigned_job_id is null or dkd_courier_auto_assigned_job_id = new.id);
  end if;
  return new;
end;
$function$;

drop trigger if exists dkd_courier_jobs_sync_busy_profile_trigger_dkd on public.dkd_courier_jobs;
create trigger dkd_courier_jobs_sync_busy_profile_trigger_dkd
after insert or update of status, pickup_status, assigned_user_id, is_active
on public.dkd_courier_jobs
for each row
execute function public.dkd_courier_job_sync_busy_profile_dkd();
