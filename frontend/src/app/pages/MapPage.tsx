import { TopBar } from "../components/layout/TopBar";
import { IncidentCard } from "../components/home/IncidentCard";
import { IncidentFilters } from "../components/incidents/IncidentFilters";
import { useState } from "react";
import {
  defaultIncidentFilters,
  filterIncidents,
  getIncidentCategories,
  incidents,
} from "@/lib/incidents";

export function MapPage() {
  const [filters, setFilters] = useState(defaultIncidentFilters);
  const [showFilters, setShowFilters] = useState(false);
  const filteredIncidents = filterIncidents(incidents, filters);
  const categories = getIncidentCategories(incidents);

  return (
    <div className="flex min-h-full flex-col">
      <TopBar showSearch={true} />
      
      {/* Map Layer - Placeholder */}
      <div className="relative h-[42vh] min-h-64 w-full shrink-0 bg-bg-secondary flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Singapore&zoom=12&size=600x300&sensor=false')] bg-cover opacity-50 grayscale"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
                <div className="w-4 h-4 bg-accent-primary rounded-full border-2 border-white z-10 relative"></div>
                <div className="w-9 h-9 bg-accent-primary/30 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
            </div>
        </div>
        
        {/* Incident Pins */}
        <div className="absolute top-1/4 left-1/4">
             <div className="w-6 h-6 rounded-full bg-danger flex items-center justify-center border-2 border-white shadow-lg">
                <span className="material-symbols-outlined text-white text-[12px]">local_police</span>
             </div>
        </div>
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 -mt-4 flex min-h-0 flex-1 flex-col rounded-t-2xl bg-surface-1 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        {/* Handle */}
        <div className="w-12 h-1 bg-border-subtle rounded-full mx-auto mt-3 mb-1 shrink-0" />
        
        <div className="shrink-0 border-b border-border-subtle px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-text-primary">All Incidents</h1>
              <p className="text-[12px] text-text-secondary">
                Filter by proximity, severity, and incident type
              </p>
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
                onProximityChange={(proximity) =>
                  setFilters((current) => ({ ...current, proximity }))
                }
                onSeverityChange={(severity) =>
                  setFilters((current) => ({ ...current, severity }))
                }
                onCategoryChange={(category) =>
                  setFilters((current) => ({ ...current, category }))
                }
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
             <div className="py-10 text-center text-text-secondary">
               No incidents match the selected filters.
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
