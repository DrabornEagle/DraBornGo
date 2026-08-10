import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import { getCourierMeta } from '../../utils/courier';
import {
  dkd_cancel_account_deletion_request_value,
  dkd_fetch_my_account_deletion_request_value,
  dkd_submit_account_deletion_request_value,
} from '../../services/dkd_account_deletion_service';

const dkd_emoji_values = ['🦅', '🐉', '⚡', '👑', '🔥', '💎', '🗺️', '🏆', '🦂', '🌙'];

async function dkd_build_avatar_value(dkd_asset_value) {
  const dkd_uri_value = String(dkd_asset_value?.uri || '');
  if (!dkd_uri_value) return '';
  const dkd_width_value = Number(dkd_asset_value?.width || 0);
  const dkd_height_value = Number(dkd_asset_value?.height || 0);
  const dkd_size_value = Math.min(dkd_width_value || 0, dkd_height_value || 0);
  const dkd_actions_value = [];
  if (dkd_size_value > 0) {
    dkd_actions_value.push({ crop: { originX: Math.max(0, Math.floor((dkd_width_value - dkd_size_value) / 2)), originY: Math.max(0, Math.floor((dkd_height_value - dkd_size_value) / 2)), width: dkd_size_value, height: dkd_size_value } });
  }
  dkd_actions_value.push({ resize: { width: 320, height: 320 } });
  const dkd_out_value = await ImageManipulator.manipulateAsync(dkd_uri_value, dkd_actions_value, { compress: 0.78, format: ImageManipulator.SaveFormat.JPEG, base64: true });
  if (dkd_out_value?.base64) return `data:image/jpeg;base64,${dkd_out_value.base64}`;
  const dkd_base64_value = await FileSystem.readAsStringAsync(dkd_out_value?.uri || dkd_uri_value, { encoding: FileSystem.EncodingType.Base64 });
  return dkd_base64_value ? `data:image/jpeg;base64,${dkd_base64_value}` : '';
}

