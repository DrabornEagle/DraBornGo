import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LogBox, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as dkd_system_ui_module from 'expo-system-ui';
import { getCurrentSession, onSessionChange } from './src/services/authService';
import AuthScreen from './src/features/auth/AuthScreen';
import DkdPreLoginIntroScreen from './src/features/onboarding/dkd_pre_login_intro_screen';
import DkdCityGateTransitionScreen from './src/features/onboarding/dkd_city_gate_transition_screen';
import GameFlow from './src/core/GameFlow';
import Dkd_modern_alert_provider_value from './src/components/ui/dkd_modern_alert_provider';

const dkd_pre_login_intro_storage_key_value = 'dkd_dkd_draborngo_pre_login_intro_completed_v6';
const dkd_android_system_bar_background_value = '#000000';

const dkd_ignore_pattern_list_value = [
  'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'dkd courier online watcher skipped',
];

LogBox.ignoreLogs(dkd_ignore_pattern_list_value);

export default function App() {
  const [dkd_session_value, dkd_set_session_value] = useState(null);
  const [dkd_auth_mode_value, dkd_set_auth_mode_value] = useState('login');
  const [dkd_session_ready_flag, dkd_set_session_ready_flag] = useState(false);
  const [dkd_pre_login_intro_ready_flag, dkd_set_pre_login_intro_ready_flag] = useState(false);
  const [dkd_pre_login_intro_visible_flag, dkd_set_pre_login_intro_visible_flag] = useState(false);
  const [dkd_city_gate_transition_visible_flag, dkd_set_city_gate_transition_visible_flag] = useState(false);
  const [dkd_city_gate_home_ready_flag, dkd_set_city_gate_home_ready_flag] = useState(false);
  const dkd_city_gate_transition_timer_ref = useRef(null);
  const dkd_city_gate_launch_started_ref = useRef(false);
  const dkd_last_session_presence_ref = useRef(false);
  const dkd_patched_console_ref = useRef(false);

  useEffect(() => {
    dkd_system_ui_module.setBackgroundColorAsync(dkd_android_system_bar_background_value).catch(() => {});
  }, []);

  const dkd_start_city_gate_transition_value = useCallback(() => {
    if (dkd_city_gate_launch_started_ref.current) return;
    dkd_city_gate_launch_started_ref.current = true;
    dkd_set_city_gate_home_ready_flag(false);
    dkd_set_city_gate_transition_visible_flag(true);
    if (dkd_city_gate_transition_timer_ref.current) {
      clearTimeout(dkd_city_gate_transition_timer_ref.current);
      dkd_city_gate_transition_timer_ref.current = null;
    }
  }, []);

  useEffect(() => {
    if (dkd_patched_console_ref.current) return undefined;
    dkd_patched_console_ref.current = true;

    const dkd_original_error_value = console.error;
    const dkd_original_warn_value = console.warn;

    const dkd_should_ignore_console_value = (dkd_console_arg_list_value) => {
      const dkd_console_text_value = dkd_console_arg_list_value.map((dkd_console_item_value) => String(dkd_console_item_value ?? '')).join(' ');
      return dkd_ignore_pattern_list_value.some((dkd_pattern_text_value) => dkd_console_text_value.includes(dkd_pattern_text_value));
    };

    console.error = (...dkd_console_arg_list_value) => {
      if (dkd_should_ignore_console_value(dkd_console_arg_list_value)) return;
      dkd_original_error_value(...dkd_console_arg_list_value);
    };

    console.warn = (...dkd_console_arg_list_value) => {
      if (dkd_should_ignore_console_value(dkd_console_arg_list_value)) return;
      dkd_original_warn_value(...dkd_console_arg_list_value);
    };

    return () => {
      console.error = dkd_original_error_value;
      console.warn = dkd_original_warn_value;
      dkd_patched_console_ref.current = false;
    };
  }, []);

  useEffect(() => {
    let dkd_cancelled_flag = false;
    getCurrentSession()
      .then((dkd_session_result_value) => {
        if (dkd_cancelled_flag) return;
        const dkd_initial_session_value = dkd_session_result_value?.data?.session ?? null;
        dkd_last_session_presence_ref.current = Boolean(dkd_initial_session_value);
        dkd_set_session_value(dkd_initial_session_value);
        if (dkd_initial_session_value) dkd_start_city_gate_transition_value();
      })
      .finally(() => {
        if (!dkd_cancelled_flag) dkd_set_session_ready_flag(true);
      });
    const { data: dkd_subscription_data_value } = onSessionChange((dkd_next_session_value, dkd_auth_event_name_value) => {
      const dkd_had_session_flag = dkd_last_session_presence_ref.current;
      const dkd_has_next_session_flag = Boolean(dkd_next_session_value);
      dkd_last_session_presence_ref.current = dkd_has_next_session_flag;
      dkd_set_session_value(dkd_next_session_value);
      dkd_set_session_ready_flag(true);
      if (dkd_has_next_session_flag && (!dkd_had_session_flag || dkd_auth_event_name_value === 'INITIAL_SESSION')) {
        dkd_start_city_gate_transition_value();
      } else if (!dkd_has_next_session_flag) {
        dkd_city_gate_launch_started_ref.current = false;
        dkd_set_city_gate_home_ready_flag(false);
        dkd_set_city_gate_transition_visible_flag(false);
      }
    });
    return () => {
      dkd_cancelled_flag = true;
      if (dkd_city_gate_transition_timer_ref.current) {
        clearTimeout(dkd_city_gate_transition_timer_ref.current);
        dkd_city_gate_transition_timer_ref.current = null;
      }
      dkd_subscription_data_value.subscription.unsubscribe();
    };
  }, [dkd_start_city_gate_transition_value]);

  useEffect(() => {
    let dkd_cancelled_flag = false;

    async function dkd_load_pre_login_intro_state() {
      if (!dkd_session_ready_flag) return;
      if (dkd_session_value) {
        dkd_set_pre_login_intro_visible_flag(false);
        dkd_set_pre_login_intro_ready_flag(true);
        return;
      }

      try {
        const dkd_saved_intro_value = await AsyncStorage.getItem(dkd_pre_login_intro_storage_key_value);
        if (!dkd_cancelled_flag) dkd_set_pre_login_intro_visible_flag(dkd_saved_intro_value !== 'completed');
      } catch {
        if (!dkd_cancelled_flag) dkd_set_pre_login_intro_visible_flag(true);
      } finally {
        if (!dkd_cancelled_flag) dkd_set_pre_login_intro_ready_flag(true);
      }
    }

    dkd_load_pre_login_intro_state();
    return () => {
      dkd_cancelled_flag = true;
    };
  }, [dkd_session_ready_flag, dkd_session_value]);

  async function dkd_complete_pre_login_intro() {
    try {
      await AsyncStorage.setItem(dkd_pre_login_intro_storage_key_value, 'completed');
    } catch {}
    dkd_set_pre_login_intro_visible_flag(false);
    dkd_set_pre_login_intro_ready_flag(true);
  }

  const dkd_mark_home_ready_value = useCallback(() => {
    dkd_set_city_gate_home_ready_flag(true);
  }, []);

  const dkd_complete_city_gate_transition_value = useCallback(() => {
    if (dkd_city_gate_transition_timer_ref.current) {
      clearTimeout(dkd_city_gate_transition_timer_ref.current);
      dkd_city_gate_transition_timer_ref.current = null;
    }
    dkd_set_city_gate_transition_visible_flag(false);
    dkd_set_city_gate_home_ready_flag(false);
  }, []);

  let dkd_root_content_node = null;
  if (dkd_session_value) {
    dkd_root_content_node = (
      <View style={{ flex: 1 }}>
        <GameFlow
          session={dkd_session_value}
          onSignedOut={() => dkd_set_session_value(null)}
          dkd_on_home_ready_value={dkd_mark_home_ready_value}
          dkd_device_permissions_enabled_flag={!dkd_city_gate_transition_visible_flag}
        />
        {dkd_city_gate_transition_visible_flag ? (
          <DkdCityGateTransitionScreen dkd_home_ready_flag={dkd_city_gate_home_ready_flag} dkd_on_complete_value={dkd_complete_city_gate_transition_value} />
        ) : null}
      </View>
    );
  } else if (dkd_session_ready_flag && dkd_pre_login_intro_ready_flag && dkd_pre_login_intro_visible_flag) {
    dkd_root_content_node = <DkdPreLoginIntroScreen dkd_on_complete_value={dkd_complete_pre_login_intro} />;
  } else if (dkd_session_ready_flag && dkd_pre_login_intro_ready_flag) {
    dkd_root_content_node = <AuthScreen mode={dkd_auth_mode_value} setMode={dkd_set_auth_mode_value} />;
  }

  const dkd_root_with_alerts_node = React.createElement(Dkd_modern_alert_provider_value, null, dkd_root_content_node);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: dkd_android_system_bar_background_value }}>
        {dkd_root_with_alerts_node}
      </View>
    </SafeAreaProvider>
  );
}
