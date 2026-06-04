import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SecondaryButton from '../../components/ui/SecondaryButton';
import { cityLootTheme } from '../../theme/cityLootTheme';
import {
  dkd_fetch_admin_courier_payout_rows_value,
  dkd_record_admin_courier_payout_value,
} from '../../services/adminService';

const dkd_period_options_value = Object.freeze([
  { dkd_key_value: 'day', dkd_label_value: 'Günlük', dkd_icon_value: 'calendar-today' },
  { dkd_key_value: 'week', dkd_label_value: 'Haftalık', dkd_icon_value: 'calendar-week' },
  { dkd_key_value: 'month', dkd_label_value: 'Aylık', dkd_icon_value: 'calendar-month' },
]);

function dkd_money_text_value(dkd_amount_value) {
  const dkd_safe_amount_value = Number.isFinite(Number(dkd_amount_value)) ? Number(dkd_amount_value) : 0;
  return `${dkd_safe_amount_value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

function dkd_short_id_text_value(dkd_user_id_value) {
  const dkd_clean_value = String(dkd_user_id_value || '').trim();
  return dkd_clean_value ? `${dkd_clean_value.slice(0, 8)}…` : '—';
}

function dkd_status_label_value(dkd_status_value) {
  const dkd_clean_status_value = String(dkd_status_value || 'none').trim().toLowerCase();
  if (dkd_clean_status_value === 'approved') return 'Onaylı Kurye';
  if (dkd_clean_status_value === 'pending') return 'Başvuru Bekliyor';
  if (dkd_clean_status_value === 'rejected') return 'Reddedildi';
  return 'Kurye Değil';
}

function dkd_admin_payout_metric_card(dkd_props_value) {
  const dkd_accent_value = dkd_props_value?.dkd_accent_value || cityLootTheme.colors.cyanSoft;
  return (
    <View style={dkd_styles.dkd_metric_card}>
      <View style={[dkd_styles.dkd_metric_icon, { borderColor: `${dkd_accent_value}66` }]}>
        <MaterialCommunityIcons name={dkd_props_value?.dkd_icon_value || 'cash'} size={18} color={dkd_accent_value} />
      </View>
      <Text style={dkd_styles.dkd_metric_label}>{dkd_props_value?.dkd_label_value}</Text>
      <Text style={[dkd_styles.dkd_metric_value, { color: dkd_accent_value }]}>{dkd_props_value?.dkd_value}</Text>
    </View>
  );
}

function dkd_admin_period_chip(dkd_props_value) {
  const dkd_active_value = Boolean(dkd_props_value?.dkd_active_value);
  const dkd_accent_value = dkd_active_value ? cityLootTheme.colors.goldSoft : cityLootTheme.colors.textMuted;
  return (
    <Pressable onPress={dkd_props_value?.dkd_on_press_value} style={[dkd_styles.dkd_period_chip, dkd_active_value && dkd_styles.dkd_period_chip_active]}>
      <MaterialCommunityIcons name={dkd_props_value?.dkd_icon_value || 'calendar'} size={16} color={dkd_accent_value} />
      <Text style={[dkd_styles.dkd_period_chip_text, dkd_active_value && dkd_styles.dkd_period_chip_text_active]}>{dkd_props_value?.dkd_label_value}</Text>
    </Pressable>
  );
}

function dkd_admin_payout_row(dkd_props_value) {
  const dkd_row_value = dkd_props_value?.dkd_row_value || {};
  const dkd_warning_text_value = String(dkd_row_value?.dkd_balance_warning_text || '').trim();
  const dkd_payable_value = Number(dkd_row_value?.dkd_courier_wallet_tl || 0) > 0;

  return (
    <View style={dkd_styles.dkd_row_card}>
      <LinearGradient colors={['rgba(255,255,255,0.075)', 'rgba(255,255,255,0.025)']} style={dkd_styles.dkd_row_fill}>
        <View style={dkd_styles.dkd_row_header}>
          <View style={dkd_styles.dkd_avatar_shell}>
            <Text style={dkd_styles.dkd_avatar_text}>{String(dkd_row_value?.dkd_avatar_emoji || '🦅')}</Text>
          </View>
          <View style={dkd_styles.dkd_row_title_wrap}>
            <Text style={dkd_styles.dkd_row_name} numberOfLines={1}>{dkd_row_value?.dkd_nickname || 'İsimsiz Kurye'}</Text>
            <Text style={dkd_styles.dkd_row_email} numberOfLines={1}>{dkd_row_value?.dkd_email || dkd_short_id_text_value(dkd_row_value?.dkd_user_id)}</Text>
          </View>
          <View style={dkd_styles.dkd_status_pill}>
            <Text style={dkd_styles.dkd_status_text}>{dkd_status_label_value(dkd_row_value?.dkd_courier_status)}</Text>
          </View>
        </View>

        <View style={dkd_styles.dkd_money_grid}>
          <View style={dkd_styles.dkd_money_box}>
            <Text style={dkd_styles.dkd_money_label}>Ödenecek</Text>
            <Text style={dkd_styles.dkd_money_value}>{dkd_money_text_value(dkd_row_value?.dkd_courier_wallet_tl)}</Text>
          </View>
          <View style={dkd_styles.dkd_money_box}>
            <Text style={dkd_styles.dkd_money_label}>Toplam Kazanç</Text>
            <Text style={dkd_styles.dkd_money_value}>{dkd_money_text_value(dkd_row_value?.dkd_courier_total_earned_tl)}</Text>
          </View>
          <View style={dkd_styles.dkd_money_box}>
            <Text style={dkd_styles.dkd_money_label}>Ödenmiş</Text>
            <Text style={dkd_styles.dkd_money_value}>{dkd_money_text_value(dkd_row_value?.dkd_courier_withdrawn_tl)}</Text>
          </View>
        </View>

        <View style={dkd_styles.dkd_period_summary_line}>
          <Text style={dkd_styles.dkd_period_summary_text}>Dönem kazanç: {dkd_money_text_value(dkd_row_value?.dkd_period_earned_tl)}</Text>
          <Text style={dkd_styles.dkd_period_summary_text}>Dönem ödeme: {dkd_money_text_value(dkd_row_value?.dkd_period_paid_tl)}</Text>
          <Text style={dkd_styles.dkd_period_summary_text}>Net: {dkd_money_text_value(dkd_row_value?.dkd_period_net_tl)}</Text>
        </View>

        {dkd_warning_text_value ? (
          <View style={dkd_styles.dkd_warning_box}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={cityLootTheme.colors.goldSoft} />
            <Text style={dkd_styles.dkd_warning_text}>{dkd_warning_text_value}</Text>
          </View>
        ) : null}

        <View style={dkd_styles.dkd_row_footer}>
          <Text style={dkd_styles.dkd_user_id_text}>ID {dkd_short_id_text_value(dkd_row_value?.dkd_user_id)}</Text>
          <Pressable
            disabled={!dkd_payable_value || dkd_props_value?.dkd_busy_value}
            onPress={() => dkd_props_value?.dkd_on_select_value?.(dkd_row_value)}
            style={[dkd_styles.dkd_pay_button, (!dkd_payable_value || dkd_props_value?.dkd_busy_value) && dkd_styles.dkd_pay_button_disabled]}
          >
            <MaterialCommunityIcons name="bank-transfer-out" size={18} color={dkd_payable_value ? '#07111C' : cityLootTheme.colors.textMuted} />
            <Text style={[dkd_styles.dkd_pay_button_text, !dkd_payable_value && dkd_styles.dkd_pay_button_text_disabled]}>{dkd_payable_value ? 'Ödeme Kaydet' : 'Bakiye Yok'}</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function Dkd_admin_courier_payouts_modal(dkd_props_value = {}) {
  const dkd_visible_value = Boolean(dkd_props_value?.visible);
  const dkd_on_close_value = dkd_props_value?.onClose;
  const [dkd_period_key_value, dkd_set_period_key_value] = useState('month');
  const [dkd_search_text_value, dkd_set_search_text_value] = useState('');
  const [dkd_rows_value, dkd_set_rows_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_saving_value, dkd_set_saving_value] = useState(false);
  const [dkd_selected_row_value, dkd_set_selected_row_value] = useState(null);
  const [dkd_payment_amount_text_value, dkd_set_payment_amount_text_value] = useState('');
  const [dkd_payment_note_text_value, dkd_set_payment_note_text_value] = useState('');

  const dkd_load_rows_value = useCallback(async () => {
    dkd_set_loading_value(true);
    try {
      const dkd_response_value = await dkd_fetch_admin_courier_payout_rows_value({
        dkd_period_key_value,
        dkd_query_value: dkd_search_text_value,
        dkd_limit_value: 250,
      });
      if (dkd_response_value?.error) throw dkd_response_value.error;
      dkd_set_rows_value(Array.isArray(dkd_response_value?.data) ? dkd_response_value.data : []);
    } catch (dkd_error_value) {
      Alert.alert('Kurye Ödeme Paneli', dkd_error_value?.message || 'Kazanç listesi alınamadı. SQL dosyasını Supabase üzerinde çalıştırdığından emin ol.');
      dkd_set_rows_value([]);
    } finally {
      dkd_set_loading_value(false);
    }
  }, [dkd_period_key_value, dkd_search_text_value]);

  useEffect(() => {
    if (dkd_visible_value) dkd_load_rows_value();
  }, [dkd_visible_value, dkd_load_rows_value]);

  const dkd_summary_value = useMemo(() => {
    return (Array.isArray(dkd_rows_value) ? dkd_rows_value : []).reduce((dkd_summary_accumulator_value, dkd_row_value) => ({
      dkd_wallet_tl: dkd_summary_accumulator_value.dkd_wallet_tl + Number(dkd_row_value?.dkd_courier_wallet_tl || 0),
      dkd_total_earned_tl: dkd_summary_accumulator_value.dkd_total_earned_tl + Number(dkd_row_value?.dkd_courier_total_earned_tl || 0),
      dkd_withdrawn_tl: dkd_summary_accumulator_value.dkd_withdrawn_tl + Number(dkd_row_value?.dkd_courier_withdrawn_tl || 0),
      dkd_period_net_tl: dkd_summary_accumulator_value.dkd_period_net_tl + Number(dkd_row_value?.dkd_period_net_tl || 0),
      dkd_courier_count_value: dkd_summary_accumulator_value.dkd_courier_count_value + 1,
    }), {
      dkd_wallet_tl: 0,
      dkd_total_earned_tl: 0,
      dkd_withdrawn_tl: 0,
      dkd_period_net_tl: 0,
      dkd_courier_count_value: 0,
    });
  }, [dkd_rows_value]);

  const dkd_open_payment_editor_value = useCallback((dkd_row_value) => {
    dkd_set_selected_row_value(dkd_row_value || null);
    dkd_set_payment_amount_text_value(String(Number(dkd_row_value?.dkd_courier_wallet_tl || 0).toFixed(2)).replace('.', ','));
    dkd_set_payment_note_text_value('Admin ödeme kaydı');
  }, []);

  const dkd_close_payment_editor_value = useCallback(() => {
    if (dkd_saving_value) return;
    dkd_set_selected_row_value(null);
    dkd_set_payment_amount_text_value('');
    dkd_set_payment_note_text_value('');
  }, [dkd_saving_value]);

  const dkd_submit_payment_value = useCallback(() => {
    const dkd_selected_value = dkd_selected_row_value || {};
    const dkd_amount_value = Number(String(dkd_payment_amount_text_value || '').replace(',', '.'));
    const dkd_max_value = Number(dkd_selected_value?.dkd_courier_wallet_tl || 0);

    if (!dkd_selected_value?.dkd_user_id) {
      Alert.alert('Kurye Ödeme Paneli', 'Kurye seçimi bulunamadı.');
      return;
    }
    if (!Number.isFinite(dkd_amount_value) || dkd_amount_value <= 0) {
      Alert.alert('Kurye Ödeme Paneli', 'Ödeme tutarı 0 TL üzerinde olmalı.');
      return;
    }
    if (dkd_amount_value > dkd_max_value) {
      Alert.alert('Kurye Ödeme Paneli', `Ödeme tutarı mevcut kurye cüzdanını aşamaz. Maksimum: ${dkd_money_text_value(dkd_max_value)}`);
      return;
    }

    Alert.alert(
      'Ödeme Kaydı',
      `${dkd_selected_value?.dkd_nickname || 'Kurye'} için ${dkd_money_text_value(dkd_amount_value)} ödeme kaydı oluşturulsun mu? Bu işlem courier_wallet_tl değerini düşürür, courier_withdrawn_tl değerini artırır.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaydet',
          style: 'default',
          onPress: async () => {
            dkd_set_saving_value(true);
            try {
              const dkd_response_value = await dkd_record_admin_courier_payout_value({
                dkd_user_id_value: dkd_selected_value.dkd_user_id,
                dkd_amount_tl_value: dkd_amount_value,
                dkd_note_value: dkd_payment_note_text_value,
              });
              if (dkd_response_value?.error) throw dkd_response_value.error;
              const dkd_payload_value = dkd_response_value?.data || {};
              if (dkd_payload_value?.ok === false) {
                throw new Error(dkd_payload_value?.reason || 'payment_rejected');
              }
              Alert.alert('Kurye Ödeme Paneli', 'Ödeme kaydı işlendi. Liste yenilendi.');
              dkd_close_payment_editor_value();
              await dkd_load_rows_value();
            } catch (dkd_error_value) {
              Alert.alert('Kurye Ödeme Paneli', dkd_error_value?.message || 'Ödeme kaydı oluşturulamadı.');
            } finally {
              dkd_set_saving_value(false);
            }
          },
        },
      ],
    );
  }, [dkd_close_payment_editor_value, dkd_load_rows_value, dkd_payment_amount_text_value, dkd_payment_note_text_value, dkd_selected_row_value]);

  return (
    <Modal visible={dkd_visible_value} transparent animationType="fade" onRequestClose={dkd_on_close_value}>
      <View style={dkd_styles.dkd_backdrop}>
        <LinearGradient colors={['#03101B', '#0A1428', '#070B14']} style={dkd_styles.dkd_card}>
          <View style={dkd_styles.dkd_glow_cyan} />
          <View style={dkd_styles.dkd_glow_gold} />

          <View style={dkd_styles.dkd_top_bar}>
            <View style={dkd_styles.dkd_top_text_wrap}>
              <Text style={dkd_styles.dkd_kicker}>DKD ADMIN PAYOUTS</Text>
              <Text style={dkd_styles.dkd_title}>Kurye Ödeme Paneli</Text>
            </View>
            <SecondaryButton label="Kapat" onPress={dkd_on_close_value} size="compact" fullWidth={false} icon="close" />
          </View>

          <View style={dkd_styles.dkd_summary_grid}>
            {React.createElement(dkd_admin_payout_metric_card, { dkd_icon_value: 'wallet-outline', dkd_label_value: 'Ödenecek', dkd_value: dkd_money_text_value(dkd_summary_value.dkd_wallet_tl), dkd_accent_value: cityLootTheme.colors.green })}
            {React.createElement(dkd_admin_payout_metric_card, { dkd_icon_value: 'chart-line', dkd_label_value: 'Toplam Kazanç', dkd_value: dkd_money_text_value(dkd_summary_value.dkd_total_earned_tl), dkd_accent_value: cityLootTheme.colors.cyanSoft })}
            {React.createElement(dkd_admin_payout_metric_card, { dkd_icon_value: 'bank-check', dkd_label_value: 'Ödenmiş', dkd_value: dkd_money_text_value(dkd_summary_value.dkd_withdrawn_tl), dkd_accent_value: cityLootTheme.colors.goldSoft })}
            {React.createElement(dkd_admin_payout_metric_card, { dkd_icon_value: 'calendar-clock', dkd_label_value: 'Dönem Net', dkd_value: dkd_money_text_value(dkd_summary_value.dkd_period_net_tl), dkd_accent_value: cityLootTheme.colors.purple })}
          </View>

          <View style={dkd_styles.dkd_filter_shell}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dkd_styles.dkd_period_list}>
              {dkd_period_options_value.map((dkd_period_value) => React.createElement(dkd_admin_period_chip, {
                key: dkd_period_value.dkd_key_value,
                dkd_icon_value: dkd_period_value.dkd_icon_value,
                dkd_label_value: dkd_period_value.dkd_label_value,
                dkd_active_value: dkd_period_key_value === dkd_period_value.dkd_key_value,
                dkd_on_press_value: () => dkd_set_period_key_value(dkd_period_value.dkd_key_value),
              }))}
            </ScrollView>
            <View style={dkd_styles.dkd_search_shell}>
              <MaterialCommunityIcons name="magnify" size={18} color={cityLootTheme.colors.textMuted} />
              <TextInput
                value={dkd_search_text_value}
                onChangeText={dkd_set_search_text_value}
                placeholder="Kurye adı, e-posta veya kullanıcı ID ara"
                placeholderTextColor={cityLootTheme.colors.textMuted}
                style={dkd_styles.dkd_search_input}
                returnKeyType="search"
                onSubmitEditing={dkd_load_rows_value}
              />
              <Pressable onPress={dkd_load_rows_value} style={dkd_styles.dkd_refresh_button}>
                <MaterialCommunityIcons name="refresh" size={18} color={cityLootTheme.colors.cyanSoft} />
              </Pressable>
            </View>
          </View>


          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dkd_styles.dkd_scroll_content}>
            {dkd_loading_value ? (
              <View style={dkd_styles.dkd_loading_box}>
                <ActivityIndicator color={cityLootTheme.colors.cyanSoft} />
                <Text style={dkd_styles.dkd_loading_text}>Kurye kazançları yükleniyor…</Text>
              </View>
            ) : null}

            {!dkd_loading_value && dkd_rows_value.length === 0 ? (
              <View style={dkd_styles.dkd_empty_box}>
                <MaterialCommunityIcons name="wallet-outline" size={34} color={cityLootTheme.colors.textMuted} />
                <Text style={dkd_styles.dkd_empty_title}>Kayıt bulunamadı</Text>
                <Text style={dkd_styles.dkd_empty_text}>Bu filtrede ödeme bekleyen veya geçmiş kazancı olan kurye görünmüyor.</Text>
              </View>
            ) : null}

            {!dkd_loading_value ? dkd_rows_value.map((dkd_row_value, dkd_index_value) => React.createElement(dkd_admin_payout_row, {
              key: String(dkd_row_value?.dkd_user_id || `dkd-row-${dkd_index_value}`),
              dkd_row_value,
              dkd_busy_value: dkd_saving_value,
              dkd_on_select_value: dkd_open_payment_editor_value,
            })) : null}
          </ScrollView>

          {dkd_selected_row_value ? (
            <View style={dkd_styles.dkd_payment_overlay}>
              <LinearGradient colors={['#101C30', '#08111F']} style={dkd_styles.dkd_payment_card}>
                <View style={dkd_styles.dkd_payment_header}>
                  <View>
                    <Text style={dkd_styles.dkd_payment_kicker}>ÖDEME KAYDI</Text>
                    <Text style={dkd_styles.dkd_payment_title}>{dkd_selected_row_value?.dkd_nickname || 'Kurye'}</Text>
                  </View>
                  <Pressable onPress={dkd_close_payment_editor_value} style={dkd_styles.dkd_payment_close}>
                    <MaterialCommunityIcons name="close" size={20} color={cityLootTheme.colors.text} />
                  </Pressable>
                </View>

                <View style={dkd_styles.dkd_payment_balance_box}>
                  <Text style={dkd_styles.dkd_payment_balance_label}>Mevcut ödenecek bakiye</Text>
                  <Text style={dkd_styles.dkd_payment_balance_value}>{dkd_money_text_value(dkd_selected_row_value?.dkd_courier_wallet_tl)}</Text>
                </View>

                <Text style={dkd_styles.dkd_input_label}>Ödenecek Tutar</Text>
                <TextInput
                  value={dkd_payment_amount_text_value}
                  onChangeText={dkd_set_payment_amount_text_value}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor={cityLootTheme.colors.textMuted}
                  style={dkd_styles.dkd_amount_input}
                />

                <Text style={dkd_styles.dkd_input_label}>Not</Text>
                <TextInput
                  value={dkd_payment_note_text_value}
                  onChangeText={dkd_set_payment_note_text_value}
                  placeholder="Ödeme açıklaması"
                  placeholderTextColor={cityLootTheme.colors.textMuted}
                  style={dkd_styles.dkd_note_input}
                />

                <View style={dkd_styles.dkd_payment_actions}>
                  <Pressable onPress={dkd_close_payment_editor_value} disabled={dkd_saving_value} style={dkd_styles.dkd_cancel_button}>
                    <Text style={dkd_styles.dkd_cancel_button_text}>Vazgeç</Text>
                  </Pressable>
                  <Pressable onPress={dkd_submit_payment_value} disabled={dkd_saving_value} style={[dkd_styles.dkd_confirm_button, dkd_saving_value && dkd_styles.dkd_pay_button_disabled]}>
                    {dkd_saving_value ? <ActivityIndicator color="#07111C" /> : <MaterialCommunityIcons name="check-decagram" size={18} color="#07111C" />}
                    <Text style={dkd_styles.dkd_confirm_button_text}>Ödemeyi Kaydet</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          ) : null}
        </LinearGradient>
      </View>
    </Modal>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_backdrop: {
    flex: 1,
    backgroundColor: 'rgba(1,5,10,0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  dkd_card: {
    width: '100%',
    maxWidth: 900,
    maxHeight: '96%',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 14,
    overflow: 'hidden',
  },
  dkd_glow_cyan: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(103,219,255,0.15)',
    top: -80,
    right: -70,
  },
  dkd_glow_gold: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: 'rgba(246,205,103,0.12)',
    bottom: -90,
    left: -70,
  },
  dkd_top_bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  dkd_top_text_wrap: { flex: 1, minWidth: 0, paddingRight: 4 },
  dkd_kicker: { color: cityLootTheme.colors.goldSoft, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  dkd_title: { color: cityLootTheme.colors.text, fontSize: 27, fontWeight: '900', marginTop: 4 },
  dkd_subtitle: { color: cityLootTheme.colors.textSoft, fontSize: 12, lineHeight: 17, marginTop: 7 },
  dkd_summary_grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  dkd_metric_card: {
    flexGrow: 1,
    flexBasis: '47%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 12,
    minHeight: 102,
  },
  dkd_metric_icon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dkd_metric_label: { color: cityLootTheme.colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  dkd_metric_value: { color: cityLootTheme.colors.text, fontSize: 17, fontWeight: '900', marginTop: 5 },
  dkd_filter_shell: {
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    padding: 10,
    marginTop: 12,
    gap: 9,
  },
  dkd_period_list: { gap: 8, paddingRight: 2 },
  dkd_period_chip: {
    minHeight: 39,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dkd_period_chip_active: { borderColor: 'rgba(255,232,169,0.55)', backgroundColor: 'rgba(246,205,103,0.14)' },
  dkd_period_chip_text: { color: cityLootTheme.colors.textMuted, fontSize: 12, fontWeight: '900' },
  dkd_period_chip_text_active: { color: cityLootTheme.colors.goldSoft },
  dkd_search_shell: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.20)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  dkd_search_input: { flex: 1, color: cityLootTheme.colors.text, fontSize: 13, fontWeight: '700', paddingVertical: 9 },
  dkd_refresh_button: { width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(103,219,255,0.10)' },
  dkd_info_bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,232,169,0.18)',
    backgroundColor: 'rgba(246,205,103,0.08)',
    padding: 10,
    marginTop: 10,
  },
  dkd_info_text: { flex: 1, color: cityLootTheme.colors.textSoft, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  dkd_scroll_content: { paddingTop: 12, paddingBottom: 16, gap: 10 },
  dkd_loading_box: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, gap: 10 },
  dkd_loading_text: { color: cityLootTheme.colors.textSoft, fontSize: 13, fontWeight: '800' },
  dkd_empty_box: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    alignItems: 'center',
    padding: 22,
    gap: 7,
  },
  dkd_empty_title: { color: cityLootTheme.colors.text, fontSize: 16, fontWeight: '900' },
  dkd_empty_text: { color: cityLootTheme.colors.textSoft, fontSize: 12, textAlign: 'center', lineHeight: 17 },
  dkd_row_card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  dkd_row_fill: { padding: 12, gap: 10 },
  dkd_row_header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dkd_avatar_shell: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(103,219,255,0.32)',
    backgroundColor: 'rgba(103,219,255,0.10)',
  },
  dkd_avatar_text: { fontSize: 22 },
  dkd_row_title_wrap: { flex: 1, minWidth: 0 },
  dkd_row_name: { color: cityLootTheme.colors.text, fontSize: 16, fontWeight: '900' },
  dkd_row_email: { color: cityLootTheme.colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  dkd_status_pill: { borderRadius: 999, backgroundColor: 'rgba(82,216,167,0.13)', borderWidth: 1, borderColor: 'rgba(82,216,167,0.28)', paddingHorizontal: 9, paddingVertical: 6 },
  dkd_status_text: { color: cityLootTheme.colors.green, fontSize: 10, fontWeight: '900' },
  dkd_money_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  dkd_money_box: { flexGrow: 1, flexBasis: '31%', borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.075)', padding: 9 },
  dkd_money_label: { color: cityLootTheme.colors.textMuted, fontSize: 10, fontWeight: '900' },
  dkd_money_value: { color: cityLootTheme.colors.text, fontSize: 13, fontWeight: '900', marginTop: 4 },
  dkd_period_summary_line: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  dkd_period_summary_text: { color: cityLootTheme.colors.textSoft, fontSize: 11, fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.055)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  dkd_warning_box: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, borderRadius: 15, padding: 9, backgroundColor: 'rgba(246,205,103,0.10)', borderWidth: 1, borderColor: 'rgba(246,205,103,0.20)' },
  dkd_warning_text: { flex: 1, color: cityLootTheme.colors.goldSoft, fontSize: 11, fontWeight: '800', lineHeight: 15 },
  dkd_row_footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dkd_user_id_text: { color: cityLootTheme.colors.textMuted, fontSize: 10, fontWeight: '800' },
  dkd_pay_button: { minHeight: 40, borderRadius: 999, backgroundColor: cityLootTheme.colors.goldSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 13 },
  dkd_pay_button_disabled: { opacity: 0.55 },
  dkd_pay_button_text: { color: '#07111C', fontSize: 12, fontWeight: '900' },
  dkd_pay_button_text_disabled: { color: cityLootTheme.colors.textMuted },
  dkd_payment_overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(1,5,10,0.72)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  dkd_payment_card: { width: '100%', maxWidth: 520, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', padding: 16, gap: 11 },
  dkd_payment_header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dkd_payment_kicker: { color: cityLootTheme.colors.goldSoft, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  dkd_payment_title: { color: cityLootTheme.colors.text, fontSize: 20, fontWeight: '900', marginTop: 3 },
  dkd_payment_close: { width: 38, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  dkd_payment_balance_box: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(82,216,167,0.26)', backgroundColor: 'rgba(82,216,167,0.10)', padding: 12 },
  dkd_payment_balance_label: { color: cityLootTheme.colors.textMuted, fontSize: 11, fontWeight: '900' },
  dkd_payment_balance_value: { color: cityLootTheme.colors.green, fontSize: 23, fontWeight: '900', marginTop: 4 },
  dkd_input_label: { color: cityLootTheme.colors.textSoft, fontSize: 12, fontWeight: '900' },
  dkd_amount_input: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(0,0,0,0.18)', color: cityLootTheme.colors.text, paddingHorizontal: 13, fontSize: 18, fontWeight: '900' },
  dkd_note_input: { minHeight: 45, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(0,0,0,0.18)', color: cityLootTheme.colors.text, paddingHorizontal: 13, fontSize: 13, fontWeight: '800' },
  dkd_payment_actions: { flexDirection: 'row', gap: 9, marginTop: 3 },
  dkd_cancel_button: { flex: 1, minHeight: 46, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.055)' },
  dkd_cancel_button_text: { color: cityLootTheme.colors.text, fontSize: 13, fontWeight: '900' },
  dkd_confirm_button: { flex: 1.4, minHeight: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: cityLootTheme.colors.goldSoft, flexDirection: 'row', gap: 8 },
  dkd_confirm_button_text: { color: '#07111C', fontSize: 13, fontWeight: '900' },
});
