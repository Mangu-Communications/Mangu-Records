import { useEffect, useRef } from "react";
import { getEngine } from "@/lib/forge/engine";
import { useForge } from "@/lib/forge/store";
import { midiName } from "@/lib/forge/theory";
import { PX_PER_BEAT, type Track } from "@/lib/forge/types";
import { cn } from "@/lib/utils";
import { Meter } from "./meters";
import { PianoRoll } from "./piano-roll";
import { StepSeq } from "./step-seq";

function Playhead({ width }: { width: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const beat = getEngine().getBeat();
      if (ref.current) ref.current.style.transform = `translateX(${beat * PX_PER_BEAT}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={ref} className="pointer-events-none absolute top-0 z-20 h-full w-px bg-primary" style={{ maxWidth: width }}>
      <div className="absolute -top-0.5 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-primary" />
    </div>
  );
}

function Lane({ track, bars }: { track: Track; bars: number }) {
  const selectTrack = useForge((s) => s.selectTrack);
  const selectedTrackId = useForge((s) => s.selectedTrackId);
  const updateTrack = useForge((s) => s.updateTrack);
  const removeNote = useForge((s) => s.removeNote);
  const width = bars * 4 * PX_PER_BEAT;
  const selected = selectedTrackId === track.id;

  return (
    <div className={cn("flex border-b border-border", selected && "bg-elevated/40")} onClick={() => selectTrack(track.id)}>
      <div className="sticky left-0 z-10 flex w-40 shrink-0 items-center gap-2 border-r border-border bg-card px-2">
        <Meter trackId={track.id} className="h-8" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm">{track.name}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-subtle">{track.kind}</div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            updateTrack(track.id, { mute: !track.mute });
          }}
          className={cn(
            "size-7 rounded-md text-[10px] font-medium",
            track.mute ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-elevated",
          )}
          aria-label="Mute"
          aria-pressed={track.mute}
        >
          M
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            updateTrack(track.id, { solo: !track.solo });
          }}
          className={cn(
            "size-7 rounded-md text-[10px] font-medium",
            track.solo ? "bg-foreground text-background" : "text-muted-foreground hover:bg-elevated",
          )}
          aria-label="Solo"
          aria-pressed={track.solo}
        >
          S
        </button>
      </div>
      <div className="arrange-grid relative h-14" style={{ width, minWidth: width, ["--beat" as string]: `${PX_PER_BEAT}px` }}>
        {track.notes.map((n) => {
          const pitches = track.notes.map((x) => x.pitch);
          const minP = Math.min(...pitches, n.pitch);
          const maxP = Math.max(...pitches, n.pitch);
          const span = Math.max(1, maxP - minP);
          const y = 6 + ((maxP - n.pitch) / span) * 32;
          return (
            <button
              key={n.id}
              type="button"
              title={`${midiName(n.pitch)} ${n.duration.toFixed(2)} beats`}
              onClick={(e) => {
                e.stopPropagation();
                removeNote(track.id, n.id);
              }}
              className="absolute h-2 rounded-[2px] bg-primary hover:bg-primary-foreground"
              style={{
                left: n.start * PX_PER_BEAT,
                width: Math.max(6, n.duration * PX_PER_BEAT - 1),
                top: y,
                opacity: 0.55 + n.velocity * 0.4,
              }}
            />
          );
        })}
        {track.drums.map((h) => (
          <div
            key={h.id}
            className="absolute top-1/2 size-2.5 -translate-y-1/2 rotate-45 bg-foreground/80"
            style={{ left: h.start * PX_PER_BEAT, opacity: 0.4 + h.velocity * 0.6 }}
            title={h.sample}
          />
        ))}
        {track.voices.map((v) => (
          <div
            key={v.id}
            className="absolute top-3 h-8 rounded-sm border border-primary/40 bg-primary/20 px-1 font-mono text-[10px] text-foreground"
            style={{ left: v.start * PX_PER_BEAT, width: Math.max(24, v.duration * PX_PER_BEAT) }}
          >
            {v.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArrangeView() {
  const project = useForge((s) => s.project);
  const selectedTrackId = useForge((s) => s.selectedTrackId);
  const width = project.bars * 4 * PX_PER_BEAT;
  const track = project.tracks.find((t) => t.id === selectedTrackId) ?? project.tracks[0];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1 overflow-auto">
        <div className="sticky top-0 z-10 flex border-b border-border bg-background/90 backdrop-blur-sm">
          <div className="sticky left-0 z-10 w-40 shrink-0 border-r border-border bg-background px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Tracks
          </div>
          <div className="relative" style={{ width, minWidth: width }}>
            {Array.from({ length: project.bars }, (_, i) => (
              <span key={i} className="absolute top-1 font-mono text-[10px] text-subtle" style={{ left: i * 4 * PX_PER_BEAT + 4 }}>
                {i + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="relative" style={{ minWidth: width + 160 }}>
          {project.tracks.map((t) => (
            <Lane key={t.id} track={t} bars={project.bars} />
          ))}
          <div className="pointer-events-none absolute top-0 bottom-0 left-40">
            <Playhead width={width} />
          </div>
        </div>
      </div>
      <div className="h-[220px] shrink-0 border-t border-border bg-card">
        {track?.kind === "drums" ? (
          <StepSeq track={track} />
        ) : track ? (
          <PianoRoll track={track} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a track to edit notes.</div>
        )}
      </div>
    </div>
  );
}
