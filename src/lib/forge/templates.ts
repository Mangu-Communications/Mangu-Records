import { uid } from "../utils.ts";
import { defaultFxFor } from "./presets.ts";
import type { DrumHit, DrumSample, Note, Project, Track, TrackKind } from "./types.ts";
import { DEFAULT_FX } from "./types.ts";

function n(pitch: number, start: number, duration: number, velocity = 0.75, id?: string): Note {
  return { id: id ?? `n-${pitch}-${start}`, pitch, start, duration, velocity };
}

function d(sample: DrumSample, start: number, velocity = 0.85, id?: string): DrumHit {
  return { id: id ?? `d-${sample}-${start}`, sample, start, velocity };
}

function track(
  id: string,
  name: string,
  kind: TrackKind,
  instrumentId: string,
  extra: Partial<Track> = {},
): Track {
  return {
    id,
    name,
    kind,
    instrumentId,
    mute: false,
    solo: false,
    volume: kind === "drums" ? 0.86 : kind === "bass" ? 0.78 : kind === "pad" ? 0.62 : 0.7,
    pan: 0,
    notes: [],
    drums: [],
    voices: [],
    fx: defaultFxFor(kind),
    ...extra,
  };
}

function every(from: number, to: number, step: number, fn: (t: number, i: number) => void) {
  let i = 0;
  for (let t = from; t < to; t += step) {
    fn(t, i);
    i += 1;
  }
}

