import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DkdCargoSenderPanel, { DkdCargoShipmentDetailReplica } from '../courier/dkd_cargo_sender_panel';
import DkdUrgentCourierPanel from '../courier/dkd_urgent_courier_panel';
import DkdCargoLiveMapModal from '../courier/dkd_cargo_live_map_modal';
import DkdLogisticsModal from '../logistics/dkd_logistics_modal';
import DkdWalletPaymentMethodModal from '../payment/dkd_wallet_payment_method_modal';
import DkdRestaurantDemoNoticeModal from './dkd_restaurant_demo_notice_modal';
import { dkd_payments_enabled_value, dkd_restaurant_orders_enabled_value } from '../../config/dkd_release_flags';
import { dkd_build_unified_wallet_patch_value, resolveUnifiedWalletTl } from '../../services/walletService';
import { fetchBusinessMarketCatalog as dkd_fetch_business_market_catalog_value } from '../../services/businessProductService';
import { dkd_create_restaurant_order_value, dkd_create_service_network_request_value, dkd_delete_completed_service_network_order_value, dkd_fetch_service_network_my_orders_value } from '../../services/dkd_service_network_service';
import { dkd_send_customer_order_local_notification_value } from '../../services/notificationService';
import { dkd_approve_urgent_courier_fee, dkd_approve_urgent_courier_product_total, dkd_reject_urgent_courier_fee, dkd_send_urgent_courier_message } from '../../services/dkd_urgent_courier_service';

export const dkd_service_network_category_groups_value = [
  { dkd_group_id_value: 'dkd_home_life', dkd_title_value: 'Ev & Yaşam', dkd_subtitle_value: 'Evden alınan, randevulu veya konumda verilen günlük hizmetler', dkd_icon_value: 'home-city-outline', dkd_gradient_value: ['#065F46', '#047857', '#164E63'], dkd_categories_value: [
    { dkd_id_value: 'dkd_dry_cleaning', dkd_title_value: 'Kuru temizleme', dkd_icon_value: 'hanger', dkd_icon_color_value: '#FDE68A', dkd_desc_value: 'Evden al, temizlet, geri getir modeli.' },
    { dkd_id_value: 'dkd_carpet_cleaning', dkd_title_value: 'Halı yıkama', dkd_icon_value: 'rug', dkd_icon_color_value: '#A7F3D0', dkd_desc_value: 'Adresinden alım ve planlı teslimat.' },
    { dkd_id_value: 'dkd_home_cleaning', dkd_title_value: 'Ev temizliği', dkd_icon_value: 'spray-bottle', dkd_icon_color_value: '#BAE6FD', dkd_desc_value: 'Doğrulanmış temizlik ekibi veya firma profilleri.' },
    { dkd_id_value: 'dkd_furniture_assembly', dkd_title_value: 'Mobilya montaj', dkd_icon_value: 'hammer-screwdriver', dkd_icon_color_value: '#FDBA74', dkd_desc_value: 'Kurulum, montaj ve küçük tamir desteği.' },
    { dkd_id_value: 'dkd_tailor_delivery', dkd_title_value: 'Terzi teslimatı', dkd_icon_value: 'scissors-cutting', dkd_icon_color_value: '#F9A8D4', dkd_desc_value: 'Terzi işlerini kurye ile aldır, hazırlanınca teslim et.' },
    { dkd_id_value: 'dkd_pet_care', dkd_title_value: 'Pet kuaför / veteriner', dkd_icon_value: 'paw', dkd_icon_color_value: '#C4B5FD', dkd_desc_value: 'Evcil bakım, kuaför ve yönlendirmeli veteriner hizmeti.' },
  ] },
  { dkd_group_id_value: 'dkd_food_market', dkd_title_value: 'Yemek & Market', dkd_subtitle_value: 'Restoran, market, fırın ve günlük ihtiyaç teslimat akışları', dkd_icon_value: 'storefront-outline', dkd_gradient_value: ['#EA580C', '#F97316', '#BE123C'], dkd_categories_value: [
    { dkd_id_value: 'dkd_restaurant_order', dkd_title_value: 'Restoran siparişi', dkd_icon_value: 'silverware-fork-knife', dkd_icon_color_value: '#FDBA74', dkd_icon_bg_value: 'rgba(251,146,60,0.18)', dkd_desc_value: 'Anlaşmalı restoranlardan kurye bağlantılı yemek teslimatı.' },
    { dkd_id_value: 'dkd_market_shopping', dkd_title_value: 'Market alışverişi', dkd_icon_value: 'cart-outline', dkd_icon_color_value: '#86EFAC', dkd_icon_bg_value: 'rgba(34,197,94,0.18)', dkd_desc_value: 'Market ürünlerini listele, partner veya kurye ile teslim ettir.' },
    { dkd_id_value: 'dkd_bakery_order', dkd_title_value: 'Fırın ürünleri', dkd_icon_value: 'bread-slice-outline', dkd_icon_color_value: '#FDE68A', dkd_icon_bg_value: 'rgba(250,205,21,0.18)', dkd_desc_value: 'Ekmek, pasta, börek ve günlük fırın ihtiyaçları.' },
    { dkd_id_value: 'dkd_greengrocer_order', dkd_title_value: 'Manav / taze ürün', dkd_icon_value: 'fruit-cherries', dkd_icon_color_value: '#A7F3D0', dkd_icon_bg_value: 'rgba(16,185,129,0.18)', dkd_desc_value: 'Sebze, meyve ve taze ürün teslimatı.' },
    { dkd_id_value: 'dkd_water_delivery', dkd_title_value: 'Su / damacana', dkd_icon_value: 'water-pump', dkd_icon_color_value: '#7DD3FC', dkd_icon_bg_value: 'rgba(14,165,233,0.18)', dkd_desc_value: 'Damacana, koli su ve hızlı adres teslimatı.' },
    { dkd_id_value: 'dkd_cafe_dessert', dkd_title_value: 'Kahve / tatlı', dkd_icon_value: 'cupcake', dkd_icon_color_value: '#F9A8D4', dkd_icon_bg_value: 'rgba(236,72,153,0.18)', dkd_desc_value: 'Kafe, tatlıcı ve özel paket teslimleri.' },
    { dkd_id_value: 'dkd_butcher_deli', dkd_title_value: 'Kasap / şarküteri', dkd_icon_value: 'food-steak', dkd_icon_color_value: '#F87171', dkd_icon_bg_value: 'rgba(220,38,38,0.18)', dkd_desc_value: 'Güvenilir partnerlerden et ve şarküteri teslimatı.' },
  ] },
  { dkd_group_id_value: 'dkd_transport_rental', dkd_title_value: 'Taşıma & Ulaşım', dkd_subtitle_value: 'Küçük taşıma, taksi bağlantısı ve kiralık araç yönlendirme', dkd_icon_value: 'map-marker-path', dkd_gradient_value: ['#1E1B4B', '#7C3AED', '#06B6D4'], dkd_categories_value: [
    { dkd_id_value: 'dkd_second_hand_move', dkd_title_value: '2.EL eşya taşıma', dkd_icon_value: 'truck-delivery-outline', dkd_icon_color_value: '#FBBF24', dkd_desc_value: 'Küçük eşya, parça yük ve şehir içi destek.' },
    { dkd_id_value: 'dkd_taxi', dkd_title_value: 'Taksi hizmeti', dkd_icon_value: 'taxi', dkd_icon_color_value: '#FACC15', dkd_desc_value: 'Anlaşmalı taksici/şoför profilleri.' },
    { dkd_id_value: 'dkd_rental_car', dkd_title_value: 'Kiralık araba', dkd_icon_value: 'car-key', dkd_icon_color_value: '#60A5FA', dkd_desc_value: 'Partner kiralama firması ve araç profilleri.' },
    { dkd_id_value: 'dkd_small_moving', dkd_title_value: 'Küçük nakliye', dkd_icon_value: 'truck-fast-outline', dkd_icon_color_value: '#FCA5A5', dkd_desc_value: 'Parça eşya ve kısa mesafe taşıma talepleri.' },
    { dkd_id_value: 'dkd_private_driver', dkd_title_value: 'Özel şoför', dkd_icon_value: 'steering', dkd_icon_color_value: '#93C5FD', dkd_desc_value: 'Saatlik veya randevulu şoför yönlendirmesi.' },
  ] },
  { dkd_group_id_value: 'dkd_auto_support', dkd_title_value: 'Araç Destek', dkd_subtitle_value: 'Yolda kalan, bakım isteyen veya aracında hizmet isteyen kullanıcılar', dkd_icon_value: 'car-cog', dkd_gradient_value: ['#0F766E', '#0891B2', '#1E40AF'], dkd_categories_value: [
    { dkd_id_value: 'dkd_mobile_tire', dkd_title_value: 'Mobil lastikçi', dkd_icon_value: 'tire', dkd_icon_color_value: '#FCD34D', dkd_desc_value: 'Patlak, stepne, balans ve yerinde destek.' },
    { dkd_id_value: 'dkd_battery_boost', dkd_title_value: 'Akü takviye', dkd_icon_value: 'car-battery', dkd_icon_color_value: '#34D399', dkd_desc_value: 'Konuma hızlı akü destek ekibi.' },
    { dkd_id_value: 'dkd_car_wash', dkd_title_value: 'Oto yıkama / oto kuaför', dkd_icon_value: 'car-wash', dkd_icon_color_value: '#7DD3FC', dkd_desc_value: 'Araç konumunda temizlik ve detaylı bakım.' },
    { dkd_id_value: 'dkd_auto_inspection', dkd_title_value: 'Mobil oto ekspertiz', dkd_icon_value: 'car-search', dkd_icon_color_value: '#C4B5FD', dkd_desc_value: 'Yerinde ekspertiz ve raporlama.' },
    { dkd_id_value: 'dkd_tow_truck', dkd_title_value: 'Çekici hizmeti', dkd_icon_value: 'tow-truck', dkd_icon_color_value: '#FB7185', dkd_desc_value: 'En yakın çekici ve yol yardım ağı.' },
    { dkd_id_value: 'dkd_mobile_mechanic', dkd_title_value: 'Mobil oto servis', dkd_icon_value: 'car-wrench', dkd_icon_color_value: '#FDBA74', dkd_desc_value: 'Basit arıza, kontrol ve yerinde teknik destek.' },
  ] },
  { dkd_group_id_value: 'dkd_repair_tech', dkd_title_value: 'Tamir & Teknik', dkd_subtitle_value: 'Fotoğrafla ön teklif, kurye ile teslim veya adreste servis', dkd_icon_value: 'tools', dkd_gradient_value: ['#334155', '#2563EB', '#7C3AED'], dkd_categories_value: [
    { dkd_id_value: 'dkd_shoe_repair', dkd_title_value: 'Ayakkabı tamiri/boya', dkd_icon_value: 'shoe-formal', dkd_icon_color_value: '#FDE047', dkd_icon_bg_value: 'rgba(250,205,21,0.20)', dkd_desc_value: 'Fotoğrafla inceleme, atölyeye kurye akışı.' },
    { dkd_id_value: 'dkd_phone_repair', dkd_title_value: 'Telefon tamiri', dkd_icon_value: 'cellphone-cog', dkd_icon_color_value: '#38BDF8', dkd_icon_bg_value: 'rgba(56,189,248,0.20)', dkd_desc_value: 'Ekran, batarya, soket ve cihaz teslim akışı.' },
    { dkd_id_value: 'dkd_locksmith', dkd_title_value: 'Anahtarcı/çilingir', dkd_icon_value: 'key-chain', dkd_icon_color_value: '#FB923C', dkd_icon_bg_value: 'rgba(251,146,60,0.20)', dkd_desc_value: 'Acil konuma en yakın doğrulanmış usta.' },
    { dkd_id_value: 'dkd_hvac_boiler', dkd_title_value: 'Klima/kombi servisi', dkd_icon_value: 'air-conditioner', dkd_icon_color_value: '#67E8F9', dkd_icon_bg_value: 'rgba(34,211,238,0.20)', dkd_desc_value: 'Randevulu teknik servis ve bakım.' },
    { dkd_id_value: 'dkd_white_goods', dkd_title_value: 'Beyaz eşya servisi', dkd_icon_value: 'washing-machine', dkd_icon_color_value: '#A7F3D0', dkd_icon_bg_value: 'rgba(16,185,129,0.20)', dkd_desc_value: 'Çamaşır, bulaşık, buzdolabı ve küçük arıza yönlendirmesi.' },
    { dkd_id_value: 'dkd_electric_plumbing', dkd_title_value: 'Elektrik / su tesisatı', dkd_icon_value: 'pipe-wrench', dkd_icon_color_value: '#F0ABFC', dkd_icon_bg_value: 'rgba(217,70,239,0.20)', dkd_desc_value: 'Ev ve iş yeri için acil usta çağrı akışı.' },
  ] },
  { dkd_group_id_value: 'dkd_special_delivery', dkd_title_value: 'Özel Teslimat', dkd_subtitle_value: 'Hediye, çiçek, etkinlik ve özel görev akışları', dkd_icon_value: 'gift-open-outline', dkd_gradient_value: ['#831843', '#C026D3', '#4F46E5'], dkd_categories_value: [
    { dkd_id_value: 'dkd_flower_gift', dkd_title_value: 'Çiçek/hediye teslimatı', dkd_icon_value: 'flower-tulip-outline', dkd_icon_color_value: '#F9A8D4', dkd_desc_value: 'Partnerden al, alıcıya özel teslim et.' },
    { dkd_id_value: 'dkd_event_support', dkd_title_value: 'Organizasyon destek', dkd_icon_value: 'party-popper', dkd_icon_color_value: '#FDE68A', dkd_desc_value: 'Etkinlik, malzeme ve saha destek ekibi.' },
    { dkd_id_value: 'dkd_document_courier', dkd_title_value: 'Belge / özel kurye', dkd_icon_value: 'file-document-arrow-right-outline', dkd_icon_color_value: '#BAE6FD', dkd_desc_value: 'Evrak, numune ve özel teslimat görevleri.' },
    { dkd_id_value: 'dkd_gift_shopping', dkd_title_value: 'Hediye alışveriş desteği', dkd_icon_value: 'shopping-outline', dkd_icon_color_value: '#C084FC', dkd_desc_value: 'Ürünü partnerden aldır, paketlet ve teslim ettir.' },
  ] },
];

const dkd_service_network_request_urgencies_value = ['Acil', 'Bugün', 'Randevulu'];

const dkd_service_network_mode_blueprints_value = {
  dkd_pickup_delivery: {
    dkd_mode_values: ['Evden al - işleme götür', 'Hazır olunca geri getir', 'Önce fiyat teklifi al'],
    dkd_logic_title_value: 'Alım + işlem + geri teslim sipariş mantığı',
    dkd_logic_desc_value: 'Bu kategorilerde kullanıcıdan alım adresi, işlem detayı ve geri teslim adresi alınır. Partner önce fiyat/süre çıkarır, kurye alım ve teslim rotasına bağlanır.',
  },
  dkd_market_delivery: {
    dkd_mode_values: ['İşletmeden al kapıya getir', 'Partner alışveriş yapsın', 'Kurye canlı takip'],
    dkd_logic_title_value: 'Ürün seçimi + ödeme notu + hızlı teslim mantığı',
    dkd_logic_desc_value: 'Yemek, market, fırın ve benzeri kategorilerde ürün listesi, işletme tercihi, muadil/alternatif onayı ve teslim adresi önceliklidir.',
  },
  dkd_onsite_service: {
    dkd_mode_values: ['Usta adrese gelsin', 'Randevulu keşif yap', 'Acil servis çağır'],
    dkd_logic_title_value: 'Adreste servis + keşif + randevu mantığı',
    dkd_logic_desc_value: 'Bu kategorilerde kurye tesliminden çok doğru usta/ekip eşleşmesi önemlidir. Konum, marka/model, arıza fotoğrafı ve uygun saat istenir.',
  },
  dkd_vehicle_support: {
    dkd_mode_values: ['Yol yardım konuma gelsin', 'Araç konumunda hizmet', 'Randevulu destek'],
    dkd_logic_title_value: 'Canlı konum + yol yardım + servis ekibi mantığı',
    dkd_logic_desc_value: 'Araç destek taleplerinde plaka/araç modeli, canlı konum, güvenli bekleme noktası ve aciliyet bilgisi öne çıkar.',
  },
  dkd_transport_route: {
    dkd_mode_values: ['Araç + ekip teklifi al', 'Rota/fiyat teklifi iste', 'Randevulu planla'],
    dkd_logic_title_value: 'Rota + araç tipi + mesafe teklif mantığı',
    dkd_logic_desc_value: 'Taşıma ve ulaşım taleplerinde başlangıç, varış, durak, yük/kişi bilgisi ve saat netleşince partner fiyat çıkarır.',
  },
  dkd_special_courier: {
    dkd_mode_values: ['Özel kurye alıp götürsün', 'İmzalı/güvenli teslim', 'Fotoğraflı teslim onayı'],
    dkd_logic_title_value: 'Özel teslim + güvenli onay + canlı takip mantığı',
    dkd_logic_desc_value: 'Belge, hediye ve özel teslimlerde alıcı notu, gizlilik, teslim fotoğrafı/imza ve zaman hassasiyeti öne çıkar.',
  },
  dkd_rental_booking: {
    dkd_mode_values: ['Kapıya teslim kiralama', 'Ofisten teslim alacağım', 'Araç teklifi bekliyorum'],
    dkd_logic_title_value: 'Araç uygunluğu + teslim noktası + rezervasyon mantığı',
    dkd_logic_desc_value: 'Kiralık araç talebinde tarih aralığı, araç sınıfı, teslim/iade noktası ve depozito/evrak notu istenir.',
  },
};

const dkd_service_network_category_mode_type_value = {
  dkd_dry_cleaning: 'dkd_pickup_delivery',
  dkd_carpet_cleaning: 'dkd_pickup_delivery',
  dkd_tailor_delivery: 'dkd_pickup_delivery',
  dkd_pet_care: 'dkd_pickup_delivery',
  dkd_shoe_repair: 'dkd_pickup_delivery',
  dkd_phone_repair: 'dkd_pickup_delivery',
  dkd_restaurant_order: 'dkd_market_delivery',
  dkd_market_shopping: 'dkd_market_delivery',
  dkd_bakery_order: 'dkd_market_delivery',
  dkd_greengrocer_order: 'dkd_market_delivery',
  dkd_water_delivery: 'dkd_market_delivery',
  dkd_cafe_dessert: 'dkd_market_delivery',
  dkd_butcher_deli: 'dkd_market_delivery',
  dkd_home_cleaning: 'dkd_onsite_service',
  dkd_furniture_assembly: 'dkd_onsite_service',
  dkd_locksmith: 'dkd_onsite_service',
  dkd_hvac_boiler: 'dkd_onsite_service',
  dkd_white_goods: 'dkd_onsite_service',
  dkd_electric_plumbing: 'dkd_onsite_service',
  dkd_mobile_tire: 'dkd_vehicle_support',
  dkd_battery_boost: 'dkd_vehicle_support',
  dkd_car_wash: 'dkd_vehicle_support',
  dkd_auto_inspection: 'dkd_vehicle_support',
  dkd_tow_truck: 'dkd_vehicle_support',
  dkd_mobile_mechanic: 'dkd_vehicle_support',
  dkd_second_hand_move: 'dkd_transport_route',
  dkd_taxi: 'dkd_transport_route',
  dkd_small_moving: 'dkd_transport_route',
  dkd_private_driver: 'dkd_transport_route',
  dkd_rental_car: 'dkd_rental_booking',
  dkd_flower_gift: 'dkd_special_courier',
  dkd_event_support: 'dkd_onsite_service',
  dkd_document_courier: 'dkd_special_courier',
  dkd_gift_shopping: 'dkd_special_courier',
};

function dkd_get_service_network_operation_value(dkd_category_value) {
  const dkd_mode_type_value = dkd_service_network_category_mode_type_value[dkd_category_value?.dkd_id_value] || 'dkd_special_courier';
  return dkd_service_network_mode_blueprints_value[dkd_mode_type_value] || dkd_service_network_mode_blueprints_value.dkd_special_courier;
}

function dkd_service_network_category_locked_value(dkd_category_value) {
  return String(dkd_category_value?.dkd_id_value || '') !== 'dkd_restaurant_order';
}

const dkd_restaurant_catalog_keyword_values = [
  'restoran',
  'restaurant',
  'yemek',
  'menü',
  'menu',
  'fırın',
  'firin',
  'kahve',
  'kafe',
  'tatlı',
  'tatli',
  'pizza',
  'burger',
  'döner',
  'doner',
  'kasap',
  'şarküteri',
  'sarkuteri',
  'yiyecek',
  'içecek',
  'icecek',
];

