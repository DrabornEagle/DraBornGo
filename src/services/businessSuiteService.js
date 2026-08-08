import { supabase } from '../lib/supabase';

function dkd_rows_value(dkd_value) {
  return Array.isArray(dkd_value) ? dkd_value : [];
}

export async function fetchBusinesses() {
  const { data, error } = await supabase
    .from('dkd_businesses')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return dkd_rows_value(data);
}

export async function fetchMyBusinessMemberships() {
  const dkd_auth_value = await supabase.auth.getUser();
  const dkd_user_id_value = dkd_auth_value?.data?.user?.id;
  if (!dkd_user_id_value) return [];
  const { data, error } = await supabase
    .from('dkd_business_memberships')
    .select('id,business_id,user_id,role_key,is_active,created_at,updated_at,dkd_businesses(*)')
    .eq('user_id', dkd_user_id_value)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return dkd_rows_value(data);
}

export async function claimBusinessAccessCode(dkd_access_code_value) {
  const { data, error } = await supabase.rpc('dkd_business_claim_access_code', {
    dkd_param_access_code: String(dkd_access_code_value || '').trim(),
  });
  if (error) throw error;
  return data;
}

export async function createBusinessAccessCode({ businessId, roleKey = 'staff', label = null }) {
  const { data, error } = await supabase.rpc('dkd_business_create_access_code', {
    dkd_param_business_id: businessId,
    dkd_param_role_key: String(roleKey || 'staff'),
    dkd_param_label: String(label || '').trim() || null,
  });
  if (error) throw error;
  return data;
}

export async function fetchBusinessDashboard(businessId) {
  if (!businessId) return { products: [], orders: [] };
  const [dkd_products_value, dkd_orders_value] = await Promise.all([
    supabase.from('dkd_business_market_products').select('*').eq('business_id', businessId).order('sort_order', { ascending: true }).order('updated_at', { ascending: false }),
    supabase.from('dkd_business_product_orders').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(80),
  ]);
  if (dkd_products_value?.error) throw dkd_products_value.error;
  if (dkd_orders_value?.error) throw dkd_orders_value.error;
  return { products: dkd_rows_value(dkd_products_value?.data), orders: dkd_rows_value(dkd_orders_value?.data) };
}

export async function upsertBusiness(input = {}) {
  const dkd_payload_value = {
    ...(input?.id ? { id: input.id } : {}),
    slug: String(input?.slug || input?.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    name: String(input?.name || '').trim(),
    category: String(input?.category || 'genel').trim() || 'genel',
    city: String(input?.city || '').trim() || null,
    district: String(input?.district || '').trim() || null,
    address_text: String(input?.addressText || input?.address_text || '').trim() || null,
    is_active: input?.isActive !== false,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('dkd_businesses').upsert(dkd_payload_value).select('*').single();
  if (error) throw error;
  return data;
}
