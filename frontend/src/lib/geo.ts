/**
 * geo.ts — Browser geolocation helpers.
 */

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy_m: number;
}

// Default: Singapore CBD
const FALLBACK: GeoPosition = {
  lat: 1.2868,
  lng: 103.8545,
  accuracy_m: 9999,
};

/**
 * Get the user's current position. Returns a fallback if geolocation
 * is unavailable or the user denies permission.
 */
export function getCurrentPosition(
  timeoutMs = 10_000,
): Promise<GeoPosition> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(FALLBACK);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        }),
      () => resolve(FALLBACK),
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 60_000,
      },
    );
  });
}
