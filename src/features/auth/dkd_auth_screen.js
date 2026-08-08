import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithEmail, signUpWithEmail } from '../../services/authService';

const dkd_terms_url_value = 'https://www.draborneagle.com/draborngo/terms/';
const dkd_privacy_url_value = 'https://www.draborneagle.com/draborngo/privacy/';
const dkd_policy_version_value = '2026-08-08-v0.0.6';
const dkd_login_secure_image_value = require('../../../assets/dkd_login/dkd_login_secure_gate.png');

function dkd_auth_pill_value({ dkd_icon_value, dkd_text_value }) {
  return (
    <View style={dkd_styles_value.dkd_pill_value}>
      <MaterialCommunityIcons name={dkd_icon_value} size={14} color="#9AF8FF" />
      <Text style={dkd_styles_value.dkd_pill_text_value}>{dkd_text_value}</Text>
    </View>
  );
}

function dkd_auth_input_value({
  dkd_icon_value,
  dkd_icon_color_value,
  dkd_value,
  dkd_on_change_value,
  dkd_placeholder_value,
  dkd_secure_value = false,
  dkd_keyboard_type_value,
  dkd_right_value,
}) {
  return (
    <View style={dkd_styles_value.dkd_input_shell_value}>
      <MaterialCommunityIcons name={dkd_icon_value} size={20} color={dkd_icon_color_value} />
      <TextInput
        value={dkd_value}
        onChangeText={dkd_on_change_value}
        placeholder={dkd_placeholder_value}
        placeholderTextColor="rgba(231,241,255,0.42)"
        secureTextEntry={dkd_secure_value}
        keyboardType={dkd_keyboard_type_value}
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor="#9AF8FF"
        style={dkd_styles_value.dkd_input_text_value}
      />
      {dkd_right_value || null}
    </View>
  );
}

