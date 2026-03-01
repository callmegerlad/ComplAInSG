import { cn } from "@/lib/utils";

export type CategoryType =
  | 'Cleanliness'
  | 'Maintenance'
  | 'Pests'
  | 'Roads & Drains'
  | 'Trees & Plants';

interface CategoryCardProps {
  label: string;
  icon: string;
  colorVar: string; // e.g. 'var(--cat-fight)'
  fullWidth?: boolean;
  onClick?: () => void;
}

export function CategoryCard({ label, icon, colorVar, fullWidth, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={
        cn(
          "flex rounded-xl border border-border-subtle bg-surface-1 p-4 shadow-card active:scale-95 transition-transform group text-left",
          fullWidth ? "col-span-2 flex-row items-center gap-3" : "flex-col items-start gap-3"
        )
      }
    >
      <div 
        className="p-2 rounded-lg transition-colors group-active:text-white flex items-center justify-center aspect-square"
        style={{ 
          backgroundColor: `color-mix(in srgb, ${colorVar}, transparent 90%)`,
          color: colorVar,
        }}
      >
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
      <h2 className="text-text-primary text-[14px] font-bold">{label}</h2>
    </button>
  );
}
