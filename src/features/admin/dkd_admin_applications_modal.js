import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import {
  dkd_approve_account_deletion_request_value,
  dkd_fetch_admin_account_deletion_requests_value,
  dkd_reject_account_deletion_request_value,
} from '../../services/dkd_account_deletion_service';

function dkd_clean_text_value(dkd_value, dkd_fallback_value = '') {
  const dkd_text_value = String(dkd_value ?? '').trim();
  return dkd_text_value || dkd_fallback_value;
}

function dkd_mask_national_id_value(dkd_value) {
  const dkd_digits_value = String(dkd_value || '').replace(/\D/g, '');
  if (dkd_digits_value.length < 7) return dkd_digits_value || 'Belirtilmedi';
  return `${dkd_digits_value.slice(0, 3)}••••${dkd_digits_value.slice(-4)}`;
}

function dkd_format_date_value(dkd_value) {
  if (!dkd_value) return 'Tarih yok';
  try {
    return new Date(dkd_value).toLocaleString('tr-TR');
  } catch {
    return String(dkd_value);
  }
}

function DkdCourierApplicationCard({ dkd_row_value, dkd_on_review_value }) {
  const dkd_payload_value = dkd_row_value?.payload && typeof dkd_row_value.payload === 'object' ? dkd_row_value.payload : {};
  const dkd_first_name_value = dkd_clean_text_value(dkd_row_value?.first_name || dkd_payload_value?.firstName);
  const dkd_last_name_value = dkd_clean_text_value(dkd_row_value?.last_name || dkd_payload_value?.lastName);
  const dkd_full_name_value = `${dkd_first_name_value} ${dkd_last_name_value}`.trim()
    || dkd_clean_text_value(dkd_row_value?.full_name || dkd_row_value?.name, 'Kurye Adayı');
  const dkd_email_value = dkd_clean_text_value(dkd_row_value?.email || dkd_payload_value?.email, 'E-posta belirtilmedi');
  const dkd_phone_value = dkd_clean_text_value(dkd_row_value?.phone || dkd_payload_value?.phone, 'Telefon belirtilmedi');
  const dkd_country_value = dkd_clean_text_value(dkd_row_value?.dkd_country || dkd_payload_value?.dkd_country, 'Türkiye');
  const dkd_city_value = dkd_clean_text_value(dkd_row_value?.city || dkd_payload_value?.city);
  const dkd_zone_value = dkd_clean_text_value(dkd_row_value?.zone || dkd_payload_value?.zone);
  const dkd_vehicle_value = dkd_clean_text_value(dkd_row_value?.vehicle_type || dkd_payload_value?.vehicleType, 'Araç belirtilmedi');
  const dkd_plate_value = dkd_clean_text_value(dkd_row_value?.plate_no || dkd_payload_value?.plateNo, 'Plaka belirtilmedi');
  const dkd_national_id_value = dkd_mask_national_id_value(dkd_row_value?.national_id || dkd_payload_value?.nationalId);
  const dkd_address_value = dkd_clean_text_value(dkd_row_value?.address_text || dkd_payload_value?.addressText);
  const dkd_emergency_name_value = dkd_clean_text_value(dkd_row_value?.emergency_name || dkd_payload_value?.emergencyName);
  const dkd_emergency_phone_value = dkd_clean_text_value(dkd_row_value?.emergency_phone || dkd_payload_value?.emergencyPhone);
  const dkd_user_id_value = dkd_clean_text_value(dkd_row_value?.user_id || dkd_row_value?.applicant_user_id || dkd_row_value?.dkd_user_id, '—');
  const dkd_status_value = dkd_clean_text_value(dkd_row_value?.status, 'pending');
  const dkd_region_text_value = [dkd_country_value, dkd_city_value, dkd_zone_value].filter(Boolean).join(' / ');

  return (
    <View style={dkd_styles_value.card}>
      <View style={dkd_styles_value.courierHead}>
        <View style={dkd_styles_value.courierAvatar}>
          <Text style={dkd_styles_value.courierAvatarText}>{dkd_full_name_value.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={dkd_styles_value.cardTitle} numberOfLines={2}>{dkd_full_name_value}</Text>
          <Text style={dkd_styles_value.courierEmail} numberOfLines={1}>{dkd_email_value}</Text>
        </View>
        <View style={[dkd_styles_value.statusPill, dkd_status_value === 'approved' && dkd_styles_value.statusPillApproved, dkd_status_value === 'rejected' && dkd_styles_value.statusPillRejected]}>
          <Text style={dkd_styles_value.statusPillText}>{dkd_status_value.toUpperCase()}</Text>
        </View>
      </View>

      <View style={dkd_styles_value.detailGrid}>
        <View style={dkd_styles_value.detailCell}>
          <Text style={dkd_styles_value.detailLabel}>TELEFON</Text>
          <Text style={dkd_styles_value.detailValue}>{dkd_phone_value}</Text>
        </View>
        <View style={dkd_styles_value.detailCell}>
          <Text style={dkd_styles_value.detailLabel}>TC KİMLİK</Text>
          <Text style={dkd_styles_value.detailValue}>{dkd_national_id_value}</Text>
        </View>
        <View style={dkd_styles_value.detailCell}>
          <Text style={dkd_styles_value.detailLabel}>BÖLGE</Text>
          <Text style={dkd_styles_value.detailValue}>{dkd_region_text_value || 'Belirtilmedi'}</Text>
        </View>
        <View style={dkd_styles_value.detailCell}>
          <Text style={dkd_styles_value.detailLabel}>ARAÇ / PLAKA</Text>
          <Text style={dkd_styles_value.detailValue}>{dkd_vehicle_value} • {dkd_plate_value}</Text>
        </View>
      </View>

      {dkd_address_value ? (
        <View style={dkd_styles_value.fullDetailRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={15} color="#7EEBFF" />
          <View style={{ flex: 1 }}><Text style={dkd_styles_value.detailLabel}>ADRES</Text><Text style={dkd_styles_value.fullDetailText}>{dkd_address_value}</Text></View>
        </View>
      ) : null}

      {dkd_emergency_name_value || dkd_emergency_phone_value ? (
        <View style={dkd_styles_value.fullDetailRow}>
          <MaterialCommunityIcons name="phone-alert-outline" size={15} color="#FFD782" />
          <View style={{ flex: 1 }}><Text style={dkd_styles_value.detailLabel}>ACİL DURUM</Text><Text style={dkd_styles_value.fullDetailText}>{[dkd_emergency_name_value, dkd_emergency_phone_value].filter(Boolean).join(' • ')}</Text></View>
        </View>
      ) : null}

      <Text style={dkd_styles_value.cardSub}>Kullanıcı ID: {dkd_user_id_value}</Text>
      <Text style={dkd_styles_value.cardSub}>Başvuru: {dkd_format_date_value(dkd_row_value?.created_at)}</Text>

      <View style={dkd_styles_value.actions}>
        <Pressable onPress={() => dkd_on_review_value(dkd_row_value, 'approved')} style={dkd_styles_value.approve}><Text style={dkd_styles_value.approveText}>Onayla</Text></Pressable>
        <Pressable onPress={() => dkd_on_review_value(dkd_row_value, 'rejected')} style={dkd_styles_value.reject}><Text style={dkd_styles_value.rejectText}>Reddet</Text></Pressable>
      </View>
    </View>
  );
}

export default function DkdAdminApplicationsModal({ visible, onClose }) {
  const [dkd_courier_rows_value, dkd_set_courier_rows_value] = useState([]);
  const [dkd_delete_rows_value, dkd_set_delete_rows_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);

  const dkd_load_value = useCallback(async () => {
    dkd_set_loading_value(true);
    const [dkd_courier_result_value, dkd_delete_result_value] = await Promise.all([
      supabase.from('dkd_courier_license_applications').select('*').order('created_at', { ascending: false }).limit(100),
      dkd_fetch_admin_account_deletion_requests_value(),
    ]);
    dkd_set_courier_rows_value(Array.isArray(dkd_courier_result_value?.data) ? dkd_courier_result_value.data : []);
    dkd_set_delete_rows_value(Array.isArray(dkd_delete_result_value?.dkd_data_value) ? dkd_delete_result_value.dkd_data_value : []);
    dkd_set_loading_value(false);
  }, []);

  useEffect(() => {
    if (visible) dkd_load_value();
  }, [visible, dkd_load_value]);

  const dkd_review_courier_value = useCallback(async (dkd_row_value, dkd_status_value) => {
    const dkd_id_value = dkd_row_value?.id;
    const dkd_user_id_value = dkd_row_value?.user_id || dkd_row_value?.applicant_user_id || dkd_row_value?.dkd_user_id;
    if (!dkd_id_value) return;
    const dkd_update_value = await supabase.from('dkd_courier_license_applications').update({ status: dkd_status_value }).eq('id', dkd_id_value);
    if (dkd_update_value?.error) return Alert.alert('Başvurular', dkd_update_value.error.message);
    if (dkd_user_id_value) await supabase.from('dkd_profiles').update({ courier_status: dkd_status_value }).eq('user_id', dkd_user_id_value);
    dkd_load_value();
  }, [dkd_load_value]);

  const dkd_approve_delete_value = useCallback(async (dkd_row_value) => {
    const dkd_result_value = await dkd_approve_account_deletion_request_value({ dkd_request_id_value: dkd_row_value?.dkd_id_value });
    if (dkd_result_value?.dkd_error_value) Alert.alert('Hesap Silme', dkd_result_value.dkd_error_value.message);
    else dkd_load_value();
  }, [dkd_load_value]);

  const dkd_reject_delete_value = useCallback(async (dkd_row_value) => {
    const dkd_result_value = await dkd_reject_account_deletion_request_value({ dkd_request_id_value: dkd_row_value?.dkd_id_value });
    if (dkd_result_value?.dkd_error_value) Alert.alert('Hesap Silme', dkd_result_value.dkd_error_value.message);
    else dkd_load_value();
  }, [dkd_load_value]);

  return (
    <Modal visible={Boolean(visible)} animationType="slide" onRequestClose={onClose}>
      <View style={dkd_styles_value.screen}>
        <View style={dkd_styles_value.header}>
          <View style={{ flex: 1 }}>
            <Text style={dkd_styles_value.kicker}>ADMIN</Text>
            <Text style={dkd_styles_value.title}>Başvurular</Text>
            <Text style={dkd_styles_value.sub}>Kurye lisansı ve hesap silme taleplerini yönet.</Text>
          </View>
          <Pressable onPress={onClose} style={dkd_styles_value.close}><MaterialCommunityIcons name="close" size={22} color="#FFF" /></Pressable>
        </View>
        <ScrollView contentContainerStyle={dkd_styles_value.content}>
          {dkd_loading_value ? <ActivityIndicator color="#7EEBFF" /> : null}
          <Text style={dkd_styles_value.section}>KURYE BAŞVURULARI</Text>
          {dkd_courier_rows_value.length ? dkd_courier_rows_value.map((dkd_row_value) => (
            <DkdCourierApplicationCard key={String(dkd_row_value.id)} dkd_row_value={dkd_row_value} dkd_on_review_value={dkd_review_courier_value} />
          )) : <Text style={dkd_styles_value.empty}>Kurye başvurusu yok.</Text>}

          <Text style={dkd_styles_value.section}>HESAP SİLME TALEPLERİ</Text>
          {dkd_delete_rows_value.length ? dkd_delete_rows_value.map((dkd_row_value) => (
            <View key={String(dkd_row_value.dkd_id_value)} style={dkd_styles_value.card}>
              <Text style={dkd_styles_value.cardTitle}>{dkd_row_value.dkd_display_name_value || dkd_row_value.dkd_user_email_value || 'Kullanıcı'}</Text>
              <Text style={dkd_styles_value.cardSub}>Durum: {dkd_row_value.dkd_status_value || 'pending'}</Text>
              {dkd_row_value.dkd_status_value === 'pending' ? <View style={dkd_styles_value.actions}>
                <Pressable onPress={() => dkd_approve_delete_value(dkd_row_value)} style={dkd_styles_value.reject}><Text style={dkd_styles_value.rejectText}>Silme Onayı</Text></Pressable>
                <Pressable onPress={() => dkd_reject_delete_value(dkd_row_value)} style={dkd_styles_value.neutral}><Text style={dkd_styles_value.neutralText}>Talebi Reddet</Text></Pressable>
              </View> : null}
            </View>
          )) : <Text style={dkd_styles_value.empty}>Bekleyen hesap silme talebi yok.</Text>}
        </ScrollView>
      </View>
    </Modal>
  );
}

const dkd_styles_value = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050B18' },
  header: { padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' },
  kicker: { color: '#7EEBFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#FFF', fontSize: 29, fontWeight: '900', marginTop: 4 },
  sub: { color: 'rgba(231,241,255,.65)', fontSize: 12, marginTop: 5 },
  close: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 45 },
  section: { color: '#A9EEFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginTop: 12, marginBottom: 7 },
  card: { marginBottom: 10, borderRadius: 20, padding: 14, backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)' },
  cardTitle: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  cardSub: { color: 'rgba(231,241,255,.60)', fontSize: 9.5, lineHeight: 14, marginTop: 5 },
  courierHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  courierAvatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(126,235,255,.14)', borderWidth: 1, borderColor: 'rgba(126,235,255,.20)', alignItems: 'center', justifyContent: 'center' },
  courierAvatarText: { color: '#BDF5FF', fontSize: 18, fontWeight: '900' },
  courierEmail: { color: '#8BEAFF', fontSize: 10.5, fontWeight: '800', marginTop: 3 },
  statusPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: 'rgba(255,210,116,.10)', borderWidth: 1, borderColor: 'rgba(255,210,116,.20)' },
  statusPillApproved: { backgroundColor: 'rgba(99,231,177,.10)', borderColor: 'rgba(99,231,177,.20)' },
  statusPillRejected: { backgroundColor: 'rgba(255,108,136,.10)', borderColor: 'rgba(255,108,136,.20)' },
  statusPillText: { color: '#DFF8FF', fontSize: 8, fontWeight: '900', letterSpacing: .7 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  detailCell: { width: '48%', minHeight: 62, borderRadius: 14, padding: 9, backgroundColor: 'rgba(4,16,31,.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  detailLabel: { color: 'rgba(218,238,255,.45)', fontSize: 7.5, fontWeight: '900', letterSpacing: .7 },
  detailValue: { color: '#FFFFFF', fontSize: 10, lineHeight: 14, fontWeight: '800', marginTop: 5 },
  fullDetailRow: { minHeight: 50, borderRadius: 14, padding: 10, marginTop: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(4,16,31,.32)', borderWidth: 1, borderColor: 'rgba(255,255,255,.06)' },
  fullDetailText: { color: '#FFFFFF', fontSize: 9.8, lineHeight: 14, fontWeight: '700', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  approve: { flex: 1, minHeight: 43, borderRadius: 14, backgroundColor: '#75E9B5', alignItems: 'center', justifyContent: 'center' },
  approveText: { color: '#031019', fontWeight: '900' },
  reject: { flex: 1, minHeight: 43, borderRadius: 14, backgroundColor: 'rgba(255,105,130,.18)', alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: '#FFD7E0', fontWeight: '900' },
  neutral: { flex: 1, minHeight: 43, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  neutralText: { color: '#FFF', fontWeight: '900' },
  empty: { color: 'rgba(231,241,255,.55)', fontSize: 12, marginBottom: 14 },
});