export default function ProfileModal({ visible, onClose, profile, onSave }) {
  const [dkd_nick_value, dkd_set_nick_value] = useState('');
  const [dkd_avatar_value, dkd_set_avatar_value] = useState('🦅');
  const [dkd_image_url_value, dkd_set_image_url_value] = useState('');
  const [dkd_saving_value, dkd_set_saving_value] = useState(false);
  const [dkd_delete_request_value, dkd_set_delete_request_value] = useState(null);
  const [dkd_delete_busy_value, dkd_set_delete_busy_value] = useState(false);

  useEffect(() => {
    if (!visible) return;
    dkd_set_nick_value(String(profile?.nickname || ''));
    dkd_set_avatar_value(String(profile?.avatar_emoji || '🦅'));
    dkd_set_image_url_value(String(profile?.avatar_image_url || ''));
    const dkd_user_id_value = String(profile?.user_id || profile?.id || '');
    if (dkd_user_id_value) {
      dkd_fetch_my_account_deletion_request_value(dkd_user_id_value).then((dkd_result_value) => dkd_set_delete_request_value(dkd_result_value?.dkd_data_value || null)).catch(() => dkd_set_delete_request_value(null));
    }
  }, [visible, profile]);

  const dkd_courier_value = getCourierMeta(profile || {});
  const dkd_resolved_image_value = String(dkd_image_url_value || profile?.avatar_image_url || '').trim();
  const dkd_can_save_value = dkd_nick_value.trim().length >= 3 && dkd_nick_value.trim().length <= 18;

  const dkd_pick_image_value = useCallback(async () => {
    try {
      const dkd_result_value = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.86 });
      if (dkd_result_value?.canceled) return;
      dkd_set_image_url_value(await dkd_build_avatar_value(dkd_result_value?.assets?.[0]));
    } catch (dkd_error_value) {
      Alert.alert('Profil', dkd_error_value?.message || 'Profil görseli seçilemedi.');
    }
  }, []);

  const dkd_save_value = useCallback(async () => {
    if (!dkd_can_save_value || dkd_saving_value) return;
    dkd_set_saving_value(true);
    try {
      await onSave?.(dkd_nick_value.trim(), dkd_avatar_value, dkd_resolved_image_value);
      Alert.alert('Profil', 'Profil güncellendi.');
    } finally {
      dkd_set_saving_value(false);
    }
  }, [dkd_avatar_value, dkd_can_save_value, dkd_nick_value, dkd_resolved_image_value, dkd_saving_value, onSave]);

  const dkd_request_delete_value = useCallback(() => {
    const dkd_user_id_value = String(profile?.user_id || profile?.id || '');
    if (!dkd_user_id_value || dkd_delete_busy_value) return;
    Alert.alert('Hesabımı Sil', 'Hesap ve kişisel veri silme talebi oluşturulsun mu? Yasal saklama zorunluluğu bulunan sınırlı kayıtlar hariç verilerin silme sürecine alınır.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Talep Oluştur', style: 'destructive', onPress: async () => {
          try {
            dkd_set_delete_busy_value(true);
            const dkd_result_value = await dkd_submit_account_deletion_request_value({ dkd_user_id_value, dkd_display_name_value: dkd_nick_value.trim() || profile?.nickname || '', dkd_user_email_value: profile?.email || '', dkd_request_note_value: 'Profil sayfasından hesap ve veri silme talebi oluşturuldu.' });
            if (dkd_result_value?.dkd_error_value) throw dkd_result_value.dkd_error_value;
            dkd_set_delete_request_value({ dkd_status_value: 'pending' });
            Alert.alert('Talep alındı', 'Hesap silme talebin incelemeye alındı.');
          } catch (dkd_error_value) {
            Alert.alert('Hesabımı Sil', dkd_error_value?.message || 'Talep oluşturulamadı.');
          } finally {
            dkd_set_delete_busy_value(false);
          }
        },
      },
    ]);
  }, [dkd_delete_busy_value, dkd_nick_value, profile]);

  const dkd_cancel_delete_value = useCallback(async () => {
    const dkd_user_id_value = String(profile?.user_id || profile?.id || '');
    if (!dkd_user_id_value || dkd_delete_busy_value) return;
    dkd_set_delete_busy_value(true);
    try {
      await dkd_cancel_account_deletion_request_value({ dkd_user_id_value });
      dkd_set_delete_request_value(null);
    } finally {
      dkd_set_delete_busy_value(false);
    }
  }, [dkd_delete_busy_value, profile]);

  return (
    <Modal visible={Boolean(visible)} animationType="slide" onRequestClose={onClose}>
      <SafeScreen style={dkd_styles_value.screen}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView style={dkd_styles_value.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <LinearGradient colors={['#050B18', '#091A2A', '#160D2D']} style={dkd_styles_value.screen}>
            <View style={dkd_styles_value.header}>
              <View style={{ flex: 1 }}><Text style={dkd_styles_value.kicker}>DraBornGo v0.0.17</Text><Text style={dkd_styles_value.title}>Kullanıcı Kimliği</Text><Text style={dkd_styles_value.sub}>Profilini, kurye onay durumunu ve hesap ayarlarını buradan yönet.</Text></View>
              <Pressable onPress={onClose} style={dkd_styles_value.close}><MaterialCommunityIcons name="close" size={22} color="#FFF" /></Pressable>
            </View>
            <ScrollView contentContainerStyle={dkd_styles_value.content} keyboardShouldPersistTaps="handled">
              <View style={dkd_styles_value.hero}>
                <View style={dkd_styles_value.avatarShell}>{dkd_resolved_image_value ? <Image source={{ uri: dkd_resolved_image_value }} style={dkd_styles_value.avatarImage} contentFit="cover" /> : <Text style={dkd_styles_value.avatarText}>{dkd_avatar_value}</Text>}</View>
                <View style={{ flex: 1 }}><Text style={dkd_styles_value.heroTitle}>{dkd_nick_value.trim() || 'DrabornEagle'}</Text><Text style={dkd_styles_value.heroSub}>{dkd_courier_value.status === 'approved' ? 'Kurye Onayı Aktif' : dkd_courier_value.shortLabel}</Text></View>
              </View>

              <View style={dkd_styles_value.card}>
                <Text style={dkd_styles_value.cardTitle}>Profil</Text>
                <TextInput value={dkd_nick_value} onChangeText={dkd_set_nick_value} placeholder="Takma ad" placeholderTextColor="rgba(240,248,255,.42)" style={dkd_styles_value.input} maxLength={18} />
                <View style={dkd_styles_value.emojiRow}>{dkd_emoji_values.map((dkd_emoji_value) => <Pressable key={dkd_emoji_value} onPress={() => { dkd_set_avatar_value(dkd_emoji_value); dkd_set_image_url_value(''); }} style={[dkd_styles_value.emoji, dkd_avatar_value === dkd_emoji_value && !dkd_resolved_image_value && dkd_styles_value.emojiActive]}><Text style={dkd_styles_value.emojiText}>{dkd_emoji_value}</Text></Pressable>)}</View>
                <Pressable onPress={dkd_pick_image_value} style={dkd_styles_value.secondary}><MaterialCommunityIcons name="image-plus" size={18} color="#FFF" /><Text style={dkd_styles_value.secondaryText}>Cihazdan Görsel Seç</Text></Pressable>
                <Pressable disabled={!dkd_can_save_value || dkd_saving_value} onPress={dkd_save_value} style={[dkd_styles_value.primary, (!dkd_can_save_value || dkd_saving_value) && { opacity: 0.45 }]}><Text style={dkd_styles_value.primaryText}>{dkd_saving_value ? 'Kaydediliyor…' : 'Profili Kaydet'}</Text></Pressable>
              </View>

              <View style={dkd_styles_value.card}>
                <Text style={dkd_styles_value.cardTitle}>Hesap ve Veriler</Text>
                <Text style={dkd_styles_value.cardSub}>Google Play hesap silme gereklilikleri için uygulama içinden silme talebi oluşturabilirsin.</Text>
                {dkd_delete_request_value?.dkd_status_value === 'pending' ? <Pressable onPress={dkd_cancel_delete_value} disabled={dkd_delete_busy_value} style={dkd_styles_value.secondary}><Text style={dkd_styles_value.secondaryText}>Silme Talebini İptal Et</Text></Pressable> : <Pressable onPress={dkd_request_delete_value} disabled={dkd_delete_busy_value} style={dkd_styles_value.danger}><MaterialCommunityIcons name="delete-alert-outline" size={18} color="#FFD7E0" /><Text style={dkd_styles_value.dangerText}>Hesabımı Sil</Text></Pressable>}
              </View>
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
      </SafeScreen>
    </Modal>
  );
}

