import type { Incident } from "@/app/components/home/IncidentCard";

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const MEDIA_BASE_URL = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;

export type IncidentTimeGroup =
  | "HAPPENING NOW"
  | "LAST HOUR"
  | "EARLIER TODAY";

export type IncidentWithMeta = Incident & {
  timeGroup?: IncidentTimeGroup;
};

export type ProximityFilter = "All" | "Under 1 km" | "1-5 km" | "Over 5 km";
export type SeverityFilter = "All" | Incident["severity"];

export type IncidentFilterState = {
  proximity: ProximityFilter;
  severity: SeverityFilter;
  category: string;
};

export const defaultIncidentFilters: IncidentFilterState = {
  proximity: "All",
  severity: "All",
  category: "All",
};

export type IncidentCategory = {
  label: string;
  color: string;
  icon: string;
};

export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  { label: "Fight/Assault", color: "var(--cat-fight)", icon: "local_police" },
  { label: "Transport Fault", color: "var(--cat-transport)", icon: "train" },
  { label: "Medical Emerg", color: "var(--cat-medical)", icon: "emergency" },
  { label: "Fire/Hazard", color: "var(--cat-fire)", icon: "local_fire_department" },
  { label: "Others", color: "var(--text-disabled)", icon: "more_horiz" },
];

// Static fallback seed data. The app now prefers backend incident endpoints.
export const incidents: IncidentWithMeta[] = [
  {
    id: "1",
    category: "Fight/Assault",
    categoryColor: "var(--cat-fight)",
    categoryIcon: "local_police",
    severity: "High",
    location: "Ang Mo Kio Ave 3",
    distance: "80m",
    title: "Fight reported at Block 423",
    summary:
      "Content verified by AI. Two individuals involved in a physical altercation near the void deck.",
    timestamp: "2 min ago",
    responders: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1563266914-94073574828f?q=80&w=200&auto=format&fit=crop",
    credibilityUpvotes: 18,
    credibilityDownvotes: 2,
    timeGroup: "HAPPENING NOW",
    lat: 1.3694,
    lng: 103.8453,
  },
  {
    id: "2",
    category: "Transport Fault",
    categoryColor: "var(--cat-transport)",
    categoryIcon: "train",
    severity: "Medium",
    location: "Orchard MRT",
    distance: "1.2km",
    title: "Escalator Breakdown",
    summary:
      "Escalator B at Exit 3 is currently non-functional. Technicians have been dispatched.",
    timestamp: "15 min ago",
    responders: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1471623320832-752e8bbf8413?q=80&w=200&auto=format&fit=crop",
    credibilityUpvotes: 11,
    credibilityDownvotes: 3,
    timeGroup: "HAPPENING NOW",
    lat: 1.3044,
    lng: 103.8329,
  },
  {
    id: "3",
    category: "Medical Emerg",
    categoryColor: "var(--cat-medical)",
    categoryIcon: "emergency",
    severity: "High",
    location: "Bugis Junction",
    distance: "3.5km",
    title: "Traffic Accident",
    summary: "Multi-vehicle collision at junction. Ambulance en route.",
    timestamp: "45 min ago",
    responders: 6,
    imageUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=200&auto=format&fit=crop",
    credibilityUpvotes: 16,
    credibilityDownvotes: 1,
    timeGroup: "LAST HOUR",
    lat: 1.301,
    lng: 103.8554,
  },
  {
    id: "4",
    category: "Fire/Hazard",
    categoryColor: "var(--cat-fire)",
    categoryIcon: "local_fire_department",
    severity: "High",
    location: "Tampines Mall",
    distance: "8km",
    title: "Small Fire in Rubbish Chute",
    summary: "Smoke detected from rubbish chute. SCDF notified.",
    timestamp: "3 hours ago",
    responders: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=200&auto=format&fit=crop",
    credibilityUpvotes: 8,
    credibilityDownvotes: 4,
    timeGroup: "EARLIER TODAY",
    lat: 1.3548,
    lng: 103.9417,
  },
];

export const incidentGroups: IncidentTimeGroup[] = [
  "HAPPENING NOW",
  "LAST HOUR",
  "EARLIER TODAY",
];

export const proximityOptions: ProximityFilter[] = [
  "All",
  "Under 1 km",
  "1-5 km",
  "Over 5 km",
];

export const severityOptions: SeverityFilter[] = [
  "All",
  "High",
  "Medium",
  "Low",
];

type ApiFinalTriage = {
  incident_type?: string | null;
  final_severity?: string | number | null;
  responder_summary?: string | null;
};

