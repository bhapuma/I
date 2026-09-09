import React, { useEffect, useRef, useState } from "react";
import { AspectRatio, CaptionStyle, Scene } from "../types";
import { audioEngine } from "../services/audioEngine";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";

interface VideoPlayerProps {
  scenes: Scene[];
  currentSceneIndex: number;
  isPlaying: boolean;
  aspectRatio: AspectRatio;
  captionStyle: CaptionStyle;
  onSceneChange: (index: number) => void;
  onPlayPause: () => void;
  voiceSettings: any;
  bgmStyle: any;
  bgmVolume: number;
  onCanvasRefReady?: (canvas: HTMLCanvasElement | null) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  scenes,
  currentSceneIndex,
  isPlaying,
  aspectRatio,
  captionStyle,
  onSceneChange,
  onPlayPause,
  voiceSettings,
  bgmStyle,
  bgmVolume,
  onCanvasRefReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sceneProgress, setSceneProgress] = useState(0); // 0 to 1
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);

  // Time tracking ref
  const animFrameIdRef = useRef<number | null>(null);
  const sceneStartTimeRef = useRef<number>(Date.now());
  const cachedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const currentScene = scenes[currentSceneIndex] || scenes[0];
  const sceneDuration = currentScene ? currentScene.duration : 7;

  // Notify parent of canvas element for exporter
  useEffect(() => {
    if (onCanvasRefReady) {
      onCanvasRefReady(canvasRef.current);
    }
  }, [onCanvasRefReady]);

  // Handle scene change & voice trigger
  useEffect(() => {
    sceneStartTimeRef.current = Date.now();
    setSceneProgress(0);
    setActiveWordIndex(-1);

    if (isPlaying && currentScene && !isMuted) {
      audioEngine.speak(
        currentScene.voiceover,
        voiceSettings,
        {
          onStart: () => setIsVoiceSpeaking(true),
          onEnd: () => setIsVoiceSpeaking(false),
          onBoundary: (charIdx) => {
            // Find which word matches
            const words = currentScene.voiceover.split(/\s+/);
            let countedChars = 0;
            for (let i = 0; i < words.length; i++) {
              countedChars += words[i].length + 1;
              if (countedChars >= charIdx) {
                setActiveWordIndex(i);
                break;
              }
            }
          },
        }
      );
    } else {
      audioEngine.stopSpeaking();
    }

    return () => {
      audioEngine.stopSpeaking();
    };
  }, [currentSceneIndex, isPlaying, isMuted, currentScene?.voiceover]);

  // Handle background music
  useEffect(() => {
    if (isPlaying && !isMuted) {
      audioEngine.startBGM(bgmStyle, bgmVolume);
    } else {
      audioEngine.stopBGM();
    }
    return () => {
      audioEngine.stopBGM();
    };
  }, [isPlaying, bgmStyle, bgmVolume, isMuted]);

  // Preload custom images
  useEffect(() => {
    scenes.forEach((sc) => {
      if (sc.customImageUrl && !cachedImagesRef.current.has(sc.customImageUrl)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = sc.customImageUrl;
        img.onload = () => cachedImagesRef.current.set(sc.customImageUrl!, img);
      }
    });
  }, [scenes]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions according to aspect ratio
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

    let particleTime = 0;

    const render = () => {
      if (!currentScene) return;

      const elapsedSec = (Date.now() - sceneStartTimeRef.current) / 1000;
      const progress = Math.min(1, elapsedSec / sceneDuration);
      setSceneProgress(progress);
      particleTime += 0.016;

      // Auto advance to next scene if playing
      if (isPlaying && progress >= 1) {
        if (currentSceneIndex < scenes.length - 1) {
          onSceneChange(currentSceneIndex + 1);
        } else {
          // Finished entire video
          onPlayPause();
          onSceneChange(0);
        }
        return;
      }

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // 1. Render Background & Motion
      renderSceneBackground(ctx, width, height, currentScene, progress, particleTime, cachedImagesRef.current);

      // 2. Render Atmospheric Vignette & Contrast Gradients
      renderVignette(ctx, width, height);

      // 3. Render Title & On-Screen Captions
      renderSubtitlesAndText(ctx, width, height, currentScene, captionStyle, progress, activeWordIndex);

      // 4. Render Video HUD (Scene index & progress line)
      renderHUD(ctx, width, height, currentSceneIndex, scenes.length, progress);

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [currentSceneIndex, currentScene, sceneDuration, isPlaying, aspectRatio, captionStyle, activeWordIndex, scenes.length]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      id="video-player-container"
      className="relative flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-sm p-2 sm:p-4 group"
    >
      {/* Video Canvas Stage */}
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-xl bg-black shadow-inner"
        style={{
          aspectRatio: aspectRatio === "16:9" ? "16/9" : aspectRatio === "9:16" ? "9/16" : "1/1",
          maxHeight: aspectRatio === "9:16" ? "620px" : "480px",
          width: "100%",
        }}
      >
        <canvas
          ref={canvasRef}
          id="main-video-canvas"
          className="w-full h-full object-contain select-none"
        />

        {/* Audio Wave Indicator on Top Left */}
        {isVoiceSpeaking && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-emerald-500/40 text-emerald-400 text-xs backdrop-blur-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-medium">AI Voice Active</span>
          </div>
        )}

        {/* Floating Quick Play Overlay Button when paused */}
        {!isPlaying && (
          <button
            onClick={onPlayPause}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all border border-indigo-400/40 cursor-pointer"
            aria-label="Play Video"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        )}
      </div>

      {/* Media Controls Bar */}
      <div className="w-full mt-3 px-2 py-2 flex flex-col gap-2">
        {/* Progress Bar with Scene Markers */}
        <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex cursor-pointer">
          {scenes.map((scene, idx) => {
            const isCurrent = idx === currentSceneIndex;
            const isPast = idx < currentSceneIndex;
            const fillWidth = isPast ? 100 : isCurrent ? sceneProgress * 100 : 0;
            return (
              <div
                key={scene.id}
                onClick={() => onSceneChange(idx)}
                className="relative flex-1 h-full border-r border-slate-900 last:border-none bg-slate-800 hover:bg-slate-700/80 transition-colors"
                title={`${scene.title} (${scene.duration}s)`}
              >
                <div
                  className={`h-full transition-all duration-75 ${
                    isCurrent ? "bg-gradient-to-r from-indigo-500 to-cyan-400" : "bg-indigo-600/60"
                  }`}
                  style={{ width: `${fillWidth}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Buttons & Indicators */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onSceneChange(Math.max(0, currentSceneIndex - 1))}
              disabled={currentSceneIndex === 0}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              title="Previous Scene"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onPlayPause}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" /> Play
                </>
              )}
            </button>

            <button
              onClick={() => onSceneChange(Math.min(scenes.length - 1, currentSceneIndex + 1))}
              disabled={currentSceneIndex === scenes.length - 1}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              title="Next Scene"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                onSceneChange(0);
                sceneStartTimeRef.current = Date.now();
              }}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Current Scene & Time Counter */}
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-300 font-mono text-xs">
              Scene <span className="text-cyan-400 font-semibold">{currentSceneIndex + 1}</span> of {scenes.length}
            </div>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors text-slate-300 cursor-pointer"
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors text-slate-300 cursor-pointer"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Canvas Background & Motion Effect Renderer
function renderSceneBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: Scene,
  progress: number,
  time: number,
  cachedImages: Map<string, HTMLImageElement>
) {
  // Motion transform calculations
  let scale = 1.0;
  let offsetX = 0;
  let offsetY = 0;

  if (scene.motion === "ken-burns-in") {
    scale = 1.0 + progress * 0.12;
  } else if (scene.motion === "ken-burns-out") {
    scale = 1.12 - progress * 0.12;
  } else if (scene.motion === "pan-left") {
    scale = 1.08;
    offsetX = progress * 40 - 20;
  } else if (scene.motion === "pan-right") {
    scale = 1.08;
    offsetX = -progress * 40 + 20;
  } else if (scene.motion === "pulse") {
    scale = 1.0 + Math.sin(progress * Math.PI) * 0.05;
  }

  ctx.save();
  ctx.translate(w / 2 + offsetX, h / 2 + offsetY);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  // Check if custom image exists
  if (scene.customImageUrl && cachedImages.has(scene.customImageUrl)) {
    const img = cachedImages.get(scene.customImageUrl)!;
    // Cover mode
    const imgAspect = img.width / img.height;
    const canvasAspect = w / h;
    let drawW = w;
    let drawH = h;
    let sx = 0;
    let sy = 0;

    if (canvasAspect > imgAspect) {
      drawH = w / imgAspect;
      sy = (h - drawH) / 2;
    } else {
      drawW = h * imgAspect;
      sx = (w - drawW) / 2;
    }
    ctx.drawImage(img, sx, sy, drawW, drawH);
  } else {
    // Generative procedural scenes based on visual theme
    renderThematicBackground(ctx, w, h, scene, time);
  }

  ctx.restore();
}

function renderThematicBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: Scene,
  time: number
) {
  const theme = scene.visualTheme;

  if (theme === "nepal-himalayas") {
    // Himalayan dawn gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#082f49"); // deep sky
    grad.addColorStop(0.4, "#0f172a");
    grad.addColorStop(0.8, "#1e1b4b");
    grad.addColorStop(1, "#311042");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glowing sun rays / dawn reflection
    const sunGrad = ctx.createRadialGradient(w * 0.5, h * 0.6, 20, w * 0.5, h * 0.6, w * 0.6);
    sunGrad.addColorStop(0, "rgba(251, 191, 36, 0.4)");
    sunGrad.addColorStop(0.5, "rgba(244, 63, 94, 0.15)");
    sunGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    // Distant mountain layers
    drawMountainLayer(ctx, w, h, 0.58, "#1e293b", 6, 120);
    drawMountainLayer(ctx, w, h, 0.68, "#334155", 5, 180);
    // Forefront snowy peaks
    drawSnowyHimalayas(ctx, w, h, 0.76, "#f8fafc", "#0284c7");

    // Drifting snow crystals
    drawFloatingParticles(ctx, w, h, time, "#ffffff", 45, 1.5);
  } else if (theme === "technology" || theme === "cyberpunk") {
    // Cyberpunk cyber grid
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#030712");
    grad.addColorStop(0.6, "#0f172a");
    grad.addColorStop(1, theme === "cyberpunk" ? "#4c0519" : "#083344");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 3D Matrix Perspective Grid
    ctx.strokeStyle = theme === "cyberpunk" ? "rgba(244, 63, 94, 0.25)" : "rgba(6, 182, 212, 0.25)";
    ctx.lineWidth = 1.5;
    const horizon = h * 0.55;
    const gridSpacing = 40;
    const scroll = (time * 60) % gridSpacing;

    for (let y = horizon; y < h; y += (y - horizon) * 0.25 + 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const vanishX = w / 2;
    for (let x = -w; x <= w * 2; x += 80) {
      ctx.beginPath();
      ctx.moveTo(vanishX, horizon);
      ctx.lineTo(x + scroll, h);
      ctx.stroke();
    }

    // Floating digital light nodes
    drawDigitalNodes(ctx, w, h, time, scene.accentColor || "#38bdf8");
  } else if (theme === "space") {
    // Deep Cosmos
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);

    // Cosmic Nebula
    const neb1 = ctx.createRadialGradient(w * 0.3, h * 0.4, 50, w * 0.3, h * 0.4, w * 0.45);
    neb1.addColorStop(0, "rgba(168, 85, 247, 0.35)");
    neb1.addColorStop(0.6, "rgba(59, 130, 246, 0.15)");
    neb1.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, w, h);

    // Constellation stars
    drawStarField(ctx, w, h, time);
  } else if (theme === "nature") {
    // Lush Emerald Atmosphere
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#022c22");
    grad.addColorStop(0.6, "#064e3b");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Forest canopy silhouette
    drawForestSilhouettes(ctx, w, h);
    drawFloatingParticles(ctx, w, h, time, "#6ee7b7", 35, 2.5);
  } else {
    // Warm Sunset or Minimal Dark
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#451a03");
    grad.addColorStop(0.5, "#1c1917");
    grad.addColorStop(1, "#0c0a09");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Radial sunset glow
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.5, 40, w * 0.5, h * 0.5, w * 0.5);
    glow.addColorStop(0, "rgba(245, 158, 11, 0.3)");
    glow.addColorStop(0.8, "rgba(225, 29, 72, 0.1)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    drawFloatingParticles(ctx, w, h, time, "#fcd34d", 30, 2.0);
  }
}

// Procedural Mountain layer
function drawMountainLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseYFactor: number,
  color: string,
  peaks: number,
  variance: number
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const baseY = h * baseYFactor;
  ctx.moveTo(0, h);
  ctx.lineTo(0, baseY);

  const step = w / peaks;
  for (let i = 0; i <= peaks; i++) {
    const x = i * step;
    const peakY = baseY - (i % 2 === 1 ? variance : variance * 0.4);
    ctx.lineTo(x, peakY);
  }

  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

// Procedural Snowy Peaks
function drawSnowyHimalayas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseYFactor: number,
  snowColor: string,
  shadowColor: string
) {
  const baseY = h * baseYFactor;
  const peaks = [
    { x: w * 0.15, y: baseY - 160 },
    { x: w * 0.35, y: baseY - 240 }, // High peak
    { x: w * 0.55, y: baseY - 190 },
    { x: w * 0.78, y: baseY - 260 }, // Everest-like peak
    { x: w * 0.95, y: baseY - 170 },
  ];

  peaks.forEach((peak) => {
    // Lit side
    ctx.fillStyle = snowColor;
    ctx.beginPath();
    ctx.moveTo(peak.x, peak.y);
    ctx.lineTo(peak.x - 120, baseY);
    ctx.lineTo(peak.x, baseY);
    ctx.closePath();
    ctx.fill();

    // Shaded side
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.moveTo(peak.x, peak.y);
    ctx.lineTo(peak.x, baseY);
    ctx.lineTo(peak.x + 130, baseY);
    ctx.closePath();
    ctx.fill();
  });
}

function drawForestSilhouettes(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#022c22";
  const baseY = h * 0.75;
  for (let x = 0; x < w; x += 30) {
    const treeH = 60 + Math.sin(x * 0.05) * 35;
    ctx.beginPath();
    ctx.moveTo(x + 15, baseY - treeH);
    ctx.lineTo(x, baseY);
    ctx.lineTo(x + 30, baseY);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFloatingParticles(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  color: string,
  count: number,
  size: number
) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const seed = i * 137.5;
    const x = (seed * 11 + Math.sin(time + i) * 30) % w;
    const y = (seed * 17 + time * 25) % h;
    const alpha = 0.2 + (Math.sin(time * 2 + i) * 0.5 + 0.5) * 0.6;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, size * (0.6 + (i % 3) * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

function drawDigitalNodes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  color: string
) {
  const nodes = [
    { x: w * 0.2, y: h * 0.3 },
    { x: w * 0.4, y: h * 0.25 },
    { x: w * 0.6, y: h * 0.35 },
    { x: w * 0.8, y: h * 0.28 },
    { x: w * 0.5, y: h * 0.45 },
  ];

  ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < nodes.length - 1; i++) {
    ctx.moveTo(nodes[i].x, nodes[i].y);
    ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y);
  }
  ctx.stroke();

  nodes.forEach((node, i) => {
    const pulse = Math.sin(time * 3 + i) * 3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 4 + pulse, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawStarField(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  for (let i = 0; i < 70; i++) {
    const x = ((i * 313) % w);
    const y = ((i * 499) % (h * 0.8));
    const twinkle = Math.sin(time * 4 + i) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.7})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (i % 2) * 1.0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.75);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Bottom gradient for clean subtitle legibility
  const botGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
  botGrad.addColorStop(0, "rgba(0,0,0,0)");
  botGrad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, h * 0.65, w, h * 0.35);
}

function renderSubtitlesAndText(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: Scene,
  captionStyle: CaptionStyle,
  progress: number,
  activeWordIdx: number
) {
  // 1. Top Scene Title Pill
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 22px 'Inter', sans-serif";
  const titleText = scene.title || "";
  const titleMetrics = ctx.measureText(titleText);
  const pillW = titleMetrics.width + 48;
  const pillH = 38;
  const pillY = 36;

  // Title pill background
  ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
  ctx.strokeStyle = scene.accentColor || "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, w / 2 - pillW / 2, pillY, pillW, pillH, 19);
  ctx.fill();
  ctx.stroke();

  // Title text
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(titleText, w / 2, pillY + 26);
  ctx.restore();

  // 2. Center Animated Captions / Subtitles
  const caption = scene.caption || scene.title;
  const voiceoverWords = (scene.voiceover || caption).split(/\s+/);

  ctx.save();
  ctx.textAlign = "center";
  const subtitleY = h * 0.82;

  if (captionStyle === "tiktok-box") {
    // Bold TikTok style box
    ctx.font = "bold 34px 'Inter', sans-serif";
    const capMetrics = ctx.measureText(caption);
    const boxW = Math.min(w * 0.9, capMetrics.width + 50);
    const boxH = 56;

    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, w / 2 - boxW / 2, subtitleY - 40, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fef08a";
    ctx.fillText(caption, w / 2, subtitleY);
  } else if (captionStyle === "karaoke-yellow") {
    // Word by word karaoke highlighting
    ctx.font = "bold 32px 'Inter', sans-serif";
    let displayText = caption;
    if (activeWordIdx >= 0 && activeWordIdx < voiceoverWords.length) {
      displayText = `"${voiceoverWords.slice(Math.max(0, activeWordIdx - 2), activeWordIdx + 4).join(" ")}"`;
    }

    ctx.fillStyle = "rgba(0,0,0,0.85)";
    drawRoundedRect(ctx, w * 0.08, subtitleY - 42, w * 0.84, 60, 14);
    ctx.fill();

    ctx.fillStyle = "#fbbf24"; // bright golden yellow
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 12;
    ctx.fillText(displayText, w / 2, subtitleY);
  } else if (captionStyle === "cinematic") {
    // Elegant cinematic letterspaced subtitles
    ctx.font = "italic 30px 'Georgia', serif";
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 8;
    ctx.fillText(caption, w / 2, subtitleY);
    ctx.fillStyle = "#f1f5f9";
    ctx.fillText(caption, w / 2, subtitleY);
  } else {
    // Modern glow
    ctx.font = "bold 32px 'Inter', sans-serif";
    ctx.shadowColor = scene.accentColor || "#38bdf8";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(caption, w / 2, subtitleY);
  }

  ctx.restore();
}

function renderHUD(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sceneIdx: number,
  totalScenes: number,
  progress: number
) {
  // Bottom Progress Line
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(0, h - 6, w, 6);

  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(0, h - 6, w * progress, 6);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
