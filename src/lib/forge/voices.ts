import { distortionCurve, midiToFreq, noiseBuffer } from "./dsp";
import type { DrumHit, DrumSample, OscType, SynthPatch } from "./types";

function envGain(
  ctx: BaseAudioContext,
  time: number,
  dur: number,
  a: number,
  d: number,
  s: number,
  r: number,
  peak: number,
): GainNode {
  const g = ctx.createGain();
  const p = Math.max(0.0008, peak);
  const atk = Math.max(0.003, a);
  const dec = Math.max(0.008, d);
  const rel = Math.max(0.02, r);
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(p, time + atk);
  g.gain.setTargetAtTime(Math.max(0.0008, p * s), time + atk, dec / 3);
  const relStart = time + Math.max(atk + 0.008, dur);
  g.gain.cancelScheduledValues(relStart);
  g.gain.setValueAtTime(Math.max(0.0008, p * s), relStart);
  g.gain.exponentialRampToValueAtTime(0.0008, relStart + rel);
  return g;
}

function makeOsc(
  ctx: BaseAudioContext,
  type: OscType,
  freq: number,
  detune: number,
  time: number,
  stopAt: number,
): AudioNode {
  if (type === "noise") {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    src.start(time);
    src.stop(stopAt);
    return src;
  }
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, freq), time);
  osc.detune.setValueAtTime(detune, time);
  osc.start(time);
  osc.stop(stopAt);
  return osc;
}

function wavetableOsc(
  ctx: BaseAudioContext,
  freq: number,
  detune: number,
  time: number,
  stopAt: number,
  bright = 0.45,
): OscillatorNode {
  const n = 24;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    imag[i] = (1 / i) * Math.pow(bright, i * 0.35);
  }
  const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  const osc = ctx.createOscillator();
  osc.setPeriodicWave(wave);
  osc.frequency.setValueAtTime(Math.max(20, freq), time);
  osc.detune.setValueAtTime(detune, time);
  osc.start(time);
  osc.stop(stopAt);
  return osc;
}

function playKarplus(
  ctx: BaseAudioContext,
  dest: AudioNode,
  freq: number,
  velocity: number,
  time: number,
  duration: number,
  gainAmt: number,
) {
  const period = 1 / Math.max(40, freq);
  const burst = Math.min(0.018, period * 4);
  const stopAt = time + duration + 0.6;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const burstGain = ctx.createGain();
  burstGain.gain.setValueAtTime(velocity * gainAmt, time);
  burstGain.gain.exponentialRampToValueAtTime(0.0008, time + burst);
  const delay = ctx.createDelay(1);
  delay.delayTime.setValueAtTime(period, time);
  const filt = ctx.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.setValueAtTime(Math.min(6500, freq * 8), time);
  const fb = ctx.createGain();
  fb.gain.value = 0.965;
  const out = ctx.createGain();
  out.gain.setValueAtTime(1, time);
  out.gain.setTargetAtTime(0.0008, time + duration, 0.12);
  src.connect(burstGain);
  burstGain.connect(delay);
  delay.connect(filt);
  filt.connect(fb);
  fb.connect(delay);
  filt.connect(out);
  out.connect(dest);
  src.start(time);
  src.stop(time + burst + 0.02);
  void stopAt;
}

function playFm(
  ctx: BaseAudioContext,
  dest: AudioNode,
  patch: SynthPatch,
  freq: number,
  velocity: number,
  time: number,
  duration: number,
) {
  const rel = Math.max(0.05, patch.env.r);
  const stopAt = time + duration + rel + 0.05;
  const carrier = ctx.createOscillator();
  carrier.type = "sine";
  carrier.frequency.setValueAtTime(freq, time);
  const mod = ctx.createOscillator();
  mod.type = "sine";
  const ratio = 2 + patch.osc2.octave;
  mod.frequency.setValueAtTime(freq * Math.max(0.5, ratio), time);
  const idx = ctx.createGain();
  idx.gain.setValueAtTime(freq * (1.8 + patch.drive * 4) * velocity, time);
  idx.gain.exponentialRampToValueAtTime(freq * 0.15, time + Math.max(0.08, patch.env.d));
  mod.connect(idx);
  idx.connect(carrier.frequency);
  const amp = envGain(ctx, time, duration, patch.env.a, patch.env.d, patch.env.s, patch.env.r, velocity * patch.gain);
  carrier.connect(amp);
  amp.connect(dest);
  carrier.start(time);
  mod.start(time);
  carrier.stop(stopAt);
  mod.stop(stopAt);
}

