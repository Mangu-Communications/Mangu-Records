import { Pause, Play, Repeat, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getEngine } from "@/lib/forge/engine";
import { useForge } from "@/lib/forge/store";
import { BEATS_PER_BAR, beatDuration, projectDurationSec } from "@/lib/forge/types";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { Meter, Scope } from "./meters";

export function Transport({
  onPlay,
  onStop,
}: {
  onPlay: () => void;
  onStop: () => void;
}) {
  const project = useForge((s) => s.project);
  const isPlaying = useForge((s) => s.isPlaying);
  const setBpm = useForge((s) => s.setBpm);
  const setMaster = useForge((s) => s.setMaster);
  const setSwing = useForge((s) => s.setSwing);
  const setLoop = useForge((s) => s.setLoop);
  const setMetronome = useForge((s) => s.setMetronome);
  const [clock, setClock] = useState("0:00");
  const [barBeat, setBarBeat] = useState("1.1");
  const [clip, setClip] = useState(false);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const beat = getEngine().getBeat();
      const sec = beat * beatDuration(project.bpm);
      setClock(formatTime(sec));
      const bar = Math.floor(beat / BEATS_PER_BAR) + 1;
      const b = (beat % BEATS_PER_BAR) + 1;
      setBarBeat(`${bar}.${Math.floor(b)}`);
      setClip(getEngine().getPeak() >= 0.99);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [project.bpm]);

  const total = formatTime(projectDurationSec(project));

  return (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-3 md:px-4">
      <div className="flex items-center gap-1.5">
        <Button size="icon" onClick={onPlay} aria-label={isPlaying ? "Pause" : "Play"} className="size-11 rounded-full">
          {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
        </Button>
        <Button variant="secondary" size="icon-sm" onClick={onStop} aria-label="Stop">
          <Square className="size-3.5 fill-current" />
        </Button>
        <Button
          variant={project.loop ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => setLoop(!project.loop)}
          aria-label="Loop"
          aria-pressed={project.loop}
        >
          <Repeat className="size-3.5" />
        </Button>
      </div>
      <div className="min-w-16">
        <div className="font-mono text-lg tabular-nums leading-none">{clock}</div>
        <div className="font-mono text-[10px] text-muted-foreground">
          {barBeat} / {total} · {project.timeNumerator}/{project.timeDenominator}
        </div>
      </div>
      <label className="hidden items-center gap-2 md:flex">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">BPM</span>
        <input
          type="number"
          min={48}
          max={200}
          value={project.bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="h-8 w-16 rounded-md border border-border bg-elevated px-2 font-mono text-sm tabular-nums"
        />
      </label>
      <button
        type="button"
        onClick={() => setMetronome(!project.metronome)}
        className={cn(
          "hidden h-8 rounded-md px-2 font-mono text-[10px] uppercase tracking-wider md:inline-flex md:items-center",
          project.metronome ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-elevated",
        )}
        aria-pressed={project.metronome}
      >
        Click
      </button>
      <div className="hidden w-28 lg:block">
        <Slider min={0} max={0.4} step={0.01} value={[project.swing]} onValueChange={(v) => setSwing(v[0] ?? 0)} />
        <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Swing</div>
      </div>
      <div className="hidden h-10 flex-1 overflow-hidden rounded-md border border-border bg-card md:block">
        <Scope />
      </div>
      <div className="flex items-center gap-2">
        <div
          className={cn("size-2 rounded-full", clip ? "bg-primary" : "bg-elevated")}
          title={clip ? "Clipping" : "Peak under ceiling"}
          aria-label={clip ? "Clipping" : "Not clipping"}
        />
        <div className="h-10">
          <Meter />
        </div>
        <div className="w-24">
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[project.masterVolume]}
            onValueChange={(v) => {
              const val = v[0] ?? 0.85;
              setMaster(val);
              getEngine().setMaster(val);
            }}
          />
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Master</div>
        </div>
      </div>
    </div>
  );
}