function emberProtocol(): Project {
  const bars = 8;
  const end = bars * 4;
  const drums: DrumHit[] = [];
  every(0, end, 1, (t) => drums.push(d("kick", t, t % 4 === 0 ? 0.95 : 0.78)));
  every(0, end, 2, (t) => {
    if (t % 4 === 2) drums.push(d("snare", t, 0.86));
  });
  every(0, end, 0.5, (t, i) => {
    const open = i % 8 === 7;
    drums.push(d(open ? "openhat" : "hat", t, open ? 0.55 : i % 2 === 0 ? 0.42 : 0.28));
  });
  every(16, end, 2, (t) => {
    if (t % 4 === 2) drums.push(d("clap", t, 0.7));
  });
  drums.push(d("perc", 7.5, 0.5), d("perc", 15.5, 0.55), d("rim", 27.75, 0.6), d("tom", 30, 0.7), d("tom", 31, 0.55));

  const bassNotes: Note[] = [];
  const bassPat = [38, 38, 50, 38, 41, 38, 36, 38];
  every(0, 8, 1, (t, i) => bassNotes.push(n(bassPat[i % 8]!, t, 0.85, 0.82, `b0-${t}`)));
  const bassPat2 = [46, 46, 58, 46, 50, 46, 43, 46];
  every(8, 16, 1, (t, i) => bassNotes.push(n(bassPat2[i % 8]!, t, 0.85, 0.8, `b1-${t}`)));
  const bassPat3 = [43, 43, 55, 43, 46, 43, 41, 43];
  every(16, 24, 1, (t, i) => bassNotes.push(n(bassPat3[i % 8]!, t, 0.85, 0.8, `b2-${t}`)));
  const bassPat4 = [45, 45, 57, 45, 49, 45, 40, 45];
  every(24, 32, 1, (t, i) => bassNotes.push(n(bassPat4[i % 8]!, t, 0.7, 0.84, `b3-${t}`)));
  bassNotes.push(n(38, 3.5, 0.4, 0.6, "b-ghost-1"), n(50, 11.5, 0.4, 0.55, "b-ghost-2"));

  const pad: Note[] = [
    n(50, 0, 7.8, 0.55, "p-d3"),
    n(53, 0, 7.8, 0.5, "p-f3"),
    n(57, 0, 7.8, 0.48, "p-a3"),
    n(62, 0, 7.8, 0.4, "p-d4"),
    n(46, 8, 7.8, 0.55, "p-bb2"),
    n(50, 8, 7.8, 0.5, "p-d3b"),
    n(53, 8, 7.8, 0.48, "p-f3b"),
    n(58, 8, 7.8, 0.4, "p-bb3"),
    n(43, 16, 7.8, 0.55, "p-g2"),
    n(46, 16, 7.8, 0.5, "p-bb2c"),
    n(50, 16, 7.8, 0.48, "p-d3c"),
    n(55, 16, 7.8, 0.4, "p-g3"),
    n(45, 24, 7.8, 0.58, "p-a2"),
    n(49, 24, 7.8, 0.5, "p-cs3"),
    n(52, 24, 7.8, 0.48, "p-e3"),
    n(57, 24, 7.8, 0.42, "p-a3b"),
  ];

  const lead: Note[] = [
    n(74, 1, 0.7, 0.7, "l1"),
    n(73, 2, 0.45, 0.62, "l2"),
    n(74, 2.5, 1.2, 0.72, "l3"),
    n(77, 4.5, 0.7, 0.68, "l4"),
    n(76, 6, 1.5, 0.7, "l5"),
    n(74, 9, 0.5, 0.65, "l6"),
    n(77, 10, 0.75, 0.7, "l7"),
    n(81, 11.5, 1.8, 0.66, "l8"),
    n(79, 14, 1.4, 0.62, "l9"),
    n(74, 17, 0.6, 0.68, "l10"),
    n(70, 18, 0.6, 0.6, "l11"),
    n(74, 19, 1.4, 0.7, "l12"),
    n(77, 21.5, 0.7, 0.64, "l13"),
    n(81, 24.5, 1.0, 0.72, "l14"),
    n(80, 26, 0.5, 0.6, "l15"),
    n(81, 26.75, 1.2, 0.7, "l16"),
    n(76, 28.5, 2.8, 0.68, "l17"),
  ];

  const bells: Note[] = [
    n(86, 7.5, 2.2, 0.45, "bell1"),
    n(84, 15.5, 2.0, 0.4, "bell2"),
    n(88, 23.5, 2.4, 0.42, "bell3"),
    n(81, 30.5, 1.4, 0.38, "bell4"),
  ];

  const choir: Note[] = [
    n(62, 16, 7.5, 0.45, "ch1"),
    n(65, 16, 7.5, 0.4, "ch2"),
    n(69, 16, 7.5, 0.38, "ch3"),
    n(57, 24, 7.5, 0.42, "ch4"),
    n(61, 24, 7.5, 0.38, "ch5"),
    n(64, 24, 7.5, 0.4, "ch6"),
  ];

  return {
    id: "proj-ember",
    name: "Ember Protocol",
    bpm: 92,
    key: "D",
    scale: "harmonic-minor",
    bars,
    swing: 0.08,
    masterVolume: 0.85,
    updatedAt: Date.now(),
    loop: true,
    metronome: false,
    timeNumerator: 4,
    timeDenominator: 4,
    tracks: [
      track("tr-drums", "Kit", "drums", "kit", { drums, volume: 0.88, pan: 0 }),
      track("tr-bass", "Sub / Bass", "bass", "analog-bass", { notes: bassNotes, volume: 0.8, pan: -0.05 }),
      track("tr-pad", "Warm Field", "pad", "warm-pad", { notes: pad, volume: 0.58, pan: 0.08 }),
      track("tr-lead", "Glass", "lead", "glass-lead", { notes: lead, volume: 0.62, pan: 0.12 }),
      track("tr-bell", "Bells", "keys", "fm-bell", { notes: bells, volume: 0.48, pan: -0.18 }),
      track("tr-choir", "Choir", "voice", "choir", { notes: choir, volume: 0.46, pan: 0, fx: { ...DEFAULT_FX, reverb: 0.55, delay: 0.1 } }),
    ],
  };
}

