import fs from 'node:fs';

function dkd_read_value(dkd_path_value) {
  return fs.readFileSync(dkd_path_value, 'utf8');
}
function dkd_write_value(dkd_path_value, dkd_content_value) {
  fs.writeFileSync(dkd_path_value, dkd_content_value, 'utf8');
}
function dkd_replace_once_value(dkd_content_value, dkd_search_value, dkd_replace_value, dkd_label_value) {
  if (!dkd_content_value.includes(dkd_search_value)) {
    if (dkd_content_value.includes(dkd_replace_value)) return dkd_content_value;
    throw new Error(`dkd_patch_missing:${dkd_label_value}`);
  }
  return dkd_content_value.replace(dkd_search_value, dkd_replace_value);
}

// 1) Android bottom safe area + navigation bar style.
{
  const dkd_path_value = 'src/components/layout/SafeScreen.js';
  let dkd_content_value = dkd_read_value(dkd_path_value);
  dkd_content_value = dkd_replace_once_value(
    dkd_content_value,
    "import { StatusBar } from 'react-native';",
    "import { Platform, StatusBar } from 'react-native';\nimport { NavigationBar } from 'expo-navigation-bar';",
    'safe_screen_import'
  );
  dkd_content_value = dkd_replace_once_value(
    dkd_content_value,
    "<DkdSafeAreaView edges={['top']} style={[{ flex: 1, backgroundColor: dkd_safe_background }, style]}>",
    "<DkdSafeAreaView edges={['top', 'bottom']} style={[{ flex: 1, backgroundColor: dkd_safe_background }, style]}>",
    'safe_screen_bottom_edge'
  );
  dkd_content_value = dkd_replace_once_value(
    dkd_content_value,
    "      <StatusBar barStyle=\"light-content\" backgroundColor={dkd_safe_background} translucent={false} />",
    "      <StatusBar barStyle=\"light-content\" backgroundColor={dkd_safe_background} translucent={false} />\n      {Platform.OS === 'android' ? <NavigationBar style=\"dark\" /> : null}",
    'navigation_bar_component'
  );
  dkd_write_value(dkd_path_value, dkd_content_value);
}

// 2) Native config: disable 3-button contrast scrim so edge-to-edge nav bar can remain transparent in standalone builds.
{
  const dkd_path_value = 'app.json';
  const dkd_config_value = JSON.parse(dkd_read_value(dkd_path_value));
  const dkd_plugins_value = Array.isArray(dkd_config_value?.expo?.plugins) ? dkd_config_value.expo.plugins : [];
  const dkd_has_nav_plugin_value = dkd_plugins_value.some((dkd_plugin_value) => {
    if (typeof dkd_plugin_value === 'string') return dkd_plugin_value === 'expo-navigation-bar';
    return Array.isArray(dkd_plugin_value) && dkd_plugin_value[0] === 'expo-navigation-bar';
  });
  if (!dkd_has_nav_plugin_value) {
    dkd_plugins_value.push(['expo-navigation-bar', { enforceContrast: false, hidden: false, style: 'dark' }]);
  }
  dkd_config_value.expo.plugins = dkd_plugins_value;
  dkd_write_value(dkd_path_value, `${JSON.stringify(dkd_config_value, null, 2)}\n`);
}

// 3) Admin command deck must use the same fixed support inbox as the main support route.
{
  const dkd_path_value = 'src/features/admin/AdminMenuModal.js';
  let dkd_content_value = dkd_read_value(dkd_path_value);
  dkd_content_value = dkd_replace_once_value(
    dkd_content_value,
    "import DkdLiveSupportModal from '../support/dkd_live_support_modal';",
    "import DkdLiveSupportModal from '../support/dkd_live_support_modal_v2';",
    'admin_support_v2_import'
  );
  dkd_write_value(dkd_path_value, dkd_content_value);
}

// 4) Remove invalid MaterialCommunityIcons route name in active service hub.
{
  const dkd_path_value = 'src/features/serviceNetwork/dkd_service_network_modal_v2.js';
  let dkd_content_value = dkd_read_value(dkd_path_value);
  dkd_content_value = dkd_content_value.replaceAll('name="route"', 'name="map-marker-path"');
  dkd_write_value(dkd_path_value, dkd_content_value);
}

