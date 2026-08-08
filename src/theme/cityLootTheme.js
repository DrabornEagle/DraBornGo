export const cityLootTheme = {
  colors: {
    bgTop: '#020611',
    bgMid: '#071A33',
    bgBottom: '#130D29',
    panel: 'rgba(7, 18, 37, 0.97)',
    panelSoft: 'rgba(76,139,255,0.070)',
    panelStrong: 'rgba(122,92,255,0.115)',
    panelBorder: 'rgba(139,219,255,0.16)',
    text: '#F8FCFF',
    textSoft: 'rgba(240,248,255,0.80)',
    textMuted: 'rgba(232,243,255,0.56)',
    cyan: '#73E5FF',
    cyanSoft: '#D3F8FF',
    cyanDeep: '#3187FF',
    gold: '#FFD36F',
    goldStrong: '#FF9D45',
    goldSoft: '#FFF0B9',
    purple: '#B99AFF',
    purpleDeep: '#7656FF',
    green: '#5CE5B0',
    red: '#FF8DA3',
  },
  radius: {
    pill: 999,
    xl: 30,
    lg: 24,
    md: 19,
    sm: 15,
  },
  shadow: {
    glow: {
      shadowColor: '#73E5FF',
      shadowOpacity: 0.21,
      shadowRadius: 17,
      shadowOffset: { width: 0, height: 7 },
      elevation: 11,
    },
    gold: {
      shadowColor: '#FFD36F',
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 10,
    },
    card: {
      shadowColor: '#000000',
      shadowOpacity: 0.30,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    },
  },
};

export function getLootRarityFrame(rarity = 'common') {
  const key = String(rarity || 'common').toLowerCase();
  switch (key) {
    case 'legendary':
      return {
        label: 'LEGENDARY',
        glow: 'rgba(255,211,111,0.25)',
        accent: '#FFD36F',
        edge: 'rgba(255,240,185,0.58)',
        gradient: ['#4A2D08', '#24170C', '#09101A'],
        badge: ['#FFD36F', '#FF9D45'],
      };
    case 'epic':
      return {
        label: 'EPIC',
        glow: 'rgba(185,154,255,0.25)',
        accent: '#B99AFF',
        edge: 'rgba(235,226,255,0.50)',
        gradient: ['#35205B', '#1B1438', '#09101A'],
        badge: ['#C7B4FF', '#7656FF'],
      };
    case 'rare':
      return {
        label: 'RARE',
        glow: 'rgba(115,229,255,0.25)',
        accent: '#73E5FF',
        edge: 'rgba(211,248,255,0.50)',
        gradient: ['#0A4960', '#102A47', '#09101A'],
        badge: ['#8DEBFF', '#3187FF'],
      };
    case 'mythic':
      return {
        label: 'MYTHIC',
        glow: 'rgba(255,141,163,0.25)',
        accent: '#FF8DA3',
        edge: 'rgba(255,214,222,0.48)',
        gradient: ['#531B30', '#2A1025', '#09101A'],
        badge: ['#FFB1C1', '#E84D78'],
      };
    default:
      return {
        label: 'COMMON',
        glow: 'rgba(124,203,255,0.10)',
        accent: '#D4E4F4',
        edge: 'rgba(219,239,255,0.20)',
        gradient: ['#1A3046', '#102137', '#09101A'],
        badge: ['#E0EBF5', '#93A9BF'],
      };
  }
}

export const cityMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0D2031' }] },
  { elementType: 'geometry.fill', stylers: [{ color: '#0D2031' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#E1F0FB' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#081622' }, { lightness: -12 }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#173B54' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#20516E' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2B6887' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#D6E8F5' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#123044' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#C5DFED' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#173B52' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#071625' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#A7D5EB' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#E1EDF6' }] },
];
