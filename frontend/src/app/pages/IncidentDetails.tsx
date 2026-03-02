import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { TopBar } from "../components/layout/TopBar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Drawer, DrawerContent } from "../components/ui/drawer";
import { RecordFlow } from "../components/record/RecordFlow";
import { IncidentCredibility } from "../components/incidents/IncidentCredibility";
import { fetchIncidentById, type IncidentWithMeta } from "@/lib/incidents";

interface NewReportState {
  isNewReport?: boolean;
  triageData?: {
    incident_id: string;
    final: {
      followup_questions: string[];
      user_next_steps: string[];
      routing_target: string;
      responder_summary: string;
      incident_type: string;
      final_severity: string;
    };
  };
  photoDataUrl?: string;
  locationLabel?: string;
}

const FALLBACK_INCIDENT_IMAGE =
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1200&auto=format&fit=crop";

const galleryImages = [
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
];

const initialLiveUpdates = [
  {
    id: "1",
    author: "AI Safety Bot",
    tone: "bg-accent-primary/15 text-accent-primary",
    message: "Vehicle plate correlation in progress. Nearby cameras and incident history are being cross-checked.",
    time: "14:04",
  },
  {
    id: "2",
    author: "M. Tan",
    tone: "bg-surface-2 text-text-primary",
    message: "Arriving from Scotts Road now. Crowd is forming near the main entrance.",
    time: "14:05",
  },
];

