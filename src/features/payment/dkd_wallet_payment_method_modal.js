import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { dkd_analyze_bank_receipt_image_value } from '../../services/dkd_bank_receipt_ocr_service';
import { dkd_create_bank_transfer_wallet_topup_value } from '../../services/dkd_wallet_topup_service';
import { dkd_render_support_panel_modal } from '../support/dkd_support_panel_conversation';
import { dkd_payments_enabled_value } from '../../config/dkd_release_flags';
import DkdPaymentsClosedModal from './dkd_payments_closed_modal';

const dkd_wallet_topup_amount_values = [100, 250, 500, 1000];
const dkd_bank_transfer_iban_value = 'TR53 0011 1000 0000 0151 1527 14';
const dkd_bank_transfer_receiver_name_value = 'Doğancan Kartal';

const dkd_wallet_payment_method_values = [
  {
    dkd_key_value: 'dkd_bank_transfer_fast',
    dkd_title_value: 'Banka Havalesi / EFT / FAST ile Öde',
    dkd_short_value: 'IBAN + dekont kontrolü',
    dkd_desc_value: 'Kullanıcı TL tutarını seçer, açıklama koduyla havale yapar; dekont onayından sonra bakiye yalnızca fiziksel hizmet ve sipariş cüzdanına işlenir.',
    dkd_icon_value: 'bank-transfer',
    dkd_badge_value: 'Banka',
    dkd_step_values: ['Tutar seç', 'Açıklama kodunu yaz', 'Dekont onayı bekle'],
    dkd_gradient_value: ['rgba(14,165,233,0.94)', 'rgba(30,64,175,0.92)', 'rgba(15,23,42,0.98)'],
    dkd_glow_value: 'rgba(125,211,252,0.35)',
  },
  {
    dkd_key_value: 'dkd_gift_coupon_code',
    dkd_title_value: 'Hediye Kartı / Kupon kodu',
    dkd_short_value: 'Kod gir, hizmet bakiyesi kazan',
    dkd_desc_value: 'Hediye kartı veya kupon kodu geçerliyse ilgili TL değeri yalnızca fiziksel hizmet/sipariş bakiyesi olarak eklenir; puan, koleksiyon veya oyun içi avantaj satışı değildir.',
    dkd_icon_value: 'gift-outline',
    dkd_badge_value: 'Hediye',
    dkd_step_values: ['Kodu yaz', 'Geçerlilik kontrolü', 'Hizmet bakiyesi'],
    dkd_gradient_value: ['rgba(236,72,153,0.90)', 'rgba(124,58,237,0.92)', 'rgba(15,23,42,0.98)'],
    dkd_glow_value: 'rgba(244,114,182,0.34)',
  },
  {
    dkd_key_value: 'dkd_promo_code',
    dkd_title_value: 'Promosyon Kodu ile Kazan',
    dkd_short_value: 'Kampanya bakiyesi',
    dkd_desc_value: 'Marka, bölge veya etkinlik kampanya kodlarıyla yalnızca fiziksel hizmet/sipariş indirimi ya da promosyon bakiyesi kazanılır; dijital ürün satışı değildir.',
    dkd_icon_value: 'ticket-percent-outline',
    dkd_badge_value: 'Promo',
    dkd_step_values: ['Promosyon kodu', 'Kampanya eşleşmesi'],
    dkd_gradient_value: ['rgba(245,158,11,0.94)', 'rgba(234,88,12,0.92)', 'rgba(15,23,42,0.98)'],
    dkd_glow_value: 'rgba(253,230,138,0.35)',
  },
  {
    dkd_key_value: 'dkd_cash_on_delivery',
    dkd_title_value: 'Kapıda Öde',
    dkd_short_value: 'Kurye POS / nakit',
    dkd_desc_value: 'Uygun siparişlerde ödeme teslimatta alınır; cüzdan yükleme yerine sipariş ödeme yöntemi olarak işaretlenir.',
    dkd_icon_value: 'cash-marker',
    dkd_badge_value: 'Kapıda',
    dkd_step_values: ['Teslimat seç', 'Kurye onayı', 'Kapıda tahsilat'],
    dkd_gradient_value: ['rgba(168,85,247,0.90)', 'rgba(79,70,229,0.90)', 'rgba(15,23,42,0.98)'],
    dkd_glow_value: 'rgba(196,181,253,0.34)',
  },
  {
    dkd_key_value: 'dkd_card_payment',
    dkd_title_value: 'Kredi/Banka Kartı ile Öde',
    dkd_short_value: 'Çok yakında aktif olacak',
    dkd_desc_value: 'Kart ile yalnızca fiziksel hizmet/sipariş bakiyesi yükleme altyapısı tamamlandığında açılacak; şimdilik kilitli ödeme yöntemi olarak listelenir.',
    dkd_icon_value: 'credit-card-check-outline',
    dkd_badge_value: 'Kart',
    dkd_step_values: ['Kart bilgisi', '3D doğrulama', 'Hizmet bakiyesi'],
    dkd_gradient_value: ['rgba(34,197,94,0.72)', 'rgba(20,184,166,0.72)', 'rgba(15,23,42,0.98)'],
    dkd_glow_value: 'rgba(134,239,172,0.22)',
    dkd_locked_value: true,
  },
  {
    dkd_key_value: 'dkd_papara_payment',
    dkd_title_value: 'Papara ile Öde',
    dkd_short_value: 'Çok yakında aktif olacak',
    dkd_desc_value: 'Papara ile yalnızca fiziksel hizmet/sipariş bakiyesi yükleme entegrasyonu tamamlandığında açılacak; şimdilik kilitli ödeme yöntemi olarak listelenir.',
    dkd_icon_value: 'cellphone-check',
    dkd_badge_value: 'Papara',
    dkd_step_values: ['Papara seç', 'Onayla', 'Hizmet bakiyesi'],
    dkd_gradient_value: ['rgba(59,130,246,0.72)', 'rgba(6,182,212,0.70)', 'rgba(15,23,42,0.98)'],
    dkd_glow_value: 'rgba(96,165,250,0.22)',
    dkd_locked_value: true,
  },
];

