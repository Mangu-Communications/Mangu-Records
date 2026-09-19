import { useState } from "react";
import { toast } from "sonner";
import { renderVoice } from "@/lib/ai/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getEngine } from "@/lib/forge/engine";
import { saveAudioBuffer } from "@/lib/forge/persist";
import { STUDIO_VOICES } from "@/lib/forge/presets";
import { useForge } from "@/lib/forge/store";
import { synthesizeLocalVoice } from "@/lib/forge/voices";
import { uid } from "@/lib/utils";
import { cn } from "@/lib/utils";

function decodeBase64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function VoiceLab() {
  const project = useForge((s) => s.project);
  const addVoiceClip = useForge((s) => s.addVoiceClip);
  const addTrack = useForge((s) => s.addTrack);
  const voiceBusy = useForge((s) => s.voiceBusy);
  const setVoiceBusy = useForge((s) => s.setVoiceBusy);
  const [text, setText] = useState("Hathor Forge. Design the voice you need — spoken, sung, or scored.");
  const [voiceId, setVoiceId] = useState("orion");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);

  async function placeTake(audio: AudioBuffer, mimeUrl?: string) {
    const clipId = uid("vox");
    getEngine().voiceBuffers.set(clipId, audio);
    try {
      await saveAudioBuffer(clipId, audio);
    } catch {
      /* still playable this session */
    }
    let track = useForge.getState().project.tracks.find((t) => t.kind === "voice");
    if (!track) {
      addTrack("voice");
      track = useForge.getState().project.tracks.find((t) => t.kind === "voice");
    }
    if (track) {
      addVoiceClip(track.id, {
        id: clipId,
        name: STUDIO_VOICES.find((v) => v.id === voiceId)?.name ?? voiceId,
        voiceId,
        text,
        start: 0,
        duration: audio.duration / ((60 / project.bpm) || 1),
      });
    }
    if (mimeUrl) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(mimeUrl);
    }
  }

  async function render() {
    setVoiceBusy(true);
    setDegraded(false);
    try {
      const result = await renderVoice({ data: { text, voiceId } });
      if (result.ok) {
        const buf = decodeBase64(result.base64);
        const audio = await getEngine().decode(buf);
        const blob = new Blob([buf], { type: result.mime });
        await placeTake(audio, URL.createObjectURL(blob));
        toast.success("Voice take placed on the voice track");
        return;
      }
      const local = await synthesizeLocalVoice(text, voiceId);
      await placeTake(local);
      setDegraded(true);
      toast.message(`${result.error} — local studio voice used`);
    } catch (err) {
      try {
        const local = await synthesizeLocalVoice(text, voiceId);
        await placeTake(local);
        setDegraded(true);
        toast.message("Local studio voice used");
      } catch {
        toast.error(err instanceof Error ? err.message : "Voice render failed");
      }
    } finally {
      setVoiceBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-4 overflow-y-auto p-4">
      <div>
        <h2 className="font-display text-2xl italic">Voice</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Render a take with a studio voice, then drop it on the timeline. If the voice service is down, Forge still
          writes a formant take you can move, trim, and export.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {STUDIO_VOICES.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVoiceId(v.id)}
            className={cn(
              "rounded-lg border px-2 py-2 text-left",
              voiceId === v.id ? "border-primary bg-elevated" : "border-border bg-card hover:bg-elevated",
            )}
          >
            <div className="text-sm">{v.name}</div>
            <div className="text-[11px] text-muted-foreground">{v.color}</div>
          </button>
        ))}
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={400} className="min-h-28" />
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-subtle">{text.length}/400</span>
        <Button onClick={() => void render()} disabled={voiceBusy || text.trim().length < 1}>
          {voiceBusy ? "Rendering…" : "Render take"}
        </Button>
      </div>
      {degraded ? (
        <p className="text-sm text-muted-foreground">Studio voice service unavailable — local take is on the timeline.</p>
      ) : null}
      {previewUrl ? (
        <audio controls src={previewUrl} className="w-full" />
      ) : (
        <p className="text-sm text-muted-foreground">No take yet. Write a line and render.</p>
      )}
    </div>
  );
}
