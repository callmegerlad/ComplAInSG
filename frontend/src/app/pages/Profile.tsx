import { useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { applyTheme, getPreferredTheme } from "@/lib/theme";
import { useAuth } from "../providers/AuthProvider";
import { getUserInitials } from "@/lib/auth";
import { Drawer, DrawerContent } from "../components/ui/drawer";

// ─── Notification preferences ──────────────────────────────────────────────

const NOTIF_PREFS_KEY = "complainsg_notif_prefs";

interface NotifPrefs {
  proximityAlertsEnabled: boolean;
  soundEnabled: boolean;
  alertRadiusMeters: number;
}

const RADIUS_OPTIONS = [
  { label: "500 m", value: 500 },
  { label: "1 km", value: 1000 },
  { label: "2 km", value: 2000 },
  { label: "5 km", value: 5000 },
];

function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (raw) return JSON.parse(raw) as NotifPrefs;
  } catch {
    // ignore
  }
  return { proximityAlertsEnabled: true, soundEnabled: false, alertRadiusMeters: 2000 };
}

function saveNotifPrefs(prefs: NotifPrefs) {
  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
}

// ─── Privacy preferences ────────────────────────────────────────────────────

const PRIVACY_PREFS_KEY = "complainsg_privacy_prefs";

interface PrivacyPrefs {
  anonymousReporting: boolean;
  locationSharingEnabled: boolean;
  profileVisibleToPublic: boolean;
}

function loadPrivacyPrefs(): PrivacyPrefs {
  try {
    const raw = localStorage.getItem(PRIVACY_PREFS_KEY);
    if (raw) return JSON.parse(raw) as PrivacyPrefs;
  } catch {
    // ignore
  }
  return { anonymousReporting: false, locationSharingEnabled: true, profileVisibleToPublic: true };
}

function savePrivacyPrefs(prefs: PrivacyPrefs) {
  localStorage.setItem(PRIVACY_PREFS_KEY, JSON.stringify(prefs));
}

