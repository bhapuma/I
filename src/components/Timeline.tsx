import React from "react";
import { Scene } from "../types";
import { Plus, Trash2, Copy, ArrowLeft, ArrowRight, Edit3, Volume2, Sparkles, Clock } from "lucide-react";
import { audioEngine } from "../services/audioEngine";

interface TimelineProps {
  scenes: Scene[];
  currentSceneIndex: number;
  onSelectScene: (index: number) => void;
  onEditScene: (index: number) => void;
  onAddScene: () => void;
  onDuplicateScene: (index: number) => void;
  onDeleteScene: (index: number) => void;
  onMoveScene: (index: number, direction: "left" | "right") => void;
  onExpandScenes: () => void;
  isExpanding: boolean;
  voiceSettings: any;
}

export const Timeline: React.FC<TimelineProps> = ({
  scenes,
  currentSceneIndex,
  onSelectScene,
  onEditScene,
  onAddScene,
  onDuplicateScene,
  onDeleteScene,
  onMoveScene,
  onExpandScenes,
  isExpanding,
  voiceSettings,
}) => {
  const totalDurationSec = scenes.reduce((acc, s) => acc + (s.duration || 7), 0);
  const minutes = Math.floor(totalDurationSec / 60);
  const seconds = totalDurationSec % 60;
  const timeFormatted = `${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`;

  const handleTestVoice = (e: React.MouseEvent, voiceover: string) => {
    e.stopPropagation();
    audioEngine.speak(voiceover, voiceSettings);
  };

  return (
    <div id="video-timeline-container" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      {/* Timeline Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <h3 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
            Timeline Storyboard
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
              {scenes.length} Scenes
            </span>
          </h3>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full font-mono">
            <Clock className="w-3 h-3 text-cyan-400" /> {timeFormatted}
          </span>
        </div>

        {/* Action Buttons: Add scene & AI Expand */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExpandScenes}
            disabled={isExpanding}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md hover:shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer"
            title="Automatically add continuation scenes to make video longer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isExpanding ? "Expanding..." : "+ AI थप दृश्य (Expand Video)"}
          </button>

          <button
            onClick={onAddScene}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> नयाँ दृश्य (+ Scene)
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Scenes Track */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
        {scenes.map((scene, idx) => {
          const isSelected = idx === currentSceneIndex;
          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(idx)}
              className={`relative flex-shrink-0 w-64 rounded-xl p-3 border transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? "bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/30"
                  : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700"
              }`}
            >
              {/* Scene Card Header */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[110px]" title={scene.title}>
                    {scene.title}
                  </span>
                </div>

                <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  {scene.duration}s
                </span>
              </div>

              {/* Scene Visual Preview Pill */}
              <div
                className="h-16 w-full rounded-lg mb-2 relative overflow-hidden flex flex-col justify-end p-2 border border-white/10"
                style={{
                  background: scene.customImageUrl
                    ? `url(${scene.customImageUrl}) center/cover`
                    : `linear-gradient(135deg, ${scene.accentColor || "#38bdf8"}22, #020617)`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <span className="relative text-[10px] text-cyan-300 font-medium truncate uppercase tracking-wider">
                  {scene.visualTheme} • {scene.motion}
                </span>
                <p className="relative text-xs text-white font-medium truncate drop-shadow">
                  {scene.caption}
                </p>
              </div>

              {/* Voiceover Script Preview */}
              <p className="text-xs text-slate-300 line-clamp-2 italic mb-3 bg-slate-900/60 p-1.5 rounded border border-slate-850">
                "{scene.voiceover}"
              </p>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-slate-400">
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleTestVoice(e, scene.voiceover)}
                    className="p-1 rounded hover:bg-slate-700 hover:text-cyan-400 transition-colors"
                    title="Play voiceover preview"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditScene(idx);
                    }}
                    className="p-1 rounded hover:bg-slate-700 hover:text-indigo-300 transition-colors"
                    title="Edit scene details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateScene(idx);
                    }}
                    className="p-1 rounded hover:bg-slate-700 hover:text-indigo-300 transition-colors"
                    title="Duplicate scene"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveScene(idx, "left");
                    }}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
                    title="Move earlier"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveScene(idx, "right");
                    }}
                    disabled={idx === scenes.length - 1}
                    className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
                    title="Move later"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScene(idx);
                    }}
                    disabled={scenes.length <= 1}
                    className="p-1 rounded hover:bg-rose-950/60 hover:text-rose-400 disabled:opacity-30 transition-colors ml-1"
                    title="Delete scene"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Quick Add Button at end of timeline */}
        <button
          onClick={onAddScene}
          className="flex-shrink-0 w-36 rounded-xl border-2 border-dashed border-slate-700/80 hover:border-indigo-500/80 bg-slate-950/40 hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-300 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer p-4 group"
        >
          <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-indigo-600/30 flex items-center justify-center transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-center">+ थप्नुहोस् (Add)</span>
        </button>
      </div>
    </div>
  );
};
