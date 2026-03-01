import { useEffect, useRef, useState } from "react";
import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/drawer";
import { CategoryCard, CategoryType } from "@/app/components/home/CategoryCard";

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

export function RecordFlow({ initialCategory = null }: RecordFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialCategory ? 2 : 1);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(initialCategory);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingCamera, setIsPreparingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [recordingDurationSeconds, setRecordingDurationSeconds] = useState(0);

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

  useEffect(() => {
    setSelectedCategory(initialCategory);
    setStep(initialCategory ? 2 : 1);
    setDescription("");
    setIsAnonymous(true);
    setCameraError(null);
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

      <div className="mt-auto pt-4">
        <DrawerClose asChild>
          <button className="h-12 w-full rounded-full bg-accent-primary text-[15px] font-bold text-white shadow-primary-btn transition-transform active:scale-95">
            Submit Report
          </button>
        </DrawerClose>
        <p className="mt-2 text-center text-[11px] text-text-secondary">
          Will alert people within 250m and notify SPF
        </p>
      </div>
    </div>
  );
}
