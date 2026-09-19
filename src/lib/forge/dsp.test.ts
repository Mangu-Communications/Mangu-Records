import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzePeaks, distortionCurve, encodeWav, makePcm, normalizeChannels } from "./dsp.ts";

describe("dsp", () => {
  it("maps silence to silence in the waveshaper", () => {
    const curve = distortionCurve(0.4);
    const mid = curve[curve.length / 2];
    assert.ok(Math.abs(mid ?? 1) < 0.02);
  });
  it("reports peaks and clipping", () => {
    const ch = new Float32Array([0, 0.5, 1.2, -0.2]);
    const stats = analyzePeaks([ch]);
    assert.ok(stats.peak > 1.1);
    assert.equal(stats.clippedSamples, 1);
  });
  it("normalizes below target when over", () => {
    const ch = new Float32Array([0, 2, -2]);
    const g = normalizeChannels([ch], 0.89);
    assert.ok(g < 1);
    assert.ok(Math.abs(ch[1]!) <= 0.9);
  });
  it("encodes 16-bit wav with a riff header", async () => {
    const left = new Float32Array(64).map((_, i) => Math.sin((i / 64) * Math.PI * 2) * 0.2);
    const blob = encodeWav(makePcm([left, left], 44100), 16, false);
    const buf = new Uint8Array(await blob.arrayBuffer());
    const ascii = String.fromCharCode(...buf.slice(0, 4));
    assert.equal(ascii, "RIFF");
    assert.equal(String.fromCharCode(...buf.slice(8, 12)), "WAVE");
    assert.ok(blob.size > 44);
  });
  it("encodes 32-bit float wav", async () => {
    const left = new Float32Array(8);
    const blob = encodeWav(makePcm([left], 48000), 32, false);
    const buf = new DataView(await blob.arrayBuffer());
    assert.equal(buf.getUint16(20, true), 3);
    assert.equal(buf.getUint16(34, true), 32);
  });
});
