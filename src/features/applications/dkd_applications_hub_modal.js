import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import { DkdCourierInlineApplicationForm } from '../courier/CourierBoardModal';

export default function DkdApplicationsHubModalValue({ dkd_visible_value, dkd_on_close_value, dkd_profile_value, dkd_set_profile_value }) {
  const [dkd_form_open_value, dkd_set_form_open_value] = useState(false);
  const dkd_courier_approved_flag = String(dkd_profile_value?.courier_status || '').trim().toLowerCase() === 'approved';

  useEffect(() => {
    if (!dkd_visible_value || dkd_courier_approved_flag) dkd_set_form_open_value(false);
  }, [dkd_visible_value, dkd_courier_approved_flag]);

  return (
    <Modal visible={Boolean(dkd_visible_value)} animationType="slide" onRequestClose={dkd_on_close_value}>
      <StatusBar barStyle="light-content" />
      <SafeScreen style={dkd_styles_value.screen}>
        <LinearGradient colors={['#050B18', '#081527', '#120A24']} style={dkd_styles_value.screen}>
          <ScrollView contentContainerStyle={dkd_styles_value.content} showsVerticalScrollIndicator={false}>
            <View style={dkd_styles_value.header}>
              <Pressable onPress={dkd_on_close_value} style={dkd_styles_value.close}>
                <MaterialCommunityIcons name="close" size={22} color="#FFF" />
              </Pressable>
              <Text style={dkd_styles_value.kicker}>DBG KURYE ONAY MERKEZİ</Text>
              <Text style={dkd_styles_value.title}>{dkd_courier_approved_flag ? 'Kurye Onayın Aktif' : 'Kurye Başvurusu'}</Text>
              <Text style={dkd_styles_value.subtitle}>{dkd_courier_approved_flag ? 'Kurye hesabın onaylandı. Yeni bir kurye başvurusu oluşturman gerekmez.' : 'Kimlik, ehliyet, bölge ve araç bilgilerini ekleyip kurye onay sürecini başlat.'}</Text>
            </View>

            {dkd_courier_approved_flag ? (
              <View style={[dkd_styles_value.card, dkd_styles_value.approvedCard]}>
                <View style={[dkd_styles_value.icon, dkd_styles_value.approvedIcon]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={32} color="#061B14" />
                </View>
                <Text style={dkd_styles_value.cardTitle}>Kurye Onayın Aktif</Text>
                <Text style={dkd_styles_value.cardText}>DBG Kurye Onay Merkezi kaydın onaylı. Görev havuzunu açabilir, uygun teslimatları kabul edebilir ve kurye çalışma akışını kullanabilirsin.</Text>
                <View style={dkd_styles_value.approvedStatus}>
                  <MaterialCommunityIcons name="check-decagram" size={20} color="#6EF0B2" />
                  <Text style={dkd_styles_value.approvedStatusText}>ONAYLANDI • AKTİF</Text>
                </View>
              </View>
            ) : !dkd_form_open_value ? (
              <Pressable onPress={() => dkd_set_form_open_value(true)} style={dkd_styles_value.card}>
                <View style={dkd_styles_value.icon}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={30} color="#FFF" />
                </View>
                <Text style={dkd_styles_value.cardTitle}>Kurye Başvurusu</Text>
                <Text style={dkd_styles_value.cardText}>Başvuru formunu aç, bilgilerini gönder ve admin onay sürecini takip et.</Text>
                <View style={dkd_styles_value.action}>
                  <Text style={dkd_styles_value.actionText}>Başvuru formunu aç</Text>
                  <MaterialCommunityIcons name="arrow-right-circle" size={20} color="#FFF" />
                </View>
              </Pressable>
            ) : (
              <View style={dkd_styles_value.form}>
                <Pressable onPress={() => dkd_set_form_open_value(false)} style={dkd_styles_value.back}>
                  <MaterialCommunityIcons name="arrow-left" size={18} color="#07131C" />
                  <Text style={dkd_styles_value.backText}>Başvuru merkezine dön</Text>
                </Pressable>
                <DkdCourierInlineApplicationForm dkd_profile_value={dkd_profile_value} dkd_set_profile_value={dkd_set_profile_value} />
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const dkd_styles_value = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050B18' },
  content: { padding: 18, paddingBottom: 40 },
  header: { borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', padding: 18 },
  close: { position: 'absolute', right: 14, top: 14, width: 40, height: 40, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  kicker: { color: '#7EEBFF', fontSize: 11, fontWeight: '900', letterSpacing: 1.2, paddingRight: 50 },
  title: { color: '#FFF', fontSize: 30, fontWeight: '900', marginTop: 10, paddingRight: 50 },
  subtitle: { color: 'rgba(231,241,255,0.75)', fontSize: 14, lineHeight: 20, marginTop: 8 },
  card: { marginTop: 16, minHeight: 220, borderRadius: 28, padding: 18, borderWidth: 1, borderColor: 'rgba(126,235,255,0.25)', backgroundColor: 'rgba(35,72,128,0.38)' },
  approvedCard: { borderColor: 'rgba(110,240,178,0.34)', backgroundColor: 'rgba(24,89,72,0.34)' },
  icon: { width: 62, height: 62, borderRadius: 22, backgroundColor: '#7188FF', alignItems: 'center', justifyContent: 'center' },
  approvedIcon: { backgroundColor: '#6EF0B2' },
  cardTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 18 },
  cardText: { color: 'rgba(231,241,255,0.76)', fontSize: 14, lineHeight: 21, marginTop: 8 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
  actionText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  approvedStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(110,240,178,0.10)', borderWidth: 1, borderColor: 'rgba(110,240,178,0.24)' },
  approvedStatusText: { color: '#BFF9DB', fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  form: { marginTop: 16 },
  back: { alignSelf: 'flex-start', minHeight: 44, borderRadius: 15, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#7EEBFF', marginBottom: 12 },
  backText: { color: '#07131C', fontSize: 12, fontWeight: '900' },
});
