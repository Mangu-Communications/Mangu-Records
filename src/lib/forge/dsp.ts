import type { BitDepth, ClipReport } from "./types.ts";

export interface PcmBuffer {
  numberOfChannels: number;
  sampleRate: number;
  length: number;
  getChannelData(channel: number): Float32Array;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function distortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 2048;
  const k = amount * 40;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

export function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buf = noiseCache.get(ctx);
  if (buf) return buf;
  const len = Math.max(1, Math.floor(ctx.sampleRate * 2));
  buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    // Slightly correlated noise avoids brittle clicks in hats
    last = last * 0.12 + (Math.random() * 2 - 1) * 0.88;
    data[i] = last;
  }
  noiseCache.set(ctx, buf);
  return buf;
}

const irCache = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

export function reverbIR(
  ctx: BaseAudioContext,
  kind: "room" | "hall" | "plate" | "spring" = "room",
): AudioBuffer {
  let map = irCache.get(ctx);
  if (!map) {
    map = new Map();
    irCache.set(ctx, map);
  }
  const hit = map.get(kind);
  if (hit) return hit;

  const seconds = kind === "hall" ? 2.4 : kind === "plate" ? 1.6 : kind === "spring" ? 1.1 : 0.9;
  const decay = kind === "hall" ? 3.2 : kind === "plate" ? 2.6 : kind === "spring" ? 4.5 : 2.2;
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / ctx.sampleRate;
      const env = Math.exp(-t * decay);
      let s = (Math.random() * 2 - 1) * env;
      if (kind === "spring" && i % 37 === 0) s *= 2.4;
      if (kind === "plate") s *= 0.7 + 0.3 * Math.sin(i * 0.015 + ch);
      data[i] = s * 0.85;
    }
  }
  map.set(kind, buf);
  return buf;
}

export function tpdf(): number {
  return Math.random() + Math.random() - 1;
}

export function analyzePeaks(channels: Float32Array[]): Omit<ClipReport, "durationSec" | "sampleRate" | "bitDepth"> {
  let peak = 0;
  let sumSq = 0;
  let clipped = 0;
  const n = channels[0]?.length ?? 0;
  const chN = channels.length || 1;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < chN; c++) {
      const s = channels[c]![i] ?? 0;
      const a = Math.abs(s);
      if (a > peak) peak = a;
      if (a > 1) clipped += 1;
      sumSq += s * s;
    }
  }
  const rms = n === 0 ? 0 : Math.sqrt(sumSq / (n * chN));
  return { peak, rms, clippedSamples: clipped };
}

export function normalizeChannels(channels: Float32Array[], target = 0.89): number {
  const { peak } = analyzePeaks(channels);
  if (peak < 1e-8) return 1;
  const g = target / peak;
  if (g >= 1) return 1;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) ch[i]! *= g;
  }
  return g;
}

export function encodeWav(
  buffer: PcmBuffer,
  bitDepth: BitDepth = 16,
  dither = true,
): Blob {
  const ch = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const len = buffer.length;
  const channels: Float32Array[] = [];
  for (let c = 0; c < ch; c++) channels.push(buffer.getChannelData(c));

  if (bitDepth === 32) {
    const bytes = len * ch * 4;
    const ab = new ArrayBuffer(44 + bytes);
    const view = new DataView(ab);
    writeWavHeader(view, sr, ch, bytes, 3, 32);
    let offset = 44;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < ch; c++) {
        view.setFloat32(offset, channels[c]![i] ?? 0, true);
        offset += 4;
      }
    }
    return new Blob([ab], { type: "audio/wav" });
  }

  const bytesPerSample = bitDepth === 24 ? 3 : 2;
  const bytes = len * ch * bytesPerSample;
  const ab = new ArrayBuffer(44 + bytes);
  const view = new DataView(ab);
  writeWavHeader(view, sr, ch, bytes, 1, bitDepth);
  const max = bitDepth === 24 ? 0x7fffff : 0x7fff;
  const ditherAmt = dither ? (bitDepth === 24 ? 1 / 0x7fffff : 1 / 0x7fff) : 0;
  let offset = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      let s = channels[c]![i] ?? 0;
      if (ditherAmt) s += tpdf() * ditherAmt;
      s = clamp(s, -1, 1);
      let v = s < 0 ? Math.round(s * (max + 1)) : Math.round(s * max);
      if (bitDepth === 16) {
        view.setInt16(offset, v, true);
        offset += 2;
      } else {
        if (v < 0) v += 0x1000000;
        view.setUint8(offset, v & 0xff);
        view.setUint8(offset + 1, (v >> 8) & 0xff);
        view.setUint8(offset + 2, (v >> 16) & 0xff);
        offset += 3;
      }
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

function writeWavHeader(
  view: DataView,
  sr: number,
  ch: number,
  dataBytes: number,
  audioFormat: number,
  bits: number,
) {
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  const block = ch * (bits / 8);
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, audioFormat, true);
  view.setUint16(22, ch, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * block, true);
  view.setUint16(32, block, true);
  view.setUint16(34, bits, true);
  writeStr(36, "data");
  view.setUint32(40, dataBytes, true);
}

export function clipReportFor(
  buffer: PcmBuffer,
  bitDepth: BitDepth,
): ClipReport {
  const channels: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));
  const stats = analyzePeaks(channels);
  return {
    ...stats,
    durationSec: buffer.length / buffer.sampleRate,
    sampleRate: buffer.sampleRate,
    bitDepth,
  };
}

export function makePcm(channels: Float32Array[], sampleRate: number): PcmBuffer {
  return {
    numberOfChannels: channels.length,
    sampleRate,
    length: channels[0]?.length ?? 0,
    getChannelData: (c) => channels[c] ?? new Float32Array(0),
  };
}
