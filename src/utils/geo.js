const DKD_EARTH_RADIUS_M = 6371000;
export function haversineMeters(dkd_lat1_value, dkd_lng1_value, dkd_lat2_value, dkd_lng2_value) {
  const dkd_to_rad_value = (dkd_degree_value) => (Number(dkd_degree_value) * Math.PI) / 180;
  const dkd_lat1_rad_value = dkd_to_rad_value(dkd_lat1_value);
  const dkd_lat2_rad_value = dkd_to_rad_value(dkd_lat2_value);
  const dkd_delta_lat_value = dkd_to_rad_value(Number(dkd_lat2_value) - Number(dkd_lat1_value));
  const dkd_delta_lng_value = dkd_to_rad_value(Number(dkd_lng2_value) - Number(dkd_lng1_value));
  const dkd_a_value = Math.sin(dkd_delta_lat_value / 2) ** 2 + Math.cos(dkd_lat1_rad_value) * Math.cos(dkd_lat2_rad_value) * Math.sin(dkd_delta_lng_value / 2) ** 2;
  return DKD_EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(dkd_a_value), Math.sqrt(1 - dkd_a_value));
}
