import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { dkd_fetch_policy_center_config_value, dkd_save_policy_center_config_value } from '../../services/dkd_policy_center_service';

const dkd_default_account_deletion_form_url_value = 'https://www.draborneagle.com/draborngo/account-deletion/';
const dkd_default_privacy_policy_doc_url_value = 'https://www.draborneagle.com/draborngo/privacy/';
const dkd_policy_config_storage_key_value = 'dkd_google_play_policy_center_config_v001';

const dkd_default_policy_config_value = {
  dkd_privacy_policy_doc_url_value: dkd_default_privacy_policy_doc_url_value,
  dkd_account_deletion_form_url_value: dkd_default_account_deletion_form_url_value,
  dkd_package_name_value: 'com.draborneagle.draborngo',
  dkd_version_name_value: 'v0.0.4',
  dkd_version_code_value: '4',
};

const dkd_policy_card_values = [
  {
    dkd_key_value: 'dkd_data_safety',
    dkd_icon_value: 'shield-check-outline',
    dkd_title_value: 'Data Safety Özeti',
    dkd_body_value: 'DraBornGo; hesap, profil, telefon numarası/SMS doğrulama kaydı, sipariş, teslimat, canlı konum, cüzdan işlem kaydı, dekont görseli, destek mesajları, kullanıcılar arası DM/sohbet mesajları, şikayet/engelleme/moderasyon kayıtları ve bildirim kimliği verilerini yalnızca hizmeti çalıştırmak, güvenliği sağlamak, kötüye kullanımı önlemek ve kullanıcı isteğini tamamlamak için işler.',
  },
  {
    dkd_key_value: 'dkd_social_ugc_safety',
    dkd_icon_value: 'message-alert-outline',
    dkd_title_value: 'Sohbet ve UGC Güvenliği',
    dkd_body_value: 'Sohbet alanı kullanıcılar arası iletişim içindir. Kullanıcılar uygunsuz mesaj, spam, taciz veya güvenlik ihlali durumlarında kullanıcıyı şikayet edebilir veya engelleyebilir. Engellenen kullanıcı mesaj ve arkadaşlık isteği gönderemez. Şikayet kayıtları admin moderasyon kuyruğunda incelenir.',
  },
  {
    dkd_key_value: 'dkd_sms_otp',
    dkd_icon_value: 'cellphone-key',
    dkd_title_value: 'SMS / OTP Doğrulama',
    dkd_body_value: 'Telefon numarası yalnızca giriş güvenliği, hesap doğrulama, hesap kurtarma ve sipariş güvenliği için kullanılır. OTP mesajları İleti Merkezi altyapısı üzerinden iys=0 işlem bildirimi olarak gönderilir; pazarlama SMS’i için kullanılmaz.',
  },
  {
    dkd_key_value: 'dkd_location',
    dkd_icon_value: 'map-marker-radius-outline',
    dkd_title_value: 'Konum Kullanımı',
    dkd_body_value: 'Konum; kurye çağırma, paket teslimatı, hizmet ağı eşleşmesi, rota çizimi ve canlı takip için kullanılır. Konum izni kullanıcı onayıyla alınır ve sipariş/takip amacı dışında satılmaz.',
  },
  {
    dkd_key_value: 'dkd_camera_gallery',
    dkd_icon_value: 'image-multiple-outline',
    dkd_title_value: 'Kamera / Galeri / Dekont',
    dkd_body_value: 'Kamera QR kod tarama, paket görseli, ürün/hizmet görseli veya dekont eklemek için kullanılır. Galeri yalnızca kullanıcının seçtiği görseli işler; dekont OCR kontrolü ödeme eşleşmesi için yapılır.',
  },
  {
    dkd_key_value: 'dkd_wallet',
    dkd_icon_value: 'wallet-outline',
    dkd_title_value: 'Cüzdan Açıklaması',
    dkd_body_value: 'Cüzdan bakiyesi sadece fiziksel hizmet, kurye, paket, restoran/market ve hizmet ağı sipariş ödemelerinde kullanılır. Dijital ürün, oyun içi avantaj, bahis, şans oyunu veya nakde çevrilebilir yatırım aracı değildir.',
  },
  {
    dkd_key_value: 'dkd_account_deletion',
    dkd_icon_value: 'account-remove-outline',
    dkd_title_value: 'Hesap ve Veri Silme',
    dkd_body_value: 'Kullanıcı; Profil sayfasındaki Hesabımı Sil alanından veya public hesap silme sayfası üzerinden hesabının ve ilişkili kişisel verilerinin silinmesini talep edebilir. Admin onayıyla kullanıcıya bağlı uygulama verileri; yasal saklama zorunluluğu bulunan sınırlı kayıtlar hariç silme akışına alınır.',
  },
];

