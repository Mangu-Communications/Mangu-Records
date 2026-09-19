import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getEngine } from "@/lib/forge/engine";
import { listSessions, loadSessionById, type SessionMeta } from "@/lib/forge/persist";
import { useForge } from "@/lib/forge/store";
import { TEMPLATES } from "@/lib/forge/templates";
import type { BitDepth, SampleRate } from "@/lib/forge/types";
import { Modal } from "./modal";

export function Onboard() {
  const open = useForge((s) => s.showOnboard);
  const setShowOnboard = useForge((s) => s.setShowOnboard);
  const setPlaying = useForge((s) => s.setPlaying);
  const project = useForge((s) => s.project);

  async function playNow() {
    setShowOnboard(false);
    const engine = getEngine();
    engine.listeners = { onStop: () => setPlaying(false) };
    await engine.play(project);
    setPlaying(true);
  }

  return (
    <Modal
      open={open}
      title="Ember Protocol is loaded"
      onClose={() => setShowOnboard(false)}
      footer={
        <>
          <Button variant="secondary" onClick={() => setShowOnboard(false)}>
            Look around
          </Button>
          <Button onClick={() => void playNow()}>Play session</Button>
        </>
      }
    >
      <p>
        Hathor Forge is a studio, not a player. Spacebar starts and stops playback. Ember Protocol is the default
        session — drums, bass, pad, glass, bells, choir — ready to edit.
      </p>
      <ul className="mt-3 space-y-1 text-foreground">
        <li>Sound — design a patch, play it on the piano, assign it to a track.</li>
        <li>Voice — write a line, render a take onto the timeline.</li>
        <li>Compose — describe an instrumental; edit every note after.</li>
        <li>Export — bounce a sample-accurate stereo WAV on this device.</li>
      </ul>
    </Modal>
  );
}

export function HelpOverlay() {
  const open = useForge((s) => s.showHelp);
  const setShowHelp = useForge((s) => s.setShowHelp);
  return (
    <Modal open={open} title="Shortcuts" onClose={() => setShowHelp(false)} wide>
      <div className="grid gap-2 font-mono text-xs text-foreground sm:grid-cols-2">
        <Row k="Space" d="Play / stop" />
        <Row k="Shift+Space" d="Stop and return to start" />
        <Row k="1–5" d="Score, Mix, Sound, Voice, Compose" />
        <Row k="L" d="Toggle loop" />
        <Row k="C" d="Metronome click" />
        <Row k="⌘Z / Ctrl+Z" d="Undo" />
        <Row k="⌘⇧Z" d="Redo" />
        <Row k="?" d="This overlay" />
        <Row k="Esc" d="Close dialogs" />
        <Row k="A–K" d="Piano (Sound view)" />
      </div>
      <p className="mt-3">
        Space always transports unless a text field is focused and needs the key to type. Sessions autosave on this
        device.
      </p>
    </Modal>
  );
}

function Row({ k, d }: { k: string; d: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-elevated px-2 py-1.5">
      <span className="text-primary">{k}</span>
      <span className="text-muted-foreground">{d}</span>
    </div>
  );
}

export function TemplateConfirm() {
  const pending = useForge((s) => s.pendingTemplate);
  const confirm = useForge((s) => s.confirmTemplate);
  const cancel = useForge((s) => s.cancelTemplate);
  const tpl = TEMPLATES.find((t) => t.id === pending);
  return (
    <Modal
      open={Boolean(pending)}
      title={`Load ${tpl?.name ?? "template"}?`}
      onClose={cancel}
      footer={
        <>
          <Button variant="secondary" onClick={cancel}>
            Keep current
          </Button>
          <Button onClick={confirm}>Load template</Button>
        </>
      }
    >
      <p>This replaces the session on the timeline. Undo will bring the previous session back.</p>
      {tpl ? <p className="mt-2 text-foreground">{tpl.blurb}</p> : null}
    </Modal>
  );
}

