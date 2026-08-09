import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import { dkd_fetch_policy_center_config_value } from '../../services/dkd_policy_center_service';

const dkd_text_scaling_props_value = { allowFontScaling: false, maxFontSizeMultiplier: 1 };

const dkd_default_config_value = {
  dkd_package_name_value: 'com.draborneagle.draborngo',
  dkd_version_name_value: 'v0.0.15',
  dkd_version_code_value: 3,
  dkd_privacy_policy_doc_url_value: 'https://www.draborneagle.com/draborngo/privacy/',
  dkd_account_deletion_form_url_value: 'https://www.draborneagle.com/draborngo/account-deletion/',
};

const dkd_policy_card_values = [
  {
    dkd_key_value: 'play-scope',
    dkd_icon_value: 'motorbike',
    dkd_title_value: 'Google Play Sürümü: Yalnız Kurye',
    dkd_body_value: 'DraBornGo Google Play sürümü, onaylı kuryelerin kendilerine veya kurye görev havuzuna sunulan teslimat görevlerini görmesi, uygun görevi kabul etmesi, teslim alma/teslim etme adımlarını yönetmesi, aktif görev rotasını kullanması ve çalışma-kazanç özetlerini takip etmesi için tasarlanmıştır. Bu uygulamada müşteriye sipariş oluşturma, işletme paneli, mağaza/marketplace, ödeme alma, cüzdan, banka, kredi veya yatırım hizmeti sunulmaz.',
  },
  {
    dkd_key_value: 'data-safety',
    dkd_icon_value: 'shield-check-outline',
    dkd_title_value: 'Data Safety Özeti',
    dkd_body_value: 'DraBornGo; hesap ve profil bilgileri, kurye başvurusu ve onay durumu, kurye görev/teslimat kayıtları, gerekli olduğunda yalnız uygulama açıkken kullanılan konum, kullanıcının seçtiği profil/başvuru görselleri, kullanıcı ile DrabornEagle admin arasındaki destek mesajları, bildirim/teknik güvenlik kimlikleri ile kurye çalışma ve kazanç kayıtlarını uygulamanın temel kurye işlevlerini çalıştırmak ve güvenliğini sağlamak için işler. Kişisel veriler reklam amacıyla satılmaz.',
  },
  {
    dkd_key_value: 'identity-contact',
    dkd_icon_value: 'card-account-details-outline',
    dkd_title_value: 'Kurye Kimlik ve Başvuru Bilgileri',
    dkd_body_value: 'Kurye başvurusu ve onay sürecinde kullanıcının sunduğu kimlik, iletişim, adres, şehir/bölge, araç/plaka, acil durum iletişim ve gerekli başvuru belgeleri işlenebilir. Telefon bilgisi SMS/OTP veya pazarlama amacıyla kullanılmaz.',
  },
  {
    dkd_key_value: 'task-data',
    dkd_icon_value: 'clipboard-text-clock-outline',
    dkd_title_value: 'Kurye Görev ve Teslimat Kayıtları',
    dkd_body_value: 'Kurye; kendisine sunulan veya kabul ettiği görevlerde görev kimliği, alım/teslim noktası, görev durumu, teslim alma ve teslim edilme adımları, zaman kayıtları, rota/mesafe ve ilgili operasyon ücretini görebilir. DraBornGo Google Play sürümü bu görevleri kurye adına oluşturmaz; yalnız kurye tarafındaki operasyonu yürütür.',
  },
  {
    dkd_key_value: 'location',
    dkd_icon_value: 'map-marker-radius-outline',
    dkd_title_value: 'Konum Kullanımı',
    dkd_body_value: 'Konum; kurye görevi, rota, aktif teslimat ve gerekli canlı kurye operasyonu için yalnız gerekli olduğunda ve uygulama açıkken kullanılır. Arka plan konum izni kullanılmaz ve uygulama kapalıyken sürekli konum takibi yapılmaz.',
  },
  {
    dkd_key_value: 'media',
    dkd_icon_value: 'image-multiple-outline',
    dkd_title_value: 'Kamera / Görsel Seçimi',
    dkd_body_value: 'Kamera ve görsel seçimi yalnız kullanıcının başlattığı profil veya kurye başvurusu görseli/belgesi işlemlerinde açılır. Mikrofon, arka plan kamera erişimi ve geniş medya/depolama erişimi istenmez.',
  },
  {
    dkd_key_value: 'support-safety',
    dkd_icon_value: 'message-alert-outline',
    dkd_title_value: 'Destek ve İletişim Güvenliği',
    dkd_body_value: 'Destek alanı kullanıcı ile DrabornEagle admin hesabı arasındaki destek iletişimidir. Destek mesajları talebi yanıtlamak, güvenliği sağlamak ve kötüye kullanımı incelemek için gerektiği ölçüde saklanabilir. Kullanıcılar arası genel DM/sohbet sistemi kullanılmaz.',
  },
  {
    dkd_key_value: 'earnings',
    dkd_icon_value: 'cash-clock',
    dkd_title_value: 'Kurye Çalışma ve Kazanç Verileri',
    dkd_body_value: 'Çevrimiçi çalışma oturumları, tamamlanan teslimatlar ve bunlarla ilişkili kazanç kayıtları günlük, haftalık, aylık ve saatlik operasyon özetleri oluşturmak için kullanılabilir. Bu alan yalnız kurye çalışma/kazanç takibidir; DraBornGo banka hesabı, ödeme hesabı, cüzdan, kredi, yatırım veya para transferi hizmeti sunmaz.',
  },
  {
    dkd_key_value: 'providers',
    dkd_icon_value: 'server-security',
    dkd_title_value: 'Hizmet Sağlayıcıları ve Güvenlik',
    dkd_body_value: 'Uygulamanın çalışması için Supabase altyapısı, harita/rota servisleri, bildirim altyapısı ve uygulama dağıtım hizmetleri kullanılabilir. Bu sağlayıcılara yalnız ilgili işlev için gerekli veriler aktarılır. Erişim yetkilendirmesi ve sunucu tarafı kontrolleriyle veri erişimi sınırlandırılır.',
  },
  {
    dkd_key_value: 'delete',
    dkd_icon_value: 'account-remove-outline',
    dkd_title_value: 'Hesap ve Veri Silme',
    dkd_body_value: 'Kullanıcı Profil ekranından veya resmi hesap silme web sayfasından hesabının ve ilişkili kişisel verilerinin silinmesini talep edebilir. Hesap silme yalnız hesabı dondurmak anlamına gelmez. Güvenlik veya uygulanabilir yasal saklama zorunluluğu bulunan sınırlı kayıtlar yalnız gerekli süre boyunca korunabilir.',
  },
];

