import { useState } from "react";
import { DrawerClose, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/app/components/ui/drawer";
import { CategoryCard, CategoryType } from "@/app/components/home/CategoryCard";

const categories: { label: CategoryType; icon: string; colorVar: string }[] = [
  { label: 'Cleanliness', icon: 'delete', colorVar: 'var(--accent-primary)' },
  { label: 'Maintenance', icon: 'build', colorVar: 'var(--accent-primary)' },
  { label: 'Pests', icon: 'pest_control', colorVar: 'var(--accent-primary)' },
  { label: 'Roads & Drains', icon: 'add_road', colorVar: 'var(--accent-primary)' },
  { label: 'Trees & Plants', icon: 'eco', colorVar: 'var(--accent-primary)' },
];

export function RecordFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Step 1: Category Selection
  if (step === 1) {
    return (
      <div className="flex flex-col h-full">
        <DrawerHeader>
          <DrawerTitle className="text-center">What's happening?</DrawerTitle>
          <DrawerDescription className="text-center">Select a category to report</DrawerDescription>
        </DrawerHeader>
        
        <div className="grid grid-cols-2 gap-3 px-4 py-4 overflow-y-auto">
          {categories.map((cat) => (
            <CategoryCard 
              key={cat.label}
              label={cat.label}
              icon={cat.icon}
              colorVar={cat.colorVar}
              onClick={() => {
                setSelectedCategory(cat.label);
                setStep(2);
              }}
            />
          ))}
        </div>
        
        <div className="mt-auto p-4 flex justify-center pb-8">
           <button className="text-text-secondary text-[13px] underline">Other</button>
        </div>
      </div>
    );
  }

  // Step 2: Camera View (Mock)
  if (step === 2) {
    return (
      <div className="relative flex flex-col h-full bg-black text-white">
        {/* Mock Camera Viewfinder */}
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
             <span className="material-symbols-outlined text-[64px] text-white/20">videocam_off</span>
        </div>
        
        {/* Top Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-black/50 z-10">
           <button onClick={() => setStep(1)} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
             <span className="material-symbols-outlined">close</span>
           </button>
           <div className="px-3 py-1 bg-black/40 rounded-full text-[12px] font-bold">
             {selectedCategory}
           </div>
           <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
             <span className="material-symbols-outlined">flash_on</span>
           </button>
        </div>

        {/* Bottom Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-md rounded-t-2xl z-10 flex flex-col gap-4">
           <div className="flex items-center gap-2 text-white/80">
              <span className="material-symbols-outlined text-[16px] text-success">location_on</span>
              <span className="text-[12px]">Near Marina Bay Sands</span>
           </div>
           
           <div className="flex items-center justify-between">
              <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
              
              <button 
                onClick={() => {
                   if (!isRecording) {
                       setIsRecording(true);
                       setTimeout(() => {
                           setIsRecording(false);
                           setStep(3);
                       }, 2000); // Auto stop after 2s for demo
                   }
                }}
                className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all ${isRecording ? 'scale-110 bg-danger' : 'bg-danger'}`}
              >
                 {isRecording && <div className="w-6 h-6 bg-white rounded-sm animate-pulse" />}
              </button>
              
              <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined">mic</span>
              </button>
           </div>
           
           <p className="text-center text-[10px] text-white/50">Tap to record · Tap again to stop</p>
        </div>
      </div>
    );
  }

  // Step 3: Review
  if (step === 3) {
    return (
      <div className="flex flex-col h-full bg-surface-1 p-4 gap-4 overflow-y-auto">
        <DrawerHeader className="p-0 pb-2">
            <div className="w-12 h-1 bg-border-subtle rounded-full mx-auto mb-4" />
            <DrawerTitle>Review Report</DrawerTitle>
        </DrawerHeader>

        {/* Media Preview */}
        <div className="w-full aspect-video bg-surface-2 rounded-xl flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-[48px] text-accent-primary">play_circle</span>
           </div>
        </div>
        
        {/* AI Verification */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-success-subtle text-success">
           <span className="material-symbols-outlined text-[18px]">check_circle</span>
           <span className="text-[13px] font-bold">Content verified by AI</span>
        </div>
        
        {/* Details Input */}
        <textarea 
          className="w-full min-h-[80px] p-3 rounded-xl bg-surface-2 border border-border-subtle text-[14px] placeholder:text-text-disabled focus:outline-accent-primary"
          placeholder="Add context — number of people, direction of travel..."
        />
        
        {/* Anonymous Toggle */}
        <div className="flex items-center justify-between py-2">
           <span className="text-[14px] font-medium text-text-primary">Post anonymously</span>
           <div className="w-10 h-6 bg-accent-primary rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
           </div>
        </div>
        
        <div className="mt-auto pt-4">
           <DrawerClose asChild>
             <button className="w-full h-12 rounded-full bg-accent-primary text-white font-bold text-[15px] shadow-primary-btn active:scale-95 transition-transform">
               Submit Report
             </button>
           </DrawerClose>
           <p className="text-center text-[11px] text-text-secondary mt-2">
             Will alert people within 250m and notify SPF
           </p>
        </div>
      </div>
    );
  }

  return null;
}
