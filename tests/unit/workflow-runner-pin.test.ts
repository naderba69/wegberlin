import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * GitHub ينقل وسم `ubuntu-latest` إلى صورة أحدث بلا أي commit (إشعار: Ubuntu 26 في 2026-10-19)، فيتغيّر المتصفح والخطوط
 * وإصدار الأدوات تحت CI دون أن يلمس أحدٌ المستودع. هذا الحارس يفرض صورة مثبَّتة بالإصدار في كل مسارات العمل،
 * ويجعل الانتقال إلى إصدار أحدث قرارًا صريحًا (تعديل `RUNNER_IMAGE` هنا + `runs-on` + ADR) لا مفاجأة.
 */
const RUNNER_IMAGE = "ubuntu-24.04";
const roots = [".github/workflows", "deployment"];

function workflowFiles() {
  return roots.flatMap((root) =>
    readdirSync(root)
      .filter((name) => /\.ya?ml$/u.test(name))
      .map((name) => path.join(root, name)),
  );
}

function runnerLabels(file: string) {
  return [...readFileSync(file, "utf8").matchAll(/^\s*runs-on:\s*(.+?)\s*$/gmu)].map((match) => match[1].replace(/^["']|["']$/gu, ""));
}

describe("workflow runner pin", () => {
  it("finds workflow files and at least one runs-on in every job-bearing file", () => {
    const files = workflowFiles();
    expect(files.length).toBeGreaterThanOrEqual(8);
    const withJobs = files.filter((file) => /^jobs:/mu.test(readFileSync(file, "utf8")));
    expect(withJobs.length).toBeGreaterThanOrEqual(8);
    for (const file of withJobs) expect(runnerLabels(file).length, file).toBeGreaterThan(0);
  });

  it(`uses only the version-pinned ${RUNNER_IMAGE} image, never a moving *-latest label`, () => {
    const offenders = workflowFiles().flatMap((file) =>
      runnerLabels(file)
        .filter((label) => label !== RUNNER_IMAGE)
        .map((label) => `${file}: runs-on ${label}`),
    );
    expect(offenders).toEqual([]);
  });
});