function DkdPolicyCard({ dkd_icon_value, dkd_title_value, dkd_body_value }) {
  return (
    <View style={dkd_styles_value.dkd_policy_card}>
      <View style={dkd_styles_value.dkd_policy_icon_shell}>
        <MaterialCommunityIcons name={dkd_icon_value} size={19} color="#58E5FF" />
      </View>
      <View style={dkd_styles_value.dkd_policy_copy}>
        <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_policy_title}>{dkd_title_value}</Text>
        <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_policy_body}>{dkd_body_value}</Text>
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
      dkd_version_name_value: 'v0.0.15',
      dkd_version_code_value: 3,
    });
  }, []);

  useEffect(() => {
    if (dkd_visible_value) dkd_load_value();
  }, [dkd_visible_value, dkd_load_value]);

  const dkd_version_text_value = useMemo(() => {
    const dkd_name_value = 'v0.0.15';
    const dkd_normalized_name_value = dkd_name_value.startsWith('v') ? dkd_name_value : `v${dkd_name_value}`;
    return `${dkd_normalized_name_value} • Kod: 3`;
  }, []);

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
                <MaterialCommunityIcons name="google-play" size={34} color="#06131B" />
              </View>
              <View style={dkd_styles_value.dkd_header_copy}>
                <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_kicker}>GOOGLE PLAY • KURYE UYGULAMASI</Text>
                <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_title}>Gizlilik ve Veri{`\n`}Merkezi</Text>
                <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_package_text}>Paket adı:{`\n`}{dkd_config_value?.dkd_package_name_value || dkd_default_config_value.dkd_package_name_value} • Sürüm: {dkd_version_text_value}</Text>
              </View>
              <Pressable onPress={dkd_on_close_value} hitSlop={8} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_close_button, dkd_pressed_value && { opacity: 0.72 }]}>
                <MaterialCommunityIcons name="close" size={23} color="#FFFFFF" />
              </Pressable>
            </LinearGradient>

            <ScrollView contentContainerStyle={dkd_styles_value.dkd_content} showsVerticalScrollIndicator={false}>
              {dkd_policy_card_values.map((dkd_item_value) => (
                <DkdPolicyCard key={dkd_item_value.dkd_key_value} {...dkd_item_value} />
              ))}

              <View style={dkd_styles_value.dkd_link_group}>
                <Pressable onPress={() => dkd_open_url_value(dkd_config_value?.dkd_privacy_policy_doc_url_value)} style={dkd_styles_value.dkd_link_button}>
                  <MaterialCommunityIcons name="file-lock-outline" size={18} color="#06111B" />
                  <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_link_button_text}>Gizlilik Politikasını Aç</Text>
                  <MaterialCommunityIcons name="arrow-top-right" size={17} color="#06111B" />
                </Pressable>
                <Pressable onPress={() => dkd_open_url_value(dkd_config_value?.dkd_account_deletion_form_url_value)} style={[dkd_styles_value.dkd_link_button, dkd_styles_value.dkd_delete_link_button]}>
                  <MaterialCommunityIcons name="account-remove-outline" size={18} color="#FFE4EA" />
                  <Text {...dkd_text_scaling_props_value} style={[dkd_styles_value.dkd_link_button_text, { color: '#FFE4EA' }]}>Hesap Silme Sayfasını Aç</Text>
                  <MaterialCommunityIcons name="arrow-top-right" size={17} color="#FFE4EA" />
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
  dkd_shell: { flex: 1, borderRadius: 27, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(112,226,255,0.24)' },
  dkd_header: { minHeight: 162, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(126,235,255,0.23)' },
  dkd_play_icon_shell: { width: 58, height: 58, borderRadius: 17, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dkd_header_copy: { flex: 1, minWidth: 0 },
  dkd_kicker: { color: 'rgba(229,248,255,0.88)', fontSize: 10.5, lineHeight: 13, fontWeight: '900', letterSpacing: 1.2 },
  dkd_title: { color: '#FFFFFF', fontSize: 20, lineHeight: 24, fontWeight: '900', marginTop: 6 },
  dkd_package_text: { color: 'rgba(235,241,255,0.72)', fontSize: 11.5, lineHeight: 16, fontWeight: '800', marginTop: 7 },
  dkd_close_button: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(9,20,47,0.66)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', flexShrink: 0 },
  dkd_content: { padding: 14, paddingBottom: 28, gap: 10 },
  dkd_policy_card: { borderRadius: 21, padding: 14, flexDirection: 'row', gap: 12, backgroundColor: 'rgba(13,24,43,0.94)', borderWidth: 1, borderColor: 'rgba(178,211,255,0.20)' },
  dkd_policy_icon_shell: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,70,91,0.50)', borderWidth: 1, borderColor: 'rgba(64,218,255,0.28)', flexShrink: 0 },
  dkd_policy_copy: { flex: 1, minWidth: 0 },
  dkd_policy_title: { color: '#FFFFFF', fontSize: 14.5, lineHeight: 18, fontWeight: '900' },
  dkd_policy_body: { color: 'rgba(230,239,255,0.74)', fontSize: 12, lineHeight: 18.5, fontWeight: '700', marginTop: 5 },
  dkd_link_group: { gap: 9, marginTop: 2 },
  dkd_link_button: { minHeight: 48, borderRadius: 16, backgroundColor: '#88EBFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  dkd_delete_link_button: { backgroundColor: 'rgba(126,39,65,0.65)', borderWidth: 1, borderColor: 'rgba(255,122,158,0.28)' },
  dkd_link_button_text: { flex: 1, color: '#06111B', fontSize: 12, fontWeight: '900' },
});