function nightShift(): Project {
  const bars = 8;
  const end = bars * 4;
  const drums: DrumHit[] = [];
  every(0, end, 1, (t) => drums.push(d("kick", t, 0.9)));
  every(0, end, 2, (t) => {
    if (t % 4 === 2) drums.push(d("clap", t, 0.8), d("snare", t, 0.45));
  });
  every(0, end, 0.5, (t, i) => {
    if (i % 2 === 1) drums.push(d("hat", t, 0.55));
    else drums.push(d("hat", t, 0.22));
  });
  drums.push(d("openhat", 7.5, 0.5), d("openhat", 15.5, 0.5), d("openhat", 23.5, 0.5), d("openhat", 31.5, 0.55));

  const bass: Note[] = [];
  const roots = [41, 41, 44, 39, 41, 41, 36, 39];
  every(0, end, 4, (t, i) => {
    const r = roots[i % roots.length]!;
    every(t, t + 4, 0.5, (bt, j) => {
      const oct = j % 4 === 3 ? 12 : 0;
      bass.push(n(r + oct, bt, 0.42, j % 2 === 0 ? 0.85 : 0.6, `hb-${bt}`));
    });
  });

  const pad: Note[] = [];
  const chords: number[][] = [
    [41, 44, 48, 53],
    [44, 48, 51, 56],
    [39, 43, 46, 51],
    [36, 39, 43, 48],
  ];
  every(0, end, 8, (t, i) => {
    chords[i % 4]!.forEach((p, k) => pad.push(n(p, t, 7.6, 0.4 - k * 0.04, `hp-${t}-${p}`)));
  });

  const pluck: Note[] = [];
  every(0, end, 0.5, (t, i) => {
    if (i % 4 === 0 || i % 7 === 0) {
      const p = [53, 56, 58, 60, 58, 56, 53, 51][i % 8]!;
      pluck.push(n(p, t, 0.28, 0.55, `pl-${t}`));
    }
  });

  return {
    id: "proj-night",
    name: "Night Shift",
    bpm: 122,
    key: "F",
    scale: "minor",
    bars,
    swing: 0,
    masterVolume: 0.84,
    updatedAt: Date.now(),
    loop: true,
    metronome: false,
    timeNumerator: 4,
    timeDenominator: 4,
    tracks: [
      track("ns-drums", "Four on the Floor", "drums", "kit", { drums }),
      track("ns-bass", "House Bass", "bass", "analog-bass", { notes: bass, volume: 0.76 }),
      track("ns-pad", "Night Pad", "pad", "air-pad", { notes: pad, volume: 0.5 }),
      track("ns-pluck", "Offbeat Pluck", "lead", "pluck", { notes: pluck, volume: 0.55, pan: 0.16 }),
    ],
  };
}

