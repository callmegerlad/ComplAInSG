import { cn } from "@/lib/utils";
import { useIncidentCredibility } from "@/app/providers/IncidentCredibilityProvider";

export function IncidentCredibility({
  incidentId,
  compact = false,
  inverted = false,
  className,
}: {
  incidentId: string;
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  const { credibilityScore, upvotes, downvotes, userVote, upvote, downvote } =
    useIncidentCredibility(incidentId);

  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-surface-2 px-3 py-2",
        compact
          ? "flex items-center justify-between gap-2"
          : "flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between",
        inverted && "border-white/12 bg-white/12 text-white backdrop-blur-sm",
        compact && "rounded-full px-2.5 py-1.5",
        className,
      )}
    >
      <div className={cn("min-w-0 flex-1", compact && "flex-none")}>
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary",
            compact && "text-[9px]",
            inverted && "text-white/70",
          )}
        >
          Credibility
        </p>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[14px] font-bold text-text-primary",
              compact && "text-[12px]",
              inverted && "text-white",
            )}
          >
            {credibilityScore}%
          </span>
        </div>
      </div>

      <div
        className={cn(
          compact
            ? "ml-auto flex items-center gap-1.5"
            : "flex w-full items-center justify-start gap-x-2 gap-y-1 sm:w-auto sm:justify-end",
        )}
      >
        <VoteButton
          icon="thumb_up"
          count={upvotes}
          active={userVote === "up"}
          compact={compact}
          inverted={inverted}
          onClick={upvote}
          label="Confirm incident"
        />
        <VoteButton
          icon="thumb_down"
          count={downvotes}
          active={userVote === "down"}
          compact={compact}
          inverted={inverted}
          onClick={downvote}
          label="Doubt incident"
        />
      </div>
    </div>
  );
}

function VoteButton({
  icon,
  count,
  active,
  compact,
  inverted,
  onClick,
  label,
}: {
  icon: string;
  count: number;
  active: boolean;
  compact: boolean;
  inverted: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }}
        aria-label={label}
        className={cn(
          "flex items-center justify-center rounded-full border border-border-subtle bg-surface-1 text-text-secondary transition-colors hover:bg-accent-subtle hover:text-accent-primary",
          inverted && "border-white/12 bg-white/12 text-white/88 hover:bg-white/18 hover:text-white",
          compact ? "h-8 w-8" : "h-8 w-8 sm:h-9 sm:w-9",
          active && icon === "thumb_up" && "border-green-500 bg-green-500 text-white hover:bg-green-600 hover:text-white",
          active && icon === "thumb_down" && "border-red-500 bg-red-500 text-white hover:bg-red-600 hover:text-white",
        )}
      >
        <span className={cn("material-symbols-outlined", compact ? "text-[15px]" : "text-[15px] sm:text-[16px]")}>
          {icon}
        </span>
      </button>
      <span
        className={cn(
          "min-w-[1.25rem] text-center text-[10px] sm:text-[11px] font-semibold text-text-secondary",
          compact && "text-[10px]",
          inverted && "text-white/80",
        )}
      >
        {count}
      </span>
    </div>
  );
}
