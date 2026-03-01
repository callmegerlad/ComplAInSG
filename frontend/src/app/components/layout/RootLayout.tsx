import { Outlet } from "react-router";
import { BottomNavBar } from "./BottomNavBar";

export function RootLayout() {
  return (
    <div className="relative flex h-screen w-full flex-col bg-bg-primary overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        <Outlet />
      </div>
      <BottomNavBar />
    </div>
  );
}
