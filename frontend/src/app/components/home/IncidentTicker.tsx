/**
 * IncidentTicker — A continuous auto-scrolling ticker of incident cards.
 *
 * - Renders the incidents list duplicated (concat) so the loop is seamless.
 * - Pauses on hover (desktop) and touch-hold.
 * - Tapping/clicking a card navigates to /incidents/:id.
 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { IncidentCredibility } from "../incidents/IncidentCredibility";
import type { Incident } from "./IncidentCard";

const TICKER_DURATION_S = 40;   // seconds for one full loop cycle (slower for readability)
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
      className="relative overflow-hidden h-full flex flex-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onTouchCancel={() => setPaused(false)}
    >
      {/* Hint banner at the top */}
      <div className="px-4 pb-1 shrink-0">
        <p className="text-center text-[10px] text-text-disabled tracking-wide select-none">
          Tap card for details · Hold to pause
        </p>
      </div>

      <div
        className="flex px-4 flex-1 min-h-0 items-stretch"
        style={{
          animation: `incidentTicker ${TICKER_DURATION_S}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
          /* Each card has its own right-margin so total width is exactly
             2 × setWidth → translateX(-50%) loops seamlessly. */
          width: "max-content",
        }}
      >
        {doubled.map((incident, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`${incident.id}-${i}`}
            className="shrink-0 cursor-pointer mr-3 h-full"
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

// ── helpers ────────────────────────────────────────────────────────────────
function getSeverityColor(s: Incident["severity"]) {
  if (s === "High") return "var(--cat-fight)";
  if (s === "Medium") return "var(--cat-transport)";
  return "var(--success)";
}

function InfoBadgeSmall({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="inline-flex max-w-full items-center gap-1 rounded-full bg-accent-subtle px-2 py-1 text-[10px] font-medium text-text-primary">
      <span className="material-symbols-outlined !text-[12px] text-accent-primary">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

// ── card with full feature parity ────────────────────────────────────────────
function TickerCard({ incident }: { incident: Incident }) {
  const sevColor = getSeverityColor(incident.severity);

  return (
    <div className="h-full flex flex-col rounded-2xl bg-surface-2 shadow-card overflow-hidden select-none border border-border-subtle/40">
      {/* severity stripe */}
      <div className="h-1 shrink-0" style={{ backgroundColor: sevColor }} />

      {/* thumbnail — portrait: image on top */}
      <div className="h-[40%] w-full overflow-hidden bg-surface-1 shrink-0">
        <ImageWithFallback
          src={incident.imageUrl ?? ""}
          alt={incident.title}
          className="h-full w-full object-cover block"
          draggable={false}
          loading="lazy"
        />
      </div>

      {/* info column */}
      <div className="flex flex-1 flex-col justify-between p-2.5 min-h-0 overflow-auto">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span
              className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: incident.categoryColor }}
            >
              {incident.category}
            </span>
            <span
              className="inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-white"
              style={{ backgroundColor: sevColor }}
            >
              {incident.severity}
            </span>
          </div>
          <h3 className="text-[13px] font-bold leading-tight text-text-primary line-clamp-1">
            {incident.location}
          </h3>
          <p className="mt-0.5 text-[11px] leading-snug text-text-secondary line-clamp-2">
            {incident.title}
          </p>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          <InfoBadgeSmall icon="route" label={incident.distance} />
          <InfoBadgeSmall icon="schedule" label={incident.timestamp} />
          <InfoBadgeSmall icon="groups" label={`${incident.responders}`} />
        </div>

        {/* Credibility voting */}
        <div onClick={(e) => e.stopPropagation()}>
          <IncidentCredibility incidentId={incident.id} className="mt-1.5" />
        </div>
      </div>
    </div>
  );
}
