import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import { rankFromLevel, xpToReachLevel } from '../../utils/progression';
import { cityLootTheme } from '../../theme/cityLootTheme';

const BLANK = {
  user_id: '', nickname: '', avatar_emoji: '🦅', wallet_tl: '0', dkd_wallet_add_tl: '0', puan: '0', dkd_collection_puan: '0', boss_tickets: '0', energy: '0', energy_max: '0', xp: '0', level: '1', rank_key: 'rookie', courier_status: 'none', dkd_logistics_status: 'none', courier_score: '0', courier_completed_jobs: '0',
};

function toDraft(user) {
  if (!user) return BLANK;
  return {
    user_id: String(user.user_id || ''),
    nickname: String(user.nickname || ''),
    avatar_emoji: String(user.avatar_emoji || '🦅'),
    wallet_tl: String(user.wallet_tl ?? 0),
    dkd_wallet_add_tl: '0',
    puan: String(user.puan ?? 0),
    dkd_collection_puan: String(user?.[['shar', 'ds'].join('')] ?? 0),
    boss_tickets: String(user.boss_tickets ?? 0),
    energy: String(user.energy ?? 0),
    energy_max: String(user.energy_max ?? 0),
    xp: String(user.xp ?? 0),
    level: String(user.level ?? 1),
    rank_key: String(user.rank_key || 'rookie'),
    courier_status: String(user.courier_status || 'none'),
    dkd_logistics_status: String(user.dkd_logistics_status || user.logistics_status || 'none'),
    courier_score: String(user.courier_score ?? 0),
    courier_completed_jobs: String(user.courier_completed_jobs ?? 0),
  };
}

