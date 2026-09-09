export type AspectRatio = "16:9" | "9:16" | "1:1";

export type VisualTheme =
  | "nepal-himalayas"
  | "technology"
  | "nature"
  | "space"
  | "cyberpunk"
  | "warm-sunset"
  | "urban"
  | "mystic"
  | "minimal-dark"
  | "bright-studio";

export type MotionEffect =
  | "ken-burns-in"
  | "ken-burns-out"
  | "pan-left"
  | "pan-right"
  | "pulse"
  | "none";

export type AnimationType =
  | "particles"
  | "grid"
  | "waves"
  | "constellation"
  | "aurora"
  | "cinematic-rings";

export type CaptionStyle = "modern-glow" | "tiktok-box" | "cinematic" | "karaoke-yellow";

export type BGMStyle = "cinematic-ambient" | "lofi-chill" | "inspirational-pads" | "dramatic-pulse" | "none";

export interface Scene {
  id: string;
  title: string;
  caption: string;
  voiceover: string;
  visualDescription: string;
  visualTheme: VisualTheme;
  bgGradient: string;
  accentColor: string;
  motion: MotionEffect;
  animationType: AnimationType;
  duration: number; // in seconds
  customImageUrl?: string; // Optional user uploaded or AI generated image
  customAudioUrl?: string; // Optional user voice recording
}

export interface VideoProject {
  id: string;
  title: string;
  description?: string;
  scenes: Scene[];
  aspectRatio: AspectRatio;
  language: string;
  captionStyle: CaptionStyle;
  bgmStyle: BGMStyle;
  bgmVolume: number; // 0 to 1
  voiceSettings: VoiceSettings;
}

export interface VoiceSettings {
  voiceUri?: string;
  lang: string;
  rate: number; // 0.5 to 2
  pitch: number; // 0.5 to 1.5
  volume: number; // 0 to 1
  autoPlayVoice: boolean;
}
