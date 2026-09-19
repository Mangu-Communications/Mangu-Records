import { useForge } from "@/lib/forge/store";
import { midiName, scalePitches } from "@/lib/forge/theory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ParamSlider } from "./controls";
import { PianoKeys } from "./keyboard";
import { getEngine } from "@/lib/forge/engine";
import { patchById } from "@/lib/forge/presets";

export function Inspector() {
  const project = useForge((s) => s.project);
  const selectedTrackId = useForge((s) => s.selectedTrackId);
  const updateTrack = useForge((s) => s.updateTrack);
  const removeTrack = useForge((s) => s.removeTrack);
  const addNote = useForge((s) => s.addNote);
  const setFx = useForge((s) => s.setFx);
  const track = project.tracks.find((t) => t.id === selectedTrackId);

  if (!track) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        Select a track to edit.
      </div>
    );
  }

  const pitches = scalePitches(project.key, project.scale, 48, 72);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Input
            value={track.name}
            onChange={(e) => updateTrack(track.id, { name: e.target.value })}
            className="h-8 border-transparent bg-transparent px-0 text-base font-medium"
          />
          <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">{track.kind}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => removeTrack(track.id)}>
          Remove
        </Button>
      </div>

      {track.kind === "drums" ? (
        <p className="text-sm text-muted-foreground">
          Step-program this kit in the grid under the score. Click a row label to preview the sample.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Click the piano to drop a note at the start of the loop. Click a block in the score to delete it.
          </p>
          <PianoKeys
            onPlay={(midi) => {
              addNote(track.id, { pitch: midi, start: 0, duration: 1, velocity: 0.8 });
              getEngine().previewNote(patchById(track.instrumentId), midi);
            }}
          />
          <div className="flex flex-wrap gap-1">
            {pitches.slice(0, 14).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  addNote(track.id, { pitch: p, start: 0, duration: 0.5, velocity: 0.75 });
                  getEngine().previewNote(patchById(track.instrumentId), p, 0.8, 0.3);
                }}
                className="rounded-md border border-border px-1.5 py-1 font-mono text-[10px] hover:bg-elevated"
              >
                {midiName(p)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-border bg-card p-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Effects</p>
        <ParamSlider
          label="Filter"
          min={80}
          max={16000}
          step={10}
          value={track.fx.filterCutoff}
          onChange={(v) => setFx(track.id, { filterCutoff: v })}
          format={(v) => `${Math.round(v)} Hz`}
        />
        <ParamSlider
          label="Resonance"
          min={0.1}
          max={12}
          value={track.fx.filterRes}
          onChange={(v) => setFx(track.id, { filterRes: v })}
        />
        <ParamSlider
          label="Drive"
          min={0}
          max={0.8}
          value={track.fx.drive}
          onChange={(v) => setFx(track.id, { drive: v })}
        />
        <ParamSlider
          label="Delay"
          min={0}
          max={0.8}
          value={track.fx.delay}
          onChange={(v) => setFx(track.id, { delay: v })}
        />
        <ParamSlider
          label="Reverb"
          min={0}
          max={0.9}
          value={track.fx.reverb}
          onChange={(v) => setFx(track.id, { reverb: v })}
        />
        <ParamSlider
          label="Chorus"
          min={0}
          max={1}
          value={track.fx.chorus}
          onChange={(v) => setFx(track.id, { chorus: v })}
        />
        <div className="flex gap-1">
          {(["room", "hall", "plate", "spring"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setFx(track.id, { reverbType: kind })}
              className={cn(
                "flex-1 rounded-md border px-1 py-1 font-mono text-[10px] uppercase",
                track.fx.reverbType === kind ? "border-primary bg-elevated text-foreground" : "border-border text-muted-foreground",
              )}
            >
              {kind}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => useForge.getState().quantizeTrack(track.id)}>
          Quantize to 16ths
        </Button>
        <Button variant="outline" size="sm" className="w-full" onClick={() => useForge.getState().duplicateTrack(track.id)}>
          Duplicate track
        </Button>
      </div>
    </div>
  );
}