export function ExportDialog() {
  const open = useForge((s) => s.showExport);
  const setOpen = useForge((s) => s.setShowExport);
  const project = useForge((s) => s.project);
  const settings = useForge((s) => s.exportSettings);
  const setSettings = useForge((s) => s.setExportSettings);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  async function bounce() {
    setBusy(true);
    setReport(null);
    try {
      const engine = getEngine();
      if (settings.stems) {
        const stems = await engine.renderStems(project, settings);
        for (const s of stems) downloadBlob(s.blob, `${slug(project.name)}-${s.name}.wav`);
        setReport(`Exported ${stems.length} stems.`);
        toast.success("Stems exported");
      } else {
        const { blob, report: r } = await engine.renderWav(project, settings);
        downloadBlob(blob, `${slug(project.name)}.wav`);
        const peakDb = r.peak > 0 ? (20 * Math.log10(r.peak)).toFixed(1) : "-∞";
        setReport(
          `${r.durationSec.toFixed(2)}s · peak ${peakDb} dBFS · ${r.clippedSamples} clipped samples · ${r.sampleRate} Hz / ${r.bitDepth}-bit`,
        );
        toast.success(r.clippedSamples ? "WAV exported — clipping reported" : "WAV exported");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Export WAV"
      onClose={() => setOpen(false)}
      footer={
        <>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={() => void bounce()} disabled={busy}>
            {busy ? "Rendering…" : "Bounce"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 text-foreground">
        <label className="grid gap-1 text-xs">
          Sample rate
          <select
            className="h-9 rounded-md border border-border bg-elevated px-2"
            value={settings.sampleRate}
            onChange={(e) => setSettings({ sampleRate: Number(e.target.value) as SampleRate })}
          >
            <option value={44100}>44.1 kHz</option>
            <option value={48000}>48 kHz</option>
            <option value={96000}>96 kHz</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          Bit depth
          <select
            className="h-9 rounded-md border border-border bg-elevated px-2"
            value={settings.bitDepth}
            onChange={(e) => setSettings({ bitDepth: Number(e.target.value) as BitDepth })}
          >
            <option value={16}>16-bit PCM (dithered)</option>
            <option value={24}>24-bit PCM</option>
            <option value={32}>32-bit float</option>
          </select>
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={settings.includeTail}
          onChange={(e) => setSettings({ includeTail: e.target.checked })}
        />
        Include reverb / delay tail
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={settings.normalize}
          onChange={(e) => setSettings({ normalize: e.target.checked })}
        />
        Normalize to −1 dBTP
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={settings.stems} onChange={(e) => setSettings({ stems: e.target.checked })} />
        Export stems (one file per track)
      </label>
      {report ? <p className="mt-3 font-mono text-xs text-foreground">{report}</p> : null}
    </Modal>
  );
}

export function SessionDialog() {
  const open = useForge((s) => s.showSessions);
  const setOpen = useForge((s) => s.setShowSessions);
  const importProject = useForge((s) => s.importProject);
  const [rows, setRows] = useState<SessionMeta[]>([]);

  useEffect(() => {
    if (!open) return;
    void listSessions().then(setRows);
  }, [open]);

  return (
    <Modal open={open} title="Sessions on this device" onClose={() => setOpen(false)} wide>
      {rows.length === 0 ? (
        <p>No saved sessions yet. Autosave writes Ember Protocol and every edit here.</p>
      ) : (
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {rows.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-elevated"
                onClick={async () => {
                  const p = await loadSessionById(s.id);
                  if (p) {
                    importProject(p);
                    setOpen(false);
                    toast.success(`Loaded ${p.name}`);
                  }
                }}
              >
                <span className="text-foreground">{s.name}</span>
                <span className="font-mono text-[10px] text-subtle">
                  {s.bpm} BPM · {s.tracks} tracks
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function slug(name: string) {
  return name.replace(/\s+/g, "-").toLowerCase() || "session";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
