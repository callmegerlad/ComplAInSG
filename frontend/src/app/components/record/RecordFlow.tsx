import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useCurrentLocation } from "@/lib/location";
import { INCIDENT_CATEGORIES } from "@/lib/incidents";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowStep = "capture" | "confirm" | "loading" | "results";

interface FinalTriageOutput {
  followup_questions: string[];
  user_next_steps: string[];
  routing_target: string;
  responder_summary: string;
  incident_type: string;
  final_severity: string;
}

interface TriageResponse {
  incident_id: string;
  final: FinalTriageOutput;
  metadata: unknown;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RecordFlowProps {
  onClose?: () => void;
}

export function RecordFlow({ onClose }: RecordFlowProps) {
  const navigate = useNavigate();
  const location = useCurrentLocation();

  const [step, setStep] = useState<FlowStep>("capture");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResponse | null>(null);
  const [followupAnswers, setFollowupAnswers] = useState<Record<number, "yes" | "no" | null>>({});
  const [additionalNote, setAdditionalNote] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isPreparingCamera, setIsPreparingCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // ── Camera helpers ──────────────────────────────────────────────────────────

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setIsPreparingCamera(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsPreparingCamera(false);
    } catch {
      setCameraError("Unable to access camera. Please grant camera permissions and try again.");
      setIsPreparingCamera(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPhotoDataUrl(dataUrl);
    stopStream();
    setStep("confirm");
  };

  // ── Effects ─────────────────────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (step === "capture") {
      void startCamera();
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [step]);

  // ── API call ────────────────────────────────────────────────────────────────

  const handleSubmitReport = async () => {
    setApiError(null);
    setStep("loading");
    try {
      const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";
      const res = await fetch(`${apiBase}/incidents/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location.label,
          description: description.trim() || "No description provided",
          image_url: photoDataUrl,
          lat: location.lat,
          lng: location.lng,
          accuracy_m: location.accuracy,
        }),
      });
      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }
      const data = (await res.json()) as TriageResponse;
      setTriageResult(data);
      const initialAnswers: Record<number, "yes" | "no" | null> = {};
      data.final.followup_questions.forEach((_, i) => {
        initialAnswers[i] = null;
      });
      setFollowupAnswers(initialAnswers);
      setStep("results");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("confirm");
    }
  };

  // ── Final submit ────────────────────────────────────────────────────────────

  const handleFinalSubmit = () => {
    if (!triageResult) return;
    onClose?.();
    navigate(`/incidents/${triageResult.incident_id}`, {
      state: {
        isNewReport: true,
        triageData: triageResult,
        photoDataUrl,
        additionalNote,
        followupAnswers,
        locationLabel: location.label,
      },
    });
  };

  // ── Severity colour helper ──────────────────────────────────────────────────

  const severityBadgeClass = (sev: string) => {
    const s = sev?.toLowerCase();
    if (s === "high" || s === "critical") return "text-danger bg-danger/10";
    if (s === "medium") return "text-warning bg-warning/10";
    return "text-success bg-success/10";
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  // STEP: capture ──────────────────────────────────────────────────────────────
  if (step === "capture") {
    return (
      <div className="relative flex h-full flex-col bg-black text-white">
        {/* Live camera feed */}
        <div className="absolute inset-0 overflow-hidden bg-zinc-950">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          {(isPreparingCamera || cameraError) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 px-6 text-center">
              <div className="max-w-xs space-y-3">
                <span className="material-symbols-outlined text-[56px] text-white/70">
                  {cameraError ? "no_photography" : "progress_activity"}
                </span>
                <p className="text-[13px] text-white/85">
                  {cameraError ?? "Requesting camera access\u2026"}
                </p>
                {cameraError && (
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="rounded-full bg-white px-4 py-2 text-[13px] font-bold text-black"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top bar */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
          <div className="rounded-full bg-black/50 px-3 py-1 text-[12px] font-bold">
            Report Incident
          </div>
          <div className="h-9 w-9" />
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-5 pb-10 pt-6">
          {location.label && location.label !== "Fetching location\u2026" && (
            <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5">
              <span className="material-symbols-outlined text-[14px] text-success">location_on</span>
              <span className="text-[12px] text-white/90">{location.label}</span>
            </div>
          )}
          <button
            type="button"
            disabled={isPreparingCamera || !!cameraError}
            onClick={capturePhoto}
            className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 backdrop-blur-sm transition-transform active:scale-90 disabled:opacity-40"
          >
            <div className="h-14 w-14 rounded-full bg-white" />
          </button>
          <p className="text-[11px] text-white/60">Tap to take a photo</p>
        </div>
      </div>
    );
  }

  // STEP: confirm ──────────────────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-surface-1">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-4 py-3">
          <button
            type="button"
            onClick={() => setStep("capture")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2"
          >
            <span className="material-symbols-outlined text-text-secondary">arrow_back</span>
          </button>
          <div className="flex-1">
            <h2 className="text-[16px] font-bold text-text-primary">Confirm Report</h2>
            <p className="text-[11px] text-text-secondary">Review details before submitting</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2"
          >
            <span className="material-symbols-outlined text-text-secondary">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* API error */}
          {apiError && (
            <div className="flex items-center gap-2 rounded-xl bg-danger/10 p-3 text-danger">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="text-[13px]">{apiError}</span>
            </div>
          )}

          {/* Photo preview */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-2 shadow-card">
            {photoDataUrl ? (
              <img src={photoDataUrl} alt="Captured photo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="material-symbols-outlined text-[48px] text-text-disabled">image</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setStep("capture")}
              className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-[12px] font-bold text-white"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Retake
            </button>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-3">
            <span className="material-symbols-outlined text-[18px] text-success">location_on</span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                Location
              </p>
              <p className="truncate text-[13px] font-medium text-text-primary">{location.label}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="rf-description"
              className="mb-1.5 block text-[12px] font-semibold text-text-primary"
            >
              Description{" "}
              <span className="font-normal text-text-secondary">(optional)</span>
            </label>
            <textarea
              id="rf-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you see — what happened, exact location, any urgent risks..."
              className="min-h-[96px] w-full rounded-xl border border-border-subtle bg-surface-2 p-3 text-[14px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
          </div>

          {/* Category */}
          <div>
            <p className="mb-2 text-[12px] font-semibold text-text-primary">
              Category{" "}
              <span className="font-normal text-text-secondary">(optional)</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {INCIDENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat.label ? null : cat.label)
                  }
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                    selectedCategory === cat.label
                      ? "border-transparent shadow-sm"
                      : "border-border-subtle bg-surface-2"
                  }`}
                  style={
                    selectedCategory === cat.label
                      ? { backgroundColor: `${cat.color}20`, borderColor: cat.color }
                      : {}
                  }
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ color: selectedCategory === cat.label ? cat.color : undefined }}
                  >
                    {cat.icon}
                  </span>
                  <span className="text-[10px] font-semibold leading-tight text-text-primary">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="mt-auto shrink-0 border-t border-border-subtle p-4 pb-6">
          <button
            type="button"
            onClick={() => void handleSubmitReport()}
            className="h-12 w-full rounded-full bg-accent-primary text-[15px] font-bold text-white shadow-primary-btn transition-transform active:scale-95"
          >
            Submit to AI for Processing
          </button>
          <p className="mt-2 text-center text-[11px] text-text-secondary">
            Our AI will analyse your photo and generate a report
          </p>
        </div>
      </div>
    );
  }

  // STEP: loading ──────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-surface-1 px-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-primary/10">
          <span className="material-symbols-outlined animate-spin text-[40px] text-accent-primary">
            progress_activity
          </span>
        </div>
        <div className="space-y-2">
          <h2 className="text-[20px] font-bold text-text-primary">Processing your report...</h2>
          <p className="text-[14px] leading-6 text-text-secondary">
            Our AI is analysing your photo and incident details.
            <br />
            Please stay on this screen.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-warning/10 px-4 py-3 text-warning">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <p className="text-[12px] font-semibold">Do not close or navigate away</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 animate-pulse rounded-full bg-accent-primary"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // STEP: results ──────────────────────────────────────────────────────────────
  if (step === "results" && triageResult) {
    const { final } = triageResult;
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-surface-1">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15 text-success">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
          <div className="flex-1">
            <h2 className="text-[16px] font-bold text-text-primary">AI Analysis Complete</h2>
            <p className="text-[11px] text-text-secondary">Review and confirm your report</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2"
          >
            <span className="material-symbols-outlined text-text-secondary">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* AI Summary */}
          <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                AI Assessment
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${severityBadgeClass(final.final_severity)}`}
              >
                {final.final_severity} Severity
              </span>
            </div>
            <p className="text-[15px] font-semibold capitalize text-text-primary">
              {final.incident_type?.replace(/_/g, " ").toLowerCase() ?? "Incident detected"}
            </p>
            {final.responder_summary && (
              <p className="mt-2 text-[13px] leading-5 text-text-secondary">
                {final.responder_summary}
              </p>
            )}
            {final.routing_target && (
              <div className="mt-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-accent-primary">send</span>
                <span className="text-[12px] font-semibold text-accent-primary">
                  Routing to: {final.routing_target.replace(/_/g, " ")}
                </span>
              </div>
            )}
          </div>

          {/* User next steps */}
          {final.user_next_steps?.length > 0 && (
            <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-card">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                Recommended Actions
              </p>
              <ul className="space-y-2">
                {final.user_next_steps.map((nextStep, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary/15 text-[10px] font-bold text-accent-primary">
                      {i + 1}
                    </span>
                    <p className="text-[13px] leading-5 text-text-primary">{nextStep}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Follow-up questions (binary YES / NO) */}
          {final.followup_questions?.length > 0 && (
            <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4 shadow-card">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                Quick Follow-up Questions
              </p>
              <div className="space-y-4">
                {final.followup_questions.map((q, i) => (
                  <div key={i}>
                    <p className="mb-2 text-[13px] font-medium leading-5 text-text-primary">{q}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFollowupAnswers((prev) => ({ ...prev, [i]: "yes" }))}
                        className={`flex-1 rounded-xl py-2 text-[13px] font-bold transition-all ${
                          followupAnswers[i] === "yes"
                            ? "bg-success text-white shadow-sm"
                            : "border border-border-subtle bg-surface-1 text-text-secondary"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setFollowupAnswers((prev) => ({ ...prev, [i]: "no" }))}
                        className={`flex-1 rounded-xl py-2 text-[13px] font-bold transition-all ${
                          followupAnswers[i] === "no"
                            ? "bg-danger text-white shadow-sm"
                            : "border border-border-subtle bg-surface-1 text-text-secondary"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional note */}
          <div>
            <label
              htmlFor="rf-note"
              className="mb-1.5 block text-[12px] font-semibold text-text-primary"
            >
              Anything else to add?
            </label>
            <textarea
              id="rf-note"
              value={additionalNote}
              onChange={(e) => setAdditionalNote(e.target.value)}
              placeholder="Any extra details for responders..."
              className="min-h-[80px] w-full rounded-xl border border-border-subtle bg-surface-2 p-3 text-[14px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
          </div>
        </div>

        {/* Final submit */}
        <div className="mt-auto shrink-0 border-t border-border-subtle p-4 pb-6">
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="h-12 w-full rounded-full bg-accent-primary text-[15px] font-bold text-white shadow-primary-btn transition-transform active:scale-95"
          >
            Submit Report
          </button>
          <p className="mt-2 text-center text-[11px] text-text-secondary">
            Your report will be sent to the relevant authorities
          </p>
        </div>
      </div>
    );
  }

  return null;
}
