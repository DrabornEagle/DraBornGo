import React from 'react';
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dkd_styles_value from './dkd_courier_styles';
import { dkd_delete_url_value, dkd_palette_value, dkd_privacy_url_value } from './dkd_courier_theme';
import { dkd_modal_head_value, dkd_panel_title_value } from './dkd_courier_ui';
const dkd_e_value = React.createElement;

function dkd_policy_modal_value({ dkd_visible_value, dkd_on_close_value }) {
  const dkd_rows_value = [
    ['shield-checkmark-outline', 'DraBornGo v0.0.6', 'Expo Go 57 test kanalında çalışır. Bu aşamada APK veya AAB üretilmez.', dkd_palette_value.dkd_purple_value],
    ['location-outline', 'Konum yaklaşımı', 'Konum yalnızca kurye çevrimiçi modunu sen başlattığında ve uygulama görünürken istenir.', dkd_palette_value.dkd_cyan_value],
    ['trash-outline', 'Hesap silme', 'Profil içinden hesap ve ilişkili veri silme talebi başlatabilir, ayrıca web kaynağına erişebilirsin.', dkd_palette_value.dkd_pink_value],
  ];
  return dkd_e_value(Modal, { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value }, dkd_e_value(View, { style: dkd_styles_value.dkd_modal_root_value }, dkd_modal_head_value('Gizlilik ve Güvenlik', 'İzinler, veri kontrolü ve hesap', dkd_on_close_value, dkd_palette_value.dkd_purple_value, 'shield-checkmark-outline'), dkd_e_value(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_modal_content_value }, dkd_rows_value.map((dkd_row_value) => dkd_e_value(View, { key: dkd_row_value[1], style: dkd_styles_value.dkd_simple_card_value }, dkd_panel_title_value(dkd_row_value[0], dkd_row_value[1], dkd_row_value[3]), dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, dkd_row_value[2]))), dkd_e_value(Pressable, { onPress: () => Linking.openURL(dkd_privacy_url_value), style: dkd_styles_value.dkd_outline_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_outline_text_value }, 'GİZLİLİK POLİTİKASINI AÇ')), dkd_e_value(Pressable, { onPress: () => Linking.openURL(dkd_delete_url_value), style: dkd_styles_value.dkd_outline_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_outline_text_value }, 'WEB HESAP SİLME KAYNAĞINI AÇ'))))));
}

function dkd_help_modal_value({ dkd_visible_value, dkd_on_close_value, dkd_on_open_chat_value }) {
  const dkd_help_rows_value = [
    ['speedometer-outline', 'Kurye modu açılmıyor', 'Kurye hesabının onaylı olduğundan ve uygulama açıkken konum izni verdiğinden emin ol.'],
    ['cube-outline', 'Teslimat görünmüyor', 'Kurye Operasyon Merkezi ekranını aşağı çekerek yenile.'],
    ['storefront-outline', 'İşletme görünmüyor', 'Hizmet Ağı yalnızca aktif işletmeleri gösterir.'],
  ];
  return dkd_e_value(Modal, { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value }, dkd_e_value(View, { style: dkd_styles_value.dkd_modal_root_value }, dkd_modal_head_value('Destek Paneli', 'Hızlı yardım ve ekip sohbeti', dkd_on_close_value, dkd_palette_value.dkd_blue_value, 'headset-outline'), dkd_e_value(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_modal_content_value }, dkd_e_value(LinearGradient, { colors: ['#10284A', '#0B1B34', '#07101A'], style: dkd_styles_value.dkd_support_hero_value }, dkd_e_value(Ionicons, { name: 'headset-outline', size: 42, color: dkd_palette_value.dkd_blue_value }), dkd_e_value(Text, { style: dkd_styles_value.dkd_support_title_value }, 'Yardım merkezi hazır'), dkd_e_value(Text, { style: dkd_styles_value.dkd_support_body_value }, 'Operasyon akışında takıldığın noktaları hızlıca kontrol et.')), dkd_help_rows_value.map((dkd_row_value) => dkd_e_value(View, { key: dkd_row_value[1], style: dkd_styles_value.dkd_simple_card_value }, dkd_panel_title_value(dkd_row_value[0], dkd_row_value[1], dkd_palette_value.dkd_blue_value), dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, dkd_row_value[2]))), dkd_e_value(Pressable, { onPress: dkd_on_open_chat_value, style: [dkd_styles_value.dkd_primary_value, { backgroundColor: dkd_palette_value.dkd_blue_value }] }, dkd_e_value(Text, { style: dkd_styles_value.dkd_primary_text_value }, 'EKİP SOHBETİNİ AÇ'))))));
}

export { dkd_policy_modal_value, dkd_help_modal_value };
