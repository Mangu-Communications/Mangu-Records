import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as Slot, s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { i as string, r as object } from "../_libs/zod.mjs";
import { _ as AudioWaveform, a as SlidersHorizontal, c as Play, d as Layers, f as FolderOpen, g as CircleHelp, h as Download, i as Square, l as Pause, m as Drum, n as Undo2, o as Repeat, p as FilePlus2, s as Redo2, t as WandSparkles, u as MicVocal, v as AudioLines } from "../_libs/lucide-react.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { i as uid, n as cn, r as formatTime } from "./router-DJV_uUIV.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dx3Kq3nK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function clamp(n, min, max) {
	return Math.min(max, Math.max(min, n));
}
function midiToFreq(midi) {
	return 440 * 2 ** ((midi - 69) / 12);
}
function distortionCurve(amount) {
	const n = 2048;
	const k = amount * 40;
	const curve = new Float32Array(/* @__PURE__ */ new ArrayBuffer(n * 4));
	for (let i = 0; i < n; i++) {
		const x = i * 2 / n - 1;
		curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
	}
	return curve;
}
var noiseCache = /* @__PURE__ */ new WeakMap();
function noiseBuffer(ctx) {
	let buf = noiseCache.get(ctx);
	if (buf) return buf;
	const len = Math.max(1, Math.floor(ctx.sampleRate * 2));
	buf = ctx.createBuffer(1, len, ctx.sampleRate);
	const data = buf.getChannelData(0);
	let last = 0;
	for (let i = 0; i < len; i++) {
		last = last * .12 + (Math.random() * 2 - 1) * .88;
		data[i] = last;
	}
	noiseCache.set(ctx, buf);
	return buf;
}
var irCache = /* @__PURE__ */ new WeakMap();
function reverbIR(ctx, kind = "room") {
	let map = irCache.get(ctx);
	if (!map) {
		map = /* @__PURE__ */ new Map();
		irCache.set(ctx, map);
	}
	const hit = map.get(kind);
	if (hit) return hit;
	const seconds = kind === "hall" ? 2.4 : kind === "plate" ? 1.6 : kind === "spring" ? 1.1 : .9;
	const decay = kind === "hall" ? 3.2 : kind === "plate" ? 2.6 : kind === "spring" ? 4.5 : 2.2;
	const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
	const buf = ctx.createBuffer(2, len, ctx.sampleRate);
	for (let ch = 0; ch < 2; ch++) {
		const data = buf.getChannelData(ch);
		for (let i = 0; i < len; i++) {
			const t = i / ctx.sampleRate;
			const env = Math.exp(-t * decay);
			let s = (Math.random() * 2 - 1) * env;
			if (kind === "spring" && i % 37 === 0) s *= 2.4;
			if (kind === "plate") s *= .7 + .3 * Math.sin(i * .015 + ch);
			data[i] = s * .85;
		}
	}
	map.set(kind, buf);
	return buf;
}
function tpdf() {
	return Math.random() + Math.random() - 1;
}
function analyzePeaks(channels) {
	let peak = 0;
	let sumSq = 0;
	let clipped = 0;
	const n = channels[0]?.length ?? 0;
	const chN = channels.length || 1;
	for (let i = 0; i < n; i++) for (let c = 0; c < chN; c++) {
		const s = channels[c][i] ?? 0;
		const a = Math.abs(s);
		if (a > peak) peak = a;
		if (a > 1) clipped += 1;
		sumSq += s * s;
	}
	const rms = n === 0 ? 0 : Math.sqrt(sumSq / (n * chN));
	return {
		peak,
		rms,
		clippedSamples: clipped
	};
}
function normalizeChannels(channels, target = .89) {
	const { peak } = analyzePeaks(channels);
	if (peak < 1e-8) return 1;
	const g = target / peak;
	if (g >= 1) return 1;
	for (const ch of channels) for (let i = 0; i < ch.length; i++) ch[i] *= g;
	return g;
}
function encodeWav(buffer, bitDepth = 16, dither = true) {
	const ch = buffer.numberOfChannels;
	const sr = buffer.sampleRate;
	const len = buffer.length;
	const channels = [];
	for (let c = 0; c < ch; c++) channels.push(buffer.getChannelData(c));
	if (bitDepth === 32) {
		const bytes = len * ch * 4;
		const ab = new ArrayBuffer(44 + bytes);
		const view = new DataView(ab);
		writeWavHeader(view, sr, ch, bytes, 3, 32);
		let offset = 44;
		for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) {
			view.setFloat32(offset, channels[c][i] ?? 0, true);
			offset += 4;
		}
		return new Blob([ab], { type: "audio/wav" });
	}
	const bytesPerSample = bitDepth === 24 ? 3 : 2;
	const bytes = len * ch * bytesPerSample;
	const ab = new ArrayBuffer(44 + bytes);
	const view = new DataView(ab);
	writeWavHeader(view, sr, ch, bytes, 1, bitDepth);
	const max = bitDepth === 24 ? 8388607 : 32767;
	const ditherAmt = dither ? bitDepth === 24 ? 1 / 8388607 : 1 / 32767 : 0;
	let offset = 44;
	for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) {
		let s = channels[c][i] ?? 0;
		if (ditherAmt) s += tpdf() * ditherAmt;
		s = clamp(s, -1, 1);
		let v = s < 0 ? Math.round(s * (max + 1)) : Math.round(s * max);
		if (bitDepth === 16) {
			view.setInt16(offset, v, true);
			offset += 2;
		} else {
			if (v < 0) v += 16777216;
			view.setUint8(offset, v & 255);
			view.setUint8(offset + 1, v >> 8 & 255);
			view.setUint8(offset + 2, v >> 16 & 255);
			offset += 3;
		}
	}
	return new Blob([ab], { type: "audio/wav" });
}
function writeWavHeader(view, sr, ch, dataBytes, audioFormat, bits) {
	const writeStr = (off, s) => {
		for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
	};
	const block = ch * (bits / 8);
	writeStr(0, "RIFF");
	view.setUint32(4, 36 + dataBytes, true);
	writeStr(8, "WAVE");
	writeStr(12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, audioFormat, true);
	view.setUint16(22, ch, true);
	view.setUint32(24, sr, true);
	view.setUint32(28, sr * block, true);
	view.setUint16(32, block, true);
	view.setUint16(34, bits, true);
	writeStr(36, "data");
	view.setUint32(40, dataBytes, true);
}
function clipReportFor(buffer, bitDepth) {
	const channels = [];
	for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));
	return {
		...analyzePeaks(channels),
		durationSec: buffer.length / buffer.sampleRate,
		sampleRate: buffer.sampleRate,
		bitDepth
	};
}
function makePcm(channels, sampleRate) {
	return {
		numberOfChannels: channels.length,
		sampleRate,
		length: channels[0]?.length ?? 0,
		getChannelData: (c) => channels[c] ?? /* @__PURE__ */ new Float32Array(0)
	};
}
var DEFAULT_FX = {
	filterCutoff: 18e3,
	filterRes: .4,
	filterType: "lowpass",
	delay: 0,
	delayFb: .35,
	delaySync: true,
	reverb: .18,
	reverbType: "room",
	drive: 0,
	chorus: 0,
	compress: 0
};
var DEFAULT_EXPORT = {
	sampleRate: 44100,
	bitDepth: 16,
	normalize: false,
	includeTail: true,
	dither: true,
	stems: false
};
function stepsFor(bars) {
	return bars * 4 * 4;
}
function beatDuration(bpm) {
	return 60 / Math.max(20, bpm);
}
function projectDurationSec(project) {
	return project.bars * 4 * beatDuration(project.bpm);
}
function normalizeProject(raw) {
	if (!raw || !Array.isArray(raw.tracks) || raw.tracks.length === 0) return null;
	const tracks = raw.tracks.map((t) => ({
		...t,
		mute: Boolean(t.mute),
		solo: Boolean(t.solo),
		volume: Number.isFinite(t.volume) ? t.volume : .75,
		pan: Number.isFinite(t.pan) ? t.pan : 0,
		notes: Array.isArray(t.notes) ? t.notes : [],
		drums: Array.isArray(t.drums) ? t.drums : [],
		voices: Array.isArray(t.voices) ? t.voices : [],
		fx: {
			...DEFAULT_FX,
			...t.fx ?? {}
		}
	}));
	return {
		id: raw.id || "proj",
		name: raw.name || "Untitled Session",
		bpm: Math.min(200, Math.max(48, Number(raw.bpm) || 110)),
		key: raw.key || "A",
		scale: raw.scale || "minor",
		bars: Math.min(16, Math.max(4, Number(raw.bars) || 8)),
		swing: Number.isFinite(raw.swing) ? Number(raw.swing) : 0,
		masterVolume: Number.isFinite(raw.masterVolume) ? Number(raw.masterVolume) : .85,
		tracks,
		updatedAt: raw.updatedAt || Date.now(),
		loop: raw.loop !== false,
		metronome: Boolean(raw.metronome),
		timeNumerator: raw.timeNumerator || 4,
		timeDenominator: raw.timeDenominator || 4
	};
}
function osc(type, mix, detune = 0, octave = 0) {
	return {
		type,
		mix,
		detune,
		octave
	};
}
var SYNTH_PRESETS = [
	{
		id: "analog-bass",
		name: "Analog Bass",
		category: "bass",
		osc1: osc("sawtooth", .7, 0, -1),
		osc2: osc("square", .35, 6, -1),
		filter: {
			type: "lowpass",
			cutoff: 420,
			res: 6.5,
			envAmt: .55
		},
		env: {
			a: .01,
			d: .18,
			s: .7,
			r: .12
		},
		filterEnv: {
			a: .01,
			d: .22,
			s: .2,
			r: .1
		},
		lfo: {
			rate: .2,
			amt: 0,
			dest: "filter"
		},
		gain: .55,
		drive: .18
	},
	{
		id: "sub-bass",
		name: "Sub",
		category: "bass",
		osc1: osc("sine", .9, 0, -2),
		osc2: osc("triangle", .25, 0, -1),
		filter: {
			type: "lowpass",
			cutoff: 180,
			res: .4,
			envAmt: .1
		},
		env: {
			a: .005,
			d: .12,
			s: .85,
			r: .16
		},
		filterEnv: {
			a: .01,
			d: .1,
			s: .4,
			r: .1
		},
		lfo: {
			rate: .1,
			amt: 0,
			dest: "pitch"
		},
		gain: .7,
		drive: .05
	},
	{
		id: "warm-pad",
		name: "Warm Pad",
		category: "pad",
		osc1: osc("sawtooth", .55, -8, 0),
		osc2: osc("sawtooth", .55, 9, 0),
		filter: {
			type: "lowpass",
			cutoff: 1100,
			res: 1.2,
			envAmt: .35
		},
		env: {
			a: .55,
			d: .8,
			s: .75,
			r: 1.4
		},
		filterEnv: {
			a: .7,
			d: 1.1,
			s: .5,
			r: 1.2
		},
		lfo: {
			rate: .18,
			amt: .22,
			dest: "filter"
		},
		gain: .28,
		drive: .04
	},
	{
		id: "air-pad",
		name: "Air Pad",
		category: "pad",
		osc1: osc("triangle", .5, -6, 1),
		osc2: osc("sine", .45, 7, 1),
		filter: {
			type: "lowpass",
			cutoff: 2400,
			res: .6,
			envAmt: .25
		},
		env: {
			a: .9,
			d: 1.2,
			s: .7,
			r: 2
		},
		filterEnv: {
			a: 1.1,
			d: 1.4,
			s: .6,
			r: 1.8
		},
		lfo: {
			rate: .12,
			amt: .3,
			dest: "filter"
		},
		gain: .24,
		drive: 0
	},
	{
		id: "glass-lead",
		name: "Glass Lead",
		category: "lead",
		osc1: osc("triangle", .7, 0, 1),
		osc2: osc("sine", .4, 4, 2),
		filter: {
			type: "lowpass",
			cutoff: 3200,
			res: 2.4,
			envAmt: .2
		},
		env: {
			a: .02,
			d: .22,
			s: .65,
			r: .28
		},
		filterEnv: {
			a: .01,
			d: .18,
			s: .4,
			r: .2
		},
		lfo: {
			rate: 5.5,
			amt: .08,
			dest: "pitch"
		},
		gain: .32,
		drive: .02
	},
	{
		id: "pluck",
		name: "Pluck",
		category: "pluck",
		osc1: osc("sawtooth", .6, 0, 0),
		osc2: osc("square", .3, -7, 0),
		filter: {
			type: "lowpass",
			cutoff: 1800,
			res: 4.2,
			envAmt: .7
		},
		env: {
			a: .004,
			d: .28,
			s: .05,
			r: .18
		},
		filterEnv: {
			a: .004,
			d: .22,
			s: .05,
			r: .12
		},
		lfo: {
			rate: .4,
			amt: 0,
			dest: "filter"
		},
		gain: .38,
		drive: .08
	},
	{
		id: "brass",
		name: "Brass Stab",
		category: "lead",
		osc1: osc("sawtooth", .7, -5, 0),
		osc2: osc("sawtooth", .55, 8, 0),
		filter: {
			type: "lowpass",
			cutoff: 900,
			res: 3.5,
			envAmt: .62
		},
		env: {
			a: .04,
			d: .16,
			s: .55,
			r: .22
		},
		filterEnv: {
			a: .03,
			d: .2,
			s: .25,
			r: .18
		},
		lfo: {
			rate: .3,
			amt: .05,
			dest: "filter"
		},
		gain: .34,
		drive: .16
	},
	{
		id: "choir",
		name: "Choir Vox",
		category: "vox",
		osc1: osc("sawtooth", .4, -10, 0),
		osc2: osc("square", .35, 12, 0),
		filter: {
			type: "bandpass",
			cutoff: 780,
			res: 4.8,
			envAmt: .15
		},
		env: {
			a: .28,
			d: .4,
			s: .8,
			r: .7
		},
		filterEnv: {
			a: .35,
			d: .5,
			s: .7,
			r: .6
		},
		lfo: {
			rate: 5.2,
			amt: .12,
			dest: "pitch"
		},
		gain: .3,
		drive: .02
	},
	{
		id: "fm-bell",
		name: "FM Bell",
		category: "bell",
		osc1: osc("sine", .7, 0, 1),
		osc2: osc("sine", .55, 0, 2),
		filter: {
			type: "lowpass",
			cutoff: 5400,
			res: 1.1,
			envAmt: .3
		},
		env: {
			a: .002,
			d: 1.4,
			s: .12,
			r: 1.6
		},
		filterEnv: {
			a: .002,
			d: .8,
			s: .1,
			r: 1.2
		},
		lfo: {
			rate: 3.2,
			amt: .06,
			dest: "pitch"
		},
		gain: .28,
		drive: 0
	},
	{
		id: "keys",
		name: "Studio Keys",
		category: "keys",
		osc1: osc("triangle", .65, -3, 0),
		osc2: osc("sine", .4, 4, 1),
		filter: {
			type: "lowpass",
			cutoff: 2600,
			res: .8,
			envAmt: .22
		},
		env: {
			a: .008,
			d: .45,
			s: .55,
			r: .4
		},
		filterEnv: {
			a: .01,
			d: .35,
			s: .4,
			r: .3
		},
		lfo: {
			rate: .25,
			amt: .04,
			dest: "filter"
		},
		gain: .36,
		drive: .03
	},
	{
		id: "noise-riser",
		name: "Noise Riser",
		category: "fx",
		osc1: osc("noise", .85, 0, 0),
		osc2: osc("sawtooth", .15, 0, -2),
		filter: {
			type: "highpass",
			cutoff: 600,
			res: 1.6,
			envAmt: .7
		},
		env: {
			a: 1.6,
			d: .4,
			s: .7,
			r: .4
		},
		filterEnv: {
			a: 2,
			d: .2,
			s: .8,
			r: .3
		},
		lfo: {
			rate: 8,
			amt: .15,
			dest: "filter"
		},
		gain: .22,
		drive: .1
	},
	{
		id: "dark-lead",
		name: "Dark Lead",
		category: "lead",
		osc1: osc("square", .6, 0, 0),
		osc2: osc("sawtooth", .4, 11, 0),
		filter: {
			type: "lowpass",
			cutoff: 720,
			res: 5.5,
			envAmt: .45
		},
		env: {
			a: .03,
			d: .2,
			s: .6,
			r: .3
		},
		filterEnv: {
			a: .02,
			d: .25,
			s: .3,
			r: .22
		},
		lfo: {
			rate: .7,
			amt: .18,
			dest: "filter"
		},
		gain: .33,
		drive: .22
	}
];
var DRUM_ROWS = [
	{
		sample: "kick",
		label: "Kick"
	},
	{
		sample: "snare",
		label: "Snare"
	},
	{
		sample: "clap",
		label: "Clap"
	},
	{
		sample: "hat",
		label: "Hat"
	},
	{
		sample: "openhat",
		label: "Open"
	},
	{
		sample: "rim",
		label: "Rim"
	},
	{
		sample: "tom",
		label: "Tom"
	},
	{
		sample: "perc",
		label: "Perc"
	},
	{
		sample: "ride",
		label: "Ride"
	}
];
var KIND_INSTRUMENT = {
	drums: "kit",
	bass: "analog-bass",
	pad: "warm-pad",
	lead: "glass-lead",
	keys: "keys",
	voice: "choir",
	fx: "noise-riser",
	sample: "sample"
};
var PATCH_REGISTRY = /* @__PURE__ */ new Map();
for (const p of SYNTH_PRESETS) PATCH_REGISTRY.set(p.id, p);
function registerPatch(patch) {
	PATCH_REGISTRY.set(patch.id, patch);
}
function patchById(id) {
	return PATCH_REGISTRY.get(id) ?? SYNTH_PRESETS[0];
}
function defaultFxFor(kind) {
	if (kind === "pad" || kind === "voice") return {
		...DEFAULT_FX,
		reverb: .42,
		delay: .08,
		reverbType: "hall"
	};
	if (kind === "lead") return {
		...DEFAULT_FX,
		delay: .18,
		delayFb: .32,
		reverb: .22,
		reverbType: "plate"
	};
	if (kind === "drums") return {
		...DEFAULT_FX,
		reverb: .08,
		filterCutoff: 16e3,
		reverbType: "room"
	};
	if (kind === "fx") return {
		...DEFAULT_FX,
		reverb: .5,
		delay: .12,
		reverbType: "hall"
	};
	return { ...DEFAULT_FX };
}
var STUDIO_VOICES = [
	{
		id: "eve",
		name: "Eve",
		color: "Intimate, close"
	},
	{
		id: "leo",
		name: "Leo",
		color: "Warm baritone"
	},
	{
		id: "ara",
		name: "Ara",
		color: "Bright, present"
	},
	{
		id: "aurora",
		name: "Aurora",
		color: "Airy, high"
	},
	{
		id: "atlas",
		name: "Atlas",
		color: "Deep, grounded"
	},
	{
		id: "lumen",
		name: "Lumen",
		color: "Narrator"
	},
	{
		id: "sirius",
		name: "Sirius",
		color: "Sharp, dry"
	},
	{
		id: "luna",
		name: "Luna",
		color: "Soft, night"
	},
	{
		id: "orion",
		name: "Orion",
		color: "Cinematic"
	},
	{
		id: "iris",
		name: "Iris",
		color: "Light, clear"
	}
];
function envGain(ctx, time, dur, a, d, s, r, peak) {
	const g = ctx.createGain();
	const p = Math.max(8e-4, peak);
	const atk = Math.max(.003, a);
	const dec = Math.max(.008, d);
	const rel = Math.max(.02, r);
	g.gain.setValueAtTime(0, time);
	g.gain.linearRampToValueAtTime(p, time + atk);
	g.gain.setTargetAtTime(Math.max(8e-4, p * s), time + atk, dec / 3);
	const relStart = time + Math.max(atk + .008, dur);
	g.gain.cancelScheduledValues(relStart);
	g.gain.setValueAtTime(Math.max(8e-4, p * s), relStart);
	g.gain.exponentialRampToValueAtTime(8e-4, relStart + rel);
	return g;
}
function makeOsc(ctx, type, freq, detune, time, stopAt) {
	if (type === "noise") {
		const src = ctx.createBufferSource();
		src.buffer = noiseBuffer(ctx);
		src.loop = true;
		src.start(time);
		src.stop(stopAt);
		return src;
	}
	const osc = ctx.createOscillator();
	osc.type = type;
	osc.frequency.setValueAtTime(Math.max(20, freq), time);
	osc.detune.setValueAtTime(detune, time);
	osc.start(time);
	osc.stop(stopAt);
	return osc;
}
function wavetableOsc(ctx, freq, detune, time, stopAt, bright = .45) {
	const n = 24;
	const real = new Float32Array(n);
	const imag = new Float32Array(n);
	for (let i = 1; i < n; i++) imag[i] = 1 / i * Math.pow(bright, i * .35);
	const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
	const osc = ctx.createOscillator();
	osc.setPeriodicWave(wave);
	osc.frequency.setValueAtTime(Math.max(20, freq), time);
	osc.detune.setValueAtTime(detune, time);
	osc.start(time);
	osc.stop(stopAt);
	return osc;
}
function playKarplus(ctx, dest, freq, velocity, time, duration, gainAmt) {
	const period = 1 / Math.max(40, freq);
	const burst = Math.min(.018, period * 4);
	time + duration + .6;
	const src = ctx.createBufferSource();
	src.buffer = noiseBuffer(ctx);
	const burstGain = ctx.createGain();
	burstGain.gain.setValueAtTime(velocity * gainAmt, time);
	burstGain.gain.exponentialRampToValueAtTime(8e-4, time + burst);
	const delay = ctx.createDelay(1);
	delay.delayTime.setValueAtTime(period, time);
	const filt = ctx.createBiquadFilter();
	filt.type = "lowpass";
	filt.frequency.setValueAtTime(Math.min(6500, freq * 8), time);
	const fb = ctx.createGain();
	fb.gain.value = .965;
	const out = ctx.createGain();
	out.gain.setValueAtTime(1, time);
	out.gain.setTargetAtTime(8e-4, time + duration, .12);
	src.connect(burstGain);
	burstGain.connect(delay);
	delay.connect(filt);
	filt.connect(fb);
	fb.connect(delay);
	filt.connect(out);
	out.connect(dest);
	src.start(time);
	src.stop(time + burst + .02);
}
function playFm(ctx, dest, patch, freq, velocity, time, duration) {
	const rel = Math.max(.05, patch.env.r);
	const stopAt = time + duration + rel + .05;
	const carrier = ctx.createOscillator();
	carrier.type = "sine";
	carrier.frequency.setValueAtTime(freq, time);
	const mod = ctx.createOscillator();
	mod.type = "sine";
	const ratio = 2 + patch.osc2.octave;
	mod.frequency.setValueAtTime(freq * Math.max(.5, ratio), time);
	const idx = ctx.createGain();
	idx.gain.setValueAtTime(freq * (1.8 + patch.drive * 4) * velocity, time);
	idx.gain.exponentialRampToValueAtTime(freq * .15, time + Math.max(.08, patch.env.d));
	mod.connect(idx);
	idx.connect(carrier.frequency);
	const amp = envGain(ctx, time, duration, patch.env.a, patch.env.d, patch.env.s, patch.env.r, velocity * patch.gain);
	carrier.connect(amp);
	amp.connect(dest);
	carrier.start(time);
	mod.start(time);
	carrier.stop(stopAt);
	mod.stop(stopAt);
}
function playSynthVoice(ctx, dest, patch, midi, velocity, time, duration) {
	const freq = midiToFreq(midi);
	const rel = Math.max(.03, patch.env.r);
	const stopAt = time + duration + rel + .08;
	const octMul = (oct) => 2 ** oct;
	if (patch.category === "bell") {
		playFm(ctx, dest, patch, freq, velocity, time, duration);
		return;
	}
	if (patch.category === "pluck") {
		playKarplus(ctx, dest, freq * octMul(patch.osc1.octave), velocity, time, duration, patch.gain * 1.4);
		return;
	}
	const useWt = patch.category === "pad" || patch.category === "keys";
	const o1 = useWt ? wavetableOsc(ctx, freq * octMul(patch.osc1.octave), patch.osc1.detune, time, stopAt, .5) : makeOsc(ctx, patch.osc1.type, freq * octMul(patch.osc1.octave), patch.osc1.detune, time, stopAt);
	const o2 = useWt ? wavetableOsc(ctx, freq * octMul(patch.osc2.octave), patch.osc2.detune, time, stopAt, .32) : makeOsc(ctx, patch.osc2.type, freq * octMul(patch.osc2.octave), patch.osc2.detune, time, stopAt);
	const m1 = ctx.createGain();
	m1.gain.value = patch.osc1.mix;
	const m2 = ctx.createGain();
	m2.gain.value = patch.osc2.mix;
	o1.connect(m1);
	o2.connect(m2);
	const filter = ctx.createBiquadFilter();
	filter.type = patch.filter.type;
	filter.Q.setValueAtTime(Math.max(1e-4, patch.filter.res), time);
	const cut = Math.max(60, patch.filter.cutoff);
	const peakCut = Math.min(16e3, Math.max(80, cut + patch.filter.envAmt * 7e3));
	filter.frequency.setValueAtTime(cut, time);
	filter.frequency.exponentialRampToValueAtTime(Math.max(80, peakCut), time + Math.max(.01, patch.filterEnv.a));
	filter.frequency.exponentialRampToValueAtTime(Math.max(80, cut * (.4 + patch.filterEnv.s * .6)), time + patch.filterEnv.a + patch.filterEnv.d);
	filter.frequency.exponentialRampToValueAtTime(Math.max(80, cut), time + duration + patch.filterEnv.r);
	m1.connect(filter);
	m2.connect(filter);
	if (patch.lfo.amt > .001) {
		const lfo = ctx.createOscillator();
		lfo.type = "sine";
		lfo.frequency.value = Math.max(.05, patch.lfo.rate);
		const lg = ctx.createGain();
		if (patch.lfo.dest === "pitch") {
			lg.gain.value = patch.lfo.amt * 40;
			lfo.connect(lg);
			try {
				lg.connect(o1.frequency);
				lg.connect(o2.frequency);
			} catch {}
		} else if (patch.lfo.dest === "amp") {
			lg.gain.value = patch.lfo.amt * .35;
			lfo.connect(lg);
			lg.connect(m1.gain);
			lg.connect(m2.gain);
		} else {
			lg.gain.value = patch.lfo.amt * cut;
			lfo.connect(lg);
			lg.connect(filter.frequency);
		}
		lfo.start(time);
		lfo.stop(stopAt);
	}
	const amp = envGain(ctx, time, duration, patch.env.a, patch.env.d, patch.env.s, patch.env.r, velocity * patch.gain);
	filter.connect(amp);
	if (patch.drive > .01) {
		const shaper = ctx.createWaveShaper();
		shaper.curve = distortionCurve(patch.drive);
		shaper.oversample = "2x";
		amp.connect(shaper);
		shaper.connect(dest);
	} else amp.connect(dest);
}
function clickNoise(ctx, dest, time, dur, hp, gain, bp) {
	const src = ctx.createBufferSource();
	src.buffer = noiseBuffer(ctx);
	const f = ctx.createBiquadFilter();
	f.type = bp ? "bandpass" : "highpass";
	f.frequency.value = hp;
	if (bp) f.Q.value = 1.6;
	const g = ctx.createGain();
	g.gain.setValueAtTime(8e-4, time);
	g.gain.exponentialRampToValueAtTime(Math.max(.001, gain), time + .002);
	g.gain.exponentialRampToValueAtTime(8e-4, time + dur);
	src.connect(f);
	f.connect(g);
	g.connect(dest);
	src.start(time);
	src.stop(time + dur + .02);
}
function playDrum(ctx, dest, hit, time) {
	if ((hit.probability ?? 1) < 1 && Math.random() > (hit.probability ?? 1)) return;
	const v = hit.velocity;
	const sample = hit.sample;
	if (sample === "kick") {
		const osc = ctx.createOscillator();
		osc.type = "sine";
		const g = ctx.createGain();
		osc.frequency.setValueAtTime(172, time);
		osc.frequency.exponentialRampToValueAtTime(38, time + .11);
		g.gain.setValueAtTime(8e-4, time);
		g.gain.exponentialRampToValueAtTime(v, time + .004);
		g.gain.exponentialRampToValueAtTime(8e-4, time + .44);
		osc.connect(g);
		g.connect(dest);
		osc.start(time);
		osc.stop(time + .46);
		clickNoise(ctx, dest, time, .028, 1800, v * .18);
	} else if (sample === "snare") {
		const osc = ctx.createOscillator();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(196, time);
		const g = ctx.createGain();
		g.gain.setValueAtTime(v * .42, time);
		g.gain.exponentialRampToValueAtTime(8e-4, time + .14);
		osc.connect(g);
		g.connect(dest);
		osc.start(time);
		osc.stop(time + .18);
		clickNoise(ctx, dest, time, .16, 1400, v * .68, 1800);
	} else if (sample === "clap") [
		0,
		.011,
		.023,
		.04
	].forEach((off, i) => {
		clickNoise(ctx, dest, time + off, .07, 980, v * (i === 3 ? .52 : .28), 1600);
	});
	else if (sample === "hat") clickNoise(ctx, dest, time, .042, 7800, v * .42);
	else if (sample === "openhat") clickNoise(ctx, dest, time, .26, 6200, v * .38);
	else if (sample === "rim") {
		const osc = ctx.createOscillator();
		osc.type = "square";
		osc.frequency.setValueAtTime(410, time);
		const g = ctx.createGain();
		g.gain.setValueAtTime(v * .28, time);
		g.gain.exponentialRampToValueAtTime(8e-4, time + .045);
		osc.connect(g);
		g.connect(dest);
		osc.start(time);
		osc.stop(time + .055);
		clickNoise(ctx, dest, time, .035, 2600, v * .22);
	} else if (sample === "tom") {
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.setValueAtTime(148, time);
		osc.frequency.exponentialRampToValueAtTime(68, time + .16);
		const g = ctx.createGain();
		g.gain.setValueAtTime(v * .78, time);
		g.gain.exponentialRampToValueAtTime(8e-4, time + .3);
		osc.connect(g);
		g.connect(dest);
		osc.start(time);
		osc.stop(time + .32);
	} else if (sample === "ride") {
		clickNoise(ctx, dest, time, .38, 4800, v * .2);
		const osc = ctx.createOscillator();
		osc.type = "square";
		osc.frequency.value = 628;
		const g = ctx.createGain();
		g.gain.setValueAtTime(v * .07, time);
		g.gain.exponentialRampToValueAtTime(8e-4, time + .32);
		osc.connect(g);
		g.connect(dest);
		osc.start(time);
		osc.stop(time + .34);
	} else if (sample === "perc") {
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.setValueAtTime(740, time);
		osc.frequency.exponentialRampToValueAtTime(210, time + .07);
		const g = ctx.createGain();
		g.gain.setValueAtTime(v * .42, time);
		g.gain.exponentialRampToValueAtTime(8e-4, time + .12);
		osc.connect(g);
		g.connect(dest);
		osc.start(time);
		osc.stop(time + .14);
	}
}
var VOICE_FORMANTS = {
	eve: {
		f0: 196,
		f1: 720,
		f2: 1240,
		f3: 2500
	},
	leo: {
		f0: 118,
		f1: 620,
		f2: 1080,
		f3: 2400
	},
	ara: {
		f0: 210,
		f1: 780,
		f2: 1400,
		f3: 2700
	},
	aurora: {
		f0: 230,
		f1: 820,
		f2: 1480,
		f3: 2800
	},
	atlas: {
		f0: 98,
		f1: 540,
		f2: 960,
		f3: 2200
	},
	lumen: {
		f0: 140,
		f1: 650,
		f2: 1180,
		f3: 2450
	},
	sirius: {
		f0: 170,
		f1: 700,
		f2: 1600,
		f3: 2900
	},
	luna: {
		f0: 188,
		f1: 760,
		f2: 1320,
		f3: 2600
	},
	orion: {
		f0: 128,
		f1: 600,
		f2: 1100,
		f3: 2350
	},
	iris: {
		f0: 204,
		f1: 800,
		f2: 1420,
		f3: 2750
	}
};
async function synthesizeLocalVoice(text, voiceId, sampleRate = 44100) {
	const words = text.trim().split(/\s+/).filter(Boolean);
	const dur = Math.min(18, Math.max(1.15, words.length * .36 + .4));
	const frames = Math.ceil(sampleRate * dur);
	const offline = new OfflineAudioContext(1, frames, sampleRate);
	const profile = VOICE_FORMANTS[voiceId] ?? VOICE_FORMANTS.eve;
	const dest = offline.destination;
	const syllables = Math.max(1, words.length * 2);
	const step = dur / syllables;
	for (let i = 0; i < syllables; i++) {
		const t = .04 + i * step;
		const wobble = 1 + Math.sin(i * 1.7) * .04;
		const f0 = profile.f0 * wobble * (i % 5 === 4 ? .92 : 1);
		const osc = offline.createOscillator();
		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(f0, t);
		const f1 = offline.createBiquadFilter();
		f1.type = "bandpass";
		f1.frequency.value = profile.f1 * (1 + (i % 3 - 1) * .08);
		f1.Q.value = 8;
		const f2 = offline.createBiquadFilter();
		f2.type = "bandpass";
		f2.frequency.value = profile.f2;
		f2.Q.value = 7;
		const g = offline.createGain();
		const peak = .12;
		g.gain.setValueAtTime(8e-4, t);
		g.gain.exponentialRampToValueAtTime(peak, t + .02);
		g.gain.exponentialRampToValueAtTime(8e-4, t + step * .78);
		osc.connect(f1);
		osc.connect(f2);
		f1.connect(g);
		f2.connect(g);
		g.connect(dest);
		osc.start(t);
		osc.stop(t + step * .85);
	}
	return offline.startRendering();
}
function swingOffset(beat, swing, spb) {
	if (swing <= 0) return 0;
	const sixteenths = beat / .25;
	return Math.round(sixteenths) % 2 === 1 ? swing * .25 * spb : 0;
}
function silentFor(track, project) {
	const soloed = project.tracks.some((t) => t.solo);
	return track.mute || soloed && !track.solo;
}
var ForgeEngine = class {
	ctx = null;
	master = null;
	gate = null;
	limiter = null;
	analyser = null;
	metroGain = null;
	trackGraphs = /* @__PURE__ */ new Map();
	trackAnalysers = /* @__PURE__ */ new Map();
	trackGains = /* @__PURE__ */ new Map();
	playing = false;
	startCtxTime = 0;
	startBeat = 0;
	bpm = 110;
	loopBeats = 32;
	timer = null;
	project = null;
	voiceBuffers = /* @__PURE__ */ new Map();
	sampleBuffers = /* @__PURE__ */ new Map();
	listeners = {};
	live = [];
	scheduledLoop = -1;
	lastPeak = 0;
	async ensure() {
		if (!this.ctx || this.ctx.state === "closed") {
			const ctx = new AudioContext();
			this.ctx = ctx;
			this.gate = ctx.createGain();
			this.gate.gain.value = 1;
			this.master = ctx.createGain();
			this.master.gain.value = .85;
			this.limiter = ctx.createDynamicsCompressor();
			this.limiter.threshold.value = -3;
			this.limiter.knee.value = 2;
			this.limiter.ratio.value = 20;
			this.limiter.attack.value = .003;
			this.limiter.release.value = .12;
			this.analyser = ctx.createAnalyser();
			this.analyser.fftSize = 2048;
			this.metroGain = ctx.createGain();
			this.metroGain.gain.value = .22;
			this.master.connect(this.limiter);
			this.metroGain.connect(this.limiter);
			this.limiter.connect(this.gate);
			this.gate.connect(this.analyser);
			this.analyser.connect(ctx.destination);
		}
		if (this.ctx.state === "suspended") await this.ctx.resume();
		return this.ctx;
	}
	getBeat() {
		if (!this.playing || !this.ctx) return this.startBeat;
		const elapsed = this.ctx.currentTime - this.startCtxTime;
		const beat = this.startBeat + elapsed / beatDuration(this.bpm);
		if (this.project && this.project.loop === false) return Math.min(this.loopBeats, Math.max(0, beat));
		return (beat % this.loopBeats + this.loopBeats) % this.loopBeats;
	}
	getPeak() {
		return this.lastPeak;
	}
	setMaster(v) {
		if (!this.master || !this.ctx) return;
		const t = this.ctx.currentTime;
		this.master.gain.setTargetAtTime(Math.max(0, Math.min(1.2, v)), t, .02);
	}
	setTrackVolume(id, v) {
		const g = this.trackGraphs.get(id);
		if (!g || !this.ctx) return;
		g.gain.gain.setTargetAtTime(Math.max(0, v), this.ctx.currentTime, .02);
	}
	applyMix(project) {
		if (!this.ctx || !this.playing) return;
		this.setMaster(project.masterVolume);
		for (const track of project.tracks) {
			const g = this.trackGraphs.get(track.id);
			if (!g) continue;
			const t = this.ctx.currentTime;
			const vol = silentFor(track, project) ? 0 : track.volume;
			g.gain.gain.setTargetAtTime(vol, t, .012);
			g.panner.pan.setTargetAtTime(track.pan, t, .02);
			this.applyFx(g, track.fx, project.bpm);
		}
		if (this.metroGain) this.metroGain.gain.setTargetAtTime(project.metronome ? .22 : 0, this.ctx.currentTime, .02);
	}
	applyFx(g, fx, bpm) {
		if (!this.ctx) return;
		const t = this.ctx.currentTime;
		g.filter.type = fx.filterType;
		g.filter.frequency.setTargetAtTime(Math.max(40, fx.filterCutoff), t, .03);
		g.filter.Q.setTargetAtTime(Math.max(1e-4, fx.filterRes), t, .03);
		g.delayWet.gain.setTargetAtTime(fx.delay, t, .03);
		g.delayFb.gain.setTargetAtTime(fx.delayFb, t, .03);
		const delayTime = fx.delaySync ? Math.min(1.4, beatDuration(bpm) * .75) : .28;
		g.delay.delayTime.setTargetAtTime(delayTime, t, .05);
		g.reverbWet.gain.setTargetAtTime(fx.reverb * .55, t, .04);
		g.chorusWet.gain.setTargetAtTime(fx.chorus * .4, t, .04);
		g.drive.curve = distortionCurve(Math.max(.001, fx.drive));
	}
	buildGraph(ctx, fx, bpm) {
		const input = ctx.createGain();
		const filter = ctx.createBiquadFilter();
		filter.type = fx.filterType;
		filter.frequency.value = Math.max(40, fx.filterCutoff);
		filter.Q.value = Math.max(1e-4, fx.filterRes);
		const drive = ctx.createWaveShaper();
		drive.curve = distortionCurve(Math.max(.001, fx.drive));
		drive.oversample = "2x";
		const delay = ctx.createDelay(1.5);
		delay.delayTime.value = fx.delaySync ? Math.min(1.4, beatDuration(bpm) * .75) : .28;
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
		reverbWet.gain.value = fx.reverb * .55;
		const chorus = ctx.createDelay();
		chorus.delayTime.value = .016;
		const chLfo = ctx.createOscillator();
		const chAmt = ctx.createGain();
		chLfo.frequency.value = .75;
		chAmt.gain.value = .005;
		chLfo.connect(chAmt);
		chAmt.connect(chorus.delayTime);
		const chorusWet = ctx.createGain();
		chorusWet.gain.value = fx.chorus * .4;
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
		return {
			input,
			filter,
			delay,
			delayFb,
			delayWet,
			reverbWet,
			chorusWet,
			drive,
			panner,
			gain,
			analyser,
			lfo: chLfo
		};
	}
	async decode(bytes) {
		return (await this.ensure()).decodeAudioData(bytes.slice(0));
	}
	clearLive(when) {
		const t = when ?? this.ctx?.currentTime ?? 0;
		for (const s of this.live) try {
			s.stop(t);
		} catch {}
		this.live = [];
	}
	disconnectTracks() {
		this.trackGraphs.forEach((g) => {
			try {
				g.lfo.stop();
			} catch {}
			try {
				g.analyser.disconnect();
				g.gain.disconnect();
			} catch {}
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
		this.gate.gain.setValueAtTime(Math.max(8e-4, this.gate.gain.value), t);
		this.gate.gain.exponentialRampToValueAtTime(8e-4, t + .012);
		this.clearLive(t + .014);
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
	scheduleLoop(project, origin) {
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
				if (t < ctx.currentTime - .02) continue;
				playDrum(ctx, dest, hit, t);
			}
			for (const note of track.notes) {
				if (note.start < 0 || note.start >= loopBeats) continue;
				const t = origin + note.start * spb + swingOffset(note.start, project.swing, spb);
				if (t < ctx.currentTime - .02) continue;
				playSynthVoice(ctx, dest, patch, note.pitch, note.velocity, t, note.duration * spb);
			}
			for (const clip of track.voices) {
				const buf = this.voiceBuffers.get(clip.id);
				if (!buf) continue;
				const t = origin + clip.start * spb;
				if (t < ctx.currentTime - .02) continue;
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
		if (project.metronome) for (let b = 0; b < loopBeats; b++) {
			const t = origin + b * spb;
			if (t < ctx.currentTime - .02) continue;
			this.click(t, b % 4 === 0);
		}
	}
	click(time, accent) {
		const ctx = this.ctx;
		const dest = this.metroGain;
		if (!ctx || !dest) return;
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.setValueAtTime(accent ? 1680 : 1120, time);
		const g = ctx.createGain();
		g.gain.setValueAtTime(8e-4, time);
		g.gain.exponentialRampToValueAtTime(accent ? .28 : .16, time + .002);
		g.gain.exponentialRampToValueAtTime(8e-4, time + .04);
		osc.connect(g);
		g.connect(dest);
		osc.start(time);
		osc.stop(time + .05);
		this.live.push(osc);
	}
	async play(project, fromBeat = 0) {
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
			this.gate.gain.setValueAtTime(8e-4, t0);
			this.gate.gain.exponentialRampToValueAtTime(1, t0 + .012);
		}
		this.setMaster(project.masterVolume);
		for (const track of project.tracks) {
			const graph = this.buildGraph(ctx, track.fx, project.bpm);
			graph.gain.gain.value = silentFor(track, project) ? 0 : track.volume;
			graph.panner.pan.value = track.pan;
			graph.analyser.connect(this.master);
			this.trackGraphs.set(track.id, graph);
			this.trackAnalysers.set(track.id, graph.analyser);
			this.trackGains.set(track.id, graph.gain);
		}
		this.startCtxTime = ctx.currentTime + .04;
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
					const v = Math.abs((data[i] - 128) / 128);
					if (v > peak) peak = v;
				}
				this.lastPeak = peak;
				this.listeners.onClip?.(peak >= .99);
			}
			if (this.project.loop === false) {
				if (this.ctx.currentTime - this.startCtxTime >= loopSec) {
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
	previewNote(patch, midi, vel = .8, dur = .45) {
		this.ensure().then((ctx) => {
			playSynthVoice(ctx, this.master ?? ctx.destination, patch, midi, vel, ctx.currentTime, dur);
		});
	}
	previewDrum(sample) {
		this.ensure().then((ctx) => {
			playDrum(ctx, this.master ?? ctx.destination, {
				id: "prev",
				sample,
				start: 0,
				velocity: .9
			}, ctx.currentTime);
		});
	}
	async renderOffline(project, settings = DEFAULT_EXPORT, onlyTrackId) {
		const sr = settings.sampleRate;
		const tail = settings.includeTail ? 1.8 : .05;
		const seconds = projectDurationSec(project) + tail;
		const frames = Math.ceil(sr * seconds);
		const offline = new OfflineAudioContext(2, frames, sr);
		const master = offline.createGain();
		master.gain.value = project.masterVolume;
		const limiter = offline.createDynamicsCompressor();
		limiter.threshold.value = -3;
		limiter.knee.value = 2;
		limiter.ratio.value = 20;
		limiter.attack.value = .003;
		limiter.release.value = .12;
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
				playSynthVoice(offline, dest, patch, note.pitch, note.velocity, origin + note.start * spb + swingOffset(note.start, project.swing, spb), note.duration * spb);
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
		const channels = [];
		for (let c = 0; c < rendered.numberOfChannels; c++) channels.push(new Float32Array(rendered.getChannelData(c)));
		if (settings.normalize) normalizeChannels(channels, .89);
		const pcm = makePcm(channels, sr);
		return {
			buffer: pcm,
			report: clipReportFor(pcm, settings.bitDepth)
		};
	}
	async renderWav(project, settings = DEFAULT_EXPORT) {
		const { buffer, report } = await this.renderOffline(project, settings);
		return {
			blob: encodeWav(buffer, settings.bitDepth, settings.dither && settings.bitDepth !== 32),
			report
		};
	}
	async renderStems(project, settings) {
		const out = [];
		const mix = await this.renderWav(project, {
			...settings,
			stems: false
		});
		out.push({
			name: "master",
			blob: mix.blob
		});
		for (const track of project.tracks) {
			const { buffer } = await this.renderOffline(project, settings, track.id);
			out.push({
				name: track.name.replace(/\s+/g, "-").toLowerCase() || track.id,
				blob: encodeWav(buffer, settings.bitDepth, settings.dither && settings.bitDepth !== 32)
			});
		}
		return out;
	}
};
var singleton = null;
function getEngine() {
	if (typeof window === "undefined") return new ForgeEngine();
	if (!singleton) singleton = new ForgeEngine();
	return singleton;
}
var DB_NAME = "hathor-forge";
var DB_VERSION = 2;
var PREF_KEY = "hathor-forge-prefs";
var LEGACY_KEY = "hathor-forge-v1";
var PRESET_KEY = "hathor-forge-user-patches";
function openDb() {
	return new Promise((resolve, reject) => {
		if (typeof indexedDB === "undefined") {
			reject(/* @__PURE__ */ new Error("IndexedDB unavailable"));
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
		req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("idb open failed"));
	});
}
function txDone(tx) {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error ?? /* @__PURE__ */ new Error("idb tx failed"));
		tx.onabort = () => reject(tx.error ?? /* @__PURE__ */ new Error("idb tx aborted"));
	});
}
async function saveProject(project) {
	const record = {
		...project,
		updatedAt: Date.now()
	};
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
	} catch {}
}
async function loadCurrentProject() {
	try {
		const db = await openDb();
		try {
			const fromIdb = await new Promise((resolve, reject) => {
				const req = db.transaction("kv", "readonly").objectStore("kv").get("current");
				req.onsuccess = () => resolve(req.result);
				req.onerror = () => reject(req.error);
			});
			const normalized = fromIdb ? normalizeProject(fromIdb) : null;
			if (normalized) return normalized;
		} finally {
			db.close();
		}
	} catch {}
	if (typeof localStorage === "undefined") return null;
	try {
		const raw = localStorage.getItem(LEGACY_KEY);
		if (!raw) return null;
		return normalizeProject(JSON.parse(raw));
	} catch {
		return null;
	}
}
async function listSessions() {
	try {
		const db = await openDb();
		try {
			return (await new Promise((resolve, reject) => {
				const req = db.transaction("sessions", "readonly").objectStore("sessions").getAll();
				req.onsuccess = () => resolve(req.result ?? []);
				req.onerror = () => reject(req.error);
			})).map((p) => ({
				id: p.id,
				name: p.name,
				updatedAt: p.updatedAt,
				bpm: p.bpm,
				bars: p.bars,
				tracks: p.tracks?.length ?? 0
			})).sort((a, b) => b.updatedAt - a.updatedAt);
		} finally {
			db.close();
		}
	} catch {
		return [];
	}
}
async function loadSessionById(id) {
	try {
		const db = await openDb();
		try {
			const p = await new Promise((resolve, reject) => {
				const req = db.transaction("sessions", "readonly").objectStore("sessions").get(id);
				req.onsuccess = () => resolve(req.result);
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
async function saveAudioBuffer(id, buffer) {
	const channels = [];
	for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(new Float32Array(buffer.getChannelData(c)));
	const db = await openDb();
	try {
		const tx = db.transaction("audio", "readwrite");
		tx.objectStore("audio").put({
			id,
			sampleRate: buffer.sampleRate,
			channels
		}, id);
		await txDone(tx);
	} finally {
		db.close();
	}
}
async function loadAudioBuffer(ctx, id) {
	try {
		const db = await openDb();
		try {
			const rec = await new Promise((resolve, reject) => {
				const req = db.transaction("audio", "readonly").objectStore("audio").get(id);
				req.onsuccess = () => resolve(req.result);
				req.onerror = () => reject(req.error);
			});
			if (!rec?.channels?.length) return null;
			const buf = ctx.createBuffer(rec.channels.length, rec.channels[0].length, rec.sampleRate);
			rec.channels.forEach((ch, i) => buf.copyToChannel(new Float32Array(ch), i));
			return buf;
		} finally {
			db.close();
		}
	} catch {
		return null;
	}
}
function loadPrefs() {
	if (typeof localStorage === "undefined") return {
		seenOnboard: false,
		lastSessionId: null
	};
	try {
		const raw = localStorage.getItem(PREF_KEY);
		if (!raw) return {
			seenOnboard: false,
			lastSessionId: null
		};
		const parsed = JSON.parse(raw);
		return {
			seenOnboard: Boolean(parsed.seenOnboard),
			lastSessionId: parsed.lastSessionId ?? null
		};
	} catch {
		return {
			seenOnboard: false,
			lastSessionId: null
		};
	}
}
function savePrefs(prefs) {
	if (typeof localStorage === "undefined") return;
	const next = {
		...loadPrefs(),
		...prefs
	};
	try {
		localStorage.setItem(PREF_KEY, JSON.stringify(next));
	} catch {}
}
function loadUserPatches() {
	if (typeof localStorage === "undefined") return [];
	try {
		const raw = localStorage.getItem(PRESET_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}
function saveUserPatches(patches) {
	try {
		localStorage.setItem(PRESET_KEY, JSON.stringify(patches));
	} catch {}
}
function importBundle(raw) {
	if (!raw || typeof raw !== "object") return null;
	const o = raw;
	return normalizeProject(o.project ?? o);
}
function n$1(pitch, start, duration, velocity = .75, id) {
	return {
		id: id ?? `n-${pitch}-${start}`,
		pitch,
		start,
		duration,
		velocity
	};
}
function d$1(sample, start, velocity = .85, id) {
	return {
		id: id ?? `d-${sample}-${start}`,
		sample,
		start,
		velocity
	};
}
function track$1(id, name, kind, instrumentId, extra = {}) {
	return {
		id,
		name,
		kind,
		instrumentId,
		mute: false,
		solo: false,
		volume: kind === "drums" ? .86 : kind === "bass" ? .78 : kind === "pad" ? .62 : .7,
		pan: 0,
		notes: [],
		drums: [],
		voices: [],
		fx: defaultFxFor(kind),
		...extra
	};
}
function every(from, to, step, fn) {
	let i = 0;
	for (let t = from; t < to; t += step) {
		fn(t, i);
		i += 1;
	}
}
function emberProtocol() {
	const bars = 8;
	const end = 32;
	const drums = [];
	every(0, end, 1, (t) => drums.push(d$1("kick", t, t % 4 === 0 ? .95 : .78)));
	every(0, end, 2, (t) => {
		if (t % 4 === 2) drums.push(d$1("snare", t, .86));
	});
	every(0, end, .5, (t, i) => {
		const open = i % 8 === 7;
		drums.push(d$1(open ? "openhat" : "hat", t, open ? .55 : i % 2 === 0 ? .42 : .28));
	});
	every(16, end, 2, (t) => {
		if (t % 4 === 2) drums.push(d$1("clap", t, .7));
	});
	drums.push(d$1("perc", 7.5, .5), d$1("perc", 15.5, .55), d$1("rim", 27.75, .6), d$1("tom", 30, .7), d$1("tom", 31, .55));
	const bassNotes = [];
	const bassPat = [
		38,
		38,
		50,
		38,
		41,
		38,
		36,
		38
	];
	every(0, 8, 1, (t, i) => bassNotes.push(n$1(bassPat[i % 8], t, .85, .82, `b0-${t}`)));
	const bassPat2 = [
		46,
		46,
		58,
		46,
		50,
		46,
		43,
		46
	];
	every(8, 16, 1, (t, i) => bassNotes.push(n$1(bassPat2[i % 8], t, .85, .8, `b1-${t}`)));
	const bassPat3 = [
		43,
		43,
		55,
		43,
		46,
		43,
		41,
		43
	];
	every(16, 24, 1, (t, i) => bassNotes.push(n$1(bassPat3[i % 8], t, .85, .8, `b2-${t}`)));
	const bassPat4 = [
		45,
		45,
		57,
		45,
		49,
		45,
		40,
		45
	];
	every(24, 32, 1, (t, i) => bassNotes.push(n$1(bassPat4[i % 8], t, .7, .84, `b3-${t}`)));
	bassNotes.push(n$1(38, 3.5, .4, .6, "b-ghost-1"), n$1(50, 11.5, .4, .55, "b-ghost-2"));
	const pad = [
		n$1(50, 0, 7.8, .55, "p-d3"),
		n$1(53, 0, 7.8, .5, "p-f3"),
		n$1(57, 0, 7.8, .48, "p-a3"),
		n$1(62, 0, 7.8, .4, "p-d4"),
		n$1(46, 8, 7.8, .55, "p-bb2"),
		n$1(50, 8, 7.8, .5, "p-d3b"),
		n$1(53, 8, 7.8, .48, "p-f3b"),
		n$1(58, 8, 7.8, .4, "p-bb3"),
		n$1(43, 16, 7.8, .55, "p-g2"),
		n$1(46, 16, 7.8, .5, "p-bb2c"),
		n$1(50, 16, 7.8, .48, "p-d3c"),
		n$1(55, 16, 7.8, .4, "p-g3"),
		n$1(45, 24, 7.8, .58, "p-a2"),
		n$1(49, 24, 7.8, .5, "p-cs3"),
		n$1(52, 24, 7.8, .48, "p-e3"),
		n$1(57, 24, 7.8, .42, "p-a3b")
	];
	const lead = [
		n$1(74, 1, .7, .7, "l1"),
		n$1(73, 2, .45, .62, "l2"),
		n$1(74, 2.5, 1.2, .72, "l3"),
		n$1(77, 4.5, .7, .68, "l4"),
		n$1(76, 6, 1.5, .7, "l5"),
		n$1(74, 9, .5, .65, "l6"),
		n$1(77, 10, .75, .7, "l7"),
		n$1(81, 11.5, 1.8, .66, "l8"),
		n$1(79, 14, 1.4, .62, "l9"),
		n$1(74, 17, .6, .68, "l10"),
		n$1(70, 18, .6, .6, "l11"),
		n$1(74, 19, 1.4, .7, "l12"),
		n$1(77, 21.5, .7, .64, "l13"),
		n$1(81, 24.5, 1, .72, "l14"),
		n$1(80, 26, .5, .6, "l15"),
		n$1(81, 26.75, 1.2, .7, "l16"),
		n$1(76, 28.5, 2.8, .68, "l17")
	];
	const bells = [
		n$1(86, 7.5, 2.2, .45, "bell1"),
		n$1(84, 15.5, 2, .4, "bell2"),
		n$1(88, 23.5, 2.4, .42, "bell3"),
		n$1(81, 30.5, 1.4, .38, "bell4")
	];
	const choir = [
		n$1(62, 16, 7.5, .45, "ch1"),
		n$1(65, 16, 7.5, .4, "ch2"),
		n$1(69, 16, 7.5, .38, "ch3"),
		n$1(57, 24, 7.5, .42, "ch4"),
		n$1(61, 24, 7.5, .38, "ch5"),
		n$1(64, 24, 7.5, .4, "ch6")
	];
	return {
		id: "proj-ember",
		name: "Ember Protocol",
		bpm: 92,
		key: "D",
		scale: "harmonic-minor",
		bars,
		swing: .08,
		masterVolume: .85,
		updatedAt: Date.now(),
		loop: true,
		metronome: false,
		timeNumerator: 4,
		timeDenominator: 4,
		tracks: [
			track$1("tr-drums", "Kit", "drums", "kit", {
				drums,
				volume: .88,
				pan: 0
			}),
			track$1("tr-bass", "Sub / Bass", "bass", "analog-bass", {
				notes: bassNotes,
				volume: .8,
				pan: -.05
			}),
			track$1("tr-pad", "Warm Field", "pad", "warm-pad", {
				notes: pad,
				volume: .58,
				pan: .08
			}),
			track$1("tr-lead", "Glass", "lead", "glass-lead", {
				notes: lead,
				volume: .62,
				pan: .12
			}),
			track$1("tr-bell", "Bells", "keys", "fm-bell", {
				notes: bells,
				volume: .48,
				pan: -.18
			}),
			track$1("tr-choir", "Choir", "voice", "choir", {
				notes: choir,
				volume: .46,
				pan: 0,
				fx: {
					...DEFAULT_FX,
					reverb: .55,
					delay: .1
				}
			})
		]
	};
}
function nightShift() {
	const bars = 8;
	const end = 32;
	const drums = [];
	every(0, end, 1, (t) => drums.push(d$1("kick", t, .9)));
	every(0, end, 2, (t) => {
		if (t % 4 === 2) drums.push(d$1("clap", t, .8), d$1("snare", t, .45));
	});
	every(0, end, .5, (t, i) => {
		if (i % 2 === 1) drums.push(d$1("hat", t, .55));
		else drums.push(d$1("hat", t, .22));
	});
	drums.push(d$1("openhat", 7.5, .5), d$1("openhat", 15.5, .5), d$1("openhat", 23.5, .5), d$1("openhat", 31.5, .55));
	const bass = [];
	const roots = [
		41,
		41,
		44,
		39,
		41,
		41,
		36,
		39
	];
	every(0, end, 4, (t, i) => {
		const r = roots[i % roots.length];
		every(t, t + 4, .5, (bt, j) => {
			const oct = j % 4 === 3 ? 12 : 0;
			bass.push(n$1(r + oct, bt, .42, j % 2 === 0 ? .85 : .6, `hb-${bt}`));
		});
	});
	const pad = [];
	const chords = [
		[
			41,
			44,
			48,
			53
		],
		[
			44,
			48,
			51,
			56
		],
		[
			39,
			43,
			46,
			51
		],
		[
			36,
			39,
			43,
			48
		]
	];
	every(0, end, 8, (t, i) => {
		chords[i % 4].forEach((p, k) => pad.push(n$1(p, t, 7.6, .4 - k * .04, `hp-${t}-${p}`)));
	});
	const pluck = [];
	every(0, end, .5, (t, i) => {
		if (i % 4 === 0 || i % 7 === 0) {
			const p = [
				53,
				56,
				58,
				60,
				58,
				56,
				53,
				51
			][i % 8];
			pluck.push(n$1(p, t, .28, .55, `pl-${t}`));
		}
	});
	return {
		id: "proj-night",
		name: "Night Shift",
		bpm: 122,
		key: "F",
		scale: "minor",
		bars,
		swing: 0,
		masterVolume: .84,
		updatedAt: Date.now(),
		loop: true,
		metronome: false,
		timeNumerator: 4,
		timeDenominator: 4,
		tracks: [
			track$1("ns-drums", "Four on the Floor", "drums", "kit", { drums }),
			track$1("ns-bass", "House Bass", "bass", "analog-bass", {
				notes: bass,
				volume: .76
			}),
			track$1("ns-pad", "Night Pad", "pad", "air-pad", {
				notes: pad,
				volume: .5
			}),
			track$1("ns-pluck", "Offbeat Pluck", "lead", "pluck", {
				notes: pluck,
				volume: .55,
				pan: .16
			})
		]
	};
}
function wireTrap() {
	const bars = 8;
	const end = 32;
	const drums = [];
	every(0, end, 4, (t) => {
		drums.push(d$1("kick", t, .95), d$1("kick", t + 1.5, .7), d$1("kick", t + 2.75, .6));
		drums.push(d$1("snare", t + 2, .88), d$1("clap", t + 2, .5));
	});
	every(0, end, .25, (t, i) => {
		const vel = i % 4 === 0 ? .5 : i % 8 === 7 ? .7 : .22;
		drums.push(d$1("hat", t, vel));
	});
	drums.push(d$1("openhat", 3.5, .45), d$1("openhat", 11.5, .45), d$1("perc", 6.75, .4), d$1("rim", 14.75, .5));
	const bass = [];
	const line = [
		33,
		33,
		36,
		31,
		33,
		28,
		31,
		33
	];
	every(0, end, 4, (t, i) => {
		const r = line[i % line.length];
		bass.push(n$1(r, t, 1.35, .92, `808-${t}`), n$1(r, t + 1.5, .4, .7, `808b-${t}`), n$1(r + 12, t + 2.5, .35, .55, `808c-${t}`));
	});
	const keys = [
		n$1(57, 0, 1.8, .5, "k1"),
		n$1(60, 0, 1.8, .45, "k2"),
		n$1(64, 0, 1.8, .4, "k3"),
		n$1(55, 4, 1.6, .48, "k4"),
		n$1(60, 4, 1.6, .42, "k5"),
		n$1(63, 8, 2, .5, "k6"),
		n$1(67, 8, 2, .4, "k7"),
		n$1(52, 16, 3.5, .42, "k8"),
		n$1(55, 16, 3.5, .38, "k9"),
		n$1(60, 16, 3.5, .36, "k10"),
		n$1(57, 24, 3.5, .45, "k11"),
		n$1(61, 24, 3.5, .4, "k12"),
		n$1(64, 24, 3.5, .38, "k13")
	];
	return {
		id: "proj-wire",
		name: "Wire",
		bpm: 140,
		key: "A",
		scale: "minor",
		bars,
		swing: .12,
		masterVolume: .82,
		updatedAt: Date.now(),
		loop: true,
		metronome: false,
		timeNumerator: 4,
		timeDenominator: 4,
		tracks: [
			track$1("w-drums", "Trap Kit", "drums", "kit", {
				drums,
				volume: .9
			}),
			track$1("w-808", "808", "bass", "sub-bass", {
				notes: bass,
				volume: .86,
				fx: {
					...DEFAULT_FX,
					drive: .22,
					filterCutoff: 900
				}
			}),
			track$1("w-keys", "Dark Keys", "keys", "keys", {
				notes: keys,
				volume: .5,
				pan: -.1
			}),
			track$1("w-lead", "Wire Lead", "lead", "dark-lead", {
				notes: [
					n$1(69, 2, .4, .6, "wl1"),
					n$1(72, 2.5, .7, .65, "wl2"),
					n$1(76, 6, 1.1, .6, "wl3"),
					n$1(74, 18, .5, .55, "wl4"),
					n$1(69, 26, 1.4, .62, "wl5")
				],
				volume: .48,
				pan: .2
			})
		]
	};
}
function stillAir() {
	const pad = [
		n$1(50, 0, 15.5, .42, "sa1"),
		n$1(53, 0, 15.5, .36, "sa2"),
		n$1(57, 0, 15.5, .34, "sa3"),
		n$1(62, 4, 12, .28, "sa4"),
		n$1(46, 16, 15.5, .4, "sa5"),
		n$1(53, 16, 15.5, .34, "sa6"),
		n$1(58, 16, 15.5, .32, "sa7"),
		n$1(65, 20, 10, .26, "sa8")
	];
	const choir = [
		n$1(62, 8, 10, .32, "sc1"),
		n$1(65, 12, 12, .28, "sc2"),
		n$1(69, 18, 10, .3, "sc3"),
		n$1(57, 24, 8, .26, "sc4")
	];
	const bells = [
		n$1(81, 3, 3, .35, "sb1"),
		n$1(84, 11, 4, .3, "sb2"),
		n$1(79, 19, 5, .32, "sb3"),
		n$1(86, 27, 4, .28, "sb4")
	];
	return {
		id: "proj-air",
		name: "Still Air",
		bpm: 68,
		key: "D",
		scale: "dorian",
		bars: 8,
		swing: 0,
		masterVolume: .8,
		updatedAt: Date.now(),
		loop: true,
		metronome: false,
		timeNumerator: 4,
		timeDenominator: 4,
		tracks: [
			track$1("air-pad", "Atmosphere", "pad", "air-pad", {
				notes: pad,
				volume: .7
			}),
			track$1("air-choir", "Hum", "voice", "choir", {
				notes: choir,
				volume: .5
			}),
			track$1("air-bell", "Distant Bell", "keys", "fm-bell", {
				notes: bells,
				volume: .42,
				pan: .22
			}),
			track$1("air-fx", "Air", "fx", "noise-riser", {
				notes: [n$1(40, 0, 8, .25, "fx1"), n$1(38, 24, 8, .22, "fx2")],
				volume: .28
			})
		]
	};
}
function pulseTechno() {
	const bars = 8;
	const end = 32;
	const drums = [];
	every(0, end, 1, (t) => drums.push(d$1("kick", t, .96)));
	every(0, end, .5, (t, i) => drums.push(d$1("hat", t, i % 2 ? .6 : .28)));
	every(0, end, 1, (t) => {
		if (t % 4 === 3) drums.push(d$1("clap", t + .5, .35));
	});
	drums.push(d$1("ride", 16, .3), d$1("ride", 18, .28), d$1("ride", 20, .3), d$1("ride", 22, .28));
	const bass = [];
	every(0, end, .5, (t, i) => {
		const p = i % 16 < 8 ? 36 : 34;
		bass.push(n$1(p, t, .4, i % 2 === 0 ? .8 : .55, `tb-${t}`));
	});
	const stab = [];
	every(0, end, 4, (t) => {
		[
			51,
			55,
			58
		].forEach((p) => stab.push(n$1(p, t + .75, .2, .55, `st-${t}-${p}`)));
		[
			51,
			54,
			58
		].forEach((p) => stab.push(n$1(p, t + 2.75, .18, .5, `st2-${t}-${p}`)));
	});
	return {
		id: "proj-pulse",
		name: "Pulse",
		bpm: 132,
		key: "C",
		scale: "minor",
		bars,
		swing: 0,
		masterVolume: .84,
		updatedAt: Date.now(),
		loop: true,
		metronome: false,
		timeNumerator: 4,
		timeDenominator: 4,
		tracks: [
			track$1("p-drums", "Kick Grid", "drums", "kit", {
				drums,
				volume: .92
			}),
			track$1("p-bass", "Off-filter Bass", "bass", "analog-bass", {
				notes: bass,
				volume: .74,
				fx: {
					...DEFAULT_FX,
					filterCutoff: 520,
					drive: .28
				}
			}),
			track$1("p-stab", "Stabs", "lead", "brass", {
				notes: stab,
				volume: .5,
				pan: .08
			})
		]
	};
}
var TEMPLATES = [
	{
		id: "ember",
		name: "Ember Protocol",
		blurb: "Cinematic D-minor cue — drums, bass, pad, glass, choir",
		build: emberProtocol
	},
	{
		id: "night",
		name: "Night Shift",
		blurb: "Deep house at 122 — four-on-the-floor, offbeat hats",
		build: nightShift
	},
	{
		id: "wire",
		name: "Wire",
		blurb: "Trap 140 — 808s, hat rolls, dark keys",
		build: wireTrap
	},
	{
		id: "air",
		name: "Still Air",
		blurb: "Ambient dorian field, choir hum, distant bells",
		build: stillAir
	},
	{
		id: "pulse",
		name: "Pulse",
		blurb: "Techno grid, filtered bass, brass stabs",
		build: pulseTechno
	}
];
function demoProject() {
	return emberProtocol();
}
function blankProject(name = "Untitled Session") {
	return {
		id: uid("proj"),
		name,
		bpm: 110,
		key: "A",
		scale: "minor",
		bars: 8,
		swing: 0,
		masterVolume: .85,
		updatedAt: Date.now(),
		loop: true,
		metronome: false,
		timeNumerator: 4,
		timeDenominator: 4,
		tracks: [
			track$1("blank-drums", "Kit", "drums", "kit"),
			track$1("blank-bass", "Bass", "bass", "analog-bass"),
			track$1("blank-pad", "Pad", "pad", "warm-pad"),
			track$1("blank-lead", "Lead", "lead", "glass-lead")
		]
	};
}
function cloneProject(p) {
	return JSON.parse(JSON.stringify(p));
}
var MAX_HISTORY = 40;
var persistTimer = null;
function schedulePersist(project) {
	if (typeof window === "undefined") return;
	if (persistTimer) clearTimeout(persistTimer);
	persistTimer = setTimeout(() => {
		saveProject(project).catch(() => void 0);
	}, 280);
}
var useForge = create((set, get) => ({
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
		} catch {}
		set({
			project,
			hydrated: true,
			selectedTrackId: project.tracks[0]?.id ?? null,
			userPatches,
			showOnboard: !prefs.seenOnboard
		});
	},
	persist: () => {
		const project = {
			...get().project,
			updatedAt: Date.now()
		};
		set({ project });
		schedulePersist(project);
	},
	commit: () => {
		const { project, history } = get();
		set({
			history: [...history, cloneProject(project)].slice(-40),
			future: []
		});
		schedulePersist(get().project);
	},
	undo: () => {
		const { history, project, future } = get();
		const prev = history[history.length - 1];
		if (!prev) return;
		set({
			project: prev,
			history: history.slice(0, -1),
			future: [cloneProject(project), ...future].slice(0, MAX_HISTORY)
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
			history: [...history, cloneProject(project)].slice(-40)
		});
		schedulePersist(next);
	},
	setPlaying: (v) => set({ isPlaying: v }),
	setView: (v) => set({ view: v }),
	selectTrack: (id) => {
		set({ selectedTrackId: id });
		if (id) {
			const t = get().project.tracks.find((x) => x.id === id);
			if (t && t.kind !== "drums" && t.kind !== "sample") set({ workingPatch: patchById(t.instrumentId) });
		}
	},
	renameProject: (name) => {
		get().commit();
		set({ project: {
			...get().project,
			name,
			updatedAt: Date.now()
		} });
		get().persist();
	},
	setBpm: (bpm) => {
		set({ project: {
			...get().project,
			bpm: Math.round(Math.min(200, Math.max(48, bpm)))
		} });
		get().persist();
	},
	setKey: (key) => {
		get().commit();
		set({ project: {
			...get().project,
			key
		} });
		get().persist();
	},
	setMaster: (v) => {
		set({ project: {
			...get().project,
			masterVolume: v
		} });
		get().persist();
	},
	setSwing: (v) => {
		set({ project: {
			...get().project,
			swing: v
		} });
		get().persist();
	},
	setBars: (n) => {
		get().commit();
		set({ project: {
			...get().project,
			bars: Math.min(16, Math.max(4, n))
		} });
		get().persist();
	},
	setLoop: (v) => {
		set({ project: {
			...get().project,
			loop: v
		} });
		get().persist();
	},
	setMetronome: (v) => {
		set({ project: {
			...get().project,
			metronome: v
		} });
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
		set({
			project,
			selectedTrackId: project.tracks[0]?.id ?? null,
			pendingTemplate: null
		});
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
		set({
			project,
			selectedTrackId: project.tracks[0]?.id ?? null
		});
		get().persist();
	},
	importProject: (p) => {
		get().commit();
		set({
			project: p,
			selectedTrackId: p.tracks[0]?.id ?? null
		});
		get().persist();
	},
	updateTrack: (id, patch) => {
		const project = get().project;
		set({ project: {
			...project,
			tracks: project.tracks.map((t) => t.id === id ? {
				...t,
				...patch
			} : t),
			updatedAt: Date.now()
		} });
		get().persist();
	},
	addTrack: (kind) => {
		get().commit();
		const instrumentId = KIND_INSTRUMENT[kind];
		const t = {
			id: uid("tr"),
			name: kind[0].toUpperCase() + kind.slice(1),
			kind,
			instrumentId,
			mute: false,
			solo: false,
			volume: .75,
			pan: 0,
			notes: [],
			drums: [],
			voices: [],
			fx: defaultFxFor(kind)
		};
		set({
			project: {
				...get().project,
				tracks: [...get().project.tracks, t]
			},
			selectedTrackId: t.id
		});
		get().persist();
	},
	removeTrack: (id) => {
		const project = get().project;
		if (project.tracks.length <= 1) return;
		get().commit();
		const tracks = project.tracks.filter((t) => t.id !== id);
		set({
			project: {
				...project,
				tracks
			},
			selectedTrackId: tracks[0]?.id ?? null
		});
		get().persist();
	},
	duplicateTrack: (id) => {
		const src = get().project.tracks.find((t) => t.id === id);
		if (!src) return;
		get().commit();
		const copy = JSON.parse(JSON.stringify(src));
		copy.id = uid("tr");
		copy.name = `${src.name} copy`;
		copy.notes = copy.notes.map((n) => ({
			...n,
			id: uid("n")
		}));
		copy.drums = copy.drums.map((h) => ({
			...h,
			id: uid("hit")
		}));
		const tracks = get().project.tracks.flatMap((t) => t.id === id ? [t, copy] : [t]);
		set({
			project: {
				...get().project,
				tracks
			},
			selectedTrackId: copy.id
		});
		get().persist();
	},
	toggleDrum: (trackId, sample, start, velocity = .85) => {
		get().commit();
		const project = get().project;
		set({ project: {
			...project,
			tracks: project.tracks.map((t) => {
				if (t.id !== trackId) return t;
				const existing = t.drums.find((h) => h.sample === sample && Math.abs(h.start - start) < .001);
				const drums = existing ? t.drums.filter((h) => h.id !== existing.id) : [...t.drums, {
					id: uid("hit"),
					sample,
					start,
					velocity
				}];
				return {
					...t,
					drums
				};
			})
		} });
		get().persist();
	},
	addNote: (trackId, note) => {
		get().commit();
		const project = get().project;
		set({ project: {
			...project,
			tracks: project.tracks.map((t) => t.id === trackId ? {
				...t,
				notes: [...t.notes, {
					...note,
					id: uid("n")
				}]
			} : t)
		} });
		get().persist();
	},
	removeNote: (trackId, noteId) => {
		get().commit();
		const project = get().project;
		set({ project: {
			...project,
			tracks: project.tracks.map((t) => t.id === trackId ? {
				...t,
				notes: t.notes.filter((n) => n.id !== noteId)
			} : t)
		} });
		get().persist();
	},
	moveNote: (trackId, noteId, patch) => {
		const project = get().project;
		set({ project: {
			...project,
			tracks: project.tracks.map((t) => t.id === trackId ? {
				...t,
				notes: t.notes.map((n) => n.id === noteId ? {
					...n,
					...patch
				} : n)
			} : t)
		} });
		get().persist();
	},
	quantizeTrack: (trackId) => {
		get().commit();
		const project = get().project;
		const q = (v) => Math.round(v * 4) / 4;
		set({ project: {
			...project,
			tracks: project.tracks.map((t) => {
				if (t.id !== trackId) return t;
				return {
					...t,
					notes: t.notes.map((n) => ({
						...n,
						start: q(n.start),
						duration: Math.max(.25, q(n.duration))
					})),
					drums: t.drums.map((h) => ({
						...h,
						start: q(h.start)
					}))
				};
			})
		} });
		get().persist();
	},
	setFx: (trackId, fx) => {
		const project = get().project;
		set({ project: {
			...project,
			tracks: project.tracks.map((t) => t.id === trackId ? {
				...t,
				fx: {
					...t.fx,
					...fx
				}
			} : t)
		} });
		get().persist();
	},
	setWorkingPatch: (patch) => {
		const current = get().workingPatch;
		if ("id" in patch && "osc1" in patch) set({ workingPatch: patch });
		else set({ workingPatch: {
			...current,
			...patch
		} });
	},
	applyPatchToTrack: () => {
		const { selectedTrackId, workingPatch, project } = get();
		if (!selectedTrackId) return;
		get().commit();
		const id = workingPatch.id;
		set({ project: {
			...project,
			tracks: project.tracks.map((t) => t.id === selectedTrackId ? {
				...t,
				instrumentId: id
			} : t)
		} });
		get().persist();
	},
	saveUserPatch: (name) => {
		const patch = {
			...get().workingPatch,
			id: uid("patch"),
			name
		};
		registerPatch(patch);
		const userPatches = [...get().userPatches, patch];
		set({
			workingPatch: patch,
			userPatches
		});
		saveUserPatches(userPatches);
	},
	loadPatch: (id) => {
		const patch = get().userPatches.find((p) => p.id === id) ?? patchById(id);
		set({ workingPatch: patch });
		const { selectedTrackId, project } = get();
		if (selectedTrackId) {
			set({ project: {
				...project,
				tracks: project.tracks.map((t) => t.id === selectedTrackId ? {
					...t,
					instrumentId: patch.id
				} : t)
			} });
			get().persist();
		}
	},
	addVoiceClip: (trackId, clip) => {
		get().commit();
		const project = get().project;
		set({ project: {
			...project,
			tracks: project.tracks.map((t) => t.id === trackId ? {
				...t,
				voices: [...t.voices, clip]
			} : t)
		} });
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
	setExportSettings: (s) => set({ exportSettings: {
		...get().exportSettings,
		...s
	} }),
	setStorageWarning: (msg) => set({ storageWarning: msg })
}));
var NOTE_NAMES = [
	"C",
	"C#",
	"D",
	"D#",
	"E",
	"F",
	"F#",
	"G",
	"G#",
	"A",
	"A#",
	"B"
];
var KEY_ROOTS = {
	C: 0,
	"C#": 1,
	Db: 1,
	D: 2,
	"D#": 3,
	Eb: 3,
	E: 4,
	F: 5,
	"F#": 6,
	Gb: 6,
	G: 7,
	"G#": 8,
	Ab: 8,
	A: 9,
	"A#": 10,
	Bb: 10,
	B: 11
};
var SCALES$1 = {
	major: [
		0,
		2,
		4,
		5,
		7,
		9,
		11
	],
	minor: [
		0,
		2,
		3,
		5,
		7,
		8,
		10
	],
	dorian: [
		0,
		2,
		3,
		5,
		7,
		9,
		10
	],
	phrygian: [
		0,
		1,
		3,
		5,
		7,
		8,
		10
	],
	mixolydian: [
		0,
		2,
		4,
		5,
		7,
		9,
		10
	],
	"harmonic-minor": [
		0,
		2,
		3,
		5,
		7,
		8,
		11
	]
};
function midiName(midi) {
	const n = (midi % 12 + 12) % 12;
	const oct = Math.floor(midi / 12) - 1;
	return `${NOTE_NAMES[n]}${oct}`;
}
function keyRootPc(key) {
	const k = key.trim();
	const named = KEY_ROOTS[k] ?? KEY_ROOTS[k.replace(/m$/i, "")];
	if (named !== void 0) return named;
	return 2;
}
function scalePitches(key, scale, fromMidi = 36, toMidi = 84) {
	const root = keyRootPc(key);
	const intervals = SCALES$1[scale];
	const out = [];
	for (let m = fromMidi; m <= toMidi; m++) {
		const rel = ((m % 12 + 12) % 12 - root + 12) % 12;
		if (intervals.includes(rel)) out.push(m);
	}
	return out;
}
function degreeMidi(key, scale, degree, octave = 3) {
	const root = keyRootPc(key) + (octave + 1) * 12;
	const intervals = SCALES$1[scale];
	const oct = Math.floor(degree / intervals.length);
	return root + intervals[(degree % intervals.length + intervals.length) % intervals.length] + oct * 12;
}
function Meter({ trackId, className }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let raf = 0;
		const data = /* @__PURE__ */ new Uint8Array(128);
		const loop = () => {
			const engine = getEngine();
			const analyser = trackId ? engine.trackAnalysers.get(trackId) : engine.analyser;
			let peak = 0;
			if (analyser) {
				analyser.getByteTimeDomainData(data);
				for (let i = 0; i < data.length; i++) {
					const v = Math.abs((data[i] - 128) / 128);
					if (v > peak) peak = v;
				}
			}
			if (ref.current) {
				const pct = Math.min(100, peak * 140);
				ref.current.style.transform = `scaleY(${Math.max(.02, pct / 100)})`;
				ref.current.style.opacity = peak > .02 ? "1" : "0.35";
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [trackId]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("relative h-full w-1.5 overflow-hidden rounded-full bg-elevated", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref,
			className: "absolute inset-x-0 bottom-0 h-full origin-bottom rounded-full bg-primary",
			style: { transform: "scaleY(0.02)" }
		})
	});
}
function Scope({ className }) {
	const pathRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let raf = 0;
		const data = /* @__PURE__ */ new Uint8Array(256);
		const loop = () => {
			const analyser = getEngine().analyser;
			const el = pathRef.current;
			if (el) {
				const w = 400;
				const h = 40;
				if (analyser) {
					analyser.getByteTimeDomainData(data);
					const pts = [];
					const step = Math.max(1, Math.floor(data.length / 80));
					for (let i = 0; i < data.length; i += step) {
						const x = i / data.length * w;
						const y = (data[i] - 128) / 128 * (h * .42) + h / 2;
						pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
					}
					el.setAttribute("points", pts.join(" "));
				} else el.setAttribute("points", `0,20 400,20`);
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 400 40",
		preserveAspectRatio: "none",
		className: cn("h-full w-full", className),
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
			x1: "0",
			y1: "20",
			x2: "400",
			y2: "20",
			className: "stroke-border",
			strokeWidth: "1"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
			ref: pathRef,
			fill: "none",
			className: "stroke-primary",
			strokeWidth: "1.5",
			points: "0,20 400,20"
		})]
	});
}
var LOW = 36;
var HIGH = 84;
var ROW = 14;
function PianoRoll({ track }) {
	const project = useForge((s) => s.project);
	const addNote = useForge((s) => s.addNote);
	const removeNote = useForge((s) => s.removeNote);
	const width = project.bars * 4 * 48;
	const rows = (0, import_react.useMemo)(() => {
		const list = [];
		for (let m = HIGH; m >= LOW; m--) list.push(m);
		return list;
	}, []);
	function onGrid(e) {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
		const y = e.clientY - rect.top + e.currentTarget.scrollTop;
		const beat = Math.round(x / 48 * 4) / 4;
		const row = Math.floor(y / ROW);
		const pitch = rows[row];
		if (pitch == null || beat < 0 || beat >= project.bars * 4) return;
		const existing = track.notes.find((n) => n.pitch === pitch && Math.abs(n.start - beat) < .12);
		if (existing) {
			removeNote(track.id, existing.id);
			return;
		}
		const duration = e.shiftKey ? 1 : .25;
		addNote(track.id, {
			pitch,
			start: beat,
			duration,
			velocity: .8
		});
		getEngine().previewNote(patchById(track.instrumentId), pitch, .8, .25);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "w-10 shrink-0 overflow-hidden border-r border-border bg-card",
			children: rows.map((p) => {
				const black = [
					1,
					3,
					6,
					8,
					10
				].includes(p % 12);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("flex items-center justify-end pr-1 font-mono text-[9px] leading-[14px]", black ? "bg-elevated text-subtle" : "text-muted-foreground"),
					style: { height: ROW },
					children: p % 12 === 0 ? midiName(p) : ""
				}, p);
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative min-w-0 flex-1 overflow-auto",
			onClick: onGrid,
			role: "presentation",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				style: {
					width,
					height: rows.length * ROW
				},
				children: [
					rows.map((p, i) => {
						const black = [
							1,
							3,
							6,
							8,
							10
						].includes(p % 12);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("absolute left-0 right-0 border-b border-border/60", black && "bg-elevated/40"),
							style: {
								top: i * ROW,
								height: ROW
							}
						}, p);
					}),
					Array.from({ length: project.bars * 4 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("absolute top-0 bottom-0 w-px", i % 4 === 0 ? "bg-foreground/20" : "bg-border"),
						style: { left: i * 48 }
					}, i)),
					track.notes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoteBlock, {
						note: n,
						trackId: track.id
					}, n.id))
				]
			})
		})]
	});
}
function NoteBlock({ note, trackId }) {
	const removeNote = useForge((s) => s.removeNote);
	const top = (HIGH - note.pitch) * ROW;
	if (note.pitch < LOW || note.pitch > HIGH) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		title: `${midiName(note.pitch)} · click to remove`,
		onClick: (e) => {
			e.stopPropagation();
			removeNote(trackId, note.id);
		},
		className: "absolute rounded-[2px] bg-primary hover:bg-primary-foreground",
		style: {
			left: note.start * 48,
			width: Math.max(6, note.duration * 48 - 1),
			top: top + 1,
			height: 12,
			opacity: .55 + note.velocity * .4
		}
	});
}
function StepSeq({ track }) {
	const project = useForge((s) => s.project);
	const toggleDrum = useForge((s) => s.toggleDrum);
	const steps = stepsFor(project.bars);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "h-full min-h-0 overflow-auto p-2",
		children: [DRUM_ROWS.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1 flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "w-14 shrink-0 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground",
				onClick: () => getEngine().previewDrum(row.sample),
				children: row.label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex min-w-0 flex-1 gap-px overflow-x-auto pb-1",
				children: Array.from({ length: steps }, (_, i) => {
					const start = i * .25;
					const hit = track.drums.find((h) => h.sample === row.sample && Math.abs(h.start - start) < .001);
					const bar = i % 16 === 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => toggleDrum(track.id, row.sample, start, .85),
						className: cn("h-8 w-8 shrink-0 rounded-[3px] md:h-7 md:min-w-4 md:w-auto md:flex-1", hit ? "bg-primary" : bar ? "bg-elevated" : "bg-secondary", i % 4 === 0 && !hit && "outline outline-1 outline-border"),
						"aria-label": `${row.label} step ${i + 1}`,
						"aria-pressed": Boolean(hit)
					}, i);
				})
			})]
		}, row.sample)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-[11px] text-subtle",
			children: "Click a pad to toggle. Preview a row with its label."
		})]
	});
}
function Playhead({ width }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let raf = 0;
		const loop = () => {
			const beat = getEngine().getBeat();
			if (ref.current) ref.current.style.transform = `translateX(${beat * 48}px)`;
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "pointer-events-none absolute top-0 z-20 h-full w-px bg-primary",
		style: { maxWidth: width },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-0.5 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-primary" })
	});
}
function Lane({ track, bars }) {
	const selectTrack = useForge((s) => s.selectTrack);
	const selectedTrackId = useForge((s) => s.selectedTrackId);
	const updateTrack = useForge((s) => s.updateTrack);
	const removeNote = useForge((s) => s.removeNote);
	const width = bars * 4 * 48;
	const selected = selectedTrackId === track.id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex border-b border-border", selected && "bg-elevated/40"),
		onClick: () => selectTrack(track.id),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sticky left-0 z-10 flex w-40 shrink-0 items-center gap-2 border-r border-border bg-card px-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
					trackId: track.id,
					className: "h-8"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "truncate text-sm",
						children: track.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[10px] uppercase tracking-wider text-subtle",
						children: track.kind
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: (e) => {
						e.stopPropagation();
						updateTrack(track.id, { mute: !track.mute });
					},
					className: cn("size-7 rounded-md text-[10px] font-medium", track.mute ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-elevated"),
					"aria-label": "Mute",
					"aria-pressed": track.mute,
					children: "M"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: (e) => {
						e.stopPropagation();
						updateTrack(track.id, { solo: !track.solo });
					},
					className: cn("size-7 rounded-md text-[10px] font-medium", track.solo ? "bg-foreground text-background" : "text-muted-foreground hover:bg-elevated"),
					"aria-label": "Solo",
					"aria-pressed": track.solo,
					children: "S"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "arrange-grid relative h-14",
			style: {
				width,
				minWidth: width,
				["--beat"]: `48px`
			},
			children: [
				track.notes.map((n) => {
					const pitches = track.notes.map((x) => x.pitch);
					const minP = Math.min(...pitches, n.pitch);
					const maxP = Math.max(...pitches, n.pitch);
					const span = Math.max(1, maxP - minP);
					const y = 6 + (maxP - n.pitch) / span * 32;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						title: `${midiName(n.pitch)} ${n.duration.toFixed(2)} beats`,
						onClick: (e) => {
							e.stopPropagation();
							removeNote(track.id, n.id);
						},
						className: "absolute h-2 rounded-[2px] bg-primary hover:bg-primary-foreground",
						style: {
							left: n.start * 48,
							width: Math.max(6, n.duration * 48 - 1),
							top: y,
							opacity: .55 + n.velocity * .4
						}
					}, n.id);
				}),
				track.drums.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute top-1/2 size-2.5 -translate-y-1/2 rotate-45 bg-foreground/80",
					style: {
						left: h.start * 48,
						opacity: .4 + h.velocity * .6
					},
					title: h.sample
				}, h.id)),
				track.voices.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute top-3 h-8 rounded-sm border border-primary/40 bg-primary/20 px-1 font-mono text-[10px] text-foreground",
					style: {
						left: v.start * 48,
						width: Math.max(24, v.duration * 48)
					},
					children: v.name
				}, v.id))
			]
		})]
	});
}
function ArrangeView() {
	const project = useForge((s) => s.project);
	const selectedTrackId = useForge((s) => s.selectedTrackId);
	const width = project.bars * 4 * 48;
	const track = project.tracks.find((t) => t.id === selectedTrackId) ?? project.tracks[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative min-h-0 flex-1 overflow-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-10 flex border-b border-border bg-background/90 backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sticky left-0 z-10 w-40 shrink-0 border-r border-border bg-background px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground",
					children: "Tracks"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative",
					style: {
						width,
						minWidth: width
					},
					children: Array.from({ length: project.bars }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute top-1 font-mono text-[10px] text-subtle",
						style: { left: i * 4 * 48 + 4 },
						children: i + 1
					}, i))
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				style: { minWidth: width + 160 },
				children: [project.tracks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lane, {
					track: t,
					bars: project.bars
				}, t.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute top-0 bottom-0 left-40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Playhead, { width })
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-[220px] shrink-0 border-t border-border bg-card",
			children: track?.kind === "drums" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepSeq, { track }) : track ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PianoRoll, { track }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-full items-center justify-center text-sm text-muted-foreground",
				children: "Select a track to edit notes."
			})
		})]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var ComposeInput = object({ prompt: string().trim().min(3).max(500) });
