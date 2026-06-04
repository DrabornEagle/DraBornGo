import { supabase } from '../lib/supabase';
import { dkd_create_business_product_point_order, fetchBusinessMarketCatalog } from './businessProductService';

const SHOP_UI_SELECT = 'hero_kicker, hero_title, hero_subtitle, logic_title, logic_body, hero_icon_name, hero_icon_accent, hero_background_image_url, hero_visual_preset';
const SHOP_PACK_SELECT = 'id, pack_key, title, subtitle, description, badge_label, icon_name, accent_key, art_image_url, panel_style, background_tone, visual_preset, reward_kind, reward_amount, sort_order, is_active';

function functionMissing(error) {
  const dkd_message_value = String(error?.message || '').toLowerCase();
  return dkd_message_value.includes('could not find the function') || dkd_message_value.includes('schema cache');
}

function dkd_should_use_safe_shop_fallback(dkd_error_value) {
  const dkd_message_value = String(dkd_error_value?.message || '').toLowerCase();
  return functionMissing(dkd_error_value) || dkd_message_value.includes('price_puan') || dkd_message_value.includes('column') || dkd_message_value.includes('does not exist');
}

function dkd_reward_puan_from_row(dkd_row_value = {}) {
  return Number(dkd_row_value?.dkd_reward_puan ?? dkd_row_value?.point_price ?? dkd_row_value?.dkd_point_price ?? 0) || 0;
}

function dkd_normalize_reward_puan_row(dkd_row_value = {}) {
  return {
    ...dkd_row_value,
    dkd_reward_puan: dkd_reward_puan_from_row(dkd_row_value),
  };
}

function mapBusinessProductToShopPack(dkd_row_value) {
  return {
    id: `merchant-${dkd_row_value?.id}`,
    pack_key: `merchant_product:${dkd_row_value?.id}`,
    title: dkd_row_value?.title || 'İşletme Ürünü',
    subtitle: `${dkd_row_value?.business_name || 'İşletme'} • ${dkd_row_value?.category || dkd_row_value?.business_category || 'genel'}`,
    description: dkd_row_value?.description || 'İşletme marketinden kazanılmış puanla kullanılabilen fiziksel teslimat ürünü.',
    badge_label: dkd_row_value?.category || dkd_row_value?.business_category || 'işletme',
    icon_name: 'storefront-outline',
    accent_key: 'gold',
    art_image_url: dkd_row_value?.image_url || '',
    panel_style: 'featured',
    background_tone: 'auto',
    visual_preset: 'gold',
    dkd_reward_puan: dkd_reward_puan_from_row(dkd_row_value),
    reward_kind: 'merchant_product',
    reward_amount: 1,
    sort_order: 1000 + Number(dkd_row_value?.sort_order || 0),
    is_active: dkd_row_value?.is_active !== false,
  };
}

export async function fetchMarketSnapshot() {
  return {
    listingsRes: { data: [], error: null },
    mineRes: { data: [], error: null },
  };
}

export async function listCardForSale() {
  return {
    data: { ok: false, reason: 'dkd_card_market_disabled' },
    error: { message: 'Kart satış/ilan akışı mağaza sürümünde kapalıdır.' },
  };
}

export async function cancelMarketListing() {
  return {
    data: { ok: false, reason: 'dkd_card_market_disabled' },
    error: { message: 'Kart ilan akışı mağaza sürümünde kapalıdır.' },
  };
}

export async function buyMarketListing() {
  return {
    data: { ok: false, reason: 'dkd_card_market_disabled' },
    error: { message: 'Kart market akışı mağaza sürümünde kapalıdır.' },
  };
}

export async function dkd_redeem_market_earned_points(dkd_input_value) {
  const dkd_pack_key_value = typeof dkd_input_value === 'string' ? String(dkd_input_value || '').trim() : String(dkd_input_value?.packKey || '').trim();
  const dkd_pack_id_value = typeof dkd_input_value === 'object' && dkd_input_value ? String(dkd_input_value?.packId || '').trim() : '';
  const dkd_point_redeem_key = dkd_pack_key_value || dkd_pack_id_value;

  if (dkd_point_redeem_key.startsWith('merchant_product:')) {
    return dkd_create_business_product_point_order(dkd_point_redeem_key);
  }

  return {
    data: { ok: false, reason: 'dkd_digital_reward_redeem_disabled' },
    error: { message: 'Koleksiyon, enerji ve özel kart akışları mağaza sürümünde gerçek para veya puanla dijital ürün satışı olarak kullanılmaz.' },
  };
}

export async function fetchMarketShopSnapshot() {
  let dkd_base_ui_value = null;
  let dkd_base_pack_values = [];

  const dkd_rpc_result_value = await supabase.rpc('dkd_market_shop_snapshot');
  if (!dkd_rpc_result_value?.error) {
    dkd_base_ui_value = dkd_rpc_result_value?.data?.ui || null;
    dkd_base_pack_values = (Array.isArray(dkd_rpc_result_value?.data?.packs) ? dkd_rpc_result_value.data.packs : [])
      .map(dkd_normalize_reward_puan_row)
      .filter((dkd_pack_value) => String(dkd_pack_value?.reward_kind || '') === 'merchant_product');
  } else if (!dkd_should_use_safe_shop_fallback(dkd_rpc_result_value.error)) {
    return {
      data: { ui: null, packs: [] },
      error: dkd_rpc_result_value.error,
    };
  } else {
    const [dkd_ui_result_value, dkd_pack_result_value] = await Promise.all([
      supabase.from('dkd_market_ui_config').select(SHOP_UI_SELECT).eq('id', 1).maybeSingle(),
      supabase.from('dkd_market_shop_defs').select(SHOP_PACK_SELECT).eq('is_active', true).eq('reward_kind', 'merchant_product').order('sort_order', { ascending: true }).order('id', { ascending: true }),
    ]);
    if (dkd_ui_result_value?.error || dkd_pack_result_value?.error) {
      return {
        data: { ui: null, packs: [] },
        error: dkd_ui_result_value?.error || dkd_pack_result_value?.error || null,
      };
    }
    dkd_base_ui_value = dkd_ui_result_value?.data || null;
    dkd_base_pack_values = (Array.isArray(dkd_pack_result_value?.data) ? dkd_pack_result_value.data : []).map(dkd_normalize_reward_puan_row);
  }

  let dkd_merchant_pack_values = [];
  try {
    const dkd_catalog_result_value = await fetchBusinessMarketCatalog();
    if (!dkd_catalog_result_value?.error) {
      dkd_merchant_pack_values = (Array.isArray(dkd_catalog_result_value?.data) ? dkd_catalog_result_value.data : []).map(mapBusinessProductToShopPack);
    }
  } catch (dkd_error_value) {
    console.log('[DraBornGo][merchant-market]', dkd_error_value?.message || String(dkd_error_value));
  }

  return {
    data: {
      ui: dkd_base_ui_value,
      packs: [...dkd_base_pack_values, ...dkd_merchant_pack_values],
    },
    error: null,
  };
}
