import { useState } from "react";
import { toast } from "sonner";
import { designSound } from "@/lib/ai/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getEngine } from "@/lib/forge/engine";
import { coercePatch, localDesignSound } from "@/lib/forge/apply-compose";
import { SYNTH_PRESETS, registerPatch } from "@/lib/forge/presets";
import { useForge } from "@/lib/forge/store";
import type { OscType } from "@/lib/forge/types";
import { ParamSlider } from "./controls";
import { PianoKeys } from "./keyboard";

const OSC_TYPES: OscType[] = ["sine", "square", "sawtooth", "triangle", "noise"];

export function SoundLab() {
  const patch = useForge((s) => s.workingPatch);
  const setWorkingPatch = useForge((s) => s.setWorkingPatch);
  const saveUserPatch = useForge((s) => s.saveUserPatch);
  const applyPatchToTrack = useForge((s) => s.applyPatchToTrack);
  const loadPatch = useForge((s) => s.loadPatch);
  const [prompt, setPrompt] = useState("warm analog pad, slow attack, slight detune");
  const [busy, setBusy] = useState(false);
  const [saveName, setSaveName] = useState("");

  async function design() {
    setBusy(true);
    try {
      const result = await designSound({ data: { prompt } });
      if (result.ok) {
        const next = coercePatch(JSON.parse(result.json) as unknown);
        if (next) {
          registerPatch(next);
          setWorkingPatch(next);
          toast.success(`Designed ${next.name}`);
          return;
        }
      }
      const fallback = localDesignSound(prompt);
      registerPatch(fallback);
      setWorkingPatch(fallback);
      toast.message(result.ok ? "Interpreted locally" : result.error + " — local design used");
    } catch (err) {
      const fallback = localDesignSound(prompt);
      registerPatch(fallback);
      setWorkingPatch(fallback);
      toast.message(err instanceof Error ? err.message : "Local design used");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-y-auto p-4 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-2xl italic">Sound</h2>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Two oscillators, a filter, envelopes, and an LFO. Design any timbre, then drop it on the selected track.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-16 flex-1"
            placeholder="Describe a sound"
          />
          <Button onClick={() => void design()} disabled={busy} className="sm:self-stretch">
            {busy ? "Designing…" : "Design"}
          </Button>
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
          {(["osc1", "osc2"] as const).map((key) => (
            <div key={key} className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {key === "osc1" ? "Oscillator 1" : "Oscillator 2"}
              </p>
              <div className="flex flex-wrap gap-1">
                {OSC_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWorkingPatch({ [key]: { ...patch[key], type: t } })}
                    className={`rounded-md border px-2 py-1 font-mono text-[11px] ${
                      patch[key].type === t ? "border-primary bg-elevated text-foreground" : "border-border text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <ParamSlider
                label="Mix"
                min={0}
                max={1}
                value={patch[key].mix}
                onChange={(v) => setWorkingPatch({ [key]: { ...patch[key], mix: v } })}
              />
              <ParamSlider
                label="Detune"
                min={-24}
                max={24}
                step={1}
                value={patch[key].detune}
                onChange={(v) => setWorkingPatch({ [key]: { ...patch[key], detune: v } })}
                format={(v) => `${v >= 0 ? "+" : ""}${Math.round(v)}`}
              />
            </div>
          ))}
          <ParamSlider
            label="Cutoff"
            min={80}
            max={12000}
            step={10}
            value={patch.filter.cutoff}
            onChange={(v) => setWorkingPatch({ filter: { ...patch.filter, cutoff: v } })}
            format={(v) => `${Math.round(v)} Hz`}
          />
          <ParamSlider
            label="Resonance"
            min={0.1}
            max={14}
            value={patch.filter.res}
            onChange={(v) => setWorkingPatch({ filter: { ...patch.filter, res: v } })}
          />
          <ParamSlider
            label="Filter env"
            min={0}
            max={1}
            value={patch.filter.envAmt}
            onChange={(v) => setWorkingPatch({ filter: { ...patch.filter, envAmt: v } })}
          />
          <ParamSlider
            label="Drive"
            min={0}
            max={0.7}
            value={patch.drive}
            onChange={(v) => setWorkingPatch({ drive: v })}
          />
          <ParamSlider
            label="Attack"
            min={0.001}
            max={2}
            value={patch.env.a}
            onChange={(v) => setWorkingPatch({ env: { ...patch.env, a: v } })}
          />
          <ParamSlider
            label="Decay"
            min={0.01}
            max={2}
            value={patch.env.d}
            onChange={(v) => setWorkingPatch({ env: { ...patch.env, d: v } })}
          />
          <ParamSlider
            label="Sustain"
            min={0}
            max={1}
            value={patch.env.s}
            onChange={(v) => setWorkingPatch({ env: { ...patch.env, s: v } })}
          />
          <ParamSlider
            label="Release"
            min={0.02}
            max={3}
            value={patch.env.r}
            onChange={(v) => setWorkingPatch({ env: { ...patch.env, r: v } })}
          />
          <ParamSlider
            label="LFO rate"
            min={0.05}
            max={12}
            value={patch.lfo.rate}
            onChange={(v) => setWorkingPatch({ lfo: { ...patch.lfo, rate: v } })}
            format={(v) => `${v.toFixed(2)} Hz`}
          />
          <ParamSlider
            label="LFO amount"
            min={0}
            max={1}
            value={patch.lfo.amt}
            onChange={(v) => setWorkingPatch({ lfo: { ...patch.lfo, amt: v } })}
          />
        </div>

        <PianoKeys onPlay={(m) => getEngine().previewNote(patch, m, 0.85, 0.6)} />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Library</p>
          <div className="mt-2 flex max-h-56 flex-col gap-0.5 overflow-y-auto">
            {SYNTH_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => loadPatch(p.id)}
                className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <Input
            placeholder="Preset name"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
          />
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              saveUserPatch(saveName || patch.name);
              setSaveName("");
              toast.success("Preset saved on this device");
            }}
          >
            Save preset
          </Button>
          <Button className="w-full" onClick={applyPatchToTrack}>
            Assign to track
          </Button>
        </div>
      </div>
    </div>
  );
}
