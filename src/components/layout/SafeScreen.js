import React from 'react';
import { StatusBar, View } from 'react-native';
import * as dkd_safe_area_context_module from 'react-native-safe-area-context';
import { cityLootTheme } from '../../theme/cityLootTheme';

const dkd_safe_area_view_component = dkd_safe_area_context_module?.SafeAreaView || View;
const dkd_has_native_safe_area_component = Boolean(dkd_safe_area_context_module?.SafeAreaView);

export default function SafeScreen({ style, children }) {
  const dkd_safe_background = cityLootTheme?.colors?.bgTop || cityLootTheme?.colors?.background || '#02050B';
  const dkd_safe_area_props = dkd_has_native_safe_area_component ? { edges: ['top'] } : {};
  const DkdSafeAreaView = dkd_safe_area_view_component;

  return (
    <DkdSafeAreaView {...dkd_safe_area_props} style={[{ flex: 1, backgroundColor: dkd_safe_background }, style]}>
      <StatusBar barStyle="light-content" backgroundColor={dkd_safe_background} translucent={false} />
      {children}
    </DkdSafeAreaView>
  );
}