var VoiceInput = object({
	text: string().trim().min(1).max(400),
	voiceId: string().min(1).max(40)
});
var SoundInput = object({ prompt: string().trim().min(3).max(280) });
var composeArrangement = createServerFn({ method: "POST" }).validator((input) => ComposeInput.parse(input)).handler(createSsrRpc("26658dea3270ad6b78d3d7a0726973d052649b037f5f1656119b3aed05da28a7"));
var designSound = createServerFn({ method: "POST" }).validator((input) => SoundInput.parse(input)).handler(createSsrRpc("0b5d5853e97e8b9d9832c3e5eac0f18b8df888874146592929f275f043643df4"));
var renderVoice = createServerFn({ method: "POST" }).validator((input) => VoiceInput.parse(input)).handler(createSsrRpc("4604405b9eed242a279b20ba40eff46f762611f117c40118450535fabc23f9e0"));
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[opacity,transform,background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90",
			secondary: "bg-secondary text-foreground hover:bg-elevated",
			outline: "border border-border bg-transparent text-foreground hover:bg-elevated",
			ghost: "text-muted-foreground hover:bg-elevated hover:text-foreground",
			destructive: "bg-destructive text-primary-foreground hover:opacity-90"
		},
		size: {
			default: "h-10 px-3.5 text-sm",
			sm: "h-8 px-2.5 text-xs",
			lg: "h-11 px-4 text-sm",
			icon: "size-10",
			"icon-sm": "size-8"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
	ref,
	className: cn("flex min-h-24 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", "disabled:cursor-not-allowed disabled:opacity-40", className),
	...props
}));
Textarea.displayName = "Textarea";
function n(pitch, start, duration, velocity = .75) {
	return {
		id: uid("n"),
		pitch,
		start,
		duration,
		velocity
	};
}
function d(sample, start, velocity = .85) {
	return {
		id: uid("hit"),
		sample,
		start,
		velocity
	};
}
function track(name, kind, instrumentId, extra = {}) {
	return {
		id: uid("tr"),
		name,
		kind,
		instrumentId,
		mute: false,
		solo: false,
		volume: kind === "drums" ? .86 : kind === "bass" ? .78 : kind === "pad" ? .6 : .68,
		pan: 0,
		notes: [],
		drums: [],
		voices: [],
		fx: defaultFxFor(kind),
		...extra
	};
}
function detectStyle(prompt) {
	const p = prompt.toLowerCase();
	if (/(house|club|disco|dance)/.test(p)) return "house";
	if (/(trap|808|hip.?hop|drill)/.test(p)) return "trap";
	if (/(ambient|drone|pad|space|still)/.test(p)) return "ambient";
	if (/(techno|rave|warehouse|pulse)/.test(p)) return "techno";
	if (/(cinematic|trailer|epic|choir|ember)/.test(p)) return "cinematic";
	return "song";
}
function detectScale(prompt, style) {
	const p = prompt.toLowerCase();
	if (/dorian/.test(p)) return "dorian";
	if (/phrygian/.test(p)) return "phrygian";
	if (/mixolydian/.test(p)) return "mixolydian";
	if (/harmonic/.test(p)) return "harmonic-minor";
	if (/major|ionian|happy|bright/.test(p)) return "major";
	if (style === "ambient") return "dorian";
	if (style === "cinematic") return "harmonic-minor";
	return "minor";
}
function detectKey(prompt) {
	const m = prompt.match(/\b([A-G](?:#|b)?)\s*(?:minor|major|min|maj)?\b/i);
	if (!m) return "D";
	const raw = m[1];
	return raw.length === 1 ? raw.toUpperCase() : `${raw[0].toUpperCase()}${raw.slice(1)}`;
}
function detectBpm(prompt, style) {
	const m = prompt.match(/(\d{2,3})\s*bpm/i);
	if (m) return Math.min(180, Math.max(60, Number(m[1])));
	if (style === "house") return 122;
	if (style === "trap") return 140;
	if (style === "ambient") return 72;
	if (style === "techno") return 132;
	if (style === "cinematic") return 92;
	return 108;
}
function drumsFor(style, end) {
	const hits = [];
	if (style === "ambient") {
		for (let t = 0; t < end; t += 8) hits.push(d("perc", t + 3.5, .28));
		return hits;
	}
	if (style === "trap") {
		for (let t = 0; t < end; t += 4) hits.push(d("kick", t, .95), d("kick", t + 1.5, .68), d("snare", t + 2, .88), d("clap", t + 2, .45));
		for (let t = 0; t < end; t += .25) {
			const i = Math.round(t / .25);
			hits.push(d("hat", t, i % 4 === 0 ? .5 : i % 8 === 7 ? .7 : .2));
		}
		return hits;
	}
	if (style === "house" || style === "techno") {
		for (let t = 0; t < end; t += 1) hits.push(d("kick", t, .94));
		for (let t = 0; t < end; t += .5) hits.push(d("hat", t, Math.round(t / .5) % 2 ? .55 : .24));
		for (let t = 0; t < end; t += 4) hits.push(d(style === "house" ? "clap" : "snare", t + 2, .8));
		return hits;
	}
	for (let t = 0; t < end; t += 1) hits.push(d("kick", t, t % 4 === 0 ? .92 : .76));
	for (let t = 0; t < end; t += 2) if (t % 4 === 2) hits.push(d("snare", t, .84));
	for (let t = 0; t < end; t += .5) hits.push(d("hat", t, Math.round(t / .5) % 2 ? .28 : .42));
	return hits;
}
function bassFor(key, scale, style, end) {
	const notes = [];
	const roots = [
		0,
		0,
		3,
		4,
		0,
		5,
		3,
		4
	];
	for (let bar = 0; bar < end / 4; bar++) {
		const deg = roots[bar % roots.length];
		const pitch = degreeMidi(key, scale, deg, style === "trap" ? 1 : 2);
		if (style === "house" || style === "techno") for (let s = 0; s < 8; s++) notes.push(n(pitch + (s % 4 === 3 ? 12 : 0), bar * 4 + s * .5, .42, s % 2 === 0 ? .84 : .58));
		else if (style === "trap") notes.push(n(pitch, bar * 4, 1.3, .92), n(pitch, bar * 4 + 1.5, .4, .7), n(pitch + 12, bar * 4 + 2.5, .3, .5));
		else if (style === "ambient") notes.push(n(pitch, bar * 4, 3.6, .45));
		else notes.push(n(pitch, bar * 4, .9, .82), n(pitch + 12, bar * 4 + 2, .7, .62), n(pitch, bar * 4 + 3, .7, .7));
	}
	return notes;
}
function padFor(key, scale, end) {
	const notes = [];
	const chordDeg = [
		0,
		2,
		4,
		6
	];
	for (let t = 0; t < end; t += 8) {
		const shift = t % 16 === 8 ? 3 : 0;
		chordDeg.forEach((d, i) => notes.push(n(degreeMidi(key, scale, d + shift, 3), t, 7.6, .42 - i * .04)));
	}
	return notes;
}
function leadFor(key, scale, style, end) {
	const notes = [];
	const motif = style === "ambient" ? [
		4,
		6,
		7,
		9
	] : [
		4,
		5,
		7,
		4,
		2,
		0,
		2,
		4
	];
	const step = style === "ambient" ? 4 : 1;
	for (let t = 0, i = 0; t < end; t += step, i++) {
		if (style !== "ambient" && i % 5 === 4) continue;
		const deg = motif[i % motif.length];
		notes.push(n(degreeMidi(key, scale, deg, 4), t + (style === "cinematic" ? 1 : .5) * (i % 3 === 0 ? 0 : 0), style === "ambient" ? 3.2 : .65, .62));
	}
	return notes;
}
function generateArrangement(prompt) {
	const style = detectStyle(prompt);
	const scale = detectScale(prompt, style);
	const key = detectKey(prompt) || "D";
	const bpm = detectBpm(prompt, style);
	const bars = 8;
	const end = 32;
	const tracks = [];
	if (style !== "ambient") tracks.push(track("Kit", "drums", "kit", { drums: drumsFor(style, end) }));
	tracks.push(track(style === "trap" ? "808" : "Bass", "bass", style === "trap" ? "sub-bass" : "analog-bass", { notes: bassFor(key, scale, style, end) }));
	tracks.push(track("Pad", "pad", style === "ambient" ? "air-pad" : "warm-pad", {
		notes: padFor(key, scale, end),
		volume: .52
	}));
	tracks.push(track(style === "techno" ? "Stabs" : "Lead", "lead", style === "techno" ? "brass" : "glass-lead", {
		notes: leadFor(key, scale, style, end),
		pan: .12
	}));
	if (style === "cinematic" || style === "ambient") tracks.push(track("Choir", "voice", "choir", {
		notes: padFor(key, scale, end).map((x) => ({
			...x,
			id: uid("n"),
			pitch: x.pitch + 12,
			velocity: .32
		})),
		volume: .42
	}));
	return {
		id: uid("proj"),
		name: prompt.trim().slice(0, 42) || "Composed Session",
		bpm,
		key,
		scale,
		bars,
		swing: style === "trap" ? .12 : style === "house" ? 0 : .04,
		masterVolume: .85,
		tracks,
		updatedAt: Date.now(),
		loop: true,
		metronome: false,
		timeNumerator: 4,
		timeDenominator: 4
	};
}
var KINDS$1 = [
	"drums",
	"bass",
	"pad",
	"lead",
	"keys",
	"voice",
	"fx"
];
var SCALES = [
	"major",
	"minor",
	"dorian",
	"phrygian",
	"mixolydian",
	"harmonic-minor"
];
var DRUMS = [
	"kick",
	"snare",
	"clap",
	"hat",
	"openhat",
	"tom",
	"ride",
	"perc",
	"rim"
];
var INST = new Set(SYNTH_PRESETS.map((p) => p.id));
function num(v, fallback, min, max) {
	const n = typeof v === "number" ? v : Number(v);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}
function str(v, fallback) {
	return typeof v === "string" && v.trim() ? v.trim() : fallback;
}
function arrangementToProject(raw) {
	if (!raw || typeof raw !== "object") return null;
	const o = raw;
	const tracksIn = Array.isArray(o.tracks) ? o.tracks : [];
	if (!tracksIn.length) return null;
	const scale = SCALES.includes(o.scale) ? o.scale : "minor";
	const tracks = [];
	for (const item of tracksIn.slice(0, 8)) {
		if (!item || typeof item !== "object") continue;
		const t = item;
		const kind = KINDS$1.includes(t.kind) ? t.kind : "lead";
		let instrumentId = str(t.instrumentId, kind === "drums" ? "kit" : "warm-pad");
		if (kind !== "drums" && !INST.has(instrumentId)) instrumentId = kind === "bass" ? "analog-bass" : kind === "pad" ? "warm-pad" : "glass-lead";
		const drums = Array.isArray(t.drums) ? t.drums.map((h, i) => {
			if (!h || typeof h !== "object") return null;
			const hh = h;
			const sample = DRUMS.includes(hh.sample) ? hh.sample : null;
			if (!sample) return null;
			return {
				id: uid("hit"),
				sample,
				start: num(hh.start, i * .25, 0, 63.75),
				velocity: num(hh.velocity, .8, .05, 1)
			};
		}).filter((x) => Boolean(x)) : [];
		const notes = Array.isArray(t.notes) ? t.notes.map((n, i) => {
			if (!n || typeof n !== "object") return null;
			const nn = n;
			return {
				id: uid("n"),
				pitch: Math.round(num(nn.pitch, 60, 24, 96)),
				start: num(nn.start, i * .5, 0, 63),
				duration: num(nn.duration, .5, .1, 16),
				velocity: num(nn.velocity, .7, .05, 1)
			};
		}).filter((x) => Boolean(x)) : [];
		tracks.push({
			id: uid("tr"),
			name: str(t.name, kind),
			kind,
			instrumentId,
			mute: false,
			solo: false,
			volume: num(t.volume, .72, 0, 1),
			pan: num(t.pan, 0, -1, 1),
			notes,
			drums,
			voices: [],
			fx: defaultFxFor(kind)
		});
	}
	if (!tracks.length) return null;
	return {
		id: uid("proj"),
		name: str(o.title, "Composed Session"),
		bpm: Math.round(num(o.bpm, 100, 60, 180)),
		key: str(o.key, "A").slice(0, 2),
		scale,
		bars: 8,
		swing: 0,
		masterVolume: .85,
		updatedAt: Date.now(),
		loop: true,
		metronome: false,
		timeNumerator: 4,
		timeDenominator: 4,
		tracks
	};
}
function localCompose(prompt) {
	return generateArrangement(prompt);
}
var OSC = [
	"sine",
	"square",
	"sawtooth",
	"triangle",
	"noise"
];
function localDesignSound(prompt) {
	const p = prompt.toLowerCase();
	let base = SYNTH_PRESETS.find((x) => x.id === "warm-pad");
	if (/(bass|sub|808)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "analog-bass");
	else if (/(pluck|guitar|harp)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "pluck");
	else if (/(bell|chime|crystal)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "fm-bell");
	else if (/(choir|vox|voice|ah)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "choir");
	else if (/(lead|solo|scream)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "dark-lead");
	else if (/(brass|horn|stab)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "brass");
	else if (/(noise|riser|whoosh|fx)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "noise-riser");
	else if (/(key|piano|ep)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "keys");
	else if (/(air|pad|warm|soft)/.test(p)) base = SYNTH_PRESETS.find((x) => x.id === "air-pad");
	const patch = JSON.parse(JSON.stringify(base));
	patch.id = uid("patch");
	patch.name = prompt.slice(0, 28) || base.name;
	if (/bright|sharp|harsh/.test(p)) patch.filter.cutoff = Math.min(12e3, patch.filter.cutoff * 1.8);
	if (/dark|warm|muffled|dull/.test(p)) patch.filter.cutoff = Math.max(120, patch.filter.cutoff * .55);
	if (/long|pad|wash/.test(p)) {
		patch.env.a = Math.max(patch.env.a, .4);
		patch.env.r = Math.max(patch.env.r, 1.1);
	}
	if (/pluck|short|tight/.test(p)) {
		patch.env.a = .004;
		patch.env.s = .08;
		patch.env.d = .22;
	}
	if (/distort|drive|grit/.test(p)) patch.drive = Math.min(.55, patch.drive + .25);
	if (/detune|wide|chorus/.test(p)) {
		patch.osc1.detune = -12;
		patch.osc2.detune = 14;
	}
	return patch;
}
function coercePatch(raw) {
	if (!raw || typeof raw !== "object") return null;
	const o = raw;
	const osc = (v, fallback) => {
		if (!v || typeof v !== "object") return fallback;
		const x = v;
		const type = OSC.includes(x.type) ? x.type : fallback.type;
		const octaveRaw = num(x.octave, fallback.octave, -2, 2);
		const octave = [
			-2,
			-1,
			0,
			1,
			2
		].includes(octaveRaw) ? octaveRaw : 0;
		return {
			type,
			detune: num(x.detune, fallback.detune, -24, 24),
			mix: num(x.mix, fallback.mix, 0, 1),
			octave
		};
	};
	const env = (v, fb) => {
		if (!v || typeof v !== "object") return fb;
		const x = v;
		return {
			a: num(x.a, fb.a, 0, 3),
			d: num(x.d, fb.d, 0, 3),
			s: num(x.s, fb.s, 0, 1),
			r: num(x.r, fb.r, 0, 4)
		};
	};
	const base = SYNTH_PRESETS[0];
	const filter = o.filter ?? {};
	const lfo = o.lfo ?? {};
	return {
		id: uid("patch"),
		name: str(o.name, "Designed Patch"),
		category: [
			"bass",
			"pad",
			"lead",
			"keys",
			"pluck",
			"vox",
			"fx",
			"bell"
		].includes(o.category) ? o.category : "lead",
		osc1: osc(o.osc1, base.osc1),
		osc2: osc(o.osc2, base.osc2),
		filter: {
			type: [
				"lowpass",
				"highpass",
				"bandpass",
				"notch"
			].includes(filter.type) ? filter.type : "lowpass",
			cutoff: num(filter.cutoff, 1200, 80, 16e3),
			res: num(filter.res, 1, 1e-4, 16),
			envAmt: num(filter.envAmt, .3, 0, 1)
		},
		env: env(o.env, base.env),
		filterEnv: env(o.filterEnv, base.filterEnv),
		lfo: {
			rate: num(lfo.rate, .4, .05, 16),
			amt: num(lfo.amt, 0, 0, 1),
			dest: [
				"pitch",
				"filter",
				"amp"
			].includes(lfo.dest) ? lfo.dest : "filter"
		},
		gain: num(o.gain, .35, .05, .9),
		drive: num(o.drive, 0, 0, .7)
	};
}
var PROMPTS = [
	"Dark cinematic trailer in D minor, 92 BPM, choir and glass lead",
	"Late-night deep house, warm bass, offbeat hats, 122 BPM",
	"Sparse ambient dorian field with distant bells",
	"Warehouse techno, filtered bass, brass stabs, 132 BPM"
];
function Composer() {
	const importProject = useForge((s) => s.importProject);
	const composeBusy = useForge((s) => s.composeBusy);
	const setComposeBusy = useForge((s) => s.setComposeBusy);
	const loadTemplate = useForge((s) => s.loadTemplate);
	const [prompt, setPrompt] = (0, import_react.useState)(PROMPTS[0]);
	async function compose() {
		setComposeBusy(true);
		try {
			const result = await composeArrangement({ data: { prompt } });
			if (result.ok) {
				const project = arrangementToProject(JSON.parse(result.json));
				if (project) {
					importProject(project);
					toast.success(`Composed “${project.name}”`);
					return;
				}
			}
			const fallback = localCompose(prompt);
			importProject(fallback);
			toast.message(result.ok ? "Notation incomplete — used a studio template." : `${result.error} — loaded a matching template.`);
		} catch (err) {
			const fallback = localCompose(prompt);
			importProject(fallback);
			toast.message(err instanceof Error ? err.message : "Template loaded");
		} finally {
			setComposeBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-5 overflow-y-auto p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl italic",
				children: "Compose"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Describe the instrumental. Forge writes a session — drums, bass, pads, leads — you can play, edit, and export."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				value: prompt,
				onChange: (e) => setPrompt(e.target.value),
				className: "min-h-32",
				maxLength: 500
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1.5",
				children: PROMPTS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setPrompt(p),
					className: "rounded-full border border-border px-3 py-1 text-left text-xs text-muted-foreground hover:bg-elevated hover:text-foreground",
					children: p
				}, p))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => void compose(),
				disabled: composeBusy || prompt.trim().length < 3,
				className: "self-start",
				children: composeBusy ? "Composing…" : "Compose session"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground",
				children: "Or start from a template"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-2 sm:grid-cols-2",
				children: TEMPLATES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						loadTemplate(t.id);
						toast.success(`Loaded ${t.name}`);
					},
					className: "rounded-xl border border-border bg-card p-3 text-left hover:bg-elevated",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-medium",
						children: t.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-xs text-muted-foreground",
						children: t.blurb
					})]
				}, t.id))
			})] })
		]
	});
}
var Input = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
	ref,
	className: cn("flex h-10 w-full rounded-md border border-border bg-elevated px-3 text-sm text-foreground placeholder:text-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", "disabled:cursor-not-allowed disabled:opacity-40", className),
	...props
}));
Input.displayName = "Input";
var Slider = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
	ref,
	className: cn("relative flex touch-none select-none items-center data-[orientation=horizontal]:h-5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-5 data-[orientation=vertical]:flex-col", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
		className: "relative grow overflow-hidden rounded-full bg-elevated data-[orientation=horizontal]:h-1 data-[orientation=vertical]:w-1",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-3.5 rounded-full border border-border bg-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" })]
}));
Slider.displayName = "Slider";
function ParamSlider({ label, value, min, max, step = .01, onChange, format, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("grid gap-1.5", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-[11px] tabular-nums text-foreground",
				children: format ? format(value) : value.toFixed(2)
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
			min,
			max,
			step,
			value: [value],
			onValueChange: (v) => onChange(v[0] ?? value)
		})]
	});
}
var WHITE = [
	0,
	2,
	4,
	5,
	7,
	9,
	11
];
var BLACK = [
	1,
	3,
	6,
	8,
	10
];
function PianoKeys({ from = 48, to = 72, onPlay }) {
	const whites = (0, import_react.useMemo)(() => {
		const list = [];
		for (let m = from; m <= to; m++) if (WHITE.includes(m % 12)) list.push(m);
		return list;
	}, [from, to]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative isolate h-20 w-full overflow-hidden rounded-lg border border-border bg-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex h-full",
			children: whites.map((midi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onMouseDown: () => onPlay(midi),
				className: "relative h-full flex-1 border-r border-background/20 last:border-r-0 hover:bg-background/10 active:bg-primary/25",
				"aria-label": midiName(midi),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[9px] text-background/55",
					children: midiName(midi)
				})
			}, midi))
		}), whites.map((midi, i) => {
			const black = midi + 1;
			if (!BLACK.includes(black % 12) || black > to) return null;
			const left = (i + 1) / whites.length * 100;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": midiName(black),
				onMouseDown: (e) => {
					e.preventDefault();
					onPlay(black);
				},
				className: "absolute top-0 z-10 h-[58%] w-[5.5%] -translate-x-1/2 rounded-b-[3px] bg-background hover:bg-elevated active:bg-primary",
				style: { left: `${left}%` }
			}, black);
		})]
	});
}
function Inspector() {
	const project = useForge((s) => s.project);
	const selectedTrackId = useForge((s) => s.selectedTrackId);
	const updateTrack = useForge((s) => s.updateTrack);
	const removeTrack = useForge((s) => s.removeTrack);
	const addNote = useForge((s) => s.addNote);
	const setFx = useForge((s) => s.setFx);
	const track = project.tracks.find((t) => t.id === selectedTrackId);
	if (!track) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full items-center justify-center p-6 text-sm text-muted-foreground",
		children: "Select a track to edit."
	});
	const pitches = scalePitches(project.key, project.scale, 48, 72);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: track.name,
						onChange: (e) => updateTrack(track.id, { name: e.target.value }),
						className: "h-8 border-transparent bg-transparent px-0 text-base font-medium"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[10px] uppercase tracking-wider text-subtle",
						children: track.kind
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => removeTrack(track.id),
					children: "Remove"
				})]
			}),
			track.kind === "drums" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Step-program this kit in the grid under the score. Click a row label to preview the sample."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.14em] text-muted-foreground",
						children: "Click the piano to drop a note at the start of the loop. Click a block in the score to delete it."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PianoKeys, { onPlay: (midi) => {
						addNote(track.id, {
							pitch: midi,
							start: 0,
							duration: 1,
							velocity: .8
						});
						getEngine().previewNote(patchById(track.instrumentId), midi);
					} }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: pitches.slice(0, 14).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								addNote(track.id, {
									pitch: p,
									start: 0,
									duration: .5,
									velocity: .75
								});
								getEngine().previewNote(patchById(track.instrumentId), p, .8, .3);
							},
							className: "rounded-md border border-border px-1.5 py-1 font-mono text-[10px] hover:bg-elevated",
							children: midiName(p)
						}, p))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 rounded-xl border border-border bg-card p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
						children: "Effects"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
						label: "Filter",
						min: 80,
						max: 16e3,
						step: 10,
						value: track.fx.filterCutoff,
						onChange: (v) => setFx(track.id, { filterCutoff: v }),
						format: (v) => `${Math.round(v)} Hz`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
						label: "Resonance",
						min: .1,
						max: 12,
						value: track.fx.filterRes,
						onChange: (v) => setFx(track.id, { filterRes: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
						label: "Drive",
						min: 0,
						max: .8,
						value: track.fx.drive,
						onChange: (v) => setFx(track.id, { drive: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
						label: "Delay",
						min: 0,
						max: .8,
						value: track.fx.delay,
						onChange: (v) => setFx(track.id, { delay: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
						label: "Reverb",
						min: 0,
						max: .9,
						value: track.fx.reverb,
						onChange: (v) => setFx(track.id, { reverb: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
						label: "Chorus",
						min: 0,
						max: 1,
						value: track.fx.chorus,
						onChange: (v) => setFx(track.id, { chorus: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1",
						children: [
							"room",
							"hall",
							"plate",
							"spring"
						].map((kind) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFx(track.id, { reverbType: kind }),
							className: cn("flex-1 rounded-md border px-1 py-1 font-mono text-[10px] uppercase", track.fx.reverbType === kind ? "border-primary bg-elevated text-foreground" : "border-border text-muted-foreground"),
							children: kind
						}, kind))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						className: "w-full",
						onClick: () => useForge.getState().quantizeTrack(track.id),
						children: "Quantize to 16ths"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						className: "w-full",
						onClick: () => useForge.getState().duplicateTrack(track.id),
						children: "Duplicate track"
					})
				]
			})
		]
	});
}
var KINDS = [
	{
		id: "drums",
		label: "Kit"
	},
	{
		id: "bass",
		label: "Bass"
	},
	{
		id: "pad",
		label: "Pad"
	},
	{
		id: "lead",
		label: "Lead"
	},
	{
		id: "keys",
		label: "Keys"
	},
	{
		id: "voice",
		label: "Voice"
	},
	{
		id: "fx",
		label: "FX"
	}
];
function Library({ onJump }) {
	const loadPatch = useForge((s) => s.loadPatch);
	const loadTemplate = useForge((s) => s.loadTemplate);
	const addTrack = useForge((s) => s.addTrack);
	const userPatches = useForge((s) => s.userPatches);
	const view = useForge((s) => s.view);
	const setView = useForge((s) => s.setView);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground",
				children: "Create"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-1.5",
				children: [
					[
						"sound",
						"Sound",
						AudioWaveform
					],
					[
						"voice",
						"Voice",
						MicVocal
					],
					[
						"arrange",
						"Score",
						AudioLines
					],
					[
						"compose",
						"Compose",
						WandSparkles
					]
				].map(([id, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						setView(id);
						onJump(id);
					},
					className: cn("flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-left text-xs", "hover:bg-elevated", view === id && "border-primary/50 bg-elevated"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5 text-primary" }), label]
				}, id))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground",
				children: "Sessions"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-1",
				children: TEMPLATES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => loadTemplate(t.id),
					className: "rounded-md px-2 py-1.5 text-left hover:bg-elevated",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm text-foreground",
						children: t.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] leading-snug text-muted-foreground",
						children: t.blurb
					})]
				}, t.id))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground",
				children: "Instruments"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-0.5",
				children: [SYNTH_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						loadPatch(p.id);
						setView("sound");
					},
					className: "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-elevated",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-[10px] uppercase text-subtle",
						children: p.category
					})]
				}, p.id)), userPatches.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						loadPatch(p.id);
						setView("sound");
					},
					className: "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-elevated",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-[10px] uppercase text-primary",
						children: "User"
					})]
				}, p.id))]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground",
				children: "Add track"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1",
				children: KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => addTrack(k.id),
					children: [k.id === "drums" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drum, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-3.5" }), k.label]
				}, k.id))
			})] })
		]
	});
}
function MixerView() {
	const project = useForge((s) => s.project);
	const updateTrack = useForge((s) => s.updateTrack);
	const selectTrack = useForge((s) => s.selectTrack);
	const selectedTrackId = useForge((s) => s.selectedTrackId);
	const setMaster = useForge((s) => s.setMaster);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 gap-2 overflow-x-auto p-3",
		children: [project.tracks.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			onClick: () => selectTrack(t.id),
			className: cn("flex w-[92px] shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-card p-2", selectedTrackId === t.id && "border-primary/40"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-7 w-full gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: cn("flex-1 rounded-md text-[10px] font-medium", t.mute ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground"),
						onClick: (e) => {
							e.stopPropagation();
							updateTrack(t.id, { mute: !t.mute });
						},
						children: "M"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: cn("flex-1 rounded-md text-[10px] font-medium", t.solo ? "bg-foreground text-background" : "bg-elevated text-muted-foreground"),
						onClick: (e) => {
							e.stopPropagation();
							updateTrack(t.id, { solo: !t.solo });
						},
						children: "S"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-28 w-full justify-center gap-2 py-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						orientation: "vertical",
						min: 0,
						max: 1,
						step: .01,
						value: [t.volume],
						onValueChange: (v) => updateTrack(t.id, { volume: v[0] ?? t.volume }),
						className: "h-full"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						trackId: t.id,
						className: "h-full w-2"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: -1,
					max: 1,
					step: .01,
					value: [t.pan],
					onValueChange: (v) => updateTrack(t.id, { pan: v[0] ?? 0 })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-full truncate text-center text-[11px] text-muted-foreground",
					children: t.name
				})
			]
		}, t.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex w-[92px] shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-secondary p-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-7 text-[10px] uppercase tracking-wider text-muted-foreground",
					children: "Master"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-28 justify-center gap-2 py-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						orientation: "vertical",
						min: 0,
						max: 1,
						step: .01,
						value: [project.masterVolume],
						onValueChange: (v) => setMaster(v[0] ?? .85),
						className: "h-full"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, { className: "h-full w-2" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-[11px] tabular-nums",
					children: Math.round(project.masterVolume * 100)
				})
			]
		})]
	});
}
function Modal({ open, title, children, onClose, footer, wide }) {
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "absolute inset-0 bg-background/70",
			"aria-label": "Close",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "forge-modal-title",
			className: cn("relative w-full rounded-xl border border-border bg-card p-5 shadow-lg", wide ? "max-w-2xl" : "max-w-md"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					id: "forge-modal-title",
					className: "font-display text-2xl italic",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 text-sm text-muted-foreground",
					children
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 flex justify-end gap-2",
					children: footer ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: onClose,
						children: "Close"
					})
				})
			]
		})]
	});
}
function Onboard() {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		open,
		title: "Ember Protocol is loaded",
		onClose: () => setShowOnboard(false),
		footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "secondary",
			onClick: () => setShowOnboard(false),
			children: "Look around"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			onClick: () => void playNow(),
			children: "Play session"
		})] }),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Hathor Forge is a studio, not a player. Spacebar starts and stops playback. Ember Protocol is the default session — drums, bass, pad, glass, bells, choir — ready to edit." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
			className: "mt-3 space-y-1 text-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Sound — design a patch, play it on the piano, assign it to a track." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Voice — write a line, render a take onto the timeline." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Compose — describe an instrumental; edit every note after." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Export — bounce a sample-accurate stereo WAV on this device." })
			]
		})]
	});
}
function HelpOverlay() {
	const open = useForge((s) => s.showHelp);
	const setShowHelp = useForge((s) => s.setShowHelp);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		open,
		title: "Shortcuts",
		onClose: () => setShowHelp(false),
		wide: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-2 font-mono text-xs text-foreground sm:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: "Space",
					d: "Play / stop"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: "Shift+Space",
					d: "Stop and return to start"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: "1–5",
					d: "Score, Mix, Sound, Voice, Compose"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: "L",
					d: "Toggle loop"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: "C",
					d: "Metronome click"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: "⌘Z / Ctrl+Z",
					d: "Undo"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: "⌘⇧Z",
					d: "Redo"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: "?",
					d: "This overlay"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: "Esc",
					d: "Close dialogs"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: "A–K",
					d: "Piano (Sound view)"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3",
			children: "Space always transports unless a text field is focused and needs the key to type. Sessions autosave on this device."
		})]
	});
}
function Row({ k, d }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3 rounded-md bg-elevated px-2 py-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-primary",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: d
		})]
	});
}
function TemplateConfirm() {
	const pending = useForge((s) => s.pendingTemplate);
	const confirm = useForge((s) => s.confirmTemplate);
	const cancel = useForge((s) => s.cancelTemplate);
	const tpl = TEMPLATES.find((t) => t.id === pending);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		open: Boolean(pending),
		title: `Load ${tpl?.name ?? "template"}?`,
		onClose: cancel,
		footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "secondary",
			onClick: cancel,
			children: "Keep current"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			onClick: confirm,
			children: "Load template"
		})] }),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This replaces the session on the timeline. Undo will bring the previous session back." }), tpl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-foreground",
			children: tpl.blurb
		}) : null]
	});
}
function ExportDialog() {
	const open = useForge((s) => s.showExport);
	const setOpen = useForge((s) => s.setShowExport);
	const project = useForge((s) => s.project);
	const settings = useForge((s) => s.exportSettings);
	const setSettings = useForge((s) => s.setExportSettings);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [report, setReport] = (0, import_react.useState)(null);
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
				setReport(`${r.durationSec.toFixed(2)}s · peak ${peakDb} dBFS · ${r.clippedSamples} clipped samples · ${r.sampleRate} Hz / ${r.bitDepth}-bit`);
				toast.success(r.clippedSamples ? "WAV exported — clipping reported" : "WAV exported");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Export failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		open,
		title: "Export WAV",
		onClose: () => setOpen(false),
		footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "secondary",
			onClick: () => setOpen(false),
			children: "Close"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			onClick: () => void bounce(),
			disabled: busy,
			children: busy ? "Rendering…" : "Bounce"
		})] }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "grid gap-1 text-xs",
					children: ["Sample rate", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-9 rounded-md border border-border bg-elevated px-2",
						value: settings.sampleRate,
						onChange: (e) => setSettings({ sampleRate: Number(e.target.value) }),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 44100,
								children: "44.1 kHz"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 48e3,
								children: "48 kHz"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 96e3,
								children: "96 kHz"
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "grid gap-1 text-xs",
					children: ["Bit depth", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-9 rounded-md border border-border bg-elevated px-2",
						value: settings.bitDepth,
						onChange: (e) => setSettings({ bitDepth: Number(e.target.value) }),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 16,
								children: "16-bit PCM (dithered)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 24,
								children: "24-bit PCM"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 32,
								children: "32-bit float"
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 flex items-center gap-2 text-sm text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: settings.includeTail,
					onChange: (e) => setSettings({ includeTail: e.target.checked })
				}), "Include reverb / delay tail"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-2 flex items-center gap-2 text-sm text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: settings.normalize,
					onChange: (e) => setSettings({ normalize: e.target.checked })
				}), "Normalize to −1 dBTP"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-2 flex items-center gap-2 text-sm text-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: settings.stems,
					onChange: (e) => setSettings({ stems: e.target.checked })
				}), "Export stems (one file per track)"]
			}),
			report ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 font-mono text-xs text-foreground",
				children: report
			}) : null
		]
	});
}
function SessionDialog() {
	const open = useForge((s) => s.showSessions);
	const setOpen = useForge((s) => s.setShowSessions);
	const importProject = useForge((s) => s.importProject);
	const [rows, setRows] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		listSessions().then(setRows);
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		open,
		title: "Sessions on this device",
		onClose: () => setOpen(false),
		wide: true,
		children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No saved sessions yet. Autosave writes Ember Protocol and every edit here." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "max-h-72 space-y-1 overflow-y-auto",
			children: rows.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-elevated",
				onClick: async () => {
					const p = await loadSessionById(s.id);
					if (p) {
						importProject(p);
						setOpen(false);
						toast.success(`Loaded ${p.name}`);
					}
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-foreground",
					children: s.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-[10px] text-subtle",
					children: [
						s.bpm,
						" BPM · ",
						s.tracks,
						" tracks"
					]
				})]
			}) }, s.id))
		})
	});
}
function slug(name) {
	return name.replace(/\s+/g, "-").toLowerCase() || "session";
}
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
var OSC_TYPES = [
	"sine",
	"square",
	"sawtooth",
	"triangle",
	"noise"
];
function SoundLab() {
	const patch = useForge((s) => s.workingPatch);
	const setWorkingPatch = useForge((s) => s.setWorkingPatch);
	const saveUserPatch = useForge((s) => s.saveUserPatch);
	const applyPatchToTrack = useForge((s) => s.applyPatchToTrack);
	const loadPatch = useForge((s) => s.loadPatch);
	const [prompt, setPrompt] = (0, import_react.useState)("warm analog pad, slow attack, slight detune");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [saveName, setSaveName] = (0, import_react.useState)("");
	async function design() {
		setBusy(true);
		try {
			const result = await designSound({ data: { prompt } });
			if (result.ok) {
				const next = coercePatch(JSON.parse(result.json));
				if (next) {
					registerPatch(next);
					setWorkingPatch(next);
					toast.success(`Designed ${next.name}`);
					return;
				}
			}
			const fallback = localDesignSound(prompt);
			registerPatch(fallback);
			setWorkingPatch(fallback);
			toast.message(result.ok ? "Interpreted locally" : result.error + " — local design used");
		} catch (err) {
			const fallback = localDesignSound(prompt);
			registerPatch(fallback);
			setWorkingPatch(fallback);
			toast.message(err instanceof Error ? err.message : "Local design used");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid h-full min-h-0 gap-4 overflow-y-auto p-4 lg:grid-cols-[1fr_280px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl italic",
					children: "Sound"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-prose text-sm text-muted-foreground",
					children: "Two oscillators, a filter, envelopes, and an LFO. Design any timbre, then drop it on the selected track."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: prompt,
						onChange: (e) => setPrompt(e.target.value),
						className: "min-h-16 flex-1",
						placeholder: "Describe a sound"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => void design(),
						disabled: busy,
						className: "sm:self-stretch",
						children: busy ? "Designing…" : "Design"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2",
					children: [
						["osc1", "osc2"].map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] uppercase tracking-[0.14em] text-muted-foreground",
									children: key === "osc1" ? "Oscillator 1" : "Oscillator 2"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-1",
									children: OSC_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setWorkingPatch({ [key]: {
											...patch[key],
											type: t
										} }),
										className: `rounded-md border px-2 py-1 font-mono text-[11px] ${patch[key].type === t ? "border-primary bg-elevated text-foreground" : "border-border text-muted-foreground"}`,
										children: t
									}, t))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
									label: "Mix",
									min: 0,
									max: 1,
									value: patch[key].mix,
									onChange: (v) => setWorkingPatch({ [key]: {
										...patch[key],
										mix: v
									} })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
									label: "Detune",
									min: -24,
									max: 24,
									step: 1,
									value: patch[key].detune,
									onChange: (v) => setWorkingPatch({ [key]: {
										...patch[key],
										detune: v
									} }),
									format: (v) => `${v >= 0 ? "+" : ""}${Math.round(v)}`
								})
							]
						}, key)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
							label: "Cutoff",
							min: 80,
							max: 12e3,
							step: 10,
							value: patch.filter.cutoff,
							onChange: (v) => setWorkingPatch({ filter: {
								...patch.filter,
								cutoff: v
							} }),
							format: (v) => `${Math.round(v)} Hz`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
							label: "Resonance",
							min: .1,
							max: 14,
							value: patch.filter.res,
							onChange: (v) => setWorkingPatch({ filter: {
								...patch.filter,
								res: v
							} })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
							label: "Filter env",
							min: 0,
							max: 1,
							value: patch.filter.envAmt,
							onChange: (v) => setWorkingPatch({ filter: {
								...patch.filter,
								envAmt: v
							} })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
							label: "Drive",
							min: 0,
							max: .7,
							value: patch.drive,
							onChange: (v) => setWorkingPatch({ drive: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
							label: "Attack",
							min: .001,
							max: 2,
							value: patch.env.a,
							onChange: (v) => setWorkingPatch({ env: {
								...patch.env,
								a: v
							} })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
							label: "Decay",
							min: .01,
							max: 2,
							value: patch.env.d,
							onChange: (v) => setWorkingPatch({ env: {
								...patch.env,
								d: v
							} })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
							label: "Sustain",
							min: 0,
							max: 1,
							value: patch.env.s,
							onChange: (v) => setWorkingPatch({ env: {
								...patch.env,
								s: v
							} })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
							label: "Release",
							min: .02,
							max: 3,
							value: patch.env.r,
							onChange: (v) => setWorkingPatch({ env: {
								...patch.env,
								r: v
							} })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
							label: "LFO rate",
							min: .05,
							max: 12,
							value: patch.lfo.rate,
							onChange: (v) => setWorkingPatch({ lfo: {
								...patch.lfo,
								rate: v
							} }),
							format: (v) => `${v.toFixed(2)} Hz`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ParamSlider, {
							label: "LFO amount",
							min: 0,
							max: 1,
							value: patch.lfo.amt,
							onChange: (v) => setWorkingPatch({ lfo: {
								...patch.lfo,
								amt: v
							} })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PianoKeys, { onPlay: (m) => getEngine().previewNote(patch, m, .85, .6) })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-border bg-card p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.14em] text-muted-foreground",
					children: "Library"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex max-h-56 flex-col gap-0.5 overflow-y-auto",
					children: SYNTH_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => loadPatch(p.id),
						className: "rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated",
						children: p.name
					}, p.id))
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 rounded-xl border border-border bg-card p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Preset name",
						value: saveName,
						onChange: (e) => setSaveName(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "w-full",
						onClick: () => {
							saveUserPatch(saveName || patch.name);
							setSaveName("");
							toast.success("Preset saved on this device");
						},
						children: "Save preset"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						onClick: applyPatchToTrack,
						children: "Assign to track"
					})
				]
			})]
		})]
	});
}
function TopBar() {
	const fileRef = (0, import_react.useRef)(null);
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
		const blob = new Blob([JSON.stringify({
			kind: "hathor-forge-session",
			version: 1,
			project
		}, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}.forge.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Session bundle saved");
	}
	function onImportFile(file) {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const projectIn = importBundle(JSON.parse(String(reader.result)));
				if (!projectIn) throw new Error("Not a Forge session");
				importProject(projectIn);
				toast.success("Session loaded");
			} catch {
				toast.error("Could not read that session file");
			}
		};
		reader.readAsText(file);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 md:px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-baseline gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-[22px] italic leading-none text-foreground",
					children: "Hathor"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-[10px] tracking-[0.32em] text-primary",
					children: "FORGE"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hidden h-6 w-px bg-border sm:block" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: project.name,
				onChange: (e) => renameProject(e.target.value),
				className: "hidden h-8 max-w-[220px] border-transparent bg-transparent px-2 text-sm font-medium hover:bg-elevated sm:flex",
				"aria-label": "Session name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ml-auto flex items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: undo,
						disabled: !history.length,
						"aria-label": "Undo",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: redo,
						disabled: !future.length,
						"aria-label": "Redo",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo2, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "hidden h-8 max-w-[160px] rounded-md border border-border bg-elevated px-2 text-xs text-foreground md:block",
						value: "",
						onChange: (e) => {
							if (e.target.value) loadTemplate(e.target.value);
							e.target.value = "";
						},
						"aria-label": "Load template",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Templates"
						}), TEMPLATES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: t.id,
							children: t.name
						}, t.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: newSession,
						"aria-label": "New session",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilePlus2, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: "application/json,.json",
						className: "hidden",
						onChange: (e) => {
							const f = e.target.files?.[0];
							if (f) onImportFile(f);
							e.target.value = "";
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: () => fileRef.current?.click(),
						"aria-label": "Open session",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "sm",
						className: "hidden sm:inline-flex",
						onClick: () => setShowSessions(true),
						children: "Sessions"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "sm",
						className: "hidden sm:inline-flex",
						onClick: exportJson,
						children: "Save"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: () => setShowHelp(true),
						"aria-label": "Shortcuts",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						onClick: () => setShowExport(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Export WAV"
						})]
					})
				]
			})
		]
	});
}
function Transport({ onPlay, onStop }) {
	const project = useForge((s) => s.project);
	const isPlaying = useForge((s) => s.isPlaying);
	const setBpm = useForge((s) => s.setBpm);
	const setMaster = useForge((s) => s.setMaster);
	const setSwing = useForge((s) => s.setSwing);
	const setLoop = useForge((s) => s.setLoop);
	const setMetronome = useForge((s) => s.setMetronome);
	const [clock, setClock] = (0, import_react.useState)("0:00");
	const [barBeat, setBarBeat] = (0, import_react.useState)("1.1");
	const [clip, setClip] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let raf = 0;
		const loop = () => {
			const beat = getEngine().getBeat();
			const sec = beat * beatDuration(project.bpm);
			setClock(formatTime(sec));
			const bar = Math.floor(beat / 4) + 1;
			const b = beat % 4 + 1;
			setBarBeat(`${bar}.${Math.floor(b)}`);
			setClip(getEngine().getPeak() >= .99);
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [project.bpm]);
	const total = formatTime(projectDurationSec(project));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-16 shrink-0 items-center gap-3 border-b border-border px-3 md:px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						onClick: onPlay,
						"aria-label": isPlaying ? "Pause" : "Play",
						className: "size-11 rounded-full",
						children: isPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-5 ml-0.5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "icon-sm",
						onClick: onStop,
						"aria-label": "Stop",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5 fill-current" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: project.loop ? "secondary" : "ghost",
						size: "icon-sm",
						onClick: () => setLoop(!project.loop),
						"aria-label": "Loop",
						"aria-pressed": project.loop,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, { className: "size-3.5" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-16",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-lg tabular-nums leading-none",
					children: clock
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "font-mono text-[10px] text-muted-foreground",
					children: [
						barBeat,
						" / ",
						total,
						" · ",
						project.timeNumerator,
						"/",
						project.timeDenominator
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "hidden items-center gap-2 md:flex",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px] uppercase tracking-[0.14em] text-muted-foreground",
					children: "BPM"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "number",
					min: 48,
					max: 200,
					value: project.bpm,
					onChange: (e) => setBpm(Number(e.target.value)),
					className: "h-8 w-16 rounded-md border border-border bg-elevated px-2 font-mono text-sm tabular-nums"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setMetronome(!project.metronome),
				className: cn("hidden h-8 rounded-md px-2 font-mono text-[10px] uppercase tracking-wider md:inline-flex md:items-center", project.metronome ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-elevated"),
				"aria-pressed": project.metronome,
				children: "Click"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hidden w-28 lg:block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 0,
					max: .4,
					step: .01,
					value: [project.swing],
					onValueChange: (v) => setSwing(v[0] ?? 0)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 text-[10px] uppercase tracking-wider text-muted-foreground",
					children: "Swing"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden h-10 flex-1 overflow-hidden rounded-md border border-border bg-card md:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scope, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("size-2 rounded-full", clip ? "bg-primary" : "bg-elevated"),
						title: clip ? "Clipping" : "Peak under ceiling",
						"aria-label": clip ? "Clipping" : "Not clipping"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-24",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
							min: 0,
							max: 1,
							step: .01,
							value: [project.masterVolume],
							onValueChange: (v) => {
								const val = v[0] ?? .85;
								setMaster(val);
								getEngine().setMaster(val);
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-[10px] uppercase tracking-wider text-muted-foreground",
							children: "Master"
						})]
					})
				]
			})
		]
	});
}
function decodeBase64(b64) {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes.buffer;
}
function VoiceLab() {
	const project = useForge((s) => s.project);
	const addVoiceClip = useForge((s) => s.addVoiceClip);
	const addTrack = useForge((s) => s.addTrack);
	const voiceBusy = useForge((s) => s.voiceBusy);
	const setVoiceBusy = useForge((s) => s.setVoiceBusy);
	const [text, setText] = (0, import_react.useState)("Hathor Forge. Design the voice you need — spoken, sung, or scored.");
	const [voiceId, setVoiceId] = (0, import_react.useState)("orion");
	const [previewUrl, setPreviewUrl] = (0, import_react.useState)(null);
	const [degraded, setDegraded] = (0, import_react.useState)(false);
	async function placeTake(audio, mimeUrl) {
		const clipId = uid("vox");
		getEngine().voiceBuffers.set(clipId, audio);
		try {
			await saveAudioBuffer(clipId, audio);
		} catch {}
		let track = useForge.getState().project.tracks.find((t) => t.kind === "voice");
		if (!track) {
			addTrack("voice");
			track = useForge.getState().project.tracks.find((t) => t.kind === "voice");
		}
		if (track) addVoiceClip(track.id, {
			id: clipId,
			name: STUDIO_VOICES.find((v) => v.id === voiceId)?.name ?? voiceId,
			voiceId,
			text,
			start: 0,
			duration: audio.duration / (60 / project.bpm || 1)
		});
		if (mimeUrl) {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			setPreviewUrl(mimeUrl);
		}
	}
	async function render() {
		setVoiceBusy(true);
		setDegraded(false);
		try {
			const result = await renderVoice({ data: {
				text,
				voiceId
			} });
			if (result.ok) {
				const buf = decodeBase64(result.base64);
				const audio = await getEngine().decode(buf);
				const blob = new Blob([buf], { type: result.mime });
				await placeTake(audio, URL.createObjectURL(blob));
				toast.success("Voice take placed on the voice track");
				return;
			}
			await placeTake(await synthesizeLocalVoice(text, voiceId));
			setDegraded(true);
			toast.message(`${result.error} — local studio voice used`);
		} catch (err) {
			try {
				await placeTake(await synthesizeLocalVoice(text, voiceId));
				setDegraded(true);
				toast.message("Local studio voice used");
			} catch {
				toast.error(err instanceof Error ? err.message : "Voice render failed");
			}
		} finally {
			setVoiceBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-4 overflow-y-auto p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl italic",
				children: "Voice"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Render a take with a studio voice, then drop it on the timeline. If the voice service is down, Forge still writes a formant take you can move, trim, and export."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-1.5 sm:grid-cols-5",
				children: STUDIO_VOICES.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setVoiceId(v.id),
					className: cn("rounded-lg border px-2 py-2 text-left", voiceId === v.id ? "border-primary bg-elevated" : "border-border bg-card hover:bg-elevated"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm",
						children: v.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] text-muted-foreground",
						children: v.color
					})]
				}, v.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				value: text,
				onChange: (e) => setText(e.target.value),
				maxLength: 400,
				className: "min-h-28"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-[11px] text-subtle",
					children: [text.length, "/400"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => void render(),
					disabled: voiceBusy || text.trim().length < 1,
					children: voiceBusy ? "Rendering…" : "Render take"
				})]
			}),
			degraded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Studio voice service unavailable — local take is on the timeline."
			}) : null,
			previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
				controls: true,
				src: previewUrl,
				className: "w-full"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "No take yet. Write a line and render."
			})
		]
	});
}
var VIEWS = [
	{
		id: "arrange",
		label: "Score",
		icon: AudioLines
	},
	{
		id: "mixer",
		label: "Mix",
		icon: SlidersHorizontal
	},
	{
		id: "sound",
		label: "Sound",
		icon: AudioWaveform
	},
	{
		id: "voice",
		label: "Voice",
		icon: MicVocal
	},
	{
		id: "compose",
		label: "Compose",
		icon: WandSparkles
	}
];
var PIANO_KEYS = {
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
	k: 72
};
var VIEW_BY_DIGIT = {
	Digit1: "arrange",
	Digit2: "mixer",
	Digit3: "sound",
	Digit4: "voice",
	Digit5: "compose"
};
function StudioApp() {
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
	(0, import_react.useLayoutEffect)(() => {
		if (!loadPrefs().seenOnboard) useForge.setState({ showOnboard: true });
		hydrate();
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		const engine = getEngine();
		engine.ensure().then(async (ctx) => {
			for (const track of useForge.getState().project.tracks) for (const clip of track.voices) {
				if (engine.voiceBuffers.has(clip.id)) continue;
				const buf = await loadAudioBuffer(ctx, clip.id);
				if (buf) engine.voiceBuffers.set(clip.id, buf);
			}
		});
	}, [hydrated, project.id]);
	(0, import_react.useEffect)(() => {
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
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const target = e.target;
			const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
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
				playToggle();
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
			if (midi != null && view === "sound") getEngine().previewNote(workingPatch, midi);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});
	(0, import_react.useEffect)(() => {
		const onErr = (event) => {
			const msg = String(event.reason ?? "");
			if (/quota|storage/i.test(msg)) setStorageWarning("Storage is full. Export still works; autosave may fail.");
		};
		window.addEventListener("unhandledrejection", onErr);
		return () => window.removeEventListener("unhandledrejection", onErr);
	}, [setStorageWarning]);
	function mainView() {
		if (view === "mixer") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MixerView, {});
		if (view === "sound") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SoundLab, {});
		if (view === "voice") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoiceLab, {});
		if (view === "compose") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrangeView, {});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "studio-app flex h-dvh flex-col overflow-hidden text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "bottom-right"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {}),
			storageWarning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-primary/40 bg-elevated px-4 py-2 text-sm text-foreground",
				role: "status",
				children: storageWarning
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Transport, {
				onPlay: () => void playToggle(),
				onStop: stop
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hidden shrink-0 items-center gap-1 border-b border-border px-3 py-1.5 md:flex",
				children: [VIEWS.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setView(v.id),
					className: cn("inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs", view === v.id ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(v.icon, { className: "size-3.5" }), v.label]
				}, v.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-auto hidden font-mono text-[10px] text-subtle lg:inline",
					children: "Space play · ? shortcuts · Ember Protocol ready"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
						className: "hidden min-h-0 w-64 shrink-0 overflow-hidden border-r border-border bg-card md:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, { onJump: setView })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex min-h-0 min-w-0 flex-1 flex-col",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-h-0 flex-1 overflow-hidden",
							children: mainView()
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
						className: "hidden min-h-0 w-80 shrink-0 overflow-hidden border-l border-border bg-card lg:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inspector, {})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex shrink-0 border-t border-border md:hidden",
				children: VIEWS.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setView(v.id),
					className: cn("flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] uppercase tracking-wider", view === v.id ? "text-primary" : "text-muted-foreground"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(v.icon, { className: "size-4" }), v.label]
				}, v.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Onboard, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelpOverlay, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TemplateConfirm, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportDialog, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionDialog, {}),
			!hydrated ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Loading session"
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioApp, {});
}
//#endregion
export { Home as component };
