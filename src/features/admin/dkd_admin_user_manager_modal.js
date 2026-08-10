import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import {
  dkd_admin_delete_user_value,
  dkd_admin_fetch_user_detail_value,
  dkd_admin_search_users_value,
  dkd_admin_update_user_value,
} from '../../services/dkd_admin_user_service';
import { dkd_format_earnings_money_value, dkd_format_work_duration_value } from '../../services/dkd_courier_earnings_service';

function DkdField({ dkd_label_value, dkd_value, dkd_on_change_value, dkd_keyboard_type_value = 'default', dkd_multiline_value = false }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{dkd_label_value}</Text>
      <TextInput value={String(dkd_value ?? '')} onChangeText={dkd_on_change_value} keyboardType={dkd_keyboard_type_value} multiline={dkd_multiline_value} style={[styles.fieldInput, dkd_multiline_value && styles.fieldInputMultiline]} placeholderTextColor="rgba(230,241,255,.35)" />
    </View>
  );
}

function DkdMetric({ dkd_label_value, dkd_value, dkd_icon_value, dkd_tone_value }) {
  return (
    <LinearGradient colors={dkd_tone_value} style={styles.metricCard}>
      <View style={styles.metricIcon}><MaterialCommunityIcons name={dkd_icon_value} size={19} color="#FFF" /></View>
      <Text style={styles.metricLabel}>{dkd_label_value}</Text>
      <Text style={styles.metricValue}>{dkd_value}</Text>
    </LinearGradient>
  );
}

function DkdUserRow({ dkd_item_value, dkd_on_press_value }) {
  return (
    <Pressable onPress={dkd_on_press_value} style={({ pressed: dkd_pressed_value }) => [styles.userRow, dkd_pressed_value && { opacity: .82 }]}>
      <View style={styles.userAvatar}><MaterialCommunityIcons name={dkd_item_value?.dkd_is_admin ? 'shield-crown-outline' : 'account-outline'} size={23} color="#FFF" /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.userName} numberOfLines={1}>{dkd_item_value?.dkd_nickname || `${dkd_item_value?.dkd_first_name || ''} ${dkd_item_value?.dkd_last_name || ''}`.trim() || 'Kullanıcı'}</Text>
        <Text style={styles.userMeta} numberOfLines={1}>{dkd_item_value?.dkd_email || dkd_item_value?.dkd_phone || dkd_item_value?.dkd_user_id}</Text>
        <View style={styles.userPillRow}>
          <View style={styles.userPill}><Text style={styles.userPillText}>{String(dkd_item_value?.dkd_courier_status || 'user').toUpperCase()}</Text></View>
          {dkd_item_value?.dkd_plate_no ? <View style={styles.userPill}><Text style={styles.userPillText}>{dkd_item_value.dkd_plate_no}</Text></View> : null}
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#9DE8FF" />
    </Pressable>
  );
}

