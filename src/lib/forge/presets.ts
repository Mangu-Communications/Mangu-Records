import { DEFAULT_FX, type DrumSample, type SynthPatch, type TrackKind } from "./types.ts";

function osc(
  type: SynthPatch["osc1"]["type"],
  mix: number,
  detune = 0,
  octave: SynthPatch["osc1"]["octave"] = 0,
): SynthPatch["osc1"] {
  return { type, mix, detune, octave };
}

export const SYNTH_PRESETS: SynthPatch[] = [
  {
    id: "analog-bass",
    name: "Analog Bass",
    category: "bass",
    osc1: osc("sawtooth", 0.7, 0, -1),
    osc2: osc("square", 0.35, 6, -1),
    filter: { type: "lowpass", cutoff: 420, res: 6.5, envAmt: 0.55 },
    env: { a: 0.01, d: 0.18, s: 0.7, r: 0.12 },
    filterEnv: { a: 0.01, d: 0.22, s: 0.2, r: 0.1 },
    lfo: { rate: 0.2, amt: 0, dest: "filter" },
    gain: 0.55,
    drive: 0.18,
  },
  {
    id: "sub-bass",
    name: "Sub",
    category: "bass",
    osc1: osc("sine", 0.9, 0, -2),
    osc2: osc("triangle", 0.25, 0, -1),
    filter: { type: "lowpass", cutoff: 180, res: 0.4, envAmt: 0.1 },
    env: { a: 0.005, d: 0.12, s: 0.85, r: 0.16 },
    filterEnv: { a: 0.01, d: 0.1, s: 0.4, r: 0.1 },
    lfo: { rate: 0.1, amt: 0, dest: "pitch" },
    gain: 0.7,
    drive: 0.05,
  },
  {
    id: "warm-pad",
    name: "Warm Pad",
    category: "pad",
    osc1: osc("sawtooth", 0.55, -8, 0),
    osc2: osc("sawtooth", 0.55, 9, 0),
    filter: { type: "lowpass", cutoff: 1100, res: 1.2, envAmt: 0.35 },
    env: { a: 0.55, d: 0.8, s: 0.75, r: 1.4 },
    filterEnv: { a: 0.7, d: 1.1, s: 0.5, r: 1.2 },
    lfo: { rate: 0.18, amt: 0.22, dest: "filter" },
    gain: 0.28,
    drive: 0.04,
  },
  {
    id: "air-pad",
    name: "Air Pad",
    category: "pad",
    osc1: osc("triangle", 0.5, -6, 1),
    osc2: osc("sine", 0.45, 7, 1),
    filter: { type: "lowpass", cutoff: 2400, res: 0.6, envAmt: 0.25 },
    env: { a: 0.9, d: 1.2, s: 0.7, r: 2.0 },
    filterEnv: { a: 1.1, d: 1.4, s: 0.6, r: 1.8 },
    lfo: { rate: 0.12, amt: 0.3, dest: "filter" },
    gain: 0.24,
    drive: 0,
  },
  {
    id: "glass-lead",
    name: "Glass Lead",
    category: "lead",
    osc1: osc("triangle", 0.7, 0, 1),
    osc2: osc("sine", 0.4, 4, 2),
    filter: { type: "lowpass", cutoff: 3200, res: 2.4, envAmt: 0.2 },
    env: { a: 0.02, d: 0.22, s: 0.65, r: 0.28 },
    filterEnv: { a: 0.01, d: 0.18, s: 0.4, r: 0.2 },
    lfo: { rate: 5.5, amt: 0.08, dest: "pitch" },
    gain: 0.32,
    drive: 0.02,
  },
  {
    id: "pluck",
    name: "Pluck",
    category: "pluck",
    osc1: osc("sawtooth", 0.6, 0, 0),
    osc2: osc("square", 0.3, -7, 0),
    filter: { type: "lowpass", cutoff: 1800, res: 4.2, envAmt: 0.7 },
    env: { a: 0.004, d: 0.28, s: 0.05, r: 0.18 },
    filterEnv: { a: 0.004, d: 0.22, s: 0.05, r: 0.12 },
    lfo: { rate: 0.4, amt: 0, dest: "filter" },
    gain: 0.38,
    drive: 0.08,
  },
  {
    id: "brass",
    name: "Brass Stab",
    category: "lead",
    osc1: osc("sawtooth", 0.7, -5, 0),
    osc2: osc("sawtooth", 0.55, 8, 0),
    filter: { type: "lowpass", cutoff: 900, res: 3.5, envAmt: 0.62 },
    env: { a: 0.04, d: 0.16, s: 0.55, r: 0.22 },
    filterEnv: { a: 0.03, d: 0.2, s: 0.25, r: 0.18 },
    lfo: { rate: 0.3, amt: 0.05, dest: "filter" },
    gain: 0.34,
    drive: 0.16,
  },
  {
    id: "choir",
    name: "Choir Vox",
    category: "vox",
    osc1: osc("sawtooth", 0.4, -10, 0),
    osc2: osc("square", 0.35, 12, 0),
    filter: { type: "bandpass", cutoff: 780, res: 4.8, envAmt: 0.15 },
    env: { a: 0.28, d: 0.4, s: 0.8, r: 0.7 },
    filterEnv: { a: 0.35, d: 0.5, s: 0.7, r: 0.6 },
    lfo: { rate: 5.2, amt: 0.12, dest: "pitch" },
    gain: 0.3,
    drive: 0.02,
  },
  {
    id: "fm-bell",
    name: "FM Bell",
    category: "bell",
    osc1: osc("sine", 0.7, 0, 1),
    osc2: osc("sine", 0.55, 0, 2),
    filter: { type: "lowpass", cutoff: 5400, res: 1.1, envAmt: 0.3 },
    env: { a: 0.002, d: 1.4, s: 0.12, r: 1.6 },
    filterEnv: { a: 0.002, d: 0.8, s: 0.1, r: 1.2 },
    lfo: { rate: 3.2, amt: 0.06, dest: "pitch" },
    gain: 0.28,
    drive: 0,
  },
  {
    id: "keys",
    name: "Studio Keys",
    category: "keys",
    osc1: osc("triangle", 0.65, -3, 0),
    osc2: osc("sine", 0.4, 4, 1),
    filter: { type: "lowpass", cutoff: 2600, res: 0.8, envAmt: 0.22 },
    env: { a: 0.008, d: 0.45, s: 0.55, r: 0.4 },
    filterEnv: { a: 0.01, d: 0.35, s: 0.4, r: 0.3 },
    lfo: { rate: 0.25, amt: 0.04, dest: "filter" },
    gain: 0.36,
    drive: 0.03,
  },
  {
    id: "noise-riser",
    name: "Noise Riser",
    category: "fx",
    osc1: osc("noise", 0.85, 0, 0),
    osc2: osc("sawtooth", 0.15, 0, -2),
    filter: { type: "highpass", cutoff: 600, res: 1.6, envAmt: 0.7 },
    env: { a: 1.6, d: 0.4, s: 0.7, r: 0.4 },
    filterEnv: { a: 2.0, d: 0.2, s: 0.8, r: 0.3 },
    lfo: { rate: 8, amt: 0.15, dest: "filter" },
    gain: 0.22,
    drive: 0.1,
  },
  {
    id: "dark-lead",
    name: "Dark Lead",
    category: "lead",
    osc1: osc("square", 0.6, 0, 0),
    osc2: osc("sawtooth", 0.4, 11, 0),
    filter: { type: "lowpass", cutoff: 720, res: 5.5, envAmt: 0.45 },
    env: { a: 0.03, d: 0.2, s: 0.6, r: 0.3 },
    filterEnv: { a: 0.02, d: 0.25, s: 0.3, r: 0.22 },
    lfo: { rate: 0.7, amt: 0.18, dest: "filter" },
    gain: 0.33,
    drive: 0.22,
  },
];

