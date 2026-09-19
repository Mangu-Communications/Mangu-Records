# Resume

Hathor Forge is the in-browser studio. Default session is Ember Protocol. Preview must serve `0.0.0.0:8080` via `npm run dev` / `startup.sh`.

Read first: `FEATURES.md`, `src/lib/forge/engine.ts`, `src/lib/forge/store.ts`, `src/components/studio/studio-app.tsx`.

Next 3:
1. Keep audio glitch-free (never close AudioContext on stop).
2. Keep spacebar bound globally except text fields.
3. Any new synth/effect must land in `AUDIO.md` with a test.

Blockers outside this sandbox: Tauri/Electron, App Store, hosted SLA, SSO (auth is OFF by product contract).
