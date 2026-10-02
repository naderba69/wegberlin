import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..', '..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

// Why this file exists: on 2026-09-21 a Vercel deployment failed with
// "Couldn't find any `pages` or `app` directory" because the repository root held only
// `der-weg-nach-berlin/` — a wrapped ZIP had been pushed. The archive builder refuses to produce
// that shape, and this test pins the contract: the deployable entrypoints live at the repository
// root, nothing may point at a subfolder, and `.gitignore` may not swallow the app source.
describe('delivery layout (root must be deployable)', () => {
  it('keeps the Vercel-critical entrypoints at the repository root', () => {
    for (const rel of [
      'package.json',
      'package-lock.json',
      'next.config.ts',
      'tsconfig.json',
      'vercel.json',
      'postcss.config.mjs',
      'src/app/page.tsx',
      'src/app/layout.tsx',
      'public/sw.js',
    ]) {
      expect(existsSync(path.join(ROOT, rel)), `missing at root: ${rel}`).toBe(true);
    }
    // The wrapper must not carry its own entrypoints: a nested package.json is what makes a
    // repository look "wrapped" and is the shape Vercel cannot build.
    expect(existsSync(path.join(ROOT, 'der-weg-nach-berlin', 'package.json')), 'nested wrapper must not exist').toBe(false);
  });

  it('keeps vercel.json pointing at the root and never at a subdirectory', () => {
    const vercel = JSON.parse(read('vercel.json'));
    expect(vercel.framework).toBe('nextjs');
    // A Root Directory override would re-break the exact failure this test guards.
    expect(vercel.rootDirectory ?? '.').toBe('.');
    expect(JSON.stringify(vercel)).not.toContain('der-weg-nach-berlin');
    expect(vercel.ignoreCommand).toContain('docs');
    expect(existsSync(path.join(ROOT, 'scripts', 'vercel-ignore-docs-only.mjs')), 'ignore command script must exist').toBe(true);
  });

  it('routes build and prebuild through the case-locked chain', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts.build.startsWith('next build')).toBe(true);
    expect(pkg.scripts.prebuild).toContain('case:audit');
    expect(pkg.scripts['archive:delivery']).toBe('node scripts/build-delivery-archive.mjs');
    // An old `vercel-build` that skips `case:audit` is the documented trap; if it exists it must
    // delegate to the same chain.
    if ('vercel-build' in pkg.scripts) expect(pkg.scripts['vercel-build']).toBe('npm run build');
  });

  it('does not let .gitignore swallow the app source', () => {
    const gitignore = read('.gitignore');
    const active = gitignore
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    for (const pattern of active) {
      expect(pattern === 'src' || pattern === 'src/' || pattern === 'src/**', `.gitignore hides ${pattern}`).toBe(false);
    }
    // Measured 2026-09-21: the remote carries no authored drill data at all, so the JSON data
    // directories may not be ignored either — that is how `main` ended up with 79 src/data files.
    expect(active.some((l) => l === '*.json' || l === 'data' || l === 'src/data')).toBe(false);
    expect(active.some((l) => l === 'node_modules' || l === '/node_modules')).toBe(true);
  });

  it('keeps both delivery tools guarded: the builder refuses a wrapped or empty root, the uploader refuses a non-deployable staging root', () => {
    const builder = read('scripts/build-delivery-archive.mjs');
    expect(builder).toContain('entries carry the wrapper folder');
    expect(builder).toContain('delivery archive refused');
    expect(builder).toContain('REQUIRED_AT_ROOT');
    // An unfit tree must never leave an archive behind: a stale ZIP beside a newer sidecar is how
    // the wrapped v154b bytes were handed over twice.
    // أُكِّد سلوكًا لا اسمَ ثابت: نسخة سابقة ثبّتت `REQUIRED_DATA_DIRS` فانكسرت حين انتقل الحارس
    // من فحص المجلّدات إلى فحص الملفّات (src/data/*/ لم تعد موجودة).
    expect(builder).toMatch(/authored data file missing from the tree|data directory missing from the tree/);
    const failBody = builder.slice(builder.indexOf('const fail ='), builder.indexOf('if (!existsSync(path.join(ROOT, "package.json")))'));
    expect(failBody).toContain('rmSync(OUT');
    // A `grep -q` on a pipe reports 141 (SIGPIPE) under `set -o pipefail` -> false refusals.
    expect(builder).not.toMatch(/unzip -p "\$ZIP"[^|]*\| *grep/);

    const uploader = read('TERMUX_REPLACE_REPO.sh');
    expect(uploader).toContain('Archive is undeployable');
    expect(uploader).toContain('repo root contains a der-weg-nach-berlin/ wrapper');
    expect(uploader).toContain('zip_has_entry()');
    expect(uploader).not.toMatch(/unzip -p "\$ZIP"[^|]*\| *grep/);
    // The content guard must fire while the archive is only staged: an unusable ZIP has to be
    // refused before a token is typed and before a 20 MB clone is paid for.
    const dataGuard = uploader.indexOf('holds no files in the staged tree');
    const tokenPrompt = uploader.indexOf('PAT (input hidden)');
    expect(dataGuard).toBeGreaterThan(-1);
    expect(tokenPrompt).toBeGreaterThan(-1);
    expect(dataGuard).toBeLessThan(tokenPrompt);
    // `find` on a missing path exits 2 and, under pipefail, aborts the script silently inside the
    // assignment — so the directory is tested first and the message is guaranteed to be printed.
    expect(uploader).toContain('[ -d "${PROJECT_ROOT}/${data_dir}" ]');
  });

  // حارس سلوكي: يُشغَّل الباني الحقيقي على شجرة منزوعة المحتوى ويُشترط أن يرفض وألّا يترك أرشيفًا.
  it('refuses an unfit tree and leaves no stale archive or sidecar behind', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'dwnb-builder-'));
    try {
      const stage = path.join(tmp, 'tree');
      mkdirSync(path.join(stage, 'scripts'), { recursive: true });
      mkdirSync(path.join(stage, 'src', 'data'), { recursive: true });
      mkdirSync(path.join(stage, 'src', 'app'), { recursive: true });
      for (const rel of ['package.json', 'next.config.ts', 'tsconfig.json', 'vercel.json']) {
        cpSync(path.join(ROOT, rel), path.join(stage, rel));
      }
      cpSync(path.join(ROOT, 'src/app/page.tsx'), path.join(stage, 'src/app/page.tsx'));
      cpSync(path.join(ROOT, 'scripts/build-delivery-archive.mjs'), path.join(stage, 'scripts/build-delivery-archive.mjs'));
      const out = path.join(tmp, 'out.zip');
      writeFileSync(out, 'stale bytes from a previous build');
      writeFileSync(`${out}.sha256`, 'stale sidecar');
      const res = spawnSync(process.execPath, [path.join(stage, 'scripts/build-delivery-archive.mjs')], {
        env: { ...process.env, DELIVERY_ZIP: out }, encoding: 'utf8',
      });
      expect(res.status, 'builder must exit non-zero for an unfit tree').not.toBe(0);
      expect(`${res.stderr}${res.stdout}`).toContain('delivery archive refused');
      expect(existsSync(out), 'a refused build must not leave a stale archive').toBe(false);
      expect(existsSync(`${out}.sha256`), 'a refused build must not leave a stale sidecar').toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('ships the flat-root publish flow the owner runs by hand, with content and checksum refusals', () => {
    const push = read('TERMUX_UNNEST_PUSH.sh');
    expect(push).toContain('mv der-weg-nach-berlin/* .');
    expect(push).toContain('shopt -s dotglob nullglob');
    expect(push).toContain('src/data/exercises = 0');
    expect(push).toContain('الأرشيف لا يطابق wegberlin-full.zip.sha256');
    expect(push).toContain('[ "$(git ls-files src/app | wc -l)" -gt 0 ]');
    // never leaves a wrapper behind, and never trusts a partial match on a pipe
    expect(push).not.toMatch(/\| *head/);
    expect(read('TERMUX_GITHUB_UPLOAD.md')).toContain('TERMUX_UNNEST_PUSH.sh');
  });

  it('ships a src/data recovery + mirror driver so an authored-content loss is survivable', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts['data:recover']).toBe('node scripts/recover-src-data.mjs');
    const rec = read('scripts/recover-src-data.mjs');
    expect(rec).toContain('no candidate holds a complete src/data');
    expect(rec).toContain('refusing to snapshot an incomplete tree');
    expect(rec).toContain('never deletes');
    // tar -t lists directory members: counting them made verify() reject a healthy mirror.
    expect(rec).toContain("!l.endsWith(\"/\")");
    expect(read('TERMUX_GITHUB_UPLOAD.md')).toContain('recover-src-data.mjs');
  });

  it('ships an un-nest repair for a repository whose root holds only the wrapper folder', () => {
    const unnest = read('TERMUX_UNNEST_ROOT.sh');
    expect(unnest).toContain('Already flat');
    expect(unnest).toContain('partially populated');
    expect(unnest).toContain('is missing at the repository root');
    // Repairs by rename so file history survives, and never force-pushes.
    expect(unnest).toContain('git mv');
    expect(unnest).not.toContain('--force');
    expect(unnest).not.toMatch(/\| *head/); // the SIGPIPE trap that silently aborted the commit once
    // Un-nesting repairs the layout, so a missing content directory is a warning, not a refusal.
    expect(unnest).toContain('Un-nesting repairs the layout only');
    expect(read('TERMUX_GITHUB_UPLOAD.md')).toContain('TERMUX_UNNEST_ROOT.sh');
  });
});
