import { Incident } from "@/app/components/home/IncidentCard";

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
    const matchesSeverity =
      filters.severity === "All" || item.severity === filters.severity;
    const matchesCategory =
      filters.category === "All" || item.category === filters.category;

    return (
      matchesSeverity &&
      matchesCategory &&
      matchesProximity(item.distance, filters.proximity)
    );
  });
}

export function getIncidentById(id: string): IncidentWithMeta | undefined {
  return incidents.find((incident) => incident.id === id);
}
