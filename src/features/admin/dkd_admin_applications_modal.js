import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import {
  dkd_approve_account_deletion_request_value,
  dkd_fetch_admin_account_deletion_requests_value,
  dkd_reject_account_deletion_request_value,
} from '../../services/dkd_account_deletion_service';

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
            <View key={String(dkd_row_value.id)} style={dkd_styles_value.card}>
              <Text style={dkd_styles_value.cardTitle}>{dkd_row_value.full_name || dkd_row_value.name || dkd_row_value.user_id || 'Kurye Adayı'}</Text>
              <Text style={dkd_styles_value.cardSub}>Durum: {dkd_row_value.status || 'pending'}</Text>
              <View style={dkd_styles_value.actions}>
                <Pressable onPress={() => dkd_review_courier_value(dkd_row_value, 'approved')} style={dkd_styles_value.approve}><Text style={dkd_styles_value.approveText}>Onayla</Text></Pressable>
                <Pressable onPress={() => dkd_review_courier_value(dkd_row_value, 'rejected')} style={dkd_styles_value.reject}><Text style={dkd_styles_value.rejectText}>Reddet</Text></Pressable>
              </View>
            </View>
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
  cardSub: { color: 'rgba(231,241,255,.60)', fontSize: 11, marginTop: 5 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  approve: { flex: 1, minHeight: 43, borderRadius: 14, backgroundColor: '#75E9B5', alignItems: 'center', justifyContent: 'center' },
  approveText: { color: '#031019', fontWeight: '900' },
  reject: { flex: 1, minHeight: 43, borderRadius: 14, backgroundColor: 'rgba(255,105,130,.18)', alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: '#FFD7E0', fontWeight: '900' },
  neutral: { flex: 1, minHeight: 43, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  neutralText: { color: '#FFF', fontWeight: '900' },
  empty: { color: 'rgba(231,241,255,.55)', fontSize: 12, marginBottom: 14 },
});