function dkd_policy_text_value(dkd_source_value, dkd_fallback_value = '') {
  const dkd_clean_value = String(dkd_source_value ?? '').trim();
  return dkd_clean_value || dkd_fallback_value;
}

function dkd_policy_version_code_text_value(dkd_source_value) {
  const dkd_numeric_value = Number(dkd_source_value);
  if (!Number.isFinite(dkd_numeric_value)) return dkd_default_policy_config_value.dkd_version_code_value;
  return String(Math.max(1, Math.trunc(dkd_numeric_value)));
}

function dkd_normalize_policy_config_value(dkd_source_value = {}) {
  return {
    dkd_privacy_policy_doc_url_value: dkd_policy_text_value(dkd_source_value.dkd_privacy_policy_doc_url_value, dkd_default_privacy_policy_doc_url_value),
    dkd_account_deletion_form_url_value: dkd_policy_text_value(dkd_source_value.dkd_account_deletion_form_url_value, dkd_default_account_deletion_form_url_value),
    dkd_package_name_value: dkd_policy_text_value(dkd_source_value.dkd_package_name_value, dkd_default_policy_config_value.dkd_package_name_value),
    dkd_version_name_value: dkd_policy_text_value(dkd_source_value.dkd_version_name_value, dkd_default_policy_config_value.dkd_version_name_value),
    dkd_version_code_value: dkd_policy_version_code_text_value(dkd_source_value.dkd_version_code_value),
  };
}

function dkd_policy_config_is_current_value(dkd_source_value = {}) {
  const dkd_current_version_code_value = Number(dkd_default_policy_config_value.dkd_version_code_value);
  const dkd_source_version_code_value = Number(dkd_policy_version_code_text_value(dkd_source_value.dkd_version_code_value));
  return Number.isFinite(dkd_source_version_code_value) && dkd_source_version_code_value === dkd_current_version_code_value;
}

function DkdPolicyCard({ dkd_card_value }) {
  return (
    <View style={dkd_styles.dkd_card}>
      <View style={dkd_styles.dkd_card_icon_shell}>
        <MaterialCommunityIcons name={dkd_card_value.dkd_icon_value} size={22} color="#67E8F9" />
      </View>
      <View style={dkd_styles.dkd_card_copy}>
        <Text style={dkd_styles.dkd_card_title}>{dkd_card_value.dkd_title_value}</Text>
        <Text style={dkd_styles.dkd_card_body}>{dkd_card_value.dkd_body_value}</Text>
      </View>
    </View>
  );
}

function DkdPolicyInput({ dkd_label_value, dkd_value, dkd_on_change_value, dkd_placeholder_value, dkd_keyboard_type_value = 'default' }) {
  return (
    <View style={dkd_styles.dkd_admin_input_block}>
      <Text style={dkd_styles.dkd_admin_url_label}>{dkd_label_value}</Text>
      <TextInput
        value={dkd_value}
        onChangeText={dkd_on_change_value}
        placeholder={dkd_placeholder_value}
        placeholderTextColor="rgba(226,242,255,0.42)"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={dkd_keyboard_type_value}
        style={dkd_styles.dkd_admin_url_input}
      />
    </View>
  );
}

