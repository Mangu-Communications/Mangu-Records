import { create } from "zustand";
import { uid } from "../utils";
import { defaultFxFor, KIND_INSTRUMENT, patchById, registerPatch } from "./presets";
import { loadCurrentProject, loadPrefs, loadUserPatches, savePrefs, saveProject, saveUserPatches } from "./persist";
import { blankProject, cloneProject, demoProject, TEMPLATES } from "./templates";
import type {
  DrumHit,
  DrumSample,
  ExportSettings,
  FxParams,
  Note,
  Project,
  SynthPatch,
  Track,
  TrackKind,
  ViewId,
} from "./types";
import { DEFAULT_EXPORT, DEFAULT_FX } from "./types";

const MAX_HISTORY = 40;

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(project: Project) {
  if (typeof window === "undefined") return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void saveProject(project).catch(() => undefined);
  }, 280);
}

export interface ForgeState {
  project: Project;
  hydrated: boolean;
  isPlaying: boolean;
  view: ViewId;
  selectedTrackId: string | null;
  workingPatch: SynthPatch;
  userPatches: SynthPatch[];
  history: Project[];
  future: Project[];
  voiceBusy: boolean;
  composeBusy: boolean;
  lastError: string | null;
  showHelp: boolean;
  showOnboard: boolean;
  showExport: boolean;
  showSessions: boolean;
  pendingTemplate: string | null;
  storageWarning: string | null;
  exportSettings: ExportSettings;
  hydrate: () => Promise<void>;
  persist: () => void;
  commit: () => void;
  undo: () => void;
  redo: () => void;
  setPlaying: (v: boolean) => void;
  setView: (v: ViewId) => void;
  selectTrack: (id: string | null) => void;
  renameProject: (name: string) => void;
  setBpm: (bpm: number) => void;
  setKey: (key: string) => void;
  setMaster: (v: number) => void;
  setSwing: (v: number) => void;
  setBars: (n: number) => void;
  setLoop: (v: boolean) => void;
  setMetronome: (v: boolean) => void;
  loadTemplate: (id: string, force?: boolean) => void;
  confirmTemplate: () => void;
  cancelTemplate: () => void;
  newSession: () => void;
  importProject: (p: Project) => void;
  updateTrack: (id: string, patch: Partial<Track>) => void;
  addTrack: (kind: TrackKind) => void;
  removeTrack: (id: string) => void;
  duplicateTrack: (id: string) => void;
  toggleDrum: (trackId: string, sample: DrumSample, start: number, velocity?: number) => void;
  addNote: (trackId: string, note: Omit<Note, "id">) => void;
  removeNote: (trackId: string, noteId: string) => void;
  moveNote: (trackId: string, noteId: string, patch: Partial<Note>) => void;
  quantizeTrack: (trackId: string) => void;
  setFx: (trackId: string, fx: Partial<FxParams>) => void;
  setWorkingPatch: (patch: Partial<SynthPatch> | SynthPatch) => void;
  applyPatchToTrack: () => void;
  saveUserPatch: (name: string) => void;
  loadPatch: (id: string) => void;
  addVoiceClip: (trackId: string, clip: Track["voices"][number]) => void;
  setError: (msg: string | null) => void;
  setVoiceBusy: (v: boolean) => void;
  setComposeBusy: (v: boolean) => void;
  setShowHelp: (v: boolean) => void;
  setShowOnboard: (v: boolean) => void;
  setShowExport: (v: boolean) => void;
  setShowSessions: (v: boolean) => void;
  setExportSettings: (s: Partial<ExportSettings>) => void;
  setStorageWarning: (msg: string | null) => void;
}

