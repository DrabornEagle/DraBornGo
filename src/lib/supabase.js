import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { dkd_public_env_value } from './dkd_public_env';

const dkd_supabase_url_value = dkd_public_env_value('EXPO_PUBLIC_SUPABASE_URL');
const dkd_supabase_key_value = dkd_public_env_value('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  || dkd_public_env_value('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const dkd_config_ready_value = Boolean(
  dkd_supabase_url_value
  && dkd_supabase_key_value
  && !dkd_supabase_url_value.includes('BURAYA_')
  && !dkd_supabase_key_value.includes('BURAYA_')
);

export const dkd_supabase_runtime_config = {
  dkd_url_value: dkd_supabase_url_value,
  dkd_key_value: dkd_supabase_key_value,
  dkd_is_ready: dkd_config_ready_value,
  dkd_issue_text: dkd_config_ready_value ? '' : 'Supabase bağlantı ayarı eksik.',
};

export const supabase = createClient(
  dkd_config_ready_value ? dkd_supabase_url_value : 'https://example.invalid',
  dkd_config_ready_value ? dkd_supabase_key_value : 'dkd_invalid_public_key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
