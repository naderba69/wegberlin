import { localTestTemplateBankA1 } from "@/data/local-test-templates/a1";
import { localTestTemplateBankA2 } from "@/data/local-test-templates/a2";
import { localTestTemplateBankB1 } from "@/data/local-test-templates/b1";
import { localTestTemplateBankB2 } from "@/data/local-test-templates/b2";
import type { CEFRLevel } from "@/types/learning";
import type { LocalTestTemplateLesson } from "./local-test-generator";

/** Static imports keep every authored bank in the route's installable Offline asset graph. */
export async function loadLocalTestTemplateBank(level: CEFRLevel): Promise<readonly LocalTestTemplateLesson[]> {
  switch (level) {
    case "A1":
      return localTestTemplateBankA1;
    case "A2":
      return localTestTemplateBankA2;
    case "B1":
      return localTestTemplateBankB1;
    case "B2":
      return localTestTemplateBankB2;
  }
}
