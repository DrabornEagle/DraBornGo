import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
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
import dkd_styles_value from './dkd_courier_styles';
import { dkd_palette_value } from './dkd_courier_theme';
import {
  dkd_modal_head_value,
  dkd_panel_title_value,
} from './dkd_courier_ui';

const dkd_e_value = React.createElement;

function dkd_service_modal_value({ dkd_visible_value, dkd_on_close_value }) {
  const [dkd_businesses_value, dkd_set_businesses_value] = useState([]);
  const [dkd_selected_value, dkd_set_selected_value] = useState(null);
  const [dkd_products_value, dkd_set_products_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);

  const dkd_load_value = useCallback(async () => {
    dkd_set_loading_value(true);
    const dkd_response_value = await supabase
      .from('dkd_businesses')
      .select('id,name,category,city,district,address_text,lat,lng')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(80);
    dkd_set_loading_value(false);

    if (dkd_response_value?.error) {
      return Alert.alert(
        'Hizmet Ağı',
        String(dkd_response_value.error.message || dkd_response_value.error),
      );
    }

    dkd_set_businesses_value(
      Array.isArray(dkd_response_value.data) ? dkd_response_value.data : [],
    );
  }, []);

  useEffect(() => {
    if (dkd_visible_value) dkd_load_value();
  }, [dkd_load_value, dkd_visible_value]);

  const dkd_open_business_value = async (dkd_business_value) => {
    dkd_set_selected_value(dkd_business_value);

    const dkd_response_value = await supabase
      .from('dkd_business_products')
      .select('id,title,description,category,price_cash,currency_code,stock,delivery_fee_tl')
      .eq('business_id', dkd_business_value.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(100);

    if (dkd_response_value?.error) {
      return Alert.alert(
        'Hizmet Ağı',
        String(dkd_response_value.error.message || dkd_response_value.error),
      );
    }

    dkd_set_products_value(
      Array.isArray(dkd_response_value.data) ? dkd_response_value.data : [],
    );
  };

  const dkd_back_value = dkd_selected_value
    ? () => {
        dkd_set_selected_value(null);
        dkd_set_products_value([]);
      }
    : dkd_on_close_value;

  const dkd_open_map_value = () => {
    const dkd_query_value =
      dkd_selected_value?.lat != null && dkd_selected_value?.lng != null
        ? String(dkd_selected_value.lat) + ',' + String(dkd_selected_value.lng)
        : String(dkd_selected_value?.address_text || dkd_selected_value?.name || '');

    return Linking.openURL(
      'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(dkd_query_value),
    );
  };

  const dkd_selected_hero_value = dkd_selected_value
    ? dkd_e_value(
        LinearGradient,
        {
          colors: ['#0D2A24', '#091A19', '#07111A'],
          style: dkd_styles_value.dkd_service_hero_value,
        },
        dkd_panel_title_value(
          'storefront-outline',
          String(dkd_selected_value.name || 'İşletme'),
          dkd_palette_value.dkd_green_value,
        ),
        dkd_e_value(
          Text,
          { style: dkd_styles_value.dkd_panel_body_value },
          [
            dkd_selected_value.category,
            dkd_selected_value.district,
            dkd_selected_value.city,
          ]
            .filter(Boolean)
            .join(' • '),
        ),
        dkd_e_value(
          Text,
          { style: dkd_styles_value.dkd_panel_body_value },
          String(dkd_selected_value.address_text || 'Adres bilgisi eklenmemiş'),
        ),
        dkd_e_value(
          Pressable,
          {
            onPress: dkd_open_map_value,
            style: dkd_styles_value.dkd_outline_value,
          },
          dkd_e_value(
            Text,
            { style: dkd_styles_value.dkd_outline_text_value },
            'HARİTADA AÇ',
          ),
        ),
      )
    : null;

  const dkd_product_cards_value = dkd_products_value.map((dkd_product_value) =>
    dkd_e_value(
      View,
      {
        key: String(dkd_product_value.id),
        style: dkd_styles_value.dkd_simple_card_value,
      },
      dkd_panel_title_value(
        'pricetag-outline',
        String(dkd_product_value.title || 'Hizmet'),
        dkd_palette_value.dkd_green_value,
      ),
      dkd_product_value.description
        ? dkd_e_value(
            Text,
            { style: dkd_styles_value.dkd_panel_body_value },
            String(dkd_product_value.description),
          )
        : null,
      dkd_product_value.price_cash != null
        ? dkd_e_value(
            Text,
            { style: dkd_styles_value.dkd_meta_value },
            Number(dkd_product_value.price_cash).toLocaleString('tr-TR') +
              ' ' +
              String(dkd_product_value.currency_code || 'TRY'),
          )
        : null,
    ),
  );

  const dkd_business_rows_value = dkd_businesses_value.map((dkd_business_value) =>
    dkd_e_value(
      Pressable,
      {
        key: String(dkd_business_value.id),
        onPress: () => dkd_open_business_value(dkd_business_value),
        style: dkd_styles_value.dkd_list_row_value,
      },
      dkd_e_value(
        View,
        {
          style: [
            dkd_styles_value.dkd_list_row_icon_value,
            { backgroundColor: '#0B2A22' },
          ],
        },
        dkd_e_value(Ionicons, {
          name: 'storefront-outline',
          size: 22,
          color: dkd_palette_value.dkd_green_value,
        }),
      ),
      dkd_e_value(
        View,
        { style: { flex: 1 } },
        dkd_e_value(
          Text,
          { style: dkd_styles_value.dkd_list_row_title_value },
          String(dkd_business_value.name || 'İşletme'),
        ),
        dkd_e_value(
          Text,
          { style: dkd_styles_value.dkd_list_row_meta_value },
          [
            dkd_business_value.category,
            dkd_business_value.district,
            dkd_business_value.city,
          ]
            .filter(Boolean)
            .join(' • '),
        ),
      ),
      dkd_e_value(Ionicons, {
        name: 'chevron-forward',
        size: 22,
        color: dkd_palette_value.dkd_green_value,
      }),
    ),
  );

  const dkd_selected_content_value = dkd_selected_value
    ? [
        dkd_selected_hero_value,
        dkd_e_value(
          Text,
          { key: 'catalog-title', style: dkd_styles_value.dkd_section_label_value },
          'KATALOG',
        ),
        ...(dkd_products_value.length
          ? dkd_product_cards_value
          : [
              dkd_e_value(
                Text,
                { key: 'catalog-empty', style: dkd_styles_value.dkd_empty_text_value },
                'Aktif katalog kaydı bulunamadı.',
              ),
            ]),
      ]
    : dkd_businesses_value.length
      ? dkd_business_rows_value
      : [
          dkd_e_value(
            Text,
            { key: 'business-empty', style: dkd_styles_value.dkd_empty_text_value },
            'Aktif işletme bulunamadı.',
          ),
        ];

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
        dkd_selected_value
          ? String(dkd_selected_value.name || 'İşletme')
          : 'Hizmet Ağı Merkezi',
        dkd_selected_value ? 'İşletme kataloğu' : 'Şehrin aktif hizmet noktaları',
        dkd_back_value,
        dkd_palette_value.dkd_green_value,
        'storefront-outline',
      ),
      dkd_e_value(
        ScrollView,
        {
          contentContainerStyle: dkd_styles_value.dkd_modal_content_value,
          refreshControl: !dkd_selected_value
            ? dkd_e_value(RefreshControl, {
                refreshing: dkd_loading_value,
                onRefresh: dkd_load_value,
                tintColor: dkd_palette_value.dkd_green_value,
              })
            : undefined,
        },
        ...dkd_selected_content_value,
      ),
    ),
  );
}

export { dkd_service_modal_value };
