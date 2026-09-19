import { uid } from "../utils.ts";
import { defaultFxFor } from "./presets.ts";
import { degreeMidi } from "./theory.ts";
import type { DrumHit, DrumSample, Note, Project, ScaleName, Track, TrackKind } from "./types.ts";

function n(pitch: number, start: number, duration: number, velocity = 0.75): Note {
  return { id: uid("n"), pitch, start, duration, velocity };
}
function d(sample: DrumSample, start: number, velocity = 0.85): DrumHit {
  return { id: uid("hit"), sample, start, velocity };
}

function track(name: string, kind: TrackKind, instrumentId: string, extra: Partial<Track> = {}): Track {
  return {
    id: uid("tr"),
    name,
    kind,
    instrumentId,
    mute: false,
    solo: false,
    volume: kind === "drums" ? 0.86 : kind === "bass" ? 0.78 : kind === "pad" ? 0.6 : 0.68,
    pan: 0,
    notes: [],
    drums: [],
    voices: [],
    fx: defaultFxFor(kind),
    ...extra,
  };
}

type Style = "cinematic" | "house" | "trap" | "ambient" | "techno" | "song";

function detectStyle(prompt: string): Style {
  const p = prompt.toLowerCase();
  if (/(house|club|disco|dance)/.test(p)) return "house";
  if (/(trap|808|hip.?hop|drill)/.test(p)) return "trap";
  if (/(ambient|drone|pad|space|still)/.test(p)) return "ambient";
  if (/(techno|rave|warehouse|pulse)/.test(p)) return "techno";
  if (/(cinematic|trailer|epic|choir|ember)/.test(p)) return "cinematic";
  return "song";
}

function detectScale(prompt: string, style: Style): ScaleName {
  const p = prompt.toLowerCase();
  if (/dorian/.test(p)) return "dorian";
  if (/phrygian/.test(p)) return "phrygian";
  if (/mixolydian/.test(p)) return "mixolydian";
  if (/harmonic/.test(p)) return "harmonic-minor";
  if (/major|ionian|happy|bright/.test(p)) return "major";
  if (style === "ambient") return "dorian";
  if (style === "cinematic") return "harmonic-minor";
  return "minor";
}