function dkd_normalize_catalog_search_text_value(dkd_text_value) {
  return String(dkd_text_value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function dkd_is_restaurant_catalog_product_value(dkd_product_value) {
  const dkd_catalog_text_value = dkd_normalize_catalog_search_text_value([
    dkd_product_value?.category,
    dkd_product_value?.business_category,
    dkd_product_value?.title,
    dkd_product_value?.description,
    dkd_product_value?.business_name,
  ].join(' '));
  return dkd_restaurant_catalog_keyword_values.some((dkd_keyword_value) => dkd_catalog_text_value.includes(dkd_normalize_catalog_search_text_value(dkd_keyword_value)));
}

function dkd_service_network_catalog_price_text_value(dkd_product_value) {
  const dkd_cash_value = dkd_product_value?.product_price_tl == null ? dkd_product_value?.price_cash : dkd_product_value?.product_price_tl;
  const dkd_amount_value = Number(dkd_cash_value);
  const dkd_currency_value = String(dkd_product_value?.product_price_currency || dkd_product_value?.currency_code || 'TRY').toUpperCase();
  const dkd_reward_puan_value = Number(dkd_product_value?.dkd_reward_puan ?? dkd_product_value?.price_puan ?? 0);
  if (Number.isFinite(dkd_amount_value) && dkd_amount_value > 0) {
    const dkd_suffix_value = dkd_currency_value === 'TRY' ? 'TL' : dkd_currency_value;
    return `${dkd_amount_value.toFixed(dkd_amount_value % 1 === 0 ? 0 : 2)} ${dkd_suffix_value}`;
  }
  if (Number.isFinite(dkd_reward_puan_value) && dkd_reward_puan_value > 0) return `${dkd_reward_puan_value} puan`;
  return 'Fiyat işletmede';
}

function dkd_restaurant_round_money_value(dkd_input_value) {
  const dkd_numeric_value = Number(dkd_input_value || 0);
  if (!Number.isFinite(dkd_numeric_value)) return 0;
  return Math.max(0, Math.round(dkd_numeric_value * 100) / 100);
}

function dkd_restaurant_format_money_value(dkd_input_value) {
  return `${dkd_restaurant_round_money_value(dkd_input_value).toFixed(2)} TL`;
}

function dkd_restaurant_number_or_zero_value(dkd_input_value) {
  const dkd_numeric_value = Number(dkd_input_value);
  return Number.isFinite(dkd_numeric_value) ? dkd_numeric_value : 0;
}

function dkd_restaurant_product_price_tl_value(dkd_product_value = {}) {
  const dkd_price_candidate_value = dkd_product_value?.product_price_tl ?? dkd_product_value?.price_cash ?? dkd_product_value?.price_tl ?? dkd_product_value?.cash_price_tl;
  return dkd_restaurant_round_money_value(dkd_restaurant_number_or_zero_value(dkd_price_candidate_value));
}

function dkd_restaurant_delivery_fee_tl_value(dkd_product_value = {}) {
  const dkd_delivery_fee_candidate_value = dkd_product_value?.dkd_delivery_fee_tl
    ?? dkd_product_value?.delivery_fee_tl
    ?? dkd_product_value?.dkd_courier_fee_tl
    ?? dkd_product_value?.courier_fee_tl
    ?? dkd_product_value?.dkd_business_delivery_fee_tl
    ?? dkd_product_value?.business_delivery_fee_tl
    ?? dkd_product_value?.deliveryFeeTl
    ?? 0;
  return dkd_restaurant_round_money_value(dkd_restaurant_number_or_zero_value(dkd_delivery_fee_candidate_value));
}

function dkd_build_restaurant_payment_preview_value(dkd_product_value = {}) {
  const dkd_product_price_tl_value = dkd_restaurant_product_price_tl_value(dkd_product_value);
  const dkd_delivery_fee_tl_value = dkd_restaurant_delivery_fee_tl_value(dkd_product_value);
  const dkd_customer_charge_tl_value = dkd_restaurant_round_money_value(dkd_product_price_tl_value + dkd_delivery_fee_tl_value);
  return {
    dkd_product_price_tl: dkd_product_price_tl_value,
    dkd_delivery_fee_tl: dkd_delivery_fee_tl_value,
    dkd_customer_charge_tl: dkd_customer_charge_tl_value,
  };
}

function dkd_resolve_restaurant_product_image_uri_value(dkd_product_value) {
  const dkd_image_candidate_values = [
    dkd_product_value?.product_image_url,
    dkd_product_value?.image_url,
    dkd_product_value?.art_image_url,
    dkd_product_value?.photo_url,
    dkd_product_value?.cover_url,
    dkd_product_value?.thumbnail_url,
    dkd_product_value?.image,
  ];
  return String(dkd_image_candidate_values.find((dkd_image_candidate_value) => String(dkd_image_candidate_value || '').trim()) || '').trim();
}

function dkd_build_restaurant_catalog_sections_value(dkd_product_values) {
  const dkd_section_map_value = new Map();
  (Array.isArray(dkd_product_values) ? dkd_product_values : []).forEach((dkd_product_value) => {
    const dkd_business_key_value = `${String(dkd_product_value?.business_id || 'dkd_business')}:${String(dkd_product_value?.business_name || 'İşletme')}`;
    const dkd_existing_section_value = dkd_section_map_value.get(dkd_business_key_value) || {
      dkd_key_value: dkd_business_key_value,
      dkd_business_name_value: dkd_product_value?.business_name || 'İşletme',
      dkd_business_category_value: dkd_product_value?.business_category || 'Restoran',
      dkd_business_address_value: dkd_product_value?.business_address_text || 'Adres bilgisi ürün içinde netleşir',
      dkd_item_values: [],
    };
    dkd_existing_section_value.dkd_item_values.push(dkd_product_value);
    dkd_section_map_value.set(dkd_business_key_value, dkd_existing_section_value);
  });
  return Array.from(dkd_section_map_value.values()).map((dkd_section_value) => ({
    ...dkd_section_value,
    dkd_item_values: dkd_section_value.dkd_item_values.slice().sort((dkd_left_value, dkd_right_value) => {
      const dkd_left_order_value = Number(dkd_left_value?.sort_order || 0);
      const dkd_right_order_value = Number(dkd_right_value?.sort_order || 0);
      if (dkd_left_order_value !== dkd_right_order_value) return dkd_left_order_value - dkd_right_order_value;
      return String(dkd_left_value?.title || '').localeCompare(String(dkd_right_value?.title || ''), 'tr');
    }),
  }));
}

const dkd_service_network_request_blueprints_value = {
  dkd_dry_cleaning: { dkd_primary_question_value: 'Kıyafet türü, adet, leke/özel işlem ve teslim zamanı bilgisi alınır.', dkd_address_placeholder_value: 'Alım adresi: bina, kat, daire, güvenlik veya resepsiyon notu', dkd_delivery_placeholder_value: 'Geri teslim adresi aynı mı? Farklıysa teslim noktasını yaz', dkd_detail_placeholder_value: 'Takım elbise, gömlek, perde, mont gibi ürünleri ve özel temizleme notunu yaz', dkd_photo_note_value: 'Leke veya özel işlem için fotoğraf notu', dkd_option_values: ['Evden alım', 'Ütülü teslim', 'Leke kontrolü', 'Kurye geri getirir'], dkd_flow_values: ['Partner kilogram/adet teklifini verir', 'Kurye alım saati planlanır', 'Temizlik sonrası teslim randevusu açılır'] },
  dkd_carpet_cleaning: { dkd_primary_question_value: 'Halı adedi, m² tahmini, türü ve alım/teslim asansör bilgisi alınır.', dkd_address_placeholder_value: 'Alım adresi ve halıların bulunduğu kat/oda bilgisi', dkd_delivery_placeholder_value: 'Teslim adresi ve uygun teslim aralığı', dkd_detail_placeholder_value: 'Halı türü, ölçü, adet, ağır leke, evcil hayvan veya hassas yıkama notu', dkd_photo_note_value: 'Halı fotoğrafı, leke bölgesi veya etiket notu', dkd_option_values: ['m² hesap', 'Evden alım', 'Antialerjik yıkama', 'Randevulu teslim'], dkd_flow_values: ['Partner m² fiyatı çıkarır', 'Alım için kurye/nakliye ekibi eşleşir', 'Yıkama bittiğinde teslim zamanı onaylanır'] },
  dkd_home_cleaning: { dkd_primary_question_value: 'Ev büyüklüğü, oda sayısı, temizlik türü ve ekipman ihtiyacı alınır.', dkd_address_placeholder_value: 'Hizmet verilecek ev adresi ve giriş bilgisi', dkd_delivery_placeholder_value: 'Anahtar teslim/alım noktası veya görev sonrası kontrol notu', dkd_detail_placeholder_value: '1+1, 2+1, detaylı temizlik, cam, mutfak, banyo, boş ev veya eşyalı ev notu', dkd_photo_note_value: 'Temizlik alanı fotoğrafı veya özel hassas alan notu', dkd_option_values: ['Standart temizlik', 'Detaylı temizlik', 'Cam dahil', 'Ekipman partnerden'], dkd_flow_values: ['Uygun ekip saat teklifi verir', 'Güven rozetli partner atanır', 'Görev sonrası kontrol ve puanlama açılır'] },
  dkd_furniture_assembly: { dkd_primary_question_value: 'Ürün türü, paket sayısı, marka ve montaj alanı bilgisi alınır.', dkd_address_placeholder_value: 'Montaj yapılacak adres ve bina giriş notu', dkd_delivery_placeholder_value: 'Ürün mağazadan alınacaksa alım noktası; değilse boş bırak', dkd_detail_placeholder_value: 'Dolap, masa, yatak, raf, TV ünitesi; paket sayısı ve duvara sabitleme ihtiyacı', dkd_photo_note_value: 'Kutu etiketi, ürün modeli veya kurulum kılavuzu fotoğraf notu', dkd_option_values: ['Yerinde montaj', 'Duvara sabitleme', 'Mağazadan alım', 'Alet partnerden'], dkd_flow_values: ['Usta ürün detayına göre teklif verir', 'Randevu saati netleşir', 'Montaj sonrası fotoğraflı tamamlandı bilgisi alınır'] },
  dkd_tailor_delivery: { dkd_primary_question_value: 'Terzi işi türü, ölçü/düzeltme ve teslim tarihi alınır.', dkd_address_placeholder_value: 'Kıyafetin alınacağı adres veya terzi noktası', dkd_delivery_placeholder_value: 'Hazır olunca teslim edilecek adres', dkd_detail_placeholder_value: 'Paça, daraltma, fermuar, ütü, tadilat adedi ve ölçü notu', dkd_photo_note_value: 'Kıyafet fotoğrafı, işaretli tadilat alanı veya ölçü notu', dkd_option_values: ['Kurye alır', 'Terziye götürür', 'Ölçü notu ekle', 'Hazır olunca teslim'], dkd_flow_values: ['Terzi ön teklif verir', 'Kurye alım/teslim bağlantısı kurulur', 'Hazır bilgisi kullanıcıya düşer'] },
  dkd_pet_care: { dkd_primary_question_value: 'Evcil hayvan türü, bakım ihtiyacı, aşı/sağlık hassasiyeti alınır.', dkd_address_placeholder_value: 'Petin bulunduğu adres veya kuaför/veteriner alım noktası', dkd_delivery_placeholder_value: 'Geri teslim adresi veya sahip teslim noktası', dkd_detail_placeholder_value: 'Kedi/köpek türü, kilo, tıraş, yıkama, tırnak, veteriner yönlendirme notu', dkd_photo_note_value: 'Pet fotoğrafı ve hassas davranış/sağlık notu', dkd_option_values: ['Pet kuaför', 'Veteriner yönlendirme', 'Kurye taşıma', 'Randevulu bakım'], dkd_flow_values: ['Uygun pet partneri teklif verir', 'Taşıma ve bakım saati onaylanır', 'İşlem sonrası durum notu paylaşılır'] },
  dkd_restaurant_order: { dkd_primary_question_value: 'Restoran adı, ürün listesi, ödeme ve teslim notu alınır.', dkd_address_placeholder_value: 'Restoran veya alınacak işletme adresi', dkd_delivery_placeholder_value: 'Teslim edilecek müşteri adresi', dkd_detail_placeholder_value: 'Ürün adı, adet, menü, içecek, sos, pişirme ve alerji notu', dkd_photo_note_value: 'Menü ekran görüntüsü veya ürün fotoğrafı notu', dkd_option_values: ['Restorandan al', 'Sıcak teslim', 'Ödeme notu', 'Kurye takip'], dkd_flow_values: ['Restoran hazırlık süresi yazılır', 'Kurye alım noktasına yönlenir', 'Teslimat sonrası tamamlandı bilgisi düşer'] },
  dkd_market_shopping: { dkd_primary_question_value: 'Market listesi, marka alternatifi, maksimum bütçe ve teslim zamanı alınır.', dkd_address_placeholder_value: 'Alışveriş yapılacak market veya yakın market notu', dkd_delivery_placeholder_value: 'Teslim adresi ve bina/kapı notu', dkd_detail_placeholder_value: 'Ürün listesi, adet, marka, alternatif kabul durumu ve poşet notu', dkd_photo_note_value: 'Liste fotoğrafı veya ürün ekran görüntüsü notu', dkd_option_values: ['Listeyle alışveriş', 'Alternatif ürün', 'Fiş fotoğrafı', 'Kapıya teslim'], dkd_flow_values: ['Partner/kurye market seçimini onaylar', 'Ürün bulunurluğu ve fiyat notu gönderir', 'Fiş ve teslim onayı alınır'] },
  dkd_bakery_order: { dkd_primary_question_value: 'Fırın ürünü, adet, tazelik zamanı ve özel paket notu alınır.', dkd_address_placeholder_value: 'Fırın adı/adresi veya en yakın fırın tercihi', dkd_delivery_placeholder_value: 'Teslim adresi ve uygun saat', dkd_detail_placeholder_value: 'Ekmek, pasta, börek, simit, poğaça, adet ve sıcak/soğuk teslim notu', dkd_photo_note_value: 'Pasta görseli, yazı notu veya ürün fotoğrafı', dkd_option_values: ['En yakın fırın', 'Sıcak teslim', 'Pasta yazısı', 'Sabah teslim'], dkd_flow_values: ['Fırın hazırlık süresi alınır', 'Kurye teslim rotasına bağlanır', 'Ürün fotoğrafı ve teslim onayı gelir'] },
  dkd_greengrocer_order: { dkd_primary_question_value: 'Sebze/meyve listesi, kilo/adet ve kalite tercihi alınır.', dkd_address_placeholder_value: 'Manav/pazar tercihi veya yakın işletme notu', dkd_delivery_placeholder_value: 'Teslim adresi ve kapı notu', dkd_detail_placeholder_value: 'Ürün listesi, kilo/adet, olgunluk, yeşillik yıkama/paketleme notu', dkd_photo_note_value: 'Liste fotoğrafı veya örnek ürün görseli', dkd_option_values: ['Taze seçim', 'Kilo bilgisi', 'Alternatif kabul', 'Fiş fotoğrafı'], dkd_flow_values: ['Partner ürün kalitesini onaylar', 'Eksik ürün için alternatif sorulur', 'Teslimde fiş ve paket kontrolü yapılır'] },
  dkd_water_delivery: { dkd_primary_question_value: 'Damacana/koli su adedi, marka ve kat/asansör bilgisi alınır.', dkd_address_placeholder_value: 'Alınacak bayi veya en yakın su partneri notu', dkd_delivery_placeholder_value: 'Teslim adresi, kat ve asansör durumu', dkd_detail_placeholder_value: 'Damacana, koli su, pompa, boş damacana iadesi ve marka tercihi', dkd_photo_note_value: 'Boş damacana veya marka görseli notu', dkd_option_values: ['Damacana değişim', 'Koli su', 'Kapıya çıkarma', 'Boş iade'], dkd_flow_values: ['Partner stok ve marka bilgisini verir', 'Kurye/partner teslim rotası açılır', 'Boş damacana iadesi işaretlenir'] },
  dkd_cafe_dessert: { dkd_primary_question_value: 'Kafe/tatlı ürünü, adet, paketleme ve teslim zamanı alınır.', dkd_address_placeholder_value: 'Kafe/tatlıcı adı veya alınacak işletme adresi', dkd_delivery_placeholder_value: 'Teslim adresi ve alıcı notu', dkd_detail_placeholder_value: 'Kahve, tatlı, pasta dilimi, içecek sıcaklığı, şeker ve paketleme notu', dkd_photo_note_value: 'Menü görseli, pasta/tatlı örneği veya hediye notu', dkd_option_values: ['Sıcak/soğuk koruma', 'Hediye notu', 'Paketli teslim', 'Kurye takip'], dkd_flow_values: ['Partner hazırlık süresini paylaşır', 'Kurye alım için yönlenir', 'Alıcıya özel teslim onayı alınır'] },
  dkd_butcher_deli: { dkd_primary_question_value: 'Et/şarküteri türü, gramaj, kesim ve soğuk zincir notu alınır.', dkd_address_placeholder_value: 'Kasap/şarküteri adresi veya partner tercihi', dkd_delivery_placeholder_value: 'Teslim adresi ve uygun saat', dkd_detail_placeholder_value: 'Ürün türü, gramaj, kesim şekli, vakum, marine ve paketleme notu', dkd_photo_note_value: 'Ürün listesi veya tercih edilen ürün görseli', dkd_option_values: ['Gramaj kontrol', 'Vakum paket', 'Soğuk taşıma', 'Fiş fotoğrafı'], dkd_flow_values: ['Partner stok ve gramaj teklifini verir', 'Soğuk paketleme onaylanır', 'Teslimde ürün kontrolü yapılır'] },
  dkd_shoe_repair: { dkd_primary_question_value: 'Ayakkabı türü, hasar noktası, renk ve teslim beklentisi alınır.', dkd_address_placeholder_value: 'Ayakkabının alınacağı adres veya atölye noktası', dkd_delivery_placeholder_value: 'Tamir sonrası teslim adresi', dkd_detail_placeholder_value: 'Taban, boya, dikiş, topuk, fermuar, temizlik ve renk notu', dkd_photo_note_value: 'Hasarlı bölüm fotoğrafı ve renk referansı', dkd_option_values: ['Fotoğrafla ön teklif', 'Kurye atölyeye götürür', 'Boya/parlatma', 'Teslim randevusu'], dkd_flow_values: ['Usta fotoğrafa göre ön teklif verir', 'Kurye alım/teslim akışı kurulur', 'Tamir sonrası onay fotoğrafı paylaşılır'] },
  dkd_phone_repair: { dkd_primary_question_value: 'Cihaz modeli, sorun türü, veri hassasiyeti ve teslim akışı alınır.', dkd_address_placeholder_value: 'Cihazın alınacağı adres veya servis noktası', dkd_delivery_placeholder_value: 'Tamir sonrası geri teslim adresi', dkd_detail_placeholder_value: 'Marka/model, ekran, batarya, soket, kamera, yazılım, garanti ve şifre paylaşım notu', dkd_photo_note_value: 'Cihaz hasarı fotoğrafı veya hata ekranı notu', dkd_option_values: ['Ekran değişimi', 'Batarya', 'Soket', 'Kurye servis teslimi'], dkd_flow_values: ['Servis ön teşhis ve fiyat verir', 'Cihaz teslim tutanağı oluşur', 'Tamir bittiğinde test ve teslim onayı alınır'] },
  dkd_locksmith: { dkd_primary_question_value: 'Kapı/kilit türü, aciliyet, kimlik doğrulama ve konum alınır.', dkd_address_placeholder_value: 'Acil hizmet adresi, bina ve daire notu', dkd_delivery_placeholder_value: 'Yedek anahtar/ek parça teslim notu varsa yaz', dkd_detail_placeholder_value: 'Kapıda kalma, kilit değişimi, oto anahtar, çelik kapı ve güvenlik notu', dkd_photo_note_value: 'Kilit/kapı fotoğrafı ve kimlik doğrulama notu', dkd_option_values: ['Acil yönlendirme', 'Kilit değişimi', 'Kimlik kontrol', 'Konuma usta'], dkd_flow_values: ['En yakın çilingir uygunluk verir', 'Güvenlik doğrulaması yapılır', 'İşlem sonrası fiyat ve tamamlandı onayı alınır'] },
  dkd_hvac_boiler: { dkd_primary_question_value: 'Cihaz türü, marka/model, arıza kodu ve randevu zamanı alınır.', dkd_address_placeholder_value: 'Servis adresi ve cihazın bulunduğu alan', dkd_delivery_placeholder_value: 'Parça teslim/alım notu varsa yaz', dkd_detail_placeholder_value: 'Klima/kombi marka, bakım, arıza kodu, su akıtma, ısıtmama/soğutmama notu', dkd_photo_note_value: 'Cihaz etiketi, arıza kodu veya montaj alanı fotoğrafı', dkd_option_values: ['Bakım', 'Arıza', 'Parça teklifi', 'Randevulu servis'], dkd_flow_values: ['Teknik servis ön teşhis verir', 'Randevu ve tahmini ücret netleşir', 'Parça gerekiyorsa teklif tekrar onaylanır'] },
  dkd_white_goods: { dkd_primary_question_value: 'Beyaz eşya türü, marka/model, arıza belirtisi ve servis zamanı alınır.', dkd_address_placeholder_value: 'Servis adresi ve cihaz konumu', dkd_delivery_placeholder_value: 'Parça/ürün taşıma notu varsa yaz', dkd_detail_placeholder_value: 'Buzdolabı, çamaşır, bulaşık, fırın; marka/model, hata kodu ve arıza notu', dkd_photo_note_value: 'Etiket, hata kodu veya arızalı bölüm fotoğrafı', dkd_option_values: ['Arıza tespit', 'Parça teklifi', 'Yerinde servis', 'Garanti notu'], dkd_flow_values: ['Servis ön tanı ve ziyaret ücreti verir', 'Randevu onaylanır', 'İşlem sonrası rapor ve puanlama açılır'] },
  dkd_electric_plumbing: { dkd_primary_question_value: 'Elektrik/su tesisat sorunu, aciliyet ve risk durumu alınır.', dkd_address_placeholder_value: 'Arıza adresi ve erişim notu', dkd_delivery_placeholder_value: 'Malzeme alınacak nokta veya parça notu varsa yaz', dkd_detail_placeholder_value: 'Kaçak, tıkanıklık, priz, sigorta, musluk, batarya, boru veya tesisat açıklaması', dkd_photo_note_value: 'Arıza bölgesi fotoğrafı ve güvenlik riski notu', dkd_option_values: ['Acil usta', 'Malzeme dahil', 'Keşif', 'Yerinde tamir'], dkd_flow_values: ['Usta risk ve fiyat aralığı verir', 'Konuma yönlendirme yapılır', 'Malzeme gerekiyorsa kullanıcı onayı alınır'] },
  dkd_mobile_tire: { dkd_primary_question_value: 'Araç konumu, lastik ölçüsü, patlak/stepne durumu ve güvenlik notu alınır.', dkd_address_placeholder_value: 'Araç konumu: yol, otopark, site, güvenli bekleme noktası', dkd_delivery_placeholder_value: 'Lastik alınacak bayi veya teslim noktası varsa yaz', dkd_detail_placeholder_value: 'Lastik ölçüsü, patlak, stepne, balans, bijon kilidi ve araç modeli', dkd_photo_note_value: 'Lastik ölçüsü ve hasar fotoğrafı', dkd_option_values: ['Patlak destek', 'Stepne takma', 'Yeni lastik', 'Yol yardımı'], dkd_flow_values: ['Mobil lastikçi uygun ekipmanı onaylar', 'Konuma rota açılır', 'İşlem sonrası fotoğraflı tamamlandı alınır'] },
  dkd_battery_boost: { dkd_primary_question_value: 'Araç modeli, akü durumu, konum ve güvenli erişim bilgisi alınır.', dkd_address_placeholder_value: 'Araç konumu ve otopark/giriş bilgisi', dkd_delivery_placeholder_value: 'Yeni akü teslim/alım noktası gerekiyorsa yaz', dkd_detail_placeholder_value: 'Akü takviye, akü değişimi, araç çalışmıyor, kutup başı/erişim notu', dkd_photo_note_value: 'Akü fotoğrafı, araç modeli veya gösterge uyarısı', dkd_option_values: ['Takviye', 'Akü değişimi', 'Konuma servis', 'Acil destek'], dkd_flow_values: ['Partner uygun ekipmanla teklif verir', 'Konuma yönlendirme yapılır', 'Çalıştırma sonrası kontrol notu paylaşılır'] },
  dkd_car_wash: { dkd_primary_question_value: 'Araç tipi, temizlik paketi, konum ve su/elektrik erişimi alınır.', dkd_address_placeholder_value: 'Araç konumu, otopark ve erişim notu', dkd_delivery_placeholder_value: 'Anahtar teslim/araç teslim noktası varsa yaz', dkd_detail_placeholder_value: 'Dış yıkama, iç detay, koltuk, pasta cila, motor, mobil ekipman ve araç tipi', dkd_photo_note_value: 'Araç fotoğrafı veya kirli/hassas alan notu', dkd_option_values: ['Mobil yıkama', 'İç detay', 'Koltuk temizliği', 'Randevulu hizmet'], dkd_flow_values: ['Partner paket teklifini verir', 'Uygun randevu onaylanır', 'İşlem sonrası öncesi/sonrası fotoğrafı alınır'] },
  dkd_auto_inspection: { dkd_primary_question_value: 'Araç ilanı/konumu, ekspertiz kapsamı ve rapor beklentisi alınır.', dkd_address_placeholder_value: 'Araç konumu veya galeri/oto pazar adresi', dkd_delivery_placeholder_value: 'Raporun paylaşılacağı kişi veya teslim notu', dkd_detail_placeholder_value: 'Marka/model, ilan linki, boya, motor, mekanik, OBD, kaporta ve test sürüşü notu', dkd_photo_note_value: 'İlan ekran görüntüsü, şasi/ruhsat bilgisi veya araç fotoğrafları', dkd_option_values: ['Yerinde ekspertiz', 'Boya kontrol', 'OBD rapor', 'Fotoğraflı rapor'], dkd_flow_values: ['Ekspertiz kapsamı fiyatlanır', 'Araç sahibiyle saat eşleşir', 'Rapor ve fotoğraflar kullanıcıya gönderilir'] },
  dkd_tow_truck: { dkd_primary_question_value: 'Araç konumu, hedef servis, araç tipi ve çekici ihtiyacı alınır.', dkd_address_placeholder_value: 'Aracın kaldığı konum ve yol güvenliği notu', dkd_delivery_placeholder_value: 'Götürülecek servis/otopark/hedef adres', dkd_detail_placeholder_value: 'Araç marka/model, çalışır/çalışmaz, hasar, vites, otopark yüksekliği, çekme mesafesi', dkd_photo_note_value: 'Araç pozisyonu ve plaka/hasar fotoğrafı notu', dkd_option_values: ['Acil çekici', 'Servise götür', 'Otoparktan çıkar', 'Yol yardımı'], dkd_flow_values: ['En yakın çekici mesafe teklifini verir', 'Alım ve hedef rota doğrulanır', 'Teslim sonrası fotoğraflı kapanış alınır'] },
  dkd_mobile_mechanic: { dkd_primary_question_value: 'Araç arıza belirtisi, marka/model ve yerinde müdahale uygunluğu alınır.', dkd_address_placeholder_value: 'Araç konumu ve güvenli çalışma alanı', dkd_delivery_placeholder_value: 'Parça alınacak nokta veya servis hedefi varsa yaz', dkd_detail_placeholder_value: 'Çalışmıyor, ses, yağ, su, fren, lamba, kayış, sensör, basit bakım ve araç modeli', dkd_photo_note_value: 'Gösterge uyarısı, motor bölümü veya arıza videosu notu', dkd_option_values: ['Yerinde kontrol', 'Basit tamir', 'Parça teklifi', 'Servise yönlendirme'], dkd_flow_values: ['Mobil usta ön teşhis verir', 'Parça gerekiyorsa teklif açılır', 'Yerinde işlem veya servis yönlendirmesi tamamlanır'] },
  dkd_second_hand_move: { dkd_primary_question_value: 'Eşya türü, ölçü, kat/asansör ve alım-teslim adresleri alınır.', dkd_address_placeholder_value: 'Eşyanın alınacağı adres, kat ve asansör notu', dkd_delivery_placeholder_value: 'Teslim edilecek adres, kat ve taşıma mesafesi notu', dkd_detail_placeholder_value: 'Koltuk, masa, beyaz eşya, kutu; ölçü, ağırlık, paketleme ve sökme ihtiyacı', dkd_photo_note_value: 'Eşya fotoğrafı, ölçü veya bina giriş fotoğrafı', dkd_option_values: ['Parça eşya', 'İki kişi gerekir', 'Paketleme', 'Sök-tak'], dkd_flow_values: ['Nakliyeci hacim ve mesafe teklifini verir', 'Alım/teslim saatleri netleşir', 'Teslim sonrası hasarsız onay alınır'] },
  dkd_taxi: { dkd_primary_question_value: 'Alış noktası, varış noktası, kişi sayısı ve araç tercihi alınır.', dkd_address_placeholder_value: 'Alış adresi veya canlı konum notu', dkd_delivery_placeholder_value: 'Varış adresi ve rota detayı', dkd_detail_placeholder_value: 'Kişi sayısı, valiz, çocuk koltuğu, evcil hayvan, bekleme ve ödeme notu', dkd_photo_note_value: 'Konum ekran görüntüsü veya buluşma noktası fotoğrafı', dkd_option_values: ['Hemen çağır', 'Randevulu taksi', 'Valizli araç', 'Sabit teklif'], dkd_flow_values: ['Sürücü mesafe/ücret teklifini verir', 'Plaka ve sürücü profili görünür', 'Varışta tamamlandı ve puanlama açılır'] },
  dkd_rental_car: { dkd_primary_question_value: 'Araç sınıfı, tarih aralığı, teslim noktası ve belge bilgisi alınır.', dkd_address_placeholder_value: 'Aracı teslim almak istediğin bölge/adres', dkd_delivery_placeholder_value: 'Aracı bırakacağın bölge/adres', dkd_detail_placeholder_value: 'Ekonomi, SUV, lüks, günlük/haftalık, kilometre, depo, ehliyet ve depozito notu', dkd_photo_note_value: 'Ehliyet/kimlik doğrulama notu veya araç sınıfı örneği', dkd_option_values: ['Günlük kiralama', 'Adrese teslim', 'Depozito bilgisi', 'Araç sınıfı'], dkd_flow_values: ['Kiralama partneri uygun araçları listeler', 'Belge ve depozito koşulları onaylanır', 'Teslim alma/bırakma saati planlanır'] },
  dkd_small_moving: { dkd_primary_question_value: 'Küçük nakliye hacmi, araç tipi, personel ve adresler alınır.', dkd_address_placeholder_value: 'Alım adresi, kat, asansör ve yükleme noktası', dkd_delivery_placeholder_value: 'Teslim adresi, kat, asansör ve boşaltma noktası', dkd_detail_placeholder_value: 'Koli, küçük eşya, mini kamyonet, panelvan, kaç kişi ve yaklaşık hacim notu', dkd_photo_note_value: 'Eşya/koli fotoğrafı ve bina giriş notu', dkd_option_values: ['Kamyonet', 'Panelvan', 'Tek personel', 'Randevulu taşıma'], dkd_flow_values: ['Nakliyeci araç/personel teklifini verir', 'Alım ve teslim rotası doğrulanır', 'Teslim sonrası tamamlandı onayı alınır'] },
  dkd_private_driver: { dkd_primary_question_value: 'Şoför süresi, rota, araç kimin olacak ve özel beklentiler alınır.', dkd_address_placeholder_value: 'Başlangıç adresi ve buluşma noktası', dkd_delivery_placeholder_value: 'Varış/rota durakları veya dönüş noktası', dkd_detail_placeholder_value: 'Saatlik şoför, şehir dışı, düğün, toplantı, kendi aracım/partner aracı, bekleme notu', dkd_photo_note_value: 'Araç/rota veya buluşma noktası fotoğrafı notu', dkd_option_values: ['Saatlik şoför', 'Kendi aracım', 'Partner aracı', 'Randevulu'], dkd_flow_values: ['Şoför profil ve ücret teklifi verir', 'Rota/süre onaylanır', 'Görev sonunda puan ve ödeme özeti oluşur'] },
  dkd_flower_gift: { dkd_primary_question_value: 'Hediye/çiçek türü, alıcı bilgisi, kart notu ve teslim zamanı alınır.', dkd_address_placeholder_value: 'Alınacak çiçekçi/mağaza veya partner tercihi', dkd_delivery_placeholder_value: 'Alıcı teslim adresi ve telefon/kapı notu', dkd_detail_placeholder_value: 'Çiçek türü, buket, hediye, paketleme, kart mesajı ve gizli teslim notu', dkd_photo_note_value: 'İstenen buket/hediye örneği veya kart notu görseli', dkd_option_values: ['Kart notu', 'Sürpriz teslim', 'Fotoğraf onayı', 'Özel saat'], dkd_flow_values: ['Partner ürün fotoğrafı ve fiyatı gönderir', 'Kurye özel teslim rotasına bağlanır', 'Alıcı teslim onayı ve fotoğraf notu alınır'] },
  dkd_event_support: { dkd_primary_question_value: 'Etkinlik türü, tarih/saat, kişi sayısı ve ekipman ihtiyacı alınır.', dkd_address_placeholder_value: 'Etkinlik adresi, giriş ve yükleme alanı notu', dkd_delivery_placeholder_value: 'Malzeme teslim/toplama noktası varsa yaz', dkd_detail_placeholder_value: 'Doğum günü, nişan, organizasyon, masa-sandalye, süsleme, ses, saha destek ve süre notu', dkd_photo_note_value: 'Mekan fotoğrafı, konsept görseli veya ekipman listesi', dkd_option_values: ['Süsleme', 'Ekipman', 'Saha personeli', 'Toplama hizmeti'], dkd_flow_values: ['Organizasyon partneri paket teklifini verir', 'Kurulum/toplama saatleri planlanır', 'Etkinlik sonrası kapanış ve puanlama alınır'] },
  dkd_document_courier: { dkd_primary_question_value: 'Belge türü, güvenlik seviyesi, alım-teslim adresi ve süre alınır.', dkd_address_placeholder_value: 'Belgenin alınacağı adres ve kişi notu', dkd_delivery_placeholder_value: 'Teslim edilecek adres, kişi ve imza notu', dkd_detail_placeholder_value: 'Evrak, numune, sözleşme, imzalı teslim, gizlilik, kırılabilir veya özel taşıma notu', dkd_photo_note_value: 'Zarf/paket fotoğrafı veya teslim talimatı', dkd_option_values: ['İmzalı teslim', 'Gizli zarf', 'Acil kurye', 'Canlı takip'], dkd_flow_values: ['Kurye güvenli teslim görevine atanır', 'Alımda fotoğraf/imza kaydı açılır', 'Teslimde alıcı onayı alınır'] },
  dkd_gift_shopping: { dkd_primary_question_value: 'Hediye fikri, bütçe, mağaza tercihi ve alıcı teslim notu alınır.', dkd_address_placeholder_value: 'Alışveriş yapılacak mağaza/AVM veya bölge', dkd_delivery_placeholder_value: 'Hediyenin teslim edileceği alıcı adresi', dkd_detail_placeholder_value: 'Hediye türü, bütçe, paketleme, kart mesajı, beden/renk ve alternatif ürün notu', dkd_photo_note_value: 'Örnek ürün görseli, beden/renk referansı veya kart mesajı', dkd_option_values: ['Bütçeli alışveriş', 'Paketleme', 'Kart mesajı', 'Sürpriz teslim'], dkd_flow_values: ['Partner/kurye ürün seçeneklerini paylaşır', 'Kullanıcı ürün ve fiyatı onaylar', 'Paketlenip teslim rotasına bağlanır'] },
};

function dkd_get_service_network_request_blueprint_value(dkd_category_value) {
  return dkd_service_network_request_blueprints_value[dkd_category_value?.dkd_id_value] || {
    dkd_primary_question_value: 'Hizmet detayları, adres, zaman ve teklif beklentisi alınır.',
    dkd_address_placeholder_value: 'Hizmet alınacak adres veya canlı konum açıklaması',
    dkd_delivery_placeholder_value: 'Teslim/varış/geri dönüş adresi gerekiyorsa yaz',
    dkd_detail_placeholder_value: 'İhtiyaç detayı, özel not, adet, ölçü, marka/model veya randevu beklentisi',
    dkd_photo_note_value: 'Fotoğraf, belge veya özel açıklama notu',
    dkd_option_values: ['Teklif al', 'Randevu seç', 'Konuma gelsin', 'Kurye bağlantısı'],
    dkd_flow_values: ['Partnerler talebi görür', 'Uygun teklif kullanıcıya düşer', 'Onay sonrası görev akışına bağlanır'],
  };
}


const dkd_service_network_order_filter_values = [
  { dkd_key_value: 'active', dkd_label_value: 'Aktif', dkd_icon_value: 'radar' },
  { dkd_key_value: 'completed', dkd_label_value: 'Tamamlanan', dkd_icon_value: 'check-decagram-outline' },
  { dkd_key_value: 'cancelled', dkd_label_value: 'İptal', dkd_icon_value: 'close-octagon-outline' },
];

function dkd_service_network_format_date_value(dkd_input_value) {
  const dkd_date_value = new Date(dkd_input_value || '');
  if (Number.isNaN(dkd_date_value.getTime())) return 'Tarih bekleniyor';
  return dkd_date_value.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function dkd_service_network_safe_location_value(dkd_live_location_value = {}) {
  const dkd_lat_value = Number(dkd_live_location_value?.dkd_lat ?? dkd_live_location_value?.lat);
  const dkd_lng_value = Number(dkd_live_location_value?.dkd_lng ?? dkd_live_location_value?.lng);
  if (!Number.isFinite(dkd_lat_value) || !Number.isFinite(dkd_lng_value)) return null;
  return {
    dkd_lat_value,
    dkd_lng_value,
  };
}

function dkd_service_network_order_icon_info_value(dkd_order_value = {}) {
  const dkd_type_text_value = [
    dkd_order_value?.dkd_source_type,
    dkd_order_value?.dkd_category_key,
    dkd_order_value?.dkd_title,
    dkd_order_value?.dkd_subtitle,
    dkd_order_value?.dkd_urgency_text,
  ].join(' ').toLocaleLowerCase('tr-TR');

  if (dkd_type_text_value.includes('urgent') || dkd_type_text_value.includes('acil')) return { dkd_icon_value: 'bike-fast', dkd_bg_value: '#67E8F9', dkd_color_value: '#082F49' };
  if (dkd_type_text_value.includes('restaurant') || dkd_type_text_value.includes('restoran') || dkd_type_text_value.includes('yemek') || dkd_type_text_value.includes('menü') || dkd_type_text_value.includes('menu')) return { dkd_icon_value: 'silverware-fork-knife', dkd_bg_value: '#FDBA74', dkd_color_value: '#241104' };
  if (dkd_type_text_value.includes('market') || dkd_type_text_value.includes('alışveriş') || dkd_type_text_value.includes('alisveris')) return { dkd_icon_value: 'cart-outline', dkd_bg_value: '#86EFAC', dkd_color_value: '#052E16' };
  if (dkd_type_text_value.includes('fırın') || dkd_type_text_value.includes('firin') || dkd_type_text_value.includes('bakery')) return { dkd_icon_value: 'bread-slice-outline', dkd_bg_value: '#FDE68A', dkd_color_value: '#2F2502' };
  if (dkd_type_text_value.includes('kuru') || dkd_type_text_value.includes('temizleme')) return { dkd_icon_value: 'hanger', dkd_bg_value: '#BAE6FD', dkd_color_value: '#082F49' };
  if (dkd_type_text_value.includes('ayakkabı') || dkd_type_text_value.includes('shoe')) return { dkd_icon_value: 'shoe-formal', dkd_bg_value: '#FDE047', dkd_color_value: '#2F2502' };
  if (dkd_type_text_value.includes('telefon') || dkd_type_text_value.includes('phone')) return { dkd_icon_value: 'cellphone-cog', dkd_bg_value: '#7DD3FC', dkd_color_value: '#082F49' };
  if (dkd_type_text_value.includes('çilingir') || dkd_type_text_value.includes('cilingir') || dkd_type_text_value.includes('anahtar')) return { dkd_icon_value: 'key-chain', dkd_bg_value: '#FDBA74', dkd_color_value: '#241104' };
  if (dkd_type_text_value.includes('lastik') || dkd_type_text_value.includes('tire')) return { dkd_icon_value: 'tire', dkd_bg_value: '#FCD34D', dkd_color_value: '#2F2502' };
  if (dkd_type_text_value.includes('akü') || dkd_type_text_value.includes('aku') || dkd_type_text_value.includes('battery')) return { dkd_icon_value: 'car-battery', dkd_bg_value: '#86EFAC', dkd_color_value: '#052E16' };
  if (dkd_type_text_value.includes('kargo') || dkd_type_text_value.includes('cargo')) return { dkd_icon_value: 'package-variant-closed-check', dkd_bg_value: '#BAE6FD', dkd_color_value: '#082F49' };
  if (dkd_type_text_value.includes('oto') || dkd_type_text_value.includes('araç') || dkd_type_text_value.includes('arac') || dkd_type_text_value.includes('car')) return { dkd_icon_value: 'car-wrench', dkd_bg_value: '#93C5FD', dkd_color_value: '#172554' };
  if (dkd_type_text_value.includes('nakliye') || dkd_type_text_value.includes('taşıma') || dkd_type_text_value.includes('tasima')) return { dkd_icon_value: 'truck-fast-outline', dkd_bg_value: '#C4B5FD', dkd_color_value: '#2E1065' };
  if (dkd_type_text_value.includes('taksi') || dkd_type_text_value.includes('taxi')) return { dkd_icon_value: 'taxi', dkd_bg_value: '#FACC15', dkd_color_value: '#2F2502' };
  if (dkd_type_text_value.includes('çiçek') || dkd_type_text_value.includes('cicek') || dkd_type_text_value.includes('hediye')) return { dkd_icon_value: 'flower-tulip-outline', dkd_bg_value: '#F9A8D4', dkd_color_value: '#500724' };
  return { dkd_icon_value: 'package-variant', dkd_bg_value: '#FDE68A', dkd_color_value: '#07131C' };
}

function dkd_service_network_mapbox_job_type_value(dkd_source_type_value = '') {
  const dkd_source_key_value = String(dkd_source_type_value || '').toLowerCase();
  if (dkd_source_key_value.includes('restaurant')) return 'restaurant';
  if (dkd_source_key_value.includes('cargo')) return 'cargo';
  if (dkd_source_key_value.includes('urgent')) return 'urgent_courier';
  if (dkd_source_key_value.includes('logistics')) return 'logistics';
  return 'service_network';
}

function dkd_service_network_mapbox_task_value(dkd_order_value = {}) {
  const dkd_live_location_value = dkd_order_value?.dkd_courier_live_location || {};
  const dkd_status_key_value = String(dkd_order_value?.dkd_status || '').toLowerCase();
  const dkd_mapbox_status_value = dkd_status_key_value.includes('picked') || dkd_status_key_value.includes('teslim') || dkd_status_key_value.includes('aktif') ? 'picked_up' : 'accepted';
  return {
    id: dkd_order_value?.dkd_courier_job_id || dkd_order_value?.dkd_order_key || dkd_order_value?.dkd_source_id,
    status: dkd_mapbox_status_value,
    job_type: dkd_service_network_mapbox_job_type_value(dkd_order_value?.dkd_source_type),
    merchant_name: dkd_order_value?.dkd_subtitle || 'Hizmet Ağı',
    product_title: dkd_order_value?.dkd_title || 'Hizmet siparişi',
    pickup: dkd_order_value?.dkd_address_text || dkd_order_value?.dkd_subtitle || '',
    dropoff: dkd_order_value?.dkd_delivery_text || dkd_order_value?.dkd_address_text || '',
    delivery_address_text: dkd_order_value?.dkd_delivery_text || '',
    delivery_note: dkd_order_value?.dkd_note_text || '',
    assigned_user_id: dkd_live_location_value?.dkd_courier_user_id || '',
    eta_min: dkd_live_location_value?.dkd_eta_min || null,
    courier_vehicle_type: dkd_live_location_value?.dkd_vehicle_type || 'moto',
    courier_heading_deg: dkd_live_location_value?.dkd_heading || 0,
    pickup_lat: dkd_order_value?.dkd_pickup_lat ?? null,
    pickup_lng: dkd_order_value?.dkd_pickup_lng ?? null,
    dropoff_lat: dkd_order_value?.dkd_dropoff_lat ?? null,
    dropoff_lng: dkd_order_value?.dkd_dropoff_lng ?? null,
    customer_lat: dkd_order_value?.dkd_dropoff_lat ?? null,
    customer_lng: dkd_order_value?.dkd_dropoff_lng ?? null,
  };
}

function dkd_service_network_mapbox_location_value(dkd_order_value = {}) {
  const dkd_live_location_value = dkd_order_value?.dkd_courier_live_location || {};
  const dkd_location_value = dkd_service_network_safe_location_value(dkd_live_location_value);
  if (!dkd_location_value) return null;
  return {
    lat: dkd_location_value.dkd_lat_value,
    lng: dkd_location_value.dkd_lng_value,
    heading: dkd_live_location_value?.dkd_heading || 0,
    updated_at: dkd_live_location_value?.dkd_updated_at || new Date().toISOString(),
  };
}


function dkd_service_network_cargo_panel_status_value(dkd_status_value) {
  const dkd_status_key_value = String(dkd_status_value || '').toLowerCase();
  if (dkd_status_key_value.includes('completed') || dkd_status_key_value.includes('delivered') || dkd_status_key_value.includes('tamam')) return 'completed';
  if (dkd_status_key_value.includes('picked') || dkd_status_key_value.includes('way') || dkd_status_key_value.includes('progress') || dkd_status_key_value.includes('aktif') || dkd_status_key_value.includes('yolda')) return 'picked_up';
  if (dkd_status_key_value.includes('accepted') || dkd_status_key_value.includes('assigned') || dkd_status_key_value.includes('kurye') || dkd_status_key_value.includes('paid')) return 'accepted';
  if (dkd_status_key_value.includes('cancel')) return 'cancelled';
  return 'open';
}

function dkd_service_network_first_number_value(dkd_number_values = [], dkd_fallback_value = null) {
  const dkd_found_value = dkd_number_values.find((dkd_number_value) => Number.isFinite(Number(dkd_number_value)));
  return dkd_found_value == null ? dkd_fallback_value : Number(dkd_found_value);
}

function dkd_service_network_cargo_shipment_replica_value(dkd_order_value = {}) {
  const dkd_payload_value = dkd_service_network_payload_value(dkd_order_value);
  const dkd_live_location_value = dkd_order_value?.dkd_courier_live_location || {};
  const dkd_customer_full_name_value = dkd_service_network_first_text_value([
    dkd_payload_value?.customer_full_name,
    dkd_payload_value?.dkd_customer_full_name,
    [dkd_payload_value?.customer_first_name, dkd_payload_value?.customer_last_name].filter(Boolean).join(' '),
    [dkd_payload_value?.dkd_customer_first_name, dkd_payload_value?.dkd_customer_last_name].filter(Boolean).join(' '),
  ], 'Gönderici');
  return {
    ...dkd_payload_value,
    id: dkd_service_network_first_text_value([dkd_payload_value?.id, dkd_payload_value?.dkd_id, dkd_payload_value?.cargo_code, dkd_payload_value?.dkd_cargo_code, dkd_order_value?.dkd_source_id, dkd_order_value?.id, dkd_order_value?.dkd_order_key], 'dkd_cargo'),
    status: dkd_service_network_cargo_panel_status_value(dkd_service_network_first_text_value([dkd_payload_value?.status, dkd_payload_value?.package_status, dkd_payload_value?.dkd_status, dkd_order_value?.dkd_status], 'open')),
    created_at: dkd_service_network_first_text_value([dkd_payload_value?.created_at, dkd_payload_value?.dkd_created_at, dkd_order_value?.dkd_created_at], ''),
    customer_first_name: dkd_customer_full_name_value,
    customer_last_name: '',
    customer_national_id: dkd_service_network_first_text_value([dkd_payload_value?.customer_national_id, dkd_payload_value?.dkd_customer_national_id], ''),
    customer_phone_text: dkd_service_network_first_text_value([dkd_payload_value?.customer_phone_text, dkd_payload_value?.dkd_customer_phone_text, dkd_order_value?.dkd_contact_text], ''),
    package_content_text: dkd_service_network_first_text_value([dkd_payload_value?.package_content_text, dkd_payload_value?.dkd_package_content_text, dkd_payload_value?.package_title, dkd_order_value?.dkd_title], 'Kargo paketi'),
    package_weight_kg: dkd_service_network_first_number_value([dkd_payload_value?.package_weight_kg, dkd_payload_value?.dkd_package_weight_kg], null),
    package_image_url: dkd_service_network_first_text_value([dkd_payload_value?.package_image_url, dkd_payload_value?.dkd_package_image_url], ''),
    pickup_proof_image_url: dkd_service_network_first_text_value([dkd_payload_value?.pickup_proof_image_url, dkd_payload_value?.dkd_pickup_proof_image_url], ''),
    pickup_address_text: dkd_service_network_first_text_value([dkd_payload_value?.pickup_address_text, dkd_payload_value?.dkd_pickup_address_text, dkd_order_value?.dkd_address_text], 'Alım adresi bekleniyor'),
    delivery_address_text: dkd_service_network_first_text_value([dkd_payload_value?.delivery_address_text, dkd_payload_value?.dropoff_address_text, dkd_payload_value?.dkd_delivery_address_text, dkd_order_value?.dkd_delivery_text], 'Teslimat adresi bekleniyor'),
    delivery_note: dkd_service_network_first_text_value([dkd_payload_value?.delivery_note, dkd_payload_value?.dkd_delivery_note, dkd_payload_value?.customer_note_text, dkd_order_value?.dkd_note_text], '-'),
    customer_charge_tl: dkd_service_network_first_number_value([dkd_payload_value?.customer_charge_tl, dkd_payload_value?.dkd_customer_charge_tl, dkd_payload_value?.courier_fee_tl, dkd_payload_value?.fee_tl], 0),
    payment_status: dkd_service_network_first_text_value([dkd_payload_value?.payment_status, dkd_payload_value?.dkd_payment_status], 'pending'),
    courier_display_name: dkd_service_network_first_text_value([dkd_payload_value?.courier_display_name, dkd_payload_value?.assigned_courier_display_name], 'Henüz atanmadı'),
    courier_vehicle_type: dkd_service_network_first_text_value([dkd_payload_value?.courier_vehicle_type, dkd_payload_value?.assigned_courier_vehicle_type, dkd_live_location_value?.dkd_vehicle_type], 'moto'),
    courier_plate_no: dkd_service_network_first_text_value([dkd_payload_value?.courier_plate_no, dkd_payload_value?.assigned_courier_plate_no], ''),
    courier_eta_min: dkd_service_network_first_number_value([dkd_payload_value?.courier_eta_min, dkd_payload_value?.dkd_courier_eta_min, dkd_live_location_value?.dkd_eta_min], null),
  };
}

function DkdServiceNetworkOrderLine({ dkd_icon_value, dkd_label_value, dkd_text_value }) {
  const dkd_clean_text_value = String(dkd_text_value || '').trim();
  if (!dkd_clean_text_value) return null;
  return (
    <View style={dkd_styles.dkd_my_orders_detail_line_row}>
      <MaterialCommunityIcons name={dkd_icon_value} size={15} color="#BAE6FD" />
      <View style={dkd_styles.dkd_my_orders_detail_line_copy}>
        <Text style={dkd_styles.dkd_my_orders_detail_line_label}>{dkd_label_value}</Text>
        <Text style={dkd_styles.dkd_my_orders_detail_line_text}>{dkd_clean_text_value}</Text>
      </View>
    </View>
  );
}

function dkd_service_network_source_type_key_value(dkd_order_value = {}) {
  return String(dkd_order_value?.dkd_source_type || dkd_order_value?.dkd_category_key || '').toLocaleLowerCase('tr-TR');
}

function dkd_service_network_payload_value(dkd_order_value = {}) {
  const dkd_payload_value = dkd_order_value?.dkd_source_payload_value;
  return dkd_payload_value && typeof dkd_payload_value === 'object' ? dkd_payload_value : {};
}

function dkd_service_network_money_detail_text_value(dkd_input_value) {
  const dkd_money_value = Number(dkd_input_value || 0);
  if (!Number.isFinite(dkd_money_value) || dkd_money_value <= 0) return '';
  return `${dkd_money_value.toLocaleString('tr-TR')} TL`;
}

function dkd_service_network_first_text_value(dkd_candidate_values = [], dkd_fallback_value = '') {
  const dkd_found_value = (Array.isArray(dkd_candidate_values) ? dkd_candidate_values : [])
    .map((dkd_candidate_value) => String(dkd_candidate_value ?? '').trim())
    .find(Boolean);
  return dkd_found_value || dkd_fallback_value;
}


function DkdServiceNetworkSourceMetric({ dkd_icon_value, dkd_label_value, dkd_value_text, dkd_tone_value = 'cyan' }) {
  const dkd_metric_tone_value = dkd_tone_value === 'green'
    ? { dkd_bg_value: 'rgba(16,185,129,0.16)', dkd_border_value: 'rgba(134,239,172,0.24)', dkd_icon_color_value: '#86EFAC' }
    : dkd_tone_value === 'gold'
      ? { dkd_bg_value: 'rgba(253,230,138,0.15)', dkd_border_value: 'rgba(253,230,138,0.28)', dkd_icon_color_value: '#FDE68A' }
      : { dkd_bg_value: 'rgba(14,165,233,0.16)', dkd_border_value: 'rgba(125,211,252,0.24)', dkd_icon_color_value: '#BAE6FD' };
  return (
    <View style={[dkd_styles.dkd_source_metric_card, { backgroundColor: dkd_metric_tone_value.dkd_bg_value, borderColor: dkd_metric_tone_value.dkd_border_value }]}>
      <View style={dkd_styles.dkd_source_metric_icon_wrap}>
        <MaterialCommunityIcons name={dkd_icon_value} size={15} color={dkd_metric_tone_value.dkd_icon_color_value} />
      </View>
      <Text style={dkd_styles.dkd_source_metric_label}>{dkd_label_value}</Text>
      <Text numberOfLines={2} style={dkd_styles.dkd_source_metric_value}>{dkd_value_text || 'Bekleniyor'}</Text>
    </View>
  );
}

function DkdServiceNetworkSourceTimeline({ dkd_status_key_value = '', dkd_step_values = [] }) {
  const dkd_status_text_value = String(dkd_status_key_value || '').toLocaleLowerCase('tr-TR');
  const dkd_active_step_index_value = dkd_step_values.findIndex((dkd_step_value) => dkd_step_value.dkd_match_values.some((dkd_match_value) => dkd_status_text_value.includes(dkd_match_value)));
  const dkd_safe_active_step_index_value = dkd_active_step_index_value < 0 ? 0 : dkd_active_step_index_value;
  return (
    <View style={dkd_styles.dkd_source_timeline_row}>
      {dkd_step_values.map((dkd_step_value, dkd_step_index_value) => {
        const dkd_done_flag = dkd_step_index_value <= dkd_safe_active_step_index_value;
        return (
          <View key={dkd_step_value.dkd_key_value} style={dkd_styles.dkd_source_timeline_step}>
            <View style={dkd_styles.dkd_source_timeline_line_wrap}>
              <View style={[dkd_styles.dkd_source_timeline_dot, dkd_done_flag && dkd_styles.dkd_source_timeline_dot_done]} />
              {dkd_step_index_value < dkd_step_values.length - 1 ? <View style={[dkd_styles.dkd_source_timeline_line, dkd_done_flag && dkd_styles.dkd_source_timeline_line_done]} /> : null}
            </View>
            <Text style={[dkd_styles.dkd_source_timeline_label, dkd_done_flag && dkd_styles.dkd_source_timeline_label_done]}>{dkd_step_value.dkd_label_value}</Text>
          </View>
        );
      })}
    </View>
  );
}


function dkd_service_network_urgent_status_text_value(dkd_status_key_value = '') {
  const dkd_status_text_value = String(dkd_status_key_value || '').toLocaleLowerCase('tr-TR');
  const dkd_status_map_value = {
    dkd_open: 'Kurye bekliyor',
    dkd_fee_offer_waiting: 'Taşıma ücreti onayı bekliyor',
    dkd_fee_paid_shopping: 'Kurye alışverişte',
    dkd_product_total_waiting: 'Ürün tutarı onayı bekliyor',
    dkd_product_total_approved: 'Ürün alımı onaylandı',
    dkd_invoice_uploaded: 'Fatura yüklendi',
    dkd_on_the_way: 'Kurye yolda',
    dkd_completed: 'Tamamlandı',
    dkd_cancelled: 'İptal edildi',
  };
  return dkd_status_map_value[dkd_status_text_value] || 'Sipariş alındı';
}

function dkd_service_network_urgent_order_id_value(dkd_order_value = {}, dkd_payload_value = {}) {
  return dkd_service_network_first_text_value([
    dkd_payload_value?.dkd_order_id,
    dkd_payload_value?.id,
    dkd_payload_value?.order_id,
    dkd_order_value?.dkd_source_id,
    dkd_order_value?.dkd_courier_job_id,
  ], '');
}

function DkdServiceNetworkUrgentDetailCard({ dkd_order_value, dkd_on_after_action_value }) {
  const dkd_payload_value = dkd_service_network_payload_value(dkd_order_value);
  const dkd_item_values = Array.isArray(dkd_payload_value?.dkd_item_values)
    ? dkd_payload_value.dkd_item_values
    : (Array.isArray(dkd_payload_value?.dkd_items) ? dkd_payload_value.dkd_items : []);
  const dkd_message_values = Array.isArray(dkd_payload_value?.dkd_message_values) ? dkd_payload_value.dkd_message_values : [];
  const dkd_status_key_value = dkd_service_network_first_text_value([dkd_payload_value?.dkd_status_key, dkd_order_value?.dkd_status], 'dkd_open');
  const dkd_order_id_value = dkd_service_network_urgent_order_id_value(dkd_order_value, dkd_payload_value);
  const dkd_status_title_value = dkd_order_value?.dkd_status_title && !String(dkd_order_value.dkd_status_title).startsWith('dkd_')
    ? dkd_order_value.dkd_status_title
    : dkd_service_network_urgent_status_text_value(dkd_status_key_value);
  const dkd_invoice_url_value = String(dkd_payload_value?.dkd_invoice_image_url || '').trim();
  const dkd_courier_fee_text_value = dkd_service_network_money_detail_text_value(dkd_payload_value?.dkd_courier_fee_tl) || 'Kurye bekleniyor';
  const dkd_product_total_text_value = dkd_service_network_money_detail_text_value(dkd_payload_value?.dkd_product_total_tl) || 'Bekleniyor';
  const [dkd_message_draft_value, dkd_set_message_draft_value] = useState('');
  const [dkd_busy_action_key_value, dkd_set_busy_action_key_value] = useState('');
  const dkd_trimmed_message_value = dkd_message_draft_value.trim();

  const dkd_run_urgent_detail_action_value = useCallback(async (dkd_action_key_value, dkd_action_callback_value, dkd_success_text_value) => {
    if (!dkd_order_id_value) {
      Alert.alert('Acil Kurye', 'Sipariş numarası bulunamadı. Listeyi yenileyip tekrar dene.');
      return;
    }
    dkd_set_busy_action_key_value(dkd_action_key_value);
    try {
      const dkd_action_result_value = await dkd_action_callback_value();
      if (dkd_action_result_value?.error) throw dkd_action_result_value.error;
      if (dkd_action_key_value === 'dkd_message') dkd_set_message_draft_value('');
      await dkd_on_after_action_value?.();
      Alert.alert('Acil Kurye', dkd_success_text_value);
    } catch (dkd_error_value) {
      Alert.alert('Acil Kurye', dkd_error_value?.message || 'İşlem tamamlanamadı.');
    } finally {
      dkd_set_busy_action_key_value('');
    }
  }, [dkd_on_after_action_value, dkd_order_id_value]);

  const dkd_confirm_reject_urgent_fee_value = useCallback(() => {
    Alert.alert(
      'Taşıma ücretini reddet',
      'Bu taşıma teklifini reddetmek istiyor musun?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: () => dkd_run_urgent_detail_action_value('dkd_reject_fee', () => dkd_reject_urgent_courier_fee(dkd_order_id_value), 'Taşıma ücreti reddedildi.'),
        },
      ],
    );
  }, [dkd_order_id_value, dkd_run_urgent_detail_action_value]);

  return (
    <LinearGradient colors={['rgba(8,47,73,0.96)', 'rgba(49,46,129,0.78)', 'rgba(15,23,42,0.98)']} style={dkd_styles.dkd_source_detail_card}>
      <View style={dkd_styles.dkd_source_detail_header}>
        <View style={dkd_styles.dkd_source_detail_icon_wrap}><MaterialCommunityIcons name="bike-fast" size={19} color="#07131C" /></View>
        <View style={dkd_styles.dkd_source_detail_header_copy}>
          <Text style={dkd_styles.dkd_source_detail_kicker}>ACİL KURYE SİPARİŞLERİM</Text>
          <Text style={dkd_styles.dkd_source_detail_title}>Acil Kurye sipariş özeti</Text>
        </View>
        <Text style={dkd_styles.dkd_source_detail_status_pill}>{dkd_status_title_value}</Text>
      </View>
      <DkdServiceNetworkSourceTimeline
        dkd_status_key_value={dkd_status_key_value}
        dkd_step_values={[
          { dkd_key_value: 'dkd_received', dkd_label_value: 'Alındı', dkd_match_values: ['open', 'pending', 'siparis', 'fee'] },
          { dkd_key_value: 'dkd_courier', dkd_label_value: 'Kurye', dkd_match_values: ['paid', 'shopping', 'assigned', 'kurye'] },
          { dkd_key_value: 'dkd_delivery', dkd_label_value: 'Teslimat', dkd_match_values: ['way', 'picked', 'aktif', 'deliv'] },
          { dkd_key_value: 'dkd_done', dkd_label_value: 'Bitti', dkd_match_values: ['completed', 'tamam'] },
        ]}
      />
      <View style={dkd_styles.dkd_source_metric_grid}>
        <DkdServiceNetworkSourceMetric dkd_icon_value="bike-fast" dkd_label_value="Taşıma" dkd_value_text={dkd_courier_fee_text_value} />
        <DkdServiceNetworkSourceMetric dkd_icon_value="basket-check-outline" dkd_label_value="Ürün" dkd_value_text={dkd_product_total_text_value} dkd_tone_value="green" />
      </View>
      {dkd_status_key_value === 'dkd_fee_offer_waiting' ? (
        <View style={dkd_styles.dkd_source_action_stack}>
          <Pressable
            disabled={Boolean(dkd_busy_action_key_value)}
            onPress={() => dkd_run_urgent_detail_action_value('dkd_approve_fee', () => dkd_approve_urgent_courier_fee(dkd_order_id_value), 'Taşıma ücreti onaylandı. Kurye alışveriş adımına geçebilir.')}
            style={[dkd_styles.dkd_source_primary_action_button, dkd_busy_action_key_value === 'dkd_approve_fee' && dkd_styles.dkd_source_action_button_busy]}
          >
            <MaterialCommunityIcons name="credit-card-check-outline" size={16} color="#052E16" />
            <Text style={dkd_styles.dkd_source_primary_action_text}>{dkd_busy_action_key_value === 'dkd_approve_fee' ? 'Onaylanıyor...' : 'Taşıma Ücretini Onayla'}</Text>
          </Pressable>
          <Pressable
            disabled={Boolean(dkd_busy_action_key_value)}
            onPress={dkd_confirm_reject_urgent_fee_value}
            style={[dkd_styles.dkd_source_danger_action_button, dkd_busy_action_key_value === 'dkd_reject_fee' && dkd_styles.dkd_source_action_button_busy]}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#FEE2E2" />
            <Text style={dkd_styles.dkd_source_danger_action_text}>{dkd_busy_action_key_value === 'dkd_reject_fee' ? 'Reddediliyor...' : 'Taşıma Ücretini Reddet'}</Text>
          </Pressable>
        </View>
      ) : null}
      {dkd_status_key_value === 'dkd_product_total_waiting' ? (
        <Pressable
          disabled={Boolean(dkd_busy_action_key_value)}
          onPress={() => dkd_run_urgent_detail_action_value('dkd_approve_product_total', () => dkd_approve_urgent_courier_product_total(dkd_order_id_value), 'Ürün toplamı onaylandı.')}
          style={[dkd_styles.dkd_source_primary_action_button, dkd_busy_action_key_value === 'dkd_approve_product_total' && dkd_styles.dkd_source_action_button_busy]}
        >
          <MaterialCommunityIcons name="basket-check-outline" size={16} color="#052E16" />
          <Text style={dkd_styles.dkd_source_primary_action_text}>{dkd_busy_action_key_value === 'dkd_approve_product_total' ? 'Onaylanıyor...' : 'Ürün Toplamını Onayla'}</Text>
        </Pressable>
      ) : null}
      <View style={dkd_styles.dkd_source_message_input_card}>
        <View style={dkd_styles.dkd_source_message_input_header}>
          <MaterialCommunityIcons name="message-reply-text-outline" size={15} color="#BAE6FD" />
          <Text style={dkd_styles.dkd_source_message_input_title}>Kuryeye mesaj gönder</Text>
        </View>
        <TextInput
          value={dkd_message_draft_value}
          onChangeText={dkd_set_message_draft_value}
          placeholder="Kuryeye not yaz..."
          placeholderTextColor="rgba(226,242,255,0.48)"
          multiline
          style={dkd_styles.dkd_source_message_input}
        />
        <Pressable
          disabled={!dkd_trimmed_message_value || Boolean(dkd_busy_action_key_value)}
          onPress={() => dkd_run_urgent_detail_action_value('dkd_message', () => dkd_send_urgent_courier_message(dkd_order_id_value, dkd_trimmed_message_value), 'Mesaj kuryeye gönderildi.')}
          style={[dkd_styles.dkd_source_message_send_button, (!dkd_trimmed_message_value || Boolean(dkd_busy_action_key_value)) && dkd_styles.dkd_source_message_send_button_disabled]}
        >
          <MaterialCommunityIcons name={dkd_busy_action_key_value === 'dkd_message' ? 'loading' : 'send'} size={15} color="#07131C" />
          <Text style={dkd_styles.dkd_source_message_send_text}>{dkd_busy_action_key_value === 'dkd_message' ? 'Gönderiliyor...' : 'Kuryeye Mesaj Gönder'}</Text>
        </Pressable>
      </View>
      <View style={dkd_styles.dkd_source_item_list}>
        {dkd_item_values.length ? dkd_item_values.map((dkd_item_value, dkd_item_index_value) => (
          <View key={`${dkd_service_network_first_text_value([dkd_item_value?.dkd_store_name, dkd_item_value?.dkd_store_group_title], 'dkd_store')}_${dkd_item_index_value}`} style={dkd_styles.dkd_source_item_chip}>
            <Text style={dkd_styles.dkd_source_item_title}>{dkd_service_network_first_text_value([dkd_item_value?.dkd_store_name, dkd_item_value?.dkd_store_group_title], 'Mağaza')}</Text>
            <Text style={dkd_styles.dkd_source_item_text}>{dkd_service_network_first_text_value([dkd_item_value?.dkd_product_text, dkd_item_value?.dkd_title], 'Ürün listesi yazılmadı')}</Text>
            {dkd_service_network_money_detail_text_value(dkd_item_value?.dkd_product_total_tl) ? <Text style={dkd_styles.dkd_source_item_total_text}>Mağaza toplamı: {dkd_service_network_money_detail_text_value(dkd_item_value?.dkd_product_total_tl)}</Text> : null}
          </View>
        )) : <Text style={dkd_styles.dkd_source_empty_text}>Ürün listesi bekleniyor.</Text>}
      </View>
      {dkd_invoice_url_value ? <Image source={{ uri: dkd_invoice_url_value }} style={dkd_styles.dkd_source_preview_image} resizeMode="cover" /> : null}
      {dkd_message_values.length ? (
        <View style={dkd_styles.dkd_source_message_box}>
          <View style={dkd_styles.dkd_source_message_header}><MaterialCommunityIcons name="message-processing-outline" size={14} color="#BAE6FD" /><Text style={dkd_styles.dkd_source_message_title}>Canlı mesaj özeti</Text></View>
          {dkd_message_values.slice(-3).map((dkd_message_value, dkd_message_index_value) => (
            <View key={`${dkd_message_value?.dkd_created_at || 'dkd_message'}_${dkd_message_index_value}`} style={dkd_styles.dkd_source_message_bubble}>
              <Text style={dkd_styles.dkd_source_message_sender}>{dkd_message_value?.dkd_sender_display_name || (String(dkd_message_value?.dkd_sender_role_key || '') === 'dkd_courier' ? 'Kurye' : 'Müşteri')}</Text>
              <Text style={dkd_styles.dkd_source_message_text}>{dkd_message_value?.dkd_message_text || ''}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </LinearGradient>
  );
}

function DkdServiceNetworkCargoDetailCard({ dkd_order_value, dkd_on_open_cargo_tracking_value }) {
  const dkd_cargo_shipment_value = dkd_service_network_cargo_shipment_replica_value(dkd_order_value);
  const dkd_open_cargo_tracking_value = () => {
    dkd_on_open_cargo_tracking_value?.(dkd_order_value);
  };
  return (
    <DkdCargoShipmentDetailReplica
      dkd_shipment_value={dkd_cargo_shipment_value}
      dkd_on_open_live_map_value={dkd_open_cargo_tracking_value}
    />
  );
}

function DkdServiceNetworkSourceDetailCard({ dkd_order_value, dkd_on_after_action_value, dkd_on_open_cargo_tracking_value }) {
  const dkd_source_type_key_value = dkd_service_network_source_type_key_value(dkd_order_value);
  if (dkd_source_type_key_value.includes('urgent')) return <DkdServiceNetworkUrgentDetailCard dkd_order_value={dkd_order_value} dkd_on_after_action_value={dkd_on_after_action_value} />;
  if (dkd_source_type_key_value.includes('cargo') || dkd_source_type_key_value.includes('kargo')) return <DkdServiceNetworkCargoDetailCard dkd_order_value={dkd_order_value} dkd_on_open_cargo_tracking_value={dkd_on_open_cargo_tracking_value} />;
  return null;
}

function DkdServiceNetworkMyOrdersCard({ dkd_visible_value, dkd_profile_value }) {
  const [dkd_order_values, dkd_set_order_values] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_error_text_value, dkd_set_error_text_value] = useState('');
  const [dkd_filter_key_value, dkd_set_filter_key_value] = useState('active');
  const [dkd_selected_order_value, dkd_set_selected_order_value] = useState(null);
  const [dkd_orders_open_value, dkd_set_orders_open_value] = useState(false);
  const [dkd_mapbox_order_value, dkd_set_mapbox_order_value] = useState(null);
  const [dkd_deleting_order_key_value, dkd_set_deleting_order_key_value] = useState('');
  const dkd_toggle_animation_value = useRef(new Animated.Value(0)).current;
  const dkd_pulse_animation_value = useRef(new Animated.Value(0)).current;
  const dkd_selected_location_value = dkd_service_network_safe_location_value(dkd_selected_order_value?.dkd_courier_live_location || {});
  const dkd_selected_icon_info_value = dkd_service_network_order_icon_info_value(dkd_selected_order_value || {});
  const dkd_selected_source_type_key_value = dkd_service_network_source_type_key_value(dkd_selected_order_value || {});
  const dkd_selected_is_cargo_detail_value = dkd_selected_source_type_key_value.includes('cargo') || dkd_selected_source_type_key_value.includes('kargo');
  const dkd_filtered_order_values = useMemo(
    () => dkd_order_values.filter((dkd_order_value) => String(dkd_order_value?.dkd_status_group_key || 'active') === dkd_filter_key_value),
    [dkd_filter_key_value, dkd_order_values]
  );
  const dkd_count_by_filter_value = useMemo(() => dkd_service_network_order_filter_values.reduce((dkd_accumulator_value, dkd_filter_value) => {
    dkd_accumulator_value[dkd_filter_value.dkd_key_value] = dkd_order_values.filter((dkd_order_value) => String(dkd_order_value?.dkd_status_group_key || 'active') === dkd_filter_value.dkd_key_value).length;
    return dkd_accumulator_value;
  }, {}), [dkd_order_values]);

  const dkd_load_orders_value = useCallback(async () => {
    if (!dkd_visible_value) return;
    dkd_set_loading_value(true);
    dkd_set_error_text_value('');
    const dkd_result_value = await dkd_fetch_service_network_my_orders_value({ dkd_profile_value, dkd_limit_value: 60 });
    if (dkd_result_value?.error) {
      dkd_set_error_text_value(dkd_result_value.error?.message || 'Siparişler şu anda okunamadı.');
      dkd_set_order_values([]);
    } else {
      dkd_set_order_values(Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : []);
    }
    dkd_set_loading_value(false);
  }, [dkd_profile_value, dkd_visible_value]);

  useEffect(() => {
    if (!dkd_visible_value) return;
    dkd_load_orders_value();
  }, [dkd_load_orders_value, dkd_visible_value]);

  useEffect(() => {
    Animated.timing(dkd_toggle_animation_value, {
      toValue: dkd_orders_open_value ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dkd_orders_open_value, dkd_toggle_animation_value]);

  useEffect(() => {
    if (!dkd_visible_value) return undefined;
    const dkd_loop_animation_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_pulse_animation_value, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(dkd_pulse_animation_value, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    dkd_loop_animation_value.start();
    return () => dkd_loop_animation_value.stop();
  }, [dkd_pulse_animation_value, dkd_visible_value]);

  const dkd_active_order_count_value = dkd_count_by_filter_value.active || 0;
  const dkd_completed_order_count_value = dkd_count_by_filter_value.completed || 0;
  const dkd_header_scale_value = dkd_pulse_animation_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.022] });
  const dkd_icon_float_value = dkd_pulse_animation_value.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const dkd_chevron_rotate_value = dkd_toggle_animation_value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const dkd_selected_live_text_value = dkd_selected_location_value
    ? `${dkd_selected_location_value.dkd_lat_value.toFixed(5)}, ${dkd_selected_location_value.dkd_lng_value.toFixed(5)}`
    : 'Kurye görevi kabul edince canlı takip burada açılır.';

  const dkd_toggle_orders_open_value = useCallback(() => {
    dkd_set_orders_open_value((dkd_previous_value) => !dkd_previous_value);
  }, []);

  const dkd_open_mapbox_tracking_value = useCallback((dkd_order_value) => {
    dkd_set_mapbox_order_value(dkd_order_value || null);
  }, []);

  const dkd_close_mapbox_tracking_value = useCallback(() => {
    dkd_set_mapbox_order_value(null);
  }, []);

  const dkd_delete_completed_order_value = useCallback((dkd_order_value) => {
    if (!dkd_order_value || String(dkd_order_value?.dkd_status_group_key || '') !== 'completed') return;
    Alert.alert(
      'Tamamlanan siparişi sil',
      'Bu sipariş tamamlanan listenden ve veritabanındaki tamamlanan kayıt kaynağından silinecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            dkd_set_deleting_order_key_value(dkd_order_value.dkd_order_key);
            const dkd_delete_result_value = await dkd_delete_completed_service_network_order_value({ dkd_profile_value, dkd_order_value });
            dkd_set_deleting_order_key_value('');
            if (dkd_delete_result_value?.error) {
              Alert.alert('Silinemedi', dkd_delete_result_value.error?.message || 'Tamamlanan sipariş silinemedi.');
              return;
            }
            dkd_set_order_values((dkd_previous_values) => dkd_previous_values.filter((dkd_previous_order_value) => dkd_previous_order_value.dkd_order_key !== dkd_order_value.dkd_order_key));
            if (dkd_selected_order_value?.dkd_order_key === dkd_order_value.dkd_order_key) dkd_set_selected_order_value(null);
          },
        },
      ]
    );
  }, [dkd_profile_value, dkd_selected_order_value?.dkd_order_key]);

  const dkd_mapbox_task_value = dkd_mapbox_order_value ? dkd_service_network_mapbox_task_value(dkd_mapbox_order_value) : null;
  const dkd_mapbox_location_value = dkd_mapbox_order_value ? dkd_service_network_mapbox_location_value(dkd_mapbox_order_value) : null;

  return (
    <View style={dkd_styles.dkd_my_orders_shell}>
      <Animated.View style={[dkd_styles.dkd_my_orders_header_animated_wrap, { transform: [{ scale: dkd_header_scale_value }] }]}>
        <Pressable onPress={dkd_toggle_orders_open_value} style={dkd_styles.dkd_my_orders_header_pressable}>
          <LinearGradient colors={["#22D3EE", "#2563EB", "#7C3AED", "#0F172A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dkd_styles.dkd_my_orders_header_card}>
            <Animated.View style={[dkd_styles.dkd_my_orders_icon_float_wrap, { transform: [{ translateY: dkd_icon_float_value }] }]}>
              <LinearGradient colors={["#FDE68A", "#BAE6FD", "#FFFFFF"]} style={dkd_styles.dkd_my_orders_icon_stack}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={30} color="#07131C" />
              </LinearGradient>
              <View style={dkd_styles.dkd_my_orders_icon_badge}>
                <MaterialCommunityIcons name="lightning-bolt" size={12} color="#431407" />
              </View>
            </Animated.View>
            <View style={dkd_styles.dkd_my_orders_header_copy}>
              <View style={dkd_styles.dkd_my_orders_kicker_row}>
                <MaterialCommunityIcons name="radar" size={13} color="#FDE68A" />
                <Text style={dkd_styles.dkd_my_orders_kicker}>CANLI SİPARİŞ TAKİBİ</Text>
              </View>
              <Text style={dkd_styles.dkd_my_orders_title}>Siparişlerim</Text>
              <Text style={dkd_styles.dkd_my_orders_subtitle}>{dkd_orders_open_value ? `${dkd_active_order_count_value} aktif takip • ${dkd_completed_order_count_value} tamamlanan` : 'Canlı kurye takibi ve sipariş geçmişi'}</Text>
            </View>
            <View style={dkd_styles.dkd_my_orders_header_actions}>
              <Pressable
                onPress={(dkd_press_event_value) => {
                  dkd_press_event_value?.stopPropagation?.();
                  dkd_load_orders_value();
                }}
                disabled={dkd_loading_value}
                style={dkd_styles.dkd_my_orders_refresh_button}
              >
                <MaterialCommunityIcons name={dkd_loading_value ? 'loading' : 'refresh'} size={18} color="#E0F2FE" />
              </Pressable>
              <Animated.View style={[dkd_styles.dkd_my_orders_chevron_button, { transform: [{ rotate: dkd_chevron_rotate_value }] }]}>
                <MaterialCommunityIcons name="chevron-down" size={23} color="#07131C" />
              </Animated.View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {!dkd_orders_open_value ? null : (
        <>
          <View style={dkd_styles.dkd_my_orders_filter_row}>
            {dkd_service_network_order_filter_values.map((dkd_filter_value) => {
              const dkd_filter_active_value = dkd_filter_key_value === dkd_filter_value.dkd_key_value;
              return (
                <Pressable key={dkd_filter_value.dkd_key_value} onPress={() => dkd_set_filter_key_value(dkd_filter_value.dkd_key_value)} style={[dkd_styles.dkd_my_orders_filter_chip, dkd_filter_active_value && dkd_styles.dkd_my_orders_filter_chip_active]}>
                  <MaterialCommunityIcons name={dkd_filter_value.dkd_icon_value} size={14} color={dkd_filter_active_value ? '#07131C' : '#BAE6FD'} />
                  <Text style={[dkd_styles.dkd_my_orders_filter_text, dkd_filter_active_value && dkd_styles.dkd_my_orders_filter_text_active]}>{dkd_filter_value.dkd_label_value} ({dkd_count_by_filter_value[dkd_filter_value.dkd_key_value] || 0})</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={dkd_styles.dkd_my_orders_list_shell}>
            {dkd_loading_value ? (
              <View style={dkd_styles.dkd_my_orders_empty_card}><MaterialCommunityIcons name="progress-clock" size={22} color="#BAE6FD" /><Text style={dkd_styles.dkd_my_orders_empty_text}>Siparişler yükleniyor…</Text></View>
            ) : dkd_error_text_value ? (
              <View style={dkd_styles.dkd_my_orders_empty_card}><MaterialCommunityIcons name="alert-circle-outline" size={22} color="#FCA5A5" /><Text style={dkd_styles.dkd_my_orders_empty_text}>{dkd_error_text_value}</Text></View>
            ) : dkd_filtered_order_values.length ? (
              dkd_filtered_order_values.map((dkd_order_value) => {
                const dkd_order_icon_info_value = dkd_service_network_order_icon_info_value(dkd_order_value);
                const dkd_status_group_value = String(dkd_order_value?.dkd_status_group_key || 'active');
                const dkd_completed_value = dkd_status_group_value === 'completed';
                const dkd_cancelled_value = dkd_status_group_value === 'cancelled';
                const dkd_deleting_value = dkd_deleting_order_key_value === dkd_order_value.dkd_order_key;
                const dkd_order_gradient_value = dkd_completed_value
                  ? ['rgba(6,78,59,0.94)', 'rgba(15,118,110,0.84)', 'rgba(15,23,42,0.96)']
                  : dkd_cancelled_value
                    ? ['rgba(127,29,29,0.88)', 'rgba(76,29,149,0.72)', 'rgba(15,23,42,0.96)']
                    : ['rgba(15,23,42,0.98)', 'rgba(30,64,175,0.76)', 'rgba(88,28,135,0.78)'];
                return (
                  <Pressable key={dkd_order_value.dkd_order_key} onPress={() => dkd_set_selected_order_value(dkd_order_value)} style={dkd_styles.dkd_my_orders_order_pressable}>
                    <LinearGradient colors={dkd_order_gradient_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dkd_styles.dkd_my_orders_order_card}>
                      <View style={[dkd_styles.dkd_my_orders_order_icon_wrap, { backgroundColor: dkd_order_icon_info_value.dkd_bg_value }]}>
                        <MaterialCommunityIcons name={dkd_order_icon_info_value.dkd_icon_value} size={22} color={dkd_order_icon_info_value.dkd_color_value} />
                      </View>
                      <View style={dkd_styles.dkd_my_orders_order_copy}>
                        <View style={dkd_styles.dkd_my_orders_order_title_row}>
                          <Text numberOfLines={1} style={dkd_styles.dkd_my_orders_order_title}>{dkd_order_value.dkd_title}</Text>
                          <Text numberOfLines={1} style={dkd_styles.dkd_my_orders_type_pill}>{dkd_order_value.dkd_subtitle || 'Hizmet'}</Text>
                        </View>
                        <View style={dkd_styles.dkd_my_orders_order_route_row}>
                          <MaterialCommunityIcons name="map-marker-radius-outline" size={13} color="rgba(226,242,255,0.72)" />
                          <Text numberOfLines={1} style={dkd_styles.dkd_my_orders_order_subtitle}>{dkd_order_value.dkd_subtitle || 'Hizmet Ağı'} • {dkd_service_network_format_date_value(dkd_order_value.dkd_created_at)}</Text>
                        </View>
                        <View style={dkd_styles.dkd_my_orders_order_meta_row}>
                          <Text style={dkd_styles.dkd_my_orders_status_pill}>{dkd_order_value.dkd_status_title || 'Sipariş alındı'}</Text>
                          <Text style={dkd_styles.dkd_my_orders_detail_hint_pill}>Detay aç</Text>
                        </View>
                      </View>
                      <View style={dkd_styles.dkd_my_orders_order_action_area}>
                        {dkd_completed_value ? (
                          <Pressable
                            onPress={(dkd_press_event_value) => {
                              dkd_press_event_value?.stopPropagation?.();
                              dkd_delete_completed_order_value(dkd_order_value);
                            }}
                            disabled={dkd_deleting_value}
                            style={dkd_styles.dkd_my_orders_delete_button}
                          >
                            <MaterialCommunityIcons name={dkd_deleting_value ? 'loading' : 'trash-can-outline'} size={18} color="#FEE2E2" />
                          </Pressable>
                        ) : (
                          <View style={dkd_styles.dkd_my_orders_chevron_circle}>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#07131C" />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </Pressable>
                );
              })
            ) : (
              <View style={dkd_styles.dkd_my_orders_empty_card}><MaterialCommunityIcons name="clipboard-text-search-outline" size={22} color="#BAE6FD" /><Text style={dkd_styles.dkd_my_orders_empty_text}>Bu filtrede sipariş yok.</Text></View>
            )}
          </View>
        </>
      )}

      <Modal visible={Boolean(dkd_selected_order_value)} transparent animationType="fade" onRequestClose={() => dkd_set_selected_order_value(null)}>
        <View style={dkd_styles.dkd_my_orders_detail_overlay}>
          <View style={dkd_styles.dkd_my_orders_detail_card}>
            <View style={dkd_styles.dkd_my_orders_detail_header}>
              <View style={[dkd_styles.dkd_my_orders_detail_icon_wrap, { backgroundColor: dkd_selected_icon_info_value.dkd_bg_value }]}>
                <MaterialCommunityIcons name={dkd_selected_icon_info_value.dkd_icon_value} size={24} color={dkd_selected_icon_info_value.dkd_color_value} />
              </View>
              <View style={dkd_styles.dkd_my_orders_detail_title_copy}>
                <Text style={dkd_styles.dkd_my_orders_detail_kicker}>{dkd_selected_order_value?.dkd_subtitle || 'Hizmet Ağı'}</Text>
                <Text style={dkd_styles.dkd_my_orders_detail_title}>{dkd_selected_order_value?.dkd_title || 'Sipariş detayı'}</Text>
              </View>
              <Pressable onPress={() => dkd_set_selected_order_value(null)} style={dkd_styles.dkd_my_orders_detail_close_button}>
                <MaterialCommunityIcons name="close" size={21} color="#F8FAFC" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dkd_styles.dkd_my_orders_detail_scroll_content}>
              {!dkd_selected_is_cargo_detail_value ? (
                <View style={dkd_styles.dkd_my_orders_detail_status_card}>
                  <MaterialCommunityIcons name="timeline-check-outline" size={20} color="#FDE68A" />
                  <View style={dkd_styles.dkd_my_orders_detail_line_copy}>
                    <Text style={dkd_styles.dkd_my_orders_detail_line_label}>Durum</Text>
                    <Text style={dkd_styles.dkd_my_orders_detail_status_text}>{dkd_selected_order_value?.dkd_status_title || 'Sipariş alındı'}</Text>
                  </View>
                </View>
              ) : null}

              {!dkd_selected_is_cargo_detail_value && String(dkd_selected_order_value?.dkd_status_group_key || 'active') === 'active' ? (
                <View style={dkd_styles.dkd_my_orders_live_card}>
                  <View style={dkd_styles.dkd_my_orders_live_header}>
                    <MaterialCommunityIcons name="mapbox" size={18} color="#07131C" />
                    <Text style={dkd_styles.dkd_my_orders_live_title}>Kurye Canlı Takip</Text>
                  </View>
                  <Text style={dkd_styles.dkd_my_orders_live_text}>{dkd_selected_live_text_value}</Text>
                  <Pressable onPress={() => dkd_open_mapbox_tracking_value(dkd_selected_order_value)} style={dkd_styles.dkd_my_orders_mapbox_button}>
                    <MaterialCommunityIcons name="map-marker-path" size={18} color="#07131C" />
                    <Text style={dkd_styles.dkd_my_orders_mapbox_button_text}>Kurye Canlı Takip</Text>
                  </Pressable>
                </View>
              ) : null}

              <DkdServiceNetworkSourceDetailCard
                dkd_order_value={dkd_selected_order_value || {}}
                dkd_on_after_action_value={dkd_load_orders_value}
                dkd_on_open_cargo_tracking_value={dkd_open_mapbox_tracking_value}
              />

              {!dkd_selected_is_cargo_detail_value ? (
                <View style={dkd_styles.dkd_my_orders_detail_grid}>
                  <DkdServiceNetworkOrderLine dkd_icon_value="map-marker-outline" dkd_label_value="Alım / hizmet adresi" dkd_text_value={dkd_selected_order_value?.dkd_address_text} />
                  <DkdServiceNetworkOrderLine dkd_icon_value="map-marker-check-outline" dkd_label_value="Teslim / varış" dkd_text_value={dkd_selected_order_value?.dkd_delivery_text} />
                  <DkdServiceNetworkOrderLine dkd_icon_value="note-text-outline" dkd_label_value="Not" dkd_text_value={dkd_selected_order_value?.dkd_note_text} />
                  <DkdServiceNetworkOrderLine dkd_icon_value="calendar-clock" dkd_label_value="Zaman" dkd_text_value={dkd_selected_order_value?.dkd_schedule_text} />
                  <DkdServiceNetworkOrderLine dkd_icon_value="cash-multiple" dkd_label_value="Bütçe / tutar" dkd_text_value={dkd_selected_order_value?.dkd_budget_text} />
                  <DkdServiceNetworkOrderLine dkd_icon_value="phone-outline" dkd_label_value="İletişim" dkd_text_value={dkd_selected_order_value?.dkd_contact_text} />
                </View>
              ) : null}

              {String(dkd_selected_order_value?.dkd_status_group_key || '') === 'completed' ? (
                <Pressable onPress={() => dkd_delete_completed_order_value(dkd_selected_order_value)} style={dkd_styles.dkd_my_orders_detail_delete_button}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FEE2E2" />
                  <Text style={dkd_styles.dkd_my_orders_detail_delete_text}>Tamamlanan siparişi sil</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DkdCargoLiveMapModal
        dkd_visible_value={Boolean(dkd_mapbox_order_value)}
        dkd_task_value={dkd_mapbox_task_value}
        dkd_current_location_value={dkd_mapbox_location_value}
        dkd_vehicle_type_value={dkd_mapbox_order_value?.dkd_courier_live_location?.dkd_vehicle_type || 'moto'}
        dkd_refreshing_value={dkd_loading_value}
        dkd_on_close_value={dkd_close_mapbox_tracking_value}
        dkd_on_refresh_value={dkd_load_orders_value}
      />
    </View>
  );
}

function DkdServiceNetworkHero({ dkd_on_payment_method_press_value }) {
  const dkd_wallet_corner_cue_anim_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dkd_wallet_corner_cue_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_wallet_corner_cue_anim_value, {
          toValue: 1,
          duration: 720,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dkd_wallet_corner_cue_anim_value, {
          toValue: 0,
          duration: 720,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    dkd_wallet_corner_cue_loop_value.start();
    return () => dkd_wallet_corner_cue_loop_value.stop();
  }, [dkd_wallet_corner_cue_anim_value]);

  const dkd_wallet_corner_cue_scale_value = dkd_wallet_corner_cue_anim_value.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.14],
  });
  const dkd_wallet_corner_cue_opacity_value = dkd_wallet_corner_cue_anim_value.interpolate({
    inputRange: [0, 1],
    outputRange: [0.70, 1],
  });

  return (
    <LinearGradient colors={['#0D2C45', '#23306E', '#7C2D58']} style={dkd_styles.dkd_hero_shell}>
      <View style={dkd_styles.dkd_hero_icon_cloud}>
        <MaterialCommunityIcons name="hanger" size={22} color="#FDE68A" />
        <MaterialCommunityIcons name="cellphone-cog" size={22} color="#93C5FD" />
        <MaterialCommunityIcons name="tow-truck" size={23} color="#FCA5A5" />
        <MaterialCommunityIcons name="taxi" size={22} color="#FCD34D" />
        <MaterialCommunityIcons name="flower-tulip-outline" size={22} color="#F9A8D4" />
        <MaterialCommunityIcons name="storefront-outline" size={22} color="#86EFAC" />
        <MaterialCommunityIcons name="silverware-fork-knife" size={22} color="#FDBA74" />
        <MaterialCommunityIcons name="car-wrench" size={22} color="#7DD3FC" />
        <MaterialCommunityIcons name="truck-fast-outline" size={22} color="#C4B5FD" />
      </View>
      <Text style={dkd_styles.dkd_hero_eyebrow}>DraBornGo HİZMET AĞI</Text>
      <Text style={dkd_styles.dkd_hero_title}>Şehiriçi & Şehirlerarası ihtiyacınız olan bütün hizmetlerden yararlanın.</Text>
      {dkd_payments_enabled_value ? (
      <Pressable onPress={dkd_on_payment_method_press_value} style={({ pressed: dkd_pressed_value }) => [dkd_styles.dkd_hero_wallet_button, dkd_pressed_value && dkd_styles.dkd_hero_wallet_button_pressed]}>
        <Animated.View
          pointerEvents="none"
          style={[
            dkd_styles.dkd_hero_wallet_corner_cue,
            {
              opacity: dkd_wallet_corner_cue_opacity_value,
              transform: [{ scale: dkd_wallet_corner_cue_scale_value }],
            },
          ]}
        >
          <View style={dkd_styles.dkd_hero_wallet_corner_cue_ring} />
          <MaterialCommunityIcons name="cursor-default-click-outline" size={15} color="#082032" />
        </Animated.View>
        <View style={dkd_styles.dkd_hero_wallet_icon_wrap}>
          <MaterialCommunityIcons name="wallet-plus-outline" size={20} color="#07131C" />
        </View>
        <View style={dkd_styles.dkd_hero_wallet_copy}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.84} style={dkd_styles.dkd_hero_wallet_title}>Cüzdanına Para Yükle</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={dkd_styles.dkd_hero_wallet_text}>TL bakiyeni hızlıca ekle</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={21} color="#BAE6FD" />
      </Pressable>
      ) : null}
    </LinearGradient>
  );
}


function DkdServiceNetworkFeaturedActions({
  dkd_active_operation_value,
  dkd_on_open_operation_value,
}) {
  const dkd_urgent_courier_featured_hidden_value = true;
  const dkd_featured_action_values = [
    ...(dkd_urgent_courier_featured_hidden_value ? [] : [{
      dkd_key_value: 'dkd_urgent_courier',
      dkd_title_value: 'Acil Kurye',
      dkd_eyebrow_value: 'HIZLI TESLİMAT',
      dkd_desc_value: 'Market, fırın ve günlük ihtiyaçları hızlı kurye akışına bağla.',
      dkd_icon_value: 'bike-fast',
      dkd_badge_value: 'Vitrin',
      dkd_gradient_value: ['rgba(255,221,94,0.30)', 'rgba(255,82,132,0.24)', 'rgba(46,20,58,0.97)'],
      dkd_icon_gradient_value: ['#FFD85F', '#FF7EA7', '#6CE7FF'],
    }]),
    {
      dkd_key_value: 'dkd_cargo_choices',
      dkd_title_value: 'Gönderi Paneli',
      dkd_eyebrow_value: '',
      dkd_desc_value: 'İhtiyacın olanı gönder, Canlı Takip et ve Kısa sürede teslim edelim.',
      dkd_icon_value: 'package-variant-plus',
      dkd_badge_value: 'Vitrin',
      dkd_gradient_value: ['rgba(92,255,214,0.30)', 'rgba(18,126,96,0.24)', 'rgba(7,24,18,0.96)'],
      dkd_icon_gradient_value: ['#71FFE1', '#39E7B3', '#159F73'],
    },
    {
      dkd_key_value: 'dkd_logistics',
      dkd_title_value: 'Nakliye/Lojistik',
      dkd_eyebrow_value: '',
      dkd_desc_value: 'Taşıma işi oluştur, teklifleri takip et ve lojistik akışını başlat.',
      dkd_icon_value: 'truck-delivery-outline',
      dkd_badge_value: 'Vitrin',
      dkd_gradient_value: ['rgba(124,58,237,0.32)', 'rgba(6,182,212,0.25)', 'rgba(15,23,42,0.98)'],
      dkd_icon_gradient_value: ['#A78BFA', '#22D3EE', '#FDE68A'],
    },
  ];

  return (
    <View style={dkd_styles.dkd_featured_action_shell}>
      <View style={dkd_styles.dkd_featured_action_page_badge}>
        <MaterialCommunityIcons name="star-four-points-circle" size={16} color="#FDE68A" />
        <Text style={dkd_styles.dkd_featured_action_header_chip_text}>Vitrin</Text>
      </View>
      <View style={dkd_styles.dkd_featured_action_ribbon}>
        <MaterialCommunityIcons name="star-shooting" size={16} color="#07131C" />
        <Text style={dkd_styles.dkd_featured_action_ribbon_text}>ÖNE ÇIKANLAR</Text>
      </View>
      <View style={dkd_styles.dkd_featured_action_grid}>
        {dkd_featured_action_values.map((dkd_featured_action_value) => {
          const dkd_featured_active_value = dkd_active_operation_value === dkd_featured_action_value.dkd_key_value
            || (dkd_featured_action_value.dkd_key_value === 'dkd_cargo_choices' && ['dkd_cargo_create', 'dkd_cargo_shipments'].includes(dkd_active_operation_value));
          return (
            <Pressable
              key={dkd_featured_action_value.dkd_key_value}
              onPress={() => dkd_on_open_operation_value?.(dkd_featured_action_value.dkd_key_value)}
              style={dkd_styles.dkd_featured_action_pressable}
            >
              <LinearGradient
                colors={dkd_featured_action_value.dkd_gradient_value}
                style={[dkd_styles.dkd_featured_action_card, dkd_featured_active_value && dkd_styles.dkd_featured_action_card_active]}
              >
                <View style={dkd_styles.dkd_featured_action_corner_mark}>
                  <MaterialCommunityIcons name="star-four-points" size={12} color="#07131C" />
                </View>
                <View style={dkd_styles.dkd_featured_action_top_row}>
                  <LinearGradient colors={dkd_featured_action_value.dkd_icon_gradient_value} style={dkd_styles.dkd_featured_action_icon_shell}>
                    <MaterialCommunityIcons name={dkd_featured_action_value.dkd_icon_value} size={21} color="#07131C" />
                  </LinearGradient>
                  <View style={dkd_styles.dkd_featured_action_badge}>
                    <Text style={dkd_styles.dkd_featured_action_badge_text}>{dkd_featured_action_value.dkd_badge_value}</Text>
                  </View>
                </View>
                {dkd_featured_action_value.dkd_eyebrow_value ? <Text style={dkd_styles.dkd_featured_action_eyebrow}>{dkd_featured_action_value.dkd_eyebrow_value}</Text> : null}
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74} style={dkd_styles.dkd_featured_action_card_title}>{dkd_featured_action_value.dkd_title_value}</Text>
                <Text style={dkd_styles.dkd_featured_action_desc}>{dkd_featured_action_value.dkd_desc_value}</Text>
                <View style={dkd_styles.dkd_featured_action_cta_row}>
                  <Text style={dkd_styles.dkd_featured_action_cta_text}>{dkd_featured_active_value ? 'Açık' : 'Sipariş Oluştur'}</Text>
                  <MaterialCommunityIcons name={dkd_featured_active_value ? 'check-circle' : 'arrow-down-circle'} size={17} color="#BAE6FD" />
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DkdServiceNetworkFeaturedInlinePanel({
  dkd_active_operation_value,
  dkd_set_cargo_panel_mode_value,
  dkd_profile_value,
  dkd_set_profile_value,
  dkd_current_location_value,
  dkd_is_admin_value = false,
  dkd_on_close_value,
  dkd_on_home_return_value,
}) {
  const dkd_wallet_tl_value = useMemo(() => resolveUnifiedWalletTl(dkd_profile_value || {}), [dkd_profile_value]);
  const dkd_sync_wallet_after_topup_value = useCallback((dkd_wallet_after_value) => {
    const dkd_numeric_wallet_value = Number(dkd_wallet_after_value);
    if (!Number.isFinite(dkd_numeric_wallet_value)) return;
    dkd_set_profile_value?.((dkd_previous_profile_value) => (dkd_previous_profile_value ? {
      ...dkd_previous_profile_value,
      ...dkd_build_unified_wallet_patch_value(dkd_numeric_wallet_value),
    } : dkd_previous_profile_value));
  }, [dkd_set_profile_value]);
  const dkd_courier_approved_value = String(dkd_profile_value?.courier_status || '').toLowerCase() === 'approved';
  const dkd_active_title_value = dkd_active_operation_value === 'dkd_logistics'
    ? 'Nakliye/Lojistik'
    : dkd_active_operation_value === 'dkd_urgent_courier'
      ? 'Acil Kurye'
      : dkd_active_operation_value === 'dkd_cargo_create'
        ? 'Gönderi Oluştur'
        : dkd_active_operation_value === 'dkd_cargo_shipments'
          ? 'Gönderilerim'
          : 'Gönderi Paneli';
  if (!dkd_active_operation_value) return null;

  return (
    <View style={dkd_styles.dkd_featured_inline_panel_shell}>
      <LinearGradient colors={['rgba(15,23,42,0.98)', 'rgba(30,41,59,0.96)', 'rgba(8,13,28,0.98)']} style={dkd_styles.dkd_featured_inline_panel_header}>
        <View style={dkd_styles.dkd_featured_inline_panel_header_icon}>
          <MaterialCommunityIcons name="star-shooting" size={20} color="#07131C" />
        </View>
        <View style={dkd_styles.dkd_featured_inline_panel_header_copy}>
          <Text style={dkd_styles.dkd_featured_inline_panel_kicker}>VİTRİN AKIŞI</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76} style={dkd_styles.dkd_featured_inline_panel_title}>{dkd_active_title_value}</Text>
          <Text style={dkd_styles.dkd_featured_inline_panel_text}>Hemen gelelim Dilediğini gönder, Hızlı ve Sorunsuz şekilde ulaşsın.</Text>
        </View>
        <Pressable onPress={dkd_on_close_value} style={dkd_styles.dkd_featured_inline_close_button}>
          <MaterialCommunityIcons name="chevron-up" size={21} color="#EAF6FF" />
        </Pressable>
      </LinearGradient>

      {dkd_active_operation_value === 'dkd_cargo_choices' ? (
        <View style={dkd_styles.dkd_cargo_choice_grid}>
          <View style={dkd_styles.dkd_cargo_choice_card_pressable}>
            <Pressable onPress={() => { dkd_set_cargo_panel_mode_value('create'); }} style={dkd_styles.dkd_cargo_choice_card_pressable_inner}>
              <LinearGradient colors={['rgba(92,255,214,0.32)', 'rgba(18,126,96,0.22)', 'rgba(7,24,18,0.98)']} style={dkd_styles.dkd_cargo_choice_card}>
                <View style={dkd_styles.dkd_cargo_choice_icon_wrap}><MaterialCommunityIcons name="package-variant-plus" size={24} color="#07131C" /></View>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.80} style={dkd_styles.dkd_cargo_choice_title}>Gönderi Oluştur</Text>
                <Text style={dkd_styles.dkd_cargo_choice_text}>Yeni gönderi bilgilerini gir ve kurye havuzuna düşür.</Text>
                <View style={dkd_styles.dkd_cargo_choice_cta}><Text style={dkd_styles.dkd_cargo_choice_cta_text}>Aç</Text><MaterialCommunityIcons name="arrow-down-circle" size={16} color="#BAE6FD" /></View>
              </LinearGradient>
            </Pressable>
          </View>
          <Pressable onPress={() => { dkd_set_cargo_panel_mode_value('shipments'); }} style={dkd_styles.dkd_cargo_choice_card_pressable}>
            <LinearGradient colors={['rgba(96,165,250,0.26)', 'rgba(124,58,237,0.18)', 'rgba(12,18,38,0.96)']} style={dkd_styles.dkd_cargo_choice_card}>
              <View style={dkd_styles.dkd_cargo_choice_icon_wrap}><MaterialCommunityIcons name="package-variant" size={24} color="#07131C" /></View>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.80} style={dkd_styles.dkd_cargo_choice_title}>Gönderilerim</Text>
              <Text style={dkd_styles.dkd_cargo_choice_text}>Açık, yolda ve biten kargo gönderilerini takip et.</Text>
              <View style={dkd_styles.dkd_cargo_choice_cta}><Text style={dkd_styles.dkd_cargo_choice_cta_text}>Aç</Text><MaterialCommunityIcons name="arrow-down-circle" size={16} color="#BAE6FD" /></View>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}

      {dkd_active_operation_value === 'dkd_cargo_create' || dkd_active_operation_value === 'dkd_cargo_shipments' ? (
        <DkdCargoSenderPanel
          dkd_visible_value
          dkd_panel_mode_value={dkd_active_operation_value === 'dkd_cargo_shipments' ? 'shipments_only' : 'create_only'}
          dkd_current_location_value={dkd_current_location_value}
          dkd_wallet_tl_value={dkd_wallet_tl_value}
          dkd_on_wallet_after_payment_value={dkd_sync_wallet_after_topup_value}
          dkd_on_created_value={() => dkd_set_cargo_panel_mode_value('shipments')}
          dkd_on_home_return_value={dkd_on_home_return_value}
        />
      ) : null}

      {dkd_active_operation_value === 'dkd_logistics' ? (
        <DkdLogisticsModal
          dkd_visible_value
          dkd_on_close_value={dkd_on_close_value}
          dkd_profile_value={dkd_profile_value}
          dkd_initial_panel_value="create"
          dkd_inline_value
        />
      ) : null}

      {dkd_active_operation_value === 'dkd_urgent_courier' ? (
        <DkdUrgentCourierPanel
          dkd_visible_value
          dkd_profile_value={dkd_profile_value}
          dkd_courier_approved_value={dkd_courier_approved_value || dkd_is_admin_value}
          dkd_is_admin_value={dkd_is_admin_value}
          dkd_default_tab_value="create"
          dkd_hide_courier_tab_value
        />
      ) : null}
    </View>
  );
}

function DkdServiceNetworkRestaurantCatalogPanel({
  dkd_selected_category_value,
  dkd_current_location_text_value,
  dkd_restaurant_catalog_product_values,
  dkd_restaurant_catalog_loading_value,
  dkd_restaurant_catalog_error_value,
  dkd_on_back_value,
  dkd_profile_value,
  dkd_set_profile_value,
  dkd_current_location_value,
  dkd_on_home_return_value,
  dkd_visible_value = false,
}) {
  const [dkd_selected_restaurant_product_value, dkd_set_selected_restaurant_product_value] = useState(null);
  const [dkd_restaurant_order_busy_key_value, dkd_set_restaurant_order_busy_key_value] = useState('');
  const [dkd_restaurant_payment_modal_visible_value, dkd_set_restaurant_payment_modal_visible_value] = useState(false);
  const [dkd_restaurant_payment_product_value, dkd_set_restaurant_payment_product_value] = useState(null);
  const [dkd_restaurant_payment_preview_value, dkd_set_restaurant_payment_preview_value] = useState(null);
  const [dkd_payment_method_modal_visible_value, dkd_set_payment_method_modal_visible_value] = useState(false);
  const [dkd_restaurant_demo_notice_visible_value, dkd_set_restaurant_demo_notice_visible_value] = useState(false);
  const dkd_wallet_tl_value = useMemo(() => resolveUnifiedWalletTl(dkd_profile_value || {}), [dkd_profile_value]);
  const dkd_sync_wallet_after_topup_value = useCallback((dkd_wallet_after_value) => {
    const dkd_numeric_wallet_value = Number(dkd_wallet_after_value);
    if (!Number.isFinite(dkd_numeric_wallet_value)) return;
    dkd_set_profile_value?.((dkd_previous_profile_value) => (dkd_previous_profile_value ? {
      ...dkd_previous_profile_value,
      ...dkd_build_unified_wallet_patch_value(dkd_numeric_wallet_value),
    } : dkd_previous_profile_value));
  }, [dkd_set_profile_value]);
  const dkd_price_pulse_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!dkd_visible_value) {
      dkd_price_pulse_value.stopAnimation();
      dkd_price_pulse_value.setValue(0);
      return undefined;
    }
    const dkd_price_animation_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_price_pulse_value, { toValue: 1, duration: 760, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(dkd_price_pulse_value, { toValue: 0, duration: 760, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ])
    );
    dkd_price_animation_value.start();
    return () => dkd_price_animation_value.stop();
  }, [dkd_price_pulse_value, dkd_visible_value]);

  const dkd_price_badge_scale_value = dkd_price_pulse_value.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.055],
  });

  const dkd_restaurant_catalog_visible_values = useMemo(() => {
    const dkd_source_product_values = Array.isArray(dkd_restaurant_catalog_product_values) ? dkd_restaurant_catalog_product_values : [];
    const dkd_matching_product_values = dkd_source_product_values.filter((dkd_product_value) => dkd_is_restaurant_catalog_product_value(dkd_product_value));
    return dkd_matching_product_values.length ? dkd_matching_product_values : dkd_source_product_values;
  }, [dkd_restaurant_catalog_product_values]);
  const dkd_restaurant_catalog_section_values = useMemo(() => dkd_build_restaurant_catalog_sections_value(dkd_restaurant_catalog_visible_values), [dkd_restaurant_catalog_visible_values]);
  const dkd_product_count_value = dkd_restaurant_catalog_visible_values.length;
  const dkd_business_count_value = dkd_restaurant_catalog_section_values.length;

  const dkd_handle_product_press_value = useCallback((dkd_product_value) => {
    dkd_set_selected_restaurant_product_value(dkd_product_value || null);
  }, []);

  const dkd_close_restaurant_payment_value = useCallback(() => {
    if (dkd_restaurant_order_busy_key_value) return;
    dkd_set_restaurant_payment_modal_visible_value(false);
    dkd_set_restaurant_payment_product_value(null);
    dkd_set_restaurant_payment_preview_value(null);
    dkd_set_payment_method_modal_visible_value(false);
  }, [dkd_restaurant_order_busy_key_value]);

  const dkd_close_product_detail_value = useCallback(() => {
    dkd_set_selected_restaurant_product_value(null);
  }, []);

  const dkd_open_restaurant_payment_value = useCallback((dkd_product_value) => {
    if (!dkd_product_value || dkd_restaurant_order_busy_key_value) return;
    const dkd_payment_preview_value = dkd_build_restaurant_payment_preview_value(dkd_product_value);
    if (!dkd_payment_preview_value.dkd_customer_charge_tl) {
      Alert.alert('Restoran siparişi', 'Bu ürün için TL fiyatı bulunamadı. İşletme ürün fiyatını ekledikten sonra ödeme alınabilir.');
      return;
    }
    dkd_set_restaurant_payment_product_value(dkd_product_value);
    dkd_set_restaurant_payment_preview_value(dkd_payment_preview_value);
    dkd_set_restaurant_payment_modal_visible_value(true);
  }, [dkd_restaurant_order_busy_key_value]);

  const dkd_submit_restaurant_paid_order_value = useCallback(async (dkd_payment_context_value = {}) => {
    const dkd_product_value = dkd_restaurant_payment_product_value || dkd_selected_restaurant_product_value;
    const dkd_payment_preview_value = dkd_restaurant_payment_preview_value || dkd_build_restaurant_payment_preview_value(dkd_product_value || {});
    if (!dkd_product_value || dkd_restaurant_order_busy_key_value) return;

    const dkd_product_title_value = String(dkd_product_value?.title || 'Ürün');
    const dkd_business_title_value = String(dkd_product_value?.business_name || 'İşletme');
    const dkd_product_key_value = String(dkd_product_value?.id || dkd_product_title_value);
    const dkd_wallet_before_value = dkd_restaurant_round_money_value(dkd_payment_context_value?.dkd_wallet_override_tl_value ?? dkd_wallet_tl_value ?? 0);
    if (dkd_wallet_before_value < dkd_payment_preview_value.dkd_customer_charge_tl) {
      Alert.alert('Restoran siparişi', 'Cüzdanında yeterli TL yok. Önce ana cüzdana bakiye eklemelisin.');
      return;
    }

    dkd_set_restaurant_order_busy_key_value(dkd_product_key_value);
    try {
      const dkd_order_result_value = await dkd_create_restaurant_order_value({
        dkd_profile_value,
        dkd_current_location_value,
        dkd_product_value,
        dkd_selected_category_value,
        dkd_service_category_title_value: dkd_selected_category_value?.dkd_title_value || 'Restoran siparişi',
        dkd_delivery_address_text_value: dkd_current_location_text_value,
        dkd_delivery_note_value: '',
        dkd_use_wallet_payment_value: true,
        dkd_payment_preview_value,
        dkd_customer_charge_tl_value: dkd_payment_preview_value.dkd_customer_charge_tl,
        dkd_product_price_tl_value: dkd_payment_preview_value.dkd_product_price_tl,
        dkd_delivery_fee_tl_value: dkd_payment_preview_value.dkd_delivery_fee_tl,
      });
      if (dkd_order_result_value?.error) throw dkd_order_result_value.error;
      const dkd_wallet_after_order_value = Number(
        dkd_order_result_value?.data?.dkd_wallet_after_tl
          ?? dkd_order_result_value?.data?.wallet_tl
          ?? (Number(dkd_wallet_before_value || 0) - Number(dkd_payment_preview_value.dkd_customer_charge_tl || 0))
      );
      if (Number.isFinite(dkd_wallet_after_order_value)) {
        dkd_sync_wallet_after_topup_value(dkd_wallet_after_order_value);
      }
      dkd_send_customer_order_local_notification_value({
        dkd_order_title_value: 'Siparişiniz Oluşturuldu',
        dkd_order_message_value: `${dkd_business_title_value} • ${dkd_product_title_value} siparişiniz alındı ve kurye havuzuna aktarıldı.`,
        dkd_order_id_value: dkd_order_result_value?.data?.dkd_order_id_value || dkd_order_result_value?.data?.id || '',
        dkd_source_value: 'dkd_restaurant_wallet_payment',
      }).catch(() => null);
      Alert.alert('Sipariş Oluşturuldu', `${dkd_business_title_value} • ${dkd_product_title_value} için ödeme alındı ve sipariş kurye havuzuna gönderildi.`);
      dkd_set_restaurant_payment_modal_visible_value(false);
      dkd_set_restaurant_payment_product_value(null);
      dkd_set_restaurant_payment_preview_value(null);
      dkd_set_payment_method_modal_visible_value(false);
      dkd_close_product_detail_value();
    } catch (dkd_order_error_value) {
      const dkd_error_message_value = String(dkd_order_error_value?.message || dkd_order_error_value || '');
      if (dkd_error_message_value.includes('wallet_insufficient')) {
        Alert.alert('Restoran siparişi', 'Cüzdanında yeterli TL yok. Önce ana cüzdana bakiye eklemelisin.');
      } else {
        Alert.alert('Restoran siparişi', dkd_order_error_value?.message || 'Ödeme veya sipariş kaydı tamamlanamadı. SQL dosyasını çalıştırdığından emin ol.');
      }
    } finally {
      dkd_set_restaurant_order_busy_key_value('');
    }
  }, [dkd_close_product_detail_value, dkd_current_location_text_value, dkd_current_location_value, dkd_profile_value, dkd_restaurant_order_busy_key_value, dkd_restaurant_payment_preview_value, dkd_restaurant_payment_product_value, dkd_selected_category_value, dkd_selected_restaurant_product_value, dkd_sync_wallet_after_topup_value, dkd_wallet_tl_value]);

  const dkd_handle_restaurant_payment_choice_value = useCallback(() => {
    Alert.alert('Ödeme Yöntemi Seç', 'Siparişi nasıl tamamlamak istiyorsun?', [
      { text: 'Cüzdanımdan Öde', onPress: () => dkd_submit_restaurant_paid_order_value() },
      { text: 'Ödeme Seçenekleri', onPress: () => dkd_set_payment_method_modal_visible_value(true) },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  }, [dkd_submit_restaurant_paid_order_value]);

  const dkd_handle_restaurant_order_press_value = useCallback((dkd_product_value) => {
    if (!dkd_restaurant_orders_enabled_value || !dkd_payments_enabled_value) {
      dkd_set_restaurant_demo_notice_visible_value(true);
      return;
    }
    dkd_open_restaurant_payment_value(dkd_product_value);
  }, [dkd_open_restaurant_payment_value]);

  const dkd_close_restaurant_demo_notice_value = useCallback(() => {
    dkd_set_restaurant_demo_notice_visible_value(false);
  }, []);

  const dkd_selected_product_image_uri_value = dkd_resolve_restaurant_product_image_uri_value(dkd_selected_restaurant_product_value);
  const dkd_selected_product_price_text_value = dkd_service_network_catalog_price_text_value(dkd_selected_restaurant_product_value);

  return (
    <View style={dkd_styles.dkd_restaurant_catalog_wrap}>
      <Pressable onPress={dkd_on_back_value} style={dkd_styles.dkd_back_button}>
        <MaterialCommunityIcons name="arrow-left-circle" size={20} color="#BAE6FD" />
        <Text style={dkd_styles.dkd_back_button_text}>Ürün listesini kapat</Text>
      </Pressable>

      <LinearGradient colors={["#24101A", "#7C2D12", "#EA580C"]} style={dkd_styles.dkd_restaurant_catalog_hero}>
        <View style={dkd_styles.dkd_restaurant_catalog_hero_top}>
          <View style={dkd_styles.dkd_restaurant_catalog_icon_shell}>
            <MaterialCommunityIcons name={dkd_selected_category_value?.dkd_icon_value || 'silverware-fork-knife'} size={31} color="#431407" />
          </View>
          <View style={dkd_styles.dkd_restaurant_catalog_hero_copy}>
            <Text style={dkd_styles.dkd_restaurant_catalog_kicker}>RESTORAN ÜRÜN VİTRİNİ • DEMO</Text>
            <Text style={dkd_styles.dkd_restaurant_catalog_title}>Restoran siparişi</Text>
            <Text style={dkd_styles.dkd_restaurant_catalog_text}>Bu ürünler demo ve test amaçlıdır. Ürünleri inceleyebilirsin; gerçek sipariş ve ödeme çok yakında hizmete açılacaktır.</Text>
          </View>
        </View>
        <View style={dkd_styles.dkd_restaurant_catalog_badge_row}>
          <View style={dkd_styles.dkd_restaurant_catalog_badge}><MaterialCommunityIcons name="storefront-outline" size={14} color="#FED7AA" /><Text style={dkd_styles.dkd_restaurant_catalog_badge_text}>{dkd_business_count_value} işletme</Text></View>
          <View style={dkd_styles.dkd_restaurant_catalog_badge}><MaterialCommunityIcons name="food-takeout-box-outline" size={14} color="#FDE68A" /><Text style={dkd_styles.dkd_restaurant_catalog_badge_text}>{dkd_product_count_value} ürün</Text></View>
          <View style={dkd_styles.dkd_restaurant_catalog_badge}><MaterialCommunityIcons name="cash-fast" size={14} color="#A7F3D0" /><Text style={dkd_styles.dkd_restaurant_catalog_badge_text}>Fiyat odaklı</Text></View>
        </View>
      </LinearGradient>

      {dkd_restaurant_catalog_error_value ? (
        <View style={dkd_styles.dkd_restaurant_catalog_empty_card}>
          <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#FCA5A5" />
          <View style={dkd_styles.dkd_restaurant_catalog_empty_copy}>
            <Text style={dkd_styles.dkd_restaurant_catalog_empty_title}>Ürünler okunamadı</Text>
            <Text style={dkd_styles.dkd_restaurant_catalog_empty_text}>{dkd_restaurant_catalog_error_value}</Text>
          </View>
        </View>
      ) : null}

      {!dkd_restaurant_catalog_loading_value && !dkd_restaurant_catalog_section_values.length ? (
        <View style={dkd_styles.dkd_restaurant_catalog_empty_card}>
          <MaterialCommunityIcons name="store-search-outline" size={24} color="#FED7AA" />
          <View style={dkd_styles.dkd_restaurant_catalog_empty_copy}>
            <Text style={dkd_styles.dkd_restaurant_catalog_empty_title}>Kayıtlı restoran ürünü yok</Text>
            <Text style={dkd_styles.dkd_restaurant_catalog_empty_text}>İşletme ürünleri eklendiğinde bu alan otomatik ürün vitrini gibi dolacak.</Text>
          </View>
        </View>
      ) : null}

      {dkd_restaurant_catalog_section_values.map((dkd_section_value) => (
        <View key={dkd_section_value.dkd_key_value} style={dkd_styles.dkd_restaurant_business_section}>
          <View style={dkd_styles.dkd_restaurant_business_header}>
            <View style={dkd_styles.dkd_restaurant_business_icon}>
              <MaterialCommunityIcons name="storefront-outline" size={20} color="#431407" />
            </View>
            <View style={dkd_styles.dkd_restaurant_business_copy}>
              <Text style={dkd_styles.dkd_restaurant_business_title}>{dkd_section_value.dkd_business_name_value}</Text>
              <Text style={dkd_styles.dkd_restaurant_business_meta}>{dkd_section_value.dkd_business_category_value} • {dkd_section_value.dkd_item_values.length} ürün</Text>
              <Text style={dkd_styles.dkd_restaurant_business_address} numberOfLines={2}>{dkd_section_value.dkd_business_address_value}</Text>
            </View>
          </View>
          <View style={dkd_styles.dkd_restaurant_product_grid}>
            {dkd_section_value.dkd_item_values.map((dkd_product_value) => {
              const dkd_product_image_uri_value = dkd_resolve_restaurant_product_image_uri_value(dkd_product_value);
              const dkd_product_price_text_value = dkd_service_network_catalog_price_text_value(dkd_product_value);
              return (
                <Pressable key={`${dkd_section_value.dkd_key_value}:${String(dkd_product_value?.id || dkd_product_value?.title)}`} onPress={() => dkd_handle_product_press_value(dkd_product_value)} style={dkd_styles.dkd_restaurant_product_card}>
                  <View style={dkd_styles.dkd_restaurant_product_image_shell}>
                    {dkd_product_image_uri_value ? (
                      <Image source={{ uri: dkd_product_image_uri_value }} style={dkd_styles.dkd_restaurant_product_image} resizeMode="cover" />
                    ) : (
                      <LinearGradient colors={["rgba(251,146,60,0.26)", "rgba(124,45,18,0.84)"]} style={dkd_styles.dkd_restaurant_product_image_fallback}>
                        <MaterialCommunityIcons name="food-takeout-box-outline" size={26} color="#FED7AA" />
                      </LinearGradient>
                    )}
                  </View>
                  <Text style={dkd_styles.dkd_restaurant_product_title} numberOfLines={2}>{dkd_product_value?.title || 'İşletme ürünü'}</Text>
                  <Text style={dkd_styles.dkd_restaurant_product_desc} numberOfLines={3}>{dkd_product_value?.description || dkd_product_value?.category || 'Ürün açıklaması işletme panelinden gelir.'}</Text>
                  <Animated.View style={[dkd_styles.dkd_restaurant_product_price_highlight, { transform: [{ scale: dkd_price_badge_scale_value }] }]}>
                    <MaterialCommunityIcons name="cash-fast" size={14} color="#431407" />
                    <Text style={dkd_styles.dkd_restaurant_product_price_highlight_text}>{dkd_product_price_text_value}</Text>
                  </Animated.View>
                  <View style={dkd_styles.dkd_restaurant_product_cta}>
                    <Text style={dkd_styles.dkd_restaurant_product_cta_text}>Detayları Aç</Text>
                    <MaterialCommunityIcons name="arrow-expand" size={15} color="#07131C" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Modal visible={Boolean(dkd_selected_restaurant_product_value)} transparent animationType="fade" onRequestClose={dkd_close_product_detail_value}>
        <View style={dkd_styles.dkd_restaurant_detail_overlay}>
          <View style={dkd_styles.dkd_restaurant_detail_shell}>
            <View style={dkd_styles.dkd_restaurant_detail_header}>
              <View style={dkd_styles.dkd_restaurant_detail_header_copy}>
                <Text style={dkd_styles.dkd_restaurant_detail_kicker}>ÜRÜN DETAYI</Text>
                <Text style={dkd_styles.dkd_restaurant_detail_title} numberOfLines={2}>{dkd_selected_restaurant_product_value?.title || 'İşletme ürünü'}</Text>
              </View>
              <Pressable onPress={dkd_close_product_detail_value} style={dkd_styles.dkd_restaurant_detail_close_button}>
                <MaterialCommunityIcons name="close" size={21} color="#F8FAFC" />
              </Pressable>
            </View>

            <View style={dkd_styles.dkd_restaurant_detail_image_shell}>
              {dkd_selected_product_image_uri_value ? (
                <Image source={{ uri: dkd_selected_product_image_uri_value }} style={dkd_styles.dkd_restaurant_detail_image} resizeMode="contain" />
              ) : (
                <LinearGradient colors={["rgba(251,146,60,0.34)", "rgba(67,20,7,0.96)"]} style={dkd_styles.dkd_restaurant_detail_image_fallback}>
                  <MaterialCommunityIcons name="food-takeout-box-outline" size={58} color="#FED7AA" />
                  <Text style={dkd_styles.dkd_restaurant_detail_image_fallback_text}>Ürün görseli işletme panelinden eklenince burada tam boy gösterilir.</Text>
                </LinearGradient>
              )}
              <Animated.View style={[dkd_styles.dkd_restaurant_detail_price_badge, { transform: [{ scale: dkd_price_badge_scale_value }] }]}>
                <MaterialCommunityIcons name="cash-fast" size={17} color="#431407" />
                <Text style={dkd_styles.dkd_restaurant_detail_price_text}>{dkd_selected_product_price_text_value}</Text>
              </Animated.View>
            </View>

            <View style={dkd_styles.dkd_restaurant_detail_info_card}>
              <Text style={dkd_styles.dkd_restaurant_detail_business}>{dkd_selected_restaurant_product_value?.business_name || 'İşletme'}</Text>
              <Text style={dkd_styles.dkd_restaurant_detail_meta}>{dkd_selected_restaurant_product_value?.business_category || dkd_selected_restaurant_product_value?.category || 'Restoran ürünü'}</Text>
              <Text style={dkd_styles.dkd_restaurant_detail_desc}>{dkd_selected_restaurant_product_value?.description || 'Ürün açıklaması işletme panelinden gelir.'}</Text>
              <View style={dkd_styles.dkd_restaurant_detail_line_row}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color="#FDBA74" />
                <Text style={dkd_styles.dkd_restaurant_detail_line_text}>{dkd_selected_restaurant_product_value?.business_address_text || dkd_current_location_text_value || 'Adres bilgisi ürün detayında netleşir'}</Text>
              </View>
              <View style={dkd_styles.dkd_restaurant_detail_line_row}>
                <MaterialCommunityIcons name="tag-multiple-outline" size={16} color="#FDE68A" />
                <Text style={dkd_styles.dkd_restaurant_detail_line_text}>{dkd_selected_restaurant_product_value?.category || 'Kategori bilgisi işletme ürününde görünür'}</Text>
              </View>
            </View>

            <Pressable onPress={() => dkd_handle_restaurant_order_press_value(dkd_selected_restaurant_product_value)} disabled={Boolean(dkd_restaurant_order_busy_key_value)} style={dkd_styles.dkd_restaurant_detail_order_button}>
              <LinearGradient colors={["#FDE68A", "#FDBA74", "#FB923C"]} style={dkd_styles.dkd_restaurant_detail_order_gradient}>
                <Text style={dkd_styles.dkd_restaurant_detail_order_text}>{(!dkd_restaurant_orders_enabled_value || !dkd_payments_enabled_value) ? 'Sipariş Ver (Demo)' : (dkd_restaurant_order_busy_key_value ? 'Kaydediliyor…' : 'Sipariş Oluştur')}</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#431407" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      <DkdRestaurantDemoNoticeModal
        dkd_visible_value={dkd_restaurant_demo_notice_visible_value}
        dkd_on_close_value={dkd_close_restaurant_demo_notice_value}
        dkd_product_title_value={dkd_selected_restaurant_product_value?.title || 'Restoran ürünü'}
        dkd_business_title_value={dkd_selected_restaurant_product_value?.business_name || 'Restoran'}
      />

      <Modal visible={dkd_payments_enabled_value && dkd_restaurant_payment_modal_visible_value} transparent animationType="fade" onRequestClose={dkd_close_restaurant_payment_value}>
        <View style={dkd_styles.dkd_restaurant_payment_overlay}>
          <View style={dkd_styles.dkd_restaurant_payment_card}>
            <View style={dkd_styles.dkd_restaurant_payment_header}>
              <View style={dkd_styles.dkd_restaurant_payment_icon_wrap}>
                <MaterialCommunityIcons name="wallet-outline" size={23} color="#FED7AA" />
              </View>
              <View style={dkd_styles.dkd_restaurant_payment_header_copy}>
                <Text style={dkd_styles.dkd_restaurant_payment_title}>Ödeme Onayı</Text>
                <Text style={dkd_styles.dkd_restaurant_payment_sub}>Sipariş kurye havuzuna düşmeden önce ödeme yöntemi seçilir; gerekiyorsa cüzdana TL yüklenir.</Text>
              </View>
            </View>

            <View style={dkd_styles.dkd_restaurant_payment_route_card}>
              <Text style={dkd_styles.dkd_restaurant_payment_route_line}>İşletme • {dkd_restaurant_payment_product_value?.business_name || 'Restoran'}</Text>
              <Text style={dkd_styles.dkd_restaurant_payment_route_line}>Ürün • {dkd_restaurant_payment_product_value?.title || 'Ürün'}</Text>
              <Text style={dkd_styles.dkd_restaurant_payment_route_meta}>Teslimat • {dkd_current_location_text_value || 'Adres bilgisi kullanıcı konumundan alınır'}</Text>
            </View>

            <View style={dkd_styles.dkd_restaurant_payment_stat_card}>
              <View style={dkd_styles.dkd_restaurant_payment_stat_row}>
                <Text style={dkd_styles.dkd_restaurant_payment_stat_label}>Ürün Tutarı</Text>
                <Text style={dkd_styles.dkd_restaurant_payment_stat_value}>{dkd_restaurant_format_money_value(dkd_restaurant_payment_preview_value?.dkd_product_price_tl || 0)}</Text>
              </View>
              <View style={dkd_styles.dkd_restaurant_payment_stat_row}>
                <Text style={dkd_styles.dkd_restaurant_payment_stat_label}>İşletme Kurye Ücreti</Text>
                <Text style={dkd_styles.dkd_restaurant_payment_stat_value}>{dkd_restaurant_format_money_value(dkd_restaurant_payment_preview_value?.dkd_delivery_fee_tl || 0)}</Text>
              </View>
              <View style={[dkd_styles.dkd_restaurant_payment_stat_row, dkd_styles.dkd_restaurant_payment_stat_total_row]}>
                <Text style={dkd_styles.dkd_restaurant_payment_stat_total_label}>Toplam Tutar</Text>
                <Text style={dkd_styles.dkd_restaurant_payment_stat_total_value}>{dkd_restaurant_format_money_value(dkd_restaurant_payment_preview_value?.dkd_customer_charge_tl || 0)}</Text>
              </View>
            </View>

            <View style={dkd_styles.dkd_restaurant_payment_wallet_card}>
              <View style={dkd_styles.dkd_restaurant_payment_wallet_row}>
                <Text style={dkd_styles.dkd_restaurant_payment_wallet_label}>Cüzdan bakiyesi</Text>
                <Text style={dkd_styles.dkd_restaurant_payment_wallet_value}>{dkd_restaurant_format_money_value(dkd_wallet_tl_value || 0)}</Text>
              </View>
              <View style={dkd_styles.dkd_restaurant_payment_wallet_row}>
                <Text style={dkd_styles.dkd_restaurant_payment_wallet_label}>Ödeme sonrası</Text>
                <Text style={dkd_styles.dkd_restaurant_payment_wallet_value}>{dkd_restaurant_format_money_value(dkd_restaurant_round_money_value(Number(dkd_wallet_tl_value || 0) - Number(dkd_restaurant_payment_preview_value?.dkd_customer_charge_tl || 0)))}</Text>
              </View>
            </View>

            <View style={dkd_styles.dkd_restaurant_payment_action_row}>
              <Pressable onPress={dkd_close_restaurant_payment_value} disabled={Boolean(dkd_restaurant_order_busy_key_value)} style={dkd_styles.dkd_restaurant_payment_ghost_button}>
                <Text style={dkd_styles.dkd_restaurant_payment_ghost_button_text}>Vazgeç</Text>
              </Pressable>
              <Pressable onPress={dkd_handle_restaurant_payment_choice_value} disabled={Boolean(dkd_restaurant_order_busy_key_value)} style={[dkd_styles.dkd_restaurant_payment_primary_button, dkd_restaurant_order_busy_key_value ? dkd_styles.dkd_restaurant_payment_button_disabled : null]}>
                <Text style={dkd_styles.dkd_restaurant_payment_primary_button_text}>{dkd_restaurant_order_busy_key_value ? 'Ödeme alınıyor…' : 'Ödeme Yöntemi Seç'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <DkdWalletPaymentMethodModal
        dkd_visible_value={dkd_payments_enabled_value && dkd_payment_method_modal_visible_value}
        dkd_on_close_value={() => dkd_set_payment_method_modal_visible_value(false)}
        dkd_order_title_value={`Restoran siparişi • ${dkd_restaurant_payment_product_value?.title || 'Ürün'}`}
        dkd_order_total_tl_value={dkd_restaurant_payment_preview_value?.dkd_customer_charge_tl || 0}
        dkd_wallet_tl_value={dkd_wallet_tl_value || 0}
        dkd_wallet_pay_busy_value={Boolean(dkd_restaurant_order_busy_key_value)}
        dkd_on_wallet_pay_value={dkd_submit_restaurant_paid_order_value}
        dkd_on_wallet_after_topup_value={dkd_sync_wallet_after_topup_value}
        dkd_on_bank_transfer_success_value={dkd_close_restaurant_payment_value}
        dkd_on_home_return_value={dkd_on_home_return_value}
        dkd_context_note_value="Restoran siparişi için ödeme yöntemi seç; gerekiyorsa önce cüzdana TL yükle, bakiye yeterliyse siparişi cüzdanla tamamla."
      />
    </View>
  );
}

function DkdServiceNetworkRequestField({
  dkd_icon_value,
  dkd_label_value,
  dkd_value_value,
  dkd_on_change_text_value,
  dkd_placeholder_value,
  dkd_multiline_value = false,
}) {
  return (
    <View style={dkd_styles.dkd_request_field_card}>
      <View style={dkd_styles.dkd_request_field_label_row}>
        <View style={dkd_styles.dkd_request_field_icon_wrap}>
          <MaterialCommunityIcons name={dkd_icon_value} size={18} color="#07131C" />
        </View>
        <Text style={dkd_styles.dkd_request_field_label}>{dkd_label_value}</Text>
      </View>
      <TextInput
        value={dkd_value_value}
        onChangeText={dkd_on_change_text_value}
        placeholder={dkd_placeholder_value}
        placeholderTextColor="rgba(226,242,255,0.46)"
        style={[dkd_styles.dkd_request_field_input, dkd_multiline_value && dkd_styles.dkd_request_field_input_multiline]}
        multiline={dkd_multiline_value}
      />
    </View>
  );
}


function DkdServiceNetworkRequestPage({
  dkd_selected_category_value,
  dkd_selected_group_value,
  dkd_current_location_text_value,
  dkd_request_address_value,
  dkd_set_request_address_value,
  dkd_request_delivery_value,
  dkd_set_request_delivery_value,
  dkd_request_note_value,
  dkd_set_request_note_value,
  dkd_request_photo_value,
  dkd_set_request_photo_value,
  dkd_request_schedule_value,
  dkd_set_request_schedule_value,
  dkd_request_budget_value,
  dkd_set_request_budget_value,
  dkd_request_contact_value,
  dkd_set_request_contact_value,
  dkd_request_urgency_value,
  dkd_set_request_urgency_value,
  dkd_request_service_mode_value,
  dkd_set_request_service_mode_value,
  dkd_on_back_value,
  dkd_profile_value,
  dkd_current_location_value,
}) {
  const dkd_request_blueprint_value = dkd_get_service_network_request_blueprint_value(dkd_selected_category_value);
  const dkd_operation_value = dkd_get_service_network_operation_value(dkd_selected_category_value);
  const dkd_mode_options_value = dkd_operation_value.dkd_mode_values;
  const dkd_hide_budget_field_value = dkd_selected_group_value?.dkd_group_id_value === 'dkd_food_market';
  const dkd_safe_service_mode_value = dkd_mode_options_value.includes(dkd_request_service_mode_value) ? dkd_request_service_mode_value : dkd_mode_options_value[0];
  const [dkd_request_submit_busy_value, dkd_set_request_submit_busy_value] = useState(false);
  const dkd_request_ready_value = Boolean(dkd_request_address_value?.trim() && dkd_request_note_value?.trim());
  const dkd_request_category_title_value = dkd_selected_category_value?.dkd_title_value || 'Hizmet talebi';
  const dkd_request_group_title_value = dkd_selected_group_value?.dkd_title_value || dkd_selected_category_value?.dkd_group_title_value || 'Hizmet Ağı';
  const dkd_handle_prepare_request_value = async () => {
    if (dkd_request_submit_busy_value) return;
    if (!dkd_request_ready_value) {
      Alert.alert('Hizmet Ağı Talebi', 'Talep için en az adres ve ihtiyaç detayı yazılmalı.');
      return;
    }
    dkd_set_request_submit_busy_value(true);
    try {
      const dkd_request_result_value = await dkd_create_service_network_request_value({
        dkd_profile_value,
        dkd_current_location_value,
        dkd_selected_group_value,
        dkd_selected_category_value,
        dkd_request_address_value,
        dkd_request_delivery_value,
        dkd_request_note_value,
        dkd_request_photo_value,
        dkd_request_schedule_value,
        dkd_request_budget_value,
        dkd_request_contact_value,
        dkd_request_urgency_value,
        dkd_request_service_mode_value: dkd_safe_service_mode_value,
      });
      if (dkd_request_result_value?.error) throw dkd_request_result_value.error;
      Alert.alert('Hizmet Ağı Talebi', `${dkd_request_category_title_value} talebi Supabase kayıt akışına eklendi.`);
    } catch (dkd_request_error_value) {
      Alert.alert('Hizmet Ağı Talebi', dkd_request_error_value?.message || 'Talep Supabase tarafına kaydedilemedi. SQL dosyasını çalıştırdığından emin ol.');
    } finally {
      dkd_set_request_submit_busy_value(false);
    }
  };

  return (
    <View style={dkd_styles.dkd_request_page_wrap}>
      <Pressable onPress={dkd_on_back_value} style={dkd_styles.dkd_back_button}>
        <MaterialCommunityIcons name="arrow-left-circle" size={20} color="#BAE6FD" />
        <Text style={dkd_styles.dkd_back_button_text}>Talep panelini kapat</Text>
      </Pressable>

      <LinearGradient colors={['#0F2945', '#33206A', '#7A2458']} style={dkd_styles.dkd_request_page_hero}>
        <View style={dkd_styles.dkd_request_page_hero_top}>
          <View style={dkd_styles.dkd_request_page_icon_shell}>
            <MaterialCommunityIcons name={dkd_selected_category_value?.dkd_icon_value || 'clipboard-text-outline'} size={30} color="#08111E" />
          </View>
          <View style={dkd_styles.dkd_request_page_title_box}>
            <Text style={dkd_styles.dkd_request_page_kicker}>AYNI SAYFADA DETAYLI TALEP</Text>
            <Text style={dkd_styles.dkd_request_page_title}>{dkd_request_category_title_value}</Text>
            <Text style={dkd_styles.dkd_request_page_group}>{dkd_request_group_title_value}</Text>
          </View>
        </View>
        <Text style={dkd_styles.dkd_request_page_text}>{dkd_request_blueprint_value.dkd_primary_question_value}</Text>
        <View style={dkd_styles.dkd_request_badge_row}>
          <View style={dkd_styles.dkd_request_badge}><MaterialCommunityIcons name="map-marker-radius-outline" size={14} color="#BAE6FD" /><Text style={dkd_styles.dkd_request_badge_text}>{dkd_current_location_text_value}</Text></View>
          <View style={dkd_styles.dkd_request_badge}><MaterialCommunityIcons name="shield-check-outline" size={14} color="#A7F3D0" /><Text style={dkd_styles.dkd_request_badge_text}>Partner teklif akışı</Text></View>
        </View>
      </LinearGradient>

      <View style={dkd_styles.dkd_detail_block}>
        <Text style={dkd_styles.dkd_detail_title}>Talep türü</Text>
        <Text style={dkd_styles.dkd_detail_desc}>Seçtiğin kategori için hızlı seçenekler aşağıda. Formu liste gibi doldur, talep özeti otomatik netleşsin.</Text>
        <View style={dkd_styles.dkd_option_grid}>
          {dkd_request_blueprint_value.dkd_option_values.map((dkd_option_value) => (
            <View key={dkd_option_value} style={dkd_styles.dkd_option_chip}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color="#A7F3D0" />
              <Text style={dkd_styles.dkd_option_chip_text}>{dkd_option_value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={dkd_styles.dkd_form_section_card}>
        <View style={dkd_styles.dkd_form_section_title_row}>
          <MaterialCommunityIcons name="clipboard-list-outline" size={20} color="#7DD3FC" />
          <View style={dkd_styles.dkd_form_section_title_body}>
            <Text style={dkd_styles.dkd_detail_title}>Talep bilgilerini liste halinde doldur</Text>
            <Text style={dkd_styles.dkd_detail_desc}>{dkd_hide_budget_field_value ? 'Adres, zaman ve iletişim net olursa restoran/market/fırın partneri siparişi daha hızlı hazırlar.' : 'Adres, zaman, bütçe ve iletişim net olursa partnerler daha doğru teklif verir.'}</Text>
          </View>
        </View>
        <View style={dkd_styles.dkd_request_field_list}>
          <DkdServiceNetworkRequestField dkd_icon_value="map-marker-radius-outline" dkd_label_value="Hizmet / alım adresi" dkd_value_value={dkd_request_address_value} dkd_on_change_text_value={dkd_set_request_address_value} dkd_placeholder_value={dkd_request_blueprint_value.dkd_address_placeholder_value} />
          <DkdServiceNetworkRequestField dkd_icon_value="map-marker-check-outline" dkd_label_value="Teslim / varış adresi" dkd_value_value={dkd_request_delivery_value} dkd_on_change_text_value={dkd_set_request_delivery_value} dkd_placeholder_value={dkd_request_blueprint_value.dkd_delivery_placeholder_value} />
          <DkdServiceNetworkRequestField dkd_icon_value="text-box-edit-outline" dkd_label_value="İhtiyaç detayı" dkd_value_value={dkd_request_note_value} dkd_on_change_text_value={dkd_set_request_note_value} dkd_placeholder_value={dkd_request_blueprint_value.dkd_detail_placeholder_value} dkd_multiline_value />
          <DkdServiceNetworkRequestField dkd_icon_value="image-multiple-outline" dkd_label_value="Fotoğraf / belge notu" dkd_value_value={dkd_request_photo_value} dkd_on_change_text_value={dkd_set_request_photo_value} dkd_placeholder_value={dkd_request_blueprint_value.dkd_photo_note_value} dkd_multiline_value />
          <DkdServiceNetworkRequestField dkd_icon_value="calendar-clock" dkd_label_value="Randevu / teslim zamanı" dkd_value_value={dkd_request_schedule_value} dkd_on_change_text_value={dkd_set_request_schedule_value} dkd_placeholder_value="Bugün 18:00, yarın sabah, hafta sonu veya belirli saat yaz" />
          {dkd_hide_budget_field_value ? null : (
            <DkdServiceNetworkRequestField dkd_icon_value="cash-multiple" dkd_label_value="Bütçe / teklif beklentisi" dkd_value_value={dkd_request_budget_value} dkd_on_change_text_value={dkd_set_request_budget_value} dkd_placeholder_value="Maksimum tutar, fiyat aralığı veya önce teklif iste notu" />
          )}
          <DkdServiceNetworkRequestField dkd_icon_value="phone-message-outline" dkd_label_value="İletişim / kapı notu" dkd_value_value={dkd_request_contact_value} dkd_on_change_text_value={dkd_set_request_contact_value} dkd_placeholder_value="Telefon, WhatsApp, alıcı adı, bina/kapı teslim notu" />
        </View>
      </View>

      <View style={dkd_styles.dkd_form_section_card}>
        <Text style={dkd_styles.dkd_detail_title}>Çalışma modu</Text>
        <View style={dkd_styles.dkd_urgency_row}>
          {dkd_mode_options_value.map((dkd_mode_value) => (
            <Pressable key={dkd_mode_value} onPress={() => dkd_set_request_service_mode_value(dkd_mode_value)} style={[dkd_styles.dkd_urgency_chip, dkd_request_service_mode_value === dkd_mode_value && dkd_styles.dkd_urgency_chip_active]}>
              <Text style={[dkd_styles.dkd_urgency_text, dkd_request_service_mode_value === dkd_mode_value && dkd_styles.dkd_urgency_text_active]}>{dkd_mode_value}</Text>
            </Pressable>
          ))}
        </View>
        <View style={dkd_styles.dkd_order_logic_card}>
          <View style={dkd_styles.dkd_order_logic_icon_wrap}>
            <MaterialCommunityIcons name="source-branch" size={17} color="#07131C" />
          </View>
          <View style={dkd_styles.dkd_order_logic_body}>
            <Text style={dkd_styles.dkd_order_logic_title}>{dkd_operation_value.dkd_logic_title_value}</Text>
            <Text style={dkd_styles.dkd_order_logic_desc}>{dkd_operation_value.dkd_logic_desc_value}</Text>
          </View>
        </View>
        <Text style={dkd_styles.dkd_detail_title_small}>Aciliyet</Text>
        <View style={dkd_styles.dkd_urgency_row}>
          {dkd_service_network_request_urgencies_value.map((dkd_urgency_value) => (
            <Pressable key={dkd_urgency_value} onPress={() => dkd_set_request_urgency_value(dkd_urgency_value)} style={[dkd_styles.dkd_urgency_chip, dkd_request_urgency_value === dkd_urgency_value && dkd_styles.dkd_urgency_chip_active]}>
              <Text style={[dkd_styles.dkd_urgency_text, dkd_request_urgency_value === dkd_urgency_value && dkd_styles.dkd_urgency_text_active]}>{dkd_urgency_value}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={dkd_styles.dkd_detail_block}>
        <Text style={dkd_styles.dkd_detail_title}>Partner teklifinde istenecekler</Text>
        {dkd_request_blueprint_value.dkd_flow_values.map((dkd_flow_value) => (
          <View key={dkd_flow_value} style={dkd_styles.dkd_request_flow_row}>
            <View style={dkd_styles.dkd_request_flow_dot}><MaterialCommunityIcons name="lightning-bolt" size={13} color="#07131C" /></View>
            <Text style={dkd_styles.dkd_request_flow_text}>{dkd_flow_value}</Text>
          </View>
        ))}
      </View>

      <LinearGradient colors={dkd_request_ready_value ? ['#164E63', '#1E3A8A', '#5B21B6'] : ['#111827', '#1F2937']} style={dkd_styles.dkd_summary_card}>
        <Text style={dkd_styles.dkd_summary_kicker}>TALEP ÖZETİ</Text>
        <Text style={dkd_styles.dkd_summary_title}>{dkd_request_category_title_value} • {dkd_request_urgency_value}</Text>
        <Text style={dkd_styles.dkd_summary_line}>Mod: {dkd_safe_service_mode_value}</Text>
        <Text style={dkd_styles.dkd_summary_line}>Sipariş mantığı: {dkd_operation_value.dkd_logic_title_value}</Text>
        <Text style={dkd_styles.dkd_summary_line}>Adres: {dkd_request_address_value || 'Adres bekleniyor'}</Text>
        <Text style={dkd_styles.dkd_summary_line}>Teslim/varış: {dkd_request_delivery_value || 'Gerekirse yazılacak'}</Text>
        <Text style={dkd_styles.dkd_summary_line}>Detay: {dkd_request_note_value || 'İhtiyaç detayı bekleniyor'}</Text>
        <Text style={dkd_styles.dkd_summary_line}>{dkd_hide_budget_field_value ? `Zaman: ${dkd_request_schedule_value || 'Zaman bekleniyor'}` : `Zaman/Bütçe: ${dkd_request_schedule_value || 'Zaman bekleniyor'} • ${dkd_request_budget_value || 'Teklif beklenecek'}`}</Text>
      </LinearGradient>

      <Pressable onPress={dkd_handle_prepare_request_value} style={({ pressed: dkd_pressed_value }) => [dkd_styles.dkd_prepare_button, dkd_pressed_value && { opacity: 0.84, transform: [{ scale: 0.99 }] }]}>
        <LinearGradient colors={['#FDE68A', '#86EFAC', '#7DD3FC']} style={dkd_styles.dkd_prepare_button_gradient}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#07131C" />
          <Text style={dkd_styles.dkd_prepare_button_text}>{dkd_request_submit_busy_value ? 'Supabase kaydı oluşturuluyor…' : 'Talebi partner teklif akışına hazırla'}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function DkdServiceNetworkModal({ dkd_visible_value, dkd_on_close_value, dkd_profile_value, dkd_set_profile_value, dkd_current_location_value, dkd_on_profile_press_value, dkd_is_admin_value = false, dkd_wallet_topup_request_key_value = 0 }) {
  const dkd_scroll_view_ref_value = useRef(null);
  const dkd_scroll_position_y_ref_value = useRef(0);
  const dkd_category_section_y_ref_value = useRef(0);
  const dkd_request_section_y_ref_value = useRef(0);
  const dkd_featured_section_y_ref_value = useRef(0);
  const dkd_pending_group_scroll_id_ref_value = useRef('');
  const [dkd_selected_group_id_value, dkd_set_selected_group_id_value] = useState(null);
  const [dkd_selected_category_value, dkd_set_selected_category_value] = useState(null);
  const [dkd_request_page_open_value, dkd_set_request_page_open_value] = useState(false);
  const [dkd_featured_operation_value, dkd_set_featured_operation_value] = useState('');
  const [dkd_cargo_panel_mode_value, dkd_set_cargo_panel_mode_value] = useState('');
  const [dkd_request_note_value, dkd_set_request_note_value] = useState('');
  const [dkd_request_address_value, dkd_set_request_address_value] = useState('');
  const [dkd_request_delivery_value, dkd_set_request_delivery_value] = useState('');
  const [dkd_request_photo_value, dkd_set_request_photo_value] = useState('');
  const [dkd_request_schedule_value, dkd_set_request_schedule_value] = useState('');
  const [dkd_request_budget_value, dkd_set_request_budget_value] = useState('');
  const [dkd_request_contact_value, dkd_set_request_contact_value] = useState('');
  const [dkd_request_urgency_value, dkd_set_request_urgency_value] = useState('Bugün');
  const [dkd_request_service_mode_value, dkd_set_request_service_mode_value] = useState('');
  const [dkd_restaurant_catalog_product_values, dkd_set_restaurant_catalog_product_values] = useState([]);
  const [dkd_restaurant_catalog_loading_value, dkd_set_restaurant_catalog_loading_value] = useState(false);
  const [dkd_restaurant_catalog_error_value, dkd_set_restaurant_catalog_error_value] = useState('');
  const dkd_selected_group_value = useMemo(() => dkd_service_network_category_groups_value.find((dkd_group_value) => dkd_group_value.dkd_group_id_value === dkd_selected_group_id_value) || null, [dkd_selected_group_id_value]);
  const dkd_selected_group_categories_value = dkd_selected_group_value?.dkd_categories_value || [];
  const dkd_category_row_count_value = Math.ceil((dkd_selected_group_categories_value.length || 1) / 2);
  const dkd_current_location_text_value = dkd_current_location_value?.lat && dkd_current_location_value?.lng ? 'Canlı konum hazır' : 'Konum alınca en yakın partner sıralanır';
  const [dkd_service_wallet_modal_visible_value, dkd_set_service_wallet_modal_visible_value] = useState(false);
  const dkd_service_wallet_tl_value = useMemo(() => resolveUnifiedWalletTl(dkd_profile_value || {}), [dkd_profile_value]);
  const dkd_open_service_wallet_modal_value = useCallback(() => {
    dkd_set_service_wallet_modal_visible_value(true);
  }, []);
  const dkd_close_service_wallet_modal_value = useCallback(() => {
    dkd_set_service_wallet_modal_visible_value(false);
  }, []);
  const dkd_sync_service_wallet_after_topup_value = useCallback((dkd_wallet_after_value) => {
    const dkd_numeric_wallet_value = Number(dkd_wallet_after_value);
    if (!Number.isFinite(dkd_numeric_wallet_value)) return;
    dkd_set_profile_value?.((dkd_previous_profile_value) => (dkd_previous_profile_value ? {
      ...dkd_previous_profile_value,
      ...dkd_build_unified_wallet_patch_value(dkd_numeric_wallet_value),
    } : dkd_previous_profile_value));
  }, [dkd_set_profile_value]);
  const dkd_handle_service_wallet_pay_notice_value = useCallback(() => {
    Alert.alert('Cüzdan TL', 'Bu buton cüzdana bakiye yüklemek için açıldı. Yükleme tutarını seçip Banka Havalesi / EFT / FAST akışını kullanabilirsin.');
  }, []);
  const dkd_last_wallet_topup_request_key_ref_value = useRef(0);
  useEffect(() => {
    const dkd_next_wallet_request_key_value = Number(dkd_wallet_topup_request_key_value || 0);
    if (!dkd_visible_value || !dkd_next_wallet_request_key_value) return;
    if (dkd_last_wallet_topup_request_key_ref_value.current === dkd_next_wallet_request_key_value) return;
    dkd_last_wallet_topup_request_key_ref_value.current = dkd_next_wallet_request_key_value;
    dkd_set_service_wallet_modal_visible_value(true);
  }, [dkd_visible_value, dkd_wallet_topup_request_key_value]);


  const dkd_load_restaurant_catalog_value = useCallback(async () => {
    dkd_set_restaurant_catalog_loading_value(true);
    dkd_set_restaurant_catalog_error_value('');
    try {
      const dkd_catalog_response_value = await dkd_fetch_business_market_catalog_value();
      if (dkd_catalog_response_value?.error) throw dkd_catalog_response_value.error;
      dkd_set_restaurant_catalog_product_values(Array.isArray(dkd_catalog_response_value?.data) ? dkd_catalog_response_value.data : []);
    } catch (dkd_catalog_error_value) {
      dkd_set_restaurant_catalog_error_value(dkd_catalog_error_value?.message || 'İşletme ürünleri şu anda okunamadı.');
    } finally {
      dkd_set_restaurant_catalog_loading_value(false);
    }
  }, []);

  const dkd_scroll_to_y_value = useCallback((dkd_target_y_value) => {
    const dkd_safe_target_y_value = Math.max(Number(dkd_target_y_value || 0) - 10, 0);
    setTimeout(() => {
      dkd_scroll_view_ref_value.current?.scrollTo({ y: dkd_safe_target_y_value, animated: true });
    }, 140);
  }, []);

  const dkd_scroll_down_to_y_value = useCallback((dkd_target_y_value) => {
    const dkd_safe_target_y_value = Math.max(Number(dkd_target_y_value || 0) - 10, 0);
    const dkd_current_scroll_y_value = Math.max(Number(dkd_scroll_position_y_ref_value.current || 0), 0);
    if (dkd_safe_target_y_value <= dkd_current_scroll_y_value + 8) return;
    setTimeout(() => {
      dkd_scroll_view_ref_value.current?.scrollTo({ y: dkd_safe_target_y_value, animated: true });
    }, 120);
  }, []);

  const dkd_scroll_to_category_once_value = useCallback((dkd_group_id_value) => {
    const dkd_safe_group_id_value = String(dkd_group_id_value || '');
    if (!dkd_safe_group_id_value || dkd_pending_group_scroll_id_ref_value.current !== dkd_safe_group_id_value) return;
    const dkd_category_target_y_value = Number(dkd_category_section_y_ref_value.current || 0);
    if (!dkd_category_target_y_value) return;
    dkd_pending_group_scroll_id_ref_value.current = '';
    dkd_scroll_down_to_y_value(dkd_category_target_y_value);
  }, [dkd_scroll_down_to_y_value]);

  useEffect(() => {
    if (!dkd_visible_value) return;
    dkd_set_selected_group_id_value(null);
    dkd_set_selected_category_value(null);
    dkd_set_request_page_open_value(false);
    dkd_set_featured_operation_value('');
    dkd_set_cargo_panel_mode_value('');
    dkd_set_request_service_mode_value('');
    dkd_pending_group_scroll_id_ref_value.current = '';
    dkd_scroll_to_y_value(0);
  }, [dkd_scroll_to_y_value, dkd_visible_value]);

  useEffect(() => {
    if (!dkd_visible_value || !dkd_selected_group_id_value) return undefined;
    const dkd_category_scroll_timeout_value = setTimeout(() => {
      dkd_scroll_to_category_once_value(dkd_selected_group_id_value);
    }, 180);
    return () => clearTimeout(dkd_category_scroll_timeout_value);
  }, [dkd_scroll_to_category_once_value, dkd_selected_group_id_value, dkd_visible_value]);


  const dkd_close_request_panel_value = useCallback(() => {
    dkd_set_request_page_open_value(false);
    dkd_scroll_to_y_value(dkd_category_section_y_ref_value.current || 420);
  }, [dkd_scroll_to_y_value]);

  const dkd_close_featured_operation_value = useCallback(() => {
    dkd_set_featured_operation_value('');
    dkd_set_cargo_panel_mode_value('');
    dkd_scroll_to_y_value(dkd_featured_section_y_ref_value.current || 330);
  }, [dkd_scroll_to_y_value]);

  const dkd_handle_modal_back_value = useCallback(() => {
    if (dkd_featured_operation_value) {
      dkd_close_featured_operation_value();
      return true;
    }
    if (dkd_request_page_open_value) {
      dkd_close_request_panel_value();
      return true;
    }
    if (dkd_selected_group_id_value) {
      dkd_set_selected_group_id_value(null);
      dkd_set_selected_category_value(null);
      dkd_set_request_page_open_value(false);
      dkd_scroll_to_y_value(0);
      return true;
    }
    dkd_on_close_value?.();
    return true;
  }, [dkd_close_featured_operation_value, dkd_close_request_panel_value, dkd_featured_operation_value, dkd_on_close_value, dkd_request_page_open_value, dkd_scroll_to_y_value, dkd_selected_group_id_value]);

  useEffect(() => {
    if (!dkd_visible_value) return undefined;
    const dkd_back_subscription_value = BackHandler.addEventListener('hardwareBackPress', dkd_handle_modal_back_value);
    return () => dkd_back_subscription_value.remove();
  }, [dkd_handle_modal_back_value, dkd_visible_value]);

  const dkd_open_featured_operation_value = (dkd_operation_key_value) => {
    const dkd_next_operation_value = String(dkd_operation_key_value || '');
    dkd_set_request_page_open_value(false);
    dkd_set_selected_category_value(null);
    if (dkd_next_operation_value === 'dkd_cargo_choices') {
      dkd_set_featured_operation_value('dkd_cargo_choices');
      dkd_set_cargo_panel_mode_value('');
    } else {
      dkd_set_featured_operation_value(dkd_next_operation_value);
      dkd_set_cargo_panel_mode_value('');
    }
    dkd_scroll_to_y_value((dkd_featured_section_y_ref_value.current || 320) + 170);
  };

  const dkd_select_group_value = (dkd_group_value) => {
    dkd_set_selected_group_id_value(dkd_group_value.dkd_group_id_value);
    dkd_set_selected_category_value(null);
    dkd_set_request_page_open_value(false);
    dkd_set_featured_operation_value('');
    dkd_set_cargo_panel_mode_value('');
    dkd_set_request_service_mode_value('');
    dkd_pending_group_scroll_id_ref_value.current = dkd_group_value.dkd_group_id_value;
  };

  const dkd_open_request_page_value = (dkd_category_value) => {
    if (dkd_service_network_category_locked_value(dkd_category_value)) {
      dkd_set_selected_category_value(null);
      dkd_set_request_page_open_value(false);
      dkd_set_request_service_mode_value('');
      Alert.alert(
        'Yapım Aşamasında',
        'Bütün ihtiyaçlarınızı Gönderi Panelini kullanarak, dilediğiniz hizmeti seçebilirsiniz.',
        [
          { text: 'Tamam', style: 'cancel' },
          { text: 'Gönderi Panelini Aç', onPress: () => dkd_open_featured_operation_value('dkd_cargo_choices') },
        ],
      );
      return;
    }
    const dkd_category_operation_value = dkd_get_service_network_operation_value(dkd_category_value);
    dkd_set_selected_category_value(dkd_category_value);
    dkd_set_request_service_mode_value(dkd_category_operation_value.dkd_mode_values[0] || '');
    dkd_set_request_page_open_value(true);
    dkd_load_restaurant_catalog_value();
    const dkd_request_fallback_y_value = (dkd_category_section_y_ref_value.current || 420) + 54 + (dkd_category_row_count_value * 154);
    dkd_scroll_to_y_value(dkd_request_section_y_ref_value.current || dkd_request_fallback_y_value);
  };

  useEffect(() => {
    if (!dkd_cargo_panel_mode_value) return;
    dkd_set_featured_operation_value(dkd_cargo_panel_mode_value === 'shipments' ? 'dkd_cargo_shipments' : 'dkd_cargo_create');
    dkd_scroll_to_y_value((dkd_featured_section_y_ref_value.current || 320) + 250);
  }, [dkd_cargo_panel_mode_value, dkd_scroll_to_y_value]);

  return (
    <Modal visible={dkd_visible_value} transparent animationType="slide" onRequestClose={dkd_handle_modal_back_value}>
      <View style={dkd_styles.dkd_overlay}>
        <View style={dkd_styles.dkd_modal_shell}>
          <View style={dkd_styles.dkd_header}>
            <View><Text style={dkd_styles.dkd_header_kicker}>DKD şehir servisleri</Text><Text style={dkd_styles.dkd_header_title}>Hizmet Ağı</Text></View>
            <Pressable onPress={dkd_on_close_value} style={dkd_styles.dkd_close_button}><MaterialCommunityIcons name="close" size={22} color="#EAF6FF" /></Pressable>
          </View>
          <ScrollView
            ref={dkd_scroll_view_ref_value}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(dkd_scroll_event_value) => { dkd_scroll_position_y_ref_value.current = dkd_scroll_event_value.nativeEvent.contentOffset.y; }}
            contentContainerStyle={dkd_styles.dkd_scroll_content}
          >
            <DkdServiceNetworkHero dkd_on_payment_method_press_value={dkd_open_service_wallet_modal_value} />
            <DkdServiceNetworkMyOrdersCard
              dkd_visible_value={dkd_visible_value}
              dkd_profile_value={dkd_profile_value}
            />

            <Text style={dkd_styles.dkd_section_title}>Hizmet grupları</Text>
            <View onLayout={(dkd_layout_event_value) => { dkd_featured_section_y_ref_value.current = dkd_layout_event_value.nativeEvent.layout.y; }}>
              <DkdServiceNetworkFeaturedActions
                dkd_active_operation_value={dkd_featured_operation_value}
                dkd_on_open_operation_value={dkd_open_featured_operation_value}
              />
              <DkdServiceNetworkFeaturedInlinePanel
                dkd_active_operation_value={dkd_featured_operation_value}
                dkd_set_cargo_panel_mode_value={dkd_set_cargo_panel_mode_value}
                dkd_profile_value={dkd_profile_value}
                dkd_set_profile_value={dkd_set_profile_value}
                dkd_current_location_value={dkd_current_location_value}
                dkd_is_admin_value={dkd_is_admin_value}
                dkd_on_close_value={dkd_close_featured_operation_value}
                dkd_on_home_return_value={dkd_on_close_value}
              />
            </View>
            <View style={dkd_styles.dkd_group_grid}>
              {dkd_service_network_category_groups_value.map((dkd_group_value) => {
                const dkd_active_group_value = dkd_group_value.dkd_group_id_value === dkd_selected_group_id_value;
                return <Pressable key={dkd_group_value.dkd_group_id_value} onPress={() => dkd_select_group_value(dkd_group_value)} style={dkd_styles.dkd_group_pressable}><LinearGradient colors={dkd_group_value.dkd_gradient_value} style={[dkd_styles.dkd_group_card, dkd_active_group_value && dkd_styles.dkd_group_card_active]}><View style={dkd_styles.dkd_group_meta_row}><MaterialCommunityIcons name={dkd_group_value.dkd_icon_value} size={25} color="#FFFFFF" /><View style={dkd_styles.dkd_group_count_chip}><Text style={dkd_styles.dkd_group_count_text}>{dkd_group_value.dkd_categories_value.length} kategori</Text></View></View><Text style={dkd_styles.dkd_group_title}>{dkd_group_value.dkd_title_value}</Text><Text style={dkd_styles.dkd_group_subtitle}>{dkd_group_value.dkd_subtitle_value}</Text></LinearGradient></Pressable>;
              })}
            </View>

            {dkd_selected_group_value ? (
              <View onLayout={(dkd_layout_event_value) => {
                dkd_category_section_y_ref_value.current = dkd_layout_event_value.nativeEvent.layout.y;
                dkd_scroll_to_category_once_value(dkd_selected_group_id_value);
              }}>
                <Text style={dkd_styles.dkd_section_title}>{dkd_selected_group_value.dkd_title_value}</Text>
                <View style={dkd_styles.dkd_category_grid}>
                  {dkd_selected_group_categories_value.map((dkd_category_value) => {
                    const dkd_active_category_value = dkd_selected_category_value?.dkd_id_value === dkd_category_value.dkd_id_value;
                    const dkd_is_restaurant_category_value = dkd_category_value.dkd_id_value === 'dkd_restaurant_order';
                    const dkd_category_locked_value = dkd_service_network_category_locked_value(dkd_category_value);
                    const dkd_category_cta_text_value = dkd_category_locked_value
                      ? 'Yapım Aşamasında'
                      : dkd_active_category_value && dkd_request_page_open_value
                        ? (dkd_is_restaurant_category_value ? 'Ürün listesi açık' : 'Sipariş paneli açık')
                        : (dkd_is_restaurant_category_value ? 'Ürünleri Listele' : 'Sipariş Oluştur');
                    return (
                      <Pressable key={dkd_category_value.dkd_id_value} onPress={() => dkd_open_request_page_value(dkd_category_value)} style={[dkd_styles.dkd_category_card, dkd_active_category_value && dkd_styles.dkd_category_card_active, dkd_category_locked_value && dkd_styles.dkd_category_card_locked]}>
                        {dkd_category_locked_value ? (
                          <View style={dkd_styles.dkd_category_lock_badge}>
                            <MaterialCommunityIcons name="lock-clock" size={12} color="#FDE68A" />
                            <Text style={dkd_styles.dkd_category_lock_text}>YAPIMDA</Text>
                          </View>
                        ) : null}
                        <View style={[dkd_styles.dkd_category_icon_wrap, dkd_category_value.dkd_icon_bg_value ? { backgroundColor: dkd_category_value.dkd_icon_bg_value, borderColor: dkd_category_value.dkd_icon_color_value || 'rgba(255,255,255,0.16)' } : null, dkd_active_category_value && dkd_styles.dkd_category_icon_wrap_active]}><MaterialCommunityIcons name={dkd_category_locked_value ? 'lock-outline' : dkd_category_value.dkd_icon_value} size={24} color={dkd_active_category_value ? '#0F172A' : (dkd_category_locked_value ? '#FDE68A' : (dkd_category_value.dkd_icon_color_value || '#BAE6FD'))} /></View>
                        <Text style={[dkd_styles.dkd_category_title, dkd_active_category_value && dkd_styles.dkd_category_title_active]}>{dkd_category_value.dkd_title_value}</Text>
                        <Text style={[dkd_styles.dkd_category_desc, dkd_active_category_value && dkd_styles.dkd_category_desc_active]}>{dkd_category_value.dkd_desc_value}</Text>
                        <View style={[dkd_styles.dkd_category_request_pill, dkd_active_category_value && dkd_styles.dkd_category_request_pill_active, dkd_category_locked_value && dkd_styles.dkd_category_request_pill_locked]}>
                          <Text style={[dkd_styles.dkd_category_request_text, dkd_active_category_value && dkd_styles.dkd_category_request_text_active, dkd_category_locked_value && dkd_styles.dkd_category_request_text_locked]}>{dkd_category_cta_text_value}</Text>
                          <MaterialCommunityIcons name={dkd_category_locked_value ? 'lock-alert-outline' : 'chevron-down-circle-outline'} size={15} color={dkd_active_category_value ? '#0F172A' : (dkd_category_locked_value ? '#FDE68A' : '#7DD3FC')} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {dkd_request_page_open_value ? (
              <View onLayout={(dkd_layout_event_value) => { dkd_request_section_y_ref_value.current = dkd_layout_event_value.nativeEvent.layout.y; }}>
                {dkd_selected_category_value?.dkd_id_value === 'dkd_restaurant_order' ? (
                  <DkdServiceNetworkRestaurantCatalogPanel
                    dkd_selected_category_value={dkd_selected_category_value}
                    dkd_current_location_text_value={dkd_current_location_text_value}
                    dkd_restaurant_catalog_product_values={dkd_restaurant_catalog_product_values}
                    dkd_restaurant_catalog_loading_value={dkd_restaurant_catalog_loading_value}
                    dkd_restaurant_catalog_error_value={dkd_restaurant_catalog_error_value}
                    dkd_on_back_value={dkd_close_request_panel_value}
                    dkd_profile_value={dkd_profile_value}
                    dkd_set_profile_value={dkd_set_profile_value}
                    dkd_current_location_value={dkd_current_location_value}
                    dkd_on_home_return_value={dkd_on_close_value}
                    dkd_visible_value={dkd_visible_value}
                  />
                ) : (
                  <DkdServiceNetworkRequestPage
                    dkd_selected_category_value={dkd_selected_category_value}
                    dkd_selected_group_value={dkd_selected_group_value}
                    dkd_current_location_text_value={dkd_current_location_text_value}
                    dkd_request_address_value={dkd_request_address_value}
                    dkd_set_request_address_value={dkd_set_request_address_value}
                    dkd_request_delivery_value={dkd_request_delivery_value}
                    dkd_set_request_delivery_value={dkd_set_request_delivery_value}
                    dkd_request_note_value={dkd_request_note_value}
                    dkd_set_request_note_value={dkd_set_request_note_value}
                    dkd_request_photo_value={dkd_request_photo_value}
                    dkd_set_request_photo_value={dkd_set_request_photo_value}
                    dkd_request_schedule_value={dkd_request_schedule_value}
                    dkd_set_request_schedule_value={dkd_set_request_schedule_value}
                    dkd_request_budget_value={dkd_request_budget_value}
                    dkd_set_request_budget_value={dkd_set_request_budget_value}
                    dkd_request_contact_value={dkd_request_contact_value}
                    dkd_set_request_contact_value={dkd_set_request_contact_value}
                    dkd_request_urgency_value={dkd_request_urgency_value}
                    dkd_set_request_urgency_value={dkd_set_request_urgency_value}
                    dkd_request_service_mode_value={dkd_request_service_mode_value}
                    dkd_set_request_service_mode_value={dkd_set_request_service_mode_value}
                    dkd_on_back_value={dkd_close_request_panel_value}
                    dkd_profile_value={dkd_profile_value}
                    dkd_current_location_value={dkd_current_location_value}
                  />
                )}
              </View>
            ) : null}
          </ScrollView>
          <DkdWalletPaymentMethodModal
            dkd_visible_value={dkd_service_wallet_modal_visible_value}
            dkd_on_close_value={dkd_close_service_wallet_modal_value}
            dkd_order_title_value="Cüzdanına Bakiye Yükle"
            dkd_order_total_tl_value={0}
            dkd_wallet_tl_value={dkd_service_wallet_tl_value || 0}
            dkd_wallet_pay_busy_value={false}
            dkd_on_wallet_pay_value={dkd_handle_service_wallet_pay_notice_value}
            dkd_on_wallet_after_topup_value={dkd_sync_service_wallet_after_topup_value}
            dkd_on_bank_transfer_success_value={dkd_close_service_wallet_modal_value}
            dkd_on_home_return_value={dkd_on_close_value}
              dkd_context_note_value="Cüzdanına TL yüklemek için yöntem seç; bakiye yalnızca fiziksel Hizmet Ağı, restoran, market ve gönderi siparişlerinde kullanılır."
          />
        </View>
      </View>
    </Modal>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.82)', justifyContent: 'flex-end' },
  dkd_modal_shell: { maxHeight: '94%', backgroundColor: '#07111F', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: 'rgba(148,163,184,0.22)', overflow: 'hidden' },
  dkd_header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.96)' },
  dkd_header_kicker: { color: '#93C5FD', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  dkd_header_title: { color: '#F8FAFC', fontSize: 26, fontWeight: '900' },
  dkd_close_button: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_scroll_content: { padding: 16, paddingBottom: 34 },
  dkd_hero_shell: { borderRadius: 26, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  dkd_hero_icon_cloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  dkd_hero_eyebrow: { color: '#BAE6FD', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  dkd_hero_title: { color: '#FFFFFF', fontSize: 17.8, lineHeight: 22, fontWeight: '900', marginTop: 5 },
  dkd_hero_text: { color: 'rgba(241,245,249,0.82)', fontSize: 13, lineHeight: 19, marginTop: 9, fontWeight: '700' },
  dkd_hero_wallet_button: { position: 'relative', overflow: 'visible', marginTop: 13, minHeight: 56, borderRadius: 19, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(2,6,23,0.34)', borderWidth: 1, borderColor: 'rgba(186,230,253,0.30)' },
  dkd_hero_wallet_button_pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  dkd_hero_wallet_icon_wrap: { width: 38, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)' },
  dkd_hero_wallet_corner_cue: { position: 'absolute', top: -9, right: -7, width: 29, height: 29, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE68A', borderWidth: 1.4, borderColor: 'rgba(255,255,255,0.92)', shadowColor: '#FDE68A', shadowOpacity: 0.44, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 8, zIndex: 3 },
  dkd_hero_wallet_corner_cue_ring: { position: 'absolute', width: 37, height: 37, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(253,230,138,0.44)', backgroundColor: 'rgba(253,230,138,0.08)' },
  dkd_hero_wallet_copy: { flex: 1, minWidth: 0 },
  dkd_hero_wallet_title: { color: '#F8FAFC', fontSize: 14.5, lineHeight: 18, fontWeight: '950' },
  dkd_hero_wallet_text: { color: 'rgba(226,242,255,0.70)', fontSize: 10.8, lineHeight: 14, fontWeight: '800', marginTop: 1 },
  dkd_hero_pill_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  dkd_hero_pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  dkd_hero_pill_text: { color: '#F8FAFC', fontSize: 11, fontWeight: '900' },
  dkd_my_orders_shell: { marginTop: 12, borderRadius: 30, padding: 12, backgroundColor: 'rgba(7,15,29,0.94)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.24)' },
  dkd_my_orders_header_animated_wrap: { borderRadius: 31 },
  dkd_my_orders_header_pressable: { borderRadius: 31 },
  dkd_my_orders_header_card: { minHeight: 112, borderRadius: 31, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1.4, borderColor: 'rgba(255,255,255,0.30)', overflow: 'hidden' },
  dkd_my_orders_icon_float_wrap: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center' },
  dkd_my_orders_icon_stack: { width: 66, height: 66, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1.4, borderColor: 'rgba(255,255,255,0.72)' },
  dkd_my_orders_icon_badge: { position: 'absolute', right: -1, top: 2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE68A', borderWidth: 1, borderColor: 'rgba(67,20,7,0.20)' },
  dkd_my_orders_header_copy: { flex: 1, minWidth: 0 },
  dkd_my_orders_kicker_row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dkd_my_orders_kicker: { color: '#E0F2FE', fontSize: 10.5, fontWeight: '950', letterSpacing: 1.35 },
  dkd_my_orders_title: { color: '#FFFFFF', fontSize: 28, fontWeight: '950', marginTop: 2, letterSpacing: -0.55 },
  dkd_my_orders_subtitle: { color: 'rgba(240,249,255,0.90)', fontSize: 12.7, lineHeight: 17, fontWeight: '900', marginTop: 4 },
  dkd_my_orders_header_actions: { alignItems: 'center', gap: 8 },
  dkd_my_orders_refresh_button: { width: 44, height: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.64)', borderWidth: 1.2, borderColor: 'rgba(240,249,255,0.38)' },
  dkd_my_orders_chevron_button: { width: 38, height: 38, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE68A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)' },
  dkd_my_orders_closed_hint_card: { marginTop: 10, borderRadius: 18, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(15,23,42,0.68)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.16)' },
  dkd_my_orders_closed_hint_text: { flex: 1, color: 'rgba(226,242,255,0.74)', fontSize: 11, lineHeight: 15, fontWeight: '800' },
  dkd_my_orders_filter_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  dkd_my_orders_filter_chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.86)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)' },
  dkd_my_orders_filter_chip_active: { backgroundColor: '#BAE6FD', borderColor: '#FDE68A' },
  dkd_my_orders_filter_text: { color: '#BAE6FD', fontSize: 10.7, fontWeight: '900' },
  dkd_my_orders_filter_text_active: { color: '#07131C' },
  dkd_my_orders_list_shell: { gap: 11, marginTop: 12 },
  dkd_my_orders_order_pressable: { borderRadius: 24 },
  dkd_my_orders_order_card: { minHeight: 88, borderRadius: 24, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1.2, borderColor: 'rgba(255,255,255,0.17)', overflow: 'hidden' },
  dkd_my_orders_order_icon_wrap: { width: 50, height: 50, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE68A', borderWidth: 1.2, borderColor: 'rgba(255,255,255,0.42)' },
  dkd_my_orders_order_copy: { flex: 1, minWidth: 0 },
  dkd_my_orders_order_title_row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dkd_my_orders_order_title: { flex: 1, color: '#F8FAFC', fontSize: 15.5, fontWeight: '950', letterSpacing: -0.2 },
  dkd_my_orders_type_pill: { maxWidth: 92, overflow: 'hidden', color: '#07131C', fontSize: 9.4, fontWeight: '950', paddingHorizontal: 7, paddingVertical: 3.5, borderRadius: 999, backgroundColor: 'rgba(253,230,138,0.94)' },
  dkd_my_orders_order_route_row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dkd_my_orders_order_subtitle: { flex: 1, color: 'rgba(226,242,255,0.76)', fontSize: 11.4, fontWeight: '800' },
  dkd_my_orders_order_meta_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  dkd_my_orders_status_pill: { overflow: 'hidden', color: '#07131C', fontSize: 10.4, fontWeight: '950', paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: 999, backgroundColor: '#BAE6FD' },
  dkd_my_orders_live_pill: { overflow: 'hidden', color: '#052E16', fontSize: 10.4, fontWeight: '950', paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: 999, backgroundColor: '#86EFAC' },
  dkd_my_orders_detail_hint_pill: { overflow: 'hidden', color: '#DBEAFE', fontSize: 10.1, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 4.5, borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.20)', borderWidth: 1, borderColor: 'rgba(147,197,253,0.24)' },
  dkd_my_orders_order_action_area: { alignItems: 'center', justifyContent: 'center' },
  dkd_my_orders_chevron_circle: { width: 34, height: 34, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: 'rgba(253,230,138,0.55)' },
  dkd_my_orders_delete_button: { width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(127,29,29,0.82)', borderWidth: 1.1, borderColor: 'rgba(254,202,202,0.34)' },
  dkd_my_orders_empty_card: { minHeight: 62, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(15,23,42,0.76)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.16)' },
  dkd_my_orders_empty_text: { flex: 1, color: 'rgba(226,242,255,0.74)', fontSize: 11.5, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
  dkd_my_orders_detail_overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.88)', justifyContent: 'center', padding: 14 },
  dkd_my_orders_detail_card: { maxHeight: '92%', borderRadius: 30, padding: 15, backgroundColor: '#07111F', borderWidth: 1, borderColor: 'rgba(125,211,252,0.28)' },
  dkd_my_orders_detail_header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  dkd_my_orders_detail_icon_wrap: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  dkd_my_orders_detail_title_copy: { flex: 1, minWidth: 0 },
  dkd_my_orders_detail_kicker: { color: '#BAE6FD', fontSize: 10.5, fontWeight: '900', letterSpacing: 1.1 },
  dkd_my_orders_detail_title: { color: '#FFFFFF', fontSize: 21, lineHeight: 25, fontWeight: '950', marginTop: 3 },
  dkd_my_orders_detail_close_button: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_my_orders_detail_scroll_content: { paddingBottom: 6 },
  dkd_my_orders_detail_status_card: { borderRadius: 21, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(14,165,233,0.16)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.20)', marginBottom: 10 },
  dkd_my_orders_detail_status_text: { color: '#FDE68A', fontSize: 14, fontWeight: '950' },
  dkd_my_orders_live_card: { borderRadius: 22, padding: 12, backgroundColor: 'rgba(6,78,59,0.26)', borderWidth: 1, borderColor: 'rgba(134,239,172,0.22)', marginBottom: 10 },
  dkd_my_orders_live_header: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#86EFAC' },
  dkd_my_orders_live_title: { color: '#052E16', fontSize: 11, fontWeight: '950' },
  dkd_my_orders_live_text: { color: '#D1FAE5', fontSize: 11.5, lineHeight: 16, fontWeight: '800', marginTop: 9 },
  dkd_my_orders_mapbox_button: { marginTop: 11, minHeight: 43, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(253,230,138,0.74)' },
  dkd_my_orders_mapbox_button_text: { color: '#07131C', fontSize: 12, fontWeight: '950', letterSpacing: 0.2 },
  dkd_my_orders_live_map: { height: 170, borderRadius: 20, marginTop: 10, overflow: 'hidden' },
  dkd_my_orders_detail_grid: { marginTop: 2 },
  dkd_my_orders_detail_line_row: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 18, padding: 11, backgroundColor: 'rgba(15,23,42,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginTop: 8 },
  dkd_my_orders_detail_line_copy: { flex: 1, minWidth: 0 },
  dkd_my_orders_detail_line_label: { color: 'rgba(186,230,253,0.82)', fontSize: 10.5, fontWeight: '900', letterSpacing: 0.5 },
  dkd_my_orders_detail_line_text: { color: '#F8FAFC', fontSize: 12.3, lineHeight: 17, fontWeight: '800', marginTop: 2 },
  dkd_my_orders_detail_delete_button: { marginTop: 12, minHeight: 44, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(127,29,29,0.80)', borderWidth: 1, borderColor: 'rgba(254,202,202,0.28)' },
  dkd_my_orders_detail_delete_text: { color: '#FEE2E2', fontSize: 12, fontWeight: '950' },
  dkd_source_detail_card: { borderRadius: 23, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', marginBottom: 10, overflow: 'hidden' },
  dkd_source_detail_header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  dkd_source_detail_icon_wrap: { width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(255,255,255,0.36)' },
  dkd_source_detail_header_copy: { flex: 1, minWidth: 0 },
  dkd_source_detail_kicker: { color: '#BAE6FD', fontSize: 10, fontWeight: '950', letterSpacing: 0.9 },
  dkd_source_detail_title: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '950', marginTop: 2 },
  dkd_source_detail_subtitle: { color: 'rgba(226,242,255,0.64)', fontSize: 10.6, fontWeight: '800', marginTop: 2 },
  dkd_source_detail_status_pill: { overflow: 'hidden', alignSelf: 'flex-start', color: '#07131C', fontSize: 10, fontWeight: '950', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: '#FDE68A' },
  dkd_source_metric_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  dkd_source_metric_card: { flexGrow: 1, flexBasis: '47%', minHeight: 76, borderRadius: 17, padding: 9, borderWidth: 1 },
  dkd_source_metric_icon_wrap: { width: 25, height: 25, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,6,23,0.38)', marginBottom: 5 },
  dkd_source_metric_label: { color: 'rgba(226,242,255,0.72)', fontSize: 9.8, fontWeight: '900', letterSpacing: 0.3 },
  dkd_source_metric_value: { color: '#F8FAFC', fontSize: 12.2, lineHeight: 16, fontWeight: '950', marginTop: 2 },
  dkd_source_timeline_row: { flexDirection: 'row', marginTop: 2, marginBottom: 8 },
  dkd_source_timeline_step: { flex: 1, minWidth: 0 },
  dkd_source_timeline_line_wrap: { flexDirection: 'row', alignItems: 'center' },
  dkd_source_timeline_dot: { width: 13, height: 13, borderRadius: 999, backgroundColor: 'rgba(148,163,184,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  dkd_source_timeline_dot_done: { backgroundColor: '#86EFAC', borderColor: '#FDE68A' },
  dkd_source_timeline_line: { flex: 1, height: 2, backgroundColor: 'rgba(148,163,184,0.28)' },
  dkd_source_timeline_line_done: { backgroundColor: '#86EFAC' },
  dkd_source_timeline_label: { color: 'rgba(226,242,255,0.62)', fontSize: 9.2, fontWeight: '900', marginTop: 5 },
  dkd_source_timeline_label_done: { color: '#D1FAE5' },
  dkd_source_action_stack: { gap: 8, marginTop: 11, marginBottom: 10 },
  dkd_source_primary_action_button: { minHeight: 43, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#86EFAC', borderWidth: 1, borderColor: 'rgba(253,230,138,0.54)' },
  dkd_source_primary_action_text: { color: '#052E16', fontSize: 12, fontWeight: '950' },
  dkd_source_danger_action_button: { minHeight: 43, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(127,29,29,0.84)', borderWidth: 1, borderColor: 'rgba(254,202,202,0.30)' },
  dkd_source_danger_action_text: { color: '#FEE2E2', fontSize: 12, fontWeight: '950' },
  dkd_source_action_button_busy: { opacity: 0.62 },
  dkd_source_message_input_card: { borderRadius: 21, padding: 11, marginTop: 10, marginBottom: 10, backgroundColor: 'rgba(15,23,42,0.74)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)' },
  dkd_source_message_input_header: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  dkd_source_message_input_title: { color: '#BAE6FD', fontSize: 12, fontWeight: '950' },
  dkd_source_message_input: { minHeight: 66, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 10, color: '#F8FAFC', fontSize: 12.5, fontWeight: '800', textAlignVertical: 'top', backgroundColor: 'rgba(2,6,23,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  dkd_source_message_send_button: { marginTop: 9, minHeight: 39, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(253,230,138,0.54)' },
  dkd_source_message_send_button_disabled: { opacity: 0.48 },
  dkd_source_message_send_text: { color: '#07131C', fontSize: 11.5, fontWeight: '950' },
  dkd_source_item_list: { gap: 8, marginTop: 10 },
  dkd_source_item_chip: { borderRadius: 16, padding: 10, backgroundColor: 'rgba(15,23,42,0.72)', borderWidth: 1, borderColor: 'rgba(186,230,253,0.16)' },
  dkd_source_item_title: { color: '#FDE68A', fontSize: 12.4, fontWeight: '950' },
  dkd_source_item_text: { color: '#F8FAFC', fontSize: 12, lineHeight: 16, fontWeight: '800', marginTop: 3 },
  dkd_source_item_total_text: { color: '#86EFAC', fontSize: 11.5, fontWeight: '950', marginTop: 5 },
  dkd_source_empty_text: { color: 'rgba(226,242,255,0.68)', fontSize: 11.8, lineHeight: 16, fontWeight: '800' },
  dkd_source_preview_image: { width: '100%', height: 128, borderRadius: 18, marginTop: 10, backgroundColor: 'rgba(15,23,42,0.76)' },
  dkd_source_message_box: { marginTop: 10, borderRadius: 17, padding: 10, backgroundColor: 'rgba(2,6,23,0.38)', borderWidth: 1, borderColor: 'rgba(186,230,253,0.16)' },
  dkd_source_message_header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dkd_source_message_title: { color: '#BAE6FD', fontSize: 11, fontWeight: '950' },
  dkd_source_message_bubble: { borderRadius: 14, padding: 9, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 6 },
  dkd_source_message_sender: { color: '#FDE68A', fontSize: 10.5, fontWeight: '950' },
  dkd_source_message_text: { color: '#F8FAFC', fontSize: 11.5, lineHeight: 15, fontWeight: '800', marginTop: 2 },
  dkd_source_section_card: { borderRadius: 17, padding: 10, backgroundColor: 'rgba(15,23,42,0.56)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginTop: 10 },
  dkd_source_section_title: { color: '#F8FAFC', fontSize: 12.5, fontWeight: '950', marginBottom: 8 },
  dkd_source_info_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dkd_source_route_stack: { marginTop: 2 },
  dkd_status_row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dkd_status_card: { flex: 1, minHeight: 44, borderRadius: 16, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(15,23,42,0.92)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)' },
  dkd_status_text: { color: '#DDEBFF', fontSize: 11, fontWeight: '800', flex: 1 },
  dkd_section_title: { color: '#F8FAFC', fontSize: 17, fontWeight: '900', marginTop: 18, marginBottom: 10 },
  dkd_featured_action_shell: { position: 'relative', marginBottom: 14, borderRadius: 28, padding: 13, paddingTop: 16, backgroundColor: 'rgba(15,23,42,0.92)', borderWidth: 1.5, borderColor: 'rgba(253,230,138,0.42)', shadowColor: '#FDE68A', shadowOpacity: 0.16, shadowRadius: 16, elevation: 5 },
  dkd_featured_action_page_badge: { position: 'absolute', top: 12, right: 12, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(14,165,233,0.24)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.72)', shadowColor: '#22D3EE', shadowOpacity: 0.24, shadowRadius: 10, elevation: 5 },
  dkd_featured_action_ribbon: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#FDE68A', marginRight: 96, marginBottom: 12 },
  dkd_featured_action_ribbon_text: { color: '#07131C', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  dkd_featured_action_header_chip_text: { color: '#E0F2FE', fontSize: 11.5, fontWeight: '900', letterSpacing: 0.5 },
  dkd_featured_action_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dkd_featured_action_pressable: { width: '48%' },
  dkd_featured_action_card: { minHeight: 168, borderRadius: 22, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  dkd_featured_action_card_active: { borderColor: 'rgba(253,230,138,0.86)', transform: [{ translateY: -2 }] },
  dkd_featured_action_corner_mark: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 999, backgroundColor: '#FDE68A', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  dkd_featured_action_top_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  dkd_featured_action_icon_shell: { width: 44, height: 44, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.26)' },
  dkd_featured_action_badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  dkd_featured_action_badge_text: { color: '#F8FAFC', fontSize: 10.5, fontWeight: '900' },
  dkd_featured_action_eyebrow: { color: '#BAE6FD', fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  dkd_featured_action_card_title: { color: '#FFFFFF', fontSize: 16.5, lineHeight: 20, fontWeight: '900', marginTop: 3 },
  dkd_featured_action_desc: { color: 'rgba(226,242,255,0.76)', fontSize: 11.5, lineHeight: 16, fontWeight: '800', marginTop: 5 },
  dkd_featured_action_cta_row: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(14,165,233,0.14)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.24)' },
  dkd_featured_action_cta_text: { color: '#BAE6FD', fontSize: 11, fontWeight: '900' },
  dkd_featured_inline_panel_shell: { marginTop: 2, marginBottom: 16, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(125,211,252,0.24)', backgroundColor: 'rgba(7,15,29,0.96)' },
  dkd_featured_inline_panel_header: { minHeight: 92, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.10)' },
  dkd_featured_inline_panel_header_icon: { width: 44, height: 44, borderRadius: 17, backgroundColor: '#FDE68A', alignItems: 'center', justifyContent: 'center' },
  dkd_featured_inline_panel_header_copy: { flex: 1, minWidth: 0 },
  dkd_featured_inline_panel_kicker: { color: '#BAE6FD', fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  dkd_featured_inline_panel_title: { color: '#F8FAFC', fontSize: 19, fontWeight: '900', marginTop: 2 },
  dkd_featured_inline_panel_text: { color: 'rgba(226,242,255,0.74)', fontSize: 11.5, lineHeight: 16, fontWeight: '700', marginTop: 3 },
  dkd_featured_inline_close_button: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_cargo_choice_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12 },
  dkd_cargo_choice_card_pressable: { width: '48%' },
  dkd_cargo_choice_card_pressable_inner: { flex: 1 },
  dkd_cargo_choice_card: { minHeight: 154, borderRadius: 22, padding: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  dkd_cargo_choice_icon_wrap: { width: 45, height: 45, borderRadius: 17, backgroundColor: '#BAE6FD', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  dkd_cargo_choice_title: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '900' },
  dkd_cargo_choice_text: { color: 'rgba(226,242,255,0.74)', fontSize: 11.5, lineHeight: 16, fontWeight: '700', marginTop: 5 },
  dkd_cargo_choice_cta: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(14,165,233,0.14)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.24)' },
  dkd_cargo_choice_cta_text: { color: '#BAE6FD', fontSize: 11, fontWeight: '900' },
  dkd_group_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dkd_group_pressable: { width: '48%' },
  dkd_group_card: { minHeight: 138, borderRadius: 22, padding: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  dkd_group_card_active: { borderColor: 'rgba(253,230,138,0.82)', transform: [{ translateY: -2 }] },
  dkd_group_meta_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dkd_group_count_chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  dkd_group_count_text: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' },
  dkd_group_title: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 8 },
  dkd_group_subtitle: { color: 'rgba(241,245,249,0.76)', fontSize: 10.5, lineHeight: 14, fontWeight: '700', marginTop: 5 },
  dkd_category_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dkd_empty_category_card: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 24, padding: 14, backgroundColor: 'rgba(15,23,42,0.82)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)' },
  dkd_empty_category_icon_wrap: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  dkd_empty_category_body: { flex: 1 },
  dkd_empty_category_title: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  dkd_empty_category_desc: { color: 'rgba(226,242,255,0.72)', fontSize: 11.5, lineHeight: 16, fontWeight: '700', marginTop: 4 },
  dkd_category_card: { width: '48%', minHeight: 142, borderRadius: 20, padding: 12, backgroundColor: 'rgba(15,23,42,0.92)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)' },
  dkd_category_card_active: { backgroundColor: '#E0F2FE', borderColor: '#FDE68A' },
  dkd_category_card_locked: { opacity: 0.76, borderColor: 'rgba(253,230,138,0.28)', backgroundColor: 'rgba(15,23,42,0.86)' },
  dkd_category_lock_badge: { position: 'absolute', top: 9, right: 9, zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(120,53,15,0.72)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.32)' },
  dkd_category_lock_text: { color: '#FDE68A', fontSize: 8.5, fontWeight: '950', letterSpacing: 0.45 },
  dkd_category_icon_wrap: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  dkd_category_icon_wrap_active: { backgroundColor: 'rgba(15,23,42,0.08)', borderColor: 'rgba(15,23,42,0.20)' },
  dkd_category_title: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  dkd_category_title_active: { color: '#08111E' },
  dkd_category_desc: { color: 'rgba(226,242,255,0.70)', fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: 5 },
  dkd_category_desc_active: { color: '#334155' },
  dkd_request_card: { borderRadius: 24, padding: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.20)', marginTop: 18 },
  dkd_request_header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  dkd_request_icon_circle: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(253,230,138,0.12)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.26)' },
  dkd_request_header_texts: { flex: 1 },
  dkd_request_title: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
  dkd_request_subtitle: { color: '#BAE6FD', fontSize: 12, fontWeight: '800', marginTop: 2 },
  dkd_input: { minHeight: 46, borderRadius: 16, paddingHorizontal: 12, color: '#F8FAFC', fontSize: 13, fontWeight: '700', backgroundColor: 'rgba(2,6,23,0.42)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)', marginTop: 9 },
  dkd_note_input: { minHeight: 84, paddingTop: 11, textAlignVertical: 'top' },
  dkd_urgency_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  dkd_urgency_chip: { flexGrow: 1, minWidth: '30%', minHeight: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 9 },
  dkd_urgency_chip_active: { backgroundColor: '#FDE68A', borderColor: '#FFFFFF' },
  dkd_urgency_text: { color: '#DDEBFF', fontSize: 12, fontWeight: '900' },
  dkd_urgency_text_active: { color: '#0F172A' },
  dkd_order_logic_card: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 13, padding: 12, borderRadius: 18, backgroundColor: 'rgba(14,165,233,0.12)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.22)' },
  dkd_order_logic_icon_wrap: { width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7DD3FC' },
  dkd_order_logic_body: { flex: 1 },
  dkd_order_logic_title: { color: '#E0F2FE', fontSize: 12.5, fontWeight: '900' },
  dkd_order_logic_desc: { color: 'rgba(226,242,255,0.74)', fontSize: 11.5, lineHeight: 16, fontWeight: '700', marginTop: 4 },
  dkd_flow_panel: { marginTop: 13, borderRadius: 18, padding: 12, backgroundColor: 'rgba(14,165,233,0.10)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)' },
  dkd_flow_title: { color: '#BAE6FD', fontSize: 13, fontWeight: '900', marginBottom: 5 },
  dkd_flow_text: { color: 'rgba(226,242,255,0.78)', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  dkd_next_step_panel: { gap: 10, marginBottom: 4 },
  dkd_next_step_card: { flexDirection: 'row', gap: 11, alignItems: 'flex-start', padding: 12, borderRadius: 20, backgroundColor: 'rgba(15,23,42,0.82)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)' },
  dkd_next_step_icon_wrap: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dkd_next_step_body: { flex: 1 },
  dkd_next_step_title: { color: '#F8FAFC', fontSize: 13, fontWeight: '900' },
  dkd_next_step_desc: { color: 'rgba(226,242,255,0.72)', fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: 4 },
  dkd_partner_card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 20, backgroundColor: 'rgba(15,23,42,0.92)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)', marginBottom: 10 },
  dkd_partner_icon_wrap: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BAE6FD' },
  dkd_partner_body: { flex: 1 },
  dkd_partner_name: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  dkd_partner_meta: { color: '#C4B5FD', fontSize: 12, fontWeight: '800', marginTop: 2 },
  dkd_partner_zone: { color: 'rgba(226,242,255,0.70)', fontSize: 11, fontWeight: '700', marginTop: 3 },
  dkd_partner_badge_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9, alignItems: 'center' },
  dkd_partner_badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.14)', borderWidth: 1, borderColor: 'rgba(110,231,183,0.22)' },
  dkd_partner_badge_text: { color: '#A7F3D0', fontSize: 10, fontWeight: '900' },
  dkd_partner_rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dkd_partner_rating_text: { color: '#FDE68A', fontSize: 11, fontWeight: '900' },

  dkd_category_request_pill: { marginTop: 10, minHeight: 30, borderRadius: 999, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(14,165,233,0.10)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)' },
  dkd_category_request_pill_active: { backgroundColor: 'rgba(15,23,42,0.08)', borderColor: 'rgba(15,23,42,0.18)' },
  dkd_category_request_pill_locked: { backgroundColor: 'rgba(120,53,15,0.30)', borderColor: 'rgba(253,230,138,0.22)' },
  dkd_category_request_text: { color: '#BAE6FD', fontSize: 10.5, fontWeight: '900' },
  dkd_category_request_text_active: { color: '#08111E' },
  dkd_category_request_text_locked: { color: '#FDE68A' },
  dkd_request_page_wrap: { marginTop: 18, gap: 13, paddingTop: 2 },
  dkd_back_button: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(14,165,233,0.16)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.28)' },
  dkd_back_button_text: { color: '#BAE6FD', fontSize: 12, fontWeight: '900' },
  dkd_request_page_hero: { borderRadius: 30, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden', shadowColor: '#38BDF8', shadowOpacity: 0.20, shadowRadius: 18, elevation: 4 },
  dkd_request_page_hero_top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dkd_request_page_icon_shell: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: 'rgba(255,255,255,0.34)' },
  dkd_request_page_title_box: { flex: 1 },
  dkd_request_page_kicker: { color: '#BAE6FD', fontSize: 10.5, fontWeight: '900', letterSpacing: 1.1 },
  dkd_request_page_title: { color: '#FFFFFF', fontSize: 24, lineHeight: 28, fontWeight: '900', marginTop: 2 },
  dkd_request_page_group: { color: 'rgba(241,245,249,0.78)', fontSize: 12, fontWeight: '850', marginTop: 3 },
  dkd_request_page_text: { color: 'rgba(248,250,252,0.84)', fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 12 },
  dkd_request_badge_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  dkd_request_badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  dkd_request_badge_text: { color: '#E0F2FE', fontSize: 10.5, fontWeight: '900' },
  dkd_detail_block: { borderRadius: 22, padding: 13, backgroundColor: 'rgba(15,23,42,0.88)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.20)' },
  dkd_detail_title: { color: '#F8FAFC', fontSize: 15, fontWeight: '900' },
  dkd_detail_title_small: { color: '#F8FAFC', fontSize: 13, fontWeight: '900', marginTop: 13 },
  dkd_detail_desc: { color: 'rgba(226,242,255,0.72)', fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 5 },
  dkd_option_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
  dkd_option_chip: { width: '48%', minHeight: 42, borderRadius: 15, paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(20,83,45,0.22)', borderWidth: 1, borderColor: 'rgba(167,243,208,0.18)' },
  dkd_option_chip_text: { flex: 1, color: '#D1FAE5', fontSize: 11, fontWeight: '850' },
  dkd_form_section_card: { borderRadius: 26, padding: 13, backgroundColor: 'rgba(8,18,36,0.82)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)' },
  dkd_form_section_title_row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  dkd_form_section_title_body: { flex: 1 },
  dkd_request_field_list: { gap: 10, marginTop: 4 },
  dkd_request_field_card: { borderRadius: 20, padding: 11, backgroundColor: 'rgba(15,23,42,0.74)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)' },
  dkd_request_field_label_row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dkd_request_field_icon_wrap: { width: 30, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BAE6FD' },
  dkd_request_field_label: { color: '#F8FAFC', fontSize: 12.5, fontWeight: '900', flex: 1 },
  dkd_request_field_input: { minHeight: 42, borderRadius: 15, paddingHorizontal: 12, color: '#F8FAFC', fontSize: 13, fontWeight: '700', backgroundColor: 'rgba(2,6,23,0.48)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.14)' },
  dkd_request_field_input_multiline: { minHeight: 82, paddingTop: 10, textAlignVertical: 'top' },
  dkd_request_flow_row: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 10 },
  dkd_request_flow_dot: { width: 25, height: 25, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A7F3D0' },
  dkd_request_flow_text: { flex: 1, color: 'rgba(226,242,255,0.80)', fontSize: 12, lineHeight: 17, fontWeight: '800' },
  dkd_summary_card: { borderRadius: 24, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_summary_kicker: { color: '#BAE6FD', fontSize: 10.5, fontWeight: '900', letterSpacing: 1.1 },
  dkd_summary_title: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 4 },
  dkd_summary_line: { color: 'rgba(248,250,252,0.82)', fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 5 },
  dkd_prepare_button: { borderRadius: 18, overflow: 'hidden' },
  dkd_prepare_button_gradient: { minHeight: 48, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  dkd_prepare_button_text: { color: '#07131C', fontSize: 13, fontWeight: '900' },
  dkd_restaurant_catalog_wrap: { marginTop: 18, gap: 13, paddingTop: 2 },
  dkd_restaurant_catalog_hero: { borderRadius: 30, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', overflow: 'hidden', shadowColor: '#FB923C', shadowOpacity: 0.24, shadowRadius: 20, elevation: 5 },
  dkd_restaurant_catalog_hero_top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dkd_restaurant_catalog_icon_shell: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FED7AA', borderWidth: 1, borderColor: 'rgba(255,255,255,0.34)' },
  dkd_restaurant_catalog_hero_copy: { flex: 1 },
  dkd_restaurant_catalog_kicker: { color: '#FED7AA', fontSize: 10.5, fontWeight: '900', letterSpacing: 1.1 },
  dkd_restaurant_catalog_title: { color: '#FFFFFF', fontSize: 24, lineHeight: 28, fontWeight: '900', marginTop: 2 },
  dkd_restaurant_catalog_text: { color: 'rgba(255,247,237,0.84)', fontSize: 12.5, lineHeight: 18, fontWeight: '750', marginTop: 6 },
  dkd_restaurant_catalog_badge_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  dkd_restaurant_catalog_badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  dkd_restaurant_catalog_badge_text: { color: '#FFF7ED', fontSize: 10.5, fontWeight: '900' },
  dkd_restaurant_catalog_refresh_row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -4 },
  dkd_restaurant_catalog_tools: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 13, borderRadius: 22, backgroundColor: 'rgba(15,23,42,0.88)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.20)' },
  dkd_restaurant_catalog_tool_copy: { flex: 1 },
  dkd_restaurant_catalog_tool_title: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  dkd_restaurant_catalog_tool_text: { color: 'rgba(226,242,255,0.72)', fontSize: 11.5, lineHeight: 16, fontWeight: '750', marginTop: 4 },
  dkd_restaurant_catalog_reload_button: { minHeight: 38, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FED7AA' },
  dkd_restaurant_catalog_reload_text: { color: '#07131C', fontSize: 11, fontWeight: '900' },
  dkd_restaurant_catalog_empty_card: { flexDirection: 'row', gap: 11, alignItems: 'flex-start', padding: 13, borderRadius: 22, backgroundColor: 'rgba(15,23,42,0.90)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.20)' },
  dkd_restaurant_catalog_empty_copy: { flex: 1 },
  dkd_restaurant_catalog_empty_title: { color: '#F8FAFC', fontSize: 14, fontWeight: '900' },
  dkd_restaurant_catalog_empty_text: { color: 'rgba(226,242,255,0.72)', fontSize: 11.5, lineHeight: 16, fontWeight: '750', marginTop: 4 },
  dkd_restaurant_business_section: { gap: 12, padding: 13, borderRadius: 28, backgroundColor: 'rgba(7,15,29,0.96)', borderWidth: 1, borderColor: 'rgba(253,186,116,0.24)' },
  dkd_restaurant_business_header: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  dkd_restaurant_business_icon: { width: 44, height: 44, borderRadius: 17, backgroundColor: '#FED7AA', alignItems: 'center', justifyContent: 'center' },
  dkd_restaurant_business_copy: { flex: 1 },
  dkd_restaurant_business_title: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  dkd_restaurant_business_meta: { color: '#FED7AA', fontSize: 11.5, fontWeight: '900', marginTop: 2 },
  dkd_restaurant_business_address: { color: 'rgba(226,242,255,0.68)', fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: 3 },
  dkd_restaurant_product_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dkd_restaurant_product_card: { width: '48%', minHeight: 218, borderRadius: 24, padding: 10, backgroundColor: 'rgba(15,23,42,0.94)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  dkd_restaurant_product_image_shell: { height: 96, borderRadius: 19, overflow: 'hidden', marginBottom: 8, backgroundColor: 'rgba(251,146,60,0.10)', borderWidth: 1, borderColor: 'rgba(253,186,116,0.16)' },
  dkd_restaurant_product_image: { width: '100%', height: '100%' },
  dkd_restaurant_product_image_fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dkd_restaurant_product_price_badge: { position: 'absolute', right: 7, bottom: 7, maxWidth: '86%', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.86)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.32)' },
  dkd_restaurant_product_price_text: { color: '#FDE68A', fontSize: 10, fontWeight: '900' },
  dkd_restaurant_product_price_highlight: { marginTop: 6, minHeight: 34, borderRadius: 15, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FDE68A', borderWidth: 1, borderColor: 'rgba(251,146,60,0.72)', shadowColor: '#FDE68A', shadowOpacity: 0.28, shadowRadius: 12, elevation: 4 },
  dkd_restaurant_product_price_highlight_text: { color: '#431407', fontSize: 12, fontWeight: '900' },
  dkd_restaurant_product_title: { color: '#F8FAFC', fontSize: 13.5, lineHeight: 17, fontWeight: '900' },
  dkd_restaurant_product_desc: { color: 'rgba(226,242,255,0.70)', fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: 4 },
  dkd_restaurant_product_meta_row: { gap: 4, marginTop: 8 },
  dkd_restaurant_product_meta_text: { color: '#FDBA74', fontSize: 10.5, fontWeight: '850' },
  dkd_restaurant_product_cta: { marginTop: 8, minHeight: 34, borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FED7AA' },
  dkd_restaurant_product_cta_text: { color: '#07131C', fontSize: 11, fontWeight: '900' },

  dkd_restaurant_detail_overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.86)', justifyContent: 'center', padding: 14 },
  dkd_restaurant_detail_shell: { maxHeight: '92%', borderRadius: 30, padding: 14, backgroundColor: '#07111F', borderWidth: 1, borderColor: 'rgba(253,186,116,0.26)' },
  dkd_restaurant_detail_header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  dkd_restaurant_detail_header_copy: { flex: 1 },
  dkd_restaurant_detail_kicker: { color: '#FDBA74', fontSize: 10.5, fontWeight: '900', letterSpacing: 1.1 },
  dkd_restaurant_detail_title: { color: '#FFFFFF', fontSize: 21, lineHeight: 25, fontWeight: '900', marginTop: 3 },
  dkd_restaurant_detail_close_button: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_restaurant_detail_image_shell: { minHeight: 248, maxHeight: 300, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(15,23,42,0.92)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.22)' },
  dkd_restaurant_detail_image: { width: '100%', height: '100%' },
  dkd_restaurant_detail_image_fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  dkd_restaurant_detail_image_fallback_text: { color: '#FFF7ED', fontSize: 12, lineHeight: 17, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  dkd_restaurant_detail_price_badge: { position: 'absolute', left: 12, right: 12, bottom: 12, minHeight: 44, borderRadius: 17, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FDE68A', borderWidth: 1, borderColor: '#FDBA74', shadowColor: '#FDE68A', shadowOpacity: 0.32, shadowRadius: 18, elevation: 6 },
  dkd_restaurant_detail_price_text: { color: '#431407', fontSize: 17, fontWeight: '900' },
  dkd_restaurant_detail_info_card: { marginTop: 12, borderRadius: 23, padding: 13, backgroundColor: 'rgba(15,23,42,0.92)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.20)' },
  dkd_restaurant_detail_business: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  dkd_restaurant_detail_meta: { color: '#FDBA74', fontSize: 11.5, fontWeight: '900', marginTop: 3 },
  dkd_restaurant_detail_desc: { color: 'rgba(248,250,252,0.82)', fontSize: 12.5, lineHeight: 18, fontWeight: '750', marginTop: 9 },
  dkd_restaurant_detail_line_row: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 10 },
  dkd_restaurant_detail_line_text: { flex: 1, color: 'rgba(226,242,255,0.74)', fontSize: 11.5, lineHeight: 16, fontWeight: '800' },
  dkd_restaurant_detail_order_button: { marginTop: 12, borderRadius: 19, overflow: 'hidden' },
  dkd_restaurant_detail_order_gradient: { minHeight: 49, borderRadius: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dkd_restaurant_detail_order_text: { color: '#431407', fontSize: 13, fontWeight: '900' },

  dkd_restaurant_payment_overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.88)', justifyContent: 'center', padding: 14 },
  dkd_restaurant_payment_card: { borderRadius: 30, padding: 15, backgroundColor: '#07111F', borderWidth: 1, borderColor: 'rgba(253,186,116,0.28)', shadowColor: '#FB923C', shadowOpacity: 0.20, shadowRadius: 24, elevation: 10 },
  dkd_restaurant_payment_header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  dkd_restaurant_payment_icon_wrap: { width: 46, height: 46, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(251,146,60,0.16)', borderWidth: 1, borderColor: 'rgba(253,186,116,0.28)' },
  dkd_restaurant_payment_header_copy: { flex: 1 },
  dkd_restaurant_payment_title: { color: '#FFFFFF', fontSize: 20, lineHeight: 24, fontWeight: '900' },
  dkd_restaurant_payment_sub: { color: 'rgba(255,247,237,0.74)', fontSize: 12, lineHeight: 17, fontWeight: '750', marginTop: 4 },
  dkd_restaurant_payment_route_card: { borderRadius: 22, padding: 13, backgroundColor: 'rgba(124,45,18,0.28)', borderWidth: 1, borderColor: 'rgba(253,186,116,0.20)', gap: 6 },
  dkd_restaurant_payment_route_line: { color: '#FFF7ED', fontSize: 12.5, lineHeight: 17, fontWeight: '900' },
  dkd_restaurant_payment_route_meta: { color: 'rgba(254,215,170,0.76)', fontSize: 11.5, lineHeight: 16, fontWeight: '750' },
  dkd_restaurant_payment_stat_card: { marginTop: 12, borderRadius: 22, padding: 13, backgroundColor: 'rgba(15,23,42,0.94)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.20)' },
  dkd_restaurant_payment_stat_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 7 },
  dkd_restaurant_payment_stat_total_row: { marginTop: 4, paddingTop: 11, borderTopWidth: 1, borderTopColor: 'rgba(253,186,116,0.18)' },
  dkd_restaurant_payment_stat_label: { color: 'rgba(226,242,255,0.70)', fontSize: 12, fontWeight: '800' },
  dkd_restaurant_payment_stat_value: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  dkd_restaurant_payment_stat_total_label: { color: '#FDE68A', fontSize: 13, fontWeight: '900' },
  dkd_restaurant_payment_stat_total_value: { color: '#FDE68A', fontSize: 18, fontWeight: '950' },
  dkd_restaurant_payment_wallet_card: { marginTop: 12, borderRadius: 21, padding: 13, backgroundColor: 'rgba(6,78,59,0.24)', borderWidth: 1, borderColor: 'rgba(167,243,208,0.22)' },
  dkd_restaurant_payment_wallet_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 5 },
  dkd_restaurant_payment_wallet_label: { color: 'rgba(209,250,229,0.72)', fontSize: 12, fontWeight: '850' },
  dkd_restaurant_payment_wallet_value: { color: '#D1FAE5', fontSize: 13, fontWeight: '950' },
  dkd_restaurant_payment_action_row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13 },
  dkd_restaurant_payment_ghost_button: { flex: 1, minHeight: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_restaurant_payment_ghost_button_text: { color: '#E2E8F0', fontSize: 12.5, fontWeight: '900' },
  dkd_restaurant_payment_primary_button: { flex: 1.35, minHeight: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE68A', borderWidth: 1, borderColor: '#FDBA74' },
  dkd_restaurant_payment_primary_button_text: { color: '#431407', fontSize: 12.5, fontWeight: '950' },
  dkd_restaurant_payment_button_disabled: { opacity: 0.54 },

  dkd_admin_note_card: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginTop: 6, padding: 13, borderRadius: 18, backgroundColor: 'rgba(20,83,45,0.20)', borderWidth: 1, borderColor: 'rgba(167,243,208,0.20)' },
  dkd_admin_note_text: { flex: 1, color: '#D1FAE5', fontSize: 12, lineHeight: 17, fontWeight: '800' },
});

export default DkdServiceNetworkModal;
