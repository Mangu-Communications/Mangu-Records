import { uid } from "../utils.ts";
import { generateArrangement } from "./compose-local.ts";
import { defaultFxFor, SYNTH_PRESETS } from "./presets.ts";
import type { DrumSample, Project, ScaleName, SynthPatch, Track, TrackKind } from "./types.ts";
import { DEFAULT_FX } from "./types.ts";

const KINDS: TrackKind[] = ["drums", "bass", "pad", "lead", "keys", "voice", "fx"];
const SCALES: ScaleName[] = ["major", "minor", "dorian", "phrygian", "mixolydian", "harmonic-minor"];
const DRUMS: DrumSample[] = ["kick", "snare", "clap", "hat", "openhat", "tom", "ride", "perc", "rim"];
const INST = new Set(SYNTH_PRESETS.map((p) => p.id));

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

export function arrangementToProject(raw: unknown): Project | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const tracksIn = Array.isArray(o.tracks) ? o.tracks : [];
  if (!tracksIn.length) return null;
  const scale = SCALES.includes(o.scale as ScaleName) ? (o.scale as ScaleName) : "minor";
  const tracks: Track[] = [];
  for (const item of tracksIn.slice(0, 8)) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    const kind = KINDS.includes(t.kind as TrackKind) ? (t.kind as TrackKind) : "lead";
    let instrumentId = str(t.instrumentId, kind === "drums" ? "kit" : "warm-pad");
    if (kind !== "drums" && !INST.has(instrumentId)) {
      instrumentId = kind === "bass" ? "analog-bass" : kind === "pad" ? "warm-pad" : "glass-lead";
    }
    const drums = Array.isArray(t.drums)
      ? t.drums
          .map((h, i) => {
            if (!h || typeof h !== "object") return null;
            const hh = h as Record<string, unknown>;
            const sample = DRUMS.includes(hh.sample as DrumSample) ? (hh.sample as DrumSample) : null;
            if (!sample) return null;
            return {
              id: uid("hit"),
              sample,
              start: num(hh.start, i * 0.25, 0, 63.75),
              velocity: num(hh.velocity, 0.8, 0.05, 1),
            };
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
      : [];
    const notes = Array.isArray(t.notes)
      ? t.notes
          .map((n, i) => {
            if (!n || typeof n !== "object") return null;
            const nn = n as Record<string, unknown>;
            return {
              id: uid("n"),
              pitch: Math.round(num(nn.pitch, 60, 24, 96)),
              start: num(nn.start, i * 0.5, 0, 63),
              duration: num(nn.duration, 0.5, 0.1, 16),
              velocity: num(nn.velocity, 0.7, 0.05, 1),
            };
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
      : [];
    tracks.push({
      id: uid("tr"),
      name: str(t.name, kind),
      kind,
      instrumentId,
      mute: false,
      solo: false,
      volume: num(t.volume, 0.72, 0, 1),
      pan: num(t.pan, 0, -1, 1),
      notes,
      drums,
      voices: [],
      fx: defaultFxFor(kind),
    });
  }
  if (!tracks.length) return null;
  return {
    id: uid("proj"),
    name: str(o.title, "Composed Session"),
    bpm: Math.round(num(o.bpm, 100, 60, 180)),
    key: str(o.key, "A").slice(0, 2),
    scale,
    bars: 8,
    swing: 0,
    masterVolume: 0.85,
    updatedAt: Date.now(),
    loop: true,
    metronome: false,
    timeNumerator: 4,
    timeDenominator: 4,
    tracks,
  };
}

export function localCompose(prompt: string): Project {
  return generateArrangement(prompt);
}

const OSC = ["sine", "square", "sawtooth", "triangle", "noise"] as const;

export function localDesignSound(prompt: string): SynthPatch {
  const p = prompt.toLowerCase();
  let base = SYNTH_PRESETS.find((x) => x.id === "warm-pad")!;
  if (/(bass|sub|808)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "analog-bass")!;
  else if (/(pluck|guitar|harp)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "pluck")!;
  else if (/(bell|chime|crystal)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "fm-bell")!;
  else if (/(choir|vox|voice|ah)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "choir")!;
  else if (/(lead|solo|scream)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "dark-lead")!;
  else if (/(brass|horn|stab)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "brass")!;
  else if (/(noise|riser|whoosh|fx)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "noise-riser")!;
  else if (/(key|piano|ep)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "keys")!;
  else if (/(air|pad|warm|soft)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "air-pad")!;
  const patch: SynthPatch = JSON.parse(JSON.stringify(base)) as SynthPatch;
  patch.id = uid("patch");
  patch.name = prompt.slice(0, 28) || base.name;
  if (/bright|sharp|harsh/.test(p)) patch.filter.cutoff = Math.min(12000, patch.filter.cutoff * 1.8);
  if (/dark|warm|muffled|dull/.test(p)) patch.filter.cutoff = Math.max(120, patch.filter.cutoff * 0.55);
  if (/long|pad|wash/.test(p)) {
    patch.env.a = Math.max(patch.env.a, 0.4);
    patch.env.r = Math.max(patch.env.r, 1.1);
  }
  if (/pluck|short|tight/.test(p)) {
    patch.env.a = 0.004;
    patch.env.s = 0.08;
    patch.env.d = 0.22;
  }
  if (/distort|drive|grit/.test(p)) patch.drive = Math.min(0.55, patch.drive + 0.25);
  if (/detune|wide|chorus/.test(p)) {
    patch.osc1.detune = -12;
    patch.osc2.detune = 14;
  }
  void OSC;
  void DEFAULT_FX;
  return patch;
}

export function coercePatch(raw: unknown): SynthPatch | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const osc = (v: unknown, fallback: SynthPatch["osc1"]): SynthPatch["osc1"] => {
    if (!v || typeof v !== "object") return fallback;
    const x = v as Record<string, unknown>;
    const type = OSC.includes(x.type as (typeof OSC)[number]) ? (x.type as SynthPatch["osc1"]["type"]) : fallback.type;
    const octaveRaw = num(x.octave, fallback.octave, -2, 2);
    const octave = ([-2, -1, 0, 1, 2].includes(octaveRaw) ? octaveRaw : 0) as -2 | -1 | 0 | 1 | 2;
    return {
      type,
      detune: num(x.detune, fallback.detune, -24, 24),
      mix: num(x.mix, fallback.mix, 0, 1),
      octave,
    };
  };
  const env = (v: unknown, fb: SynthPatch["env"]): SynthPatch["env"] => {
    if (!v || typeof v !== "object") return fb;
    const x = v as Record<string, unknown>;
    return {
      a: num(x.a, fb.a, 0, 3),
      d: num(x.d, fb.d, 0, 3),
      s: num(x.s, fb.s, 0, 1),
      r: num(x.r, fb.r, 0, 4),
    };
  };
  const base = SYNTH_PRESETS[0]!;
  const filter = (o.filter as Record<string, unknown> | undefined) ?? {};
  const lfo = (o.lfo as Record<string, unknown> | undefined) ?? {};
  return {
    id: uid("patch"),
    name: str(o.name, "Designed Patch"),
    category: (["bass", "pad", "lead", "keys", "pluck", "vox", "fx", "bell"].includes(o.category as string)
      ? o.category
      : "lead") as SynthPatch["category"],
    osc1: osc(o.osc1, base.osc1),
    osc2: osc(o.osc2, base.osc2),
    filter: {
      type: (["lowpass", "highpass", "bandpass", "notch"].includes(filter.type as string)
        ? filter.type
        : "lowpass") as SynthPatch["filter"]["type"],
      cutoff: num(filter.cutoff, 1200, 80, 16000),
      res: num(filter.res, 1, 0.0001, 16),
      envAmt: num(filter.envAmt, 0.3, 0, 1),
    },
    env: env(o.env, base.env),
    filterEnv: env(o.filterEnv, base.filterEnv),
    lfo: {
      rate: num(lfo.rate, 0.4, 0.05, 16),
      amt: num(lfo.amt, 0, 0, 1),
      dest: (["pitch", "filter", "amp"].includes(lfo.dest as string) ? lfo.dest : "filter") as SynthPatch["lfo"]["dest"],
    },
    gain: num(o.gain, 0.35, 0.05, 0.9),
    drive: num(o.drive, 0, 0, 0.7),
  };
}
