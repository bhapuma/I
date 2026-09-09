import React, { useState, useRef, useEffect } from "react";
import { Scene, AspectRatio, CaptionStyle, BGMStyle, VoiceSettings } from "../types";
import { X, Download, Film, CheckCircle2, AlertCircle, Play, Sparkles } from "lucide-react";
import { audioEngine } from "../services/audioEngine";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  aspectRatio: AspectRatio;
  captionStyle: CaptionStyle;
  bgmStyle: BGMStyle;
  bgmVolume: number;
  voiceSettings: VoiceSettings;
  videoTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  scenes,
  aspectRatio,
  captionStyle,
  bgmStyle,
  bgmVolume,
  voiceSettings,
  videoTitle,
}) => {
  const [status, setStatus] = useState<"idle" | "recording" | "finished" | "error">("idle");
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentRenderingScene, setCurrentRenderingScene] = useState(1);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  if (!isOpen) return null;

  const totalDurationSec = scenes.reduce((acc, s) => acc + (s.duration || 7), 0);

  const startExport = async () => {
    isCancelledRef.current = false;
    setStatus("recording");
    setProgressPercent(0);
    setErrorMessage(null);
    recordedChunksRef.current = [];

    const canvas = hiddenCanvasRef.current;
    if (!canvas) {
      setStatus("error");
      setErrorMessage("Canvas element could not be initialized.");
      return;
    }

    // Set high resolution based on aspect ratio
    let width = 1280;
    let height = 720;
    if (aspectRatio === "9:16") {
      width = 720;
      height = 1280;
    } else if (aspectRatio === "1:1") {
      width = 1080;
      height = 1080;
    }
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setStatus("error");
      setErrorMessage("2D context not available");
      return;
    }

    try {
      // 1. Capture video stream from canvas
      const canvasStream = canvas.captureStream(30);

      // 2. Mix audio stream from AudioEngine
      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));

      const audioStream = audioEngine.getExportAudioStream();
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        audioStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
      }

      // 3. Supported MIME types
      let mimeType = "video/webm;codecs=vp9,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8,opus";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm";
        }
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 3_500_000,
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (isCancelledRef.current) return;
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setStatus("finished");
      };

      recorder.start(500);

      // Start background music
      audioEngine.startBGM(bgmStyle, bgmVolume);

      // Render scenes sequentially
      let totalElapsed = 0;
      for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
        if (isCancelledRef.current) break;

        const scene = scenes[sIdx];
        setCurrentRenderingScene(sIdx + 1);

        // Speak scene voiceover
        audioEngine.speak(scene.voiceover, voiceSettings);

        const durationMs = (scene.duration || 7) * 1000;
        const startTime = Date.now();

        while (Date.now() - startTime < durationMs) {
          if (isCancelledRef.current) break;

          const sceneElapsed = Date.now() - startTime;
          const sceneProgress = Math.min(1, sceneElapsed / durationMs);
          const currentTotalElapsed = totalElapsed + sceneElapsed / 1000;
          setProgressPercent(Math.min(99, Math.round((currentTotalElapsed / totalDurationSec) * 100)));

          // Render canvas frame
          renderSceneFrame(ctx, width, height, scene, sceneProgress, sIdx, scenes.length, captionStyle);

          // Yield to frame
          await new Promise((r) => setTimeout(r, 33)); // ~30 FPS
        }

        totalElapsed += scene.duration || 7;
      }

      // Finish recording
      audioEngine.stopSpeaking();
      audioEngine.stopBGM();

      if (!isCancelledRef.current) {
        setProgressPercent(100);
        setTimeout(() => {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        }, 500);
      }
    } catch (err: any) {
      console.error("Export error:", err);
      audioEngine.stopSpeaking();
      audioEngine.stopBGM();
      setStatus("error");
      setErrorMessage(err.message || "Failed to render video.");
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    const safeTitle = (videoTitle || "ai_video")
      .replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, "_")
      .slice(0, 30);
    a.download = `${safeTitle}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">भिडियो एक्सपोर्ट (Free Video Export)</h2>
          </div>
          <button
            onClick={() => {
              isCancelledRef.current = true;
              audioEngine.stopSpeaking();
              audioEngine.stopBGM();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Canvas for rendering video stream */}
        <canvas ref={hiddenCanvasRef} className="hidden" />

        {/* Content Body */}
        <div className="mt-5 space-y-5">
          {status === "idle" && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Video Title:</span>
                  <span className="font-semibold text-white truncate max-w-[220px]">{videoTitle}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Total Scenes:</span>
                  <span className="font-semibold text-cyan-400">{scenes.length} Scenes</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Total Duration:</span>
                  <span className="font-semibold text-cyan-400">~{totalDurationSec} Seconds</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Format & Resolution:</span>
                  <span className="font-semibold text-slate-300">
                    WebM HD ({aspectRatio}) • With Synchronized Voice
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Price / Cost:</span>
                  <span className="font-bold text-emerald-400">100% Free (कुनै शुल्क छैन)</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                एक्सपोर्ट सुरु गर्दा भिडियो दृश्य-दर-दृश्य रेकर्ड हुनेछ। आवाज र ब्याकग्राउन्ड संगीत स्वतः जोडेर भिडियो फाइल डाउनलोड गर्न मिल्नेछ।
              </p>

              <button
                onClick={startExport}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                एक्सपोर्ट सुरु गर्नुहोस् (Start Export)
              </button>
            </div>
          )}

          {status === "recording" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 animate-pulse">
                <Film className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">भिडियो रेकर्ड हुँदैछ...</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Rendering Scene {currentRenderingScene} of {scenes.length}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-mono text-xs text-cyan-400 font-bold">
                {progressPercent}% Complete
              </span>
            </div>
          )}

          {status === "finished" && (
            <div className="space-y-4 text-center py-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">भिडियो तयार भयो! (Video Ready)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  तपाईंको भिडियो सफलतापूर्वक रेकर्ड भइसकेको छ।
                </p>
              </div>

              {/* Video Preview */}
              {downloadUrl && (
                <div className="rounded-xl overflow-hidden bg-black border border-slate-800 max-h-48 flex items-center justify-center">
                  <video src={downloadUrl} controls className="w-full h-full object-contain" />
                </div>
              )}

              <button
                onClick={handleDownload}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                भिडियो डाउनलोड गर्नुहोस् (Download Video)
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">एक्सपोर्टमा समस्या आयो</h3>
                <p className="text-xs text-rose-300 mt-1">{errorMessage}</p>
              </div>
              <button
                onClick={startExport}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                पुन: प्रयास गर्नुहोस् (Try Again)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Render single frame on export canvas
function renderSceneFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: Scene,
  progress: number,
  sceneIdx: number,
  totalScenes: number,
  captionStyle: CaptionStyle
) {
  ctx.clearRect(0, 0, w, h);

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#082f49");
  grad.addColorStop(0.5, "#0f172a");
  grad.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Procedural thematic elements
  const time = progress * 10;
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  for (let i = 0; i < 40; i++) {
    const x = (i * 97 + time * 15) % w;
    const y = (i * 127 + time * 20) % h;
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top Title Pill
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 24px sans-serif";
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(w / 2 - 160, 35, 320, 44);
  ctx.strokeStyle = scene.accentColor || "#38bdf8";
  ctx.lineWidth = 2;
  ctx.strokeRect(w / 2 - 160, 35, 320, 44);

  ctx.fillStyle = "#ffffff";
  ctx.fillText(scene.title || `Scene ${sceneIdx + 1}`, w / 2, 65);
  ctx.restore();

  // Bottom Subtitle
  const caption = scene.caption || scene.title;
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(w * 0.05, h * 0.78, w * 0.9, 64);
  ctx.fillStyle = "#fbbf24";
  ctx.fillText(caption, w / 2, h * 0.82 + 10);
  ctx.restore();

  // Progress Bar
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(0, h - 8, w * progress, 8);
}
