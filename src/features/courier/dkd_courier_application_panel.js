import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { submitCourierApplication } from '../../services/courierApplicationService';

const dkd_country_options_value = ['Türkiye', 'BAE'];
const dkd_city_options_value = {
  Türkiye: ['Ankara', 'İstanbul', 'İzmir', 'Bursa', 'Antalya', 'Konya'],
  BAE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
};
const dkd_region_options_value = {
  Ankara: ['Çankaya', 'Keçiören', 'Yenimahalle', 'Etimesgut', 'Sincan', 'Mamak', 'Altındağ', 'Gölbaşı'],
  İstanbul: ['Kadıköy', 'Üsküdar', 'Beşiktaş', 'Şişli', 'Bakırköy', 'Ataşehir', 'Ümraniye', 'Beylikdüzü'],
  İzmir: ['Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Bayraklı', 'Gaziemir'],
  Bursa: ['Osmangazi', 'Nilüfer', 'Yıldırım', 'Mudanya', 'Gemlik'],
  Antalya: ['Muratpaşa', 'Kepez', 'Konyaaltı', 'Aksu', 'Döşemealtı'],
  Konya: ['Selçuklu', 'Meram', 'Karatay'],
  Dubai: ['Downtown', 'Business Bay', 'Deira', 'Jumeirah', 'Marina', 'Al Barsha'],
  'Abu Dhabi': ['Corniche', 'Khalifa City', 'Al Reem', 'Mussafah', 'Yas Island'],
  Sharjah: ['Al Majaz', 'Al Nahda', 'Muwaileh', 'Industrial Area'],
  Ajman: ['Al Nuaimiya', 'Al Rashidiya', 'Al Jurf'],
};
const dkd_vehicle_options_value = [
  { dkd_value: 'moto', dkd_label: 'Motosiklet', dkd_icon: 'motorbike' },
  { dkd_value: 'car', dkd_label: 'Otomobil', dkd_icon: 'car-outline' },
  { dkd_value: 'bicycle', dkd_label: 'Bisiklet', dkd_icon: 'bike-fast' },
  { dkd_value: 'scooter', dkd_label: 'Scooter', dkd_icon: 'scooter' },
];
const dkd_document_options_value = [
  { dkd_key: 'identityFrontUri', dkd_label: 'Kimlik Ön', dkd_icon: 'card-account-details-outline', dkd_required: true },
  { dkd_key: 'identityBackUri', dkd_label: 'Kimlik Arka', dkd_icon: 'card-account-details-star-outline', dkd_required: true },
  { dkd_key: 'selfieUri', dkd_label: 'Selfie', dkd_icon: 'face-man-profile', dkd_required: true },
  { dkd_key: 'driverLicenseUri', dkd_label: 'Ehliyet', dkd_icon: 'card-bulleted-outline', dkd_required: false },
  { dkd_key: 'vehicleLicenseUri', dkd_label: 'Ruhsat', dkd_icon: 'file-document-outline', dkd_required: false },
  { dkd_key: 'insuranceUri', dkd_label: 'Sigorta', dkd_icon: 'shield-check-outline', dkd_required: false },
];

function dkd_clean_text_value(dkd_value) {
  return String(dkd_value || '').trim();
}

function DkdFieldValue({ dkd_label_value, dkd_value, dkd_on_change_value, dkd_placeholder_value, dkd_keyboard_value = 'default', dkd_multiline_value = false, dkd_icon_value = 'form-textbox', dkd_required_value = false }) {
  return (
    <View style={dkd_styles_value.dkd_field_wrap}>
      <View style={dkd_styles_value.dkd_field_label_row}>
        <MaterialCommunityIcons name={dkd_icon_value} size={15} color="#78E8FF" />
        <Text style={dkd_styles_value.dkd_field_label}>{dkd_label_value}{dkd_required_value ? ' *' : ''}</Text>
      </View>
      <TextInput
        value={dkd_value}
        onChangeText={dkd_on_change_value}
        placeholder={dkd_placeholder_value}
        placeholderTextColor="rgba(229,241,255,0.34)"
        keyboardType={dkd_keyboard_value}
        multiline={dkd_multiline_value}
        style={[dkd_styles_value.dkd_field_input, dkd_multiline_value && dkd_styles_value.dkd_field_input_multiline]}
      />
    </View>
  );
}

