import { TopBar } from "../components/layout/TopBar";
import { IncidentCard } from "../components/home/IncidentCard";
import { useState } from "react";

const incidents = [
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
    responders: 2,
    imageUrl: 'https://images.unsplash.com/photo-1471623320832-752e8bbf8413?q=80&w=200&auto=format&fit=crop'
  }
];

const categories = ['All', 'Fight', 'Harassment', 'Crime', 'Transport', 'Medical', 'Fire'];

export function MapPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="flex flex-col h-screen overflow-hidden pb-24">
      <TopBar showSearch={true} />
      
      {/* Map Layer - Placeholder */}
      <div className="relative w-full h-[50vh] bg-bg-secondary flex items-center justify-center shrink-0">
        <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Singapore&zoom=12&size=600x300&sensor=false')] bg-cover opacity-50 grayscale"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
                <div className="w-4 h-4 bg-accent-primary rounded-full border-2 border-white z-10 relative"></div>
                <div className="w-9 h-9 bg-accent-primary/30 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
            </div>
        </div>
        
        {/* Incident Pins */}
        <div className="absolute top-1/4 left-1/4">
             <div className="w-6 h-6 rounded-full bg-danger flex items-center justify-center border-2 border-white shadow-lg">
                <span className="material-symbols-outlined text-white text-[12px]">local_police</span>
             </div>
        </div>
      </div>
      
      {/* Content Layer */}
      <div className="flex-1 bg-surface-1 rounded-t-2xl -mt-4 relative z-10 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Handle */}
        <div className="w-12 h-1 bg-border-subtle rounded-full mx-auto mt-3 mb-1 shrink-0" />
        
        {/* Filter Chips */}
        <div className="flex overflow-x-auto px-4 py-3 gap-2 no-scrollbar shrink-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`
                px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap border transition-colors
                ${activeFilter === cat 
                  ? 'bg-accent-subtle border-accent-primary text-accent-primary' 
                  : 'bg-transparent border-border-subtle text-text-secondary hover:bg-surface-2'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
           {incidents.map(incident => (
             <IncidentCard key={incident.id} incident={incident} />
           ))}
        </div>
      </div>
    </div>
  );
}
