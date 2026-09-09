import React, { useState } from "react";
import { Sparkles, Film, Compass, Layers, Globe, Zap, Clock } from "lucide-react";
import { AspectRatio } from "../types";

interface PromptWizardProps {
  onGenerate: (params: {
    prompt: string;
    sceneCount: number;
    language: string;
    style: string;
    aspectRatio: AspectRatio;
    tone: string;
  }) => void;
  isLoading: boolean;
  onSelectSample: (sampleId: string) => void;
}

export const PromptWizard: React.FC<PromptWizardProps> = ({
  onGenerate,
  isLoading,
  onSelectSample,
}) => {
  const [prompt, setPrompt] = useState("");
  const [sceneCount, setSceneCount] = useState(5);
  const [language, setLanguage] = useState("Nepali");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [style, setStyle] = useState("Cinematic Documentary");
  const [tone, setTone] = useState("Inspiring & Informative");

  const quickIdeas = [
    {
      title: "नेपालको प्राकृतिक सौन्दर्य",
      prompt: "नेपालको हिमाल, ताल, वनजङ्गल र अनुपम प्राकृतिक सौन्दर्यको बारेमा रोचक भिडियो",
      lang: "Nepali",
      icon: "🏔️",
    },
    {
      title: "Artificial Intelligence र भविष्य",
      prompt: "कसरी एआईले भविष्यमा हाम्रो जीवन, शिक्षा र काम गर्ने शैली बदल्दैछ",
      lang: "Nepali",
      icon: "🤖",
    },
    {
      title: "सफलताका ५ सुनौला नियमहरू",
      prompt: "दैनिक जीवनमा सफल हुन र उत्प्रेरित रहन आवश्यक ५ बानीहरू",
      lang: "Nepali",
      icon: "⭐",
    },
    {
      title: "Mysteries of Deep Space",
      prompt: "Journey through black holes, mysterious galaxies, and the origin of our universe",
      lang: "English",
      icon: "🌌",
    },
    {
      title: "प्राचीन बुद्ध सन्देश र शान्ति",
      prompt: "भगवान बुद्धको जन्मभूमि लुम्बिनी र विश्व शान्तिको लागि उहाँका अमर सन्देश",
      lang: "Nepali",
      icon: "🕊️",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate({
      prompt: prompt.trim(),
      sceneCount,
      language,
      style,
      aspectRatio,
      tone,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-md">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            100% Free AI Video Creator • असीमित लम्बाइको भिडियो
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            तपाईंको विषय लेख्नुहोस् (Enter Video Topic)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            कुनै पनि विषयमा जति लामो भए पनि स्वचालित आवाज (AI Voice) र स्क्रिन सब-टाइटलसहित भिडियो बनाउनुहोस्।
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectSample("sample_nepal")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            🇳🇵 नेपाल नमुना
          </button>
          <button
            type="button"
            onClick={() => onSelectSample("sample_tech_ai")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            ⚡ Tech AI Sample
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Main Prompt Input Area */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            भिडियोको विषय वा कथा (Prompt Description)
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="जस्तै: नेपालको हिमाल र पर्यटकीय स्थलहरूको बारेमा ५ मिनेटको आकर्षक भिडियो..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm leading-relaxed"
            />
            {prompt && (
              <button
                type="button"
                onClick={() => setPrompt("")}
                className="absolute top-2.5 right-2.5 text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800/80 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Idea Chips */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 block mb-2">
            वा तलका लोकप्रिय विषयहरू छान्नुहोस् (Popular Ideas):
          </span>
          <div className="flex flex-wrap gap-2">
            {quickIdeas.map((idea, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(idea.prompt);
                  setLanguage(idea.lang);
                }}
                className="px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-indigo-900/60 border border-slate-700 hover:border-indigo-500/80 text-slate-300 hover:text-white text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{idea.icon}</span>
                <span>{idea.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Grid: Scene count, Language, Aspect Ratio, Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Scene Count (Length of video) */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                दृश्य संख्या (Scenes)
              </label>
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                {sceneCount} दृश्यक
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={15}
              step={1}
              value={sceneCount}
              onChange={(e) => setSceneCount(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>3 (~25s)</span>
              <span>7 (~1m)</span>
              <span>15 (~2.5m+)</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              * पछि पनि टाइमलाइनबाट जति मन लाग्यो थप्न मिल्छ।
            </span>
          </div>

          {/* Language Selector */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              आवाज र भाषा (Language)
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="Nepali">नेपाली (Nepali)</option>
              <option value="English">English (International)</option>
              <option value="Hindi">हिन्दी (Hindi)</option>
              <option value="Spanish">Español (Spanish)</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-2 block">
              AI voiceover script यस भाषामा बन्नेछ।
            </span>
          </div>

          {/* Aspect Ratio */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Film className="w-3.5 h-3.5 text-purple-400" />
              आकार (Aspect Ratio)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "16:9", label: "16:9", desc: "YouTube" },
                { id: "9:16", label: "9:16", desc: "Shorts" },
                { id: "1:1", label: "1:1", desc: "Square" },
              ].map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => setAspectRatio(ar.id as AspectRatio)}
                  className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                    aspectRatio === ar.id
                      ? "bg-purple-950/80 border-purple-400 text-white"
                      : "bg-slate-850/60 border-slate-700/80 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold">{ar.label}</div>
                  <div className="text-[9px] opacity-80">{ar.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Video Style */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              भिडियो शैली (Style)
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="Cinematic Documentary">Cinematic Documentary (सिनेमेटिक)</option>
              <option value="Storytelling">Engaging Storytelling (कथा शैली)</option>
              <option value="Educational Explainer">Educational (शैक्षिक/जानकारीमूलक)</option>
              <option value="Motivational">Motivational (प्रेरणादायी)</option>
              <option value="Shorts / Reels Viral">Social Media Viral (छोटो र रोचक)</option>
            </select>
          </div>
        </div>

        {/* Generate Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>AI ले भिडियो र आवाज तयार गर्दैछ... (Generating AI Video...)</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                <span>नि:शुल्क भिडियो बनाउनुहोस् (Generate Free AI Video)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
