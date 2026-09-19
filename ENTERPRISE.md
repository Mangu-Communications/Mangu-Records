# Hathor Forge — Enterprise tracker (web sandbox)

This build is a **local-first in-browser studio**. There is no multi-tenant control plane, no auth, and no hosted render farm. Evidence below is for the product that actually ships here.

| Requirement | Status | Evidence |
| --- | --- | --- |
| Audio correctness | Partial / strong on web | `AUDIO.md`, `dsp.test.ts`, limiter + ramps in `engine.ts` |
| Offline when network down | Yes | Compose/Voice degrade; engine, mix, export, save keep working |
| Audio device / context suspend | Yes | `ensure()` resumes; context is not destroyed on stop |
| Storage full | Banner | `storageWarning` + autosave catch |
| XSS | Yes | React text rendering; JSON import via `normalizeProject` |
| Secrets | Yes | `XAI_API_KEY` server-only in `src/lib/ai/actions.ts` |
| Rate limits | Yes | 2.5–4s per Compose/Voice/Sound |
| CSP / COOP | Platform | Preview host; do not add a CSP that blocks grok.com |
| GDPR / DSAR | N/A | No server-side user content store |
| 99.99% SLA | N/A | No hosted service owned by this app |
| 10k producers load test | N/A | Client-side only |
| Desktop / store | Not in sandbox | PWA manifest injected by platform |
| SBOM / CVE CI | Partial | `npm` lockfile present; no separate scanner in this sandbox |

Honest remainder: native wrappers, status page, on-call runbooks for a fleet, and SSO are out of scope for a local web studio with auth off.
