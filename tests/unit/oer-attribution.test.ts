import { describe, expect, it } from "vitest";
import { buildOerReviewQueue, formatOerAttribution } from "@/core/oer/attribution";
import type { OerCandidate } from "@/core/oer/import-policy";

const valid: OerCandidate = {
  id: "TEST-CC-BY",
  sourceName: "Beispielquelle",
  sourceUrl: "https://example.org/quelle",
  licenseIds: ["CC-BY-4.0"],
  checkedOn: "2026-10-12",
  attribution: { authors: "Max Muster", title: "Übungstext", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" },
  shareAlikeAccepted: false,
};

describe("P2-357 قائمة مراجعة الاستيراد والإسناد", () => {
  it("السجلات المرفوضة في السجل تبقى مرفوضة بلا سطر إسناد", () => {
    // OER-02 وOER-03 صارا مؤهلين في 2026-10-17 بعد إثبات CC BY 4.0 (ADR-119)؛ انظر oer-importer.test.ts.
    const register: OerCandidate[] = [
      { ...valid, id: "OER-01", licenseIds: ["CC-BY"], shareAlikeAccepted: false },
      { ...valid, id: "OER-04", licenseIds: ["CC-BY-SA-4.0", "GFDL-1.1"], shareAlikeAccepted: false },
      { ...valid, id: "OER-05", licenseIds: ["CC-BY-NC-SA-4.0"] },
      { ...valid, id: "OER-08", licenseIds: ["CC-BY-SA-4.0"], attribution: { ...valid.attribution, authors: "" } },
    ];
    const queue = buildOerReviewQueue(register);
    expect(queue.every((entry) => entry.decision === "rejected")).toBe(true);
    expect(queue.every((entry) => entry.attributionLine === undefined)).toBe(true);
    expect(queue.find((entry) => entry.id === "OER-05")?.reasons).toContain("non-commercial-license:CC-BY-NC-SA-4.0");
  });

  it("سجل بترخيص مسموح وإسناد كامل يصبح مؤهلًا للمراجعة مع سطر إسناد", () => {
    const [entry] = buildOerReviewQueue([valid]);
    expect(entry.decision).toBe("eligible-for-import-review");
    expect(entry.attributionLine).toContain("Max Muster");
    expect(entry.attributionLine).toContain("Übungstext");
    expect(entry.attributionLine).toContain("https://creativecommons.org/licenses/by/4.0/");
    expect(entry.attributionLine).toContain("2026-10-12");
  });

  it("السجل لا يحمل أي علامة استيراد أو حالة مرخّص بها قانونيًا", () => {
    const [entry] = buildOerReviewQueue([valid]);
    expect(Object.keys(entry).sort()).toEqual(["attributionLine", "decision", "id", "reasons"]);
    expect(JSON.stringify(entry)).not.toMatch(/imported|licensed-by-lawyer|approved/);
  });

  it("ShareAlike يبقى مرفوضًا دون قبول صريح، وبعد القبول يصبح مؤهلًا للمراجعة فقط", () => {
    const sa = { ...valid, licenseIds: ["CC-BY-SA-4.0"] };
    expect(buildOerReviewQueue([sa])[0].reasons).toContain("share-alike-not-accepted");
    expect(buildOerReviewQueue([{ ...sa, shareAlikeAccepted: true }])[0].decision).toBe("eligible-for-import-review");
  });

  it("سطر الإسناد يذكر المؤلف والعنوان والمصدر والترخيص ورابطه وتاريخ الفحص", () => {
    expect(formatOerAttribution(valid)).toBe(
      "Max Muster: „Übungstext“, Beispielquelle, Lizenz CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/), geprüft am 2026-10-12",
    );
  });
});
