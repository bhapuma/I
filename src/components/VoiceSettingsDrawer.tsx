import React, { useEffect, useState } from "react";
import { BGMStyle, VoiceSettings } from "../types";
import { X, Volume2, Mic, Music, Play, Check } from "lucide-react";
import { audioEngine } from "../services/audioEngine";

interface VoiceSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: VoiceSettings) => void;
  bgmStyle: BGMStyle;
  onUpdateBGMStyle: (style: BGMStyle) => void;
  bgmVolume: number;
  onUpdateBGMVolume: (vol: number) => void;
  sampleText?: string;
}

export const VoiceSettingsDrawer: React.FC<VoiceSettingsDrawerProps> = ({
  isOpen,
  onClose,
  voiceSettings,
  onUpdateVoiceSettings,
  bgmStyle,
  onUpdateBGMStyle,
  bgmVolume,
  onUpdateBGMVolume,
  sampleText = "नमस्ते, यो एआई भिडियोको स्वचालित आवाज परीक्षण हो।",
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    const updateVoices = () => {
      const v = audioEngine.getAvailableVoices();
      setVoices(v);
    };

    updateVoices();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    setIsPlayingTest(true);
    audioEngine.speak(sampleText, voiceSettings, {
      onEnd: () => setIsPlayingTest(false),
    });
  };

  const bgmOptions: { id: BGMStyle; label: string; desc: string }[] = [
    { id: "cinematic-ambient", label: "Cinematic Ambient (सिनेमेटिक)", desc: "Epic, atmospheric film chords" },
    { id: "inspirational-pads", label: "Inspirational Pads (उत्साहजनक)", desc: "Warm, motivating progression" },
    { id: "lofi-chill", label: "Lo-Fi Chill (शान्त लो-फाई)", desc: "Relaxing cozy harmonic tones" },
    { id: "none", label: "No Music (संगीत बन्द)", desc: "Voice narration only" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">
              आवाज र संगीत सेटिङ (Voice & Audio)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6 mt-4">
          {/* Voice Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              AI Voiceover Actor (बोल्ने आवाज चयन गर्नुहोस्)
            </label>
            <select
              value={voiceSettings.voiceUri || ""}
              onChange={(e) =>
                onUpdateVoiceSettings({ ...voiceSettings, voiceUri: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="">Auto Detect (नेपाली / उत्तम उपलब्ध आवाज)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              तपाईंको ब्राउजरमा उपलब्ध प्राकृतिक आवाजहरू स्वचालित रूपमा लोड हुन्छन्।
            </span>
          </div>

          {/* Voice Speed & Pitch Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Speech Rate (गति)</span>
                <span className="font-mono text-cyan-400 font-semibold">{voiceSettings.rate}x</span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.6}
                step={0.05}
                value={voiceSettings.rate}
                onChange={(e) =>
                  onUpdateVoiceSettings({ ...voiceSettings, rate: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Voice Pitch (स्वरको सुर)</span>
                <span className="font-mono text-cyan-400 font-semibold">{voiceSettings.pitch}x</span>
              </div>
              <input
                type="range"
                min={0.7}
                max={1.4}
                step={0.05}
                value={voiceSettings.pitch}
                onChange={(e) =>
                  onUpdateVoiceSettings({ ...voiceSettings, pitch: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Voice Test Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestVoice}
              disabled={isPlayingTest}
              className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPlayingTest ? (
                <>
                  <Volume2 className="w-4 h-4 animate-bounce" /> बोल्दैछ... (Speaking)
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> आवाज परीक्षण (Test Voice)
                </>
              )}
            </button>
          </div>

          {/* Background Music Selection */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-4 h-4 text-purple-400" />
              <label className="text-xs font-medium text-slate-200">
                Background Music (पृष्ठभूमि संगीत)
              </label>
            </div>

            <div className="space-y-2">
              {bgmOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => onUpdateBGMStyle(opt.id)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                    bgmStyle === opt.id
                      ? "bg-purple-950/50 border-purple-500 text-white"
                      : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[11px] text-slate-400">{opt.desc}</div>
                  </div>
                  {bgmStyle === opt.id && <Check className="w-4 h-4 text-purple-400" />}
                </div>
              ))}
            </div>

            {bgmStyle !== "none" && (
              <div className="mt-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Music Volume (संगीत भोल्युम)</span>
                  <span className="font-mono text-purple-400 font-semibold">
                    {Math.round(bgmVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.8}
                  step={0.05}
                  value={bgmVolume}
                  onChange={(e) => onUpdateBGMVolume(parseFloat(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  * आवाज बोल्दा संगीतको भोल्युम स्वचालित रूपमा कम हुन्छ (Auto-ducking)।
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            सम्पन्न (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
