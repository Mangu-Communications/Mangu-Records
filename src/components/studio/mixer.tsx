import { useForge } from "@/lib/forge/store";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Meter } from "./meters";

export function MixerView() {
  const project = useForge((s) => s.project);
  const updateTrack = useForge((s) => s.updateTrack);
  const selectTrack = useForge((s) => s.selectTrack);
  const selectedTrackId = useForge((s) => s.selectedTrackId);
  const setMaster = useForge((s) => s.setMaster);

  return (
    <div className="flex h-full min-h-0 gap-2 overflow-x-auto p-3">
      {project.tracks.map((t) => (
        <div
          key={t.id}
          onClick={() => selectTrack(t.id)}
          className={cn(
            "flex w-[92px] shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-card p-2",
            selectedTrackId === t.id && "border-primary/40",
          )}
        >
          <div className="flex h-7 w-full gap-1">
            <button
              type="button"
              className={cn(
                "flex-1 rounded-md text-[10px] font-medium",
                t.mute ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground",
              )}
              onClick={(e) => {
                e.stopPropagation();
                updateTrack(t.id, { mute: !t.mute });
              }}
            >
              M
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 rounded-md text-[10px] font-medium",
                t.solo ? "bg-foreground text-background" : "bg-elevated text-muted-foreground",
              )}
              onClick={(e) => {
                e.stopPropagation();
                updateTrack(t.id, { solo: !t.solo });
              }}
            >
              S
            </button>
          </div>
          <div className="flex h-28 w-full justify-center gap-2 py-1">
            <Slider
              orientation="vertical"
              min={0}
              max={1}
              step={0.01}
              value={[t.volume]}
              onValueChange={(v) => updateTrack(t.id, { volume: v[0] ?? t.volume })}
              className="h-full"
            />
            <Meter trackId={t.id} className="h-full w-2" />
          </div>
          <Slider
            min={-1}
            max={1}
            step={0.01}
            value={[t.pan]}
            onValueChange={(v) => updateTrack(t.id, { pan: v[0] ?? 0 })}
          />
          <div className="w-full truncate text-center text-[11px] text-muted-foreground">{t.name}</div>
        </div>
      ))}
      <div className="flex w-[92px] shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-secondary p-2">
        <div className="h-7 text-[10px] uppercase tracking-wider text-muted-foreground">Master</div>
        <div className="flex h-28 justify-center gap-2 py-1">
          <Slider
            orientation="vertical"
            min={0}
            max={1}
            step={0.01}
            value={[project.masterVolume]}
            onValueChange={(v) => setMaster(v[0] ?? 0.85)}
            className="h-full"
          />
          <Meter className="h-full w-2" />
        </div>
        <div className="font-mono text-[11px] tabular-nums">{Math.round(project.masterVolume * 100)}</div>
      </div>
    </div>
  );
}
