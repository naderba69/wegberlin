export const SECURITY_HEADERS_POLICY_VERSION = "vercel-csp-headers-v1" as const;

export const contentSecurityPolicyDirectives = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "frame-src": ["'none'"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"],
  "script-src-attr": ["'none'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'", "data:"],
  "media-src": ["'self'", "blob:"],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
  "connect-src": [
    "'self'",
    "https://generativelanguage.googleapis.com",
    "https://openrouter.ai",
    "https://huggingface.co",
    "https://cdn-lfs.huggingface.co",
    "https://cdn-lfs-us-1.huggingface.co",
    "https://cas-bridge.xethub.hf.co",
    "http://localhost:*",
    "https://localhost:*",
    "http://127.0.0.1:*",
    "https://127.0.0.1:*",
    "http://[::1]:*",
    "https://[::1]:*",
  ],
} as const;

export const securityHeaderExceptions = [
  {
    token: "'unsafe-inline'",
    directives: ["script-src", "style-src"],
    reason: "Next.js hydration emits inline boot scripts and this UI uses bounded inline style values; remove only after nonce/hash plumbing is proven in production.",
  },
  {
    token: "'wasm-unsafe-eval'",
    directives: ["script-src"],
    reason: "The explicit opt-in ONNX/WebGPU runtime compiles its pinned local WASM support module; generic unsafe-eval is not allowed.",
  },
  {
    token: "blob:",
    directives: ["img-src", "media-src", "worker-src"],
    reason: "Local recordings, generated report previews, and the isolated model Worker use revocable Blob URLs without remote upload.",
  },
] as const;

export function serializeContentSecurityPolicy() {
  return Object.entries(contentSecurityPolicyDirectives).map(([directive,values])=>`${directive} ${values.join(" ")}`).join("; ");
}

export const securityHeaders = [
  { key: "Content-Security-Policy", value: serializeContentSecurityPolicy() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DWNB-Security-Policy", value: SECURITY_HEADERS_POLICY_VERSION },
] as const;
