import { AudioLines, AudioWaveform, Drum, Layers, MicVocal, Wand2 } from "lucide-react";
import { SYNTH_PRESETS } from "@/lib/forge/presets";
import { useForge } from "@/lib/forge/store";
import { TEMPLATES } from "@/lib/forge/templates";
import type { TrackKind, ViewId } from "@/lib/forge/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KINDS: { id: TrackKind; label: string }[] = [
  { id: "drums", label: "Kit" },
  { id: "bass", label: "Bass" },
  { id: "pad", label: "Pad" },
  { id: "lead", label: "Lead" },
  { id: "keys", label: "Keys" },
  { id: "voice", label: "Voice" },
  { id: "fx", label: "FX" },
];

export function Library({ onJump }: { onJump: (view: ViewId) => void }) {
  const loadPatch = useForge((s) => s.loadPatch);
  const loadTemplate = useForge((s) => s.loadTemplate);
  const addTrack = useForge((s) => s.addTrack);
  const userPatches = useForge((s) => s.userPatches);
  const view = useForge((s) => s.view);
  const setView = useForge((s) => s.setView);

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-3">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Create</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              ["sound", "Sound", AudioWaveform],
              ["voice", "Voice", MicVocal],
              ["arrange", "Score", AudioLines],
              ["compose", "Compose", Wand2],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setView(id);
                onJump(id);
              }}
              className={cn(
                "flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-left text-xs",
                "hover:bg-elevated",
                view === id && "border-primary/50 bg-elevated",
              )}
            >
              <Icon className="size-3.5 text-primary" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Sessions</p>
        <div className="flex flex-col gap-1">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => loadTemplate(t.id)}
              className="rounded-md px-2 py-1.5 text-left hover:bg-elevated"
            >
              <div className="text-sm text-foreground">{t.name}</div>
              <div className="text-[11px] leading-snug text-muted-foreground">{t.blurb}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Instruments</p>
        <div className="flex flex-col gap-0.5">
          {SYNTH_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                loadPatch(p.id);
                setView("sound");
              }}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-elevated"
            >
              <span>{p.name}</span>
              <span className="font-mono text-[10px] uppercase text-subtle">{p.category}</span>
            </button>
          ))}
          {userPatches.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                loadPatch(p.id);
                setView("sound");
              }}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-elevated"
            >
              <span>{p.name}</span>
              <span className="font-mono text-[10px] uppercase text-primary">User</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Add track</p>
        <div className="flex flex-wrap gap-1">
          {KINDS.map((k) => (
            <Button key={k.id} variant="outline" size="sm" onClick={() => addTrack(k.id)}>
              {k.id === "drums" ? <Drum className="size-3.5" /> : <Layers className="size-3.5" />}
              {k.label}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}
