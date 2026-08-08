import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { dkd_service_network_category_groups_value } from '../serviceNetwork/dkd_service_network_modal';
import { dkd_make_native_axis_point } from '../../utils/dkdNativeAxis';

const dkd_partner_application_steps_value = [
  { dkd_step_id_value: 'dkd_profile', dkd_icon_value: 'store-check-outline', dkd_title_value: 'Profil bilgisi', dkd_text_value: 'İşletme adı, yetkili, telefon, adres ve hizmet bölgesi net yazılır.' },
  { dkd_step_id_value: 'dkd_category', dkd_icon_value: 'shape-outline', dkd_title_value: 'Kategori eşleşmesi', dkd_text_value: 'İşletme hangi hizmet grubu ve kategorilerde çalışacaksa hepsi seçilir.' },
  { dkd_step_id_value: 'dkd_operation', dkd_icon_value: 'map-marker-radius-outline', dkd_title_value: 'Operasyon detayı', dkd_text_value: 'Adresten alım, yerinde servis, randevu, acil çağrı ve kurye bağlantısı belirlenir.' },
  { dkd_step_id_value: 'dkd_admin_review', dkd_icon_value: 'shield-check-outline', dkd_title_value: 'Admin onayı', dkd_text_value: 'Supabase onayı verildiğinde bu taslak gerçek başvuru tablosuna bağlanabilir.' },
];

const dkd_partner_application_required_documents_value = [
  'İşletme / usta profil adı',
  'Yetkili telefon ve iletişim notu',
  'Açık adres ve konum açıklaması',
  'Hizmet bölgesi, çalışma saatleri ve acil destek durumu',
  'Vergi / belge / ruhsat durumu varsa açıklama',
  'Kurye, nakliye veya yerinde servis ihtiyacı',
];

function DkdCategorySelectionCard({
  dkd_category_value,
  dkd_is_selected_value,
  dkd_on_toggle_value,
}) {
  return (
    <Pressable
      onPress={dkd_on_toggle_value}
      style={({ pressed: dkd_pressed_value }) => [
        dkd_styles_value.dkd_category_card,
        dkd_is_selected_value && dkd_styles_value.dkd_category_card_selected,
        dkd_pressed_value && dkd_styles_value.dkd_pressable_pressed,
      ]}
    >
      <View
        style={[
          dkd_styles_value.dkd_category_icon_wrap,
          { backgroundColor: dkd_category_value.dkd_icon_bg_value || `${dkd_category_value.dkd_icon_color_value || '#7DD3FC'}22` },
          dkd_is_selected_value && dkd_styles_value.dkd_category_icon_wrap_selected,
        ]}
      >
        <MaterialCommunityIcons
          name={dkd_category_value.dkd_icon_value}
          size={22}
          color={dkd_is_selected_value ? '#08111E' : (dkd_category_value.dkd_icon_color_value || '#BAE6FD')}
        />
      </View>
      <View style={dkd_styles_value.dkd_category_text_wrap}>
        <Text style={[dkd_styles_value.dkd_category_title, dkd_is_selected_value && dkd_styles_value.dkd_category_title_selected]}>{dkd_category_value.dkd_title_value}</Text>
        <Text style={[dkd_styles_value.dkd_category_desc, dkd_is_selected_value && dkd_styles_value.dkd_category_desc_selected]}>{dkd_category_value.dkd_desc_value}</Text>
      </View>
      <MaterialCommunityIcons
        name={dkd_is_selected_value ? 'check-circle' : 'plus-circle-outline'}
        size={21}
        color={dkd_is_selected_value ? '#08111E' : 'rgba(226,242,255,0.54)'}
      />
    </Pressable>
  );
}

