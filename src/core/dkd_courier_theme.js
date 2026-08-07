export const dkd_privacy_url_value = 'https://www.draborneagle.com/draborngo/privacy/';
export const dkd_delete_url_value = 'https://www.draborneagle.com/draborngo/account-deletion/';
export const dkd_local_avatar_key_prefix_value = 'dkd:profile-avatar-uri:v1:';

export const dkd_palette_value = {
  dkd_bg_value: '#02060D',
  dkd_surface_value: '#081421',
  dkd_surface_two_value: '#0B1928',
  dkd_text_value: '#F7FBFF',
  dkd_soft_text_value: '#94A9BE',
  dkd_cyan_value: '#37D8FF',
  dkd_blue_value: '#4E7DFF',
  dkd_green_value: '#43E7A2',
  dkd_lime_value: '#B8F15A',
  dkd_gold_value: '#FFD264',
  dkd_orange_value: '#FF9F5B',
  dkd_pink_value: '#FF5DAF',
  dkd_purple_value: '#916CFF',
  dkd_red_value: '#FF657D',
};

export function dkd_color_alpha_value(dkd_hex_value, dkd_alpha_value) {
  return String(dkd_hex_value || dkd_palette_value.dkd_cyan_value) + String(dkd_alpha_value || '22');
}
