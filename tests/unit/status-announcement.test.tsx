import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STATUS_ANNOUNCEMENT_VERSION, StatusAnnouncement } from "@/components/status-announcement";

const requiredResultSurfaces = [
  "src/components/diagnostic-view.tsx",
  "src/components/a1-level-assessment.tsx",
  "src/components/a2-level-assessment.tsx",
  "src/components/b1-level-assessment.tsx",
  "src/components/b2-level-assessment.tsx",
  "src/components/module-review.tsx",
  "src/components/error-notebook.tsx",
  "src/components/writing-lab.tsx",
  "src/components/speaking-lab.tsx",
  "src/components/mediation-lab.tsx",
  "src/components/targeted-choice-simulation.tsx",
  "src/components/targeted-exam-simulation.tsx",
  "src/components/targeted-listening-simulation.tsx",
  "src/components/targeted-writing-simulation.tsx",
  "src/components/targeted-speaking-simulation.tsx",
  "src/components/continuous-exam-session.tsx",
] as const;

describe("P0 polite status announcement policy",()=>{
  it("uses one polite atomic live node while keeping the visible message outside it",()=>{
    render(<StatusAnnouncement message="  اكتمل الفحص   دون درجة رسمية. " channel="test"/>);
    const live=screen.getByRole("status");
    expect(live).toHaveAttribute("aria-live","polite");
    expect(live).toHaveAttribute("aria-atomic","true");
    expect(live).toHaveTextContent("اكتمل الفحص دون درجة رسمية.");
    const visual=screen.getByText("اكتمل الفحص دون درجة رسمية.",{selector:".status-announcement > span:not(.sr-only)"});
    expect(visual).toBeVisible();
    expect(visual.closest(".status-announcement")).toHaveAttribute("data-status-policy",STATUS_ANNOUNCEMENT_VERSION);
  });

  it("deduplicates unchanged rerenders and announces only a changed message",()=>{
    const view=render(<StatusAnnouncement message="المحاولة محفوظة." channel="lab"/>);
    expect(screen.getByRole("status")).toHaveAttribute("data-announcement-sequence","1");
    view.rerender(<StatusAnnouncement message="المحاولة محفوظة." channel="lab"/>);
    expect(screen.getByRole("status")).toHaveAttribute("data-announcement-sequence","1");
    view.rerender(<StatusAnnouncement message="حُفظت النسخة المنقحة." channel="lab"/>);
    expect(screen.getByRole("status")).toHaveAttribute("data-announcement-sequence","2");
    expect(screen.getByRole("status")).toHaveTextContent("حُفظت النسخة المنقحة.");
  });

  it("is adopted by every diagnostic, gate, lab, repair, and exam result surface",()=>{
    for(const file of requiredResultSurfaces){
      const source=readFileSync(file,"utf8");
      expect(source,file).toContain("StatusAnnouncement");
      expect(source,file).toMatch(/channel=/);
    }
  });

  it("keeps per-question feedback polite and atomic under the existing exercise contract",()=>{
    const source=readFileSync("src/components/exercise-card.tsx","utf8");
    expect(source).toContain('role="status" aria-live="polite" aria-atomic="true"');
  });
});
