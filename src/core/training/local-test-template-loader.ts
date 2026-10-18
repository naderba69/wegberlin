import { academicLessonList } from "@/data/academic-lessons";
import { curriculum } from "@/data/curriculum";
import type { CEFRLevel } from "@/types/learning";
import { buildLocalTestCatalog, type LocalTestCatalog, type LocalTestTemplateLesson } from "./local-test-generator";

/**
 * ADR-123: the level banks are derived in the browser from the published lessons that this route
 * already loads statically (the curriculum-a1…b2 chunks are part of its Offline asset graph), with
 * the same fail-closed `buildLocalTestCatalog` the build-time audit uses. The generated files in
 * `src/data/local-test-templates/` stay as a reviewed, drift-checked artifact, but they are no longer
 * shipped to the client as a second copy of every Mini-Test item. No dynamic import is involved.
 */
let catalog: LocalTestCatalog | null = null;

export async function loadLocalTestTemplateBank(level: CEFRLevel): Promise<readonly LocalTestTemplateLesson[]> {
  catalog ??= buildLocalTestCatalog(academicLessonList, curriculum);
  if (!catalog.ok) throw new Error(`local test catalog failed closed: ${catalog.issues.join("; ")}`);
  return catalog.banks[level];
}