function wireTrap(): Project {
  const bars = 8;
  const end = bars * 4;
  const drums: DrumHit[] = [];
  every(0, end, 4, (t) => {
    drums.push(d("kick", t, 0.95), d("kick", t + 1.5, 0.7), d("kick", t + 2.75, 0.6));
    drums.push(d("snare", t + 2, 0.88), d("clap", t + 2, 0.5));
  });
  every(0, end, 0.25, (t, i) => {
    const vel = i % 4 === 0 ? 0.5 : i % 8 === 7 ? 0.7 : 0.22;
    drums.push(d("hat", t, vel));
  });
  drums.push(d("openhat", 3.5, 0.45), d("openhat", 11.5, 0.45), d("perc", 6.75, 0.4), d("rim", 14.75, 0.5));

  const bass: Note[] = [];
  const line = [33, 33, 36, 31, 33, 28, 31, 33];
  every(0, end, 4, (t, i) => {
    const r = line[i % line.length]!;
    bass.push(n(r, t, 1.35, 0.92, `808-${t}`), n(r, t + 1.5, 0.4, 0.7, `808b-${t}`), n(r + 12, t + 2.5, 0.35, 0.55, `808c-${t}`));
  });

  const keys: Note[] = [
    n(57, 0, 1.8, 0.5, "k1"),
    n(60, 0, 1.8, 0.45, "k2"),
    n(64, 0, 1.8, 0.4, "k3"),
    n(55, 4, 1.6, 0.48, "k4"),
    n(60, 4, 1.6, 0.42, "k5"),
    n(63, 8, 2.0, 0.5, "k6"),
    n(67, 8, 2.0, 0.4, "k7"),
    n(52, 16, 3.5, 0.42, "k8"),
    n(55, 16, 3.5, 0.38, "k9"),
    n(60, 16, 3.5, 0.36, "k10"),
    n(57, 24, 3.5, 0.45, "k11"),
    n(61, 24, 3.5, 0.4, "k12"),
    n(64, 24, 3.5, 0.38, "k13"),
  ];

  return {
    id: "proj-wire",
    name: "Wire",
    bpm: 140,
    key: "A",
    scale: "minor",
    bars,
    swing: 0.12,
    masterVolume: 0.82,
    updatedAt: Date.now(),
    loop: true,
    metronome: false,
    timeNumerator: 4,
    timeDenominator: 4,
    tracks: [
      track("w-drums", "Trap Kit", "drums", "kit", { drums, volume: 0.9 }),
      track("w-808", "808", "bass", "sub-bass", { notes: bass, volume: 0.86, fx: { ...DEFAULT_FX, drive: 0.22, filterCutoff: 900 } }),
      track("w-keys", "Dark Keys", "keys", "keys", { notes: keys, volume: 0.5, pan: -0.1 }),
      track("w-lead", "Wire Lead", "lead", "dark-lead", {
        notes: [n(69, 2, 0.4, 0.6, "wl1"), n(72, 2.5, 0.7, 0.65, "wl2"), n(76, 6, 1.1, 0.6, "wl3"), n(74, 18, 0.5, 0.55, "wl4"), n(69, 26, 1.4, 0.62, "wl5")],
        volume: 0.48,
        pan: 0.2,
      }),
    ],
  };
}

function stillAir(): Project {
  const pad: Note[] = [
    n(50, 0, 15.5, 0.42, "sa1"),
    n(53, 0, 15.5, 0.36, "sa2"),
    n(57, 0, 15.5, 0.34, "sa3"),
    n(62, 4, 12, 0.28, "sa4"),
    n(46, 16, 15.5, 0.4, "sa5"),
    n(53, 16, 15.5, 0.34, "sa6"),
    n(58, 16, 15.5, 0.32, "sa7"),
    n(65, 20, 10, 0.26, "sa8"),
  ];
  const choir: Note[] = [
    n(62, 8, 10, 0.32, "sc1"),
    n(65, 12, 12, 0.28, "sc2"),
    n(69, 18, 10, 0.3, "sc3"),
    n(57, 24, 8, 0.26, "sc4"),
  ];
  const bells: Note[] = [
    n(81, 3, 3, 0.35, "sb1"),
    n(84, 11, 4, 0.3, "sb2"),
    n(79, 19, 5, 0.32, "sb3"),
    n(86, 27, 4, 0.28, "sb4"),
  ];
  return {
    id: "proj-air",
    name: "Still Air",
    bpm: 68,
    key: "D",
    scale: "dorian",
    bars: 8,
    swing: 0,
    masterVolume: 0.8,
    updatedAt: Date.now(),
    loop: true,
    metronome: false,
    timeNumerator: 4,
    timeDenominator: 4,
    tracks: [
      track("air-pad", "Atmosphere", "pad", "air-pad", { notes: pad, volume: 0.7 }),
      track("air-choir", "Hum", "voice", "choir", { notes: choir, volume: 0.5 }),
      track("air-bell", "Distant Bell", "keys", "fm-bell", { notes: bells, volume: 0.42, pan: 0.22 }),
      track("air-fx", "Air", "fx", "noise-riser", {
        notes: [n(40, 0, 8, 0.25, "fx1"), n(38, 24, 8, 0.22, "fx2")],
        volume: 0.28,
      }),
    ],
  };
}

