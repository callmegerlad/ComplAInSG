import { cn } from "@/lib/utils";
import {
  IncidentFilterState,
  ProximityFilter,
  SeverityFilter,
} from "@/lib/incidents";

type IncidentFiltersProps = {
  filters: IncidentFilterState;
  categories: string[];
  onProximityChange: (value: ProximityFilter) => void;
  onSeverityChange: (value: SeverityFilter) => void;
  onCategoryChange: (value: string) => void;
};

type FilterChipGroupProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

function FilterChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipGroupProps<T>) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-[1px] text-text-secondary">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {options.map((option) => {
          const active = option === value;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-bold whitespace-nowrap transition-colors",
                active
                  ? "border-accent-primary bg-accent-subtle text-accent-primary"
                  : "border-border-subtle bg-transparent text-text-secondary hover:bg-surface-2",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function IncidentFilters({
  filters,
  categories,
  onProximityChange,
  onSeverityChange,
  onCategoryChange,
}: IncidentFiltersProps) {
  return (
    <div className="space-y-3">
      <FilterChipGroup
        label="Proximity"
        options={["All", "Under 1 km", "1-5 km", "Over 5 km"] as const}
        value={filters.proximity}
        onChange={onProximityChange}
      />
      <FilterChipGroup
        label="Severity"
        options={["All", "High", "Medium", "Low"] as const}
        value={filters.severity}
        onChange={onSeverityChange}
      />
      <FilterChipGroup
        label="Incident Type"
        options={categories}
        value={filters.category}
        onChange={onCategoryChange}
      />
    </div>
  );
}
