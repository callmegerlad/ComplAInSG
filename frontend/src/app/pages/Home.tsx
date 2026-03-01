import { useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { AlertBanner } from "../components/home/AlertBanner";
import { Incident } from "../components/home/IncidentCard";
import { RecordFlow } from "../components/record/RecordFlow";
import { Drawer, DrawerContent } from "../components/ui/drawer";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const incidents: Incident[] = [
  {
    id: '1',
    category: 'Fight/Assault',
    categoryColor: 'var(--cat-fight)',
    categoryIcon: 'local_police',
    severity: 'High',
    location: 'Ang Mo Kio Ave 3',
    distance: '80m',
    title: 'Fight reported at Block 423',
    summary: 'Content verified by AI. Two individuals involved in a physical altercation near the void deck.',
    timestamp: '2 min ago',
    status: 'In Progress',
    responders: 4,
    imageUrl: 'https://images.unsplash.com/photo-1563266914-94073574828f?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: '2',
    category: 'Transport Fault',
    categoryColor: 'var(--cat-transport)',
    categoryIcon: 'train',
    severity: 'Medium',
    location: 'Orchard MRT',
    distance: '1.2km',
    title: 'Escalator Breakdown',
    summary: 'Escalator B at Exit 3 is currently non-functional. Technicians have been dispatched.',
    timestamp: '15 min ago',
    status: 'In Progress',
    responders: 2,
    imageUrl: 'https://images.unsplash.com/photo-1471623320832-752e8bbf8413?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: '3',
    category: 'Maintenance',
    categoryColor: 'var(--accent-primary)',
    categoryIcon: 'construction',
    severity: 'Low',
    location: 'Tampines St 21',
    distance: '2.4km',
    title: 'Street light flickering near junction',
    summary: 'Residents reported intermittent lighting affecting the pedestrian crossing.',
    timestamp: '28 min ago',
    status: 'Queued',
    responders: 1,
    imageUrl: 'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=200&auto=format&fit=crop'
  }
];

export function HomePage() {
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
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
            <div className="absolute inset-x-8 top-6 h-28 rounded-full blur-3xl" style={{ backgroundColor: "var(--report-halo)" }} />
            <div className="relative flex items-center justify-center">
              <div
                className="relative flex h-[320px] w-[320px] items-center justify-center rounded-full"
              >
                <div
                  className="absolute inset-0 rounded-full animate-[ripple_2.4s_ease-out_infinite]"
                  style={{ border: "1px solid var(--report-ring-strong)" }}
                />
                <div
                  className="absolute inset-[30px] rounded-full animate-[ripple_2.4s_ease-out_0.4s_infinite]"
                  style={{ border: "1px solid var(--report-ring-soft)" }}
                />
                <div
                  className="relative z-10 flex h-[244px] w-[244px] items-center justify-center rounded-full bg-surface-1"
                  style={{ boxShadow: "var(--report-shell-shadow)" }}
                >
                  <button
                    onClick={() => setIsRecordDrawerOpen(true)}
                    className="flex h-[196px] w-[196px] flex-col items-center justify-center gap-3 rounded-full text-white transition-transform duration-150 active:scale-[0.96]"
                    style={{
                      background: "var(--report-button-gradient)",
                      boxShadow: "var(--report-button-shadow)",
                    }}
                    aria-label="Open record flow"
                  >
                    <span className="material-symbols-outlined !text-[56px]">warning</span>
                    <span className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[0.16em]">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-primary">
                      Recommended Location
                    </p>
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
            </article>
            
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {incidents.map((incident) => (
                <article
                  key={incident.id}
                  className="group relative min-h-[220px] min-w-[220px] overflow-hidden rounded-[24px] bg-surface-2 shadow-card"
                >
                  {incident.imageUrl ? (
                    <ImageWithFallback
                      src={incident.imageUrl}
                      alt={incident.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,24,44,0.10)_0%,rgba(10,24,44,0.3)_40%,rgba(10,24,44,0.82)_100%)]" />
                  <div className="relative flex h-full flex-col justify-between p-3 text-white">
                    <div className="flex items-start justify-between gap-2">
                      <InfoBadge icon="route" label={incident.distance} />
                      <InfoBadge icon="schedule" label={incident.timestamp} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="line-clamp-3 text-[16px] font-bold leading-tight">
                        {incident.title}
                      </h3>
                      <div className="space-y-2">
                        <InfoBadge icon="location_on" label={incident.location} />
                        <InfoBadge icon="groups" label={`${incident.responders} responding`} />
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
        <RecordFlow startAtCamera />
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