// ─── Re-usable toggle row ───────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-text-primary">{label}</p>
        {description && (
          <p className="mt-0.5 text-[12px] text-text-secondary leading-5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 h-6 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
          checked ? "bg-accent-primary" : "bg-border-subtle"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function ProfilePage() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => getPreferredTheme() === "dark",
  );
  const { user, logout } = useAuth();
  const initials = getUserInitials(user);
  const displayName = user?.display_name?.trim() || "Community User";
  const email = user?.email ?? "";
  const reportCount = user?.report_count ?? 0;
  const joinedDate = user
    ? new Date(user.created_at).toLocaleDateString()
    : "Unknown";

  // ── Drawer visibility ────────────────────────────────────────────────────
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [privacyDrawerOpen, setPrivacyDrawerOpen] = useState(false);
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // ── Notification preferences ─────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(loadNotifPrefs);

  function updateNotifPref<K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    saveNotifPrefs(next);
  }

  // ── Privacy preferences ──────────────────────────────────────────────────
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPrefs>(loadPrivacyPrefs);

  function updatePrivacyPref<K extends keyof PrivacyPrefs>(key: K, value: PrivacyPrefs[K]) {
    const next = { ...privacyPrefs, [key]: value };
    setPrivacyPrefs(next);
    savePrivacyPrefs(next);
  }

  const SETTINGS: { icon: string; label: string; color?: string }[] = [
    { icon: "notifications", label: "Notification Preferences" },
    { icon: "lock", label: "Privacy Settings" },
    { icon: "help", label: "Help & Legal" },
    { icon: "logout", label: "Sign Out", color: "text-danger" },
  ];

  const FAQ_ITEMS = [
    {
      question: "How does the Trust Score work?",
      answer:
        "Your Trust Score reflects the accuracy and quality of your past reports. Verified and upvoted reports increase your score. Reports found to be inaccurate or spam lower it over time.",
    },
    {
      question: "Who sees my reports?",
      answer:
        "Reports are visible to all app users by default. If you enable Anonymous Reporting in Privacy Settings, your name will be hidden and your report attributed to 'Anonymous'.",
    },
    {
      question: "How are proximity alerts sent?",
      answer:
        "ComplAInSG monitors your GPS coordinates in the background. When a new incident is reported within your chosen radius, a real-time alert is shown. No location data is stored on our servers.",
    },
    {
      question: "How do I contact support?",
      answer:
        "Tap the 'Send Feedback' button below or email us at support@complainsg.gov.sg. For urgent safety matters, always call 999.",
    },
  ];

  return (
    <>
      {/* ── Notification Preferences Drawer ─────────────────────────────── */}
      <Drawer open={notifDrawerOpen} onOpenChange={setNotifDrawerOpen}>
        <DrawerContent className="bg-bg-primary border-border-subtle px-4 pb-8">
          <div className="pt-2 pb-4 border-b border-border-subtle">
            <h2 className="text-[18px] font-bold text-text-primary">Notification Preferences</h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Control how and when ComplAInSG alerts you.
            </p>
          </div>

          <div className="divide-y divide-border-subtle">
            <ToggleRow
              label="Proximity Alerts"
              description="Get notified when a new incident is reported near you."
              checked={notifPrefs.proximityAlertsEnabled}
              onChange={(v) => updateNotifPref("proximityAlertsEnabled", v)}
            />
            <ToggleRow
              label="Sound Notifications"
              description="Play an alert sound when a nearby incident is detected."
              checked={notifPrefs.soundEnabled}
              onChange={(v) => updateNotifPref("soundEnabled", v)}
            />
          </div>

          <div className="mt-4">
            <p className="text-[13px] font-semibold text-text-primary mb-3">Alert Radius</p>
            <div className="grid grid-cols-4 gap-2">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateNotifPref("alertRadiusMeters", opt.value)}
                  className={`rounded-xl py-2.5 text-[13px] font-semibold border transition-colors ${
                    notifPrefs.alertRadiusMeters === opt.value
                      ? "bg-accent-primary text-white border-accent-primary"
                      : "bg-surface-1 text-text-primary border-border-subtle hover:bg-surface-2"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-text-disabled">
              You will receive alerts for incidents within this distance of your current location.
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-accent-subtle border border-accent-primary/20 p-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-accent-primary mt-0.5">info</span>
            <p className="text-[12px] text-text-secondary leading-5">
              For alerts to work, ComplAInSG must remain open and location access must be granted in
              your browser settings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setNotifDrawerOpen(false)}
            className="mt-6 w-full rounded-2xl bg-accent-primary py-3.5 text-[15px] font-bold text-white shadow-lg"
          >
            Save Preferences
          </button>
        </DrawerContent>
      </Drawer>

      {/* ── Privacy Settings Drawer ──────────────────────────────────────── */}
      <Drawer open={privacyDrawerOpen} onOpenChange={setPrivacyDrawerOpen}>
        <DrawerContent className="bg-bg-primary border-border-subtle px-4 pb-8">
          <div className="pt-2 pb-4 border-b border-border-subtle">
            <h2 className="text-[18px] font-bold text-text-primary">Privacy Settings</h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Control what information is shared with others.
            </p>
          </div>

          <div className="divide-y divide-border-subtle">
            <ToggleRow
              label="Anonymous Reporting"
              description='Submit reports with your name hidden. Reports will show "Anonymous" instead of your display name.'
              checked={privacyPrefs.anonymousReporting}
              onChange={(v) => updatePrivacyPref("anonymousReporting", v)}
            />
            <ToggleRow
              label="Location Sharing"
              description="Allow the app to use your GPS position to detect nearby incidents and send proximity alerts."
              checked={privacyPrefs.locationSharingEnabled}
              onChange={(v) => updatePrivacyPref("locationSharingEnabled", v)}
            />
            <ToggleRow
              label="Public Profile"
              description="Let other community members see your Trust Score and badge count on public reports."
              checked={privacyPrefs.profileVisibleToPublic}
              onChange={(v) => updatePrivacyPref("profileVisibleToPublic", v)}
            />
          </div>

          <div className="mt-4 rounded-xl bg-surface-1 border border-border-subtle p-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-text-secondary mt-0.5">shield</span>
            <p className="text-[12px] text-text-secondary leading-5">
              ComplAInSG stores only the minimum data needed to operate. Location data is never
              stored on our servers and is processed entirely on your device.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPrivacyDrawerOpen(false)}
            className="mt-6 w-full rounded-2xl bg-accent-primary py-3.5 text-[15px] font-bold text-white shadow-lg"
          >
            Save Settings
          </button>
        </DrawerContent>
      </Drawer>

      {/* ── Help & Legal Drawer ──────────────────────────────────────────── */}
      <Drawer open={helpDrawerOpen} onOpenChange={setHelpDrawerOpen}>
        <DrawerContent className="bg-bg-primary border-border-subtle px-4 pb-8 max-h-[85dvh] overflow-y-auto">
          <div className="pt-2 pb-4 border-b border-border-subtle">
            <h2 className="text-[18px] font-bold text-text-primary">Help & Legal</h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Frequently asked questions, policies, and contact info.
            </p>
          </div>

          {/* FAQ */}
          <div className="mt-4 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-disabled mb-3">
              Frequently Asked Questions
            </p>
            <div className="rounded-xl border border-border-subtle overflow-hidden divide-y divide-border-subtle">
              {FAQ_ITEMS.map((faq, idx) => (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-surface-2 transition-colors"
                  >
                    <span className="text-[13px] font-semibold text-text-primary pr-3">{faq.question}</span>
                    <span className="material-symbols-outlined text-[20px] text-text-disabled shrink-0 transition-transform" style={{ transform: expandedFaq === idx ? "rotate(180deg)" : "rotate(0deg)" }}>
                      expand_more
                    </span>
                  </button>
                  {expandedFaq === idx && (
                    <div className="px-4 pb-4 text-[13px] text-text-secondary leading-6 bg-surface-1">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legal links */}
          <div className="mt-5 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-disabled mb-3">
              Legal
            </p>
            <div className="rounded-xl border border-border-subtle overflow-hidden divide-y divide-border-subtle">
              {[
                { label: "Terms of Service", icon: "description" },
                { label: "Privacy Policy", icon: "policy" },
                { label: "Data Retention Policy", icon: "database" },
              ].map((link) => (
                <button
                  key={link.label}
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-2 transition-colors"
                  onClick={() => {
                    // In a production build these would navigate to hosted legal pages.
                    // For demo purposes we just dismiss the drawer.
                    setHelpDrawerOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-text-secondary">{link.icon}</span>
                    <span className="text-[14px] text-text-primary">{link.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-text-disabled">open_in_new</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <a
            href="mailto:support@complainsg.gov.sg?subject=ComplAInSG%20Feedback"
            className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-accent-primary/40 bg-accent-subtle py-3.5 text-[14px] font-semibold text-accent-primary"
          >
            <span className="material-symbols-outlined text-[20px]">mail</span>
            Send Feedback
          </a>

          <button
            type="button"
            onClick={() => setHelpDrawerOpen(false)}
            className="mt-3 w-full rounded-2xl bg-surface-1 border border-border-subtle py-3 text-[14px] font-semibold text-text-secondary"
          >
            Close
          </button>
        </DrawerContent>
      </Drawer>

      {/* ── Page body ────────────────────────────────────────────────────── */}
      <div className="flex flex-col min-h-full pb-8">
        <TopBar showSearch={false} />

        {/* Header Block */}
        <div className="px-6 py-6 flex flex-col items-center gap-3">
          <div className="w-[72px] h-[72px] rounded-full bg-accent-subtle border-[3px] border-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-[24px]">
            {initials}
          </div>
          <div className="flex flex-col items-center">
            <h2 className="text-[18px] font-semibold text-text-primary">
              {displayName}
            </h2>
            <p className="text-[13px] text-text-secondary">{email}</p>
            <div className="flex items-center gap-1 mt-1 text-accent-primary">
              <span className="material-symbols-outlined text-[14px]">
                verified_user
              </span>
              <span className="text-[12px] font-semibold">Verified User</span>
            </div>
          </div>
        </div>

        {/* Trust Score Card */}
        <div className="mx-4 mb-6 rounded-xl bg-surface-1 shadow-card p-4 border border-border-subtle">
          <div className="flex flex-col gap-1 mb-3">
            <div className="text-[36px] font-mono font-bold text-accent-primary leading-none">
              98
            </div>
            <div className="text-[13px] text-text-secondary">
              Community Trust Score
            </div>
          </div>
          <div className="h-1.5 w-full bg-accent-subtle rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent-primary to-success w-[98%] rounded-full" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mx-4 mb-8">
          {[
            { label: "Reports", value: reportCount.toString() },
            { label: "Responses", value: "45" },
            { label: "Joined", value: joinedDate },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-1 rounded-xl p-3 flex flex-col items-center justify-center border border-border-subtle shadow-sm overflow-hidden"
            >
              <span
                className={`${stat.label === "Joined" ? "text-[14px]" : "text-[22px]"} font-mono font-bold text-text-primary`}
              >
                {stat.value}
              </span>
              <span className="text-[12px] text-text-secondary">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Badges Section */}
        <div className="mb-8">
          <h3 className="text-[16px] font-bold text-text-primary px-4 mb-4">
            Badges
          </h3>
          <div className="flex overflow-x-auto px-4 gap-3 no-scrollbar pb-2">
            {[
              { icon: "local_police", label: "Guardian" },
              { icon: "visibility", label: "Observer" },
              { icon: "verified", label: "Trusted" },
              { icon: "handshake", label: "Helper" },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-2 shrink-0"
              >
                <div className="w-[60px] h-[60px] rounded-full bg-accent-subtle flex items-center justify-center text-accent-primary">
                  <span className="material-symbols-outlined text-[24px]">
                    {badge.icon}
                  </span>
                </div>
                <span className="text-[10px] text-text-secondary">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings List */}
        <div className="mx-4 rounded-xl bg-surface-1 border border-border-subtle overflow-hidden">
          {SETTINGS.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.label === "Sign Out") {
                  logout();
                } else if (item.label === "Notification Preferences") {
                  setNotifDrawerOpen(true);
                } else if (item.label === "Privacy Settings") {
                  setPrivacyDrawerOpen(true);
                } else if (item.label === "Help & Legal") {
                  setHelpDrawerOpen(true);
                }
              }}
              className={`
                w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors
                ${i !== 0 ? "border-t border-border-subtle" : ""}
              `}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-[20px] ${item.color || "text-text-secondary"}`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-[14px] ${item.color || "text-text-primary"}`}
                >
                  {item.label}
                </span>
              </div>
              <span className="material-symbols-outlined text-[20px] text-text-disabled">
                chevron_right
              </span>
            </button>
          ))}
        </div>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={() => {
            const nextIsDark = !isDarkMode;
            setIsDarkMode(nextIsDark);
            applyTheme(nextIsDark ? "dark" : "light");
          }}
          className="mx-4 mt-6 flex items-center justify-between p-4 rounded-xl bg-surface-1 border border-border-subtle transition-colors hover:bg-surface-2"
          aria-pressed={isDarkMode}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-text-secondary">
              dark_mode
            </span>
            <span className="text-[14px] text-text-primary">Dark Mode</span>
          </div>
          <div
            className={`relative h-6 w-12 rounded-full transition-colors ${
              isDarkMode ? "bg-accent-primary" : "bg-border-subtle"
            }`}
          >
            <div
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                isDarkMode ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </div>
        </button>

        {/* Version Footer */}
        <div className="mt-10 mb-2 flex flex-col items-center gap-1">
          <span className="text-[12px] text-text-disabled font-mono">v1.0.0</span>
          <span className="text-[11px] text-text-disabled">Built by Team Cortex for DLW</span>
        </div>
      </div>
    </>
  );
}



