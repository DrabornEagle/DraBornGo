import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import dkd_racing_motorcycle_value from '../components/dkd_racing_motorcycle';
import dkd_styles_value from './dkd_courier_styles';
import { dkd_palette_value } from './dkd_courier_theme';
import {
  dkd_badge_value,
  dkd_modal_head_value,
  dkd_panel_title_value,
  dkd_pulse_value,
} from './dkd_courier_ui';
import { dkd_change_courier_online_value } from './dkd_courier_actions';

const dkd_e_value = React.createElement;

function dkd_courier_modal_value({
  dkd_visible_value,
  dkd_session_value,
  dkd_profile_value,
  dkd_on_close_value,
  dkd_on_changed_value,
}) {
  const dkd_user_id_value = String(dkd_session_value?.user?.id || '');
  const [dkd_jobs_value, dkd_set_jobs_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_busy_value, dkd_set_busy_value] = useState(false);

  const dkd_load_value = useCallback(async () => {
    if (!dkd_user_id_value) return;

    dkd_set_loading_value(true);
    const dkd_response_value = await supabase
      .from('dkd_courier_jobs')
      .select('id,title,pickup,dropoff,fee_tl,distance_km,eta_min,status,created_at')
      .eq('assigned_user_id', dkd_user_id_value)
      .is('dkd_deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30);
    dkd_set_loading_value(false);

    if (dkd_response_value?.error) {
      return Alert.alert(
        'Kurye',
        String(dkd_response_value.error.message || dkd_response_value.error),
      );
    }

    dkd_set_jobs_value(
      Array.isArray(dkd_response_value.data) ? dkd_response_value.data : [],
    );
  }, [dkd_user_id_value]);

  useEffect(() => {
    if (dkd_visible_value) dkd_load_value();
  }, [dkd_load_value, dkd_visible_value]);

  const dkd_toggle_value = async () => {
    dkd_set_busy_value(true);
    const dkd_result_value = await dkd_change_courier_online_value({
      dkd_user_id_value,
      dkd_profile_value,
    });
    dkd_set_busy_value(false);

    if (dkd_result_value?.dkd_permission_denied_value) {
      return Alert.alert(
        'Konum izni',
        'Kurye çevrimiçi modu için yalnızca uygulama açıkken konum izni gerekir.',
      );
    }

    if (dkd_result_value?.dkd_error_value) {
      return Alert.alert(
        'Kurye',
        String(dkd_result_value.dkd_error_value.message || dkd_result_value.dkd_error_value),
      );
    }

    if (dkd_result_value?.dkd_data_value) {
      dkd_on_changed_value?.(dkd_result_value.dkd_data_value);
    }
  };

  const dkd_online_value = Boolean(dkd_profile_value?.dkd_courier_online);
  const dkd_approved_value = String(dkd_profile_value?.courier_status || '') === 'approved';

  const dkd_control_value = dkd_e_value(
    LinearGradient,
    {
      colors: dkd_online_value
        ? ['#0B352A', '#0A1E22', '#07111A']
        : ['#0B2A39', '#0A1B2A', '#07111A'],
      style: dkd_styles_value.dkd_courier_control_value,
    },
    dkd_e_value(
      View,
      { style: dkd_styles_value.dkd_courier_control_top_value },
      dkd_e_value(dkd_pulse_value, {
        dkd_color_value: dkd_online_value
          ? dkd_palette_value.dkd_green_value
          : dkd_palette_value.dkd_gold_value,
      }),
      dkd_e_value(
        Text,
        { style: dkd_styles_value.dkd_courier_control_eyebrow_value },
        dkd_online_value ? 'OPERASYON AKTİF' : 'HAZIRLIK MODU',
      ),
      dkd_badge_value(
        dkd_approved_value ? 'ONAYLI' : 'ONAY BEKLİYOR',
        dkd_approved_value
          ? dkd_palette_value.dkd_green_value
          : dkd_palette_value.dkd_orange_value,
      ),
    ),
    dkd_e_value(
      View,
      { style: dkd_styles_value.dkd_courier_visual_row_value },
      dkd_e_value(
        View,
        { style: { flex: 1 } },
        dkd_e_value(
          Text,
          { style: dkd_styles_value.dkd_courier_control_title_value },
          dkd_online_value ? 'Rota açık.' : 'Motor hazır.',
        ),
        dkd_e_value(
          Text,
          { style: dkd_styles_value.dkd_panel_body_value },
          dkd_online_value
            ? 'Atanmış işleri aşağıdan takip et.'
            : 'Çevrimiçi olduğunda bölgesel akış başlar.',
        ),
      ),
      dkd_e_value(dkd_racing_motorcycle_value, {
        dkd_color_value: dkd_online_value
          ? dkd_palette_value.dkd_green_value
          : dkd_palette_value.dkd_cyan_value,
        dkd_size_value: 106,
      }),
    ),
    dkd_e_value(
      Pressable,
      {
        disabled: !dkd_approved_value || dkd_busy_value,
        onPress: dkd_toggle_value,
        style: [
          dkd_styles_value.dkd_primary_value,
          {
            backgroundColor: dkd_online_value
              ? dkd_palette_value.dkd_red_value
              : dkd_palette_value.dkd_green_value,
          },
          !dkd_approved_value || dkd_busy_value
            ? dkd_styles_value.dkd_disabled_value
            : null,
        ],
      },
      dkd_e_value(
        Text,
        { style: dkd_styles_value.dkd_primary_text_value },
        dkd_busy_value
          ? 'İŞLENİYOR…'
          : dkd_online_value
            ? 'ÇEVRİMDIŞI OL'
            : 'ÇEVRİMİÇİ OL',
      ),
    ),
  );

  const dkd_empty_jobs_value = dkd_e_value(
    View,
    { style: dkd_styles_value.dkd_empty_value },
    dkd_e_value(Ionicons, {
      name: 'cube-outline',
      size: 34,
      color: dkd_palette_value.dkd_cyan_value,
    }),
    dkd_e_value(
      Text,
      { style: dkd_styles_value.dkd_empty_title_value },
      'Henüz atanmış teslimat yok',
    ),
    dkd_e_value(
      Text,
      { style: dkd_styles_value.dkd_empty_body_value },
      'Yeni bir iş atandığında burada görünür.',
    ),
  );

  const dkd_job_cards_value = dkd_jobs_value.map((dkd_job_value) => (
    dkd_e_value(
      LinearGradient,
      {
        key: String(dkd_job_value.id),
        colors: ['#0D1C2E', '#091522'],
        style: dkd_styles_value.dkd_job_card_value,
      },
      dkd_panel_title_value(
        'cube-outline',
        String(dkd_job_value.title || 'Teslimat #' + dkd_job_value.id),
        dkd_palette_value.dkd_cyan_value,
      ),
      dkd_e_value(
        Text,
        { style: dkd_styles_value.dkd_panel_body_value },
        '● Alış  ' + String(dkd_job_value.pickup || '—'),
      ),
      dkd_e_value(
        Text,
        { style: dkd_styles_value.dkd_panel_body_value },
        '● Teslim  ' + String(dkd_job_value.dropoff || '—'),
      ),
      dkd_e_value(
        Text,
        { style: dkd_styles_value.dkd_meta_value },
        [
          dkd_job_value.status,
          dkd_job_value.distance_km != null
            ? Number(dkd_job_value.distance_km).toFixed(1) + ' km'
            : null,
          dkd_job_value.eta_min != null
            ? dkd_job_value.eta_min + ' dk'
            : null,
        ].filter(Boolean).join(' • '),
      ),
    )
  ));

  const dkd_jobs_content_value = dkd_jobs_value.length === 0
    ? [dkd_empty_jobs_value]
    : dkd_job_cards_value;

  return dkd_e_value(
    Modal,
    {
      visible: Boolean(dkd_visible_value),
      animationType: 'slide',
      onRequestClose: dkd_on_close_value,
    },
    dkd_e_value(
      View,
      { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value(
        'Kurye Operasyon Merkezi',
        'Canlı durum ve atanmış teslimatlar',
        dkd_on_close_value,
        dkd_online_value
          ? dkd_palette_value.dkd_green_value
          : dkd_palette_value.dkd_cyan_value,
        'speedometer-outline',
      ),
      dkd_e_value(
        ScrollView,
        {
          contentContainerStyle: dkd_styles_value.dkd_modal_content_value,
          refreshControl: dkd_e_value(RefreshControl, {
            refreshing: dkd_loading_value,
            onRefresh: dkd_load_value,
            tintColor: dkd_palette_value.dkd_cyan_value,
          }),
        },
        dkd_control_value,
        dkd_e_value(
          Text,
          { style: dkd_styles_value.dkd_section_label_value },
          'BANA ATANAN TESLİMATLAR',
        ),
        ...dkd_jobs_content_value,
      ),
    ),
  );
}

export { dkd_courier_modal_value };
