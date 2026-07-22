import React, { useCallback as dkd_use_callback, useEffect as dkd_use_effect, useMemo as dkd_use_memo, useState as dkd_use_state } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SecondaryButton from '../../components/ui/SecondaryButton';
import { cityLootTheme } from '../../theme/cityLootTheme';
import {
  dkd_fetch_social_moderation_queue_value,
  dkd_update_social_moderation_report_value,
  getDBGFriendlyError,
} from '../../services/dbgService';

const dkd_status_options_value = Object.freeze([
  { dkd_key_value: 'dkd_open', dkd_title_value: 'Yeni', dkd_icon_value: 'bell-alert-outline' },
  { dkd_key_value: 'dkd_reviewing', dkd_title_value: 'İncelemede', dkd_icon_value: 'shield-search' },
  { dkd_key_value: 'dkd_resolved', dkd_title_value: 'Çözüldü', dkd_icon_value: 'shield-check-outline' },
  { dkd_key_value: 'dkd_dismissed', dkd_title_value: 'Kapatıldı', dkd_icon_value: 'archive-check-outline' },
  { dkd_key_value: 'dkd_all', dkd_title_value: 'Tümü', dkd_icon_value: 'view-dashboard-outline' },
]);

const dkd_reason_title_map_value = Object.freeze({
  dkd_spam: 'Spam / istenmeyen mesaj',
  dkd_harassment: 'Taciz / rahatsızlık',
  dkd_inappropriate_content: 'Uygunsuz içerik',
});

