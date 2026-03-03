import { getApiBaseUrl } from "@/lib/auth";

export type AlertEventType = "received" | "open" | "view_incident" | "acknowledged" | "responding";

type AlertEventRequest = {
  incident_id: string;
  event_type: AlertEventType;
};

type AlertEventResponse = {
  success: boolean;
  deduplicated: boolean;
};

export type AlertFeedItem = {
  incident_id: string;
  location: string;
  incident_type: string;
  severity: string;
  routing: string;
  distance_m: number;
  created_at?: string | null;
  read: boolean;
};

type AlertsFeedResponse = {
  alerts: AlertFeedItem[];
};

const API_BASE_URL = getApiBaseUrl();

export async function logAlertEvent(payload: AlertEventRequest, accessToken: string): Promise<AlertEventResponse> {
  const response = await fetch(`${API_BASE_URL}/alerts/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "Failed to log alert event.";
    throw new Error(detail);
  }

  return data as AlertEventResponse;
}

export async function fetchAlertsFeed(
  params: { lat: number; lng: number; radius_m?: number; limit?: number },
  accessToken: string,
): Promise<AlertFeedItem[]> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radius_m: String(params.radius_m ?? 5000),
    limit: String(params.limit ?? 30),
  });

  const response = await fetch(`${API_BASE_URL}/alerts/feed?${query.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "Failed to fetch alerts feed.";
    throw new Error(detail);
  }

  return (data as AlertsFeedResponse).alerts ?? [];
}
