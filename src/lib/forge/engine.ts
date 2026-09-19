import { clipReportFor, distortionCurve, encodeWav, makePcm, normalizeChannels, reverbIR, type PcmBuffer } from "./dsp";
import { patchById } from "./presets";
import type { ClipReport, ExportSettings, FxParams, Project, SynthPatch, Track } from "./types";
import { DEFAULT_EXPORT, beatDuration, projectDurationSec } from "./types";
import { playDrum, playSynthVoice } from "./voices";

type Stoppable = { stop: (when?: number) => void };

export interface TrackGraph {
  input: GainNode;
  filter: BiquadFilterNode;
  delay: DelayNode;
  delayFb: GainNode;
  delayWet: GainNode;
  reverbWet: GainNode;
  chorusWet: GainNode;
  drive: WaveShaperNode;
  panner: StereoPannerNode;
  gain: GainNode;
  analyser: AnalyserNode;
  lfo: OscillatorNode;
}

function swingOffset(beat: number, swing: number, spb: number): number {
  if (swing <= 0) return 0;
  const sixteenths = beat / 0.25;
  const isOff = Math.round(sixteenths) % 2 === 1;
  return isOff ? swing * 0.25 * spb : 0;
}

function silentFor(track: Track, project: Project): boolean {
  const soloed = project.tracks.some((t) => t.solo);
  return track.mute || (soloed && !track.solo);
}

