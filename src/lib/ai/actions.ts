import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ComposeInput = z.object({
  prompt: z.string().trim().min(3).max(500),
});

const VoiceInput = z.object({
  text: z.string().trim().min(1).max(400),
  voiceId: z.string().min(1).max(40),
});

const SoundInput = z.object({
  prompt: z.string().trim().min(3).max(280),
});

const lastCall = new Map<string, number>();
function rateOk(key: string, ms: number) {
  const now = Date.now();
  const prev = lastCall.get(key) ?? 0;
  if (now - prev < ms) return false;
  lastCall.set(key, now);
  return true;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON in model output");
  return JSON.parse(raw.slice(start, end + 1));
}

async function chat(
  system: string,
  user: string,
  maxTokens: number,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available in this environment" };
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: maxTokens,
      temperature: 0.8,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return { ok: false, error: `xAI API error ${res.status}` };
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content ?? "";
  if (!text) return { ok: false, error: "Empty model response" };
  return { ok: true, text };
}

export const composeArrangement = createServerFn({ method: "POST" })
  .validator((input: unknown) => ComposeInput.parse(input))
  .handler(async ({ data }) => {
    if (!rateOk("compose", 4000)) {
      return { ok: false as const, error: "Please wait a moment before composing again." };
    }
    const system = `You are the composer for Hathor Forge, a professional in-browser DAW.
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
Rules: 8 bars, 4/4. Drums use drums[], melodic tracks use notes[]. Keep 3-6 tracks. Make it musically coherent in the given key/scale. No markdown.`;

    const result = await chat(system, data.prompt, 3500);
    if (!result.ok) return result;
    try {
      const json = extractJson(result.text);
      return { ok: true as const, json: JSON.stringify(json) };
    } catch {
      return { ok: false as const, error: "Composer returned unreadable notation." };
    }
  });

export const designSound = createServerFn({ method: "POST" })
  .validator((input: unknown) => SoundInput.parse(input))
  .handler(async ({ data }) => {
    if (!rateOk("sound", 2500)) return { ok: false as const, error: "Please wait a moment." };
    const system = `You design subtractive synth patches for Hathor Forge. Return ONLY JSON:
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
Match the described timbre. No markdown.`;
    const result = await chat(system, data.prompt, 700);
    if (!result.ok) return result;
    try {
      return { ok: true as const, json: JSON.stringify(extractJson(result.text)) };
    } catch {
      return { ok: false as const, error: "Could not parse the designed patch." };
    }
  });

export const renderVoice = createServerFn({ method: "POST" })
  .validator((input: unknown) => VoiceInput.parse(input))
  .handler(async ({ data }) => {
    if (!rateOk("voice", 2500)) {
      return { ok: false as const, error: "Please wait a moment before rendering another take." };
    }
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Voice rendering is not available in this environment" };
    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text: data.text,
        voice_id: data.voiceId,
        language: "en",
      }),
    });
    if (!res.ok) return { ok: false as const, error: `Voice API error ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "audio/mpeg";
    return { ok: true as const, mime, base64: buf.toString("base64") };
  });
