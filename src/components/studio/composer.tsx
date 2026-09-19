import { useState } from "react";
import { toast } from "sonner";
import { composeArrangement } from "@/lib/ai/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { arrangementToProject, localCompose } from "@/lib/forge/apply-compose";
import { useForge } from "@/lib/forge/store";
import { TEMPLATES } from "@/lib/forge/templates";

const PROMPTS = [
  "Dark cinematic trailer in D minor, 92 BPM, choir and glass lead",
  "Late-night deep house, warm bass, offbeat hats, 122 BPM",
  "Sparse ambient dorian field with distant bells",
  "Warehouse techno, filtered bass, brass stabs, 132 BPM",
];

export function Composer() {
  const importProject = useForge((s) => s.importProject);
  const composeBusy = useForge((s) => s.composeBusy);
  const setComposeBusy = useForge((s) => s.setComposeBusy);
  const loadTemplate = useForge((s) => s.loadTemplate);
  const [prompt, setPrompt] = useState(PROMPTS[0]!);

  async function compose() {
    setComposeBusy(true);
    try {
      const result = await composeArrangement({ data: { prompt } });
      if (result.ok) {
        const project = arrangementToProject(JSON.parse(result.json) as unknown);
        if (project) {
          importProject(project);
          toast.success(`Composed “${project.name}”`);
          return;
        }
      }
      const fallback = localCompose(prompt);
      importProject(fallback);
      toast.message(
        result.ok
          ? "Notation incomplete — used a studio template."
          : `${result.error} — loaded a matching template.`,
      );
    } catch (err) {
      const fallback = localCompose(prompt);
      importProject(fallback);
      toast.message(err instanceof Error ? err.message : "Template loaded");
    } finally {
      setComposeBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-5 overflow-y-auto p-4">
      <div>
        <h2 className="font-display text-2xl italic">Compose</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe the instrumental. Forge writes a session — drums, bass, pads, leads — you can play, edit, and export.
        </p>
      </div>
      <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-32" maxLength={500} />
      <div className="flex flex-wrap gap-1.5">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPrompt(p)}
            className="rounded-full border border-border px-3 py-1 text-left text-xs text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            {p}
          </button>
        ))}
      </div>
      <Button onClick={() => void compose()} disabled={composeBusy || prompt.trim().length < 3} className="self-start">
        {composeBusy ? "Composing…" : "Compose session"}
      </Button>
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Or start from a template</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                loadTemplate(t.id);
                toast.success(`Loaded ${t.name}`);
              }}
              className="rounded-xl border border-border bg-card p-3 text-left hover:bg-elevated"
            >
              <div className="text-sm font-medium">{t.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{t.blurb}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
