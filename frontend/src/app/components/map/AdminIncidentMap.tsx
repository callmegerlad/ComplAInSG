import { useEffect, useMemo, useRef, useState } from "react";

type MapIncidentSeverity = "High" | "Medium" | "Low";

export type AdminMapIncident = {
  id: string;
  title: string;
  category: string;
  location: string;
  lat: number;
  lng: number;
  severity: MapIncidentSeverity;
  routingAgency: string;
};

type AdminIncidentMapProps = {
  incidents: AdminMapIncident[];
  selectedIncidentId: string | null;
  onSelectIncident: (incidentId: string) => void;
  centerLat?: number;
  centerLng?: number;
  className?: string;
};

type LeafletMap = {
  remove: () => void;
  setView: (center: [number, number], zoom: number) => void;
  fitBounds: (bounds: unknown, options?: { padding?: [number, number] }) => void;
  flyTo: (center: [number, number], zoom?: number, options?: { duration?: number }) => void;
};

type LeafletLayerGroup = {
  clearLayers: () => void;
  addTo: (map: LeafletMap) => LeafletLayerGroup;
};

type LeafletCircle = {
  addTo: (target: LeafletLayerGroup | LeafletMap) => LeafletCircle;
  on: (event: string, callback: () => void) => void;
  bindPopup: (html: string) => LeafletCircle;
  openPopup: () => void;
};

type LeafletGlobal = {
  map: (container: HTMLElement) => LeafletMap;
  tileLayer: (url: string, options: { maxZoom: number; attribution: string }) => { addTo: (map: LeafletMap) => void };
  latLngBounds: (coordinates: [number, number][]) => unknown;
  layerGroup: () => LeafletLayerGroup;
  circle: (
    center: [number, number],
    options: { radius: number; color: string; fillColor: string; fillOpacity: number; opacity: number; weight: number },
  ) => LeafletCircle;
  circleMarker: (
    center: [number, number],
    options: { radius: number; color: string; fillColor: string; fillOpacity: number; weight: number },
  ) => LeafletCircle;
};

declare global {
  interface Window {
    L?: LeafletGlobal;
  }
}

const LEAFLET_SCRIPT_ID = "leaflet-script";
const LEAFLET_STYLE_ID = "leaflet-style";
const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198];
const DEFAULT_HOME_ZOOM = 11;

let leafletLoadingPromise: Promise<void> | null = null;

function ensureLeafletLoaded() {
  if (window.L) {
    return Promise.resolve();
  }

  if (!leafletLoadingPromise) {
    leafletLoadingPromise = new Promise<void>((resolve, reject) => {
      if (!document.getElementById(LEAFLET_STYLE_ID)) {
        const stylesheet = document.createElement("link");
        stylesheet.id = LEAFLET_STYLE_ID;
        stylesheet.rel = "stylesheet";
        stylesheet.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(stylesheet);
      }

      if (document.getElementById(LEAFLET_SCRIPT_ID)) {
        const poll = window.setInterval(() => {
          if (window.L) {
            window.clearInterval(poll);
            resolve();
          }
        }, 50);
        window.setTimeout(() => {
          window.clearInterval(poll);
          reject(new Error("Leaflet did not load in time."));
        }, 6000);
        return;
      }

      const script = document.createElement("script");
      script.id = LEAFLET_SCRIPT_ID;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Leaflet."));
      document.body.appendChild(script);
    });
  }

  return leafletLoadingPromise;
}

function getSeverityColor(severity: MapIncidentSeverity) {
  if (severity === "High") return "#D7263D";
  if (severity === "Medium") return "#F59E0B";
  return "#1F9D55";
}

function getHeatRadius(severity: MapIncidentSeverity) {
  if (severity === "High") return 210;
  if (severity === "Medium") return 145;
  return 95;
}

export function AdminIncidentMap({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  centerLat,
  centerLng,
  className = "",
}: AdminIncidentMapProps) {
  const [leafletReady, setLeafletReady] = useState(
    typeof window !== "undefined" && Boolean(window.L),
  );
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<LeafletLayerGroup | null>(null);
  const markerByIncidentIdRef = useRef<Record<string, LeafletCircle>>({});

  const center = useMemo<[number, number]>(() => {
    if (typeof centerLat === "number" && typeof centerLng === "number") {
      return [centerLat, centerLng];
    }
    return SINGAPORE_CENTER;
  }, [centerLat, centerLng]);

  useEffect(() => {
    let cancelled = false;

    async function setupMap() {
      try {
        await ensureLeafletLoaded();
      } catch {
        return;
      }

      if (cancelled || !mapContainerRef.current || !window.L || mapRef.current) {
        return;
      }

      const L = window.L;
      const map = L.map(mapContainerRef.current);
      mapRef.current = map;
      map.setView(SINGAPORE_CENTER, DEFAULT_HOME_ZOOM);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      layersRef.current = L.layerGroup().addTo(map);
      setLeafletReady(true);
    }

    void setupMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      layersRef.current = null;
      markerByIncidentIdRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!window.L || !mapRef.current || !layersRef.current) {
      return;
    }

    const L = window.L;
    const layers = layersRef.current;
    const map = mapRef.current;

    layers.clearLayers();
    markerByIncidentIdRef.current = {};

    incidents.forEach((incident) => {
      const severityColor = getSeverityColor(incident.severity);

      L.circle([incident.lat, incident.lng], {
        radius: getHeatRadius(incident.severity),
        color: severityColor,
        fillColor: severityColor,
        fillOpacity: 0.1,
        opacity: 0.14,
        weight: 0.5,
      }).addTo(layers);

      const marker = L.circleMarker([incident.lat, incident.lng], {
        radius: selectedIncidentId === incident.id ? 10 : 7,
        color: "#ffffff",
        fillColor: severityColor,
        fillOpacity: 0.95,
        weight: 2,
      })
        .bindPopup(
          `<strong>${incident.title}</strong><br/>${incident.location}<br/>Routing: ${incident.routingAgency}`,
        )
        .addTo(layers);

      marker.on("click", () => onSelectIncident(incident.id));
      markerByIncidentIdRef.current[incident.id] = marker;
    });
  }, [center, incidents, onSelectIncident]);

  useEffect(() => {
    if (!mapRef.current || incidents.length > 0) {
      return;
    }
    mapRef.current.setView(SINGAPORE_CENTER, DEFAULT_HOME_ZOOM);
  }, [center, incidents.length]);

  useEffect(() => {
    if (!mapRef.current || selectedIncidentId) {
      return;
    }
    mapRef.current.flyTo(SINGAPORE_CENTER, DEFAULT_HOME_ZOOM, { duration: 0.35 });
  }, [selectedIncidentId]);

  useEffect(() => {
    if (!selectedIncidentId) {
      return;
    }
    const marker = markerByIncidentIdRef.current[selectedIncidentId];
    marker?.openPopup();
    const selectedIncident = incidents.find((incident) => incident.id === selectedIncidentId);
    if (selectedIncident && mapRef.current) {
      mapRef.current.flyTo([selectedIncident.lat, selectedIncident.lng], 16, { duration: 0.25 });
    }
  }, [incidents, selectedIncidentId]);

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-xl border border-border-subtle ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />
      {!leafletReady ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface-1/75 text-sm text-text-secondary">
          Loading map...
        </div>
      ) : null}
    </div>
  );
}
