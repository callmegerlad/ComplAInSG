import { useEffect, useState } from "react";

// Total display time; exit animation starts EXIT_ANIM_MS before the end
const BANNER_DURATION_MS = 8000;
const EXIT_ANIM_MS = 700;

interface AlertBannerProps {
  message: string;
  distance: string;
  onClick?: () => void;
}

export function AlertBanner({ message, distance, onClick }: AlertBannerProps) {
  const [phase, setPhase] = useState<"visible" | "exiting" | "hidden">("visible");

  useEffect(() => {
    // Reset to visible whenever the alert content changes
    setPhase("visible");
    const exitTimer = setTimeout(
      () => setPhase("exiting"),
      BANNER_DURATION_MS - EXIT_ANIM_MS,
    );
    const hideTimer = setTimeout(() => setPhase("hidden"), BANNER_DURATION_MS);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [message, distance]);

  if (phase === "hidden") return null;

  return (
    // pointer-events-auto so the banner itself is clickable even though its
    // parent wrapper uses pointer-events-none for the transparent region.
    <div
      className="pointer-events-auto w-full cursor-pointer"
      onClick={onClick}
      style={{
        opacity: phase === "exiting" ? 0 : 1,
        transform: phase === "exiting" ? "translateY(-110%)" : "translateY(0)",
        transition:
          phase === "exiting"
            ? `opacity ${EXIT_ANIM_MS}ms ease-in, transform ${EXIT_ANIM_MS}ms ease-in`
            : "none",
      }}
    >
      <div className="relative bg-[#d93a3a] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span className="font-semibold text-[13px]">
            {message} · {distance}
          </span>
        </div>
        <div className="flex items-center text-white/80">
          <span className="mr-0.5 font-semibold text-[12px]">View</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </div>
      </div>

      {/* Progress bar that shrinks to 0 over BANNER_DURATION_MS */}
      <div className="h-0.5 w-full bg-[#f4b3b3]">
        <div
          className="h-full origin-left bg-white/40"
          style={{
            animation: `alertShrink ${BANNER_DURATION_MS}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes alertShrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

