import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import { dkd_make_native_axis_point } from '../../utils/dkdNativeAxis';

const dkd_pre_login_role_storage_key_value = 'dkd_dkd_draborngo_pre_login_role_hint_v6';

const dkd_intro_step_list_value = [
  {
    dkd_badge_text: 'DraBornGo ŞEHİR GİRİŞİ',
    dkd_title_text: "DraBornGo'ya hoş geldin — şehir artık tek ekranda",
    dkd_body_text: 'Kurye, kargo, restoran, market, Hizmet Ağı ve canlı görev akışını neon şehir merkezi gibi çalışan tek ekosistemde topluyoruz.',
    dkd_art_mode_value: 'welcome',
    dkd_art_image_source_value: require('../../../assets/dkd_onboarding/dkd_intro_city_ecosystem.png'),
    dkd_primary_icon_name: 'city-variant-outline',
    dkd_accent_colors_value: ['#38BDF8', '#A78BFA', '#F472B6'],
    dkd_screen_gradient_colors_value: ['#040617', '#111827', '#32115F', '#0B5C72'],
  },
  {
    dkd_badge_text: 'HIZLI TESLİMAT MOTORU',
    dkd_title_text: 'Sipariş gelir, rota parlar, görev netleşir',
    dkd_body_text: 'Kurye, restoran siparişi, kargo paneli ve partner hizmetleri daha renkli kartlar ve canlı operasyon mantığıyla görünür olur.',
    dkd_art_mode_value: 'delivery',
    dkd_art_image_source_value: require('../../../assets/dkd_onboarding/dkd_intro_delivery_route.png'),
    dkd_primary_icon_name: 'bike-fast',
    dkd_accent_colors_value: ['#34D399', '#22D3EE', '#FACC15'],
    dkd_screen_gradient_colors_value: ['#02140D', '#053B2A', '#0F766E', '#13213F'],
  },
  {
    dkd_badge_text: 'ROLÜNÜ SEÇ',
    dkd_title_text: "DraBornGo'yı kendi akışına göre aç",
    dkd_body_text: 'Müşteri, kurye veya işletme akışını seç; karşılama ekranı ilk tercihini cihazda saklar ve login sonrası seni daha anlaşılır karşılar.',
    dkd_art_mode_value: 'role',
    dkd_art_image_source_value: require('../../../assets/dkd_onboarding/dkd_intro_role_hub.png'),
    dkd_primary_icon_name: 'account-switch-outline',
    dkd_accent_colors_value: ['#FB7185', '#A78BFA', '#60A5FA'],
    dkd_screen_gradient_colors_value: ['#16051B', '#35124F', '#1E1B4B', '#0F172A'],
  },
  {
    dkd_badge_text: 'CANLI TAKİP & BİLDİRİM',
    dkd_title_text: 'Sipariş havuzu, Canlı Harita ve bildirimler aynı ritimde',
    dkd_body_text: 'Kabul, teslim alma, müşteri rotası ve teslim edildi adımları daha okunur; şehir operasyonu login öncesinden bile güçlü görünür.',
    dkd_art_mode_value: 'control',
    dkd_art_image_source_value: require('../../../assets/dkd_onboarding/dkd_intro_live_tracking.png'),
    dkd_primary_icon_name: 'map-marker-path',
    dkd_accent_colors_value: ['#F59E0B', '#22C55E', '#38BDF8'],
    dkd_screen_gradient_colors_value: ['#130B02', '#3B1F09', '#14213D', '#031A30'],
  },
];

const dkd_role_option_list_value = [
  { dkd_key_value: 'customer', dkd_label_text: 'Müşteriyim', dkd_icon_name: 'account-heart-outline' },
  { dkd_key_value: 'courier', dkd_label_text: 'Kuryeyim', dkd_icon_name: 'bike-fast' },
  { dkd_key_value: 'business', dkd_label_text: 'İşletmeyim', dkd_icon_name: 'storefront-outline' },
];

