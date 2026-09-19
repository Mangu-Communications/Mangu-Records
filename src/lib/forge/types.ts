export type OscType = "sine" | "square" | "sawtooth" | "triangle" | "noise";
export type FilterType = "lowpass" | "highpass" | "bandpass" | "notch";
export type LfoDest = "pitch" | "filter" | "amp";
export type ScaleName = "major" | "minor" | "dorian" | "phrygian" | "mixolydian" | "harmonic-minor";
export type TrackKind = "drums" | "bass" | "pad" | "lead" | "keys" | "voice" | "fx" | "sample";
export type DrumSample =
  | "kick"
  | "snare"
  | "clap"
  | "hat"
  | "openhat"
  | "tom"
  | "ride"
  | "perc"
  | "rim";
export type ViewId = "arrange" | "mixer" | "sound" | "voice" | "compose";
export type BitDepth = 16 | 24 | 32;
export type SampleRate = 44100 | 48000 | 96000;

export interface Adsr {
  a: number;
  d: number;
  s: number;
  r: number;
}

export interface OscPatch {
  type: OscType;
  detune: number;
  mix: number;
  octave: -2 | -1 | 0 | 1 | 2;
}

export interface SynthPatch {
  id: string;
  name: string;
  category: "bass" | "pad" | "lead" | "keys" | "pluck" | "vox" | "fx" | "bell";
  osc1: OscPatch;
  osc2: OscPatch;
  filter: { type: FilterType; cutoff: number; res: number; envAmt: number };
  env: Adsr;
  filterEnv: Adsr;
  lfo: { rate: number; amt: number; dest: LfoDest };
  gain: number;
  drive: number;
}

export interface FxParams {
  filterCutoff: number;
  filterRes: number;
  filterType: FilterType;
  delay: number;
  delayFb: number;
  delaySync: boolean;
  reverb: number;
  reverbType: "room" | "hall" | "plate" | "spring";
  drive: number;
  chorus: number;
  compress: number;
}

export interface Note {
  id: string;
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
}

export interface DrumHit {
  id: string;
  sample: DrumSample;
  start: number;
  velocity: number;
  probability?: number;
}

export interface VoiceClip {
  id: string;
  name: string;
  voiceId: string;
  text: string;
  start: number;
  duration: number;
}

export interface Track {
  id: string;
  name: string;
  kind: TrackKind;
  instrumentId: string;
  mute: boolean;
  solo: boolean;
  volume: number;
  pan: number;
  notes: Note[];
  drums: DrumHit[];
  voices: VoiceClip[];
  sampleId?: string;
  fx: FxParams;
  color?: string;
}

export interface ExportSettings {
  sampleRate: SampleRate;
  bitDepth: BitDepth;
  normalize: boolean;
  includeTail: boolean;
  dither: boolean;
  stems: boolean;
}

export interface ClipReport {
  peak: number;
  rms: number;
  clippedSamples: number;
  durationSec: number;
  sampleRate: number;
  bitDepth: BitDepth;
}

export interface Project {
  id: string;
  name: string;
  bpm: number;
  key: string;
  scale: ScaleName;
  bars: number;
  swing: number;
  masterVolume: number;
  tracks: Track[];
  updatedAt: number;
  loop: boolean;
  metronome: boolean;
  timeNumerator: number;
  timeDenominator: number;
}

export const DEFAULT_FX: FxParams = {
  filterCutoff: 18000,
  filterRes: 0.4,
  filterType: "lowpass",
  delay: 0,
  delayFb: 0.35,
  delaySync: true,
  reverb: 0.18,
  reverbType: "room",
  drive: 0,
  chorus: 0,
  compress: 0,
};

export const DEFAULT_EXPORT: ExportSettings = {
  sampleRate: 44100,
  bitDepth: 16,
  normalize: false,
  includeTail: true,
  dither: true,
  stems: false,
};

export const STEPS_PER_BEAT = 4;
export const BEATS_PER_BAR = 4;
export const PX_PER_BEAT = 48;

export function stepsFor(bars: number): number {
  return bars * BEATS_PER_BAR * STEPS_PER_BEAT;
}

export function beatDuration(bpm: number): number {
  return 60 / Math.max(20, bpm);
}

export function projectDurationSec(project: Project): number {
  return project.bars * BEATS_PER_BAR * beatDuration(project.bpm);
}

export function normalizeProject(raw: Partial<Project> & { tracks?: Track[] }): Project | null {
  if (!raw || !Array.isArray(raw.tracks) || raw.tracks.length === 0) return null;
  const tracks = raw.tracks.map((t) => ({
    ...t,
    mute: Boolean(t.mute),
    solo: Boolean(t.solo),
    volume: Number.isFinite(t.volume) ? t.volume : 0.75,
    pan: Number.isFinite(t.pan) ? t.pan : 0,
    notes: Array.isArray(t.notes) ? t.notes : [],
    drums: Array.isArray(t.drums) ? t.drums : [],
    voices: Array.isArray(t.voices) ? t.voices : [],
    fx: { ...DEFAULT_FX, ...(t.fx ?? {}) },
  }));
  return {
    id: raw.id || "proj",
    name: raw.name || "Untitled Session",
    bpm: Math.min(200, Math.max(48, Number(raw.bpm) || 110)),
    key: raw.key || "A",
    scale: raw.scale || "minor",
    bars: Math.min(16, Math.max(4, Number(raw.bars) || 8)),
    swing: Number.isFinite(raw.swing) ? Number(raw.swing) : 0,
    masterVolume: Number.isFinite(raw.masterVolume) ? Number(raw.masterVolume) : 0.85,
    tracks,
    updatedAt: raw.updatedAt || Date.now(),
    loop: raw.loop !== false,
    metronome: Boolean(raw.metronome),
    timeNumerator: raw.timeNumerator || 4,
    timeDenominator: raw.timeDenominator || 4,
  };
}
