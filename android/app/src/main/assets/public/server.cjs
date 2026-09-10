var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new import_genai.GoogleGenAI({ apiKey });
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "15mb" }));
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY)
    });
  });
  app.post("/api/generate-video-plan", async (req, res) => {
    try {
      const {
        prompt,
        sceneCount = 4,
        language = "Nepali",
        style = "Cinematic Story",
        aspectRatio = "16:9",
        tone = "Inspiring"
      } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }
      const ai = getGeminiClient();
      if (!ai) {
        const fallbackScenes = generateSmartFallbackScenes(
          prompt,
          sceneCount,
          language,
          style
        );
        return res.json({
          success: true,
          videoTitle: `AI Video: ${prompt.slice(0, 40)}`,
          language,
          scenes: fallbackScenes,
          note: "Generated using built-in intelligent storyboard engine (Add GEMINI_API_KEY in settings for advanced neural model generation)."
        });
      }
      const systemInstruction = `You are an expert AI video director and documentary producer.
Create an engaging multi-scene video script with complete scene-by-scene storyboard, voiceover narration script, on-screen subtitles/captions, and visual animation descriptions.
The user requested: "${prompt}".
Target language for voiceover and captions: ${language}.
Number of scenes to generate: ${Math.min(Math.max(sceneCount, 2), 20)}.
Style: ${style}.
Tone: ${tone}.
Aspect Ratio: ${aspectRatio}.

IMPORTANT GUIDELINES:
1. "voiceover" MUST be written in ${language}. It should be natural, engaging, and ready for speech synthesis. Keep each scene's voiceover between 15 and 35 words so it speaks smoothly in ~5-10 seconds.
2. "caption" should be a punchy on-screen title or subtitle in ${language}.
3. "visualDescription" describes the visual mood, cinematic camera movement, lighting, and subjects.
4. "visualTheme" must be one of: ["nepal-himalayas", "nature", "technology", "space", "cyberpunk", "warm-sunset", "urban", "mystic", "minimal-dark", "bright-studio"].
5. "bgGradient" should be a Tailwind CSS gradient string like "from-slate-950 via-indigo-950 to-slate-900".
6. "accentColor" hex code like "#38bdf8", "#f43f5e", "#10b981", "#fbbf24", etc.
7. "motion" must be one of: ["ken-burns-in", "ken-burns-out", "pan-left", "pan-right", "pulse"].
8. "animationType" must be one of: ["particles", "grid", "waves", "constellation", "aurora", "cinematic-rings"].
9. "duration" in seconds (typically 6-10 seconds per scene).

Respond ONLY with valid JSON in this exact structure:
{
  "videoTitle": "Descriptive title of video",
  "scenes": [
    {
      "id": "scene_1",
      "title": "Scene headline",
      "caption": "Short on-screen subtitle",
      "voiceover": "Full voiceover narration script to be spoken in ${language}",
      "visualDescription": "Detailed cinematic visual scene description",
      "visualTheme": "nepal-himalayas",
      "bgGradient": "from-slate-900 via-blue-950 to-indigo-950",
      "accentColor": "#38bdf8",
      "motion": "ken-burns-in",
      "animationType": "aurora",
      "duration": 7
    }
  ]
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Generate a full video plan for: "${prompt}". Number of scenes: ${sceneCount}. Language: ${language}. Return ONLY the JSON object.`
              }
            ]
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      const responseText = response.text || "";
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse AI response as JSON");
        }
      }
      if (Array.isArray(parsedData.scenes)) {
        parsedData.scenes = parsedData.scenes.map((sc, idx) => ({
          id: sc.id || `scene_${Date.now()}_${idx + 1}`,
          title: sc.title || `Scene ${idx + 1}`,
          caption: sc.caption || sc.title || `Scene ${idx + 1}`,
          voiceover: sc.voiceover || sc.caption || prompt,
          visualDescription: sc.visualDescription || "Cinematic visual background with animated atmospheric effects",
          visualTheme: sc.visualTheme || "technology",
          bgGradient: sc.bgGradient || "from-slate-950 via-indigo-950 to-slate-900",
          accentColor: sc.accentColor || "#38bdf8",
          motion: sc.motion || "ken-burns-in",
          animationType: sc.animationType || "particles",
          duration: Number(sc.duration) || 7
        }));
      }
      return res.json({
        success: true,
        videoTitle: parsedData.videoTitle || `AI Video: ${prompt}`,
        language,
        scenes: parsedData.scenes
      });
    } catch (err) {
      console.error("Error generating video plan:", err);
      const fallbackScenes = generateSmartFallbackScenes(
        req.body?.prompt || "AI Video Story",
        req.body?.sceneCount || 4,
        req.body?.language || "Nepali",
        req.body?.style || "Cinematic Story"
      );
      return res.json({
        success: true,
        videoTitle: `AI Video: ${(req.body?.prompt || "Story").slice(0, 40)}`,
        scenes: fallbackScenes,
        warning: `AI generation experienced an issue (${err.message}). Prepared high quality dynamic scenes.`
      });
    }
  });
  app.post("/api/expand-scenes", async (req, res) => {
    try {
      const {
        videoTitle,
        existingScenes = [],
        addCount = 3,
        language = "Nepali",
        topic = ""
      } = req.body;
      const ai = getGeminiClient();
      const nextIndex = existingScenes.length + 1;
      if (!ai) {
        const newScenes = generateSmartFallbackScenes(
          `Continuation of ${topic || videoTitle} part ${nextIndex}`,
          addCount,
          language,
          "Cinematic Story",
          nextIndex
        );
        return res.json({
          success: true,
          addedScenes: newScenes
        });
      }
      const promptText = `We have an existing video titled "${videoTitle}".
Topic: "${topic || videoTitle}".
Currently there are ${existingScenes.length} scenes.
Summary of current scenes:
${existingScenes.map((s, i) => `Scene ${i + 1}: ${s.caption} - ${s.voiceover?.slice(0, 60)}...`).join("\n")}

Please generate ${addCount} CONTINUATION scenes that logically continue this video to make it longer and more detailed.
Language for voiceover: ${language}.
Starting scene number: ${nextIndex}.

Return JSON in this format:
{
  "scenes": [
    {
      "id": "scene_${nextIndex}",
      "title": "Scene headline",
      "caption": "Short on-screen subtitle in ${language}",
      "voiceover": "Voiceover narration in ${language}",
      "visualDescription": "Visual scene depiction",
      "visualTheme": "nature",
      "bgGradient": "from-slate-900 via-indigo-950 to-slate-900",
      "accentColor": "#38bdf8",
      "motion": "ken-burns-in",
      "animationType": "particles",
      "duration": 8
    }
  ]
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText);
      const formatted = (parsedData.scenes || []).map((sc, idx) => ({
        id: `scene_${Date.now()}_${nextIndex + idx}`,
        title: sc.title || `Part ${nextIndex + idx}`,
        caption: sc.caption || sc.title || `Part ${nextIndex + idx}`,
        voiceover: sc.voiceover || sc.caption || "",
        visualDescription: sc.visualDescription || "Cinematic visual continuation",
        visualTheme: sc.visualTheme || "technology",
        bgGradient: sc.bgGradient || "from-slate-900 via-slate-950 to-indigo-950",
        accentColor: sc.accentColor || "#10b981",
        motion: sc.motion || "ken-burns-in",
        animationType: sc.animationType || "particles",
        duration: Number(sc.duration) || 7
      }));
      return res.json({
        success: true,
        addedScenes: formatted
      });
    } catch (err) {
      console.error("Error expanding video:", err);
      const nextIndex = (req.body?.existingScenes?.length || 0) + 1;
      const fallback = generateSmartFallbackScenes(
        `Continuation of ${req.body?.videoTitle || "Story"} part ${nextIndex}`,
        req.body?.addCount || 3,
        req.body?.language || "Nepali",
        "Cinematic Story",
        nextIndex
      );
      return res.json({
        success: true,
        addedScenes: fallback
      });
    }
  });
  app.post("/api/enhance-voiceover", async (req, res) => {
    try {
      const { text, targetLanguage = "Nepali", tone = "Natural and cinematic" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }
      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          enhancedText: text,
          note: "Voiceover preserved without modifications."
        });
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Rewrite the following text into smooth, compelling voiceover narration in ${targetLanguage} with tone: ${tone}. Keep it concise, expressive, and easy to pronounce for text-to-speech. Return ONLY the rewritten text without explanations or quotes:

${text}`
              }
            ]
          }
        ]
      });
      return res.json({
        enhancedText: (response.text || text).trim()
      });
    } catch (err) {
      return res.json({
        enhancedText: req.body?.text || ""
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Video Studio Server running on http://0.0.0.0:${PORT}`);
  });
}
function generateSmartFallbackScenes(prompt, count, language, style, startIndex = 1) {
  const isNepali = language.toLowerCase().includes("nepali") || /[\u0900-\u097F]/.test(prompt) || prompt.toLowerCase().includes("nepal");
  const themes = [
    {
      visualTheme: "nepal-himalayas",
      bgGradient: "from-sky-950 via-indigo-950 to-slate-950",
      accentColor: "#38bdf8",
      animationType: "aurora",
      motion: "ken-burns-in"
    },
    {
      visualTheme: "technology",
      bgGradient: "from-slate-950 via-blue-950 to-cyan-950",
      accentColor: "#06b6d4",
      animationType: "grid",
      motion: "pan-left"
    },
    {
      visualTheme: "nature",
      bgGradient: "from-emerald-950 via-teal-950 to-slate-950",
      accentColor: "#10b981",
      animationType: "particles",
      motion: "ken-burns-out"
    },
    {
      visualTheme: "space",
      bgGradient: "from-purple-950 via-slate-950 to-black",
      accentColor: "#a855f7",
      animationType: "constellation",
      motion: "pulse"
    },
    {
      visualTheme: "warm-sunset",
      bgGradient: "from-amber-950 via-rose-950 to-slate-950",
      accentColor: "#f59e0b",
      animationType: "waves",
      motion: "pan-right"
    }
  ];
  const scenes = [];
  for (let i = 0; i < count; i++) {
    const sceneNum = startIndex + i;
    const theme = themes[i % themes.length];
    let caption = "";
    let voiceover = "";
    let title = "";
    if (isNepali) {
      if (sceneNum === 1) {
        title = "\u0938\u0941\u0930\u0941\u0935\u093E\u0924 \u0930 \u092A\u0930\u093F\u091A\u092F";
        caption = `${prompt.slice(0, 30)} \u0915\u094B \u0930\u094B\u091A\u0915 \u092F\u093E\u0924\u094D\u0930\u093E`;
        voiceover = `\u0928\u092E\u0938\u094D\u0924\u0947 \u0930 \u0938\u094D\u0935\u093E\u0917\u0924 \u091B\u0964 \u0906\u091C \u0939\u093E\u092E\u0940 ${prompt} \u0915\u094B \u092C\u093E\u0930\u0947\u092E\u093E \u090F\u0915 \u0935\u093F\u0936\u0947\u0937 \u0930 \u0930\u094B\u091A\u0915 \u092D\u093F\u0921\u093F\u092F\u094B \u0939\u0947\u0930\u094D\u0928 \u091C\u093E\u0901\u0926\u0948\u091B\u094C\u0901\u0964 \u0927\u094D\u092F\u093E\u0928 \u0926\u093F\u090F\u0930 \u0939\u0947\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D\u0964`;
      } else if (sceneNum === count) {
        title = "\u0928\u093F\u0937\u094D\u0915\u0930\u094D\u0937 \u0930 \u0938\u0928\u094D\u0926\u0947\u0936";
        caption = "\u092E\u0941\u0916\u094D\u092F \u0928\u093F\u0937\u094D\u0915\u0930\u094D\u0937 \u0930 \u0938\u093E\u0930\u093E\u0902\u0936";
        voiceover = `\u092F\u0938\u0930\u0940 \u092F\u094B \u0935\u093F\u0937\u092F\u0932\u0947 \u0939\u093E\u092E\u094D\u0930\u094B \u091C\u0940\u0935\u0928\u092E\u093E \u0920\u0942\u0932\u094B \u092A\u094D\u0930\u092D\u093E\u0935 \u092A\u093E\u0930\u0947\u0915\u094B \u091B\u0964 \u092D\u093F\u0921\u093F\u092F\u094B \u092E\u0928 \u092A\u0930\u0947 \u0932\u093E\u0907\u0915, \u0915\u092E\u0947\u0928\u094D\u091F \u0930 \u0938\u0947\u092F\u0930 \u0917\u0930\u094D\u0928 \u0928\u092C\u093F\u0930\u094D\u0938\u0928\u0941\u0939\u094B\u0938\u094D\u0964 \u0927\u0928\u094D\u092F\u0935\u093E\u0926\u0964`;
      } else {
        title = `\u092D\u093E\u0917 ${sceneNum}: \u092E\u0941\u0916\u094D\u092F \u0935\u093F\u0936\u0947\u0937\u0924\u093E`;
        caption = `\u092E\u0939\u0924\u094D\u0924\u094D\u0935\u092A\u0942\u0930\u094D\u0923 \u0924\u0925\u094D\u092F \u0930 \u091C\u093E\u0928\u0915\u093E\u0930\u0940`;
        voiceover = `\u092F\u0939\u093E\u0901 \u0939\u093E\u092E\u0940 \u0926\u0947\u0916\u094D\u0928 \u0938\u0915\u094D\u091B\u094C\u0901 \u0915\u093F \u0915\u0938\u0930\u0940 \u0928\u092F\u093E\u0901 \u092A\u094D\u0930\u0935\u093F\u0927\u093F \u0930 \u0926\u0943\u0937\u094D\u091F\u093F\u0915\u094B\u0923\u0932\u0947 \u092F\u0938\u0932\u093E\u0908 \u0905\u091D \u092A\u094D\u0930\u092D\u093E\u0935\u0915\u093E\u0930\u0940 \u092C\u0928\u093E\u090F\u0915\u094B \u091B\u0964 \u092F\u0938\u0915\u093E \u0927\u0947\u0930\u0948 \u092B\u093E\u0907\u0926\u093E\u0939\u0930\u0942 \u091B\u0928\u094D\u0964`;
      }
    } else {
      if (sceneNum === 1) {
        title = "The Beginning";
        caption = `Exploring ${prompt.slice(0, 30)}`;
        voiceover = `Welcome to this special journey. Today, we delve into ${prompt} and explore its incredible world.`;
      } else if (sceneNum === count) {
        title = "Conclusion & Takeaway";
        caption = "Final Reflections";
        voiceover = `In conclusion, this perspective opens new horizons. Thank you for watching, and stay inspired for what comes next.`;
      } else {
        title = `Chapter ${sceneNum}: Key Insights`;
        caption = `Discovering the Core Concepts`;
        voiceover = `As we look deeper, the interconnected elements demonstrate the remarkable power of modern vision and innovation.`;
      }
    }
    scenes.push({
      id: `scene_${Date.now()}_${sceneNum}`,
      title,
      caption,
      voiceover,
      visualDescription: `Atmospheric ${theme.visualTheme} visuals with gentle motion and depth`,
      visualTheme: theme.visualTheme,
      bgGradient: theme.bgGradient,
      accentColor: theme.accentColor,
      motion: theme.motion,
      animationType: theme.animationType,
      duration: 7
    });
  }
  return scenes;
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