type ApiIncidentDetail = {
  id: string;
  location_text: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  final_triage?: ApiFinalTriage | null;
  reporter_name?: string | null;
  image_url?: string | null;
};

type ApiIncidentListResponse = {
  total: number;
  incidents: ApiIncidentDetail[];
};

type ApiNearbyIncidentItem = {
  incident_id: string;
  location?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string | null;
  incident_type?: string | null;
  final_severity?: string | number | null;
  responder_summary?: string | null;
  image_url?: string | null;
  distance_m: number;
};

type ApiNearbyIncidentsResponse = {
  nearby_incidents: ApiNearbyIncidentItem[];
};

export async function fetchIncidentList(params: { skip?: number; limit?: number } = {}) {
  const skip = params.skip ?? 0;
  const limit = params.limit ?? 30;
  const query = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  const data = await request<ApiIncidentListResponse>(`/incidents?${query.toString()}`);

  return {
    total: data.total,
    incidents: data.incidents.map((incident) => mapApiIncidentToIncident(incident)),
  };
}

export async function fetchIncidentById(incidentId: string) {
  const data = await request<ApiIncidentDetail>(`/incidents/${incidentId}`);
  return mapApiIncidentToIncident(data);
}

export async function searchIncidents(
  searchQuery: string,
  incidentType: string = "",
  severity: string = "",
  skip: number = 0,
  limit: number = 20,
) {
  const query = new URLSearchParams({
    query: searchQuery,
    incident_type: incidentType,
    severity,
    skip: String(skip),
    limit: String(limit),
  });

  const data = await request<ApiIncidentListResponse>(`/incidents/search?${query.toString()}`);

  return {
    total: data.total,
    incidents: data.incidents.map((incident) => mapApiIncidentToIncident(incident)),
  };
}
export async function fetchNearbyIncidents(
  lat: number,
  lng: number,
  params: { radius_m?: number; limit?: number } = {},
): Promise<IncidentWithMeta[]> {
  const query = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius_m: String(params.radius_m ?? 5000),
    limit: String(params.limit ?? 20),
  });

  const data = await request<ApiNearbyIncidentsResponse>(`/incidents/nearby?${query.toString()}`);

  return data.nearby_incidents.map((incident) => mapNearbyIncidentToIncident(incident));
}

export function getIncidentCategories(items: IncidentWithMeta[]): string[] {
  return ["All", ...new Set(items.map((item) => item.category))];
}

function distanceToMeters(distance: string): number {
  const normalized = distance.trim().toLowerCase();

  if (normalized.endsWith("km")) {
    return Number.parseFloat(normalized.replace("km", "")) * 1000;
  }

  if (normalized.endsWith("m")) {
    return Number.parseFloat(normalized.replace("m", ""));
  }

  return Number.POSITIVE_INFINITY;
}

function matchesProximity(distance: string, proximity: ProximityFilter): boolean {
  if (proximity === "All") {
    return true;
  }

  const meters = distanceToMeters(distance);

  if (proximity === "Under 1 km") {
    return meters < 1000;
  }

  if (proximity === "1-5 km") {
    return meters >= 1000 && meters <= 5000;
  }

  return meters > 5000;
}

export function filterIncidents(
  items: IncidentWithMeta[],
  filters: IncidentFilterState,
): IncidentWithMeta[] {
  return items.filter((item) => {
    const matchesSeverity = filters.severity === "All" || item.severity === filters.severity;
    const matchesCategory = filters.category === "All" || item.category === filters.category;

    return matchesSeverity && matchesCategory && matchesProximity(item.distance, filters.proximity);
  });
}

export function getIncidentById(id: string): IncidentWithMeta | undefined {
  return incidents.find((incident) => incident.id === id);
}

function mapApiIncidentToIncident(apiIncident: ApiIncidentDetail): IncidentWithMeta {
  const incidentType = normalizeIncidentType(apiIncident.final_triage?.incident_type);
  const severity = normalizeSeverity(apiIncident.final_triage?.final_severity);
  const categoryMeta = getCategoryMeta(incidentType);

  return {
    id: apiIncident.id,
    category: categoryMeta.label,
    categoryColor: categoryMeta.color,
    categoryIcon: categoryMeta.icon,
    severity,
    location: apiIncident.location_text || "Unknown location",
    distance: "N/A",
    title: `${incidentType} reported`,
    summary:
      apiIncident.final_triage?.responder_summary?.trim() ||
      apiIncident.description ||
      "Incident report received.",
    timestamp: formatRelativeTime(apiIncident.created_at),
    status: apiIncident.status,
    responders: 0,
    reporter: apiIncident.reporter_name?.trim() || "Anonymous",
    imageUrl: toAbsoluteMediaUrl(apiIncident.image_url),
    credibilityUpvotes: 0,
    credibilityDownvotes: 0,
    lat: apiIncident.latitude ?? undefined,
    lng: apiIncident.longitude ?? undefined,
    timeGroup: toTimeGroup(apiIncident.created_at),
  };
}

