import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Link } from "react-router";

const FALLBACK_INCIDENT_IMAGE =
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=200&auto=format&fit=crop";

export interface Incident {
  id: string;
  category: string;
  categoryColor: string;
  categoryIcon: string;
  severity: "High" | "Medium" | "Low";
  location: string;
  distance: string;
  title: string;
  summary: string;
  timestamp: string;
  status?: string;
  imageUrl?: string;
  responders: number;
  // geographic coordinate for mapping (latitude, longitude).
  // optional so that existing data stays compatible.
  lat?: number;
  lng?: number;
}

export function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <div className="relative flex overflow-hidden rounded-xl border border-border-subtle bg-surface-1 shadow-card">
      <div
        className="absolute bottom-0 left-0 top-0 h-full w-1"
        style={{ backgroundColor: incident.categoryColor }}
      />

      <div className="flex w-full gap-4 p-4 pl-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2">
          {incident.imageUrl ? (
            <ImageWithFallback
              src={incident.imageUrl}
              alt={incident.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="relative h-full w-full">
              <ImageWithFallback
                src={FALLBACK_INCIDENT_IMAGE}
                alt={incident.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="material-symbols-outlined text-[32px] text-white">
                  {incident.categoryIcon}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{
                backgroundColor: incident.categoryColor,
              }}
            >
              {incident.category}
            </span>
            <span
              className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-white"
              style={{
                backgroundColor: getSeverityColor(incident.severity),
              }}
            >
              {incident.severity}
            </span>
            <span className="ml-auto text-[10px] font-medium text-text-disabled">
              {incident.distance}
            </span>
          </div>

          <h3 className="truncate text-[15px] font-bold leading-tight text-text-primary">
            {incident.title}
          </h3>

          <p className="mt-0.5 line-clamp-1 text-[13px] italic leading-snug text-text-secondary">
            {incident.summary}
          </p>

          <div className="mt-auto flex items-center justify-between pt-1">
            <span className="flex items-center gap-1 text-[11px] font-medium text-success">
              <span aria-hidden="true">•</span>
              {incident.responders} responding
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-text-disabled">{incident.timestamp}</span>
              <Link
                to={`/incidents/${incident.id}`}
                className="inline-flex items-center justify-center rounded-full bg-accent-primary px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-accent-hover"
              >
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSeverityColor(severity: Incident["severity"]) {
  if (severity === "High") return "var(--cat-fight)";
  if (severity === "Medium") return "var(--cat-transport)";
  return "var(--success)";
}
