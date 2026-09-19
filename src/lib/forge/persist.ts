import type { Project, SynthPatch } from "./types";
import { normalizeProject } from "./types";

const DB_NAME = "hathor-forge";
const DB_VERSION = 2;
const PREF_KEY = "hathor-forge-prefs";
const LEGACY_KEY = "hathor-forge-v1";
const PRESET_KEY = "hathor-forge-user-patches";

export interface StoredAudio {
  id: string;
  sampleRate: number;
  channels: Float32Array[];
}

export interface SessionMeta {
  id: string;
  name: string;
  updatedAt: number;
  bpm: number;
  bars: number;
  tracks: number;
}

export interface Prefs {
  seenOnboard: boolean;
  lastSessionId: string | null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      if (!db.objectStoreNames.contains("audio")) db.createObjectStore("audio");
      if (!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb open failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb tx failed"));
    tx.onabort = () => reject(tx.error ?? new Error("idb tx aborted"));
  });
}

export async function saveProject(project: Project): Promise<void> {
  const record: Project = { ...project, updatedAt: Date.now() };
  const db = await openDb();
  try {
    const tx = db.transaction(["kv", "sessions"], "readwrite");
    tx.objectStore("kv").put(record, "current");
    tx.objectStore("sessions").put(record);
    await txDone(tx);
  } finally {
    db.close();
  }
  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(record));
  } catch {
    /* quota — IndexedDB is source of truth */
  }
}

export async function loadCurrentProject(): Promise<Project | null> {
  try {
    const db = await openDb();
    try {
      const fromIdb = await new Promise<Project | undefined>((resolve, reject) => {
        const tx = db.transaction("kv", "readonly");
        const req = tx.objectStore("kv").get("current");
        req.onsuccess = () => resolve(req.result as Project | undefined);
        req.onerror = () => reject(req.error);
      });
      const normalized = fromIdb ? normalizeProject(fromIdb) : null;
      if (normalized) return normalized;
    } finally {
      db.close();
    }
  } catch {
    /* fall through */
  }
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    return normalizeProject(JSON.parse(raw) as Project);
  } catch {
    return null;
  }
}

export async function listSessions(): Promise<SessionMeta[]> {
  try {
    const db = await openDb();
    try {
      const rows = await new Promise<Project[]>((resolve, reject) => {
        const tx = db.transaction("sessions", "readonly");
        const req = tx.objectStore("sessions").getAll();
        req.onsuccess = () => resolve((req.result as Project[]) ?? []);
        req.onerror = () => reject(req.error);
      });
      return rows
        .map((p) => ({
          id: p.id,
          name: p.name,
          updatedAt: p.updatedAt,
          bpm: p.bpm,
          bars: p.bars,
          tracks: p.tracks?.length ?? 0,
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt);
    } finally {
      db.close();
    }
  } catch {
    return [];
  }
}

export async function loadSessionById(id: string): Promise<Project | null> {
  try {
    const db = await openDb();
    try {
      const p = await new Promise<Project | undefined>((resolve, reject) => {
        const tx = db.transaction("sessions", "readonly");
        const req = tx.objectStore("sessions").get(id);
        req.onsuccess = () => resolve(req.result as Project | undefined);
        req.onerror = () => reject(req.error);
      });
      return p ? normalizeProject(p) : null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction("sessions", "readwrite");
    tx.objectStore("sessions").delete(id);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function saveAudioBuffer(id: string, buffer: AudioBuffer): Promise<void> {
  const channels: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    channels.push(new Float32Array(buffer.getChannelData(c)));
  }
  const db = await openDb();
  try {
    const tx = db.transaction("audio", "readwrite");
    tx.objectStore("audio").put({ id, sampleRate: buffer.sampleRate, channels } satisfies StoredAudio, id);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function loadAudioBuffer(ctx: BaseAudioContext, id: string): Promise<AudioBuffer | null> {
  try {
    const db = await openDb();
    try {
      const rec = await new Promise<StoredAudio | undefined>((resolve, reject) => {
        const tx = db.transaction("audio", "readonly");
        const req = tx.objectStore("audio").get(id);
        req.onsuccess = () => resolve(req.result as StoredAudio | undefined);
        req.onerror = () => reject(req.error);
      });
      if (!rec?.channels?.length) return null;
      const buf = ctx.createBuffer(rec.channels.length, rec.channels[0]!.length, rec.sampleRate);
      rec.channels.forEach((ch, i) => buf.copyToChannel(new Float32Array(ch), i));
      return buf;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export function loadPrefs(): Prefs {
  if (typeof localStorage === "undefined") return { seenOnboard: false, lastSessionId: null };
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return { seenOnboard: false, lastSessionId: null };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      seenOnboard: Boolean(parsed.seenOnboard),
      lastSessionId: parsed.lastSessionId ?? null,
    };
  } catch {
    return { seenOnboard: false, lastSessionId: null };
  }
}

export function savePrefs(prefs: Partial<Prefs>): void {
  if (typeof localStorage === "undefined") return;
  const next = { ...loadPrefs(), ...prefs };
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function loadUserPatches(): SynthPatch[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    return raw ? (JSON.parse(raw) as SynthPatch[]) : [];
  } catch {
    return [];
  }
}

export function saveUserPatches(patches: SynthPatch[]): void {
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(patches));
  } catch {
    /* ignore */
  }
}

export async function exportBundle(project: Project): Promise<Blob> {
  const payload = {
    kind: "hathor-forge-session",
    version: 1,
    project,
    exportedAt: Date.now(),
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

export function importBundle(raw: unknown): Project | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const project = (o.project ?? o) as Project;
  return normalizeProject(project);
}
