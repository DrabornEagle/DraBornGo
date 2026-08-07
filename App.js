import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/lib/supabase';
import dkd_auth_screen_value from './src/features/auth/dkd_auth_screen';
import dkd_pre_login_intro_screen_value from './src/features/onboarding/dkd_pre_login_intro_screen';
import dkd_game_flow_value from './src/core/dkd_game_flow';

const dkd_intro_storage_key_value = 'dkd_draborngo_intro_seen_v006';

export default function App() {
  const [dkd_booting_value, dkd_set_booting_value] = useState(true);
  const [dkd_intro_seen_value, dkd_set_intro_seen_value] = useState(true);
  const [dkd_session_value, dkd_set_session_value] = useState(null);

  useEffect(() => {
    let dkd_active_value = true;

    Promise.all([
      AsyncStorage.getItem(dkd_intro_storage_key_value),
      supabase.auth.getSession(),
    ]).then(([dkd_intro_value, dkd_session_response_value]) => {
      if (!dkd_active_value) return;
      dkd_set_intro_seen_value(dkd_intro_value === '1');
      dkd_set_session_value(dkd_session_response_value?.data?.session || null);
      dkd_set_booting_value(false);
    }).catch(() => {
      if (dkd_active_value) dkd_set_booting_value(false);
    });

    const dkd_subscription_value = supabase.auth.onAuthStateChange((_dkd_event_value, dkd_next_session_value) => {
      if (dkd_active_value) dkd_set_session_value(dkd_next_session_value || null);
    });

    return () => {
      dkd_active_value = false;
      dkd_subscription_value?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  async function dkd_finish_intro_value() {
    await AsyncStorage.setItem(dkd_intro_storage_key_value, '1');
    dkd_set_intro_seen_value(true);
  }

  let dkd_content_value = null;
  if (dkd_booting_value) {
    dkd_content_value = React.createElement(
      View,
      { style: dkd_styles_value.dkd_boot_value },
      React.createElement(ActivityIndicator, { size: 'large', color: '#79E6FF' }),
    );
  } else if (!dkd_intro_seen_value) {
    dkd_content_value = React.createElement(dkd_pre_login_intro_screen_value, {
      dkd_on_complete_value: dkd_finish_intro_value,
    });
  } else if (!dkd_session_value) {
    dkd_content_value = React.createElement(dkd_auth_screen_value);
  } else {
    dkd_content_value = React.createElement(dkd_game_flow_value, {
      dkd_session_value,
      dkd_on_signed_out_value: () => dkd_set_session_value(null),
    });
  }

  return React.createElement(SafeAreaProvider, null, dkd_content_value);
}

const dkd_styles_value = StyleSheet.create({
  dkd_boot_value: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050B15',
  },
});
