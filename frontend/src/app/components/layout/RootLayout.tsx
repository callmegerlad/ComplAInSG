import { useRef, useState } from "react";
import { Outlet } from "react-router";
import { BottomNavBar } from "./BottomNavBar";
import { cn } from "@/lib/utils";

// ── constants ────────────────────────────────────────────────────────────────
const PULL_THRESHOLD_PX = 72;   // raw finger travel (px) to fire a refresh
const RESISTANCE = 0.45;         // indicator grows at 45% of finger travel
const MAX_INDICATOR_H = 48;      // maximum indicator strip height (px)
const REFRESH_DURATION_MS = 1500;

export function RootLayout() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const didPull = useRef(false);

  const [pullH, setPullH] = useState(0);           // 0 → MAX_INDICATOR_H
  const [refreshing, setRefreshing] = useState(false);

  // ── touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    const el = scrollRef.current;
    // only activate at the very top of the scroll container
    if (!el || el.scrollTop > 2) return;
    touchStartY.current = e.touches[0].clientY;
    didPull.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta <= 0) {
      // user is scrolling up — cancel pull detection
      touchStartY.current = null;
      setPullH(0);
      return;
    }
    didPull.current = true;
    setPullH(Math.min(delta * RESISTANCE, MAX_INDICATOR_H));
  };

  const handleTouchEnd = async () => {
    const wasPulled = didPull.current;
    const finalH = pullH;
    touchStartY.current = null;
    didPull.current = false;

    if (!wasPulled) {
      setPullH(0);
      return;
    }

    const rawTravel = finalH / RESISTANCE;

    if (rawTravel >= PULL_THRESHOLD_PX) {
      // threshold reached — lock at max height and start refresh
      setPullH(MAX_INDICATOR_H);
      setRefreshing(true);
      await new Promise<void>((resolve) => setTimeout(resolve, REFRESH_DURATION_MS));
      setRefreshing(false);
    }

    setPullH(0);
  };

  const indicatorH = refreshing ? MAX_INDICATOR_H : pullH;
  const progress = Math.min(indicatorH / MAX_INDICATOR_H, 1);

  return (
    <div className="relative flex h-screen w-full flex-col bg-bg-primary overflow-hidden">

      {/* ── Pull-to-refresh indicator strip ──────────────────────────────── */}
      <div
        className="absolute left-0 right-0 top-0 z-40 flex items-center justify-center overflow-hidden bg-accent-primary/6"
        style={{ height: indicatorH }}
        aria-hidden="true"
      >
        <span
          className={cn(
            "material-symbols-outlined select-none text-[22px] text-accent-primary",
            refreshing && "animate-spin",
          )}
          style={{
            opacity: progress,
            // rotate to hint at "refresh" as user pulls; stop rotating during spin
            transform: refreshing ? undefined : `rotate(${progress * 200}deg)`,
          }}
        >
          refresh
        </span>
      </div>

      {/* ── Scrollable page content ───────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pb-24 scroll-smooth"
        style={{ paddingTop: indicatorH > 0 ? indicatorH : undefined }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Outlet />
      </div>

      <BottomNavBar />
    </div>
  );
}
