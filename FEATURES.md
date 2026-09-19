# Hathor Forge — Features

Status: `[x]` done + tested, `[~]` in progress, `[ ]` not started, `[E]` enterprise-verified in this sandbox.

## Core loop
- [x] Ember Protocol loads as the default session
- [x] Spacebar play/stop (except when a text field owns the key)
- [x] Shift+Space stops and returns to start
- [x] Night Shift, Wire, Still Air, Pulse templates (plus Ember)
- [x] Template load confirms before replacing the session
- [x] Sound — subtractive / FM / wavetable / Karplus-Strong patches, on-screen piano, assign to track
- [x] Describe-a-patch (xAI, local fallback)
- [x] Voice — studio voices, render take to timeline (xAI TTS, local formant fallback)
- [x] Compose — prompt to editable multi-track session (xAI, generative local fallback)
- [x] Score — arrangement timeline, piano roll, drum step sequencer
- [x] Mix — gain, pan, mute, solo (live during playback), per-track FX
- [x] Export WAV — 16/24/32f, 44.1/48/96 kHz, tail, dither, normalize, clip report, stems
- [x] Persistence — IndexedDB sessions + audio, localStorage prefs, autosave, bundle import/export

## Transport
- [x] Play, halt, stop-to-zero
- [x] Loop, metronome, swing, BPM, 4/4 display
- [x] Master meter, scope, clip LED
- [x] Click-free start/stop gain ramps

## Audio engine
- [x] Persistent AudioContext (not closed on stop)
- [x] Per-track FX graph: filter, drive, sync delay, convolution reverb, chorus, pan, gain
- [x] Sample-accurate scheduling, swing, loop lookahead
- [x] Offline bounce matches the session (same graph builders)
- [x] Drum synthesis (kick, snare, clap, hat, open, rim, tom, ride, perc)
- [x] Master compressor / limiter

## Surfaces
- [x] Arrangement
- [x] Piano roll
- [x] Step sequencer
- [x] Mixer
- [x] Patch editor
- [x] Voice editor
- [x] Compose panel
- [x] Browser / library
- [x] Transport bar
- [x] Master meter
- [x] Export dialog
- [x] Session manager
- [x] Help / shortcuts
- [x] First-run onboarding
- [x] Storage-full banner
- [x] Empty / loading states

## Platforms
- [x] Web desktop
- [x] Responsive tablet / mobile core loop
- [x] PWA shell via platform injector
- [ ] Native desktop wrapper (Tauri/Electron) — not in this web sandbox
- [ ] iOS / Android stores — not in this web sandbox

## Enterprise (see ENTERPRISE.md)
- [x] Local-first offline studio (no account required)
- [x] XSS-safe rendering of user strings
- [x] File import validation (JSON session schema)
- [x] Rate-limited model calls
- [ ] Hosted 99.99% SLA — N/A, no hosted control plane in this app
