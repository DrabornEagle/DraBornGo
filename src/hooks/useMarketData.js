import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  dkd_redeem_market_earned_points,
  cancelMarketListing,
  fetchMarketShopSnapshot,
  fetchMarketSnapshot,
} from '../services/marketService';

function prettyShopReason(dkd_reason_value) {
  const dkd_reason_key_value = String(dkd_reason_value || '').trim().toLowerCase();
  if (dkd_reason_key_value === 'invalid_kind' || dkd_reason_key_value === 'invalid_reward_kind') return 'Fiziksel hizmet puanı ürünü veritabanında eksik görünüyor. Market FIX SQL dosyasını çalıştırıp marketi kapat/aç yaptıktan sonra tekrar dene.';
  if (dkd_reason_key_value === 'not_enough_token') return 'Yeterli puan yok.';
  if (dkd_reason_key_value === 'energy_full') return 'Enerji zaten dolu.';
  if (dkd_reason_key_value === 'invalid_resource_target') return 'Ödül hedefi geçersiz görünüyor. Market Komuta içinden ödül türünü düzelt.';
  return dkd_reason_value || 'Fiziksel hizmet puanı işlemi tamamlanamadı';
}


function dkd_parse_shop_point_key(dkd_listing_id_value) {
  const dkd_raw_listing_key_value = String(dkd_listing_id_value || '');
  if (!dkd_raw_listing_key_value.startsWith('shop:')) return null;
  const dkd_listing_key_part_values = dkd_raw_listing_key_value.split(':');
  const dkd_pack_id_value = String(dkd_listing_key_part_values[1] || '').trim();
  const dkd_encoded_pack_key_value = String(dkd_listing_key_part_values[2] || '').trim();
  return {
    packId: dkd_pack_id_value,
    packKey: decodeURIComponent(dkd_encoded_pack_key_value),
  };
}

