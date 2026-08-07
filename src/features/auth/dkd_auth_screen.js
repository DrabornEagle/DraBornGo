import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import dkd_safe_screen_value from '../../components/layout/dkd_safe_screen';
import { signInWithEmail, signUpWithEmail } from '../../services/authService';

const dkd_terms_url_value = 'https://www.draborneagle.com/draborngo/terms/';
const dkd_privacy_url_value = 'https://www.draborneagle.com/draborngo/privacy/';
const dkd_policy_version_value = '2026-08-08-v0.0.6';

function dkd_input_value(dkd_props_value) {
  return React.createElement(TextInput, {
    ...dkd_props_value,
    style: dkd_styles_value.dkd_input_value,
    placeholderTextColor: '#66788D',
  });
}

export default function dkd_auth_screen_value() {
  const [dkd_mode_value, dkd_set_mode_value] = useState('login');
  const [dkd_email_value, dkd_set_email_value] = useState('');
  const [dkd_password_value, dkd_set_password_value] = useState('');
  const [dkd_full_name_value, dkd_set_full_name_value] = useState('');
  const [dkd_username_value, dkd_set_username_value] = useState('');
  const [dkd_country_value, dkd_set_country_value] = useState('Türkiye');
  const [dkd_city_value, dkd_set_city_value] = useState('Antalya');
  const [dkd_region_value, dkd_set_region_value] = useState('');
  const [dkd_accepted_value, dkd_set_accepted_value] = useState(false);
  const [dkd_busy_value, dkd_set_busy_value] = useState(false);

  const dkd_register_value = dkd_mode_value === 'register';

  async function dkd_submit_value() {
    const dkd_email_clean_value = String(dkd_email_value || '').trim().toLowerCase();
    if (!dkd_email_clean_value || String(dkd_password_value || '').length < 6) {
      Alert.alert('DraBornGo', 'Geçerli e-posta ve en az 6 karakter şifre gerekli.');
      return;
    }
    if (dkd_register_value && !dkd_accepted_value) {
      Alert.alert('DraBornGo', 'Kayıt için Kullanım Koşulları ve Gizlilik Politikasını kabul etmelisin.');
      return;
    }

    dkd_set_busy_value(true);
    const dkd_response_value = dkd_register_value
      ? await signUpWithEmail(dkd_email_clean_value, dkd_password_value, {
          dkd_country: String(dkd_country_value || '').trim() || 'Türkiye',
          dkd_city: String(dkd_city_value || '').trim() || 'Antalya',
          dkd_region: String(dkd_region_value || '').trim(),
          dkd_full_name: String(dkd_full_name_value || '').trim(),
          dkd_username: String(dkd_username_value || '').trim().replace(/\s+/g, '').toLowerCase(),
          dkd_terms_accepted: true,
          dkd_terms_accepted_at: new Date().toISOString(),
          dkd_terms_version: dkd_policy_version_value,
          dkd_privacy_version: dkd_policy_version_value,
          dkd_community_policy_version: dkd_policy_version_value,
        })
      : await signInWithEmail(dkd_email_clean_value, dkd_password_value);
    dkd_set_busy_value(false);

    if (dkd_response_value?.error) {
      Alert.alert('DraBornGo', String(dkd_response_value.error.message || 'İşlem tamamlanamadı.'));
      return;
    }

    if (dkd_register_value && !dkd_response_value?.data?.session) {
      Alert.alert('Kayıt tamamlandı', 'E-posta doğrulaması açıksa gelen kutunu kontrol et, ardından giriş yap.');
      dkd_set_mode_value('login');
    }
  }

  return React.createElement(
    dkd_safe_screen_value,
    null,
    React.createElement(
      KeyboardAvoidingView,
      { style: { flex: 1 }, behavior: Platform.OS === 'ios' ? 'padding' : undefined },
      React.createElement(
        ScrollView,
        { contentContainerStyle: dkd_styles_value.dkd_content_value, keyboardShouldPersistTaps: 'handled' },
        React.createElement(Text, { style: dkd_styles_value.dkd_brand_value }, 'DraBornGo'),
        React.createElement(Text, { style: dkd_styles_value.dkd_version_value }, 'v0.0.6 • Expo Go test kanalı'),
        React.createElement(Text, { style: dkd_styles_value.dkd_title_value }, dkd_register_value ? 'Yeni hesap oluştur' : 'Hesabına giriş yap'),
        React.createElement(Text, { style: dkd_styles_value.dkd_body_value }, 'Kurye ve şehir hizmet operasyonlarını tek merkezden yönet.'),

        dkd_register_value ? React.createElement(
          View,
          null,
          dkd_input_value({ value: dkd_full_name_value, onChangeText: dkd_set_full_name_value, placeholder: 'Ad soyad', autoCapitalize: 'words' }),
          dkd_input_value({ value: dkd_username_value, onChangeText: dkd_set_username_value, placeholder: 'Kullanıcı adı', autoCapitalize: 'none' }),
          dkd_input_value({ value: dkd_country_value, onChangeText: dkd_set_country_value, placeholder: 'Ülke' }),
          dkd_input_value({ value: dkd_city_value, onChangeText: dkd_set_city_value, placeholder: 'Şehir' }),
          dkd_input_value({ value: dkd_region_value, onChangeText: dkd_set_region_value, placeholder: 'İlçe / bölge' }),
        ) : null,

        dkd_input_value({
          value: dkd_email_value,
          onChangeText: dkd_set_email_value,
          placeholder: 'E-posta',
          autoCapitalize: 'none',
          keyboardType: 'email-address',
          autoComplete: 'email',
        }),
        dkd_input_value({
          value: dkd_password_value,
          onChangeText: dkd_set_password_value,
          placeholder: 'Şifre',
          secureTextEntry: true,
          autoCapitalize: 'none',
        }),

        dkd_register_value ? React.createElement(
          Pressable,
          { onPress: () => dkd_set_accepted_value((dkd_previous_value) => !dkd_previous_value), style: dkd_styles_value.dkd_accept_value },
          React.createElement(View, { style: [dkd_styles_value.dkd_checkbox_value, dkd_accepted_value ? dkd_styles_value.dkd_checkbox_active_value : null] }),
          React.createElement(Text, { style: dkd_styles_value.dkd_accept_text_value }, 'Kullanım Koşulları ve Gizlilik Politikasını okudum, kabul ediyorum.'),
        ) : null,

        React.createElement(
          Pressable,
          { disabled: dkd_busy_value, onPress: dkd_submit_value, style: dkd_styles_value.dkd_primary_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_primary_text_value }, dkd_busy_value ? 'İşleniyor…' : dkd_register_value ? 'Hesap Oluştur' : 'Giriş Yap'),
        ),

        React.createElement(
          Pressable,
          { onPress: () => dkd_set_mode_value(dkd_register_value ? 'login' : 'register'), style: dkd_styles_value.dkd_secondary_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_secondary_text_value }, dkd_register_value ? 'Zaten hesabım var' : 'Yeni hesap oluştur'),
        ),

        React.createElement(
          View,
          { style: dkd_styles_value.dkd_policy_row_value },
          React.createElement(Pressable, { onPress: () => Linking.openURL(dkd_terms_url_value) }, React.createElement(Text, { style: dkd_styles_value.dkd_link_value }, 'Kullanım Koşulları')),
          React.createElement(Pressable, { onPress: () => Linking.openURL(dkd_privacy_url_value) }, React.createElement(Text, { style: dkd_styles_value.dkd_link_value }, 'Gizlilik Politikası')),
        ),
      ),
    ),
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_content_value: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#050B15' },
  dkd_brand_value: { color: '#79E6FF', fontSize: 15, fontWeight: '900', letterSpacing: 1.2 },
  dkd_version_value: { color: '#71849B', fontSize: 11, fontWeight: '800', marginTop: 4 },
  dkd_title_value: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', marginTop: 20 },
  dkd_body_value: { color: '#A0B0C3', fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 20 },
  dkd_input_value: { minHeight: 54, borderRadius: 17, borderWidth: 1, borderColor: '#243A53', backgroundColor: '#0D1928', color: '#FFFFFF', paddingHorizontal: 15, marginBottom: 10, fontWeight: '700' },
  dkd_accept_value: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginVertical: 8 },
  dkd_checkbox_value: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: '#496177', backgroundColor: '#101C2B' },
  dkd_checkbox_active_value: { backgroundColor: '#79E6FF', borderColor: '#79E6FF' },
  dkd_accept_text_value: { flex: 1, color: '#A6B4C5', fontSize: 12, lineHeight: 18, fontWeight: '650' },
  dkd_primary_value: { minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#79E6FF', marginTop: 12 },
  dkd_primary_text_value: { color: '#06111C', fontSize: 16, fontWeight: '900' },
  dkd_secondary_value: { minHeight: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#28415B', backgroundColor: '#0B1624', marginTop: 10 },
  dkd_secondary_text_value: { color: '#D9E4EF', fontWeight: '850' },
  dkd_policy_row_value: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 20 },
  dkd_link_value: { color: '#79E6FF', fontSize: 12, fontWeight: '800' },
});
