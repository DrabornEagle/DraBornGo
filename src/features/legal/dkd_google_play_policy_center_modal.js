import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import { dkd_fetch_policy_center_config_value } from '../../services/dkd_policy_center_service';

const dkd_default_config_value = {
  dkd_package_name_value: 'com.draborneagle.draborngo',
  dkd_version_name_value: 'v0.0.13',
  dkd_version_code_value: 13,
  dkd_privacy_policy_doc_url_value: 'https://www.draborneagle.com/draborngo/privacy/',
  dkd_account_deletion_form_url_value: 'https://www.draborneagle.com/draborngo/delete-account/',
};

const dkd_policy_card_values = [
  {
    dkd_key_value: 'data-safety',
    dkd_icon_value: 'shield-check-outline',
    dkd_title_value: 'Data Safety Özeti',
    dkd_body_value: 'DraBornGo; hesap ve profil bilgileri, telefon/SMS doğrulama kaydı, gönderi ve teslimat verileri, yalnız uygulama açıkken kullanılan konum, kurye çevrimiçi çalışma oturumları ve kazanç kayıtları, destek mesajları ile bildirim kimliği verilerini hizmeti çalıştırmak, güvenliği sağlamak ve kullanıcı isteğini tamamlamak için işler.',
  },
  {
    dkd_key_value: 'support-safety',
    dkd_icon_value: 'message-alert-outline',
    dkd_title_value: 'Destek ve İletişim Güvenliği',
    dkd_body_value: 'Destek alanı kullanıcı ile DrabornEagle admin hesabı arasındaki canlı destek iletişimidir. Destek mesajları talebi yanıtlamak, güvenliği sağlamak ve kötüye kullanımı incelemek için saklanabilir. Kullanıcılar arası genel DM/sohbet sistemi bu sürümde kullanılmaz.',
  },
  {
    dkd_key_value: 'otp',
    dkd_icon_value: 'cellphone-key',
    dkd_title_value: 'SMS / OTP Doğrulama',
    dkd_body_value: 'Telefon numarası giriş güvenliği, hesap doğrulama, hesap kurtarma ve sipariş güvenliği için kullanılabilir. Doğrulama mesajları pazarlama amacıyla kullanılmaz.',
  },
  {
    dkd_key_value: 'location',
    dkd_icon_value: 'map-marker-radius-outline',
    dkd_title_value: 'Konum Kullanımı',
    dkd_body_value: 'Konum; gönderi adresi eşleştirme, kurye görevi, rota ve canlı teslimat takibi için yalnız gerekli olduğunda ve uygulama açıkken kullanılır. Arka plan konum izni kullanılmaz.',
  },
  {
    dkd_key_value: 'media',
    dkd_icon_value: 'image-multiple-outline',
    dkd_title_value: 'Kamera / Galeri',
    dkd_body_value: 'Kamera ve fotoğraf seçimi yalnız kullanıcının başlattığı profil, kurye başvurusu, paket veya gerekli operasyon görseli işlemlerinde açılır. Mikrofon ve geniş medya erişimi istenmez.',
  },
  {
    dkd_key_value: 'earnings',
    dkd_icon_value: 'cash-clock',
    dkd_title_value: 'Kurye Çalışma ve Kazanç Verileri',
    dkd_body_value: 'Kurye çevrimiçi oturum başlangıç/bitiş zamanları ve tamamlanan teslimatlardan oluşan kazanç kayıtları günlük, haftalık, aylık ve saatlik performans özetlerini oluşturmak için kullanılır. Skor, puan ortalaması ve puan sayısı sistemi kullanılmaz.',
  },
  {
    dkd_key_value: 'delete',
    dkd_icon_value: 'account-remove-outline',
    dkd_title_value: 'Hesap ve Veri Silme',
    dkd_body_value: 'Kullanıcı Profil ekranından veya resmi hesap silme sayfasından hesabının ve ilişkili kişisel verilerinin silinmesini talep edebilir. Yasal saklama zorunluluğu bulunan sınırlı kayıtlar ilgili süre boyunca korunabilir.',
  },
];

