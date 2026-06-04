import { useCallback, useMemo } from 'react';
import { dayKey } from '../utils/date';
import { getDropDistanceState, getDropPriority, haversineMeters } from '../utils/geo';

export function useDropHelpers(dkd_location_value, dkd_user_drops_value, dkd_tick_value) {
  const isNear = useCallback((dkd_drop_value) => {
    if (dkd_drop_value?.lat == null || dkd_drop_value?.lng == null) return { ok: true, distance: null };
    if (!dkd_location_value) return { ok: false, distance: null };
    const dkd_distance_value = haversineMeters(dkd_location_value.lat, dkd_location_value.lng, dkd_drop_value.lat, dkd_drop_value.lng);
    return { ok: dkd_distance_value <= dkd_drop_value.radius_m, distance: dkd_distance_value };
  }, [dkd_location_value]);

  const getCooldown = useCallback((dkd_drop_value) => {
    void dkd_tick_value;
    const dkd_last_opened_at_value = dkd_user_drops_value[String(dkd_drop_value.id)];
    if (!dkd_last_opened_at_value) return { isCooldown: false, remainSec: 0, nextAt: null };

    const dkd_next_ms_value = new Date(dkd_last_opened_at_value).getTime() + (dkd_drop_value.cooldown_seconds || 0) * 1000;
    const dkd_remain_ms_value = dkd_next_ms_value - Date.now();
    return dkd_remain_ms_value > 0
      ? { isCooldown: true, remainSec: dkd_remain_ms_value / 1000, nextAt: new Date(dkd_next_ms_value).toISOString() }
      : { isCooldown: false, remainSec: 0, nextAt: null };
  }, [dkd_tick_value, dkd_user_drops_value]);

  return { isNear, getCooldown };
}

export function useDropDerived({
  drops: dkd_drops_value,
  bossState: dkd_boss_state_value,
  activeDropId: dkd_active_drop_id_value,
  isNear: dkd_is_near_value,
  getCooldown: dkd_get_cooldown_value,
}) {
  const hiddenBossIdsToday = useMemo(() => {
    if (dkd_boss_state_value?.day !== dayKey()) return new Set();

    const dkd_escaped_values = Array.isArray(dkd_boss_state_value?.escaped_drop_ids)
      ? dkd_boss_state_value.escaped_drop_ids.map((dkd_value_item) => String(dkd_value_item))
      : [];

    const dkd_solved_values = Array.isArray(dkd_boss_state_value?.solved_drop_ids)
      ? dkd_boss_state_value.solved_drop_ids.map((dkd_value_item) => String(dkd_value_item))
      : [];

    return new Set([...dkd_escaped_values, ...dkd_solved_values]);
  }, [dkd_boss_state_value?.day, dkd_boss_state_value?.escaped_drop_ids, dkd_boss_state_value?.solved_drop_ids]);

  const dkd_coalesce_drop_visibility_value = useCallback((dkd_drop_value) => {
    if (!dkd_drop_value) return false;
    if (dkd_drop_value.is_active === false) return false;

    const dkd_drop_id_value = String(dkd_drop_value.id || '');
    const dkd_drop_type_value = String(dkd_drop_value.type || '').toLowerCase();

    if (dkd_drop_type_value === 'boss' && hiddenBossIdsToday.has(dkd_drop_id_value)) return false;
    return true;
  }, [hiddenBossIdsToday]);

  const visibleDrops = useMemo(() => (
    (dkd_drops_value || []).filter((dkd_drop_value) => dkd_coalesce_drop_visibility_value(dkd_drop_value))
  ), [dkd_drops_value, dkd_coalesce_drop_visibility_value]);

  const dkd_visible_drop_entries_value = useMemo(() => visibleDrops.map((dkd_drop_value) => {
    const dkd_near_value = dkd_is_near_value(dkd_drop_value);
    const dkd_cooldown_value = dkd_get_cooldown_value(dkd_drop_value);
    const dkd_priority_value = getDropPriority(dkd_drop_value, dkd_near_value, dkd_cooldown_value);
    const dkd_distance_value = dkd_near_value?.distance ?? 999999;
    const dkd_has_coords_value = dkd_drop_value.lat != null && dkd_drop_value.lng != null;
    const dkd_stroke_value = dkd_cooldown_value.isCooldown
      ? 'rgba(155,89,182,0.95)'
      : dkd_near_value.ok
        ? 'rgba(46,205,113,0.9)'
        : 'rgba(241,196,15,0.9)';
    const dkd_fill_value = dkd_cooldown_value.isCooldown
      ? 'rgba(155,89,182,0.14)'
      : dkd_near_value.ok
        ? 'rgba(46,205,113,0.15)'
        : 'rgba(241,196,15,0.12)';

    return {
      drop: dkd_drop_value,
      near: dkd_near_value,
      cooldown: dkd_cooldown_value,
      priority: dkd_priority_value,
      distance: dkd_distance_value,
      hasCoords: dkd_has_coords_value,
      stroke: dkd_stroke_value,
      fill: dkd_fill_value,
    };
  }), [visibleDrops, dkd_is_near_value, dkd_get_cooldown_value]);

  const dkd_sorted_visible_entries_value = useMemo(() => {
    if (dkd_visible_drop_entries_value.length <= 1) return dkd_visible_drop_entries_value;
    return dkd_visible_drop_entries_value
      .slice()
      .sort((dkd_left_item, dkd_right_item) => {
        if (dkd_right_item.priority !== dkd_left_item.priority) {
          return dkd_right_item.priority - dkd_left_item.priority;
        }

        return dkd_left_item.distance - dkd_right_item.distance;
      });
  }, [dkd_visible_drop_entries_value]);

  const markerDrops = useMemo(() => dkd_visible_drop_entries_value
    .filter((dkd_entry_value) => dkd_entry_value.hasCoords)
    .map((dkd_entry_value) => ({
      drop: dkd_entry_value.drop,
      near: dkd_entry_value.near,
      cooldown: dkd_entry_value.cooldown,
      stroke: dkd_entry_value.stroke,
      fill: dkd_entry_value.fill,
    })), [dkd_visible_drop_entries_value]);

  const sortedVisibleDrops = useMemo(() => (
    dkd_sorted_visible_entries_value.map((dkd_entry_value) => dkd_entry_value.drop)
  ), [dkd_sorted_visible_entries_value]);

  const dkd_active_entry_value = useMemo(() => (
    dkd_active_drop_id_value
      ? dkd_visible_drop_entries_value.find((dkd_entry_value) => String(dkd_entry_value.drop.id) === String(dkd_active_drop_id_value)) || null
      : null
  ), [dkd_active_drop_id_value, dkd_visible_drop_entries_value]);

  const activeDrop = dkd_active_entry_value?.drop || null;
  const activeNear = dkd_active_entry_value?.near || { ok: false, distance: null };
  const activeDropCooldown = dkd_active_entry_value?.cooldown || { isCooldown: false, remainSec: 0, nextAt: null };

  return {
    hiddenBossIdsToday,
    hiddenBossCountToday: hiddenBossIdsToday.size,
    visibleDrops,
    activeDrop,
    activeNear,
    markerDrops,
    sortedVisibleDrops,
    dockPreview: dkd_sorted_visible_entries_value[0]?.drop || null,
    dockPreviewPending: false,
    activeDropCooldown,
    activeDropDistanceState: getDropDistanceState(activeNear),
  };
}
