export function resolveNotificationRoute(payload = {}) {
  const dkd_raw_route = String(
    payload?.targetScreen || payload?.route || payload?.screen || ''
  )
    .trim()
    .toLowerCase();

  const dkd_route_alias_map = {
    social: 'dbg',
    chat: 'dbg',
    message: 'dbg',
    messages: 'dbg',
    friend: 'dbg',
    friends: 'dbg',
  };

  const dkd_route = dkd_route_alias_map[dkd_raw_route] || dkd_raw_route;
  const dkd_drop_id = payload?.targetDropId || payload?.dropId || null;

  return {
    route: dkd_route,
    dropId: dkd_drop_id,
    payload,
  };
}

export function applyNotificationRoute({ route, dropId, payload }, api = {}) {
  if (!route) return false;

  if (route === 'courier') {
    api.openTab?.('map');
    api.openCourier?.();
    return true;
  }

  if (route === 'admin') {
    if (!api.isAdmin) return false;
    api.openAdmin?.();
    return true;
  }

  if (route === 'scanner') {
    api.openTab?.('map');
    if (dropId) api.setDropId?.(String(dropId));
    api.openScanner?.();
    return true;
  }

  if (route === 'dbg') {
    api.openTab?.('dbg', payload);
    api.openSocial?.();
    return true;
  }

  if (['map', 'market'].includes(route)) {
    api.openTab?.(route, payload);
    if (dropId) api.setDropId?.(String(dropId));
    return true;
  }

  return false;
}
