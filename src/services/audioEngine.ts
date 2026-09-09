import { BGMStyle, VoiceSettings } from "../types";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgmGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private isBgmPlaying = false;
  private bgmInterval: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.masterGainNode = this.ctx.createGain();
        this.bgmGainNode = this.ctx.createGain();
        this.destinationNode = this.ctx.createMediaStreamDestination();

        this.bgmGainNode.connect(this.masterGainNode);
        this.masterGainNode.connect(this.ctx.destination);
        this.masterGainNode.connect(this.destinationNode);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public getExportAudioStream(): MediaStream | null {
    this.initContext();
    return this.destinationNode ? this.destinationNode.stream : null;
  }

  // Play background music using Web Audio synthesis
  public startBGM(style: BGMStyle, volume: number = 0.25) {
    if (style === "none") {
      this.stopBGM();
      return;
    }

    this.initContext();
    if (!this.ctx || !this.bgmGainNode) return;

    this.stopBGM();
    this.isBgmPlaying = true;
    this.bgmGainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);

    // Chords progression based on selected style
    let chordProgression: number[][];

    if (style === "cinematic-ambient") {
      // D minor / F major / C major / G minor lush cinematic frequencies
      chordProgression = [
        [146.83, 220.0, 261.63, 349.23], // Dm7
        [174.61, 261.63, 329.63, 392.0],  // Fmaj7
        [130.81, 196.0, 261.63, 329.63],  // C
        [196.0, 293.66, 349.23, 440.0],   // G7sus
      ];
    } else if (style === "lofi-chill") {
      // Warm jazz 7th chords
      chordProgression = [
        [164.81, 246.94, 311.13, 392.0], // Emaj7
        [138.59, 207.65, 277.18, 329.63], // C#m7
        [146.83, 220.0, 277.18, 369.99], // F#m7
        [123.47, 185.0, 246.94, 293.66], // Bm7
      ];
    } else {
      // Inspirational pads: C major / G / Am / F
      chordProgression = [
        [130.81, 196.0, 261.63, 392.0],  // C add9
        [146.83, 196.0, 293.66, 392.0],  // G/B
        [110.0, 164.81, 220.0, 329.63],  // Am7
        [174.61, 220.0, 261.63, 349.23], // Fmaj
      ];
    }

    let step = 0;
    const playNextChord = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGainNode) return;
      const notes = chordProgression[step % chordProgression.length];
      step++;

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.bgmGainNode) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(600 + idx * 250, this.ctx.currentTime);

        // Soft pad attack & release envelope (4.5s duration)
        const now = this.ctx.currentTime;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(0.12 / notes.length, now + 1.2);
        noteGain.gain.linearRampToValueAtTime(0.0001, now + 4.8);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.bgmGainNode);

        osc.start(now);
        osc.stop(now + 5.0);
      });
    };

    playNextChord();
    this.bgmInterval = setInterval(playNextChord, 4500);
  }

  // Duck background music volume while voiceover is talking
  public duckBGM(duck: boolean) {
    if (!this.ctx || !this.bgmGainNode || !this.isBgmPlaying) return;
    const now = this.ctx.currentTime;
    const target = duck ? 0.08 : 0.25;
    this.bgmGainNode.gain.cancelScheduledValues(now);
    this.bgmGainNode.gain.linearRampToValueAtTime(target, now + 0.4);
  }

  public setBGMVolume(vol: number) {
    if (!this.ctx || !this.bgmGainNode) return;
    this.bgmGainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  // Text-To-Speech Narration
  public speak(
    text: string,
    settings: VoiceSettings,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onBoundary?: (charIndex: number, word: string) => void;
    },
  ) {
    if (!("speechSynthesis" in window)) {
      callbacks?.onStart?.();
      setTimeout(() => callbacks?.onEnd?.(), 3000);
      return;
    }

    window.speechSynthesis.cancel();

    if (!text || text.trim().length === 0) {
      callbacks?.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Determine appropriate voice
    const voices = window.speechSynthesis.getVoices();
    if (settings.voiceUri) {
      const match = voices.find((v) => v.voiceURI === settings.voiceUri);
      if (match) utterance.voice = match;
    } else {
      // Match best voice for language
      const isNepali = settings.lang.startsWith("ne") || /[\u0900-\u097F]/.test(text);
      let matchVoice: SpeechSynthesisVoice | undefined;

      if (isNepali) {
        matchVoice = voices.find(
          (v) => v.lang.startsWith("ne") || v.lang.startsWith("hi") || v.name.toLowerCase().includes("india") || v.name.toLowerCase().includes("nepal")
        );
      }

      if (!matchVoice) {
        matchVoice = voices.find((v) => v.lang.startsWith(settings.lang.slice(0, 2)));
      }

      if (matchVoice) {
        utterance.voice = matchVoice;
      }
    }

    utterance.rate = settings.rate || 1.0;
    utterance.pitch = settings.pitch || 1.0;
    utterance.volume = settings.volume || 1.0;

    utterance.onstart = () => {
      this.duckBGM(true);
      callbacks?.onStart?.();
    };

    utterance.onboundary = (e) => {
      if (callbacks?.onBoundary) {
        const spokenWord = text.slice(e.charIndex, e.charIndex + (e.charLength || 6));
        callbacks.onBoundary(e.charIndex, spokenWord);
      }
    };

    utterance.onend = () => {
      this.duckBGM(false);
      this.currentUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (err) => {
      console.warn("Speech synthesis error:", err);
      this.duckBGM(false);
      this.currentUtterance = null;
      callbacks?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.duckBGM(false);
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!("speechSynthesis" in window)) return [];
    return window.speechSynthesis.getVoices();
  }
}

export const audioEngine = new AudioEngine();
