import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const dkd_patch_path_value = 'tools/dkd_apply_v0012_ui_support_courier_hotfix.mjs';
let dkd_patch_content_value = fs.readFileSync(dkd_patch_path_value, 'utf8');
const dkd_patch_lines_value = dkd_patch_content_value.split('\n').map((dkd_line_value) => {
  if (dkd_line_value.includes('dkd_network_pill') && dkd_line_value.includes('borderColor:') && dkd_line_value.includes('dkd_status_value.dkd_accent_value')) {
    return '              <View style={[dkd_styles_value.dkd_network_pill, { borderColor: dkd_status_value.dkd_accent_value + \'66\' }]}><View style={[dkd_styles_value.dkd_network_dot, { backgroundColor: dkd_status_value.dkd_accent_value }]} /><Text style={dkd_styles_value.dkd_network_pill_text}>{dkd_status_value.dkd_short_value}</Text></View>';
  }
  return dkd_line_value;
});
dkd_patch_content_value = dkd_patch_lines_value.join('\n');
fs.writeFileSync(dkd_patch_path_value, dkd_patch_content_value, 'utf8');

await import(`${pathToFileURL(dkd_patch_path_value).href}?dkd=${Date.now()}`);

const dkd_support_path_value = 'src/features/support/dkd_live_support_modal_v2.js';
if (fs.existsSync(dkd_support_path_value)) {
  const dkd_support_content_value = fs.readFileSync(dkd_support_path_value, 'utf8').replaceAll("fontWeight: '650'", "fontWeight: '700'");
  fs.writeFileSync(dkd_support_path_value, dkd_support_content_value, 'utf8');
}

console.log('DraBornGo v0.0.12 safe UI hotfix runner completed.');
