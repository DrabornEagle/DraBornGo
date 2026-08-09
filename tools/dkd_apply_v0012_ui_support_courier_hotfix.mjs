import fs from 'node:fs';
import path from 'node:path';

function dkd_read_value(dkd_path_value) {
  return fs.readFileSync(dkd_path_value, 'utf8');
}
function dkd_write_value(dkd_path_value, dkd_content_value) {
  fs.writeFileSync(dkd_path_value, dkd_content_value, 'utf8');
}
function dkd_replace_required_value(dkd_content_value, dkd_search_value, dkd_replace_value, dkd_label_value) {
  if (!dkd_content_value.includes(dkd_search_value)) throw new Error(`dkd_patch_missing:${dkd_label_value}`);
  return dkd_content_value.replace(dkd_search_value, dkd_replace_value);
}

// 1) Merkez Menü: old large earnings panel yerine collapsible/live category.
{
  const dkd_path_value = 'src/features/navigation/ActionMenuModal.js';
  let dkd_content_value = dkd_read_value(dkd_path_value);
  const dkd_import_marker_value = "import { dkd_fetch_courier_earnings_summary_value, dkd_format_earnings_money_value, dkd_format_work_duration_value } from '../../services/dkd_courier_earnings_service';";
  if (!dkd_content_value.includes("dkd_courier_earnings_category")) {
    dkd_content_value = dkd_replace_required_value(
      dkd_content_value,
      dkd_import_marker_value,
      `${dkd_import_marker_value}\nimport DkdCourierEarningsCategory from './dkd_courier_earnings_category';`,
      'earnings_import'
    );
  }
  dkd_content_value = dkd_replace_required_value(
    dkd_content_value,
    "{canCourier ? <DkdEarningsPanel dkd_loading_value={dkd_earnings_loading_value} dkd_data_value={dkd_earnings_value} dkd_on_refresh_value={dkd_load_earnings_value} /> : null}",
    "{canCourier ? <DkdCourierEarningsCategory dkd_visible_value={visible} /> : null}",
    'earnings_component'
  );
  dkd_write_value(dkd_path_value, dkd_content_value);
}

