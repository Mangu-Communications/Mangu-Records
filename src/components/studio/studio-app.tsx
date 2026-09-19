import { AudioLines, AudioWaveform, MicVocal, SlidersHorizontal, Wand2 } from "lucide-react";
import { useEffect, useLayoutEffect } from "react";
import { Toaster } from "sonner";
import { getEngine } from "@/lib/forge/engine";
import { loadAudioBuffer, loadPrefs } from "@/lib/forge/persist";
import { useForge } from "@/lib/forge/store";
import type { ViewId } from "@/lib/forge/types";
import { cn } from "@/lib/utils";
import { ArrangeView } from "./arrange";
import { Composer } from "./composer";
import { Inspector } from "./inspector";
import { Library } from "./library";
import { MixerView } from "./mixer";
import { ExportDialog, HelpOverlay, Onboard, SessionDialog, TemplateConfirm } from "./overlays";
import { SoundLab } from "./sound-lab";
import { TopBar } from "./top-bar";
import { Transport } from "./transport";
import { VoiceLab } from "./voice-lab";

const VIEWS: { id: ViewId; label: string; icon: typeof AudioLines }[] = [
  { id: "arrange", label: "Score", icon: AudioLines },
  { id: "mixer", label: "Mix", icon: SlidersHorizontal },
  { id: "sound", label: "Sound", icon: AudioWaveform },
  { id: "voice", label: "Voice", icon: MicVocal },
  { id: "compose", label: "Compose", icon: Wand2 },
];

const PIANO_KEYS: Record<string, number> = {
  a: 60,
  w: 61,
  s: 62,
  e: 63,
  d: 64,
  f: 65,
  t: 66,
  g: 67,
  y: 68,
  h: 69,
  u: 70,
  j: 71,
  k: 72,
};

const VIEW_BY_DIGIT: Record<string, ViewId> = {
  Digit1: "arrange",
  Digit2: "mixer",
  Digit3: "sound",
  Digit4: "voice",
  Digit5: "compose",
};

