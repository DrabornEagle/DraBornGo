begin;

drop table if exists public.dkd_sms_otp_requests cascade;

alter table public.dkd_profiles
  drop column if exists dkd_puan,
  drop column if exists shards,
  drop column if exists boss_tickets,
  drop column if exists energy,
  drop column if exists energy_max,
  drop column if exists energy_updated_at,
  drop column if exists task_state,
  drop column if exists boss_state,
  drop column if exists weekly_task_state,
  drop column if exists daily_reward_state,
  drop column if exists xp,
  drop column if exists level,
  drop column if exists rank_key,
  drop column if exists wallet_tl,
  drop column if exists courier_wallet_tl,
  drop column if exists merchant_wallet_tl,
  drop column if exists courier_total_earned_tl,
  drop column if exists courier_withdrawn_tl;

commit;
