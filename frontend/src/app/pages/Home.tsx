import { useState } from "react";
import { Link } from "react-router";
import { TopBar } from "../components/layout/TopBar";
import { AlertBanner } from "../components/home/AlertBanner";
import { Incident } from "../components/home/IncidentCard";
import { RecordFlow } from "../components/record/RecordFlow";
import { Drawer, DrawerContent } from "../components/ui/drawer";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { incidents as allIncidents } from "@/lib/incidents";

export function HomePage() {
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
  const incidents: Incident[] = allIncidents.slice(0, 3);
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
        <div className="flex flex-1 flex-col pb-8">
          
          {/* Report Section */}
          <section className="relative flex items-center justify-center px-4 pb-10 pt-8">
            <div
              className="absolute inset-x-4 inset-y-0 rounded-[22px] border border-border-subtle/60"
              style={{
                background: "var(--report-backdrop)",
                boxShadow: "var(--report-backdrop-shadow)",
              }}
            />
            <div
              className="absolute inset-x-6 inset-y-3 rounded-[18px] opacity-100"
              style={{ backgroundImage: "var(--report-backdrop-pattern)" }}
            />
            <div className="absolute inset-x-8 top-8 h-px bg-white/50 dark:bg-white/18" />
            <div className="absolute inset-x-12 bottom-10 h-px bg-white/38 dark:bg-white/14" />
            <div className="absolute left-8 top-8 h-16 w-16 border-l border-t border-white/55 dark:border-white/20" />
            <div className="absolute bottom-10 right-12 h-20 w-20 border-b border-r border-white/45 dark:border-white/16" />
            <div className="absolute right-10 top-12 h-44 w-44 bg-accent-primary/10 blur-3xl dark:bg-accent-primary/14" />
            <div className="absolute inset-x-8 top-6 h-28 rounded-full blur-3xl" style={{ backgroundColor: "var(--report-halo)" }} />
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
                      REPORT
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Recent Reports Section */}
          <section className="flex-1 rounded-t-[28px] bg-surface-1 px-4 pb-8 pt-6 shadow-[0_-6px_24px_rgba(27,42,65,0.06)]">
            <div className="pb-0">
               <h2 className="text-text-primary text-[20px] font-bold tracking-tight">Nearby Incidents</h2>
               <p className="mt-1 text-[13px] text-text-secondary">
                 Recommended to attend: <span className="font-semibold text-text-primary">{recommendedIncident.location}</span>
               </p>
            </div>

            <article className="mt-4 overflow-hidden rounded-[24px] bg-surface-2 shadow-card">
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: getSeverityColor(recommendedIncident.severity) }}
              />
              <div className="flex min-h-[132px]">
                <div className="relative w-[42%] shrink-0">
                  {recommendedIncident.imageUrl ? (
                    <ImageWithFallback
                      src={recommendedIncident.imageUrl}
                      alt={recommendedIncident.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryPill
                        label={recommendedIncident.category}
                        tone={recommendedIncident.categoryColor}
                      />
                      <SeverityPill
                        label={recommendedIncident.severity}
                        tone={getSeverityColor(recommendedIncident.severity)}
                      />
                    </div>
                    <h3 className="mt-1 text-[18px] font-bold leading-tight text-text-primary">
                      {recommendedIncident.location}
                    </h3>
                    <p className="mt-2 text-[13px] leading-5 text-text-secondary">
                      {recommendedIncident.title}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <InfoBadgeLight icon="route" label={recommendedIncident.distance} />
                    <InfoBadgeLight icon="schedule" label={recommendedIncident.timestamp} />
                    <InfoBadgeLight icon="groups" label={`${recommendedIncident.responders} responding`} />
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4">
                <Link
                  to={`/incidents/${recommendedIncident.id}`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-accent-primary px-3 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-accent-hover"
                >
                  Details
                </Link>
              </div>
            </article>
            
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {incidents.map((incident) => (
                <article
                  key={incident.id}
                  className="group relative min-h-[220px] min-w-[220px] overflow-hidden rounded-[24px] bg-surface-2 shadow-card"
                >
                  <div
                    className="absolute left-0 right-0 top-0 z-10 h-1.5"
                    style={{ backgroundColor: getSeverityColor(incident.severity) }}
                  />
                  {incident.imageUrl ? (
                    <ImageWithFallback
                      src={incident.imageUrl}
                      alt={incident.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,24,44,0.10)_0%,rgba(10,24,44,0.3)_40%,rgba(10,24,44,0.82)_100%)]" />
                  <div className="relative flex h-full flex-col justify-between p-3 text-white">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CategoryPill
                          label={incident.category}
                          tone={incident.categoryColor}
                        />
                        <SeverityPill
                          label={incident.severity}
                          tone={getSeverityColor(incident.severity)}
                        />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <InfoBadge icon="route" label={incident.distance} />
                        <InfoBadge icon="schedule" label={incident.timestamp} />
                      </div>
                    </div>
                    <div className="mt-auto flex flex-1 flex-col justify-end">
                      <h3 className="line-clamp-3 text-[16px] font-bold leading-tight">
                        {incident.title}
                      </h3>
                      <div className="mt-2 space-y-2">
                        <InfoBadge icon="location_on" label={incident.location} />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-4 pt-1">
                        <span className="pr-2 text-[11px] font-medium text-white/88">
                          {incident.responders} responding
                        </span>
                        <Link
                          to={`/incidents/${incident.id}`}
                          className="inline-flex min-w-[68px] items-center justify-center rounded-full bg-accent-primary px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-accent-hover"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
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

function InfoBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-white/16 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
      <span className="material-symbols-outlined !text-[14px]">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
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

function CategoryPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className="inline-flex w-fit max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
      style={{
        backgroundColor: tone,
      }}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function SeverityPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className="inline-flex w-fit max-w-full items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-white"
      style={{
        backgroundColor: tone,
      }}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function getSeverityColor(severity: Incident["severity"]) {
  if (severity === "High") return "var(--cat-fight)";
  if (severity === "Medium") return "var(--cat-transport)";
  return "var(--success)";
}
