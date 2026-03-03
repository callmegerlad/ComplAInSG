import { useEffect } from "react";
import { Link } from "react-router";
import { TopBar } from "../components/layout/TopBar";
import { IncidentCredibility } from "../components/incidents/IncidentCredibility";
import { useAlerts, type RealtimeAlert } from "@/app/providers/AlertsProvider";

export function NotificationsPage() {
  const { alerts, permissionStatus, error, markAllAsRead } = useAlerts();

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  return (
    <div className="flex min-h-full flex-col pb-8">
      <TopBar showSearch={false} />

      <div className="border-b border-border-subtle bg-surface-1 px-4 py-4">
        <h1 className="text-[20px] font-bold text-text-primary">Notifications</h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Alerts sent because incidents were reported near your current location.
        </p>
      </div>

      <section className="space-y-3 px-4 py-4">
        <StatusCard
          title="Location access"
          description={getPermissionMessage(permissionStatus)}
        />

        {error && permissionStatus !== "granted" ? (
          <StatusCard title="Attention needed" description={error} tone="warning" />
        ) : null}

        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-border-subtle bg-surface-1 px-5 py-6 text-center shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle text-accent-primary">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </div>
            <h2 className="mt-4 text-base font-bold text-text-primary">No alerts yet</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Keep location access enabled and leave the app open to receive nearby incident alerts.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <article
              key={alert.incident_id}
              className="rounded-xl border border-border-subtle bg-surface-1 p-4 shadow-card"
            >
              <div className="flex gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${getAlertTone(alert)}, transparent 86%)`,
                    color: getAlertTone(alert),
                  }}
                >
                  <span className="material-symbols-outlined text-[22px]">{getAlertIcon(alert)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-[15px] font-bold text-text-primary">{getAlertTitle(alert)}</h2>
                    <span className="shrink-0 text-[11px] text-text-disabled">
                      {formatRelativeTime(alert.receivedAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
                    {getAlertMessage(alert)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <InfoPill label={getProximityLabel(alert)} />
                    <InfoPill label={alert.severity} />
                    {alert.routing ? <InfoPill label={alert.routing} /> : null}
                  </div>
                  <IncidentCredibility incidentId={alert.incident_id} className="mt-3" />
                  <div className="mt-3">
                    <Link
                      to={`/incidents/${alert.incident_id}`}
                      className="inline-flex items-center justify-center rounded-full bg-accent-primary px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-accent-hover"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function StatusCard({
  title,
  description,
  tone = "default",
}: {
  title: string;
  description: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-3 shadow-card"
      style={{
        backgroundColor: tone === "warning" ? "var(--danger-subtle)" : "var(--surface-1)",
        borderColor: tone === "warning" ? "color-mix(in srgb, var(--danger), transparent 70%)" : "var(--border-subtle)",
      }}
    >
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
    </div>
  );
}

function getPermissionMessage(permissionStatus: string) {
  switch (permissionStatus) {
    case "granted":
      return "Location access is enabled.";
    case "denied":
      return "Location access is disabled.";
    case "unsupported":
      return "Location access is not supported in this browser.";
    default:
      return "Location access is pending.";
  }
}

function InfoPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-accent-subtle px-2.5 py-1 text-[11px] font-bold text-accent-primary">
      {label}
    </span>
  );
}

function getAlertTitle(alert: RealtimeAlert) {
  return `${normalizeIncidentType(alert.incident_type)} reported nearby`;
}

function getAlertMessage(alert: RealtimeAlert) {
  return `Backend alert for ${alert.location}. ${getProximityMessage(alert)}`;
}

function getAlertTone(alert: RealtimeAlert) {
  switch (alert.severity) {
    case "CRITICAL":
    case "HIGH":
      return "var(--cat-fight)";
    case "MEDIUM":
      return "var(--cat-transport)";
    default:
      return "var(--accent-primary)";
  }
}

function getAlertIcon(alert: RealtimeAlert) {
  const label = `${alert.incident_type} ${alert.routing}`.toLowerCase();
  if (label.includes("medical")) return "emergency";
  if (label.includes("fire")) return "local_fire_department";
  if (label.includes("transport") || label.includes("traffic")) return "train";
  if (label.includes("police") || label.includes("crime") || label.includes("fight")) return "local_police";
  return "warning";
}

function normalizeIncidentType(value: string) {
  if (!value.trim()) {
    return "Incident";
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)}km away`;
  }

  return `${Math.round(distanceMeters)}m away`;
}

function formatRadius(radiusMeters: number) {
  if (radiusMeters >= 1000) {
    return `${(radiusMeters / 1000).toFixed(1)}km zone`;
  }

  return `${Math.round(radiusMeters)}m zone`;
}

function getProximityLabel(alert: RealtimeAlert) {
  if (Number.isFinite(alert.distance_m ?? Number.NaN)) {
    return formatDistance(alert.distance_m as number);
  }

  return formatRadius(alert.radius_m);
}

function getProximityMessage(alert: RealtimeAlert) {
  if (Number.isFinite(alert.distance_m ?? Number.NaN)) {
    return `Reported approximately ${formatDistance(alert.distance_m as number)} from you.`;
  }

  return `You were within the ${formatRadius(alert.radius_m)} alert boundary.`;
}

function formatRelativeTime(isoString: string) {
  const deltaSeconds = Math.max(0, Math.round((Date.now() - new Date(isoString).getTime()) / 1000));

  if (deltaSeconds < 60) {
    return "Just now";
  }

  if (deltaSeconds < 3600) {
    return `${Math.floor(deltaSeconds / 60)} min ago`;
  }

  if (deltaSeconds < 86400) {
    return `${Math.floor(deltaSeconds / 3600)} hr ago`;
  }

  return `${Math.floor(deltaSeconds / 86400)} day ago`;
}
