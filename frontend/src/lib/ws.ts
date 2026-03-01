/**
 * ws.ts — WebSocket client for real-time proximity alerts.
 *
 * Connects to the backend's /ws/alerts endpoint, sends periodic
 * location updates, and receives ALERT messages for nearby incidents.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ───────────────────────────────────────────────────────────

export interface AlertPayload {
  type: "ALERT";
  incident_id: string;
  location: string;
  incident_lat: number | null;
  incident_lng: number | null;
  radius_m: number;
  incident_type: string;
  severity: string;
  routing: string;
}

interface LocationUpdate {
  type: "LOCATION_UPDATE";
  lat: number;
  lng: number;
  accuracy_m: number;
}

// ── WebSocket URL builder ───────────────────────────────────────────

function getWsUrl(): string {
  const apiBase = import.meta.env.VITE_API_URL ?? "";

  if (apiBase) {
    // Absolute URL — convert http(s) to ws(s)
    return apiBase.replace(/^http/, "ws") + "/ws/alerts";
  }

  // Relative — derive from current page location (works behind proxy)
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/alerts`;
}

// ── React hook ──────────────────────────────────────────────────────

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const locationInterval = useRef<ReturnType<typeof setInterval>>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        // Start sending location updates every 30s
        sendLocation(ws);
        locationInterval.current = setInterval(() => sendLocation(ws), 30_000);
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === "ALERT") {
            setAlerts((prev) => [data as AlertPayload, ...prev]);
          }
          // ACK messages are ignored
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setConnected(false);
        cleanup();
        // Reconnect after 5s
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket construction failed — retry
      reconnectTimer.current = setTimeout(connect, 5000);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = undefined;
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = undefined;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, [cleanup]);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { alerts, connected, clearAlerts };
}

// ── Helpers ─────────────────────────────────────────────────────────

function sendLocation(ws: WebSocket) {
  if (ws.readyState !== WebSocket.OPEN) return;
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const msg: LocationUpdate = {
        type: "LOCATION_UPDATE",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
      };
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    () => {
      // Geolocation unavailable — send default (Singapore CBD)
      const msg: LocationUpdate = {
        type: "LOCATION_UPDATE",
        lat: 1.2868,
        lng: 103.8545,
        accuracy_m: 9999,
      };
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    { enableHighAccuracy: true, timeout: 10_000 },
  );
}
