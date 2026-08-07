import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import dkd_safe_screen_value from '../../components/layout/dkd_safe_screen';

const dkd_steps_value = [
  {
    dkd_kicker_value: 'DraBornGo • v0.0.6',
    dkd_title_value: 'Şehir operasyonları tek merkezde',
    dkd_body_value: 'Kurye, teslimat ve hizmet ağı akışlarını sade bir mobil merkezden yönet.',
  },
  {
    dkd_kicker_value: 'OPERASYON',
    dkd_title_value: 'Kurye ve hizmet ağı odakta',
    dkd_body_value: 'Çevrimiçi kurye durumu, atanmış teslimatlar, işletme katalogları ve başvurular aynı çekirdekte.',
  },
  {
    dkd_kicker_value: 'GİZLİLİK',
    dkd_title_value: 'İzinler işlem anında',
    dkd_body_value: 'Konum yalnızca sen konum gerektiren işlemi başlattığında ve uygulama açıkken istenir. Arka plan konumu kullanılmaz.',
  },
];

export default function dkd_pre_login_intro_screen_value({ dkd_on_complete_value }) {
  const [dkd_index_value, dkd_set_index_value] = useState(0);
  const dkd_step_value = dkd_steps_value[dkd_index_value];
  const dkd_last_value = dkd_index_value === dkd_steps_value.length - 1;

  return React.createElement(
    dkd_safe_screen_value,
    null,
    React.createElement(
      View,
      { style: dkd_styles_value.dkd_root_value },
      React.createElement(Text, { style: dkd_styles_value.dkd_kicker_value }, dkd_step_value.dkd_kicker_value),
      React.createElement(Text, { style: dkd_styles_value.dkd_title_value }, dkd_step_value.dkd_title_value),
      React.createElement(Text, { style: dkd_styles_value.dkd_body_value }, dkd_step_value.dkd_body_value),
      React.createElement(
        View,
        { style: dkd_styles_value.dkd_progress_value },
        dkd_steps_value.map((_dkd_item_value, dkd_item_index_value) => React.createElement(View, {
          key: String(dkd_item_index_value),
          style: [
            dkd_styles_value.dkd_progress_dot_value,
            dkd_item_index_value === dkd_index_value ? dkd_styles_value.dkd_progress_dot_active_value : null,
          ],
        })),
      ),
      React.createElement(
        Pressable,
        {
          style: dkd_styles_value.dkd_button_value,
          onPress: () => {
            if (dkd_last_value) dkd_on_complete_value?.();
            else dkd_set_index_value((dkd_previous_value) => dkd_previous_value + 1);
          },
        },
        React.createElement(Text, { style: dkd_styles_value.dkd_button_text_value }, dkd_last_value ? "DraBornGo'ya Geç" : 'Devam'),
      ),
    ),
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_root_value: { flex: 1, padding: 26, justifyContent: 'center', backgroundColor: '#050B15' },
  dkd_kicker_value: { color: '#79E6FF', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  dkd_title_value: { color: '#FFFFFF', fontSize: 38, lineHeight: 44, fontWeight: '900', marginTop: 12 },
  dkd_body_value: { color: '#A9B8C9', fontSize: 17, lineHeight: 26, fontWeight: '600', marginTop: 18 },
  dkd_progress_value: { flexDirection: 'row', gap: 8, marginTop: 32 },
  dkd_progress_dot_value: { width: 30, height: 5, borderRadius: 999, backgroundColor: '#26364A' },
  dkd_progress_dot_active_value: { backgroundColor: '#79E6FF' },
  dkd_button_value: { marginTop: 34, minHeight: 58, borderRadius: 18, backgroundColor: '#79E6FF', alignItems: 'center', justifyContent: 'center' },
  dkd_button_text_value: { color: '#06111C', fontWeight: '900', fontSize: 16 },
});
