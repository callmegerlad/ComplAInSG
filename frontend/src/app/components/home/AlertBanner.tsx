interface AlertBannerProps {
  message: string;
  distance: string;
  onClick?: () => void;
}

export function AlertBanner({ message, distance, onClick }: AlertBannerProps) {
  return (
    <div className="w-full sticky top-30 z-40 group cursor-pointer" onClick={onClick}>
      <div className="bg-[#d93a3a] text-white px-4 py-3 flex items-center justify-between shadow-md relative z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span className="font-semibold text-[13px]">{message} · {distance}</span>
        </div>
        <div className="flex items-center text-white/80">
          <span className="mr-0.5 font-semibold text-[12px]">View</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 z-20 h-0.5 w-full bg-[#f4b3b3]">
        <div className="h-full w-full origin-left animate-[shrink_8s_linear_forwards] bg-white/40" />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
