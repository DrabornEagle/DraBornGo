import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  dkd_fetch_courier_earnings_summary_value,
  dkd_format_earnings_money_value,
} from '../../services/dkd_courier_earnings_service';

function dkd_safe_number_value(dkd_value) {
  const dkd_number_value = Number(dkd_value || 0);
  return Number.isFinite(dkd_number_value) ? Math.max(0, dkd_number_value) : 0;
}

function dkd_live_duration_text_value(dkd_seconds_value) {
  const dkd_total_seconds_value = Math.max(0, Math.floor(dkd_safe_number_value(dkd_seconds_value)));
  const dkd_hours_value = Math.floor(dkd_total_seconds_value / 3600);
  const dkd_minutes_value = Math.floor((dkd_total_seconds_value % 3600) / 60);
  const dkd_seconds_remainder_value = dkd_total_seconds_value % 60;
  return [dkd_hours_value, dkd_minutes_value, dkd_seconds_remainder_value]
    .map((dkd_part_value) => String(dkd_part_value).padStart(2, '0'))
    .join(':');
}

function DkdPeriodCard({ dkd_title_value, dkd_icon_value, dkd_data_value, dkd_live_seconds_value = null, dkd_colors_value }) {
  const dkd_seconds_value = dkd_live_seconds_value == null
    ? dkd_safe_number_value(dkd_data_value?.dkd_online_seconds)
    : dkd_live_seconds_value;
  return (
    <LinearGradient colors={dkd_colors_value} style={dkd_styles_value.dkd_period_card}>
      <View style={dkd_styles_value.dkd_period_top}>
        <View style={dkd_styles_value.dkd_period_icon}><MaterialCommunityIcons name={dkd_icon_value} size={17} color="#FFFFFF" /></View>
        <Text style={dkd_styles_value.dkd_period_title}>{dkd_title_value}</Text>
      </View>
      <Text style={dkd_styles_value.dkd_period_money}>{dkd_format_earnings_money_value(dkd_data_value?.dkd_earnings_tl)}</Text>
      <View style={dkd_styles_value.dkd_period_bottom}>
        <Text style={dkd_styles_value.dkd_period_meta}>{dkd_data_value?.dkd_completed_jobs || 0} teslimat</Text>
        <Text style={dkd_styles_value.dkd_period_meta}>{dkd_live_duration_text_value(dkd_seconds_value)}</Text>
      </View>
    </LinearGradient>
  );
}

