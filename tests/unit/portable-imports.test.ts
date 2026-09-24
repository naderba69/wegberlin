import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..', '..');
const GUARD = path.join(ROOT, 'scripts/audit-portable-imports.mjs');

// Why this file exists: on 2026-09-22 a Vercel deployment failed at the type-check step with seven
// errors, six of them `TS2307: Cannot find module '/home/user/der-weg-nach-berlin/src/data/
// academic-lessons'`. The imports were machine-absolute paths pointing at the authoring sandbox.
// Local `tsc --noEmit` could never catch it -- that path resolves on the authoring box -- so the
// tree type-checked clean here and died on the build server. `scripts/audit-portable-imports.mjs`
// closes that hole, and this test keeps it wired into `prebuild` where Vercel itself runs it.
describe('portable imports (no machine-local paths may reach a deploy)', () => {
  it('runs as the first step of prebuild, so the build server enforces it too', () => {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts['imports:portable']).toContain('audit-portable-imports');
    // Must run BEFORE the expensive audits: a machine path is a hard stop, not a warning.
    expect(pkg.scripts.prebuild.trimStart().startsWith('npm run imports:portable')).toBe(true);
  });

  it('passes on the real tree', () => {
    const res = spawnSync(process.execPath, [GUARD], { cwd: ROOT, encoding: 'utf8' });
    expect(res.status, `${res.stdout}${res.stderr}`).toBe(0);
  });

  it('refuses the exact import shape that broke the 2026-09-22 deploy', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'dwnb-portable-'));
    try {
      mkdirSync(path.join(tmp, 'scripts'), { recursive: true });
      mkdirSync(path.join(tmp, 'src', 'data'), { recursive: true });
      writeFileSync(path.join(tmp, 'src', 'data', 'academic-lessons.ts'), 'export const x = 1;\n');
      writeFileSync(
        path.join(tmp, 'probe.ts'),
        // Deliberate fixture reproducing the 2026-09-22 Vercel failure:
        'import { academicLessons } from "/home/user/der-weg-nach-berlin/src/data/academic-lessons";\n' + // portable-imports-allow
          'console.log(academicLessons);\n',
      );
      const res = spawnSync(process.execPath, [GUARD], { cwd: tmp, encoding: 'utf8' });
      expect(res.status, 'guard must fail when a machine-absolute import is present').toBe(1);
      expect(`${res.stdout}${res.stderr}`).toContain('probe.ts');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('allows the portable alias and /tmp scratch paths', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'dwnb-portable-ok-'));
    try {
      writeFileSync(
        path.join(tmp, 'probe.ts'),
        'import { academicLessons } from "@/data/academic-lessons";\n' +
          'import { readFileSync } from "node:fs";\n' +
          'readFileSync("/tmp/scratch.json", "utf8");\n' +
          'console.log(academicLessons);\n',
      );
      const res = spawnSync(process.execPath, [GUARD], { cwd: tmp, encoding: 'utf8' });
      expect(res.status, `${res.stdout}${res.stderr}`).toBe(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('keeps the archived run-log probes out of the deploy type-check, but still checks them', () => {
    const tsconfig = JSON.parse(readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf8'));
    expect(tsconfig.exclude).toContain('docs/run-logs');
    const probes = JSON.parse(readFileSync(path.join(ROOT, 'tsconfig.probes.json'), 'utf8'));
    expect(probes.include.some((p: string) => p.startsWith('docs/run-logs'))).toBe(true);
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts['typecheck:probes']).toContain('tsconfig.probes.json');
  });
});