function dkd_format_datetime_value(dkd_input_value) {
  if (!dkd_input_value) return '-';
  try {
    return new Date(dkd_input_value).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

function dkd_pad_dbg_id_value(dkd_input_value) {
  if (dkd_input_value == null || dkd_input_value === '') return '—';
  const dkd_digits_value = String(dkd_input_value).replace(/\D/g, '');
  return dkd_digits_value ? dkd_digits_value.padStart(6, '0') : '—';
}

function dkd_reason_title_value(dkd_reason_key_value) {
  return dkd_reason_title_map_value[dkd_reason_key_value] || String(dkd_reason_key_value || 'Bilinmeyen rapor');
}

function DkdStatusChip(dkd_props_value) {
  const dkd_active_value = Boolean(dkd_props_value?.dkd_active_value);
  const dkd_option_value = dkd_props_value?.dkd_option_value || {};
  return (
    <Pressable
      onPress={dkd_props_value?.dkd_on_press_value}
      style={[dkd_styles.dkd_status_chip, dkd_active_value && dkd_styles.dkd_status_chip_active]}
    >
      <MaterialCommunityIcons name={dkd_option_value.dkd_icon_value || 'shield-outline'} size={16} color={dkd_active_value ? '#06111D' : cityLootTheme.colors.textSoft} />
      <Text style={[dkd_styles.dkd_status_chip_text, dkd_active_value && dkd_styles.dkd_status_chip_text_active]}>{dkd_option_value.dkd_title_value}</Text>
    </Pressable>
  );
}

function DkdReportCard(dkd_props_value) {
  const dkd_report_value = dkd_props_value?.dkd_report_value || {};
  const dkd_selected_value = String(dkd_props_value?.dkd_selected_id_value || '') === String(dkd_report_value?.dkd_id || '');
  return (
    <Pressable onPress={dkd_props_value?.dkd_on_press_value} style={[dkd_styles.dkd_report_card, dkd_selected_value && dkd_styles.dkd_report_card_active]}>
      <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']} style={StyleSheet.absoluteFillObject} />
      <View style={dkd_styles.dkd_report_card_top_row}>
        <View style={dkd_styles.dkd_report_icon_shell}>
          <MaterialCommunityIcons name="alert-octagon-outline" size={20} color="#FFD16C" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={dkd_styles.dkd_report_title}>{dkd_reason_title_value(dkd_report_value?.dkd_reason_key)}</Text>
          <Text style={dkd_styles.dkd_report_sub} numberOfLines={1}>Rapor #{dkd_report_value?.dkd_id} • {dkd_format_datetime_value(dkd_report_value?.dkd_created_at)}</Text>
        </View>
        <MaterialCommunityIcons name={dkd_selected_value ? 'chevron-up' : 'chevron-right'} size={22} color={cityLootTheme.colors.textMuted} />
      </View>
      <View style={dkd_styles.dkd_people_row}>
        <Text style={dkd_styles.dkd_people_text}>Bildiren: {dkd_report_value?.dkd_reporter_nickname || 'Oyuncu'} #{dkd_pad_dbg_id_value(dkd_report_value?.dkd_reporter_dbg_id)}</Text>
        <Text style={dkd_styles.dkd_people_text}>Şikayet edilen: {dkd_report_value?.dkd_reported_nickname || 'Oyuncu'} #{dkd_pad_dbg_id_value(dkd_report_value?.dkd_reported_dbg_id)}</Text>
      </View>
      {!!dkd_report_value?.dkd_detail_text ? <Text style={dkd_styles.dkd_detail_text} numberOfLines={3}>{dkd_report_value.dkd_detail_text}</Text> : null}
    </Pressable>
  );
}

export default function dkd_social_moderation_admin_modal(dkd_props_value) {
  const dkd_visible_value = Boolean(dkd_props_value?.visible);
  const dkd_on_close_value = dkd_props_value?.onClose;
  const [dkd_status_key_value, dkd_set_status_key_value] = dkd_use_state('dkd_open');
  const [dkd_reports_value, dkd_set_reports_value] = dkd_use_state([]);
  const [dkd_selected_report_value, dkd_set_selected_report_value] = dkd_use_state(null);
  const [dkd_note_text_value, dkd_set_note_text_value] = dkd_use_state('');
  const [dkd_loading_value, dkd_set_loading_value] = dkd_use_state(false);
  const [dkd_action_loading_value, dkd_set_action_loading_value] = dkd_use_state(false);
  const [dkd_error_text_value, dkd_set_error_text_value] = dkd_use_state('');

  const dkd_stats_value = dkd_use_memo(() => {
    const dkd_next_stats_value = {
      dkd_total_value: dkd_reports_value.length,
      dkd_open_value: 0,
      dkd_reviewing_value: 0,
      dkd_closed_value: 0,
    };

    dkd_reports_value.forEach((dkd_report_item_value) => {
      if (dkd_report_item_value?.dkd_status_key === 'dkd_reviewing') dkd_next_stats_value.dkd_reviewing_value += 1;
      else if (['dkd_resolved', 'dkd_dismissed'].includes(dkd_report_item_value?.dkd_status_key)) dkd_next_stats_value.dkd_closed_value += 1;
      else dkd_next_stats_value.dkd_open_value += 1;
    });

    return dkd_next_stats_value;
  }, [dkd_reports_value]);

  const dkd_load_queue_value = dkd_use_callback(async () => {
    dkd_set_loading_value(true);
    dkd_set_error_text_value('');

    const { data: dkd_queue_rows_value, error: dkd_queue_error_value } = await dkd_fetch_social_moderation_queue_value(dkd_status_key_value, 100);

    if (dkd_queue_error_value) {
      dkd_set_error_text_value(getDBGFriendlyError(dkd_queue_error_value));
      dkd_set_reports_value([]);
      dkd_set_selected_report_value(null);
    } else {
      const dkd_safe_rows_value = Array.isArray(dkd_queue_rows_value) ? dkd_queue_rows_value : [];
      dkd_set_reports_value(dkd_safe_rows_value);
      if (!dkd_selected_report_value && dkd_safe_rows_value.length > 0) {
        dkd_set_selected_report_value(dkd_safe_rows_value[0]);
        dkd_set_note_text_value(dkd_safe_rows_value[0]?.dkd_admin_note_text || '');
      }
    }

    dkd_set_loading_value(false);
  }, [dkd_selected_report_value, dkd_status_key_value]);

  dkd_use_effect(() => {
    if (dkd_visible_value) dkd_load_queue_value();
  }, [dkd_load_queue_value, dkd_visible_value]);

  const dkd_select_report_value = dkd_use_callback((dkd_report_item_value) => {
    dkd_set_selected_report_value(dkd_report_item_value);
    dkd_set_note_text_value(dkd_report_item_value?.dkd_admin_note_text || '');
  }, []);

  const dkd_update_status_value = dkd_use_callback(async (dkd_next_status_key_value) => {
    if (!dkd_selected_report_value?.dkd_id) {
      dkd_set_error_text_value('Önce bir moderasyon raporu seç.');
      return;
    }

    dkd_set_action_loading_value(true);
    dkd_set_error_text_value('');

    const { data: dkd_update_result_value, error: dkd_update_error_value } = await dkd_update_social_moderation_report_value(
      dkd_selected_report_value.dkd_id,
      dkd_next_status_key_value,
      dkd_note_text_value,
    );

    if (dkd_update_error_value) {
      dkd_set_error_text_value(getDBGFriendlyError(dkd_update_error_value));
    } else if (dkd_update_result_value?.ok === false) {
      dkd_set_error_text_value(getDBGFriendlyError(dkd_update_result_value?.reason || 'Durum güncellenemedi.'));
    } else {
      const dkd_updated_report_value = {
        ...dkd_selected_report_value,
        dkd_status_key: dkd_next_status_key_value,
        dkd_admin_note_text: dkd_note_text_value,
      };
      dkd_set_selected_report_value(dkd_updated_report_value);
      dkd_set_reports_value((dkd_previous_reports_value) => dkd_previous_reports_value.map((dkd_report_item_value) => (
        dkd_report_item_value.dkd_id === dkd_updated_report_value.dkd_id ? dkd_updated_report_value : dkd_report_item_value
      )));
    }

    dkd_set_action_loading_value(false);
  }, [dkd_note_text_value, dkd_selected_report_value]);

  const dkd_close_value = dkd_use_callback(() => {
    if (typeof dkd_on_close_value === 'function') dkd_on_close_value();
  }, [dkd_on_close_value]);

  return (
    <Modal visible={dkd_visible_value} transparent animationType="fade" onRequestClose={dkd_close_value}>
      <View style={dkd_styles.dkd_backdrop}>
        <LinearGradient colors={['#04101A', '#0B1426', '#090E18']} style={dkd_styles.dkd_card}>
          <View style={dkd_styles.dkd_glow_primary} />
          <View style={dkd_styles.dkd_glow_warning} />

          <View style={dkd_styles.dkd_top_bar}>
            <View style={dkd_styles.dkd_top_text_wrap}>
              <Text style={dkd_styles.dkd_kicker}>GOOGLE PLAY • UGC GÜVENLİK</Text>
              <Text style={dkd_styles.dkd_title}>Moderasyon Kuyruğu</Text>
              <Text style={dkd_styles.dkd_subtitle}>DM, sosyal ve arkadaşlık şikayetleri burada incelenir. Engelleme kullanıcı tarafında anında mesaj/istek akışını keser.</Text>
            </View>
            <SecondaryButton label="Kapat" onPress={dkd_close_value} size="compact" fullWidth={false} />
          </View>

          <View style={dkd_styles.dkd_stats_row}>
            <View style={dkd_styles.dkd_stat_card}><Text style={dkd_styles.dkd_stat_label}>TOPLAM</Text><Text style={dkd_styles.dkd_stat_value}>{dkd_stats_value.dkd_total_value}</Text></View>
            <View style={dkd_styles.dkd_stat_card}><Text style={dkd_styles.dkd_stat_label}>YENİ</Text><Text style={dkd_styles.dkd_stat_value}>{dkd_stats_value.dkd_open_value}</Text></View>
            <View style={dkd_styles.dkd_stat_card}><Text style={dkd_styles.dkd_stat_label}>İNCELEME</Text><Text style={dkd_styles.dkd_stat_value}>{dkd_stats_value.dkd_reviewing_value}</Text></View>
            <View style={dkd_styles.dkd_stat_card}><Text style={dkd_styles.dkd_stat_label}>KAPALI</Text><Text style={dkd_styles.dkd_stat_value}>{dkd_stats_value.dkd_closed_value}</Text></View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dkd_styles.dkd_filter_row}>
            {dkd_status_options_value.map((dkd_option_value) => (
              <DkdStatusChip
                key={dkd_option_value.dkd_key_value}
                dkd_option_value={dkd_option_value}
                dkd_active_value={dkd_status_key_value === dkd_option_value.dkd_key_value}
                dkd_on_press_value={() => {
                  dkd_set_status_key_value(dkd_option_value.dkd_key_value);
                  dkd_set_selected_report_value(null);
                }}
              />
            ))}
          </ScrollView>

          {dkd_error_text_value ? (
            <View style={dkd_styles.dkd_error_card}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FFD16C" />
              <Text style={dkd_styles.dkd_error_text}>{dkd_error_text_value}</Text>
            </View>
          ) : null}

          <View style={dkd_styles.dkd_body_grid}>
            <View style={dkd_styles.dkd_list_panel}>
              <View style={dkd_styles.dkd_panel_head_row}>
                <Text style={dkd_styles.dkd_panel_title}>Rapor listesi</Text>
                <SecondaryButton label="Yenile" icon="refresh" onPress={dkd_load_queue_value} size="compact" fullWidth={false} />
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dkd_styles.dkd_report_stack}>
                {dkd_loading_value ? (
                  <View style={dkd_styles.dkd_empty_state}><ActivityIndicator color={cityLootTheme.colors.cyanSoft} /><Text style={dkd_styles.dkd_empty_text}>Moderasyon kuyruğu yükleniyor…</Text></View>
                ) : dkd_reports_value.length ? dkd_reports_value.map((dkd_report_item_value) => (
                  <DkdReportCard
                    key={String(dkd_report_item_value?.dkd_id)}
                    dkd_report_value={dkd_report_item_value}
                    dkd_selected_id_value={dkd_selected_report_value?.dkd_id}
                    dkd_on_press_value={() => dkd_select_report_value(dkd_report_item_value)}
                  />
                )) : (
                  <View style={dkd_styles.dkd_empty_state}>
                    <MaterialCommunityIcons name="shield-check-outline" size={30} color={cityLootTheme.colors.green} />
                    <Text style={dkd_styles.dkd_empty_text}>Bu filtrede bekleyen rapor yok.</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            <View style={dkd_styles.dkd_detail_panel}>
              {dkd_selected_report_value ? (
                <>
                  <Text style={dkd_styles.dkd_panel_title}>Rapor detayı</Text>
                  <Text style={dkd_styles.dkd_detail_title}>{dkd_reason_title_value(dkd_selected_report_value?.dkd_reason_key)}</Text>
                  <Text style={dkd_styles.dkd_detail_meta}>Bildiren: {dkd_selected_report_value?.dkd_reporter_nickname || 'Oyuncu'} #{dkd_pad_dbg_id_value(dkd_selected_report_value?.dkd_reporter_dbg_id)}</Text>
                  <Text style={dkd_styles.dkd_detail_meta}>Şikayet edilen: {dkd_selected_report_value?.dkd_reported_nickname || 'Oyuncu'} #{dkd_pad_dbg_id_value(dkd_selected_report_value?.dkd_reported_dbg_id)}</Text>
                  <Text style={dkd_styles.dkd_detail_meta}>Tarih: {dkd_format_datetime_value(dkd_selected_report_value?.dkd_created_at)}</Text>
                  <Text style={dkd_styles.dkd_detail_body}>{dkd_selected_report_value?.dkd_detail_text || 'Kullanıcı detay mesajı eklemedi.'}</Text>

                  <TextInput
                    value={dkd_note_text_value}
                    onChangeText={dkd_set_note_text_value}
                    placeholder="Admin notu yaz…"
                    placeholderTextColor="rgba(255,255,255,0.36)"
                    multiline
                    style={dkd_styles.dkd_note_input}
                  />

                  <View style={dkd_styles.dkd_action_grid}>
                    <Pressable disabled={dkd_action_loading_value} onPress={() => dkd_update_status_value('dkd_reviewing')} style={dkd_styles.dkd_action_button}>
                      <MaterialCommunityIcons name="shield-search" size={17} color="#06111D" />
                      <Text style={dkd_styles.dkd_action_button_text}>İncelemede</Text>
                    </Pressable>
                    <Pressable disabled={dkd_action_loading_value} onPress={() => dkd_update_status_value('dkd_resolved')} style={[dkd_styles.dkd_action_button, dkd_styles.dkd_action_button_success]}>
                      <MaterialCommunityIcons name="shield-check-outline" size={17} color="#06111D" />
                      <Text style={dkd_styles.dkd_action_button_text}>Çözüldü</Text>
                    </Pressable>
                    <Pressable disabled={dkd_action_loading_value} onPress={() => dkd_update_status_value('dkd_dismissed')} style={[dkd_styles.dkd_action_button, dkd_styles.dkd_action_button_muted]}>
                      <MaterialCommunityIcons name="archive-check-outline" size={17} color="#F5FBFF" />
                      <Text style={[dkd_styles.dkd_action_button_text, dkd_styles.dkd_action_button_text_light]}>Kapat</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={dkd_styles.dkd_empty_state}>
                  <MaterialCommunityIcons name="cursor-default-click-outline" size={30} color={cityLootTheme.colors.cyanSoft} />
                  <Text style={dkd_styles.dkd_empty_text}>Detay görmek için bir rapor seç.</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,12,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  dkd_card: {
    width: '100%',
    maxWidth: 820,
    maxHeight: '94%',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
    overflow: 'hidden',
  },
  dkd_glow_primary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(103,227,255,0.13)',
    top: -60,
    right: -40,
  },
  dkd_glow_warning: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: 'rgba(255,209,108,0.11)',
    bottom: -30,
    left: -40,
  },
  dkd_top_bar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  dkd_top_text_wrap: { flex: 1, minWidth: 0, paddingRight: 6 },
  dkd_kicker: { color: cityLootTheme.colors.goldSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  dkd_title: { color: cityLootTheme.colors.text, fontSize: 27, fontWeight: '900', marginTop: 4 },
  dkd_subtitle: { color: cityLootTheme.colors.textSoft, fontSize: 13, lineHeight: 18, marginTop: 8 },
  dkd_stats_row: { flexDirection: 'row', gap: 8, marginTop: 14 },
  dkd_stat_card: {
    flex: 1,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dkd_stat_label: { color: cityLootTheme.colors.textMuted, fontSize: 10, fontWeight: '900' },
  dkd_stat_value: { color: cityLootTheme.colors.text, fontSize: 18, fontWeight: '900', marginTop: 5 },
  dkd_filter_row: { gap: 8, paddingTop: 14, paddingBottom: 6 },
  dkd_status_chip: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dkd_status_chip_active: { backgroundColor: cityLootTheme.colors.cyanSoft, borderColor: cityLootTheme.colors.cyanSoft },
  dkd_status_chip_text: { color: cityLootTheme.colors.textSoft, fontSize: 12, fontWeight: '900' },
  dkd_status_chip_text_active: { color: '#06111D' },
  dkd_error_card: {
    marginTop: 8,
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(255,209,108,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,209,108,0.24)',
    flexDirection: 'row',
    gap: 8,
  },
  dkd_error_text: { flex: 1, color: cityLootTheme.colors.text, fontWeight: '800', lineHeight: 18 },
  dkd_body_grid: { gap: 12, marginTop: 10 },
  dkd_list_panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(6,12,23,0.72)',
    padding: 12,
    maxHeight: 390,
  },
  dkd_detail_panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(6,12,23,0.72)',
    padding: 12,
  },
  dkd_panel_head_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dkd_panel_title: { color: cityLootTheme.colors.text, fontSize: 20, fontWeight: '900' },
  dkd_report_stack: { gap: 10, paddingTop: 10, paddingBottom: 8 },
  dkd_report_card: {
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  dkd_report_card_active: { borderColor: 'rgba(103,227,255,0.40)', backgroundColor: 'rgba(103,227,255,0.08)' },
  dkd_report_card_top_row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dkd_report_icon_shell: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,209,108,0.22)',
    backgroundColor: 'rgba(255,209,108,0.10)',
  },
  dkd_report_title: { color: cityLootTheme.colors.text, fontSize: 15, fontWeight: '900' },
  dkd_report_sub: { color: cityLootTheme.colors.textMuted, fontSize: 11, fontWeight: '800', marginTop: 3 },
  dkd_people_row: { marginTop: 10, gap: 4 },
  dkd_people_text: { color: cityLootTheme.colors.textSoft, fontSize: 12, fontWeight: '800' },
  dkd_detail_text: { color: cityLootTheme.colors.text, fontSize: 12, lineHeight: 18, marginTop: 9 },
  dkd_empty_state: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14 },
  dkd_empty_text: { color: cityLootTheme.colors.textSoft, fontWeight: '800', textAlign: 'center' },
  dkd_detail_title: { color: '#FFD16C', fontSize: 15, fontWeight: '900', marginTop: 12 },
  dkd_detail_meta: { color: cityLootTheme.colors.textSoft, fontSize: 12, fontWeight: '800', marginTop: 7 },
  dkd_detail_body: {
    color: cityLootTheme.colors.text,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dkd_note_input: {
    minHeight: 86,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(103,227,255,0.20)',
    color: cityLootTheme.colors.text,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    marginTop: 12,
    textAlignVertical: 'top',
    fontWeight: '800',
  },
  dkd_action_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  dkd_action_button: {
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFD16C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dkd_action_button_success: { backgroundColor: cityLootTheme.colors.green },
  dkd_action_button_muted: { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_action_button_text: { color: '#06111D', fontSize: 12, fontWeight: '900' },
  dkd_action_button_text_light: { color: cityLootTheme.colors.text },
});
