import React, { memo, useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import { getCourierMeta } from '../../utils/courier';
import { cityLootTheme as theme } from '../../theme/cityLootTheme';
import { dkd_fetch_my_logistics_application_value, dkd_is_logistics_approved_value } from '../../services/dkd_logistics_service';
import {
  dkd_cancel_account_deletion_request_value,
  dkd_fetch_my_account_deletion_request_value,
  dkd_submit_account_deletion_request_value,
} from '../../services/dkd_account_deletion_service';

const EMOJIS = ['🦅', '🐉', '⚡', '👑', '🔥', '💎', '🗺️', '🏆', '🦂', '🌙'];

async function dkd_build_avatar_value(dkd_asset_value) {
  const dkd_uri_value = String(dkd_asset_value?.uri || '');
  if (!dkd_uri_value) return '';

  const dkd_width_value = Number(dkd_asset_value?.width || 0);
  const dkd_height_value = Number(dkd_asset_value?.height || 0);
  const dkd_size_value = Math.min(dkd_width_value || 0, dkd_height_value || 0);
  const dkd_actions_value = [];

  if (dkd_size_value > 0) {
    dkd_actions_value.push({
      crop: {
        originX: Math.max(0, Math.floor((dkd_width_value - dkd_size_value) / 2)),
        originY: Math.max(0, Math.floor((dkd_height_value - dkd_size_value) / 2)),
        width: dkd_size_value,
        height: dkd_size_value,
      },
    });
  }

  dkd_actions_value.push({ resize: { width: 320, height: 320 } });
  const dkd_out_value = await ImageManipulator.manipulateAsync(dkd_uri_value, dkd_actions_value, {
    compress: 0.78,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (dkd_out_value?.base64) return `data:image/jpeg;base64,${dkd_out_value.base64}`;
  const dkd_base64_value = await FileSystem.readAsStringAsync(dkd_out_value?.uri || dkd_uri_value, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return dkd_base64_value ? `data:image/jpeg;base64,${dkd_base64_value}` : '';
}

function DkdBadge({ text, icon = 'check-decagram-outline' }) {
  return (
    <View style={styles.badge}>
      <MaterialCommunityIcons name={icon} size={14} color="#BFF8FF" />
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

function ProfileModal({ visible, onClose, profile, onSave }) {
  const [nick, setNick] = useState('');
  const [avatar, setAvatar] = useState('🦅');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [logistics, setLogistics] = useState(null);
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setNick(String(profile?.nickname || ''));
    setAvatar(String(profile?.avatar_emoji || '🦅'));
    setImageUrl(String(profile?.avatar_image_url || ''));
  }, [visible, profile?.nickname, profile?.avatar_emoji, profile?.avatar_image_url]);

  useEffect(() => {
    if (!visible) return undefined;
    let dkd_cancelled_value = false;
    const dkd_user_id_value = String(profile?.user_id || profile?.id || '');

    if (dkd_user_id_value) {
      dkd_fetch_my_logistics_application_value({
        dkd_user_id_value,
        dkd_profile_value: profile,
      }).then((dkd_result_value) => {
        if (!dkd_cancelled_value) setLogistics(dkd_result_value?.data || null);
      }).catch(() => {
        if (!dkd_cancelled_value) setLogistics(null);
      });

      dkd_fetch_my_account_deletion_request_value(dkd_user_id_value).then((dkd_result_value) => {
        if (!dkd_cancelled_value) setDeleteRequest(dkd_result_value?.dkd_data_value || null);
      }).catch(() => {
        if (!dkd_cancelled_value) setDeleteRequest(null);
      });
    }

    return () => {
      dkd_cancelled_value = true;
    };
  }, [visible, profile]);

  const dkd_courier_value = getCourierMeta(profile || {});
  const dkd_logistics_active_value = dkd_is_logistics_approved_value(profile || {}, logistics);
  const dkd_resolved_image_value = String(imageUrl || profile?.avatar_image_url || '').trim();
  const dkd_can_save_value = nick.trim().length >= 3 && nick.trim().length <= 18;
  const dkd_changed_value = nick.trim() !== String(profile?.nickname || '').trim()
    || avatar !== String(profile?.avatar_emoji || '🦅')
    || dkd_resolved_image_value !== String(profile?.avatar_image_url || '').trim();

  const dkd_pick_image_value = useCallback(async () => {
    try {
      const dkd_result_value = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.86,
      });
      if (dkd_result_value?.canceled) return;
      setImageLoading(true);
      setImageUrl(await dkd_build_avatar_value(dkd_result_value?.assets?.[0]));
    } catch (dkd_error_value) {
      Alert.alert('Profil', dkd_error_value?.message || 'Profil görseli seçilemedi.');
    } finally {
      setImageLoading(false);
    }
  }, []);

  const dkd_save_value = useCallback(async () => {
    if (!dkd_can_save_value || saving) return;
    setSaving(true);
    try {
      await onSave?.(nick.trim(), avatar, dkd_resolved_image_value);
      Alert.alert('Profil', 'Profil güncellendi.');
    } finally {
      setSaving(false);
    }
  }, [avatar, dkd_can_save_value, dkd_resolved_image_value, nick, onSave, saving]);

  const dkd_delete_value = useCallback(() => {
    const dkd_user_id_value = String(profile?.user_id || profile?.id || '');
    if (!dkd_user_id_value || deleteBusy) return;

    Alert.alert(
      'Hesabımı Sil',
      'Hesap ve kişisel veri silme talebi oluşturulsun mu? Yasal saklama zorunluluğu bulunan sınırlı kayıtlar hariç verilerin silme sürecine alınır.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Talep Oluştur',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteBusy(true);
              const dkd_result_value = await dkd_submit_account_deletion_request_value({
                dkd_user_id_value,
                dkd_display_name_value: nick.trim() || profile?.nickname || '',
                dkd_user_email_value: profile?.email || '',
                dkd_request_note_value: 'Profil sayfasından hesap ve veri silme talebi oluşturuldu.',
              });
              if (dkd_result_value?.dkd_error_value) throw dkd_result_value.dkd_error_value;
              const dkd_refresh_value = await dkd_fetch_my_account_deletion_request_value(dkd_user_id_value);
              setDeleteRequest(dkd_refresh_value?.dkd_data_value || { dkd_status_value: 'pending' });
              Alert.alert('Talep alındı', 'Hesap silme talebin incelemeye alındı.');
            } catch (dkd_error_value) {
              Alert.alert('Hesabımı Sil', dkd_error_value?.message || 'Talep oluşturulamadı.');
            } finally {
              setDeleteBusy(false);
            }
          },
        },
      ]
    );
  }, [deleteBusy, nick, profile]);

  const dkd_cancel_delete_request_value = useCallback(async () => {
    const dkd_user_id_value = String(profile?.user_id || profile?.id || '');
    if (!dkd_user_id_value || deleteBusy) return;
    try {
      setDeleteBusy(true);
      await dkd_cancel_account_deletion_request_value({ dkd_user_id_value });
      setDeleteRequest(null);
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteBusy, profile]);

  return (
    <Modal visible={Boolean(visible)} animationType="slide" onRequestClose={onClose}>
      <SafeScreen style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[theme.colors.bgTop, theme.colors.bgMid, theme.colors.bgBottom]} style={styles.wrap}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerKicker}>DraBornGo v0.0.9</Text>
              <Text style={styles.headerTitle}>Kullanıcı Kimliği</Text>
              <Text style={styles.headerSub}>Profilini, kurye lisansını ve hesap ayarlarını buradan yönet.</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <MaterialCommunityIcons name="arrow-right" size={24} color="#FFF" />
              <Text style={styles.closeText}>Kapat</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <LinearGradient colors={['#071C2B', '#091725', '#11152B']} style={styles.hero}>
              <View style={styles.heroTop}>
                <View style={styles.avatarShell}>
                  {dkd_resolved_image_value ? (
                    <Image source={{ uri: dkd_resolved_image_value }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <Text style={styles.avatarText}>{avatar}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eyebrow}>KULLANICI KİMLİĞİ</Text>
                  <Text style={styles.heroTitle} numberOfLines={1}>{nick.trim() || 'DrabornEagle'}</Text>
                  <Text style={styles.heroSub}>DraBornGo şehir ağı profili</Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                <DkdBadge
                  text={dkd_courier_value.status === 'approved' ? 'Kurye Lisansı Aktif' : dkd_courier_value.shortLabel}
                  icon="motorbike"
                />
                {dkd_logistics_active_value ? <DkdBadge text="Nakliyeci Lisanslı" icon="truck-fast-outline" /> : null}
              </View>
            </LinearGradient>

            <View style={styles.card}>
              <Text style={styles.cardKicker}>PROFİL</Text>
              <Text style={styles.cardTitle}>Kimlik ayarı</Text>
              <Text style={styles.cardSub}>Takma adını ve profil görselini burada düzenle.</Text>

              <View style={styles.previewRow}>
                <View style={styles.previewCircle}>
                  {dkd_resolved_image_value ? (
                    <Image source={{ uri: dkd_resolved_image_value }} style={styles.previewImage} contentFit="cover" />
                  ) : (
                    <Text style={styles.previewEmoji}>{avatar}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewKicker}>PROFİL GÖRSELİ</Text>
                  <Text style={styles.previewTitle}>{dkd_resolved_image_value ? 'Cihaz görseli seçildi' : 'Emoji avatar aktif'}</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable onPress={dkd_pick_image_value} disabled={imageLoading} style={styles.secondaryButton}>
                  <MaterialCommunityIcons name="image-plus" size={18} color="#FFF" />
                  <Text style={styles.secondaryText}>{imageLoading ? 'Hazırlanıyor…' : 'Cihazdan Görsel Seç'}</Text>
                </Pressable>
                <Pressable onPress={() => setImageUrl('')} disabled={!dkd_resolved_image_value} style={[styles.secondaryButton, !dkd_resolved_image_value && styles.disabled]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFF" />
                  <Text style={styles.secondaryText}>Görseli Kaldır</Text>
                </Pressable>
              </View>

              <TextInput
                value={nick}
                onChangeText={setNick}
                maxLength={18}
                autoCapitalize="none"
                placeholder="takma-adın"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.input}
              />

              <View style={styles.emojiGrid}>
                {EMOJIS.map((dkd_emoji_value) => (
                  <Pressable key={dkd_emoji_value} onPress={() => setAvatar(dkd_emoji_value)} style={[styles.emoji, avatar === dkd_emoji_value && styles.emojiActive]}>
                    <Text style={{ fontSize: 24 }}>{dkd_emoji_value}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={dkd_save_value} disabled={!dkd_can_save_value || !dkd_changed_value || saving} style={[styles.primaryButton, (!dkd_can_save_value || !dkd_changed_value || saving) && styles.disabled]}>
                <MaterialCommunityIcons name="content-save-outline" size={18} color="#07111C" />
                <Text style={styles.primaryText}>{saving ? 'Kaydediliyor…' : dkd_changed_value ? 'Kaydet' : 'Kaydedildi'}</Text>
              </Pressable>
            </View>

            <View style={[styles.card, styles.deleteCard]}>
              <Text style={styles.cardKicker}>GİZLİLİK</Text>
              <Text style={styles.cardTitle}>Hesabımı Sil</Text>
              <Text style={styles.cardSub}>Hesap ve kişisel veri silme talebini buradan oluşturabilirsin.</Text>
              <Text style={styles.deleteStatus}>Durum: {String(deleteRequest?.dkd_status_value || 'talep yok')}</Text>
              {String(deleteRequest?.dkd_status_value || '').toLowerCase() === 'pending' ? (
                <Pressable onPress={dkd_cancel_delete_request_value} disabled={deleteBusy} style={[styles.secondaryButton, deleteBusy && styles.disabled]}>
                  <Text style={styles.secondaryText}>{deleteBusy ? 'İşleniyor…' : 'Bekleyen Talebi İptal Et'}</Text>
                </Pressable>
              ) : (
                <Pressable onPress={dkd_delete_value} disabled={deleteBusy} style={[styles.deleteButton, deleteBusy && styles.disabled]}>
                  <MaterialCommunityIcons name="delete-alert-outline" size={19} color="#FFF" />
                  <Text style={styles.deleteText}>{deleteBusy ? 'İşleniyor…' : 'Hesap Silme Talebi Oluştur'}</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#030713' },
  wrap: { flex: 1 },
  header: { padding: 24, paddingTop: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerKicker: { color: '#67E8F9', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 4 },
  headerTitle: { color: '#FFF', fontSize: 31, fontWeight: '900' },
  headerSub: { color: 'rgba(235,241,255,0.72)', fontSize: 15, lineHeight: 21, marginTop: 7 },
  close: { minWidth: 112, height: 64, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  closeText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  content: { padding: 24, paddingTop: 0, gap: 16, paddingBottom: 50 },
  hero: { borderRadius: 28, borderWidth: 1, borderColor: 'rgba(123,230,255,0.20)', padding: 22 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  avatarShell: { width: 120, height: 120, borderRadius: 42, borderWidth: 1, borderColor: 'rgba(123,230,255,0.25)', backgroundColor: 'rgba(123,230,255,0.08)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 52 },
  eyebrow: { color: '#67E8F9', fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  heroTitle: { color: '#FFF', fontSize: 31, fontWeight: '900', marginTop: 7 },
  heroSub: { color: 'rgba(235,241,255,0.70)', fontSize: 15, marginTop: 5 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  badge: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(123,230,255,0.22)', backgroundColor: 'rgba(123,230,255,0.09)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { color: '#CFF8FF', fontSize: 11, fontWeight: '900' },
  card: { borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,214,112,0.18)', backgroundColor: 'rgba(17,15,15,0.94)', padding: 22 },
  cardKicker: { color: '#FFD670', fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 5 },
  cardTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  cardSub: { color: 'rgba(235,241,255,0.68)', fontSize: 14, lineHeight: 20, marginTop: 6 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 },
  previewCircle: { width: 92, height: 92, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
  previewEmoji: { fontSize: 40 },
  previewKicker: { color: '#FFD670', fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  previewTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  primaryButton: { flex: 1, minHeight: 58, borderRadius: 20, backgroundColor: '#72DBFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, marginTop: 18 },
  primaryText: { color: '#07111C', fontWeight: '900', fontSize: 15 },
  secondaryButton: { flex: 1, minHeight: 58, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  secondaryText: { color: '#FFF', fontWeight: '900', fontSize: 14, textAlign: 'center' },
  input: { minHeight: 58, marginTop: 18, borderRadius: 20, paddingHorizontal: 17, color: '#FFF', fontWeight: '800', fontSize: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 15 },
  emoji: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.05)' },
  emojiActive: { borderColor: '#67E8F9', backgroundColor: 'rgba(103,232,249,0.12)' },
  disabled: { opacity: 0.42 },
  deleteCard: { borderColor: 'rgba(255,107,134,0.22)', backgroundColor: 'rgba(34,12,20,0.94)' },
  deleteStatus: { color: '#FFD2DB', fontSize: 13, fontWeight: '800', marginTop: 15, marginBottom: 13 },
  deleteButton: { minHeight: 58, borderRadius: 20, backgroundColor: '#9D2844', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  deleteText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});

export default memo(ProfileModal);
