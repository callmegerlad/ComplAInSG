import { Link, useNavigate, useParams } from "react-router";
import { TopBar } from "../components/layout/TopBar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getIncidentById } from "@/lib/incidents";

const FALLBACK_INCIDENT_IMAGE =
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1200&auto=format&fit=crop";

const galleryImages = [
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
];

const liveUpdates = [
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
] as const;

export function IncidentDetailsPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const incident = incidentId ? getIncidentById(incidentId) : undefined;

  if (!incident) {
    return (
      <div className="flex min-h-full flex-col">
        <TopBar showSearch={false} />
        <div className="px-4 py-10 text-center">
          <h1 className="text-[20px] font-bold text-text-primary">Incident not found</h1>
          <p className="mt-2 text-[14px] text-text-secondary">
            The incident may have been removed or the link is invalid.
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
    <div className="flex min-h-full flex-col bg-bg-primary pb-24">
      <TopBar showSearch={false} />

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
                ID: SG-{incident.id.padStart(4, "0")} · {incident.location}
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
                <p className="text-[16px] font-semibold text-text-primary">Immediate Action Required</p>
              </div>
            </div>
            <p className="mt-3 text-[14px] leading-6 text-text-secondary">
              Emergency responders have been notified. The nearby rapid response network is currently active.
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
                <p className="mt-1 text-[13px] text-text-secondary">
                  Approx. 5m from the main incident point
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <MetaCard icon="schedule" label="Reported" value={incident.timestamp} />
            <MetaCard icon="person" label="Reporter" value="@jason_lim" />
          </div>

          <div className="grid gap-3">
            <button className="flex w-full items-center justify-between rounded-2xl bg-success px-5 py-4 text-left font-bold text-white shadow-lg shadow-success/20">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined">directions_run</span>
                ON MY WAY
              </span>
              <span className="text-[12px] opacity-80">{incident.responders} responders</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-4 font-bold text-white shadow-lg shadow-danger/20">
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
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary">
              Nearby Responders
            </p>
            <div className="relative h-48 overflow-hidden rounded-2xl border border-border-subtle bg-surface-2 shadow-card">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&auto=format&fit=crop"
                alt="Responder map"
                className="h-full w-full object-cover opacity-35 grayscale"
              />
              <div className="absolute inset-0">
                <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-danger animate-pulse" />
                <div className="absolute left-[24%] top-[34%] h-3 w-3 rounded-full border-2 border-white bg-success" />
                <div className="absolute bottom-[26%] right-[30%] h-3 w-3 rounded-full border-2 border-white bg-success" />
              </div>
            </div>
          </section>

          <section className="border-t border-border-subtle pt-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[16px] font-bold text-text-primary">
                Live Updates
                <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
              </h3>
              <span className="text-[11px] font-bold text-danger">4 NEW</span>
            </div>

            <div className="space-y-4">
              {liveUpdates.map((update) => (
                <div key={update.id} className="flex gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${update.tone}`}
                  >
                    {update.author === "AI Safety Bot" ? "AI" : "MT"}
                  </div>
                  <div className="flex-1 rounded-2xl rounded-tl-sm bg-surface-1 p-3 shadow-card">
                    <p className="text-[13px] font-bold text-text-primary">{update.author}</p>
                    <p className="mt-1 text-[13px] leading-6 text-text-secondary">{update.message}</p>
                    <p className="mt-2 text-[10px] text-text-disabled">{update.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
                  <span className="material-symbols-outlined text-[30px]">face</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-danger">
                    AI Suspect Profile
                  </p>
                  <p className="text-[14px] font-semibold text-text-primary">
                    Male, approx. 175cm, dark jacket
                  </p>
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