export function useMarketData({ sessionUserId, refreshProfile, loadCollection, onAchievementAction }) {
  const [marketLoading, setMarketLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [marketShopDefs, setMarketShopDefs] = useState([]);
  const [marketShopUi, setMarketShopUi] = useState(null);
  const marketCacheRef = useRef({ userId: '', listings: [], myListings: [], shopDefs: [], shopUi: null, loadedAt: 0 });
  const marketInflightRef = useRef(null);

  const MARKET_LISTINGS_LIMIT = 32;
  const MARKET_MY_LISTINGS_LIMIT = 16;
  const MARKET_CACHE_TTL_MS = 60 * 1000;

  const applyMarketState = useCallback((rows, mineRows, shopDefs, shopUi) => {
    setListings(rows || []);
    setMyListings(mineRows || []);
    setMarketShopDefs(Array.isArray(shopDefs) ? shopDefs : []);
    setMarketShopUi(shopUi || null);
  }, []);

  const loadMarket = useCallback(async (options = {}) => {
    if (!sessionUserId) {
      setListings([]);
      setMyListings([]);
      return { listings: [], myListings: [] };
    }

    const opts = typeof options === 'boolean' ? { force: options } : (options || {});
    const force = !!opts.force;
    const background = !!opts.background;
    const now = Date.now();
    const cached = marketCacheRef.current;

    if (
      !force &&
      cached.userId === sessionUserId &&
      Array.isArray(cached.listings) &&
      Array.isArray(cached.myListings) &&
      (now - cached.loadedAt) < MARKET_CACHE_TTL_MS
    ) {
      applyMarketState(cached.listings, cached.myListings, cached.shopDefs, cached.shopUi);
      return { listings: cached.listings, myListings: cached.myListings, shopDefs: cached.shopDefs, shopUi: cached.shopUi };
    }

    if (marketInflightRef.current) {
      return marketInflightRef.current;
    }

    const request = (async () => {
      if (!background) setMarketLoading(true);

      try {
        const [{ listingsRes, mineRes }, shopRes] = await Promise.all([
          fetchMarketSnapshot(sessionUserId, {
            listingsLimit: MARKET_LISTINGS_LIMIT,
            myListingsLimit: MARKET_MY_LISTINGS_LIMIT,
          }),
          fetchMarketShopSnapshot(),
        ]);
        const { data: l, error: le } = listingsRes;
        const { data: mine, error: me } = mineRes;
        if (le) throw le;
        if (me) throw me;
        if (shopRes?.error) throw shopRes.error;
        const nextListings = l || [];
        const nextMine = mine || [];
        const nextShopDefs = Array.isArray(shopRes?.data?.packs) ? shopRes.data.packs : [];
        const nextShopUi = shopRes?.data?.ui || null;
        marketCacheRef.current = {
          userId: sessionUserId,
          listings: nextListings,
          myListings: nextMine,
          shopDefs: nextShopDefs,
          shopUi: nextShopUi,
          loadedAt: Date.now(),
        };
        applyMarketState(nextListings, nextMine, nextShopDefs, nextShopUi);
        return { listings: nextListings, myListings: nextMine, shopDefs: nextShopDefs, shopUi: nextShopUi };
      } catch (dkd_error_value) {
        if (!background) {
          Alert.alert('Market', dkd_error_value?.message || String(dkd_error_value));
        } else {
          console.log('[DraBornGo][market][preload]', dkd_error_value?.message || String(dkd_error_value));
        }
        return { listings: [], myListings: [], shopDefs: [], shopUi: null };
      } finally {
        if (!background) setMarketLoading(false);
      }
    })();

    marketInflightRef.current = request;
    try {
      return await request;
    } finally {
      if (marketInflightRef.current === request) {
        marketInflightRef.current = null;
      }
    }
  }, [MARKET_CACHE_TTL_MS, MARKET_LISTINGS_LIMIT, MARKET_MY_LISTINGS_LIMIT, applyMarketState, sessionUserId]);

  const listCardForSale = useCallback(async () => {
    Alert.alert('Market', 'Kart satış/ilan akışı mağaza sürümünde kapalıdır. Puan yalnızca fiziksel hizmet ve teslimat akışlarında kullanılır.');
  }, []);

  const cancelListing = useCallback(async (listingId) => {
    try {
      const { error } = await cancelMarketListing(listingId);
      if (error) throw error;
      Alert.alert('Market', 'İlan kaldırıldı.');
      await loadMarket({ force: true });
    } catch (dkd_error_value) {
      Alert.alert('Market', dkd_error_value?.message || String(dkd_error_value));
    }
  }, [loadMarket]);

  const buyListing = useCallback(async (listingId) => {
    try {
      const dkd_shop_point_key_value = dkd_parse_shop_point_key(listingId);
      if (dkd_shop_point_key_value) {
        const dkd_pack_key_value = String(dkd_shop_point_key_value?.packKey || '').trim();
        if (!dkd_pack_key_value.startsWith('merchant_product:')) {
          Alert.alert('Market', 'Koleksiyon, enerji veya özel kart satışları mağaza sürümünde kapalıdır. Kazanılmış puan yalnızca fiziksel hizmet ve teslimat akışlarında kullanılır.');
          return;
        }
        const { data, error } = await dkd_redeem_market_earned_points(dkd_shop_point_key_value);
        if (error) throw error;
        if (data?.ok) {
          Alert.alert('Fiziksel Sipariş', `${data?.spent_points || 0} kazanılmış hizmet puanı kullanıldı.
Fiziksel teslimat siparişi oluşturuldu.`);
          await Promise.all([refreshProfile?.(), loadMarket({ force: true }), loadCollection?.({ force: true })]);
        } else {
          Alert.alert('Fiziksel Sipariş', prettyShopReason(data?.reason));
        }
        return;
      }

      Alert.alert('Market', 'Kart market ve puanla dijital takas akışı mağaza sürümünde kapalıdır.');
    } catch (dkd_error_value) {
      Alert.alert('Market', dkd_error_value?.message || String(dkd_error_value));
    }
  }, [refreshProfile, loadCollection, loadMarket]);

  return {
    marketLoading,
    listings,
    myListings,
    marketShopDefs,
    marketShopUi,
    loadMarket,
    listCardForSale,
    cancelListing,
    buyListing,
  };
}
