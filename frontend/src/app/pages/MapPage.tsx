import { useEffect, useMemo, useRef, useState } from "react";
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
  const [focusedIncidentId, setFocusedIncidentId] = useState<string | undefined>(undefined);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const focusUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    setFocusedIncidentId(filteredIncidents[0]?.id);
  }, [filteredIncidents]);

  useEffect(() => {
    const root = listContainerRef.current;
    if (!root || filteredIncidents.length === 0) {
      return;
    }

    const visibilityById = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const target = entry.target as HTMLDivElement;
          const id = target.dataset.incidentId;
          if (!id) {
            continue;
          }

          if (entry.isIntersecting) {
            visibilityById.set(id, entry.intersectionRatio);
          } else {
            visibilityById.delete(id);
          }
        }

        const nextFocused = filteredIncidents
          .map((incident) => ({
            id: incident.id,
            ratio: visibilityById.get(incident.id) ?? 0,
          }))
          .filter((item) => item.ratio > 0)
          .sort((left, right) => right.ratio - left.ratio)[0]?.id;

        if (nextFocused) {
          if (focusUpdateTimeoutRef.current) {
            clearTimeout(focusUpdateTimeoutRef.current);
          }

          focusUpdateTimeoutRef.current = setTimeout(() => {
            setFocusedIncidentId((current) => (current === nextFocused ? current : nextFocused));
          }, 120);
        }
      },
      {
        root,
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "-35% 0px -35% 0px",
      },
    );

    for (const incident of filteredIncidents) {
      const element = itemRefs.current.get(incident.id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
      if (focusUpdateTimeoutRef.current) {
        clearTimeout(focusUpdateTimeoutRef.current);
      }
    };
  }, [filteredIncidents]);

  const focusedIncident = useMemo(() => {
    const incidentInView = filteredIncidents.find((incident) => incident.id === focusedIncidentId);
    if (incidentInView?.lat != null && incidentInView?.lng != null) {
      return incidentInView;
    }

    return filteredIncidents.find((incident) => incident.lat != null && incident.lng != null);
  }, [filteredIncidents, focusedIncidentId]);

  useEffect(() => {
    if (
      focusedIncident &&
      typeof focusedIncident.lat === "number" &&
      typeof focusedIncident.lng === "number" &&
      Number.isFinite(focusedIncident.lat) &&
      Number.isFinite(focusedIncident.lng) &&
      focusedIncident.lat >= -90 &&
      focusedIncident.lat <= 90 &&
      focusedIncident.lng >= -180 &&
      focusedIncident.lng <= 180
    ) {
      setMapCenter({ lat: focusedIncident.lat, lng: focusedIncident.lng });
    }
  }, [focusedIncident]);

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
            incident.lng <= 180,
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
          centerLat={mapCenter?.lat}
          centerLng={mapCenter?.lng}
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
        <div ref={listContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 space-y-3 pb-20 pt-4">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              ref={(element) => {
                if (element) {
                  itemRefs.current.set(incident.id, element);
                } else {
                  itemRefs.current.delete(incident.id);
                }
              }}
              data-incident-id={incident.id}
            >
              <IncidentCard incident={incident} compact={true} />
            </div>
          ))}
          {filteredIncidents.length === 0 && (
            <div className="py-10 text-center text-text-secondary">No incidents match the selected filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