function pulseTechno(): Project {
  const bars = 8;
  const end = bars * 4;
  const drums: DrumHit[] = [];
  every(0, end, 1, (t) => drums.push(d("kick", t, 0.96)));
  every(0, end, 0.5, (t, i) => drums.push(d("hat", t, i % 2 ? 0.6 : 0.28)));
  every(0, end, 1, (t) => {
    if (t % 4 === 3) drums.push(d("clap", t + 0.5, 0.35));
  });
  drums.push(d("ride", 16, 0.3), d("ride", 18, 0.28), d("ride", 20, 0.3), d("ride", 22, 0.28));
  const bass: Note[] = [];
  every(0, end, 0.5, (t, i) => {
    const p = i % 16 < 8 ? 36 : 34;
    bass.push(n(p, t, 0.4, i % 2 === 0 ? 0.8 : 0.55, `tb-${t}`));
  });
  const stab: Note[] = [];
  every(0, end, 4, (t) => {
    [51, 55, 58].forEach((p) => stab.push(n(p, t + 0.75, 0.2, 0.55, `st-${t}-${p}`)));
    [51, 54, 58].forEach((p) => stab.push(n(p, t + 2.75, 0.18, 0.5, `st2-${t}-${p}`)));
  });
  return {
    id: "proj-pulse",
    name: "Pulse",
    bpm: 132,
    key: "C",
    scale: "minor",
    bars,
    swing: 0,
    masterVolume: 0.84,
    updatedAt: Date.now(),
    loop: true,
    metronome: false,
    timeNumerator: 4,
    timeDenominator: 4,
    tracks: [
      track("p-drums", "Kick Grid", "drums", "kit", { drums, volume: 0.92 }),
      track("p-bass", "Off-filter Bass", "bass", "analog-bass", {
        notes: bass,
        volume: 0.74,
        fx: { ...DEFAULT_FX, filterCutoff: 520, drive: 0.28 },
      }),
      track("p-stab", "Stabs", "lead", "brass", { notes: stab, volume: 0.5, pan: 0.08 }),
    ],
  };
}

export const TEMPLATES: { id: string; name: string; blurb: string; build: () => Project }[] = [
  { id: "ember", name: "Ember Protocol", blurb: "Cinematic D-minor cue — drums, bass, pad, glass, choir", build: emberProtocol },
  { id: "night", name: "Night Shift", blurb: "Deep house at 122 — four-on-the-floor, offbeat hats", build: nightShift },
  { id: "wire", name: "Wire", blurb: "Trap 140 — 808s, hat rolls, dark keys", build: wireTrap },
  { id: "air", name: "Still Air", blurb: "Ambient dorian field, choir hum, distant bells", build: stillAir },
  { id: "pulse", name: "Pulse", blurb: "Techno grid, filtered bass, brass stabs", build: pulseTechno },
];

export function demoProject(): Project {
  return emberProtocol();
}

export function blankProject(name = "Untitled Session"): Project {
  return {
    id: uid("proj"),
    name,
    bpm: 110,
    key: "A",
    scale: "minor",
    bars: 8,
    swing: 0,
    masterVolume: 0.85,
    updatedAt: Date.now(),
    loop: true,
    metronome: false,
    timeNumerator: 4,
    timeDenominator: 4,
    tracks: [
      track("blank-drums", "Kit", "drums", "kit"),
      track("blank-bass", "Bass", "bass", "analog-bass"),
      track("blank-pad", "Pad", "pad", "warm-pad"),
      track("blank-lead", "Lead", "lead", "glass-lead"),
    ],
  };
}

export function cloneProject(p: Project): Project {
  return JSON.parse(JSON.stringify(p)) as Project;
}
