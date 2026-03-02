import { useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { AlertBanner } from "../components/home/AlertBanner";
import { Incident } from "../components/home/IncidentCard";
import { IncidentCarousel } from "../components/home/IncidentCarousel";
import { RecordFlow } from "../components/record/RecordFlow";
import { Drawer, DrawerContent } from "../components/ui/drawer";
import { incidents as allIncidents } from "@/lib/incidents";

export function HomePage() {
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
  const incidents: Incident[] = allIncidents.slice(0, 8);
  const recommendedIncident = incidents[0];

  return (
    <Drawer
      open={isRecordDrawerOpen}
      onOpenChange={(open) => {
        setIsRecordDrawerOpen(open);
      }}
    >
      <div className="flex min-h-full flex-col bg-bg-primary">
        <div className="sticky top-0 z-20">
          <TopBar showSearch={true} />
          <AlertBanner 
            message="Fight reported" 
            distance="80m away" 
          />
        </div>
        
        {/* Scrollable Content */}
        <div className="flex flex-1 flex-col">
          
          {/* Report Section */}
          <section className="relative flex items-center justify-center px-4 pb-6 pt-4">
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
            <div className="absolute left-9 top-6 h-14 w-14 border-l border-t border-white/55 dark:border-white/20" />
            <div className="absolute bottom-8 right-14 h-16 w-16 border-b border-r border-white/45 dark:border-white/16" />
            <div className="absolute right-12 top-10 h-40 w-40 bg-accent-primary/10 blur-3xl dark:bg-accent-primary/14" />
            <div className="absolute inset-x-10 top-5 h-24 rounded-full blur-3xl" style={{ backgroundColor: "var(--report-halo)" }} />
            <div className="relative flex items-center justify-center">
              <div
                className="relative flex h-[360px] w-[360px] items-center justify-center rounded-full"
              >
                <div
                  className="absolute inset-0 rounded-full animate-[ripple_2.4s_ease-out_infinite]"
                  style={{ border: "1px solid var(--report-ring-strong)" }}
                />
                <div
                  className="absolute inset-[34px] rounded-full animate-[ripple_2.4s_ease-out_0.4s_infinite]"
                  style={{ border: "1px solid var(--report-ring-soft)" }}
                />
                <div
                  className="relative z-10 flex h-[276px] w-[276px] items-center justify-center rounded-full bg-surface-1"
                  style={{ boxShadow: "var(--report-shell-shadow)" }}
                >
                  <button
                    onClick={() => setIsRecordDrawerOpen(true)}
                    className="flex h-[224px] w-[224px] flex-col items-center justify-center gap-3.5 rounded-full text-white transition-transform duration-150 active:scale-[0.96]"
                    style={{
                      background: "var(--report-button-gradient)",
                      boxShadow: "var(--report-button-shadow)",
                    }}
                    aria-label="Open record flow"
                  >
                    <span className="material-symbols-outlined !text-[64px]">warning</span>
                    <span className="inline-flex items-center gap-2 text-[16px] font-semibold tracking-[0.18em]">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                      FAST REPORT
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Recent Reports Section */}
          <section className="mx-4 mb-4 rounded-[24px] bg-surface-1 px-4 pb-5 pt-6 shadow-[0_2px_20px_rgba(27,42,65,0.10)]">
            <div className="pb-0">
               <h2 className="text-text-primary text-[20px] font-bold tracking-tight">Nearby Incidents</h2>
               <p className="mt-1 text-[13px] text-text-secondary">
                 Recommended to attend: <span className="font-semibold text-text-primary">{recommendedIncident.location}</span>
               </p>
            </div>

            <IncidentCarousel incidents={incidents} />
            
          </section>
          
        </div>
      </div>
      <DrawerContent className="h-[85vh] bg-surface-1 rounded-t-2xl">
        <RecordFlow />
      </DrawerContent>
      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.92); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: scale(1.08); opacity: 0; }
        }
      `}</style>
    </Drawer>
  );
}

