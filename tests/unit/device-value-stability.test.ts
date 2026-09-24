import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

// لماذا يوجد هذا الملف: في 2026-09-22 كان كل متعلّم أتمّ ٨ دروس فأكثر يرى
// «This page couldn't load. Reload to try again, or go back» على **كل** صفحات التطبيق.
// السبب: `useDeviceValue(() => Date.now(), 0)`. الدالة تُمرَّر إلى `useSyncExternalStore`، وهذا
// يستدعي `read()` بعد كل رسم ويقارن النتيجة بالمرجع؛ و`Date.now()` يعود بقيمة جديدة في كل
// استدعاء، فلا يستقر الرسم أبدًا ⇒ Maximum update depth exceeded (React #185).
// لم يظهر العطل للزائر الجديد لأن `buildDueReviewQueue` لا يُنتج مراجعات مستحقة إلا بعد تراكم
// تقدّم حقيقي، وعندها فقط يُفعَّل `ReviewReminderCoordinator` المسارَ الحسّاس.
// العلاج: `useDeviceEpoch` يثبّت اللحظة مرة واحدة بعد الترطيب.

const sourceFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
};

describe('device-value hooks must return referentially stable values', () => {
  it('never feeds a per-call changing clock into useSyncExternalStore', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      // ملفّ التعريف نفسه يذكر الشكل الخاطئ في تعليق التوثيق؛ المقصود مواضع الاستدعاء.
      if (file.endsWith(path.join('components', 'device-value.ts'))) continue;
      const text = readFileSync(file, 'utf8');
      // أي قراءة تعيد قيمة جديدة في كل استدعاء داخل useDeviceValue تُسقط التطبيق.
      const pattern = /useDeviceValue\(\s*\(\)\s*=>\s*(Date\.now\(\)|new Date\(\)|Math\.random\(\))/g;
      for (const match of text.matchAll(pattern)) {
        offenders.push(`${path.relative(ROOT, file)} → ${match[1]}`);
      }
    }
    expect(
      offenders,
      `useDeviceValue يقارن بالمرجع؛ قيمة متغيّرة هنا تعني حلقة رسم لا نهائية (React #185). استعمل useDeviceEpoch:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('ships useDeviceEpoch as the stable replacement, pinned once per mount', () => {
    const source = readFileSync(path.join(SRC, 'components/device-value.ts'), 'utf8');
    expect(source).toContain('export function useDeviceEpoch');
    // يجب أن تُلتقط اللحظة مرة واحدة على مستوى الوحدة، لا داخل الدالة.
    expect(source).toMatch(/const MOUNT_EPOCH\s*=/);
    const body = source.slice(source.indexOf('export function useDeviceEpoch'));
    expect(body).toContain('MOUNT_EPOCH');
    expect(body).not.toMatch(/=>\s*Date\.now\(\)/);
  });

  it('keeps the three known call sites on the stable hook', () => {
    for (const rel of [
      'app/review/page.tsx',
      'components/review-reminder-coordinator.tsx',
      'components/study-export-control.tsx',
    ]) {
      const text = readFileSync(path.join(SRC, rel), 'utf8');
      expect(text, `${rel} يجب أن يستعمل useDeviceEpoch`).toContain('useDeviceEpoch');
      expect(text, `${rel} ما زال يمرّر ساعة متغيّرة`).not.toMatch(/useDeviceValue\(\s*\(\)\s*=>\s*Date\.now\(\)/);
    }
  });
});
