import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import {
  dkd_create_service_network_request_value,
  dkd_delete_completed_service_network_order_value,
  dkd_fetch_service_network_my_orders_value,
} from '../../services/dkd_service_network_service';

export const dkd_service_network_category_groups_value = [
  { dkd_key_value: 'home', dkd_title_value: 'Ev & Yaşam', dkd_icon_value: 'home-heart', dkd_categories_value: ['Ev İçi Yardım', 'Temizlik', 'Montaj', 'Günlük Yardım'] },
  { dkd_key_value: 'technical', dkd_title_value: 'Tamir & Teknik', dkd_icon_value: 'tools', dkd_categories_value: ['Elektrik', 'Su Tesisatı', 'Beyaz Eşya', 'Teknik Servis'] },
  { dkd_key_value: 'vehicle', dkd_title_value: 'Araç Destek', dkd_icon_value: 'car-wrench', dkd_categories_value: ['Akü Desteği', 'Lastik Desteği', 'Yol Yardımı', 'Araç Kontrolü'] },
  { dkd_key_value: 'special', dkd_title_value: 'Özel Teslimat', dkd_icon_value: 'package-variant-closed', dkd_categories_value: ['Belge Teslimatı', 'Paket Teslimatı', 'Emanet Teslimatı', 'Özel Görev'] },
];

