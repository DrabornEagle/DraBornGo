import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function dkd_safe_screen_value({ children: dkd_children_value, style: dkd_style_value }) {
  return React.createElement(
    SafeAreaView,
    { edges: ['top'], style: [{ flex: 1, backgroundColor: '#050B15' }, dkd_style_value] },
    React.createElement(StatusBar, { barStyle: 'light-content', backgroundColor: '#050B15', translucent: false }),
    dkd_children_value,
  );
}
