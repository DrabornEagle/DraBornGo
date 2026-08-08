-- DraBornGo v0.0.6
-- Remove SECURITY DEFINER view behavior and place exposed market table behind RLS
-- without changing its current authenticated read behavior.

alter view public.dkd_support_admin_queue set (security_invoker = true);

alter table public.dkd_business_market_products enable row level security;

drop policy if exists dkd_business_market_products_select_authenticated on public.dkd_business_market_products;
create policy dkd_business_market_products_select_authenticated
on public.dkd_business_market_products
for select
to authenticated
using (true);
