import { useEffect, useState } from "react";
import { Link } from "react-router";
import { TopBar } from "../components/layout/TopBar";
import { AlertBanner } from "../components/home/AlertBanner";
import type { Incident } from "../components/home/IncidentCard";
import { IncidentTicker } from "../components/home/IncidentTicker";
import { RecordFlow } from "../components/record/RecordFlow";
import { Drawer, DrawerContent } from "../components/ui/drawer";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { IncidentCredibility } from "../components/incidents/IncidentCredibility";
import { fetchNearbyIncidents } from "@/lib/incidents";
import { useCurrentLocation } from "@/lib/location";

export function HomePage() {
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
  const [incidentItems, setIncidentItems] = useState<Incident[]>([]);
  const [incidentLoadError, setIncidentLoadError] = useState<string | null>(null);
  const { label: currentLocation, lastUpdated, lat, lng } = useCurrentLocation();
  const recommendedIncident =
    incidentItems.length > 0
      ? [...incidentItems].sort((left, right) => {
          const severityDiff = getSeverityPriority(right.severity) - getSeverityPriority(left.severity);
          if (severityDiff !== 0) {
            return severityDiff;
          }
          return parseDistanceToMeters(left.distance) - parseDistanceToMeters(right.distance);
        })[0]
      : undefined;

  useEffect(() => {
    let cancelled = false;

    async function loadNearbyIncidents() {
      if (lat === null || lng === null) {
        return;
      }

      try {
        const nearby = await fetchNearbyIncidents(lat, lng, {
          radius_m: 5000,
          limit: 12,
        });

        if (!cancelled) {
          setIncidentItems(nearby.slice(0, 8));
          setIncidentLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setIncidentLoadError(
            error instanceof Error ? error.message : "Unable to load nearby incidents.",
          );
          setIncidentItems([]);
        }
      }
    }

    void loadNearbyIncidents();

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  const formatTime = (dateValue: Date | null) => {
    if (!dateValue) return "";
    return dateValue.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

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
          <AlertBanner message="Fight reported" distance="80m away" />
        </div>

        <div className="flex flex-1 flex-col gap-4 px-4 pb-8 pt-4">
          <section className="relative flex items-center justify-center overflow-hidden rounded-[24px] border-2 border-red-500">
            <div
              className="absolute inset-0"
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
            <div
              className="absolute inset-x-10 top-5 h-24 rounded-full blur-3xl"
              style={{ backgroundColor: "var(--report-halo)" }}
            />
            <div className="relative flex items-center justify-center">
              <div className="relative flex h-[360px] w-[360px] items-center justify-center rounded-full">
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

          <section className="flex flex-col rounded-[24px] bg-surface-1 px-4 pb-4 pt-3 shadow-[0_2px_20px_rgba(27,42,65,0.10)]">
            <div className="shrink-0">
              <h2 className="text-text-primary text-[16px] font-bold tracking-tight">Incident needs your response!</h2>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-secondary">
                <span className="material-symbols-outlined !text-[13px] text-accent-primary">my_location</span>
                <span className="flex-1 truncate">{currentLocation}</span>
                {lastUpdated && (
                  <span className="ml-auto shrink-0 text-[10px] text-text-disabled">
                    {formatTime(lastUpdated)}
                  </span>
                )}
              </p>
            </div>

            {recommendedIncident ? (
              <Link
                to={`/incidents/${recommendedIncident.id}`}
                className="mt-3 block overflow-hidden rounded-[24px] bg-surface-2 shadow-card"
              >
                <article>
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
                          <CategoryPill label={recommendedIncident.category} tone={recommendedIncident.categoryColor} />
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
                      <IncidentCredibility incidentId={recommendedIncident.id} className="mt-3" />
                    </div>
                  </div>
                </article>
              </Link>
            ) : (
              <div className="mt-3 rounded-xl bg-surface-2 px-4 py-6 text-sm text-text-secondary">
                No nearby incidents at your current location.
              </div>
            )}
          </section>

          <section className="flex h-[420px] flex-col rounded-[24px] bg-surface-1 px-4 pb-3 pt-3 shadow-[0_2px_20px_rgba(27,42,65,0.10)] overflow-hidden">
            <div className="shrink-0">
              <h2 className="text-text-primary text-[16px] font-bold tracking-tight">Nearby Incidents</h2>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-secondary">
                <span className="material-symbols-outlined !text-[13px] text-accent-primary">my_location</span>
                <span className="flex-1 truncate">{currentLocation}</span>
                {lastUpdated && (
                  <span className="ml-auto shrink-0 text-[10px] text-text-disabled">
                    {formatTime(lastUpdated)}
                  </span>
                )}
              </p>
              {lat === null || lng === null ? (
                <p className="mt-1 text-[11px] text-text-secondary">Waiting for location permission...</p>
              ) : null}
              {incidentLoadError ? (
                <p className="mt-1 text-[11px] text-danger">Live incidents unavailable: {incidentLoadError}</p>
              ) : null}
            </div>
            <div className="mt-2 -mx-4 min-h-0 flex-1 overflow-hidden">
              <IncidentTicker incidents={incidentItems} />
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

function getSeverityColor(severity: Incident["severity"]) {
  if (severity === "High") return "var(--cat-fight)";
  if (severity === "Medium") return "var(--cat-transport)";
  return "var(--success)";
}

function getSeverityPriority(severity: Incident["severity"]) {
  if (severity === "High") return 3;
  if (severity === "Medium") return 2;
  return 1;
}

function parseDistanceToMeters(distance: string) {
  const normalized = distance.trim().toLowerCase();
  if (!normalized) return Number.POSITIVE_INFINITY;
  if (normalized.endsWith("km")) {
    const value = Number.parseFloat(normalized.replace("km", ""));
    return Number.isFinite(value) ? value * 1000 : Number.POSITIVE_INFINITY;
  }
  if (normalized.endsWith("m")) {
    const value = Number.parseFloat(normalized.replace("m", ""));
    return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
  }
  return Number.POSITIVE_INFINITY;
}
