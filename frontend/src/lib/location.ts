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

/** React hook that returns the user's current location as a display label
 *  and the time it was last refreshed.
 *  Re-polls the position every POLL_INTERVAL_MS (10 s). */
const POLL_INTERVAL_MS = 10_000;

export interface LocationInfo {
  label: string;
  lastUpdated: Date | null;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
}

export function useCurrentLocation(): LocationInfo {
  const [label, setLabel] = useState<string>("Fetching location…");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  useEffect(() => {
    if (!navigator?.geolocation) {
      setLabel(SG_FALLBACK);
      return;
    }

    let cancelled = false;

    const fetchLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const name = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude,
          );
          if (!cancelled) {
            setLabel(name);
            setLat(pos.coords.latitude);
            setLng(pos.coords.longitude);
            setAccuracy(pos.coords.accuracy);
            setLastUpdated(new Date());
          }
        },
        () => { if (!cancelled) { setLabel(SG_FALLBACK); setLastUpdated(new Date()); } },
        { timeout: 6000, maximumAge: 10_000 },
      );
    };

    // Fetch immediately, then every 10 s
    fetchLocation();
    const id = setInterval(fetchLocation, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { label, lastUpdated, lat, lng, accuracy };
}