function DkdChoiceValue({ dkd_label_value, dkd_options_value, dkd_value, dkd_on_change_value, dkd_icon_value = 'tune-variant' }) {
  return (
    <View style={dkd_styles_value.dkd_choice_wrap}>
      <View style={dkd_styles_value.dkd_field_label_row}>
        <MaterialCommunityIcons name={dkd_icon_value} size={15} color="#7AF0C1" />
        <Text style={dkd_styles_value.dkd_field_label}>{dkd_label_value}</Text>
      </View>
      <View style={dkd_styles_value.dkd_choice_grid}>
        {dkd_options_value.map((dkd_option_value) => {
          const dkd_raw_value = typeof dkd_option_value === 'string' ? dkd_option_value : dkd_option_value.dkd_value;
          const dkd_label_text_value = typeof dkd_option_value === 'string' ? dkd_option_value : dkd_option_value.dkd_label;
          const dkd_icon_name_value = typeof dkd_option_value === 'string' ? '' : dkd_option_value.dkd_icon;
          const dkd_selected_value = String(dkd_value || '') === String(dkd_raw_value || '');
          return (
            <Pressable
              key={`${dkd_label_value}_${dkd_raw_value}`}
              onPress={() => dkd_on_change_value(dkd_raw_value)}
              style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_choice_chip, dkd_selected_value && dkd_styles_value.dkd_choice_chip_active, dkd_pressed_value && dkd_styles_value.dkd_pressed]}
            >
              {dkd_icon_name_value ? <MaterialCommunityIcons name={dkd_icon_name_value} size={16} color={dkd_selected_value ? '#031019' : '#DDF7FF'} /> : null}
              <Text style={[dkd_styles_value.dkd_choice_text, dkd_selected_value && dkd_styles_value.dkd_choice_text_active]}>{dkd_label_text_value}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function DkdCourierApplicationPanelValue({ dkd_profile_value, dkd_set_profile_value }) {
  const dkd_entry_value = useRef(new Animated.Value(0)).current;
  const dkd_user_id_value = String(dkd_profile_value?.user_id || dkd_profile_value?.id || '');
  const dkd_profile_meta_value = dkd_profile_value?.courier_profile_meta || {};
  const dkd_initial_country_value = dkd_clean_text_value(dkd_profile_value?.dkd_country || dkd_profile_meta_value?.dkd_country || 'Türkiye') || 'Türkiye';
  const dkd_initial_city_value = dkd_clean_text_value(dkd_profile_value?.dkd_city || dkd_profile_value?.courier_city || 'Ankara') || 'Ankara';
  const dkd_initial_region_value = dkd_clean_text_value(dkd_profile_value?.dkd_region || dkd_profile_value?.courier_zone || '');
  const [dkd_form_value, dkd_set_form_value] = useState({
    firstName: dkd_clean_text_value(dkd_profile_meta_value?.first_name),
    lastName: dkd_clean_text_value(dkd_profile_meta_value?.last_name),
    nationalId: dkd_clean_text_value(dkd_profile_meta_value?.national_id),
    phone: dkd_clean_text_value(dkd_profile_meta_value?.phone || dkd_profile_value?.phone),
    email: dkd_clean_text_value(dkd_profile_meta_value?.email || dkd_profile_value?.email),
    country: dkd_initial_country_value,
    city: dkd_initial_city_value,
    zone: dkd_initial_region_value,
    vehicleType: dkd_clean_text_value(dkd_profile_value?.courier_vehicle_type || 'moto') || 'moto',
    plateNo: dkd_clean_text_value(dkd_profile_meta_value?.plate_no),
    addressText: dkd_clean_text_value(dkd_profile_meta_value?.address_text),
    emergencyName: dkd_clean_text_value(dkd_profile_meta_value?.emergency_name),
    emergencyPhone: dkd_clean_text_value(dkd_profile_meta_value?.emergency_phone),
    identityFrontUri: '',
    identityBackUri: '',
    selfieUri: '',
    driverLicenseUri: '',
    vehicleLicenseUri: '',
    insuranceUri: '',
  });
  const [dkd_busy_value, dkd_set_busy_value] = useState(false);
  const [dkd_success_value, dkd_set_success_value] = useState(false);

  React.useEffect(() => {
    Animated.timing(dkd_entry_value, { toValue: 1, duration: 430, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [dkd_entry_value]);

  const dkd_city_list_value = useMemo(() => dkd_city_options_value[dkd_form_value.country] || dkd_city_options_value.Türkiye, [dkd_form_value.country]);
  const dkd_region_list_value = useMemo(() => dkd_region_options_value[dkd_form_value.city] || [], [dkd_form_value.city]);
  const dkd_required_docs_ready_value = Boolean(dkd_form_value.identityFrontUri && dkd_form_value.identityBackUri && dkd_form_value.selfieUri);
  const dkd_required_fields_ready_value = Boolean(
    dkd_clean_text_value(dkd_form_value.firstName)
    && dkd_clean_text_value(dkd_form_value.lastName)
    && dkd_clean_text_value(dkd_form_value.nationalId).length === 11
    && dkd_clean_text_value(dkd_form_value.phone)
    && dkd_clean_text_value(dkd_form_value.city)
    && dkd_clean_text_value(dkd_form_value.zone)
  );
  const dkd_ready_value = dkd_required_fields_ready_value && dkd_required_docs_ready_value;

  function dkd_patch_form_value(dkd_patch_value) {
    dkd_set_form_value((dkd_previous_value) => ({ ...dkd_previous_value, ...dkd_patch_value }));
  }

  async function dkd_pick_document_value(dkd_key_value) {
    try {
      const dkd_result_value = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.86 });
      if (dkd_result_value?.canceled) return;
      const dkd_uri_value = dkd_result_value?.assets?.[0]?.uri || '';
      if (dkd_uri_value) dkd_patch_form_value({ [dkd_key_value]: dkd_uri_value });
    } catch (dkd_error_value) {
      Alert.alert('Belge Seçimi', dkd_error_value?.message || 'Belge seçilemedi.');
    }
  }

  async function dkd_submit_value() {
    if (dkd_busy_value) return;
    if (!dkd_user_id_value) {
      Alert.alert('Kurye Başvurusu', 'Oturum bilgisi bulunamadı. Hesabından çıkış yapıp tekrar giriş yap.');
      return;
    }
    if (!dkd_required_fields_ready_value) {
      Alert.alert('Eksik Bilgi', 'Ad, soyad, 11 haneli T.C. kimlik numarası, telefon, şehir ve bölge alanlarını tamamla.');
      return;
    }
    if (!dkd_required_docs_ready_value) {
      Alert.alert('Eksik Belge', 'Kimlik ön, kimlik arka ve selfie belgelerini ekle.');
      return;
    }

    dkd_set_busy_value(true);
    try {
      const dkd_result_value = await submitCourierApplication({ userId: dkd_user_id_value, form: dkd_form_value });
      if (dkd_result_value?.error) throw dkd_result_value.error;
      dkd_set_success_value(true);
      dkd_set_profile_value?.((dkd_previous_value) => dkd_previous_value ? {
        ...dkd_previous_value,
        courier_status: 'pending',
        courier_city: dkd_form_value.city,
        courier_zone: dkd_form_value.zone,
        dkd_country: dkd_form_value.country,
        dkd_city: dkd_form_value.city,
        dkd_region: dkd_form_value.zone,
        courier_vehicle_type: dkd_form_value.vehicleType,
      } : dkd_previous_value);
      Alert.alert('Başvuru Alındı', 'Kurye başvurun admin onay kuyruğuna gönderildi.');
    } catch (dkd_error_value) {
      Alert.alert('Kurye Başvurusu', dkd_error_value?.message || 'Başvuru gönderilemedi.');
    } finally {
      dkd_set_busy_value(false);
    }
  }

  const dkd_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  return (
    <Animated.View style={[dkd_styles_value.dkd_root, { opacity: dkd_entry_value, transform: [{ translateY: dkd_translate_value }] }] }>
      <LinearGradient colors={['#071827', '#0A2940', '#18224B']} style={dkd_styles_value.dkd_hero}>
        <View style={dkd_styles_value.dkd_hero_line} />
        <View style={dkd_styles_value.dkd_hero_top}>
          <View style={dkd_styles_value.dkd_hero_icon}><MaterialCommunityIcons name="motorbike" size={31} color="#031019" /></View>
          <View style={dkd_styles_value.dkd_hero_badge}><View style={dkd_styles_value.dkd_hero_badge_dot} /><Text style={dkd_styles_value.dkd_hero_badge_text}>COURIER ID</Text></View>
        </View>
        <Text style={dkd_styles_value.dkd_hero_kicker}>DRABORNGO KURYE AĞI</Text>
        <Text style={dkd_styles_value.dkd_hero_title}>Kurye lisansını oluştur</Text>
        <Text style={dkd_styles_value.dkd_hero_text}>Kimlik, bölge, araç ve iletişim bilgilerini tek akışta tamamla. Başvuru yalnız admin onayından sonra kurye yetkisi açar.</Text>
      </LinearGradient>

      {dkd_success_value ? (
        <View style={dkd_styles_value.dkd_success_card}>
          <View style={dkd_styles_value.dkd_success_icon}><MaterialCommunityIcons name="check-decagram" size={26} color="#031019" /></View>
          <View style={{ flex: 1 }}><Text style={dkd_styles_value.dkd_success_title}>Başvuru incelemede</Text><Text style={dkd_styles_value.dkd_success_text}>Durumun: Beklemede. Admin onayladığında Kurye Kontrol Merkezi otomatik açılır.</Text></View>
        </View>
      ) : null}

      <View style={dkd_styles_value.dkd_section_card}>
        <Text style={dkd_styles_value.dkd_section_kicker}>01 • KİMLİK VE İLETİŞİM</Text>
        <Text style={dkd_styles_value.dkd_section_title}>Sürücü profili</Text>
        <DkdFieldValue dkd_label_value="Ad" dkd_value={dkd_form_value.firstName} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ firstName: dkd_value })} dkd_placeholder_value="Adın" dkd_icon_value="account-outline" dkd_required_value />
        <DkdFieldValue dkd_label_value="Soyad" dkd_value={dkd_form_value.lastName} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ lastName: dkd_value })} dkd_placeholder_value="Soyadın" dkd_icon_value="account-outline" dkd_required_value />
        <DkdFieldValue dkd_label_value="T.C. Kimlik No" dkd_value={dkd_form_value.nationalId} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ nationalId: String(dkd_value || '').replace(/\D/g, '').slice(0, 11) })} dkd_placeholder_value="11 haneli kimlik numarası" dkd_keyboard_value="number-pad" dkd_icon_value="identifier" dkd_required_value />
        <DkdFieldValue dkd_label_value="Telefon" dkd_value={dkd_form_value.phone} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ phone: dkd_value })} dkd_placeholder_value="05xx xxx xx xx" dkd_keyboard_value="phone-pad" dkd_icon_value="phone-outline" dkd_required_value />
        <DkdFieldValue dkd_label_value="E-posta" dkd_value={dkd_form_value.email} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ email: dkd_value })} dkd_placeholder_value="ornek@mail.com" dkd_keyboard_value="email-address" dkd_icon_value="email-outline" />
      </View>

      <View style={dkd_styles_value.dkd_section_card}>
        <Text style={dkd_styles_value.dkd_section_kicker}>02 • OPERASYON BÖLGESİ</Text>
        <Text style={dkd_styles_value.dkd_section_title}>Nerede çalışacaksın?</Text>
        <DkdChoiceValue dkd_label_value="Ülke" dkd_options_value={dkd_country_options_value} dkd_value={dkd_form_value.country} dkd_on_change_value={(dkd_value) => {
          const dkd_next_city_value = (dkd_city_options_value[dkd_value] || [])[0] || '';
          dkd_patch_form_value({ country: dkd_value, city: dkd_next_city_value, zone: (dkd_region_options_value[dkd_next_city_value] || [])[0] || '' });
        }} dkd_icon_value="earth" />
        <DkdChoiceValue dkd_label_value="Şehir" dkd_options_value={dkd_city_list_value} dkd_value={dkd_form_value.city} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ city: dkd_value, zone: (dkd_region_options_value[dkd_value] || [])[0] || '' })} dkd_icon_value="city-variant-outline" />
        {dkd_region_list_value.length ? <DkdChoiceValue dkd_label_value="Bölge / İlçe" dkd_options_value={dkd_region_list_value} dkd_value={dkd_form_value.zone} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ zone: dkd_value })} dkd_icon_value="map-marker-radius-outline" /> : <DkdFieldValue dkd_label_value="Bölge / İlçe" dkd_value={dkd_form_value.zone} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ zone: dkd_value })} dkd_placeholder_value="Çalışma bölgen" dkd_icon_value="map-marker-radius-outline" dkd_required_value />}
        <DkdFieldValue dkd_label_value="Adres" dkd_value={dkd_form_value.addressText} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ addressText: dkd_value })} dkd_placeholder_value="Açık adres" dkd_multiline_value dkd_icon_value="home-map-marker" />
      </View>

      <View style={dkd_styles_value.dkd_section_card}>
        <Text style={dkd_styles_value.dkd_section_kicker}>03 • ARAÇ</Text>
        <Text style={dkd_styles_value.dkd_section_title}>Kurye aracın</Text>
        <DkdChoiceValue dkd_label_value="Araç tipi" dkd_options_value={dkd_vehicle_options_value} dkd_value={dkd_form_value.vehicleType} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ vehicleType: dkd_value })} dkd_icon_value="garage-variant" />
        <DkdFieldValue dkd_label_value="Plaka" dkd_value={dkd_form_value.plateNo} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ plateNo: String(dkd_value || '').toUpperCase() })} dkd_placeholder_value="06 ABC 123" dkd_icon_value="car-info" />
      </View>

      <View style={dkd_styles_value.dkd_section_card}>
        <Text style={dkd_styles_value.dkd_section_kicker}>04 • BELGELER</Text>
        <Text style={dkd_styles_value.dkd_section_title}>Onay dosyaları</Text>
        <Text style={dkd_styles_value.dkd_section_hint}>Kimlik ön, kimlik arka ve selfie zorunludur. Araç/ehliyet belgeleri araç tipine göre admin tarafından ayrıca kontrol edilir.</Text>
        <View style={dkd_styles_value.dkd_document_grid}>
          {dkd_document_options_value.map((dkd_document_value) => {
            const dkd_selected_value = Boolean(dkd_form_value[dkd_document_value.dkd_key]);
            return (
              <Pressable key={dkd_document_value.dkd_key} onPress={() => dkd_pick_document_value(dkd_document_value.dkd_key)} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_document_card, dkd_selected_value && dkd_styles_value.dkd_document_card_selected, dkd_pressed_value && dkd_styles_value.dkd_pressed]}>
                <View style={[dkd_styles_value.dkd_document_icon, dkd_selected_value && dkd_styles_value.dkd_document_icon_selected]}><MaterialCommunityIcons name={dkd_selected_value ? 'check-bold' : dkd_document_value.dkd_icon} size={20} color={dkd_selected_value ? '#031019' : '#DFF7FF'} /></View>
                <Text style={dkd_styles_value.dkd_document_title}>{dkd_document_value.dkd_label}{dkd_document_value.dkd_required ? ' *' : ''}</Text>
                <Text style={[dkd_styles_value.dkd_document_status, dkd_selected_value && dkd_styles_value.dkd_document_status_selected]}>{dkd_selected_value ? 'Hazır' : 'Belge seç'}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={dkd_styles_value.dkd_section_card}>
        <Text style={dkd_styles_value.dkd_section_kicker}>05 • ACİL DURUM</Text>
        <Text style={dkd_styles_value.dkd_section_title}>Güvenlik kişisi</Text>
        <DkdFieldValue dkd_label_value="Yakın Adı" dkd_value={dkd_form_value.emergencyName} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ emergencyName: dkd_value })} dkd_placeholder_value="Ad soyad" dkd_icon_value="account-heart-outline" />
        <DkdFieldValue dkd_label_value="Yakın Telefonu" dkd_value={dkd_form_value.emergencyPhone} dkd_on_change_value={(dkd_value) => dkd_patch_form_value({ emergencyPhone: dkd_value })} dkd_placeholder_value="05xx xxx xx xx" dkd_keyboard_value="phone-pad" dkd_icon_value="phone-alert-outline" />
      </View>

      <Pressable disabled={dkd_busy_value} onPress={dkd_submit_value} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_submit_pressable, dkd_pressed_value && dkd_styles_value.dkd_pressed]}>
        <LinearGradient colors={dkd_ready_value ? ['#62F0B6', '#43DFFF', '#8E7BFF'] : ['#43505E', '#33425B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dkd_styles_value.dkd_submit_button}>
          {dkd_busy_value ? <ActivityIndicator color="#031019" /> : <MaterialCommunityIcons name="shield-check-outline" size={22} color="#031019" />}
          <Text style={dkd_styles_value.dkd_submit_text}>{dkd_busy_value ? 'Başvuru gönderiliyor…' : 'Kurye Başvurusunu Gönder'}</Text>
          <MaterialCommunityIcons name="arrow-right" size={21} color="#031019" />
        </LinearGradient>
      </Pressable>

      <View style={dkd_styles_value.dkd_privacy_note}><MaterialCommunityIcons name="lock-check-outline" size={18} color="#72E7FF" /><Text style={dkd_styles_value.dkd_privacy_text}>Belgeler yalnız kurye lisans değerlendirmesi için kullanılır. Yetki, başvuru göndermekle otomatik açılmaz.</Text></View>
    </Animated.View>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_root: { gap: 14, paddingBottom: 12 },
  dkd_hero: { borderRadius: 30, padding: 18, borderWidth: 1, borderColor: 'rgba(139,228,255,0.22)', overflow: 'hidden' },
  dkd_hero_line: { position: 'absolute', width: 160, height: 1, backgroundColor: 'rgba(111,238,255,0.50)', right: -20, top: 54, transform: [{ rotate: '-25deg' }] },
  dkd_hero_top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_hero_icon: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#63F0B6', borderWidth: 1, borderColor: 'rgba(255,255,255,0.50)' },
  dkd_hero_badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(3,12,24,0.34)', borderWidth: 1, borderColor: 'rgba(139,228,255,0.18)' },
  dkd_hero_badge_dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#63F0B6' },
  dkd_hero_badge_text: { color: '#E6FBFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  dkd_hero_kicker: { color: '#7CEAFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.25, marginTop: 15 },
  dkd_hero_title: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginTop: 4, letterSpacing: -0.7 },
  dkd_hero_text: { color: 'rgba(235,246,255,0.68)', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 7 },
  dkd_success_card: { borderRadius: 23, padding: 14, flexDirection: 'row', gap: 11, alignItems: 'center', backgroundColor: 'rgba(53,212,147,0.13)', borderWidth: 1, borderColor: 'rgba(99,240,182,0.28)' },
  dkd_success_icon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#63F0B6' },
  dkd_success_title: { color: '#EFFFF8', fontSize: 14, fontWeight: '900' },
  dkd_success_text: { color: 'rgba(225,255,241,0.68)', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 2 },
  dkd_section_card: { borderRadius: 26, padding: 15, backgroundColor: 'rgba(8,18,34,0.82)', borderWidth: 1, borderColor: 'rgba(139,204,255,0.12)' },
  dkd_section_kicker: { color: '#70DFFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  dkd_section_title: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 3, marginBottom: 12 },
  dkd_section_hint: { color: 'rgba(228,240,255,0.56)', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: -6, marginBottom: 12 },
  dkd_field_wrap: { marginTop: 10 },
  dkd_field_label_row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  dkd_field_label: { color: '#EAF7FF', fontSize: 11, fontWeight: '900' },
  dkd_field_input: { minHeight: 50, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(140,214,255,0.15)', backgroundColor: 'rgba(2,10,22,0.72)', color: '#FFFFFF', paddingHorizontal: 13, fontSize: 13, fontWeight: '700' },
  dkd_field_input_multiline: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  dkd_choice_wrap: { marginTop: 10 },
  dkd_choice_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dkd_choice_chip: { minHeight: 39, borderRadius: 14, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(18,36,58,0.78)', borderWidth: 1, borderColor: 'rgba(141,213,255,0.14)' },
  dkd_choice_chip_active: { backgroundColor: '#70E9C0', borderColor: '#8AF5CF' },
  dkd_choice_text: { color: '#E6F6FF', fontSize: 11, fontWeight: '800' },
  dkd_choice_text_active: { color: '#031019', fontWeight: '900' },
  dkd_document_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  dkd_document_card: { width: '48%', minHeight: 108, borderRadius: 20, padding: 12, backgroundColor: 'rgba(14,31,52,0.86)', borderWidth: 1, borderColor: 'rgba(137,213,255,0.13)' },
  dkd_document_card_selected: { backgroundColor: 'rgba(27,105,88,0.62)', borderColor: 'rgba(99,240,182,0.42)' },
  dkd_document_icon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(96,144,255,0.18)' },
  dkd_document_icon_selected: { backgroundColor: '#63F0B6' },
  dkd_document_title: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginTop: 9 },
  dkd_document_status: { color: 'rgba(230,244,255,0.48)', fontSize: 10, fontWeight: '800', marginTop: 3 },
  dkd_document_status_selected: { color: '#9DFFD3' },
  dkd_submit_pressable: { borderRadius: 22, overflow: 'hidden' },
  dkd_submit_button: { minHeight: 64, borderRadius: 22, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dkd_submit_text: { flex: 1, textAlign: 'center', color: '#031019', fontSize: 14, fontWeight: '900' },
  dkd_privacy_note: { borderRadius: 19, padding: 12, flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: 'rgba(26,52,80,0.34)', borderWidth: 1, borderColor: 'rgba(114,231,255,0.12)' },
  dkd_privacy_text: { flex: 1, color: 'rgba(226,242,255,0.56)', fontSize: 10.5, lineHeight: 15, fontWeight: '700' },
  dkd_pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
