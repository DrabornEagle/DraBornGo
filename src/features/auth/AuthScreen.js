import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { dkd_make_native_axis_point } from '../../utils/dkdNativeAxis';

const dkd_login_secure_mockup_image_value = require('../../../assets/dkd_login/dkd_login_secure_gate.png');
const dkd_terms_public_url_value = 'https://www.draborneagle.com/draborngo/terms/';
const dkd_privacy_public_url_value = 'https://www.draborneagle.com/draborngo/privacy/';
const dkd_community_public_url_value = 'https://www.draborneagle.com/draborngo/community/';
const dkd_terms_version_value = '2026-08-08-v0.0.7';
const dkd_privacy_version_value = '2026-08-08-v0.0.7';
const dkd_community_policy_version_value = '2026-08-08-v0.0.7';

const dkd_region_presets_value = {
  Türkiye: {
    Ankara: ['Çankaya', 'Etimesgut', 'Eryaman', 'Yenimahalle', 'Keçiören', 'Sincan', 'Mamak', 'Gölbaşı', 'Pursaklar', 'Altındağ'],
    İstanbul: ['Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar', 'Bakırköy', 'Ataşehir', 'Maltepe', 'Beylikdüzü'],
    İzmir: ['Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Balçova', 'Gaziemir'],
  },
  USA: {
    'New York': ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
    'Los Angeles': ['Hollywood', 'Downtown LA', 'Santa Monica', 'Beverly Hills', 'Pasadena'],
    Miami: ['Downtown Miami', 'Miami Beach', 'Brickell', 'Wynwood', 'Doral'],
    Chicago: ['The Loop', 'River North', 'Lincoln Park', 'Hyde Park'],
    Houston: ['Downtown Houston', 'Midtown', 'Uptown', 'Westchase'],
  },
  BAE: {
    Dubai: ['Downtown', 'Business Bay', 'Dubai Marina', 'Jumeirah', 'Deira', 'Al Barsha'],
    AbuDhabi: ['Corniche', 'Yas Island', 'Khalifa City', 'Al Reem'],
  },
};

const dkd_country_options_value = Object.keys(dkd_region_presets_value);

function dkd_country_city_options_value(dkd_country_value) {
  return Object.keys(dkd_region_presets_value?.[dkd_country_value] || dkd_region_presets_value['Türkiye']);
}

function dkd_region_options_value(dkd_country_value, dkd_city_value) {
  return dkd_region_presets_value?.[dkd_country_value]?.[dkd_city_value] || [];
}

