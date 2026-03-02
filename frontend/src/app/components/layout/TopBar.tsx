import { Link } from "react-router";
import { useAuth } from "@/app/providers/AuthProvider";
import { getUserInitials } from "@/lib/auth";
import { useAlerts } from "@/app/providers/AlertsProvider";

interface TopBarProps {
  showSearch?: boolean;
}

export function TopBar({ showSearch = true }: TopBarProps) {

  const { user } = useAuth();
  const { unreadCount } = useAlerts();
  const initials = getUserInitials(user);

  return (
    <div className="sticky top-0 z-50 bg-surface-1/90 backdrop-blur-md border-b border-border-subtle">
      <div className="flex items-center p-4 pb-2 justify-between">
        <div className="flex shrink-0 items-center gap-2">
          {/* Logo Icon Mark */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-primary">
            <span className="material-symbols-outlined text-white text-[18px]">crisis_alert</span>
          </div>
          {/* Wordmark */}
          <div className="flex items-center gap-0">
             <span className="font-bold text-lg text-text-primary">Compl</span>
             <span className="font-bold text-lg text-blue-500">AI</span>
             <span className="font-bold text-lg text-text-primary">n</span>
             <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500 font-bold text-bg-primary">SG</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 justify-end">
           <Link
             to="/notifications"
             className="relative flex items-center justify-center rounded-full h-10 w-10 bg-surface-2 text-text-secondary"
             aria-label="Open notifications"
           >
             <span className="material-symbols-outlined text-[20px]">notifications</span>
             {unreadCount > 0 ? (
               <span className="absolute right-1 top-1 min-w-4 rounded-full bg-cat-fight px-1 text-center text-[10px] font-bold leading-4 text-white">
                 {unreadCount > 9 ? "9+" : unreadCount}
               </span>
             ) : null}
           </Link>
           <Link
             to="/profile"
             className="h-9 w-9 rounded-full bg-accent-subtle border-2 border-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-[13px]"
             aria-label="Open profile"
           >
              {initials}
           </Link>
        </div>
      </div>
      
      {showSearch && (
        <div className="px-4 pb-2">
          <label className="flex flex-col w-full">
            <div className="flex w-full flex-1 items-center rounded-xl h-12 border border-accent-primary/30 focus-within:border-accent-primary bg-surface-1 transition-colors overflow-hidden">
              <div className="text-text-disabled flex items-center justify-center pl-4">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input 
                className="flex w-full min-w-0 flex-1 text-text-primary focus:outline-0 bg-transparent h-full placeholder:text-text-disabled px-4 pl-2 text-[20px] font-normal" 
                placeholder="Search incidents or locations" 
              />
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
