import { cn } from "@/lib/utils";
import { Link } from "react-router";

export function LocationCard() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden shadow-card">
      <div className="h-32 bg-accent-subtle relative flex flex-col items-center justify-center">
        {/* Placeholder for map */}
        <span className="material-symbols-outlined text-[32px] text-accent-primary">location_on</span>
        <span className="font-semibold text-[12px] text-accent-primary mt-1">Live Map</span>
      </div>
      <div className="p-4 flex items-center justify-between h-14">
        <div>
          <p className="text-text-secondary text-[12px]">Current Location</p>
          <h3 className="text-text-primary font-bold text-[14px]">Near Marina Bay Sands</h3>
        </div>
        <Link 
          to="/map" 
          className="bg-accent-primary hover:bg-accent-hover text-white text-[12px] font-bold px-4 py-2 rounded-lg transition-colors"
        >
          Update
        </Link>
      </div>
    </div>
  );
}
