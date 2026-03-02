import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { incidents } from "@/lib/incidents";

type IncidentVote = "up" | "down" | null;

type IncidentCredibilityState = {
  upvotes: number;
  downvotes: number;
  userVote: IncidentVote;
  credibilityScore: number;
};

type IncidentCredibilityContextValue = {
  getCredibility: (incidentId: string) => IncidentCredibilityState;
  setVote: (incidentId: string, nextVote: IncidentVote) => void;
};

const STORAGE_KEY = "complainsg-incident-credibility";

const IncidentCredibilityContext = createContext<IncidentCredibilityContextValue | null>(null);

type VoteStore = Record<
  string,
  {
    upvotes: number;
    downvotes: number;
    userVote: IncidentVote;
  }
>;

function buildInitialStore(): VoteStore {
  return Object.fromEntries(
    incidents.map((incident) => [
      incident.id,
      {
        upvotes: incident.credibilityUpvotes ?? 0,
        downvotes: incident.credibilityDownvotes ?? 0,
        userVote: null,
      },
    ]),
  );
}

function loadInitialStore(): VoteStore {
  if (typeof window === "undefined") {
    return buildInitialStore();
  }

  const fallback = buildInitialStore();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<VoteStore>;
    const sanitizedEntries = Object.entries(parsed).filter(
      (
        entry,
      ): entry is [
        string,
        {
          upvotes: number;
          downvotes: number;
          userVote: IncidentVote;
        },
      ] => entry[1] !== undefined,
    );

    return {
      ...fallback,
      ...Object.fromEntries(sanitizedEntries),
    };
  } catch {
    return fallback;
  }
}

export function IncidentCredibilityProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<VoteStore>(() => loadInitialStore());

  const value = useMemo<IncidentCredibilityContextValue>(
    () => ({
      getCredibility: (incidentId) => {
        const entry = store[incidentId] ?? {
          upvotes: 0,
          downvotes: 0,
          userVote: null,
        };
        const totalVotes = entry.upvotes + entry.downvotes;
        const credibilityScore =
          totalVotes > 0 ? Math.round((entry.upvotes / totalVotes) * 100) : 50;

        return {
          ...entry,
          credibilityScore,
        };
      },
      setVote: (incidentId, nextVote) => {
        setStore((current) => {
          const existing = current[incidentId] ?? {
            upvotes: 0,
            downvotes: 0,
            userVote: null,
          };

          let nextUpvotes = existing.upvotes;
          let nextDownvotes = existing.downvotes;
          let userVote: IncidentVote = nextVote;

          if (existing.userVote === "up") {
            nextUpvotes = Math.max(0, nextUpvotes - 1);
          }

          if (existing.userVote === "down") {
            nextDownvotes = Math.max(0, nextDownvotes - 1);
          }

          if (existing.userVote === nextVote) {
            userVote = null;
          } else if (nextVote === "up") {
            nextUpvotes += 1;
          } else if (nextVote === "down") {
            nextDownvotes += 1;
          }

          const nextStore = {
            ...current,
            [incidentId]: {
              upvotes: nextUpvotes,
              downvotes: nextDownvotes,
              userVote,
            },
          };

          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
          }

          return nextStore;
        });
      },
    }),
    [store],
  );

  return (
    <IncidentCredibilityContext.Provider value={value}>
      {children}
    </IncidentCredibilityContext.Provider>
  );
}

export function useIncidentCredibility(incidentId: string) {
  const context = useContext(IncidentCredibilityContext);

  if (!context) {
    throw new Error("useIncidentCredibility must be used within IncidentCredibilityProvider");
  }

  const data = context.getCredibility(incidentId);

  return {
    ...data,
    upvote: () => context.setVote(incidentId, "up"),
    downvote: () => context.setVote(incidentId, "down"),
  };
}
