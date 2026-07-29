import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Upload,
  ScanFace,
  X,
  RefreshCw,
  CheckCircle2,
  Download,
  ArrowLeft,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Droplets,
  Activity,
  Sun,
  Leaf,
  FlaskConical,
  Calendar,
  Heart,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Clock,
  Star,
  Zap,
  Moon,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useScan, ScanReport, SkinConcern } from "@/lib/scan-context";
import { toast } from "sonner";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "AI Face Scan & Skin Report — 360° Skincare" },
      {
        name: "description",
        content:
          "Run an AI face scan to detect skin type, 24 skin concerns, get personalized routines, ingredient guidance and a full skin health report.",
      },
    ],
  }),
  component: ScanPage,
});

type StepId = "select" | "camera" | "upload" | "analyzing" | "report";
type ReportTab = "overview" | "concerns" | "routine" | "ingredients" | "lifestyle" | "weekly";

const ANALYSIS_STEPS = [
  "Detecting face boundaries & landmarks…",
  "Analysing skin type & tone…",
  "Measuring hydration & moisture levels…",
  "Scanning for acne, pimples & blackheads…",
  "Detecting pigmentation & dark spots…",
  "Evaluating wrinkles, fine lines & texture…",
  "Assessing pore size & sebum production…",
  "Checking for redness, irritation & sensitivity…",
  "Analysing brightness, smoothness & eye area…",
  "Building personalized routine recommendations…",
  "Calculating overall skin health score…",
  "Generating comprehensive skin report…",
];

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-500";
  if (score >= 55) return "text-amber-500";
  return "text-rose-500";
}

function scoreRingColor(score: number) {
  if (score >= 75) return "#10b981";
  if (score >= 55) return "#f59e0b";
  return "#f43f5e";
}

function severityBadgeClass(severity: SkinConcern["severity"]) {
  switch (severity) {
    case "High": return "bg-rose-500/15 text-rose-600 border-rose-300/40";
    case "Moderate": return "bg-amber-500/15 text-amber-600 border-amber-300/40";
    case "Low": return "bg-yellow-400/15 text-yellow-700 border-yellow-300/40";
    default: return "bg-emerald-500/15 text-emerald-600 border-emerald-300/40";
  }
}

function severityBarClass(severity: SkinConcern["severity"]) {
  switch (severity) {
    case "High": return "bg-rose-500";
    case "Moderate": return "bg-amber-500";
    case "Low": return "bg-yellow-400";
    default: return "bg-emerald-500";
  }
}

// ─── CIRCULAR SCORE RING ─────────────────────────────────────────────────────

function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const color = scoreRingColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ display: "block" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: "stroke-dasharray 1.2s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl leading-none" style={{ color }}>{score}</span>
          <span className="text-2xs text-muted-foreground mt-0.5">/ 100</span>
        </div>
      </div>
      {label && <p className="text-xs font-semibold text-foreground text-center">{label}</p>}
      {sublabel && <p className="text-2xs text-muted-foreground text-center">{sublabel}</p>}
    </div>
  );
}

// ─── STEP 1: METHOD SELECTION ─────────────────────────────────────────────────