export function playSynthVoice(
  ctx: BaseAudioContext,
  dest: AudioNode,
  patch: SynthPatch,
  midi: number,
  velocity: number,
  time: number,
  duration: number,
) {
  const freq = midiToFreq(midi);
  const rel = Math.max(0.03, patch.env.r);
  const stopAt = time + duration + rel + 0.08;
  const octMul = (oct: number) => 2 ** oct;

  if (patch.category === "bell") {
    playFm(ctx, dest, patch, freq, velocity, time, duration);
    return;
  }
  if (patch.category === "pluck") {
    playKarplus(ctx, dest, freq * octMul(patch.osc1.octave), velocity, time, duration, patch.gain * 1.4);
    return;
  }

  const useWt = patch.category === "pad" || patch.category === "keys";
  const o1 = useWt
    ? wavetableOsc(ctx, freq * octMul(patch.osc1.octave), patch.osc1.detune, time, stopAt, 0.5)
    : makeOsc(ctx, patch.osc1.type, freq * octMul(patch.osc1.octave), patch.osc1.detune, time, stopAt);
  const o2 = useWt
    ? wavetableOsc(ctx, freq * octMul(patch.osc2.octave), patch.osc2.detune, time, stopAt, 0.32)
    : makeOsc(ctx, patch.osc2.type, freq * octMul(patch.osc2.octave), patch.osc2.detune, time, stopAt);

  const m1 = ctx.createGain();
  m1.gain.value = patch.osc1.mix;
  const m2 = ctx.createGain();
  m2.gain.value = patch.osc2.mix;
  o1.connect(m1);
  o2.connect(m2);

  const filter = ctx.createBiquadFilter();
  filter.type = patch.filter.type;
  filter.Q.setValueAtTime(Math.max(0.0001, patch.filter.res), time);
  const cut = Math.max(60, patch.filter.cutoff);
  const peakCut = Math.min(16000, Math.max(80, cut + patch.filter.envAmt * 7000));
  filter.frequency.setValueAtTime(cut, time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(80, peakCut), time + Math.max(0.01, patch.filterEnv.a));
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(80, cut * (0.4 + patch.filterEnv.s * 0.6)),
    time + patch.filterEnv.a + patch.filterEnv.d,
  );
  filter.frequency.exponentialRampToValueAtTime(Math.max(80, cut), time + duration + patch.filterEnv.r);

  m1.connect(filter);
  m2.connect(filter);

  if (patch.lfo.amt > 0.001) {
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = Math.max(0.05, patch.lfo.rate);
    const lg = ctx.createGain();
    if (patch.lfo.dest === "pitch") {
      lg.gain.value = patch.lfo.amt * 40;
      lfo.connect(lg);
      try {
        lg.connect((o1 as OscillatorNode).frequency);
        lg.connect((o2 as OscillatorNode).frequency);
      } catch {
        /* noise */
      }
    } else if (patch.lfo.dest === "amp") {
      lg.gain.value = patch.lfo.amt * 0.35;
      lfo.connect(lg);
      lg.connect(m1.gain);
      lg.connect(m2.gain);
    } else {
      lg.gain.value = patch.lfo.amt * cut;
      lfo.connect(lg);
      lg.connect(filter.frequency);
    }
    lfo.start(time);
    lfo.stop(stopAt);
  }

  const amp = envGain(
    ctx,
    time,
    duration,
    patch.env.a,
    patch.env.d,
    patch.env.s,
    patch.env.r,
    velocity * patch.gain,
  );
  filter.connect(amp);

  if (patch.drive > 0.01) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = distortionCurve(patch.drive);
    shaper.oversample = "2x";
    amp.connect(shaper);
    shaper.connect(dest);
  } else {
    amp.connect(dest);
  }
}

function clickNoise(
  ctx: BaseAudioContext,
  dest: AudioNode,
  time: number,
  dur: number,
  hp: number,
  gain: number,
  bp?: number,
) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = bp ? "bandpass" : "highpass";
  f.frequency.value = hp;
  if (bp) f.Q.value = 1.6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0008, time);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), time + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0008, time + dur);
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start(time);
  src.stop(time + dur + 0.02);
}

