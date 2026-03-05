import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminIncidentMap, type AdminMapIncident } from "@/app/components/map/AdminIncidentMap";
import { TopBar } from "@/app/components/layout/TopBar";
import { fetchIncidentList, incidents as fallbackIncidents, type IncidentWithMeta } from "@/lib/incidents";
import { useCurrentLocation } from "@/lib/location";

type AgencyProfile = {
  agency: string;
  desk: string;
  eta: string;
};

type IncomingBannerItem = {
  id: string;
  title: string;
  location: string;
  severity: IncidentWithMeta["severity"];
};

function inferRoutingAgency(incident: IncidentWithMeta): AgencyProfile {
  const routingTarget = String(incident.routingTarget ?? "").toUpperCase();
  if (routingTarget === "CALL_999") {
    return { agency: "Singapore Police Force", desk: "Police Operations Command", eta: "3-7 min" };
  }
  if (routingTarget === "CALL_995") {
    return { agency: "SCDF Fire Command", desk: "Fire Ops Dispatch", eta: "4-8 min" };
  }

  const category = incident.category.toLowerCase();
  const summary = incident.summary.toLowerCase();

  if (category.includes("fire") || category.includes("hazard") || summary.includes("smoke")) {
    return { agency: "SCDF Fire Command", desk: "Fire Ops Dispatch", eta: "4-8 min" };
  }

  if (category.includes("medical") || summary.includes("ambulance") || summary.includes("injury")) {
    return { agency: "SCDF EMS", desk: "Medical Dispatch Desk", eta: "5-9 min" };
  }

  if (category.includes("fight") || category.includes("assault") || summary.includes("violence")) {
    return { agency: "Singapore Police Force", desk: "Police Operations Command", eta: "3-7 min" };
  }

  if (category.includes("transport") || summary.includes("traffic") || summary.includes("mrt")) {
    return { agency: "LTA Control Centre", desk: "Transport Incident Desk", eta: "8-12 min" };
  }

  return { agency: "Municipal Operations Centre", desk: "General Incident Desk", eta: "10-15 min" };
}

function requiresAuthoritySharing(incident: IncidentWithMeta) {
  const routingTarget = String(incident.routingTarget ?? "").toUpperCase();
  return routingTarget === "CALL_999" || routingTarget === "CALL_995";
}

function isSolvedStatus(status: string | undefined) {
  const normalized = String(status ?? "").toUpperCase();
  return normalized === "RESOLVED" || normalized === "CLOSED";
}

function isTodayTimestamp(timestampLabel: string | undefined) {
  const value = String(timestampLabel ?? "").toLowerCase();
  if (!value) return false;
  if (value.includes("just now") || value.includes("min ago") || value.includes("hour ago") || value.includes("hours ago")) {
    return true;
  }
  const dayMatch = value.match(/(\d+)\s+day/);
  if (dayMatch) {
    return Number(dayMatch[1]) <= 1;
  }
  return false;
}

function toAdminMapIncident(incident: IncidentWithMeta): AdminMapIncident | null {
  if (
    typeof incident.lat !== "number" ||
    typeof incident.lng !== "number" ||
    !Number.isFinite(incident.lat) ||
    !Number.isFinite(incident.lng)
  ) {
    return null;
  }

  const profile = inferRoutingAgency(incident);
  return {
    id: incident.id,
    title: incident.title,
    category: incident.category,
    location: incident.location,
    lat: incident.lat,
    lng: incident.lng,
    severity: incident.severity,
    routingAgency: profile.agency,
  };
}