const dkd_delivery_card_list_value = [
  { dkd_title_text: 'Kurye Ağı', dkd_body_text: 'Dakikalar içinde görev', dkd_icon_name: 'flash', dkd_color_value: '#22C55E' },
  { dkd_title_text: 'Restoran', dkd_body_text: 'Sıcak sipariş takibi', dkd_icon_name: 'silverware-fork-knife', dkd_color_value: '#F97316' },
  { dkd_title_text: 'Gönderi Paneli', dkd_body_text: 'Paket ve rota akışı', dkd_icon_name: 'package-variant-closed', dkd_color_value: '#0EA5E9' },
  { dkd_title_text: 'Hizmet Ağı', dkd_body_text: 'Partner hizmetleri', dkd_icon_name: 'tools', dkd_color_value: '#A855F7' },
];

function DkdIntroIllustration({ dkd_art_image_source_value, dkd_accent_colors_value }) {
  const dkd_pulse_value = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const dkd_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_pulse_value, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(dkd_pulse_value, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    );
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_pulse_value]);

  const dkd_float_translate_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const dkd_glow_opacity_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.42] });
  const dkd_scale_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1.012] });
  const dkd_gradient_colors_value = Array.isArray(dkd_accent_colors_value) ? dkd_accent_colors_value : ['#38BDF8', '#A78BFA', '#F472B6'];

  return (
    <View style={dkd_styles_value.dkd_art_shell}>
      <LinearGradient
        colors={['rgba(2,6,23,0.96)', `${dkd_gradient_colors_value[0]}33`, `${dkd_gradient_colors_value[1]}24`, 'rgba(2,6,23,0.92)']}
        start={dkd_make_native_axis_point(0, 0)}
        end={dkd_make_native_axis_point(1, 1)}
        style={dkd_styles_value.dkd_art_gradient_backdrop}
      />
      <Image
        source={dkd_art_image_source_value}
        contentFit="cover"
        blurRadius={12}
        style={dkd_styles_value.dkd_mockup_background_image}
      />
      <LinearGradient
        colors={['rgba(2,6,23,0.24)', 'rgba(2,6,23,0.42)', 'rgba(2,6,23,0.18)']}
        start={dkd_make_native_axis_point(0, 0)}
        end={dkd_make_native_axis_point(1, 1)}
        pointerEvents="none"
        style={dkd_styles_value.dkd_mockup_background_scrim}
      />
      <Animated.View
        style={[
          dkd_styles_value.dkd_mockup_glow,
          {
            backgroundColor: dkd_gradient_colors_value[1],
            opacity: dkd_glow_opacity_value,
            transform: [{ scale: dkd_scale_value }],
          },
        ]}
      />
      <Animated.View
        style={[
          dkd_styles_value.dkd_mockup_image_frame,
          { transform: [{ translateY: dkd_float_translate_value }, { scale: dkd_scale_value }] },
        ]}
      >
        <Image source={dkd_art_image_source_value} contentFit="cover" style={dkd_styles_value.dkd_mockup_image} />
      </Animated.View>
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0)']}
        start={dkd_make_native_axis_point(0, 0)}
        end={dkd_make_native_axis_point(1, 1)}
        pointerEvents="none"
        style={dkd_styles_value.dkd_mockup_edge_light}
      />
    </View>
  );
}