export function StudioApp() {
  const hydrate = useForge((s) => s.hydrate);
  const hydrated = useForge((s) => s.hydrated);
  const project = useForge((s) => s.project);
  const isPlaying = useForge((s) => s.isPlaying);
  const setPlaying = useForge((s) => s.setPlaying);
  const view = useForge((s) => s.view);
  const setView = useForge((s) => s.setView);
  const undo = useForge((s) => s.undo);
  const redo = useForge((s) => s.redo);
  const workingPatch = useForge((s) => s.workingPatch);
  const setLoop = useForge((s) => s.setLoop);
  const setMetronome = useForge((s) => s.setMetronome);
  const setShowHelp = useForge((s) => s.setShowHelp);
  const showHelp = useForge((s) => s.showHelp);
  const showOnboard = useForge((s) => s.showOnboard);
  const showExport = useForge((s) => s.showExport);
  const showSessions = useForge((s) => s.showSessions);
  const pendingTemplate = useForge((s) => s.pendingTemplate);
  const setShowExport = useForge((s) => s.setShowExport);
  const setShowSessions = useForge((s) => s.setShowSessions);
  const setShowOnboard = useForge((s) => s.setShowOnboard);
  const cancelTemplate = useForge((s) => s.cancelTemplate);
  const storageWarning = useForge((s) => s.storageWarning);
  const setStorageWarning = useForge((s) => s.setStorageWarning);

  useLayoutEffect(() => {
    if (!loadPrefs().seenOnboard) useForge.setState({ showOnboard: true });
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const engine = getEngine();
    void engine.ensure().then(async (ctx) => {
      for (const track of useForge.getState().project.tracks) {
        for (const clip of track.voices) {
          if (engine.voiceBuffers.has(clip.id)) continue;
          const buf = await loadAudioBuffer(ctx, clip.id);
          if (buf) engine.voiceBuffers.set(clip.id, buf);
        }
      }
    });
  }, [hydrated, project.id]);

  useEffect(() => {
    if (isPlaying) getEngine().applyMix(project);
  }, [project, isPlaying]);

  async function playToggle() {
    const engine = getEngine();
    if (isPlaying) {
      engine.halt();
      setPlaying(false);
      return;
    }
    engine.listeners = { onStop: () => setPlaying(false) };
    await engine.play(useForge.getState().project);
    setPlaying(true);
  }

  function stop() {
    getEngine().stop();
    setPlaying(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (e.key === "Escape") {
        if (showHelp) setShowHelp(false);
        else if (showExport) setShowExport(false);
        else if (showSessions) setShowSessions(false);
        else if (showOnboard) setShowOnboard(false);
        else if (pendingTemplate) cancelTemplate();
        return;
      }

      if (e.key === "?" && !typing) {
        e.preventDefault();
        setShowHelp(!showHelp);
        return;
      }

      if (e.code === "Space") {
        if (typing) return;
        e.preventDefault();
        if (e.shiftKey) {
          stop();
          return;
        }
        void playToggle();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (typing) return;

      const jump = VIEW_BY_DIGIT[e.code];
      if (jump && !e.metaKey && !e.ctrlKey) {
        setView(jump);
        return;
      }
      if (e.key.toLowerCase() === "l") {
        setLoop(!useForge.getState().project.loop);
        return;
      }
      if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey) {
        setMetronome(!useForge.getState().project.metronome);
        return;
      }
      const midi = PIANO_KEYS[e.key.toLowerCase()];
      if (midi != null && view === "sound") {
        getEngine().previewNote(workingPatch, midi);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const onErr = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason ?? "");
      if (/quota|storage/i.test(msg)) setStorageWarning("Storage is full. Export still works; autosave may fail.");
    };
    window.addEventListener("unhandledrejection", onErr);
    return () => window.removeEventListener("unhandledrejection", onErr);
  }, [setStorageWarning]);

  function mainView() {
    if (view === "mixer") return <MixerView />;
    if (view === "sound") return <SoundLab />;
    if (view === "voice") return <VoiceLab />;
    if (view === "compose") return <Composer />;
    return <ArrangeView />;
  }

  return (
    <div className="studio-app flex h-dvh flex-col overflow-hidden text-foreground">
      <Toaster theme="dark" position="bottom-right" />
      <TopBar />
      {storageWarning ? (
        <div className="border-b border-primary/40 bg-elevated px-4 py-2 text-sm text-foreground" role="status">
          {storageWarning}
        </div>
      ) : null}
      <Transport onPlay={() => void playToggle()} onStop={stop} />
      <div className="hidden shrink-0 items-center gap-1 border-b border-border px-3 py-1.5 md:flex">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs",
              view === v.id ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <v.icon className="size-3.5" />
            {v.label}
          </button>
        ))}
        <span className="ml-auto hidden font-mono text-[10px] text-subtle lg:inline">
          Space play · ? shortcuts · Ember Protocol ready
        </span>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden min-h-0 w-64 shrink-0 overflow-hidden border-r border-border bg-card md:block">
          <Library onJump={setView} />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">{mainView()}</div>
        </div>
        <aside className="hidden min-h-0 w-80 shrink-0 overflow-hidden border-l border-border bg-card lg:block">
          <Inspector />
        </aside>
      </div>
      <nav className="flex shrink-0 border-t border-border md:hidden">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={cn(
              "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] uppercase tracking-wider",
              view === v.id ? "text-primary" : "text-muted-foreground",
            )}
          >
            <v.icon className="size-4" />
            {v.label}
          </button>
        ))}
      </nav>
      <Onboard />
      <HelpOverlay />
      <TemplateConfirm />
      <ExportDialog />
      <SessionDialog />
      {!hydrated ? <span className="sr-only">Loading session</span> : null}
    </div>
  );
}
