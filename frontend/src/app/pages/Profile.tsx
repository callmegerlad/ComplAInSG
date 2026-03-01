import { TopBar } from "../components/layout/TopBar";

export function ProfilePage() {
  return (
    <div className="flex flex-col min-h-full pb-8">
      <TopBar showSearch={false} />
      
      {/* Header Block */}
      <div className="px-6 py-6 flex flex-col items-center gap-3">
        <div className="w-[72px] h-[72px] rounded-full bg-accent-subtle border-[3px] border-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-[24px]">
          JD
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-[18px] font-semibold text-text-primary">John Doe</h2>
          <div className="flex items-center gap-1 mt-1 text-accent-primary">
            <span className="material-symbols-outlined text-[14px]">verified_user</span>
            <span className="text-[12px] font-semibold">Singpass Verified</span>
          </div>
        </div>
      </div>
      
      {/* Trust Score Card */}
      <div className="mx-4 mb-6 rounded-xl bg-surface-1 shadow-card p-4 border border-border-subtle">
        <div className="flex flex-col gap-1 mb-3">
          <div className="text-[36px] font-mono font-bold text-accent-primary leading-none">98</div>
          <div className="text-[13px] text-text-secondary">Community Trust Score</div>
        </div>
        <div className="h-1.5 w-full bg-accent-subtle rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent-primary to-success w-[98%] rounded-full" />
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mx-4 mb-8">
        {[
          { label: 'Reports', value: '12' },
          { label: 'Responses', value: '45' },
          { label: 'Verified', value: '8' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-1 rounded-xl p-3 flex flex-col items-center border border-border-subtle shadow-sm">
            <span className="text-[22px] font-mono font-bold text-text-primary">{stat.value}</span>
            <span className="text-[12px] text-text-secondary">{stat.label}</span>
          </div>
        ))}
      </div>
      
      {/* Badges Section */}
      <div className="mb-8">
        <h3 className="text-[16px] font-bold text-text-primary px-4 mb-4">Badges</h3>
        <div className="flex overflow-x-auto px-4 gap-3 no-scrollbar pb-2">
           {[
             { icon: 'local_police', label: 'Guardian' },
             { icon: 'visibility', label: 'Observer' },
             { icon: 'verified', label: 'Trusted' },
             { icon: 'handshake', label: 'Helper' },
           ].map(badge => (
             <div key={badge.label} className="flex flex-col items-center gap-2 shrink-0">
               <div className="w-[60px] h-[60px] rounded-full bg-accent-subtle flex items-center justify-center text-accent-primary">
                 <span className="material-symbols-outlined text-[24px]">{badge.icon}</span>
               </div>
               <span className="text-[10px] text-text-secondary">{badge.label}</span>
             </div>
           ))}
        </div>
      </div>
      
      {/* Settings List */}
      <div className="mx-4 rounded-xl bg-surface-1 border border-border-subtle overflow-hidden">
        {[
          { icon: 'notifications', label: 'Notification Preferences' },
          { icon: 'lock', label: 'Privacy Settings' },
          { icon: 'group', label: 'Trusted Contacts' },
          { icon: 'language', label: 'Language' },
          { icon: 'help', label: 'Help & Legal' },
          { icon: 'logout', label: 'Sign Out', color: 'text-danger' },
        ].map((item, i) => (
          <button 
            key={item.label}
            className={`
              w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors
              ${i !== 0 ? 'border-t border-border-subtle' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[20px] ${item.color || 'text-text-secondary'}`}>{item.icon}</span>
              <span className={`text-[14px] ${item.color || 'text-text-primary'}`}>{item.label}</span>
            </div>
            <span className="material-symbols-outlined text-[20px] text-text-disabled">chevron_right</span>
          </button>
        ))}
      </div>
      
      <div className="mx-4 mt-6 flex items-center justify-between p-4 rounded-xl bg-surface-1 border border-border-subtle">
        <div className="flex items-center gap-3">
           <span className="material-symbols-outlined text-[20px] text-text-secondary">dark_mode</span>
           <span className="text-[14px] text-text-primary">Dark Mode</span>
        </div>
        {/* Toggle Switch Placeholder */}
        <div className="w-12 h-6 bg-border-subtle rounded-full relative">
           <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
        </div>
      </div>
    </div>
  );
}