// 5) Emphasized live order scanning animation after Sipariş BUL is active.
{
  const dkd_path_value = 'src/features/map/MapHomeScreen.js';
  let dkd_content_value = dkd_read_value(dkd_path_value);
  if (!dkd_content_value.includes('dkd_search_scan_panel')) {
    const dkd_button_marker_value = `            <DkdAnimatedPressable\n              dkd_disabled_value={dkd_courier_busy_value}`;
    const dkd_scan_panel_value = `            {dkd_courier_online_value && !dkd_courier_busy_value ? (\n              <View style={dkd_styles_value.dkd_search_scan_panel}>\n                <Animated.View pointerEvents=\"none\" style={[dkd_styles_value.dkd_search_scan_light, { transform: [{ translateX: dkd_scan_translate_value }, { rotate: '15deg' }] }]} />\n                <View style={dkd_styles_value.dkd_search_scan_icon_stage}>\n                  <Animated.View style={[dkd_styles_value.dkd_search_scan_halo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }] }]} />\n                  <View style={dkd_styles_value.dkd_search_scan_icon}><MaterialCommunityIcons name=\"radar\" size={21} color=\"#06111B\" /></View>\n                </View>\n                <View style={dkd_styles_value.dkd_search_scan_copy}><Text style={dkd_styles_value.dkd_search_scan_kicker}>CANLI SİPARİŞ TARAMASI</Text><Text style={dkd_styles_value.dkd_search_scan_title}>Yakındaki siparişler taranıyor</Text><Text style={dkd_styles_value.dkd_search_scan_sub}>Uygun görev bulunduğunda kurye ekranına anında düşer.</Text></View>\n                <Animated.View style={[dkd_styles_value.dkd_search_scan_live, { opacity: dkd_pulse_value }]}><View style={dkd_styles_value.dkd_search_scan_dot} /><Text style={dkd_styles_value.dkd_search_scan_live_text}>TARANIYOR</Text></Animated.View>\n              </View>\n            ) : null}\n\n`;
    if (!dkd_content_value.includes(dkd_button_marker_value)) throw new Error('dkd_patch_missing:map_search_button');
    dkd_content_value = dkd_content_value.replace(dkd_button_marker_value, dkd_scan_panel_value + dkd_button_marker_value);

    const dkd_style_marker_value = '  dkd_control_button_pressable:';
    const dkd_style_block_value = `  dkd_search_scan_panel: { minHeight: 88, borderRadius: 22, marginTop: 14, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden', backgroundColor: 'rgba(10,56,67,0.55)', borderWidth: 1, borderColor: 'rgba(100,239,208,0.25)' },\n  dkd_search_scan_light: { position: 'absolute', top: -45, bottom: -45, width: 62, backgroundColor: 'rgba(129,255,226,0.085)' },\n  dkd_search_scan_icon_stage: { width: 49, height: 49, alignItems: 'center', justifyContent: 'center' },\n  dkd_search_scan_halo: { position: 'absolute', width: 46, height: 46, borderRadius: 999, borderWidth: 2, borderColor: '#62F0C2' },\n  dkd_search_scan_icon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#78EDC0' },\n  dkd_search_scan_copy: { flex: 1, minWidth: 0 },\n  dkd_search_scan_kicker: { color: '#8FF4D1', fontSize: 7.5, fontWeight: '900', letterSpacing: 1.05 },\n  dkd_search_scan_title: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '900', marginTop: 2 },\n  dkd_search_scan_sub: { color: 'rgba(229,250,244,0.58)', fontSize: 9.5, lineHeight: 13.5, fontWeight: '700', marginTop: 2 },\n  dkd_search_scan_live: { minHeight: 28, borderRadius: 999, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(4,20,26,0.46)', borderWidth: 1, borderColor: 'rgba(126,244,211,0.20)' },\n  dkd_search_scan_dot: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#65F0B9' },\n  dkd_search_scan_live_text: { color: '#BDF7E5', fontSize: 7, fontWeight: '900' },\n`;
    if (!dkd_content_value.includes(dkd_style_marker_value)) throw new Error('dkd_patch_missing:map_button_style_marker');
    dkd_content_value = dkd_content_value.replace(dkd_style_marker_value, dkd_style_block_value + dkd_style_marker_value);
  }
  dkd_write_value(dkd_path_value, dkd_content_value);
}

console.log('DraBornGo v0.0.12 nav/support/route hotfix applied.');
