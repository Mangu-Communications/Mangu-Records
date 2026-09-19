import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { degreeMidi, midiName, midiToFreq, scalePitches, snapToScale } from "./theory.ts";

describe("theory", () => {
  it("maps A4 to 440", () => {
    assert.equal(Math.round(midiToFreq(69)), 440);
  });
  it("names midi notes", () => {
    assert.equal(midiName(60), "C4");
    assert.equal(midiName(69), "A4");
  });
  it("builds D harmonic minor", () => {
    const pitches = scalePitches("D", "harmonic-minor", 62, 74);
    assert.ok(pitches.includes(62));
    assert.ok(pitches.includes(73));
  });
  it("snaps off-scale pitches", () => {
    const snapped = snapToScale(61, "C", "major");
    assert.ok([60, 62].includes(snapped));
  });
  it("degreeMidi walks the scale", () => {
    assert.equal(midiName(degreeMidi("C", "major", 0, 4)), "C4");
    assert.equal(midiName(degreeMidi("C", "major", 4, 4)), "G4");
  });
});
