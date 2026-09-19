import { useMemo, type MouseEvent } from "react";
import { getEngine } from "@/lib/forge/engine";
import { patchById } from "@/lib/forge/presets";
import { useForge } from "@/lib/forge/store";
import { midiName } from "@/lib/forge/theory";
import { PX_PER_BEAT, type Note, type Track } from "@/lib/forge/types";
import { cn } from "@/lib/utils";

const LOW = 36;
const HIGH = 84;
const ROW = 14;

export function PianoRoll({ track }: { track: Track }) {
  const project = useForge((s) => s.project);
  const addNote = useForge((s) => s.addNote);
  const removeNote = useForge((s) => s.removeNote);
  const width = project.bars * 4 * PX_PER_BEAT;
  const rows = useMemo(() => {
    const list: number[] = [];
    for (let m = HIGH; m >= LOW; m--) list.push(m);
    return list;
  }, []);

  function onGrid(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
    const y = e.clientY - rect.top + e.currentTarget.scrollTop;
    const beat = Math.round((x / PX_PER_BEAT) * 4) / 4;
    const row = Math.floor(y / ROW);
    const pitch = rows[row];
    if (pitch == null || beat < 0 || beat >= project.bars * 4) return;
    const existing = track.notes.find((n) => n.pitch === pitch && Math.abs(n.start - beat) < 0.12);
    if (existing) {
      removeNote(track.id, existing.id);
      return;
    }
    const duration = e.shiftKey ? 1 : 0.25;
    addNote(track.id, { pitch, start: beat, duration, velocity: 0.8 });
    getEngine().previewNote(patchById(track.instrumentId), pitch, 0.8, 0.25);
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="w-10 shrink-0 overflow-hidden border-r border-border bg-card">
        {rows.map((p) => {
          const black = [1, 3, 6, 8, 10].includes(p % 12);
          return (
            <div
              key={p}
              className={cn(
                "flex items-center justify-end pr-1 font-mono text-[9px] leading-[14px]",
                black ? "bg-elevated text-subtle" : "text-muted-foreground",
              )}
              style={{ height: ROW }}
            >
              {p % 12 === 0 ? midiName(p) : ""}
            </div>
          );
        })}
      </div>
      <div className="relative min-w-0 flex-1 overflow-auto" onClick={onGrid} role="presentation">
        <div className="relative" style={{ width, height: rows.length * ROW }}>
          {rows.map((p, i) => {
            const black = [1, 3, 6, 8, 10].includes(p % 12);
            return (
              <div
                key={p}
                className={cn("absolute left-0 right-0 border-b border-border/60", black && "bg-elevated/40")}
                style={{ top: i * ROW, height: ROW }}
              />
            );
          })}
          {Array.from({ length: project.bars * 4 }, (_, i) => (
            <div
              key={i}
              className={cn("absolute top-0 bottom-0 w-px", i % 4 === 0 ? "bg-foreground/20" : "bg-border")}
              style={{ left: i * PX_PER_BEAT }}
            />
          ))}
          {track.notes.map((n) => (
            <NoteBlock key={n.id} note={n} trackId={track.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NoteBlock({ note, trackId }: { note: Note; trackId: string }) {
  const removeNote = useForge((s) => s.removeNote);
  const top = (HIGH - note.pitch) * ROW;
  if (note.pitch < LOW || note.pitch > HIGH) return null;
  return (
    <button
      type="button"
      title={`${midiName(note.pitch)} · click to remove`}
      onClick={(e) => {
        e.stopPropagation();
        removeNote(trackId, note.id);
      }}
      className="absolute rounded-[2px] bg-primary hover:bg-primary-foreground"
      style={{
        left: note.start * PX_PER_BEAT,
        width: Math.max(6, note.duration * PX_PER_BEAT - 1),
        top: top + 1,
        height: ROW - 2,
        opacity: 0.55 + note.velocity * 0.4,
      }}
    />
  );
}
