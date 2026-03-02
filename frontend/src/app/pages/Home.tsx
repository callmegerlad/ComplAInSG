import { useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { AlertBanner } from "../components/home/AlertBanner";
import { Incident } from "../components/home/IncidentCard";
import { IncidentCarousel } from "../components/home/IncidentCarousel";
import { IncidentTicker } from "../components/home/IncidentTicker";
import { RecordFlow } from "../components/record/RecordFlow";
import { Drawer, DrawerContent } from "../components/ui/drawer";
import { incidents as allIncidents } from "@/lib/incidents";
import { useCurrentLocation } from "@/lib/location";

const CONTINUOUS_VIEW_KEY = "complainsg-continuous-view";

export function HomePage() {
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
  const continuousView = localStorage.getItem(CONTINUOUS_VIEW_KEY) !== "false";
  const incidents: Incident[] = allIncidents.slice(0, 8);
  const currentLocation = useCurrentLocation();

  return (
    <Drawer
      open={isRecordDrawerOpen}
      onOpenChange={(open) => {
        setIsRecordDrawerOpen(open);
      }}
    >
      {/*
       * h-full: fills the parent scroll container's visible height (= viewport
       * minus nav bar).  overflow-hidden: prevents any child from causing
       * the page to scroll — content stretches/shrinks to fit.
       */}
      <div className="flex h-full flex-col overflow-hidden bg-bg-primary">

        {/* ── TopBar (no search — saves vertical space for content) ──────── */}
        {/* position:relative lets the AlertBanner overlay hang below it. */}
        <div className="relative shrink-0 z-20">
          <TopBar showSearch={false} />

          {/* AlertBanner: absolute overlay, slides up+fades when timer expires */}
          <div
            className="absolute left-0 right-0 top-full z-30 pointer-events-none"
            aria-live="polite"
          >
            <AlertBanner message="Fight reported" distance="80m away" />
          </div>
        </div>

        {/* ── Main content area ─────────────────────────────────────────────*/}
        <div className="flex flex-1 flex-col min-h-0">

          {/* FAST REPORT section — fixed height, never scrolls away */}
          {/* Circle scaled to 240 px (from the original 360 px) so everything
              fits on iPhone SE and up without the TopBar search bar. */}
          <section className="relative shrink-0 flex items-center justify-center px-4 py-3">
            <div
              className="absolute inset-x-5 bottom-2 top-1 rounded-[22px] border border-border-subtle/60"
              style={{
                background: "var(--report-backdrop)",
                boxShadow: "var(--report-backdrop-shadow)",
              }}
            />
            <div
              className="absolute inset-x-7 bottom-5 top-4 rounded-[18px] opacity-100"
              style={{ backgroundImage: "var(--report-backdrop-pattern)" }}
            />
            <div className="absolute inset-x-9 top-6 h-px bg-white/50 dark:bg-white/18" />
            <div className="absolute inset-x-14 bottom-8 h-px bg-white/38 dark:bg-white/14" />
            <div className="absolute left-9 top-6 h-10 w-10 border-l border-t border-white/55 dark:border-white/20" />
            <div className="absolute bottom-6 right-10 h-10 w-10 border-b border-r border-white/45 dark:border-white/16" />
            <div className="absolute right-10 top-8 h-28 w-28 bg-accent-primary/10 blur-3xl dark:bg-accent-primary/14" />
            <div
              className="absolute inset-x-10 top-4 h-16 rounded-full blur-3xl"
              style={{ backgroundColor: "var(--report-halo)" }}
            />

            {/* Circle container — 240 px (was 360 px) */}
            <div className="relative flex h-[240px] w-[240px] items-center justify-center rounded-full">
              <div
                className="absolute inset-0 rounded-full animate-[ripple_2.4s_ease-out_infinite]"
                style={{ border: "1px solid var(--report-ring-strong)" }}
              />
              <div
                className="absolute inset-[23px] rounded-full animate-[ripple_2.4s_ease-out_0.4s_infinite]"
                style={{ border: "1px solid var(--report-ring-soft)" }}
              />
              {/* Shell (276 → 184 px) */}
              <div
                className="relative z-10 flex h-[184px] w-[184px] items-center justify-center rounded-full bg-surface-1"
                style={{ boxShadow: "var(--report-shell-shadow)" }}
              >
                {/* Button (224 → 150 px) */}
                <button
                  onClick={() => setIsRecordDrawerOpen(true)}
                  className="flex h-[150px] w-[150px] flex-col items-center justify-center gap-2 rounded-full text-white transition-transform duration-150 active:scale-[0.96]"
                  style={{
                    background: "var(--report-button-gradient)",
                    boxShadow: "var(--report-button-shadow)",
                  }}
                  aria-label="Open record flow"
                >
                  <span className="material-symbols-outlined !text-[42px]">warning</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    FAST REPORT
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Nearby Incidents section — fills remaining space (grows on tall
              screens, stays minimum-height on smaller screens) */}
          <section className="flex-1 min-h-0 mx-4 mb-3 rounded-[24px] bg-surface-1 px-4 pb-4 pt-4 shadow-[0_2px_20px_rgba(27,42,65,0.10)] flex flex-col">
            <div className="shrink-0">
              <h2 className="text-text-primary text-[18px] font-bold tracking-tight">
                Nearby Incidents
              </h2>
              <p className="mt-0.5 text-[12px] text-text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined !text-[13px] text-accent-primary">
                  my_location
                </span>
                <span className="truncate">{currentLocation}</span>
              </p>
            </div>

            {/* Incident view — ticker OR carousel depending on user setting */}
            {continuousView ? (
              <div className="mt-3 -mx-4 overflow-hidden">
                <IncidentTicker incidents={incidents} />
              </div>
            ) : (
              <div className="flex-1 min-h-0 mt-3">
                <IncidentCarousel incidents={incidents} fillHeight />
              </div>
            )}
          </section>

        </div>
      </div>

      <DrawerContent className="h-[85vh] bg-surface-1 rounded-t-2xl">
        <RecordFlow />
      </DrawerContent>

      <style>{`
        @keyframes ripple {
          0%   { transform: scale(0.92); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: scale(1.08); opacity: 0; }
        }
      `}</style>
    </Drawer>
  );
}
