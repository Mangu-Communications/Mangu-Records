import type { ScaleName } from "./types.ts";

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export const KEY_ROOTS: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export const SCALES: Record<ScaleName, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  "harmonic-minor": [0, 2, 3, 5, 7, 8, 11],
};

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function midiName(midi: number): string {
  const n = ((midi % 12) + 12) % 12;
  const oct = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[n]}${oct}`;
}

export function keyRootPc(key: string): number {
  const k = key.trim();
  const named = KEY_ROOTS[k] ?? KEY_ROOTS[k.replace(/m$/i, "")];
  if (named !== undefined) return named;
  return 2;
}

export function scalePitches(key: string, scale: ScaleName, fromMidi = 36, toMidi = 84): number[] {
  const root = keyRootPc(key);
  const intervals = SCALES[scale];
  const out: number[] = [];
  for (let m = fromMidi; m <= toMidi; m++) {
    const pc = ((m % 12) + 12) % 12;
    const rel = (pc - root + 12) % 12;
    if (intervals.includes(rel)) out.push(m);
  }
  return out;
}

export function snapToScale(midi: number, key: string, scale: ScaleName): number {
  const pitches = scalePitches(key, scale, midi - 12, midi + 12);
  let best = pitches[0] ?? midi;
  let dist = 99;
  for (const p of pitches) {
    const d = Math.abs(p - midi);
    if (d < dist) {
      dist = d;
      best = p;
    }
  }
  return best;
}

export function degreeMidi(key: string, scale: ScaleName, degree: number, octave = 3): number {
  const root = keyRootPc(key) + (octave + 1) * 12;
  const intervals = SCALES[scale];
  const oct = Math.floor(degree / intervals.length);
  const idx = ((degree % intervals.length) + intervals.length) % intervals.length;
  return root + intervals[idx]! + oct * 12;
}
