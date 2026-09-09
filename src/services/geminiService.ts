import { Scene } from "../types";

export interface GenerateVideoPlanParams {
  prompt: string;
  sceneCount: number;
  language: string;
  style: string;
  aspectRatio: string;
  tone: string;
}

export async function generateVideoPlan(params: GenerateVideoPlanParams): Promise<{
  videoTitle: string;
  scenes: Scene[];
  note?: string;
  warning?: string;
}> {
  const response = await fetch("/api/generate-video-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate video plan: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function expandVideoScenes(params: {
  videoTitle: string;
  topic: string;
  existingScenes: Scene[];
  addCount: number;
  language: string;
}): Promise<Scene[]> {
  const response = await fetch("/api/expand-scenes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to expand video scenes: ${response.statusText}`);
  }

  const data = await response.json();
  return data.addedScenes || [];
}

export async function enhanceVoiceover(params: {
  text: string;
  targetLanguage: string;
  tone?: string;
}): Promise<string> {
  const response = await fetch("/api/enhance-voiceover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    return params.text;
  }

  const data = await response.json();
  return data.enhancedText || params.text;
}
