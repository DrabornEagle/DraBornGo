import fs from 'node:fs';
import path from 'node:path';

const dkd_root_value = process.cwd();
const dkd_mode_value = String(process.argv[2] || 'apply');

function dkd_path_value(...dkd_parts_value) {
  return path.join(dkd_root_value, ...dkd_parts_value);
}

function dkd_remove_value(dkd_relative_path_value) {
  fs.rmSync(dkd_path_value(dkd_relative_path_value), { recursive: true, force: true });
}

function dkd_write_value(dkd_relative_path_value, dkd_content_value) {
  const dkd_absolute_path_value = dkd_path_value(dkd_relative_path_value);
  fs.mkdirSync(path.dirname(dkd_absolute_path_value), { recursive: true });
  fs.writeFileSync(dkd_absolute_path_value, dkd_content_value.trimStart(), 'utf8');
}

function dkd_walk_files_value(dkd_relative_root_value) {
  const dkd_absolute_root_value = dkd_path_value(dkd_relative_root_value);
  if (!fs.existsSync(dkd_absolute_root_value)) return [];
  const dkd_output_value = [];
  const dkd_stack_value = [dkd_absolute_root_value];
  while (dkd_stack_value.length) {
    const dkd_current_value = dkd_stack_value.pop();
    for (const dkd_entry_value of fs.readdirSync(dkd_current_value, { withFileTypes: true })) {
      const dkd_child_value = path.join(dkd_current_value, dkd_entry_value.name);
      if (dkd_entry_value.isDirectory()) dkd_stack_value.push(dkd_child_value);
      else if (dkd_entry_value.isFile()) dkd_output_value.push(dkd_child_value);
    }
  }
  return dkd_output_value;
}

