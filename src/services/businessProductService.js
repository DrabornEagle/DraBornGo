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

function dkd_normalize_service_network_product_value(dkd_row_value = {}) {
  const dkd_provider_value = dkd_row_value?.dkd_businesses || {};
  const dkd_price_value = dkd_money_value(dkd_row_value);
  return {
    ...dkd_row_value,
    title: dkd_row_value?.name || dkd_row_value?.title || 'Ürün',
    name: dkd_row_value?.name || dkd_row_value?.title || 'Ürün',
    price_cash: dkd_price_value,
    product_price_tl: dkd_price_value,
    stock: Number(dkd_row_value?.stock_quantity || 0),
    business_name: dkd_row_value?.business_name || dkd_provider_value?.name || 'Hizmet Noktası',
    business_category: dkd_row_value?.business_category || dkd_provider_value?.category || null,
    business_address_text: dkd_row_value?.business_address_text || dkd_provider_value?.address_text || '',
    business_lat: dkd_row_value?.business_lat == null ? (dkd_provider_value?.lat == null ? null : Number(dkd_provider_value.lat)) : Number(dkd_row_value.business_lat),
    business_lng: dkd_row_value?.business_lng == null ? (dkd_provider_value?.lng == null ? null : Number(dkd_provider_value.lng)) : Number(dkd_row_value.business_lng),
    delivery_fee_tl: 0,
  };
}

// v0.0.9: Business Panel yönetim/CRUD API'leri kaldırıldı.
// Bu servis yalnız müşteri tarafındaki Hizmet Ağı katalog okumasını korur.
export async function fetchBusinessMarketCatalog() {
  const { data, error } = await supabase
    .from('dkd_business_market_products')
    .select('*, dkd_businesses(name,category,address_text,lat,lng)')
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });

  if (error) return { data: [], error };
  return {
    data: dkd_rows_value(data).map(dkd_normalize_service_network_product_value),
    error: null,
  };
}
