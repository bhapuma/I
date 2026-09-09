import React, { useState, useEffect } from "react";
import { VideoProject, Scene, AspectRatio, CaptionStyle, BGMStyle, VoiceSettings } from "./types";
import { SAMPLE_PROJECTS } from "./data/sampleTemplates";
import { VideoPlayer } from "./components/VideoPlayer";
import { Timeline } from "./components/Timeline";
import { PromptWizard } from "./components/PromptWizard";
import { SceneEditorModal } from "./components/SceneEditorModal";
import { VoiceSettingsDrawer } from "./components/VoiceSettingsDrawer";
import { ExportModal } from "./components/ExportModal";
import { generateVideoPlan, expandVideoScenes } from "./services/geminiService";
import {
  Sparkles,
  Download,
  Settings,
  Plus,
  Layers,
  Type,
  Maximize2,
  CheckCircle,
  HelpCircle,
  Film,
  Volume2,
} from "lucide-react";

export default function App() {
  // Current active project
  const [project, setProject] = useState<VideoProject>(SAMPLE_PROJECTS[0]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Modals and Drawers
  const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);
  const [isVoiceDrawerOpen, setIsVoiceDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Quick Notification Helper
  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Generate New Video from Prompt
  const handleGenerateVideo = async (params: {
    prompt: string;
    sceneCount: number;
    language: string;
    style: string;
    aspectRatio: AspectRatio;
    tone: string;
  }) => {
    setIsGenerating(true);
    setIsPlaying(false);
    try {
      const result = await generateVideoPlan(params);

      const newProject: VideoProject = {
        id: `proj_${Date.now()}`,
        title: result.videoTitle || `AI Video: ${params.prompt}`,
        scenes: result.scenes,
        aspectRatio: params.aspectRatio,
        language: params.language,
        captionStyle: "modern-glow",
        bgmStyle: "cinematic-ambient",
        bgmVolume: 0.25,
        voiceSettings: {
          lang: params.language.toLowerCase().includes("nepali") ? "ne-NP" : "en-US",
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          autoPlayVoice: true,
        },
      };

      setProject(newProject);
      setCurrentSceneIndex(0);
      showNotice(`सफलतापूर्वक ${result.scenes.length} दृश्यहरूको भिडियो तयार भयो!`);

      // Scroll smoothly to the player
      document.getElementById("video-player-container")?.scrollIntoView({ behavior: "smooth" });
    } catch (err: any) {
      console.error("Generation error:", err);
      showNotice("भिडियो तयार गर्दा केही त्रुटि भयो। पुन: प्रयास गर्नुहोस्।");
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Expand Existing Video (Unlimited Length / "jati lamo vay Pani")
  const handleExpandScenes = async () => {
    setIsExpanding(true);
    try {
      const added = await expandVideoScenes({
        videoTitle: project.title,
        topic: project.title,
        existingScenes: project.scenes,
        addCount: 3,
        language: project.language,
      });

      if (added.length > 0) {
        setProject((prev) => ({
          ...prev,
          scenes: [...prev.scenes, ...added],
        }));
        showNotice(`भिडियोमा थप ${added.length} वटा दृश्यहरू थपिए! (कुल ${project.scenes.length + added.length} दृश्य)`);
      }
    } catch (err) {
      console.error("Expand error:", err);
      showNotice("थप दृश्यहरू थप्न सकिएन।");
    } finally {
      setIsExpanding(false);
    }
  };

  // 3. Select preset template
  const handleSelectSample = (sampleId: string) => {
    const found = SAMPLE_PROJECTS.find((p) => p.id === sampleId);
    if (found) {
      setProject(found);
      setCurrentSceneIndex(0);
      setIsPlaying(false);
      showNotice(`नमुना भिडियो लोड भयो: ${found.title}`);
    }
  };

  // Timeline operations
  const handleAddManualScene = () => {
    const newIdx = project.scenes.length + 1;
    const isNepali = project.language.toLowerCase().includes("nepali");
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      title: isNepali ? `नयाँ दृश्य ${newIdx}` : `New Scene ${newIdx}`,
      caption: isNepali ? `दृश्य ${newIdx} को विवरण` : `Scene ${newIdx} Headline`,
      voiceover: isNepali
        ? `यो दृश्य नम्बर ${newIdx} को आवाज विवरण हो। यहाँ तपाईंको मनपर्ने पाठ लेख्न सक्नुहुन्छ।`
        : `This is scene number ${newIdx} narration. You can customize this voiceover text anytime.`,
      visualDescription: "Atmospheric cinematic visual",
      visualTheme: "nepal-himalayas",
      bgGradient: "from-slate-900 via-indigo-950 to-slate-950",
      accentColor: "#38bdf8",
      motion: "ken-burns-in",
      animationType: "particles",
      duration: 7,
    };

    setProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
    }));
    setCurrentSceneIndex(project.scenes.length);
    showNotice("नयाँ दृश्य थपियो।");
  };

  const handleDuplicateScene = (index: number) => {
    const sc = project.scenes[index];
    const dup: Scene = {
      ...sc,
      id: `scene_${Date.now()}`,
      title: `${sc.title} (Copy)`,
    };
    const newScenes = [...project.scenes];
    newScenes.splice(index + 1, 0, dup);
    setProject((prev) => ({ ...prev, scenes: newScenes }));
    showNotice("दृश्य प्रतिलिपि (duplicate) गरियो।");
  };

  const handleDeleteScene = (index: number) => {
    if (project.scenes.length <= 1) {
      showNotice("कम्तिमा एउटा दृश्य अनिवार्य हुन्छ।");
      return;
    }
    const newScenes = project.scenes.filter((_, i) => i !== index);
    setProject((prev) => ({ ...prev, scenes: newScenes }));
    if (currentSceneIndex >= newScenes.length) {
      setCurrentSceneIndex(newScenes.length - 1);
    }
    showNotice("दृश्य हटाइयो।");
  };

  const handleMoveScene = (index: number, dir: "left" | "right") => {
    const targetIdx = dir === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= project.scenes.length) return;
    const newScenes = [...project.scenes];
    const [moved] = newScenes.splice(index, 1);
    newScenes.splice(targetIdx, 0, moved);
    setProject((prev) => ({ ...prev, scenes: newScenes }));
    setCurrentSceneIndex(targetIdx);
  };

  const handleSaveScene = (updated: Scene) => {
    if (editingSceneIndex === null) return;
    const newScenes = [...project.scenes];
    newScenes[editingSceneIndex] = updated;
    setProject((prev) => ({ ...prev, scenes: newScenes }));
    showNotice("दृश्य सफलतापूर्वक अपडेट भयो!");
  };

  const totalDurationSec = project.scenes.reduce((acc, s) => acc + (s.duration || 7), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  AI Video Studio
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                    Free • असीमित लम्बाइ
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                स्वचालित आवाज (AI Voice) र स्क्रिन क्याप्सनसहित भिडियो सिर्जना
              </p>
            </div>
          </div>

          {/* Quick Studio Controls: Aspect Ratio, Caption Style, Voice & Export */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Aspect Ratio Selector */}
            <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700">
              {(["16:9", "9:16", "1:1"] as AspectRatio[]).map((ar) => (
                <button
                  key={ar}
                  onClick={() => setProject((prev) => ({ ...prev, aspectRatio: ar }))}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    project.aspectRatio === ar
                      ? "bg-cyan-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>

            {/* Caption Style Dropdown */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={project.captionStyle}
                onChange={(e) =>
                  setProject((prev) => ({ ...prev, captionStyle: e.target.value as CaptionStyle }))
                }
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="modern-glow">Glow Subtitles</option>
                <option value="tiktok-box">TikTok Box</option>
                <option value="karaoke-yellow">Karaoke Yellow</option>
                <option value="cinematic">Cinematic Serif</option>
              </select>
            </div>

            {/* Audio & Voice Settings */}
            <button
              onClick={() => setIsVoiceDrawerOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Voice & Music Settings"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">आवाज र संगीत (Audio)</span>
            </button>

            {/* Export Video Button */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>एक्सपोर्ट (Export Video)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 bg-cyan-950/95 border border-cyan-500/50 text-cyan-200 px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md animate-fade-in">
          <CheckCircle className="w-4 h-4 text-cyan-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Video Prompt Generator Wizard */}
        <PromptWizard
          onGenerate={handleGenerateVideo}
          isLoading={isGenerating}
          onSelectSample={handleSelectSample}
        />

        {/* Video Player & Active Scene Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main: Video Canvas Player */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-md">
                  {project.title}
                </h2>
                <span className="text-xs text-slate-400">
                  Total Duration: ~{totalDurationSec}s • {project.scenes.length} Scenes • Aspect: {project.aspectRatio}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingSceneIndex(currentSceneIndex)}
                  className="px-2.5 py-1 rounded-md bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  दृश्य सम्पादन (Edit Current Scene)
                </button>
              </div>
            </div>

            <VideoPlayer
              scenes={project.scenes}
              currentSceneIndex={currentSceneIndex}
              isPlaying={isPlaying}
              aspectRatio={project.aspectRatio}
              captionStyle={project.captionStyle}
              onSceneChange={(idx) => setCurrentSceneIndex(idx)}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              voiceSettings={project.voiceSettings}
              bgmStyle={project.bgmStyle}
              bgmVolume={project.bgmVolume}
            />
          </div>

          {/* Right: Active Scene Information Card & Voiceover Script */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Active Scene {currentSceneIndex + 1}
              </span>
              <button
                onClick={() => setEditingSceneIndex(currentSceneIndex)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                सम्पादन (Edit)
              </button>
            </div>

            {/* Scene Headline */}
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                Scene Headline
              </span>
              <h3 className="text-base font-bold text-white leading-tight">
                {project.scenes[currentSceneIndex]?.title}
              </h3>
            </div>

            {/* Scene Caption */}
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                On-Screen Subtitle (क्याप्सन)
              </span>
              <p className="text-xs text-slate-200 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 font-medium">
                {project.scenes[currentSceneIndex]?.caption}
              </p>
            </div>

            {/* Scene Voiceover */}
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1 flex items-center justify-between">
                <span>AI Voiceover Script (वाचन पाठ)</span>
                <span className="text-cyan-400 font-mono text-[10px]">
                  {project.scenes[currentSceneIndex]?.duration}s
                </span>
              </span>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed italic">
                "{project.scenes[currentSceneIndex]?.voiceover}"
              </div>
            </div>

            {/* Visual description */}
            <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              <span className="text-slate-300 font-semibold block mb-0.5">Visual Composition:</span>
              Theme: <span className="text-cyan-300">{project.scenes[currentSceneIndex]?.visualTheme}</span> • Motion:{" "}
              <span className="text-indigo-300">{project.scenes[currentSceneIndex]?.motion}</span>
            </div>

            {/* Quick Action: Add More Scenes button */}
            <button
              onClick={handleExpandScenes}
              disabled={isExpanding}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>
                {isExpanding ? "AI ले नयाँ दृश्य थप्दैछ..." : "+ AI द्वारा अझै दृश्य थप्नुहोस् (Make Longer)"}
              </span>
            </button>
          </div>
        </div>

        {/* Storyboard Timeline */}
        <Timeline
          scenes={project.scenes}
          currentSceneIndex={currentSceneIndex}
          onSelectScene={(idx) => setCurrentSceneIndex(idx)}
          onEditScene={(idx) => setEditingSceneIndex(idx)}
          onAddScene={handleAddManualScene}
          onDuplicateScene={handleDuplicateScene}
          onDeleteScene={handleDeleteScene}
          onMoveScene={handleMoveScene}
          onExpandScenes={handleExpandScenes}
          isExpanding={isExpanding}
          voiceSettings={project.voiceSettings}
        />

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-lg bg-cyan-950 text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white">100% Free & Unlimited Length</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              जति लामो भिडियो पनि बनाउन सकिन्छ। "+ AI थप दृश्य" बटन थिचेर नयाँ दृश्यहरू निरन्तर थप्दै जानुहोस्।
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-lg bg-indigo-950 text-indigo-400">
                <Volume2 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white">Automatic AI Voiceover</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              नेपाली तथा अन्तर्राष्ट्रिय आवाजमा स्वचालित स्वर वाचन, गति नियन्त्रण र ब्याकग्राउन्ड संगीत डकिङ।
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-lg bg-emerald-950 text-emerald-400">
                <Download className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white">Instant HD Video Download</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              कुनै वाटरमार्क बिना सिधै एचडी भिडियो (.webm) कम्प्युटर वा मोबाइलमा सित्तैमा डाउनलोड गर्नुहोस्।
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        AI Video Studio • नि:शुल्क स्वचालित आवाज र दृश्य भिडियो निर्माता • Powered by Gemini AI
      </footer>

      {/* Modals */}
      {editingSceneIndex !== null && project.scenes[editingSceneIndex] && (
        <SceneEditorModal
          isOpen={true}
          scene={project.scenes[editingSceneIndex]}
          sceneIndex={editingSceneIndex}
          onClose={() => setEditingSceneIndex(null)}
          onSave={handleSaveScene}
          voiceSettings={project.voiceSettings}
          language={project.language}
        />
      )}

      <VoiceSettingsDrawer
        isOpen={isVoiceDrawerOpen}
        onClose={() => setIsVoiceDrawerOpen(false)}
        voiceSettings={project.voiceSettings}
        onUpdateVoiceSettings={(vs) => setProject((prev) => ({ ...prev, voiceSettings: vs }))}
        bgmStyle={project.bgmStyle}
        onUpdateBGMStyle={(st) => setProject((prev) => ({ ...prev, bgmStyle: st }))}
        bgmVolume={project.bgmVolume}
        onUpdateBGMVolume={(vol) => setProject((prev) => ({ ...prev, bgmVolume: vol }))}
        sampleText={project.scenes[currentSceneIndex]?.voiceover}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        scenes={project.scenes}
        aspectRatio={project.aspectRatio}
        captionStyle={project.captionStyle}
        bgmStyle={project.bgmStyle}
        bgmVolume={project.bgmVolume}
        voiceSettings={project.voiceSettings}
        videoTitle={project.title}
      />
    </div>
  );
}