function StatCard({ label, value, accent = cityLootTheme.colors.cyanSoft }) {
  return (
    <View style={dkd_styles.statCard}>
      <Text style={dkd_styles.statLabel}>{label}</Text>
      <Text style={[dkd_styles.statValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, multiline = false, keyboardType = 'default' }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={dkd_styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor="rgba(232,244,255,0.35)"
        style={[dkd_styles.input, multiline && dkd_styles.textarea]}
      />
    </View>
  );
}

export default function AdminUsersModal({ visible, onClose, loading, users, search, setSearch, onRefresh, onSave }) {
  const [draft, setDraft] = useState(BLANK);
  const [editingId, setEditingId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setEditingId('');
    setDraft(BLANK);
    onRefresh?.('');
  }, [onRefresh, visible]);

  const filtered = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const stats = useMemo(() => ({
    total: filtered.length,
    courier: filtered.filter((dkd_user_value) => String(dkd_user_value?.courier_status || 'none') === 'approved').length,
    logistics: filtered.filter((dkd_user_value) => String(dkd_user_value?.dkd_logistics_status || dkd_user_value?.logistics_status || 'none') === 'approved').length,
    avgLevel: filtered.length ? Math.round(filtered.reduce((sum, dkd_user_value) => sum + Number(dkd_user_value?.level || 1), 0) / filtered.length) : 0,
  }), [filtered]);

  function pickUser(user) {
    setEditingId(String(user.user_id));
    setDraft(toDraft(user));
  }

  function resetDraft() {
    setEditingId('');
    setDraft(BLANK);
  }

  async function handleSave() {
    if (!draft.user_id) return Alert.alert('Admin', 'Önce bir kullanıcı seç.');

    const desiredLevel = Math.max(1, Number(draft.level || 1));
    const minXpForLevel = xpToReachLevel(desiredLevel);
    const maxXpForLevel = xpToReachLevel(desiredLevel + 1) - 1;
    const rawXp = Math.max(0, Number(draft.xp || 0));
    const syncedXp = Math.max(minXpForLevel, Math.min(rawXp, maxXpForLevel));
    const syncedRank = rankFromLevel(desiredLevel).key;
    const dkd_wallet_base_tl_value = Math.max(0, Number(draft.wallet_tl || 0));
    const dkd_wallet_add_tl_value = Math.max(0, Number(draft.dkd_wallet_add_tl || 0));
    const dkd_wallet_target_tl_value = Math.round((dkd_wallet_base_tl_value + dkd_wallet_add_tl_value) * 100) / 100;

    setSaving(true);
    try {
      await onSave?.({
        user_id: draft.user_id,
        nickname: String(draft.nickname || '').trim(),
        avatar_emoji: String(draft.avatar_emoji || '🦅').trim() || '🦅',
        puan: Number(draft.puan || 0),
        dkd_collection_puan: Number(draft.dkd_collection_puan || 0),
        boss_tickets: Number(draft.boss_tickets || 0),
        energy: Number(draft.energy || 0),
        energy_max: Number(draft.energy_max || 0),
        xp: syncedXp,
        level: desiredLevel,
        rank_key: syncedRank,
        courier_status: String(draft.courier_status || 'none').trim() || 'none',
        dkd_logistics_status: String(draft.dkd_logistics_status || 'none').trim() || 'none',
        courier_score: Number(draft.courier_score || 0),
        courier_completed_jobs: Number(draft.courier_completed_jobs || 0),
        wallet_tl: dkd_wallet_target_tl_value,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide">
      <SafeScreen style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#050812', '#0B1425', '#090E18']} style={{ flex: 1 }}>
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => `${String(item?.user_id ?? 'user')}-${index}`}
            renderItem={({ item }) => {
              const selected = editingId === String(item.user_id);
              return (
                <Pressable style={[dkd_styles.userCard, selected && dkd_styles.userCardOn]} onPress={() => pickUser(item)}>
                  <LinearGradient colors={selected ? ['rgba(103,227,255,0.16)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']} style={dkd_styles.userFill}>
                    <View style={dkd_styles.avatarShell}><Text style={dkd_styles.userEmoji}>{item.avatar_emoji || '🦅'}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={dkd_styles.userName}>{item.nickname || 'İsimsiz Oyuncu'}</Text>
                      <Text style={dkd_styles.userMeta}>{item.user_id}</Text>
                      <Text style={dkd_styles.userMeta}>Lv {item.level || 1} • Cüzdan {Number(item.wallet_tl || 0).toLocaleString('tr-TR')} TL • Kurye {item.courier_status || 'none'} • Nakliye {item.dkd_logistics_status || item.logistics_status || 'none'}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={cityLootTheme.colors.textMuted} />
                  </LinearGradient>
                </Pressable>
              );
            }}
            ListHeaderComponent={(
              <View style={dkd_styles.pagePad}>
                <View style={dkd_styles.headerRow}>
                  <View style={dkd_styles.headerCopy}>
                    <Text style={dkd_styles.kicker}>PLAYER CONTROL</Text>
                    <Text style={dkd_styles.title}>Oyuncu Kontrol Masası</Text>
                    <Text style={dkd_styles.sub}>Oyuncu ekonomisi, seviye, enerji ve kurye statülerini tek kontrol ekranından düzenle.</Text>
                  </View>
                  <SecondaryButton label="Kapat" onPress={onClose} size="compact" fullWidth={false} style={dkd_styles.headerButton} />
                </View>

                <View style={dkd_styles.heroPanel}>
                  <View style={dkd_styles.heroGlowBlue} />
                  <View style={dkd_styles.heroGlowGold} />
                  <Text style={dkd_styles.heroTitle}>Canlı oyuncu kontrolü</Text>
                  <Text style={dkd_styles.heroSub}>Arama yap, oyuncuyu seç, değerleri düzenle ve ekonomik dengeyi hızlıca güncelle.</Text>
                  <View style={dkd_styles.statsRow}>
                    <StatCard label="OYUNCU" value={String(stats.total)} />
                    <StatCard label="KURYE" value={String(stats.courier)} accent={cityLootTheme.colors.goldSoft} />
                    <StatCard label="NAKLİYE" value={String(stats.logistics)} accent={cityLootTheme.colors.purple} />
                    <StatCard label="ORT LV" value={String(stats.avgLevel)} accent={cityLootTheme.colors.green} />
                  </View>
                </View>

                <View style={dkd_styles.panel}>
                  <Text style={dkd_styles.sectionTitle}>Oyuncu Ara</Text>
                  <Text style={dkd_styles.helper}>Nickname veya user_id ile hedef oyuncuyu filtrele.</Text>
                  <View style={dkd_styles.searchRow}>
                    <TextInput
                      value={search}
                      onChangeText={setSearch}
                      placeholder="örn: DrabornEagle veya uuid"
                      placeholderTextColor="rgba(232,244,255,0.35)"
                      style={[dkd_styles.input, { flex: 1, marginTop: 0 }]}
                    />
                    <SecondaryButton label="Ara" onPress={() => onRefresh?.(search)} size="compact" fullWidth={false} style={dkd_styles.rowButton} />
                  </View>
                  {!loading ? <Text style={dkd_styles.helper}>Bulunan kullanıcı: {filtered.length}</Text> : <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />}
                </View>

                <View style={[dkd_styles.panel, { marginTop: 12 }]}> 
                  <View style={dkd_styles.sectionRow}>
                    <Text style={dkd_styles.sectionTitle}>{editingId ? 'Oyuncu Kaydını Düzenle' : 'Oyuncu Seç'}</Text>
                    <SecondaryButton label="Sıfırla" onPress={resetDraft} size="compact" fullWidth={false} style={dkd_styles.rowButton} />
                  </View>
                  <View style={dkd_styles.twoCol}>
                    <View style={{ flex: 2 }}><Field label="user_id" value={draft.user_id} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, user_id: dkd_value }))} /></View>
                    <View style={{ flex: 1 }}><Field label="Avatar" value={draft.avatar_emoji} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, avatar_emoji: dkd_value }))} /></View>
                  </View>
                  <Field label="Nickname" value={draft.nickname} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, nickname: dkd_value }))} />
                  <View style={dkd_styles.twoCol}>
                    <View style={{ flex: 1 }}><Field label="Level" value={draft.level} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, level: dkd_value }))} keyboardType="number-pad" /></View>
                    <View style={{ flex: 1 }}><Field label="XP" value={draft.xp} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, xp: dkd_value }))} keyboardType="number-pad" /></View>
                  </View>
                  <View style={dkd_styles.twoCol}>
                    <View style={{ flex: 1 }}><Field label="Cüzdan TL" value={draft.wallet_tl} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, wallet_tl: dkd_value }))} keyboardType="decimal-pad" /></View>
                    <View style={{ flex: 1 }}><Field label="+ Ekle TL" value={draft.dkd_wallet_add_tl} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, dkd_wallet_add_tl: dkd_value }))} keyboardType="decimal-pad" /></View>
                  </View>
                  <Text style={dkd_styles.helper}>+ Ekle TL alanı, mevcut Cüzdan TL üzerine eklenir; boş/0 bırakırsan sadece Cüzdan TL değeri kaydedilir.</Text>
                  <View style={dkd_styles.twoCol}>
                    <View style={{ flex: 1 }}><Field label="Puan" value={draft.puan} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, puan: dkd_value }))} keyboardType="number-pad" /></View>
                    <View style={{ flex: 1 }}><Field label="Koleksiyon Puanı" value={draft.dkd_collection_puan} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, dkd_collection_puan: dkd_value }))} keyboardType="number-pad" /></View>
                  </View>
                  <View style={dkd_styles.twoCol}>
                    <View style={{ flex: 1 }}><Field label="Özel Kart" value={draft.boss_tickets} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, boss_tickets: dkd_value }))} keyboardType="number-pad" /></View>
                    <View style={{ flex: 1 }}><Field label="Energy" value={draft.energy} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, energy: dkd_value }))} keyboardType="number-pad" /></View>
                  </View>
                  <View style={dkd_styles.twoCol}>
                    <View style={{ flex: 1 }}><Field label="Energy Max" value={draft.energy_max} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, energy_max: dkd_value }))} keyboardType="number-pad" /></View>
                    <View style={{ flex: 1 }}><Field label="Courier Score" value={draft.courier_score} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, courier_score: dkd_value }))} keyboardType="number-pad" /></View>
                  </View>
                  <View style={dkd_styles.twoCol}>
                    <View style={{ flex: 1 }}><Field label="Kurye Lisansı" value={draft.courier_status} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, courier_status: dkd_value }))} /></View>
                    <View style={{ flex: 1 }}><Field label="Nakliyeci Lisansı" value={draft.dkd_logistics_status} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, dkd_logistics_status: dkd_value }))} /></View>
                  </View>
                  <View style={dkd_styles.statusQuickRow}>
                    {['none', 'pending', 'approved', 'rejected'].map((dkd_status_key_value) => (
                      <Pressable key={`dkd-logistics-${dkd_status_key_value}`} onPress={() => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, dkd_logistics_status: dkd_status_key_value }))} style={[dkd_styles.statusQuickChip, draft.dkd_logistics_status === dkd_status_key_value && dkd_styles.statusQuickChipOn]}>
                        <Text style={[dkd_styles.statusQuickText, draft.dkd_logistics_status === dkd_status_key_value && dkd_styles.statusQuickTextOn]}>{dkd_status_key_value}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={dkd_styles.twoCol}>
                    <View style={{ flex: 1 }}><Field label="Courier Completed" value={draft.courier_completed_jobs} onChangeText={(dkd_value) => setDraft((dkd_user_draft) => ({ ...dkd_user_draft, courier_completed_jobs: dkd_value }))} keyboardType="number-pad" /></View>
                  </View>
                  <View style={{ marginTop: 14 }}>{saving ? <ActivityIndicator color="#fff" /> : <PrimaryButton label="Kaydet" onPress={handleSave} />}</View>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 36, paddingHorizontal: 16 }}
            keyboardShouldPersistTaps="handled"
          />
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const dkd_styles = StyleSheet.create({
  pagePad: { paddingTop: 10, paddingBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  headerCopy: { flex: 1, minWidth: 0, paddingRight: 6 },
  headerButton: { alignSelf: 'flex-start', flexShrink: 0 },
  rowButton: { alignSelf: 'flex-start', flexShrink: 0 },
  kicker: { color: cityLootTheme.colors.goldSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: cityLootTheme.colors.text, fontSize: 26, fontWeight: '900', marginTop: 4 },
  sub: { color: cityLootTheme.colors.textSoft, fontSize: 13, lineHeight: 18, marginTop: 6 },
  heroPanel: { borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 12 },
  heroGlowBlue: { position: 'absolute', width: 220, height: 220, borderRadius: 999, backgroundColor: 'rgba(103,227,255,0.12)', top: -60, right: -30 },
  heroGlowGold: { position: 'absolute', width: 180, height: 180, borderRadius: 999, backgroundColor: 'rgba(246,181,78,0.10)', bottom: -40, left: -40 },
  heroTitle: { color: cityLootTheme.colors.text, fontSize: 22, fontWeight: '900' },
  heroSub: { color: cityLootTheme.colors.textSoft, lineHeight: 18, marginTop: 6 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  statCard: { flexGrow: 1, flexBasis: '45%', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(7,12,22,0.64)', padding: 12 },
  statLabel: { color: cityLootTheme.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  statValue: { color: cityLootTheme.colors.text, fontSize: 18, fontWeight: '900', marginTop: 6 },
  panel: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.05)', padding: 14 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { color: cityLootTheme.colors.text, fontSize: 18, fontWeight: '900' },
  helper: { color: cityLootTheme.colors.textSoft, marginTop: 8, fontSize: 12 },
  searchRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  label: { color: cityLootTheme.colors.textMuted, fontSize: 12, fontWeight: '800', marginTop: 12 },
  input: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.05)', color: cityLootTheme.colors.text, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8 },
  textarea: { minHeight: 108, textAlignVertical: 'top' },
  statusQuickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  statusQuickChip: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8 },
  statusQuickChipOn: { backgroundColor: cityLootTheme.colors.cyanSoft, borderColor: cityLootTheme.colors.cyanSoft },
  statusQuickText: { color: cityLootTheme.colors.textSoft, fontSize: 11, fontWeight: '900' },
  statusQuickTextOn: { color: '#04111C' },
  twoCol: { flexDirection: 'row', gap: 10 },
  userCard: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginTop: 10 },
  userCardOn: { borderColor: 'rgba(103,227,255,0.30)' },
  userFill: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatarShell: { width: 52, height: 52, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  userEmoji: { fontSize: 26 },
  userName: { color: cityLootTheme.colors.text, fontSize: 16, fontWeight: '900' },
  userMeta: { color: cityLootTheme.colors.textSoft, fontSize: 11, lineHeight: 16, marginTop: 4 },
});
