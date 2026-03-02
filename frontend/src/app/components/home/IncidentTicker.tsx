/**
 * IncidentTicker — A continuous auto-scrolling ticker of incident cards.
 *
 * - Renders the incidents list duplicated (concat) so the loop is seamless.
 * - Pauses on hover (desktop) and touch-hold.
 * - Tapping/clicking a card navigates to /incidents/:id.
 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { Incident } from "./IncidentCard";

const TICKER_DURATION_S = 22;   // seconds for one full loop cycle
const CARD_WIDTH = "min(70vw, 272px)";

interface IncidentTickerProps {
  incidents: Incident[];
}

export function IncidentTicker({ incidents }: IncidentTickerProps) {
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);

  // Tap detection: track pointer down position + time
  const pointerDownPos = useRef<{ x: number; y: number; t: number } | null>(null);

  if (incidents.length === 0) return null;

  // Double the list so we can loop seamlessly from 0 → -50%
  const doubled = [...incidents, ...incidents];

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent, incident: Incident) => {
    const d = pointerDownPos.current;
    pointerDownPos.current = null;
    if (!d) return;
    const dx = Math.abs(e.clientX - d.x);
    const dy = Math.abs(e.clientY - d.y);
    const elapsed = Date.now() - d.t;
    if (dx < 10 && dy < 10 && elapsed < 400) {
      navigate(`/incidents/${incident.id}`);
    }
  };

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onTouchCancel={() => setPaused(false)}
    >
      <div
        className="flex gap-3 px-4"
        style={{
          animation: `incidentTicker ${TICKER_DURATION_S}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
          /* Inner width is doubled cards → translateX(-50%) lands back at start */
          width: "max-content",
        }}
      >
        {doubled.map((incident, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`${incident.id}-${i}`}
            className="shrink-0 cursor-pointer"
            style={{ width: CARD_WIDTH }}
            onPointerDown={handlePointerDown}
            onPointerUp={(e) => handlePointerUp(e, incident)}
          >
            <TickerCard incident={incident} />
          </div>
        ))}
      </div>

      {/* Fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-bg-primary to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-bg-primary to-transparent" />

      <style>{`
        @keyframes incidentTicker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ── mini card ────────────────────────────────────────────────────────────────
function TickerCard({ incident }: { incident: Incident }) {
  const sevColor =
    incident.severity === "High"
      ? "var(--cat-fight)"
      : incident.severity === "Medium"
        ? "var(--cat-transport)"
        : "var(--success)";

  return (
    <div className="rounded-2xl bg-surface-2 shadow-card overflow-hidden select-none border border-border-subtle/40">
      {/* severity stripe */}
      <div className="h-1" style={{ backgroundColor: sevColor }} />

      {/* thumbnail */}
      {incident.imageUrl && (
        <div className="h-[88px] w-full overflow-hidden">
          <img
            src={incident.imageUrl}
            alt={incident.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* info */}
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: incident.categoryColor }}
          >
            {incident.category}
          </span>
          <span
            className="rounded-full px-1.5 py-0 text-[9px] font-bold text-white"
            style={{ backgroundColor: sevColor }}
          >
            {incident.severity}
          </span>
        </div>
        <p className="text-[12px] font-semibold leading-tight text-text-primary line-clamp-1">
          {incident.location}
        </p>
        <p className="mt-0.5 text-[10px] text-text-secondary line-clamp-2">
          {incident.title}
        </p>
        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-text-disabled">
          <span className="material-symbols-outlined !text-[10px]">schedule</span>
          <span>{incident.timestamp}</span>
          <span className="mx-0.5">·</span>
          <span className="material-symbols-outlined !text-[10px]">route</span>
          <span>{incident.distance}</span>
        </div>
      </div>
    </div>
  );
}
