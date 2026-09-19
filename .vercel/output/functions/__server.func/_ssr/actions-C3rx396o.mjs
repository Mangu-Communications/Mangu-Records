import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { i as string, r as object } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/actions-C3rx396o.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
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
var lastCall = /* @__PURE__ */ new Map();
function rateOk(key, ms) {
	const now = Date.now();
	if (now - (lastCall.get(key) ?? 0) < ms) return false;
	lastCall.set(key, now);
	return true;
}
function extractJson(text) {
	const raw = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? text;
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start < 0 || end <= start) throw new Error("No JSON in model output");
	return JSON.parse(raw.slice(start, end + 1));
}
async function chat(system, user, maxTokens) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI is not available in this environment"
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: maxTokens,
			temperature: .8,
			messages: [{
				role: "system",
				content: system
			}, {
				role: "user",
				content: user
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI API error ${res.status}`
	};
	const text = (await res.json()).choices?.[0]?.message?.content ?? "";
	if (!text) return {
		ok: false,
		error: "Empty model response"
	};
	return {
		ok: true,
		text
	};
}
var composeArrangement_createServerFn_handler = createServerRpc({
	id: "26658dea3270ad6b78d3d7a0726973d052649b037f5f1656119b3aed05da28a7",
	name: "composeArrangement",
	filename: "src/lib/ai/actions.ts"
}, (opts) => composeArrangement.__executeServer(opts));
var composeArrangement = createServerFn({ method: "POST" }).validator((input) => ComposeInput.parse(input)).handler(composeArrangement_createServerFn_handler, async ({ data }) => {
	if (!rateOk("compose", 4e3)) return {
		ok: false,
		error: "Please wait a moment before composing again."
	};
	const result = await chat(`You are the composer for Hathor Forge, a professional in-browser DAW.
Return ONLY JSON matching:
{
  "title": string,
  "bpm": number (60-180),
  "key": string like "D" or "F#",
  "scale": "major"|"minor"|"dorian"|"phrygian"|"mixolydian"|"harmonic-minor",
  "bars": 8,
  "mood": string,
  "tracks": [
    {
      "name": string,
      "kind": "drums"|"bass"|"pad"|"lead"|"keys"|"voice"|"fx",
      "instrumentId": one of analog-bass, sub-bass, warm-pad, air-pad, glass-lead, pluck, brass, choir, fm-bell, keys, noise-riser, dark-lead,
      "volume": 0-1,
      "pan": -1 to 1,
      "drums": [{"sample":"kick|snare|clap|hat|openhat|tom|ride|perc|rim","start": beat float, "velocity": 0-1}],
      "notes": [{"pitch": midi 24-96, "start": beat, "duration": beats, "velocity": 0-1}]
    }
  ]
}
Rules: 8 bars, 4/4. Drums use drums[], melodic tracks use notes[]. Keep 3-6 tracks. Make it musically coherent in the given key/scale. No markdown.`, data.prompt, 3500);
	if (!result.ok) return result;
	try {
		const json = extractJson(result.text);
		return {
			ok: true,
			json: JSON.stringify(json)
		};
	} catch {
		return {
			ok: false,
			error: "Composer returned unreadable notation."
		};
	}
});
var designSound_createServerFn_handler = createServerRpc({
	id: "0b5d5853e97e8b9d9832c3e5eac0f18b8df888874146592929f275f043643df4",
	name: "designSound",
	filename: "src/lib/ai/actions.ts"
}, (opts) => designSound.__executeServer(opts));
var designSound = createServerFn({ method: "POST" }).validator((input) => SoundInput.parse(input)).handler(designSound_createServerFn_handler, async ({ data }) => {
	if (!rateOk("sound", 2500)) return {
		ok: false,
		error: "Please wait a moment."
	};
	const result = await chat(`You design subtractive synth patches for Hathor Forge. Return ONLY JSON:
{
  "name": string,
  "category": "bass"|"pad"|"lead"|"keys"|"pluck"|"vox"|"fx"|"bell",
  "osc1": {"type":"sine|square|sawtooth|triangle|noise","detune":-24..24,"mix":0-1,"octave":-2|-1|0|1|2},
  "osc2": same,
  "filter": {"type":"lowpass|highpass|bandpass|notch","cutoff":80-12000,"res":0-12,"envAmt":0-1},
  "env": {"a":0-2,"d":0-2,"s":0-1,"r":0-3},
  "filterEnv": {"a":0-2,"d":0-2,"s":0-1,"r":0-3},
  "lfo": {"rate":0.05-12,"amt":0-1,"dest":"pitch|filter|amp"},
  "gain": 0.1-0.8,
  "drive": 0-0.6
}
Match the described timbre. No markdown.`, data.prompt, 700);
	if (!result.ok) return result;
	try {
		return {
			ok: true,
			json: JSON.stringify(extractJson(result.text))
		};
	} catch {
		return {
			ok: false,
			error: "Could not parse the designed patch."
		};
	}
});
var renderVoice_createServerFn_handler = createServerRpc({
	id: "4604405b9eed242a279b20ba40eff46f762611f117c40118450535fabc23f9e0",
	name: "renderVoice",
	filename: "src/lib/ai/actions.ts"
}, (opts) => renderVoice.__executeServer(opts));
var renderVoice = createServerFn({ method: "POST" }).validator((input) => VoiceInput.parse(input)).handler(renderVoice_createServerFn_handler, async ({ data }) => {
	if (!rateOk("voice", 2500)) return {
		ok: false,
		error: "Please wait a moment before rendering another take."
	};
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Voice rendering is not available in this environment"
	};
	const res = await fetch("https://api.x.ai/v1/tts", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			text: data.text,
			voice_id: data.voiceId,
			language: "en"
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `Voice API error ${res.status}`
	};
	const buf = Buffer.from(await res.arrayBuffer());
	return {
		ok: true,
		mime: res.headers.get("content-type") || "audio/mpeg",
		base64: buf.toString("base64")
	};
});
//#endregion
export { composeArrangement_createServerFn_handler, designSound_createServerFn_handler, renderVoice_createServerFn_handler };
