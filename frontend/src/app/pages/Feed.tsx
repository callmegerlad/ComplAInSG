import { useState } from "react";
import { IncidentCard } from "../components/home/IncidentCard";
import { IncidentFilters } from "../components/incidents/IncidentFilters";
import { TopBar } from "../components/layout/TopBar";
import {
  defaultIncidentFilters,
  filterIncidents,
  getIncidentCategories,
  incidentGroups,
  incidents,
} from "@/lib/incidents";

export function FeedPage() {
  const [filters, setFilters] = useState(defaultIncidentFilters);
  const [showFilters, setShowFilters] = useState(false);
  const filteredIncidents = filterIncidents(incidents, filters);
  const categories = getIncidentCategories(incidents);
  const groupHeaderTop = showFilters ? "top-[264px]" : "top-[118px]";

  return (
    <div className="flex flex-col min-h-full">
      <TopBar showSearch={false} />
      
      <div className="sticky top-[65px] z-20 border-b border-border-subtle bg-surface-1">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-text-primary text-[20px] font-bold">Live Feed</h1>
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-accent-primary transition-colors hover:bg-surface-2"
            aria-label="Toggle feed filters"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>
        {showFilters && (
          <div className="border-t border-border-subtle px-4 pb-4 pt-3">
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

      <div className="flex flex-col pb-8">
        {incidentGroups.map((group) => {
          const groupIncidents = filteredIncidents.filter(
            (incident) => incident.timeGroup === group,
          );

          if (groupIncidents.length === 0) return null;
          
          return (
            <div key={group}>
              <div className={`sticky ${groupHeaderTop} z-10 bg-bg-primary/95 backdrop-blur-sm px-4 py-3 border-b border-border-subtle/50`}>
                <span className={`text-[11px] font-bold tracking-[1px] uppercase ${group === 'HAPPENING NOW' ? 'text-accent-primary' : 'text-text-secondary'}`}>
                  {group}
                </span>
              </div>
              <div className="flex flex-col gap-3 px-4 py-3">
                {groupIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            </div>
          );
        })}
        {filteredIncidents.length === 0 && (
          <div className="px-4 py-10 text-center text-text-secondary">
            No incidents match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
