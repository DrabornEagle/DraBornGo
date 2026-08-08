-- DraBornGo v0.0.6
-- Restore the profile runtime columns already expected by the mobile source.
-- Forward-only and non-destructive: existing identity/avatar/courier data is preserved.

begin;

alter table if exists public.dkd_profiles
  add column if not exists dkd_puan integer not null default 0,
  add column if not exists shards integer not null default 0,
  add column if not exists boss_tickets integer not null default 0,
  add column if not exists energy integer not null default 10,
  add column if not exists energy_max integer not null default 10,
  add column if not exists energy_updated_at timestamptz not null default now(),
  add column if not exists task_state jsonb not null default '{}'::jsonb,
  add column if not exists boss_state jsonb not null default '{}'::jsonb,
  add column if not exists weekly_task_state jsonb not null default '{}'::jsonb,
  add column if not exists daily_reward_state jsonb not null default '{}'::jsonb,
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1,
  add column if not exists rank_key text not null default 'rookie',
  add column if not exists wallet_tl numeric(12,2) not null default 0,
  add column if not exists courier_score integer not null default 0,
  add column if not exists courier_wallet_tl numeric(12,2) not null default 0,
  add column if not exists merchant_wallet_tl numeric(12,2) not null default 0,
  add column if not exists courier_total_earned_tl numeric(12,2) not null default 0,
  add column if not exists courier_withdrawn_tl numeric(12,2) not null default 0;

update public.dkd_profiles
set
  energy = greatest(0, least(coalesce(energy, 10), 10)),
  energy_max = greatest(1, least(coalesce(energy_max, 10), 10)),
  level = greatest(1, coalesce(level, 1)),
  rank_key = coalesce(nullif(trim(rank_key), ''), 'rookie'),
  task_state = coalesce(task_state, '{}'::jsonb),
  boss_state = coalesce(boss_state, '{}'::jsonb),
  weekly_task_state = coalesce(weekly_task_state, '{}'::jsonb),
  daily_reward_state = coalesce(daily_reward_state, '{}'::jsonb)
where true;

commit;
