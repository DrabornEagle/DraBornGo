import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  craftBossTicketFromShards,
  craftCardWithShards,
  exchangeShardsForReward,
  fetchUserCollection,
  recycleDuplicateCards,
  upgradeCardWithShards,
} from '../services/collectionService';
import { formatInt, trRarity } from '../utils/text';

export function useCollectionActions({
  sessionUserId,
  refreshProfile,
  loadHistory,
  onAchievementAction,
}) {
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionCards, setCollectionCards] = useState([]);
  const [userCardsRaw, setUserCardsRaw] = useState([]);
  const [recycleLoading, setRecycleLoading] = useState(false);
  const [shardExchangeLoading, setShardExchangeLoading] = useState('');
  const [shardCraftLoading, setShardCraftLoading] = useState('');
  const [shardUpgradeLoading, setShardUpgradeLoading] = useState('');
  const [bossTicketLoading, setBossTicketLoading] = useState(false);
  const collectionCacheRef = useRef({ userId: '', data: [], loadedAt: 0 });
  const collectionInflightRef = useRef(null);

  const COLLECTION_LIMIT = 120;
  const COLLECTION_CACHE_TTL_MS = 90 * 1000;

  const applyCollectionState = useCallback((rows) => {
    const nextRows = rows || [];
    setCollectionCards(nextRows);
    setUserCardsRaw(nextRows);
  }, []);

  const loadCollection = useCallback(async (options = {}) => {
    if (!sessionUserId) return [];
    const opts = typeof options === 'boolean' ? { force: options } : (options || {});
    const force = !!opts.force;
    const background = !!opts.background;
    const now = Date.now();
    const cached = collectionCacheRef.current;

    if (
      !force &&
      cached.userId === sessionUserId &&
      Array.isArray(cached.data) &&
      cached.data.length &&
      (now - cached.loadedAt) < COLLECTION_CACHE_TTL_MS
    ) {
      applyCollectionState(cached.data);
      return cached.data;
    }

    if (collectionInflightRef.current) {
      return collectionInflightRef.current;
    }

    const request = (async () => {
      if (!background) setCollectionLoading(true);

      try {
        const { data, error } = await fetchUserCollection(COLLECTION_LIMIT);
        if (error) throw error;
        const rows = data || [];
        collectionCacheRef.current = {
          userId: sessionUserId,
          data: rows,
          loadedAt: Date.now(),
        };
        applyCollectionState(rows);
        return rows;
      } catch (dkd_error_value) {
        if (!background) {
          Alert.alert('Koleksiyon Hatası', dkd_error_value?.message || String(dkd_error_value));
        } else {
          console.log('[DraBornGo][collection][preload]', dkd_error_value?.message || String(dkd_error_value));
        }
        return [];
      } finally {
        if (!background) setCollectionLoading(false);
      }
    })();

    collectionInflightRef.current = request;
    try {
      return await request;
    } finally {
      if (collectionInflightRef.current === request) {
        collectionInflightRef.current = null;
      }
    }
  }, [COLLECTION_CACHE_TTL_MS, COLLECTION_LIMIT, applyCollectionState, sessionUserId]);

  const recycleDuplicatesAll = useCallback(async () => {
    if (!sessionUserId) return Alert.alert('Koleksiyon Puanı', 'Giriş yapmalısın.');
    setRecycleLoading(true);
    try {
      const { data, error } = await recycleDuplicateCards();
      if (error) throw error;

      if (data?.ok) {
        Alert.alert(
          'Koleksiyon Puanı',
          `+${formatInt(data?.gained_shards || 0)} koleksiyon puanı kazandın.\n${formatInt(data?.recycled_cards || 0)} fazlalık kart koleksiyon puanına çevrildi.`
        );
      } else {
        Alert.alert('Koleksiyon Puanı', data?.reason === 'duplicate_not_found' ? 'Parçalanabilir kopya kart yok.' : (data?.reason || 'Başarısız'));
      }

      const recycleCount = Math.max(1, Number(data?.recycled_cards || 1));
      await onAchievementAction?.('recycleDuplicate', recycleCount);
      await Promise.all([refreshProfile(), loadCollection({ force: true }), loadHistory()]);
    } catch (dkd_error_value) {
      const msg = String(dkd_error_value?.message || dkd_error_value);
      if (msg.toLowerCase().includes('dkd_recycle_duplicates_all')) {
        Alert.alert('Koleksiyon Puanı', 'DB V18 gerekli: koleksiyon puanı recycle RPC bulunamadı.');
      } else {
        Alert.alert('Koleksiyon Puanı', msg);
      }
    } finally {
      setRecycleLoading(false);
    }
  }, [loadCollection, loadHistory, onAchievementAction, refreshProfile, sessionUserId]);

  const exchangeShards = useCallback(async (kind = 'token_100') => {
    if (!sessionUserId) return Alert.alert('Koleksiyon Dükkanı', 'Giriş yapmalısın.');
    setShardExchangeLoading(kind);
    try {
      const { data, error } = await exchangeShardsForReward(kind);
      if (error) throw error;

      if (data?.ok) {
        const parts = [];
        if (Number(data?.reward_token || 0) > 0) parts.push(`+${formatInt(data.reward_token)} puan`);
        if (Number(data?.reward_energy || 0) > 0) parts.push(`+${formatInt(data.reward_energy)} enerji depolandı`);
        Alert.alert('Koleksiyon Dükkanı', `${formatInt(data?.spent_shards || 0)} koleksiyon puanı harcandı.\n${parts.join(' • ') || 'Takasa çevrildi.'}`);
      } else {
        const reason = String(data?.reason || '');
        const pretty =
          reason === 'not_enough_shards' ? 'Yeterli koleksiyon puanı yok.' :
          reason === 'invalid_kind' ? 'Geçersiz koleksiyon paketi.' :
          (data?.reason || 'Başarısız');
        Alert.alert('Koleksiyon Dükkanı', pretty);
      }

      await Promise.all([refreshProfile(), loadHistory()]);
    } catch (dkd_error_value) {
      const msg = String(dkd_error_value?.message || dkd_error_value);
      if (msg.toLowerCase().includes('dkd_shard_exchange')) {
        Alert.alert('Koleksiyon Dükkanı', 'DB V18 gerekli: koleksiyon puanı exchange RPC bulunamadı.');
      } else {
        Alert.alert('Koleksiyon Dükkanı', msg);
      }
    } finally {
      setShardExchangeLoading('');
    }
  }, [loadHistory, refreshProfile, sessionUserId]);

  const craftShardCard = useCallback(async (rarity = 'rare') => {
    if (!sessionUserId) return Alert.alert('Koleksiyon Forge', 'Giriş yapmalısın.');
    setShardCraftLoading(rarity);
    try {
      const { data, error } = await craftCardWithShards(rarity);
      if (error) throw error;

      if (data?.ok) {
        Alert.alert(
          'Koleksiyon Forge',
          `-${formatInt(data?.spent_shards || 0)} koleksiyon puanı\nYeni kart: ${data?.card_name || 'Bilinmeyen Kart'}\nRarity: ${trRarity(data?.rarity || rarity)}`
        );
      } else {
        const reason = String(data?.reason || '');
        const pretty =
          reason === 'not_enough_shards' ? 'Yeterli koleksiyon puanı yok.' :
          reason === 'invalid_rarity' ? 'Bu rarity üretilemez.' :
          reason === 'card_pool_empty' ? 'Bu rarity için aktif kart havuzu boş.' :
          (data?.reason || 'Üretim başarısız');
        Alert.alert('Koleksiyon Forge', pretty);
      }

      await onAchievementAction?.('shardCraft', 1);
      await Promise.all([refreshProfile(), loadCollection({ force: true })]);
    } catch (dkd_error_value) {
      const msg = String(dkd_error_value?.message || dkd_error_value);
      if (msg.toLowerCase().includes('dkd_shard_craft')) {
        Alert.alert('Koleksiyon Forge', 'DB V19 gerekli: koleksiyon craft RPC bulunamadı.');
      } else {
        Alert.alert('Koleksiyon Forge', msg);
      }
    } finally {
      setShardCraftLoading('');
    }
  }, [loadCollection, onAchievementAction, refreshProfile, sessionUserId]);

  const upgradeShardCard = useCallback(async (fromRarity = 'common') => {
    if (!sessionUserId) return Alert.alert('Upgrade Forge', 'Giriş yapmalısın.');
    setShardUpgradeLoading(fromRarity);
    try {
      const { data, error } = await upgradeCardWithShards(fromRarity);
      if (error) throw error;

      if (data?.ok) {
        Alert.alert(
          'Upgrade Forge',
          `Yakılan: ${data?.burned_card_name || trRarity(fromRarity)}\nYeni kart: ${data?.card_name || 'Bilinmeyen Kart'}\nYeni rarity: ${trRarity(data?.to_rarity || 'rare')}`
        );
      } else {
        const reason = String(data?.reason || '');
        const pretty =
          reason === 'not_enough_shards' ? 'Yeterli koleksiyon puanı yok.' :
          reason === 'no_source_card' ? 'Yükseltmek için bu rarity’de kartın yok.' :
          reason === 'invalid_from_rarity' ? 'Bu rarity yükseltilemez.' :
          reason === 'target_pool_empty' ? 'Bir üst rarity için aktif kart havuzu boş.' :
          (data?.reason || 'Upgrade başarısız');
        Alert.alert('Upgrade Forge', pretty);
      }

      await onAchievementAction?.('shardUpgrade', 1);
      await Promise.all([refreshProfile(), loadCollection({ force: true })]);
    } catch (dkd_error_value) {
      const msg = String(dkd_error_value?.message || dkd_error_value);
      if (msg.toLowerCase().includes('dkd_shard_upgrade_random')) {
        Alert.alert('Upgrade Forge', 'DB V19 gerekli: koleksiyon upgrade RPC bulunamadı.');
      } else {
        Alert.alert('Upgrade Forge', msg);
      }
    } finally {
      setShardUpgradeLoading('');
    }
  }, [loadCollection, onAchievementAction, refreshProfile, sessionUserId]);

  const craftBossTicket = useCallback(async () => {
    if (!sessionUserId) return Alert.alert('Özel Kart', 'Giriş yapmalısın.');
    setBossTicketLoading(true);
    try {
      const { data, error } = await craftBossTicketFromShards();
      if (error) throw error;

      if (data?.ok) {
        Alert.alert(
          'Özel Kart',
          `-${formatInt(data?.spent_shards || 0)} koleksiyon puanı\n+${formatInt(data?.gained_tickets || 1)} özel kart\nToplam özel kart: ${formatInt(data?.boss_tickets || 0)}`
        );
      } else {
        const reason = String(data?.reason || '');
        const pretty = reason === 'not_enough_shards' ? 'Özel Kart üretmek için yeterli koleksiyon puanı yok.' : (data?.reason || 'Üretim başarısız');
        Alert.alert('Özel Kart', pretty);
      }

      const craftedTickets = Math.max(1, Number(data?.gained_tickets || 1));
      await onAchievementAction?.('bossTicketCraft', craftedTickets);
      await refreshProfile();
    } catch (dkd_error_value) {
      const msg = String(dkd_error_value?.message || dkd_error_value);
      if (msg.toLowerCase().includes('dkd_craft_boss_ticket')) {
        Alert.alert('Özel Kart', 'Veritabanı özel kart üretim RPC akışı bulunamadı.');
      } else {
        Alert.alert('Özel Kart', msg);
      }
    } finally {
      setBossTicketLoading(false);
    }
  }, [onAchievementAction, refreshProfile, sessionUserId]);

  return {
    collectionLoading,
    collectionCards,
    userCardsRaw,
    recycleLoading,
    shardExchangeLoading,
    shardCraftLoading,
    shardUpgradeLoading,
    bossTicketLoading,
    loadCollection,
    recycleDuplicatesAll,
    exchangeShards,
    craftShardCard,
    upgradeShardCard,
    craftBossTicket,
  };
}

export default useCollectionActions;