export default function DkdServicePartnerApplicationPanel({ dkd_profile_value }) {
  const dkd_default_group_id_value = dkd_service_network_category_groups_value?.[0]?.dkd_group_id_value || '';
  const [dkd_active_group_id_value, dkd_set_active_group_id_value] = useState(dkd_default_group_id_value);
  const [dkd_selected_category_id_values, dkd_set_selected_category_id_values] = useState([]);
  const [dkd_partner_name_value, dkd_set_partner_name_value] = useState('');
  const [dkd_partner_contact_value, dkd_set_partner_contact_value] = useState('');
  const [dkd_partner_area_value, dkd_set_partner_area_value] = useState('');
  const [dkd_partner_address_value, dkd_set_partner_address_value] = useState('');
  const [dkd_partner_operation_value, dkd_set_partner_operation_value] = useState('');
  const [dkd_partner_document_value, dkd_set_partner_document_value] = useState('');
  const [dkd_show_preview_value, dkd_set_show_preview_value] = useState(false);

  const dkd_active_group_value = useMemo(
    () => dkd_service_network_category_groups_value.find((dkd_group_value) => dkd_group_value.dkd_group_id_value === dkd_active_group_id_value) || dkd_service_network_category_groups_value[0],
    [dkd_active_group_id_value]
  );

  const dkd_total_category_count_value = useMemo(
    () => dkd_service_network_category_groups_value.reduce((dkd_total_value, dkd_group_value) => dkd_total_value + dkd_group_value.dkd_categories_value.length, 0),
    []
  );

  const dkd_selected_category_values = useMemo(
    () => dkd_service_network_category_groups_value
      .flatMap((dkd_group_value) => dkd_group_value.dkd_categories_value)
      .filter((dkd_category_value) => dkd_selected_category_id_values.includes(dkd_category_value.dkd_id_value)),
    [dkd_selected_category_id_values]
  );

  const dkd_toggle_category_value = (dkd_category_id_value) => {
    dkd_set_selected_category_id_values((dkd_current_category_id_values) => {
      if (dkd_current_category_id_values.includes(dkd_category_id_value)) {
        return dkd_current_category_id_values.filter((dkd_current_category_id_value) => dkd_current_category_id_value !== dkd_category_id_value);
      }
      return [...dkd_current_category_id_values, dkd_category_id_value];
    });
  };

  const dkd_selected_summary_value = dkd_selected_category_values.length > 0
    ? dkd_selected_category_values.map((dkd_category_value) => dkd_category_value.dkd_title_value).join(', ')
    : 'Henüz kategori seçilmedi';

  const dkd_profile_hint_value = String(dkd_profile_value?.nickname || dkd_profile_value?.display_name || dkd_profile_value?.username || 'DraBornGo kullanıcısı');

  return (
    <View style={dkd_styles_value.dkd_panel_wrap}>
      <LinearGradient
        colors={['#101C38', '#143D51', '#3B216B']}
        start={dkd_make_native_axis_point(0, 0)}
        end={dkd_make_native_axis_point(1, 1)}
        style={dkd_styles_value.dkd_hero_card}
      >
        <View style={dkd_styles_value.dkd_hero_icon_row}>
          <View style={dkd_styles_value.dkd_hero_icon_shell}>
            <MaterialCommunityIcons name="store-cog-outline" size={31} color="#06111F" />
          </View>
          <View style={dkd_styles_value.dkd_hero_badge}>
            <Text style={dkd_styles_value.dkd_hero_badge_text}>HİZMET AĞI İŞLETME ONBOARDING</Text>
          </View>
        </View>
        <Text style={dkd_styles_value.dkd_hero_title}>İşletme Başvurusu</Text>
        <Text style={dkd_styles_value.dkd_hero_text}>Kuru temizleme, teknik servis, araç destek, taşıma, yemek/market ve özel teslimat gibi tüm hizmet grupları için işletme profilini tek başvuru akışında hazırla.</Text>
        <View style={dkd_styles_value.dkd_hero_stat_row}>
          <View style={dkd_styles_value.dkd_hero_stat_card}><Text style={dkd_styles_value.dkd_hero_stat_value}>{dkd_service_network_category_groups_value.length}</Text><Text style={dkd_styles_value.dkd_hero_stat_label}>grup</Text></View>
          <View style={dkd_styles_value.dkd_hero_stat_card}><Text style={dkd_styles_value.dkd_hero_stat_value}>{dkd_total_category_count_value}</Text><Text style={dkd_styles_value.dkd_hero_stat_label}>kategori</Text></View>
          <View style={dkd_styles_value.dkd_hero_stat_card}><Text style={dkd_styles_value.dkd_hero_stat_value}>{dkd_selected_category_values.length}</Text><Text style={dkd_styles_value.dkd_hero_stat_label}>seçili</Text></View>
        </View>
      </LinearGradient>

      <View style={dkd_styles_value.dkd_section_header_row}>
        <View>
          <Text style={dkd_styles_value.dkd_section_kicker}>BAŞVURU SAHİBİ</Text>
          <Text style={dkd_styles_value.dkd_section_title}>İşletme profil detayları</Text>
        </View>
        <View style={dkd_styles_value.dkd_profile_chip}><MaterialCommunityIcons name="account" size={15} color="#BAE6FD" /><Text style={dkd_styles_value.dkd_profile_chip_text}>{dkd_profile_hint_value}</Text></View>
      </View>

      <LinearGradient colors={['rgba(15,23,42,0.96)', 'rgba(30,41,59,0.90)']} style={dkd_styles_value.dkd_form_card}>
        <TextInput value={dkd_partner_name_value} onChangeText={dkd_set_partner_name_value} placeholder="İşletme / usta / servis adı" placeholderTextColor="rgba(226,242,255,0.44)" style={dkd_styles_value.dkd_input} />
        <TextInput value={dkd_partner_contact_value} onChangeText={dkd_set_partner_contact_value} placeholder="Yetkili telefon / WhatsApp" placeholderTextColor="rgba(226,242,255,0.44)" keyboardType="phone-pad" style={dkd_styles_value.dkd_input} />
        <TextInput value={dkd_partner_area_value} onChangeText={dkd_set_partner_area_value} placeholder="Hizmet bölgesi: ilçe, mahalle, şehir içi / şehirlerarası" placeholderTextColor="rgba(226,242,255,0.44)" style={dkd_styles_value.dkd_input} />
        <TextInput value={dkd_partner_address_value} onChangeText={dkd_set_partner_address_value} placeholder="Açık adres ve konum açıklaması" placeholderTextColor="rgba(226,242,255,0.44)" style={[dkd_styles_value.dkd_input, dkd_styles_value.dkd_textarea]} multiline />
        <TextInput value={dkd_partner_operation_value} onChangeText={dkd_set_partner_operation_value} placeholder="Çalışma modeli: adresten alım, yerinde servis, randevu, acil destek, kurye bağlantısı" placeholderTextColor="rgba(226,242,255,0.44)" style={[dkd_styles_value.dkd_input, dkd_styles_value.dkd_textarea]} multiline />
        <TextInput value={dkd_partner_document_value} onChangeText={dkd_set_partner_document_value} placeholder="Belge / ruhsat / vergi / ekipman notu" placeholderTextColor="rgba(226,242,255,0.44)" style={[dkd_styles_value.dkd_input, dkd_styles_value.dkd_textarea]} multiline />
      </LinearGradient>

      <Text style={dkd_styles_value.dkd_section_title}>Hizmet grubu seç</Text>
      <View style={dkd_styles_value.dkd_group_grid}>
        {dkd_service_network_category_groups_value.map((dkd_group_value) => {
          const dkd_is_group_active_value = dkd_group_value.dkd_group_id_value === dkd_active_group_id_value;
          return (
            <Pressable
              key={dkd_group_value.dkd_group_id_value}
              onPress={() => dkd_set_active_group_id_value(dkd_group_value.dkd_group_id_value)}
              style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_group_chip, dkd_is_group_active_value && dkd_styles_value.dkd_group_chip_active, dkd_pressed_value && dkd_styles_value.dkd_pressable_pressed]}
            >
              <LinearGradient colors={dkd_is_group_active_value ? dkd_group_value.dkd_gradient_value : ['rgba(15,23,42,0.94)', 'rgba(15,23,42,0.82)']} style={dkd_styles_value.dkd_group_chip_gradient}>
                <MaterialCommunityIcons name={dkd_group_value.dkd_icon_value} size={20} color="#FFFFFF" />
                <Text style={dkd_styles_value.dkd_group_chip_title}>{dkd_group_value.dkd_title_value}</Text>
                <Text style={dkd_styles_value.dkd_group_chip_count}>{dkd_group_value.dkd_categories_value.length} kategori</Text>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>

      <Text style={dkd_styles_value.dkd_section_title}>{dkd_active_group_value?.dkd_title_value || 'Hizmet kategorileri'}</Text>
      <View style={dkd_styles_value.dkd_category_grid}>
        {(dkd_active_group_value?.dkd_categories_value || []).map((dkd_category_value) => (
          <DkdCategorySelectionCard
            key={dkd_category_value.dkd_id_value}
            dkd_category_value={dkd_category_value}
            dkd_is_selected_value={dkd_selected_category_id_values.includes(dkd_category_value.dkd_id_value)}
            dkd_on_toggle_value={() => dkd_toggle_category_value(dkd_category_value.dkd_id_value)}
          />
        ))}
      </View>

      <Text style={dkd_styles_value.dkd_section_title}>Seçilen kategoriler</Text>
      <View style={dkd_styles_value.dkd_selected_panel}>
        <MaterialCommunityIcons name="check-decagram-outline" size={22} color="#A7F3D0" />
        <Text style={dkd_styles_value.dkd_selected_text}>{dkd_selected_summary_value}</Text>
      </View>

      <Text style={dkd_styles_value.dkd_section_title}>İstenen bilgiler</Text>
      <View style={dkd_styles_value.dkd_required_grid}>
        {dkd_partner_application_required_documents_value.map((dkd_required_value) => (
          <View key={dkd_required_value} style={dkd_styles_value.dkd_required_card}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={18} color="#7DD3FC" />
            <Text style={dkd_styles_value.dkd_required_text}>{dkd_required_value}</Text>
          </View>
        ))}
      </View>

      <Text style={dkd_styles_value.dkd_section_title}>Başvuru akışı</Text>
      <View style={dkd_styles_value.dkd_step_list}>
        {dkd_partner_application_steps_value.map((dkd_step_value) => (
          <View key={dkd_step_value.dkd_step_id_value} style={dkd_styles_value.dkd_step_card}>
            <View style={dkd_styles_value.dkd_step_icon_wrap}><MaterialCommunityIcons name={dkd_step_value.dkd_icon_value} size={20} color="#07131C" /></View>
            <View style={dkd_styles_value.dkd_step_body}>
              <Text style={dkd_styles_value.dkd_step_title}>{dkd_step_value.dkd_title_value}</Text>
              <Text style={dkd_styles_value.dkd_step_text}>{dkd_step_value.dkd_text_value}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => dkd_set_show_preview_value((dkd_current_preview_value) => !dkd_current_preview_value)}
        style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_preview_button, dkd_pressed_value && dkd_styles_value.dkd_pressable_pressed]}
      >
        <LinearGradient colors={['#7DD3FC', '#A78BFA', '#F9A8D4']} style={dkd_styles_value.dkd_preview_button_gradient}>
          <Text style={dkd_styles_value.dkd_preview_button_text}>{dkd_show_preview_value ? 'Önizlemeyi gizle' : 'Başvuru özetini göster'}</Text>
          <MaterialCommunityIcons name={dkd_show_preview_value ? 'chevron-up-circle' : 'chevron-down-circle'} size={20} color="#06111F" />
        </LinearGradient>
      </Pressable>

      {dkd_show_preview_value ? (
        <View style={dkd_styles_value.dkd_preview_card}>
          <Text style={dkd_styles_value.dkd_preview_title}>İşletme başvuru özeti</Text>
          <Text style={dkd_styles_value.dkd_preview_line}>İşletme: {dkd_partner_name_value || 'Eksik'}</Text>
          <Text style={dkd_styles_value.dkd_preview_line}>Telefon: {dkd_partner_contact_value || 'Eksik'}</Text>
          <Text style={dkd_styles_value.dkd_preview_line}>Bölge: {dkd_partner_area_value || 'Eksik'}</Text>
          <Text style={dkd_styles_value.dkd_preview_line}>Kategoriler: {dkd_selected_summary_value}</Text>
          <Text style={dkd_styles_value.dkd_preview_line}>Adres: {dkd_partner_address_value || 'Eksik'}</Text>
          <Text style={dkd_styles_value.dkd_preview_line}>Operasyon: {dkd_partner_operation_value || 'Eksik'}</Text>
          <Text style={dkd_styles_value.dkd_preview_line}>Belge notu: {dkd_partner_document_value || 'Eksik'}</Text>
        </View>
      ) : null}

      <View style={dkd_styles_value.dkd_supabase_note_card}>
        <MaterialCommunityIcons name="database-lock-outline" size={21} color="#FDE68A" />
        <Text style={dkd_styles_value.dkd_supabase_note_text}>Bu sürümde Supabase verisi değiştirilmedi. Gerçek kayıt, admin onay listesi ve işletme profil tablosu için ayrı SQL dosyası hazırlanabilir.</Text>
      </View>
    </View>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_panel_wrap: { gap: 15 },
  dkd_hero_card: { borderRadius: 30, padding: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  dkd_hero_icon_row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  dkd_hero_icon_shell: { width: 58, height: 58, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A7F3D0', shadowColor: '#22C55E', shadowOpacity: 0.26, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  dkd_hero_badge: { flex: 1, minWidth: 160, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  dkd_hero_badge_text: { color: '#E0F2FE', fontSize: 10.5, fontWeight: '950', letterSpacing: 0.8 },
  dkd_hero_title: { color: '#FFFFFF', fontSize: 28, lineHeight: 33, fontWeight: '950', marginTop: 15 },
  dkd_hero_text: { color: 'rgba(241,245,249,0.82)', fontSize: 13.5, lineHeight: 20, fontWeight: '760', marginTop: 8 },
  dkd_hero_stat_row: { flexDirection: 'row', gap: 9, marginTop: 14 },
  dkd_hero_stat_card: { flex: 1, minHeight: 58, borderRadius: 18, padding: 10, backgroundColor: 'rgba(2,6,23,0.26)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_hero_stat_value: { color: '#FFFFFF', fontSize: 20, fontWeight: '950' },
  dkd_hero_stat_label: { color: 'rgba(226,242,255,0.72)', fontSize: 10.5, fontWeight: '850', marginTop: 1 },
  dkd_section_header_row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-end' },
  dkd_section_kicker: { color: '#93C5FD', fontSize: 10.5, fontWeight: '950', letterSpacing: 0.8 },
  dkd_section_title: { color: '#F8FAFC', fontSize: 17, fontWeight: '950' },
  dkd_profile_chip: { maxWidth: '42%', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(14,165,233,0.10)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)' },
  dkd_profile_chip_text: { flex: 1, color: '#BAE6FD', fontSize: 10.5, fontWeight: '850' },
  dkd_form_card: { borderRadius: 24, padding: 13, borderWidth: 1, borderColor: 'rgba(148,163,184,0.20)', gap: 9 },
  dkd_input: { minHeight: 46, borderRadius: 16, paddingHorizontal: 12, color: '#F8FAFC', fontSize: 13, fontWeight: '760', backgroundColor: 'rgba(2,6,23,0.36)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.20)' },
  dkd_textarea: { minHeight: 84, paddingTop: 11, textAlignVertical: 'top' },
  dkd_group_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dkd_group_chip: { width: '48%', minWidth: 142, flexGrow: 1, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(148,163,184,0.20)' },
  dkd_group_chip_active: { borderColor: 'rgba(253,230,138,0.72)' },
  dkd_group_chip_gradient: { minHeight: 92, padding: 12, justifyContent: 'space-between' },
  dkd_group_chip_title: { color: '#FFFFFF', fontSize: 13, fontWeight: '950' },
  dkd_group_chip_count: { color: 'rgba(241,245,249,0.72)', fontSize: 10.5, fontWeight: '850' },
  dkd_category_grid: { gap: 10 },
  dkd_category_card: { minHeight: 82, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(15,23,42,0.92)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)' },
  dkd_category_card_selected: { backgroundColor: '#E0F2FE', borderColor: '#FDE68A' },
  dkd_category_icon_wrap: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  dkd_category_icon_wrap_selected: { backgroundColor: 'rgba(15,23,42,0.08)', borderColor: 'rgba(15,23,42,0.18)' },
  dkd_category_text_wrap: { flex: 1 },
  dkd_category_title: { color: '#F8FAFC', fontSize: 13.5, fontWeight: '950' },
  dkd_category_title_selected: { color: '#08111E' },
  dkd_category_desc: { color: 'rgba(226,242,255,0.70)', fontSize: 11, lineHeight: 15, fontWeight: '760', marginTop: 3 },
  dkd_category_desc_selected: { color: '#334155' },
  dkd_selected_panel: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', padding: 13, borderRadius: 20, backgroundColor: 'rgba(20,83,45,0.20)', borderWidth: 1, borderColor: 'rgba(167,243,208,0.20)' },
  dkd_selected_text: { flex: 1, color: '#D1FAE5', fontSize: 12.5, lineHeight: 18, fontWeight: '850' },
  dkd_required_grid: { gap: 9 },
  dkd_required_card: { flexDirection: 'row', gap: 9, alignItems: 'center', padding: 11, borderRadius: 18, backgroundColor: 'rgba(14,165,233,0.09)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.16)' },
  dkd_required_text: { flex: 1, color: '#DDEBFF', fontSize: 12, lineHeight: 16, fontWeight: '820' },
  dkd_step_list: { gap: 10 },
  dkd_step_card: { flexDirection: 'row', gap: 11, padding: 12, borderRadius: 20, backgroundColor: 'rgba(15,23,42,0.90)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)' },
  dkd_step_icon_wrap: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BAE6FD' },
  dkd_step_body: { flex: 1 },
  dkd_step_title: { color: '#F8FAFC', fontSize: 13, fontWeight: '950' },
  dkd_step_text: { color: 'rgba(226,242,255,0.72)', fontSize: 11.5, lineHeight: 16, fontWeight: '760', marginTop: 3 },
  dkd_preview_button: { borderRadius: 20, overflow: 'hidden' },
  dkd_preview_button_gradient: { minHeight: 48, borderRadius: 20, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_preview_button_text: { color: '#06111F', fontSize: 14, fontWeight: '950' },
  dkd_preview_card: { padding: 14, borderRadius: 22, backgroundColor: 'rgba(2,6,23,0.50)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', gap: 6 },
  dkd_preview_title: { color: '#FFFFFF', fontSize: 15, fontWeight: '950', marginBottom: 3 },
  dkd_preview_line: { color: 'rgba(226,242,255,0.76)', fontSize: 12, lineHeight: 17, fontWeight: '760' },
  dkd_supabase_note_card: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', padding: 13, borderRadius: 20, backgroundColor: 'rgba(120,53,15,0.22)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.20)' },
  dkd_supabase_note_text: { flex: 1, color: '#FEF3C7', fontSize: 12, lineHeight: 17, fontWeight: '820' },
  dkd_pressable_pressed: { transform: [{ scale: 0.985 }], opacity: 0.90 },
});
