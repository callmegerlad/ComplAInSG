import { useEffect, useState } from "react";

const SG_FALLBACK = "Singapore";

/** Reverse-geocode a lat/lng to a human-readable place name via Nominatim. */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "Accept-Language": "en" } },
    );
    const data = await res.json();
    const addr = data.address ?? {};
    const road = addr.road as string | undefined;
    const suburb = addr.suburb as string | undefined;
    const city = addr.city ?? addr.town ?? addr.village ?? addr.state;
    const primary = road ?? suburb ?? (city as string | undefined);
    const secondary = suburb ?? (city as string | undefined);
    if (primary && secondary && primary !== secondary)
      return `${primary}, ${secondary}`;
    return primary ?? SG_FALLBACK;
  } catch {
    return SG_FALLBACK;
  }
}

/** React hook that returns the user's current location as a display label. */
export function useCurrentLocation(): string {
  const [label, setLabel] = useState<string>("Fetching location…");

  useEffect(() => {
    if (!navigator?.geolocation) {
      setLabel(SG_FALLBACK);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const name = await reverseGeocode(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        setLabel(name);
      },
      () => setLabel(SG_FALLBACK),
      { timeout: 6000, maximumAge: 60_000 },
    );
  }, []);

  return label;
}