export function IncidentDetailsPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const routerState = routerLocation.state as NewReportState | null;
  const isNewReport = routerState?.isNewReport === true;
  const triageData = routerState?.triageData;

  const [apiIncident, setApiIncident] = useState<IncidentWithMeta | null>(null);
  const [isLoadingIncident, setIsLoadingIncident] = useState(Boolean(incidentId));
  const [incidentLoadError, setIncidentLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadIncident() {
      if (!incidentId) {
        setApiIncident(null);
        setIsLoadingIncident(false);
        setIncidentLoadError("Missing incident ID.");
        return;
      }

      setIsLoadingIncident(true);
      setIncidentLoadError(null);

      try {
        const data = await fetchIncidentById(incidentId);
        if (!cancelled) {
          setApiIncident(data);
        }
      } catch (error) {
        if (!cancelled) {
          setApiIncident(null);
          setIncidentLoadError(error instanceof Error ? error.message : "Unable to load incident details.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingIncident(false);
        }
      }
    }

    void loadIncident();

    return () => {
      cancelled = true;
    };
  }, [incidentId]);

  // Build a synthetic incident for freshly submitted AI-triage reports
  const syntheticIncident: IncidentWithMeta | undefined =
    isNewReport && triageData
      ? {
          id: triageData.incident_id,
          category: triageData.final.incident_type?.replace(/_/g, " ") ?? "Incident",
          categoryColor: "var(--cat-fight, #ef4444)",
          categoryIcon: "report",
          severity:
            triageData.final.final_severity?.toLowerCase() === "high" ||
            triageData.final.final_severity?.toLowerCase() === "critical"
              ? "High"
              : triageData.final.final_severity?.toLowerCase() === "medium"
                ? "Medium"
                : "Low",
          location: routerState?.locationLabel ?? "Singapore",
          distance: "N/A",
          title:
            triageData.final.incident_type?.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) ??
            "New Incident Report",
          summary: triageData.final.responder_summary ?? "Report submitted for review.",
          timestamp: "Just now",
          responders: 0,
          imageUrl: routerState?.photoDataUrl,
          credibilityUpvotes: 0,
          credibilityDownvotes: 0,
          reporter: "Anonymous",
        }
      : undefined;

  const incident = apiIncident ?? syntheticIncident;

  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
  const [isOnMyWay, setIsOnMyWay] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [updates, setUpdates] = useState(initialLiveUpdates);

  if (isLoadingIncident && !incident) {
    return (
      <div className="flex min-h-full flex-col">
        <TopBar showSearch={false} />
        <div className="px-4 py-10 text-center text-text-secondary">Loading incident details...</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex min-h-full flex-col">
        <TopBar showSearch={false} />
        <div className="px-4 py-10 text-center">
          <h1 className="text-[20px] font-bold text-text-primary">Incident not found</h1>
          <p className="mt-2 text-[14px] text-text-secondary">
            {incidentLoadError || "The incident may have been removed or the link is invalid."}
          </p>
          <Link
            to="/map"
            className="mt-5 inline-flex rounded-full bg-accent-primary px-4 py-2 text-[14px] font-semibold text-white"
          >
            Back to incidents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Drawer open={isRecordDrawerOpen} onOpenChange={setIsRecordDrawerOpen}>
      <div className="flex min-h-full flex-col bg-bg-primary pb-24">
        <TopBar showSearch={false} />
        {isNewReport && (
          <div className="flex items-start gap-3 border-b border-success/20 bg-success/10 px-4 py-3">
            <span className="material-symbols-outlined mt-0.5 text-[20px] text-success">check_circle</span>
            <div>
              <p className="text-[13px] font-bold text-success">Report submitted successfully!</p>
              <p className="text-[12px] text-text-secondary">
                Thank you for keeping your community safe. Relevant authorities have been notified.
              </p>
            </div>
          </div>
        )}

        <div className="border-b border-border-subtle bg-surface-1 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-secondary transition-colors hover:bg-accent-subtle hover:text-accent-primary"
                aria-label="Go back"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h1 className="text-[20px] font-bold text-text-primary">Incident Detail</h1>
                <p className="mt-1 text-[12px] text-text-secondary">
                  ID: SG-{formatIncidentId(incident.id)} · {incident.location}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-text-secondary"
              aria-label="Share incident"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </div>

        <main className="flex-1">
          <div className="p-4">
            <section className="rounded-2xl border border-danger/20 bg-danger/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger text-white">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-danger">
                    {incident.severity} Severity
                  </p>
                  <p className="text-[16px] font-semibold text-text-primary">{incident.severity === "High" ? "Immediate Action Required" : "Monitor Situation"}</p>
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-6 text-text-secondary">
                {incident.severity === "High"
                  ? "Emergency responders have been notified. The nearby rapid response network is currently active."
                  : "Authorities are monitoring this report. Stay aware of updates and avoid the area if needed."}
              </p>
            </section>
          </div>

          <div className="flex gap-3 overflow-x-auto px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[incident.imageUrl || FALLBACK_INCIDENT_IMAGE, ...galleryImages].map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="relative h-48 min-w-[280px] overflow-hidden rounded-2xl bg-surface-2 shadow-card"
              >
                <ImageWithFallback src={src} alt={incident.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,24,44,0.08)_0%,rgba(10,24,44,0.44)_100%)]" />
                {index === 0 ? (
                  <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                    Live Photo
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[52px] text-white/90">play_circle</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-4 p-4">
            <section className="rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-card">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent-primary">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                    Location
                  </p>
                  <p className="mt-1 text-[16px] font-semibold text-text-primary">{incident.location}, Singapore</p>
                  <p className="mt-1 text-[13px] text-text-secondary">Approx. 5m from the main incident point</p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <MetaCard icon="schedule" label="Reported" value={incident.timestamp} />
              <MetaCard icon="person" label="Reporter" value={incident.reporter || "Anonymous"} />
            </div>

            <IncidentCredibility incidentId={incident.id} />

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setIsOnMyWay((current) => !current)}
                className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left font-bold text-white shadow-lg transition-colors ${
                  isOnMyWay ? "bg-accent-primary shadow-primary-btn" : "bg-success shadow-success/20"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined">{isOnMyWay ? "check_circle" : "directions_run"}</span>
                  {isOnMyWay ? "EN ROUTE" : "ON MY WAY"}
                </span>
                <span className="text-[12px] opacity-80">
                  {isOnMyWay ? "You joined response" : `${incident.responders} responders`}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecordDrawerOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-4 font-bold text-white shadow-lg shadow-danger/20"
                >
                  <span className="material-symbols-outlined">videocam</span>
                  RECORD
                </button>
                <button className="flex items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-4 font-bold text-text-primary shadow-lg shadow-secondary/20">
                  <span className="material-symbols-outlined">phone_in_talk</span>
                  CALL 999
                </button>
              </div>
            </div>

            <section>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary">Nearby Responders</p>
              <div className="relative h-48 overflow-hidden rounded-2xl border border-border-subtle bg-surface-2 shadow-card">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&auto=format&fit=crop"
                  alt="Responder map"
                  className="h-full w-full object-cover opacity-35 grayscale"
                />
                <div className="absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-white bg-danger" />
                  <div className="absolute left-[24%] top-[34%] h-3 w-3 rounded-full border-2 border-white bg-success" />
                  <div className="absolute bottom-[26%] right-[30%] h-3 w-3 rounded-full border-2 border-white bg-success" />
                </div>
              </div>
            </section>

            <section className="border-t border-border-subtle pt-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[16px] font-bold text-text-primary">
                  Live Updates
                  <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
                </h3>
                <span className="text-[11px] font-bold text-danger">{updates.length} UPDATES</span>
              </div>

              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="flex gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${update.tone}`}
                    >
                      {getUpdateInitials(update.author)}
                    </div>
                    <div className="flex-1 rounded-2xl rounded-tl-sm bg-surface-1 p-3 shadow-card">
                      <p className="text-[13px] font-bold text-text-primary">{update.author}</p>
                      <p className="mt-1 text-[13px] leading-6 text-text-secondary">{update.message}</p>
                      <p className="mt-2 text-[10px] text-text-disabled">{update.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form
                className="mt-4 grid gap-3 rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-card"
                onSubmit={(event) => {
                  event.preventDefault();
                  const trimmedComment = commentText.trim();

                  if (!trimmedComment) {
                    return;
                  }

                  setUpdates((current) => [
                    ...current,
                    {
                      id: String(Date.now()),
                      author: "You",
                      tone: "bg-accent-primary/15 text-accent-primary",
                      message: trimmedComment,
                      time: "Now",
                    },
                  ]);
                  setCommentText("");
                }}
              >
                <label htmlFor="incident-comment" className="text-[12px] font-semibold text-text-primary">
                  Add to live updates
                </label>
                <textarea
                  id="incident-comment"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Share what you can see, where you are, or any urgent risks for responders..."
                  className="min-h-[96px] rounded-2xl border border-border-subtle bg-surface-2 px-4 py-3 text-[14px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-full bg-accent-primary px-4 py-2 text-[13px] font-semibold text-white shadow-primary-btn"
                  >
                    Post Comment
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
                    <span className="material-symbols-outlined text-[30px]">face</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-danger">AI Suspect Profile</p>
                    <p className="text-[14px] font-semibold text-text-primary">Male, approx. 175cm, dark jacket</p>
                  </div>
                </div>
                <button type="button" className="flex h-8 w-8 items-center justify-center text-text-secondary">
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>

      <DrawerContent className="h-[92vh] max-w-md px-0">
        <RecordFlow onClose={() => setIsRecordDrawerOpen(false)} />
      </DrawerContent>
    </Drawer>
  );
}

function MetaCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-1 p-4 shadow-card">
      <div className="flex items-center gap-2 text-text-secondary">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-2 text-[14px] font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function getUpdateInitials(author: string) {
  if (author === "AI Safety Bot") {
    return "AI";
  }

  if (author === "You") {
    return "YO";
  }

  return author
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatIncidentId(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}


