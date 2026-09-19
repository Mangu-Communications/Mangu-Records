import { Download, FilePlus2, FolderOpen, HelpCircle, Redo2, Undo2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importBundle } from "@/lib/forge/persist";
import { useForge } from "@/lib/forge/store";
import { TEMPLATES } from "@/lib/forge/templates";

export function TopBar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const project = useForge((s) => s.project);
  const renameProject = useForge((s) => s.renameProject);
  const loadTemplate = useForge((s) => s.loadTemplate);
  const newSession = useForge((s) => s.newSession);
  const importProject = useForge((s) => s.importProject);
  const undo = useForge((s) => s.undo);
  const redo = useForge((s) => s.redo);
  const history = useForge((s) => s.history);
  const future = useForge((s) => s.future);
  const setShowExport = useForge((s) => s.setShowExport);
  const setShowHelp = useForge((s) => s.setShowHelp);
  const setShowSessions = useForge((s) => s.setShowSessions);

  function exportJson() {
    const blob = new Blob(
      [JSON.stringify({ kind: "hathor-forge-session", version: 1, project }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}.forge.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Session bundle saved");
  }

  function onImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as unknown;
        const projectIn = importBundle(parsed);
        if (!projectIn) throw new Error("Not a Forge session");
        importProject(projectIn);
        toast.success("Session loaded");
      } catch {
        toast.error("Could not read that session file");
      }
    };
    reader.readAsText(file);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 md:px-4">
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="font-display text-[22px] italic leading-none text-foreground">Hathor</span>
        <span className="font-mono text-[10px] tracking-[0.32em] text-primary">FORGE</span>
      </div>
      <div className="hidden h-6 w-px bg-border sm:block" />
      <Input
        value={project.name}
        onChange={(e) => renameProject(e.target.value)}
        className="hidden h-8 max-w-[220px] border-transparent bg-transparent px-2 text-sm font-medium hover:bg-elevated sm:flex"
        aria-label="Session name"
      />
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!history.length} aria-label="Undo">
          <Undo2 />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!future.length} aria-label="Redo">
          <Redo2 />
        </Button>
        <select
          className="hidden h-8 max-w-[160px] rounded-md border border-border bg-elevated px-2 text-xs text-foreground md:block"
          value=""
          onChange={(e) => {
            if (e.target.value) loadTemplate(e.target.value);
            e.target.value = "";
          }}
          aria-label="Load template"
        >
          <option value="">Templates</option>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="icon-sm" onClick={newSession} aria-label="New session">
          <FilePlus2 />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportFile(f);
            e.target.value = "";
          }}
        />
        <Button variant="ghost" size="icon-sm" onClick={() => fileRef.current?.click()} aria-label="Open session">
          <FolderOpen />
        </Button>
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => setShowSessions(true)}>
          Sessions
        </Button>
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={exportJson}>
          Save
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setShowHelp(true)} aria-label="Shortcuts">
          <HelpCircle />
        </Button>
        <Button size="sm" onClick={() => setShowExport(true)}>
          <Download />
          <span className="hidden sm:inline">Export WAV</span>
        </Button>
      </div>
    </header>
  );
}
