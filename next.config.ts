import type { NextConfig } from "next";
import { securityHeaders } from "./src/config/security-headers";


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
