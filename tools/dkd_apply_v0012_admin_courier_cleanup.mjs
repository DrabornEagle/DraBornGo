import fs from 'node:fs';

function dkd_read(dkd_path) { return fs.readFileSync(dkd_path, 'utf8'); }
function dkd_write(dkd_path, dkd_text) { fs.writeFileSync(dkd_path, dkd_text, 'utf8'); }
function dkd_replace(dkd_text, dkd_before, dkd_after, dkd_label) {
  if (!dkd_text.includes(dkd_before)) {
    if (dkd_text.includes(dkd_after)) return dkd_text;
    throw new Error(`dkd_patch_missing:${dkd_label}`);
  }
  return dkd_text.replace(dkd_before, dkd_after);
}

// Admin user management: 5-at-a-time list, remove hourly metric and retired score/rating controls.
{
  const dkd_path = 'src/features/admin/dkd_admin_user_manager_modal.js';
  let dkd_text = dkd_read(dkd_path);

  dkd_text = dkd_replace(
    dkd_text,
    "  const [dkd_saving_value, dkd_set_saving_value] = useState(false);",
    "  const [dkd_saving_value, dkd_set_saving_value] = useState(false);\n  const [dkd_visible_user_count_value, dkd_set_visible_user_count_value] = useState(5);",
    'admin_pagination_state'
  );

  dkd_text = dkd_replace(
    dkd_text,
    "      dkd_set_rows_value(dkd_result_value.data || []);",
    "      dkd_set_rows_value(dkd_result_value.data || []);\n      dkd_set_visible_user_count_value(5);",
    'admin_pagination_reset'
  );

  dkd_text = dkd_text.replace("        courier_score: String(dkd_profile_value.courier_score ?? 0),\n", '');
  dkd_text = dkd_text.replace("        courier_rating_avg: String(dkd_profile_value.courier_rating_avg ?? 0),\n", '');
  dkd_text = dkd_text.replace("        courier_rating_count: String(dkd_profile_value.courier_rating_count ?? 0),\n", '');

  const dkd_old_list = `{dkd_loading_value ? <ActivityIndicator color=\"#7EEBFF\" style={{ marginTop: 28 }} /> : <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>{dkd_rows_value.map((dkd_item_value) => <DkdUserRow key={String(dkd_item_value.dkd_user_id)} dkd_item_value={dkd_item_value} dkd_on_press_value={() => { dkd_set_selected_user_id_value(dkd_item_value.dkd_user_id); dkd_load_detail_value(dkd_item_value.dkd_user_id); }} />)}</ScrollView>}`;
  const dkd_new_list = `{dkd_loading_value ? <ActivityIndicator color=\"#7EEBFF\" style={{ marginTop: 28 }} /> : <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>\n                {dkd_rows_value.slice(0, dkd_visible_user_count_value).map((dkd_item_value) => <DkdUserRow key={String(dkd_item_value.dkd_user_id)} dkd_item_value={dkd_item_value} dkd_on_press_value={() => { dkd_set_selected_user_id_value(dkd_item_value.dkd_user_id); dkd_load_detail_value(dkd_item_value.dkd_user_id); }} />)}\n                {dkd_visible_user_count_value < dkd_rows_value.length ? <Pressable onPress={() => dkd_set_visible_user_count_value((dkd_previous_value) => dkd_previous_value + 5)} style={styles.moreButton}><MaterialCommunityIcons name=\"chevron-down\" size={19} color=\"#06111B\" /><Text style={styles.moreButtonText}>Daha Fazla • {Math.min(5, dkd_rows_value.length - dkd_visible_user_count_value)} kullanıcı daha</Text></Pressable> : null}\n              </ScrollView>}`;
  dkd_text = dkd_replace(dkd_text, dkd_old_list, dkd_new_list, 'admin_user_list_pagination');

  dkd_text = dkd_text.replace("                  <DkdMetric dkd_label_value=\"Saatlik\" dkd_value={dkd_format_earnings_money_value(dkd_earnings_value?.daily?.dkd_hourly_tl)} dkd_icon_value=\"speedometer\" dkd_tone_value={['#5B3B87', '#3C356E']} />\n", '');

  const dkd_old_profile_rows = `                  <View style={styles.fieldRow}><DkdField dkd_label_value=\"İptal\" dkd_value={dkd_form_value.courier_cancelled_jobs} dkd_on_change_value={(dkd_value) => dkd_set_field_value('courier_cancelled_jobs', dkd_value)} dkd_keyboard_type_value=\"number-pad\" /><DkdField dkd_label_value=\"Skor\" dkd_value={dkd_form_value.courier_score} dkd_on_change_value={(dkd_value) => dkd_set_field_value('courier_score', dkd_value)} dkd_keyboard_type_value=\"number-pad\" /></View>\n                  <View style={styles.fieldRow}><DkdField dkd_label_value=\"Puan Ort.\" dkd_value={dkd_form_value.courier_rating_avg} dkd_on_change_value={(dkd_value) => dkd_set_field_value('courier_rating_avg', dkd_value)} dkd_keyboard_type_value=\"decimal-pad\" /><DkdField dkd_label_value=\"Puan Sayısı\" dkd_value={dkd_form_value.courier_rating_count} dkd_on_change_value={(dkd_value) => dkd_set_field_value('courier_rating_count', dkd_value)} dkd_keyboard_type_value=\"number-pad\" /></View>`;
  const dkd_new_profile_rows = `                  <DkdField dkd_label_value=\"İptal\" dkd_value={dkd_form_value.courier_cancelled_jobs} dkd_on_change_value={(dkd_value) => dkd_set_field_value('courier_cancelled_jobs', dkd_value)} dkd_keyboard_type_value=\"number-pad\" />`;
  dkd_text = dkd_replace(dkd_text, dkd_old_profile_rows, dkd_new_profile_rows, 'admin_remove_score_rating');

  dkd_text = dkd_replace(
    dkd_text,
    "  listContent: { paddingHorizontal: 16, paddingBottom: 50 },",
    "  listContent: { paddingHorizontal: 16, paddingBottom: 50 },\n  moreButton: { minHeight: 52, borderRadius: 18, marginTop: 3, backgroundColor: '#86E9FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },\n  moreButtonText: { color: '#06111B', fontSize: 11, fontWeight: '900' },",
    'admin_more_button_styles'
  );

  dkd_write(dkd_path, dkd_text);
}

// Home courier radar: DBG branding and route animation only while an approved courier is actively scanning.
{
  const dkd_path = 'src/features/map/MapHomeScreen.js';
  let dkd_text = dkd_read(dkd_path);
  dkd_text = dkd_text.replaceAll('DKD RIDER', 'DBG RIDER');
  dkd_text = dkd_replace(
    dkd_text,
    `<Animated.View style={[dkd_styles_value.dkd_order_track_rider, { transform: [{ translateX: dkd_scan_value.interpolate({ inputRange: [0, 1], outputRange: [-28, 28] }) }] }]}><MaterialCommunityIcons name=\"motorbike\" size={19} color=\"#FFFFFF\" /></Animated.View>`,
    `<Animated.View style={[dkd_styles_value.dkd_order_track_rider, dkd_courier_approved_value && dkd_courier_online_value ? { transform: [{ translateX: dkd_scan_value.interpolate({ inputRange: [0, 1], outputRange: [-28, 28] }) }] } : null]}><MaterialCommunityIcons name=\"motorbike\" size={19} color=\"#FFFFFF\" /></Animated.View>`,
    'route_animation_condition'
  );
  dkd_write(dkd_path, dkd_text);
}

console.log('DraBornGo v0.0.12 admin/courier cleanup applied.');
