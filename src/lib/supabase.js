import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { dkd_public_env_value } from './dkd_public_env';

const dkd_supabase_url = dkd_public_env_value('EXPO_PUBLIC_SUPABASE_URL');
const dkd_supabase_key = dkd_public_env_value('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  || dkd_public_env_value('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const dkd_placeholder_flag = [dkd_supabase_url, dkd_supabase_key].some((dkd_item_value) =>
  !dkd_item_value || dkd_item_value.includes('BURAYA_')
);

export const dkd_supabase_runtime_config = {
  dkd_url_value: dkd_supabase_url,
  dkd_key_value: dkd_supabase_key,
  dkd_is_ready: Boolean(dkd_supabase_url && dkd_supabase_key && !dkd_placeholder_flag),
  dkd_issue_text: dkd_placeholder_flag
    ? 'Supabase ayarı eksik. .env dosyasına EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY yaz.'
    : '',
};

if (!dkd_supabase_runtime_config.dkd_is_ready) {
  console.warn(`[DraBornGo] ${dkd_supabase_runtime_config.dkd_issue_text}`);
}

const dkd_safe_url = dkd_supabase_runtime_config.dkd_is_ready ? dkd_supabase_url : 'https://example.invalid';
const dkd_safe_key = dkd_supabase_runtime_config.dkd_is_ready ? dkd_supabase_key : 'dkd_invalid_key';

export const supabase = createClient(dkd_safe_url, dkd_safe_key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
