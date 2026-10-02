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
  async headers() {
    return [{ source: "/(.*)", headers: [...securityHeaders] }];
  },
  webpack: (config) => splitCurriculumByLevel(config),
};

export default nextConfig;