function mapNearbyIncidentToIncident(apiIncident: ApiNearbyIncidentItem): IncidentWithMeta {
  const incidentType = normalizeIncidentType(apiIncident.incident_type);
  const severity = normalizeSeverity(apiIncident.final_severity);
  const categoryMeta = getCategoryMeta(incidentType);
  const createdAt = apiIncident.created_at ?? "";

  return {
    id: apiIncident.incident_id,
    category: categoryMeta.label,
    categoryColor: categoryMeta.color,
    categoryIcon: categoryMeta.icon,
    severity,
    location: apiIncident.location || "Unknown location",
    distance: formatDistanceMeters(apiIncident.distance_m),
    title: `${incidentType} reported`,
    summary:
      apiIncident.responder_summary?.trim() ||
      apiIncident.description ||
      "Incident reported nearby.",
    timestamp: createdAt ? formatRelativeTime(createdAt) : "Recent",
    responders: 0,
    reporter: "Anonymous",
    imageUrl: toAbsoluteMediaUrl(apiIncident.image_url),
    credibilityUpvotes: 0,
    credibilityDownvotes: 0,
    lat: apiIncident.latitude ?? undefined,
    lng: apiIncident.longitude ?? undefined,
    timeGroup: createdAt ? toTimeGroup(createdAt) : "HAPPENING NOW",
  };
}

function normalizeIncidentType(rawValue: string | null | undefined): string {
  if (!rawValue) {
    return "Incident";
  }

  return rawValue
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeSeverity(rawValue: string | number | null | undefined): Incident["severity"] {
  if (typeof rawValue === "number") {
    if (rawValue >= 3) return "High";
    if (rawValue >= 2) return "Medium";
    return "Low";
  }

  const text = String(rawValue ?? "").toLowerCase();

  if (text.includes("critical") || text.includes("high")) {
    return "High";
  }

  if (text.includes("medium")) {
    return "Medium";
  }

  return "Low";
}

function getCategoryMeta(incidentType: string): IncidentCategory {
  const normalizedType = incidentType.toLowerCase();

  if (normalizedType.includes("fight") || normalizedType.includes("assault") || normalizedType.includes("violence")) {
    return INCIDENT_CATEGORIES[0];
  }

  if (normalizedType.includes("transport") || normalizedType.includes("traffic") || normalizedType.includes("mrt")) {
    return INCIDENT_CATEGORIES[1];
  }

  if (normalizedType.includes("medical") || normalizedType.includes("injury") || normalizedType.includes("emerg")) {
    return INCIDENT_CATEGORIES[2];
  }

  if (normalizedType.includes("fire") || normalizedType.includes("hazard") || normalizedType.includes("smoke")) {
    return INCIDENT_CATEGORIES[3];
  }

  return INCIDENT_CATEGORIES[4];
}

function toTimeGroup(createdAtIso: string): IncidentTimeGroup {
  const createdAt = new Date(createdAtIso).getTime();

  if (Number.isNaN(createdAt)) {
    return "EARLIER TODAY";
  }

  const ageMinutes = (Date.now() - createdAt) / 60000;

  if (ageMinutes <= 15) {
    return "HAPPENING NOW";
  }

  if (ageMinutes <= 60) {
    return "LAST HOUR";
  }

  return "EARLIER TODAY";
}

function formatRelativeTime(createdAtIso: string): string {
  const createdAt = new Date(createdAtIso).getTime();

  if (Number.isNaN(createdAt)) {
    return "Recent";
  }

  const elapsedMs = Date.now() - createdAt;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  if (elapsedMinutes < 1) {
    return "Just now";
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
}


function toAbsoluteMediaUrl(rawUrl: string | null | undefined): string | undefined {
  if (!rawUrl) {
    return undefined;
  }

  let value = rawUrl.trim();
  if (!value) {
    return undefined;
  }

  if (value.startsWith("(") && value.endsWith(")")) {
    value = value.slice(1, -1);
  }

  if (value.includes(",")) {
    value = value.split(",")[0].trim();
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${MEDIA_BASE_URL}${value}`;
  }

  return `${MEDIA_BASE_URL}/${value}`;
}

function formatDistanceMeters(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    return "N/A";
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "Incident API request failed.";
    throw new Error(detail);
  }

  return data as T;
}







