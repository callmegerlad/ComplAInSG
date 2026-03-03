import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { TopBar } from "../components/layout/TopBar";
import { searchIncidents, INCIDENT_CATEGORIES, type IncidentWithMeta } from "@/lib/incidents";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get("q") || "";
  const incidentType = searchParams.get("type") || "";
  const severity = searchParams.get("severity") || "";
  const pageParam = searchParams.get("page") || "0";

  const [results, setResults] = useState<IncidentWithMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(!!query);
  const [error, setError] = useState<string | null>(null);

  const [localQuery, setLocalQuery] = useState(query);
  const [localType, setLocalType] = useState(incidentType);
  const [localSeverity, setLocalSeverity] = useState(severity);

  const page = Math.max(0, parseInt(pageParam, 10) || 0);
  const limit = 20;
  const skip = page * limit;

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setResults([]);
        setTotal(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await searchIncidents(query, incidentType, severity, skip, limit);
        setResults(data.incidents);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [query, incidentType, severity, skip]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearchParams({
      q: localQuery,
      type: localType,
      severity: localSeverity,
      page: "0",
    });
  }

  return (
    <div className="flex min-h-full flex-col bg-bg-primary">
      <TopBar showSearch={false} />

      <div className="border-b border-border-subtle bg-surface-1 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-secondary transition-colors hover:bg-accent-subtle hover:text-accent-primary"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="text-[20px] font-bold text-text-primary">Search Incidents</h1>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex w-full flex-1 items-center rounded-xl h-12 border border-accent-primary/30 focus-within:border-accent-primary bg-surface-2 transition-colors overflow-hidden">
            <div className="text-text-disabled flex items-center justify-center pl-4">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="flex w-full min-w-0 flex-1 text-text-primary focus:outline-0 bg-transparent h-full placeholder:text-text-disabled px-4 pl-2 text-[14px]"
              placeholder="Search by location or keyword"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={localType}
              onChange={(e) => setLocalType(e.target.value)}
              className="rounded-xl h-10 border border-border-subtle bg-surface-2 px-3 text-[13px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            >
              <option value="">All Types</option>
              {INCIDENT_CATEGORIES.map((cat) => (
                <option key={cat.label} value={cat.label}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={localSeverity}
              onChange={(e) => setLocalSeverity(e.target.value)}
              className="rounded-xl h-10 border border-border-subtle bg-surface-2 px-3 text-[13px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            >
              <option value="">All Severity</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-accent-primary h-10 text-[13px] font-semibold text-white transition-colors hover:bg-accent-primary/90"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex-1 px-4 py-4">
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-text-secondary text-[14px]">Searching...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-danger/20 bg-danger/10 p-4 text-center">
            <p className="text-[13px] font-semibold text-danger">Search error</p>
            <p className="text-[12px] text-text-secondary mt-1">{error}</p>
          </div>
        )}

        {!isLoading && !error && query.trim() === "" && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[48px] text-text-disabled inline-block mb-3">
              search
            </span>
            <p className="text-text-secondary text-[14px]">Enter a search query to find incidents</p>
          </div>
        )}

        {!isLoading && !error && query.trim() !== "" && results.length === 0 && (
          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 text-center">
            <p className="text-text-secondary text-[14px]">No incidents found matching your search</p>
            <p className="text-text-disabled text-[12px] mt-2">Try different keywords or filters</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div>
            <p className="text-[12px] text-text-secondary mb-3 font-semibold">
              Found {total} incident{total !== 1 ? "s" : ""}
            </p>
            <div className="space-y-3">
              {results.map((incident) => (
                <Link
                  key={incident.id}
                  to={`/incidents/${incident.id}`}
                  className="block rounded-2xl border border-border-subtle bg-surface-1 p-4 transition-all hover:border-accent-primary/50 hover:bg-surface-2"
                >
                  <div className="flex gap-3">
                    {incident.imageUrl && (
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                        <img
                          src={incident.imageUrl}
                          alt={incident.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <span
                          className="material-symbols-outlined text-[18px] shrink-0 mt-0.5"
                          style={{ color: incident.categoryColor }}
                        >
                          {incident.categoryIcon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-bold text-text-primary truncate">
                            {incident.title}
                          </h3>
                          <p className="text-[11px] text-text-secondary">
                            {incident.category} • {incident.location}
                          </p>
                        </div>
                        <span
                          className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white"
                          style={{ backgroundColor: getSeverityColor(incident.severity) }}
                        >
                          {incident.severity}
                        </span>
                      </div>

                      <p className="text-[12px] text-text-secondary line-clamp-2 mb-2">
                        {incident.summary}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-text-disabled">
                        <span>{incident.timestamp}</span>
                        <span>{incident.distance}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {total > limit && (
              <div className="flex gap-2 justify-center mt-6">
                {page > 0 && (
                  <button
                    onClick={() =>
                      setSearchParams({
                        ...Object.fromEntries(searchParams.entries()),
                        page: String(page - 1),
                      })
                    }
                    className="rounded-xl bg-surface-2 px-4 py-2 text-[12px] font-semibold text-text-primary hover:bg-surface-1"
                  >
                    Previous
                  </button>
                )}

                <div className="flex items-center gap-1">
                  {[...Array(Math.ceil(total / limit))].map((_, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setSearchParams({
                          ...Object.fromEntries(searchParams.entries()),
                          page: String(i),
                        })
                      }
                      className={`h-8 w-8 rounded-lg text-[12px] font-semibold transition-colors ${
                        page === i
                          ? "bg-accent-primary text-white"
                          : "bg-surface-2 text-text-primary hover:bg-surface-1"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {page < Math.ceil(total / limit) - 1 && (
                  <button
                    onClick={() =>
                      setSearchParams({
                        ...Object.fromEntries(searchParams.entries()),
                        page: String(page + 1),
                      })
                    }
                    className="rounded-xl bg-surface-2 px-4 py-2 text-[12px] font-semibold text-text-primary hover:bg-surface-1"
                  >
                    Next
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getSeverityColor(severity: IncidentWithMeta["severity"]) {
  if (severity === "High") return "var(--cat-fight)";
  if (severity === "Medium") return "var(--cat-transport)";
  return "var(--success)";
}
