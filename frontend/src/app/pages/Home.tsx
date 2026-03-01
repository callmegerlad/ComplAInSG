import { TopBar } from "../components/layout/TopBar";
import { AlertBanner } from "../components/home/AlertBanner";
import { CategoryCard, CategoryType } from "../components/home/CategoryCard";
import { IncidentCard, Incident } from "../components/home/IncidentCard";
import { LocationCard } from "../components/home/LocationCard";

const categories: { label: CategoryType; icon: string; colorVar: string; fullWidth?: boolean }[] = [
  { label: 'Fight/Assault', icon: 'local_police', colorVar: 'var(--cat-fight)' },
  { label: 'Harassment', icon: 'report', colorVar: 'var(--cat-harassment)' },
  { label: 'Crime', icon: 'gavel', colorVar: 'var(--cat-crime)' },
  { label: 'Transport Fault', icon: 'train', colorVar: 'var(--cat-transport)' },
  { label: 'Medical Emerg', icon: 'emergency', colorVar: 'var(--cat-medical)', fullWidth: true },
  { label: 'Fire/Hazard', icon: 'local_fire_department', colorVar: 'var(--cat-fire)', fullWidth: true },
];

const incidents: Incident[] = [
  {
    id: '1',
    category: 'Fight/Assault',
    categoryColor: 'var(--cat-fight)',
    categoryIcon: 'local_police',
    severity: 'High',
    location: 'Ang Mo Kio Ave 3',
    distance: '80m',
    title: 'Fight reported at Block 423',
    summary: 'Content verified by AI. Two individuals involved in a physical altercation near the void deck.',
    timestamp: '2 min ago',
    status: 'In Progress',
    responders: 4,
    imageUrl: 'https://images.unsplash.com/photo-1563266914-94073574828f?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: '2',
    category: 'Transport Fault',
    categoryColor: 'var(--cat-transport)',
    categoryIcon: 'train',
    severity: 'Medium',
    location: 'Orchard MRT',
    distance: '1.2km',
    title: 'Escalator Breakdown',
    summary: 'Escalator B at Exit 3 is currently non-functional. Technicians have been dispatched.',
    timestamp: '15 min ago',
    status: 'In Progress',
    responders: 2,
    imageUrl: 'https://images.unsplash.com/photo-1471623320832-752e8bbf8413?q=80&w=200&auto=format&fit=crop'
  }
];

export function HomePage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar showSearch={true} />
      
      {/* Alert Banner - Conditional */}
      <AlertBanner 
        message="Fight reported" 
        distance="80m away" 
      />
      
      {/* Scrollable Content */}
      <div className="flex flex-col gap-8 pb-8">
        
        {/* Report Section */}
        <section>
          <div className="flex items-center justify-between px-4 pt-6 pb-3">
            <h2 className="text-text-primary text-[20px] font-bold tracking-tight">Report an Incident</h2>
            <a href="#" className="text-accent-primary text-[14px] font-semibold">View all</a>
          </div>
          
          <div className="grid grid-cols-2 gap-3 px-4">
            {categories.map((cat) => (
              <CategoryCard 
                key={cat.label}
                label={cat.label}
                icon={cat.icon}
                colorVar={cat.colorVar}
                fullWidth={cat.fullWidth}
              />
            ))}
          </div>
        </section>
        
        {/* Recent Reports Section */}
        <section className="space-y-4 px-4">
          <div className="flex items-center justify-between pt-2 pb-0">
             <h2 className="text-text-primary text-[20px] font-bold tracking-tight">Live Nearby</h2>
          </div>
          
          <div className="flex flex-col gap-3">
            {incidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
            
            <LocationCard />
          </div>
        </section>
        
      </div>
    </div>
  );
}
