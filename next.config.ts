import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import type { NextConfig } from "next";
import { securityHeaders } from "./src/config/security-headers";

// Build ID stability: Next's default ID is random per build, which changed the
// route/asset bytes and therefore the Offline size fingerprint on every build,
// even with no source change. This derives the ID from the inputs that shape the
// output (sources, public payloads, lockfile, configs). Generated size manifests
// and reports are excluded so that publishing them does not change the ID.
const BUILD_INPUT_INCLUDE = /^(src\/|public\/|next\.config\.ts$|package\.json$|package-lock\.json$|tsconfig\.json$|postcss\.config\.mjs$)/;
const BUILD_INPUT_EXCLUDE = /^public\/offline-size-manifest\.json$/;

function contentBuildId(): string | null {
  try {
    const listed = execFileSync("git", ["ls-files", "-c", "-o", "--exclude-standard", "-z"], {
      cwd: process.cwd(),
      maxBuffer: 64 * 1024 * 1024,
    }).toString("utf8");
    const files = listed
      .split("\0")
      .filter((file) => file && BUILD_INPUT_INCLUDE.test(file) && !BUILD_INPUT_EXCLUDE.test(file))
      .sort();
    if (files.length === 0) return null;
    const hash = createHash("sha256");
    for (const file of files) {
      hash.update(file).update("\0").update(readFileSync(file)).update("\0");
    }
    return hash.digest("hex").slice(0, 20);
  } catch {
    // Outside a git checkout Next falls back to its own ID; the Offline fingerprint
    // is then reproducible only from the same tree.
    return null;
  }
}


// ADR-049 keeps a mandatory 15% reserve below the hard JS limits. The curriculum
// data barrel used to land in one shared client chunk (6405), which grew past the
// safety ceiling as explanations were authored. Splitting it per level keeps every
// emitted chunk under the ceiling without touching the policy or the data.
const CURRICULUM_LEVELS = ["a1", "a2", "b1", "b2"] as const;

function splitCurriculumByLevel(config: Parameters<NonNullable<NextConfig["webpack"]>>[0]) {
  const optimization = (config.optimization ??= {}) as { splitChunks?: Record<string, unknown> | false };
  // في التطوير يضبط Next تقسيم الحزم على false، فلا كائن تُضاف إليه مجموعات التخزين.
  // التقسيم تحسين حجم يخص البناء الإنتاجي فقط، وهنا نمرره كما أراده Next دون مساس.
  if (optimization.splitChunks === false) return config;
  const splitChunks = (optimization.splitChunks ??= {}) as { cacheGroups?: Record<string, unknown> };
  const cacheGroups = (splitChunks.cacheGroups ??= {}) as Record<string, unknown>;
  for (const level of CURRICULUM_LEVELS) {
    cacheGroups[`curriculum-${level}`] = {
      test: new RegExp(`[\\\\/]src[\\\\/]data[\\\\/]lessons-${level}-module`),
      name: `curriculum-${level}`,
      chunks: "all",
      priority: 30,
      enforce: true,
    };
  }
  return config;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  generateBuildId: async () => contentBuildId(),
  // التطوير المحلي يجب أن يعمل على المضيفين العاديين لا على نطاق المعاينة وحده: تشغيل Chromium
  // محليًا على 127.0.0.1 كان يُحجب فيه /_next/hmr ولا تهدرِد الصفحة، فيبدو التطبيق معطّلًا.
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1", "0.0.0.0"],
  async headers() {
    // Production stays non-embeddable. Arena's development preview is an explicit,
    // origin-bounded exception. Webpack dev source maps also need development-only
    // unsafe-eval; the production directive registry never permits generic eval.
    const headers=process.env.NODE_ENV==="development"?securityHeaders.filter(header=>header.key.toLowerCase()!=="x-frame-options").map(header=>header.key.toLowerCase()==="content-security-policy"?{...header,value:header.value.replace("frame-ancestors 'none'", "frame-ancestors 'self' https://arena.ai https://*.arena.ai").replace("script-src 'self'", "script-src 'self' 'unsafe-eval'")}:header):[...securityHeaders];
    return [{ source: "/(.*)", headers }];
  },
  async redirects() {
    // روابط فهرس يحاول المتعلّم كتابتها يدويًا (أو يأتي بها رابط مقطوع) بدل أن تسقط على 404.
    return [
      { source: "/lernen", destination: "/path", permanent: false },
      { source: "/assessment", destination: "/exams", permanent: false },
      { source: "/portfolio", destination: "/progress", permanent: false },
    ];
  },
  webpack: (config) => splitCurriculumByLevel(config),
};

export default nextConfig;
