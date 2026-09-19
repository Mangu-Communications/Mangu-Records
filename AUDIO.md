# Hathor Forge — Audio correctness registry

Verified 2026-09-17 in this sandbox (OfflineAudioContext unit tests + Web Audio engine).

| Component | Parameters | Null | DC | Notes |
| --- | --- | --- | --- | --- |
| Waveshaper | drive 0–1 | mid-curve ≈ 0 | n/a | `dsp.test.ts` |
| WAV 16-bit | dither TPDF | silent PCM valid RIFF | n/a | header + size |
| WAV 32-float | IEEE | format=3 | n/a | `dsp.test.ts` |
| Peak / clip | analyser | silence → 0 | n/a | truthful clip LED |
| Ember Protocol | 92 BPM D harmonic minor | session has notes | mix limiter −3 dB | default session |
| Night Shift | 122 house | 4-on-floor | — | template |
| Wire | 140 trap 808 | — | — | template |
| Still Air | 68 ambient | no kick | — | template |
| Pulse | 132 techno | — | — | template |
| Analog bass | LP + env | exp ramps, no 0-start exp | — | subtractive |
| FM bell | ratio 2–4 | — | — | FM |
| Pads / keys | periodic wave | — | — | wavetable-lite |
| Pluck | Karplus-Strong | — | — | physical-lite |
| Drums | 9 samples | exp decay to 0.0008 | — | no DC hold |
| Delay | tempo-sync ¾ beat | wet 0 → dry | — | |
| Reverb | IR room/hall/plate/spring | wet 0 → dry | — | convolution |
| Voice local | formant pulses | — | — | fallback when TTS down |
| Export | 16/24/32, 44.1/48/96 | origin t=0 | limiter on bounce | clip report shown |

Listening: Ember Protocol, Night Shift, Wire, Still Air, Pulse constructed as musically distinct full sessions. Start/stop uses 12 ms exponential gate so the context is never closed (the previous close-on-stop path clicked).
