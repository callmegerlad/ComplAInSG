import { TopBar } from "../components/layout/TopBar";

const notifications = [
  {
    id: "1",
    title: "Fight reported nearby",
    message:
      "You were within 250m of Block 423, Ang Mo Kio Ave 3 when this incident was reported.",
    distance: "80m away",
    time: "2 min ago",
    icon: "local_police",
    tone: "var(--cat-fight)",
  },
  {
    id: "2",
    title: "Transport fault near your route",
    message:
      "An escalator breakdown was reported at Orchard MRT while you were 1.2km away.",
    distance: "1.2km away",
    time: "15 min ago",
    icon: "train",
    tone: "var(--cat-transport)",
  },
  {
    id: "3",
    title: "Medical emergency in your vicinity",
    message:
      "A traffic accident near Bugis Junction triggered an alert because you were within the nearby incident radius.",
    distance: "3.5km away",
    time: "45 min ago",
    icon: "emergency",
    tone: "var(--cat-medical)",
  },
];

export function NotificationsPage() {
  return (
    <div className="flex min-h-full flex-col pb-8">
      <TopBar showSearch={false} />

      <div className="border-b border-border-subtle bg-surface-1 px-4 py-4">
        <h1 className="text-[20px] font-bold text-text-primary">Notifications</h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Alerts sent because you were close to a reported incident.
        </p>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className="rounded-xl border border-border-subtle bg-surface-1 p-4 shadow-card"
          >
            <div className="flex gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: `color-mix(in srgb, ${notification.tone}, transparent 86%)`,
                  color: notification.tone,
                }}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {notification.icon}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[15px] font-bold text-text-primary">
                    {notification.title}
                  </h2>
                  <span className="shrink-0 text-[11px] text-text-disabled">
                    {notification.time}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
                  {notification.message}
                </p>
                <div className="mt-3 inline-flex rounded-full bg-accent-subtle px-2.5 py-1 text-[11px] font-bold text-accent-primary">
                  {notification.distance}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
