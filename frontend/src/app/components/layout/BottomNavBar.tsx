import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerTrigger } from "@/app/components/ui/drawer";
import { useState } from "react";
import { RecordFlow } from "@/app/components/record/RecordFlow";

export function BottomNavBar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const NavItem = ({ path, icon, label }: { path: string; icon: string; label: string }) => {
    const active = isActive(path);
    return (
      <Link
        to={path}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1",
          active ? "text-accent-primary" : "text-text-disabled"
        )}
      >
        <div className="flex h-8 items-center justify-center">
          <span className={cn("material-symbols-outlined", active && "fill-1")}>
            {icon}
          </span>
        </div>
        <p className={cn("text-[10px] font-medium leading-normal tracking-tight", active && "font-bold")}>
          {label}
        </p>
      </Link>
    );
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 border-t border-border-subtle bg-surface-1/95 backdrop-blur-md px-4 pb-6 pt-2 z-20">
        <div className="flex gap-2 items-end">
          <NavItem path="/" icon="home" label="Home" />
          <NavItem path="/feed" icon="list" label="Feed" />
          
          <div className="flex flex-1 flex-col items-center justify-center -mt-8 relative z-30">
             <RecordFlowTrigger />
          </div>

          <NavItem path="/map" icon="map" label="Map" />
          <NavItem path="/profile" icon="person" label="Profile" />
        </div>
      </div>
      {/* Spacer for fixed bottom nav */}
      <div className="h-24" />
    </>
  );
}

function RecordFlowTrigger() {
    // This will trigger the Drawer for the record flow
    // For now, we'll just link to a route or open a drawer
    // The spec says it opens a sheet (Record Step 1)
    return (
        <Drawer>
            <DrawerTrigger asChild>
                <button className="bg-danger text-white h-14 w-14 rounded-full shadow-lg shadow-danger/45 flex items-center justify-center active:scale-90 transition-transform mb-1">
                    <span className="material-symbols-outlined !text-3xl">videocam</span>
                </button>
            </DrawerTrigger>
            <DrawerContent className="h-[85vh] bg-surface-1 rounded-t-2xl">
                <RecordFlow />
            </DrawerContent>
        </Drawer>
    );
}