function detectKey(prompt: string): string {
  const m = prompt.match(/\b([A-G](?:#|b)?)\s*(?:minor|major|min|maj)?\b/i);
  if (!m) return "D";
  const raw = m[1]!;
  return raw.length === 1 ? raw.toUpperCase() : `${raw[0]!.toUpperCase()}${raw.slice(1)}`;
}

function detectBpm(prompt: string, style: Style): number {
  const m = prompt.match(/(\d{2,3})\s*bpm/i);
  if (m) return Math.min(180, Math.max(60, Number(m[1])));
  if (style === "house") return 122;
  if (style === "trap") return 140;
  if (style === "ambient") return 72;
  if (style === "techno") return 132;
  if (style === "cinematic") return 92;
  return 108;
}

function drumsFor(style: Style, end: number): DrumHit[] {
  const hits: DrumHit[] = [];
  if (style === "ambient") {
    for (let t = 0; t < end; t += 8) hits.push(d("perc", t + 3.5, 0.28));
    return hits;
  }
  if (style === "trap") {
    for (let t = 0; t < end; t += 4) {
      hits.push(d("kick", t, 0.95), d("kick", t + 1.5, 0.68), d("snare", t + 2, 0.88), d("clap", t + 2, 0.45));
    }
    for (let t = 0; t < end; t += 0.25) {
      const i = Math.round(t / 0.25);
      hits.push(d("hat", t, i % 4 === 0 ? 0.5 : i % 8 === 7 ? 0.7 : 0.2));
    }
    return hits;
  }
  if (style === "house" || style === "techno") {
    for (let t = 0; t < end; t += 1) hits.push(d("kick", t, 0.94));
    for (let t = 0; t < end; t += 0.5) hits.push(d("hat", t, Math.round(t / 0.5) % 2 ? 0.55 : 0.24));
    for (let t = 0; t < end; t += 4) hits.push(d(style === "house" ? "clap" : "snare", t + 2, 0.8));
    return hits;
  }
  for (let t = 0; t < end; t += 1) hits.push(d("kick", t, t % 4 === 0 ? 0.92 : 0.76));
  for (let t = 0; t < end; t += 2) if (t % 4 === 2) hits.push(d("snare", t, 0.84));
  for (let t = 0; t < end; t += 0.5) hits.push(d("hat", t, Math.round(t / 0.5) % 2 ? 0.28 : 0.42));
  return hits;
}

function bassFor(key: string, scale: ScaleName, style: Style, end: number): Note[] {
  const notes: Note[] = [];
  const roots = [0, 0, 3, 4, 0, 5, 3, 4];
  for (let bar = 0; bar < end / 4; bar++) {
    const deg = roots[bar % roots.length]!;
    const pitch = degreeMidi(key, scale, deg, style === "trap" ? 1 : 2);
    if (style === "house" || style === "techno") {
      for (let s = 0; s < 8; s++) {
        notes.push(n(pitch + (s % 4 === 3 ? 12 : 0), bar * 4 + s * 0.5, 0.42, s % 2 === 0 ? 0.84 : 0.58));
      }
    } else if (style === "trap") {
      notes.push(n(pitch, bar * 4, 1.3, 0.92), n(pitch, bar * 4 + 1.5, 0.4, 0.7), n(pitch + 12, bar * 4 + 2.5, 0.3, 0.5));
    } else if (style === "ambient") {
      notes.push(n(pitch, bar * 4, 3.6, 0.45));
    } else {
      notes.push(n(pitch, bar * 4, 0.9, 0.82), n(pitch + 12, bar * 4 + 2, 0.7, 0.62), n(pitch, bar * 4 + 3, 0.7, 0.7));
    }
  }
  return notes;
}

function padFor(key: string, scale: ScaleName, end: number): Note[] {
  const notes: Note[] = [];
  const chordDeg = [0, 2, 4, 6];
  for (let t = 0; t < end; t += 8) {
    const shift = t % 16 === 8 ? 3 : 0;
    chordDeg.forEach((d, i) => notes.push(n(degreeMidi(key, scale, d + shift, 3), t, 7.6, 0.42 - i * 0.04)));
  }
  return notes;
}

function leadFor(key: string, scale: ScaleName, style: Style, end: number): Note[] {
  const notes: Note[] = [];
  const motif = style === "ambient" ? [4, 6, 7, 9] : [4, 5, 7, 4, 2, 0, 2, 4];
  const step = style === "ambient" ? 4 : 1;
  for (let t = 0, i = 0; t < end; t += step, i++) {
    if (style !== "ambient" && i % 5 === 4) continue;
    const deg = motif[i % motif.length]!;
    notes.push(n(degreeMidi(key, scale, deg, 4), t + (style === "cinematic" ? 1 : 0.5) * (i % 3 === 0 ? 0 : 0), style === "ambient" ? 3.2 : 0.65, 0.62));
  }
  return notes;
}

export function generateArrangement(prompt: string): Project {
  const style = detectStyle(prompt);
  const scale = detectScale(prompt, style);
  const key = detectKey(prompt) || "D";
  const bpm = detectBpm(prompt, style);
  const bars = 8;
  const end = bars * 4;
  const tracks: Track[] = [];
  if (style !== "ambient") {
    tracks.push(track("Kit", "drums", "kit", { drums: drumsFor(style, end) }));
  }
  tracks.push(
    track(style === "trap" ? "808" : "Bass", "bass", style === "trap" ? "sub-bass" : "analog-bass", {
      notes: bassFor(key, scale, style, end),
    }),
  );
  tracks.push(
    track("Pad", "pad", style === "ambient" ? "air-pad" : "warm-pad", {
      notes: padFor(key, scale, end),
      volume: 0.52,
    }),
  );
  tracks.push(
    track(style === "techno" ? "Stabs" : "Lead", "lead", style === "techno" ? "brass" : "glass-lead", {
      notes: leadFor(key, scale, style, end),
      pan: 0.12,
    }),
  );
  if (style === "cinematic" || style === "ambient") {
    tracks.push(
      track("Choir", "voice", "choir", {
        notes: padFor(key, scale, end).map((x) => ({ ...x, id: uid("n"), pitch: x.pitch + 12, velocity: 0.32 })),
        volume: 0.42,
      }),
    );
  }
  return {
    id: uid("proj"),
    name: prompt.trim().slice(0, 42) || "Composed Session",
    bpm,
    key,
    scale,
    bars,
    swing: style === "trap" ? 0.12 : style === "house" ? 0 : 0.04,
    masterVolume: 0.85,
    tracks,
    updatedAt: Date.now(),
    loop: true,
    metronome: false,
    timeNumerator: 4,
    timeDenominator: 4,
  };
}
