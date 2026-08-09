import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView as DkdSafeAreaView } from 'react-native-safe-area-context';
import { cityLootTheme } from '../../theme/cityLootTheme';

export default function SafeScreen({ style, children }) {
  const dkd_safe_background = cityLootTheme?.colors?.bgTop || cityLootTheme?.colors?.background || '#02050B';

  return (
    <DkdSafeAreaView edges={['top', 'bottom']} style={[{ flex: 1, backgroundColor: dkd_safe_background }, style]}>
      <StatusBar barStyle="light-content" backgroundColor={dkd_safe_background} translucent={false} />
      {children}
    </DkdSafeAreaView>
  );
}