function dkd_apply_value() {
  const dkd_legacy_feature_dirs_value = [
    'src/features/achievements',
    'src/features/admin',
    'src/features/boss',
    'src/features/business',
    'src/features/chest',
    'src/features/collection',
    'src/features/courier',
    'src/features/dailyReward',
    'src/features/history',
    'src/features/leaderboard',
    'src/features/map',
    'src/features/market',
    'src/features/navigation',
    'src/features/payment',
    'src/features/profile',
    'src/features/serviceNetwork',
    'src/features/tasks',
    'src/features/legal'
  ];
  dkd_legacy_feature_dirs_value.forEach(dkd_remove_value);

  dkd_remove_value('src/core');
  dkd_remove_value('src/core/gameflow');
  dkd_remove_value('node_modules');
  dkd_remove_value('android');
  dkd_remove_value('ios');
  dkd_remove_value('.expo');
  dkd_remove_value('dist');
  dkd_remove_value('web-build');
  dkd_remove_value('package-lock.json');

  const dkd_legacy_hook_name_regex_value = /(achievement|boss|chest|collection|dailyreward|drop|energy|leaderboard|market|task)/i;
  for (const dkd_file_value of dkd_walk_files_value('src/hooks')) {
    if (dkd_legacy_hook_name_regex_value.test(path.basename(dkd_file_value))) fs.rmSync(dkd_file_value, { force: true });
  }

  const dkd_service_forbidden_regex_value = /(wallet|daily[_-]?reward|chest|loot|dropservice|marketservice|achievement|boss|leaderboard|taskservice|app[_-]?update|point[_-]?redeem|billing|payment)/i;
  for (const dkd_file_value of dkd_walk_files_value('src/services')) {
    const dkd_relative_value = path.relative(dkd_root_value, dkd_file_value).replaceAll('\\', '/');
    if (dkd_relative_value.endsWith('src/services/dkd_account_deletion_service.js')) continue;
    const dkd_name_value = path.basename(dkd_file_value);
    let dkd_text_value = '';
    try { dkd_text_value = fs.readFileSync(dkd_file_value, 'utf8'); } catch { continue; }
    if (dkd_service_forbidden_regex_value.test(dkd_name_value) || /(dkd_wallet|wallet_tl|daily_reward_state|dkd_puan|dkd_user_cards|dkd_chest_|dkd_market_listings|dkd_task_claim|payment_method|payment_status)/i.test(dkd_text_value)) {
      fs.rmSync(dkd_file_value, { force: true });
    }
  }

  dkd_remove_value('src/constants/game.js');
  dkd_remove_value('src/services/dkd_mapbox_route_service.js');

  for (const dkd_sql_root_value of ['supabase/sql', 'supabase/migrations']) {
    for (const dkd_file_value of dkd_walk_files_value(dkd_sql_root_value)) {
      const dkd_file_name_value = path.basename(dkd_file_value).toLowerCase();
      if (/(wallet|chest|loot|drop|card|boss|task|daily[_-]?reward|leaderboard|point|puan|billing|rewarded[_-]?ad|payment|token[_-]?tl|market[_-]?(listing|shop)|weekly[_-]?reward)/i.test(dkd_file_name_value)) {
        fs.rmSync(dkd_file_value, { force: true });
      }
    }
  }

  dkd_remove_value('web/DraBornGo/App');

  const dkd_package_value = JSON.parse(fs.readFileSync(dkd_path_value('package.json'), 'utf8'));
  dkd_package_value.version = '0.0.6';
  dkd_package_value.scripts = {
    start: 'expo start',
    'dkd:start:go': 'expo start --go --tunnel --clear',
    android: 'expo start --android',
    lint: 'expo lint',
    'lint:src': 'eslint App.js src',
    'quality:local': 'npx expo-doctor',
    'dkd:verify-v0.0.6': 'node ./scripts/dkd_verify_release_identity.mjs'
  };
  delete dkd_package_value.dependencies['@rnmapbox/maps'];
  delete dkd_package_value.dependencies['expo-camera'];
  delete dkd_package_value.dependencies['expo-dev-client'];
  dkd_package_value.dependencies.expo = '^57.0.0';
  dkd_package_value.dependencies.react = '19.2.3';
  dkd_package_value.dependencies['react-native'] = '0.86.0';
  dkd_package_value.dependencies['@react-native-async-storage/async-storage'] = '2.2.0';
  dkd_package_value.dependencies['react-native-gesture-handler'] = '~2.32.0';
  dkd_package_value.dependencies['react-native-maps'] = '1.27.2';
  dkd_package_value.dependencies['react-native-reanimated'] = '4.5.1';
  dkd_package_value.dependencies['react-native-safe-area-context'] = '~5.7.0';
  dkd_package_value.dependencies['react-native-screens'] = '~4.26.0';
  dkd_package_value.devDependencies['@types/react'] = '~19.2.0';
  dkd_write_value('package.json', JSON.stringify(dkd_package_value, null, 2) + '\n');

  dkd_write_value('.npmrc', 'package-lock=false\nlegacy-peer-deps=true\n');
  dkd_write_value('.gitignore', `node_modules/\n.expo/\ndist/\nweb-build/\nandroid/\nios/\npackage-lock.json\n*.log\n.env\n.env.local\n`);

  dkd_write_value('app.json', `{
  "expo": {
    "name": "DraBornGo",
    "slug": "draborngo",
    "version": "0.0.6",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "draborngo",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": { "supportsTablet": true },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "package": "com.draborneagle.draborngo",
      "googleServicesFile": "./google-services.json",
      "versionCode": 3,
      "permissions": [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
    },
    "plugins": [
      ["expo-splash-screen", {
        "image": "./assets/images/splash-icon.png",
        "imageWidth": 260,
        "resizeMode": "contain",
        "backgroundColor": "#000000",
        "dark": { "backgroundColor": "#000000" }
      }],
      ["expo-notifications", {
        "defaultChannel": "draborngo-core",
        "color": "#0EA5E9"
      }],
      ["expo-location", {
        "locationWhenInUsePermission": "DraBornGo, yalnızca konum gerektiren kurye ve rota işlemini sen başlattığında uygulama açıkken konumunu kullanır.",
        "isAndroidBackgroundLocationEnabled": false,
        "isAndroidForegroundServiceEnabled": false,
        "isIosBackgroundLocationEnabled": false
      }],
      ["expo-image-picker", {
        "photosPermission": "DraBornGo, yalnızca senin seçtiğin profil veya başvuru görselini eklemek için fotoğraf seçiciyi kullanır."
      }]
    ],
    "experiments": { "reactCompiler": true },
    "extra": { "eas": { "projectId": "a597c3fc-0708-4e3f-a1fc-faa0b86d30ee" } },
    "owner": "draborneagle",
    "androidNavigationBar": { "backgroundColor": "#00000000", "barStyle": "light-content" },
    "androidStatusBar": { "backgroundColor": "#000000", "barStyle": "light-content", "translucent": false }
  }
}
`);

  dkd_write_value('app.config.js', `const dkd_base_config_value = require('./app.json');

const dkd_blocked_android_permissions_value = [
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_LOCATION',
  'android.permission.RECORD_AUDIO',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.QUERY_ALL_PACKAGES',
  'android.permission.REQUEST_INSTALL_PACKAGES',
  'android.permission.USE_FULL_SCREEN_INTENT'
];

module.exports = () => {
  const dkd_expo_value = { ...dkd_base_config_value.expo };
  const dkd_android_value = { ...(dkd_expo_value.android || {}) };
  const dkd_google_maps_key_value = String(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();

  dkd_android_value.versionCode = 3;
  dkd_android_value.permissions = [
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_FINE_LOCATION'
  ];
  dkd_android_value.blockedPermissions = dkd_blocked_android_permissions_value;
  if (dkd_google_maps_key_value) {
    dkd_android_value.config = { googleMaps: { apiKey: dkd_google_maps_key_value } };
  } else {
    delete dkd_android_value.config;
  }

  return {
    ...dkd_expo_value,
    version: '0.0.6',
    android: dkd_android_value
  };
};
`);

  dkd_write_value('src/core/GameFlow.js', `import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { signOutSession } from '../services/authService';
import dkd_home_hub_screen_value from '../features/coreV006/dkd_home_hub_screen';
import dkd_profile_modal_value from '../features/coreV006/dkd_profile_modal';
import dkd_courier_operations_modal_value from '../features/coreV006/dkd_courier_operations_modal';
import dkd_service_network_modal_value from '../features/coreV006/dkd_service_network_modal';
import dkd_applications_modal_value from '../features/coreV006/dkd_applications_modal';
import dkd_admin_operations_modal_value from '../features/coreV006/dkd_admin_operations_modal';
import dkd_policy_center_modal_value from '../features/coreV006/dkd_policy_center_modal';
import DBGHubModal from '../features/social/DBGHubModal';

export default function dkd_game_flow_component_value({ session: dkd_session_value, onSignedOut: dkd_on_signed_out_value, dkd_on_home_ready_value }) {
  const dkd_user_id_value = String(dkd_session_value?.user?.id || '');
  const [dkd_profile_value, dkd_set_profile_value] = useState(null);
  const [dkd_loading_value, dkd_set_loading_value] = useState(true);
  const [dkd_is_admin_value, dkd_set_is_admin_value] = useState(false);
  const [dkd_active_modal_value, dkd_set_active_modal_value] = useState('');

  const dkd_load_core_value = useCallback(async () => {
    if (!dkd_user_id_value) return;
    dkd_set_loading_value(true);
    try {
      const [dkd_profile_response_value, dkd_admin_response_value] = await Promise.all([
        supabase.from('dkd_profiles').select('*').eq('user_id', dkd_user_id_value).maybeSingle(),
        supabase.from('dkd_admin_users').select('user_id,role_key').eq('user_id', dkd_user_id_value).maybeSingle()
      ]);
      if (dkd_profile_response_value?.error) throw dkd_profile_response_value.error;
      let dkd_next_profile_value = dkd_profile_response_value?.data || null;
      if (!dkd_next_profile_value) {
        const dkd_insert_response_value = await supabase.from('dkd_profiles').insert({
          user_id: dkd_user_id_value,
          nickname: 'DraBornGo',
          avatar_emoji: '🦅'
        }).select('*').single();
        if (dkd_insert_response_value?.error) throw dkd_insert_response_value.error;
        dkd_next_profile_value = dkd_insert_response_value?.data || null;
      }
      dkd_set_profile_value(dkd_next_profile_value);
      dkd_set_is_admin_value(Boolean(dkd_admin_response_value?.data?.user_id));
    } catch (dkd_error_value) {
      Alert.alert('DraBornGo', String(dkd_error_value?.message || 'Profil yüklenemedi.'));
    } finally {
      dkd_set_loading_value(false);
      dkd_on_home_ready_value?.();
    }
  }, [dkd_on_home_ready_value, dkd_user_id_value]);

  useEffect(() => { dkd_load_core_value(); }, [dkd_load_core_value]);

  const dkd_patch_profile_value = useCallback((dkd_patch_value) => {
    dkd_set_profile_value((dkd_previous_value) => ({ ...(dkd_previous_value || {}), ...(dkd_patch_value || {}) }));
  }, []);

  const dkd_logout_value = useCallback(async () => {
    const dkd_response_value = await signOutSession();
    if (dkd_response_value?.error) {
      Alert.alert('Çıkış yapılamadı', String(dkd_response_value.error.message || dkd_response_value.error));
      return;
    }
    dkd_on_signed_out_value?.();
  }, [dkd_on_signed_out_value]);

  return React.createElement(React.Fragment, null,
    React.createElement(dkd_home_hub_screen_value, {
      dkd_profile_value,
      dkd_loading_value,
      dkd_is_admin_value,
      dkd_on_open_profile_value: () => dkd_set_active_modal_value('profile'),
      dkd_on_open_courier_value: () => dkd_set_active_modal_value('courier'),
      dkd_on_open_service_value: () => dkd_set_active_modal_value('service'),
      dkd_on_open_applications_value: () => dkd_set_active_modal_value('applications'),
      dkd_on_open_chat_value: () => dkd_set_active_modal_value('chat'),
      dkd_on_open_policy_value: () => dkd_set_active_modal_value('policy'),
      dkd_on_open_admin_value: () => dkd_set_active_modal_value('admin'),
      dkd_on_logout_value: dkd_logout_value
    }),
    React.createElement(dkd_profile_modal_value, {
      dkd_visible_value: dkd_active_modal_value === 'profile',
      dkd_profile_value,
      dkd_session_value,
      dkd_on_close_value: () => dkd_set_active_modal_value(''),
      dkd_on_profile_changed_value: dkd_patch_profile_value
    }),
    React.createElement(dkd_courier_operations_modal_value, {
      dkd_visible_value: dkd_active_modal_value === 'courier',
      dkd_profile_value,
      dkd_session_value,
      dkd_on_close_value: () => dkd_set_active_modal_value(''),
      dkd_on_profile_changed_value: dkd_patch_profile_value
    }),
    React.createElement(dkd_service_network_modal_value, {
      dkd_visible_value: dkd_active_modal_value === 'service',
      dkd_on_close_value: () => dkd_set_active_modal_value('')
    }),
    React.createElement(dkd_applications_modal_value, {
      dkd_visible_value: dkd_active_modal_value === 'applications',
      dkd_profile_value,
      dkd_session_value,
      dkd_on_close_value: () => dkd_set_active_modal_value('')
    }),
    React.createElement(dkd_policy_center_modal_value, {
      dkd_visible_value: dkd_active_modal_value === 'policy',
      dkd_session_value,
      dkd_profile_value,
      dkd_on_close_value: () => dkd_set_active_modal_value('')
    }),
    React.createElement(dkd_admin_operations_modal_value, {
      dkd_visible_value: dkd_active_modal_value === 'admin' && dkd_is_admin_value,
      dkd_on_close_value: () => dkd_set_active_modal_value('')
    }),
    React.createElement(DBGHubModal, {
      visible: dkd_active_modal_value === 'chat',
      onClose: () => dkd_set_active_modal_value(''),
      profile: dkd_profile_value,
      sessionUserId: dkd_user_id_value
    })
  );
}
`);

  dkd_write_value('src/features/coreV006/dkd_home_hub_screen.js', `import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';

function dkd_action_card_value({ dkd_icon_value, dkd_title_value, dkd_body_value, dkd_on_press_value, dkd_tag_value }) {
  return React.createElement(Pressable, { onPress: dkd_on_press_value, style: dkd_styles_value.dkd_card_value },
    React.createElement(View, { style: dkd_styles_value.dkd_card_icon_value }, React.createElement(MaterialCommunityIcons, { name: dkd_icon_value, size: 24, color: '#7BE6FF' })),
    React.createElement(View, { style: dkd_styles_value.dkd_card_copy_value },
      React.createElement(Text, { style: dkd_styles_value.dkd_card_title_value }, dkd_title_value),
      React.createElement(Text, { style: dkd_styles_value.dkd_card_body_value }, dkd_body_value)
    ),
    dkd_tag_value ? React.createElement(Text, { style: dkd_styles_value.dkd_tag_value }, dkd_tag_value) : null,
    React.createElement(MaterialCommunityIcons, { name: 'chevron-right', size: 24, color: 'rgba(255,255,255,0.55)' })
  );
}

export default function dkd_home_hub_screen_value(dkd_props_value) {
  const dkd_profile_value = dkd_props_value.dkd_profile_value || {};
  const dkd_nickname_value = String(dkd_profile_value.nickname || 'DraBornGo');
  const dkd_level_value = Number(dkd_profile_value.level || 1);
  const dkd_xp_value = Number(dkd_profile_value.xp || 0);
  const dkd_courier_online_value = Boolean(dkd_profile_value.dkd_courier_online);

  return React.createElement(SafeScreen, null,
    React.createElement(ScrollView, { style: dkd_styles_value.dkd_screen_value, contentContainerStyle: dkd_styles_value.dkd_content_value },
      React.createElement(View, { style: dkd_styles_value.dkd_header_value },
        React.createElement(View, { style: dkd_styles_value.dkd_avatar_value }, React.createElement(Text, { style: dkd_styles_value.dkd_avatar_text_value }, String(dkd_profile_value.avatar_emoji || '🦅'))),
        React.createElement(View, { style: dkd_styles_value.dkd_header_copy_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_brand_value }, 'DraBornGo  •  v0.0.6'),
          React.createElement(Text, { style: dkd_styles_value.dkd_name_value }, dkd_nickname_value),
          React.createElement(Text, { style: dkd_styles_value.dkd_meta_value }, 'LVL ' + dkd_level_value + '  •  ' + dkd_xp_value + ' XP')
        ),
        React.createElement(Pressable, { onPress: dkd_props_value.dkd_on_open_profile_value, style: dkd_styles_value.dkd_round_button_value }, React.createElement(MaterialCommunityIcons, { name: 'account-cog-outline', size: 25, color: '#FFFFFF' }))
      ),
      React.createElement(View, { style: dkd_styles_value.dkd_status_value },
        React.createElement(View, { style: [dkd_styles_value.dkd_status_dot_value, dkd_courier_online_value ? dkd_styles_value.dkd_online_dot_value : null] }),
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: dkd_styles_value.dkd_status_title_value }, dkd_courier_online_value ? 'Kurye çevrimiçi' : 'Kurye modu kapalı'),
          React.createElement(Text, { style: dkd_styles_value.dkd_status_body_value }, dkd_courier_online_value ? 'Kayıtlı bölgede operasyon akışı açık.' : 'Kurye Operasyon Merkezi üzerinden çevrimiçi olabilirsin.')
        )
      ),
      dkd_props_value.dkd_loading_value ? React.createElement(ActivityIndicator, { color: '#7BE6FF', style: { marginVertical: 18 } }) : null,
      React.createElement(Text, { style: dkd_styles_value.dkd_section_title_value }, 'Operasyon Merkezleri'),
      React.createElement(dkd_action_card_value, { dkd_icon_value: 'motorbike', dkd_title_value: 'Kurye Operasyon Merkezi', dkd_body_value: 'Kurye durumunu ve sana atanan teslimatları tek merkezden yönet.', dkd_tag_value: 'KURYE', dkd_on_press_value: dkd_props_value.dkd_on_open_courier_value }),
      React.createElement(dkd_action_card_value, { dkd_icon_value: 'storefront-outline', dkd_title_value: 'Hizmet Ağı Merkezi', dkd_body_value: 'Aktif işletmeleri ve hizmet kataloglarını görüntüle.', dkd_tag_value: 'HİZMET', dkd_on_press_value: dkd_props_value.dkd_on_open_service_value }),
      React.createElement(dkd_action_card_value, { dkd_icon_value: 'file-document-edit-outline', dkd_title_value: 'Başvurular', dkd_body_value: 'Kurye ve operasyon başvurularının durumunu takip et.', dkd_tag_value: 'BAŞVURU', dkd_on_press_value: dkd_props_value.dkd_on_open_applications_value }),
      React.createElement(dkd_action_card_value, { dkd_icon_value: 'message-text-outline', dkd_title_value: 'Sohbet', dkd_body_value: 'DBG arkadaşların ve ekip üyelerinle mesajlaş.', dkd_tag_value: 'SOSYAL', dkd_on_press_value: dkd_props_value.dkd_on_open_chat_value }),
      React.createElement(Text, { style: dkd_styles_value.dkd_section_title_value }, 'Hesap ve Güvenlik'),
      React.createElement(dkd_action_card_value, { dkd_icon_value: 'shield-account-outline', dkd_title_value: 'Gizlilik ve Veri Kontrolü', dkd_body_value: 'Gizlilik metnine, veri kullanım açıklamalarına ve hesap silme yoluna eriş.', dkd_on_press_value: dkd_props_value.dkd_on_open_policy_value }),
      dkd_props_value.dkd_is_admin_value ? React.createElement(dkd_action_card_value, { dkd_icon_value: 'shield-crown-outline', dkd_title_value: 'Yönetim Operasyonları', dkd_body_value: 'Başvuru, kullanıcı ve sistem durumlarını görüntüle.', dkd_tag_value: 'ADMIN', dkd_on_press_value: dkd_props_value.dkd_on_open_admin_value }) : null,
      React.createElement(Pressable, { onPress: dkd_props_value.dkd_on_logout_value, style: dkd_styles_value.dkd_logout_value }, React.createElement(MaterialCommunityIcons, { name: 'logout', size: 20, color: '#FF9AAF' }), React.createElement(Text, { style: dkd_styles_value.dkd_logout_text_value }, 'Çıkış Yap')),
      React.createElement(Text, { style: dkd_styles_value.dkd_footer_value }, 'Expo Go test kanalı • SDK 57 • Android test yapılandırması')
    )
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_screen_value: { flex: 1, backgroundColor: '#050B15' },
  dkd_content_value: { padding: 18, paddingBottom: 42 },
  dkd_header_value: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1, borderColor: '#1E3249', borderRadius: 24, backgroundColor: '#0A1422' },
  dkd_avatar_value: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#11243A', borderWidth: 1, borderColor: '#294A66' },
  dkd_avatar_text_value: { fontSize: 33 },
  dkd_header_copy_value: { flex: 1 },
  dkd_brand_value: { color: '#7BE6FF', fontWeight: '900', fontSize: 12, letterSpacing: 0.7 },
  dkd_name_value: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 2 },
  dkd_meta_value: { color: '#9FB0C5', fontSize: 12, fontWeight: '800', marginTop: 4 },
  dkd_round_button_value: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111D2D', borderWidth: 1, borderColor: '#27384E' },
  dkd_status_value: { marginTop: 14, flexDirection: 'row', gap: 12, padding: 15, borderRadius: 20, backgroundColor: '#0C1828', borderWidth: 1, borderColor: '#1D334C' },
  dkd_status_dot_value: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#677589', marginTop: 4 },
  dkd_online_dot_value: { backgroundColor: '#58E2AB' },
  dkd_status_title_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  dkd_status_body_value: { color: '#96A7BB', fontWeight: '700', fontSize: 12, marginTop: 4, lineHeight: 18 },
  dkd_section_title_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 19, marginTop: 24, marginBottom: 10 },
  dkd_card_value: { minHeight: 108, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, marginBottom: 11, borderRadius: 22, backgroundColor: '#0D1A2B', borderWidth: 1, borderColor: '#203A54' },
  dkd_card_icon_value: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#11283C' },
  dkd_card_copy_value: { flex: 1, minWidth: 0 },
  dkd_card_title_value: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  dkd_card_body_value: { color: '#AAB7C8', fontSize: 12, fontWeight: '650', lineHeight: 18, marginTop: 5 },
  dkd_tag_value: { color: '#7BE6FF', fontWeight: '900', fontSize: 9, borderWidth: 1, borderColor: '#2B6078', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  dkd_logout_value: { marginTop: 22, minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: '#24111A', borderWidth: 1, borderColor: '#5B283A' },
  dkd_logout_text_value: { color: '#FFB5C3', fontWeight: '900' },
  dkd_footer_value: { color: '#65758A', textAlign: 'center', fontSize: 11, fontWeight: '700', marginTop: 18 }
});
`);

  dkd_write_value('src/features/coreV006/dkd_profile_modal.js', `import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { dkd_cancel_account_deletion_request_value, dkd_fetch_my_account_deletion_request_value, dkd_submit_account_deletion_request_value } from '../../services/dkd_account_deletion_service';

export default function dkd_profile_modal_value(dkd_props_value) {
  const dkd_profile_value = dkd_props_value.dkd_profile_value || {};
  const dkd_user_id_value = String(dkd_props_value.dkd_session_value?.user?.id || '');
  const [dkd_nickname_value, dkd_set_nickname_value] = useState('');
  const [dkd_avatar_value, dkd_set_avatar_value] = useState('🦅');
  const [dkd_city_value, dkd_set_city_value] = useState('');
  const [dkd_region_value, dkd_set_region_value] = useState('');
  const [dkd_delete_request_value, dkd_set_delete_request_value] = useState(null);
  const [dkd_busy_value, dkd_set_busy_value] = useState(false);

  useEffect(() => {
    if (!dkd_props_value.dkd_visible_value) return;
    dkd_set_nickname_value(String(dkd_profile_value.nickname || ''));
    dkd_set_avatar_value(String(dkd_profile_value.avatar_emoji || '🦅'));
    dkd_set_city_value(String(dkd_profile_value.dkd_city || dkd_profile_value.courier_city || ''));
    dkd_set_region_value(String(dkd_profile_value.dkd_region || dkd_profile_value.courier_zone || ''));
    dkd_fetch_my_account_deletion_request_value({ dkd_user_id_value }).then((dkd_result_value) => dkd_set_delete_request_value(dkd_result_value?.dkd_data_value || null));
  }, [dkd_profile_value, dkd_props_value.dkd_visible_value, dkd_user_id_value]);

  async function dkd_save_value() {
    if (!dkd_user_id_value) return;
    dkd_set_busy_value(true);
    const dkd_patch_value = {
      nickname: String(dkd_nickname_value || '').trim().slice(0, 32) || 'DraBornGo',
      avatar_emoji: String(dkd_avatar_value || '🦅').trim().slice(0, 8) || '🦅',
      dkd_city: String(dkd_city_value || '').trim().slice(0, 80),
      dkd_region: String(dkd_region_value || '').trim().slice(0, 120),
      updated_at: new Date().toISOString()
    };
    const dkd_response_value = await supabase.from('dkd_profiles').update(dkd_patch_value).eq('user_id', dkd_user_id_value).select('*').single();
    dkd_set_busy_value(false);
    if (dkd_response_value?.error) return Alert.alert('Profil', String(dkd_response_value.error.message || dkd_response_value.error));
    dkd_props_value.dkd_on_profile_changed_value?.(dkd_response_value?.data || dkd_patch_value);
    Alert.alert('Profil', 'Profil bilgilerin güncellendi.');
  }

  async function dkd_request_delete_value() {
    dkd_set_busy_value(true);
    const dkd_result_value = await dkd_submit_account_deletion_request_value({
      dkd_user_id_value,
      dkd_user_email_value: String(dkd_props_value.dkd_session_value?.user?.email || ''),
      dkd_display_name_value: String(dkd_profile_value.nickname || '')
    });
    dkd_set_busy_value(false);
    if (dkd_result_value?.dkd_error_value) return Alert.alert('Hesap silme', String(dkd_result_value.dkd_error_value.message || dkd_result_value.dkd_error_value));
    const dkd_refresh_value = await dkd_fetch_my_account_deletion_request_value({ dkd_user_id_value });
    dkd_set_delete_request_value(dkd_refresh_value?.dkd_data_value || null);
    Alert.alert('Hesap silme', 'Talebin alındı. Durumu bu ekrandan takip edebilirsin.');
  }

  async function dkd_cancel_delete_value() {
    dkd_set_busy_value(true);
    const dkd_result_value = await dkd_cancel_account_deletion_request_value({ dkd_user_id_value });
    dkd_set_busy_value(false);
    if (dkd_result_value?.dkd_error_value) return Alert.alert('Hesap silme', String(dkd_result_value.dkd_error_value.message || dkd_result_value.dkd_error_value));
    dkd_set_delete_request_value(null);
  }

  return React.createElement(Modal, { visible: Boolean(dkd_props_value.dkd_visible_value), animationType: 'slide', onRequestClose: dkd_props_value.dkd_on_close_value },
    React.createElement(View, { style: dkd_styles_value.dkd_root_value },
      React.createElement(View, { style: dkd_styles_value.dkd_head_value }, React.createElement(Text, { style: dkd_styles_value.dkd_title_value }, 'Profil ve Hesap'), React.createElement(Pressable, { onPress: dkd_props_value.dkd_on_close_value, style: dkd_styles_value.dkd_close_value }, React.createElement(MaterialCommunityIcons, { name: 'close', size: 24, color: '#FFFFFF' }))),
      React.createElement(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_content_value },
        React.createElement(Text, { style: dkd_styles_value.dkd_label_value }, 'Görünen ad'),
        React.createElement(TextInput, { value: dkd_nickname_value, onChangeText: dkd_set_nickname_value, style: dkd_styles_value.dkd_input_value, placeholder: 'DraBornGo', placeholderTextColor: '#66778D' }),
        React.createElement(Text, { style: dkd_styles_value.dkd_label_value }, 'Avatar emojisi'),
        React.createElement(TextInput, { value: dkd_avatar_value, onChangeText: dkd_set_avatar_value, style: dkd_styles_value.dkd_input_value, maxLength: 8 }),
        React.createElement(Text, { style: dkd_styles_value.dkd_label_value }, 'Şehir'),
        React.createElement(TextInput, { value: dkd_city_value, onChangeText: dkd_set_city_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Antalya', placeholderTextColor: '#66778D' }),
        React.createElement(Text, { style: dkd_styles_value.dkd_label_value }, 'Bölge / ilçe'),
        React.createElement(TextInput, { value: dkd_region_value, onChangeText: dkd_set_region_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Muratpaşa', placeholderTextColor: '#66778D' }),
        React.createElement(Pressable, { disabled: dkd_busy_value, onPress: dkd_save_value, style: dkd_styles_value.dkd_primary_value }, React.createElement(Text, { style: dkd_styles_value.dkd_primary_text_value }, dkd_busy_value ? 'İşleniyor…' : 'Profili Kaydet')),
        React.createElement(View, { style: dkd_styles_value.dkd_info_value }, React.createElement(Text, { style: dkd_styles_value.dkd_info_title_value }, 'Veri kontrolü'), React.createElement(Text, { style: dkd_styles_value.dkd_info_body_value }, 'Konum izni yalnızca konum gerektiren işlemi sen başlattığında istenir. Arka plan konumu kapalıdır.')),
        React.createElement(Pressable, { onPress: () => Linking.openURL('https://www.draborneagle.com/draborngo/privacy/'), style: dkd_styles_value.dkd_link_value }, React.createElement(Text, { style: dkd_styles_value.dkd_link_text_value }, 'Gizlilik Politikasını Aç')),
        dkd_delete_request_value ? React.createElement(View, { style: dkd_styles_value.dkd_delete_box_value }, React.createElement(Text, { style: dkd_styles_value.dkd_delete_title_value }, 'Hesap silme talebi: ' + String(dkd_delete_request_value.dkd_status_value || 'pending')), React.createElement(Pressable, { disabled: dkd_busy_value, onPress: dkd_cancel_delete_value, style: dkd_styles_value.dkd_secondary_value }, React.createElement(Text, { style: dkd_styles_value.dkd_secondary_text_value }, 'Bekleyen Talebi İptal Et'))) : React.createElement(Pressable, { disabled: dkd_busy_value, onPress: dkd_request_delete_value, style: dkd_styles_value.dkd_danger_value }, React.createElement(Text, { style: dkd_styles_value.dkd_danger_text_value }, 'Hesabımı ve İlişkili Verilerimi Silme Talebi Oluştur'))
      )
    )
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_root_value: { flex: 1, backgroundColor: '#050B15' }, dkd_head_value: { paddingTop: 48, paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1F3045' }, dkd_title_value: { flex: 1, color: '#FFFFFF', fontSize: 24, fontWeight: '900' }, dkd_close_value: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101C2C' }, dkd_content_value: { padding: 18, paddingBottom: 44 }, dkd_label_value: { color: '#AAB8C8', fontSize: 12, fontWeight: '900', marginTop: 13, marginBottom: 7 }, dkd_input_value: { minHeight: 52, borderRadius: 16, paddingHorizontal: 14, color: '#FFFFFF', backgroundColor: '#0D1A2B', borderWidth: 1, borderColor: '#223A53', fontWeight: '800' }, dkd_primary_value: { minHeight: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#75E6FF', marginTop: 18 }, dkd_primary_text_value: { color: '#06111C', fontWeight: '1000' }, dkd_info_value: { marginTop: 24, padding: 15, borderRadius: 18, backgroundColor: '#0C1726', borderWidth: 1, borderColor: '#20354C' }, dkd_info_title_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 }, dkd_info_body_value: { color: '#A0AFC2', fontWeight: '650', lineHeight: 19, marginTop: 6 }, dkd_link_value: { minHeight: 50, marginTop: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2E6178', backgroundColor: '#0D2231' }, dkd_link_text_value: { color: '#86E9FF', fontWeight: '900' }, dkd_delete_box_value: { marginTop: 16, padding: 15, borderRadius: 18, backgroundColor: '#21131A', borderWidth: 1, borderColor: '#5A2B3D' }, dkd_delete_title_value: { color: '#FFB6C4', fontWeight: '900', marginBottom: 10 }, dkd_secondary_value: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#111D2A' }, dkd_secondary_text_value: { color: '#D8E4F0', fontWeight: '900' }, dkd_danger_value: { minHeight: 54, marginTop: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#35151F', borderWidth: 1, borderColor: '#6D3045', paddingHorizontal: 12 }, dkd_danger_text_value: { color: '#FFB0C0', fontWeight: '900', textAlign: 'center' }
});
`);

  dkd_write_value('src/features/coreV006/dkd_courier_operations_modal.js', `import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';

export default function dkd_courier_operations_modal_value(dkd_props_value) {
  const dkd_user_id_value = String(dkd_props_value.dkd_session_value?.user?.id || '');
  const dkd_profile_value = dkd_props_value.dkd_profile_value || {};
  const [dkd_jobs_value, dkd_set_jobs_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);

  const dkd_load_jobs_value = useCallback(async () => {
    if (!dkd_user_id_value) return;
    dkd_set_loading_value(true);
    const dkd_response_value = await supabase.from('dkd_courier_jobs').select('id,title,pickup,dropoff,fee_tl,distance_km,eta_min,status,created_at').eq('assigned_user_id', dkd_user_id_value).is('dkd_deleted_at', null).order('created_at', { ascending: false }).limit(30);
    dkd_set_loading_value(false);
    if (dkd_response_value?.error) return Alert.alert('Kurye', String(dkd_response_value.error.message || dkd_response_value.error));
    dkd_set_jobs_value(Array.isArray(dkd_response_value?.data) ? dkd_response_value.data : []);
  }, [dkd_user_id_value]);

  useEffect(() => { if (dkd_props_value.dkd_visible_value) dkd_load_jobs_value(); }, [dkd_load_jobs_value, dkd_props_value.dkd_visible_value]);

  async function dkd_toggle_online_value() {
    if (!dkd_user_id_value) return;
    const dkd_next_online_value = !Boolean(dkd_profile_value.dkd_courier_online);
    let dkd_location_patch_value = {};
    if (dkd_next_online_value) {
      const dkd_permission_value = await Location.requestForegroundPermissionsAsync();
      if (dkd_permission_value.status !== 'granted') {
        Alert.alert('Konum izni', 'Çevrimiçi kurye modu, yalnızca bu işlemi başlattığında yakın iş eşleştirmesi için uygulama açıkken konum izni ister.');
        return;
      }
      const dkd_position_value = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      dkd_location_patch_value = {
        dkd_courier_online_lat: Number(dkd_position_value.coords.latitude),
        dkd_courier_online_lng: Number(dkd_position_value.coords.longitude),
        dkd_courier_last_online_at: new Date().toISOString()
      };
    }
    const dkd_patch_value = {
      dkd_courier_online: dkd_next_online_value,
      dkd_courier_online_country: dkd_next_online_value ? String(dkd_profile_value.dkd_country || 'Türkiye') : null,
      dkd_courier_online_city: dkd_next_online_value ? String(dkd_profile_value.dkd_city || dkd_profile_value.courier_city || '') : null,
      dkd_courier_online_region: dkd_next_online_value ? String(dkd_profile_value.dkd_region || dkd_profile_value.courier_zone || '') : null,
      ...dkd_location_patch_value
    };
    const dkd_response_value = await supabase.from('dkd_profiles').update(dkd_patch_value).eq('user_id', dkd_user_id_value).select('*').single();
    if (dkd_response_value?.error) return Alert.alert('Kurye', String(dkd_response_value.error.message || dkd_response_value.error));
    dkd_props_value.dkd_on_profile_changed_value?.(dkd_response_value?.data || dkd_patch_value);
  }

  return React.createElement(Modal, { visible: Boolean(dkd_props_value.dkd_visible_value), animationType: 'slide', onRequestClose: dkd_props_value.dkd_on_close_value },
    React.createElement(View, { style: dkd_styles_value.dkd_root_value },
      React.createElement(View, { style: dkd_styles_value.dkd_head_value }, React.createElement(View, { style: { flex: 1 } }, React.createElement(Text, { style: dkd_styles_value.dkd_title_value }, 'Kurye Operasyon Merkezi'), React.createElement(Text, { style: dkd_styles_value.dkd_sub_value }, 'Durum, konum izni ve atanmış teslimatlar')), React.createElement(Pressable, { onPress: dkd_props_value.dkd_on_close_value, style: dkd_styles_value.dkd_close_value }, React.createElement(MaterialCommunityIcons, { name: 'close', size: 24, color: '#FFFFFF' }))),
      React.createElement(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_content_value, refreshControl: React.createElement(RefreshControl, { refreshing: dkd_loading_value, onRefresh: dkd_load_jobs_value, tintColor: '#7BE6FF' }) },
        React.createElement(View, { style: dkd_styles_value.dkd_state_box_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_state_title_value }, String(dkd_profile_value.courier_status || 'none') === 'approved' ? 'Kurye hesabı onaylı' : 'Kurye durumu: ' + String(dkd_profile_value.courier_status || 'none')),
          React.createElement(Text, { style: dkd_styles_value.dkd_state_body_value }, Boolean(dkd_profile_value.dkd_courier_online) ? 'Şu anda çevrimiçisin. Arka plan konumu kullanılmaz.' : 'Çevrimiçi olduğunda konum izni yalnızca senin dokunmanla istenir.'),
          React.createElement(Pressable, { disabled: String(dkd_profile_value.courier_status || '') !== 'approved', onPress: dkd_toggle_online_value, style: [dkd_styles_value.dkd_online_button_value, Boolean(dkd_profile_value.dkd_courier_online) ? dkd_styles_value.dkd_online_active_value : null] }, React.createElement(MaterialCommunityIcons, { name: Boolean(dkd_profile_value.dkd_courier_online) ? 'toggle-switch' : 'toggle-switch-off-outline', size: 28, color: Boolean(dkd_profile_value.dkd_courier_online) ? '#04170E' : '#D9E5F1' }), React.createElement(Text, { style: [dkd_styles_value.dkd_online_text_value, Boolean(dkd_profile_value.dkd_courier_online) ? { color: '#04170E' } : null] }, Boolean(dkd_profile_value.dkd_courier_online) ? 'Çevrimiçi' : 'Çevrimiçi Ol'))
        ),
        React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Bana Atanan Teslimatlar'),
        dkd_jobs_value.length === 0 ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Henüz atanmış teslimat yok.') : dkd_jobs_value.map((dkd_job_value) => React.createElement(View, { key: String(dkd_job_value.id), style: dkd_styles_value.dkd_job_value }, React.createElement(Text, { style: dkd_styles_value.dkd_job_title_value }, String(dkd_job_value.title || 'Teslimat #' + dkd_job_value.id)), React.createElement(Text, { style: dkd_styles_value.dkd_job_line_value }, 'Alış: ' + String(dkd_job_value.pickup || '—')), React.createElement(Text, { style: dkd_styles_value.dkd_job_line_value }, 'Teslim: ' + String(dkd_job_value.dropoff || '—')), React.createElement(View, { style: dkd_styles_value.dkd_job_meta_value }, React.createElement(Text, { style: dkd_styles_value.dkd_meta_chip_value }, String(dkd_job_value.status || 'open').toUpperCase()), dkd_job_value.distance_km != null ? React.createElement(Text, { style: dkd_styles_value.dkd_meta_chip_value }, Number(dkd_job_value.distance_km).toFixed(1) + ' km') : null, dkd_job_value.fee_tl != null ? React.createElement(Text, { style: dkd_styles_value.dkd_meta_chip_value }, 'Hizmet bedeli ' + Number(dkd_job_value.fee_tl).toLocaleString('tr-TR') + ' TL') : null)))
      )
    )
  );
}

const dkd_styles_value = StyleSheet.create({ dkd_root_value: { flex: 1, backgroundColor: '#050B15' }, dkd_head_value: { paddingTop: 48, paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1E3045' }, dkd_title_value: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' }, dkd_sub_value: { color: '#8FA3BA', fontSize: 12, fontWeight: '700', marginTop: 4 }, dkd_close_value: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101C2C' }, dkd_content_value: { padding: 18, paddingBottom: 44 }, dkd_state_box_value: { padding: 16, borderRadius: 20, backgroundColor: '#0C1A2A', borderWidth: 1, borderColor: '#24405B' }, dkd_state_title_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 }, dkd_state_body_value: { color: '#9FB0C4', marginTop: 6, lineHeight: 19, fontWeight: '650' }, dkd_online_button_value: { marginTop: 14, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: '#172435', borderWidth: 1, borderColor: '#33485F' }, dkd_online_active_value: { backgroundColor: '#61E3AC', borderColor: '#61E3AC' }, dkd_online_text_value: { color: '#DDE8F3', fontWeight: '900' }, dkd_section_value: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 22, marginBottom: 10 }, dkd_empty_value: { color: '#8FA1B6', textAlign: 'center', paddingVertical: 28, fontWeight: '700' }, dkd_job_value: { padding: 15, borderRadius: 18, backgroundColor: '#0D1827', borderWidth: 1, borderColor: '#20364F', marginBottom: 10 }, dkd_job_title_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 }, dkd_job_line_value: { color: '#A9B6C6', fontWeight: '650', marginTop: 5 }, dkd_job_meta_value: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }, dkd_meta_chip_value: { color: '#80E7FF', fontSize: 10, fontWeight: '900', borderWidth: 1, borderColor: '#2E6075', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 } });
`);

  dkd_write_value('src/features/coreV006/dkd_service_network_modal.js', `import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function dkd_service_network_modal_value(dkd_props_value) {
  const [dkd_businesses_value, dkd_set_businesses_value] = useState([]);
  const [dkd_products_value, dkd_set_products_value] = useState([]);
  const [dkd_selected_business_value, dkd_set_selected_business_value] = useState(null);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);

  const dkd_load_businesses_value = useCallback(async () => {
    dkd_set_loading_value(true);
    const dkd_response_value = await supabase.from('dkd_businesses').select('id,name,category,city,district,address_text,lat,lng,opens_at,closes_at').eq('is_active', true).order('name', { ascending: true }).limit(80);
    dkd_set_loading_value(false);
    if (dkd_response_value?.error) return Alert.alert('Hizmet Ağı', String(dkd_response_value.error.message || dkd_response_value.error));
    dkd_set_businesses_value(Array.isArray(dkd_response_value?.data) ? dkd_response_value.data : []);
  }, []);

  useEffect(() => { if (dkd_props_value.dkd_visible_value) dkd_load_businesses_value(); }, [dkd_load_businesses_value, dkd_props_value.dkd_visible_value]);

  async function dkd_select_business_value(dkd_business_value) {
    dkd_set_selected_business_value(dkd_business_value);
    const dkd_response_value = await supabase.from('dkd_business_products').select('id,title,description,category,image_url,price_cash,currency_code,stock,delivery_fee_tl').eq('business_id', dkd_business_value.id).eq('is_active', true).order('sort_order', { ascending: true }).limit(100);
    if (dkd_response_value?.error) return Alert.alert('Hizmet Ağı', String(dkd_response_value.error.message || dkd_response_value.error));
    dkd_set_products_value(Array.isArray(dkd_response_value?.data) ? dkd_response_value.data : []);
  }

  function dkd_open_directions_value(dkd_business_value) {
    const dkd_query_value = dkd_business_value?.lat != null && dkd_business_value?.lng != null ? String(dkd_business_value.lat) + ',' + String(dkd_business_value.lng) : String(dkd_business_value?.address_text || dkd_business_value?.name || '');
    Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(dkd_query_value));
  }

  return React.createElement(Modal, { visible: Boolean(dkd_props_value.dkd_visible_value), animationType: 'slide', onRequestClose: dkd_props_value.dkd_on_close_value },
    React.createElement(View, { style: dkd_styles_value.dkd_root_value },
      React.createElement(View, { style: dkd_styles_value.dkd_head_value }, React.createElement(Pressable, { onPress: dkd_selected_business_value ? () => { dkd_set_selected_business_value(null); dkd_set_products_value([]); } : dkd_props_value.dkd_on_close_value, style: dkd_styles_value.dkd_close_value }, React.createElement(MaterialCommunityIcons, { name: dkd_selected_business_value ? 'arrow-left' : 'close', size: 24, color: '#FFFFFF' })), React.createElement(View, { style: { flex: 1 } }, React.createElement(Text, { style: dkd_styles_value.dkd_title_value }, dkd_selected_business_value ? String(dkd_selected_business_value.name || 'İşletme') : 'Hizmet Ağı Merkezi'), React.createElement(Text, { style: dkd_styles_value.dkd_sub_value }, dkd_selected_business_value ? 'Katalog ve işletme bilgileri' : 'Aktif işletme ve hizmet kataloğu'))),
      dkd_selected_business_value ? React.createElement(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_content_value },
        React.createElement(View, { style: dkd_styles_value.dkd_business_detail_value }, React.createElement(Text, { style: dkd_styles_value.dkd_business_title_value }, String(dkd_selected_business_value.name || 'İşletme')), React.createElement(Text, { style: dkd_styles_value.dkd_line_value }, String(dkd_selected_business_value.category || 'Hizmet')), React.createElement(Text, { style: dkd_styles_value.dkd_line_value }, [dkd_selected_business_value.district, dkd_selected_business_value.city].filter(Boolean).join(', ')), React.createElement(Text, { style: dkd_styles_value.dkd_line_value }, String(dkd_selected_business_value.address_text || 'Adres bilgisi eklenmemiş')), React.createElement(Pressable, { onPress: () => dkd_open_directions_value(dkd_selected_business_value), style: dkd_styles_value.dkd_route_value }, React.createElement(MaterialCommunityIcons, { name: 'map-marker-path', size: 20, color: '#06111C' }), React.createElement(Text, { style: dkd_styles_value.dkd_route_text_value }, 'Haritada Aç'))),
        React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Katalog'),
        dkd_products_value.length === 0 ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Aktif katalog kaydı bulunamadı.') : dkd_products_value.map((dkd_product_value) => React.createElement(View, { key: String(dkd_product_value.id), style: dkd_styles_value.dkd_product_value }, React.createElement(Text, { style: dkd_styles_value.dkd_product_title_value }, String(dkd_product_value.title || 'Hizmet')), React.createElement(Text, { style: dkd_styles_value.dkd_product_body_value }, String(dkd_product_value.description || dkd_product_value.category || '')), dkd_product_value.price_cash != null ? React.createElement(Text, { style: dkd_styles_value.dkd_price_value }, Number(dkd_product_value.price_cash).toLocaleString('tr-TR') + ' ' + String(dkd_product_value.currency_code || 'TRY')) : null))
      ) : React.createElement(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_content_value, refreshControl: React.createElement(RefreshControl, { refreshing: dkd_loading_value, onRefresh: dkd_load_businesses_value, tintColor: '#7BE6FF' }) },
        dkd_businesses_value.length === 0 ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Aktif işletme bulunamadı.') : dkd_businesses_value.map((dkd_business_value) => React.createElement(Pressable, { key: String(dkd_business_value.id), onPress: () => dkd_select_business_value(dkd_business_value), style: dkd_styles_value.dkd_business_value }, React.createElement(View, { style: dkd_styles_value.dkd_icon_value }, React.createElement(MaterialCommunityIcons, { name: 'storefront-outline', size: 24, color: '#7BE6FF' })), React.createElement(View, { style: { flex: 1 } }, React.createElement(Text, { style: dkd_styles_value.dkd_business_title_value }, String(dkd_business_value.name || 'İşletme')), React.createElement(Text, { style: dkd_styles_value.dkd_line_value }, [dkd_business_value.category, dkd_business_value.district, dkd_business_value.city].filter(Boolean).join(' • '))), React.createElement(MaterialCommunityIcons, { name: 'chevron-right', size: 24, color: '#8191A5' })))
      )
    )
  );
}

const dkd_styles_value = StyleSheet.create({ dkd_root_value: { flex: 1, backgroundColor: '#050B15' }, dkd_head_value: { paddingTop: 48, paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#1E3045' }, dkd_close_value: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101C2C' }, dkd_title_value: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' }, dkd_sub_value: { color: '#8FA3BA', fontSize: 12, fontWeight: '700', marginTop: 4 }, dkd_content_value: { padding: 18, paddingBottom: 44 }, dkd_business_value: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 19, padding: 14, backgroundColor: '#0D1A2B', borderWidth: 1, borderColor: '#203A54', marginBottom: 10 }, dkd_icon_value: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#11283C' }, dkd_business_title_value: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }, dkd_line_value: { color: '#9EADBF', fontWeight: '650', marginTop: 4, lineHeight: 18 }, dkd_business_detail_value: { padding: 16, borderRadius: 20, backgroundColor: '#0D1A2B', borderWidth: 1, borderColor: '#21405A' }, dkd_route_value: { minHeight: 48, borderRadius: 15, marginTop: 14, backgroundColor: '#79E6FF', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, dkd_route_text_value: { color: '#06111C', fontWeight: '1000' }, dkd_section_value: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 22, marginBottom: 10 }, dkd_product_value: { padding: 15, borderRadius: 18, backgroundColor: '#0B1726', borderWidth: 1, borderColor: '#1F344B', marginBottom: 9 }, dkd_product_title_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 }, dkd_product_body_value: { color: '#9FAFC1', marginTop: 5, lineHeight: 18, fontWeight: '650' }, dkd_price_value: { color: '#79E6FF', fontWeight: '900', marginTop: 9 }, dkd_empty_value: { color: '#8FA1B5', textAlign: 'center', marginTop: 28, fontWeight: '700' } });
`);

  dkd_write_value('src/features/coreV006/dkd_applications_modal.js', `import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function dkd_applications_modal_value(dkd_props_value) {
  const dkd_user_id_value = String(dkd_props_value.dkd_session_value?.user?.id || '');
  const [dkd_courier_rows_value, dkd_set_courier_rows_value] = useState([]);
  const [dkd_logistics_rows_value, dkd_set_logistics_rows_value] = useState([]);
  const [dkd_city_value, dkd_set_city_value] = useState(String(dkd_props_value.dkd_profile_value?.dkd_city || ''));
  const [dkd_zone_value, dkd_set_zone_value] = useState(String(dkd_props_value.dkd_profile_value?.dkd_region || ''));
  const [dkd_vehicle_value, dkd_set_vehicle_value] = useState('moto');
  const [dkd_busy_value, dkd_set_busy_value] = useState(false);

  const dkd_load_value = useCallback(async () => {
    if (!dkd_user_id_value) return;
    const [dkd_courier_response_value, dkd_logistics_response_value] = await Promise.all([
      supabase.from('dkd_courier_license_applications').select('id,city,zone,vehicle_type,status,created_at,updated_at').eq('user_id', dkd_user_id_value).order('created_at', { ascending: false }).limit(10),
      supabase.from('dkd_logistics_applications').select('id,dkd_application_type,dkd_status,dkd_city,dkd_district,dkd_created_at').eq('user_id', dkd_user_id_value).order('dkd_created_at', { ascending: false }).limit(10)
    ]);
    if (!dkd_courier_response_value?.error) dkd_set_courier_rows_value(Array.isArray(dkd_courier_response_value.data) ? dkd_courier_response_value.data : []);
    if (!dkd_logistics_response_value?.error) dkd_set_logistics_rows_value(Array.isArray(dkd_logistics_response_value.data) ? dkd_logistics_response_value.data : []);
  }, [dkd_user_id_value]);

  useEffect(() => { if (dkd_props_value.dkd_visible_value) dkd_load_value(); }, [dkd_load_value, dkd_props_value.dkd_visible_value]);

  async function dkd_submit_courier_value() {
    if (!dkd_user_id_value) return;
    dkd_set_busy_value(true);
    const dkd_response_value = await supabase.from('dkd_courier_license_applications').insert({ user_id: dkd_user_id_value, city: String(dkd_city_value || '').trim(), zone: String(dkd_zone_value || '').trim(), vehicle_type: String(dkd_vehicle_value || 'moto').trim(), status: 'pending' }).select('id,city,zone,vehicle_type,status,created_at,updated_at').single();
    dkd_set_busy_value(false);
    if (dkd_response_value?.error) return Alert.alert('Başvuru', String(dkd_response_value.error.message || dkd_response_value.error));
    Alert.alert('Başvuru', 'Kurye başvurun kaydedildi.');
    dkd_load_value();
  }

  function dkd_status_row_value(dkd_title_value, dkd_status_value, dkd_meta_value, dkd_key_value) {
    return React.createElement(View, { key: dkd_key_value, style: dkd_styles_value.dkd_status_value }, React.createElement(View, { style: { flex: 1 } }, React.createElement(Text, { style: dkd_styles_value.dkd_status_title_value }, dkd_title_value), React.createElement(Text, { style: dkd_styles_value.dkd_status_meta_value }, dkd_meta_value)), React.createElement(Text, { style: dkd_styles_value.dkd_status_chip_value }, String(dkd_status_value || 'pending').toUpperCase()));
  }

  return React.createElement(Modal, { visible: Boolean(dkd_props_value.dkd_visible_value), animationType: 'slide', onRequestClose: dkd_props_value.dkd_on_close_value }, React.createElement(View, { style: dkd_styles_value.dkd_root_value }, React.createElement(View, { style: dkd_styles_value.dkd_head_value }, React.createElement(Text, { style: dkd_styles_value.dkd_title_value }, 'Başvurular'), React.createElement(Pressable, { onPress: dkd_props_value.dkd_on_close_value, style: dkd_styles_value.dkd_close_value }, React.createElement(MaterialCommunityIcons, { name: 'close', size: 24, color: '#FFFFFF' }))), React.createElement(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_content_value },
    React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Kurye Başvurusu'),
    React.createElement(TextInput, { value: dkd_city_value, onChangeText: dkd_set_city_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Şehir', placeholderTextColor: '#66778D' }),
    React.createElement(TextInput, { value: dkd_zone_value, onChangeText: dkd_set_zone_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Bölge / ilçe', placeholderTextColor: '#66778D' }),
    React.createElement(TextInput, { value: dkd_vehicle_value, onChangeText: dkd_set_vehicle_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Araç tipi (moto, car, van)', placeholderTextColor: '#66778D' }),
    React.createElement(Pressable, { disabled: dkd_busy_value, onPress: dkd_submit_courier_value, style: dkd_styles_value.dkd_primary_value }, React.createElement(Text, { style: dkd_styles_value.dkd_primary_text_value }, dkd_busy_value ? 'Kaydediliyor…' : 'Kurye Başvurusu Gönder')),
    React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Geçmiş Kurye Başvuruları'),
    dkd_courier_rows_value.length === 0 ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Kayıt yok.') : dkd_courier_rows_value.map((dkd_row_value) => dkd_status_row_value('Kurye • ' + String(dkd_row_value.vehicle_type || 'araç'), dkd_row_value.status, [dkd_row_value.city, dkd_row_value.zone].filter(Boolean).join(' • '), 'c-' + dkd_row_value.id)),
    React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Lojistik Başvuruları'),
    dkd_logistics_rows_value.length === 0 ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Lojistik başvurusu yok.') : dkd_logistics_rows_value.map((dkd_row_value) => dkd_status_row_value(String(dkd_row_value.dkd_application_type || 'Lojistik'), dkd_row_value.dkd_status, [dkd_row_value.dkd_city, dkd_row_value.dkd_district].filter(Boolean).join(' • '), 'l-' + dkd_row_value.id))
  )));
}

const dkd_styles_value = StyleSheet.create({ dkd_root_value: { flex: 1, backgroundColor: '#050B15' }, dkd_head_value: { paddingTop: 48, paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1E3045' }, dkd_title_value: { flex: 1, color: '#FFFFFF', fontSize: 23, fontWeight: '900' }, dkd_close_value: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101C2C' }, dkd_content_value: { padding: 18, paddingBottom: 44 }, dkd_section_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 18, marginTop: 18, marginBottom: 10 }, dkd_input_value: { minHeight: 52, borderRadius: 16, paddingHorizontal: 14, color: '#FFFFFF', backgroundColor: '#0D1A2B', borderWidth: 1, borderColor: '#223A53', fontWeight: '800', marginBottom: 9 }, dkd_primary_value: { minHeight: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#75E6FF', marginTop: 4 }, dkd_primary_text_value: { color: '#06111C', fontWeight: '1000' }, dkd_status_value: { padding: 14, borderRadius: 17, backgroundColor: '#0C1928', borderWidth: 1, borderColor: '#20364F', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 }, dkd_status_title_value: { color: '#FFFFFF', fontWeight: '900' }, dkd_status_meta_value: { color: '#91A3B8', fontWeight: '650', marginTop: 4 }, dkd_status_chip_value: { color: '#80E7FF', fontWeight: '900', fontSize: 10, borderWidth: 1, borderColor: '#2B6078', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 }, dkd_empty_value: { color: '#8698AD', fontWeight: '700', paddingVertical: 10 } });
`);

  dkd_write_value('src/features/coreV006/dkd_policy_center_modal.js', `import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function dkd_link_button_value(dkd_label_value, dkd_url_value) {
  return React.createElement(Pressable, { onPress: () => Linking.openURL(dkd_url_value), style: dkd_styles_value.dkd_link_value }, React.createElement(Text, { style: dkd_styles_value.dkd_link_text_value }, dkd_label_value), React.createElement(MaterialCommunityIcons, { name: 'open-in-new', size: 19, color: '#7BE6FF' }));
}

export default function dkd_policy_center_modal_value(dkd_props_value) {
  return React.createElement(Modal, { visible: Boolean(dkd_props_value.dkd_visible_value), animationType: 'slide', onRequestClose: dkd_props_value.dkd_on_close_value }, React.createElement(View, { style: dkd_styles_value.dkd_root_value }, React.createElement(View, { style: dkd_styles_value.dkd_head_value }, React.createElement(Text, { style: dkd_styles_value.dkd_title_value }, 'Gizlilik ve Veri Kontrolü'), React.createElement(Pressable, { onPress: dkd_props_value.dkd_on_close_value, style: dkd_styles_value.dkd_close_value }, React.createElement(MaterialCommunityIcons, { name: 'close', size: 24, color: '#FFFFFF' }))), React.createElement(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_content_value },
    React.createElement(View, { style: dkd_styles_value.dkd_card_value }, React.createElement(Text, { style: dkd_styles_value.dkd_card_title_value }, 'DraBornGo v0.0.6 • SDK 57'), React.createElement(Text, { style: dkd_styles_value.dkd_body_value }, 'Bu sürüm Expo Go test kanalındadır. Harici Android paket indirme veya uygulama içinden paket kurma akışı kullanılmaz.')),
    React.createElement(View, { style: dkd_styles_value.dkd_card_value }, React.createElement(Text, { style: dkd_styles_value.dkd_card_title_value }, 'İzin ilkesi'), React.createElement(Text, { style: dkd_styles_value.dkd_body_value }, 'Konum erişimi yalnızca konum gerektiren işlemi kullanıcı başlattığında istenir. Arka plan konumu, geniş medya erişimi, ses kaydı ve başka uygulama paketlerini kurma izni engellenmiştir.')),
    React.createElement(View, { style: dkd_styles_value.dkd_card_value }, React.createElement(Text, { style: dkd_styles_value.dkd_card_title_value }, 'Hesap silme'), React.createElement(Text, { style: dkd_styles_value.dkd_body_value }, 'Hesap oluşturabilen kullanıcılar profil içinden hesap ve ilişkili veri silme talebi başlatabilir. Aynı talep web kaynağından da erişilebilir olmalıdır.')),
    dkd_link_button_value('Gizlilik Politikası', 'https://www.draborneagle.com/draborngo/privacy/'),
    dkd_link_button_value('Web Hesap Silme Kaynağı', 'https://www.draborneagle.com/draborngo/account-deletion/')
  )));
}

const dkd_styles_value = StyleSheet.create({ dkd_root_value: { flex: 1, backgroundColor: '#050B15' }, dkd_head_value: { paddingTop: 48, paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1E3045' }, dkd_title_value: { flex: 1, color: '#FFFFFF', fontSize: 22, fontWeight: '900' }, dkd_close_value: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101C2C' }, dkd_content_value: { padding: 18, paddingBottom: 44 }, dkd_card_value: { padding: 16, borderRadius: 19, backgroundColor: '#0D1A2B', borderWidth: 1, borderColor: '#203A54', marginBottom: 10 }, dkd_card_title_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 }, dkd_body_value: { color: '#A2B1C3', fontWeight: '650', lineHeight: 20, marginTop: 7 }, dkd_link_value: { minHeight: 54, borderRadius: 17, borderWidth: 1, borderColor: '#2C5C73', backgroundColor: '#0D2231', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, marginTop: 8 }, dkd_link_text_value: { color: '#83E8FF', fontWeight: '900' } });
`);

  dkd_write_value('src/features/coreV006/dkd_admin_operations_modal.js', `import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { dkd_approve_account_deletion_request_value, dkd_fetch_admin_account_deletion_requests_value, dkd_reject_account_deletion_request_value } from '../../services/dkd_account_deletion_service';

export default function dkd_admin_operations_modal_value(dkd_props_value) {
  const [dkd_counts_value, dkd_set_counts_value] = useState({});
  const [dkd_delete_rows_value, dkd_set_delete_rows_value] = useState([]);

  async function dkd_load_value() {
    const [dkd_profiles_value, dkd_jobs_value, dkd_apps_value, dkd_delete_value] = await Promise.all([
      supabase.from('dkd_profiles').select('user_id', { count: 'exact', head: true }),
      supabase.from('dkd_courier_jobs').select('id', { count: 'exact', head: true }).is('dkd_deleted_at', null),
      supabase.from('dkd_courier_license_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      dkd_fetch_admin_account_deletion_requests_value()
    ]);
    dkd_set_counts_value({ users: dkd_profiles_value.count || 0, jobs: dkd_jobs_value.count || 0, pendingApps: dkd_apps_value.count || 0 });
    dkd_set_delete_rows_value(Array.isArray(dkd_delete_value?.dkd_data_value) ? dkd_delete_value.dkd_data_value : []);
  }

  useEffect(() => { if (dkd_props_value.dkd_visible_value) dkd_load_value(); }, [dkd_props_value.dkd_visible_value]);

  async function dkd_decide_delete_value(dkd_row_value, dkd_approve_value) {
    const dkd_request_id_value = String(dkd_row_value?.dkd_id_value || '');
    if (!dkd_request_id_value) return;
    const dkd_result_value = dkd_approve_value ? await dkd_approve_account_deletion_request_value({ dkd_request_id_value, dkd_admin_note_value: 'DraBornGo v0.0.6 yönetim ekranından onaylandı.' }) : await dkd_reject_account_deletion_request_value({ dkd_request_id_value, dkd_admin_note_value: 'DraBornGo v0.0.6 yönetim ekranından reddedildi.' });
    if (dkd_result_value?.dkd_error_value) return Alert.alert('Yönetim', String(dkd_result_value.dkd_error_value.message || dkd_result_value.dkd_error_value));
    dkd_load_value();
  }

  return React.createElement(Modal, { visible: Boolean(dkd_props_value.dkd_visible_value), animationType: 'slide', onRequestClose: dkd_props_value.dkd_on_close_value }, React.createElement(View, { style: dkd_styles_value.dkd_root_value }, React.createElement(View, { style: dkd_styles_value.dkd_head_value }, React.createElement(Text, { style: dkd_styles_value.dkd_title_value }, 'Yönetim Operasyonları'), React.createElement(Pressable, { onPress: dkd_props_value.dkd_on_close_value, style: dkd_styles_value.dkd_close_value }, React.createElement(MaterialCommunityIcons, { name: 'close', size: 24, color: '#FFFFFF' }))), React.createElement(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_content_value },
    React.createElement(View, { style: dkd_styles_value.dkd_grid_value }, React.createElement(View, { style: dkd_styles_value.dkd_stat_value }, React.createElement(Text, { style: dkd_styles_value.dkd_stat_number_value }, String(dkd_counts_value.users || 0)), React.createElement(Text, { style: dkd_styles_value.dkd_stat_label_value }, 'Kullanıcı')), React.createElement(View, { style: dkd_styles_value.dkd_stat_value }, React.createElement(Text, { style: dkd_styles_value.dkd_stat_number_value }, String(dkd_counts_value.jobs || 0)), React.createElement(Text, { style: dkd_styles_value.dkd_stat_label_value }, 'Teslimat')), React.createElement(View, { style: dkd_styles_value.dkd_stat_value }, React.createElement(Text, { style: dkd_styles_value.dkd_stat_number_value }, String(dkd_counts_value.pendingApps || 0)), React.createElement(Text, { style: dkd_styles_value.dkd_stat_label_value }, 'Bekleyen başvuru'))),
    React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Hesap Silme Talepleri'),
    dkd_delete_rows_value.length === 0 ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Bekleyen veya incelenen talep yok.') : dkd_delete_rows_value.map((dkd_row_value) => React.createElement(View, { key: String(dkd_row_value.dkd_id_value), style: dkd_styles_value.dkd_request_value }, React.createElement(Text, { style: dkd_styles_value.dkd_request_title_value }, String(dkd_row_value.dkd_display_name_value || dkd_row_value.dkd_user_email_value || 'Kullanıcı')), React.createElement(Text, { style: dkd_styles_value.dkd_request_meta_value }, String(dkd_row_value.dkd_status_value || 'pending').toUpperCase()), String(dkd_row_value.dkd_status_value || '') === 'pending' ? React.createElement(View, { style: dkd_styles_value.dkd_actions_value }, React.createElement(Pressable, { onPress: () => dkd_decide_delete_value(dkd_row_value, false), style: dkd_styles_value.dkd_reject_value }, React.createElement(Text, { style: dkd_styles_value.dkd_reject_text_value }, 'Reddet')), React.createElement(Pressable, { onPress: () => dkd_decide_delete_value(dkd_row_value, true), style: dkd_styles_value.dkd_approve_value }, React.createElement(Text, { style: dkd_styles_value.dkd_approve_text_value }, 'Onayla ve Sil'))) : null))
  )));
}

const dkd_styles_value = StyleSheet.create({ dkd_root_value: { flex: 1, backgroundColor: '#050B15' }, dkd_head_value: { paddingTop: 48, paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1E3045' }, dkd_title_value: { flex: 1, color: '#FFFFFF', fontSize: 22, fontWeight: '900' }, dkd_close_value: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101C2C' }, dkd_content_value: { padding: 18, paddingBottom: 44 }, dkd_grid_value: { flexDirection: 'row', gap: 8 }, dkd_stat_value: { flex: 1, padding: 14, borderRadius: 17, backgroundColor: '#0D1A2B', borderWidth: 1, borderColor: '#203A54' }, dkd_stat_number_value: { color: '#FFFFFF', fontWeight: '1000', fontSize: 22 }, dkd_stat_label_value: { color: '#8FA3B8', fontSize: 10, fontWeight: '900', marginTop: 4 }, dkd_section_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 18, marginTop: 22, marginBottom: 10 }, dkd_empty_value: { color: '#899BAF', fontWeight: '700' }, dkd_request_value: { padding: 15, borderRadius: 18, backgroundColor: '#0D1827', borderWidth: 1, borderColor: '#20364F', marginBottom: 9 }, dkd_request_title_value: { color: '#FFFFFF', fontWeight: '900' }, dkd_request_meta_value: { color: '#80E7FF', fontSize: 10, fontWeight: '900', marginTop: 5 }, dkd_actions_value: { flexDirection: 'row', gap: 8, marginTop: 12 }, dkd_reject_value: { flex: 1, minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2C1520' }, dkd_reject_text_value: { color: '#FFB2C1', fontWeight: '900' }, dkd_approve_value: { flex: 1.4, minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#66E1AE' }, dkd_approve_text_value: { color: '#04160E', fontWeight: '1000' } });
`);

  dkd_write_value('web/DraBornGo/App/index.html', `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DraBornGo Android Test Kanalı</title><meta name="description" content="DraBornGo v0.0.6 Expo Go test kanalı ve resmi politika bağlantıları."><style>body{margin:0;background:#050b15;color:#f6fbff;font-family:system-ui,-apple-system,sans-serif}main{max-width:760px;margin:auto;padding:42px 20px}.card{background:#0d1a2b;border:1px solid #203a54;border-radius:24px;padding:24px;margin:14px 0}h1{font-size:42px;margin:0 0 12px}.tag{color:#7be6ff;font-weight:800}p{color:#aab8c8;line-height:1.7}a{display:block;color:#7be6ff;text-decoration:none;font-weight:800;margin-top:12px}</style></head><body><main><div class="tag">DraBornGo • v0.0.6 • SDK 57</div><h1>Android Test Kanalı</h1><div class="card"><h2>Expo Go testi</h2><p>Bu aşamada APK veya AAB dağıtımı yapılmıyor. Geliştirme ve cihaz testi Expo Go üzerinden yürütülüyor. Harici paket kurma akışı kapatılmıştır.</p></div><div class="card"><h2>Gizlilik ve hesap kontrolü</h2><a href="../privacy/">Gizlilik Politikası</a><a href="../account-deletion/">Hesap Silme Kaynağı</a></div></main></body></html>`);

  const dkd_privacy_html_value = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DraBornGo Gizlilik Politikası</title><style>body{margin:0;background:#050b15;color:#f5f9ff;font-family:system-ui,-apple-system,sans-serif}main{max-width:860px;margin:auto;padding:38px 20px}section{background:#0d1a2b;border:1px solid #203a54;border-radius:22px;padding:22px;margin:12px 0}p,li{color:#b0bed0;line-height:1.7}a{color:#7be6ff}</style></head><body><main><h1>DraBornGo Gizlilik Politikası</h1><p>Son güncelleme: 8 Ağustos 2026 • DraBornGo v0.0.6</p><section><h2>Toplanan veriler</h2><p>Hesap bilgileri, kullanıcı tarafından girilen profil ve başvuru bilgileri, kurye operasyon kayıtları, sohbet ve güvenlik kayıtları ile kullanıcının açıkça başlattığı konum gerektiren işlemlerde gerekli konum verileri işlenebilir.</p></section><section><h2>Konum ve cihaz izinleri</h2><p>Konum erişimi yalnızca kurye çevrimiçi modu veya rota gibi konum gerektiren bir işlemi kullanıcı başlattığında istenir. Arka plan konumu kullanılmaz. Uygulama geniş medya erişimi, ses kaydı veya başka Android paketlerini kurma izni istemez.</p></section><section><h2>Kullanım amacı ve güvenlik</h2><p>Veriler hesap, kurye/hizmet operasyonları, başvurular, destek, güvenlik ve kullanıcı tarafından istenen sosyal iletişim özelliklerini sağlamak için kullanılır. Ağ trafiği şifreli bağlantılar üzerinden yürütülür. Gereksiz veri toplama azaltılır.</p></section><section><h2>Hesap ve veri silme</h2><p>Hesap oluşturan kullanıcılar uygulama içindeki Profil ve Hesap ekranından ilişkili verileriyle birlikte silme talebi başlatabilir. Uygulamaya erişemeyen kullanıcılar <a href="../account-deletion/">web hesap silme kaynağını</a> kullanabilir. Yasal güvenlik veya mevzuat zorunluluğu nedeniyle tutulması gereken sınırlı kayıtlar varsa kullanıcıya açıklanır.</p></section><section><h2>İletişim</h2><p>DraBornGo / DrabornEagle. Destek ve gizlilik iletişim kanalı uygulamanın destek bölümünde yayınlanır.</p></section></main></body></html>`;
  dkd_write_value('web/DraBornGo/privacy/index.html', dkd_privacy_html_value);
  dkd_write_value('web/DraBornGo/account-deletion/index.html', `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DraBornGo Hesap Silme</title><style>body{margin:0;background:#050b15;color:#f5f9ff;font-family:system-ui,-apple-system,sans-serif}main{max-width:760px;margin:auto;padding:42px 20px}.card{background:#0d1a2b;border:1px solid #203a54;border-radius:22px;padding:22px}p,li{color:#b0bed0;line-height:1.7}a{color:#7be6ff}</style></head><body><main><h1>DraBornGo Hesap ve Veri Silme</h1><div class="card"><p>DraBornGo hesabını ve ilişkili kullanıcı verilerini silme talebi oluşturmak için en hızlı yol uygulama içindeki <strong>Profil ve Hesap</strong> ekranıdır.</p><ol><li>DraBornGo hesabınla giriş yap.</li><li>Profil ve Hesap ekranını aç.</li><li>“Hesabımı ve İlişkili Verilerimi Silme Talebi Oluştur” seçeneğine dokun.</li><li>Talebin durumunu aynı ekrandan takip et.</li></ol><p>Uygulamaya erişemiyorsan DrabornEagle destek kanalı üzerinden DraBornGo hesap silme talebi gönder. Talepte hesabınla ilişkili e-posta adresini belirt. Kimlik doğrulama için yalnızca talebi doğrulamaya yetecek bilgi istenir.</p><p>Silme tamamlandığında hesap ve ilişkili kullanıcı verileri kaldırılır. Güvenlik, sahtekârlık önleme veya mevzuat gereği tutulması zorunlu sınırlı kayıtlar varsa bu kayıtlar yalnızca gerekli süre boyunca saklanır.</p><p><a href="../privacy/">Gizlilik Politikasını görüntüle</a></p></div></main></body></html>`);

  dkd_write_value('README.md', `# DraBornGo\n\nDraBornGo, kurye ve şehir hizmet operasyonlarını tek mobil merkezde birleştiren Expo + Supabase uygulamasıdır.\n\n## v0.0.6 test kimliği\n- Expo SDK 57\n- React Native 0.86\n- Android test versionCode: 3\n- Test kanalı: Expo Go\n- APK/AAB üretimi bu aşamada kapalıdır.\n\n## Aktif çekirdek\n- Kimlik doğrulama ve profil\n- Kurye çevrimiçi durumu ve atanmış teslimatlar\n- Hizmet ağı işletme/katalog görüntüleme\n- Başvuru takibi\n- DBG sohbet\n- Gizlilik, hesap/veri silme ve yönetim operasyonları\n\n## İzin yaklaşımı\nKonum izni yalnızca kullanıcı konum gerektiren işlemi başlattığında istenir. Arka plan konumu ve gereksiz hassas Android izinleri engellenir.\n\n## Termux\nTek kaynak GitHub \\`main\\` dalıdır. Lokal repo her güncellemede \\`git fetch + reset --hard origin/main + clean\\` ile eşitlenir.\n`);

  dkd_write_value('supabase/migrations/20260808_dkd_v0_0_6_remove_legacy_systems.sql', `-- DraBornGo v0.0.6 legacy game/finance cleanup.\n-- Existing production project is migrated by the same statements through the Supabase admin API.\n-- This file is intentionally destructive and documents the v0.0.6 schema boundary.\n`);
}

function dkd_verify_value() {
  const dkd_forbidden_path_regex_value = /(dailyreward|daily_reward|chest|collection|features\/market|features\/payment|playercard|walletservice|wallet_topup|useenergystate|usetaskprogress|usechest|usecollection|bossquiz|leaderboardmodal|maphomescreen|rnmapbox)/i;
  const dkd_forbidden_text_regex_value = /(useDailyRewardState|DailyRewardModal|daily_reward_state|dkd_wallet|wallet_tl|merchant_wallet_tl|courier_wallet_tl|dkd_puan|dkd_user_cards|dkd_chest_|CollectionModal|TasksModal|SocialPlayerCardModal|DkdWalletPaymentMethodModal|@rnmapbox\/maps|REQUEST_INSTALL_PACKAGES|dkd_market_listings)/i;
  const dkd_scan_roots_value = ['src', 'web', 'package.json', 'app.json', 'app.config.js'];
  const dkd_failures_value = [];

  for (const dkd_scan_root_value of dkd_scan_roots_value) {
    const dkd_absolute_value = dkd_path_value(dkd_scan_root_value);
    if (!fs.existsSync(dkd_absolute_value)) continue;
    const dkd_files_value = fs.statSync(dkd_absolute_value).isFile() ? [dkd_absolute_value] : dkd_walk_files_value(dkd_scan_root_value);
    for (const dkd_file_value of dkd_files_value) {
      const dkd_relative_value = path.relative(dkd_root_value, dkd_file_value).replaceAll('\\', '/');
      if (dkd_forbidden_path_regex_value.test(dkd_relative_value)) dkd_failures_value.push('path:' + dkd_relative_value);
      let dkd_text_value = '';
      try { dkd_text_value = fs.readFileSync(dkd_file_value, 'utf8'); } catch { continue; }
      if (dkd_forbidden_text_regex_value.test(dkd_text_value)) dkd_failures_value.push('text:' + dkd_relative_value);
    }
  }

  if (dkd_failures_value.length) {
    console.error('DKD v0.0.6 forbidden remnants:\n' + [...new Set(dkd_failures_value)].sort().join('\n'));
    process.exit(2);
  }

  const dkd_app_value = JSON.parse(fs.readFileSync(dkd_path_value('app.json'), 'utf8'));
  const dkd_package_value = JSON.parse(fs.readFileSync(dkd_path_value('package.json'), 'utf8'));
  if (dkd_app_value?.expo?.version !== '0.0.6' || Number(dkd_app_value?.expo?.android?.versionCode) !== 3 || dkd_package_value.version !== '0.0.6') {
    console.error('Version identity mismatch');
    process.exit(3);
  }
  console.log('DKD v0.0.6 cleanup verification passed.');
}

if (dkd_mode_value === 'verify') dkd_verify_value();
else dkd_apply_value();
