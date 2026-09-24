import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Hydration fence for client components.
 *
 * The 2026-09-20 diagnosis of React error #418 on `/settings`: the view initialised its session
 * credential with `useState(() => sessionStorage.getItem(...))`, so the server rendered an empty
 * field while the client's first render read the live tab value. The same scan found more sites
 * reading a device clock, a time zone or a notification permission during the first render.
 *
 * Rule: no web-storage read and no device-clock read inside a `useState` initialiser or an
 * empty-deps `useMemo` in a `"use client"` file. Handler and interval reads stay legal — they run
 * after mount and cannot change the first render. Every site named during the diagnosis is now fenced; `deferred` stays empty
 * so the fence cannot quietly widen. This is not the browser suite: the e2e case in
 * `tests/e2e/critical-flows.spec.ts` is what reproduces the mismatch itself.
 */
const root = "src";

// البند 406 أُغلق: لم يبق موقع مؤجَّل، والقائمة تُرى فارغة لتُمنع الزيادة.
const deferred: string[] = [];

const deviceRead = /new Date\(|Date\.now\(\)|toLocale[A-Za-z]*\(|Intl\.\w*Format|Notification\.permission|today\(\)/;
const storageRead = /sessionStorage|localStorage/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.(tsx?|jsx?)$/.test(path) ? [path] : [];
  });
}

function scan(): string[] {
  const found: string[] = [];
  for (const file of walk(root)) {
    const normalised = file.split("\\").join("/");
    if (deferred.includes(normalised)) continue;
    const source = readFileSync(file, "utf8");
    if (!source.includes('"use client"')) continue;
    for (const [index, line] of source.split("\n").entries()) {
      // سطر إعلان فقط: const x = useState(...) أو const [a, setA] = useMemo(...)
      const decl = /^\s*(?:export\s+)?const\s*(?:\[[^\]]*\]|\{[^}]*\}|[A-Za-z0-9_$]+)\s*=\s*use(?:State|Memo)\s*(?:<[^>]*>)?\s*\(/;
      if (!decl.test(line)) continue;
      const probe = line.slice(0, 900);
      if (!/\(\s*\(\s*\)\s*=>|,\s*\[\s*\]\s*\)/.test(probe)) continue;
      if (storageRead.test(probe) || deviceRead.test(probe)) {
        found.push(`${normalised}:${index + 1} يقرأ قيمة جهاز أو مخزنًا في أول رسم`);
      }
    }
  }
  return found;
}

describe("حارس الترطيب: قيم الجهاز تُقرأ بعد أول رسم", () => {
  it("لا قراءة مخازن ولا ساعة جهاز في مُهيِّئات الحالة", () => {
    expect(scan()).toEqual([]);
  });

  it("لا مواقع مؤجَّلة — الدين أُغلق", () => {
    expect(deferred).toEqual([]);
  });

  it("الإعدادات تستعيد مفتاح الجلسة بعد الترطيب", () => {
    const source = readFileSync(join(root, "components/settings-view.tsx"), "utf8");
    expect(source).not.toMatch(/useState\(\(\) => typeof window[^\n]*sessionStorage/);
    expect(source).toContain("useDeviceValue(() => sessionStorage.getItem(");
    expect(source).toContain("const key = draftKey ?? storedKey;");
  });

  it("التذكير لا يقرأ منطقة الوقت ولا الإذن في أول رسم", () => {
    const source = readFileSync(join(root, "components/review-reminder-control.tsx"), "utf8");
    expect(source).not.toMatch(/useMemo\(\(\)=>Intl\.DateTimeFormat/);
    expect(source).not.toMatch(/useState<NotificationPermission\|"unsupported">\(initialPermission\)/);
    expect(source).toContain("const permission=permissionOverride??devicePermission;");
  });

  it("التخطيط وساعة الامتحان تبنيان أول رسم على قيم حتمية", () => {
    const planning = readFileSync(join(root, "components/planning-preferences-control.tsx"), "utf8");
    expect(planning).not.toMatch(/useState\(latest\?\.startsOn\?\?today\(\)/);
    expect(planning).toContain("useDeviceValue(today");
    const exam = readFileSync(join(root, "components/continuous-exam-session.tsx"), "utf8");
    expect(exam).not.toMatch(/useState\(\(\) => Date\.now\(\)\)/);
    expect(exam).toContain("Date.parse(session.startedAt)");
  });
});
