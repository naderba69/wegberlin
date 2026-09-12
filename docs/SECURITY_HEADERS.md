# Production security headers

Policy: `vercel-csp-headers-v1`

The Next.js response configuration applies CSP, `nosniff`, strict-origin referrer policy, microphone-only Permissions Policy, frame denial, COOP, and a machine-readable policy marker to every route.

## CSP boundaries

- Default, base, forms, scripts, styles, images, fonts, media, workers, and manifests default to same origin.
- Objects and frames are denied.
- Remote connections are restricted to the exact Gemini, OpenRouter, and pinned Hugging Face/model-delivery origins recorded in `src/config/security-headers.ts`.
- Ollama is limited to loopback (`localhost`, `127.0.0.1`, or `::1`) over HTTP/HTTPS and an explicit port. Credentials, paths, query strings, LAN hosts, and arbitrary origins are rejected before fetch.
- `blob:` is limited to local image/media/worker uses. `data:` is limited to images/fonts.
- No global wildcard, whole `http:`/`https:` scheme, or generic `unsafe-eval` is allowed.

`unsafe-inline` is documented for Next.js hydration and bounded inline style values. `wasm-unsafe-eval` is documented for the explicit opt-in pinned ONNX/WebGPU support runtime. These are exceptions, not unreviewed defaults.

Run:

```bash
npm run security:audit
```

The audit compares the registry with `reports/security-headers-audit.json` and fails the production prebuild on drift. Browser response-header acceptance is also covered by Playwright. This is a configuration audit, not a penetration test.
