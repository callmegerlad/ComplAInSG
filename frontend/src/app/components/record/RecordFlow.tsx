import { useEffect, useRef, useState } from "react";
import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/drawer";
import { CategoryCard, CategoryType } from "@/app/components/home/CategoryCard";
import {
  triageIncident,
  extractFrameFromVideo,
  formatIncidentType,
  formatRouting,
  type TriageResponse,
} from "@/lib/api";
import { getCurrentPosition } from "@/lib/geo";

const categories: { label: CategoryType; icon: string; colorVar: string }[] = [
  { label: "Cleanliness", icon: "delete", colorVar: "var(--accent-primary)" },
  { label: "Maintenance", icon: "build", colorVar: "var(--accent-primary)" },
  { label: "Pests", icon: "pest_control", colorVar: "var(--accent-primary)" },
  { label: "Roads & Drains", icon: "add_road", colorVar: "var(--accent-primary)" },
  { label: "Trees & Plants", icon: "eco", colorVar: "var(--accent-primary)" },
];

type RecordFlowProps = {
  initialCategory?: CategoryType | null;
};

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  const mimeTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
  ];

  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? "";
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

// Severity colour mapping for the results screen
function severityColor(sev: string): string {
  switch (sev) {
    case "CRITICAL":
      return "#dc2626";
    case "HIGH":
      return "#ef4444";
    case "MEDIUM":
      return "#f59e0b";
    default:
      return "#22c55e";
  }
}

