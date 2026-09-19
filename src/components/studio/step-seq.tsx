import { DRUM_ROWS } from "@/lib/forge/presets";
import { getEngine } from "@/lib/forge/engine";
import { useForge } from "@/lib/forge/store";
import { stepsFor, type Track } from "@/lib/forge/types";
import { cn } from "@/lib/utils";

export function StepSeq({ track }: { track: Track }) {
  const project = useForge((s) => s.project);
  const toggleDrum = useForge((s) => s.toggleDrum);
  const steps = stepsFor(project.bars);

  return (
    <div className="h-full min-h-0 overflow-auto p-2">
      {DRUM_ROWS.map((row) => (
        <div key={row.sample} className="mb-1 flex items-center gap-2">
          <button
            type="button"
            className="w-14 shrink-0 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            onClick={() => getEngine().previewDrum(row.sample)}
          >
            {row.label}
          </button>
          <div className="flex min-w-0 flex-1 gap-px overflow-x-auto pb-1">
            {Array.from({ length: steps }, (_, i) => {
              const start = i * 0.25;
              const hit = track.drums.find((h) => h.sample === row.sample && Math.abs(h.start - start) < 0.001);
              const bar = i % 16 === 0;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDrum(track.id, row.sample, start, 0.85)}
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-[3px] md:h-7 md:min-w-4 md:w-auto md:flex-1",
                    hit ? "bg-primary" : bar ? "bg-elevated" : "bg-secondary",
                    i % 4 === 0 && !hit && "outline outline-1 outline-border",
                  )}
                  aria-label={`${row.label} step ${i + 1}`}
                  aria-pressed={Boolean(hit)}
                />
              );
            })}
          </div>
        </div>
      ))}
      <p className="mt-2 text-[11px] text-subtle">Click a pad to toggle. Preview a row with its label.</p>
    </div>
  );
}
