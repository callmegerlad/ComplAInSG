import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;

export interface RealtimeAlert {
  type: "ALERT";
  incident_id: string;
  location: string;
  incident_lat: number;
  incident_lng: number;
  radius_m: number;
  incident_type: string;
  severity: AlertSeverity;
  routing: string;
  receivedAt: string;
  read: boolean;
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";
type PermissionStatus = "unknown" | "granted" | "denied" | "unsupported";

interface AlertsContextValue {
  alerts: RealtimeAlert[];
  unreadCount: number;
  connectionStatus: ConnectionStatus;
  permissionStatus: PermissionStatus;
  error: string | null;
  markAllAsRead: () => void;
}

interface LocationSnapshot {
  lat: number;
  lng: number;
  accuracy_m: number;
}

const STORAGE_KEY = "complainsg.alerts";
const MAX_STORED_ALERTS = 50;
const AlertsContext = createContext<AlertsContextValue | null>(null);

function getAlertsSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
  const normalized = apiUrl.replace(/\/+$/, "");
  return `${normalized.replace(/^http/i, "ws")}/ws/alerts`;
}

function loadStoredAlerts() {
  if (typeof window === "undefined") {
    return [] as RealtimeAlert[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as RealtimeAlert[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistAlerts(alerts: RealtimeAlert[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<RealtimeAlert[]>(() => loadStoredAlerts());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("unknown");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const locationWatchRef = useRef<number | null>(null);
  const latestLocationRef = useRef<LocationSnapshot | null>(null);
  const manualCloseRef = useRef(false);

  useEffect(() => {
    persistAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("geolocation" in navigator)) {
      setPermissionStatus("unsupported");
      setError("Geolocation is not supported in this browser.");
      return;
    }

    let cancelled = false;

    const sendLocation = (location: LocationSnapshot) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
      }

      socket.send(
        JSON.stringify({
          type: "LOCATION_UPDATE",
          ...location,
        }),
      );
    };

    const connect = () => {
      if (cancelled) {
        return;
      }

      setConnectionStatus("connecting");
      const socket = new WebSocket(getAlertsSocketUrl());
      socketRef.current = socket;

      socket.addEventListener("open", () => {
        setConnectionStatus("connected");
        setError(null);
        if (latestLocationRef.current) {
          sendLocation(latestLocationRef.current);
        }
      });

      socket.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data) as Partial<RealtimeAlert> & { type?: string };
          if (payload.type !== "ALERT" || !payload.incident_id) {
            return;
          }

          const incidentId = payload.incident_id;

          setAlerts((current) => {
            if (current.some((alert) => alert.incident_id === incidentId)) {
              return current;
            }

            const nextAlert: RealtimeAlert = {
              type: "ALERT",
              incident_id: incidentId,
              location: payload.location ?? "Unknown location",
              incident_lat: Number(payload.incident_lat ?? 0),
              incident_lng: Number(payload.incident_lng ?? 0),
              radius_m: Number(payload.radius_m ?? 0),
              incident_type: payload.incident_type ?? "Incident alert",
              severity: payload.severity ?? "LOW",
              routing: payload.routing ?? "",
              receivedAt: new Date().toISOString(),
              read: false,
            };

            return [nextAlert, ...current].slice(0, MAX_STORED_ALERTS);
          });
        } catch {
          setError("Received an invalid realtime alert payload.");
        }
      });

      socket.addEventListener("close", () => {
        socketRef.current = null;
        setConnectionStatus((current) => (current === "error" ? current : "disconnected"));

        if (manualCloseRef.current || cancelled) {
          return;
        }

        reconnectTimerRef.current = window.setTimeout(() => {
          connect();
        }, 3000);
      });

      socket.addEventListener("error", () => {
        setConnectionStatus("error");
        setError("Unable to connect to backend alerts.");
      });
    };

    connect();

    locationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation: LocationSnapshot = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
        };

        latestLocationRef.current = nextLocation;
        setPermissionStatus("granted");
        sendLocation(nextLocation);
      },
      (positionError) => {
        if (positionError.code === positionError.PERMISSION_DENIED) {
          setPermissionStatus("denied");
          setError("Location permission is required for nearby alerts.");
          return;
        }

        setError("Unable to read your location for backend alerts.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 15000,
      },
    );

    return () => {
      cancelled = true;
      manualCloseRef.current = true;

      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }

      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }

      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts((current) => {
      let hasUnread = false;
      const nextAlerts = current.map((alert) => {
        if (alert.read) {
          return alert;
        }

        hasUnread = true;
        return { ...alert, read: true };
      });

      return hasUnread ? nextAlerts : current;
    });
  }, []);

  const value = useMemo<AlertsContextValue>(
    () => ({
      alerts,
      unreadCount: alerts.filter((alert) => !alert.read).length,
      connectionStatus,
      permissionStatus,
      error,
      markAllAsRead,
    }),
    [alerts, connectionStatus, error, markAllAsRead, permissionStatus],
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const context = useContext(AlertsContext);

  if (!context) {
    throw new Error("useAlerts must be used within AlertsProvider");
  }

  return context;
}
