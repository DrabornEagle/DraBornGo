import { supabase } from '../lib/supabase';

function dkd_topup_money_value(dkd_input_value) {
  const dkd_number_value = Number(dkd_input_value || 0);
  if (!Number.isFinite(dkd_number_value)) return 0;
  return Math.max(0, Math.round(dkd_number_value * 100) / 100);
}

function dkd_topup_text_value(dkd_input_value) {
  return String(dkd_input_value || '').trim();
}

async function dkd_read_customer_wallet_tl_after_topup_value() {
  try {
    const dkd_auth_result_value = await supabase.auth.getUser();
    const dkd_user_id_value = dkd_auth_result_value?.data?.user?.id;
    if (!dkd_user_id_value) return { data: null, error: null };

    const dkd_profile_result_value = await supabase
      .from('dkd_profiles')
      .select('wallet_tl')
      .eq('user_id', dkd_user_id_value)
      .maybeSingle();

    if (dkd_profile_result_value?.error) return { data: null, error: dkd_profile_result_value.error };
    const dkd_wallet_value = dkd_topup_money_value(dkd_profile_result_value?.data?.wallet_tl);
    return { data: { wallet_tl: dkd_wallet_value, dkd_wallet_after_tl: dkd_wallet_value }, error: null };
  } catch (dkd_error_value) {
    return { data: null, error: dkd_error_value };
  }
}

export async function dkd_create_bank_transfer_wallet_topup_value(dkd_input_value = {}) {
  try {
    const dkd_amount_value = dkd_topup_money_value(dkd_input_value?.dkd_amount_value);
    if (dkd_amount_value <= 0) {
      return { data: null, error: new Error('Yüklenecek TL tutarı geçersiz.') };
    }

    const dkd_rpc_result_value = await supabase.rpc('dkd_wallet_bank_receipt_topup_dkd', {
      dkd_param_amount_tl: dkd_amount_value,
      dkd_param_sender_full_name: dkd_topup_text_value(dkd_input_value?.dkd_sender_full_name_value),
      dkd_param_sender_phone: dkd_topup_text_value(dkd_input_value?.dkd_sender_phone_value),
      dkd_param_sender_identity: '',
      dkd_param_receipt_image_uri: dkd_topup_text_value(dkd_input_value?.dkd_receipt_image_uri_value),
      dkd_param_receipt_text: dkd_topup_text_value(dkd_input_value?.dkd_receipt_text_value),
      dkd_param_description: dkd_topup_text_value(dkd_input_value?.dkd_description_value || 'DraBornGo'),
      dkd_param_receipt_match_json: dkd_input_value?.dkd_receipt_match_json_value && typeof dkd_input_value.dkd_receipt_match_json_value === 'object' ? dkd_input_value.dkd_receipt_match_json_value : {},
    });

    if (dkd_rpc_result_value?.error) {
      const dkd_message_value = String(dkd_rpc_result_value.error?.message || '');
      if (dkd_message_value.includes('dkd_wallet_bank_receipt_topup_dkd')) {
        return { data: null, error: new Error('Cüzdan TL yükleme RPC bulunamadı. Güncel Supabase SQL dosyasını Supabase SQL Editor içinde çalıştırmalısın.') };
      }
      return dkd_rpc_result_value;
    }

    const dkd_data_value = dkd_rpc_result_value?.data && typeof dkd_rpc_result_value.data === 'object'
      ? dkd_rpc_result_value.data
      : { dkd_ok_value: false };

    if (dkd_data_value?.dkd_duplicate_value === true) {
      return { data: dkd_data_value, error: new Error(dkd_topup_text_value(dkd_data_value?.dkd_message_value || 'Bu dekont tekrar engeli güncel Supabase SQL ile kapatıldı. Güncel SQL dosyasını çalıştırıp tekrar dene.')) };
    }

    if (dkd_data_value?.dkd_ok_value === false || dkd_data_value?.ok === false) {
      return { data: dkd_data_value, error: new Error(dkd_topup_text_value(dkd_data_value?.dkd_message_value || dkd_data_value?.reason || 'Cüzdan TL yükleme tamamlanamadı.')) };
    }

    const dkd_verified_wallet_result_value = await dkd_read_customer_wallet_tl_after_topup_value();
    const dkd_verified_wallet_value = Number(dkd_verified_wallet_result_value?.data?.wallet_tl);
    const dkd_rpc_wallet_value = Number(dkd_data_value?.wallet_tl ?? dkd_data_value?.dkd_wallet_after_tl);

    if (Number.isFinite(dkd_verified_wallet_value)) {
      if (Number.isFinite(dkd_rpc_wallet_value) && Math.round(dkd_verified_wallet_value * 100) < Math.round(dkd_rpc_wallet_value * 100)) {
        return {
          data: {
            ...dkd_data_value,
            dkd_verified_wallet_tl: dkd_verified_wallet_value,
            wallet_tl: dkd_verified_wallet_value,
            dkd_wallet_after_tl: dkd_verified_wallet_value,
          },
          error: new Error('Bakiye Supabase üzerinde kalıcı güncellenmedi. Güncel cüzdan SQL dosyasını çalıştırıp tekrar dene.'),
        };
      }

      return {
        data: {
          ...dkd_data_value,
          dkd_verified_wallet_tl: dkd_verified_wallet_value,
          wallet_tl: dkd_verified_wallet_value,
          dkd_wallet_after_tl: dkd_verified_wallet_value,
        },
        error: null,
      };
    }

    return { data: dkd_data_value, error: null };
  } catch (dkd_error_value) {
    return { data: null, error: dkd_error_value };
  }
}
