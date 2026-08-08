import { supabase } from '../lib/supabase';

function dkd_rows_value(dkd_value) {
  return Array.isArray(dkd_value) ? dkd_value : [];
}

function dkd_money_value(dkd_row_value = {}) {
  const dkd_discount_value = dkd_row_value?.discounted_price_amount;
  const dkd_regular_value = dkd_row_value?.price_amount;
  const dkd_selected_value = dkd_discount_value != null ? dkd_discount_value : dkd_regular_value;
  const dkd_number_value = Number(dkd_selected_value || 0);
  return Number.isFinite(dkd_number_value) ? dkd_number_value : 0;
}

function dkd_normalize_product_value(dkd_row_value = {}) {
  const dkd_business_value = dkd_row_value?.dkd_businesses || {};
  const dkd_price_value = dkd_money_value(dkd_row_value);
  return {
    ...dkd_row_value,
    title: dkd_row_value?.name || dkd_row_value?.title || 'Ürün',
    name: dkd_row_value?.name || dkd_row_value?.title || 'Ürün',
    price_cash: dkd_price_value,
    product_price_tl: dkd_price_value,
    stock: Number(dkd_row_value?.stock_quantity || 0),
    business_name: dkd_row_value?.business_name || dkd_business_value?.name || 'İşletme',
    business_category: dkd_row_value?.business_category || dkd_business_value?.category || null,
    business_address_text: dkd_row_value?.business_address_text || dkd_business_value?.address_text || '',
    business_lat: dkd_row_value?.business_lat == null ? (dkd_business_value?.lat == null ? null : Number(dkd_business_value.lat)) : Number(dkd_row_value.business_lat),
    business_lng: dkd_row_value?.business_lng == null ? (dkd_business_value?.lng == null ? null : Number(dkd_business_value.lng)) : Number(dkd_row_value.business_lng),
    delivery_fee_tl: 0,
  };
}

export async function fetchMerchantBusinessProducts(businessId) {
  if (!businessId) return [];
  const { data, error } = await supabase
    .from('dkd_business_market_products')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return dkd_rows_value(data).map(dkd_normalize_product_value);
}

export async function fetchMerchantBusinessOrders(businessId) {
  if (!businessId) return [];
  const { data, error } = await supabase
    .from('dkd_business_product_orders')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) throw error;
  return dkd_rows_value(data);
}

export async function upsertMerchantBusinessProduct(input = {}) {
  const dkd_price_value = Number(input?.priceAmount ?? input?.priceCash ?? 0);
  const dkd_discount_value = input?.discountedPriceAmount == null || input?.discountedPriceAmount === '' ? null : Number(input.discountedPriceAmount);
  const { data, error } = await supabase.rpc('dkd_business_market_product_upsert', {
    dkd_param_product_id: input?.id || null,
    dkd_param_business_id: input?.businessId,
    dkd_param_name: String(input?.name || input?.title || '').trim(),
    dkd_param_description: String(input?.description || '').trim() || null,
    dkd_param_category: String(input?.category || 'genel').trim() || 'genel',
    dkd_param_image_url: String(input?.imageUrl || '').trim() || null,
    dkd_param_price_amount: Number.isFinite(dkd_price_value) ? Math.max(0, dkd_price_value) : 0,
    dkd_param_discounted_price_amount: Number.isFinite(dkd_discount_value) ? Math.max(0, dkd_discount_value) : null,
    dkd_param_currency_code: String(input?.currencyCode || 'TRY').trim().toUpperCase() || 'TRY',
    dkd_param_stock_quantity: Math.max(0, Number(input?.stockQuantity ?? input?.stock ?? 0) || 0),
    dkd_param_sort_order: Math.max(0, Number(input?.sortOrder || 0) || 0),
    dkd_param_is_active: input?.isActive !== false,
    dkd_param_meta: input?.meta && typeof input.meta === 'object' ? input.meta : {},
  });
  if (error) throw error;
  return data;
}

export async function deleteMerchantBusinessProduct(productId, businessId) {
  const { data, error } = await supabase.rpc('dkd_business_market_product_archive', {
    dkd_param_product_id: productId,
    dkd_param_business_id: businessId,
  });
  if (error) throw error;
  return data;
}

export async function fetchBusinessMarketCatalog() {
  const { data, error } = await supabase
    .from('dkd_business_market_products')
    .select('*, dkd_businesses(name,category,address_text,lat,lng)')
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });
  if (error) return { data: [], error };
  return { data: dkd_rows_value(data).map(dkd_normalize_product_value), error: null };
}