// 2) Ana sayfa: Kurye Kontrol Merkezi yeniden tasarım, quick tile swap, Kontrollü Erişim kaldırma.
{
  const dkd_path_value = 'src/features/map/MapHomeScreen.js';
  let dkd_content_value = dkd_read_value(dkd_path_value);
  const dkd_start_marker_value = "          <LinearGradient colors={dkd_status_value.dkd_gradient_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dkd_styles_value.dkd_control_card}>";
  const dkd_end_marker_value = "          </LinearGradient>\n\n          <View style={dkd_styles_value.dkd_section_heading}>";
  const dkd_start_index_value = dkd_content_value.indexOf(dkd_start_marker_value);
  const dkd_end_index_value = dkd_content_value.indexOf(dkd_end_marker_value, dkd_start_index_value);
  if (dkd_start_index_value < 0 || dkd_end_index_value < 0) throw new Error('dkd_patch_missing:control_card');
  const dkd_new_control_value = `          <LinearGradient colors={dkd_status_value.dkd_gradient_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dkd_styles_value.dkd_control_card}>
            <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_scan_light, { transform: [{ translateX: dkd_scan_translate_value }, { rotate: '17deg' }] }]} />
            <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_route_lane, dkd_styles_value.dkd_route_lane_one, { transform: [{ translateX: dkd_lane_translate_value }, { rotate: '-24deg' }] }]} />
            <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_route_lane, dkd_styles_value.dkd_route_lane_two, { transform: [{ translateX: Animated.multiply(dkd_lane_translate_value, -0.55) }, { rotate: '-24deg' }] }]} />

            <View style={dkd_styles_value.dkd_control_topline}>
              <View style={dkd_styles_value.dkd_control_brand_pill}><MaterialCommunityIcons name="radar" size={14} color="#A9EEFF" /><Text style={dkd_styles_value.dkd_control_brand_pill_text}>SİPARİŞ • KURYE RADARI</Text></View>
              <View style={[dkd_styles_value.dkd_network_pill, { borderColor: dkd_status_value.dkd_accent_value + '66' }]}><View style={[dkd_styles_value.dkd_network_dot, { backgroundColor: dkd_status_value.dkd_accent_value }]} /><Text style={dkd_styles_value.dkd_network_pill_text}>{dkd_status_value.dkd_short_value}</Text></View>
            </View>

            <View style={dkd_styles_value.dkd_control_hero}>
              <View style={dkd_styles_value.dkd_gate_icon_stage}>
                <Animated.View style={[dkd_styles_value.dkd_gate_icon_halo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }], borderColor: dkd_status_value.dkd_accent_value }]} />
                <LinearGradient colors={['#06121E', '#0A2639', '#121833']} style={dkd_styles_value.dkd_gate_icon_shell}>
                  <Animated.View style={{ transform: [{ translateY: dkd_racing_motorcycle_translate_value }, { rotate: dkd_racing_motorcycle_rotate_value }] }}>
                    <Image source={dkd_racing_motorcycle_asset_value} style={dkd_styles_value.dkd_racing_motorcycle_image} contentFit="contain" transition={0} />
                  </Animated.View>
                </LinearGradient>
                <View style={dkd_styles_value.dkd_gate_icon_label}><Text style={dkd_styles_value.dkd_gate_icon_label_text}>DKD RIDER</Text></View>
              </View>
              <View style={dkd_styles_value.dkd_control_copy}>
                <Text style={dkd_styles_value.dkd_control_kicker}>KURYE KONTROL MERKEZİ</Text>
                <Text style={dkd_styles_value.dkd_control_title}>{dkd_status_value.dkd_label_value}</Text>
                <Text style={dkd_styles_value.dkd_control_subtitle}>{dkd_status_value.dkd_subtitle_value}</Text>
              </View>
            </View>

            <View style={dkd_styles_value.dkd_order_console}>
              <View style={dkd_styles_value.dkd_order_console_head}><Text style={dkd_styles_value.dkd_order_console_kicker}>CANLI SİPARİŞ ROTASI</Text><View style={dkd_styles_value.dkd_order_signal}><View style={[dkd_styles_value.dkd_order_signal_dot, { backgroundColor: dkd_status_value.dkd_accent_value }]} /><Text style={dkd_styles_value.dkd_order_signal_text}>{dkd_courier_online_value ? 'TARANIYOR' : 'HAZIR'}</Text></View></View>
              <View style={dkd_styles_value.dkd_order_track}>
                <View style={dkd_styles_value.dkd_order_track_node}><MaterialCommunityIcons name="package-variant-closed" size={16} color="#83E9FF" /></View>
                <View style={dkd_styles_value.dkd_order_track_line} />
                <Animated.View style={[dkd_styles_value.dkd_order_track_rider, { transform: [{ translateX: dkd_scan_value.interpolate({ inputRange: [0, 1], outputRange: [-28, 28] }) }] }]}><MaterialCommunityIcons name="motorbike" size={19} color="#FFFFFF" /></Animated.View>
                <View style={dkd_styles_value.dkd_order_track_line} />
                <View style={dkd_styles_value.dkd_order_track_node}><MaterialCommunityIcons name="map-marker-check-outline" size={16} color="#6FEAB5" /></View>
              </View>
              <View style={dkd_styles_value.dkd_order_steps_row}>
                <View style={dkd_styles_value.dkd_order_step}><MaterialCommunityIcons name="package-variant" size={15} color="#79E6FF" /><Text style={dkd_styles_value.dkd_order_step_label}>Sipariş Havuzu</Text></View>
                <View style={dkd_styles_value.dkd_order_step}><MaterialCommunityIcons name="bike-fast" size={15} color="#B8A1FF" /><Text style={dkd_styles_value.dkd_order_step_label}>Kurye Ataması</Text></View>
                <View style={dkd_styles_value.dkd_order_step}><MaterialCommunityIcons name="flag-checkered" size={15} color="#75ECB7" /><Text style={dkd_styles_value.dkd_order_step_label}>Teslimat</Text></View>
              </View>
            </View>

            <View style={dkd_styles_value.dkd_status_metric_row}>
              <DkdStatusMetric dkd_icon_value="map-marker-outline" dkd_label_value="BÖLGE" dkd_value_text={dkd_location_text_value} dkd_accent_value="rgba(43,165,255,0.30)" />
              <DkdStatusMetric dkd_icon_value={dkd_has_location_value ? 'crosshairs-gps' : 'crosshairs-question'} dkd_label_value="GPS" dkd_value_text={dkd_has_location_value ? 'Hazır' : 'Kontrol'} dkd_accent_value={dkd_has_location_value ? 'rgba(48,220,157,0.28)' : 'rgba(255,178,72,0.28)'} />
              <DkdStatusMetric dkd_icon_value={dkd_courier_busy_value ? 'package-variant-closed-check' : 'access-point'} dkd_label_value="SİPARİŞ" dkd_value_text={dkd_courier_busy_value ? 'Aktif' : dkd_courier_online_value ? 'Aranıyor' : 'Bekliyor'} dkd_accent_value={dkd_courier_busy_value ? 'rgba(255,209,102,0.28)' : 'rgba(156,112,255,0.28)'} />
            </View>

            {locationError ? <Pressable onPress={retryLocation} style={dkd_styles_value.dkd_location_warning}><MaterialCommunityIcons name="map-marker-alert-outline" size={19} color="#FFE59A" /><View style={dkd_styles_value.dkd_location_warning_copy}><Text style={dkd_styles_value.dkd_location_warning_title}>Konum bağlantısını yenile</Text><Text style={dkd_styles_value.dkd_location_warning_sub}>Yakın görevler ve rota için GPS durumunu tekrar kontrol et.</Text></View><MaterialCommunityIcons name="reload" size={19} color="#FFE59A" /></Pressable> : null}

            <DkdAnimatedPressable
              dkd_disabled_value={dkd_courier_busy_value}
              dkd_on_press_value={dkd_courier_approved_value ? dkd_on_toggle_courier_online_value : () => onOpenCourierBoard?.('application')}
              dkd_style_value={[dkd_styles_value.dkd_control_button_pressable, dkd_courier_busy_value && dkd_styles_value.dkd_control_button_disabled]}
              dkd_children_value={(
                <LinearGradient colors={[dkd_status_value.dkd_accent_value, dkd_status_value.dkd_secondary_value]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dkd_styles_value.dkd_control_button}>
                  <MaterialCommunityIcons name={dkd_courier_approved_value ? (dkd_courier_busy_value ? 'package-variant-closed-check' : dkd_courier_online_value ? 'pause-circle-outline' : 'radar') : 'clipboard-account-outline'} size={22} color="#031019" />
                  <Text style={dkd_styles_value.dkd_control_button_text}>{dkd_courier_approved_value ? (dkd_courier_busy_value ? 'Sipariş Aktif' : dkd_courier_online_value ? 'Sipariş Radarını Durdur' : 'Sipariş BUL') : 'Kurye Başvurusunu Aç'}</Text>
                  <View style={dkd_styles_value.dkd_control_button_arrow}><MaterialCommunityIcons name={dkd_courier_busy_value ? 'lock-outline' : 'arrow-right'} size={20} color="#031019" /></View>
                </LinearGradient>
              )}
            />
          </LinearGradient>`;
  dkd_content_value = dkd_content_value.slice(0, dkd_start_index_value) + dkd_new_control_value + dkd_content_value.slice(dkd_end_index_value + "          </LinearGradient>".length);

  const dkd_quick_old_value = `          <View style={dkd_styles_value.dkd_quick_grid}>
            <DkdQuickTile dkd_icon_value="clipboard-text-clock-outline" dkd_title_value="Başvurular" dkd_subtitle_value="Kurye başvuru süreci" dkd_accent_value="#0B8E91" dkd_on_press_value={() => onTabChange?.('applications')} />
            <DkdQuickTile dkd_icon_value="headset" dkd_title_value="Destek" dkd_subtitle_value="DrabornEagle admin canlı destek" dkd_accent_value="#A33D80" dkd_on_press_value={() => onTabChange?.('support')} />
            <DkdQuickTile dkd_icon_value="account-circle-outline" dkd_title_value="Profil" dkd_subtitle_value="Kimlik ve hesap merkezi" dkd_accent_value="#405FC8" dkd_on_press_value={onOpenProfile} />
            <DkdQuickTile dkd_icon_value="view-dashboard-edit-outline" dkd_title_value="Tüm Menü" dkd_subtitle_value="Diğer DraBornGo araçları" dkd_accent_value="#A6632B" dkd_on_press_value={onOpenActionMenu} />
          </View>`;
  const dkd_quick_new_value = `          <View style={dkd_styles_value.dkd_quick_grid}>
            <DkdQuickTile dkd_icon_value="account-circle-outline" dkd_title_value="Profil" dkd_subtitle_value="Kimlik ve hesap merkezi" dkd_accent_value="#405FC8" dkd_on_press_value={onOpenProfile} />
            <DkdQuickTile dkd_icon_value="headset" dkd_title_value="Destek" dkd_subtitle_value="DrabornEagle admin canlı destek" dkd_accent_value="#A33D80" dkd_on_press_value={() => onTabChange?.('support')} />
            <DkdQuickTile dkd_icon_value="clipboard-text-clock-outline" dkd_title_value="Başvurular" dkd_subtitle_value="Kurye başvuru süreci" dkd_accent_value="#0B8E91" dkd_on_press_value={() => onTabChange?.('applications')} />
            <DkdQuickTile dkd_icon_value="view-dashboard-edit-outline" dkd_title_value="Tüm Menü" dkd_subtitle_value="Diğer DraBornGo araçları" dkd_accent_value="#A6632B" dkd_on_press_value={onOpenActionMenu} />
          </View>`;
  dkd_content_value = dkd_replace_required_value(dkd_content_value, dkd_quick_old_value, dkd_quick_new_value, 'quick_tile_swap');

  dkd_content_value = dkd_replace_required_value(
    dkd_content_value,
    `          <View style={dkd_styles_value.dkd_privacy_strip}><View style={dkd_styles_value.dkd_privacy_icon}><MaterialCommunityIcons name="shield-check-outline" size={21} color="#78EDC0" /></View><View style={dkd_styles_value.dkd_privacy_copy}><Text style={dkd_styles_value.dkd_privacy_title}>Kontrollü erişim</Text><Text style={dkd_styles_value.dkd_privacy_sub}>Konum yalnız uygulama açıkken; kamera yalnız sen başlattığında kullanılır.</Text></View></View>\n`,
    '',
    'controlled_access_remove'
  );

  const dkd_style_marker_value = "  dkd_location_warning: { minHeight: 65, borderRadius: 19, marginTop: 12,";
  const dkd_style_injection_value = `  dkd_order_console: { minHeight: 126, borderRadius: 21, marginTop: 15, padding: 12, backgroundColor: 'rgba(2,9,20,0.27)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dkd_order_console_head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dkd_order_console_kicker: { color: '#C9F5FF', fontSize: 8, fontWeight: '900', letterSpacing: 1.05 },
  dkd_order_signal: { minHeight: 24, borderRadius: 999, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)' },
  dkd_order_signal_dot: { width: 6, height: 6, borderRadius: 99 },
  dkd_order_signal_text: { color: '#FFFFFF', fontSize: 7, fontWeight: '900' },
  dkd_order_track: { minHeight: 44, marginTop: 9, flexDirection: 'row', alignItems: 'center' },
  dkd_order_track_node: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  dkd_order_track_line: { flex: 1, height: 2, marginHorizontal: 5, backgroundColor: 'rgba(167,230,255,0.22)' },
  dkd_order_track_rider: { width: 39, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(112,225,255,0.13)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.16)' },
  dkd_order_steps_row: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dkd_order_step: { flex: 1, minHeight: 36, borderRadius: 12, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)' },
  dkd_order_step_label: { flex: 1, color: 'rgba(238,247,255,0.66)', fontSize: 7.5, fontWeight: '800' },
`;
  dkd_content_value = dkd_replace_required_value(dkd_content_value, dkd_style_marker_value, dkd_style_injection_value + dkd_style_marker_value, 'control_card_styles');
  dkd_write_value(dkd_path_value, dkd_content_value);
}

