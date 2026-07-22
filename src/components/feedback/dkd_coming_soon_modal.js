import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DkdComingSoonModal({
  dkd_visible_value,
  dkd_on_close_value,
  dkd_kicker_value = 'DRABORNGO',
  dkd_title_value = 'Çok Yakında',
  dkd_message_value = 'Bu hizmet hazırlık aşamasındadır.',
  dkd_icon_value = 'clock-fast',
  dkd_item_values = [],
}) {
  const dkd_safe_item_values = Array.isArray(dkd_item_values)
    ? dkd_item_values.filter(Boolean).slice(0, 4)
    : [];

  return (
    <Modal
      visible={Boolean(dkd_visible_value)}
      transparent
      animationType="fade"
      onRequestClose={dkd_on_close_value}
    >
      <View style={dkd_styles.dkd_overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dkd_on_close_value} />
        <View style={dkd_styles.dkd_card}>
          <View style={dkd_styles.dkd_top_row}>
            <View style={dkd_styles.dkd_icon_shell}>
              <MaterialCommunityIcons name={dkd_icon_value} size={31} color="#07131C" />
            </View>

            <Pressable onPress={dkd_on_close_value} style={dkd_styles.dkd_close_button}>
              <MaterialCommunityIcons name="close" size={21} color="#F8FAFC" />
            </Pressable>
          </View>

          <Text style={dkd_styles.dkd_kicker}>{dkd_kicker_value}</Text>
          <Text style={dkd_styles.dkd_title}>{dkd_title_value}</Text>
          <Text style={dkd_styles.dkd_message}>{dkd_message_value}</Text>

          {dkd_safe_item_values.length ? (
            <View style={dkd_styles.dkd_item_stack}>
              {dkd_safe_item_values.map((dkd_item_value, dkd_item_index_value) => (
                <View
                  key={`${String(dkd_item_value)}_${dkd_item_index_value}`}
                  style={dkd_styles.dkd_item_row}
                >
                  <View style={dkd_styles.dkd_item_icon}>
                    <MaterialCommunityIcons name="check" size={14} color="#07131C" />
                  </View>
                  <Text style={dkd_styles.dkd_item_text}>{dkd_item_value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={dkd_styles.dkd_status_card}>
            <MaterialCommunityIcons name="shield-check-outline" size={19} color="#7DD3FC" />
            <Text style={dkd_styles.dkd_status_text}>
              Bu ekrandan gerçek talep, sipariş veya ödeme oluşturulmaz.
            </Text>
          </View>

          <Pressable onPress={dkd_on_close_value} style={dkd_styles.dkd_primary_button}>
            <Text style={dkd_styles.dkd_primary_button_text}>Tamam</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#07131C" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(2, 6, 15, 0.84)',
  },
  dkd_card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.30)',
    backgroundColor: '#0A1524',
    padding: 20,
  },
  dkd_top_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dkd_icon_shell: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7DD3FC',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  dkd_close_button: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#162235',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dkd_kicker: {
    marginTop: 20,
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  dkd_title: {
    marginTop: 7,
    color: '#F8FAFC',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
  },
  dkd_message: {
    marginTop: 10,
    color: 'rgba(226, 242, 255, 0.76)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  dkd_item_stack: {
    marginTop: 18,
    gap: 10,
  },
  dkd_item_row: {
    minHeight: 50,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    backgroundColor: '#111F31',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.16)',
  },
  dkd_item_icon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A7F3D0',
  },
  dkd_item_text: {
    flex: 1,
    marginLeft: 11,
    color: '#EAF6FF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  dkd_status_card: {
    marginTop: 18,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    backgroundColor: '#0C2030',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.20)',
  },
  dkd_status_text: {
    flex: 1,
    marginLeft: 10,
    color: '#CDEFFF',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  dkd_primary_button: {
    marginTop: 18,
    minHeight: 56,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: '#7DD3FC',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  dkd_primary_button_text: {
    color: '#07131C',
    fontSize: 16,
    fontWeight: '900',
  },
});