export function RecordFlow({ initialCategory = null }: RecordFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialCategory ? 2 : 1);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(initialCategory);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingCamera, setIsPreparingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [recordingDurationSeconds, setRecordingDurationSeconds] = useState(0);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResponse | null>(null);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);

  function stopDurationTimer() {
    if (recordingIntervalRef.current !== null) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }

  function stopStream() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  }

  function resetRecordingState() {
    setIsRecording(false);
    setRecordingDurationSeconds(0);
    stopDurationTimer();

    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
  }

  async function startCamera() {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      setCameraError("Camera recording is not supported in this browser.");
      return;
    }

    setIsPreparingCamera(true);
    setCameraError(null);

    try {
      stopStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: true,
      });

      mediaStreamRef.current = stream;

      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play();
      }
    } catch {
      setCameraError("We couldn't access your camera or microphone. Check browser permissions and try again.");
    } finally {
      setIsPreparingCamera(false);
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
    setIsRecording(false);
    stopDurationTimer();
  }

  function startRecording() {
    const stream = mediaStreamRef.current;

    if (!stream) {
      setCameraError("Camera is not ready yet. Please wait or retry.");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setCameraError("Video recording is not supported in this browser.");
      return;
    }

    const mimeType = getSupportedMimeType();

    try {
      recordedChunksRef.current = [];
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blobType = mimeType || "video/webm";
        const blob = new Blob(recordedChunksRef.current, { type: blobType });

        if (blob.size === 0) {
          setCameraError("Recording failed. Please try again.");
          return;
        }

        const nextUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }

          return nextUrl;
        });
        stopStream();
        setStep(3);
      };

      recorder.onerror = () => {
        setCameraError("Recording failed unexpectedly. Please try again.");
        setIsRecording(false);
        stopDurationTimer();
      };

      recorder.start(250);
      setCameraError(null);
      setIsRecording(true);
      setRecordingDurationSeconds(0);
      stopDurationTimer();
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingDurationSeconds((current) => current + 1);
      }, 1000);
    } catch {
      setCameraError("Unable to start recording on this device.");
    }
  }

  // ── Submit report to backend ──────────────────────────────────────
  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Get geolocation
      const geo = await getCurrentPosition();

      // 2. Extract a frame from the video (if available)
      let imageDataUrl: string | null = null;
      if (recordedVideoUrl) {
        try {
          imageDataUrl = await extractFrameFromVideo(recordedVideoUrl);
        } catch {
          // Non-fatal - continue without image
          console.warn("Could not extract frame from video");
        }
      }

      // 3. Build the description with category context
      const fullDescription = selectedCategory
        ? `[${selectedCategory}] ${description || "No additional details provided."}`
        : description || "No description provided.";

      // 4. Call the triage API
      const result = await triageIncident({
        location: "Singapore",
        description: fullDescription,
        image_url: imageDataUrl,
        lat: geo.lat,
        lng: geo.lng,
        accuracy_m: geo.accuracy_m,
      });

      setTriageResult(result);
      setStep(4);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Submission failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    setSelectedCategory(initialCategory);
    setStep(initialCategory ? 2 : 1);
    setDescription("");
    setIsAnonymous(true);
    setCameraError(null);
    setSubmitError(null);
    setTriageResult(null);
    resetRecordingState();
    stopStream();
  }, [initialCategory]);

  useEffect(() => {
    if (step === 2) {
      void startCamera();
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      stopStream();
    }
  }, [step]);

  useEffect(() => {
    return () => {
      stopDurationTimer();
      stopStream();

      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  // ── Step 1: Category selection ────────────────────────────────────
  if (step === 1) {
    return (
      <div className="flex h-full flex-col">
        <DrawerHeader>
          <DrawerTitle className="text-center">What&apos;s happening?</DrawerTitle>
          <DrawerDescription className="text-center">
            Select a category to report
          </DrawerDescription>
        </DrawerHeader>

        <div className="grid grid-cols-2 gap-3 overflow-y-auto px-4 py-4">
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

        <div className="mt-auto flex justify-center p-4 pb-8">
          <button className="text-[13px] text-text-secondary underline">Other</button>
        </div>
      </div>
    );
  }

  // ── Step 2: Camera + recording ────────────────────────────────────
  if (step === 2) {
    return (
      <div className="relative flex h-full flex-col bg-black text-white">
        <div className="absolute inset-0 overflow-hidden bg-zinc-950">
          <video
            ref={liveVideoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
          {(isPreparingCamera || cameraError) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-6 text-center">
              <div className="max-w-xs space-y-3">
                <span className="material-symbols-outlined text-[56px] text-white/70">
                  {cameraError ? "videocam_off" : "progress_activity"}
                </span>
                <p className="text-[13px] text-white/85">
                  {cameraError ?? "Requesting camera and microphone access..."}
                </p>
                {cameraError && (
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="rounded-full bg-white px-4 py-2 text-[13px] font-bold text-black"
                  >
                    Retry camera
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          <button
            type="button"
            onClick={() => {
              stopRecording();
              setStep(1);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="rounded-full bg-black/40 px-3 py-1 text-[12px] font-bold">
            {selectedCategory}
          </div>
          <div className="rounded-full bg-black/40 px-3 py-1 text-[12px] font-bold">
            {isRecording ? formatDuration(recordingDurationSeconds) : "Ready"}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-4 rounded-t-2xl bg-black/80 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-white/80">
            <span className="material-symbols-outlined text-[16px] text-success">
              location_on
            </span>
            <span className="text-[12px]">Near Marina Bay Sands</span>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                resetRecordingState();
                void startCamera();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              disabled={isPreparingCamera || !!cameraError}
              className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-white transition-all ${
                isRecording ? "scale-110 bg-danger" : "bg-danger"
              }`}
            >
              {isRecording ? (
                <div className="h-6 w-6 rounded-sm bg-white" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-white" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAnonymous((current) => !current);
              }}
              className="flex h-10 min-w-10 items-center justify-center rounded-full bg-white/10 px-3"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isAnonymous ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>

          <p className="text-center text-[10px] text-white/60">
            {isRecording
              ? "Recording in progress. Tap again to stop."
              : "Tap to start recording video and audio evidence."}
          </p>
        </div>
      </div>
    );
  }

  // ── Step 4: Triage results ────────────────────────────────────────
  if (step === 4 && triageResult) {
    const { final: f } = triageResult;
    const color = severityColor(f.final_severity);

    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-surface-1 p-4">
        <DrawerHeader className="p-0 pb-2">
          <div className="mb-4 mx-auto h-1 w-12 rounded-full bg-border-subtle" />
          <DrawerTitle>Triage Result</DrawerTitle>
          <DrawerDescription>
            AI analysis complete. Review the assessment below.
          </DrawerDescription>
        </DrawerHeader>

        {/* Severity banner */}
        <div
          className="flex items-center gap-3 rounded-xl p-4 text-white"
          style={{ backgroundColor: color }}
        >
          <span className="material-symbols-outlined text-[28px]">
            {f.final_severity === "CRITICAL" || f.final_severity === "HIGH"
              ? "warning"
              : f.final_severity === "MEDIUM"
                ? "info"
                : "check_circle"}
          </span>
          <div>
            <p className="text-[14px] font-bold">
              {f.final_severity} Severity
            </p>
            <p className="text-[12px] opacity-90">
              {formatIncidentType(f.incident_type)} &middot; {Math.round(f.confidence * 100)}% confident
            </p>
          </div>
        </div>

        {/* Routing */}
        <div className="rounded-xl border border-border-subtle bg-surface-2 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[18px] text-accent-primary">
              call
            </span>
            <p className="text-[13px] font-bold text-text-primary">Routing</p>
          </div>
          <p className="text-[14px] font-bold" style={{ color }}>
            {formatRouting(f.routing_target)}
          </p>
        </div>

        {/* Responder summary */}
        <div className="rounded-xl border border-border-subtle bg-surface-2 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[18px] text-accent-primary">
              description
            </span>
            <p className="text-[13px] font-bold text-text-primary">Summary</p>
          </div>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {f.responder_summary}
          </p>
        </div>

        {/* Next steps */}
        {f.user_next_steps.length > 0 && (
          <div className="rounded-xl border border-border-subtle bg-surface-2 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-accent-primary">
                checklist
              </span>
              <p className="text-[13px] font-bold text-text-primary">
                Recommended Actions
              </p>
            </div>
            <ul className="space-y-2">
              {f.user_next_steps.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[13px] text-text-secondary"
                >
                  <span className="mt-0.5 text-accent-primary font-bold">
                    {i + 1}.
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up questions */}
        {f.followup_questions.length > 0 && (
          <div className="rounded-xl border border-border-subtle bg-surface-2 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-accent-primary">
                help
              </span>
              <p className="text-[13px] font-bold text-text-primary">
                Follow-up Questions
              </p>
            </div>
            <ul className="space-y-2">
              {f.followup_questions.map((q, i) => (
                <li
                  key={i}
                  className="text-[13px] text-text-secondary flex items-start gap-2"
                >
                  <span className="text-accent-primary">&#8226;</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata */}
        {triageResult.metadata && (
          <div className="rounded-xl border border-border-subtle bg-surface-2 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-accent-primary">
                image
              </span>
              <p className="text-[13px] font-bold text-text-primary">
                Image Metadata
              </p>
            </div>
            <p className="text-[13px] text-text-secondary">
              {triageResult.metadata.metadata_summary}
            </p>
          </div>
        )}

        {/* Done button */}
        <div className="mt-auto pt-4">
          <DrawerClose asChild>
            <button className="h-12 w-full rounded-full bg-accent-primary text-[15px] font-bold text-white shadow-primary-btn transition-transform active:scale-95">
              Done
            </button>
          </DrawerClose>
        </div>
      </div>
    );
  }

  // ── Step 3: Review + submit ───────────────────────────────────────
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-surface-1 p-4">
      <DrawerHeader className="p-0 pb-2">
        <div className="mb-4 mx-auto h-1 w-12 rounded-full bg-border-subtle" />
        <DrawerTitle>Review Report</DrawerTitle>
        <DrawerDescription>
          Check the recording and add supporting details before submission.
        </DrawerDescription>
      </DrawerHeader>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-2">
        {recordedVideoUrl ? (
          <video
            src={recordedVideoUrl}
            className="h-full w-full bg-black object-cover"
            controls
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="material-symbols-outlined text-[48px] text-accent-primary">
              play_circle
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-success-subtle p-3 text-success">
        <span className="material-symbols-outlined text-[18px]">check_circle</span>
        <span className="text-[13px] font-bold">Recording saved and ready for review</span>
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-2 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold text-text-primary">{selectedCategory}</p>
            <p className="mt-1 text-[12px] text-text-secondary">
              {recordingDurationSeconds > 0
                ? `Recorded video length: ${formatDuration(recordingDurationSeconds)}`
                : "Recorded evidence attached"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetRecordingState();
              setStep(2);
            }}
            className="rounded-full border border-border-subtle px-3 py-1.5 text-[12px] font-bold text-text-primary"
          >
            Retake
          </button>
        </div>
      </div>

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className="min-h-[100px] w-full rounded-xl border border-border-subtle bg-surface-2 p-3 text-[14px] placeholder:text-text-disabled focus:outline-accent-primary"
        placeholder="Add context: what happened, exact location, direction of travel, and any urgent risks..."
      />

      <button
        type="button"
        onClick={() => setIsAnonymous((current) => !current)}
        className="flex items-center justify-between py-2"
      >
        <span className="text-[14px] font-medium text-text-primary">Post anonymously</span>
        <div
          className={`relative h-6 w-10 rounded-full transition-colors ${
            isAnonymous ? "bg-accent-primary" : "bg-border-subtle"
          }`}
        >
          <div
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              isAnonymous ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </div>
      </button>

      {/* Error message */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-xl bg-danger/10 p-3 text-danger">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span className="text-[13px]">{submitError}</span>
        </div>
      )}

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-12 w-full rounded-full bg-accent-primary text-[15px] font-bold text-white shadow-primary-btn transition-transform active:scale-95 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[20px]">
                progress_activity
              </span>
              Analysing...
            </>
          ) : (
            "Submit Report"
          )}
        </button>
        <p className="mt-2 text-center text-[11px] text-text-secondary">
          {isSubmitting
            ? "AI is triaging your report. This may take up to 30 seconds."
            : "Will alert people within 250m and notify SPF"}
        </p>
      </div>
    </div>
  );
}