const dkd_terminal_status_values = new Set(['completed', 'delivered', 'done', 'finished', 'cancelled', 'canceled', 'rejected', 'closed']);
function dkd_text_value(dkd_value) { return String(dkd_value || '').trim(); }
function dkd_slug_value(dkd_value) {
  return dkd_text_value(dkd_value).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export default function DkdServiceNetworkModal({ dkd_visible_value, dkd_on_close_value, dkd_current_location_value, dkd_on_profile_press_value }) {
  const [dkd_selected_group_value, dkd_set_selected_group_value] = useState(null);
  const [dkd_selected_category_value, dkd_set_selected_category_value] = useState('');
  const [dkd_address_value, dkd_set_address_value] = useState('');
  const [dkd_note_value, dkd_set_note_value] = useState('');
  const [dkd_schedule_value, dkd_set_schedule_value] = useState('');
  const [dkd_budget_value, dkd_set_budget_value] = useState('');
  const [dkd_contact_value, dkd_set_contact_value] = useState('');
  const [dkd_rows_value, dkd_set_rows_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_busy_value, dkd_set_busy_value] = useState(false);

  const dkd_can_submit_value = Boolean(dkd_selected_group_value && dkd_selected_category_value && dkd_address_value.trim().length >= 6 && dkd_note_value.trim().length >= 3);
  const dkd_group_title_value = useMemo(() => dkd_selected_group_value?.dkd_title_value || 'Kategori seç', [dkd_selected_group_value]);

  const dkd_load_value = useCallback(async () => {
    dkd_set_loading_value(true);
    const dkd_result_value = await dkd_fetch_service_network_my_orders_value(40);
    if (!dkd_result_value?.error) dkd_set_rows_value(dkd_result_value.data || []);
    dkd_set_loading_value(false);
  }, []);

  useEffect(() => {
    if (dkd_visible_value) dkd_load_value();
  }, [dkd_visible_value, dkd_load_value]);

  const dkd_submit_value = useCallback(async () => {
    if (!dkd_can_submit_value || dkd_busy_value) return;
    dkd_set_busy_value(true);
    try {
      const dkd_result_value = await dkd_create_service_network_request_value({
        dkd_group_key: dkd_selected_group_value.dkd_key_value,
        dkd_group_title: dkd_selected_group_value.dkd_title_value,
        dkd_category_key: dkd_slug_value(dkd_selected_category_value),
        dkd_category_title: dkd_selected_category_value,
        dkd_address_text: dkd_address_value,
        dkd_delivery_text: dkd_address_value,
        dkd_note_text: dkd_note_value,
        dkd_schedule_text: dkd_schedule_value,
        dkd_budget_text: dkd_budget_value,
        dkd_contact_text: dkd_contact_value,
        dkd_lat: dkd_current_location_value?.lat,
        dkd_lng: dkd_current_location_value?.lng,
      });
      if (dkd_result_value?.error) throw dkd_result_value.error;
      dkd_set_note_value('');
      dkd_set_schedule_value('');
      dkd_set_budget_value('');
      Alert.alert('Hizmet Ağı', 'Talebin oluşturuldu ve görev akışına gönderildi.');
      await dkd_load_value();
    } catch (dkd_error_value) {
      Alert.alert('Hizmet Ağı', dkd_error_value?.message || 'Talep oluşturulamadı.');
    } finally {
      dkd_set_busy_value(false);
    }
  }, [dkd_address_value, dkd_budget_value, dkd_busy_value, dkd_can_submit_value, dkd_contact_value, dkd_current_location_value?.lat, dkd_current_location_value?.lng, dkd_load_value, dkd_note_value, dkd_schedule_value, dkd_selected_category_value, dkd_selected_group_value]);

  const dkd_delete_value = useCallback(async (dkd_row_value) => {
    const dkd_status_value = dkd_text_value(dkd_row_value?.dkd_status).toLowerCase();
    if (!dkd_terminal_status_values.has(dkd_status_value)) return;
    const dkd_result_value = await dkd_delete_completed_service_network_order_value({
      dkd_source_type: dkd_row_value?.dkd_source_type,
      dkd_source_id: dkd_row_value?.dkd_source_id,
    });
    if (dkd_result_value?.error) Alert.alert('Hizmet Ağı', dkd_result_value.error.message || 'Kayıt silinemedi.');
    else dkd_load_value();
  }, [dkd_load_value]);

  return (
    <Modal visible={Boolean(dkd_visible_value)} animationType="slide" onRequestClose={dkd_on_close_value}>
      <StatusBar barStyle="light-content" />
      <SafeScreen style={dkd_styles_value.screen}>
        <LinearGradient colors={['#030914', '#071D2F', '#151035']} style={dkd_styles_value.screen}>
          <View style={dkd_styles_value.header}>
            <View style={{ flex: 1 }}>
              <Text style={dkd_styles_value.kicker}>DKD ŞEHİR SERVİSLERİ</Text>
              <Text style={dkd_styles_value.title}>Hizmet Ağı</Text>
              <Text style={dkd_styles_value.sub}>Şehir içi hizmet ve özel teslimat talebini tek merkezden oluştur.</Text>
            </View>
            <Pressable onPress={dkd_on_close_value} style={dkd_styles_value.close}><MaterialCommunityIcons name="close" size={22} color="#FFF" /></Pressable>
          </View>

          <ScrollView contentContainerStyle={dkd_styles_value.content} keyboardShouldPersistTaps="handled">
            <Text style={dkd_styles_value.section}>HİZMET GRUPLARI</Text>
            <View style={dkd_styles_value.grid}>
              {dkd_service_network_category_groups_value.map((dkd_group_value) => (
                <Pressable key={dkd_group_value.dkd_key_value} onPress={() => { dkd_set_selected_group_value(dkd_group_value); dkd_set_selected_category_value(''); }} style={[dkd_styles_value.group, dkd_selected_group_value?.dkd_key_value === dkd_group_value.dkd_key_value && dkd_styles_value.groupActive]}>
                  <MaterialCommunityIcons name={dkd_group_value.dkd_icon_value} size={24} color="#7EEBFF" />
                  <Text style={dkd_styles_value.groupTitle}>{dkd_group_value.dkd_title_value}</Text>
                </Pressable>
              ))}
            </View>

            {dkd_selected_group_value ? (
              <View style={dkd_styles_value.card}>
                <Text style={dkd_styles_value.cardTitle}>{dkd_group_title_value}</Text>
                <View style={dkd_styles_value.chips}>
                  {dkd_selected_group_value.dkd_categories_value.map((dkd_category_value) => (
                    <Pressable key={dkd_category_value} onPress={() => dkd_set_selected_category_value(dkd_category_value)} style={[dkd_styles_value.chip, dkd_selected_category_value === dkd_category_value && dkd_styles_value.chipActive]}>
                      <Text style={[dkd_styles_value.chipText, dkd_selected_category_value === dkd_category_value && { color: '#031019' }]}>{dkd_category_value}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput value={dkd_address_value} onChangeText={dkd_set_address_value} placeholder="Hizmet / alım adresi" placeholderTextColor="rgba(230,240,255,.42)" style={dkd_styles_value.input} />
                <TextInput value={dkd_note_value} onChangeText={dkd_set_note_value} placeholder="Talep detayı" placeholderTextColor="rgba(230,240,255,.42)" multiline style={[dkd_styles_value.input, { minHeight: 90, textAlignVertical: 'top' }]} />
                <TextInput value={dkd_schedule_value} onChangeText={dkd_set_schedule_value} placeholder="Zaman / randevu (opsiyonel)" placeholderTextColor="rgba(230,240,255,.42)" style={dkd_styles_value.input} />
                <TextInput value={dkd_budget_value} onChangeText={dkd_set_budget_value} placeholder="Bütçe (opsiyonel)" placeholderTextColor="rgba(230,240,255,.42)" style={dkd_styles_value.input} />
                <TextInput value={dkd_contact_value} onChangeText={dkd_set_contact_value} placeholder="İletişim notu (opsiyonel)" placeholderTextColor="rgba(230,240,255,.42)" style={dkd_styles_value.input} />
                <Pressable disabled={!dkd_can_submit_value || dkd_busy_value} onPress={dkd_submit_value} style={[dkd_styles_value.submit, (!dkd_can_submit_value || dkd_busy_value) && { opacity: 0.45 }]}>
                  {dkd_busy_value ? <ActivityIndicator color="#031019" /> : <><MaterialCommunityIcons name="send" size={19} color="#031019" /><Text style={dkd_styles_value.submitText}>Talebi Oluştur</Text></>}
                </Pressable>
              </View>
            ) : null}

            <View style={dkd_styles_value.row}>
              <Text style={dkd_styles_value.section}>TALEPLERİM</Text>
              {dkd_on_profile_press_value ? <Pressable onPress={dkd_on_profile_press_value}><Text style={dkd_styles_value.link}>Profil</Text></Pressable> : null}
            </View>
            {dkd_loading_value ? <ActivityIndicator color="#7EEBFF" style={{ marginTop: 18 }} /> : dkd_rows_value.length ? dkd_rows_value.map((dkd_row_value) => {
              const dkd_terminal_value = dkd_terminal_status_values.has(dkd_text_value(dkd_row_value?.dkd_status).toLowerCase());
              return (
                <View key={dkd_row_value.dkd_order_key || dkd_row_value.dkd_source_id} style={dkd_styles_value.order}>
                  <View style={{ flex: 1 }}>
                    <Text style={dkd_styles_value.orderTitle}>{dkd_row_value.dkd_title || 'Hizmet Talebi'}</Text>
                    <Text style={dkd_styles_value.orderSub}>{dkd_row_value.dkd_status || 'pending'} • {dkd_row_value.dkd_address_text || 'Adres bekleniyor'}</Text>
                  </View>
                  {dkd_terminal_value ? <Pressable onPress={() => dkd_delete_value(dkd_row_value)} style={dkd_styles_value.delete}><MaterialCommunityIcons name="delete-outline" size={19} color="#FFD7E0" /></Pressable> : null}
                </View>
              );
            }) : <View style={dkd_styles_value.empty}><Text style={dkd_styles_value.emptyTitle}>Aktif talep yok</Text><Text style={dkd_styles_value.emptyText}>Yeni talebin burada görünecek.</Text></View>}
          </ScrollView>
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const dkd_styles_value = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#030914' },
  header: { padding: 18, flexDirection: 'row', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' },
  kicker: { color: '#7EEBFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#FFF', fontSize: 30, fontWeight: '900', marginTop: 4 },
  sub: { color: 'rgba(231,241,255,.68)', fontSize: 13, lineHeight: 19, marginTop: 5 },
  close: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 50 },
  section: { color: '#A9EEFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 10, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  group: { width: '48%', minHeight: 92, borderRadius: 22, padding: 14, backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
  groupActive: { borderColor: 'rgba(126,235,255,.55)', backgroundColor: 'rgba(28,105,150,.25)' },
  groupTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', marginTop: 9 },
  card: { marginTop: 16, borderRadius: 26, padding: 16, backgroundColor: 'rgba(8,24,48,.88)', borderWidth: 1, borderColor: 'rgba(126,235,255,.16)' },
  cardTitle: { color: '#FFF', fontSize: 21, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  chip: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' },
  chipActive: { backgroundColor: '#7EEBFF' },
  chipText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  input: { marginTop: 9, minHeight: 50, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 12, color: '#FFF', backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)' },
  submit: { marginTop: 14, minHeight: 56, borderRadius: 18, backgroundColor: '#7EEBFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { color: '#031019', fontSize: 14, fontWeight: '900' },
  row: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: '#7EEBFF', fontSize: 12, fontWeight: '900' },
  order: { marginTop: 9, borderRadius: 20, padding: 14, backgroundColor: 'rgba(255,255,255,.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)', flexDirection: 'row', alignItems: 'center', gap: 9 },
  orderTitle: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  orderSub: { color: 'rgba(231,241,255,.62)', fontSize: 11, marginTop: 4 },
  delete: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,100,120,.1)', alignItems: 'center', justifyContent: 'center' },
  empty: { marginTop: 9, borderRadius: 20, padding: 18, backgroundColor: 'rgba(255,255,255,.04)' },
  emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  emptyText: { color: 'rgba(231,241,255,.58)', fontSize: 12, marginTop: 4 },
});
