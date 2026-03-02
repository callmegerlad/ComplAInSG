import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { IncidentCredibility } from "../incidents/IncidentCredibility";
import type { Incident } from "./IncidentCard";

// ─── constants ────────────────────────────────────────────────────────────────
const MAX_INCIDENTS = 8;
const AUTO_SCROLL_MS = 8000;
const RESUME_AFTER_IDLE_MS = 8000;
const SWIPE_THRESHOLD_PX = 30;

// ─── small sub-components (kept local, same style as Home.tsx helpers) ────────
function getSeverityColor(severity: Incident["severity"]) {
  if (severity === "High") return "var(--cat-fight)";
  if (severity === "Medium") return "var(--cat-transport)";
  return "var(--success)";
}

function CategoryPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className="inline-flex w-fit max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
      style={{ backgroundColor: tone }}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function SeverityPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className="inline-flex w-fit max-w-full items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-white"
      style={{ backgroundColor: tone }}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function InfoBadgeLight({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-accent-subtle px-2.5 py-1.5 text-[11px] font-medium text-text-primary">
      <span className="material-symbols-outlined !text-[14px] text-accent-primary">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

// ─── main carousel ────────────────────────────────────────────────────────────
interface IncidentCarouselProps {
  incidents: Incident[];
}

export function IncidentCarousel({ incidents }: IncidentCarouselProps) {
  const items = incidents.slice(0, MAX_INCIDENTS);
  const count = items.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0); // bumped to trigger fade animation

  const touchStartX = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── auto-scroll helpers ──────────────────────────────────────────────────
  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    if (count <= 1) return;
    stopAutoScroll();
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
      setAnimKey((prev) => prev + 1);
    }, AUTO_SCROLL_MS);
  }, [count, stopAutoScroll]);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current !== null) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(startAutoScroll, RESUME_AFTER_IDLE_MS);
  }, [startAutoScroll]);

  // ── start auto-scroll on mount; restart when count changes ──────────────
  useEffect(() => {
    startAutoScroll();
    return () => {
      stopAutoScroll();
      if (resumeTimerRef.current !== null) clearTimeout(resumeTimerRef.current);
    };
  }, [startAutoScroll, stopAutoScroll]);

  // ── navigation ───────────────────────────────────────────────────────────
  const navigateTo = useCallback(
    (index: number) => {
      stopAutoScroll();
      setCurrentIndex((index + count) % count);
      setAnimKey((prev) => prev + 1);
      scheduleResume();
    },
    [count, stopAutoScroll, scheduleResume],
  );

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => {
      stopAutoScroll();
      scheduleResume();
      setAnimKey((k) => k + 1);
      return (prev - 1 + count) % count;
    });
  }, [count, stopAutoScroll, scheduleResume]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      stopAutoScroll();
      scheduleResume();
      setAnimKey((k) => k + 1);
      return (prev + 1) % count;
    });
  }, [count, stopAutoScroll, scheduleResume]);

  // ── swipe handlers ───────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  if (count === 0) return null;

  const incident = items[currentIndex];

  return (
    <div className="mt-4">
      {/* ── incident card (fade-in on slide change) ────────────────────── */}
      <article
        key={animKey}
        className="overflow-hidden rounded-[24px] bg-surface-2 shadow-card select-none animate-[carouselFade_0.35s_ease-out]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* severity stripe */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: getSeverityColor(incident.severity) }}
        />

        {/* card body */}
        <div className="flex min-h-[132px]">
          {/* thumbnail */}
          <div className="relative w-[42%] shrink-0">
            {incident.imageUrl ? (
              <ImageWithFallback
                src={incident.imageUrl}
                alt={incident.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
          </div>

          {/* info column */}
          <div className="flex flex-1 flex-col justify-between p-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CategoryPill label={incident.category} tone={incident.categoryColor} />
                <SeverityPill
                  label={incident.severity}
                  tone={getSeverityColor(incident.severity)}
                />
              </div>
              <h3 className="mt-1 text-[18px] font-bold leading-tight text-text-primary">
                {incident.location}
              </h3>
              <p className="mt-2 text-[13px] leading-5 text-text-secondary">
                {incident.title}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <InfoBadgeLight icon="route" label={incident.distance} />
              <InfoBadgeLight icon="schedule" label={incident.timestamp} />
              <InfoBadgeLight icon="groups" label={`${incident.responders} responding`} />
            </div>

            <IncidentCredibility incidentId={incident.id} className="mt-3" />
          </div>
        </div>

        {/* details button */}
        <div className="px-4 pb-4">
          <Link
            to={`/incidents/${incident.id}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-accent-primary px-3 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-accent-hover"
          >
            Details
          </Link>
        </div>
      </article>

      {/* ── controls: prev · dots · next ──────────────────────────────── */}
      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          {/* prev button */}
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous incident"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-text-secondary shadow-sm transition-colors hover:bg-accent-subtle hover:text-accent-primary active:scale-90"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>

          {/* dot indicators */}
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigateTo(i)}
                aria-label={`Go to incident ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "h-2 w-5 bg-accent-primary"
                    : "h-2 w-2 bg-border-subtle hover:bg-accent-primary/50"
                }`}
              />
            ))}
          </div>

          {/* next button */}
          <button
            type="button"
            onClick={goNext}
            aria-label="Next incident"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-text-secondary shadow-sm transition-colors hover:bg-accent-subtle hover:text-accent-primary active:scale-90"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes carouselFade {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
    </div>
  );
}
