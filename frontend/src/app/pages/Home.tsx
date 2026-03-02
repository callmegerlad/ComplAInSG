import { useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { AlertBanner } from "../components/home/AlertBanner";
import type { Incident } from "../components/home/IncidentCard";
import { IncidentCarousel } from "../components/home/IncidentCarousel";
import { IncidentTicker } from "../components/home/IncidentTicker";
import { RecordFlow } from "../components/record/RecordFlow";
import { Drawer, DrawerContent } from "../components/ui/drawer";
import { incidents as allIncidents } from "@/lib/incidents";
import { useCurrentLocation } from "@/lib/location";

const CONTINUOUS_VIEW_KEY = "complainsg-continuous-view";

/** Alert queue — only the first is shown; dismissed alerts are removed. */
const INITIAL_ALERTS = [
  { id: "a1", message: "Fight reported", distance: "80m away" },
];

export function HomePage() {
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const continuousView = localStorage.getItem(CONTINUOUS_VIEW_KEY) !== "false";
  const incidents: Incident[] = allIncidents.slice(0, 8);
  const { label: currentLocation, lastUpdated } = useCurrentLocation();

  const formatTime = (d: Date | null) => {
    if (!d) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const dismissCurrentAlert = () => setAlerts((prev) => prev.slice(1));
  const activeAlert = alerts[0] ?? null;

  return (
    <Drawer open={isRecordDrawerOpen} onOpenChange={setIsRecordDrawerOpen}>
      {/* h-full + overflow-hidden: fill viewport, no page scroll */}
      <div className="flex h-full flex-col overflow-hidden bg-bg-primary">

        {/* ── TopBar + alert overlay ──────────────────────────────────────── */}
        <div className="relative shrink-0 z-20">
          <TopBar showSearch={true} />
          <div
            className="absolute left-0 right-0 top-full z-30 pointer-events-none"
            aria-live="polite"
          >
            {activeAlert && (
              <AlertBanner
                key={activeAlert.id}
                message={activeAlert.message}
                distance={activeAlert.distance}
                onDismiss={dismissCurrentAlert}
              />
            )}
          </div>
        </div>

        {/* ── Main content: two 50 / 50 sections, always top → down ─────── */}
        <div className="flex flex-1 min-h-0 flex-col gap-2 p-2">

          {/* ── FAST REPORT section ── 50 % ───────────────────────────────── */}
          <section className="relative flex flex-1 min-h-0 items-center justify-center rounded-[22px] overflow-hidden">
            {/* decorative background */}
            <div
              className="absolute inset-0 rounded-[22px] border border-border-subtle/60"
              style={{
                background: "var(--report-backdrop)",
                boxShadow: "var(--report-backdrop-shadow)",
              }}
            />
            <div
              className="absolute inset-2 rounded-[18px] opacity-100"
              style={{ backgroundImage: "var(--report-backdrop-pattern)" }}
            />
            <div className="absolute inset-x-6 top-4 h-px bg-white/50 dark:bg-white/18" />
            <div className="absolute inset-x-8 bottom-6 h-px bg-white/38 dark:bg-white/14" />
            <div className="absolute left-6 top-4 h-8 w-8 border-l border-t border-white/55 dark:border-white/20" />
            <div className="absolute bottom-5 right-7 h-8 w-8 border-b border-r border-white/45 dark:border-white/16" />
            <div className="absolute right-8 top-6 h-24 w-24 bg-accent-primary/10 blur-3xl dark:bg-accent-primary/14" />
            <div
              className="absolute inset-x-8 top-3 h-14 rounded-full blur-3xl"
              style={{ backgroundColor: "var(--report-halo)" }}
            />

            {/* Circle — dynamically sized via percentage limits */}
            <div className="relative flex aspect-square w-full h-full max-h-[85%] max-w-[85%] items-center justify-center rounded-full">
              <div
                className="absolute inset-0 rounded-full animate-[ripple_2.4s_ease-out_infinite]"
                style={{ border: "1px solid var(--report-ring-strong)" }}
              />
              <div
                className="absolute inset-[12%] rounded-full animate-[ripple_2.4s_ease-out_0.4s_infinite]"
                style={{ border: "1px solid var(--report-ring-soft)" }}
              />
              {/* Shell */}
              <div
                className="relative z-10 flex h-[76%] w-[76%] items-center justify-center rounded-full bg-surface-1"
                style={{ boxShadow: "var(--report-shell-shadow)" }}
              >
                {/* Button */}
                <button
                  onClick={() => setIsRecordDrawerOpen(true)}
                  className="flex h-[80%] w-[80%] flex-col items-center justify-center gap-1.5 rounded-full text-white transition-transform duration-150 active:scale-[0.96]"
                  style={{
                    background: "var(--report-button-gradient)",
                    boxShadow: "var(--report-button-shadow)",
                  }}
                  aria-label="Open record flow"
                >
                  <span className="material-symbols-outlined !text-[36px]">warning</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.18em]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    FAST REPORT
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* ── Nearby Incidents section ── 50 % ──────────────────────────── */}
          <section className="flex flex-1 min-h-0 flex-col rounded-[24px] bg-surface-1 px-4 pb-3 pt-3 shadow-[0_2px_20px_rgba(27,42,65,0.10)]">
            <div className="shrink-0">
              <h2 className="text-text-primary text-[16px] font-bold tracking-tight">
                Nearby Incidents
              </h2>
              <p className="mt-0.5 text-[11px] text-text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined !text-[13px] text-accent-primary">
                  my_location
                </span>
                <span className="truncate flex-1">{currentLocation}</span>
                {lastUpdated && (
                  <span className="shrink-0 text-text-disabled text-[10px] ml-auto">
                    {formatTime(lastUpdated)}
                  </span>
                )}
              </p>
            </div>

            {/* Incident view — ticker OR carousel depending on user setting */}
            {continuousView ? (
              <div className="mt-2 -mx-4 flex-1 min-h-0 overflow-hidden">
                <IncidentTicker incidents={incidents} />
              </div>
            ) : (
              <div className="flex-1 min-h-0 mt-2">
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