function DkdCourierEarningsCategory({ dkd_visible_value = true }) {
  const [dkd_open_value, dkd_set_open_value] = useState(false);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_data_value, dkd_set_data_value] = useState({});
  const [dkd_clock_value, dkd_set_clock_value] = useState(Date.now());
  const dkd_arrow_value = useRef(new Animated.Value(0)).current;

  const dkd_load_value = useCallback(async () => {
    dkd_set_loading_value(true);
    try {
      const dkd_result_value = await dkd_fetch_courier_earnings_summary_value();
      if (!dkd_result_value?.error) {
        dkd_set_data_value(dkd_result_value?.data || {});
        dkd_set_clock_value(Date.now());
      }
    } finally {
      dkd_set_loading_value(false);
    }
  }, []);

  useEffect(() => {
    if (!dkd_visible_value) return undefined;
    dkd_load_value();
    const dkd_refresh_interval_value = setInterval(dkd_load_value, 60000);
    return () => clearInterval(dkd_refresh_interval_value);
  }, [dkd_visible_value, dkd_load_value]);

  useEffect(() => {
    if (!dkd_visible_value || dkd_data_value?.dkd_is_online !== true) return undefined;
    const dkd_clock_interval_value = setInterval(() => dkd_set_clock_value(Date.now()), 1000);
    return () => clearInterval(dkd_clock_interval_value);
  }, [dkd_visible_value, dkd_data_value?.dkd_is_online]);

  useEffect(() => {
    Animated.spring(dkd_arrow_value, {
      toValue: dkd_open_value ? 1 : 0,
      speed: 24,
      bounciness: 2,
      useNativeDriver: true,
    }).start();
  }, [dkd_arrow_value, dkd_open_value]);

  const dkd_daily_value = dkd_data_value?.daily || {};
  const dkd_daily_live_seconds_value = useMemo(() => {
    const dkd_base_seconds_value = dkd_safe_number_value(dkd_daily_value?.dkd_online_seconds);
    if (dkd_data_value?.dkd_is_online !== true) return dkd_base_seconds_value;
    const dkd_generated_timestamp_value = new Date(dkd_data_value?.dkd_generated_at || 0).getTime();
    if (!Number.isFinite(dkd_generated_timestamp_value) || dkd_generated_timestamp_value <= 0) return dkd_base_seconds_value;
    return dkd_base_seconds_value + Math.max(0, Math.floor((dkd_clock_value - dkd_generated_timestamp_value) / 1000));
  }, [dkd_clock_value, dkd_daily_value?.dkd_online_seconds, dkd_data_value?.dkd_generated_at, dkd_data_value?.dkd_is_online]);

  const dkd_hourly_value = dkd_safe_number_value(dkd_daily_value?.dkd_hourly_tl);
  const dkd_hourly_ready_value = dkd_safe_number_value(dkd_daily_value?.dkd_hourly_basis_seconds) >= 60;
  const dkd_arrow_rotate_value = dkd_arrow_value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={dkd_styles_value.dkd_shell}>
      <LinearGradient colors={['rgba(9,78,104,.96)', 'rgba(38,56,126,.96)', 'rgba(81,37,105,.96)']} style={StyleSheet.absoluteFill} />
      <View style={dkd_styles_value.dkd_glow_one} />
      <View style={dkd_styles_value.dkd_glow_two} />

      <Pressable onPress={() => dkd_set_open_value((dkd_previous_value) => !dkd_previous_value)} style={dkd_styles_value.dkd_header}>
        <View style={dkd_styles_value.dkd_header_icon}><MaterialCommunityIcons name="finance" size={23} color="#06111B" /></View>
        <View style={dkd_styles_value.dkd_header_copy}>
          <Text style={dkd_styles_value.dkd_kicker}>KURYE KAZANÇ MERKEZİ</Text>
          <Text style={dkd_styles_value.dkd_title}>Kazanç Tablosu</Text>
          <Text style={dkd_styles_value.dkd_subtitle} numberOfLines={1}>
            {dkd_loading_value ? 'Kazançlar güncelleniyor…' : `${dkd_format_earnings_money_value(dkd_daily_value?.dkd_earnings_tl)} • ${dkd_live_duration_text_value(dkd_daily_live_seconds_value)}`}
          </Text>
        </View>
        <View style={dkd_styles_value.dkd_header_actions}>
          <Pressable onPress={(dkd_event_value) => { dkd_event_value.stopPropagation?.(); dkd_load_value(); }} style={dkd_styles_value.dkd_refresh_button}>
            {dkd_loading_value ? <ActivityIndicator color="#DDF9FF" size="small" /> : <MaterialCommunityIcons name="refresh" size={18} color="#DDF9FF" />}
          </Pressable>
          <Animated.View style={{ transform: [{ rotate: dkd_arrow_rotate_value }] }}><MaterialCommunityIcons name="chevron-down" size={23} color="#DDF9FF" /></Animated.View>
        </View>
      </Pressable>

      {dkd_open_value ? (
        <View style={dkd_styles_value.dkd_body}>
          <View style={dkd_styles_value.dkd_live_row}>
            <LinearGradient colors={['rgba(0,14,30,.48)', 'rgba(17,32,68,.58)']} style={dkd_styles_value.dkd_live_timer_card}>
              <View style={dkd_styles_value.dkd_live_timer_top}><MaterialCommunityIcons name="timer-outline" size={19} color="#7CEBFF" /><Text style={dkd_styles_value.dkd_live_timer_label}>BUGÜN ÇEVRİMİÇİ</Text><View style={[dkd_styles_value.dkd_live_dot, dkd_data_value?.dkd_is_online === true && dkd_styles_value.dkd_live_dot_active]} /></View>
              <Text style={dkd_styles_value.dkd_live_timer_value}>{dkd_live_duration_text_value(dkd_daily_live_seconds_value)}</Text>
              <Text style={dkd_styles_value.dkd_live_timer_sub}>{dkd_data_value?.dkd_is_online === true ? 'Sayaç canlı çalışıyor' : 'Kurye şu anda çevrimdışı'}</Text>
            </LinearGradient>
            <LinearGradient colors={['rgba(4,56,46,.52)', 'rgba(34,40,86,.56)']} style={dkd_styles_value.dkd_live_timer_card}>
              <View style={dkd_styles_value.dkd_live_timer_top}><MaterialCommunityIcons name="speedometer" size={19} color="#89F0C0" /><Text style={dkd_styles_value.dkd_live_timer_label}>SAAT BAŞI</Text></View>
              <Text style={dkd_styles_value.dkd_hourly_value}>{dkd_hourly_ready_value ? dkd_format_earnings_money_value(dkd_hourly_value) : 'Hesaplanıyor'}</Text>
              <Text style={dkd_styles_value.dkd_live_timer_sub}>En az 1 dk gerçek çalışma verisiyle hesaplanır</Text>
            </LinearGradient>
          </View>

          <DkdPeriodCard dkd_title_value="GÜNLÜK" dkd_icon_value="weather-sunny" dkd_data_value={dkd_data_value?.daily} dkd_live_seconds_value={dkd_daily_live_seconds_value} dkd_colors_value={['rgba(5,104,114,.76)', 'rgba(22,70,130,.80)']} />
          <DkdPeriodCard dkd_title_value="HAFTALIK" dkd_icon_value="calendar-week" dkd_data_value={dkd_data_value?.weekly} dkd_colors_value={['rgba(61,63,145,.76)', 'rgba(103,49,121,.80)']} />
          <DkdPeriodCard dkd_title_value="AYLIK" dkd_icon_value="calendar-month" dkd_data_value={dkd_data_value?.monthly} dkd_colors_value={['rgba(117,76,31,.76)', 'rgba(126,48,79,.80)']} />

          <View style={dkd_styles_value.dkd_lifetime_row}>
            <MaterialCommunityIcons name="trophy-variant-outline" size={19} color="#FFD67A" />
            <Text style={dkd_styles_value.dkd_lifetime_text}>Toplam {dkd_data_value?.dkd_lifetime_completed_jobs || 0} teslimat • {dkd_format_earnings_money_value(dkd_data_value?.dkd_lifetime_earnings_tl)}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_shell: { borderRadius: 27, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(137,230,255,.23)', marginBottom: 13 },
  dkd_glow_one: { position: 'absolute', width: 170, height: 170, borderRadius: 999, right: -90, top: -95, backgroundColor: 'rgba(111,231,255,.12)' },
  dkd_glow_two: { position: 'absolute', width: 190, height: 190, borderRadius: 999, left: -125, bottom: -135, backgroundColor: 'rgba(200,93,255,.10)' },
  dkd_header: { minHeight: 92, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dkd_header_icon: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#87EAFF', alignItems: 'center', justifyContent: 'center' },
  dkd_header_copy: { flex: 1, minWidth: 0 },
  dkd_kicker: { color: '#B8F4FF', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.15 },
  dkd_title: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 2 },
  dkd_subtitle: { color: 'rgba(238,247,255,.65)', fontSize: 10.5, fontWeight: '700', marginTop: 3 },
  dkd_header_actions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dkd_refresh_button: { width: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  dkd_body: { paddingHorizontal: 13, paddingBottom: 13, gap: 9 },
  dkd_live_row: { flexDirection: 'row', gap: 8 },
  dkd_live_timer_card: { flex: 1, minHeight: 111, borderRadius: 19, padding: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,.09)' },
  dkd_live_timer_top: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dkd_live_timer_label: { flex: 1, color: 'rgba(238,247,255,.66)', fontSize: 8, fontWeight: '900', letterSpacing: .7 },
  dkd_live_dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#728098' },
  dkd_live_dot_active: { backgroundColor: '#59E8AD' },
  dkd_live_timer_value: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 9, fontVariant: ['tabular-nums'] },
  dkd_hourly_value: { color: '#DFFFF2', fontSize: 18, fontWeight: '900', marginTop: 9 },
  dkd_live_timer_sub: { color: 'rgba(235,245,255,.52)', fontSize: 8.5, lineHeight: 12, fontWeight: '700', marginTop: 4 },
  dkd_period_card: { minHeight: 110, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.10)' },
  dkd_period_top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dkd_period_icon: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.10)', alignItems: 'center', justifyContent: 'center' },
  dkd_period_title: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  dkd_period_money: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 9 },
  dkd_period_bottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  dkd_period_meta: { color: 'rgba(238,247,255,.66)', fontSize: 9.5, fontWeight: '800', fontVariant: ['tabular-nums'] },
  dkd_lifetime_row: { minHeight: 48, borderRadius: 17, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,214,122,.16)', backgroundColor: 'rgba(91,55,64,.30)' },
  dkd_lifetime_text: { flex: 1, color: '#FFE7AA', fontSize: 10.5, fontWeight: '900' },
});

export default memo(DkdCourierEarningsCategory);
