/**
 * api.ts — Typed HTTP client for the ComplAInSG backend.
 *
 * In development the Vite proxy rewrites `/incidents/*` and `/health`
 * to the backend, so API_BASE is empty (relative paths).
 * In production set VITE_API_URL at build time to the backend origin
 * (e.g. "http://localhost:8000").
 */

// ── Base URL ────────────────────────────────────────────────────────
const API_BASE: string = import.meta.env.VITE_API_URL ?? "";

// ── Backend response types (mirror pydantic schemas) ────────────────

export type IncidentType =
  | "VIOLENCE_FIGHT"
  | "FIRE_SMOKE"
  | "MEDICAL"
  | "ROAD_HAZARD"
  | "TRANSIT_DISRUPTION"
  | "SUSPICIOUS_ACTIVITY"
  | "OTHER";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RoutingTarget =
  | "CALL_999"
  | "CALL_995"
  | "LTA"
  | "TOWN_COUNCIL"
  | "PUBLIC_ALERT_ONLY"
  | "NEEDS_USER_CONFIRMATION";

export interface FinalTriageOutput {
  incident_type: IncidentType;
  final_severity: Severity;
  confidence: number;
  routing_target: RoutingTarget;
  user_next_steps: string[];
  followup_questions: string[];
  responder_summary: string;
  applied_overrides: string[];
}

export interface MetadataOutput {
  capture_timestamp: string | null;
  gps_coordinates: { lat: number; lng: number; alt_m: number | null } | null;
  device_make: string | null;
  device_model: string | null;
  location_matches_report: boolean | null;
  timestamp_plausibility: "PLAUSIBLE" | "SUSPICIOUS" | "UNKNOWN";
  flags: string[];
  metadata_summary: string;
}

export interface TriageResponse {
  incident_id: string;
  final: FinalTriageOutput;
  metadata: MetadataOutput | null;
}

// ── Request types ───────────────────────────────────────────────────

export interface TriageRequest {
  location: string;
  description: string;
  image_url?: string | null;
  lat?: number | null;
  lng?: number | null;
  accuracy_m?: number | null;
}

// ── API functions ───────────────────────────────────────────────────

export async function triageIncident(
  req: TriageRequest,
): Promise<TriageResponse> {
  const res = await fetch(`${API_BASE}/incidents/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Triage failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<TriageResponse>;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Extract a single JPEG frame from a video blob URL.
 * Returns a data-URL suitable for the vision agent.
 */
export function extractFrameFromVideo(
  videoBlobUrl: string,
  seekSeconds = 0.5,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoBlobUrl;

    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context unavailable"));
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      } finally {
        video.removeEventListener("seeked", onSeeked);
        video.src = "";
      }
    };

    video.addEventListener("seeked", onSeeked);

    video.addEventListener(
      "loadeddata",
      () => {
        video.currentTime = Math.min(seekSeconds, video.duration || 0);
      },
      { once: true },
    );

    video.addEventListener(
      "error",
      () => {
        reject(new Error("Failed to load video for frame extraction"));
      },
      { once: true },
    );
  });
}

/**
 * Map a backend severity string to the frontend display format.
 */
export function formatSeverity(sev: Severity): "High" | "Medium" | "Low" {
  switch (sev) {
    case "CRITICAL":
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
    default:
      return "Low";
  }
}

/**
 * Map a backend incident_type to a human label.
 */
export function formatIncidentType(t: IncidentType): string {
  const map: Record<IncidentType, string> = {
    VIOLENCE_FIGHT: "Fight / Assault",
    FIRE_SMOKE: "Fire / Hazard",
    MEDICAL: "Medical Emergency",
    ROAD_HAZARD: "Road Hazard",
    TRANSIT_DISRUPTION: "Transit Disruption",
    SUSPICIOUS_ACTIVITY: "Suspicious Activity",
    OTHER: "Other",
  };
  return map[t] ?? t;
}

/**
 * Map routing_target to a user-friendly label.
 */
export function formatRouting(r: RoutingTarget): string {
  const map: Record<RoutingTarget, string> = {
    CALL_999: "Call 999 (Police)",
    CALL_995: "Call 995 (SCDF)",
    LTA: "LTA Notified",
    TOWN_COUNCIL: "Town Council",
    PUBLIC_ALERT_ONLY: "Public Alert Only",
    NEEDS_USER_CONFIRMATION: "Needs Confirmation",
  };
  return map[r] ?? r;
}
