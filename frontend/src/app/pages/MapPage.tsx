import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { IncidentCard } from "../components/home/IncidentCard";
import { IncidentFilters } from "../components/incidents/IncidentFilters";
import { OneMapMultiIncident } from "../components/map/OneMap";
import {
  defaultIncidentFilters,
  fetchIncidentList,
  filterIncidents,
  getIncidentCategories,
  incidents as fallbackIncidents,
  type IncidentWithMeta,
} from "@/lib/incidents";
import { useCurrentLocation } from "@/lib/location";

export function MapPage() {
  const [filters, setFilters] = useState(defaultIncidentFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [allIncidents, setAllIncidents] = useState<IncidentWithMeta[]>(fallbackIncidents);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { lat: userLat, lng: userLng } = useCurrentLocation();

  useEffect(() => {
    let cancelled = false;

    async function loadIncidents() {
      try {
        const data = await fetchIncidentList({
          limit: 100,
          userLat: userLat ?? undefined,
          userLng: userLng ?? undefined,
        });
        if (!cancelled) {
          setAllIncidents(data.incidents);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load incidents.");
        }
      }
    }

    void loadIncidents();

    return () => {
      cancelled = true;
    };
  }, [userLat, userLng]);

  const filteredIncidents = filterIncidents(allIncidents, filters);
  const categories = getIncidentCategories(allIncidents);

  const mappableIncidents = useMemo(
    () =>
      filteredIncidents
        .filter(
          (incident) =>
            typeof incident.lat === "number" &&
            typeof incident.lng === "number" &&
            Number.isFinite(incident.lat) &&
            Number.isFinite(incident.lng) &&
            incident.lat >= -90 &&
            incident.lat <= 90 &&
            incident.lng >= -180 &&
            incident.lng <= 180
        )
        .map((incident) => ({
          id: incident.id,
          title: incident.title,
          location: incident.location,
          lat: incident.lat as number,
          lng: incident.lng as number,
          severity: incident.severity,
        })),
    [filteredIncidents],
  );

  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      {/* Sticky TopBar */}
      <TopBar showSearch={true} />

      {/* Fixed Map - stays visible, doesn't scroll */}
      <div className="h-[30vh] shrink-0 bg-bg-secondary">
        <OneMapMultiIncident
          incidents={mappableIncidents}
          centerLat={userLat ?? undefined}
          centerLng={userLng ?? undefined}
          zoomLevel={13}
          className="h-full w-full"
        />
      </div>

      {/* Scrollable Content - list scrolls independently */}
      <div className="relative z-10 -mt-4 flex min-h-0 flex-1 flex-col rounded-t-2xl bg-surface-1 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="shrink-0 border-b border-border-subtle px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-text-primary">All Incidents</h1>
              <p className="text-[12px] text-text-secondary">Filter by proximity, severity, and incident type</p>
              {loadError ? <p className="mt-1 text-[11px] text-danger">Live map fallback active: {loadError}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-accent-primary transition-colors hover:bg-surface-2"
              aria-label="Toggle map filters"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
          </div>
          {showFilters && (
            <div className="pt-3">
              <IncidentFilters
                filters={filters}
                categories={categories}
                onProximityChange={(proximity) => setFilters((current) => ({ ...current, proximity }))}
                onSeverityChange={(severity) => setFilters((current) => ({ ...current, severity }))}
                onCategoryChange={(category) => setFilters((current) => ({ ...current, category }))}
              />
            </div>
          )}
        </div>

        {/* List - independently scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 space-y-3 pb-20 pt-4">
          {filteredIncidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} compact={true} />
          ))}
          {filteredIncidents.length === 0 && (
            <div className="py-10 text-center text-text-secondary">No incidents match the selected filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