function dkd_pretty_auth_error(dkd_error_value, dkd_action_name) {
  const dkd_message_text = String((dkd_error_value && dkd_error_value.message) || dkd_error_value || '');
  const dkd_message_lower = dkd_message_text.toLowerCase();

  if (dkd_message_lower.includes('supabase ayarı eksik')) return 'Supabase .env ayarı eksik. URL ve anon key alanlarını doldur.';
  if (dkd_message_lower.includes('invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (dkd_message_lower.includes('email not confirmed')) return 'E-posta doğrulaması gerekiyor olabilir.';
  if (dkd_message_lower.includes('user already registered')) return 'Bu e-posta zaten kayıtlı. Direkt giriş yapabilirsin.';
  if (dkd_message_lower.includes('password should be at least')) return 'Şifre en az 6 karakter olmalı.';
  return dkd_message_text || (dkd_action_name === 'register' ? 'Kayıt sırasında hata oluştu.' : 'Giriş sırasında hata oluştu.');
}

function dkd_normalize_email(dkd_raw_value) {
  return String(dkd_raw_value || '').trim().toLowerCase();
}

function dkd_normalize_register_username(dkd_raw_value) {
  return String(dkd_raw_value || '').trim().replace(/\s+/g, '').toLowerCase();
}

function DkdAuthPill({ dkd_icon_name, dkd_text }) {
  return (
    <View style={dkd_styles.dkd_pill_shell}>
      <MaterialCommunityIcons name={dkd_icon_name} size={14} color="#9AF8FF" />
      <Text style={dkd_styles.dkd_pill_text}>{dkd_text}</Text>
    </View>
  );
}

function DkdLoginCityPreview({ dkd_glow_opacity_value, dkd_hero_glow_scale_value }) {
  return (
    <View style={dkd_styles.dkd_login_preview_card}>
      <Image source={dkd_login_secure_mockup_image_value} resizeMode="cover" style={dkd_styles.dkd_login_secure_mockup_image} />
      <Animated.View
        pointerEvents="none"
        style={[
          dkd_styles.dkd_login_secure_mockup_glow,
          { opacity: dkd_glow_opacity_value, transform: [{ scale: dkd_hero_glow_scale_value }] },
        ]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(4,7,19,0.02)', 'rgba(4,7,19,0.00)', 'rgba(4,7,19,0.22)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function DkdRegisterChoiceRow({ dkd_options, dkd_value, dkd_on_change, dkd_icon_name }) {
  return (
    <View style={dkd_styles.dkd_choice_wrap}>
      {dkd_options.map((dkd_option_value) => {
        const dkd_active_value = String(dkd_value || '') === String(dkd_option_value || '');
        return (
          <Pressable
            key={dkd_option_value}
            onPress={() => dkd_on_change?.(dkd_option_value)}
            style={[dkd_styles.dkd_choice_chip, dkd_active_value && dkd_styles.dkd_choice_chip_active]}
          >
            {dkd_active_value ? <LinearGradient colors={['#8CF2FF', '#82FFCB', '#FFD36E']} style={StyleSheet.absoluteFill} /> : null}
            <MaterialCommunityIcons name={dkd_icon_name} size={13} color={dkd_active_value ? '#07111C' : 'rgba(231,241,255,0.78)'} />
            <Text style={[dkd_styles.dkd_choice_text, dkd_active_value && dkd_styles.dkd_choice_text_active]}>{dkd_option_value}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AuthScreen({ mode = 'login', setMode = () => {} }) {
  const [dkd_email_value, dkd_set_email_value] = useState('');
  const [dkd_password_value, dkd_set_password_value] = useState('');
  const [dkd_show_password_flag, dkd_set_show_password_flag] = useState(false);
  const [dkd_loading_name, dkd_set_loading_name] = useState(null);
  const [dkd_register_modal_open_flag, dkd_set_register_modal_open_flag] = useState(mode === 'register');
  const [dkd_register_full_name_value, dkd_set_register_full_name_value] = useState('');
  const [dkd_register_username_value, dkd_set_register_username_value] = useState('');
  const [dkd_register_email_value, dkd_set_register_email_value] = useState('');
  const [dkd_register_password_value, dkd_set_register_password_value] = useState('');
  const [dkd_register_password_repeat_value, dkd_set_register_password_repeat_value] = useState('');
  const [dkd_register_show_password_flag, dkd_set_register_show_password_flag] = useState(false);
  const [dkd_register_country_value, dkd_set_register_country_value] = useState('Türkiye');
  const [dkd_register_city_value, dkd_set_register_city_value] = useState('Ankara');
  const [dkd_register_region_value, dkd_set_register_region_value] = useState('Çankaya');
  const [dkd_terms_accepted_flag, dkd_set_terms_accepted_flag] = useState(false);
  const dkd_glow_motion_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dkd_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_glow_motion_value, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(dkd_glow_motion_value, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ])
    );
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_glow_motion_value]);

  useEffect(() => {
    if (mode === 'register') dkd_set_register_modal_open_flag(true);
  }, [mode]);

  const dkd_available_city_options_value = useMemo(() => dkd_country_city_options_value(dkd_register_country_value), [dkd_register_country_value]);
  const dkd_available_region_options_value = useMemo(() => dkd_region_options_value(dkd_register_country_value, dkd_register_city_value), [dkd_register_country_value, dkd_register_city_value]);

  const dkd_hero_glow_opacity_value = dkd_glow_motion_value.interpolate({
    inputRange: [0, 1],
    outputRange: [0.38, 0.82],
  });
  const dkd_hero_glow_scale_value = dkd_glow_motion_value.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.08],
  });

  function dkd_open_register_modal() {
    if (dkd_loading_name) return;
    dkd_set_register_email_value(dkd_email_value);
    dkd_set_register_modal_open_flag(true);
    if (typeof setMode === 'function') setMode('register');
  }

  function dkd_close_register_modal() {
    dkd_set_register_modal_open_flag(false);
    if (typeof setMode === 'function') setMode('login');
  }

  function dkd_change_register_country(dkd_country_value) {
    const dkd_next_city_value = dkd_country_city_options_value(dkd_country_value)?.[0] || '';
    const dkd_next_region_value = dkd_region_options_value(dkd_country_value, dkd_next_city_value)?.[0] || '';
    dkd_set_register_country_value(dkd_country_value);
    dkd_set_register_city_value(dkd_next_city_value);
    dkd_set_register_region_value(dkd_next_region_value);
  }

  function dkd_change_register_city(dkd_city_value) {
    const dkd_next_region_value = dkd_region_options_value(dkd_register_country_value, dkd_city_value)?.[0] || '';
    dkd_set_register_city_value(dkd_city_value);
    dkd_set_register_region_value(dkd_next_region_value);
  }

  function dkd_toggle_terms_accepted() {
    dkd_set_terms_accepted_flag((dkd_current_flag_value) => !dkd_current_flag_value);
  }

  async function dkd_open_policy_url(dkd_url_value) {
    try {
      await Linking.openURL(dkd_url_value);
    } catch {
      Alert.alert('Yasal Bağlantı', 'Bağlantı açılamadı. Lütfen www.draborneagle.com üzerinden tekrar dene.');
    }
  }

  async function dkd_do_login() {
    try {
      const dkd_email_clean = dkd_normalize_email(dkd_email_value);
      if (!dkd_email_clean || !dkd_password_value) {
        Alert.alert('Giriş', 'E-posta ve şifre gir.');
        return;
      }
      dkd_set_loading_name('login');
      const dkd_result_value = await signInWithEmail(dkd_email_clean, dkd_password_value);
      if (dkd_result_value?.error) throw dkd_result_value.error;
    } catch (dkd_error_value) {
      Alert.alert('Giriş Hatası', dkd_pretty_auth_error(dkd_error_value, 'login'));
    } finally {
      dkd_set_loading_name(null);
    }
  }

  async function dkd_do_register() {
    try {
      const dkd_email_clean = dkd_normalize_email(dkd_register_email_value);
      const dkd_full_name_clean = String(dkd_register_full_name_value || '').trim();
      const dkd_username_clean = dkd_normalize_register_username(dkd_register_username_value);
      const dkd_country_clean = String(dkd_register_country_value || '').trim();
      const dkd_city_clean = String(dkd_register_city_value || '').trim();
      const dkd_region_clean = String(dkd_register_region_value || '').trim();
      if (!dkd_full_name_clean || !dkd_username_clean) {
        Alert.alert('Kayıt', 'Ad Soyad ve Kullanıcı Adı alanlarını doldur.');
        return;
      }
      if (dkd_username_clean.length < 3 || dkd_username_clean.length > 24) {
        Alert.alert('Kayıt', 'Kullanıcı adı 3–24 karakter olmalı.');
        return;
      }
      if (!dkd_email_clean || !dkd_register_password_value || !dkd_register_password_repeat_value) {
        Alert.alert('Kayıt', 'E-posta, şifre ve şifre tekrar alanlarını doldur.');
        return;
      }
      if (!dkd_country_clean || !dkd_city_clean || !dkd_region_clean) {
        Alert.alert('Kayıt', 'Ülke, şehir ve bölge seç.');
        return;
      }
      if (dkd_register_password_value !== dkd_register_password_repeat_value) {
        Alert.alert('Kayıt', 'Şifreler aynı değil.');
        return;
      }
      if (dkd_register_password_value.length < 6) {
        Alert.alert('Kayıt', 'Şifre en az 6 karakter olmalı.');
        return;
      }
      if (!dkd_terms_accepted_flag) {
        Alert.alert('Kayıt', 'Devam etmek için Kullanım Şartları, Topluluk Kuralları ve Gizlilik Politikası kabul edilmeli.');
        return;
      }
      const dkd_terms_accepted_at_value = new Date().toISOString();
      dkd_set_loading_name('register');
      const dkd_result_value = await signUpWithEmail(dkd_email_clean, dkd_register_password_value, {
        dkd_full_name: dkd_full_name_clean,
        dkd_username: dkd_username_clean,
        dkd_country: dkd_country_clean,
        dkd_city: dkd_city_clean,
        dkd_region: dkd_region_clean,
        dkd_terms_accepted: true,
        dkd_terms_accepted_at: dkd_terms_accepted_at_value,
        dkd_terms_version: dkd_terms_version_value,
        dkd_privacy_version: dkd_privacy_version_value,
        dkd_community_policy_version: dkd_community_policy_version_value,
      });
      if (dkd_result_value?.error) throw dkd_result_value.error;
      const dkd_mail_confirm_needed = !(dkd_result_value?.data && dkd_result_value.data.session);
      Alert.alert(
        'Kayıt başarılı',
        dkd_mail_confirm_needed
          ? 'Hesap oluşturuldu. Gerekirse e-postanı onayla. Bölge bilgisi profiline işlendi.'
          : 'Hesap oluşturuldu. Bölge bilgisi profiline işlendi ve giriş hazır.'
      );
      dkd_close_register_modal();
      dkd_set_register_full_name_value('');
      dkd_set_register_username_value('');
      dkd_set_register_email_value('');
      dkd_set_register_password_value('');
      dkd_set_register_password_repeat_value('');
      dkd_set_register_show_password_flag(false);
      dkd_set_terms_accepted_flag(false);
      dkd_set_email_value(dkd_email_clean);
    } catch (dkd_error_value) {
      Alert.alert('Kayıt Hatası', dkd_pretty_auth_error(dkd_error_value, 'register'));
    } finally {
      dkd_set_loading_name(null);
    }
  }

  return (
    <View style={dkd_styles.dkd_root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient colors={['#030713', '#071B2B', '#160A2E', '#040711']} style={dkd_styles.dkd_root}>
        <View style={dkd_styles.dkd_orb_blue} />
        <View style={dkd_styles.dkd_orb_purple} />
        <Animated.View style={[dkd_styles.dkd_hero_glow, { opacity: dkd_hero_glow_opacity_value, transform: [{ scale: dkd_hero_glow_scale_value }] }]} />
        <KeyboardAvoidingView style={dkd_styles.dkd_keyboard_shell} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={dkd_styles.dkd_scroll_shell} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={dkd_styles.dkd_brand_shell}>
              <View style={dkd_styles.dkd_brand_overline_row}>
                <MaterialCommunityIcons name="star-four-points" size={15} color="#FDE68A" />
                <Text style={dkd_styles.dkd_brand_overline}>DraBornGo ŞEHİR GİRİŞ KAPISI</Text>
              </View>
              <Text style={dkd_styles.dkd_brand_title}>Şehir Ağına Hoş Geldin</Text>
            </View>

            <DkdLoginCityPreview dkd_glow_opacity_value={dkd_hero_glow_opacity_value} dkd_hero_glow_scale_value={dkd_hero_glow_scale_value} />


            <View style={dkd_styles.dkd_pill_row}>
              <DkdAuthPill dkd_icon_name="truck-fast-outline" dkd_text="Kurye-Kargo" />
              <DkdAuthPill dkd_icon_name="food-fork-drink" dkd_text="Yemek-Market" />
              <DkdAuthPill dkd_icon_name="storefront-outline" dkd_text="Hizmet Ağı" />
            </View>

            <View style={dkd_styles.dkd_auth_card}>
              <LinearGradient colors={['rgba(255,255,255,0.16)', 'rgba(14,165,233,0.08)', 'rgba(168,85,247,0.12)']} style={StyleSheet.absoluteFill} />
              <View style={dkd_styles.dkd_card_top_line} />
              <View style={dkd_styles.dkd_card_header_row}>
                <LinearGradient colors={['#67E8F9', '#A78BFA']} style={dkd_styles.dkd_card_icon_shell}>
                  <MaterialCommunityIcons name="account-key-outline" size={22} color="#06111F" />
                </LinearGradient>
                <View style={dkd_styles.dkd_card_header_copy}>
                  <Text style={dkd_styles.dkd_card_kicker}>GÜVENLİ OTURUM</Text>
                  <Text style={dkd_styles.dkd_card_title}>Şehir merkezine giriş</Text>
                </View>
              </View>
              <Text style={dkd_styles.dkd_card_subtitle}>Hesabınla devam et; sipariş havuzu, kurye, işletme ve hizmet ağı akışların açılsın.</Text>

              <View style={dkd_styles.dkd_input_shell}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#9AF8FF" />
                <TextInput
                  value={dkd_email_value}
                  onChangeText={dkd_set_email_value}
                  placeholder="E-posta"
                  placeholderTextColor="rgba(231,241,255,0.42)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor="#9AF8FF"
                  style={dkd_styles.dkd_input_text}
                />
              </View>

              <View style={dkd_styles.dkd_input_shell}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#B7A6FF" />
                <TextInput
                  value={dkd_password_value}
                  onChangeText={dkd_set_password_value}
                  placeholder="Şifre"
                  placeholderTextColor="rgba(231,241,255,0.42)"
                  secureTextEntry={!dkd_show_password_flag}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor="#B7A6FF"
                  returnKeyType="go"
                  onSubmitEditing={dkd_do_login}
                  style={dkd_styles.dkd_input_text}
                />
                <Pressable onPress={() => dkd_set_show_password_flag((dkd_flag_value) => !dkd_flag_value)} hitSlop={10}>
                  <MaterialCommunityIcons name={dkd_show_password_flag ? 'eye-off-outline' : 'eye-outline'} size={21} color="rgba(231,241,255,0.76)" />
                </Pressable>
              </View>

              <Pressable onPress={dkd_do_login} disabled={dkd_loading_name === 'login'} style={[dkd_styles.dkd_primary_button, dkd_loading_name === 'login' && dkd_styles.dkd_disabled_button]}>
                <LinearGradient colors={['#62E6FF', '#708FFF', '#C46BFF']} start={dkd_make_native_axis_point(0, 0)} end={dkd_make_native_axis_point(1, 1)} style={StyleSheet.absoluteFill} />
                <MaterialCommunityIcons name="rocket-launch-outline" size={19} color="#FFFFFF" />
                <Text style={dkd_styles.dkd_primary_button_text}>{dkd_loading_name === 'login' ? 'Giriş yapılıyor...' : 'DraBornGo’ya Gir'}</Text>
              </Pressable>


              <View style={dkd_styles.dkd_auth_action_row}>
                <Pressable onPress={() => Alert.alert('Şifre Sıfırla', 'Şifre sıfırlama akışı sonraki fazda bağlanacak.')} style={dkd_styles.dkd_link_button}>
                  <Text style={dkd_styles.dkd_link_text}>Şifremi unuttum</Text>
                </Pressable>
                <Pressable onPress={dkd_open_register_modal} style={dkd_styles.dkd_register_button}>
                  <MaterialCommunityIcons name="account-plus-outline" size={16} color="#07111C" />
                  <Text style={dkd_styles.dkd_register_button_text}>Yeni hesap aç</Text>
                </Pressable>
              </View>
            </View>

            <View style={dkd_styles.dkd_bottom_note_card}>
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#63F1B1" />
              <Text style={dkd_styles.dkd_bottom_note_text}>Yeni kayıt sırasında seçtiğin ülke, şehir ve bölge sipariş eşleşmeleri ve hizmet ağı deneyimi için kullanılacak.</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <Modal visible={dkd_register_modal_open_flag} animationType="slide" onRequestClose={dkd_close_register_modal}>
        <KeyboardAvoidingView style={dkd_styles.dkd_modal_backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <LinearGradient colors={['#040A19', '#082A3E', '#25104A', '#070915']} style={StyleSheet.absoluteFill} />
          <View style={dkd_styles.dkd_modal_orb_cyan} />
          <View style={dkd_styles.dkd_modal_orb_gold} />
          <View style={dkd_styles.dkd_modal_card}>
            <View style={dkd_styles.dkd_modal_header_row}>
              <View style={dkd_styles.dkd_modal_header_title_row}>
                <LinearGradient colors={['#62E6FF', '#72FFBF', '#FFE074']} style={dkd_styles.dkd_modal_logo}>
                  <MaterialCommunityIcons name="account-star-outline" size={24} color="#061427" />
                </LinearGradient>
                <View style={dkd_styles.dkd_modal_header_copy}>
                  <Text style={dkd_styles.dkd_modal_title}>Kayıt Ol</Text>
                  <Text style={dkd_styles.dkd_modal_subtitle}>Hesap ve lokasyon bilgilerin tek adımda hazır.</Text>
                </View>
              </View>
              <Pressable onPress={dkd_close_register_modal} style={dkd_styles.dkd_modal_close_button}>
                <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={dkd_styles.dkd_modal_scroll_content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={dkd_styles.dkd_register_hero_card}>
                <LinearGradient colors={['rgba(98,230,255,0.24)', 'rgba(114,255,191,0.14)', 'rgba(255,224,116,0.12)']} style={StyleSheet.absoluteFill} />
                <View style={dkd_styles.dkd_register_hero_icon}>
                  <MaterialCommunityIcons name="city-variant-outline" size={26} color="#FFE074" />
                </View>
                <View style={dkd_styles.dkd_register_hero_copy}>
                  <Text style={dkd_styles.dkd_register_hero_title}>DraBornGo hesabını kur</Text>
                  <Text style={dkd_styles.dkd_register_hero_text}>Bölgeni seç, kurye-kargo ve market akışlarında doğru sipariş eşleşmesine hazır ol.</Text>
                </View>
              </View>

              <View style={dkd_styles.dkd_register_badge_row}>
                <View style={dkd_styles.dkd_register_badge_chip}>
                  <MaterialCommunityIcons name="shield-check-outline" size={14} color="#9AF8FF" />
                  <Text style={dkd_styles.dkd_register_badge_text}>Güvenli hesap</Text>
                </View>
                <View style={dkd_styles.dkd_register_badge_chip}>
                  <MaterialCommunityIcons name="map-marker-path" size={14} color="#72FFBF" />
                  <Text style={dkd_styles.dkd_register_badge_text}>Bölge eşleşmesi</Text>
                </View>
              </View>

              <View style={dkd_styles.dkd_modal_section_card}>
                <View style={dkd_styles.dkd_modal_section_header}>
                  <View style={dkd_styles.dkd_modal_section_icon}>
                    <MaterialCommunityIcons name="account-key-outline" size={18} color="#061427" />
                  </View>
                  <View>
                    <Text style={dkd_styles.dkd_modal_section_kicker}>1. ADIM</Text>
                    <Text style={dkd_styles.dkd_modal_section_heading}>Hesap bilgileri</Text>
                  </View>
                </View>

                <View style={dkd_styles.dkd_modal_input_shell}>
                  <MaterialCommunityIcons name="account-outline" size={18} color="#72FFBF" />
                  <TextInput
                    value={dkd_register_full_name_value}
                    onChangeText={dkd_set_register_full_name_value}
                    placeholder="Ad Soyad"
                    placeholderTextColor="rgba(231,241,255,0.42)"
                    autoCapitalize="words"
                    autoCorrect={false}
                    style={dkd_styles.dkd_modal_input}
                  />
                </View>

                <View style={dkd_styles.dkd_modal_input_shell}>
                  <MaterialCommunityIcons name="account-badge-outline" size={18} color="#FFE074" />
                  <TextInput
                    value={dkd_register_username_value}
                    onChangeText={dkd_set_register_username_value}
                    placeholder="Kullanıcı Adı"
                    placeholderTextColor="rgba(231,241,255,0.42)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={dkd_styles.dkd_modal_input}
                  />
                </View>

                <View style={dkd_styles.dkd_modal_input_shell}>
                  <MaterialCommunityIcons name="email-outline" size={18} color="#9AF8FF" />
                  <TextInput
                    value={dkd_register_email_value}
                    onChangeText={dkd_set_register_email_value}
                    placeholder="E-posta"
                    placeholderTextColor="rgba(231,241,255,0.42)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={dkd_styles.dkd_modal_input}
                  />
                </View>

                <View style={dkd_styles.dkd_modal_input_shell}>
                  <MaterialCommunityIcons name="lock-outline" size={18} color="#B7A6FF" />
                  <TextInput
                    value={dkd_register_password_value}
                    onChangeText={dkd_set_register_password_value}
                    placeholder="Şifre"
                    placeholderTextColor="rgba(231,241,255,0.42)"
                    secureTextEntry={!dkd_register_show_password_flag}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={dkd_styles.dkd_modal_input}
                  />
                </View>

                <View style={dkd_styles.dkd_modal_input_shell}>
                  <MaterialCommunityIcons name="lock-check-outline" size={18} color="#63F1B1" />
                  <TextInput
                    value={dkd_register_password_repeat_value}
                    onChangeText={dkd_set_register_password_repeat_value}
                    placeholder="Şifre tekrar"
                    placeholderTextColor="rgba(231,241,255,0.42)"
                    secureTextEntry={!dkd_register_show_password_flag}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={dkd_styles.dkd_modal_input}
                  />
                </View>

                <Pressable onPress={() => dkd_set_register_show_password_flag((dkd_flag_value) => !dkd_flag_value)} style={dkd_styles.dkd_modal_switch_btn}>
                  <MaterialCommunityIcons name={dkd_register_show_password_flag ? 'eye-off-outline' : 'eye-outline'} size={16} color="#A9E8FF" />
                  <Text style={dkd_styles.dkd_modal_switch_text}>{dkd_register_show_password_flag ? 'Şifreyi gizle' : 'Şifreyi göster'}</Text>
                </Pressable>
              </View>

              <View style={dkd_styles.dkd_modal_section_card}>
                <View style={dkd_styles.dkd_modal_section_header}>
                  <View style={dkd_styles.dkd_modal_section_icon}>
                    <MaterialCommunityIcons name="map-marker-star-outline" size={18} color="#061427" />
                  </View>
                  <View>
                    <Text style={dkd_styles.dkd_modal_section_kicker}>2. ADIM</Text>
                    <Text style={dkd_styles.dkd_modal_section_heading}>Operasyon bölgesi</Text>
                  </View>
                </View>

                <Text style={dkd_styles.dkd_modal_section_title}>Ülke</Text>
                <DkdRegisterChoiceRow dkd_options={dkd_country_options_value} dkd_value={dkd_register_country_value} dkd_on_change={dkd_change_register_country} dkd_icon_name="flag-outline" />

                <Text style={dkd_styles.dkd_modal_section_title}>Şehir</Text>
                <DkdRegisterChoiceRow dkd_options={dkd_available_city_options_value} dkd_value={dkd_register_city_value} dkd_on_change={dkd_change_register_city} dkd_icon_name="city-variant-outline" />

                <Text style={dkd_styles.dkd_modal_section_title}>Bölge</Text>
                <DkdRegisterChoiceRow dkd_options={dkd_available_region_options_value} dkd_value={dkd_register_region_value} dkd_on_change={dkd_set_register_region_value} dkd_icon_name="map-marker-radius-outline" />
              </View>

              <View style={dkd_styles.dkd_terms_card}>
                <Pressable onPress={dkd_toggle_terms_accepted} style={dkd_styles.dkd_terms_accept_row}>
                  <View style={[dkd_styles.dkd_terms_checkbox, dkd_terms_accepted_flag && dkd_styles.dkd_terms_checkbox_active]}>
                    {dkd_terms_accepted_flag ? <MaterialCommunityIcons name="check-bold" size={15} color="#061427" /> : null}
                  </View>
                  <View style={dkd_styles.dkd_terms_copy}>
                    <Text style={dkd_styles.dkd_terms_title}>Kullanım Şartları ve Topluluk Kuralları</Text>
                    <Text style={dkd_styles.dkd_terms_text}>DraBornGo içinde profil, mesaj, destek talebi, görsel ve sipariş açıklaması paylaşırken güvenli topluluk kurallarını ve gizlilik politikasını kabul ediyorum.</Text>
                  </View>
                </Pressable>
                <View style={dkd_styles.dkd_terms_link_row}>
                  <Pressable onPress={() => dkd_open_policy_url(dkd_terms_public_url_value)} style={dkd_styles.dkd_terms_link_pill}>
                    <MaterialCommunityIcons name="file-document-check-outline" size={14} color="#8CF2FF" />
                    <Text style={dkd_styles.dkd_terms_link_text}>Kullanım Şartları</Text>
                  </Pressable>
                  <Pressable onPress={() => dkd_open_policy_url(dkd_privacy_public_url_value)} style={dkd_styles.dkd_terms_link_pill}>
                    <MaterialCommunityIcons name="shield-lock-outline" size={14} color="#72FFBF" />
                    <Text style={dkd_styles.dkd_terms_link_text}>Gizlilik Politikası</Text>
                  </Pressable>
                  <Pressable onPress={() => dkd_open_policy_url(dkd_community_public_url_value)} style={dkd_styles.dkd_terms_link_pill}>
                    <MaterialCommunityIcons name="account-group-outline" size={14} color="#FFE074" />
                    <Text style={dkd_styles.dkd_terms_link_text}>Topluluk Kuralları</Text>
                  </Pressable>
                </View>
              </View>

              <View style={dkd_styles.dkd_modal_action_row}>
                <Pressable onPress={dkd_close_register_modal} style={[dkd_styles.dkd_modal_btn, dkd_styles.dkd_modal_btn_ghost]}>
                  <Text style={dkd_styles.dkd_modal_btn_text}>Vazgeç</Text>
                </Pressable>
                <Pressable onPress={dkd_do_register} disabled={dkd_loading_name === 'register' || !dkd_terms_accepted_flag} style={[dkd_styles.dkd_modal_btn, dkd_styles.dkd_modal_btn_primary, (dkd_loading_name === 'register' || !dkd_terms_accepted_flag) && dkd_styles.dkd_disabled_button]}>
                  <LinearGradient colors={['#62E6FF', '#72FFBF', '#FFE074']} style={StyleSheet.absoluteFill} />
                  <MaterialCommunityIcons name="account-check-outline" size={18} color="#061427" />
                  <Text style={dkd_styles.dkd_modal_btn_primary_text}>{dkd_loading_name === 'register' ? 'Oluşturuluyor...' : 'Hesap Oluştur'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_root: { flex: 1, backgroundColor: '#030713' },
  dkd_keyboard_shell: { flex: 1 },
  dkd_scroll_shell: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 46, paddingBottom: 26, justifyContent: 'center' },
  dkd_orb_blue: { position: 'absolute', width: 310, height: 310, borderRadius: 999, backgroundColor: 'rgba(56,189,248,0.28)', top: -110, right: -104 },
  dkd_orb_purple: { position: 'absolute', width: 330, height: 330, borderRadius: 999, backgroundColor: 'rgba(168,85,247,0.25)', bottom: -112, left: -122 },
  dkd_hero_glow: { position: 'absolute', width: 280, height: 280, borderRadius: 999, backgroundColor: 'rgba(34,211,238,0.18)', top: 178, alignSelf: 'center' },
  dkd_brand_shell: { alignItems: 'center', paddingHorizontal: 4 },
  dkd_logo_shell: { width: 74, height: 74, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)', shadowColor: '#67E8F9', shadowOpacity: 0.34, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  dkd_brand_copy: { marginTop: 18, alignItems: 'center', paddingHorizontal: 4 },
  dkd_brand_overline_row: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(15,23,42,0.48)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  dkd_brand_overline: { color: '#BAF6FF', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  dkd_brand_title: { color: '#FFFFFF', fontSize: 30, lineHeight: 35, textAlign: 'center', marginTop: 12, fontWeight: '900', letterSpacing: -0.75 },
  dkd_brand_subtitle: { color: 'rgba(231,241,255,0.78)', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, fontWeight: '700' },
  dkd_login_preview_card: { height: 218, borderRadius: 34, marginTop: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(2,6,23,0.64)', shadowColor: '#000000', shadowOpacity: 0.36, shadowRadius: 26, shadowOffset: { width: 0, height: 16 }, elevation: 12 },
  dkd_login_secure_mockup_image: { width: '100%', height: '100%', alignSelf: 'center', transform: [{ scale: 1.14 }] },
  dkd_login_secure_mockup_glow: { position: 'absolute', left: -18, right: -18, top: -16, bottom: -16, borderRadius: 36, backgroundColor: 'rgba(103,232,249,0.10)' },
  dkd_login_preview_glow: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(255,255,255,0.34)', alignSelf: 'center', top: 16, shadowColor: '#67E8F9', shadowOpacity: 0.44, shadowRadius: 34 },
  dkd_city_grid_horizontal: { position: 'absolute', left: 18, right: 18, top: 122, height: 1, backgroundColor: 'rgba(186,246,255,0.18)' },
  dkd_city_grid_vertical: { position: 'absolute', top: 20, bottom: 46, left: '50%', width: 1, backgroundColor: 'rgba(186,246,255,0.16)' },
  dkd_city_tower_group: { position: 'absolute', left: 25, right: 25, bottom: 45, height: 102, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dkd_city_tower: { width: 42, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', backgroundColor: 'rgba(15,23,42,0.72)' },
  dkd_city_tower_one: { height: 68 },
  dkd_city_tower_two: { height: 100, backgroundColor: 'rgba(14,165,233,0.34)' },
  dkd_city_tower_three: { height: 82, backgroundColor: 'rgba(168,85,247,0.32)' },
  dkd_city_tower_four: { height: 58, backgroundColor: 'rgba(34,197,94,0.22)' },
  dkd_route_beam: { position: 'absolute', left: 52, right: 52, bottom: 70, height: 5, borderRadius: 999, transform: [{ rotate: '-8deg' }], shadowColor: '#67E8F9', shadowOpacity: 0.42, shadowRadius: 18 },
  dkd_core_orbit_outer: { position: 'absolute', alignSelf: 'center', top: 42, width: 118, height: 118, borderRadius: 59, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.40)' },
  dkd_core_orbit_inner: { width: 86, height: 86, borderRadius: 43, borderWidth: 1, borderColor: 'rgba(186,246,255,0.28)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,6,23,0.50)' },
  dkd_core_icon_shell: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  dkd_signal_node: { position: 'absolute', minHeight: 34, borderRadius: 999, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(15,23,42,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  dkd_signal_node_one: { left: 18, top: 22 },
  dkd_signal_node_two: { right: 18, top: 58 },
  dkd_signal_node_three: { left: 26, bottom: 24 },
  dkd_signal_node_text: { color: '#E0F2FE', fontSize: 10, fontWeight: '900' },
  dkd_login_preview_footer: { position: 'absolute', right: 14, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(2,6,23,0.58)', borderWidth: 1, borderColor: 'rgba(134,239,172,0.24)' },
  dkd_login_preview_footer_text: { color: 'rgba(231,241,255,0.88)', fontSize: 10, fontWeight: '900' },
  dkd_pill_row: { flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 },
  dkd_pill_shell: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  dkd_pill_text: { color: 'rgba(231,241,255,0.90)', fontSize: 11, fontWeight: '900' },
  dkd_auth_card: { marginTop: 16, borderRadius: 30, padding: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(186,246,255,0.20)', backgroundColor: 'rgba(5,11,22,0.78)', shadowColor: '#000', shadowOpacity: 0.38, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 12 },
  dkd_card_top_line: { position: 'absolute', left: 24, right: 24, top: 0, height: 2, borderRadius: 99, backgroundColor: 'rgba(154,248,255,0.84)' },
  dkd_card_header_row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  dkd_card_icon_shell: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dkd_card_header_copy: { flex: 1 },
  dkd_card_kicker: { color: '#86EFAC', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 2 },
  dkd_card_title: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  dkd_card_subtitle: { color: 'rgba(231,241,255,0.70)', fontSize: 13, lineHeight: 19, marginBottom: 14, fontWeight: '700' },
  dkd_input_shell: { minHeight: 56, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(186,246,255,0.16)', backgroundColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, marginTop: 10 },
  dkd_input_text: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '800', paddingVertical: 0 },
  dkd_primary_button: { marginTop: 16, minHeight: 56, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, shadowColor: '#67E8F9', shadowOpacity: 0.32, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
  dkd_primary_button_text: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.2 },
  dkd_disabled_button: { opacity: 0.58 },
  dkd_auth_action_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 },
  dkd_link_button: { paddingVertical: 10, paddingHorizontal: 4 },
  dkd_link_text: { color: '#BAF6FF', fontSize: 13, fontWeight: '900' },
  dkd_register_button: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#8CF2FF' },
  dkd_register_button_text: { color: '#07111C', fontSize: 13, fontWeight: '900' },
  dkd_bottom_note_card: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, borderRadius: 20, padding: 13, backgroundColor: 'rgba(99,241,177,0.11)', borderWidth: 1, borderColor: 'rgba(99,241,177,0.20)' },
  dkd_bottom_note_text: { flex: 1, color: 'rgba(231,241,255,0.78)', fontSize: 12, lineHeight: 17, fontWeight: '800' },
  dkd_modal_backdrop: { flex: 1, backgroundColor: '#040A19', justifyContent: 'stretch' },
  dkd_modal_card: { flex: 1, borderRadius: 0, paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 48 : 62, paddingBottom: 14, overflow: 'hidden', backgroundColor: 'transparent', borderWidth: 0 },
  dkd_modal_orb_cyan: { position: 'absolute', width: 260, height: 260, borderRadius: 999, backgroundColor: 'rgba(98,230,255,0.20)', top: -70, right: -96 },
  dkd_modal_orb_gold: { position: 'absolute', width: 250, height: 250, borderRadius: 999, backgroundColor: 'rgba(255,224,116,0.15)', bottom: -88, left: -88 },
  dkd_modal_scroll_content: { paddingBottom: 18 },
  dkd_modal_header_title_row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  dkd_modal_logo: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.34)' },
  dkd_modal_header_copy: { flex: 1 },
  dkd_register_hero_card: { minHeight: 112, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, marginBottom: 10 },
  dkd_register_hero_icon: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5,11,22,0.48)', borderWidth: 1, borderColor: 'rgba(255,224,116,0.28)' },
  dkd_register_hero_copy: { flex: 1 },
  dkd_register_hero_title: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  dkd_register_hero_text: { color: 'rgba(231,241,255,0.74)', fontSize: 12, lineHeight: 17, marginTop: 5, fontWeight: '700' },
  dkd_register_badge_row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  dkd_register_badge_chip: { flex: 1, minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(255,255,255,0.075)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
  dkd_register_badge_text: { color: 'rgba(231,241,255,0.84)', fontSize: 11, fontWeight: '900' },
  dkd_modal_section_card: { borderRadius: 26, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(5,11,22,0.52)', marginTop: 10, overflow: 'hidden' },
  dkd_modal_section_header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  dkd_modal_section_icon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#9AF8FF' },
  dkd_modal_section_kicker: { color: '#72FFBF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  dkd_modal_section_heading: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 1 },
  dkd_modal_header_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  dkd_modal_title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  dkd_modal_subtitle: { color: 'rgba(231,241,255,0.70)', fontSize: 12, marginTop: 3, fontWeight: '700', lineHeight: 16 },
  dkd_modal_close_button: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_modal_input_shell: { minHeight: 54, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.075)', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, marginTop: 10 },
  dkd_modal_input: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '700', paddingVertical: 0 },
  dkd_modal_switch_btn: { marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 4, paddingVertical: 6 },
  dkd_modal_switch_text: { color: '#A9E8FF', fontWeight: '900', fontSize: 12 },
  dkd_modal_section_title: { color: '#DFFBFF', fontSize: 12, fontWeight: '900', marginTop: 14, marginBottom: 9, letterSpacing: 0.4 },
  dkd_choice_wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dkd_choice_chip: { minHeight: 38, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)' },
  dkd_choice_chip_active: { borderColor: 'rgba(255,255,255,0.34)' },
  dkd_choice_text: { color: 'rgba(231,241,255,0.82)', fontSize: 12, fontWeight: '800' },
  dkd_choice_text_active: { color: '#07111C', fontWeight: '900' },
  dkd_terms_card: { marginTop: 12, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(140,242,255,0.20)', backgroundColor: 'rgba(140,242,255,0.075)', padding: 13 },
  dkd_terms_accept_row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  dkd_terms_checkbox: { width: 28, height: 28, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.26)', backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  dkd_terms_checkbox_active: { backgroundColor: '#8CF2FF', borderColor: '#BAF6FF' },
  dkd_terms_copy: { flex: 1 },
  dkd_terms_title: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  dkd_terms_text: { color: 'rgba(231,241,255,0.74)', fontSize: 11.5, lineHeight: 16, fontWeight: '700', marginTop: 4 },
  dkd_terms_link_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
  dkd_terms_link_pill: { minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(5,11,22,0.34)', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 },
  dkd_terms_link_text: { color: '#E7F1FF', fontSize: 11, fontWeight: '900' },
  dkd_modal_action_row: { flexDirection: 'row', gap: 10, marginTop: 14, paddingBottom: 10 },
  dkd_modal_btn: { flex: 1, minHeight: 52, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  dkd_modal_btn_ghost: { backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  dkd_modal_btn_primary: { backgroundColor: '#62E6FF' },
  dkd_modal_btn_text: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  dkd_modal_btn_primary_text: { color: '#07111C', fontWeight: '900', fontSize: 14 },
});
