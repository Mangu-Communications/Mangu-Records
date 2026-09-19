import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { arrangementToProject, coercePatch, localCompose, localDesignSound } from "./apply-compose.ts";
import { generateArrangement } from "./compose-local.ts";
import { TEMPLATES } from "./templates.ts";
import { normalizeProject } from "./types.ts";

describe("compose + templates", () => {
  it("loads every template as a real session", () => {
    for (const t of TEMPLATES) {
      const p = t.build();
      assert.ok(p.tracks.length >= 3, t.name);
      assert.ok(p.bpm > 40);
      assert.ok(p.loop);
      const events = p.tracks.reduce((n, tr) => n + tr.notes.length + tr.drums.length, 0);
      assert.ok(events > 4, t.name);
    }
  });
  it("generates an editable house session from a prompt", () => {
    const p = generateArrangement("late night deep house 122 bpm in F minor");
    assert.equal(p.bpm, 122);
    assert.ok(p.tracks.some((t) => t.kind === "drums"));
    assert.ok(p.tracks.some((t) => t.kind === "bass"));
    assert.ok(p.tracks.flatMap((t) => t.notes).length > 0);
  });
  it("falls back through localCompose", () => {
    const p = localCompose("warehouse techno");
    assert.ok(p.tracks.length >= 3);
  });
  it("coerces a designed patch", () => {
    const patch = coercePatch({
      name: "Test",
      category: "pad",
      osc1: { type: "sawtooth", mix: 0.5, detune: -4, octave: 0 },
      osc2: { type: "sine", mix: 0.4, detune: 5, octave: 1 },
      filter: { type: "lowpass", cutoff: 800, res: 2, envAmt: 0.2 },
      env: { a: 0.4, d: 0.3, s: 0.7, r: 1 },
      filterEnv: { a: 0.2, d: 0.2, s: 0.4, r: 0.4 },
      lfo: { rate: 0.2, amt: 0.1, dest: "filter" },
      gain: 0.3,
      drive: 0.05,
    });
    assert.ok(patch);
    assert.equal(patch.category, "pad");
  });
  it("designs a bass from language", () => {
    const p = localDesignSound("dark analog bass with grit");
    assert.equal(p.category, "bass");
    assert.ok(p.drive > 0);
  });
  it("rejects empty arrangements", () => {
    assert.equal(arrangementToProject({ tracks: [] }), null);
  });
  it("normalizes legacy projects", () => {
    const p = normalizeProject({
      name: "Old",
      bpm: 100,
      tracks: [{ id: "a", name: "Kit", kind: "drums", instrumentId: "kit", notes: [], drums: [], voices: [], fx: {} as never, mute: false, solo: false, volume: 0.8, pan: 0 }],
    });
    assert.ok(p);
    assert.equal(p.loop, true);
    assert.ok(p.tracks[0]!.fx.filterCutoff);
  });
});
