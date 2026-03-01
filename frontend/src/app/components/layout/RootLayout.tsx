import { createContext, useContext } from "react";
import { Outlet } from "react-router";
import { BottomNavBar } from "./BottomNavBar";
import { useAlerts, type AlertPayload } from "@/lib/ws";

// ── Alert context so any page can read live alerts ──────────────────
interface AlertContextValue {
  alerts: AlertPayload[];
  connected: boolean;
  clearAlerts: () => void;
}

const AlertContext = createContext<AlertContextValue>({
  alerts: [],
  connected: false,
  clearAlerts: () => {},
});

export function useAlertContext() {
  return useContext(AlertContext);
}

// ── Layout ──────────────────────────────────────────────────────────
export function RootLayout() {
  const alertState = useAlerts();

  return (
    <AlertContext.Provider value={alertState}>
      <div className="relative flex h-screen w-full flex-col bg-bg-primary overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-24 scroll-smooth">
          <Outlet />
        </div>
        <BottomNavBar />
      </div>
    </AlertContext.Provider>
  );
}