export function playDrum(ctx: BaseAudioContext, dest: AudioNode, hit: DrumHit, time: number) {
  if ((hit.probability ?? 1) < 1 && Math.random() > (hit.probability ?? 1)) return;
  const v = hit.velocity;
  const sample: DrumSample = hit.sample;
  if (sample === "kick") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(172, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.11);
    g.gain.setValueAtTime(0.0008, time);
    g.gain.exponentialRampToValueAtTime(v, time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0008, time + 0.44);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.46);
    clickNoise(ctx, dest, time, 0.028, 1800, v * 0.18);
  } else if (sample === "snare") {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(196, time);
    const g = ctx.createGain();
    g.gain.setValueAtTime(v * 0.42, time);
    g.gain.exponentialRampToValueAtTime(0.0008, time + 0.14);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.18);
    clickNoise(ctx, dest, time, 0.16, 1400, v * 0.68, 1800);
  } else if (sample === "clap") {
    [0, 0.011, 0.023, 0.04].forEach((off, i) => {
      clickNoise(ctx, dest, time + off, 0.07, 980, v * (i === 3 ? 0.52 : 0.28), 1600);
    });
  } else if (sample === "hat") {
    clickNoise(ctx, dest, time, 0.042, 7800, v * 0.42);
  } else if (sample === "openhat") {
    clickNoise(ctx, dest, time, 0.26, 6200, v * 0.38);
  } else if (sample === "rim") {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(410, time);
    const g = ctx.createGain();
    g.gain.setValueAtTime(v * 0.28, time);
    g.gain.exponentialRampToValueAtTime(0.0008, time + 0.045);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.055);
    clickNoise(ctx, dest, time, 0.035, 2600, v * 0.22);
  } else if (sample === "tom") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(148, time);
    osc.frequency.exponentialRampToValueAtTime(68, time + 0.16);
    const g = ctx.createGain();
    g.gain.setValueAtTime(v * 0.78, time);
    g.gain.exponentialRampToValueAtTime(0.0008, time + 0.3);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.32);
  } else if (sample === "ride") {
    clickNoise(ctx, dest, time, 0.38, 4800, v * 0.2);
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 628;
    const g = ctx.createGain();
    g.gain.setValueAtTime(v * 0.07, time);
    g.gain.exponentialRampToValueAtTime(0.0008, time + 0.32);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.34);
  } else if (sample === "perc") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(740, time);
    osc.frequency.exponentialRampToValueAtTime(210, time + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(v * 0.42, time);
    g.gain.exponentialRampToValueAtTime(0.0008, time + 0.12);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.14);
  }
}

const VOICE_FORMANTS: Record<string, { f0: number; f1: number; f2: number; f3: number }> = {
  eve: { f0: 196, f1: 720, f2: 1240, f3: 2500 },
  leo: { f0: 118, f1: 620, f2: 1080, f3: 2400 },
  ara: { f0: 210, f1: 780, f2: 1400, f3: 2700 },
  aurora: { f0: 230, f1: 820, f2: 1480, f3: 2800 },
  atlas: { f0: 98, f1: 540, f2: 960, f3: 2200 },
  lumen: { f0: 140, f1: 650, f2: 1180, f3: 2450 },
  sirius: { f0: 170, f1: 700, f2: 1600, f3: 2900 },
  luna: { f0: 188, f1: 760, f2: 1320, f3: 2600 },
  orion: { f0: 128, f1: 600, f2: 1100, f3: 2350 },
  iris: { f0: 204, f1: 800, f2: 1420, f3: 2750 },
};

export async function synthesizeLocalVoice(text: string, voiceId: string, sampleRate = 44100): Promise<AudioBuffer> {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const dur = Math.min(18, Math.max(1.15, words.length * 0.36 + 0.4));
  const frames = Math.ceil(sampleRate * dur);
  const offline = new OfflineAudioContext(1, frames, sampleRate);
  const profile = VOICE_FORMANTS[voiceId] ?? VOICE_FORMANTS.eve!;
  const dest = offline.destination;
  const syllables = Math.max(1, words.length * 2);
  const step = dur / syllables;
  for (let i = 0; i < syllables; i++) {
    const t = 0.04 + i * step;
    const wobble = 1 + Math.sin(i * 1.7) * 0.04;
    const f0 = profile.f0 * wobble * (i % 5 === 4 ? 0.92 : 1);
    const osc = offline.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(f0, t);
    const f1 = offline.createBiquadFilter();
    f1.type = "bandpass";
    f1.frequency.value = profile.f1 * (1 + ((i % 3) - 1) * 0.08);
    f1.Q.value = 8;
    const f2 = offline.createBiquadFilter();
    f2.type = "bandpass";
    f2.frequency.value = profile.f2;
    f2.Q.value = 7;
    const g = offline.createGain();
    const peak = 0.12;
    g.gain.setValueAtTime(0.0008, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, t + step * 0.78);
    osc.connect(f1);
    osc.connect(f2);
    f1.connect(g);
    f2.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + step * 0.85);
  }
  return offline.startRendering();
}
