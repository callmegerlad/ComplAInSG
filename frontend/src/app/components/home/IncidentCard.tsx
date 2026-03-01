import { cn } from "@/lib/utils";
import { ImageWithFallback } from "../figma/ImageWithFallback";

export interface Incident {
  id: string;
  category: string;
  categoryColor: string; // e.g. var(--cat-fight)
  categoryIcon: string;
  severity: 'High' | 'Medium' | 'Low';
  location: string;
  distance: string;
  title: string;
  summary: string;
  timestamp: string;
  imageUrl?: string;
  responders: number;
}

export function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden shadow-card flex relative">
      {/* Left accent border */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 h-full" 
        style={{ backgroundColor: incident.categoryColor }}
      />
      
      <div className="p-4 pl-5 flex gap-4 w-full">
        {/* Thumbnail */}
        <div className="w-20 h-20 bg-surface-2 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
          {incident.imageUrl ? (
            <ImageWithFallback 
              src={incident.imageUrl} 
              alt={incident.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span 
              className="material-symbols-outlined text-[32px]" 
              style={{ color: incident.categoryColor }}
            >
              {incident.categoryIcon}
            </span>
          )}
        </div>
        
        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 justify-between">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span 
              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ 
                backgroundColor: `color-mix(in srgb, ${incident.categoryColor}, transparent 90%)`,
                color: incident.categoryColor 
              }}
            >
              {incident.category}
            </span>
            <span 
              className="border px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
              style={{ 
                borderColor: incident.categoryColor,
                color: incident.categoryColor
              }}
            >
              {incident.severity}
            </span>
            <span className="ml-auto text-text-disabled text-[10px] font-medium">{incident.distance}</span>
          </div>
          
          <h3 className="text-text-primary font-bold text-[15px] truncate leading-tight">{incident.title}</h3>
          
          <p className="text-text-secondary italic text-[13px] line-clamp-1 leading-snug mt-0.5">
            {incident.summary}
          </p>
          
          <div className="flex items-center justify-between mt-auto pt-1">
            <span className="text-success font-medium text-[11px] flex items-center gap-1">
              ● {incident.responders} responding
            </span>
            <span className="text-text-disabled font-mono text-[10px]">
              {incident.timestamp}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
