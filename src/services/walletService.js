export function normalizeTl(dkd_value) {
  const dkd_numeric_value = Number(dkd_value ?? 0);
  return Number.isFinite(dkd_numeric_value) ? dkd_numeric_value : 0;
}

export function dkd_resolve_customer_wallet_tl_value(dkd_profile_value = {}) {
  return Math.max(0, normalizeTl(dkd_profile_value?.wallet_tl));
}

export function dkd_resolve_courier_wallet_tl_value(dkd_profile_value = {}) {
  return Math.max(0, normalizeTl(dkd_profile_value?.courier_wallet_tl));
}

export function dkd_resolve_merchant_wallet_tl_value(dkd_profile_value = {}) {
  return Math.max(0, normalizeTl(dkd_profile_value?.merchant_wallet_tl));
}

export function resolveUnifiedWalletTl(profile = {}) {
  return dkd_resolve_customer_wallet_tl_value(profile || {});
}

export function dkd_build_unified_wallet_patch_value(dkd_value) {
  const dkd_wallet_value = Math.max(0, normalizeTl(dkd_value));
  return {
    wallet_tl: dkd_wallet_value,
  };
}

export function formatWalletTlCompact(dkd_value) {
  const dkd_amount_value = normalizeTl(dkd_value);
  return `${dkd_amount_value.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} TL`;
}
