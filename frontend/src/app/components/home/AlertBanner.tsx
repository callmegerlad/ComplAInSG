import { cn } from "@/lib/utils";

interface AlertBannerProps {
  message: string;
  distance: string;
  onClick?: () => void;
}

export function AlertBanner({ message, distance, onClick }: AlertBannerProps) {
  return (
    <div className="w-full relative group cursor-pointer" onClick={onClick}>
      <div className="bg-danger text-white px-4 py-3 flex items-center justify-between shadow-md relative z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span className="font-semibold text-[13px]">{message} · {distance}</span>
        </div>
        <div className="flex items-center text-white/80">
          <span className="font-semibold text-[12px] mr-0.5">View</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </div>
      </div>
      
      {/* Progress Bar Container */}
      <div className="h-0.5 w-full bg-danger-subtle/20 absolute bottom-0 left-0 z-20">
        <div className="h-full bg-white/40 w-full animate-[shrink_8s_linear_forwards]" style={{ transformOrigin: 'left' }} />
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
