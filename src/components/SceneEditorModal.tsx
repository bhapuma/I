import React, { useState } from "react";
import { MotionEffect, Scene, VisualTheme } from "../types";
import { X, Sparkles, Volume2, Image as ImageIcon, Check, Sliders, Upload } from "lucide-react";
import { audioEngine } from "../services/audioEngine";
import { enhanceVoiceover } from "../services/geminiService";

interface SceneEditorModalProps {
  scene: Scene;
  sceneIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedScene: Scene) => void;
  voiceSettings: any;
  language: string;
}

export const SceneEditorModal: React.FC<SceneEditorModalProps> = ({
  scene,
  sceneIndex,
  isOpen,
  onClose,
  onSave,
  voiceSettings,
  language,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(scene.title);
  const [caption, setCaption] = useState(scene.caption);
  const [voiceover, setVoiceover] = useState(scene.voiceover);
  const [duration, setDuration] = useState(scene.duration);
  const [visualTheme, setVisualTheme] = useState<VisualTheme>(scene.visualTheme);
  const [motion, setMotion] = useState<MotionEffect>(scene.motion);
  const [accentColor, setAccentColor] = useState(scene.accentColor || "#38bdf8");
  const [customImageUrl, setCustomImageUrl] = useState(scene.customImageUrl || "");
  const [isPolishing, setIsPolishing] = useState(false);

  const handleTestVoice = () => {
    audioEngine.speak(voiceover, voiceSettings);
  };

  const handleAiPolishVoiceover = async () => {
    if (!voiceover.trim()) return;
    setIsPolishing(true);
    try {
      const polished = await enhanceVoiceover({
        text: voiceover,
        targetLanguage: language,
        tone: "Engaging and clear for video narration",
      });
      setVoiceover(polished);
    } catch (err) {
      console.warn("AI polish failed:", err);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setCustomImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({
      ...scene,
      title,
      caption,
      voiceover,
      duration,
      visualTheme,
      motion,
      accentColor,
      customImageUrl: customImageUrl || undefined,
    });
    onClose();
  };

  const themes: { id: VisualTheme; label: string; icon: string }[] = [
    { id: "nepal-himalayas", label: "नेपाल र हिमाल (Himalayas)", icon: "🏔️" },
    { id: "technology", label: "Technology & AI", icon: "💻" },
    { id: "nature", label: "Nature & Greenery", icon: "🌿" },
    { id: "space", label: "Deep Space & Galaxy", icon: "🌌" },
    { id: "cyberpunk", label: "Cyberpunk & Neon", icon: "⚡" },
    { id: "warm-sunset", label: "Warm Sunset & Glow", icon: "🌅" },
  ];

  const motions: { id: MotionEffect; label: string }[] = [
    { id: "ken-burns-in", label: "Ken Burns (Zoom In)" },
    { id: "ken-burns-out", label: "Ken Burns (Zoom Out)" },
    { id: "pan-left", label: "Pan Left" },
    { id: "pan-right", label: "Pan Right" },
    { id: "pulse", label: "Cinematic Pulse" },
    { id: "none", label: "Static" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">
              Scene {sceneIndex + 1} Editor
            </span>
            <h2 className="text-xl font-bold text-white">दृश्य सम्पादन (Edit Scene)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-5 mt-5">
          {/* Title & Caption */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Scene Title (शीर्षक)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-sm"
                placeholder="e.g. सगरमाथाको परिचय"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                On-Screen Caption / Subtitle (स्क्रिन सब-टाइटल)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-sm"
                placeholder="e.g. संसारकै सर्वोच्च शिखर नेपालमै"
              />
            </div>
          </div>

          {/* Voiceover Script & Audio Controls */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                AI Voiceover Narration Script (स्वर वाचन पाठ)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAiPolishVoiceover}
                  disabled={isPolishing}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  {isPolishing ? "Polishing..." : "AI द्वारा भाषा सुधार"}
                </button>
                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" />
                  आवाज सुन्नुहोस् (Listen)
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              value={voiceover}
              onChange={(e) => setVoiceover(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-sm resize-none"
              placeholder="यस दृश्यमा AI ले बोल्ने आवाज यहाँ लेख्नुहोस्..."
            />
            <span className="text-[11px] text-slate-400">
              यसलाई TTS आवाज इन्जिनले स्वचालित रूपमा बोल्नेछ।
            </span>
          </div>

          {/* Duration Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Scene Duration (दृश्यको समय अवधि)
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                {duration} Seconds
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>3s (Short)</span>
              <span>15s (Medium)</span>
              <span>30s (Long narration)</span>
            </div>
          </div>

          {/* Visual Theme Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Visual Background Theme (पृष्ठभूमि दृश्य शैली)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setVisualTheme(t.id)}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    visualTheme === t.id
                      ? "bg-indigo-950/80 border-cyan-400 text-white shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400"
                      : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-xs font-medium truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Motion Effect & Accent Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Camera Motion (क्यामेरा चाल)
              </label>
              <select
                value={motion}
                onChange={(e) => setMotion(e.target.value as MotionEffect)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-sm cursor-pointer"
              >
                {motions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Accent Highlight Color (रंग)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-slate-700 bg-transparent"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-28 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Custom Image Upload or URL */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              Custom Background Image (वैकल्पिक फोटो थप्नुहोस्)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg वा तलबाट फाइल अपलोड गर्नुहोस्"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-400"
              />
              <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1 border border-slate-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-cyan-400" /> Upload File
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {customImageUrl && (
                <button
                  type="button"
                  onClick={() => setCustomImageUrl("")}
                  className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors cursor-pointer"
          >
            रद्द गर्नुहोस् (Cancel)
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            परिवर्तन सेभ गर्नुहोस् (Save Changes)
          </button>
        </div>
      </div>
    </div>
  );
};
