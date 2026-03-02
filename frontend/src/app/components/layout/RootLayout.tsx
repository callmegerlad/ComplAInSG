import { useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { BottomNavBar } from "./BottomNavBar";
import { cn } from "@/lib/utils";

// ── constants ────────────────────────────────────────────────────────────────
const PULL_THRESHOLD_PX = 72;   // raw finger travel (px) to fire a refresh
const RESISTANCE = 0.45;         // indicator grows at 45% of finger travel
const MAX_INDICATOR_H = 48;      // maximum indicator strip height (px)
const REFRESH_DURATION_MS = 1500;

/** Tab order for horizontal swipe: right swipe → next tab (higher index). */
const TABS = ["/", "/map", "/notifications", "/profile"];
const SWIPE_TAB_THRESHOLD_PX = 50;

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollRef = useRef<HTMLDivElement>(null);
  /** Used only for pull-to-refresh — set only when scroll is at top. */
  const touchStartY = useRef<number | null>(null);
  /** Records full gesture start (x + y) for horizontal-swipe tab detection. */
  const gestureStart = useRef<{ x: number; y: number } | null>(null);
  const didPull = useRef(false);

  const [pullH, setPullH] = useState(0);           // 0 → MAX_INDICATOR_H
  const [refreshing, setRefreshing] = useState(false);

  // ── touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    gestureStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const el = scrollRef.current;
    // only activate pull-to-refresh at the very top of the scroll container
    if (!el || el.scrollTop > 2) return;
    touchStartY.current = e.touches[0].clientY;
    didPull.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || refreshing) return;

    // Cancel pull detection if horizontal movement is dominant
    const gs = gestureStart.current;
    if (gs) {
      const absDX = Math.abs(e.touches[0].clientX - gs.x);
      const absDY = Math.abs(e.touches[0].clientY - gs.y);
      if (absDX > 15 && absDX > absDY) {
        touchStartY.current = null;
        setPullH(0);
        return;
      }
    }

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

  const handleTouchEnd = async (e: React.TouchEvent) => {
    const gs = gestureStart.current;
    gestureStart.current = null;

    // ── Horizontal swipe → navigate tabs ──────────────────────────────────
    if (gs) {
      const deltaX = e.changedTouches[0].clientX - gs.x;
      const deltaY = e.changedTouches[0].clientY - gs.y;

      if (
        Math.abs(deltaX) > SWIPE_TAB_THRESHOLD_PX &&
        Math.abs(deltaX) > Math.abs(deltaY)
      ) {
        // cancel any pending pull state
        touchStartY.current = null;
        didPull.current = false;
        setPullH(0);

        const tabIndex = TABS.indexOf(location.pathname);
        if (tabIndex !== -1) {
          // right swipe (deltaX > 0) → go to NEXT tab (higher index)
          const nextIndex =
            deltaX > 0
              ? Math.min(tabIndex + 1, TABS.length - 1)
              : Math.max(tabIndex - 1, 0);
          if (nextIndex !== tabIndex) navigate(TABS[nextIndex]);
        }
        return;
      }
    }

    // ── Pull-to-refresh ───────────────────────────────────────────────────
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
        className="flex-1 overflow-y-auto pb-28 scroll-smooth"
        style={{ paddingTop: indicatorH > 0 ? indicatorH : undefined }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => { void handleTouchEnd(e); }}
      >
        <Outlet />
      </div>

      <BottomNavBar />
    </div>
  );
}