// 3) Gönderilerim: modern overview band + warning icon cleanup across source.
{
  const dkd_path_value = 'src/features/courier/dkd_cargo_sender_panel.js';
  let dkd_content_value = dkd_read_value(dkd_path_value);
  const dkd_filter_marker_value = "        <View style={dkd_styles.dkd_shipmentFilterRow}>";
  const dkd_overview_value = `        <LinearGradient colors={['rgba(16,100,121,0.46)', 'rgba(45,61,134,0.38)', 'rgba(100,49,112,0.31)']} style={dkd_styles.dkd_shipmentsOverview}>
          <View style={dkd_styles.dkd_shipmentsOverviewTop}><View style={dkd_styles.dkd_shipmentsOverviewIcon}><MaterialCommunityIcons name="package-variant-closed-check" size={22} color="#FFFFFF" /></View><View style={{ flex: 1 }}><Text style={dkd_styles.dkd_shipmentsOverviewKicker}>CANLI GÖNDERİ KONTROLÜ</Text><Text style={dkd_styles.dkd_shipmentsOverviewTitle}>Siparişlerinin tüm yolculuğu burada</Text></View><View style={dkd_styles.dkd_shipmentsOverviewLive}><View style={dkd_styles.dkd_shipmentsOverviewLiveDot} /><Text style={dkd_styles.dkd_shipmentsOverviewLiveText}>CANLI</Text></View></View>
          <View style={dkd_styles.dkd_shipmentsOverviewStats}>
            <View style={dkd_styles.dkd_shipmentsOverviewStat}><Text style={dkd_styles.dkd_shipmentsOverviewStatValue}>{dkd_shipment_count_map_value.waiting}</Text><Text style={dkd_styles.dkd_shipmentsOverviewStatLabel}>Bekleyen</Text></View>
            <View style={dkd_styles.dkd_shipmentsOverviewStat}><Text style={dkd_styles.dkd_shipmentsOverviewStatValue}>{dkd_shipment_count_map_value.active}</Text><Text style={dkd_styles.dkd_shipmentsOverviewStatLabel}>Yolda</Text></View>
            <View style={dkd_styles.dkd_shipmentsOverviewStat}><Text style={dkd_styles.dkd_shipmentsOverviewStatValue}>{dkd_shipment_count_map_value.completed}</Text><Text style={dkd_styles.dkd_shipmentsOverviewStatLabel}>Tamamlanan</Text></View>
            <View style={dkd_styles.dkd_shipmentsOverviewStat}><Text style={dkd_styles.dkd_shipmentsOverviewStatValue}>{dkd_shipment_count_map_value.all}</Text><Text style={dkd_styles.dkd_shipmentsOverviewStatLabel}>Toplam</Text></View>
          </View>
        </LinearGradient>\n\n`;
  if (!dkd_content_value.includes('dkd_shipmentsOverviewTop')) {
    dkd_content_value = dkd_replace_required_value(dkd_content_value, dkd_filter_marker_value, dkd_overview_value + dkd_filter_marker_value, 'shipment_overview');
  }
  const dkd_style_marker_value = "  dkd_shipmentFilterRow: {";
  const dkd_style_injection_value = `  dkd_shipmentsOverview: { minHeight: 132, borderRadius: 23, padding: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(126,235,255,0.17)' },
  dkd_shipmentsOverviewTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dkd_shipmentsOverviewIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  dkd_shipmentsOverviewKicker: { color: '#A9EEFF', fontSize: 7.5, fontWeight: '900', letterSpacing: .9 },
  dkd_shipmentsOverviewTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 2 },
  dkd_shipmentsOverviewLive: { minHeight: 25, borderRadius: 999, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(65,226,165,0.10)', borderWidth: 1, borderColor: 'rgba(65,226,165,0.17)' },
  dkd_shipmentsOverviewLiveDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#5BE6AD' },
  dkd_shipmentsOverviewLiveText: { color: '#A6F2D1', fontSize: 7, fontWeight: '900' },
  dkd_shipmentsOverviewStats: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dkd_shipmentsOverviewStat: { flex: 1, minHeight: 53, borderRadius: 15, backgroundColor: 'rgba(2,9,20,0.24)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  dkd_shipmentsOverviewStatValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  dkd_shipmentsOverviewStatLabel: { color: 'rgba(233,245,255,0.53)', fontSize: 7.2, fontWeight: '800', marginTop: 2, textAlign: 'center' },
`;
  if (!dkd_content_value.includes('dkd_shipmentsOverview: {')) {
    dkd_content_value = dkd_replace_required_value(dkd_content_value, dkd_style_marker_value, dkd_style_injection_value + dkd_style_marker_value, 'shipment_overview_styles');
  }
  dkd_write_value(dkd_path_value, dkd_content_value);
}

function dkd_walk_replace_invalid_icon_value(dkd_directory_value) {
  for (const dkd_entry_value of fs.readdirSync(dkd_directory_value, { withFileTypes: true })) {
    const dkd_full_path_value = path.join(dkd_directory_value, dkd_entry_value.name);
    if (dkd_entry_value.isDirectory()) {
      dkd_walk_replace_invalid_icon_value(dkd_full_path_value);
      continue;
    }
    if (!/\.(js|jsx|ts|tsx)$/.test(dkd_entry_value.name)) continue;
    const dkd_before_value = dkd_read_value(dkd_full_path_value);
    const dkd_after_value = dkd_before_value.replaceAll('shield-car-outline', 'car');
    if (dkd_after_value !== dkd_before_value) dkd_write_value(dkd_full_path_value, dkd_after_value);
  }
}
dkd_walk_replace_invalid_icon_value('src');

console.log('DraBornGo v0.0.12 UI/support/courier hotfix patch applied.');