export class ForgeEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  gate: GainNode | null = null;
  limiter: DynamicsCompressorNode | null = null;
  analyser: AnalyserNode | null = null;
  metroGain: GainNode | null = null;
  trackGraphs = new Map<string, TrackGraph>();
  trackAnalysers = new Map<string, AnalyserNode>();
  trackGains = new Map<string, GainNode>();
  playing = false;
  private startCtxTime = 0;
  private startBeat = 0;
  private bpm = 110;
  private loopBeats = 32;
  private timer: number | null = null;
  private project: Project | null = null;
  voiceBuffers = new Map<string, AudioBuffer>();
  sampleBuffers = new Map<string, AudioBuffer>();
  listeners: { onBeat?: (beat: number) => void; onStop?: () => void; onClip?: (v: boolean) => void } = {};
  private live: Stoppable[] = [];
  private scheduledLoop = -1;
  private lastPeak = 0;

  async ensure(): Promise<AudioContext> {
    if (!this.ctx || this.ctx.state === "closed") {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.gate = ctx.createGain();
      this.gate.gain.value = 1;
      this.master = ctx.createGain();
      this.master.gain.value = 0.85;
      this.limiter = ctx.createDynamicsCompressor();
      this.limiter.threshold.value = -3;
      this.limiter.knee.value = 2;
      this.limiter.ratio.value = 20;
      this.limiter.attack.value = 0.003;
      this.limiter.release.value = 0.12;
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.metroGain = ctx.createGain();
      this.metroGain.gain.value = 0.22;
      this.master.connect(this.limiter);
      this.metroGain.connect(this.limiter);
      this.limiter.connect(this.gate);
      this.gate.connect(this.analyser);
      this.analyser.connect(ctx.destination);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    return this.ctx;
  }

  getBeat(): number {
    if (!this.playing || !this.ctx) return this.startBeat;
    const elapsed = this.ctx.currentTime - this.startCtxTime;
    const beat = this.startBeat + elapsed / beatDuration(this.bpm);
    if (this.project && this.project.loop === false) return Math.min(this.loopBeats, Math.max(0, beat));
    const wrapped = ((beat % this.loopBeats) + this.loopBeats) % this.loopBeats;
    return wrapped;
  }

  getPeak(): number {
    return this.lastPeak;
  }

  setMaster(v: number) {
    if (!this.master || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(Math.max(0, Math.min(1.2, v)), t, 0.02);
  }

  setTrackVolume(id: string, v: number) {
    const g = this.trackGraphs.get(id);
    if (!g || !this.ctx) return;
    g.gain.gain.setTargetAtTime(Math.max(0, v), this.ctx.currentTime, 0.02);
  }

  applyMix(project: Project) {
    if (!this.ctx || !this.playing) return;
    this.setMaster(project.masterVolume);
    for (const track of project.tracks) {
      const g = this.trackGraphs.get(track.id);
      if (!g) continue;
      const t = this.ctx.currentTime;
      const vol = silentFor(track, project) ? 0 : track.volume;
      g.gain.gain.setTargetAtTime(vol, t, 0.012);
      g.panner.pan.setTargetAtTime(track.pan, t, 0.02);
      this.applyFx(g, track.fx, project.bpm);
    }
    if (this.metroGain) {
      this.metroGain.gain.setTargetAtTime(project.metronome ? 0.22 : 0, this.ctx.currentTime, 0.02);
    }
  }

  private applyFx(g: TrackGraph, fx: FxParams, bpm: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    g.filter.type = fx.filterType;
    g.filter.frequency.setTargetAtTime(Math.max(40, fx.filterCutoff), t, 0.03);
    g.filter.Q.setTargetAtTime(Math.max(0.0001, fx.filterRes), t, 0.03);
    g.delayWet.gain.setTargetAtTime(fx.delay, t, 0.03);
    g.delayFb.gain.setTargetAtTime(fx.delayFb, t, 0.03);
    const delayTime = fx.delaySync ? Math.min(1.4, beatDuration(bpm) * 0.75) : 0.28;
    g.delay.delayTime.setTargetAtTime(delayTime, t, 0.05);
    g.reverbWet.gain.setTargetAtTime(fx.reverb * 0.55, t, 0.04);
    g.chorusWet.gain.setTargetAtTime(fx.chorus * 0.4, t, 0.04);
    g.drive.curve = distortionCurve(Math.max(0.001, fx.drive));
  }

  private buildGraph(ctx: BaseAudioContext, fx: FxParams, bpm: number): TrackGraph {
    const input = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = fx.filterType;
    filter.frequency.value = Math.max(40, fx.filterCutoff);
    filter.Q.value = Math.max(0.0001, fx.filterRes);

    const drive = ctx.createWaveShaper();
    drive.curve = distortionCurve(Math.max(0.001, fx.drive));
    drive.oversample = "2x";

    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = fx.delaySync ? Math.min(1.4, beatDuration(bpm) * 0.75) : 0.28;
    const delayFb = ctx.createGain();
    delayFb.gain.value = fx.delayFb;
    const delayWet = ctx.createGain();
    delayWet.gain.value = fx.delay;
    delay.connect(delayFb);
    delayFb.connect(delay);
    delay.connect(delayWet);

    const convolver = ctx.createConvolver();
    convolver.buffer = reverbIR(ctx, fx.reverbType);
    convolver.normalize = true;
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = fx.reverb * 0.55;

    const chorus = ctx.createDelay();
    chorus.delayTime.value = 0.016;
    const chLfo = ctx.createOscillator();
    const chAmt = ctx.createGain();
    chLfo.frequency.value = 0.75;
    chAmt.gain.value = 0.005;
    chLfo.connect(chAmt);
    chAmt.connect(chorus.delayTime);
    const chorusWet = ctx.createGain();
    chorusWet.gain.value = fx.chorus * 0.4;
    chLfo.start();

    const panner = ctx.createStereoPanner();
    const gain = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    input.connect(filter);
    filter.connect(drive);
    drive.connect(delay);
    drive.connect(convolver);
    drive.connect(chorus);
    drive.connect(panner);
    delayWet.connect(panner);
    convolver.connect(reverbWet);
    reverbWet.connect(panner);
    chorus.connect(chorusWet);
    chorusWet.connect(panner);
    panner.connect(gain);
    gain.connect(analyser);

    return { input, filter, delay, delayFb, delayWet, reverbWet, chorusWet, drive, panner, gain, analyser, lfo: chLfo };
  }

  async decode(bytes: ArrayBuffer): Promise<AudioBuffer> {
    const ctx = await this.ensure();
    return ctx.decodeAudioData(bytes.slice(0));
  }

  private clearLive(when?: number) {
    const t = when ?? this.ctx?.currentTime ?? 0;
    for (const s of this.live) {
      try {
        s.stop(t);
      } catch {
        /* already stopped */
      }
    }
    this.live = [];
  }

  private disconnectTracks() {
    this.trackGraphs.forEach((g) => {
      try {
        g.lfo.stop();
      } catch {
        /* ignore */
      }
      try {
        g.analyser.disconnect();
        g.gain.disconnect();
      } catch {
        /* ignore */
      }
    });
    this.trackGraphs.clear();
    this.trackAnalysers.clear();
    this.trackGains.clear();
  }

  halt(emit = true) {
    if (!this.ctx || !this.gate) {
      this.playing = false;
      if (emit) this.listeners.onStop?.();
      return;
    }
    const t = this.ctx.currentTime;
    this.gate.gain.cancelScheduledValues(t);
    this.gate.gain.setValueAtTime(Math.max(0.0008, this.gate.gain.value), t);
    this.gate.gain.exponentialRampToValueAtTime(0.0008, t + 0.012);
    this.clearLive(t + 0.014);
    this.playing = false;
    if (this.timer != null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (emit) this.listeners.onStop?.();
  }

  stop() {
    this.halt();
    this.startBeat = 0;
  }

  private scheduleLoop(project: Project, origin: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const spb = beatDuration(project.bpm);
    const loopBeats = project.bars * 4;

    for (const track of project.tracks) {
      const graph = this.trackGraphs.get(track.id);
      if (!graph) continue;
      const dest = graph.input;
      const patch = patchById(track.instrumentId);
      for (const hit of track.drums) {
        if (hit.start < 0 || hit.start >= loopBeats) continue;
        const t = origin + hit.start * spb + swingOffset(hit.start, project.swing, spb);
        if (t < ctx.currentTime - 0.02) continue;
        playDrum(ctx, dest, hit, t);
      }
      for (const note of track.notes) {
        if (note.start < 0 || note.start >= loopBeats) continue;
        const t = origin + note.start * spb + swingOffset(note.start, project.swing, spb);
        if (t < ctx.currentTime - 0.02) continue;
        playSynthVoice(ctx, dest, patch, note.pitch, note.velocity, t, note.duration * spb);
      }
      for (const clip of track.voices) {
        const buf = this.voiceBuffers.get(clip.id);
        if (!buf) continue;
        const t = origin + clip.start * spb;
        if (t < ctx.currentTime - 0.02) continue;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(dest);
        src.start(t);
        this.live.push(src);
      }
      if (track.sampleId) {
        const buf = this.sampleBuffers.get(track.sampleId);
        if (buf) {
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(dest);
          src.start(origin);
          this.live.push(src);
        }
      }
    }

    if (project.metronome) {
      for (let b = 0; b < loopBeats; b++) {
        const t = origin + b * spb;
        if (t < ctx.currentTime - 0.02) continue;
        this.click(t, b % 4 === 0);
      }
    }
  }

  private click(time: number, accent: boolean) {
    const ctx = this.ctx;
    const dest = this.metroGain;
    if (!ctx || !dest) return;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(accent ? 1680 : 1120, time);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0008, time);
    g.gain.exponentialRampToValueAtTime(accent ? 0.28 : 0.16, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0008, time + 0.04);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.05);
    this.live.push(osc);
  }

  async play(project: Project, fromBeat = 0) {
    const ctx = await this.ensure();
    this.halt(false);
    await this.ensure();
    this.project = project;
    this.bpm = project.bpm;
    this.loopBeats = project.bars * 4;
    this.playing = true;
    this.startBeat = fromBeat;
    this.scheduledLoop = 0;
    this.disconnectTracks();

    if (this.gate) {
      const t0 = ctx.currentTime;
      this.gate.gain.cancelScheduledValues(t0);
      this.gate.gain.setValueAtTime(0.0008, t0);
      this.gate.gain.exponentialRampToValueAtTime(1, t0 + 0.012);
    }
    this.setMaster(project.masterVolume);

    for (const track of project.tracks) {
      const graph = this.buildGraph(ctx, track.fx, project.bpm);
      graph.gain.gain.value = silentFor(track, project) ? 0 : track.volume;
      graph.panner.pan.value = track.pan;
      graph.analyser.connect(this.master!);
      this.trackGraphs.set(track.id, graph);
      this.trackAnalysers.set(track.id, graph.analyser);
      this.trackGains.set(track.id, graph.gain);
    }

    this.startCtxTime = ctx.currentTime + 0.04;
    const origin0 = this.startCtxTime - fromBeat * beatDuration(project.bpm);
    this.scheduleLoop(project, origin0);

    const loopSec = projectDurationSec(project);

    const tick = () => {
      if (!this.playing || !this.ctx || !this.project) return;
      this.listeners.onBeat?.(this.getBeat());
      const analyser = this.analyser;
      if (analyser) {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs((data[i]! - 128) / 128);
          if (v > peak) peak = v;
        }
        this.lastPeak = peak;
        this.listeners.onClip?.(peak >= 0.99);
      }
      if (this.project.loop === false) {
        const elapsed = this.ctx.currentTime - this.startCtxTime;
        if (elapsed >= loopSec) {
          this.halt();
          this.startBeat = 0;
        }
        return;
      }
      const elapsed = this.ctx.currentTime - this.startCtxTime;
      const currentLoop = Math.floor(elapsed / loopSec);
      if (currentLoop + 1 > this.scheduledLoop) {
        const nextOrigin = this.startCtxTime + (currentLoop + 1) * loopSec;
        this.scheduleLoop(this.project, nextOrigin);
        this.scheduledLoop = currentLoop + 1;
      }
    };
    this.timer = window.setInterval(tick, 40);
  }

  previewNote(patch: SynthPatch, midi: number, vel = 0.8, dur = 0.45) {
    void this.ensure().then((ctx) => {
      const dest = this.master ?? ctx.destination;
      playSynthVoice(ctx, dest, patch, midi, vel, ctx.currentTime, dur);
    });
  }

  previewDrum(sample: Track["drums"][number]["sample"]) {
    void this.ensure().then((ctx) => {
      playDrum(ctx, this.master ?? ctx.destination, { id: "prev", sample, start: 0, velocity: 0.9 }, ctx.currentTime);
    });
  }

  async renderOffline(
    project: Project,
    settings: ExportSettings = DEFAULT_EXPORT,
    onlyTrackId?: string,
  ): Promise<{ buffer: PcmBuffer; report: ClipReport }> {
    const sr = settings.sampleRate;
    const tail = settings.includeTail ? 1.8 : 0.05;
    const seconds = projectDurationSec(project) + tail;
    const frames = Math.ceil(sr * seconds);
    const offline = new OfflineAudioContext(2, frames, sr);
    const master = offline.createGain();
    master.gain.value = project.masterVolume;
    const limiter = offline.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 2;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;
    master.connect(limiter);
    limiter.connect(offline.destination);

    const origin = 0;
    for (const track of project.tracks) {
      if (onlyTrackId && track.id !== onlyTrackId) continue;
      if (silentFor(track, project)) continue;
      const graph = this.buildGraph(offline, track.fx, project.bpm);
      graph.gain.gain.value = track.volume;
      graph.panner.pan.value = track.pan;
      graph.analyser.connect(master);
      const dest = graph.input;
      const patch = patchById(track.instrumentId);
      const spb = beatDuration(project.bpm);
      const loopBeats = project.bars * 4;
      for (const hit of track.drums) {
        if (hit.start < 0 || hit.start >= loopBeats) continue;
        playDrum(offline, dest, hit, origin + hit.start * spb + swingOffset(hit.start, project.swing, spb));
      }
      for (const note of track.notes) {
        if (note.start < 0 || note.start >= loopBeats) continue;
        playSynthVoice(
          offline,
          dest,
          patch,
          note.pitch,
          note.velocity,
          origin + note.start * spb + swingOffset(note.start, project.swing, spb),
          note.duration * spb,
        );
      }
      for (const clip of track.voices) {
        const buf = this.voiceBuffers.get(clip.id);
        if (!buf) continue;
        const src = offline.createBufferSource();
        src.buffer = buf;
        src.connect(dest);
        src.start(origin + clip.start * spb);
      }
    }

    const rendered = await offline.startRendering();
    const channels: Float32Array[] = [];
    for (let c = 0; c < rendered.numberOfChannels; c++) {
      channels.push(new Float32Array(rendered.getChannelData(c)));
    }
    if (settings.normalize) normalizeChannels(channels, 0.89);
    const pcm = makePcm(channels, sr);
    const report = clipReportFor(pcm, settings.bitDepth);
    return { buffer: pcm, report };
  }

  async renderWav(project: Project, settings: ExportSettings = DEFAULT_EXPORT): Promise<{ blob: Blob; report: ClipReport }> {
    const { buffer, report } = await this.renderOffline(project, settings);
    const blob = encodeWav(buffer, settings.bitDepth, settings.dither && settings.bitDepth !== 32);
    return { blob, report };
  }

  async renderStems(project: Project, settings: ExportSettings): Promise<{ name: string; blob: Blob }[]> {
    const out: { name: string; blob: Blob }[] = [];
    const mix = await this.renderWav(project, { ...settings, stems: false });
    out.push({ name: "master", blob: mix.blob });
    for (const track of project.tracks) {
      const { buffer } = await this.renderOffline(project, settings, track.id);
      out.push({
        name: track.name.replace(/\s+/g, "-").toLowerCase() || track.id,
        blob: encodeWav(buffer, settings.bitDepth, settings.dither && settings.bitDepth !== 32),
      });
    }
    return out;
  }
}

export { encodeWav };

let singleton: ForgeEngine | null = null;

export function getEngine(): ForgeEngine {
  if (typeof window === "undefined") return new ForgeEngine();
  if (!singleton) singleton = new ForgeEngine();
  return singleton;
}