export const DRUM_ROWS: { sample: DrumSample; label: string }[] = [
  { sample: "kick", label: "Kick" },
  { sample: "snare", label: "Snare" },
  { sample: "clap", label: "Clap" },
  { sample: "hat", label: "Hat" },
  { sample: "openhat", label: "Open" },
  { sample: "rim", label: "Rim" },
  { sample: "tom", label: "Tom" },
  { sample: "perc", label: "Perc" },
  { sample: "ride", label: "Ride" },
];

export const KIND_INSTRUMENT: Record<TrackKind, string> = {
  drums: "kit",
  bass: "analog-bass",
  pad: "warm-pad",
  lead: "glass-lead",
  keys: "keys",
  voice: "choir",
  fx: "noise-riser",
  sample: "sample",
};

const PATCH_REGISTRY = new Map<string, SynthPatch>();
for (const p of SYNTH_PRESETS) PATCH_REGISTRY.set(p.id, p);

export function registerPatch(patch: SynthPatch) {
  PATCH_REGISTRY.set(patch.id, patch);
}

export function patchById(id: string): SynthPatch {
  return PATCH_REGISTRY.get(id) ?? SYNTH_PRESETS[0]!;
}

export function defaultFxFor(kind: TrackKind) {
  if (kind === "pad" || kind === "voice") return { ...DEFAULT_FX, reverb: 0.42, delay: 0.08, reverbType: "hall" as const };
  if (kind === "lead") return { ...DEFAULT_FX, delay: 0.18, delayFb: 0.32, reverb: 0.22, reverbType: "plate" as const };
  if (kind === "drums") return { ...DEFAULT_FX, reverb: 0.08, filterCutoff: 16000, reverbType: "room" as const };
  if (kind === "fx") return { ...DEFAULT_FX, reverb: 0.5, delay: 0.12, reverbType: "hall" as const };
  return { ...DEFAULT_FX };
}

export const STUDIO_VOICES = [
  { id: "eve", name: "Eve", color: "Intimate, close" },
  { id: "leo", name: "Leo", color: "Warm baritone" },
  { id: "ara", name: "Ara", color: "Bright, present" },
  { id: "aurora", name: "Aurora", color: "Airy, high" },
  { id: "atlas", name: "Atlas", color: "Deep, grounded" },
  { id: "lumen", name: "Lumen", color: "Narrator" },
  { id: "sirius", name: "Sirius", color: "Sharp, dry" },
  { id: "luna", name: "Luna", color: "Soft, night" },
  { id: "orion", name: "Orion", color: "Cinematic" },
  { id: "iris", name: "Iris", color: "Light, clear" },
] as const;