function DkdGooglePlayPolicyCenterModal({ dkd_visible_value, dkd_on_close_value, dkd_is_admin_value = false }) {
  const [dkd_policy_config_value, dkd_set_policy_config_value] = useState(dkd_default_policy_config_value);
  const [dkd_policy_config_draft_value, dkd_set_policy_config_draft_value] = useState(dkd_default_policy_config_value);
  const [dkd_policy_config_save_note_value, dkd_set_policy_config_save_note_value] = useState('');

  useEffect(() => {
    if (!dkd_visible_value) return undefined;
    let dkd_is_active_value = true;

    const dkd_apply_policy_config_value = async (dkd_next_policy_config_value) => {
      const dkd_normalized_policy_config_value = dkd_normalize_policy_config_value(dkd_next_policy_config_value);
      await AsyncStorage.setItem(dkd_policy_config_storage_key_value, JSON.stringify(dkd_normalized_policy_config_value));
      if (!dkd_is_active_value) return;
      dkd_set_policy_config_value(dkd_normalized_policy_config_value);
      dkd_set_policy_config_draft_value(dkd_normalized_policy_config_value);
    };

    const dkd_load_policy_config_value = async () => {
      try {
        if (!dkd_is_active_value) return;
        dkd_set_policy_config_value(dkd_default_policy_config_value);
        dkd_set_policy_config_draft_value(dkd_default_policy_config_value);
        dkd_set_policy_config_save_note_value('');

        const dkd_raw_policy_config_value = await AsyncStorage.getItem(dkd_policy_config_storage_key_value);
        const dkd_saved_policy_config_value = dkd_raw_policy_config_value ? JSON.parse(dkd_raw_policy_config_value) : null;
        if (dkd_saved_policy_config_value && dkd_policy_config_is_current_value(dkd_saved_policy_config_value)) {
          await dkd_apply_policy_config_value(dkd_saved_policy_config_value);
        } else if (dkd_raw_policy_config_value) {
          await AsyncStorage.removeItem(dkd_policy_config_storage_key_value);
        }

        const dkd_remote_policy_result_value = await dkd_fetch_policy_center_config_value();
        const dkd_remote_policy_data_value = dkd_remote_policy_result_value?.dkd_data_value || null;
        if (!dkd_is_active_value) return;

        if (dkd_remote_policy_data_value && dkd_policy_config_is_current_value(dkd_remote_policy_data_value)) {
          await dkd_apply_policy_config_value(dkd_remote_policy_data_value);
          return;
        }

        await dkd_apply_policy_config_value(dkd_default_policy_config_value);
      } catch {
        if (!dkd_is_active_value) return;
        dkd_set_policy_config_value(dkd_default_policy_config_value);
        dkd_set_policy_config_draft_value(dkd_default_policy_config_value);
      }
    };

    dkd_load_policy_config_value();
    return () => {
      dkd_is_active_value = false;
    };
  }, [dkd_visible_value]);

  const dkd_effective_privacy_policy_doc_url_value = useMemo(() => (
    dkd_policy_text_value(dkd_policy_config_value.dkd_privacy_policy_doc_url_value, dkd_default_privacy_policy_doc_url_value)
  ), [dkd_policy_config_value]);

  const dkd_effective_account_deletion_form_url_value = useMemo(() => (
    dkd_policy_text_value(dkd_policy_config_value.dkd_account_deletion_form_url_value, dkd_default_account_deletion_form_url_value)
  ), [dkd_policy_config_value]);

  const dkd_change_policy_config_draft_value = useCallback((dkd_field_name_value, dkd_next_text_value) => {
    dkd_set_policy_config_draft_value((dkd_previous_draft_value) => ({
      ...dkd_previous_draft_value,
      [dkd_field_name_value]: dkd_next_text_value,
    }));
    dkd_set_policy_config_save_note_value('');
  }, []);

  const dkd_save_policy_config_value = useCallback(async () => {
    if (!dkd_is_admin_value) return;
    const dkd_next_policy_config_value = dkd_normalize_policy_config_value(dkd_policy_config_draft_value);
    try {
      await AsyncStorage.setItem(dkd_policy_config_storage_key_value, JSON.stringify(dkd_next_policy_config_value));
      const dkd_remote_save_result_value = await dkd_save_policy_center_config_value(dkd_next_policy_config_value);
      const dkd_final_policy_config_value = dkd_normalize_policy_config_value(dkd_remote_save_result_value?.dkd_data_value || dkd_next_policy_config_value);
      dkd_set_policy_config_value(dkd_final_policy_config_value);
      dkd_set_policy_config_draft_value(dkd_final_policy_config_value);
      dkd_set_policy_config_save_note_value(dkd_remote_save_result_value?.dkd_local_only_value ? 'Cihazda kaydedildi. Supabase SQL çalıştırılınca merkezi kayıt da aktif olur.' : 'Admin Play Console alanları kaydedildi.');
    } catch (dkd_error_value) {
      Alert.alert('Play Console alanları kaydedilemedi', dkd_error_value?.message || 'Tekrar dene.');
    }
  }, [dkd_is_admin_value, dkd_policy_config_draft_value]);

  const dkd_reset_policy_config_value = useCallback(async () => {
    if (!dkd_is_admin_value) return;
    try {
      await AsyncStorage.setItem(dkd_policy_config_storage_key_value, JSON.stringify(dkd_default_policy_config_value));
      const dkd_remote_reset_result_value = await dkd_save_policy_center_config_value(dkd_default_policy_config_value);
      dkd_set_policy_config_value(dkd_default_policy_config_value);
      dkd_set_policy_config_draft_value(dkd_default_policy_config_value);
      dkd_set_policy_config_save_note_value(dkd_remote_reset_result_value?.dkd_local_only_value ? 'Varsayılan alanlar cihazda yüklendi. Supabase SQL çalıştırılınca merkezi kayıt da aktif olur.' : 'Varsayılan Play Console alanları yüklendi.');
    } catch (dkd_error_value) {
      Alert.alert('Varsayılan alanlar yüklenemedi', dkd_error_value?.message || 'Tekrar dene.');
    }
  }, [dkd_is_admin_value]);

  const dkd_open_policy_url_value = useCallback(async (dkd_url_value, dkd_fallback_title_value) => {
    try {
      await Linking.openURL(dkd_url_value);
    } catch (dkd_error_value) {
      Alert.alert(dkd_fallback_title_value || 'Bağlantı açılamadı', dkd_error_value?.message || 'URL açılamadı.');
    }
  }, []);

  return (
    <Modal visible={Boolean(dkd_visible_value)} transparent animationType="fade" onRequestClose={dkd_on_close_value}>
      <View style={dkd_styles.dkd_overlay}>
        <View style={dkd_styles.dkd_shell}>
          <LinearGradient colors={['rgba(14,165,233,0.96)', 'rgba(79,70,229,0.94)', 'rgba(15,23,42,0.98)']} style={dkd_styles.dkd_header}>
            <View style={dkd_styles.dkd_header_icon_shell}>
              <MaterialCommunityIcons name="google-play" size={34} color="#07131C" />
            </View>
            <View style={dkd_styles.dkd_header_copy}>
              <Text style={dkd_styles.dkd_kicker}>GOOGLE PLAY HAZIRLIK</Text>
              <Text style={dkd_styles.dkd_title}>Gizlilik ve Veri Merkezi</Text>
              <Text style={dkd_styles.dkd_subtitle}>Paket adı: {dkd_policy_config_value.dkd_package_name_value} • Sürüm: {dkd_policy_config_value.dkd_version_name_value} • Kod: {dkd_policy_config_value.dkd_version_code_value}</Text>
            </View>
            <Pressable onPress={dkd_on_close_value} style={dkd_styles.dkd_close_button}>
              <MaterialCommunityIcons name="close" size={22} color="#E2F2FF" />
            </Pressable>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dkd_styles.dkd_content}>
            {dkd_policy_card_values.map((dkd_card_value) => (
              <DkdPolicyCard key={dkd_card_value.dkd_key_value} dkd_card_value={dkd_card_value} />
            ))}

            <View style={dkd_styles.dkd_section_box}>
              <Text style={dkd_styles.dkd_section_title}>Play Console alanları</Text>
              <View style={dkd_styles.dkd_policy_meta_grid}>
                <View style={dkd_styles.dkd_policy_meta_chip}>
                  <Text style={dkd_styles.dkd_policy_meta_label}>Paket adı</Text>
                  <Text style={dkd_styles.dkd_policy_meta_value}>{dkd_policy_config_value.dkd_package_name_value}</Text>
                </View>
                <View style={dkd_styles.dkd_policy_meta_chip}>
                  <Text style={dkd_styles.dkd_policy_meta_label}>Sürüm adı</Text>
                  <Text style={dkd_styles.dkd_policy_meta_value}>{dkd_policy_config_value.dkd_version_name_value}</Text>
                </View>
                <View style={dkd_styles.dkd_policy_meta_chip}>
                  <Text style={dkd_styles.dkd_policy_meta_label}>Sürüm kodu</Text>
                  <Text style={dkd_styles.dkd_policy_meta_value}>{dkd_policy_config_value.dkd_version_code_value}</Text>
                </View>
              </View>

              {dkd_is_admin_value ? (
                <View style={dkd_styles.dkd_admin_url_editor}>
                  <DkdPolicyInput
                    dkd_label_value="Paket adı"
                    dkd_value={dkd_policy_config_draft_value.dkd_package_name_value}
                    dkd_on_change_value={(dkd_next_text_value) => dkd_change_policy_config_draft_value('dkd_package_name_value', dkd_next_text_value)}
                    dkd_placeholder_value="com.draborneagle.draborngo"
                  />
                  <DkdPolicyInput
                    dkd_label_value="Sürüm adı"
                    dkd_value={dkd_policy_config_draft_value.dkd_version_name_value}
                    dkd_on_change_value={(dkd_next_text_value) => dkd_change_policy_config_draft_value('dkd_version_name_value', dkd_next_text_value)}
                    dkd_placeholder_value="v0.0.4"
                  />
                  <DkdPolicyInput
                    dkd_label_value="Sürüm kodu"
                    dkd_value={String(dkd_policy_config_draft_value.dkd_version_code_value || '')}
                    dkd_on_change_value={(dkd_next_text_value) => dkd_change_policy_config_draft_value('dkd_version_code_value', dkd_next_text_value)}
                    dkd_placeholder_value="1"
                    dkd_keyboard_type_value="number-pad"
                  />
                  <DkdPolicyInput
                    dkd_label_value="Gizlilik Politikası URL"
                    dkd_value={dkd_policy_config_draft_value.dkd_privacy_policy_doc_url_value}
                    dkd_on_change_value={(dkd_next_text_value) => dkd_change_policy_config_draft_value('dkd_privacy_policy_doc_url_value', dkd_next_text_value)}
                    dkd_placeholder_value="https://..."
                    dkd_keyboard_type_value="url"
                  />
                  <DkdPolicyInput
                    dkd_label_value="Veri Silme Formu URL"
                    dkd_value={dkd_policy_config_draft_value.dkd_account_deletion_form_url_value}
                    dkd_on_change_value={(dkd_next_text_value) => dkd_change_policy_config_draft_value('dkd_account_deletion_form_url_value', dkd_next_text_value)}
                    dkd_placeholder_value="https://..."
                    dkd_keyboard_type_value="url"
                  />

                  <View style={dkd_styles.dkd_admin_url_actions}>
                    <Pressable onPress={dkd_save_policy_config_value} style={dkd_styles.dkd_admin_save_button}>
                      <MaterialCommunityIcons name="content-save-outline" size={18} color="#07131C" />
                      <Text style={dkd_styles.dkd_admin_save_button_text}>Play Console Alanlarını Kaydet</Text>
                    </Pressable>
                    <Pressable onPress={dkd_reset_policy_config_value} style={dkd_styles.dkd_admin_reset_button}>
                      <MaterialCommunityIcons name="restore" size={18} color="#E2F2FF" />
                      <Text style={dkd_styles.dkd_admin_reset_button_text}>Varsayılan</Text>
                    </Pressable>
                  </View>
                  {dkd_policy_config_save_note_value ? <Text style={dkd_styles.dkd_admin_save_note}>{dkd_policy_config_save_note_value}</Text> : null}
                </View>
              ) : null}
            </View>

            <View style={dkd_styles.dkd_action_row}>
              <Pressable onPress={() => dkd_open_policy_url_value(dkd_effective_privacy_policy_doc_url_value, 'Gizlilik politikası açılamadı')} style={dkd_styles.dkd_action_button}>
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#07131C" />
                <Text style={dkd_styles.dkd_action_button_text}>Drive Gizlilik URL Aç</Text>
              </Pressable>
              <Pressable onPress={() => dkd_open_policy_url_value(dkd_effective_account_deletion_form_url_value, 'Veri silme formu açılamadı')} style={[dkd_styles.dkd_action_button, dkd_styles.dkd_action_button_soft]}>
                <MaterialCommunityIcons name="form-select" size={18} color="#E2F2FF" />
                <Text style={[dkd_styles.dkd_action_button_text, dkd_styles.dkd_action_button_text_soft]}>Veri Silme Formu Aç</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.88)', justifyContent: 'center', padding: 12 },
  dkd_shell: { maxHeight: '94%', borderRadius: 30, overflow: 'hidden', backgroundColor: '#06111F', borderWidth: 1, borderColor: 'rgba(125,211,252,0.26)' },
  dkd_header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)' },
  dkd_header_icon_shell: { width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A7F3D0', borderWidth: 1, borderColor: 'rgba(255,255,255,0.48)' },
  dkd_header_copy: { flex: 1, minWidth: 0 },
  dkd_kicker: { color: '#BAE6FD', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  dkd_title: { color: '#F8FAFC', fontSize: 22, fontWeight: '900', marginTop: 3 },
  dkd_subtitle: { color: 'rgba(226,242,255,0.76)', fontSize: 12, fontWeight: '700', marginTop: 5, lineHeight: 17 },
  dkd_close_button: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.56)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_content: { padding: 14, paddingBottom: 20 },
  dkd_card: { flexDirection: 'row', gap: 12, borderRadius: 22, backgroundColor: 'rgba(15,23,42,0.72)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.22)', padding: 13, marginBottom: 10 },
  dkd_card_icon_shell: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(34,211,238,0.12)', borderWidth: 1, borderColor: 'rgba(34,211,238,0.24)' },
  dkd_card_copy: { flex: 1 },
  dkd_card_title: { color: '#F8FAFC', fontSize: 15, fontWeight: '900' },
  dkd_card_body: { color: 'rgba(226,242,255,0.78)', fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 5 },
  dkd_section_box: { borderRadius: 24, padding: 13, backgroundColor: 'rgba(8,47,73,0.42)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.22)', marginTop: 2, marginBottom: 10 },
  dkd_section_title: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', marginBottom: 10 },
  dkd_policy_meta_grid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  dkd_policy_meta_chip: { flexGrow: 1, minWidth: 130, borderRadius: 18, backgroundColor: 'rgba(15,23,42,0.58)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)', padding: 11 },
  dkd_policy_meta_label: { color: '#BAE6FD', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  dkd_policy_meta_value: { color: '#F8FAFC', fontSize: 13, fontWeight: '900', marginTop: 5 },
  dkd_admin_url_editor: { marginTop: 12, gap: 8 },
  dkd_admin_input_block: { gap: 6 },
  dkd_admin_url_label: { color: '#BAE6FD', fontSize: 11, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  dkd_admin_url_input: { minHeight: 48, borderRadius: 16, backgroundColor: 'rgba(2,6,23,0.58)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.22)', color: '#F8FAFC', fontSize: 12, fontWeight: '800', paddingHorizontal: 12, paddingVertical: 10 },
  dkd_admin_url_actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  dkd_admin_save_button: { flex: 1, minHeight: 44, borderRadius: 15, backgroundColor: '#A7F3D0', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  dkd_admin_reset_button: { minHeight: 44, borderRadius: 15, backgroundColor: 'rgba(15,23,42,0.78)', borderWidth: 1, borderColor: 'rgba(226,242,255,0.18)', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  dkd_admin_save_button_text: { color: '#07131C', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  dkd_admin_reset_button_text: { color: '#E2F2FF', fontSize: 12, fontWeight: '900' },
  dkd_admin_save_note: { color: '#A7F3D0', fontSize: 11, fontWeight: '900', marginTop: 2 },
  dkd_action_row: { flexDirection: 'row', gap: 10 },
  dkd_action_button: { flex: 1, minHeight: 46, borderRadius: 16, backgroundColor: '#A7F3D0', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  dkd_action_button_soft: { backgroundColor: 'rgba(15,23,42,0.78)', borderWidth: 1, borderColor: 'rgba(226,242,255,0.18)' },
  dkd_action_button_text: { color: '#07131C', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  dkd_action_button_text_soft: { color: '#E2F2FF' },
});

export default memo(DkdGooglePlayPolicyCenterModal);