function DkdRolePicker({ dkd_selected_role_value, dkd_on_select_role_value }) {
  const dkd_role_sweep_value = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const dkd_role_sweep_loop_value = Animated.loop(
      Animated.timing(dkd_role_sweep_value, { toValue: 1, duration: 2100, useNativeDriver: true })
    );
    dkd_role_sweep_loop_value.start();
    return () => dkd_role_sweep_loop_value.stop();
  }, [dkd_role_sweep_value]);

  const dkd_role_sweep_translate_value = dkd_role_sweep_value.interpolate({ inputRange: [0, 1], outputRange: [-120, 360] });
  const dkd_role_sweep_opacity_value = dkd_role_sweep_value.interpolate({ inputRange: [0, 0.2, 0.74, 1], outputRange: [0, 0.46, 0.46, 0] });
  const dkd_role_cue_translate_value = dkd_role_sweep_value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 5, 0] });

  return (
    <View style={dkd_styles_value.dkd_role_grid}>
      {dkd_role_option_list_value.map((dkd_role_value) => {
        const dkd_active_flag = dkd_selected_role_value === dkd_role_value.dkd_key_value;
        return (
          <Pressable
            key={dkd_role_value.dkd_key_value}
            onPress={() => dkd_on_select_role_value(dkd_role_value.dkd_key_value)}
            style={({ pressed: dkd_pressed_flag }) => [
              dkd_styles_value.dkd_role_chip,
              dkd_pressed_flag && dkd_styles_value.dkd_role_chip_pressed,
              dkd_active_flag && dkd_styles_value.dkd_role_chip_active,
            ]}
          >
            {!dkd_active_flag ? (
              <>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    dkd_styles_value.dkd_role_chip_sweep,
                    {
                      opacity: dkd_role_sweep_opacity_value,
                      transform: [{ translateX: dkd_role_sweep_translate_value }, { rotate: '-14deg' }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(103,232,249,0.42)', 'rgba(255,255,255,0)']}
                    start={dkd_make_native_axis_point(0, 0)}
                    end={dkd_make_native_axis_point(1, 0)}
                    style={dkd_styles_value.dkd_role_chip_sweep_fill}
                  />
                </Animated.View>
                <Animated.View
                  pointerEvents="none"
                  style={[dkd_styles_value.dkd_role_chip_cue, { transform: [{ translateY: dkd_role_cue_translate_value }] }]}
                >
                  <MaterialCommunityIcons name="gesture-tap-button" size={15} color="#67E8F9" />
                  <Text style={dkd_styles_value.dkd_role_chip_cue_text}>Hoş Geldin</Text>
                </Animated.View>
              </>
            ) : null}
            <View style={[dkd_styles_value.dkd_role_icon_bubble, dkd_active_flag && dkd_styles_value.dkd_role_icon_bubble_active]}>
              <MaterialCommunityIcons name={dkd_role_value.dkd_icon_name} size={19} color={dkd_active_flag ? '#06111F' : '#E0F2FE'} />
            </View>
            <Text style={[dkd_styles_value.dkd_role_chip_text, dkd_active_flag && dkd_styles_value.dkd_role_chip_text_active]}>{dkd_role_value.dkd_label_text}</Text>
            <View style={[dkd_styles_value.dkd_role_select_badge, dkd_active_flag && dkd_styles_value.dkd_role_select_badge_active]}>
              <Text style={[dkd_styles_value.dkd_role_select_badge_text, dkd_active_flag && dkd_styles_value.dkd_role_select_badge_text_active]}>
                {dkd_active_flag ? 'Seçildi' : 'Seç'}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function DkdDeliveryCards() {
  return (
    <View style={dkd_styles_value.dkd_delivery_grid}>
      {dkd_delivery_card_list_value.map((dkd_card_value) => (
        <View key={dkd_card_value.dkd_title_text} style={dkd_styles_value.dkd_delivery_card}>
          <View style={[dkd_styles_value.dkd_delivery_icon, { backgroundColor: dkd_card_value.dkd_color_value }]}>
            <MaterialCommunityIcons name={dkd_card_value.dkd_icon_name} size={20} color="#FFFFFF" />
          </View>
          <Text style={dkd_styles_value.dkd_delivery_title}>{dkd_card_value.dkd_title_text}</Text>
          <Text style={dkd_styles_value.dkd_delivery_body}>{dkd_card_value.dkd_body_text}</Text>
        </View>
      ))}
    </View>
  );
}

export default function DkdPreLoginIntroScreen({ dkd_on_complete_value }) {
  const [dkd_step_index_value, dkd_set_step_index_value] = useState(0);
  const [dkd_selected_role_value, dkd_set_selected_role_value] = useState(null);
  const [dkd_saving_flag, dkd_set_saving_flag] = useState(false);
  const dkd_scroll_view_reference_value = useRef(null);
  const dkd_current_step_value = dkd_intro_step_list_value[dkd_step_index_value] || dkd_intro_step_list_value[0];
  const dkd_last_step_flag = dkd_step_index_value >= dkd_intro_step_list_value.length - 1;
  const dkd_role_step_flag = dkd_current_step_value.dkd_art_mode_value === 'role';
  const dkd_role_continue_locked_flag = dkd_role_step_flag && !dkd_selected_role_value;

  const dkd_step_counter_text = useMemo(
    () => `${dkd_step_index_value + 1}/${dkd_intro_step_list_value.length}`,
    [dkd_step_index_value]
  );

  React.useEffect(() => {
    const dkd_scroll_reset_timer_value = setTimeout(() => {
      if (dkd_scroll_view_reference_value.current) {
        dkd_scroll_view_reference_value.current.scrollTo({ y: 0, animated: false });
      }
    }, 0);

    return () => clearTimeout(dkd_scroll_reset_timer_value);
  }, [dkd_step_index_value]);

  async function dkd_finish_intro_flow() {
    if (dkd_saving_flag) return;
    dkd_set_saving_flag(true);
    try {
      await AsyncStorage.setItem(dkd_pre_login_role_storage_key_value, dkd_selected_role_value || 'dkd_not_selected');
    } catch {}
    if (typeof dkd_on_complete_value === 'function') await dkd_on_complete_value();
    dkd_set_saving_flag(false);
  }

  function dkd_go_next_step() {
    if (dkd_role_continue_locked_flag) return;
    if (dkd_last_step_flag) {
      dkd_finish_intro_flow();
      return;
    }
    dkd_set_step_index_value((dkd_previous_step_value) => Math.min(dkd_previous_step_value + 1, dkd_intro_step_list_value.length - 1));
  }

  function dkd_go_previous_step() {
    dkd_set_step_index_value((dkd_previous_step_value) => Math.max(dkd_previous_step_value - 1, 0));
  }

  return (
    <SafeScreen style={dkd_styles_value.dkd_screen}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={dkd_current_step_value.dkd_screen_gradient_colors_value} style={dkd_styles_value.dkd_screen}>
        <View style={dkd_styles_value.dkd_top_bar}>
          <Pressable onPress={dkd_step_index_value === 0 ? dkd_finish_intro_flow : dkd_go_previous_step} hitSlop={12} style={dkd_styles_value.dkd_back_button}>
            <MaterialCommunityIcons name={dkd_step_index_value === 0 ? 'close' : 'arrow-left'} size={25} color="#07131C" />
          </Pressable>
          <Text style={dkd_styles_value.dkd_step_counter}>{dkd_step_counter_text}</Text>
          <Pressable onPress={dkd_finish_intro_flow} hitSlop={12} style={dkd_styles_value.dkd_skip_button}>
            <Text style={dkd_styles_value.dkd_skip_text}>Atla</Text>
          </Pressable>
        </View>

        <ScrollView ref={dkd_scroll_view_reference_value} contentContainerStyle={dkd_styles_value.dkd_scroll_content} showsVerticalScrollIndicator={false}>
          <DkdIntroIllustration dkd_art_image_source_value={dkd_current_step_value.dkd_art_image_source_value} dkd_accent_colors_value={dkd_current_step_value.dkd_accent_colors_value} />

          <View style={dkd_styles_value.dkd_copy_card}>
            <View style={dkd_styles_value.dkd_badge_row}>
              <MaterialCommunityIcons name={dkd_current_step_value.dkd_primary_icon_name} size={16} color="#2563EB" />
              <Text style={dkd_styles_value.dkd_badge_text}>{dkd_current_step_value.dkd_badge_text}</Text>
            </View>
            <Text style={dkd_styles_value.dkd_title}>{dkd_current_step_value.dkd_title_text}</Text>
            <Text style={dkd_styles_value.dkd_body}>{dkd_current_step_value.dkd_body_text}</Text>

            {dkd_current_step_value.dkd_art_mode_value === 'delivery' ? <DkdDeliveryCards /> : null}
            {dkd_current_step_value.dkd_art_mode_value === 'role' ? (
              <View style={dkd_styles_value.dkd_role_section}>
                <Text style={dkd_styles_value.dkd_question_text}>İlk olarak hangi akış sana yakın?</Text>
                <DkdRolePicker dkd_selected_role_value={dkd_selected_role_value} dkd_on_select_role_value={dkd_set_selected_role_value} />
              </View>
            ) : null}
            {dkd_current_step_value.dkd_art_mode_value === 'control' ? (
              <View style={dkd_styles_value.dkd_control_list}>
                <View style={dkd_styles_value.dkd_control_line}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
                  <Text style={dkd_styles_value.dkd_control_line_text}>Sipariş havuzunda kategori odaklı görev akışı</Text>
                </View>
                <View style={dkd_styles_value.dkd_control_line}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
                  <Text style={dkd_styles_value.dkd_control_line_text}>Kargo, restoran ve kurye için canlı durum</Text>
                </View>
                <View style={dkd_styles_value.dkd_control_line}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
                  <Text style={dkd_styles_value.dkd_control_line_text}>Login sonrası DraBornGo şehir merkezine geçiş</Text>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={dkd_styles_value.dkd_bottom_bar}>
          <View style={dkd_styles_value.dkd_dot_row}>
            {dkd_intro_step_list_value.map((dkd_step_value, dkd_index_value) => (
              <View
                key={dkd_step_value.dkd_badge_text}
                style={[dkd_styles_value.dkd_dot, dkd_index_value === dkd_step_index_value && dkd_styles_value.dkd_dot_active]}
              />
            ))}
          </View>
          {dkd_role_continue_locked_flag ? (
            <View style={dkd_styles_value.dkd_role_continue_hint}>
              <MaterialCommunityIcons name="gesture-tap-button" size={20} color="#67E8F9" />
              <Text style={dkd_styles_value.dkd_role_continue_hint_text}>Devam etmek için önce rolünü seç</Text>
            </View>
          ) : (
            <Pressable
              onPress={dkd_go_next_step}
              disabled={dkd_saving_flag}
              style={({ pressed: dkd_pressed_flag }) => [
                dkd_styles_value.dkd_primary_button,
                dkd_pressed_flag && dkd_styles_value.dkd_primary_button_pressed,
                dkd_saving_flag && dkd_styles_value.dkd_primary_button_disabled,
              ]}
            >
              <LinearGradient
                colors={dkd_last_step_flag ? ['#22C55E', '#0EA5E9', '#8B5CF6'] : ['#48E000', '#22C55E']}
                start={dkd_make_native_axis_point(0, 0)}
                end={dkd_make_native_axis_point(1, 1)}
                style={dkd_styles_value.dkd_primary_button_fill}
              >
                <Text style={dkd_styles_value.dkd_primary_button_text}>{dkd_last_step_flag ? 'Hadi başlayalım!' : 'Devam'}</Text>
                <MaterialCommunityIcons name="arrow-right" size={22} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </SafeScreen>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_screen: {
    flex: 1,
  },
  dkd_top_bar: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dkd_back_button: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  dkd_skip_button: {
    minWidth: 66,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  dkd_skip_text: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },
  dkd_step_counter: {
    color: '#E0F2FE',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.44)',
    overflow: 'hidden',
  },
  dkd_scroll_content: {
    paddingHorizontal: 18,
    paddingBottom: 184,
  },
  dkd_art_shell: {
    height: 318,
    borderRadius: 42,
    marginTop: 8,
    marginBottom: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2,6,23,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  dkd_art_gradient_backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dkd_mockup_background_image: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.48,
    transform: [{ scale: 1.1 }],
  },
  dkd_mockup_background_scrim: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.88,
  },
  dkd_mockup_glow: {
    position: 'absolute',
    width: 292,
    height: 292,
    borderRadius: 146,
    shadowColor: '#67E8F9',
    shadowOpacity: 0.42,
    shadowRadius: 34,
  },
  dkd_mockup_image_frame: {
    width: '120%',
    height: '120%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dkd_mockup_image: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  dkd_mockup_edge_light: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.34,
  },
  dkd_copy_card: {
    borderRadius: 34,
    backgroundColor: 'rgba(15,23,42,0.78)',
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000000',
    shadowOpacity: 0.26,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 7,
  },
  dkd_badge_row: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(14,165,233,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.22)',
  },
  dkd_badge_text: {
    color: '#BAE6FD',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  dkd_title: {
    color: '#F8FAFC',
    fontSize: 33,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -1.1,
    marginTop: 18,
  },
  dkd_body: {
    color: 'rgba(226,232,240,0.78)',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  dkd_delivery_grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  dkd_delivery_card: {
    width: '47%',
    minHeight: 122,
    borderRadius: 26,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  dkd_delivery_icon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dkd_delivery_title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 10,
  },
  dkd_delivery_body: {
    color: 'rgba(226,232,240,0.68)',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    marginTop: 4,
  },
  dkd_role_section: {
    marginTop: 20,
  },
  dkd_question_text: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  dkd_role_grid: {
    gap: 10,
  },
  dkd_role_chip: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.30)',
    overflow: 'hidden',
  },
  dkd_role_chip_pressed: {
    transform: [{ scale: 0.985 }],
  },
  dkd_role_chip_sweep: {
    position: 'absolute',
    top: -24,
    bottom: -24,
    width: 74,
  },
  dkd_role_chip_sweep_fill: {
    flex: 1,
    borderRadius: 999,
  },
  dkd_role_chip_cue: {
    position: 'absolute',
    right: 72,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(8,47,73,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.34)',
  },
  dkd_role_chip_cue_text: {
    color: '#BAE6FD',
    fontSize: 10,
    fontWeight: '900',
  },
  dkd_role_chip_active: {
    backgroundColor: '#67E8F9',
    borderColor: '#E0F2FE',
  },
  dkd_role_icon_bubble: {
    width: 36,
    height: 36,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14,165,233,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(186,230,253,0.24)',
  },
  dkd_role_icon_bubble_active: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(255,255,255,0.92)',
  },
  dkd_role_chip_text: {
    flex: 1,
    color: '#E0F2FE',
    fontSize: 14,
    fontWeight: '900',
  },
  dkd_role_chip_text_active: {
    color: '#06111F',
  },
  dkd_role_select_badge: {
    minWidth: 48,
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  dkd_role_select_badge_active: {
    backgroundColor: '#06111F',
    borderColor: '#06111F',
  },
  dkd_role_select_badge_text: {
    color: '#BAE6FD',
    fontSize: 11,
    fontWeight: '900',
  },
  dkd_role_select_badge_text_active: {
    color: '#FFFFFF',
  },
  dkd_control_list: {
    gap: 12,
    marginTop: 18,
  },
  dkd_control_line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  dkd_control_line_text: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },
  dkd_role_continue_hint: {
    minHeight: 66,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(15,23,42,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.28)',
  },
  dkd_role_continue_hint_text: {
    color: '#BAE6FD',
    fontSize: 15,
    fontWeight: '900',
  },
  dkd_bottom_bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 24,
    backgroundColor: 'rgba(2,6,23,0.72)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  dkd_dot_row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dkd_dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(226,232,240,0.24)',
  },
  dkd_dot_active: {
    width: 30,
    backgroundColor: '#67E8F9',
  },
  dkd_primary_button: {
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  dkd_primary_button_pressed: {
    transform: [{ scale: 0.985 }],
  },
  dkd_primary_button_disabled: {
    opacity: 0.64,
  },
  dkd_primary_button_fill: {
    minHeight: 66,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  dkd_primary_button_text: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
  },
});
