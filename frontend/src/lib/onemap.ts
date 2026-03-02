/**
 * OneMap Singapore integration utilities
 * OneMap is Singapore's national multi-agency geospatial platform
 * API Reference: https://www.onemap.gov.sg/docs/
 */

export interface OneMapCoordinates {
  lat: number;
  lng: number;
}

export interface OneMapMiniMapConfig {
  mapStyle?: "Default" | "Grey" | "LightBlue" | "Dark";
  zoomLevel?: number;
  latLng: OneMapCoordinates;
  popupText?: string;
  popupWidth?: number;
  showPopup?: boolean;
}

/**
 * Generate a OneMap Minimap URL for embedding
 * @param config Configuration for the minimap
 * @returns URL string for the OneMap minimap
 */
export function generateOneMapMiniMapUrl(config: OneMapMiniMapConfig): string {
  const {
    mapStyle = "Default",
    zoomLevel = 14,
    latLng,
    popupText,
    popupWidth = 200,
    showPopup = false,
  } = config;

  const baseUrl = "https://www.onemap.gov.sg/minimap/minimap.html";
  const params = new URLSearchParams();

  params.append("mapStyle", mapStyle);
  params.append("zoomLevel", zoomLevel.toString());
  params.append("latLng", `${latLng.lat},${latLng.lng}`);

  if (popupText) {
    // Encode the popup text
    params.append("ewt", encodeURIComponent(popupText));
    params.append("popupWidth", popupWidth.toString());
    params.append("showPopup", showPopup.toString());
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a OneMap Minimap URL with incident details
 * @param incident Incident object with location data
 * @returns URL string for the OneMap minimap
 */
export interface IncidentForMap {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  severity: "High" | "Medium" | "Low";
}

export function generateIncidentMapUrl(incident: IncidentForMap): string {
  const popupHtml = `
    <p><strong>${incident.title}</strong></p>
    <p>${incident.location}</p>
    <p>Severity: ${incident.severity}</p>
  `;

  return generateOneMapMiniMapUrl({
    mapStyle: "Default",
    zoomLevel: 15,
    latLng: { lat: incident.lat, lng: incident.lng },
    popupText: popupHtml,
    popupWidth: 250,
    showPopup: true,
  });
}

/**
 * Singapore's main locations and their OneMap coordinates
 */
export const SINGAPORE_LOCATIONS = {
  angMoKio: { lat: 1.3694, lng: 103.8453, name: "Ang Mo Kio" },
  orchard: { lat: 1.3044, lng: 103.8329, name: "Orchard" },
  bugis: { lat: 1.301, lng: 103.8554, name: "Bugis" },
  tampines: { lat: 1.3548, lng: 103.9417, name: "Tampines" },
  marinaBay: { lat: 1.2821, lng: 103.8577, name: "Marina Bay" },
  sentosa: { lat: 1.249, lng: 103.8303, name: "Sentosa" },
  changi: { lat: 1.3644, lng: 103.9915, name: "Changi" },
  jurong: { lat: 1.3521, lng: 103.7618, name: "Jurong" },
  clementi: { lat: 1.335, lng: 103.7639, name: "Clementi" },
  novena: { lat: 1.3205, lng: 103.8447, name: "Novena" },
};

/**
 * Center of Singapore (approximate)
 */
export const SINGAPORE_CENTER = {
  lat: 1.3521,
  lng: 103.8198,
};