export default function dkd_auth_screen_value() {
  const [dkd_email_value, dkd_set_email_value] = useState('');
  const [dkd_password_value, dkd_set_password_value] = useState('');
  const [dkd_show_password_value, dkd_set_show_password_value] = useState(false);
  const [dkd_busy_value, dkd_set_busy_value] = useState(false);
  const [dkd_register_visible_value, dkd_set_register_visible_value] = useState(false);
  const [dkd_register_full_name_value, dkd_set_register_full_name_value] = useState('');
  const [dkd_register_username_value, dkd_set_register_username_value] = useState('');
  const [dkd_register_email_value, dkd_set_register_email_value] = useState('');
  const [dkd_register_password_value, dkd_set_register_password_value] = useState('');
  const [dkd_register_country_value, dkd_set_register_country_value] = useState('Türkiye');
  const [dkd_register_city_value, dkd_set_register_city_value] = useState('Antalya');
  const [dkd_register_region_value, dkd_set_register_region_value] = useState('');
  const [dkd_accepted_value, dkd_set_accepted_value] = useState(false);
  const dkd_glow_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dkd_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_glow_value, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(dkd_glow_value, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ]),
    );
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_glow_value]);

  async function dkd_login_value() {
    const dkd_email_clean_value = String(dkd_email_value || '').trim().toLowerCase();
    if (!dkd_email_clean_value || String(dkd_password_value || '').length < 6) {
      Alert.alert('Giriş', 'Geçerli e-posta ve en az 6 karakter şifre gerekli.');
      return;
    }
    dkd_set_busy_value(true);
    const dkd_response_value = await signInWithEmail(dkd_email_clean_value, dkd_password_value);
    dkd_set_busy_value(false);
    if (dkd_response_value?.error) {
      Alert.alert('Giriş Hatası', String(dkd_response_value.error.message || 'Giriş tamamlanamadı.'));
    }
  }

  async function dkd_register_value() {
    const dkd_email_clean_value = String(dkd_register_email_value || '').trim().toLowerCase();
    if (!dkd_email_clean_value || String(dkd_register_password_value || '').length < 6) {
      Alert.alert('Kayıt', 'Geçerli e-posta ve en az 6 karakter şifre gerekli.');
      return;
    }
    if (!dkd_accepted_value) {
      Alert.alert('Kayıt', 'Kullanım Koşulları ve Gizlilik Politikasını kabul etmelisin.');
      return;
    }
    dkd_set_busy_value(true);
    const dkd_response_value = await signUpWithEmail(dkd_email_clean_value, dkd_register_password_value, {
      dkd_country: String(dkd_register_country_value || '').trim() || 'Türkiye',
      dkd_city: String(dkd_register_city_value || '').trim() || 'Antalya',
      dkd_region: String(dkd_register_region_value || '').trim(),
      dkd_full_name: String(dkd_register_full_name_value || '').trim(),
      dkd_username: String(dkd_register_username_value || '').trim().replace(/\s+/g, '').toLowerCase(),
      dkd_terms_accepted: true,
      dkd_terms_accepted_at: new Date().toISOString(),
      dkd_terms_version: dkd_policy_version_value,
      dkd_privacy_version: dkd_policy_version_value,
      dkd_community_policy_version: dkd_policy_version_value,
    });
    dkd_set_busy_value(false);
    if (dkd_response_value?.error) {
      Alert.alert('Kayıt Hatası', String(dkd_response_value.error.message || 'Kayıt tamamlanamadı.'));
      return;
    }
    Alert.alert('Kayıt tamamlandı', dkd_response_value?.data?.session ? 'Hesabın hazır.' : 'E-posta doğrulaması açıksa gelen kutunu kontrol et.');
    dkd_set_email_value(dkd_email_clean_value);
    dkd_set_register_visible_value(false);
  }

  const dkd_glow_opacity_value = dkd_glow_value.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.72] });
  const dkd_glow_scale_value = dkd_glow_value.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.05] });

  return (
    <View style={dkd_styles_value.dkd_root_value}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient colors={['#030713', '#071B2B', '#160A2E', '#040711']} style={StyleSheet.absoluteFill} />
      <View style={dkd_styles_value.dkd_orb_cyan_value} />
      <View style={dkd_styles_value.dkd_orb_purple_value} />
      <KeyboardAvoidingView style={dkd_styles_value.dkd_keyboard_value} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={dkd_styles_value.dkd_scroll_value} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={dkd_styles_value.dkd_brand_value}>
            <View style={dkd_styles_value.dkd_overline_row_value}>
              <MaterialCommunityIcons name="star-four-points" size={15} color="#FDE68A" />
              <Text style={dkd_styles_value.dkd_overline_value}>DraBornGo ŞEHİR GİRİŞ KAPISI</Text>
            </View>
            <Text style={dkd_styles_value.dkd_title_value}>Şehir Ağına Hoş Geldin</Text>
            <Text style={dkd_styles_value.dkd_version_value}>v0.0.6 • Expo Go</Text>
          </View>

          <View style={dkd_styles_value.dkd_preview_value}>
            <Image source={dkd_login_secure_image_value} resizeMode="cover" style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['rgba(3,7,19,0.03)', 'rgba(3,7,19,0)', 'rgba(3,7,19,0.50)']} style={StyleSheet.absoluteFill} />
            <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_preview_glow_value, { opacity: dkd_glow_opacity_value, transform: [{ scale: dkd_glow_scale_value }] }]} />
          </View>

          <View style={dkd_styles_value.dkd_pill_row_value}>
            {React.createElement(dkd_auth_pill_value, { dkd_icon_value: 'truck-fast-outline', dkd_text_value: 'Kurye-Kargo' })}
            {React.createElement(dkd_auth_pill_value, { dkd_icon_value: 'food-fork-drink', dkd_text_value: 'Yemek-Market' })}
            {React.createElement(dkd_auth_pill_value, { dkd_icon_value: 'storefront-outline', dkd_text_value: 'Hizmet Ağı' })}
          </View>

          <View style={dkd_styles_value.dkd_card_value}>
            <LinearGradient colors={['rgba(255,255,255,0.15)', 'rgba(14,165,233,0.08)', 'rgba(168,85,247,0.12)']} style={StyleSheet.absoluteFill} />
            <View style={dkd_styles_value.dkd_top_line_value} />
            <View style={dkd_styles_value.dkd_card_header_value}>
              <LinearGradient colors={['#67E8F9', '#A78BFA']} style={dkd_styles_value.dkd_card_icon_value}>
                <MaterialCommunityIcons name="account-key-outline" size={22} color="#06111F" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={dkd_styles_value.dkd_kicker_value}>GÜVENLİ OTURUM</Text>
                <Text style={dkd_styles_value.dkd_card_title_value}>Şehir merkezine giriş</Text>
              </View>
            </View>
            <Text style={dkd_styles_value.dkd_card_body_value}>Hesabınla devam et; kurye, teslimat, hizmet ağı ve ekip akışların açılsın.</Text>

            {React.createElement(dkd_auth_input_value, {
              dkd_icon_value: 'email-outline',
              dkd_icon_color_value: '#9AF8FF',
              dkd_value: dkd_email_value,
              dkd_on_change_value: dkd_set_email_value,
              dkd_placeholder_value: 'E-posta',
              dkd_keyboard_type_value: 'email-address',
            })}
            {React.createElement(dkd_auth_input_value, {
              dkd_icon_value: 'lock-outline',
              dkd_icon_color_value: '#B7A6FF',
              dkd_value: dkd_password_value,
              dkd_on_change_value: dkd_set_password_value,
              dkd_placeholder_value: 'Şifre',
              dkd_secure_value: !dkd_show_password_value,
              dkd_right_value: (
                <Pressable onPress={() => dkd_set_show_password_value((dkd_previous_value) => !dkd_previous_value)} hitSlop={10}>
                  <MaterialCommunityIcons name={dkd_show_password_value ? 'eye-off-outline' : 'eye-outline'} size={21} color="rgba(231,241,255,0.76)" />
                </Pressable>
              ),
            })}

            <Pressable onPress={dkd_login_value} disabled={dkd_busy_value} style={dkd_styles_value.dkd_primary_button_value}>
              <LinearGradient colors={['#62E6FF', '#708FFF', '#C46BFF']} style={StyleSheet.absoluteFill} />
              <MaterialCommunityIcons name="rocket-launch-outline" size={19} color="#FFFFFF" />
              <Text style={dkd_styles_value.dkd_primary_text_value}>{dkd_busy_value ? 'Giriş yapılıyor…' : 'DraBornGo’ya Gir'}</Text>
            </Pressable>

            <View style={dkd_styles_value.dkd_actions_value}>
              <Pressable onPress={() => Alert.alert('Şifre Sıfırla', 'Şifre sıfırlama bağlantısı sonraki sürümde eklenecek.')}>
                <Text style={dkd_styles_value.dkd_link_text_value}>Şifremi unuttum</Text>
              </Pressable>
              <Pressable onPress={() => { dkd_set_register_email_value(dkd_email_value); dkd_set_register_visible_value(true); }} style={dkd_styles_value.dkd_register_button_value}>
                <MaterialCommunityIcons name="account-plus-outline" size={16} color="#07111C" />
                <Text style={dkd_styles_value.dkd_register_button_text_value}>Yeni hesap aç</Text>
              </Pressable>
            </View>
          </View>

          <View style={dkd_styles_value.dkd_policy_row_value}>
            <Pressable onPress={() => Linking.openURL(dkd_terms_url_value)}><Text style={dkd_styles_value.dkd_policy_link_value}>Kullanım Koşulları</Text></Pressable>
            <Pressable onPress={() => Linking.openURL(dkd_privacy_url_value)}><Text style={dkd_styles_value.dkd_policy_link_value}>Gizlilik Politikası</Text></Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={dkd_register_visible_value} animationType="slide" onRequestClose={() => dkd_set_register_visible_value(false)}>
        <KeyboardAvoidingView style={dkd_styles_value.dkd_register_root_value} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <LinearGradient colors={['#040A19', '#082A3E', '#25104A', '#070915']} style={StyleSheet.absoluteFill} />
          <ScrollView contentContainerStyle={dkd_styles_value.dkd_register_scroll_value} keyboardShouldPersistTaps="handled">
            <View style={dkd_styles_value.dkd_register_header_value}>
              <View>
                <Text style={dkd_styles_value.dkd_register_title_value}>Kayıt Ol</Text>
                <Text style={dkd_styles_value.dkd_register_subtitle_value}>Hesap ve bölge bilgilerini tamamla.</Text>
              </View>
              <Pressable onPress={() => dkd_set_register_visible_value(false)} style={dkd_styles_value.dkd_close_value}>
                <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={dkd_styles_value.dkd_register_card_value}>
              {React.createElement(dkd_auth_input_value, { dkd_icon_value: 'account-outline', dkd_icon_color_value: '#9AF8FF', dkd_value: dkd_register_full_name_value, dkd_on_change_value: dkd_set_register_full_name_value, dkd_placeholder_value: 'Ad soyad' })}
              {React.createElement(dkd_auth_input_value, { dkd_icon_value: 'at', dkd_icon_color_value: '#B7A6FF', dkd_value: dkd_register_username_value, dkd_on_change_value: dkd_set_register_username_value, dkd_placeholder_value: 'Kullanıcı adı' })}
              {React.createElement(dkd_auth_input_value, { dkd_icon_value: 'email-outline', dkd_icon_color_value: '#9AF8FF', dkd_value: dkd_register_email_value, dkd_on_change_value: dkd_set_register_email_value, dkd_placeholder_value: 'E-posta', dkd_keyboard_type_value: 'email-address' })}
              {React.createElement(dkd_auth_input_value, { dkd_icon_value: 'lock-outline', dkd_icon_color_value: '#B7A6FF', dkd_value: dkd_register_password_value, dkd_on_change_value: dkd_set_register_password_value, dkd_placeholder_value: 'Şifre', dkd_secure_value: true })}
              {React.createElement(dkd_auth_input_value, { dkd_icon_value: 'earth', dkd_icon_color_value: '#72FFBF', dkd_value: dkd_register_country_value, dkd_on_change_value: dkd_set_register_country_value, dkd_placeholder_value: 'Ülke' })}
              {React.createElement(dkd_auth_input_value, { dkd_icon_value: 'city-variant-outline', dkd_icon_color_value: '#72FFBF', dkd_value: dkd_register_city_value, dkd_on_change_value: dkd_set_register_city_value, dkd_placeholder_value: 'Şehir' })}
              {React.createElement(dkd_auth_input_value, { dkd_icon_value: 'map-marker-radius-outline', dkd_icon_color_value: '#FFE074', dkd_value: dkd_register_region_value, dkd_on_change_value: dkd_set_register_region_value, dkd_placeholder_value: 'İlçe / bölge' })}

              <Pressable onPress={() => dkd_set_accepted_value((dkd_previous_value) => !dkd_previous_value)} style={dkd_styles_value.dkd_accept_value}>
                <View style={[dkd_styles_value.dkd_checkbox_value, dkd_accepted_value ? dkd_styles_value.dkd_checkbox_active_value : null]}>
                  {dkd_accepted_value ? <MaterialCommunityIcons name="check" size={15} color="#06111F" /> : null}
                </View>
                <Text style={dkd_styles_value.dkd_accept_text_value}>Kullanım Koşulları ve Gizlilik Politikasını okudum, kabul ediyorum.</Text>
              </Pressable>

              <Pressable onPress={dkd_register_value} disabled={dkd_busy_value} style={dkd_styles_value.dkd_primary_button_value}>
                <LinearGradient colors={['#62E6FF', '#72FFBF', '#FFE074']} style={StyleSheet.absoluteFill} />
                <MaterialCommunityIcons name="account-check-outline" size={19} color="#06111F" />
                <Text style={[dkd_styles_value.dkd_primary_text_value, { color: '#06111F' }]}>{dkd_busy_value ? 'Kaydediliyor…' : 'Hesabı Oluştur'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_root_value: { flex: 1, backgroundColor: '#030713' },
  dkd_keyboard_value: { flex: 1 },
  dkd_scroll_value: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 62, paddingBottom: 36 },
  dkd_orb_cyan_value: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(42,210,255,0.10)', top: 36, right: -120 },
  dkd_orb_purple_value: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(166,85,247,0.11)', bottom: 80, left: -150 },
  dkd_brand_value: { marginBottom: 16 },
  dkd_overline_row_value: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dkd_overline_value: { color: '#9AF8FF', fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  dkd_title_value: { color: '#FFFFFF', fontSize: 31, fontWeight: '900', marginTop: 8 },
  dkd_version_value: { color: '#8295AF', fontSize: 12, fontWeight: '800', marginTop: 5 },
  dkd_preview_value: { height: 190, borderRadius: 27, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(113,221,255,0.28)', backgroundColor: '#07111C' },
  dkd_preview_glow_value: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(98,230,255,0.15)', alignSelf: 'center', top: 0 },
  dkd_pill_row_value: { flexDirection: 'row', gap: 7, marginTop: 12, marginBottom: 14 },
  dkd_pill_value: { flex: 1, minHeight: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(116,206,255,0.24)', backgroundColor: 'rgba(8,20,36,0.80)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 7 },
  dkd_pill_text_value: { color: '#DCEEFF', fontSize: 10, fontWeight: '850' },
  dkd_card_value: { borderRadius: 28, overflow: 'hidden', padding: 18, borderWidth: 1, borderColor: 'rgba(155,190,255,0.25)', backgroundColor: 'rgba(7,16,31,0.88)' },
  dkd_top_line_value: { position: 'absolute', top: 0, left: 20, right: 20, height: 3, borderRadius: 3, backgroundColor: '#7BE6FF' },
  dkd_card_header_value: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  dkd_card_icon_value: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dkd_kicker_value: { color: '#9AF8FF', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  dkd_card_title_value: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 2 },
  dkd_card_body_value: { color: '#9EADC0', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  dkd_input_shell_value: { minHeight: 56, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(133,170,213,0.30)', backgroundColor: 'rgba(5,15,29,0.84)', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 10 },
  dkd_input_text_value: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  dkd_primary_button_value: { minHeight: 58, borderRadius: 19, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 8 },
  dkd_primary_text_value: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  dkd_actions_value: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  dkd_link_text_value: { color: '#9AF8FF', fontSize: 12, fontWeight: '800' },
  dkd_register_button_value: { minHeight: 40, borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#9AF8FF', flexDirection: 'row', alignItems: 'center', gap: 6 },
  dkd_register_button_text_value: { color: '#07111C', fontSize: 12, fontWeight: '900' },
  dkd_policy_row_value: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 18 },
  dkd_policy_link_value: { color: '#79E6FF', fontSize: 12, fontWeight: '800' },
  dkd_register_root_value: { flex: 1, backgroundColor: '#040A19' },
  dkd_register_scroll_value: { flexGrow: 1, padding: 20, paddingTop: 58, paddingBottom: 34 },
  dkd_register_header_value: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  dkd_register_title_value: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  dkd_register_subtitle_value: { color: '#91A3BA', fontSize: 13, marginTop: 4 },
  dkd_close_value: { width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  dkd_register_card_value: { borderRadius: 27, padding: 16, borderWidth: 1, borderColor: 'rgba(126,204,255,0.22)', backgroundColor: 'rgba(6,15,29,0.86)' },
  dkd_accept_value: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginVertical: 7 },
  dkd_checkbox_value: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: '#496177', backgroundColor: '#101C2B', alignItems: 'center', justifyContent: 'center' },
  dkd_checkbox_active_value: { backgroundColor: '#9AF8FF', borderColor: '#9AF8FF' },
  dkd_accept_text_value: { flex: 1, color: '#A6B4C5', fontSize: 12, lineHeight: 18, fontWeight: '650' },
});