function DkdPolicyCard({ dkd_icon_value, dkd_title_value, dkd_body_value }) {
  return (
    <View style={dkd_styles_value.dkd_policy_card}>
      <View style={dkd_styles_value.dkd_policy_icon_shell}>
        <MaterialCommunityIcons name={dkd_icon_value} size={27} color="#58E5FF" />
      </View>
      <View style={dkd_styles_value.dkd_policy_copy}>
        <Text style={dkd_styles_value.dkd_policy_title}>{dkd_title_value}</Text>
        <Text style={dkd_styles_value.dkd_policy_body}>{dkd_body_value}</Text>
      </View>
    </View>
  );
}

export default function DkdGooglePlayPolicyCenterModal({ dkd_visible_value, dkd_on_close_value }) {
  const [dkd_config_value, dkd_set_config_value] = useState(dkd_default_config_value);

  const dkd_load_value = useCallback(async () => {
    const dkd_result_value = await dkd_fetch_policy_center_config_value();
    const dkd_remote_value = dkd_result_value?.dkd_data_value || {};
    dkd_set_config_value({
      ...dkd_default_config_value,
      ...dkd_remote_value,
      dkd_version_name_value: String(dkd_remote_value?.dkd_version_name_value || 'v0.0.13'),
      dkd_version_code_value: Number(dkd_remote_value?.dkd_version_code_value || 13),
    });
  }, []);

  useEffect(() => {
    if (dkd_visible_value) dkd_load_value();
  }, [dkd_visible_value, dkd_load_value]);

  const dkd_version_text_value = useMemo(() => {
    const dkd_name_value = String(dkd_config_value?.dkd_version_name_value || 'v0.0.13');
    const dkd_normalized_name_value = dkd_name_value.startsWith('v') ? dkd_name_value : `v${dkd_name_value}`;
    return `${dkd_normalized_name_value} • Kod: ${Number(dkd_config_value?.dkd_version_code_value || 13)}`;
  }, [dkd_config_value]);

  const dkd_open_url_value = useCallback(async (dkd_url_value) => {
    const dkd_clean_url_value = String(dkd_url_value || '').trim();
    if (!dkd_clean_url_value) return;
    try {
      const dkd_can_open_value = await Linking.canOpenURL(dkd_clean_url_value);
      if (dkd_can_open_value) await Linking.openURL(dkd_clean_url_value);
    } catch {}
  }, []);

  return (
    <Modal visible={Boolean(dkd_visible_value)} transparent animationType="fade" onRequestClose={dkd_on_close_value}>
      <SafeScreen style={dkd_styles_value.dkd_safe_screen}>
        <View style={dkd_styles_value.dkd_overlay}>
          <LinearGradient colors={['#07101E', '#07182A', '#10132E']} style={dkd_styles_value.dkd_shell}>
            <LinearGradient colors={['#06A7E6', '#3964E8', '#5C33D3', '#0A1730']} locations={[0, 0.34, 0.66, 1]} style={dkd_styles_value.dkd_header}>
              <View style={dkd_styles_value.dkd_play_icon_shell}>
                <LinearGradient colors={['#B8F5DD', '#86EDB5']} style={StyleSheet.absoluteFill} />
                <MaterialCommunityIcons name="google-play" size={57} color="#06131B" />
              </View>
              <View style={dkd_styles_value.dkd_header_copy}>
                <Text style={dkd_styles_value.dkd_kicker}>GOOGLE PLAY HAZIRLIK</Text>
                <Text style={dkd_styles_value.dkd_title}>Gizlilik ve Veri{`\n`}Merkezi</Text>
                <Text style={dkd_styles_value.dkd_package_text}>Paket adı:{`\n`}{dkd_config_value?.dkd_package_name_value || dkd_default_config_value.dkd_package_name_value} • Sürüm:{`\n`}{dkd_version_text_value}</Text>
              </View>
              <Pressable onPress={dkd_on_close_value} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_close_button, dkd_pressed_value && { opacity: 0.72 }]}>
                <MaterialCommunityIcons name="close" size={34} color="#FFFFFF" />
              </Pressable>
            </LinearGradient>

            <ScrollView contentContainerStyle={dkd_styles_value.dkd_content} showsVerticalScrollIndicator={false}>
              {dkd_policy_card_values.map((dkd_item_value) => (
                <DkdPolicyCard key={dkd_item_value.dkd_key_value} {...dkd_item_value} />
              ))}

              <View style={dkd_styles_value.dkd_link_group}>
                <Pressable onPress={() => dkd_open_url_value(dkd_config_value?.dkd_privacy_policy_doc_url_value)} style={dkd_styles_value.dkd_link_button}>
                  <MaterialCommunityIcons name="file-document-lock-outline" size={22} color="#06111B" />
                  <Text style={dkd_styles_value.dkd_link_button_text}>Gizlilik Politikasını Aç</Text>
                  <MaterialCommunityIcons name="arrow-top-right" size={20} color="#06111B" />
                </Pressable>
                <Pressable onPress={() => dkd_open_url_value(dkd_config_value?.dkd_account_deletion_form_url_value)} style={[dkd_styles_value.dkd_link_button, dkd_styles_value.dkd_delete_link_button]}>
                  <MaterialCommunityIcons name="account-remove-outline" size={22} color="#FFE4EA" />
                  <Text style={[dkd_styles_value.dkd_link_button_text, { color: '#FFE4EA' }]}>Hesap Silme Sayfasını Aç</Text>
                  <MaterialCommunityIcons name="arrow-top-right" size={20} color="#FFE4EA" />
                </Pressable>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </SafeScreen>
    </Modal>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_safe_screen: { flex: 1, backgroundColor: 'transparent' },
  dkd_overlay: { flex: 1, backgroundColor: 'rgba(0,3,10,0.82)', paddingHorizontal: 12, paddingVertical: 10 },
  dkd_shell: { flex: 1, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(112,226,255,0.24)' },
  dkd_header: { minHeight: 285, paddingHorizontal: 28, paddingTop: 28, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(126,235,255,0.23)' },
  dkd_play_icon_shell: { width: 102, height: 102, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  dkd_header_copy: { flex: 1, minWidth: 0 },
  dkd_kicker: { color: 'rgba(229,248,255,0.88)', fontSize: 13, fontWeight: '900', letterSpacing: 1.8 },
  dkd_title: { color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontWeight: '900', marginTop: 10 },
  dkd_package_text: { color: 'rgba(235,241,255,0.72)', fontSize: 15, lineHeight: 23, fontWeight: '800', marginTop: 12 },
  dkd_close_button: { width: 74, height: 74, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(9,20,47,0.66)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  dkd_content: { padding: 25, paddingBottom: 46, gap: 18 },
  dkd_policy_card: { borderRadius: 30, padding: 24, flexDirection: 'row', gap: 20, backgroundColor: 'rgba(13,24,43,0.94)', borderWidth: 1, borderColor: 'rgba(178,211,255,0.20)' },
  dkd_policy_icon_shell: { width: 74, height: 74, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,70,91,0.50)', borderWidth: 1, borderColor: 'rgba(64,218,255,0.28)' },
  dkd_policy_copy: { flex: 1, minWidth: 0 },
  dkd_policy_title: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
  dkd_policy_body: { color: 'rgba(230,239,255,0.74)', fontSize: 16, lineHeight: 26, fontWeight: '700', marginTop: 9 },
  dkd_link_group: { gap: 12, marginTop: 4 },
  dkd_link_button: { minHeight: 62, borderRadius: 20, backgroundColor: '#88EBFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 18 },
  dkd_delete_link_button: { backgroundColor: 'rgba(126,39,65,0.65)', borderWidth: 1, borderColor: 'rgba(255,122,158,0.28)' },
  dkd_link_button_text: { flex: 1, color: '#06111B', fontSize: 14, fontWeight: '900' },
});
