import { IncidentCard, Incident } from "../components/home/IncidentCard";
import { TopBar } from "../components/layout/TopBar";

const incidents: (Incident & { timeGroup: string })[] = [
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
    timeGroup: 'HAPPENING NOW'
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
    timeGroup: 'HAPPENING NOW'
  },
  {
    id: '3',
    category: 'Medical Emerg',
    categoryColor: 'var(--cat-medical)',
    categoryIcon: 'emergency',
    severity: 'High',
    location: 'Bugis Junction',
    distance: '3.5km',
    title: 'Traffic Accident',
    summary: 'Multi-vehicle collision at junction. Ambulance en route.',
    timestamp: '45 min ago',
    responders: 6,
    timeGroup: 'LAST HOUR'
  },
  {
    id: '4',
    category: 'Fire/Hazard',
    categoryColor: 'var(--cat-fire)',
    categoryIcon: 'local_fire_department',
    severity: 'High',
    location: 'Tampines Mall',
    distance: '8km',
    title: 'Small Fire in Rubbish Chute',
    summary: 'Smoke detected from rubbish chute. SCDF notified.',
    timestamp: '3 hours ago',
    responders: 3,
    timeGroup: 'EARLIER TODAY'
  }
];

export function FeedPage() {
  const groups = ['HAPPENING NOW', 'LAST HOUR', 'EARLIER TODAY'];

  return (
    <div className="flex flex-col min-h-full">
      <TopBar showSearch={false} />
      
      <div className="flex items-center justify-between px-4 py-4 bg-surface-1 sticky top-[65px] z-10 border-b border-border-subtle">
        <h1 className="text-text-primary text-[20px] font-bold">Live Feed</h1>
        <button className="text-accent-primary">
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </div>

      <div className="flex flex-col pb-8">
        {groups.map(group => {
          const groupIncidents = incidents.filter(i => i.timeGroup === group);
          if (groupIncidents.length === 0) return null;
          
          return (
            <div key={group}>
              <div className="sticky top-[118px] z-10 bg-bg-primary/95 backdrop-blur-sm px-4 py-3 border-b border-border-subtle/50">
                <span className={`text-[11px] font-bold tracking-[1px] uppercase ${group === 'HAPPENING NOW' ? 'text-accent-primary' : 'text-text-secondary'}`}>
                  {group}
                </span>
              </div>
              <div className="flex flex-col gap-3 px-4 py-3">
                {groupIncidents.map(incident => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