function dkd_wallet_money_text_value(dkd_input_value) {
  const dkd_number_value = Number(dkd_input_value || 0);
  const dkd_safe_number_value = Number.isFinite(dkd_number_value) ? Math.max(0, Math.round(dkd_number_value * 100) / 100) : 0;
  return `${dkd_safe_number_value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

function dkd_bank_transfer_normalized_text_value(dkd_input_text_value) {
  return String(dkd_input_text_value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function dkd_bank_transfer_digits_text_value(dkd_input_text_value) {
  return String(dkd_input_text_value || '').replace(/[^0-9]/g, '');
}

function dkd_bank_transfer_amount_digit_variant_values(dkd_amount_value) {
  const dkd_amount_number_value = Number(dkd_amount_value || 0);
  if (!Number.isFinite(dkd_amount_number_value) || dkd_amount_number_value <= 0) return [];
  const dkd_rounded_amount_value = Math.round(dkd_amount_number_value * 100) / 100;
  const dkd_integer_amount_value = Math.round(dkd_rounded_amount_value);
  return Array.from(new Set([
    dkd_bank_transfer_digits_text_value(dkd_rounded_amount_value.toFixed(2)),
    dkd_bank_transfer_digits_text_value(dkd_rounded_amount_value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
    dkd_bank_transfer_digits_text_value(String(dkd_integer_amount_value)),
  ].filter(Boolean)));
}

function dkd_bank_transfer_amount_match_value(dkd_amount_value, dkd_receipt_text_value) {
  const dkd_amount_number_value = Number(dkd_amount_value || 0);
  if (!Number.isFinite(dkd_amount_number_value) || dkd_amount_number_value <= 0) return false;
  const dkd_rounded_amount_value = Math.round(dkd_amount_number_value * 100) / 100;
  const dkd_integer_amount_value = Math.round(dkd_rounded_amount_value);
  const dkd_receipt_text_value_safe = String(dkd_receipt_text_value || '').toLocaleLowerCase('tr-TR');
  const dkd_receipt_compact_digits_value = dkd_bank_transfer_digits_text_value(dkd_receipt_text_value);
  const dkd_amount_context_pattern_value = new RegExp(`(^|[^0-9])${dkd_integer_amount_value}([,.]00)?\\s*(tl|try|₺|turk|türk)`, 'i');
  const dkd_amount_prefix_pattern_value = new RegExp(`(tl|try|₺)\\s*${dkd_integer_amount_value}([,.]00)?([^0-9]|$)`, 'i');
  const dkd_amount_label_pattern_value = new RegExp(`(tutar|miktar|odeme|ödeme|islem|işlem|toplam)[^0-9]{0,24}${dkd_integer_amount_value}([,.]00)?`, 'i');
  if (
    dkd_amount_context_pattern_value.test(dkd_receipt_text_value_safe)
    || dkd_amount_prefix_pattern_value.test(dkd_receipt_text_value_safe)
    || dkd_amount_label_pattern_value.test(dkd_receipt_text_value_safe)
  ) {
    return true;
  }
  return dkd_bank_transfer_amount_digit_variant_values(dkd_rounded_amount_value)
    .filter((dkd_amount_digit_value) => dkd_amount_digit_value.length >= 4)
    .some((dkd_amount_digit_value) => dkd_receipt_compact_digits_value.includes(dkd_amount_digit_value));
}


function dkd_bank_transfer_receipt_match_value(dkd_full_name_text_value, dkd_amount_value, dkd_receipt_text_value) {
  const dkd_normalized_receipt_text_value = dkd_bank_transfer_normalized_text_value(dkd_receipt_text_value);
  const dkd_sender_name_part_values = String(dkd_full_name_text_value || '')
    .split(/\s+/)
    .map((dkd_name_part_value) => dkd_bank_transfer_normalized_text_value(dkd_name_part_value))
    .filter((dkd_name_part_value) => dkd_name_part_value.length >= 2);
  const dkd_name_match_value = dkd_sender_name_part_values.length >= 2 && dkd_sender_name_part_values.every((dkd_name_part_value) => dkd_normalized_receipt_text_value.includes(dkd_name_part_value));
  const dkd_amount_match_value = dkd_bank_transfer_amount_match_value(dkd_amount_value, dkd_receipt_text_value);
  const dkd_description_match_value = dkd_normalized_receipt_text_value.includes('draborngo');
  return {
    dkd_name_match_value,
    dkd_amount_match_value,
    dkd_description_match_value,
    dkd_complete_value: Boolean(dkd_name_match_value && dkd_amount_match_value && dkd_description_match_value),
  };
}

function dkd_wallet_method_code_needed_value(dkd_method_key_value) {
  return dkd_method_key_value === 'dkd_gift_coupon_code' || dkd_method_key_value === 'dkd_promo_code';
}

function DkdBankTransferCopyCard({ dkd_icon_name_value, dkd_label_value, dkd_value_text_value, dkd_on_copy_value }) {
  return (
    <View style={dkd_styles.dkd_bank_copy_card}>
      <View style={dkd_styles.dkd_bank_copy_icon_shell}>
        <MaterialCommunityIcons name={dkd_icon_name_value} size={21} color="#07131C" />
      </View>
      <View style={dkd_styles.dkd_bank_copy_text_wrap}>
        <Text style={dkd_styles.dkd_bank_copy_label}>{dkd_label_value}</Text>
        <Text selectable style={dkd_styles.dkd_bank_copy_value}>{dkd_value_text_value}</Text>
      </View>
      <Pressable onPress={() => dkd_on_copy_value(dkd_value_text_value, dkd_label_value)} style={dkd_styles.dkd_bank_copy_button}>
        <MaterialCommunityIcons name="content-copy" size={16} color="#07131C" />
        <Text style={dkd_styles.dkd_bank_copy_button_text}>Kopyala</Text>
      </Pressable>
    </View>
  );
}

function DkdBankTransferFormInput({ dkd_icon_name_value, dkd_label_value, dkd_placeholder_value, dkd_value_text_value, dkd_on_change_text_value, dkd_keyboard_type_value = 'default', dkd_max_length_value, dkd_multiline_value = false, dkd_editable_value = true }) {
  return (
    <View style={dkd_styles.dkd_bank_form_input_shell}>
      <View style={dkd_styles.dkd_bank_form_label_row}>
        <MaterialCommunityIcons name={dkd_icon_name_value} size={17} color="#BAE6FD" />
        <Text style={dkd_styles.dkd_bank_form_label}>{dkd_label_value}</Text>
      </View>
      <TextInput
        value={dkd_value_text_value}
        onChangeText={dkd_on_change_text_value}
        placeholder={dkd_placeholder_value}
        placeholderTextColor="rgba(226,242,255,0.40)"
        keyboardType={dkd_keyboard_type_value}
        maxLength={dkd_max_length_value}
        multiline={dkd_multiline_value}
        editable={dkd_editable_value}
        textAlignVertical={dkd_multiline_value ? 'top' : 'center'}
        style={[dkd_styles.dkd_bank_form_input, dkd_multiline_value && dkd_styles.dkd_bank_form_input_multiline, !dkd_editable_value && dkd_styles.dkd_bank_form_input_readonly]}
      />
    </View>
  );
}

function DkdBankTransferMatchChip({ dkd_label_value, dkd_active_value }) {
  return (
    <View style={[dkd_styles.dkd_bank_match_chip, dkd_active_value && dkd_styles.dkd_bank_match_chip_active]}>
      <MaterialCommunityIcons name={dkd_active_value ? 'check-decagram' : 'clock-outline'} size={dkd_active_value ? 16 : 14} color={dkd_active_value ? '#064E3B' : '#FDE68A'} />
      <Text style={[dkd_styles.dkd_bank_match_chip_text, dkd_active_value && dkd_styles.dkd_bank_match_chip_text_active]}>{dkd_label_value}</Text>
    </View>
  );
}

function DkdBankTransferPage({
  dkd_amount_text_value,
  dkd_topup_amount_value,
  dkd_full_name_text_value,
  dkd_set_full_name_text_value,
  dkd_phone_text_value,
  dkd_set_phone_text_value,
  dkd_receipt_image_uri_value,
  dkd_receipt_text_value,
  dkd_set_receipt_text_value,
  dkd_receipt_match_value,
  dkd_payment_reported_value,
  dkd_receipt_ocr_status_value,
  dkd_receipt_ocr_message_value,
  dkd_receipt_analysis_busy_value,
  dkd_on_pick_receipt_value,
  dkd_on_analyze_receipt_value,
  dkd_on_paid_value,
  dkd_on_back_value,
  dkd_on_copy_value,
  dkd_on_open_support_value,
  dkd_animation_value,
}) {
  const dkd_receipt_status_scale_value = dkd_animation_value?.interpolate
    ? dkd_animation_value.interpolate({ inputRange: [0, 1], outputRange: [1, dkd_receipt_ocr_status_value === 'dkd_reading' ? 1.024 : 1.006] })
    : 1;
  const dkd_receipt_status_lift_value = dkd_animation_value?.interpolate
    ? dkd_animation_value.interpolate({ inputRange: [0, 1], outputRange: [0, dkd_receipt_ocr_status_value === 'dkd_reading' ? -4 : 0] })
    : 0;
  const dkd_receipt_status_bar_shift_value = dkd_animation_value?.interpolate
    ? dkd_animation_value.interpolate({ inputRange: [0, 1], outputRange: [-82, 128] })
    : 0;
  const dkd_support_button_scale_value = dkd_animation_value?.interpolate
    ? dkd_animation_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.028] })
    : 1;
  const dkd_support_button_lift_value = dkd_animation_value?.interpolate
    ? dkd_animation_value.interpolate({ inputRange: [0, 1], outputRange: [0, -2] })
    : 0;
  const dkd_support_sheen_shift_value = dkd_animation_value?.interpolate
    ? dkd_animation_value.interpolate({ inputRange: [0, 1], outputRange: [-84, 136] })
    : 0;
  const dkd_support_arrow_shift_value = dkd_animation_value?.interpolate
    ? dkd_animation_value.interpolate({ inputRange: [0, 1], outputRange: [0, 4] })
    : 0;
  return (
    <View style={dkd_styles.dkd_bank_page_stack}>
      <Pressable onPress={dkd_on_back_value} style={dkd_styles.dkd_bank_back_button}>
        <MaterialCommunityIcons name="arrow-left" size={18} color="#07131C" />
        <Text style={dkd_styles.dkd_bank_back_text}>Ödeme yöntemlerine dön</Text>
      </Pressable>

      <LinearGradient colors={['rgba(14,165,233,0.98)', 'rgba(30,64,175,0.94)', 'rgba(15,23,42,0.98)']} style={dkd_styles.dkd_bank_hero_card}>
        <View pointerEvents="none" style={dkd_styles.dkd_bank_hero_orb} />
        <View style={dkd_styles.dkd_bank_hero_header}>
          <View style={dkd_styles.dkd_bank_hero_icon_shell}>
            <MaterialCommunityIcons name="bank-transfer" size={32} color="#07131C" />
          </View>
          <View style={dkd_styles.dkd_bank_hero_copy}>
            <Text style={dkd_styles.dkd_bank_hero_kicker}>BANKA HAVALESİ / EFT / FAST</Text>
            <Text style={dkd_styles.dkd_bank_hero_title}>Cüzdana TL Yükle</Text>
            <Text style={dkd_styles.dkd_bank_hero_desc}>Açıklama alanına mutlaka DraBornGo yaz, dekontunu yükle ve gönderici bilgilerinle hızlı eşleşme kontrolünü tamamla.</Text>
          </View>
        </View>
        <View style={dkd_styles.dkd_bank_hero_action_row}>
          <View style={dkd_styles.dkd_bank_amount_pill}>
            <Text style={dkd_styles.dkd_bank_amount_label}>Yüklenecek Tutar</Text>
            <Text style={dkd_styles.dkd_bank_amount_text}>{dkd_amount_text_value}</Text>
          </View>
          <Animated.View style={[dkd_styles.dkd_bank_support_mini_wrap, { transform: [{ scale: dkd_support_button_scale_value }, { translateY: dkd_support_button_lift_value }] }]}>
            <Pressable onPress={dkd_on_open_support_value} style={dkd_styles.dkd_bank_support_mini_button}>
              <LinearGradient colors={['rgba(34,211,238,0.98)', 'rgba(99,102,241,0.98)', 'rgba(244,114,182,0.94)']} style={StyleSheet.absoluteFill} />
              <Animated.View pointerEvents="none" style={[dkd_styles.dkd_bank_support_mini_sheen, { transform: [{ translateX: dkd_support_sheen_shift_value }, { rotate: '18deg' }] }]} />
              <View style={dkd_styles.dkd_bank_support_icon_shell}>
                <MaterialCommunityIcons name="headset" size={18} color="#07131C" />
                <View style={dkd_styles.dkd_bank_support_online_dot} />
              </View>
              <View style={dkd_styles.dkd_bank_support_mini_copy}>
                <Text style={dkd_styles.dkd_bank_support_mini_text} numberOfLines={1}>Destek</Text>
              </View>
              <Animated.View style={[dkd_styles.dkd_bank_support_arrow_shell, { transform: [{ translateX: dkd_support_arrow_shift_value }] }]}>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#07131C" />
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>

      <LinearGradient colors={['rgba(253,230,138,0.20)', 'rgba(125,211,252,0.12)', 'rgba(15,23,42,0.92)']} style={dkd_styles.dkd_bank_info_card}>
        <View style={dkd_styles.dkd_bank_section_header}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={19} color="#FDE68A" />
          <Text style={dkd_styles.dkd_bank_section_title}>ÖDEME YAPILACAK BANKA BİLGİLERİ</Text>
        </View>
        <DkdBankTransferCopyCard
          dkd_icon_name_value="bank-transfer"
          dkd_label_value="IBAN"
          dkd_value_text_value={dkd_bank_transfer_iban_value}
          dkd_on_copy_value={dkd_on_copy_value}
        />
        <DkdBankTransferCopyCard
          dkd_icon_name_value="account-outline"
          dkd_label_value="Ad Soyad / Alıcı"
          dkd_value_text_value={dkd_bank_transfer_receiver_name_value}
          dkd_on_copy_value={dkd_on_copy_value}
        />
      </LinearGradient>

      <LinearGradient colors={['rgba(30,41,59,0.92)', 'rgba(15,23,42,0.95)']} style={dkd_styles.dkd_bank_form_card}>
        <View style={dkd_styles.dkd_bank_section_header}>
          <MaterialCommunityIcons name="card-account-details-outline" size={19} color="#7DD3FC" />
          <Text style={dkd_styles.dkd_bank_section_title}>Gönderici Bilgileri</Text>
        </View>
        <Text style={dkd_styles.dkd_bank_form_note}>Dekont üzerindeki ad soyad, ödeme miktarı ve DraBornGo açıklaması bu bilgilerle karşılaştırılır.</Text>
        <DkdBankTransferFormInput
          dkd_icon_name_value="account-outline"
          dkd_label_value="Göndericinin Adı Soyadı"
          dkd_placeholder_value="Göndericinin adı soyadı"
          dkd_value_text_value={dkd_full_name_text_value}
          dkd_on_change_text_value={dkd_set_full_name_text_value}
        />
        <DkdBankTransferFormInput
          dkd_icon_name_value="phone-outline"
          dkd_label_value="Telefon Numarası"
          dkd_placeholder_value="Örn. 05xx xxx xx xx"
          dkd_value_text_value={dkd_phone_text_value}
          dkd_on_change_text_value={dkd_set_phone_text_value}
          dkd_keyboard_type_value="phone-pad"
        />
      </LinearGradient>

      <LinearGradient colors={['rgba(34,211,238,0.18)', 'rgba(124,58,237,0.14)', 'rgba(15,23,42,0.95)']} style={dkd_styles.dkd_bank_receipt_card}>
        <View style={dkd_styles.dkd_bank_section_header}>
          <MaterialCommunityIcons name="file-image-plus-outline" size={19} color="#A7F3D0" />
          <Text style={dkd_styles.dkd_bank_section_title}>Dekont Belge Yükleme</Text>
        </View>
        <Text style={dkd_styles.dkd_bank_form_note}>Dekont görselini ekle. Dekontta göndericinin adı soyadı, ödeme miktarı ve DraBornGo açıklaması var mı kontrol eder.</Text>

        <Pressable onPress={dkd_on_pick_receipt_value} style={dkd_styles.dkd_bank_receipt_upload_button}>
          <LinearGradient colors={['#7DD3FC', '#A7F3D0', '#FDE68A']} style={StyleSheet.absoluteFill} />
          <MaterialCommunityIcons name={dkd_receipt_image_uri_value ? 'image-check-outline' : 'image-plus'} size={22} color="#07131C" />
          <Text style={dkd_styles.dkd_bank_receipt_upload_text}>{dkd_receipt_image_uri_value ? 'Dekont Değiştir' : 'Dekont Görseli Yükle'}</Text>
        </Pressable>

        {dkd_receipt_image_uri_value ? (
          <View style={dkd_styles.dkd_bank_receipt_preview_shell}>
            <Image source={{ uri: dkd_receipt_image_uri_value }} style={dkd_styles.dkd_bank_receipt_preview_image} />
            <View style={dkd_styles.dkd_bank_receipt_preview_badge}>
              <MaterialCommunityIcons name="check-decagram" size={15} color="#064E3B" />
              <Text style={dkd_styles.dkd_bank_receipt_preview_badge_text}>Dekont yüklendi</Text>
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={dkd_on_analyze_receipt_value}
          disabled={!dkd_receipt_image_uri_value || dkd_receipt_analysis_busy_value}
          style={[dkd_styles.dkd_bank_analyze_button, (!dkd_receipt_image_uri_value || dkd_receipt_analysis_busy_value) && dkd_styles.dkd_bank_analyze_button_disabled]}
        >
          <LinearGradient colors={dkd_receipt_analysis_busy_value ? ['#CBD5E1', '#94A3B8'] : ['#A7F3D0', '#7DD3FC', '#FDE68A']} style={StyleSheet.absoluteFill} />
          <MaterialCommunityIcons name={dkd_receipt_analysis_busy_value ? 'progress-clock' : 'text-box-search-outline'} size={19} color="#07131C" />
          <Text style={dkd_styles.dkd_bank_receipt_upload_text}>{dkd_receipt_analysis_busy_value ? 'Dekont okunuyor...' : 'Dekontu Oku ve Analiz Et'}</Text>
        </Pressable>

        <Animated.View style={{ transform: [{ scale: dkd_receipt_status_scale_value }, { translateY: dkd_receipt_status_lift_value }] }}>
          <LinearGradient
            colors={dkd_receipt_ocr_status_value === 'dkd_ready' ? ['rgba(52,211,153,0.96)', 'rgba(125,211,252,0.90)', 'rgba(253,230,138,0.88)'] : dkd_receipt_ocr_status_value === 'dkd_failed' ? ['rgba(127,29,29,0.84)', 'rgba(244,63,94,0.36)', 'rgba(15,23,42,0.96)'] : dkd_receipt_ocr_status_value === 'dkd_reading' ? ['rgba(34,211,238,0.94)', 'rgba(59,130,246,0.78)', 'rgba(124,58,237,0.70)', 'rgba(15,23,42,0.98)'] : ['rgba(30,41,59,0.90)', 'rgba(14,165,233,0.24)', 'rgba(15,23,42,0.96)']}
            style={[
              dkd_styles.dkd_bank_ocr_status_card,
              dkd_receipt_ocr_status_value === 'dkd_ready' && dkd_styles.dkd_bank_ocr_status_card_done,
              dkd_receipt_ocr_status_value === 'dkd_failed' && dkd_styles.dkd_bank_ocr_status_card_error,
              dkd_receipt_ocr_status_value === 'dkd_reading' && dkd_styles.dkd_bank_ocr_status_card_reading,
            ]}
          >
            <View style={[
              dkd_styles.dkd_bank_ocr_icon_shell,
              dkd_receipt_ocr_status_value === 'dkd_ready' && dkd_styles.dkd_bank_ocr_icon_shell_done,
              dkd_receipt_ocr_status_value === 'dkd_failed' && dkd_styles.dkd_bank_ocr_icon_shell_error,
              dkd_receipt_ocr_status_value === 'dkd_reading' && dkd_styles.dkd_bank_ocr_icon_shell_reading,
            ]}>
              <MaterialCommunityIcons
                name={dkd_receipt_ocr_status_value === 'dkd_ready' ? 'check-decagram' : dkd_receipt_ocr_status_value === 'dkd_failed' ? 'alert-circle-outline' : dkd_receipt_ocr_status_value === 'dkd_reading' ? 'radar' : 'text-box-search-outline'}
                size={dkd_receipt_ocr_status_value === 'dkd_reading' ? 24 : 22}
                color={dkd_receipt_ocr_status_value === 'dkd_ready' ? '#064E3B' : dkd_receipt_ocr_status_value === 'dkd_failed' ? '#FEE2E2' : '#07131C'}
              />
            </View>
            <View style={dkd_styles.dkd_bank_ocr_status_copy}>
              <Text style={[dkd_styles.dkd_bank_ocr_status_title, dkd_receipt_ocr_status_value === 'dkd_ready' && dkd_styles.dkd_bank_ocr_status_title_done]}>{dkd_receipt_ocr_status_value === 'dkd_ready' ? 'Dekont analizi tamamlandı' : dkd_receipt_ocr_status_value === 'dkd_failed' ? 'Dekont Analizini tekrar Dene' : dkd_receipt_ocr_status_value === 'dkd_reading' ? 'Dekont görseli okunuyor' : 'Dekont Analizi bekleniyor'}</Text>
              <Text style={[dkd_styles.dkd_bank_ocr_status_desc, dkd_receipt_ocr_status_value === 'dkd_ready' && dkd_styles.dkd_bank_ocr_status_desc_done]}>{dkd_receipt_ocr_message_value}</Text>
              {dkd_receipt_ocr_status_value === 'dkd_reading' ? (
                <View style={dkd_styles.dkd_bank_ocr_progress_track}>
                  <Animated.View style={[dkd_styles.dkd_bank_ocr_progress_glow, { transform: [{ translateX: dkd_receipt_status_bar_shift_value }] }]} />
                </View>
              ) : null}
            </View>
          </LinearGradient>
        </Animated.View>

        <DkdBankTransferFormInput
          dkd_icon_name_value="text-box-search-outline"
          dkd_label_value="Dekonttan Otomatik Analiz sistemi"
          dkd_placeholder_value={`${dkd_full_name_text_value || 'Gönderici Ad Soyad'} • ${dkd_wallet_money_text_value(dkd_topup_amount_value)} • DraBornGo`}
          dkd_value_text_value={dkd_receipt_text_value}
          dkd_on_change_text_value={dkd_set_receipt_text_value}
          dkd_multiline_value
          dkd_editable_value={false}
        />
        <View style={dkd_styles.dkd_bank_match_panel}>
          <View style={dkd_styles.dkd_bank_match_header_row}>
            <View style={[dkd_styles.dkd_bank_match_icon_shell, dkd_receipt_match_value.dkd_complete_value && dkd_styles.dkd_bank_match_icon_shell_complete]}>
              {dkd_receipt_match_value.dkd_complete_value ? <LinearGradient colors={['#86EFAC', '#A7F3D0', '#FDE68A']} style={StyleSheet.absoluteFill} /> : null}
              <MaterialCommunityIcons name={dkd_receipt_match_value.dkd_complete_value ? 'check-decagram' : 'text-box-search-outline'} size={dkd_receipt_match_value.dkd_complete_value ? 25 : 18} color={dkd_receipt_match_value.dkd_complete_value ? '#064E3B' : '#FDE68A'} />
              {dkd_receipt_match_value.dkd_complete_value ? (
                <View style={dkd_styles.dkd_bank_match_success_dot}>
                  <MaterialCommunityIcons name="check-bold" size={10} color="#064E3B" />
                </View>
              ) : null}
            </View>
            <View style={dkd_styles.dkd_bank_match_copy}>
              <Text style={[dkd_styles.dkd_bank_match_title, dkd_receipt_match_value.dkd_complete_value && dkd_styles.dkd_bank_match_title_complete]}>{dkd_receipt_match_value.dkd_complete_value ? 'Eşleşme tamamlandı' : 'Dekont eşleşmesi bekleniyor'}</Text>
              {!dkd_receipt_match_value.dkd_complete_value ? <Text style={dkd_styles.dkd_bank_match_waiting_note}>Bütün Eşleşmeler onaylanınca Ödemeyi yapabilirsiniz</Text> : null}
            </View>
          </View>
          <View style={dkd_styles.dkd_bank_match_chip_row}>
            <DkdBankTransferMatchChip dkd_label_value="Ad Soyad" dkd_active_value={dkd_receipt_match_value.dkd_name_match_value} />
            <DkdBankTransferMatchChip dkd_label_value="Ödeme" dkd_active_value={dkd_receipt_match_value.dkd_amount_match_value} />
            <DkdBankTransferMatchChip dkd_label_value="DraBornGo" dkd_active_value={dkd_receipt_match_value.dkd_description_match_value} />
          </View>
        </View>

        <Pressable onPress={dkd_on_paid_value} style={[dkd_styles.dkd_bank_paid_button, dkd_payment_reported_value && dkd_styles.dkd_bank_paid_button_done]}>
          <LinearGradient colors={dkd_payment_reported_value ? ['#86EFAC', '#A7F3D0'] : ['#FDE68A', '#7DD3FC', '#A78BFA']} style={StyleSheet.absoluteFill} />
          <MaterialCommunityIcons name={dkd_payment_reported_value ? 'check-circle' : 'cash-plus'} size={20} color="#07131C" />
          <Text style={dkd_styles.dkd_bank_paid_button_text}>{dkd_payment_reported_value ? 'IBAN ödeme bildirimi alındı' : 'IBAN ile Ödeme yapıldı'}</Text>
        </Pressable>
      </LinearGradient>

      <View style={dkd_styles.dkd_bank_warning_card}>
        <MaterialCommunityIcons name="information-outline" size={19} color="#86EFAC" />
        <Text style={dkd_styles.dkd_bank_warning_text}>Eşleşme tamamlanması için dekont görselinin analizi başarıyla bitmeli; TL yükleme işleminin cüzdana yansıması bir kaç dakika sürebilir, uzun sürerse uygulamayı kapatıp tekrar açın.</Text>
      </View>
    </View>
  );
}

function DkdWalletMethodCard({ dkd_method_value, dkd_selected_value, dkd_on_press_value, dkd_animation_value }) {
  const dkd_method_locked_value = Boolean(dkd_method_value.dkd_locked_value);
  const dkd_card_scale_value = dkd_animation_value.interpolate({ inputRange: [0, 1], outputRange: [1, dkd_selected_value ? 1.018 : 1.006] });
  const dkd_card_lift_value = dkd_animation_value.interpolate({ inputRange: [0, 1], outputRange: [0, dkd_selected_value ? -5 : -2] });
  return (
    <Animated.View style={[dkd_styles.dkd_method_card_anim, { transform: [{ scale: dkd_card_scale_value }, { translateY: dkd_card_lift_value }] }]}>
      <Pressable onPress={dkd_on_press_value} style={dkd_styles.dkd_method_card_pressable}>
        <LinearGradient colors={dkd_method_value.dkd_gradient_value} style={[dkd_styles.dkd_method_card, dkd_selected_value && dkd_styles.dkd_method_card_selected, dkd_method_locked_value && dkd_styles.dkd_method_card_locked]}>
          <View pointerEvents="none" style={[dkd_styles.dkd_method_card_glow, { backgroundColor: dkd_method_value.dkd_glow_value }]} />
          <View style={dkd_styles.dkd_method_top_row}>
            <View style={dkd_styles.dkd_method_icon_shell}>
              <LinearGradient colors={['rgba(255,255,255,0.96)', 'rgba(186,230,253,0.82)']} style={dkd_styles.dkd_method_icon_gradient}>
                <MaterialCommunityIcons name={dkd_method_value.dkd_icon_value} size={26} color="#07131C" />
              </LinearGradient>
            </View>
            <View style={dkd_styles.dkd_method_copy}>
              <View style={dkd_styles.dkd_method_badge_row}>
                <Text style={dkd_styles.dkd_method_badge}>{dkd_method_value.dkd_badge_value}</Text>
                {dkd_method_locked_value ? <View style={dkd_styles.dkd_method_lock_chip}><MaterialCommunityIcons name="lock-outline" size={12} color="#07131C" /><Text style={dkd_styles.dkd_method_lock_text}>Çok yakında</Text></View> : null}
                {dkd_selected_value ? <MaterialCommunityIcons name="check-decagram" size={18} color="#A7F3D0" /> : null}
              </View>
              <Text style={dkd_styles.dkd_method_title}>{dkd_method_value.dkd_title_value}</Text>
              <Text style={dkd_styles.dkd_method_short}>{dkd_method_value.dkd_short_value}</Text>
            </View>
          </View>
          <Text style={dkd_styles.dkd_method_desc}>{dkd_method_value.dkd_desc_value}</Text>
          <View style={dkd_styles.dkd_method_step_row}>
            {dkd_method_value.dkd_step_values.map((dkd_step_value) => (
              <View key={dkd_step_value} style={dkd_styles.dkd_method_step_chip}>
                <MaterialCommunityIcons name="star" size={11} color="#FDE68A" />
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={dkd_styles.dkd_method_step_text}>{dkd_step_value}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function DkdWalletPaymentMethodModal({
  dkd_visible_value,
  dkd_on_close_value,
  dkd_order_title_value = 'Sipariş ödemesi',
  dkd_order_total_tl_value = 0,
  dkd_wallet_tl_value = 0,
  dkd_wallet_pay_busy_value = false,
  dkd_on_wallet_pay_value,
  dkd_on_bank_transfer_topup_value,
  dkd_on_wallet_after_topup_value,
  dkd_on_bank_transfer_success_value,
  dkd_on_home_return_value,
  dkd_context_note_value = 'Ödeme yöntemi seç; TL bakiyesi yalnızca fiziksel hizmet ve sipariş ödemeleri için kullanılır.',
}) {
  const [dkd_selected_method_key_value, dkd_set_selected_method_key_value] = useState('dkd_bank_transfer_fast');
  const [dkd_custom_amount_text_value, dkd_set_custom_amount_text_value] = useState('');
  const [dkd_code_text_value, dkd_set_code_text_value] = useState('');
  const [dkd_bank_transfer_page_visible_value, dkd_set_bank_transfer_page_visible_value] = useState(false);
  const [dkd_transfer_full_name_text_value, dkd_set_transfer_full_name_text_value] = useState('');
  const [dkd_transfer_phone_text_value, dkd_set_transfer_phone_text_value] = useState('');
  const [dkd_transfer_receipt_image_uri_value, dkd_set_transfer_receipt_image_uri_value] = useState('');
  const [dkd_transfer_receipt_text_value, dkd_set_transfer_receipt_text_value] = useState('');
  const [dkd_transfer_receipt_ocr_status_value, dkd_set_transfer_receipt_ocr_status_value] = useState('dkd_idle');
  const [dkd_transfer_receipt_ocr_message_value, dkd_set_transfer_receipt_ocr_message_value] = useState('Dekont görseli yüklenince analiz başlatılır.');
  const [dkd_transfer_payment_reported_value, dkd_set_transfer_payment_reported_value] = useState(false);
  const [dkd_transfer_receipt_server_match_value, dkd_set_transfer_receipt_server_match_value] = useState({});
  const [dkd_bank_support_panel_visible_value, dkd_set_bank_support_panel_visible_value] = useState(false);
  const dkd_pulse_value = useRef(new Animated.Value(0)).current;
  const dkd_selected_method_value = useMemo(
    () => dkd_wallet_payment_method_values.find((dkd_method_value) => dkd_method_value.dkd_key_value === dkd_selected_method_key_value) || dkd_wallet_payment_method_values[0],
    [dkd_selected_method_key_value]
  );
  const dkd_missing_amount_value = Math.max(0, Number(dkd_order_total_tl_value || 0) - Number(dkd_wallet_tl_value || 0));
  const dkd_recommended_amount_value = dkd_missing_amount_value > 0 ? dkd_missing_amount_value : Number(dkd_order_total_tl_value || 0);
  const dkd_custom_amount_number_value = Number(String(dkd_custom_amount_text_value || '').replace(',', '.'));
  const dkd_selected_topup_amount_value = Number.isFinite(dkd_custom_amount_number_value) && dkd_custom_amount_number_value > 0
    ? dkd_custom_amount_number_value
    : dkd_recommended_amount_value;
  const dkd_wallet_after_topup_value = Number(dkd_wallet_tl_value || 0) + Number(dkd_selected_topup_amount_value || 0);
  const dkd_wallet_enough_value = Number(dkd_wallet_tl_value || 0) >= Number(dkd_order_total_tl_value || 0) && Number(dkd_order_total_tl_value || 0) > 0;
  const dkd_needs_code_value = dkd_wallet_method_code_needed_value(dkd_selected_method_key_value);
  const dkd_selected_card_index_value = Math.max(0, dkd_wallet_payment_method_values.findIndex((dkd_method_value) => dkd_method_value.dkd_key_value === dkd_selected_method_key_value));
  const dkd_prepare_button_label_value = dkd_selected_method_value.dkd_title_value;
  const dkd_latest_wallet_pay_handler_ref_value = useRef(dkd_on_wallet_pay_value);
  useEffect(() => {
    dkd_latest_wallet_pay_handler_ref_value.current = dkd_on_wallet_pay_value;
  }, [dkd_on_wallet_pay_value]);
  const dkd_local_receipt_match_value = useMemo(
    () => dkd_bank_transfer_receipt_match_value(dkd_transfer_full_name_text_value, dkd_selected_topup_amount_value, dkd_transfer_receipt_text_value),
    [dkd_selected_topup_amount_value, dkd_transfer_full_name_text_value, dkd_transfer_receipt_text_value]
  );
  const dkd_receipt_match_value = useMemo(() => ({
    ...dkd_local_receipt_match_value,
    dkd_name_match_value: Boolean(dkd_local_receipt_match_value.dkd_name_match_value || dkd_transfer_receipt_server_match_value?.dkd_name_match_value),
    dkd_amount_match_value: Boolean(dkd_local_receipt_match_value.dkd_amount_match_value || dkd_transfer_receipt_server_match_value?.dkd_amount_match_value),
    dkd_description_match_value: Boolean(dkd_local_receipt_match_value.dkd_description_match_value || dkd_transfer_receipt_server_match_value?.dkd_description_match_value),
    dkd_complete_value: Boolean(
      (dkd_local_receipt_match_value.dkd_name_match_value || dkd_transfer_receipt_server_match_value?.dkd_name_match_value)
      && (dkd_local_receipt_match_value.dkd_amount_match_value || dkd_transfer_receipt_server_match_value?.dkd_amount_match_value)
      && (dkd_local_receipt_match_value.dkd_description_match_value || dkd_transfer_receipt_server_match_value?.dkd_description_match_value)
    ),
  }), [dkd_local_receipt_match_value, dkd_transfer_receipt_server_match_value]);

  useEffect(() => {
    if (!dkd_visible_value) return undefined;
    const dkd_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_pulse_value, { toValue: 1, duration: 1050, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(dkd_pulse_value, { toValue: 0, duration: 1050, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_pulse_value, dkd_visible_value]);

  useEffect(() => {
    if (!dkd_visible_value) return;
    dkd_set_code_text_value('');
    dkd_set_bank_transfer_page_visible_value(false);
    dkd_set_transfer_receipt_image_uri_value('');
    dkd_set_transfer_receipt_text_value('');
    dkd_set_transfer_receipt_server_match_value({});
    dkd_set_transfer_receipt_ocr_status_value('dkd_idle');
    dkd_set_transfer_receipt_ocr_message_value('Dekont görseli yüklenince analiz başlatılır.');
    dkd_set_transfer_payment_reported_value(false);
    const dkd_default_amount_value = dkd_missing_amount_value > 0 ? dkd_missing_amount_value : Number(dkd_order_total_tl_value || 0);
    dkd_set_custom_amount_text_value(dkd_default_amount_value > 0 ? String(Math.ceil(dkd_default_amount_value)) : '');
  }, [dkd_missing_amount_value, dkd_order_total_tl_value, dkd_visible_value]);

  const dkd_header_scale_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });
  const dkd_orb_translate_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [-18, 22] });
  const dkd_wallet_pay_lift_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const dkd_wallet_pay_sheen_shift_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [-100, 228] });

  const dkd_handle_select_amount_value = useCallback((dkd_amount_value) => {
    dkd_set_custom_amount_text_value(String(dkd_amount_value));
  }, []);

  const dkd_handle_copy_bank_transfer_text_value = useCallback(async (dkd_copy_text_value, dkd_copy_label_value) => {
    await Clipboard.setStringAsync(String(dkd_copy_text_value || ''));
    Alert.alert('Kopyalandı', `${dkd_copy_label_value} panoya kopyalandı.`);
  }, []);

  const dkd_handle_bank_transfer_back_value = useCallback(() => {
    dkd_set_bank_transfer_page_visible_value(false);
  }, []);

  const dkd_handle_locked_method_notice_value = useCallback(() => {
    Alert.alert('Çok Yakında Hizmetinizde', 'Bu ödeme yöntemi altyapı bağlantısı tamamlanınca aktif olacak. Şimdilik diğer ödeme/yükleme seçeneklerini kullanabilirsin.');
  }, []);

  const dkd_handle_open_bank_support_value = useCallback(() => {
    dkd_set_bank_support_panel_visible_value(true);
  }, []);

  const dkd_handle_close_bank_support_value = useCallback(() => {
    dkd_set_bank_support_panel_visible_value(false);
  }, []);

  const dkd_handle_analyze_receipt_image_value = useCallback(async (dkd_receipt_uri_input_value = '') => {
    const dkd_receipt_uri_value = String(dkd_receipt_uri_input_value || dkd_transfer_receipt_image_uri_value || '').trim();
    if (!dkd_receipt_uri_value) {
      Alert.alert('Dekont gerekli', 'Önce dekont görselini yüklemelisin.');
      return;
    }
    dkd_set_transfer_receipt_ocr_status_value('dkd_reading');
    dkd_set_transfer_receipt_ocr_message_value('Dekont görseli okunuyor; ad soyad, ödeme tutarı ve DraBornGo açıklaması aranıyor.');
    dkd_set_transfer_receipt_text_value('');
    dkd_set_transfer_receipt_server_match_value({});
    dkd_set_transfer_payment_reported_value(false);

    const dkd_ocr_result_value = await dkd_analyze_bank_receipt_image_value({
      dkd_receipt_image_uri_value: dkd_receipt_uri_value,
      dkd_sender_full_name_value: dkd_transfer_full_name_text_value,
      dkd_expected_amount_value: dkd_selected_topup_amount_value,
      dkd_required_description_value: 'DraBornGo',
    });

    if (!dkd_ocr_result_value?.dkd_ok_value) {
      const dkd_retry_message_value = dkd_ocr_result_value?.dkd_message_value || 'Dekont Analizini tekrar Dene. Dekont net değilse yeniden yükleyip tekrar analiz et.';
      dkd_set_transfer_receipt_ocr_status_value('dkd_failed');
      dkd_set_transfer_receipt_ocr_message_value(dkd_retry_message_value);
      Alert.alert('Dekont Analizini tekrar Dene', dkd_retry_message_value);
      return;
    }

    const dkd_ocr_text_value = String(dkd_ocr_result_value?.dkd_receipt_text_value || '').trim();
    dkd_set_transfer_receipt_text_value(dkd_ocr_text_value);
    dkd_set_transfer_receipt_server_match_value({
      dkd_name_match_value: Boolean(dkd_ocr_result_value?.dkd_name_match_value),
      dkd_amount_match_value: Boolean(dkd_ocr_result_value?.dkd_amount_match_value),
      dkd_description_match_value: Boolean(dkd_ocr_result_value?.dkd_description_match_value),
    });
    dkd_set_transfer_receipt_ocr_status_value('dkd_ready');
    dkd_set_transfer_receipt_ocr_message_value(dkd_ocr_result_value?.dkd_message_value || 'Dekont görseli okundu. Eşleşme sonucu aşağıda gösteriliyor.');
  }, [dkd_selected_topup_amount_value, dkd_transfer_full_name_text_value, dkd_transfer_receipt_image_uri_value]);

  const dkd_handle_pick_receipt_image_value = useCallback(async () => {
    const dkd_picker_result_value = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.86,
      allowsMultipleSelection: false,
      allowsEditing: false,
    });
    if (dkd_picker_result_value?.canceled) return;
    const dkd_selected_asset_value = Array.isArray(dkd_picker_result_value?.assets) ? dkd_picker_result_value.assets[0] : null;
    const dkd_selected_uri_value = String(dkd_selected_asset_value?.uri || '').trim();
    if (!dkd_selected_uri_value) {
      Alert.alert('Dekont bulunamadı', 'Seçilen görsel okunamadı. Lütfen farklı bir dekont görseli dene.');
      return;
    }
    dkd_set_transfer_receipt_image_uri_value(dkd_selected_uri_value);
    dkd_set_transfer_receipt_text_value('');
    dkd_set_transfer_receipt_server_match_value({});
    dkd_set_transfer_receipt_ocr_status_value('dkd_reading');
    dkd_set_transfer_receipt_ocr_message_value('Dekont görseli seçildi; analiz başlatılıyor.');
    dkd_set_transfer_payment_reported_value(false);
    await dkd_handle_analyze_receipt_image_value(dkd_selected_uri_value);
  }, [dkd_handle_analyze_receipt_image_value]);

  const dkd_handle_bank_transfer_paid_value = useCallback(() => {
    Alert.alert('Açıklama hatırlatması', 'Banka açıklama kısmına mutlaka "DraBornGo" yazmayı unutmayın.', [
      { text: 'Geri dön', style: 'cancel' },
      {
        text: 'Kontrol Et',
        onPress: async () => {
          try {
          if (!String(dkd_transfer_full_name_text_value || '').trim() || !String(dkd_transfer_phone_text_value || '').trim()) {
            Alert.alert('Gönderici bilgileri eksik', 'Ödeme bildirimi için ad soyad ve telefon numarasını doldurmalısın.');
            return;
          }
          if (!dkd_transfer_receipt_image_uri_value) {
            Alert.alert('Dekont gerekli', 'Ödeme bildirimi için dekont görselini yüklemelisin.');
            return;
          }
          if (dkd_transfer_receipt_ocr_status_value !== 'dkd_ready') {
            Alert.alert('Dekont analizi tamamlanmadı', 'Önce yüklenen dekont görselinin analizini tamamlamalısın.');
            return;
          }
          if (!dkd_receipt_match_value.dkd_complete_value) {
            Alert.alert('Eşleşme tamamlanmadı', 'Dekont görselinde göndericinin adı soyadı, ödeme miktarı ve DraBornGo açıklaması birlikte eşleşmeli.');
            return;
          }
          const dkd_topup_payload_value = {
            dkd_amount_value: dkd_selected_topup_amount_value,
            dkd_sender_full_name_value: dkd_transfer_full_name_text_value,
            dkd_sender_phone_value: dkd_transfer_phone_text_value,
            dkd_receipt_image_uri_value: dkd_transfer_receipt_image_uri_value,
            dkd_receipt_text_value: dkd_transfer_receipt_text_value,
            dkd_description_value: 'DraBornGo',
            dkd_receipt_match_json_value: {
              dkd_name_match_value: Boolean(dkd_receipt_match_value.dkd_name_match_value),
              dkd_amount_match_value: Boolean(dkd_receipt_match_value.dkd_amount_match_value),
              dkd_description_match_value: Boolean(dkd_receipt_match_value.dkd_description_match_value),
              dkd_complete_value: Boolean(dkd_receipt_match_value.dkd_complete_value),
            },
          };
          const dkd_topup_result_value = dkd_on_bank_transfer_topup_value
            ? await dkd_on_bank_transfer_topup_value(dkd_topup_payload_value)
            : await dkd_create_bank_transfer_wallet_topup_value(dkd_topup_payload_value);
          if (dkd_topup_result_value?.error) {
            throw dkd_topup_result_value.error;
          }
          const dkd_wallet_after_topup_value = Number(
            dkd_topup_result_value?.data?.dkd_wallet_after_tl
              ?? dkd_topup_result_value?.data?.wallet_tl
              ?? dkd_topup_result_value?.dkd_wallet_after_tl
              ?? dkd_topup_result_value?.wallet_tl
          );
          if (Number.isFinite(dkd_wallet_after_topup_value)) {
            dkd_on_wallet_after_topup_value?.(dkd_wallet_after_topup_value);
          }
          dkd_set_transfer_payment_reported_value(true);
          Alert.alert(
            'Bakiye Yüklendi',
            'IBAN ödeme dekontu onaylandı ve Cüzdan TL bakiyen güncellendi. Siparişi şimdi cüzdanından ödeyebilirsin.',
            [
              {
                text: 'Cüzdanımdan ÖDE',
                onPress: () => {
                  setTimeout(() => {
                    dkd_latest_wallet_pay_handler_ref_value.current?.({ dkd_wallet_override_tl_value: dkd_wallet_after_topup_value });
                  }, 420);
                },
              },
              {
                text: 'Ana Sayfaya Dön',
                style: 'cancel',
                onPress: () => {
                  dkd_on_home_return_value?.();
                  dkd_on_bank_transfer_success_value?.();
                  dkd_on_close_value?.();
                },
              },
            ]
          );
          } catch (dkd_topup_error_value) {
            Alert.alert('TL yükleme tamamlanamadı', dkd_topup_error_value?.message || 'Cüzdan TL yükleme işlemi tamamlanamadı. Supabase SQL ve giriş bilgilerini kontrol et.');
          }
        },
      },
    ]);
  }, [dkd_on_bank_transfer_success_value, dkd_on_bank_transfer_topup_value, dkd_on_close_value, dkd_on_home_return_value, dkd_on_wallet_after_topup_value, dkd_receipt_match_value, dkd_selected_topup_amount_value, dkd_transfer_full_name_text_value, dkd_transfer_phone_text_value, dkd_transfer_receipt_image_uri_value, dkd_transfer_receipt_ocr_status_value, dkd_transfer_receipt_text_value]);

  const dkd_handle_method_card_press_value = useCallback((dkd_method_value) => {
    if (dkd_method_value.dkd_locked_value) {
      dkd_handle_locked_method_notice_value();
      return;
    }
    dkd_set_selected_method_key_value(dkd_method_value.dkd_key_value);
    if (dkd_method_value.dkd_key_value === 'dkd_bank_transfer_fast') {
      dkd_set_bank_transfer_page_visible_value(true);
      return;
    }
  }, [dkd_handle_locked_method_notice_value]);

  const dkd_handle_prepare_method_value = useCallback(() => {
    if (dkd_selected_method_value.dkd_locked_value) {
      dkd_handle_locked_method_notice_value();
      return;
    }
    if (dkd_needs_code_value && !String(dkd_code_text_value || '').trim()) {
      Alert.alert('Kod gerekli', 'Bu yöntem için hediye kartı, kupon veya promosyon kodunu yazmalısın.');
      return;
    }
    if (dkd_selected_method_key_value === 'dkd_bank_transfer_fast') {
      dkd_set_bank_transfer_page_visible_value(true);
      return;
    }
    if (dkd_selected_method_key_value === 'dkd_cash_on_delivery') {
      Alert.alert('Kapıda Öde', 'Kapıda ödeme seçimi hazırlandı. Bu yöntemin siparişe yazılması için ödeme altyapısı bir sonraki adımda bağlanacak.');
      return;
    }
    Alert.alert('Bakiye yükleme', `${dkd_selected_method_value.dkd_title_value} ekranı hazır. Gerçek tahsilat/kupon doğrulama entegrasyonu bağlandığında ${dkd_wallet_money_text_value(dkd_selected_topup_amount_value)} cüzdana aktarılacak.`);
  }, [dkd_code_text_value, dkd_handle_locked_method_notice_value,  dkd_needs_code_value, dkd_selected_method_key_value, dkd_selected_method_value, dkd_selected_topup_amount_value]);

  const dkd_handle_wallet_pay_value = useCallback(async () => {
    if (!dkd_wallet_enough_value) {
      Alert.alert('Cüzdan bakiyesi yetersiz', 'Önce bu ekrandan bakiye yükleme yöntemlerinden birini seçerek cüzdanını tamamlamalısın.');
      return;
    }
    await dkd_on_wallet_pay_value?.();
  }, [dkd_on_wallet_pay_value, dkd_wallet_enough_value]);

  if (!dkd_payments_enabled_value) {
    return (
      <DkdPaymentsClosedModal
        dkd_visible_value={dkd_visible_value}
        dkd_on_close_value={dkd_on_close_value}
        dkd_context_title_value={dkd_order_title_value}
      />
    );
  }

  return (
    <>
    <Modal visible={dkd_visible_value} transparent animationType="fade" onRequestClose={dkd_on_close_value}>
      <View style={dkd_styles.dkd_overlay}>
        <View style={dkd_styles.dkd_shell}>
          <LinearGradient colors={['rgba(6,10,24,0.98)', 'rgba(14,22,48,0.98)', 'rgba(4,8,18,0.98)']} style={StyleSheet.absoluteFill} />
          <Animated.View pointerEvents="none" style={[dkd_styles.dkd_background_orb, { transform: [{ translateX: dkd_orb_translate_value }, { translateY: dkd_orb_translate_value }] }]} />
          <View style={dkd_styles.dkd_header}>
            <Animated.View style={[dkd_styles.dkd_header_icon_wrap, { transform: [{ scale: dkd_header_scale_value }] }]}>
              <LinearGradient colors={['#FDE68A', '#7DD3FC', '#A78BFA']} style={dkd_styles.dkd_header_icon_gradient}>
                <MaterialCommunityIcons name="wallet-plus-outline" size={31} color="#07131C" />
              </LinearGradient>
            </Animated.View>
            <View style={dkd_styles.dkd_header_copy}>
              <Text style={dkd_styles.dkd_kicker}>{dkd_bank_transfer_page_visible_value ? 'BANKA / EFT / FAST' : 'DKD CÜZDAN'}</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={dkd_styles.dkd_title}>{dkd_bank_transfer_page_visible_value ? 'Banka Bilgileri' : 'Ödeme Yöntemi Seç'}</Text>
              <Text style={dkd_styles.dkd_subtitle}>{dkd_bank_transfer_page_visible_value ? 'IBAN, alıcı adı, gönderici bilgileri ve dekont eşleşmesini tek ekranda hazırla.' : dkd_context_note_value}</Text>
            </View>
            <Pressable onPress={dkd_on_close_value} style={dkd_styles.dkd_close_button}>
              <MaterialCommunityIcons name="close" size={22} color="#F8FAFC" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dkd_styles.dkd_scroll_content}>
            {dkd_bank_transfer_page_visible_value ? (
              <DkdBankTransferPage
                dkd_amount_text_value={dkd_wallet_money_text_value(dkd_selected_topup_amount_value)}
                dkd_topup_amount_value={dkd_selected_topup_amount_value}
                dkd_full_name_text_value={dkd_transfer_full_name_text_value}
                dkd_set_full_name_text_value={dkd_set_transfer_full_name_text_value}
                dkd_phone_text_value={dkd_transfer_phone_text_value}
                dkd_set_phone_text_value={dkd_set_transfer_phone_text_value}
                dkd_receipt_image_uri_value={dkd_transfer_receipt_image_uri_value}
                dkd_receipt_text_value={dkd_transfer_receipt_text_value}
                dkd_set_receipt_text_value={dkd_set_transfer_receipt_text_value}
                dkd_receipt_match_value={dkd_receipt_match_value}
                dkd_payment_reported_value={dkd_transfer_payment_reported_value}
                dkd_receipt_ocr_status_value={dkd_transfer_receipt_ocr_status_value}
                dkd_receipt_ocr_message_value={dkd_transfer_receipt_ocr_message_value}
                dkd_receipt_analysis_busy_value={dkd_transfer_receipt_ocr_status_value === 'dkd_reading'}
                dkd_on_pick_receipt_value={dkd_handle_pick_receipt_image_value}
                dkd_on_analyze_receipt_value={() => dkd_handle_analyze_receipt_image_value()}
                dkd_on_paid_value={dkd_handle_bank_transfer_paid_value}
                dkd_on_back_value={dkd_handle_bank_transfer_back_value}
                dkd_on_copy_value={dkd_handle_copy_bank_transfer_text_value}
                dkd_on_open_support_value={dkd_handle_open_bank_support_value}
                dkd_animation_value={dkd_pulse_value}
              />
            ) : (
              <>
            <LinearGradient colors={['rgba(14,165,233,0.18)', 'rgba(124,58,237,0.15)', 'rgba(15,23,42,0.90)']} style={dkd_styles.dkd_summary_card}>
              <View style={dkd_styles.dkd_summary_top_row}>
                <View style={dkd_styles.dkd_summary_copy}>
                  <Text style={dkd_styles.dkd_summary_label}>İşlem</Text>
                  <Text style={dkd_styles.dkd_summary_title}>{dkd_order_title_value}</Text>
                </View>
                <View style={dkd_styles.dkd_summary_total_pill}>
                  <Text style={dkd_styles.dkd_summary_total_label}>Toplam</Text>
                  <Text style={dkd_styles.dkd_summary_total_text}>{dkd_wallet_money_text_value(dkd_order_total_tl_value)}</Text>
                </View>
              </View>
              <View style={dkd_styles.dkd_wallet_grid}>
                <View style={dkd_styles.dkd_wallet_metric_card}>
                  <Text style={dkd_styles.dkd_wallet_metric_label}>Mevcut bakiye</Text>
                  <Text style={dkd_styles.dkd_wallet_metric_value}>{dkd_wallet_money_text_value(dkd_wallet_tl_value)}</Text>
                </View>
                <View style={dkd_styles.dkd_wallet_metric_card}>
                  <Text style={dkd_styles.dkd_wallet_metric_label}>Önerilen yükleme</Text>
                  <Text style={dkd_styles.dkd_wallet_metric_value}>{dkd_wallet_money_text_value(dkd_recommended_amount_value)}</Text>
                </View>
                <View style={dkd_styles.dkd_wallet_metric_card}>
                  <Text style={dkd_styles.dkd_wallet_metric_label}>Yükleme sonrası</Text>
                  <Text style={dkd_styles.dkd_wallet_metric_value}>{dkd_wallet_money_text_value(dkd_wallet_after_topup_value)}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={dkd_styles.dkd_google_play_billing_guard_card}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color="#A7F3D0" />
              <Text style={dkd_styles.dkd_google_play_billing_guard_text}>Cüzdan TL yalnızca fiziksel teslimat, hizmet ve sipariş ödemelerinde kullanılır. Puan, koleksiyon, özel kart, enerji veya oyun içi avantaj satın almak ya da TL’ye çevirmek için kullanılamaz.</Text>
            </View>

            <View style={dkd_styles.dkd_amount_card}>
              <View style={dkd_styles.dkd_amount_header_row}>
                <MaterialCommunityIcons name="cash-plus" size={19} color="#FDE68A" />
                <Text style={dkd_styles.dkd_section_title}>Cüzdana yüklenecek TL</Text>
              </View>
              <View style={dkd_styles.dkd_amount_chip_row}>
                {dkd_wallet_topup_amount_values.map((dkd_amount_value) => {
                  const dkd_amount_active_value = Math.round(Number(dkd_custom_amount_text_value || 0)) === dkd_amount_value;
                  return (
                    <Pressable key={`dkd_amount_${dkd_amount_value}`} onPress={() => dkd_handle_select_amount_value(dkd_amount_value)} style={[dkd_styles.dkd_amount_chip, dkd_amount_active_value && dkd_styles.dkd_amount_chip_active]}>
                      <Text style={[dkd_styles.dkd_amount_chip_text, dkd_amount_active_value && dkd_styles.dkd_amount_chip_text_active]}>{dkd_amount_value} TL</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={dkd_styles.dkd_amount_input_wrap}>
                <Text style={dkd_styles.dkd_amount_input_label}>Özel tutar</Text>
                <TextInput
                  value={dkd_custom_amount_text_value}
                  onChangeText={dkd_set_custom_amount_text_value}
                  placeholder="Örn. 350"
                  placeholderTextColor="rgba(226,242,255,0.42)"
                  keyboardType="decimal-pad"
                  style={dkd_styles.dkd_amount_input}
                />
              </View>
            </View>

            <View style={dkd_styles.dkd_method_section_header}>
              <Text style={dkd_styles.dkd_section_title}>Yükleme / ödeme alternatifleri</Text>
              <Text style={dkd_styles.dkd_method_counter}>{dkd_selected_card_index_value + 1} / {dkd_wallet_payment_method_values.length}</Text>
            </View>
            <View style={dkd_styles.dkd_method_stack}>
              {dkd_wallet_payment_method_values.map((dkd_method_value) => (
                <DkdWalletMethodCard
                  key={dkd_method_value.dkd_key_value}
                  dkd_method_value={dkd_method_value}
                  dkd_selected_value={dkd_selected_method_key_value === dkd_method_value.dkd_key_value}
                  dkd_on_press_value={() => dkd_handle_method_card_press_value(dkd_method_value)}
                  dkd_animation_value={dkd_pulse_value}
                />
              ))}
            </View>

            {dkd_needs_code_value ? (
              <View style={dkd_styles.dkd_code_card}>
                <View style={dkd_styles.dkd_amount_header_row}>
                  <MaterialCommunityIcons name="barcode-scan" size={19} color="#BAE6FD" />
                  <Text style={dkd_styles.dkd_section_title}>{dkd_selected_method_key_value === 'dkd_promo_code' ? 'Promosyon kodu' : 'Hediye kartı / kupon kodu'}</Text>
                </View>
                <TextInput
                  value={dkd_code_text_value}
                  onChangeText={dkd_set_code_text_value}
                  placeholder="Kodu buraya yaz"
                  placeholderTextColor="rgba(226,242,255,0.42)"
                  autoCapitalize="characters"
                  style={dkd_styles.dkd_code_input}
                />
              </View>
            ) : null}

            <LinearGradient colors={dkd_selected_method_value.dkd_gradient_value} style={dkd_styles.dkd_selected_detail_card}>
              <View style={dkd_styles.dkd_selected_detail_header}>
                <MaterialCommunityIcons name={dkd_selected_method_value.dkd_icon_value} size={22} color="#F8FAFC" />
                <Text style={dkd_styles.dkd_selected_detail_title}>{dkd_selected_method_value.dkd_title_value}</Text>
              </View>
              <Text style={dkd_styles.dkd_selected_detail_text}>Seçilen yöntem yalnızca fiziksel hizmet ve sipariş bakiyesi içindir. Puan, koleksiyon, özel kart, enerji veya oyun içi avantaj satın alma ya da TL’ye çevirme işlemi başlatmaz.</Text>
              <Pressable onPress={dkd_handle_prepare_method_value} style={dkd_styles.dkd_prepare_button}>
                <MaterialCommunityIcons name="rocket-launch-outline" size={17} color="#07131C" />
                <Text numberOfLines={2} style={dkd_styles.dkd_prepare_button_text}>{dkd_prepare_button_label_value}</Text>
              </Pressable>
            </LinearGradient>

            <Animated.View style={[dkd_styles.dkd_wallet_pay_button_anim, { transform: [{ translateY: dkd_wallet_pay_lift_value }] }]}>
              <Pressable onPress={dkd_handle_wallet_pay_value} disabled={dkd_wallet_pay_busy_value} style={[dkd_styles.dkd_wallet_pay_button, (!dkd_wallet_enough_value || dkd_wallet_pay_busy_value) && dkd_styles.dkd_wallet_pay_button_soft]}>
                <LinearGradient colors={dkd_wallet_enough_value ? ['#FDE68A', '#86EFAC', '#7DD3FC'] : ['rgba(148,163,184,0.45)', 'rgba(51,65,85,0.75)']} style={StyleSheet.absoluteFill} />
                <Animated.View pointerEvents="none" style={[dkd_styles.dkd_wallet_pay_sheen, { transform: [{ translateX: dkd_wallet_pay_sheen_shift_value }, { rotate: '16deg' }] }]} />
                <MaterialCommunityIcons name={dkd_wallet_enough_value ? 'check-circle' : 'wallet-plus-outline'} size={19} color={dkd_wallet_enough_value ? '#07131C' : '#E2E8F0'} />
                <Text style={[dkd_styles.dkd_wallet_pay_button_text, !dkd_wallet_enough_value && dkd_styles.dkd_wallet_pay_button_text_soft]}>{dkd_wallet_pay_busy_value ? 'İşlem yapılıyor…' : dkd_wallet_enough_value ? 'Cüzdan bakiyesiyle siparişi tamamla' : 'Önce bakiye yükleme yöntemi seç'}</Text>
              </Pressable>
            </Animated.View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
    {dkd_render_support_panel_modal({
      dkd_visible: Boolean(dkd_visible_value && dkd_bank_support_panel_visible_value),
      dkd_on_close: dkd_handle_close_bank_support_value,
    })}
    </>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.90)', justifyContent: 'center', padding: 14 },
  dkd_shell: { maxHeight: '92%', borderRadius: 34, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(125,211,252,0.28)', shadowColor: '#22D3EE', shadowOpacity: 0.26, shadowRadius: 28, elevation: 14 },
  dkd_background_orb: { position: 'absolute', top: -50, right: -35, width: 148, height: 148, borderRadius: 74, backgroundColor: 'rgba(34,211,238,0.18)' },
  dkd_header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(226,242,255,0.10)' },
  dkd_header_icon_wrap: { width: 62, height: 62, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  dkd_header_icon_gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dkd_header_copy: { flex: 1, minWidth: 0 },
  dkd_kicker: { color: '#BAE6FD', fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  dkd_title: { color: '#FFFFFF', fontSize: 24, lineHeight: 28, fontWeight: '950', marginTop: 2, flexShrink: 1 },
  dkd_subtitle: { color: 'rgba(226,242,255,0.70)', fontSize: 12.5, lineHeight: 17, fontWeight: '750', marginTop: 4 },
  dkd_close_button: { width: 44, height: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  dkd_scroll_content: { padding: 14, paddingBottom: 18, gap: 13 },
  dkd_summary_card: { borderRadius: 26, padding: 14, borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)' },
  dkd_summary_top_row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  dkd_summary_copy: { flex: 1 },
  dkd_summary_label: { color: 'rgba(186,230,253,0.72)', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  dkd_summary_title: { color: '#FFFFFF', fontSize: 17, lineHeight: 21, fontWeight: '950', marginTop: 3 },
  dkd_summary_total_pill: { borderRadius: 18, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: 'rgba(253,230,138,0.16)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.26)' },
  dkd_summary_total_label: { color: 'rgba(253,230,138,0.74)', fontSize: 10, fontWeight: '900' },
  dkd_summary_total_text: { color: '#FDE68A', fontSize: 14, fontWeight: '950', marginTop: 2 },
  dkd_wallet_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  dkd_wallet_metric_card: { flexGrow: 1, minWidth: '30%', borderRadius: 18, padding: 10, backgroundColor: 'rgba(15,23,42,0.72)', borderWidth: 1, borderColor: 'rgba(226,242,255,0.10)' },
  dkd_wallet_metric_label: { color: 'rgba(226,242,255,0.62)', fontSize: 10.5, fontWeight: '850' },
  dkd_wallet_metric_value: { color: '#E0F2FE', fontSize: 13, fontWeight: '950', marginTop: 3 },
  dkd_google_play_billing_guard_card: { borderRadius: 22, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: 'rgba(6,78,59,0.22)', borderWidth: 1, borderColor: 'rgba(167,243,208,0.28)' },
  dkd_google_play_billing_guard_text: { flex: 1, color: 'rgba(220,252,231,0.88)', fontSize: 11.8, lineHeight: 17, fontWeight: '800' },
  dkd_amount_card: { borderRadius: 24, padding: 13, backgroundColor: 'rgba(15,23,42,0.86)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.18)' },
  dkd_amount_header_row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dkd_section_title: { color: '#FFFFFF', fontSize: 14, lineHeight: 18, fontWeight: '950' },
  dkd_amount_chip_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dkd_amount_chip: { borderRadius: 16, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  dkd_amount_chip_active: { backgroundColor: '#FDE68A', borderColor: '#FDE68A' },
  dkd_amount_chip_text: { color: '#E2E8F0', fontSize: 12, fontWeight: '900' },
  dkd_amount_chip_text_active: { color: '#07131C' },
  dkd_amount_input_wrap: { marginTop: 11, borderRadius: 18, padding: 11, backgroundColor: 'rgba(2,6,23,0.46)', borderWidth: 1, borderColor: 'rgba(226,242,255,0.11)' },
  dkd_amount_input_label: { color: 'rgba(226,242,255,0.66)', fontSize: 11, fontWeight: '850', marginBottom: 6 },
  dkd_amount_input: { color: '#FFFFFF', fontSize: 17, fontWeight: '950', paddingVertical: 2 },
  dkd_method_section_header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dkd_method_counter: { color: '#BAE6FD', fontSize: 11, fontWeight: '900' },
  dkd_method_stack: { gap: 10 },
  dkd_method_card_anim: { borderRadius: 25 },
  dkd_method_card_pressable: { borderRadius: 25, overflow: 'hidden' },
  dkd_method_card: { minHeight: 154, borderRadius: 25, padding: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  dkd_method_card_selected: { borderColor: 'rgba(253,230,138,0.52)' },
  dkd_method_card_locked: { opacity: 0.72 },
  dkd_method_card_glow: { position: 'absolute', top: -20, right: -24, width: 112, height: 112, borderRadius: 56 },
  dkd_method_top_row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dkd_method_icon_shell: { width: 58, height: 58, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  dkd_method_icon_gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dkd_method_copy: { flex: 1 },
  dkd_method_badge_row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dkd_method_badge: { alignSelf: 'flex-start', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.16)', color: '#F8FAFC', fontSize: 10.5, fontWeight: '900' },
  dkd_method_lock_chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#FDE68A' },
  dkd_method_lock_text: { color: '#07131C', fontSize: 9.5, fontWeight: '950' },
  dkd_method_title: { color: '#FFFFFF', fontSize: 15.5, lineHeight: 20, fontWeight: '950', marginTop: 7 },
  dkd_method_short: { color: 'rgba(226,242,255,0.76)', fontSize: 11.5, fontWeight: '850', marginTop: 3 },
  dkd_method_desc: { color: 'rgba(248,250,252,0.76)', fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 10 },
  dkd_method_step_row: { flexDirection: 'row', flexWrap: 'nowrap', gap: 5, marginTop: 10 },
  dkd_method_step_chip: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 5, backgroundColor: 'rgba(2,6,23,0.30)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  dkd_method_step_text: { flexShrink: 1, minWidth: 0, color: '#E2E8F0', fontSize: 9.3, fontWeight: '850', textAlign: 'center' },
  dkd_code_card: { borderRadius: 22, padding: 13, backgroundColor: 'rgba(30,41,59,0.88)', borderWidth: 1, borderColor: 'rgba(186,230,253,0.18)' },
  dkd_code_input: { minHeight: 46, borderRadius: 16, paddingHorizontal: 12, color: '#FFFFFF', fontSize: 16, fontWeight: '950', backgroundColor: 'rgba(2,6,23,0.44)', borderWidth: 1, borderColor: 'rgba(226,242,255,0.12)' },
  dkd_selected_detail_card: { borderRadius: 24, padding: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_selected_detail_header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dkd_selected_detail_title: { color: '#FFFFFF', fontSize: 14, lineHeight: 18, fontWeight: '950', flex: 1 },
  dkd_selected_detail_text: { color: 'rgba(248,250,252,0.76)', fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 8 },
  dkd_prepare_button: { marginTop: 12, minHeight: 46, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#FDE68A', borderWidth: 1, borderColor: 'rgba(253,230,138,0.72)' },
  dkd_prepare_button_text: { color: '#07131C', fontSize: 12.5, lineHeight: 16, fontWeight: '950', textAlign: 'center', flexShrink: 1 },
  dkd_wallet_pay_button: { minHeight: 52, borderRadius: 19, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  dkd_wallet_pay_button_soft: { opacity: 0.92 },
  dkd_wallet_pay_button_text: { color: '#07131C', fontSize: 13.5, fontWeight: '950' },

  dkd_bank_page_stack: { gap: 13 },
  dkd_bank_back_button: { alignSelf: 'flex-start', minHeight: 42, borderRadius: 16, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(186,230,253,0.72)' },
  dkd_bank_back_text: { color: '#07131C', fontSize: 12, fontWeight: '950' },
  dkd_bank_hero_card: { borderRadius: 28, padding: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(186,230,253,0.30)' },
  dkd_bank_hero_orb: { position: 'absolute', right: -34, top: -28, width: 126, height: 126, borderRadius: 63, backgroundColor: 'rgba(253,230,138,0.22)' },
  dkd_bank_hero_header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dkd_bank_hero_icon_shell: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE68A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.44)' },
  dkd_bank_hero_copy: { flex: 1 },
  dkd_bank_hero_kicker: { color: '#BAE6FD', fontSize: 10.5, fontWeight: '950', letterSpacing: 1.2 },
  dkd_bank_hero_title: { color: '#FFFFFF', fontSize: 24, lineHeight: 29, fontWeight: '950', marginTop: 4 },
  dkd_bank_hero_desc: { color: 'rgba(248,250,252,0.76)', fontSize: 12.2, lineHeight: 17, fontWeight: '750', marginTop: 7 },
  dkd_bank_hero_action_row: { flexDirection: 'row', alignItems: 'stretch', gap: 8, marginTop: 12 },
  dkd_bank_amount_pill: { flex: 1.06, minHeight: 58, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,6,23,0.46)', borderWidth: 1.2, borderColor: 'rgba(253,230,138,0.46)' },
  dkd_bank_support_mini_wrap: { flex: 0.82 },
  dkd_bank_support_mini_button: { flex: 1, minHeight: 58, borderRadius: 18, overflow: 'hidden', paddingLeft: 7, paddingRight: 5, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.52)', shadowColor: '#22D3EE', shadowOpacity: 0.38, shadowRadius: 12, elevation: 7 },
  dkd_bank_support_mini_sheen: { position: 'absolute', top: -18, bottom: -18, width: 44, backgroundColor: 'rgba(255,255,255,0.24)' },
  dkd_bank_support_icon_shell: { width: 30, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.90)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)' },
  dkd_bank_support_online_dot: { position: 'absolute', right: 3, top: 3, width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22C55E', borderWidth: 1, borderColor: '#ECFEFF' },
  dkd_bank_support_mini_copy: { flex: 1, minWidth: 0, alignItems: 'flex-start', justifyContent: 'center', marginLeft: 2 },
  dkd_bank_support_mini_title: { color: '#F8FAFC', fontSize: 10.5, fontWeight: '950', letterSpacing: 0.7, textTransform: 'uppercase' },
  dkd_bank_support_mini_text: { color: '#FFFFFF', fontSize: 12.1, lineHeight: 15, fontWeight: '950', textAlign: 'left', includeFontPadding: false },
  dkd_bank_support_arrow_shell: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.88)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.64)' },
  dkd_bank_amount_label: { color: 'rgba(253,230,138,0.88)', fontSize: 13.2, lineHeight: 16, fontWeight: '950', textAlign: 'center' },
  dkd_bank_amount_text: { color: '#FDE68A', fontSize: 24, lineHeight: 29, fontWeight: '950', marginTop: 4, textAlign: 'center' },
  dkd_bank_info_card: { borderRadius: 26, padding: 13, gap: 10, borderWidth: 1, borderColor: 'rgba(253,230,138,0.20)' },
  dkd_bank_section_header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  dkd_bank_section_title: { color: '#FFFFFF', fontSize: 14, lineHeight: 18, fontWeight: '950' },
  dkd_bank_copy_card: { borderRadius: 20, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(2,6,23,0.48)', borderWidth: 1, borderColor: 'rgba(226,242,255,0.12)' },
  dkd_bank_copy_icon_shell: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BAE6FD' },
  dkd_bank_copy_text_wrap: { flex: 1 },
  dkd_bank_copy_label: { color: 'rgba(226,242,255,0.62)', fontSize: 10.5, fontWeight: '900' },
  dkd_bank_copy_value: { color: '#FFFFFF', fontSize: 14.5, lineHeight: 19, fontWeight: '950', marginTop: 3 },
  dkd_bank_copy_button: { minHeight: 36, borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FDE68A' },
  dkd_bank_copy_button_text: { color: '#07131C', fontSize: 10.5, fontWeight: '950' },
  dkd_bank_form_card: { borderRadius: 26, padding: 13, gap: 11, borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)' },
  dkd_bank_form_note: { color: 'rgba(226,242,255,0.70)', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  dkd_bank_form_input_shell: { borderRadius: 18, padding: 11, backgroundColor: 'rgba(2,6,23,0.42)', borderWidth: 1, borderColor: 'rgba(226,242,255,0.11)' },
  dkd_bank_form_label_row: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  dkd_bank_form_label: { color: '#BAE6FD', fontSize: 11.5, fontWeight: '900' },
  dkd_bank_form_input: { minHeight: 40, color: '#FFFFFF', fontSize: 16, fontWeight: '900', paddingVertical: 2 },
  dkd_bank_form_input_readonly: { color: 'rgba(226,242,255,0.84)' },
  dkd_bank_form_input_multiline: { minHeight: 112, lineHeight: 22, paddingTop: 4 },
  dkd_bank_receipt_card: { borderRadius: 28, padding: 13, gap: 11, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(167,243,208,0.20)' },
  dkd_bank_receipt_upload_button: { minHeight: 48, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  dkd_bank_receipt_upload_text: { color: '#07131C', fontSize: 13, fontWeight: '950' },
  dkd_bank_receipt_preview_shell: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(226,242,255,0.14)', backgroundColor: 'rgba(2,6,23,0.46)' },
  dkd_bank_receipt_preview_image: { width: '100%', height: 168, backgroundColor: 'rgba(2,6,23,0.72)' },
  dkd_bank_receipt_preview_badge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#A7F3D0' },
  dkd_bank_receipt_preview_badge_text: { color: '#064E3B', fontSize: 10.5, fontWeight: '950' },
  dkd_bank_analyze_button: { minHeight: 48, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  dkd_bank_analyze_button_disabled: { opacity: 0.68 },
  dkd_bank_ocr_status_card: { borderRadius: 22, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(125,211,252,0.28)', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  dkd_bank_ocr_status_card_reading: { borderColor: 'rgba(125,211,252,0.74)', shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  dkd_bank_ocr_status_card_done: { borderColor: 'rgba(253,230,138,0.82)', shadowOpacity: 0 },
  dkd_bank_ocr_status_card_error: { borderColor: 'rgba(252,165,165,0.50)', shadowOpacity: 0 },
  dkd_bank_ocr_status_orb: { position: 'absolute', right: -30, top: -35, width: 104, height: 104, borderRadius: 52, backgroundColor: 'rgba(255,255,255,0.22)' },
  dkd_bank_ocr_status_orb_secondary: { position: 'absolute', left: -38, bottom: -48, width: 118, height: 118, borderRadius: 59, backgroundColor: 'rgba(167,243,208,0.18)' },
  dkd_bank_ocr_icon_shell: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)' },
  dkd_bank_ocr_icon_shell_done: { backgroundColor: '#FDE68A', borderColor: 'rgba(6,78,59,0.22)' },
  dkd_bank_ocr_icon_shell_reading: { backgroundColor: '#A7F3D0', borderColor: 'rgba(255,255,255,0.58)', shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  dkd_bank_ocr_icon_shell_error: { backgroundColor: 'rgba(127,29,29,0.36)', borderColor: 'rgba(254,226,226,0.30)' },
  dkd_bank_ocr_status_copy: { flex: 1 },
  dkd_bank_ocr_status_title: { color: '#FFFFFF', fontSize: 13.5, lineHeight: 17, fontWeight: '950' },
  dkd_bank_ocr_status_title_done: { color: '#06201A' },
  dkd_bank_ocr_status_desc: { color: 'rgba(226,242,255,0.80)', fontSize: 11.5, lineHeight: 16, fontWeight: '800', marginTop: 4 },
  dkd_bank_ocr_status_desc_done: { color: 'rgba(6,32,26,0.76)' },
  dkd_bank_ocr_progress_track: { height: 6, borderRadius: 999, overflow: 'hidden', marginTop: 9, backgroundColor: 'rgba(2,6,23,0.32)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  dkd_bank_ocr_progress_glow: { width: 96, height: '100%', borderRadius: 999, backgroundColor: 'rgba(253,230,138,0.96)' },
  dkd_bank_match_panel: { borderRadius: 22, padding: 12, gap: 11, backgroundColor: 'rgba(2,6,23,0.45)', borderWidth: 1, borderColor: 'rgba(226,242,255,0.12)' },
  dkd_bank_match_header_row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dkd_bank_match_icon_shell: { width: 38, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'rgba(253,230,138,0.15)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.22)' },
  dkd_bank_match_icon_shell_complete: { width: 46, height: 46, borderRadius: 18, borderColor: 'rgba(167,243,208,0.88)', shadowColor: '#A7F3D0', shadowOpacity: 0.42, shadowRadius: 14, elevation: 6 },
  dkd_bank_match_success_dot: { position: 'absolute', right: -1, bottom: -1, width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE68A', borderWidth: 1, borderColor: '#064E3B' },
  dkd_bank_match_copy: { flex: 1 },
  dkd_bank_match_title: { color: '#FFFFFF', fontSize: 14.5, lineHeight: 18, fontWeight: '950' },
  dkd_bank_match_title_complete: { color: '#A7F3D0', fontSize: 15.5 },
  dkd_bank_match_waiting_note: { color: 'rgba(253,230,138,0.88)', fontSize: 10.5, lineHeight: 14, fontWeight: '850', marginTop: 3 },
  dkd_bank_match_desc: { color: 'rgba(226,242,255,0.68)', fontSize: 11.5, lineHeight: 16, fontWeight: '750', marginTop: 3 },
  dkd_bank_match_chip_row: { flexDirection: 'row', flexWrap: 'nowrap', gap: 6, alignItems: 'center' },
  dkd_bank_match_chip: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 4, paddingVertical: 6, backgroundColor: 'rgba(15,23,42,0.72)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.22)' },
  dkd_bank_match_chip_active: { backgroundColor: '#A7F3D0', borderColor: '#A7F3D0' },
  dkd_bank_match_chip_text: { color: '#FDE68A', fontSize: 8.8, lineHeight: 11, fontWeight: '950', textAlign: 'center' },
  dkd_bank_match_chip_text_active: { color: '#064E3B' },
  dkd_bank_paid_button: { minHeight: 52, borderRadius: 19, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  dkd_bank_paid_button_done: { opacity: 0.92 },
  dkd_bank_paid_button_text: { color: '#07131C', fontSize: 14, fontWeight: '950' },
  dkd_bank_warning_card: { borderRadius: 22, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: 'rgba(22,101,52,0.22)', borderWidth: 1, borderColor: 'rgba(134,239,172,0.24)' },
  dkd_bank_warning_text: { flex: 1, color: 'rgba(220,252,231,0.86)', fontSize: 12, lineHeight: 17, fontWeight: '750' },
  dkd_wallet_pay_button_anim: { borderRadius: 21 },
  dkd_wallet_pay_sheen: { position: 'absolute', top: -18, bottom: -18, width: 58, backgroundColor: 'rgba(255,255,255,0.30)' },
  dkd_wallet_pay_button_text_soft: { color: '#E2E8F0' },
});
