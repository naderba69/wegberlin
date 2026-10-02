import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TunisianSupportPanel } from "@/components/tunisian-support-panel";
import { tunisianSupportForMode, tunisianSupportNotes } from "@/data/tunisian-support-registry";
import { buildTunisianSupportAudit } from "@/core/content-validation/tunisian-support";

const audit = buildTunisianSupportAudit();

describe("P0 optional Tunisian support", () => {
  it("owns 17 valid notes across A1-B2 without structural gaps", () => {
    expect(audit.ok, audit.issues.join("\n")).toBe(true);
    expect(audit).toMatchObject({ version:"tunisian-support-audit-v1",policyVersion:"tunisian-support-v1",noteCount:17,lessonCount:17,theoryReferenceCount:17,pendingReview:17,independentlyReviewed:0,byLevel:{A1:6,A2:5,B1:4,B2:2},categoryCount:15 });
  });

  it("keeps every note attached to one published theory focus", () => {
    for (const item of tunisianSupportNotes) {
      expect(item.theoryIds.length, item.id).toBeGreaterThan(0);
      expect(item.visibleFor, item.id).toEqual(["tunisian-supported"]);
      expect(item.sourceVersion, item.id).toBe("tunisian-support-v1");
    }
    expect(new Set(tunisianSupportNotes.map((item) => item.id)).size).toBe(17);
  });

  it("returns notes only for the explicitly selected Tunisian mode", () => {
    expect(tunisianSupportForMode("a1-01", "tunisian-supported")).toHaveLength(1);
    expect(tunisianSupportForMode("a1-01", "modern-standard-arabic")).toEqual([]);
    expect(tunisianSupportForMode("a1-01", "minimal-arabic")).toEqual([]);
    expect(tunisianSupportForMode("a1-03", "tunisian-supported")).toEqual([]);
  });

  it("renders the MSA bridge, Tunisian approximation, German anchor, and honest review state", () => {
    const { container } = render(createElement(TunisianSupportPanel, { lessonId:"a2-05",mode:"tunisian-supported" }));
    expect(container.querySelector('[data-tunisian-policy="tunisian-support-v1"]')).toBeTruthy();
    expect(screen.getByText("الجسر بالفصحى")).toBeTruthy();
    expect(screen.getByText("بالتونسي للتقريب")).toBeTruthy();
    expect(screen.getByText(/ما يلزمكش/)).toBeTruthy();
    expect(screen.getByText("nicht müssen ≠ nicht dürfen")).toBeTruthy();
    expect(screen.getByText("مراجعة مستقلة معلّقة")).toBeTruthy();
  });

  it("renders nothing in MSA/minimal modes or in a lesson without a registered difference", () => {
    const msa = render(createElement(TunisianSupportPanel, { lessonId:"a1-01",mode:"modern-standard-arabic" }));
    expect(msa.container.childElementCount).toBe(0);
    msa.unmount();
    const minimal = render(createElement(TunisianSupportPanel, { lessonId:"a1-01",mode:"minimal-arabic" }));
    expect(minimal.container.childElementCount).toBe(0);
    minimal.unmount();
    const unrelated = render(createElement(TunisianSupportPanel, { lessonId:"a1-03",mode:"tunisian-supported" }));
    expect(unrelated.container.childElementCount).toBe(0);
  });

  it("does not disguise authored notes as independent linguistic review", () => {
    for (const item of tunisianSupportNotes) {
      expect(item.reviewStatus, item.id).toBe("authored-review-pending");
      expect(item.reviewedBy, item.id).toBeUndefined();
      expect(item.reviewedAt, item.id).toBeUndefined();
    }
  });
});
