const colors = {
  bg: '#020611',
  bgSoft: '#08172C',
  panel: 'rgba(6, 18, 38, 0.97)',
  panel2: 'rgba(10, 30, 56, 0.97)',
  panel3: 'rgba(29, 28, 69, 0.97)',
  line: 'rgba(129,210,255,0.13)',
  lineStrong: 'rgba(172,224,255,0.27)',
  text: '#F8FCFF',
  soft: 'rgba(240,248,255,0.80)',
  textSoft: 'rgba(240,248,255,0.80)',
  muted: 'rgba(232,243,255,0.56)',
  textMuted: 'rgba(232,243,255,0.56)',
  cyan: '#73E5FF',
  cyanSoft: '#D3F8FF',
  cyanDeep: '#3187FF',
  blue: '#3B82F6',
  gold: '#FFD36F',
  goldDeep: '#FF9D45',
  goldSoft: '#FFF0B9',
  green: '#5CE5B0',
  purple: '#B99AFF',
  red: '#FF8DA3',
};

export const minimalLootUi = {
  ...colors,
  colors,
  radius: {
    xl: 30,
    lg: 24,
    md: 19,
    sm: 15,
    pill: 999,
  },
};

export function formatNum(value) {
  return Number(value || 0).toLocaleString('tr-TR');
}

export function rarityAccent(rarity) {
  const key = String(rarity || 'common').toLowerCase();
  if (key === 'mythic') {
    return {
      label: 'MİTİK',
      text: '#FFDCE4',
      color: '#FF7CA7',
      bg: 'rgba(255,124,167,0.15)',
      border: 'rgba(255,124,167,0.34)',
      gradient: ['#57162E', '#230D1C'],
    };
  }
  if (key === 'legendary') {
    return {
      label: 'EFSANEVİ',
      text: '#FFF2C8',
      color: '#FFD36F',
      bg: 'rgba(255,211,111,0.18)',
      border: 'rgba(255,211,111,0.38)',
      gradient: ['#4B3008', '#211309'],
    };
  }
  if (key === 'epic') {
    return {
      label: 'EPİK',
      text: '#F1EAFF',
      color: '#B99AFF',
      bg: 'rgba(185,154,255,0.18)',
      border: 'rgba(185,154,255,0.34)',
      gradient: ['#38215A', '#170E31'],
    };
  }
  if (key === 'rare') {
    return {
      label: 'NADİR',
      text: '#DDF9FF',
      color: '#73E5FF',
      bg: 'rgba(115,229,255,0.18)',
      border: 'rgba(115,229,255,0.34)',
      gradient: ['#0A4960', '#0A1C31'],
    };
  }
  return {
    label: 'YAYGIN',
    text: '#F0F6FF',
    color: '#D1DFED',
    bg: 'rgba(157,211,255,0.07)',
    border: 'rgba(192,224,255,0.15)',
    gradient: ['#1D3145', '#0D1727'],
  };
}

export function dropAccent(drop = {}) {
  const type = String(drop?.type || '').toLowerCase();
  const name = String(drop?.name || '').toLowerCase();

  if (type === 'boss' || type.includes('boss')) {
    return { icon: 'crown-outline', tone: 'boss', title: 'Özel Hedef', color: '#FFD36F', bg: 'rgba(255,211,111,0.18)', border: 'rgba(255,211,111,0.34)' };
  }
  if (type === 'qr') {
    return { icon: 'qrcode-scan', tone: 'qr', title: 'QR', color: '#73E5FF', bg: 'rgba(115,229,255,0.18)', border: 'rgba(115,229,255,0.34)' };
  }
  if (name.includes('metro')) {
    return { icon: 'train', tone: 'metro', title: 'Metro', color: '#9AD6FF', bg: 'rgba(154,214,255,0.16)', border: 'rgba(154,214,255,0.31)' };
  }
  if (name.includes('park')) {
    return { icon: 'tree-outline', tone: 'park', title: 'Park', color: '#5CE5B0', bg: 'rgba(92,229,176,0.16)', border: 'rgba(92,229,176,0.31)' };
  }
  if (name.includes('cafe') || name.includes('kafe')) {
    return { icon: 'coffee-outline', tone: 'cafe', title: 'Cafe', color: '#FFD36F', bg: 'rgba(255,211,111,0.16)', border: 'rgba(255,211,111,0.31)' };
  }
  return { icon: 'map-marker-outline', tone: 'nav', title: 'Konum', color: '#7DE6FF', bg: 'rgba(125,230,255,0.12)', border: 'rgba(125,230,255,0.25)' };
}

export function cardFromEntry(entry = {}) {
  if (entry?.card) {
    return {
      ...entry.card,
      art_image_url: entry?.card?.art_image_url || entry?.card_art_image_url || '',
      serial_code: entry?.card?.serial_code || entry?.card_serial_code || '',
    };
  }
  return {
    name: entry?.card_name,
    series: entry?.card_series,
    rarity: entry?.card_rarity,
    theme: entry?.card_theme,
    art_image_url: entry?.card_art_image_url,
    serial_code: entry?.card_serial_code,
  };
}

export function clampPct(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}