function MethodSelectStep({ onSelect }: { onSelect: (m: "camera" | "upload") => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <button
          id="scan-method-camera"
          onClick={() => onSelect("camera")}
          className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-8 text-left transition-all hover:border-primary/60 hover:shadow-lift hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all group-hover:bg-primary group-hover:text-primary-foreground">
            <Camera className="size-6" />
          </div>
          <h3 className="font-display text-xl">Scan Face</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Open your camera for a live face scan with guided alignment and auto-capture.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["Live preview", "Auto-detect", "Instant"].map((t) => (
              <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-2xs font-medium text-muted-foreground">{t}</span>
            ))}
          </div>
        </button>

        <button
          id="scan-method-upload"
          onClick={() => onSelect("upload")}
          className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-8 text-left transition-all hover:border-sage/60 hover:shadow-lift hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-primary ring-1 ring-accent/30 transition-all group-hover:bg-accent group-hover:text-accent-foreground">
            <Upload className="size-6" />
          </div>
          <h3 className="font-display text-xl">Upload Image</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Select a clear, well-lit front-facing photo from your gallery for AI skin analysis.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["JPG", "PNG", "HEIC"].map((t) => (
              <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-2xs font-medium text-muted-foreground">{t}</span>
            ))}
          </div>
        </button>
      </div>

      <div className="surface p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ScanFace className="size-4 text-primary" /> Tips for best results
        </h3>
        <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          {[
            "Use even, natural lighting — avoid harsh shadows or flash.",
            "Remove makeup before scanning for accurate results.",
            "Ensure your full face is visible, hair tied back.",
            "Look straight ahead at the camera — no tilting.",
            "Take the photo in a clean, bright environment.",
            "Use a high-resolution, in-focus front-facing photo.",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── STEP 2A: CAMERA STEP ─────────────────────────────────────────────────────

function CameraStep({ onCapture, onBack }: { onCapture: (dataUrl: string) => void; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<"requesting" | "active" | "denied" | "error">("requesting");
  const [countdown, setCountdown] = useState<number | null>(null);

  const startCamera = useCallback(async () => {
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraState("active");
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setCameraState("denied");
      } else {
        setCameraState("error");
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, [startCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || cameraState !== "active") return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCapture(dataUrl);
  };

  const startCountdown = () => {
    let c = 3;
    setCountdown(c);
    const interval = setInterval(() => {
      c--;
      if (c <= 0) { clearInterval(interval); setCountdown(null); capturePhoto(); }
      else setCountdown(c);
    }, 1000);
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </button>
      <div className="surface overflow-hidden p-0">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
          {cameraState === "active" && (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-primary/80 rounded-[50%] animate-pulse" style={{ width: "55%", height: "75%" }} />
                {["top-1/4 left-1/4 border-t-2 border-l-2 rounded-tl-xl w-6 h-6", "top-1/4 right-1/4 border-t-2 border-r-2 rounded-tr-xl w-6 h-6", "bottom-1/4 left-1/4 border-b-2 border-l-2 rounded-bl-xl w-6 h-6", "bottom-1/4 right-1/4 border-b-2 border-r-2 rounded-br-xl w-6 h-6"].map((cls, i) => (
                  <div key={i} className={`absolute border-primary ${cls}`} />
                ))}
              </div>
              <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                <div className="rounded-full bg-black/50 px-4 py-2 text-xs text-white backdrop-blur-sm">
                  Align your face within the oval frame
                </div>
              </div>
            </>
          )}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <div className="font-display text-8xl text-white animate-bounce">{countdown}</div>
            </div>
          )}
          {cameraState === "denied" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/90 p-8 text-center">
              <AlertCircle className="size-12 text-destructive" />
              <div>
                <p className="font-semibold text-foreground">Camera access denied</p>
                <p className="mt-2 text-sm text-muted-foreground">Please allow camera access in your browser settings, then retry.</p>
              </div>
              <Button onClick={startCamera} variant="outline" className="mt-2"><RotateCcw className="mr-2 size-4" /> Retry</Button>
            </div>
          )}
          {cameraState === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/90 p-8 text-center">
              <AlertCircle className="size-12 text-warning" />
              <div>
                <p className="font-semibold">Camera unavailable</p>
                <p className="mt-2 text-sm text-muted-foreground">No camera found or another app is using it.</p>
              </div>
              <Button onClick={startCamera} variant="outline"><RotateCcw className="mr-2 size-4" /> Retry</Button>
            </div>
          )}
          {cameraState === "requesting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80">
              <RefreshCw className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Requesting camera access…</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5">
          <Button id="camera-capture-btn" className="flex-1" onClick={startCountdown} disabled={cameraState !== "active" || countdown !== null}>
            <Camera className="mr-2 size-4" />
            {countdown !== null ? `Capturing in ${countdown}…` : "Capture Now"}
          </Button>
          <Button variant="outline" onClick={onBack}><X className="size-4" /></Button>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        No images or video are stored on our servers. All analysis happens locally in your browser.
      </p>
    </div>
  );
}

// ─── STEP 2B: UPLOAD STEP ─────────────────────────────────────────────────────

function UploadStep({ onAnalyze, onBack }: { onAnalyze: (dataUrl: string) => void; onBack: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];

  const handleFile = (file: File) => {
    if (!ACCEPTED.includes(file.type.toLowerCase())) {
      toast.error("Unsupported file type. Please upload JPG, PNG or HEIC.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </button>
      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex min-h-64 cursor-pointer flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed transition-all ${dragOver ? "border-primary bg-primary/5" : "border-border bg-card/40 hover:border-primary/50 hover:bg-muted/30"}`}
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Upload className="size-7" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Drop your photo here</p>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
            <p className="mt-2 text-xs text-muted-foreground">JPG, PNG, HEIC · Best results with a clear, well-lit front-facing photo</p>
          </div>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="relative aspect-[4/3]">
            <img src={preview} alt="Selected" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-primary/60 rounded-[50%]" style={{ width: "55%", height: "78%" }} />
            </div>
          </div>
          <div className="flex gap-3 p-5">
            <Button id="analyze-image-btn" className="flex-1" onClick={() => onAnalyze(preview)}>
              <Sparkles className="mr-2 size-4" /> Analyse This Image
            </Button>
            <Button variant="outline" onClick={() => setPreview(null)}>
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </div>
      )}
      <input ref={inputRef} id="file-upload-input" type="file" accept="image/jpeg,image/jpg,image/png,image/heic,image/heif" className="hidden" onChange={onFileInput} />
    </div>
  );
}

// ─── STEP 3: ANALYZING ────────────────────────────────────────────────────────

function AnalyzingStep({ imageDataUrl }: { imageDataUrl: string }) {
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const total = 4200;
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + (100 / (total / 80));
        if (next >= 100) { clearInterval(interval); return 100; }
        return next;
      });
    }, 80);
    const stepInterval = setInterval(() => {
      setStepIdx((i) => (i < ANALYSIS_STEPS.length - 1 ? i + 1 : i));
    }, total / ANALYSIS_STEPS.length);
    return () => { clearInterval(interval); clearInterval(stepInterval); };
  }, []);

  return (
    <div className="surface relative overflow-hidden p-10">
      <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-primary/10 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-accent/10 blur-3xl animate-pulse" />
      <div className="relative mx-auto max-w-sm text-center space-y-8">
        <div className="relative mx-auto size-44 overflow-hidden rounded-full ring-4 ring-primary/30">
          <img src={imageDataUrl} alt="Analysing" className="size-full object-cover" />
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" style={{ top: `${progress}%`, boxShadow: "0 0 12px 2px hsl(var(--primary))" }} />
          <div className="absolute inset-0 bg-primary/10" />
        </div>
        <div className="space-y-3">
          <h2 className="font-display text-xl">AI Analysis in Progress</h2>
          <p className="text-sm text-muted-foreground min-h-5 transition-all">{ANALYSIS_STEPS[stepIdx]}</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Analysing {ANALYSIS_STEPS.length} skin markers…</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {["Skin Type", "Tone", "Acne", "Hydration", "Pores", "Pigmentation", "Texture"].map((m) => (
            <span key={m} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground animate-pulse">{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── POOR QUALITY WARNING ─────────────────────────────────────────────────────

function PoorQualityBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4">
      <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-700">Image Quality Notice</p>
        <p className="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
          The uploaded image appears to be low resolution or poorly lit. For the most accurate results, please upload a clear, well-lit, front-facing photo. Some confidence scores may be lower than usual.
        </p>
      </div>
      <button onClick={onRetry} className="text-xs font-semibold text-amber-700 hover:underline shrink-0">Retry</button>
    </div>
  );
}

// ─── CONCERN CARD ─────────────────────────────────────────────────────────────

function ConcernCard({ concern }: { concern: SkinConcern }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 overflow-hidden transition-all">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-xl shrink-0">{concern.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{concern.label}</span>
            <div className="flex items-center gap-2 shrink-0">
              {concern.detectable ? (
                <span className={`rounded-full border px-2 py-0.5 text-2xs font-semibold ${severityBadgeClass(concern.severity)}`}>
                  {concern.severity}
                </span>
              ) : (
                <span className="rounded-full border border-muted-foreground/20 bg-muted/40 px-2 py-0.5 text-2xs text-muted-foreground">
                  Uncertain
                </span>
              )}
              {expanded ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${severityBarClass(concern.severity)}`}
                style={{ width: concern.detectable ? `${concern.level}%` : "0%" }}
              />
            </div>
            <span className="text-2xs text-muted-foreground shrink-0 w-12 text-right">
              {concern.detectable ? `${concern.confidence}% conf.` : "—"}
            </span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40">
          {concern.detectable ? (
            <p className="text-xs text-muted-foreground leading-relaxed">{concern.description}</p>
          ) : (
            <div className="flex items-start gap-2">
              <Info className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Not confidently detectable from this image. Upload a clearer, well-lit, front-facing photo for a more accurate assessment of this marker.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TAB OVERVIEW ─────────────────────────────────────────────────────────────

function OverviewTab({ report }: { report: ScanReport }) {
  const topConcerns = [...report.concerns]
    .filter((c) => c.detectable && c.severity !== "None")
    .sort((a, b) => b.level - a.level)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Skin type banner */}
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-4">
        <span className="text-4xl">{report.skinTypeEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-xl">{report.skinType} Skin</h3>
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {report.skinTypeConfidence}% confidence
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{report.skinTypeDescription}</p>
          <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
            <span>Tone: <strong className="text-foreground">{report.skinTone}</strong></span>
            <span>Undertone: <strong className="text-foreground">{report.undertone}</strong></span>
          </div>
        </div>
      </div>

      {/* Scores grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Skin Health", sublabel: "Overall", score: report.healthScore },
          { label: "Hydration", sublabel: "Moisture Level", score: report.hydrationScore },
          { label: "Brightness", sublabel: "Radiance", score: report.skinBrightness },
          { label: "Smoothness", sublabel: "Texture", score: report.skinSmoothness },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/60 bg-card/50 p-4 flex flex-col items-center justify-center gap-2">
            <ScoreRing score={item.score} size={80} strokeWidth={6} />
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">{item.label}</p>
              <p className="text-2xs text-muted-foreground">{item.sublabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top concerns */}
      {topConcerns.length > 0 && (
        <div className="rounded-3xl border border-border/60 bg-card/50 p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Key Concerns Detected
          </h3>
          <div className="flex flex-wrap gap-2">
            {topConcerns.map((c) => (
              <span
                key={c.label}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${severityBadgeClass(c.severity)}`}
              >
                <span>{c.emoji}</span> {c.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB CONCERNS ─────────────────────────────────────────────────────────────

function ConcernsTab({ report }: { report: ScanReport }) {
  const sorted = [...report.concerns].sort((a, b) => {
    const order = { High: 0, Moderate: 1, Low: 2, None: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground px-1">
        Click any concern to expand its detailed description. Confidence % reflects how reliably the AI detected this marker from your image.
      </p>
      {sorted.map((c) => (
        <ConcernCard key={c.label} concern={c} />
      ))}
    </div>
  );
}

// ─── TAB ROUTINE ──────────────────────────────────────────────────────────────

function RoutineTab({ report }: { report: ScanReport }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {/* AM Routine */}
      <div className="rounded-3xl border border-amber-300/30 bg-amber-50/30 dark:bg-amber-500/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sun className="size-5 text-amber-500" />
          <h3 className="font-display text-lg">Morning Routine</h3>
        </div>
        <div className="space-y-3">
          {report.morningRoutine.map((s) => (
            <div key={s.step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-2xs font-bold text-white mt-0.5">
                {s.step}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{s.product}</p>
                  {s.timing && (
                    <span className="flex items-center gap-1 text-2xs text-muted-foreground">
                      <Clock className="size-3" /> {s.timing}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.instruction}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PM Routine */}
      <div className="rounded-3xl border border-indigo-300/30 bg-indigo-50/30 dark:bg-indigo-500/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Moon className="size-5 text-indigo-500" />
          <h3 className="font-display text-lg">Night Routine</h3>
        </div>
        <div className="space-y-3">
          {report.nightRoutine.map((s) => (
            <div key={s.step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-2xs font-bold text-white mt-0.5">
                {s.step}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{s.product}</p>
                  {s.timing && (
                    <span className="flex items-center gap-1 text-2xs text-muted-foreground">
                      <Clock className="size-3" /> {s.timing}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.instruction}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Products */}
      <div className="sm:col-span-2 rounded-3xl border border-border/60 bg-card/50 p-5 space-y-4">
        <h3 className="font-display text-lg flex items-center gap-2">
          <Star className="size-5 text-primary" /> Recommended Products
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.recommendedProducts.map((p, i) => (
            <div key={`${p.name}-${i}`} className="rounded-2xl border border-border/50 bg-background/60 p-4 flex flex-col h-full">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{p.category}</span>
                {p.confidenceMatch && (
                  <span className={`shrink-0 text-2xs font-bold px-2 py-0.5 rounded-full ${p.confidenceMatch >= 80 ? 'bg-emerald-500/15 text-emerald-600' : p.confidenceMatch >= 70 ? 'bg-amber-500/15 text-amber-600' : 'bg-rose-500/15 text-rose-600'}`}>
                    {p.confidenceMatch}% Match
                  </span>
                )}
              </div>
              
              {p.brand && <p className="text-xs text-primary font-medium">{p.brand}</p>}
              <p className="text-sm font-semibold text-foreground leading-snug mb-1.5">{p.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">{p.reason}</p>
              
              <div className="mt-3 space-y-2">
                {(p.keyIngredients || (p as any).keyIngredient) && (
                  <div className="flex items-start gap-1.5">
                    <FlaskConical className="size-3 text-primary shrink-0 mt-0.5" />
                    <span className="text-2xs text-muted-foreground font-medium line-clamp-1">
                      {p.keyIngredients ? p.keyIngredients.join(" • ") : (p as any).keyIngredient}
                    </span>
                  </div>
                )}
                {p.usageInstructions && (
                  <div className="flex items-start gap-1.5">
                    <Info className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-2xs text-muted-foreground line-clamp-2">{p.usageInstructions}</span>
                  </div>
                )}
                {(p.rating || p.estimatedPrice) && (
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/50">
                    {p.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="size-3 text-amber-400 fill-amber-400" />
                        <span className="text-2xs font-medium text-foreground">{p.rating}</span>
                      </div>
                    )}
                    {p.estimatedPrice && (
                      <span className="text-2xs font-medium text-foreground">{p.estimatedPrice}</span>
                    )}
                  </div>
                )}
              </div>
              
              {p.confidenceMatch && p.confidenceMatch < 70 && (
                <div className="mt-3 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg flex items-start gap-1.5">
                   <AlertCircle className="size-3 text-rose-500 shrink-0 mt-0.5" />
                   <p className="text-2xs text-rose-600 leading-tight">Additional images or professional evaluation may improve recommendation accuracy.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB INGREDIENTS ──────────────────────────────────────────────────────────

function IngredientsTab({ report }: { report: ScanReport }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Ingredients to Use */}
        <div className="rounded-3xl border border-emerald-300/30 bg-emerald-50/30 dark:bg-emerald-500/5 p-5 space-y-3">
          <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="size-4" /> Ingredients to Use
          </h3>
          <div className="space-y-3">
            {report.ingredientsToUse.map((ing) => (
              <div key={ing.name} className="flex gap-3">
                <Leaf className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{ing.name}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{ing.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients to Avoid */}
        <div className="rounded-3xl border border-rose-300/30 bg-rose-50/30 dark:bg-rose-500/5 p-5 space-y-3">
          <h3 className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <X className="size-4" /> Ingredients to Avoid
          </h3>
          <div className="space-y-3">
            {report.ingredientsToAvoid.map((ing) => (
              <div key={ing.name} className="flex gap-3">
                <AlertCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{ing.name}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{ing.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SPF + Water row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-sky-300/30 bg-sky-50/30 dark:bg-sky-500/5 p-4 flex items-start gap-3">
          <Droplets className="size-5 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Daily Water Intake</p>
            <p className="text-2xl font-display text-sky-600 dark:text-sky-400 mt-1">{(report.dailyWaterIntake / 1000).toFixed(1)}L</p>
            <p className="text-xs text-muted-foreground mt-1">Adequate hydration supports skin elasticity, detoxification and barrier function.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-300/30 bg-amber-50/30 dark:bg-amber-500/5 p-4 flex items-start gap-3">
          <Sun className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">SPF Recommendation</p>
            <p className="text-2xl font-display text-amber-600 dark:text-amber-400 mt-1">SPF {report.spfRecommendation}+</p>
            <p className="text-xs text-muted-foreground mt-1">{report.spfNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB LIFESTYLE ────────────────────────────────────────────────────────────

function LifestyleTab({ report }: { report: ScanReport }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground px-1">
        Skincare results are 30% products and 70% lifestyle. These habits have a direct, measurable impact on your skin health score.
      </p>
      {report.lifestyleTips.map((tip, i) => (
        <div key={i} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card/50 p-4">
          <span className="text-2xl shrink-0">{tip.icon}</span>
          <p className="text-sm text-muted-foreground leading-relaxed">{tip.tip}</p>
        </div>
      ))}
    </div>
  );
}

// ─── TAB WEEKLY ───────────────────────────────────────────────────────────────

function WeeklyTab({ report }: { report: ScanReport }) {
  const dayColors = [
    "border-sky-300/30 bg-sky-50/20 dark:bg-sky-500/5",
    "border-violet-300/30 bg-violet-50/20 dark:bg-violet-500/5",
    "border-emerald-300/30 bg-emerald-50/20 dark:bg-emerald-500/5",
    "border-amber-300/30 bg-amber-50/20 dark:bg-amber-500/5",
    "border-rose-300/30 bg-rose-50/20 dark:bg-rose-500/5",
    "border-indigo-300/30 bg-indigo-50/20 dark:bg-indigo-500/5",
    "border-teal-300/30 bg-teal-50/20 dark:bg-teal-500/5",
  ];
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground px-1">
        A consistent weekly structure is more effective than an intensive but irregular routine. Follow this plan for visible results in 4–6 weeks.
      </p>
      {report.weeklyPlan.map((day, i) => (
        <div key={day.day} className={`rounded-2xl border p-4 ${dayColors[i]}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-base">{day.day}</span>
            <span className="rounded-full bg-background/60 border border-border/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {day.focus}
            </span>
          </div>
          <ul className="space-y-1.5">
            {day.tasks.map((task, j) => (
              <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Zap className="size-3 text-primary shrink-0 mt-0.5" />
                {task}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── STEP 4: REPORT ───────────────────────────────────────────────────────────

function ReportStep({
  report,
  onSave,
  onScanAgain,
}: {
  report: ScanReport;
  onSave: () => void;
  onScanAgain: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");

  const handleSave = () => {
    onSave();
    setSaved(true);
    toast.success("Report saved to your scan history!");
  };

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Activity className="size-3.5" /> },
    { id: "concerns", label: "Concerns", icon: <AlertCircle className="size-3.5" /> },
    { id: "routine", label: "Routine", icon: <Sun className="size-3.5" /> },
    { id: "ingredients", label: "Ingredients", icon: <FlaskConical className="size-3.5" /> },
    { id: "lifestyle", label: "Lifestyle", icon: <Heart className="size-3.5" /> },
    { id: "weekly", label: "Weekly Plan", icon: <Calendar className="size-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Scan complete · {report.date}</p>
          <h2 className="font-display text-2xl mt-0.5">Your Skin Report</h2>
        </div>
        <div className="flex gap-2 shrink-0">
          {!saved ? (
            <Button id="save-report-btn" onClick={handleSave}>
              <Download className="mr-2 size-4" /> Save Report
            </Button>
          ) : (
            <Button variant="outline" className="text-success border-success/40">
              <CheckCircle2 className="mr-2 size-4" /> Saved
            </Button>
          )}
          <Button variant="outline" onClick={onScanAgain}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Poor quality banner */}
      {report.imageQuality === "poor" && <PoorQualityBanner onRetry={onScanAgain} />}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/40 p-3.5">
        <ShieldCheck className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{report.disclaimer}</p>
      </div>

      {/* Main layout */}
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* Left panel */}
        <div className="space-y-4">
          {/* Scanned image */}
          <div className="surface overflow-hidden">
            <div className="relative aspect-square">
              <img src={report.imageDataUrl} alt="Skin scan" className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/70">Method</p>
                  <p className="text-sm font-semibold text-white capitalize">{report.method}</p>
                </div>
                <span className="rounded-full bg-primary/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">AI Scan</span>
              </div>
            </div>
          </div>

          {/* Health score ring */}
          <div className="surface p-5 flex flex-col items-center gap-4">
            <ScoreRing score={report.healthScore} size={130} strokeWidth={9} label="Overall Skin Health" sublabel="Based on 24 markers" />
            <div className="grid grid-cols-2 gap-2 w-full">
              {[
                { icon: <Activity className="size-3.5" />, label: "Acne", value: 100 - report.acneScore },
                { icon: <Droplets className="size-3.5" />, label: "Hydration", value: report.hydrationScore },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-muted/50 p-3 text-center">
                  <div className={`flex justify-center mb-1 ${scoreColor(item.value)}`}>{item.icon}</div>
                  <p className="text-2xs text-muted-foreground">{item.label}</p>
                  <p className={`font-display text-xl leading-none ${scoreColor(item.value)}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skin profile */}
          <div className="surface p-5 space-y-3">
            <h3 className="text-sm font-semibold">Skin Profile</h3>
            {[
              { label: "Skin Type", value: `${report.skinTypeEmoji} ${report.skinType}` },
              { label: "Confidence", value: `${report.skinTypeConfidence}%` },
              { label: "Skin Tone", value: report.skinTone },
              { label: "Undertone", value: report.undertone },
            ].map((a) => (
              <div key={a.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{a.label}</span>
                <span className="font-semibold">{a.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — tabs */}
        <div className="space-y-4">
          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto rounded-2xl bg-muted p-1 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-96">
            {activeTab === "overview" && <OverviewTab report={report} />}
            {activeTab === "concerns" && <ConcernsTab report={report} />}
            {activeTab === "routine" && <RoutineTab report={report} />}
            {activeTab === "ingredients" && <IngredientsTab report={report} />}
            {activeTab === "lifestyle" && <LifestyleTab report={report} />}
            {activeTab === "weekly" && <WeeklyTab report={report} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function ScanPage() {
  const { analyzeImage, saveScan } = useScan();
  const [step, setStep] = useState<StepId>("select");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [method, setMethod] = useState<"camera" | "upload">("camera");

  const handleMethodSelect = (m: "camera" | "upload") => {
    setMethod(m);
    setStep(m);
  };

  const handleCapture = async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setStep("analyzing");
    try {
      const result = await analyzeImage(dataUrl, method);
      setReport(result);
      setStep("report");
    } catch {
      toast.error("Analysis failed. Please try again with a clearer image.");
      setStep("select");
    }
  };

  const handleSave = () => { if (report) saveScan(report); };

  const handleScanAgain = () => {
    setStep("select");
    setCapturedImage(null);
    setReport(null);
  };

  return (
    <AppShell>
      {step === "select" && (
        <>
          <PageHeader
            eyebrow="AI face scan"
            title="Skin Analysis"
            description="A single capture reads 24 skin markers including skin type, 20 concerns, brightness, smoothness and overall health score — then generates a fully personalised care plan."
          />
          <MethodSelectStep onSelect={handleMethodSelect} />
        </>
      )}

      {step === "camera" && (
        <>
          <PageHeader eyebrow="Camera" title="Position Your Face" />
          <CameraStep onCapture={handleCapture} onBack={() => setStep("select")} />
        </>
      )}

      {step === "upload" && (
        <>
          <PageHeader eyebrow="Upload" title="Select Your Photo" />
          <UploadStep onAnalyze={handleCapture} onBack={() => setStep("select")} />
        </>
      )}

      {step === "analyzing" && capturedImage && (
        <>
          <PageHeader eyebrow="Analysing" title="Processing Your Scan…" />
          <AnalyzingStep imageDataUrl={capturedImage} />
        </>
      )}

      {step === "report" && report && (
        <ReportStep report={report} onSave={handleSave} onScanAgain={handleScanAgain} />
      )}
    </AppShell>
  );
}