export function AdminCasesPage() {
  const [allIncidents, setAllIncidents] = useState<IncidentWithMeta[]>(fallbackIncidents);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedCaseTypes, setSelectedCaseTypes] = useState<string[]>([]);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [incomingBanners, setIncomingBanners] = useState<IncomingBannerItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { lat: userLat, lng: userLng } = useCurrentLocation();
  const hasHydratedLiveDataRef = useRef(false);
  const dismissedBannerIdsRef = useRef<Set<string>>(new Set());
  const bannerEnterFrameRef = useRef<number | null>(null);
  const bannerDismissTimerRef = useRef<number | null>(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const loadAllIncidents = useCallback(async () => {
    const pageSize = 100;
    let skip = 0;
    let total = Number.POSITIVE_INFINITY;
    const merged: IncidentWithMeta[] = [];

    while (skip < total) {
      const data = await fetchIncidentList({
        skip,
        limit: pageSize,
        userLat: userLat ?? undefined,
        userLng: userLng ?? undefined,
      });
      merged.push(...data.incidents);
      total = data.total;

      if (data.incidents.length === 0) {
        break;
      }
      skip += data.incidents.length;
    }

    setAllIncidents((previous) => {
      const previousIds = new Set(previous.map((incident) => incident.id));
      const newlyArrived = merged.filter((incident) => !previousIds.has(incident.id));

      if (hasHydratedLiveDataRef.current && newlyArrived.length > 0) {
        setIncomingBanners((current) => {
          const existing = new Set(current.map((item) => item.id));
          const additions = newlyArrived
            .filter(
              (incident) =>
                !existing.has(incident.id) && !dismissedBannerIdsRef.current.has(incident.id),
            )
            .map((incident) => ({
              id: incident.id,
              title: incident.title,
              location: incident.location,
              severity: incident.severity,
            }));
          return [...additions, ...current].slice(0, 6);
        });
      }

      hasHydratedLiveDataRef.current = true;
      return merged;
    });
    setLoadError(null);
  }, [userLat, userLng]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        await loadAllIncidents();
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load cases.");
        }
      }
    }

    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [loadAllIncidents]);

  const allCaseItems = useMemo(() => {
    return allIncidents.map((incident) => ({
      source: incident,
      mapped: toAdminMapIncident(incident),
      agency: inferRoutingAgency(incident),
    }));
  }, [allIncidents]);

  const caseTypes = useMemo(
    () => Array.from(new Set(allCaseItems.map((item) => item.source.category))).sort((a, b) => a.localeCompare(b)),
    [allCaseItems],
  );

  const agencies = useMemo(
    () => Array.from(new Set(allCaseItems.map((item) => item.agency.agency))).sort((a, b) => a.localeCompare(b)),
    [allCaseItems],
  );

  const filteredCases = useMemo(() => {
    return allCaseItems.filter((item) => {
      const matchesType =
        selectedCaseTypes.length === 0 || selectedCaseTypes.includes(item.source.category);
      const matchesAgency = selectedAgencies.length === 0 || selectedAgencies.includes(item.agency.agency);
      return matchesType && matchesAgency;
    });
  }, [allCaseItems, selectedAgencies, selectedCaseTypes]);

  const mappableFilteredCases = useMemo(
    () =>
      filteredCases.filter(
        (item): item is { source: IncidentWithMeta; mapped: AdminMapIncident; agency: AgencyProfile } =>
          item.mapped !== null,
      ),
    [filteredCases],
  );
  const todayCases = useMemo(
    () => filteredCases.filter((item) => isTodayTimestamp(item.source.timestamp)),
    [filteredCases],
  );
  const todaySolvedCases = useMemo(
    () => todayCases.filter((item) => isSolvedStatus(item.source.status)),
    [todayCases],
  );
  const todayOpenCases = useMemo(
    () => todayCases.filter((item) => !isSolvedStatus(item.source.status)),
    [todayCases],
  );
  const todayAuthorityPendingCases = useMemo(
    () =>
      todayCases.filter(
        (item) => requiresAuthoritySharing(item.source) && !item.source.authorityShareConsent,
      ),
    [todayCases],
  );
  const todaySeverityCounts = useMemo(() => {
    return {
      high: todayCases.filter((item) => item.source.severity === "High").length,
      medium: todayCases.filter((item) => item.source.severity === "Medium").length,
      low: todayCases.filter((item) => item.source.severity === "Low").length,
    };
  }, [todayCases]);
  const todayAuthorityRequiredCases = useMemo(
    () => todayCases.filter((item) => requiresAuthoritySharing(item.source)),
    [todayCases],
  );
  const todayAuthorityConsentReceivedCases = useMemo(
    () => todayAuthorityRequiredCases.filter((item) => item.source.authorityShareConsent),
    [todayAuthorityRequiredCases],
  );
  const todayTopAgencies = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of todayCases) {
      counts.set(item.agency.agency, (counts.get(item.agency.agency) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([agency, count]) => ({ agency, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [todayCases]);
  const todayResolutionRate = todayCases.length > 0 ? Math.round((todaySolvedCases.length / todayCases.length) * 100) : 0;
  const todayConsentRate = todayAuthorityRequiredCases.length > 0
    ? Math.round((todayAuthorityConsentReceivedCases.length / todayAuthorityRequiredCases.length) * 100)
    : 100;

  useEffect(() => {
    if (selectedIncidentId && !filteredCases.some((item) => item.source.id === selectedIncidentId)) {
      setSelectedIncidentId(null);
    }
  }, [filteredCases, selectedIncidentId]);

  const selectedCase = useMemo(
    () => filteredCases.find((item) => item.source.id === selectedIncidentId),
    [filteredCases, selectedIncidentId],
  );
  const selectedProfile = useMemo(
    () => (selectedCase ? inferRoutingAgency(selectedCase.source) : null),
    [selectedCase],
  );
  const activeIncomingBanner = incomingBanners[0] ?? null;

  useEffect(() => {
    if (bannerEnterFrameRef.current !== null) {
      window.cancelAnimationFrame(bannerEnterFrameRef.current);
      bannerEnterFrameRef.current = null;
    }
    if (!activeIncomingBanner) {
      setIsBannerVisible(false);
      return;
    }
    setIsBannerVisible(false);
    bannerEnterFrameRef.current = window.requestAnimationFrame(() => {
      setIsBannerVisible(true);
      bannerEnterFrameRef.current = null;
    });
  }, [activeIncomingBanner?.id]);

  useEffect(() => {
    return () => {
      if (bannerEnterFrameRef.current !== null) {
        window.cancelAnimationFrame(bannerEnterFrameRef.current);
      }
      if (bannerDismissTimerRef.current !== null) {
        window.clearTimeout(bannerDismissTimerRef.current);
      }
    };
  }, []);

  function toggleFilter(currentValues: string[], value: string, setValues: (next: string[]) => void) {
    if (currentValues.includes(value)) {
      setValues(currentValues.filter((item) => item !== value));
    } else {
      setValues([...currentValues, value]);
    }
  }

  function dismissIncomingBanner(incidentId: string) {
    setIsBannerVisible(false);
    if (bannerDismissTimerRef.current !== null) {
      window.clearTimeout(bannerDismissTimerRef.current);
    }
    bannerDismissTimerRef.current = window.setTimeout(() => {
      dismissedBannerIdsRef.current.add(incidentId);
      setIncomingBanners((current) => current.filter((item) => item.id !== incidentId));
      bannerDismissTimerRef.current = null;
    }, 220);
  }

  function selectFromIncomingBanner(incidentId: string) {
    setSelectedIncidentId(incidentId);
    setIncomingBanners((current) => current.filter((item) => item.id !== incidentId));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-primary">
      <TopBar showSearch={false} />
      {activeIncomingBanner ? (
        <div className="pointer-events-none fixed right-4 top-24 z-[70] w-[min(420px,calc(100vw-2rem))]">
          <div
            className={`pointer-events-auto flex items-center gap-2 rounded-xl border border-accent-primary/30 bg-surface-1/75 px-3 py-2 shadow-card backdrop-blur-md transition-all duration-200 ease-out ${
              isBannerVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
            }`}
          >
            <button
              type="button"
              onClick={() => selectFromIncomingBanner(activeIncomingBanner.id)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-sm font-semibold text-text-primary">
                New case: {activeIncomingBanner.title}
              </p>
              <p className="truncate text-xs text-text-secondary">
                {activeIncomingBanner.location} • {activeIncomingBanner.severity}
              </p>
            </button>
            <button
              type="button"
              onClick={() => dismissIncomingBanner(activeIncomingBanner.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle bg-surface-1/90 text-text-secondary hover:border-border-strong"
              aria-label="Dismiss incoming case notification"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1800px] flex-1 min-h-0 flex-col gap-4 px-4 pb-4 pt-3 lg:px-8">
        <header className="shrink-0">
          <h1 className="text-2xl font-bold text-text-primary lg:text-3xl">Admin Case Routing</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Desktop control center for incoming cases. Red heat indicates severe and critical load, while green indicates casual incidents.
          </p>
          {loadError ? <p className="mt-2 text-sm text-danger">Live feed unavailable: {loadError}</p> : null}
        </header>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(360px,1fr)]">
          <div className="grid min-h-0 gap-4 lg:grid-rows-[1fr_1fr]">
            <section className="flex min-h-0 flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">Geospatial Case Heatmap</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold uppercase text-red-700">Severe/Critical</span>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-700">Moderate</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">Casual</span>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <AdminIncidentMap
                  incidents={mappableFilteredCases.map((item) => item.mapped)}
                  selectedIncidentId={selectedIncidentId}
                  onSelectIncident={setSelectedIncidentId}
                />
              </div>
            </section>

            <section className="min-h-0 overflow-auto rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-card">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Routing Panel</h2>
              {selectedCase && selectedProfile ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
                    <p className="text-xl font-bold text-text-primary">{selectedCase.source.title}</p>
                    <p className="mt-1 text-sm text-text-secondary">{selectedCase.source.location}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-accent-subtle px-2 py-1 text-xs font-medium text-accent-primary">
                        {selectedCase.source.category}
                      </span>
                      <span className="rounded-full bg-surface-1 px-2 py-1 text-xs font-medium text-text-secondary">
                        Severity: {selectedCase.source.severity}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 lg:grid-cols-3">
                    <RoutingStat label="Routing Agency" value={selectedProfile.agency} />
                    <RoutingStat label="Dispatch Desk" value={selectedProfile.desk} />
                    <RoutingStat label="Estimated Response" value={selectedProfile.eta} />
                  </div>

                  {requiresAuthoritySharing(selectedCase.source) ? (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Authority Sharing</p>
                      <p className={`mt-1 text-sm ${selectedCase.source.authorityShareConsent ? "font-semibold text-green-700" : "font-semibold text-orange-700"}`}>
                        {selectedCase.source.authorityShareConsent
                          ? "Reporter consented to share full info and media with authorities."
                          : "Consent pending. Authority handoff is blocked until reporter approval."}
                      </p>
                      {selectedCase.source.authorityShareConsentedAt ? (
                        <p className="mt-1 text-xs text-amber-800">
                          Consented at {new Date(selectedCase.source.authorityShareConsentedAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Case Summary</p>
                    <p className="mt-1 text-sm text-text-primary">{selectedCase.source.summary}</p>
                  </div>

                  {requiresAuthoritySharing(selectedCase.source) ? (
                    <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Full Case Information</p>
                      <div className="mt-2 grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
                        <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-1">
                          {selectedCase.source.authorityShareConsent && selectedCase.source.imageUrl ? (
                            <img
                              src={selectedCase.source.imageUrl}
                              alt={selectedCase.source.title}
                              className="h-full w-full object-cover"
                            />
                          ) : !selectedCase.source.authorityShareConsent ? (
                            <div className="flex h-40 flex-col items-center justify-center gap-2 p-3 text-center text-text-secondary">
                              <span className="material-symbols-outlined text-4xl">shield_locked</span>
                              <p className="text-xs">Image hidden until reporter grants authority sharing consent.</p>
                            </div>
                          ) : (
                            <div className="flex h-40 items-center justify-center text-text-disabled">
                              <span className="material-symbols-outlined text-4xl">image_not_supported</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Reporter</p>
                            <p className="text-sm text-text-primary">{selectedCase.source.reporter ?? "Anonymous"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Timestamp</p>
                            <p className="text-sm text-text-primary">{selectedCase.source.timestamp}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Description</p>
                            <p className="whitespace-pre-wrap text-sm text-text-primary">
                              {selectedCase.source.descriptionFull || selectedCase.source.summary}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-accent-primary/25 bg-gradient-to-br from-accent-subtle to-surface-2 p-4">
                    <p className="text-sm font-semibold text-text-primary">Today Analytics</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Live operational snapshot for cases in today&apos;s queue.
                    </p>
                    <div className="mt-3 grid gap-2 lg:grid-cols-4">
                      <AnalyticsMetric label="Opened Today" value={String(todayCases.length)} tone="blue" />
                      <AnalyticsMetric label="Still Open" value={String(todayOpenCases.length)} tone="orange" />
                      <AnalyticsMetric label="Solved" value={String(todaySolvedCases.length)} tone="green" />
                      <AnalyticsMetric label="Consent Pending" value={String(todayAuthorityPendingCases.length)} tone="orange" />
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Severity Mix</p>
                      <div className="mt-2 space-y-2">
                        <AnalyticsBar label="High" value={todaySeverityCounts.high} total={todayCases.length} barClass="bg-red-500" />
                        <AnalyticsBar label="Medium" value={todaySeverityCounts.medium} total={todayCases.length} barClass="bg-amber-500" />
                        <AnalyticsBar label="Low" value={todaySeverityCounts.low} total={todayCases.length} barClass="bg-emerald-500" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Performance</p>
                      <div className="mt-3 space-y-3">
                        <AnalyticsProgress
                          label="Resolution Rate"
                          valueLabel={`${todayResolutionRate}%`}
                          percent={todayResolutionRate}
                          fillClass="bg-emerald-500"
                        />
                        <AnalyticsProgress
                          label="Authority Consent Rate"
                          valueLabel={`${todayConsentRate}%`}
                          percent={todayConsentRate}
                          fillClass="bg-accent-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Top Routing Agencies (Today)</p>
                    <div className="mt-2 space-y-2">
                      {todayTopAgencies.length > 0 ? todayTopAgencies.map((item) => (
                        <div key={item.agency} className="flex items-center justify-between rounded-lg bg-surface-1 px-3 py-2">
                          <span className="text-sm font-medium text-text-primary">{item.agency}</span>
                          <span className="rounded-full bg-accent-subtle px-2 py-1 text-xs font-semibold text-accent-primary">{item.count}</span>
                        </div>
                      )) : (
                        <p className="rounded-lg bg-surface-1 px-3 py-2 text-sm text-text-secondary">No cases recorded today.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="grid min-h-0 gap-4 lg:grid-rows-[auto_1fr]">
            <section className="rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-card">
              <p className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Filters</p>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Case Types</p>
                  <div className="flex flex-wrap gap-2">
                    {caseTypes.map((caseType) => {
                      const active = selectedCaseTypes.includes(caseType);
                      return (
                        <button
                          key={caseType}
                          type="button"
                          onClick={() => toggleFilter(selectedCaseTypes, caseType, setSelectedCaseTypes)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            active
                              ? "border-accent-primary bg-accent-primary text-white"
                              : "border-border-subtle bg-surface-1 text-text-secondary hover:border-border-strong"
                          }`}
                        >
                          {caseType}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Routing Agencies</p>
                  <div className="flex flex-wrap gap-2">
                    {agencies.map((agency) => {
                      const active = selectedAgencies.includes(agency);
                      return (
                        <button
                          key={agency}
                          type="button"
                          onClick={() => toggleFilter(selectedAgencies, agency, setSelectedAgencies)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            active
                              ? "border-accent-primary bg-accent-primary text-white"
                              : "border-border-subtle bg-surface-1 text-text-secondary hover:border-border-strong"
                          }`}
                        >
                          {agency}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="min-h-0 overflow-auto rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-card">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
                Cases in View ({filteredCases.length})
              </p>
              <div className="space-y-2">
                {filteredCases.map((item) => {
                  const selected = selectedIncidentId === item.source.id;
                  const profile = inferRoutingAgency(item.source);
                  return (
                    <button
                      type="button"
                      key={item.source.id}
                      onClick={() =>
                        setSelectedIncidentId((current) =>
                          current === item.source.id ? null : item.source.id,
                        )
                      }
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        selected
                          ? "border-accent-primary bg-accent-subtle"
                          : "border-border-subtle bg-surface-2 hover:border-border-strong"
                      }`}
                    >
                      <p className="text-sm font-semibold text-text-primary">{item.source.title}</p>
                      <p className="mt-0.5 text-[11px] text-text-secondary">
                        {profile.agency} • {item.source.location}
                      </p>
                      {!item.mapped ? (
                        <p className="mt-1 text-[11px] font-medium text-text-disabled">No map coordinates</p>
                      ) : null}
                      {requiresAuthoritySharing(item.source) ? (
                        <p className={`mt-1 text-[11px] font-medium ${item.source.authorityShareConsent ? "text-green-700" : "text-orange-600"}`}>
                          Authority case • {item.source.authorityShareConsent ? "Consent received" : "Consent pending"}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
                {filteredCases.length === 0 ? (
                  <p className="rounded-lg border border-border-subtle bg-surface-2 p-3 text-sm text-text-secondary">
                    No cases match the selected case-type and routing filters.
                  </p>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function RoutingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function AnalyticsMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "orange";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "orange"
        ? "bg-orange-50 text-orange-700 border-orange-200"
        : "bg-accent-subtle text-accent-primary border-accent-primary/20";
  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function AnalyticsBar({
  label,
  value,
  total,
  barClass,
}: {
  label: string;
  value: number;
  total: number;
  barClass: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="text-text-secondary">{value} ({percent}%)</span>
      </div>
      <div className="h-2 rounded-full bg-surface-1">
        <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function AnalyticsProgress({
  label,
  valueLabel,
  percent,
  fillClass,
}: {
  label: string;
  valueLabel: string;
  percent: number;
  fillClass: string;
}) {
  const safePercent = Math.max(0, Math.min(100, percent));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="font-semibold text-text-primary">{valueLabel}</span>
      </div>
      <div className="h-2.5 rounded-full bg-surface-1">
        <div className={`h-2.5 rounded-full ${fillClass}`} style={{ width: `${safePercent}%` }} />
      </div>
    </div>
  );
}
