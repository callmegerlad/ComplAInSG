import { useEffect, useState } from "react";
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

export function MapPage() {
  const [filters, setFilters] = useState(defaultIncidentFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [allIncidents, setAllIncidents] = useState<IncidentWithMeta[]>(fallbackIncidents);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadIncidents() {
      try {
        const data = await fetchIncidentList({ limit: 100 });
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
  }, []);

  const filteredIncidents = filterIncidents(allIncidents, filters);
  const categories = getIncidentCategories(allIncidents);

  return (
    <div className="flex min-h-full flex-col">
      <TopBar showSearch={true} />

      {/* Map Layer - OneMap Integration */}
      <div className="relative h-[42vh] min-h-64 w-full shrink-0 bg-bg-secondary">
        <OneMapMultiIncident
          incidents={filteredIncidents.map((incident) => ({
            id: incident.id,
            title: incident.title,
            location: incident.location,
            lat: incident.lat || 1.3521,
            lng: incident.lng || 103.8198,
            severity: incident.severity,
          }))}
          zoomLevel={13}
          className="h-full w-full"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 -mt-4 flex min-h-0 flex-1 flex-col rounded-t-2xl bg-surface-1 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        {/* Handle */}
        <div className="w-12 h-1 bg-border-subtle rounded-full mx-auto mt-3 mb-1 shrink-0" />

        <div className="shrink-0 border-b border-border-subtle px-4 py-3">
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

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-28 space-y-3">
          {filteredIncidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
          {filteredIncidents.length === 0 && (
            <div className="py-10 text-center text-text-secondary">No incidents match the selected filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
