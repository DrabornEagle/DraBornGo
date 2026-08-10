import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SecondaryButton from '../../components/ui/SecondaryButton';
import { cityLootTheme } from '../../theme/cityLootTheme';
import dkd_social_moderation_admin_modal from './dkd_social_moderation_admin_modal';
import DkdAdminUserManagerModal from './dkd_admin_user_manager_modal';
import DkdLiveSupportModal from '../support/dkd_live_support_modal_v2';

function DkdAction({ icon, title, sub, onPress }) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <View style={styles.icon}><MaterialCommunityIcons name={icon} size={23} color={cityLootTheme.colors.cyanSoft} /></View>
      <View style={{ flex: 1 }}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSub}>{sub}</Text></View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={cityLootTheme.colors.textMuted} />
    </Pressable>
  );
}

export default function AdminMenuModal({ visible, onClose, onCourier }) {
  const [moderationOpen, setModerationOpen] = useState(false);
  const [dkd_user_manager_open_value, dkd_set_user_manager_open_value] = useState(false);
  const [dkd_support_open_value, dkd_set_support_open_value] = useState(false);

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <LinearGradient colors={['#04101A', '#0B1426', '#160E2A']} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerIcon}><MaterialCommunityIcons name="shield-crown-outline" size={26} color="#06111B" /></View>
              <View style={{ flex: 1 }}><Text style={styles.kicker}>DRABORNGO CONTROL TOWER</Text><Text style={styles.title}>Admin Komuta Güvertesi</Text><Text style={styles.sub}>Kullanıcı, kurye, destek ve moderasyon operasyonlarını tek merkezden yönet.</Text></View>
              <SecondaryButton label="Kapat" onPress={onClose} size="compact" fullWidth={false} />
            </View>

            <View style={styles.statusStrip}><View style={styles.statusDot} /><Text style={styles.statusText}>Admin oturumu aktif • DraBornGo v0.0.16</Text></View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={styles.section}>KULLANICI & DESTEK</Text>
              <DkdAction icon="account-search-outline" title="Kullanıcı Yönetimi" sub="Kullanıcı ara, detaylarını ve kurye kazanç tablosunu yönet." onPress={() => dkd_set_user_manager_open_value(true)} />
              <DkdAction icon="headset" title="Canlı Destek Gelen Kutusu" sub="DrabornEagle destek konuşmalarını görüntüle ve yanıtla." onPress={() => dkd_set_support_open_value(true)} />
              <Text style={styles.section}>KURYE OPERASYONLARI</Text>
              <DkdAction icon="truck-fast-outline" title="Kurye Operasyonları" sub="Kurye ve teslimat merkezini aç." onPress={onCourier} />
              <Text style={styles.section}>GÜVENLİK</Text>
              <DkdAction icon="shield-alert-outline" title="Moderasyon Kuyruğu" sub="Sosyal rapor ve şikayetleri incele." onPress={() => setModerationOpen(true)} />
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>

      {React.createElement(dkd_social_moderation_admin_modal, { visible: moderationOpen, onClose: () => setModerationOpen(false) })}
      <DkdAdminUserManagerModal dkd_visible_value={dkd_user_manager_open_value} dkd_on_close_value={() => dkd_set_user_manager_open_value(false)} />
      <DkdLiveSupportModal dkd_visible_value={dkd_support_open_value} dkd_on_close_value={() => dkd_set_support_open_value(false)} dkd_is_admin_value />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2,6,12,0.88)', alignItems: 'center', justifyContent: 'center', padding: 14 },
  card: { width: '100%', maxWidth: 760, maxHeight: '94%', borderRadius: 31, borderWidth: 1, borderColor: 'rgba(132,219,255,0.16)', padding: 17 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  headerIcon: { width: 54, height: 54, borderRadius: 19, backgroundColor: '#82E9FF', alignItems: 'center', justifyContent: 'center' },
  kicker: { color: '#83E9FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: cityLootTheme.colors.text, fontSize: 25, fontWeight: '900', marginTop: 3 },
  sub: { color: cityLootTheme.colors.textSoft, fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  statusStrip: { minHeight: 46, borderRadius: 16, marginTop: 14, backgroundColor: 'rgba(20,71,65,0.28)', borderWidth: 1, borderColor: 'rgba(88,226,171,0.16)', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: '#5AE5B0' },
  statusText: { color: '#DFFFF2', fontSize: 10.5, fontWeight: '900' },
  content: { paddingTop: 6, paddingBottom: 10 },
  section: { color: '#A9EEFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 13, marginBottom: 8 },
  action: { minHeight: 86, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.05)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 9 },
  icon: { width: 50, height: 50, borderRadius: 17, backgroundColor: 'rgba(123,230,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  actionTitle: { color: cityLootTheme.colors.text, fontSize: 16, fontWeight: '900' },
  actionSub: { color: cityLootTheme.colors.textSoft, fontSize: 11, lineHeight: 16, marginTop: 3 },
});