export const useForge = create<ForgeState>((set, get) => ({
  project: demoProject(),
  hydrated: false,
  isPlaying: false,
  view: "arrange",
  selectedTrackId: "tr-drums",
  workingPatch: patchById("analog-bass"),
  userPatches: [],
  history: [],
  future: [],
  voiceBusy: false,
  composeBusy: false,
  lastError: null,
  showHelp: false,
  showOnboard: false,
  showExport: false,
  showSessions: false,
  pendingTemplate: null,
  storageWarning: null,
  exportSettings: DEFAULT_EXPORT,

  hydrate: async () => {
    const prefs = loadPrefs();
    const userPatches = loadUserPatches();
    userPatches.forEach(registerPatch);
    let project = demoProject();
    try {
      const loaded = await loadCurrentProject();
      if (loaded) project = loaded;
    } catch {
      /* demo */
    }
    set({
      project,
      hydrated: true,
      selectedTrackId: project.tracks[0]?.id ?? null,
      userPatches,
      showOnboard: !prefs.seenOnboard,
    });
  },

  persist: () => {
    const project = { ...get().project, updatedAt: Date.now() };
    set({ project });
    schedulePersist(project);
  },

  commit: () => {
    const { project, history } = get();
    const nextHist = [...history, cloneProject(project)].slice(-MAX_HISTORY);
    set({ history: nextHist, future: [] });
    schedulePersist(get().project);
  },

  undo: () => {
    const { history, project, future } = get();
    const prev = history[history.length - 1];
    if (!prev) return;
    set({
      project: prev,
      history: history.slice(0, -1),
      future: [cloneProject(project), ...future].slice(0, MAX_HISTORY),
    });
    schedulePersist(prev);
  },

  redo: () => {
    const { future, project, history } = get();
    const next = future[0];
    if (!next) return;
    set({
      project: next,
      future: future.slice(1),
      history: [...history, cloneProject(project)].slice(-MAX_HISTORY),
    });
    schedulePersist(next);
  },

  setPlaying: (v) => set({ isPlaying: v }),
  setView: (v) => set({ view: v }),
  selectTrack: (id) => {
    set({ selectedTrackId: id });
    if (id) {
      const t = get().project.tracks.find((x) => x.id === id);
      if (t && t.kind !== "drums" && t.kind !== "sample") {
        set({ workingPatch: patchById(t.instrumentId) });
      }
    }
  },
  renameProject: (name) => {
    get().commit();
    set({ project: { ...get().project, name, updatedAt: Date.now() } });
    get().persist();
  },
  setBpm: (bpm) => {
    set({ project: { ...get().project, bpm: Math.round(Math.min(200, Math.max(48, bpm))) } });
    get().persist();
  },
  setKey: (key) => {
    get().commit();
    set({ project: { ...get().project, key } });
    get().persist();
  },
  setMaster: (v) => {
    set({ project: { ...get().project, masterVolume: v } });
    get().persist();
  },
  setSwing: (v) => {
    set({ project: { ...get().project, swing: v } });
    get().persist();
  },
  setBars: (n) => {
    get().commit();
    set({ project: { ...get().project, bars: Math.min(16, Math.max(4, n)) } });
    get().persist();
  },
  setLoop: (v) => {
    set({ project: { ...get().project, loop: v } });
    get().persist();
  },
  setMetronome: (v) => {
    set({ project: { ...get().project, metronome: v } });
    get().persist();
  },
  loadTemplate: (id, force) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (!force) {
      set({ pendingTemplate: id });
      return;
    }
    get().commit();
    const project = t.build();
    set({ project, selectedTrackId: project.tracks[0]?.id ?? null, pendingTemplate: null });
    get().persist();
  },
  confirmTemplate: () => {
    const id = get().pendingTemplate;
    set({ pendingTemplate: null });
    if (id) get().loadTemplate(id, true);
  },
  cancelTemplate: () => set({ pendingTemplate: null }),
  newSession: () => {
    get().commit();
    const project = blankProject();
    set({ project, selectedTrackId: project.tracks[0]?.id ?? null });
    get().persist();
  },
  importProject: (p) => {
    get().commit();
    set({ project: p, selectedTrackId: p.tracks[0]?.id ?? null });
    get().persist();
  },
  updateTrack: (id, patch) => {
    const project = get().project;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        updatedAt: Date.now(),
      },
    });
    get().persist();
  },
  addTrack: (kind) => {
    get().commit();
    const instrumentId = KIND_INSTRUMENT[kind];
    const t: Track = {
      id: uid("tr"),
      name: kind[0]!.toUpperCase() + kind.slice(1),
      kind,
      instrumentId,
      mute: false,
      solo: false,
      volume: 0.75,
      pan: 0,
      notes: [],
      drums: [],
      voices: [],
      fx: defaultFxFor(kind),
    };
    set({
      project: { ...get().project, tracks: [...get().project.tracks, t] },
      selectedTrackId: t.id,
    });
    get().persist();
  },
  removeTrack: (id) => {
    const project = get().project;
    if (project.tracks.length <= 1) return;
    get().commit();
    const tracks = project.tracks.filter((t) => t.id !== id);
    set({
      project: { ...project, tracks },
      selectedTrackId: tracks[0]?.id ?? null,
    });
    get().persist();
  },
  duplicateTrack: (id) => {
    const src = get().project.tracks.find((t) => t.id === id);
    if (!src) return;
    get().commit();
    const copy: Track = JSON.parse(JSON.stringify(src)) as Track;
    copy.id = uid("tr");
    copy.name = `${src.name} copy`;
    copy.notes = copy.notes.map((n) => ({ ...n, id: uid("n") }));
    copy.drums = copy.drums.map((h) => ({ ...h, id: uid("hit") }));
    const tracks = get().project.tracks.flatMap((t) => (t.id === id ? [t, copy] : [t]));
    set({ project: { ...get().project, tracks }, selectedTrackId: copy.id });
    get().persist();
  },
  toggleDrum: (trackId, sample, start, velocity = 0.85) => {
    get().commit();
    const project = get().project;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) => {
          if (t.id !== trackId) return t;
          const existing = t.drums.find((h) => h.sample === sample && Math.abs(h.start - start) < 0.001);
          const drums: DrumHit[] = existing
            ? t.drums.filter((h) => h.id !== existing.id)
            : [...t.drums, { id: uid("hit"), sample, start, velocity }];
          return { ...t, drums };
        }),
      },
    });
    get().persist();
  },
  addNote: (trackId, note) => {
    get().commit();
    const project = get().project;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) =>
          t.id === trackId ? { ...t, notes: [...t.notes, { ...note, id: uid("n") }] } : t,
        ),
      },
    });
    get().persist();
  },
  removeNote: (trackId, noteId) => {
    get().commit();
    const project = get().project;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) =>
          t.id === trackId ? { ...t, notes: t.notes.filter((n) => n.id !== noteId) } : t,
        ),
      },
    });
    get().persist();
  },
  moveNote: (trackId, noteId, patch) => {
    const project = get().project;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) =>
          t.id === trackId
            ? { ...t, notes: t.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)) }
            : t,
        ),
      },
    });
    get().persist();
  },
  quantizeTrack: (trackId) => {
    get().commit();
    const project = get().project;
    const q = (v: number) => Math.round(v * 4) / 4;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) => {
          if (t.id !== trackId) return t;
          return {
            ...t,
            notes: t.notes.map((n) => ({ ...n, start: q(n.start), duration: Math.max(0.25, q(n.duration)) })),
            drums: t.drums.map((h) => ({ ...h, start: q(h.start) })),
          };
        }),
      },
    });
    get().persist();
  },
  setFx: (trackId, fx) => {
    const project = get().project;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) => (t.id === trackId ? { ...t, fx: { ...t.fx, ...fx } } : t)),
      },
    });
    get().persist();
  },
  setWorkingPatch: (patch) => {
    const current = get().workingPatch;
    if ("id" in patch && "osc1" in patch) {
      set({ workingPatch: patch as SynthPatch });
    } else {
      set({ workingPatch: { ...current, ...patch } });
    }
  },
  applyPatchToTrack: () => {
    const { selectedTrackId, workingPatch, project } = get();
    if (!selectedTrackId) return;
    get().commit();
    const id = workingPatch.id;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) => (t.id === selectedTrackId ? { ...t, instrumentId: id } : t)),
      },
    });
    get().persist();
  },
  saveUserPatch: (name) => {
    const patch: SynthPatch = { ...get().workingPatch, id: uid("patch"), name };
    registerPatch(patch);
    const userPatches = [...get().userPatches, patch];
    set({ workingPatch: patch, userPatches });
    saveUserPatches(userPatches);
  },
  loadPatch: (id) => {
    const fromUser = get().userPatches.find((p) => p.id === id);
    const patch = fromUser ?? patchById(id);
    set({ workingPatch: patch });
    const { selectedTrackId, project } = get();
    if (selectedTrackId) {
      set({
        project: {
          ...project,
          tracks: project.tracks.map((t) => (t.id === selectedTrackId ? { ...t, instrumentId: patch.id } : t)),
        },
      });
      get().persist();
    }
  },
  addVoiceClip: (trackId, clip) => {
    get().commit();
    const project = get().project;
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) => (t.id === trackId ? { ...t, voices: [...t.voices, clip] } : t)),
      },
    });
    get().persist();
  },
  setError: (msg) => set({ lastError: msg }),
  setVoiceBusy: (v) => set({ voiceBusy: v }),
  setComposeBusy: (v) => set({ composeBusy: v }),
  setShowHelp: (v) => set({ showHelp: v }),
  setShowOnboard: (v) => {
    set({ showOnboard: v });
    if (!v) savePrefs({ seenOnboard: true });
  },
  setShowExport: (v) => set({ showExport: v }),
  setShowSessions: (v) => set({ showSessions: v }),
  setExportSettings: (s) => set({ exportSettings: { ...get().exportSettings, ...s } }),
  setStorageWarning: (msg) => set({ storageWarning: msg }),
}));

export function selectedTrack(): Track | undefined {
  const s = useForge.getState();
  return s.project.tracks.find((t) => t.id === s.selectedTrackId);
}

void DEFAULT_FX;