export default function DkdAdminUserManagerModal({ dkd_visible_value, dkd_on_close_value }) {
  const [dkd_search_value, dkd_set_search_value] = useState('');
  const [dkd_rows_value, dkd_set_rows_value] = useState([]);
  const [dkd_selected_user_id_value, dkd_set_selected_user_id_value] = useState(null);
  const [dkd_detail_value, dkd_set_detail_value] = useState(null);
  const [dkd_form_value, dkd_set_form_value] = useState({});
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_saving_value, dkd_set_saving_value] = useState(false);
  const [dkd_visible_user_count_value, dkd_set_visible_user_count_value] = useState(5);

  const dkd_load_users_value = useCallback(async () => {
    dkd_set_loading_value(true);
    try {
      const dkd_result_value = await dkd_admin_search_users_value(dkd_search_value, 100);
      if (dkd_result_value.error) throw dkd_result_value.error;
      dkd_set_rows_value(dkd_result_value.data || []);
      dkd_set_visible_user_count_value(5);
    } catch (dkd_error_value) {
      Alert.alert('Admin Kullanıcıları', dkd_error_value?.message || 'Kullanıcılar alınamadı.');
    } finally { dkd_set_loading_value(false); }
  }, [dkd_search_value]);

  const dkd_load_detail_value = useCallback(async (dkd_user_id_value) => {
    if (!dkd_user_id_value) return;
    dkd_set_loading_value(true);
    try {
      const dkd_result_value = await dkd_admin_fetch_user_detail_value(dkd_user_id_value);
      if (dkd_result_value.error) throw dkd_result_value.error;
      const dkd_data_value = dkd_result_value.data || {};
      const dkd_profile_value = dkd_data_value.dkd_profile || {};
      dkd_set_detail_value(dkd_data_value);
      dkd_set_form_value({
        dkd_email: dkd_data_value.dkd_email || '',
        dkd_phone: dkd_data_value.dkd_phone || '',
        nickname: dkd_profile_value.nickname || '',
        dbg_id: dkd_profile_value.dbg_id || '',
        dkd_country: dkd_profile_value.dkd_country || '',
        dkd_city: dkd_profile_value.dkd_city || dkd_profile_value.courier_city || '',
        dkd_region: dkd_profile_value.dkd_region || dkd_profile_value.courier_zone || '',
        courier_status: dkd_profile_value.courier_status || '',
        courier_vehicle_type: dkd_profile_value.courier_vehicle_type || '',
        courier_completed_jobs: String(dkd_profile_value.courier_completed_jobs ?? 0),
        courier_active_days: String(dkd_profile_value.courier_active_days ?? 0),
        courier_cancelled_jobs: String(dkd_profile_value.courier_cancelled_jobs ?? 0),
      });
    } catch (dkd_error_value) {
      Alert.alert('Kullanıcı', dkd_error_value?.message || 'Kullanıcı detayı alınamadı.');
    } finally { dkd_set_loading_value(false); }
  }, []);

  useEffect(() => {
    if (!dkd_visible_value) return;
    dkd_set_selected_user_id_value(null);
    dkd_set_detail_value(null);
    dkd_load_users_value();
  }, [dkd_visible_value, dkd_load_users_value]);

  useEffect(() => {
    if (!dkd_visible_value || dkd_selected_user_id_value) return undefined;
    const dkd_timer_value = setTimeout(() => dkd_load_users_value(), 350);
    return () => clearTimeout(dkd_timer_value);
  }, [dkd_visible_value, dkd_selected_user_id_value, dkd_search_value, dkd_load_users_value]);

  const dkd_set_field_value = useCallback((dkd_key_value, dkd_value) => {
    dkd_set_form_value((dkd_previous_value) => ({ ...dkd_previous_value, [dkd_key_value]: dkd_value }));
  }, []);

  const dkd_save_value = useCallback(async () => {
    if (!dkd_selected_user_id_value || dkd_saving_value) return;
    dkd_set_saving_value(true);
    try {
      const dkd_result_value = await dkd_admin_update_user_value(dkd_selected_user_id_value, dkd_form_value);
      if (dkd_result_value.error) throw dkd_result_value.error;
      Alert.alert('Kaydedildi', 'Kullanıcı bilgileri güncellendi.');
      await dkd_load_detail_value(dkd_selected_user_id_value);
    } catch (dkd_error_value) {
      Alert.alert('Güncelleme', dkd_error_value?.message || 'Kullanıcı güncellenemedi.');
    } finally { dkd_set_saving_value(false); }
  }, [dkd_selected_user_id_value, dkd_saving_value, dkd_form_value, dkd_load_detail_value]);

  const dkd_delete_value = useCallback(() => {
    if (!dkd_selected_user_id_value) return;
    Alert.alert('Kullanıcıyı tamamen sil', 'Bu işlem hesabı ve ilişkili DraBornGo verilerini kalıcı olarak kaldırır. Devam edilsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Tamamen Sil', style: 'destructive', onPress: async () => {
        dkd_set_saving_value(true);
        try {
          const dkd_result_value = await dkd_admin_delete_user_value(dkd_selected_user_id_value);
          if (dkd_result_value.error) throw dkd_result_value.error;
          dkd_set_selected_user_id_value(null);
          dkd_set_detail_value(null);
          await dkd_load_users_value();
          Alert.alert('Silindi', 'Kullanıcı DraBornGo sisteminden kaldırıldı.');
        } catch (dkd_error_value) { Alert.alert('Silme', dkd_error_value?.message || 'Kullanıcı silinemedi.'); }
        finally { dkd_set_saving_value(false); }
      } },
    ]);
  }, [dkd_selected_user_id_value, dkd_load_users_value]);

  const dkd_earnings_value = dkd_detail_value?.dkd_earnings || {};
  const dkd_period_cards_value = useMemo(() => [
    ['Günlük', dkd_earnings_value.daily, ['#0B6E79', '#174E8A']],
    ['Haftalık', dkd_earnings_value.weekly, ['#4D368F', '#6C327F']],
    ['Aylık', dkd_earnings_value.monthly, ['#805722', '#8E3854']],
  ], [dkd_earnings_value]);

  return (
    <Modal visible={Boolean(dkd_visible_value)} animationType="slide" onRequestClose={dkd_on_close_value}>
      <SafeScreen style={styles.screen}>
        <LinearGradient colors={['#020611', '#07182A', '#160D2A']} style={styles.screen}>
          <View style={styles.header}>
            <View style={styles.headerIcon}><MaterialCommunityIcons name="account-cog-outline" size={27} color="#06111B" /></View>
            <View style={{ flex: 1 }}><Text style={styles.kicker}>ADMIN • USER INTELLIGENCE</Text><Text style={styles.title}>Kullanıcı Yönetimi</Text><Text style={styles.sub}>Kullanıcı ara, tüm detaylarını incele, düzenle, kurye kazancını gör veya hesabı sil.</Text></View>
            <Pressable onPress={dkd_on_close_value} style={styles.close}><MaterialCommunityIcons name="close" size={23} color="#FFF" /></Pressable>
          </View>

          {!dkd_selected_user_id_value ? (
            <View style={{ flex: 1 }}>
              <View style={styles.searchShell}><MaterialCommunityIcons name="magnify" size={21} color="#8FEAFF" /><TextInput value={dkd_search_value} onChangeText={dkd_set_search_value} placeholder="Ad, e-posta, telefon, plaka, DBG ID veya UUID" placeholderTextColor="rgba(232,242,255,.42)" style={styles.searchInput} /></View>
              {dkd_loading_value ? <ActivityIndicator color="#7EEBFF" style={{ marginTop: 28 }} /> : <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {dkd_rows_value.slice(0, dkd_visible_user_count_value).map((dkd_item_value) => <DkdUserRow key={String(dkd_item_value.dkd_user_id)} dkd_item_value={dkd_item_value} dkd_on_press_value={() => { dkd_set_selected_user_id_value(dkd_item_value.dkd_user_id); dkd_load_detail_value(dkd_item_value.dkd_user_id); }} />)}
                {dkd_visible_user_count_value < dkd_rows_value.length ? <Pressable onPress={() => dkd_set_visible_user_count_value((dkd_previous_value) => dkd_previous_value + 5)} style={styles.moreButton}><MaterialCommunityIcons name="chevron-down" size={19} color="#06111B" /><Text style={styles.moreButtonText}>Daha Fazla • {Math.min(5, dkd_rows_value.length - dkd_visible_user_count_value)} kullanıcı daha</Text></Pressable> : null}
              </ScrollView>}
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Pressable onPress={() => { dkd_set_selected_user_id_value(null); dkd_set_detail_value(null); }} style={styles.backButton}><MaterialCommunityIcons name="arrow-left" size={18} color="#06111B" /><Text style={styles.backText}>Kullanıcı listesine dön</Text></Pressable>
              {dkd_loading_value && !dkd_detail_value ? <ActivityIndicator color="#7EEBFF" style={{ marginTop: 24 }} /> : <>
                <LinearGradient colors={['#0C3B5B', '#30245F', '#512A5B']} style={styles.identityCard}>
                  <View style={styles.identityIcon}><MaterialCommunityIcons name={dkd_detail_value?.dkd_is_admin ? 'shield-crown-outline' : 'account-star-outline'} size={28} color="#FFF" /></View>
                  <View style={{ flex: 1 }}><Text style={styles.identityName}>{dkd_form_value.nickname || 'Kullanıcı'}</Text><Text style={styles.identityId}>{dkd_selected_user_id_value}</Text><Text style={styles.identityMeta}>{dkd_detail_value?.dkd_email || '-'} • {dkd_detail_value?.dkd_phone || '-'}</Text></View>
                </LinearGradient>

                <Text style={styles.sectionTitle}>KURYE KAZANÇ TABLOSU</Text>
                <View style={styles.metricGrid}>{dkd_period_cards_value.map(([dkd_label_value, dkd_period_value, dkd_tone_value]) => <DkdMetric key={dkd_label_value} dkd_label_value={dkd_label_value} dkd_value={dkd_format_earnings_money_value(dkd_period_value?.dkd_earnings_tl)} dkd_icon_value="cash-multiple" dkd_tone_value={dkd_tone_value} />)}</View>
                <View style={styles.metricGrid}>
                  <DkdMetric dkd_label_value="Bugün Çalışma" dkd_value={dkd_format_work_duration_value(dkd_earnings_value?.daily?.dkd_online_seconds)} dkd_icon_value="timer-outline" dkd_tone_value={['#085D58', '#15405B']} />
                  <DkdMetric dkd_label_value="Saatlik Kazanç" dkd_value={dkd_format_earnings_money_value(dkd_earnings_value?.daily?.dkd_hourly_tl)} dkd_icon_value="speedometer" dkd_tone_value={['#5B3B87', '#3C356E']} />
                </View>

                <Text style={styles.sectionTitle}>HESAP VE PROFİL</Text>
                <View style={styles.formCard}>
                  <DkdField dkd_label_value="E-posta" dkd_value={dkd_form_value.dkd_email} dkd_on_change_value={(dkd_value) => dkd_set_field_value('dkd_email', dkd_value)} />
                  <DkdField dkd_label_value="Telefon" dkd_value={dkd_form_value.dkd_phone} dkd_on_change_value={(dkd_value) => dkd_set_field_value('dkd_phone', dkd_value)} />
                  <DkdField dkd_label_value="Kullanıcı adı" dkd_value={dkd_form_value.nickname} dkd_on_change_value={(dkd_value) => dkd_set_field_value('nickname', dkd_value)} />
                  <DkdField dkd_label_value="DBG ID" dkd_value={dkd_form_value.dbg_id} dkd_on_change_value={(dkd_value) => dkd_set_field_value('dbg_id', dkd_value)} />
                  <View style={styles.fieldRow}><DkdField dkd_label_value="Ülke" dkd_value={dkd_form_value.dkd_country} dkd_on_change_value={(dkd_value) => dkd_set_field_value('dkd_country', dkd_value)} /><DkdField dkd_label_value="Şehir" dkd_value={dkd_form_value.dkd_city} dkd_on_change_value={(dkd_value) => dkd_set_field_value('dkd_city', dkd_value)} /></View>
                  <DkdField dkd_label_value="Bölge" dkd_value={dkd_form_value.dkd_region} dkd_on_change_value={(dkd_value) => dkd_set_field_value('dkd_region', dkd_value)} />
                </View>

                <Text style={styles.sectionTitle}>KURYE PROFİLİ</Text>
                <View style={styles.formCard}>
                  <View style={styles.fieldRow}><DkdField dkd_label_value="Kurye Durumu" dkd_value={dkd_form_value.courier_status} dkd_on_change_value={(dkd_value) => dkd_set_field_value('courier_status', dkd_value)} /><DkdField dkd_label_value="Araç" dkd_value={dkd_form_value.courier_vehicle_type} dkd_on_change_value={(dkd_value) => dkd_set_field_value('courier_vehicle_type', dkd_value)} /></View>
                  <View style={styles.fieldRow}><DkdField dkd_label_value="Tamamlanan" dkd_value={dkd_form_value.courier_completed_jobs} dkd_on_change_value={(dkd_value) => dkd_set_field_value('courier_completed_jobs', dkd_value)} dkd_keyboard_type_value="number-pad" /><DkdField dkd_label_value="Aktif Gün" dkd_value={dkd_form_value.courier_active_days} dkd_on_change_value={(dkd_value) => dkd_set_field_value('courier_active_days', dkd_value)} dkd_keyboard_type_value="number-pad" /></View>
                  <DkdField dkd_label_value="İptal" dkd_value={dkd_form_value.courier_cancelled_jobs} dkd_on_change_value={(dkd_value) => dkd_set_field_value('courier_cancelled_jobs', dkd_value)} dkd_keyboard_type_value="number-pad" />
                </View>

                <View style={styles.actionRow}>
                  <Pressable disabled={dkd_saving_value} onPress={dkd_save_value} style={styles.saveButton}>{dkd_saving_value ? <ActivityIndicator color="#06111B" /> : <><MaterialCommunityIcons name="content-save-edit-outline" size={20} color="#06111B" /><Text style={styles.saveText}>Tüm Değişiklikleri Kaydet</Text></>}</Pressable>
                  <Pressable disabled={dkd_saving_value} onPress={dkd_delete_value} style={styles.deleteButton}><MaterialCommunityIcons name="delete-forever-outline" size={20} color="#FFDCE2" /><Text style={styles.deleteText}>Kullanıcıyı Sil</Text></Pressable>
                </View>
              </>}
            </ScrollView>
          )}
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020611' },
  header: { padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.08)' },
  headerIcon: { width: 54, height: 54, borderRadius: 19, backgroundColor: '#83E9FF', alignItems: 'center', justifyContent: 'center' },
  kicker: { color: '#80E8FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: '#FFF', fontSize: 27, fontWeight: '900', marginTop: 2 },
  sub: { color: 'rgba(233,243,255,.60)', fontSize: 10.5, lineHeight: 15, marginTop: 2, fontWeight: '700' },
  close: { width: 45, height: 45, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.11)', alignItems: 'center', justifyContent: 'center' },
  searchShell: { margin: 16, minHeight: 56, borderRadius: 19, backgroundColor: 'rgba(8,24,44,.88)', borderWidth: 1, borderColor: 'rgba(126,235,255,.15)', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 50 },
  moreButton: { minHeight: 52, borderRadius: 18, marginTop: 3, backgroundColor: '#86E9FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  moreButtonText: { color: '#06111B', fontSize: 11, fontWeight: '900' },
  userRow: { minHeight: 96, borderRadius: 23, backgroundColor: 'rgba(8,23,42,.88)', borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, marginBottom: 10 },
  userAvatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(75,139,233,.25)', alignItems: 'center', justifyContent: 'center' },
  userName: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  userMeta: { color: 'rgba(229,241,255,.58)', fontSize: 10.5, marginTop: 2 },
  userPillRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  userPill: { borderRadius: 999, backgroundColor: 'rgba(126,235,255,.10)', borderWidth: 1, borderColor: 'rgba(126,235,255,.16)', paddingHorizontal: 7, paddingVertical: 4 },
  userPillText: { color: '#A9EEFF', fontSize: 7.5, fontWeight: '900' },
  detailContent: { padding: 16, paddingBottom: 60 },
  backButton: { minHeight: 48, borderRadius: 17, backgroundColor: '#8FE9FF', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, marginBottom: 12 },
  backText: { color: '#06111B', fontSize: 11, fontWeight: '900' },
  identityCard: { borderRadius: 27, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' },
  identityIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.11)', alignItems: 'center', justifyContent: 'center' },
  identityName: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  identityId: { color: '#8FE9FF', fontSize: 8.5, marginTop: 3 },
  identityMeta: { color: 'rgba(233,243,255,.62)', fontSize: 10, marginTop: 3 },
  sectionTitle: { color: '#A9EEFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 20, marginBottom: 9 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 9 },
  metricCard: { width: '48%', minHeight: 108, borderRadius: 21, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.10)' },
  metricIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.11)', alignItems: 'center', justifyContent: 'center' },
  metricLabel: { color: 'rgba(244,249,255,.68)', fontSize: 9, fontWeight: '800', marginTop: 10 },
  metricValue: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 2 },
  formCard: { borderRadius: 24, padding: 13, backgroundColor: 'rgba(7,22,42,.80)', borderWidth: 1, borderColor: 'rgba(126,235,255,.11)' },
  fieldRow: { flexDirection: 'row', gap: 9 },
  fieldWrap: { flex: 1, marginBottom: 10 },
  fieldLabel: { color: 'rgba(224,239,255,.62)', fontSize: 9, fontWeight: '900', marginBottom: 5 },
  fieldInput: { minHeight: 48, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)', paddingHorizontal: 11, color: '#FFF', fontSize: 12, fontWeight: '700' },
  fieldInputMultiline: { minHeight: 82, paddingTop: 11, textAlignVertical: 'top' },
  actionRow: { marginTop: 18, gap: 9 },
  saveButton: { minHeight: 58, borderRadius: 19, backgroundColor: '#82ECFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { color: '#06111B', fontSize: 13, fontWeight: '900' },
  deleteButton: { minHeight: 54, borderRadius: 19, backgroundColor: 'rgba(123,37,57,.68)', borderWidth: 1, borderColor: 'rgba(255,126,149,.20)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteText: { color: '#FFDCE2', fontSize: 12, fontWeight: '900' },
});
