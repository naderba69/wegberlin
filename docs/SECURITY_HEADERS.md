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

## 2026-10-02 preview and CSP validity correction

Production still denies embedding and generic unsafe-eval. Development only allows the named Arena parent origins, removes X-Frame-Options there, and permits Webpack source-map eval so hydration actually runs. Invalid IPv6 literal CSP tokens were removed, not replaced by a broad wildcard; local endpoints use localhost or 127.0.0.1 (localhost can resolve to IPv6). The endpoint validator rejects literal [::1] instead of falsely claiming it is CSP-supported.
