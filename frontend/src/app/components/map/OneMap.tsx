import { useEffect, useRef } from "react";
import { generateOneMapMiniMapUrl, OneMapCoordinates, OneMapMiniMapConfig } from "@/lib/onemap";

interface OneMapProps {
  config: OneMapMiniMapConfig;
  className?: string;
}

/**
 * OneMap component that displays a minimap using OneMap's iframe
 * Uses OneMap's public minimap service for embedding maps
 */
export function OneMap({ config, className = "" }: OneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const mapUrl = generateOneMapMiniMapUrl(config);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-surface-2 ${className}`}
    >
      <iframe
        src={mapUrl}
        title="OneMap"
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      
      {/* Loading overlay - can be removed when iframe loads */}
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-transparent via-black/5 to-transparent pointer-events-none" />
    </div>
  );
}

interface OneMapMultiIncidentProps {
  incidents: Array<{
    id: string;
    title: string;
    location: string;
    lat: number;
    lng: number;
    severity: "High" | "Medium" | "Low";
  }>;
  centerLat?: number;
  centerLng?: number;
  zoomLevel?: number;
  className?: string;
}

/**
 * OneMap component for displaying multiple incidents
 * Currently displays the center point - individual incidents can be shown via popups
 */
export function OneMapMultiIncident({
  incidents,
  centerLat,
  centerLng,
  zoomLevel = 14,
  className = "",
}: OneMapMultiIncidentProps) {
  // Calculate center if not provided
  let finalLat = centerLat;
  let finalLng = centerLng;

  if (finalLat === undefined || finalLng === undefined) {
    if (incidents.length > 0) {
      finalLat =
        incidents.reduce((sum, inc) => sum + inc.lat, 0) / incidents.length;
      finalLng =
        incidents.reduce((sum, inc) => sum + inc.lng, 0) / incidents.length;
    } else {
      // Default to Singapore center
      finalLat = 1.3521;
      finalLng = 103.8198;
    }
  }

  const config: OneMapMiniMapConfig = {
    mapStyle: "Default",
    zoomLevel,
    latLng: { lat: finalLat!, lng: finalLng! },
  };

  return <OneMap config={config} className={className} />;
}
