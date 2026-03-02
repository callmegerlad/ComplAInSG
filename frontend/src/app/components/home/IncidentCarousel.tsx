import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { IncidentCredibility } from "../incidents/IncidentCredibility";
import type { Incident } from "./IncidentCard";

// ─── constants ────────────────────────────────────────────────────────────────
const MAX_INCIDENTS = 8;
const AUTO_SCROLL_MS = 6000;
const RESUME_AFTER_IDLE_MS = 8000;
const SWIPE_THRESHOLD_PX = 36;
const HOLD_THRESHOLD_MS = 250;   // hold > 250 ms → pause; < 250 ms + no swipe → tap
const SLIDE_DURATION_MS = 320;
const WHEEL_THRESHOLD = 30;

type Direction = "left" | "right";

// ─── helpers ─────────────────────────────────────────────────────────────────
function getSeverityColor(s: Incident["severity"]) {
  if (s === "High") return "var(--cat-fight)";
  if (s === "Medium") return "var(--cat-transport)";
  return "var(--success)";
}

function CategoryPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
      style={{ backgroundColor: tone }}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function SeverityPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-white"
      style={{ backgroundColor: tone }}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function InfoBadgeLight({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent-subtle px-2.5 py-1.5 text-[11px] font-medium text-text-primary">
      <span className="material-symbols-outlined !text-[14px] text-accent-primary">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
interface IncidentCarouselProps {
  incidents: Incident[];
  /** When true the carousel stretches to fill its flex-1 parent. */
  fillHeight?: boolean;
}

export function IncidentCarousel({
  incidents,
  fillHeight = false,
}: IncidentCarouselProps) {
  const items = incidents.slice(0, MAX_INCIDENTS);
  const count = items.length;
  const navigate = useNavigate();

  // ── slide state ────────────────────────────────────────────────────────────
  const [current, setCurrent] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>("left");
  const [sliding, setSliding] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // bump to reset the timer bar CSS animation

  // ── pause state ────────────────────────────────────────────────────────────
  const [isPaused, setIsPaused] = useState(false);

  // ── refs ───────────────────────────────────────────────────────────────────
  const slidingRef = useRef(false);
  const isPausedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerDownTime = useRef(0);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const wasHeld = useRef(false);

  isPausedRef.current = isPaused;

  // ── auto-scroll helpers ────────────────────────────────────────────────────
  const clearAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // forward declaration — doSlide defined below; we'll use a ref
  const doSlideRef = useRef<(dir: Direction, ti?: number) => void>(() => {});

  const startAutoScroll = useCallback(() => {
    if (count <= 1) return;
    clearAutoScroll();
    intervalRef.current = setInterval(() => {
      if (slidingRef.current || isPausedRef.current) return;
      doSlideRef.current("left");
    }, AUTO_SCROLL_MS);
  }, [count, clearAutoScroll]);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      startAutoScroll();
    }, RESUME_AFTER_IDLE_MS);
  }, [startAutoScroll]);

  // ── slide trigger ──────────────────────────────────────────────────────────
  const doSlide = useCallback(
    (dir: Direction, targetIndex?: number) => {
      if (slidingRef.current) return;

      setCurrent((cur) => {
        const next =
          targetIndex !== undefined
            ? (targetIndex + count) % count
            : dir === "left"
              ? (cur + 1) % count
              : (cur - 1 + count) % count;

        if (next === cur) return cur;

        setLeaving(cur);
        setDirection(dir);
        setSliding(true);
        setAnimating(false);
        setTimerKey((k) => k + 1);
        slidingRef.current = true;

        setTimeout(() => {
          setSliding(false);
          setLeaving(null);
          setAnimating(false);
          slidingRef.current = false;
        }, SLIDE_DURATION_MS + 50);

        return next;
      });
    },
    [count],
  );

  doSlideRef.current = doSlide;

  // ── trigger animation on second frame after slide starts ──────────────────
  useEffect(() => {
    if (!sliding) return;
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setAnimating(true));
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [sliding]);

  // ── auto-scroll lifecycle ─────────────────────────────────────────────────
  useEffect(() => {
    startAutoScroll();
    return () => {
      clearAutoScroll();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [startAutoScroll, clearAutoScroll]);

  useEffect(() => {
    if (isPaused) clearAutoScroll();
    else startAutoScroll();
  }, [isPaused, startAutoScroll, clearAutoScroll]);

  // ── navigation helpers used in event handlers ─────────────────────────────
  const goNext = useCallback(() => {
    clearAutoScroll();
    doSlide("left");
    scheduleResume();
  }, [clearAutoScroll, doSlide, scheduleResume]);

  const goPrev = useCallback(() => {
    clearAutoScroll();
    doSlide("right");
    scheduleResume();
  }, [clearAutoScroll, doSlide, scheduleResume]);

  const goTo = useCallback(
    (i: number) => {
      clearAutoScroll();
      doSlide(i > current ? "left" : "right", i);
      scheduleResume();
    },
    [clearAutoScroll, doSlide, scheduleResume, current],
  );

  // ── pointer handlers (hold-to-pause + tap-for-details + swipe) ────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore clicks on interactive sub-elements (credibility, dots, arrows)
    if ((e.target as HTMLElement).closest("[data-no-slide]")) return;

    pointerDownTime.current = Date.now();
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    wasHeld.current = false;

    holdTimerRef.current = setTimeout(() => {
      wasHeld.current = true;
      setIsPaused(true);
    }, HOLD_THRESHOLD_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDownPos.current) return;
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    if (dx > 8 || dy > 8) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    const down = pointerDownPos.current;
    pointerDownPos.current = null;
    if (!down) return;

    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    const elapsed = Date.now() - pointerDownTime.current;

    // If was held → release the pause, schedule resume
    if (wasHeld.current) {
      wasHeld.current = false;
      setIsPaused(false);
      scheduleResume();
      return;
    }

    // Horizontal swipe?
    if (
      Math.abs(dx) > SWIPE_THRESHOLD_PX &&
      Math.abs(dx) > Math.abs(dy)
    ) {
      clearAutoScroll();
      if (dx < 0) goNext();
      else goPrev();
      return;
    }

    // Short, nearly stationary tap → navigate to details
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && elapsed < 400) {
      navigate(`/incidents/${items[current].id}`);
    }
  };

  // ── mouse-wheel navigation ─────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > WHEEL_THRESHOLD) {
      e.preventDefault();
      clearAutoScroll();
      if (e.deltaX > 0) goNext();
      else goPrev();
      scheduleResume();
    }
  };

  if (count === 0) return null;

  // CSS transforms for the slide animation
  const enterFrom = direction === "left" ? "100%" : "-100%";
  const leaveTo = direction === "left" ? "-100%" : "100%";

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "flex flex-col",
        fillHeight && "h-full",
      )}
    >
      {/* ── Slide container ──────────────────────────────────────────────── */}
      {/* Grid with both cards in the same cell so they overlap cleanly */}
      <div
        className={cn(
          "grid overflow-hidden rounded-[24px] [&>*]:col-start-1 [&>*]:row-start-1",
          fillHeight && "flex-1 min-h-0",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { pointerDownPos.current = null; wasHeld.current = false; }}
        onWheel={handleWheel}
        style={{ cursor: "pointer" }}
      >
        {/* Leaving card (only during transition) */}
        {sliding && leaving !== null && (
          <div
            className={cn(fillHeight && "h-full")}
            style={{
              transform: animating ? `translateX(${leaveTo})` : "translateX(0)",
              transition: animating
                ? `transform ${SLIDE_DURATION_MS}ms ease-in-out`
                : "none",
              zIndex: 1,
            }}
          >
            <CardContent
              incident={items[leaving]}
              timerKey={-1}  // no timer on leaving card
              isPaused={true}
              fillHeight={fillHeight}
              autoScrollMs={AUTO_SCROLL_MS}
            />
          </div>
        )}

        {/* Current / entering card */}
        <div
          className={cn(fillHeight && "h-full")}
          style={{
            transform: sliding
              ? animating
                ? "translateX(0)"
                : `translateX(${enterFrom})`
              : "translateX(0)",
            transition:
              sliding && animating
                ? `transform ${SLIDE_DURATION_MS}ms ease-in-out`
                : "none",
            zIndex: 2,
          }}
        >
          <CardContent
            incident={items[current]}
            timerKey={timerKey}
            isPaused={isPaused}
            fillHeight={fillHeight}
            autoScrollMs={AUTO_SCROLL_MS}
          />
        </div>
      </div>

      {/* ── Controls: prev · dots · next ────────────────────────────────── */}
      {count > 1 && (
        <div
          className="mt-2 flex shrink-0 items-center justify-center gap-3"
          data-no-slide
        >
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous incident"
            data-no-slide
            className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-text-secondary shadow-sm transition-colors hover:bg-accent-subtle hover:text-accent-primary active:scale-90"
          >
            <span className="material-symbols-outlined text-[14px]">chevron_left</span>
          </button>

          <div className="flex items-center gap-1.5" data-no-slide>
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to incident ${i + 1}`}
                data-no-slide
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === current
                    ? "h-2 w-5 bg-accent-primary"
                    : "h-2 w-2 bg-border-subtle hover:bg-accent-primary/50",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next incident"
            data-no-slide
            className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-text-secondary shadow-sm transition-colors hover:bg-accent-subtle hover:text-accent-primary active:scale-90"
          >
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes carouselTimer {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}

// ─── Card rendering (extracted so both leaving & entering share markup) ────────
function CardContent({
  incident,
  timerKey,
  isPaused,
  fillHeight,
  autoScrollMs,
}: {
  incident: Incident;
  timerKey: number;
  isPaused: boolean;
  fillHeight: boolean;
  autoScrollMs: number;
}) {
  return (
    <article
      className={cn(
        "bg-surface-2 shadow-card select-none overflow-hidden rounded-[24px]",
        fillHeight && "flex flex-col h-full",
      )}
    >
      {/* severity stripe */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: getSeverityColor(incident.severity) }}
      />

      {/* timer bar — grows left→right over autoScrollMs */}
      <div className="h-0.5 w-full shrink-0 bg-accent-subtle overflow-hidden">
        <div
          key={timerKey}
          className="h-full bg-accent-primary"
          style={{
            animation:
              timerKey >= 0
                ? `carouselTimer ${autoScrollMs}ms linear forwards`
                : "none",
            animationPlayState: isPaused ? "paused" : "running",
            width: timerKey >= 0 ? undefined : "0%",
          }}
        />
      </div>

      {/* card body */}
      <div
        className={cn(
          "flex",
          fillHeight ? "flex-1 min-h-0" : "min-h-[132px]",
        )}
      >
        {/* thumbnail */}
        <div className="relative w-[42%] shrink-0">
          {incident.imageUrl && (
            <ImageWithFallback
              src={incident.imageUrl}
              alt={incident.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>

        {/* info column */}
        <div className="flex flex-1 flex-col justify-between p-3 min-w-0">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <CategoryPill label={incident.category} tone={incident.categoryColor} />
              <SeverityPill
                label={incident.severity}
                tone={getSeverityColor(incident.severity)}
              />
            </div>
            <h3 className="mt-1 text-[16px] font-bold leading-tight text-text-primary line-clamp-1">
              {incident.location}
            </h3>
            <p className="mt-1 text-[12px] leading-5 text-text-secondary line-clamp-2">
              {incident.title}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <InfoBadgeLight icon="route" label={incident.distance} />
            <InfoBadgeLight icon="schedule" label={incident.timestamp} />
            <InfoBadgeLight icon="groups" label={`${incident.responders}`} />
          </div>

          {/* Credibility — marked so pointer events don't trigger card nav */}
          <div data-no-slide onClick={(e) => e.stopPropagation()}>
            <IncidentCredibility incidentId={incident.id} className="mt-2" />
          </div>
        </div>
      </div>

      {/* Tap-hint footer (replaces the old Details button) */}
      <div className="shrink-0 px-3 pb-3 pt-1">
        <p className="text-center text-[10px] text-text-disabled tracking-wide select-none">
          Tap card for details · Hold to pause
        </p>
      </div>
    </article>
  );
}