const dkd_styles_value = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050B18' },
  header: { padding: 18, flexDirection: 'row', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' },
  kicker: { color: '#7EEBFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 4 },
  sub: { color: 'rgba(240,248,255,.62)', fontSize: 12, lineHeight: 18, marginTop: 4 },
  close: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 50 },
  hero: { borderRadius: 26, padding: 16, backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(126,235,255,.16)', flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarShell: { width: 78, height: 78, borderRadius: 26, backgroundColor: 'rgba(126,235,255,.12)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 38 },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  heroSub: { color: '#9DECBF', fontSize: 12, fontWeight: '800', marginTop: 5 },
  card: { marginTop: 14, borderRadius: 24, padding: 16, backgroundColor: 'rgba(255,255,255,.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)' },
  cardTitle: { color: '#FFF', fontSize: 19, fontWeight: '900' },
  cardSub: { color: 'rgba(240,248,255,.62)', fontSize: 12, lineHeight: 18, marginTop: 6 },
  input: { marginTop: 13, minHeight: 52, borderRadius: 16, paddingHorizontal: 13, color: '#FFF', backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)' },
  emojiRow: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emoji: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center' },
  emojiActive: { borderWidth: 1, borderColor: '#7EEBFF', backgroundColor: 'rgba(126,235,255,.15)' },
  emojiText: { fontSize: 21 },
  primary: { marginTop: 12, minHeight: 52, borderRadius: 16, backgroundColor: '#7EEBFF', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#031019', fontSize: 14, fontWeight: '900' },
  secondary: { marginTop: 12, minHeight: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.08)', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  danger: { marginTop: 12, minHeight: 50, borderRadius: 16, backgroundColor: 'rgba(255,100,120,.12)', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,120,140,.25)' },
  dangerText: { color: '#FFD7E0', fontSize: 13, fontWeight: '900' },
});
